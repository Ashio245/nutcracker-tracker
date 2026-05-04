import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  discoverFromTicketmasterWeb,
  discoverFromWebSearch,
  discoverFromBalletDirectories,
} from "@/services/discoveryService";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * PRODUCER ROUTE (SAFETY PATCHED):
 * - Discovers URLs from various sources.
 * - Inserts only NEW URLs into the discovery_queue.
 * - Prevents reprocessing by ignoring existing rows.
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
    // 1. Trigger multi-source discovery (Searching only)
    const [tmUrls, webUrls, dirUrls] = await Promise.all([
      discoverFromTicketmasterWeb(),
      discoverFromWebSearch(),
      discoverFromBalletDirectories(),
    ]);

    // 2. Consolidate and deduplicate discovery set
    const allUrls = Array.from(new Set([...tmUrls, ...webUrls, ...dirUrls]));
    stats.discovered = allUrls.length;

    // 3. Safety-First Insertion
    // We use ignoreDuplicates: true to ensure we never reset 'attempted' status
    // for URLs that have already been processed by the consumer route.
    for (const url of allUrls) {
      const { error } = await supabase
        .from("discovery_queue")
        .insert({
          url,
          source: "cron_discovery_v5",
          attempted: false,
        })
        .select()
        .single();

      // Note: If the row already exists, Supabase will return a 409 or simply no data
      // depending on the client config, which we treat as 'not newly queued'.
      if (error && error.code !== "23505") {
        // Ignore unique constraint violations
        stats.errors++;
      } else if (!error) {
        stats.queued++;
      }
    }

    return NextResponse.json({
      status: "discovery_complete",
      timestamp: new Date().toISOString(),
      stats,
      message: `Safety patch applied: ignored duplicates to prevent reprocessing loops.`,
    });
  } catch (error: any) {
    console.error("[cron/discover] Logic Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
