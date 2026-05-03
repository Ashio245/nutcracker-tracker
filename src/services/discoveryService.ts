import { supabase } from "@/lib/supabase";
import { Event } from "@/types/database";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
const DELAY_MS = 1000;

const FALLBACK_COMPANIES = [
  "nycballet.com",
  "bostonballet.org",
  "pnb.org",
  "washingtonballet.org",
  "atlantaballet.com",
  "houstonballet.org",
  "joffrey.org",
  "coloradoballet.org",
  "miamicityballet.org",
  "balletaz.org",
  "balletwest.org",
  "pittsburghballet.org",
  "balletmemphis.org",
  "kcballet.org",
  "oregonballet.org",
  "balletmet.org",
  "richmondballet.com",
  "balletcharlotte.org",
  "ballet-oklahoma.org",
  "sarasotaballet.org",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * PHASE 1: DISCOVERY ENGINE
 */
export async function discoverFromWebSearch(): Promise<string[]> {
  const queries = [
    "Nutcracker+ballet+tickets+2026",
    "Nutcracker+performance+December+2026",
  ];
  const urls: string[] = [];

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://html.duckduckgo.com/html/?q=${query}`,
        {
          headers: { "User-Agent": USER_AGENT },
        },
      );
      const html = await response.text();

      const standardMatches = html.matchAll(
        /<a\s+[^>]*class="result__a"\s+[^>]*href="([^"]+)"/gi,
      );
      const testIdMatches = html.matchAll(
        /<a\s+[^>]*data-testid="result-title-a"\s+[^>]*href="([^"]+)"/gi,
      );
      const genericMatches = html.matchAll(
        /<a\s+[^+]*href="(https?:\/\/[^"]+)"/gi,
      );

      const allMatches = [
        ...Array.from(standardMatches),
        ...Array.from(testIdMatches),
        ...Array.from(genericMatches),
      ];

      for (const match of allMatches) {
        const url = match[1];
        if (isValidDomain(url)) urls.push(url);
        if (urls.length >= 100) break;
      }

      await sleep(DELAY_MS);
    } catch (e) {
      console.error(`DuckDuckGo discovery failed for ${query}`, e);
    }
  }
  return Array.from(new Set(urls)).slice(0, 100);
}

function isValidDomain(url: string): boolean {
  try {
    const d = new URL(url).hostname.toLowerCase();
    const excluded = [
      "ticketmaster.",
      "stubhub.",
      "viagogo.",
      "google.",
      "duckduckgo.",
      "facebook.",
      "instagram.",
      "twitter.",
      "youtube.",
    ];
    return (
      !excluded.some((ex) => d.includes(ex)) &&
      (d.endsWith(".org") ||
        d.endsWith(".com") ||
        d.endsWith(".edu") ||
        d.endsWith(".gov"))
    );
  } catch {
    return false;
  }
}

export async function discoverFromBalletDirectories(): Promise<string[]> {
  const urls: string[] = [];
  const basePatterns = [
    "/nutcracker",
    "/productions/nutcracker",
    "/season/nutcracker",
    "/performances/nutcracker",
  ];
  let companies: string[] = [];

  try {
    const response = await fetch("https://danceusa.org/member-directory", {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(4000),
    });
    const html = await response.text();
    const domainMatches = html.matchAll(
      /https?:\/\/(www\.)?([a-zA-Z0-9-]+\.(org|com))/g,
    );

    companies = Array.from(
      new Set(Array.from(domainMatches).map((m) => `https://${m[2]}`)),
    ).slice(0, 30);
  } catch (e) {
    companies = FALLBACK_COMPANIES.map((c) => `https://${c}`);
  }

  for (const company of companies) {
    basePatterns.forEach((pattern) => urls.push(`${company}${pattern}`));
  }
  return urls;
}

/**
 * PHASE 2: VALIDATION & STORAGE
 */
export async function validateEventPage(url: string) {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });
    if (response.status !== 200) return { valid: false };

    const html = await response.text();
    const keywords = ["Nutcracker", "Tchaikovsky", "Clara", "Sugar Plum"];
    const content = html.toLowerCase();
    const matches = keywords.filter((k) => content.includes(k.toLowerCase()));

    return {
      valid: matches.length >= 1,
      confidence: (matches.length / keywords.length) * 100,
      html,
    };
  } catch {
    return { valid: false };
  }
}

/**
 * Extracts metadata from a validated HTML page.
 * Fulfills all required Event properties.
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

export async function addDiscoveredEvent(metadata: Partial<Event>) {
  try {
    const { data, error } = await supabase
      .from("events")
      .upsert(
        [
          {
            ...metadata,
            last_checked: new Date().toISOString(),
            check_priority: 1,
          },
        ],
        {
          onConflict: "source_url",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    return { added: !error, error, event_id: data?.id };
  } catch (e: any) {
    return { added: false, error: e.message };
  }
}
