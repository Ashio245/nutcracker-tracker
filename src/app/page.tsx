import { getEvents } from "@/services/eventService";
import { Event } from "@/types/database";
import NewsletterForm from "@/components/NewsletterForm";
import Link from "next/link";

/**
 * Deterministic date formatter to prevent hydration mismatches.
 * Uses UTC methods to ensure the same string is rendered on Server and Client.
 */
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // Parse params with fallbacks
  const currentStatus =
    typeof params.status === "string" ? params.status : "all";
  const currentSort = typeof params.sort === "string" ? params.sort : "newest";

  let events: Event[] = [];
  let errorLoading = false;

  try {
    events = await getEvents(currentStatus, currentSort);
  } catch (error) {
    console.error(error);
    errorLoading = true;
  }

  // Helper to generate links that preserve existing params
  const getLink = (status: string, sort: string) => {
    const search = new URLSearchParams();
    if (status !== "all") search.set("status", status);
    if (sort !== "newest") search.set("sort", sort);
    const queryString = search.toString();
    return queryString ? `/?${queryString}` : "/";
  };

  const statusOptions = [
    "all",
    "Presale Live",
    "Public Sale Live",
    "Group Discount Available",
    "Sold Out",
    "Upcoming",
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Hero Section */}
        <section className="py-20 border-b border-gray-100 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Nutcracker Tracker v1
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Tracking Nutcracker event presales, public sales, discounts, and
            group sales. Stay updated on performance dates and ticket
            availability in one place.
          </p>
        </section>

        {/* 2. Status Section */}
        <section className="py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-widest text-gray-400 mb-4">
                Current Event Statuses
              </h2>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="text-gray-400 mr-2">Status:</span>
                {statusOptions.map((opt) => (
                  <Link
                    key={opt}
                    href={getLink(opt, currentSort)}
                    className={`${
                      currentStatus === opt
                        ? "font-bold text-gray-900 underline"
                        : "text-blue-600 hover:text-blue-800"
                    }`}
                  >
                    {opt === "all" ? "All" : opt}
                  </Link>
                ))}
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex gap-4 text-sm whitespace-nowrap">
              <span className="text-gray-400">Sort:</span>
              <Link
                href={getLink(currentStatus, "newest")}
                className={`${
                  currentSort === "newest"
                    ? "font-bold text-gray-900 underline"
                    : "text-blue-600 hover:text-blue-800"
                }`}
              >
                Newest
              </Link>
              <Link
                href={getLink(currentStatus, "alphabetical")}
                className={`${
                  currentSort === "alphabetical"
                    ? "font-bold text-gray-900 underline"
                    : "text-blue-600 hover:text-blue-800"
                }`}
              >
                A-Z
              </Link>
            </div>
          </div>

          {errorLoading ? (
            <div className="p-12 text-center bg-red-50 border border-red-100 rounded-xl">
              <p className="text-red-600 font-medium">
                Unable to load events right now.
              </p>
              <p className="text-red-400 text-sm mt-1">
                Please try refreshing the page later.
              </p>
            </div>
          ) : (
            <>
              {events.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="text-gray-400">
                    No events matching these criteria found.
                  </p>
                </div>
              ) : (
                <div className="grid gap-8 md:grid-cols-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-col p-6 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-xl leading-tight mb-2">
                          {event.name}
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                          {event.venue_name} • {event.city}
                        </p>

                        <div
                          className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-4 ${
                            event.status === "Public Sale Live"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {event.status}
                        </div>

                        {/* v2 Enhanced Ticketing Info (Deterministic Rendering) */}
                        <div className="space-y-1 mb-4">
                          {event.presale_start && (
                            <p className="text-xs text-gray-600">
                              <span className="font-semibold text-gray-400 uppercase tracking-tighter mr-1">
                                Presale:
                              </span>
                              {formatDate(event.presale_start)}
                            </p>
                          )}
                          {event.public_sale_start && (
                            <p className="text-xs text-gray-600">
                              <span className="font-semibold text-gray-400 uppercase tracking-tighter mr-1">
                                Public:
                              </span>
                              {formatDate(event.public_sale_start)}
                            </p>
                          )}
                          {event.group_discount_available && (
                            <p className="text-xs text-blue-600 font-medium">
                              Group Discount Available{" "}
                              {event.group_min_size
                                ? `(Min: ${event.group_min_size})`
                                : ""}
                            </p>
                          )}
                          {event.discount_code && (
                            <p className="text-xs bg-yellow-50 text-yellow-800 px-2 py-1 rounded inline-block mt-1">
                              Code:{" "}
                              <span className="font-mono font-bold">
                                {event.discount_code}
                              </span>
                            </p>
                          )}
                        </div>

                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                          Ticket Info
                        </p>
                        <p className="text-sm text-gray-600 italic">
                          {event.discount_note || "Standard ticketing details"}
                        </p>
                      </div>

                      {event.source_url && (
                        <div className="mt-6 pt-4 border-t border-gray-50">
                          <a
                            href={event.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800"
                          >
                            View Tickets →
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* 3. Newsletter Section */}
        <section className="py-16 bg-gray-50 border-y border-gray-100 text-center rounded-xl overflow-hidden">
          <h2 className="text-2xl font-bold mb-2">Newsletter Signup</h2>
          <p className="text-gray-500 mb-8">
            Soon you’ll be able to get email alerts when presales start,
            discounts drop, or group offers go live. For now, use this page to
            check current Nutcracker events.
          </p>
          <NewsletterForm />
        </section>

        {/* 4. Footer Note */}
        <footer className="py-10 text-center text-gray-400 text-xs uppercase tracking-tighter">
          <p>© 2026 Nutcracker Tracker v1 • Free and Open Source</p>
        </footer>
      </main>
    </div>
  );
}
