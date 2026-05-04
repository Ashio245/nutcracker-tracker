import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  validateTicketmasterEvent,
  addDiscoveredEvent,
} from "@/services/discoveryService";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * CONSUMER ROUTE:
 * - Reads a small batch of unattempted items from discovery_queue.
 * - Fetches/Validates the pages.
 * - Inserts valid events into the main database.
 * - Updates the queue status.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stats = {
    batch_size: 0,
    validated: 0,
    added: 0,
    errors: 0,
  };

  try {
    // 1. Fetch small batch (5 items) to ensure we finish within 60s
    const { data: queue, error: fetchError } = await supabase
      .from("discovery_queue")
      .select("*")
      .eq("attempted", false)
      .order("created_at", { ascending: true })
      .limit(5);

    if (fetchError) throw fetchError;
    if (!queue || queue.length === 0) {
      return NextResponse.json({
        status: "idle",
        message: "No items to process",
      });
    }

    stats.batch_size = queue.length;

    for (const item of queue) {
      // 2. Execute the slow fetch/validate/extract logic
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

      // 3. IMMEDIATELY update queue status to avoid re-processing on next run
      await supabase
        .from("discovery_queue")
        .update({
          attempted: true,
          validated: validation.valid,
          added_to_events: isAdded,
          last_processed_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      // Respectful delay to prevent Ticketmaster rate limiting
      await new Promise((r) => setTimeout(r, 1500));
    }

    return NextResponse.json({
      status: "processing_complete",
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    console.error("[cron/process-discovery] Worker Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
