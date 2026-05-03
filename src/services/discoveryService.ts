import { Event } from "@/types/database";

/**
 * STUB: Performs web search discovery.
 * Returns an empty array to satisfy build requirements.
 */
export async function discoverFromWebSearch(): Promise<string[]> {
  console.log("[discoveryService] Stub: discoverFromWebSearch called.");
  return [];
}

/**
 * STUB: Scrapes ballet company directories.
 * Returns an empty array to satisfy build requirements.
 */
export async function discoverFromBalletDirectories(): Promise<string[]> {
  console.log("[discoveryService] Stub: discoverFromBalletDirectories called.");
  return [];
}

/**
 * STUB: Validates if a URL contains Nutcracker event data.
 */
export async function validateEventPage(url: string) {
  console.log(`[discoveryService] Stub: validating ${url}`);
  return {
    valid: false,
    confidence: 0,
    html: "",
  };
}

/**
 * STUB: Extracts metadata from a validated HTML page.
 */
export function extractEventMetadata(
  url: string,
  html: string,
): Partial<Event> {
  console.log(`[discoveryService] Stub: extracting metadata from ${url}`);
  return {
    source_url: url,
  };
}

/**
 * STUB: Upserts a discovered event into the database.
 */
export async function addDiscoveredEvent(metadata: Partial<Event>) {
  console.log("[discoveryService] Stub: addDiscoveredEvent called.");
  return {
    added: false,
    error: "Service not yet fully implemented",
  };
}
