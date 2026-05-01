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
  status: EventStatus; // Now uses the reusable type above
  presale_date: string | null; // ISO format (YYYY-MM-DD)
  public_sale_date: string | null; // ISO format (YYYY-MM-DD)
  discount_note: string | null;
  group_sales_note: string | null;
  source_url: string;
  created_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}
