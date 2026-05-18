import { NextResponse, NextRequest } from "next/server";

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

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[api/monitor] Wrapper Error:", error.message);
    return NextResponse.json(
      { error: "Failed to trigger monitor process", details: error.message },
      { status: 500 },
    );
  }
}
