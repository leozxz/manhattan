"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { addStoredItem, saveStoredItems } from "@/lib/stored-item";

const DEMO_ITEM_ID = "21a92251-4afe-47f5-9894-0d45e3c6d264";

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    // Clean slate — only demo data
    saveStoredItems([]);
    localStorage.removeItem("manhattan_all_item_ids");
    localStorage.removeItem("manhattan_simulated");
    localStorage.removeItem("manhattan_simulated_investments");

    // Add demo item and redirect
    addStoredItem({
      id: DEMO_ITEM_ID,
      connectorName: "XP Investimentos",
      connectorImageUrl: "",
    });

    router.push("/arca");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/background.png')" }}>
      <div className="text-sm text-gray-400 animate-pulse">Carregando demo...</div>
    </div>
  );
}
