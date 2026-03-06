import { NextRequest, NextResponse } from "next/server";
import { createPluggyClient } from "@/lib/pluggy";

export async function GET(request: NextRequest) {
  const itemId = request.nextUrl.searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }

  try {
    const client = createPluggyClient();
    const item = await client.fetchItem(itemId);

    return NextResponse.json({
      id: item.id,
      connectorName: item.connector.name,
      connectorImageUrl: item.connector.imageUrl,
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}
