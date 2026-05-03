import { NextResponse } from "next/server";
import { addDiscoveredEvent } from "@/services/discoveryService";

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
      const found = findEventRecursive(data[key]);
      if (found) return found;
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { url, name, city } = await req.json();
    const adminKey = req.headers.get("x-admin-key");

    if (adminKey !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(url, { cache: "no-store" });
    const html = await res.text();

    const scriptRegex =
      /<script\b[^>]*?type\s*=\s*['"]application\/ld\+json['"][^>]*?>([\s\S]*?)<\/script>/gi;
    let eventData: any = null;
    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const json = JSON.parse(match[1]);
        eventData = findEventRecursive(json);
        if (eventData) break;
      } catch (e) {
        continue;
      }
    }

    const metadata = {
      name:
        name ||
        eventData?.name ||
        html
          .match(/<title>(.*?)<\/title>/i)?.[1]
          ?.split("|")[0]
          .trim() ||
        "The Nutcracker",
      city: city || eventData?.location?.address?.addressLocality || "Unknown",
      venue_name: eventData?.location?.name || "Unknown Venue",
      public_sale_start: eventData?.startDate || null,
      status: html.toLowerCase().includes("sold out")
        ? "Sold Out"
        : "Public Sale Live",
      source_url: url,
    };

    const result = await addDiscoveredEvent(metadata);
    return NextResponse.json({ success: true, metadata, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
