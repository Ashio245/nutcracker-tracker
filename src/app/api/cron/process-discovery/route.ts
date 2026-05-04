import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  validateTicketmasterEvent,
  addDiscoveredEvent,
} from "@/services/discoveryService";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stats = {
    processed: 0,
    validated: 0,
    added: 0,
    errors: 0,
  };

  try {
    // 1. Fetch small batch of unattempted items
    const { data: queue, error: fetchError } = await supabase
      .from("discovery_queue")
      .select("*")
      .eq("attempted", false)
      .limit(5); // Small batch to prevent Vercel timeouts

    if (fetchError) throw fetchError;
    if (!queue || queue.length === 0) {
      return NextResponse.json({ status: "idle", message: "Queue empty" });
    }

    for (const item of queue) {
      stats.processed++;

      // 2. Validate and Extract (Slow Phase)
      const validation = await validateTicketmasterEvent(item.url);
      let isAdded = false;

      if (validation.valid && validation.metadata) {
        stats.validated++;
        const res = await addDiscoveredEvent(validation.metadata);
        if (res.added) {
          stats.added++;
          isAdded = true;
        } else {
          stats.errors++;
        }
      }

      // 3. Mark row as attempted immediately to prevent loops
      await supabase
        .from("discovery_queue")
        .update({
          attempted: true,
          validated: validation.valid,
          added_to_events: isAdded,
        })
        .eq("id", item.id);

      // Brief sleep between fetches to avoid rate limits
      await new Promise((r) => setTimeout(r, 1000));
    }

    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    console.error("[cron/process-discovery] Worker Failure:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
