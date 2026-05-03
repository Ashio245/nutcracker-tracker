"use client";

import { useState } from "react";
import Link from "next/link";

export default function ManualScraper() {
  const [url, setUrl] = useState("");
  const [overrides, setOverrides] = useState({ name: "", city: "" });
  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "loading", message: "Extracting metadata..." });

    try {
      const res = await fetch("/api/scrape/ticketmaster", {
        method: "POST",
        body: JSON.stringify({ url, ...overrides }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({
          type: "success",
          message: `Successfully added: ${data.metadata.name}`,
        });
        setUrl("");
      } else {
        throw new Error(data.error || "Import failed");
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    }
  };

  return (
    <main className="pt-32 pb-24 px-6 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center">
        <Link
          href="/nutcracker"
          className="text-[13px] font-medium text-accent hover:opacity-80 transition-all flex items-center gap-1.5"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Controller
        </Link>
      </div>

      <div className="mac-card p-10 space-y-10">
        <div className="space-y-2.5">
          <h1 className="text-[28px] font-bold tracking-tight text-main">
            Manual Ingestion
          </h1>
          <p className="text-[15px] text-muted leading-relaxed">
            Provide a ticket listing URL to be processed by the metadata
            extraction engine.
          </p>
        </div>

        <form onSubmit={handleScrape} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest ml-1">
                Source URL
              </label>
              <input
                type="url"
                required
                placeholder="https://ticketmaster.com/..."
                className="mac-input"
                style={{ padding: "0.5rem 1rem" }}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-widest ml-1">
                  Title Override
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  className="mac-input"
                  style={{ padding: "0.5rem 1rem" }}
                  value={overrides.name}
                  onChange={(e) =>
                    setOverrides({ ...overrides, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-widest ml-1">
                  Location Override
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  className="mac-input"
                  style={{ padding: "0.5rem 1rem" }}
                  value={overrides.city}
                  onChange={(e) =>
                    setOverrides({ ...overrides, city: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={status.type === "loading"}
            className="w-full mac-button-primary"
            style={{ height: "3rem", fontSize: "0.9375rem" }}
          >
            {status.type === "loading"
              ? "Ingesting Metadata..."
              : "Add to Collection"}
          </button>
        </form>

        {status.message && (
          <div
            className="p-4 rounded-xl text-sm font-medium border"
            style={{
              backgroundColor:
                status.type === "success"
                  ? "rgba(34, 197, 94, 0.05)"
                  : "rgba(239, 68, 68, 0.05)",
              color: status.type === "success" ? "#22c55e" : "#ef4444",
              borderColor:
                status.type === "success"
                  ? "rgba(34, 197, 94, 0.2)"
                  : "rgba(239, 68, 68, 0.2)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor:
                    status.type === "success" ? "#22c55e" : "#ef4444",
                }}
              />
              {status.message}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
