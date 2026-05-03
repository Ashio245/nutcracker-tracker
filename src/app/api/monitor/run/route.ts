import { NextResponse } from "next/server";
import { runMonitoring } from "@/services/monitorService";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST() {
  try {
    const results = await runMonitoring(20);
    return NextResponse.json({ status: "success", ...results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
