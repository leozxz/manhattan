"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { StoredItem } from "@/lib/stored-item";

const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((mod) => mod.PluggyConnect),
  { ssr: false }
);

interface ConnectButtonProps {
  onSuccess: (item: StoredItem) => void;
  label?: string;
  className?: string;
  connectorIds?: number[];
}

export function ConnectButton({
  onSuccess,
  label = "Conectar meu banco",
  className = "rounded-lg bg-gray-900 px-6 py-3 text-lg font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50",
  connectorIds,
}: ConnectButtonProps) {
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/token", { method: "POST" });
      if (!res.ok) throw new Error("Failed to get connect token");
      const { accessToken } = await res.json();
      setConnectToken(accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClose = useCallback(() => {
    setConnectToken(null);
  }, []);

  async function handleSuccess({ item }: { item: { id: string; connector?: { name?: string; imageUrl?: string } } }) {
    setConnectToken(null);

    // Register item server-side so we never lose it
    fetch("/api/register-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id }),
    }).catch(() => {});

    // If widget returned connector info, use it directly
    if (item.connector?.name) {
      onSuccess({
        id: item.id,
        connectorName: item.connector.name,
        connectorImageUrl: item.connector.imageUrl || "",
      });
      return;
    }

    // Fallback: fetch from our API
    try {
      const res = await fetch(`/api/item?itemId=${item.id}`);
      if (res.ok) {
        const data = await res.json();
        onSuccess(data);
        return;
      }
    } catch { /* ignore */ }

    // Last resort
    onSuccess({ id: item.id, connectorName: "Banco", connectorImageUrl: "" });
  }

  return (
    <div className="w-full">
      <button
        onClick={handleOpen}
        disabled={loading}
        className={className}
      >
        {loading ? "Conectando..." : label}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={true}
          {...(connectorIds && connectorIds.length > 0 ? { connectorIds } : {})}
          onSuccess={handleSuccess}
          onError={({ message }: { message: string }) => {
            setError(message);
            setConnectToken(null);
          }}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
