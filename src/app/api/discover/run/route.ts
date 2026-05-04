import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  discoverFromTicketmasterWeb,
  discoverFromWebSearch,
  discoverFromBalletDirectories,
} from "@/services/discoveryService";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max for Vercel Paid Tier

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
    // 1. Multi-source Discovery
    const tmUrls = await discoverFromTicketmasterWeb();
    const webUrls = await discoverFromWebSearch();
    const dirUrls = await discoverFromBalletDirectories();

    const allUrls = Array.from(new Set([...tmUrls, ...webUrls, ...dirUrls]));
    stats.discovered = allUrls.length;

    // 2. Fast Queue Insertion
    for (const url of allUrls) {
      const { error } = await supabase
        .from("discovery_queue")
        .upsert({ url, source: "cron_discovery_v3" }, { onConflict: "url" });
      if (error) {
        stats.errors++;
      } else {
        stats.queued++;
      }
    }

    return NextResponse.json({
      status: "queued",
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    console.error("[cron/discover] Critical Failure:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
