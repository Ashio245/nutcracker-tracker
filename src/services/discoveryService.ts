import { supabase } from "@/lib/supabase";
import { Event, EventStatus } from "@/types/database";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";
const DELAY_MS = 1500;

const SECONDARY_MARKET_DENYLIST = [
  "stubhub.com",
  "vividseats.com",
  "seatgeek.com",
  "tickets-center.com",
  "ticketsonsale.com",
  "viagogo.com",
  "axs.com/resale",
  "ticketnetwork.com",
  "hellotickets.com",
];

const RESALE_MARKERS = [
  /resale/i,
  /verified\s+fan/i,
  /fan-to-fan/i,
  /secondary\s+market/i,
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * PURE DISCOVERY: Web Search
 * Returns candidate URLs from DuckDuckGo search results.
 */
export async function discoverFromWebSearch(): Promise<string[]> {
  const filterString = SECONDARY_MARKET_DENYLIST.map(
    (site) => `-site:${site}`,
  ).join("+");
  const query = `Nutcracker+ballet+tickets+2026+${filterString}`;
  const discoveredUrls: string[] = [];

  try {
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${query}`,
      {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) return [];
    const html = await response.text();
    const genericMatches = html.matchAll(
      /<a\s+[^>]*href="(https?:\/\/[^"]+)"/gi,
    );

    for (const match of Array.from(genericMatches)) {
      const url = match[1];
      if (isValidDiscoveryCandidate(url)) {
        discoveredUrls.push(url);
      }
    }
  } catch (e) {
    console.error("[discoveryService] Web discovery search failed", e);
  }

  return discoveredUrls.slice(0, 50);
}

/**
 * PURE DISCOVERY: Ballet Directories
 * Generates candidate URLs based on official company domains.
 */
export async function discoverFromBalletDirectories(): Promise<string[]> {
  const urls: string[] = [];
  const basePatterns = [
    "/nutcracker",
    "/productions/nutcracker",
    "/performances/nutcracker",
  ];
  const companies = [
    "https://www.nycballet.com",
    "https://www.pnb.org",
    "https://www.sfballet.org",
    "https://www.bostonballet.org",
  ];

  for (const company of companies) {
    basePatterns.forEach((pattern) => urls.push(`${company}${pattern}`));
  }

  return urls;
}

/**
 * PURE DISCOVERY: Ticketmaster Discovery API
 * Replaces the previous HTML scraping function with a structured API call.
 */
export async function discoverFromTicketmasterAPI(): Promise<string[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?keyword=nutcracker&classificationName=Ballet&size=50&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) },
    );

    if (!response.ok) return [];

    const data: any = await response.json();
    const events = Array.isArray(data?._embedded?.events)
      ? data._embedded.events
      : [];

    const discoveredUrls: string[] = events
      .map((event: any) => event?.url)
      .filter((url: unknown): url is string => {
        if (typeof url !== "string" || !url) return false;
        const isResale = RESALE_MARKERS.some((marker) => marker.test(url));
        return !isResale;
      });

    return Array.from(new Set<string>(discoveredUrls)).slice(0, 50);
  } catch (e: any) {
    console.error(
      "[discoveryService] Ticketmaster API discovery failed:",
      e.message,
    );
    return [];
  }
}

/**
 * VALIDATION: Page-level analysis and metadata extraction.
 */
export async function validateTicketmasterEvent(url: string) {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { valid: false };

    const html = await response.text();
    const lowerHtml = html.toLowerCase();

    if (
      !lowerHtml.includes("nutcracker") ||
      RESALE_MARKERS.some((m) => m.test(html))
    ) {
      return { valid: false };
    }

    const metadata = extractEventMetadata(url, html);
    return { valid: true, metadata, html };
  } catch (e) {
    return { valid: false };
  }
}

/**
 * METADATA EXTRACTION: Normalizes raw HTML into database schema.
 */
export function extractEventMetadata(
  url: string,
  html: string,
): Omit<Event, "id" | "created_at"> {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const hostname = new URL(url).hostname.replace("www.", "");

  return {
    name: titleMatch?.[1]?.split("|")[0].trim() || "The Nutcracker",
    city: "Unknown",
    venue_name: "TBA",
    status: (html.toLowerCase().includes("sold out")
      ? "Sold Out"
      : "Public Sale Live") as EventStatus,
    source_url: url,
    notes_raw: `Auto-discovered from ${hostname}`,
    last_checked: new Date().toISOString(),
    content_hash: Buffer.from(url).toString("base64").substring(0, 16),
    days_until_event: null,
    check_priority: 1,
    presale_start: null,
    public_sale_start: null,
    group_discount_available: false,
    group_min_size: null,
    discount_code: null,
    discount_note: null,
  };
}

/**
 * PERSISTENCE: Upserts normalized event to Supabase.
 */
export async function addDiscoveredEvent(
  metadata: Partial<Event>,
): Promise<{ added: boolean; error?: any; event_id?: string }> {
  try {
    const { data, error } = await supabase
      .from("events")
      .upsert([{ ...metadata, last_checked: new Date().toISOString() }], {
        onConflict: "source_url",
      })
      .select("id")
      .single();

    return { added: !error, error, event_id: data?.id };
  } catch (e: any) {
    return { added: false, error: e.message };
  }
}

function isValidDiscoveryCandidate(url: string): boolean {
  try {
    const d = new URL(url).hostname.toLowerCase();
    if (SECONDARY_MARKET_DENYLIST.some((site) => d.includes(site)))
      return false;
    return d.endsWith(".org") || d.endsWith(".com") || d.endsWith(".edu");
  } catch {
    return false;
  }
}

export async function validateEventPage(url: string) {
  const res = await validateTicketmasterEvent(url);
  return { valid: res.valid, html: res.html };
}
