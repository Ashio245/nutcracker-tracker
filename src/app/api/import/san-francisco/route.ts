import { NextResponse } from "next/server";
import { importSanFranciscoBalletEvent } from "@/services/eventService";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await importSanFranciscoBalletEvent();

    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
