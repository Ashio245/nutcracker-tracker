import { supabase } from "@/lib/supabase";
import { Event, EventStatus } from "@/types/database";

/**
 * Validates if a string is a member of the EventStatus union type.
 */
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

/**
 * Truly recursive helper to find the first 'Event' node in a JSON-LD structure.
 */
function findEventRecursive(data: any): any | null {
  if (!data || typeof data !== "object") return null;

  if (data["@type"] === "Event") return data;

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findEventRecursive(item);
      if (found) return found;
    }
  } else {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const found = findEventRecursive(data[key]);
        if (found) return found;
      }
    }
  }
  return null;
}

/**
 * Normalizes found JSON-LD data into the local Event schema.
 */
function mapJsonLdToEvent(
  item: any,
  url: string,
): Omit<Event, "id" | "created_at"> {
  return {
    name: item.name || "Ticketmaster Event",
    city: item.location?.address?.addressLocality || "Unknown City",
    venue_name: item.location?.name || "Unknown Venue",
    status: "Public Sale Live",
    presale_start: null,
    public_sale_start: item.startDate || null,
    group_discount_available: false,
    group_min_size: null,
    discount_code: null,
    discount_note: "Imported via flexible Ticketmaster HTML parser.",
    notes_raw: `Source: ticketmaster_html | Image: ${item.image || "N/A"}`,
    source_url: url,
  };
}

/**
 * Manually fetches and imports/updates the Philadelphia Ballet Nutcracker event.
 */
export async function importPhiladelphiaBalletEvent(): Promise<{
  success: boolean;
  message: string;
}> {
  const url = "https://philadelphiaballet.org/25-26-season/nutcracker/";

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok)
      throw new Error(`Failed to reach source: ${response.statusText}`);

    const html = await response.text();
    const titleTag =
      html.split("<title>")[1]?.split("</title>")[0] || "The Nutcracker";
    const cleanedTitle = titleTag.split("|")[0].split("-")[0].trim();

    const eventData: Omit<Event, "id" | "created_at"> = {
      name: cleanedTitle || "George Balanchine's The Nutcracker",
      city: "Philadelphia",
      venue_name: "Academy of Music",
      status: "Upcoming",
      presale_start: null,
      public_sale_start: null,
      group_discount_available: false,
      group_min_size: null,
      discount_code: null,
      discount_note: "Check official site for group rates and local discounts.",
      notes_raw: `Imported via manual sync from: ${url}`,
      source_url: url,
    };

    const { error } = await supabase
      .from("events")
      .upsert(eventData, { onConflict: "source_url" });

    if (error) throw error;
    return {
      success: true,
      message: `Successfully synchronized: ${cleanedTitle}`,
    };
  } catch (error: any) {
    console.error("[ImportService PHL] Error:", error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Manually fetches and imports/updates the San Francisco Ballet Nutcracker event.
 */
export async function importSanFranciscoBalletEvent(): Promise<{
  success: boolean;
  message: string;
}> {
  const url = "https://www.sfballet.org/productions/nutcracker/";

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok)
      throw new Error(`Failed to reach source: ${response.statusText}`);

    const html = await response.text();
    const titleTag =
      html.split("<title>")[1]?.split("</title>")[0] || "Nutcracker";
    const cleanedTitle = titleTag.split("|")[0].split("-")[0].trim();

    const eventData: Omit<Event, "id" | "created_at"> = {
      name: cleanedTitle || "Nutcracker",
      city: "San Francisco",
      venue_name: "War Memorial Opera House",
      status: "Upcoming",
      presale_start: null,
      public_sale_start: null,
      group_discount_available: false,
      group_min_size: null,
      discount_code: null,
      discount_note:
        "Standard ticketing applies. Check SF Ballet site for details.",
      notes_raw: `Imported via manual sync from: ${url}`,
      source_url: url,
    };

    const { error } = await supabase
      .from("events")
      .upsert(eventData, { onConflict: "source_url" });

    if (error) throw error;
    return {
      success: true,
      message: `Successfully synchronized: ${cleanedTitle}`,
    };
  } catch (error: any) {
    console.error("[ImportService SFO] Error:", error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Robust Ticketmaster HTML Importer with flexible script matching.
 */
export async function importTicketmasterEvent(
  url: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok)
      throw new Error(`Source unreachable: ${response.statusText}`);
    const html = await response.text();

    const scriptRegex =
      /<script\b[^>]*?type\s*=\s*['"]application\/ld\+json['"][^>]*?>([\s\S]*?)<\/script>/gi;
    let match;
    let foundEventData = null;

    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const content = JSON.parse(match[1]);
        const eventMatch = findEventRecursive(content);

        if (eventMatch) {
          foundEventData = mapJsonLdToEvent(eventMatch, url);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!foundEventData) {
      throw new Error("No valid Event metadata found in JSON-LD blocks.");
    }

    const { error } = await supabase
      .from("events")
      .upsert(foundEventData, { onConflict: "source_url" });

    if (error) throw error;

    return { success: true, message: `Imported: ${foundEventData.name}` };
  } catch (error: any) {
    console.error("[TM Import] Error:", error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Fetches events from the database with optional status filtering and sorting.
 */
export async function getEvents(
  status?: string,
  sortBy: string = "newest",
): Promise<Event[]> {
  let query = supabase.from("events").select("*");

  if (status && isValidStatus(status)) {
    query = query.eq("status", status);
  }

  if (sortBy === "alphabetical") {
    query = query.order("name", { ascending: true });
  } else {
    query = query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`[EventService] Failed to fetch events: ${error.message}`);
  }

  return (data as Event[]) || [];
}
