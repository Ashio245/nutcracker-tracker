"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Event, getSalePhase, hasGroupSales, hasPresale } from "@/types/database";
import {
  FiExternalLink,
  FiSearch,
  FiRefreshCw,
  FiActivity,
  FiUsers,
  FiTag,
  FiClock,
  FiShoppingBag,
  FiCalendar,
  FiChevronDown,
  FiAlertCircle,
  FiMapPin,
} from "react-icons/fi";

type FilterTab = "all" | "onsale" | "presale" | "group" | "soldout" | "upcoming";

/** A venue-grouped production: one card per venue. */
interface VenueGroup {
  key: string;
  name: string;            // production name (most common among grouped events)
  venue_name: string;
  city: string | null;
  status: string;          // best status among grouped events
  source_url: string;
  performanceCount: number;
  presale_start: string | null;
  public_sale_start: string | null;
  group_discount_available: boolean;
  group_min_size: number | null;
  discount_code: string | null;
  discount_note: string | null;
  notes_raw: string | null;
  last_checked: string | null;
  isTicketmaster: boolean;
}

const STATUS_PRIORITY: Record<string, number> = {
  "Presale Live": 1,
  "Public Sale Live": 2,
  "On Sale Soon": 3,
  "Upcoming": 4,
  "Sold Out": 5,
};

/** Pick the "best" (most actionable) status from a list of events. */
function bestStatus(events: Event[]): string {
  let best = "Upcoming";
  let bestPri = 99;
  for (const e of events) {
    const p = STATUS_PRIORITY[e.status] ?? 4;
    if (p < bestPri) { bestPri = p; best = e.status; }
  }
  return best;
}

