"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Event } from "@/types/database";
import {
  FiExternalLink,
  FiCheckCircle,
  FiAlertTriangle,
  FiSearch,
  FiRefreshCw,
  FiActivity,
  FiTerminal,
  FiDatabase,
  FiInfo,
} from "react-icons/fi";

export default function NutcrackerConsole() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [hideIncomplete, setHideIncomplete] = useState(true);
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [lastLogs, setLastLogs] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [queueStats, setQueueStats] = useState({ pending: 0, lastRun: "" });

  useEffect(() => {
    fetchEvents();
    fetchQueueStats();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("name", { ascending: true });

    if (!error && data) setEvents(data);
    setLoading(false);
  };

  const fetchQueueStats = async () => {
    const { count: pendingCount } = await supabase
      .from("discovery_queue")
      .select("*", { count: "exact", head: true })
      .eq("attempted", false);

    const { data: lastItem } = await supabase
      .from("discovery_queue")
      .select("last_processed_at")
      .order("last_processed_at", { ascending: false })
      .limit(1);

    setQueueStats({
      pending: pendingCount || 0,
      lastRun: lastItem?.[0]?.last_processed_at || new Date().toISOString(),
    });
  };

  const runAction = async (action: string) => {
    setIsRunning(action);
    setErrorMsg(null);
    setLastLogs(null);

    const endpoint = action === "discovery" ? "/api/discover" : "/api/monitor";

    try {
      const response = await fetch(endpoint, { method: "POST" });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Action failed");

      setLastLogs(result);
      await fetchEvents();
      await fetchQueueStats();
    } catch (e: any) {
      setErrorMsg(e.message);
      console.error(e);
    } finally {
      setIsRunning(null);
    }
  };

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        const matchesSearch =
          event.name.toLowerCase().includes(search.toLowerCase()) ||
          event.venue_name?.toLowerCase().includes(search.toLowerCase()) ||
          event.city?.toLowerCase().includes(search.toLowerCase());

        const isComplete =
          event.city !== "Unknown" && event.venue_name !== "TBA";
        return matchesSearch && (!hideIncomplete || isComplete);
      })
      .sort((a, b) => {
        const aComplete = a.city !== "Unknown" && a.venue_name !== "TBA";
        const bComplete = b.city !== "Unknown" && b.venue_name !== "TBA";

        if (aComplete !== bComplete) return aComplete ? -1 : 1;

        if (!a.public_sale_start) return 1;
        if (!b.public_sale_start) return -1;
        return (
          new Date(a.public_sale_start).getTime() -
          new Date(b.public_sale_start).getTime()
        );
      });
  }, [events, search, hideIncomplete]);

  const stats = {
    total: events.length,
    live: events.filter((e) => e.status === "Public Sale Live").length,
    soldOut: events.filter((e) => e.status === "Sold Out").length,
    incomplete: events.filter(
      (e) => e.city === "Unknown" || e.venue_name === "TBA",
    ).length,
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 px-4 pb-4 pt-24 md:px-8 md:pb-8 md:pt-28 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <FiActivity className="text-blue-400" /> Nutcracker Operations
              Console
            </h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                System Active
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FiDatabase /> Queue:{" "}
                <strong>{queueStats.pending} pending</strong>
              </span>
              <span>•</span>
              <span>
                Last Sync: {new Date(queueStats.lastRun).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/scraper"
              className="mac-button-secondary text-xs py-2 flex items-center gap-2"
            >
              <FiTerminal /> Manual Import Console
            </a>
          </div>
        </header>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Events",
              val: stats.total,
              sub: `${stats.incomplete} incomplete`,
              color: "from-blue-500/20",
            },
            {
              label: "Live Sales",
              val: stats.live,
              sub: `${((stats.live / stats.total) * 100 || 0).toFixed(1)}% of total`,
              color: "from-emerald-500/20",
            },
            {
              label: "Sold Out",
              val: stats.soldOut,
              sub: `${((stats.soldOut / stats.total) * 100 || 0).toFixed(1)}% conversion`,
              color: "from-purple-500/20",
            },
            {
              label: "Incomplete",
              val: stats.incomplete,
              sub: "Requires metadata",
              color: "from-orange-500/20",
            },
          ].map((kpi, i) => (
            <div
              key={i}
              className={`mac-card bg-gradient-to-br ${kpi.color} to-transparent border-white/5 p-5`}
            >
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {kpi.label}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold mt-1 text-white tabular-nums">
                {kpi.val}
              </h2>
              <p className="text-[10px] mt-2 text-slate-500 font-medium">
                {kpi.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ACTION PANEL */}
        <div className="mac-card p-4 border-white/5 bg-white/5">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={() => runAction("discovery")}
                disabled={!!isRunning}
                className="mac-button-primary px-6 py-2.5 flex items-center justify-center gap-2 relative overflow-hidden text-sm"
              >
                {isRunning === "discovery" ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <FiSearch />
                )}
                {isRunning === "discovery" ? "Discovering..." : "Run Discovery"}
              </button>
              <button
                onClick={() => runAction("process")}
                disabled={!!isRunning}
                className="mac-button-secondary px-6 py-2.5 flex items-center justify-center gap-2 text-sm"
              >
                {isRunning === "process" ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <FiActivity />
                )}
                {isRunning === "process" ? "Monitoring..." : "Monitor Changes"}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="mac-input pl-10 w-full text-sm"
                  placeholder="Filter name, venue, city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={hideIncomplete}
                  onChange={(e) => setHideIncomplete(e.target.checked)}
                  className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-0"
                />
                Hide Incomplete
              </label>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-xs">
              <FiAlertTriangle className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {lastLogs && (
            <details className="mt-4 border-t border-white/5 pt-2" open>
              <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-300 uppercase font-bold tracking-widest flex items-center gap-2">
                <FiInfo /> Last Action Result
              </summary>
              <pre className="mt-2 p-3 bg-black/40 rounded-lg font-mono text-[11px] text-blue-400/80 overflow-x-auto">
                {JSON.stringify(lastLogs, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block mac-card overflow-hidden border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Event Name
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Venue & City
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Sale Date
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">
                    Quality
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-20 text-center text-slate-500 italic"
                    >
                      Accessing encrypted database...
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-20 text-center text-slate-500 italic"
                    >
                      Zero records found.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => {
                    const isComplete =
                      event.city !== "Unknown" && event.venue_name !== "TBA";
                    return (
                      <tr
                        key={event.id}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              event.status === "Public Sale Live"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : event.status === "Sold Out"
                                  ? "bg-purple-500/10 text-purple-400"
                                  : "bg-slate-500/10 text-slate-400"
                            }`}
                          >
                            {event.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate max-w-[240px]">
                            {event.name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-300 truncate max-w-[200px]">
                            {event.venue_name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {event.city}
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                          {event.public_sale_start
                            ? new Date(
                                event.public_sale_start,
                              ).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "--"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isComplete ? (
                            <FiCheckCircle className="inline text-emerald-500" />
                          ) : (
                            <FiAlertTriangle className="inline text-yellow-500" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={event.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/10 rounded-md inline-block text-slate-400 hover:text-blue-400 transition-colors"
                          >
                            <FiExternalLink />
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="md:hidden flex flex-col gap-4">
          {loading ? (
            <div className="p-10 text-center text-slate-500 italic">
              Refreshing mobile view...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-10 text-center text-slate-500 italic">
              Zero records found.
            </div>
          ) : (
            filteredEvents.map((event) => {
              const isComplete =
                event.city !== "Unknown" && event.venue_name !== "TBA";
              return (
                <div
                  key={event.id}
                  className="mac-card p-4 border-white/5 bg-white/[0.03] space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        event.status === "Public Sale Live"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : event.status === "Sold Out"
                            ? "bg-purple-500/10 text-purple-400"
                            : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {event.status}
                    </span>
                    <div className="flex items-center gap-3">
                      {isComplete ? (
                        <FiCheckCircle className="text-emerald-500 text-sm" />
                      ) : (
                        <FiAlertTriangle className="text-yellow-500 text-sm" />
                      )}
                      <a
                        href={event.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-blue-400"
                      >
                        <FiExternalLink />
                      </a>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm leading-tight">
                      {event.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {event.venue_name} • {event.city}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-white/5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Sale Date
                    </span>
                    <span className="text-xs tabular-nums text-slate-300">
                      {event.public_sale_start
                        ? new Date(event.public_sale_start).toLocaleDateString()
                        : "TBA"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
