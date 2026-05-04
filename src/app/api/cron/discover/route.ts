import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  discoverFromWebSearch,
  discoverFromBalletDirectories,
  discoverFromTicketmasterAPI,
} from "@/services/discoveryService";

export const dynamic = "force-dynamic";

/**
 * Updated Protected Discovery Route
 * Orchestrates URL gathering from Search, Directories, and Ticketmaster API.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = { discovered: 0, queued: 0, errors: 0 };

  try {
    // Call all 3 discovery sources in parallel
    const [webUrls, dirUrls, tmUrls] = await Promise.all([
      discoverFromWebSearch(),
      discoverFromBalletDirectories(),
      discoverFromTicketmasterAPI(),
    ]);

    // Merge and deduplicate all discovered candidate URLs
    const allUrls = Array.from(
      new Set([...webUrls, ...dirUrls, ...tmUrls]),
    ).slice(0, 50);
    stats.discovered = allUrls.length;

    if (allUrls.length > 0) {
      // Batch upsert to the discovery queue while preserving existing 'attempted' status
      const { data, error } = await supabase
        .from("discovery_queue")
        .upsert(
          allUrls.map((url) => ({
            url,
            source: "cron_discovery_v7_merged",
            attempted: false,
          })),
          { onConflict: "url", ignoreDuplicates: true },
        )
        .select("url");

      if (error) throw error;
      stats.queued = data?.length || 0;
    }

    return NextResponse.json({
      status: "discovery_complete",
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Discovery cron failed", details: error.message },
      { status: 500 },
    );
  }
}
