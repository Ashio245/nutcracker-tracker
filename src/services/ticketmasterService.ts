import { Event, EventStatus } from "@/types/database";

/**
 * Ticketmaster Discovery API integration.
 * Fetches Nutcracker events with full sale status, presale, and group info.
 */

const SECONDARY_MARKET_DENYLIST = [
  "stubhub.com",
  "vividseats.com",
  "seatgeek.com",
  "tickets-center.com",
  "ticketsonsale.com",
  "viagogo.com",
  "ticketnetwork.com",
  "hellotickets.com",
];

const RESALE_MARKERS = [
  /resale/i,
  /verified\s+fan/i,
  /fan-to-fan/i,
  /secondary\s+market/i,
];

interface TicketmasterSaleInfo {
  public?: { startDateTime?: string; endDateTime?: string };
  presales?: Array<{
    name?: string;
    startDateTime?: string;
    endDateTime?: string;
    description?: string;
  }>;
}

interface TicketmasterEvent {
  id: string;
  name: string;
  url?: string;
  dates?: {
    start?: { localDate?: string; dateTime?: string };
    status?: { code?: string };
  };
  sales?: TicketmasterSaleInfo;
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?: { name?: string };
      state?: { name?: string; stateCode?: string };
    }>;
  };
  info?: string;
  pleaseNote?: string;
  promoter?: { name?: string };
  priceRanges?: Array<{ min?: number; max?: number; currency?: string }>;
  accessibility?: { info?: string };
}

/**
 * Determines the sale status from Ticketmaster event data.
 */
function determineSaleStatus(tmEvent: TicketmasterEvent): EventStatus {
  const statusCode = tmEvent.dates?.status?.code?.toLowerCase();

  if (statusCode === "cancelled" || statusCode === "postponed") {
    return "Sold Out";
  }

  // Check if public sale is live
  const publicSaleStart = tmEvent.sales?.public?.startDateTime;
  const publicSaleEnd = tmEvent.sales?.public?.endDateTime;
  const now = new Date();

  if (publicSaleStart) {
    const saleStartDate = new Date(publicSaleStart);
    const saleEndDate = publicSaleEnd ? new Date(publicSaleEnd) : null;

    if (saleEndDate && now > saleEndDate) {
      return "Sold Out";
    }

    if (now >= saleStartDate) {
      return "Public Sale Live";
    }
  }

  // Check if any presale is active
  const presales = tmEvent.sales?.presales || [];
  for (const presale of presales) {
    if (presale.startDateTime) {
      const presaleStart = new Date(presale.startDateTime);
      const presaleEnd = presale.endDateTime
        ? new Date(presale.endDateTime)
        : null;

      if (now >= presaleStart && (!presaleEnd || now <= presaleEnd)) {
        return "Presale Live";
      }
    }
  }

  // Check if any presale is upcoming
  for (const presale of presales) {
    if (presale.startDateTime) {
      const presaleStart = new Date(presale.startDateTime);
      if (now < presaleStart) {
        return "On Sale Soon";
      }
    }
  }

  if (statusCode === "onsale") {
    return "Public Sale Live";
  }
  if (statusCode === "offsale") {
    return "Sold Out";
  }

  return "Upcoming";
}

/**
 * Detects group sales from Ticketmaster event data.
 */
function detectGroupSales(tmEvent: TicketmasterEvent): {
  group_discount_available: boolean;
  group_min_size: number | null;
  discount_note: string | null;
} {
  const info = (tmEvent.info || "").toLowerCase();
  const pleaseNote = (tmEvent.pleaseNote || "").toLowerCase();
  const combined = `${info} ${pleaseNote}`;

  const groupKeywords = [
    "group",
    "groups",
    "group rate",
    "group discount",
    "group sales",
    "group tickets",
    "10 or more",
    "15 or more",
    "20 or more",
  ];

  const hasGroup = groupKeywords.some((kw) => combined.includes(kw));

  // Try to extract minimum group size
  let groupMin: number | null = null;
  const sizeMatch = combined.match(
    /(\d+)\s*(?:or more|(?:\+)|(?:tickets?\s*(?:or\s*more|minimum)))/i
  );
  if (sizeMatch) {
    groupMin = parseInt(sizeMatch[1], 10);
  }

  // Extract group-related notes
  let discountNote: string | null = null;
  if (hasGroup) {
    // Get the original casing text
    const fullText = `${tmEvent.info || ""} ${tmEvent.pleaseNote || ""}`;
    const sentences = fullText.split(/[.!?]+/);
    const groupSentences = sentences.filter((s) =>
      groupKeywords.some((kw) => s.toLowerCase().includes(kw))
    );
    if (groupSentences.length > 0) {
      discountNote = groupSentences.map((s) => s.trim()).join(". ");
    }
  }

  return {
    group_discount_available: hasGroup,
    group_min_size: groupMin,
    discount_note: discountNote,
  };
}

/**
 * Returns null for nonsense placeholder dates (1900, 9999, etc).
 */
