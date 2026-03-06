import { NextRequest, NextResponse } from "next/server";
import { createPluggyClient } from "@/lib/pluggy";

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json(
      { error: "accountId is required" },
      { status: 400 }
    );
  }

  try {
    const client = createPluggyClient();
    const response = await client.fetchTransactions(accountId);

    return NextResponse.json({ transactions: response.results });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
