import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  validateTicketmasterEvent,
  addDiscoveredEvent,
} from "@/services/discoveryService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = { batch_size: 0, validated: 0, added: 0, errors: 0 };

  try {
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

      await supabase
        .from("discovery_queue")
        .update({
          attempted: true,
          validated: validation.valid,
          added_to_events: isAdded,
          last_processed_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      await new Promise((r) => setTimeout(r, 1500));
    }

    return NextResponse.json({
      status: "processing_complete",
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Process discovery cron failed", details: error.message },
      { status: 500 },
    );
  }
}
