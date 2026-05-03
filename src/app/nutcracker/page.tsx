"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Event } from "@/types/database";
import Link from "next/link";

export default function NutcrackerDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastRun, setLastRun] = useState<any>(null);
  const [search, setSearch] = useState("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("public_sale_start", { ascending: true });
    if (data) setEvents(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const runAction = async (endpoint: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      setLastRun(data);
      await fetchEvents();
    } finally {
      setActionLoading(false);
    }
  };

  const stats = [
    { label: "Total", val: events.length },
    {
      label: "Live",
      val: events.filter((e) => e.status === "Public Sale Live").length,
    },
    {
      label: "Sold Out",
      val: events.filter((e) => e.status === "Sold Out").length,
    },
    {
      label: "Incomplete",
      val: events.filter((e) => e.city === "Unknown").length,
    },
  ];

  const filtered = events.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.venue_name || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="pt-28 pb-24 px-6 max-w-7xl mx-auto space-y-10">
      <div className="space-y-3">
        <h1 className="text-[36px] font-bold tracking-tight text-main">
          Performance Control
        </h1>
        <p className="text-[17px] text-muted max-w-2xl leading-relaxed">
          System-wide monitoring of ballet events and venue availability
          routines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="mac-card p-5 flex flex-wrap items-center justify-between gap-5">
            <div className="flex gap-2.5">
              <button
                onClick={() => runAction("/api/discover/run")}
                disabled={actionLoading}
                className="mac-button-primary"
              >
                Run Discovery
              </button>
              <button
                onClick={() => runAction("/api/monitor/run")}
                disabled={actionLoading}
                className="mac-button-secondary"
              >
                Monitor Changes
              </button>
              <button
                onClick={fetchEvents}
                className="w-9 h-9 flex items-center justify-center glass rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
              >
                <svg
                  className={`w-4 h-4 text-main ${actionLoading ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-5 flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search event or venue..."
                  className="mac-input"
                  style={{ paddingLeft: "2.5rem" }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <svg
                  className="w-4 h-4 absolute left-3.5 top-2.5 text-muted opacity-60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <Link
                href="/admin/scraper"
                className="text-[13px] font-medium text-accent hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                Manual Import
              </Link>
            </div>
          </div>

          {lastRun && (
            <div className="mac-card p-5 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
                  Execution Stats
                </span>
                <button
                  onClick={() => setLastRun(null)}
                  className="text-[11px] text-accent font-medium"
                >
                  Clear Console
                </button>
              </div>
              <pre className="text-[12px] font-mono leading-relaxed overflow-x-auto text-main opacity-80 max-h-48 bg-[var(--hover-bg)] p-4 rounded-lg">
                {JSON.stringify(lastRun, null, 2)}
              </pre>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((event) => (
              <div
                key={event.id}
                className="mac-card p-6 group flex flex-col justify-between hover:translate-y-[-2px]"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor:
                          event.status === "Sold Out"
                            ? "rgba(239, 68, 68, 0.1)"
                            : "rgba(34, 197, 94, 0.1)",
                        color:
                          event.status === "Sold Out" ? "#ef4444" : "#22c55e",
                      }}
                    >
                      {event.status.toUpperCase()}
                    </span>
                    <span className="text-[12px] text-muted tabular-nums font-medium">
                      {event.public_sale_start
                        ? new Date(event.public_sale_start).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )
                        : "TBA"}
                    </span>
                  </div>
                  <h3 className="font-bold text-[16px] leading-snug mb-1 text-main">
                    {event.name}
                  </h3>
                  <p className="text-[14px] text-muted leading-tight line-clamp-1">
                    {event.venue_name}
                  </p>
                </div>
                <div
                  className="flex justify-between items-end mt-7 pt-4 border-t"
                  style={{ borderColor: "var(--panel-border)" }}
                >
                  <span className="text-[13px] font-semibold text-accent">
                    {event.city}
                  </span>
                  <a
                    href={event.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] font-medium text-main opacity-0 group-hover:opacity-100 transition-all"
                  >
                    Tickets →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="mac-card p-5">
                <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                  {s.label}
                </p>
                <p className="text-[26px] font-bold tabular-nums text-main leading-none">
                  {s.val}
                </p>
              </div>
            ))}
          </div>
          <div className="mac-card p-6 space-y-5">
            <h4 className="text-[15px] font-bold text-main">
              Infrastructure Health
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Discovery Status</span>
                <span className="text-green-500 font-medium flex items-center gap-1.5">
                  Operational
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Primary Gateway</span>
                <span className="text-main font-medium">Ticketmaster V3</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Last Update</span>
                <span className="text-main font-medium">Recently</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
