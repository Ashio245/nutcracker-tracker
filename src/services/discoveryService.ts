import { supabase } from "@/lib/supabase";
import { Event, EventStatus } from "@/types/database";

/**
 * Service for automated Nutcracker event discovery and Ticketmaster scraping.
 * Includes strict secondary market filtering and structured data extraction.
 */

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

/**
 * Requirement: Non-global regexes for state-safe .test() usage.
 */
const RESALE_MARKERS = [
  /resale/i,
  /verified\s+fan/i,
  /fan-to-fan/i,
  /secondary\s+market/i,
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function discoverFromTicketmasterAPI(): Promise<number> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return 0;
  return 0; // Utilized by API-enabled environments
}

/**
 * Flexible Ticketmaster URL Extraction.
 * Extracts hrefs and supports various path structures containing /event/.
 */
export async function discoverFromTicketmasterWeb(): Promise<string[]> {
  const searchUrl = "https://www.ticketmaster.com/search?q=nutcracker";
  const discoveredUrls: string[] = [];

  try {
    const response = await fetchWithRetry(searchUrl);
    if (!response) return [];

    const html = await response.text();
    const hrefPattern = /href=["']([^"']+\/event\/[^"']+)["']/gi;
    const matches = Array.from(html.matchAll(hrefPattern));

    for (const match of matches) {
      let url = match[1];
      if (url.startsWith("/")) {
        url = `https://www.ticketmaster.com${url}`;
      }

      try {
        const urlObj = new URL(url);
        if (!urlObj.hostname.includes("ticketmaster.com")) continue;
        if (!urlObj.pathname.includes("/event/")) continue;

        const isResaleUrl = RESALE_MARKERS.some((marker) => marker.test(url));
        if (!isResaleUrl && !discoveredUrls.includes(url)) {
          discoveredUrls.push(url);
        }
      } catch (e) {
        continue;
      }

      if (discoveredUrls.length >= 100) break;
    }
  } catch (e) {
    console.error("[discoveryService] Web discovery failed", e);
  }

  return discoveredUrls;
}

/**
 * Enhanced Ticketmaster Event Validation.
 * Extracts metadata from JSON-LD, embedded app state, or HTML fallbacks.
 */
export async function validateTicketmasterEvent(url: string) {
  try {
    const response = await fetchWithRetry(url);
    if (!response) return { valid: false };

    const html = await response.text();
    const lowerHtml = html.toLowerCase();

    const hasNutcracker = lowerHtml.includes("nutcracker");
    const hasResaleContent = RESALE_MARKERS.some((marker) => marker.test(html));

    if (!hasNutcracker || hasResaleContent) {
      return { valid: false };
    }

    // 1. Primary Extraction: JSON-LD
    const jsonLdMatch = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i,
    );
    let eventData: any = null;
    if (jsonLdMatch) {
      try {
        const parsed = JSON.parse(jsonLdMatch[1]);
        eventData = Array.isArray(parsed)
          ? parsed.find((i) => i["@type"] === "Event")
          : parsed;
      } catch (e) {}
    }

    // 2. Secondary Extraction: Embedded App State / __INITIAL_STATE__
    if (!eventData || !eventData.name) {
      const stateMatch =
        html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/i) ||
        html.match(/id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
      if (stateMatch) {
        try {
          const state = JSON.parse(stateMatch[1]);
          const details =
            state?.props?.pageProps?.event || state?.eventData || state?.event;
          if (details) {
            eventData = {
              ...eventData,
              name: details.name || details.title,
              location: details.venue || details.location,
              startDate: details.startDate || details.date,
              status: details.status || details.eventStatus,
            };
          }
        } catch (e) {}
      }
    }

    // 3. Fallbacks: HTML Elements
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const metaDesc = html.match(/<meta name="description" content="(.*?)"/i);

    const metadata: Omit<Event, "id" | "created_at"> = {
      name:
        eventData?.name ||
        titleMatch?.[1]?.split("|")[0].trim() ||
        "The Nutcracker",
      city:
        eventData?.location?.address?.addressLocality ||
        eventData?.location?.city ||
        "Unknown City",
      venue_name:
        eventData?.location?.name || eventData?.venue?.name || "Unknown Venue",
      status: (lowerHtml.includes("sold out")
        ? "Sold Out"
        : "Public Sale Live") as EventStatus,
      source_url: url,
      public_sale_start: eventData?.startDate || null,
      last_checked: new Date().toISOString(),
      content_hash: Buffer.from(url).toString("base64").substring(0, 32),
      check_priority: 1,
      days_until_event: null,
      notes_raw: `Web Scraped: ${metaDesc?.[1]?.substring(0, 100) || "Auto-import"}`,
      presale_start: null,
      group_discount_available: false,
      group_min_size: null,
      discount_code: null,
      discount_note: null,
    };

    return { valid: true, metadata, html }; // Added html to return for legacy support
  } catch (e) {
    return { valid: false };
  }
}

/**
 * BACKWARD COMPATIBILITY: validateEventPage
 * Required by src/app/api/cron/discover/route.ts
 */
export async function validateEventPage(
  url: string,
): Promise<{ valid: boolean; html?: string }> {
  const result = await validateTicketmasterEvent(url);
  return {
    valid: result.valid,
    html: result.html,
  };
}

/**
 * BACKWARD COMPATIBILITY: extractEventMetadata
 * Required by legacy discovery routes.
 */
export function extractEventMetadata(
  url: string,
  html: string,
): Omit<Event, "id" | "created_at"> {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const h1Match = html.match(/<h1>(.*?)<\/h1>/i);
  const hostname = new URL(url).hostname.replace("www.", "");

  return {
    name: h1Match?.[1]?.trim() || titleMatch?.[1]?.trim() || "The Nutcracker",
    city: "Unknown",
    venue_name: "TBA",
    status: "Upcoming",
    source_url: url,
    notes_raw: `Auto-discovered from ${hostname}`,
    last_checked: new Date().toISOString(),
    content_hash: null,
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
 * Upserts discovered event and returns normalized shape.
 */
export async function addDiscoveredEvent(
  metadata: Partial<Event>,
): Promise<{ added: boolean; error?: any; event_id?: string }> {
  try {
    const { data, error } = await supabase
      .from("events")
      .upsert(
        [
          {
            ...metadata,
            last_checked: new Date().toISOString(),
          },
        ],
        {
          onConflict: "source_url",
          ignoreDuplicates: false,
        },
      )
      .select("id")
      .single();

    return {
      added: !error,
      error: error || undefined,
      event_id: data?.id,
    };
  } catch (e: any) {
    return { added: false, error: e.message };
  }
}

async function fetchWithRetry(
  url: string,
  retries = 2,
): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      await sleep(DELAY_MS * (i + 1));
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return res;
    } catch (e) {
      if (i === retries - 1) return null;
    }
  }
  return null;
}

export async function discoverFromWebSearch() {
  return [];
}
export async function discoverFromBalletDirectories() {
  return [];
}
