import { NextResponse } from "next/server";
import {
  discoverFromTicketmasterWeb,
  validateTicketmasterEvent,
  addDiscoveredEvent,
  discoverFromTicketmasterAPI,
} from "@/services/discoveryService";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const stats = {
    tm_api_added: 0,
    tm_web_discovered: 0,
    tm_web_processed: 0,
    tm_web_added: 0,
    errors: 0,
  };

  try {
    // 1. Optional API Discovery
    stats.tm_api_added = await discoverFromTicketmasterAPI();

    // 2. Requirement 1: Limit Route Work
    // Discover many, but process a small batch to stay under maxDuration
    const webUrls = await discoverFromTicketmasterWeb();
    stats.tm_web_discovered = webUrls.length;

    // Only process the first 15 URLs per run for safety on Vercel
    const batchToProcess = webUrls.slice(0, 15);

    for (const url of batchToProcess) {
      stats.tm_web_processed++;

      const validation = await validateTicketmasterEvent(url);

      if (validation.valid && validation.metadata) {
        const res = await addDiscoveredEvent(validation.metadata);
        if (res.added) {
          stats.tm_web_added++;
        } else {
          stats.errors++;
        }
      }

      // Minimal sleep to respect Ticketmaster rate limits
      await new Promise((r) => setTimeout(r, 1200));
    }

    return NextResponse.json({
      status: "completed",
      stats,
      message: `Processed ${stats.tm_web_processed} of ${stats.tm_web_discovered} discovered URLs.`,
    });
  } catch (error: any) {
    console.error("[api/discover/run] Critical error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
