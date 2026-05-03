import { NextResponse } from "next/server";
import { runMonitoring } from "@/services/monitorService";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response("Unauthorized", { status: 401 });

  try {
    const results = await runMonitoring(25); // Process 25 per run
    return NextResponse.json({ status: "success", ...results });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 },
    );
  }
}
