import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  discoverFromWebSearch,
  discoverFromBalletDirectories,
} from "@/services/discoveryService";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * AGGRESSIVE TIMEOUT PATCH (V6):
 * - Temporarily disabled slow Ticketmaster scraping.
 * - Limited discovery to 20 URLs total.
 * - Uses a single batch insert to minimize DB round-trips.
 * - Safely ignores duplicates to avoid resetting 'attempted' status.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stats = {
    discovered: 0,
    queued: 0,
    errors: 0,
  };

  try {
    // 1. Trigger only fast discovery sources
    const [webUrls, dirUrls] = await Promise.all([
      discoverFromWebSearch(),
      discoverFromBalletDirectories(),
    ]);

    // 2. Consolidate and cap at 20 URLs for maximum safety
    const allUrls = Array.from(new Set([...webUrls, ...dirUrls])).slice(0, 20);
    stats.discovered = allUrls.length;

    if (allUrls.length > 0) {
      // 3. Single Batch Upsert with duplicate ignore
      // This is significantly faster than looping for individual inserts
      const { data, error } = await supabase
        .from("discovery_queue")
        .upsert(
          allUrls.map((url) => ({
            url,
            source: "cron_discovery_v6_fast",
            attempted: false,
          })),
          {
            onConflict: "url",
            ignoreDuplicates: true, // Critical: preserve 'attempted' state of existing rows
          },
        )
        .select("url");

      if (error) {
        stats.errors = allUrls.length;
        throw error;
      }

      stats.queued = data?.length || 0;
    }

    return NextResponse.json({
      status: "discovery_fast_complete",
      timestamp: new Date().toISOString(),
      stats,
      message:
        "Batch processing enabled; slow sources bypassed for performance.",
    });
  } catch (error: any) {
    console.error("[cron/discover] Fast Producer Error:", error.message);
    return NextResponse.json({ error: error.message, stats }, { status: 500 });
  }
}
