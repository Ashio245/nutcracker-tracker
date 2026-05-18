export type EventStatus =
  | "Presale Live"
  | "Public Sale Live"
  | "Group Discount Available"
  | "Sold Out"
  | "Upcoming"
  | "On Sale Soon";

export type SalePhase = "presale" | "onsale" | "soldout" | "upcoming";

export interface Event {
  id: string;
  created_at: string;
  name: string;
  city: string | null;
  venue_name: string;
  status: EventStatus;
  presale_start: string | null;
  public_sale_start: string | null;
  group_discount_available: boolean;
  group_min_size: number | null;
  discount_code: string | null;
  discount_note: string | null;
  notes_raw: string | null;
  source_url: string;
  last_checked: string | null;
  content_hash: string | null;
  days_until_event: number | null;
  check_priority: number;
}

/**
 * Helper to determine the current sale phase based on event data
 */
export function getSalePhase(event: Event): SalePhase {
  if (event.status === "Sold Out") return "soldout";
  if (event.status === "Presale Live") return "presale";
  if (event.status === "Public Sale Live" || event.status === "Group Discount Available")
    return "onsale";
  return "upcoming";
}

/**
 * Returns true if the event has any group sales indication
 */
export function hasGroupSales(event: Event): boolean {
  return (
    event.group_discount_available ||
    event.status === "Group Discount Available" ||
    (event.group_min_size !== null && event.group_min_size > 0) ||
    (event.discount_note !== null && event.discount_note.length > 0)
  );
}

/**
 * Returns true if the event has presale info
 */
export function hasPresale(event: Event): boolean {
  return (
    event.status === "Presale Live" ||
    event.presale_start !== null
  );
}
