export type EventStatus =
  | "Presale Live"
  | "Public Sale Live"
  | "Group Discount Available"
  | "Sold Out"
  | "Upcoming";

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
