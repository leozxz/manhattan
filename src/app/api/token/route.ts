import { NextRequest, NextResponse } from "next/server";
import { createPluggyClient } from "@/lib/pluggy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { itemId } = body as { itemId?: string };

    const client = createPluggyClient();
    const { accessToken } = await client.createConnectToken(itemId);

    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error("Error creating connect token:", error);
    return NextResponse.json(
      { error: "Failed to create connect token" },
      { status: 500 }
    );
  }
}
