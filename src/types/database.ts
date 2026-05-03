// Define the allowed status values as a reusable type
export type EventStatus =
  | "Presale Live"
  | "Public Sale Live"
  | "Group Discount Available"
  | "Sold Out"
  | "Upcoming";

export interface Event {
  id: string;
  name: string;
  city: string;
  venue_name: string;
  status: EventStatus;
  presale_start: string | null; // ISO format from TIMESTAMPTZ
  public_sale_start: string | null; // ISO format from TIMESTAMPTZ
  group_discount_available: boolean | null;
  group_min_size: number | null;
  discount_code: string | null;
  discount_note: string | null;
  notes_raw: string | null;
  source_url: string | null; // Made nullable for safer Supabase compatibility
  created_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}
