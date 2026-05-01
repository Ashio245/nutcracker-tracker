import { supabase } from "@/lib/supabase";
import { Event, EventStatus } from "@/types/database";

function isValidStatus(status: string): status is EventStatus {
  const validStatuses: EventStatus[] = [
    "Presale Live",
    "Public Sale Live",
    "Group Discount Available",
    "Sold Out",
    "Upcoming",
  ];
  return validStatuses.includes(status as EventStatus);
}

export async function getEvents(
  status?: string,
  sortBy: string = "newest",
): Promise<Event[]> {
  let query = supabase.from("events").select("*");

  // 1. Handle Filtering
  if (status && isValidStatus(status)) {
    query = query.eq("status", status);
  }

  /**
   * 2. Handle Sorting
   * SAFE FALLBACK: We use 'id' as a secondary sort to ensure the order
   * is stable even if timestamps are identical or missing.
   */
  if (sortBy === "alphabetical") {
    query = query.order("name", { ascending: true });
  } else {
    // We use 'id' as the safest possible fallback for sorting if 'created_at' fails
    query = query.order("id", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`[EventService] Failed to fetch events: ${error.message}`);
  }

  return (data as Event[]) || [];
}
