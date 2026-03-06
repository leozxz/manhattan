import { NextRequest, NextResponse } from "next/server";
import { createPluggyClient } from "@/lib/pluggy";

export async function GET(request: NextRequest) {
  const clientItemIds = request.nextUrl.searchParams.get("itemIds");

  try {
    const client = createPluggyClient();

    // Only use client-provided IDs — each session manages its own scope
    const allIds = clientItemIds ? clientItemIds.split(",").filter(Boolean) : [];

    if (allIds.length === 0) {
      return NextResponse.json({ investments: [], syncing: false });
    }

    const allInvestments: unknown[] = [];
    let syncing = false;

    for (const id of allIds) {
      try {
        const item = await client.fetchItem(id);
        const isProcessing =
          item.status !== "UPDATED" &&
          item.status !== "OUTDATED";

        if (isProcessing) {
          syncing = true;
          continue;
        }

        const response = await client.fetchInvestments(id);
        if (response.results.length > 0) {
          allInvestments.push(...response.results);
        }
      } catch {
        // Item deleted or inaccessible — skip
      }
    }

    return NextResponse.json({ investments: allInvestments, syncing });
  } catch (error) {
    console.error("Error fetching investments:", error);
    return NextResponse.json(
      { error: "Failed to fetch investments" },
      { status: 500 }
    );
  }
}
