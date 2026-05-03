import { supabase } from "@/lib/supabase";
import { Event } from "@/types/database";

/**
 * Service for handling direct event object transformations and database interactions.
 */

/**
 * Sanitizes and prepares a raw event object to match the database schema.
 * Ensures all required fields from Omit<Event, "id" | "created_at"> are present.
 */
export function prepareEventData(
  rawData: Partial<Event>,
): Omit<Event, "id" | "created_at"> {
  return {
    name: rawData.name || "Unknown Performance",
    city: rawData.city || "Unknown",
    venue_name: rawData.venue_name || "TBA",
    status: rawData.status || "Upcoming",
    source_url: rawData.source_url || "",
    notes_raw: rawData.notes_raw || null,
    presale_start: rawData.presale_start || null,
    public_sale_start: rawData.public_sale_start || null,
    group_discount_available: rawData.group_discount_available || false,
    group_min_size: rawData.group_min_size || null,
    discount_code: rawData.discount_code || null,
    discount_note: rawData.discount_note || null,
    // Required fields to satisfy Omit<Event, "id" | "created_at">
    last_checked: new Date().toISOString(),
    content_hash: rawData.content_hash || null,
    days_until_event: rawData.days_until_event || null,
    check_priority: rawData.check_priority || 1,
  };
}

/**
 * Fetches a single event by its source URL.
 */
export async function getEventByUrl(url: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("source_url", url)
    .single();

  if (error) return null;
  return data;
}

/**
 * Updates the monitoring metadata for an event.
 */
export async function updateEventCheckStats(
  eventId: string,
  stats: { content_hash?: string; days_until_event?: number },
): Promise<void> {
  await supabase
    .from("events")
    .update({
      ...stats,
      last_checked: new Date().toISOString(),
    })
    .eq("id", eventId);
}

/**
 * Example scraper transformation function.
 * Ensures the returned object fully satisfies the required Event fields.
 */
export function transformScrapedData(
  scraped: any,
): Omit<Event, "id" | "created_at"> {
  return {
    name: scraped.title || "The Nutcracker",
    city: scraped.location || "Unknown",
    venue_name: scraped.venue || "TBA",
    status: scraped.isSoldOut ? "Sold Out" : "Public Sale Live",
    source_url: scraped.url,
    notes_raw: scraped.description || null,
    presale_start: null,
    public_sale_start: scraped.startDate || null,
    group_discount_available: false,
    group_min_size: null,
    discount_code: null,
    discount_note: null,
    // Required fields to satisfy Omit<Event, "id" | "created_at">
    last_checked: new Date().toISOString(),
    content_hash: null,
    days_until_event: null,
    check_priority: 1,
  };
}
