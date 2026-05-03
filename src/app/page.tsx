"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto space-y-20">
        {/* Hero Section */}
        <section className="text-center space-y-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full glass text-[12px] font-bold tracking-widest text-accent uppercase mb-4">
            Intelligence Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-main leading-[1.1]">
            Track the Magic. <br />
            <span className="opacity-40">Automate the Hunt.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            A refined discovery engine for monitoring Nutcracker ballet
            performances. Identify venues, track ticket availability, and manage
            metadata with precision.
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
              Manual Ingestion
            </Link>
          </div>
        </section>

        {/* Concise Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Autonomous Discovery",
              desc: "Proactive web crawling identifies new performances across ballet directories.",
              icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
            },
            {
              title: "Change Monitoring",
              desc: "Priority-based monitoring detects ticket status changes and metadata updates.",
              icon: "M13 10V3L4 14h7v7l9-11h-7z",
            },
            {
              title: "Metadata Ingestion",
              desc: "Deep recursive parsing of JSON-LD for venue, city, and performance dates.",
              icon: "M4 7v10c0 2.21 4.477 4 10 4s10-1.79 10-4V7M4 7c0 2.21 4.477 4 10 4s10-1.79 10-4M4 7c0-2.21 4.477-4 10-4s10 1.79 10 4m0 5c0 2.21-4.477 4-10 4s-10-1.79-10-4",
            },
          ].map((feature, i) => (
            <div key={i} className="mac-card p-8 space-y-4">
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
              <h3 className="text-lg font-bold text-main">{feature.title}</h3>
              <p className="text-sm text-muted leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Minimal Footer */}
        <footer className="pt-12 border-t border-[var(--panel-border)] text-center">
          <p className="text-xs font-medium text-muted tracking-widest uppercase">
            DiscoveryService V3 &bull; Nutcracker AI
          </p>
        </footer>
      </div>
    </main>
  );
}