/** Group raw events into one entry per venue. */
function groupByVenue(events: Event[]): VenueGroup[] {
  const map = new Map<string, Event[]>();

  for (const e of events) {
    const venue = e.venue_name || "Unknown Venue";
    const city = e.city || "";
    const key = `${venue}|||${city}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }

  const groups: VenueGroup[] = [];
  Array.from(map.entries()).forEach(([key, evts]) => {
    // Pick the most common name
    const nameCounts: Record<string, number> = {};
    evts.forEach(e => { nameCounts[e.name] = (nameCounts[e.name] || 0) + 1; });
    const name = Object.entries(nameCounts).sort((a, b) => b[1] - a[1])[0][0];

    const status = bestStatus(evts);

    // Merge: take earliest valid presale, earliest valid public sale
    const presales = evts.map(e => e.presale_start).filter(Boolean) as string[];
    const publicSales = evts.map(e => e.public_sale_start).filter(Boolean) as string[];
    const validPresales = presales.filter(d => { const y = new Date(d).getFullYear(); return y >= 2024 && y <= 2030; });
    const validPublicSales = publicSales.filter(d => { const y = new Date(d).getFullYear(); return y >= 2024 && y <= 2030; });
    validPresales.sort();
    validPublicSales.sort();

    // Merge group sales info
    const hasGroup = evts.some(e => e.group_discount_available);
    const groupMin = evts.find(e => e.group_min_size)?.group_min_size || null;
    const discountCode = evts.find(e => e.discount_code)?.discount_code || null;
    const discountNote = evts.find(e => e.discount_note)?.discount_note || null;
    const notesRaw = evts.find(e => e.notes_raw)?.notes_raw || null;
    const lastChecked = evts.find(e => e.last_checked)?.last_checked || null;
    const sourceUrl = evts[0].source_url;
    const isTM = evts.some(e => e.source_url?.includes("ticketmaster"));

    groups.push({
      key,
      name,
      venue_name: evts[0].venue_name || "Unknown Venue",
      city: evts[0].city || null,
      status,
      source_url: sourceUrl,
      performanceCount: evts.length,
      presale_start: validPresales[0] || null,
      public_sale_start: validPublicSales[0] || null,
      group_discount_available: hasGroup,
      group_min_size: groupMin,
      discount_code: discountCode,
      discount_note: discountNote,
      notes_raw: notesRaw,
      last_checked: lastChecked,
      isTicketmaster: isTM,
    });
  });

  return groups;
}

export default function NutcrackerDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [lastLogs, setLastLogs] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [groupByLocation, setGroupByLocation] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("name", { ascending: true });

    if (!error && data) {
      setEvents(data);
      if (data.length === 0) {
        try {
          setIsRunning("auto-sync");
          const syncRes = await fetch("/api/events/sync");
          if (syncRes.ok) {
            const { data: freshData } = await supabase
              .from("events")
              .select("*")
              .order("name", { ascending: true });
            if (freshData) setEvents(freshData);
          }
        } catch (e) {
          console.error("Auto-sync failed:", e);
        } finally {
          setIsRunning(null);
        }
      }
    }
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const runAction = async (action: string) => {
    setIsRunning(action);
    setErrorMsg(null);
    setLastLogs(null);
    const endpoint = action === "discovery" ? "/api/events/sync" : "/api/monitor/run";
    try {
      const response = await fetch(endpoint, { method: action === "discovery" ? "GET" : "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Action failed");
      setLastLogs(result);
      await fetchEvents();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsRunning(null);
    }
  };

  /** All venue groups (pre-filter) */
  const allVenues = useMemo(() => groupByVenue(events), [events]);

  /** Filtered + sorted venue groups */
  const filteredVenues = useMemo(() => {
    return allVenues
      .filter((v) => {
        const q = search.toLowerCase();
        const matchesSearch =
          v.name.toLowerCase().includes(q) ||
          v.venue_name.toLowerCase().includes(q) ||
          (v.city || "").toLowerCase().includes(q);
        if (!matchesSearch) return false;

        switch (activeTab) {
          case "onsale":
            return v.status === "Public Sale Live";
          case "presale":
            return !!v.presale_start || v.status === "Presale Live";
          case "group":
            return v.group_discount_available;
          case "soldout":
            return v.status === "Sold Out";
          case "upcoming":
            return v.status === "Upcoming" || v.status === "On Sale Soon";
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const aPri = STATUS_PRIORITY[a.status] ?? 4;
        const bPri = STATUS_PRIORITY[b.status] ?? 4;
        if (aPri !== bPri) return aPri - bPri;
        return a.name.localeCompare(b.name);
      });
  }, [allVenues, search, activeTab]);

  /** Group filtered venues by state/country for easier reading */
  const groupedVenues = useMemo(() => {
    const groups: Record<string, VenueGroup[]> = {};
    filteredVenues.forEach((v) => {
      let state = "Other";
      if (v.city) {
        const parts = v.city.split(",");
        if (parts.length > 1) {
          state = parts[parts.length - 1].trim();
        } else {
          state = v.city.trim();
        }
      }
      if (!groups[state]) groups[state] = [];
      groups[state].push(v);
    });
    return groups;
  }, [filteredVenues]);

  const stats = useMemo(() => {
    const total = allVenues.length;
    const onsale = allVenues.filter((v) => v.status === "Public Sale Live").length;
    const presale = allVenues.filter((v) => !!v.presale_start || v.status === "Presale Live").length;
    const group = allVenues.filter((v) => v.group_discount_available).length;
    const soldOut = allVenues.filter((v) => v.status === "Sold Out").length;
    return { total, onsale, presale, group, soldOut };
  }, [allVenues]);

  const filterTabs: { key: FilterTab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: "all", label: "All Venues", count: stats.total, icon: <FiActivity /> },
    { key: "onsale", label: "On Sale", count: stats.onsale, icon: <FiShoppingBag /> },
    { key: "presale", label: "Pre-Sale", count: stats.presale, icon: <FiClock /> },
    { key: "group", label: "Group Sales", count: stats.group, icon: <FiUsers /> },
    { key: "soldout", label: "Sold Out", count: stats.soldOut, icon: <FiAlertCircle /> },
    { key: "upcoming", label: "Upcoming", count: stats.total - stats.onsale - stats.soldOut, icon: <FiCalendar /> },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-lg">🩰</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-main tracking-tight">
                Nutcracker Tracker
              </h1>
            </div>
            <div className="text-sm text-muted mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="pulse-dot pulse-dot-green" />
                Live Monitoring
              </span>
              <span className="text-[var(--panel-border)]">•</span>
              <span>
                Last updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => runAction("discovery")}
              disabled={!!isRunning}
              className="mac-button-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              {isRunning === "discovery" || isRunning === "auto-sync" ? (
                <FiRefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <FiSearch className="w-3 h-3" />
              )}
              {isRunning === "auto-sync" ? "Syncing…" : "Sync Events"}
            </button>
          </div>
        </header>

        {/* Error */}
        {errorMsg && (
          <div className="mac-card p-4 border-l-4" style={{ borderLeftColor: "var(--sale-soldout)" }}>
            <p className="text-xs text-main font-semibold">Error: {errorMsg}</p>
          </div>
        )}

        {/* Logs */}
        {lastLogs && (
          <div className="mac-card p-4 border-l-4" style={{ borderLeftColor: "var(--accent)" }}>
            <pre className="text-xs text-muted overflow-auto max-h-24 font-mono">
              {JSON.stringify(lastLogs, null, 2)}
            </pre>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "bg-[var(--hover-bg)] text-muted hover:text-main"
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-[var(--panel-bg)] text-muted"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search and Toggle */}
        <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
          <div className="relative flex-1 md:max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search by production, venue, or city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--panel-bg)] border border-[var(--panel-border)] text-sm text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={groupByLocation}
              onChange={(e) => setGroupByLocation(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--accent-color)] border-[var(--panel-border)]"
            />
            <span className="text-sm font-medium text-muted">Group by Location</span>
          </label>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="mac-card p-5 space-y-4">
                <div className="shimmer h-5 w-24" />
                <div className="shimmer h-6 w-3/4" />
                <div className="shimmer h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="mac-card p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--hover-bg)] flex items-center justify-center mx-auto mb-4">
              <FiSearch className="w-7 h-7 text-muted" />
            </div>
            <h3 className="text-lg font-bold text-main mb-2">No venues found</h3>
            <p className="text-sm text-muted max-w-md mx-auto">
              {search
                ? `No results matching "${search}". Try a different search term.`
                : "Click Sync Events to discover Nutcracker productions."}
            </p>
          </div>
        ) : groupByLocation ? (
          <div className="space-y-12 stagger-children">
            {Object.keys(groupedVenues)
              .sort()
              .map((state) => (
                <div key={state} className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-[var(--panel-border)]">
                    <h2 className="text-xl font-bold tracking-tight text-main">{state}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--panel-bg)] border border-[var(--panel-border)] text-xs font-semibold text-muted">
                      {groupedVenues[state].length} {groupedVenues[state].length === 1 ? 'venue' : 'venues'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedVenues[state].map((venue) => (
                      <VenueCard
                        key={venue.key}
                        venue={venue}
                        isExpanded={expandedKey === venue.key}
                        onToggle={() => setExpandedKey(expandedKey === venue.key ? null : venue.key)}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {filteredVenues.map((venue) => (
              <VenueCard
                key={venue.key}
                venue={venue}
                isExpanded={expandedKey === venue.key}
                onToggle={() => setExpandedKey(expandedKey === venue.key ? null : venue.key)}
              />
            ))}
          </div>
        )}

        {/* Results Summary */}
        {!loading && filteredVenues.length > 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-muted font-medium">
              Showing {filteredVenues.length} of {allVenues.length} venues
              {activeTab !== "all" && ` • Filtered by: ${filterTabs.find(t => t.key === activeTab)?.label}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Venue Card Component ─── */
function VenueCard({
  venue,
  isExpanded,
  onToggle,
}: {
  venue: VenueGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const phase = (() => {
    switch (venue.status) {
      case "Public Sale Live": return "onsale" as const;
      case "Presale Live": return "presale" as const;
      case "Sold Out": return "soldout" as const;
      default: return "upcoming" as const;
    }
  })();

  const statusConfig = {
    onsale: { badge: "badge-onsale", label: "On Sale", dotClass: "pulse-dot-green" },
    presale: { badge: "badge-presale", label: "Pre-Sale", dotClass: "pulse-dot-amber" },
    soldout: { badge: "badge-soldout", label: "Sold Out", dotClass: "" },
    upcoming: { badge: "badge-upcoming", label: venue.status === "On Sale Soon" ? "On Sale Soon" : "Upcoming", dotClass: "" },
  };
  const config = statusConfig[phase];

  return (
    <div className="mac-card p-5 flex flex-col gap-4 cursor-pointer group" onClick={onToggle}>
      {/* Top Row: Status badges */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge ${config.badge}`}>
            {config.dotClass && <span className={`pulse-dot ${config.dotClass}`} />}
            {config.label}
          </span>
          {venue.presale_start && phase !== "presale" && (
            <span className="badge badge-presale">
              <FiClock className="w-2.5 h-2.5" />
              Pre-Sale
            </span>
          )}
          {venue.group_discount_available && (
            <span className="badge badge-group">
              <FiUsers className="w-2.5 h-2.5" />
              Group
            </span>
          )}
        </div>
        <a
          href={venue.source_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-[var(--hover-bg)] transition-all opacity-0 group-hover:opacity-100"
        >
          <FiExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Production + Venue Info */}
      <div>
        <h3 className="font-bold text-main text-sm leading-snug group-hover:text-accent transition-colors line-clamp-2">
          {venue.name}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted mt-1.5">
          <FiMapPin className="w-3 h-3 flex-shrink-0" />
          <span className="line-clamp-1">
            {venue.venue_name}{venue.city && venue.city !== "Unknown" ? ` · ${venue.city}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          {venue.performanceCount > 1 && (
            <span className="text-[10px] text-muted bg-[var(--hover-bg)] px-1.5 py-0.5 rounded-md font-semibold">
              {venue.performanceCount} performances
            </span>
          )}
          <span className="text-[10px] text-muted opacity-60">
            {venue.isTicketmaster ? "via Ticketmaster" : "Direct from venue"}
          </span>
        </div>
      </div>

      {/* Sale Timeline */}
      <div className="border-t border-[var(--panel-border)] pt-3 space-y-2">
        {venue.presale_start && (
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "var(--presale)" }} />
              Pre-Sale Opens
            </span>
            <span className="font-semibold text-main tabular-nums">
              {formatDate(venue.presale_start)}
            </span>
          </div>
        )}
        {venue.public_sale_start && (
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "var(--sale-live)" }} />
              Public Sale
            </span>
            <span className="font-semibold text-main tabular-nums">
              {formatDate(venue.public_sale_start)}
            </span>
          </div>
        )}
        {!venue.presale_start && !venue.public_sale_start && (
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <FiCalendar className="w-3 h-3" />
            <span>Sale dates TBA</span>
          </div>
        )}
      </div>

      {/* Group Sales Info */}
      {venue.group_discount_available && (
        <div className="rounded-lg p-3 space-y-1" style={{ backgroundColor: "var(--group-sales-bg)", border: "1px solid var(--group-sales-border)" }}>
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--group-sales)" }}>
            <FiUsers className="w-3 h-3" />
            Group Sales Available
          </div>
          {venue.group_min_size && (
            <p className="text-[11px] text-muted">
              Min group size: <strong className="text-main">{venue.group_min_size} tickets</strong>
            </p>
          )}
          {venue.discount_code && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <FiTag className="w-3 h-3 text-muted" />
              <span className="text-muted">Code:</span>
              <code className="px-1.5 py-0.5 rounded bg-[var(--hover-bg)] font-mono text-accent font-bold">
                {venue.discount_code}
              </code>
            </div>
          )}
          {venue.discount_note && (
            <p className="text-[11px] text-muted leading-relaxed">{venue.discount_note}</p>
          )}
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-[var(--panel-border)] pt-3 space-y-3 animate-fade-in-up">
          {venue.notes_raw && (
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Notes</p>
              <p className="text-xs text-main leading-relaxed">{venue.notes_raw}</p>
            </div>
          )}
          {venue.last_checked && (
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">Last Checked</p>
              <p className="text-xs text-main">{formatDate(venue.last_checked)}</p>
            </div>
          )}
          <a
            href={venue.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mac-button-primary w-full py-2 text-xs mt-1"
          >
            <FiExternalLink className="w-3 h-3 mr-1.5" />
            View Tickets
          </a>
        </div>
      )}

      {/* Expand indicator */}
      <div className="flex items-center justify-center">
        <FiChevronDown
          className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const yr = d.getFullYear();
    if (yr < 2024 || yr > 2030) return "TBA";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
