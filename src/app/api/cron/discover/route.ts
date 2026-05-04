import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  discoverFromWebSearch,
  discoverFromBalletDirectories,
} from "@/services/discoveryService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = { discovered: 0, queued: 0, errors: 0 };

  try {
    const [webUrls, dirUrls] = await Promise.all([
      discoverFromWebSearch(),
      discoverFromBalletDirectories(),
    ]);

    const allUrls = Array.from(new Set([...webUrls, ...dirUrls])).slice(0, 20);
    stats.discovered = allUrls.length;

    if (allUrls.length > 0) {
      const { data, error } = await supabase
        .from("discovery_queue")
        .upsert(
          allUrls.map((url) => ({
            url,
            source: "cron_discovery_v6_fast",
            attempted: false,
          })),
          { onConflict: "url", ignoreDuplicates: true },
        )
        .select("url");

      if (error) throw error;
      stats.queued = data?.length || 0;
    }

    return NextResponse.json({
      status: "discovery_fast_complete",
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
