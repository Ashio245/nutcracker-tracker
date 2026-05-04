import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server" },
      { status: 500 },
    );
  }

  try {
    const { origin } = new URL(request.url);
    const targetUrl = `${origin}/api/cron/process-discovery`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
      },
      cache: "no-store",
    });

    const raw = await response.text();
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return new NextResponse(raw, {
        status: response.status,
        headers: { "content-type": "application/json" },
      });
    }

    return NextResponse.json(
      {
        error: "Cron route did not return JSON",
        status: response.status,
        preview: raw.slice(0, 300),
      },
      { status: 500 },
    );
  } catch (error: any) {
    console.error("[api/monitor/run] Wrapper Error:", error.message);
    return NextResponse.json(
      { error: "Failed to trigger monitor process", details: error.message },
      { status: 500 },
    );
  }
}
