import { NextResponse } from "next/server";
import { importPhiladelphiaBalletEvent } from "@/services/eventService";

export async function POST() {
  const result = await importPhiladelphiaBalletEvent();
  return NextResponse.json(result);
}
