"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto space-y-20">
        {/* Hero Section */}
        <section className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-[12px] font-bold tracking-widest uppercase mb-4">
            <span className="pulse-dot pulse-dot-green" />
            <span className="text-accent">Live Tracking</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-main leading-[1.1]">
            Never Miss a <br />
            <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
              Nutcracker Sale.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            Track every Nutcracker ballet performance. Get notified when tickets
            go on sale, pre-sale opens, or group discounts become available.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link
              href="/nutcracker"
              className="mac-button-primary h-12 px-10 text-base shadow-sm"
            >
              Open Dashboard
            </Link>
            <Link
              href="/admin/scraper"
              className="mac-button-secondary h-12 px-10 text-base"
            >
              Add an Event
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
          {[
            {
              title: "On-Sale Alerts",
              desc: "Know exactly when tickets transition from upcoming to on-sale. Track public sale dates and presale windows in real time.",
              icon: "M13 10V3L4 14h7v7l9-11h-7z",
              badge: "badge-onsale",
              badgeText: "ON SALE",
            },
            {
              title: "Pre-Sale Tracking",
              desc: "Stay ahead of the crowd. Monitor presale dates, access codes, and early-bird windows before general availability.",
              icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
              badge: "badge-presale",
              badgeText: "PRE-SALE",
            },
            {
              title: "Group Discounts",
              desc: "Find group sales across all venues. See minimum sizes, discount codes, and special group pricing instantly.",
              icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
              badge: "badge-group",
              badgeText: "GROUP",
            },
          ].map((feature, i) => (
            <div key={i} className="mac-card p-8 space-y-4 group">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--accent-color)] text-white">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={feature.icon}
                    />
                  </svg>
                </div>
                <span className={`badge ${feature.badge}`}>
                  {feature.badgeText}
                </span>
              </div>
              <h3 className="text-lg font-bold text-main group-hover:text-accent transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className="mac-card p-10 md:p-14">
          <h2 className="text-2xl font-bold text-main text-center mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Discover",
                desc: "Our engine scans Ticketmaster, ballet company sites, and directories to find every Nutcracker performance.",
              },
              {
                step: "02",
                title: "Monitor",
                desc: "Events are checked regularly for status changes — from upcoming to presale to on-sale to sold out.",
              },
              {
                step: "03",
                title: "Act",
                desc: "See group discounts, presale codes, and sale dates at a glance. Click through to buy before it's too late.",
              },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 items-center justify-center text-accent font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="text-base font-bold text-main">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-12 border-t border-[var(--panel-border)] text-center">
          <p className="text-xs font-medium text-muted tracking-widest uppercase">
            Nutcracker Tracker &bull; Sale Intelligence
          </p>
        </footer>
      </div>
    </main>
  );
}
