import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  discoverFromWebSearch,
  discoverFromBalletDirectories,
  validateEventPage,
  extractEventMetadata,
  addDiscoveredEvent,
} from "@/services/discoveryService";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response("Unauthorized", { status: 401 });

  const stats = {
    discovered: 0,
    queued: 0,
    validated: 0,
    added: 0,
    validation_errors: 0,
    queue_errors: 0,
    insert_errors: 0,
  };

  // 1. Discovery Phase (Find and Queue)
  const webUrls = await discoverFromWebSearch();
  const dirUrls = await discoverFromBalletDirectories();

  // FIX: Replaced spread operator with Array.from for Set iteration compatibility
  const allUrls = Array.from(new Set([...webUrls, ...dirUrls])).slice(0, 100);
  stats.discovered = allUrls.length;

  for (const url of allUrls) {
    const { error } = await supabase
      .from("discovery_queue")
      .upsert({ url, source: "cron_discovery" }, { onConflict: "url" });
    if (error) stats.queue_errors++;
    else stats.queued++;
  }

  // 2. Batch Processing Phase (Process 15 unattempted)
  const { data: queue } = await supabase
    .from("discovery_queue")
    .select("*")
    .eq("attempted", false)
    .limit(15);

  if (queue) {
    for (const item of queue) {
      const validation = await validateEventPage(item.url);
      let isValid = validation.valid;
      let isAdded = false;

      if (isValid && validation.html) {
        const meta = extractEventMetadata(item.url, validation.html);
        const res = await addDiscoveredEvent(meta);
        isAdded = res.added;
        if (res.error) stats.insert_errors++;
      } else if (!isValid) {
        stats.validation_errors++;
      }

      await supabase
        .from("discovery_queue")
        .update({
          attempted: true,
          validated: isValid,
          added_to_events: isAdded,
        })
        .eq("id", item.id);

      if (isValid) stats.validated++;
      if (isAdded) stats.added++;
    }
  }

  return NextResponse.json({
    status: "completed",
    timestamp: new Date().toISOString(),
    stats,
  });
}
