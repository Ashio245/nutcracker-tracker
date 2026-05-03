import { NextResponse } from "next/server";
import {
  importPhiladelphiaBalletEvent,
  importSanFranciscoBalletEvent,
} from "@/services/eventService";

export const dynamic = "force-dynamic";

/**
 * Type definitions for the Cron execution summary
 */
interface CronResult {
  source: string;
  success: boolean;
  message: string;
}

interface CronResponse {
  status: string;
  timestamp: string;
  summary: {
    total: number;
    success: number;
    failed: number;
  };
  results: CronResult[];
}

export async function GET(request: Request) {
  // 1. Simplified Auth Guard (Vercel Documented Pattern)
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Strictly typed results array for fail-soft execution
  const results: CronResult[] = [];

  // 2. Fail-soft Sequential Execution

  // Philadelphia Ballet
  try {
    const phl = await importPhiladelphiaBalletEvent();
    results.push({
      source: "Philadelphia Ballet",
      success: !!phl?.success,
      message: phl?.message || "Successfully synchronized",
    });
  } catch (error: any) {
    results.push({
      source: "Philadelphia Ballet",
      success: false,
      message: error.message || "Unknown error occurred during import",
    });
  }

  // San Francisco Ballet
  try {
    const sfo = await importSanFranciscoBalletEvent();
    results.push({
      source: "San Francisco Ballet",
      success: !!sfo?.success,
      message: sfo?.message || "Successfully synchronized",
    });
  } catch (error: any) {
    results.push({
      source: "San Francisco Ballet",
      success: false,
      message: error.message || "Unknown error occurred during import",
    });
  }

  // 3. Typed JSON Response Generation
  const responseData: CronResponse = {
    status: "completed",
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    },
    results,
  };

  return NextResponse.json(responseData, { status: 200 });
}
