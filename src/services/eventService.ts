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

    /**
     * Flexible Regex:
     * Matches <script> tags with 'application/ld+json' regardless of:
     * - Single or double quotes
     * - Extra whitespace
     * - Attribute order
     */
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
