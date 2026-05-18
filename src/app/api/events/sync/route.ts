import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchTicketmasterNutcrackerEvents } from "@/services/ticketmasterService";
import { fetchCuratedNutcrackerEvents } from "@/services/balletCompanyService";
import { fetchSheetVenues } from "@/services/sheetVenueService";

export const dynamic = "force-dynamic";

/**
 * URLs from secondary/resale markets that should be removed.
 */
const RESALE_DOMAINS = [
  "stubhub.com",
  "vividseats.com",
  "seatgeek.com",
  "bigstub.com",
  "ticketsonsale.com",
  "viagogo.com",
  "ticketnetwork.com",
  "hellotickets.com",
  "thenutcracker2026.com",
  "eventbrite.com",
];

/**
 * GET /api/events/sync
 * 
 * Multi-source sync:
 * 1. Fetches Nutcracker events from Ticketmaster Discovery API
 * 2. Fetches curated non-TM ballet company events with live status detection
 * 3. Cleans up bad/resale data
 * 4. Upserts everything into Supabase
 */
export async function GET() {
  const stats = {
    ticketmaster: { fetched: 0, upserted: 0 },
    curated: { fetched: 0, upserted: 0 },
    sheets: { fetched: 0, upserted: 0 },
    cleaned: 0,
    errors: 0,
  };

  try {
    // 1. Fetch from all sources in parallel
    const [tmEvents, curatedEvents, sheetEvents] = await Promise.all([
      fetchTicketmasterNutcrackerEvents(),
      fetchCuratedNutcrackerEvents(),
      fetchSheetVenues(),
    ]);

    stats.ticketmaster.fetched = tmEvents.length;
    stats.curated.fetched = curatedEvents.length;
    stats.sheets.fetched = sheetEvents.length;

    // Combine non-TM events for deduplication logic below
    const allCuratedEvents = [...curatedEvents, ...sheetEvents];

    // 2. Clean up resale / bad / past data
    const { data: existingEvents } = await supabase
      .from("events")
      .select("id, source_url, city, venue_name, name, days_until_event");

    if (existingEvents) {
      const idsToDelete: string[] = [];

      for (const event of existingEvents) {
        const url = (event.source_url || "").toLowerCase();

        // Remove resale market events
        const isResale = RESALE_DOMAINS.some((d) => url.includes(d));
        if (isResale) {
          idsToDelete.push(event.id);
          continue;
        }

        // Remove events with HTML entities in names (bad scraping)
        if (
          event.name?.includes("&amp;") ||
          event.name?.includes("&#") ||
          event.name?.includes("<i>") ||
          event.name?.includes("</i>")
        ) {
          idsToDelete.push(event.id);
          continue;
        }

        // Remove past events
        if (event.days_until_event !== null && event.days_until_event < 0) {
          idsToDelete.push(event.id);
          continue;
        }
      }

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("events")
          .delete()
          .in("id", idsToDelete);

        if (!deleteError) {
          stats.cleaned = idsToDelete.length;
        }
      }
    }

    // 3. Also delete duplicate scraped entries with Unknown/TBA 
    //    that now have better curated versions
    const curatedUrls = allCuratedEvents.map((e) => e.source_url);
    if (existingEvents) {
      const scrapedDupeIds = existingEvents
        .filter(
          (e) =>
            (e.city === "Unknown" || e.venue_name === "TBA") &&
            !curatedUrls.includes(e.source_url)
        )
        .map((e) => e.id);

      if (scrapedDupeIds.length > 0) {
        const { error } = await supabase
          .from("events")
          .delete()
          .in("id", scrapedDupeIds);

        if (!error) {
          stats.cleaned += scrapedDupeIds.length;
        }
      }
    }

    // 4. Upsert Ticketmaster events (only future)
    const futureTmEvents = tmEvents.filter(e => e.days_until_event === null || e.days_until_event >= 0);
    const batchSize = 10;
    for (let i = 0; i < futureTmEvents.length; i += batchSize) {
      const batch = futureTmEvents.slice(i, i + batchSize);
      const { error } = await supabase
        .from("events")
        .upsert(batch, { onConflict: "source_url", ignoreDuplicates: false });

      if (error) {
        console.error("[sync] TM batch error:", error.message);
        stats.errors++;
      } else {
        stats.ticketmaster.upserted += batch.length;
      }
    }

    // 5. Upsert curated events (original curated + sheet)
    for (let i = 0; i < allCuratedEvents.length; i += batchSize) {
      const batch = allCuratedEvents.slice(i, i + batchSize);
      const { error } = await supabase
        .from("events")
        .upsert(batch, { onConflict: "source_url", ignoreDuplicates: false });

      if (error) {
        console.error("[sync] Curated batch error:", error.message);
        stats.errors++;
      } else {
        // Just add to curated stats for simplicity, or split if needed
        stats.curated.upserted += batch.length;
      }
    }

    return NextResponse.json({
      status: "synced",
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    console.error("[api/events/sync] Sync failed:", error.message);
    return NextResponse.json(
      { error: "Event sync failed", details: error.message, stats },
      { status: 500 }
    );
  }
}
