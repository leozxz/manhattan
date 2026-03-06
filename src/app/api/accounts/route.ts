import { NextRequest, NextResponse } from "next/server";
import { createPluggyClient } from "@/lib/pluggy";

export async function GET(request: NextRequest) {
  const itemId = request.nextUrl.searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json(
      { error: "itemId is required" },
      { status: 400 }
    );
  }

  try {
    const client = createPluggyClient();
    const response = await client.fetchAccounts(itemId);

    return NextResponse.json({ accounts: response.results });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
