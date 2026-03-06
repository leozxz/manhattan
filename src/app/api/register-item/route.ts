import { NextRequest, NextResponse } from "next/server";
import { addServerItemId } from "@/lib/item-store";

export async function POST(request: NextRequest) {
  try {
    const { itemId } = await request.json();
    if (!itemId || typeof itemId !== "string") {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }
    addServerItemId(itemId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error registering item:", error);
    return NextResponse.json({ error: "Failed to register item" }, { status: 500 });
  }
}
