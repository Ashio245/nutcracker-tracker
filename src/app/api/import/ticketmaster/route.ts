import { NextResponse } from "next/server";
import { importTicketmasterEvent } from "@/services/eventService";

export const dynamic = "force-dynamic";

/**
 * Validates that the URL belongs to a legitimate Ticketmaster regional domain.
 * Strictly Ticketmaster-focused.
 */
function isValidTicketmasterUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== "https:") return false;

    const host = url.hostname;
    const allowedPatterns = [
      "ticketmaster.com",
      "ticketmaster.ca",
      "ticketmaster.co.uk",
      "ticketmaster.ie",
      "ticketmaster.pro",
      "ticketmaster.mx",
    ];

    return allowedPatterns.some(
      (domain) => host === domain || host.hostname.endsWith("." + domain),
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || !isValidTicketmasterUrl(url)) {
      return NextResponse.json(
        {
          error:
            "Invalid URL. Only official Ticketmaster HTTPS URLs are permitted.",
        },
        { status: 400 },
      );
    }

    const result = await importTicketmasterEvent(url);

    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