function sanitizeDate(d: string | null | undefined): string | null {
  if (!d) return null;
  const yr = new Date(d).getFullYear();
  if (yr < 2024 || yr > 2030) return null;
  return d;
}

/**
 * Transforms a single Ticketmaster API event into our Event schema.
 */
export function transformTicketmasterEvent(
  tmEvent: TicketmasterEvent
): Omit<Event, "id" | "created_at"> | null {
  const url = tmEvent.url;
  if (!url) return null;

  // Filter out resale/secondary
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (SECONDARY_MARKET_DENYLIST.some((d) => hostname.includes(d)))
      return null;
    if (RESALE_MARKERS.some((m) => m.test(url))) return null;
    // Filter out redirect domains that aren't actual ticketmaster
    if (hostname.includes("gofevo.com")) return null;
  } catch {
    return null;
  }

  // Skip events with no venue data (produces "TBA"/"Unknown" entries)
  const venue = tmEvent._embedded?.venues?.[0];
  if (!venue?.name && !venue?.city?.name) return null;
  const city = venue?.city?.name || null;
  const stateCode = venue?.state?.stateCode;
  const cityDisplay = city && stateCode ? `${city}, ${stateCode}` : city;

  const status = determineSaleStatus(tmEvent);
  const groupInfo = detectGroupSales(tmEvent);

  // Get presale info
  const presales = tmEvent.sales?.presales || [];
  const earliestPresale = presales
    .filter((p) => p.startDateTime)
    .sort(
      (a, b) =>
        new Date(a.startDateTime!).getTime() -
        new Date(b.startDateTime!).getTime()
    )[0];

  // Calculate days until event
  let daysUntil: number | null = null;
  const eventDate =
    tmEvent.dates?.start?.dateTime || tmEvent.dates?.start?.localDate;
  if (eventDate) {
    const diff = new Date(eventDate).getTime() - Date.now();
    daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // Build notes from available info
  const notes: string[] = [];
  if (tmEvent.info) notes.push(tmEvent.info);
  if (tmEvent.pleaseNote) notes.push(`Note: ${tmEvent.pleaseNote}`);
  if (presales.length > 0) {
    const presaleNames = presales
      .map((p) => p.name || "Presale")
      .filter(Boolean);
    if (presaleNames.length > 0) {
      notes.push(`Presales: ${presaleNames.join(", ")}`);
    }
  }

  return {
    name: tmEvent.name || "The Nutcracker",
    city: cityDisplay,
    venue_name: venue?.name || "TBA",
    status,
    source_url: url,
    presale_start: sanitizeDate(earliestPresale?.startDateTime),
    public_sale_start: sanitizeDate(tmEvent.sales?.public?.startDateTime),
    group_discount_available: groupInfo.group_discount_available,
    group_min_size: groupInfo.group_min_size,
    discount_code: null, // Ticketmaster API doesn't expose presale codes
    discount_note: groupInfo.discount_note,
    notes_raw: notes.length > 0 ? notes.join(" | ") : null,
    last_checked: new Date().toISOString(),
    content_hash: tmEvent.id,
    days_until_event: daysUntil,
    check_priority: status === "Public Sale Live" || status === "Presale Live" ? 5 : 1,
  };
}

/**
 * Fetches all Nutcracker events from the Ticketmaster Discovery API
 * with full sale status, presale, and group data.
 */
export async function fetchTicketmasterNutcrackerEvents(): Promise<
  Omit<Event, "id" | "created_at">[]
> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    console.error("[ticketmasterService] Missing TICKETMASTER_API_KEY");
    return [];
  }

  const allEvents: Omit<Event, "id" | "created_at">[] = [];
  let page = 0;
  const pageSize = 50;
  let totalPages = 1;

  try {
    while (page < totalPages && page < 5) {
      // Max 5 pages = 250 events
      const params = new URLSearchParams({
        keyword: "nutcracker",
        size: String(pageSize),
        page: String(page),
        sort: "date,asc",
        startDateTime: new Date().toISOString().replace(/\.\d{3}Z/, "Z"),
        apikey: apiKey,
      });

      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
        { signal: AbortSignal.timeout(15000) }
      );

      if (!response.ok) {
        console.error(
          `[ticketmasterService] API responded ${response.status}`
        );
        break;
      }

      const data: any = await response.json();
      const tmEvents: TicketmasterEvent[] =
        data?._embedded?.events || [];

      if (tmEvents.length === 0) break;

      totalPages = data?.page?.totalPages || 1;

      for (const tmEvent of tmEvents) {
        const transformed = transformTicketmasterEvent(tmEvent);
        if (transformed) {
          allEvents.push(transformed);
        }
      }

      page++;

      // Throttle: wait 250ms between pages to respect rate limits
      if (page < totalPages) {
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    console.log(
      `[ticketmasterService] Fetched ${allEvents.length} events from ${page} page(s)`
    );
    return allEvents;
  } catch (e: any) {
    console.error("[ticketmasterService] Fetch failed:", e.message);
    return allEvents; // Return whatever we got so far
  }
}
