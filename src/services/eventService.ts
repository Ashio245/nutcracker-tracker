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
 * Targets the official SF Ballet production page.
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

    // Landmark Extraction: SF Ballet usually includes "Nutcracker" in the title tag.
    const titleTag =
      html.split("<title>")[1]?.split("</title>")[0] || "Nutcracker";
    const cleanedTitle = titleTag.split("|")[0].split("-")[0].trim();

    // Complete object for Supabase upsert
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
    console.error("[ImportService SF] Error:", error.message);
    return { success: false, message: error.message };
  }
}

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
