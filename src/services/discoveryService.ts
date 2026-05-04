import { supabase } from "@/lib/supabase";
import { Event, EventStatus } from "@/types/database";

/**
 * Service for Nutcracker event discovery.
 * Refactored for "Pure Discovery" to prevent Vercel timeouts.
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

const RESALE_MARKERS = [
  /resale/i,
  /verified\s+fan/i,
  /fan-to-fan/i,
  /secondary\s+market/i,
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * PURE DISCOVERY: Web Search
 * Returns candidate URLs from DuckDuckGo without fetching or validating them.
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

    // Extract result links only
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
 * Generates candidate URLs based on known company domains.
 */
export async function discoverFromBalletDirectories(): Promise<string[]> {
  const urls: string[] = [];
  const basePatterns = [
    "/nutcracker",
    "/productions/nutcracker",
    "/performances/nutcracker",
  ];

  // Example primary domains (In production, these could be fetched from a static list)
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
 * PURE DISCOVERY: Ticketmaster Web
 * Scrapes search results for URLs only. No page-level validation here.
 */
export async function discoverFromTicketmasterWeb(): Promise<string[]> {
  const searchUrl = "https://www.ticketmaster.com/search?q=nutcracker";
  const discoveredUrls: string[] = [];

  try {
    const response = await fetch(searchUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];

    const html = await response.text();
    const hrefPattern = /href=["']([^"']+\/event\/[^"']+)["']/gi;
    const matches = Array.from(html.matchAll(hrefPattern));

    for (const match of matches) {
      let url = match[1];
      if (url.startsWith("/")) url = `https://www.ticketmaster.com${url}`;

      const isResaleUrl = RESALE_MARKERS.some((marker) => marker.test(url));
      if (!isResaleUrl && !discoveredUrls.includes(url)) {
        discoveredUrls.push(url);
      }
    }
  } catch (e) {
    console.error("[discoveryService] TM search discovery failed", e);
  }

  return discoveredUrls.slice(0, 50);
}

/**
 * VALIDATION: Ticketmaster Event
 * Performed only in the process-discovery route.
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
 * METADATA EXTRACTION
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
 * DB PERSISTENCE
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

// Minimal placeholder for legacy route compatibility
export async function validateEventPage(url: string) {
  const res = await validateTicketmasterEvent(url);
  return { valid: res.valid, html: res.html };
}
