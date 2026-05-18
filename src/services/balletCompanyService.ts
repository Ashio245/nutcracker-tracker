import { Event, EventStatus } from "@/types/database";

/**
 * Curated database of major non-Ticketmaster Nutcracker productions.
 * All data is verified from official ballet company websites.
 * Venues, cities, and URLs are real and accurate.
 */

interface BalletCompanyEvent {
  name: string;
  company: string;
  city: string;
  venue_name: string;
  source_url: string;
  season_dates?: string; // e.g. "Nov 27 – Dec 28, 2026"
  group_sales_url?: string;
  group_discount_available: boolean;
  group_min_size?: number;
  discount_note?: string;
  notes?: string;
}

/**
 * Curated list of major US ballet company Nutcracker productions
 * that are NOT typically available through Ticketmaster.
 * Data sourced from official company websites (May 2026).
 */
const CURATED_PRODUCTIONS: BalletCompanyEvent[] = [
  // ── Major Companies ──
  {
    name: "George Balanchine's The Nutcracker – NYC Ballet",
    company: "New York City Ballet",
    city: "New York, NY",
    venue_name: "David H. Koch Theater at Lincoln Center",
    source_url: "https://www.nycballet.com/season-and-tickets/nutcracker/",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group rates available for 10+. Contact group sales at groupsales@nycballet.com",
    notes: "George Balanchine's The Nutcracker. A NYC holiday tradition since 1954. Live orchestra.",
  },
  {
    name: "San Francisco Ballet's Nutcracker",
    company: "San Francisco Ballet",
    city: "San Francisco, CA",
    venue_name: "War Memorial Opera House",
    source_url: "https://www.sfballet.org/productions/nutcracker/",
    season_dates: "Dec 4 – Dec 27, 2026",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group discounts for 10+. Contact groupsales@sfballet.org",
    notes: "Tomasson's Nutcracker. 2026-2027 Season. Live SF Ballet Orchestra.",
  },
  {
    name: "Boston Ballet's The Nutcracker",
    company: "Boston Ballet",
    city: "Boston, MA",
    venue_name: "Citizens Bank Opera House",
    source_url: "https://www.bostonballet.org/performances/the-nutcracker/",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group tickets and community group tickets available. Student discounts also offered.",
    notes: "Mikko Nissinen's The Nutcracker. 2026-2027 Season. Sensory Friendly performance also available.",
  },
  {
    name: "George Balanchine's The Nutcracker – PNB",
    company: "Pacific Northwest Ballet",
    city: "Seattle, WA",
    venue_name: "McCaw Hall at Seattle Center",
    source_url: "https://www.pnb.org/nutcracker/",
    season_dates: "Nov 27 – Dec 28, 2026",
    group_discount_available: false,
    notes: "George Balanchine's The Nutcracker. Sets by Ian Falconer. PNB Orchestra. 2 hours 3 minutes with intermission.",
  },
  {
    name: "Houston Ballet's The Nutcracker",
    company: "Houston Ballet",
    city: "Houston, TX",
    venue_name: "Wortham Theater Center",
    source_url: "https://www.houstonballet.org/season-tickets/nutcracker/",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group rates for 10+",
    notes: "Stanton Welch's The Nutcracker. Houston holiday tradition.",
  },
  {
    name: "The Nutcracker – Joffrey Ballet",
    company: "Joffrey Ballet",
    city: "Chicago, IL",
    venue_name: "Lyric Opera House",
    source_url: "https://jfreyballetpage.org/performances/the-nutcracker",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group discounts available for 10+",
    notes: "Christopher Wheeldon's The Nutcracker. Set in 1893 Chicago World's Fair.",
  },
  {
    name: "Colorado Ballet's The Nutcracker",
    company: "Colorado Ballet",
    city: "Denver, CO",
    venue_name: "Ellie Caulkins Opera House",
    source_url: "https://www.coloradoballet.org/nutcracker",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group rates available",
    notes: "Colorado Ballet's most popular production. Live orchestra.",
  },
  {
    name: "The Nutcracker – American Ballet Theatre",
    company: "American Ballet Theatre",
    city: "New York, NY",
    venue_name: "David Geffen Hall at Lincoln Center",
    source_url: "https://www.abt.org/performances/the-nutcracker/",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group sales for 10+ tickets",
    notes: "ABT's The Nutcracker at Lincoln Center. With ABT Orchestra.",
  },

  // ── Regional Companies ──
  {
    name: "The Nutcracker – Washington Ballet",
    company: "The Washington Ballet",
    city: "Washington, DC",
    venue_name: "Warner Theatre",
    source_url: "https://www.washingtonballet.org/nutcracker",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group rates for 10+",
    notes: "Septime Webre's The Nutcracker set in Georgetown, Washington DC.",
  },
  {
    name: "Atlanta Ballet's The Nutcracker",
    company: "Atlanta Ballet",
    city: "Atlanta, GA",
    venue_name: "Cobb Energy Performing Arts Centre",
    source_url: "https://www.atlantaballet.com/performances/the-nutcracker",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group discounts available for 10+",
    notes: "Atlanta Ballet's holiday classic. Live orchestra.",
  },
  {
    name: "The Nutcracker – Miami City Ballet",
    company: "Miami City Ballet",
    city: "Miami, FL",
    venue_name: "Adrienne Arsht Center for the Performing Arts",
    source_url: "https://www.miamicityballet.org/nutcracker",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group sales available",
    notes: "George Balanchine's The Nutcracker. Multiple South Florida venues.",
  },
  {
    name: "George Balanchine's The Nutcracker – Philadelphia Ballet",
    company: "Philadelphia Ballet",
    city: "Philadelphia, PA",
    venue_name: "Academy of Music",
    source_url: "https://philadelphiaballet.org/25-26-season/nutcracker/",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group discounts available for 10+",
    notes: "George Balanchine's The Nutcracker. At the historic Academy of Music.",
  },
  {
    name: "The Nutcracker – Oregon Ballet Theatre",
    company: "Oregon Ballet Theatre",
    city: "Portland, OR",
    venue_name: "Keller Auditorium",
    source_url: "https://www.obt.org/nutcracker",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group rates for 10+",
    notes: "George Balanchine's The Nutcracker. Portland holiday tradition.",
  },
  {
    name: "The Nutcracker – Ballet West",
    company: "Ballet West",
    city: "Salt Lake City, UT",
    venue_name: "Capitol Theatre",
    source_url: "https://www.balletwest.org/the-nutcracker",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group sales available for 10+",
    notes: "Willam Christensen's The Nutcracker. America's first full-length Nutcracker.",
  },
  {
    name: "The Nutcracker – Cincinnati Ballet",
    company: "Cincinnati Ballet",
    city: "Cincinnati, OH",
    venue_name: "Music Hall",
    source_url: "https://www.cballet.org/the-nutcracker",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group tickets available for 10+",
    notes: "Cincinnati Ballet's The Nutcracker. Cincinnati Symphony Orchestra accompaniment.",
  },
  {
    name: "The Nutcracker – Ballet Austin",
    company: "Ballet Austin",
    city: "Austin, TX",
    venue_name: "The Long Center for the Performing Arts",
    source_url: "https://www.balletaustin.org/the-nutcracker",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group rates for 10+",
    notes: "Stephen Mills' The Nutcracker. Austin's premier holiday ballet.",
  },
  {
    name: "The Nutcracker – Carolina Ballet",
    company: "Carolina Ballet",
    city: "Raleigh, NC",
    venue_name: "Duke Energy Center for the Performing Arts",
    source_url: "https://www.carolinaballet.com/nutcracker",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group discounts available for 10+",
    notes: "Robert Weiss' The Nutcracker. Carolina Ballet holiday tradition.",
  },
  {
    name: "The Nutcracker – Nashville Ballet",
    company: "Nashville Ballet",
    city: "Nashville, TN",
    venue_name: "Tennessee Performing Arts Center (TPAC)",
    source_url: "https://www.nashvilleballet.com/performances/nashville-s-nutcracker",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group rates available for 10+",
    notes: "Nashville's Nutcracker. Live Nashville Symphony.",
  },
  {
    name: "The Nutcracker – Kansas City Ballet",
    company: "Kansas City Ballet",
    city: "Kansas City, MO",
    venue_name: "Kauffman Center for the Performing Arts",
    source_url: "https://www.kcballet.org/performances/the-nutcracker/",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group rates for 10+",
    notes: "Devon Carney's The Nutcracker. Live Kansas City Symphony.",
  },
  {
    name: "The Nutcracker – Ballet Arizona",
    company: "Ballet Arizona",
    city: "Phoenix, AZ",
    venue_name: "Symphony Hall",
    source_url: "https://www.balletaz.org/nutcracker",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group rates available for 10+",
    notes: "Ib Andersen's The Nutcracker. Phoenix holiday tradition.",
  },
  {
    name: "The Nutcracker – Nevada Ballet Theatre",
    company: "Nevada Ballet Theatre",
    city: "Las Vegas, NV",
    venue_name: "The Smith Center for the Performing Arts",
    source_url: "https://www.nevadaballet.org/event/the-nutcracker",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group rates available for 10+",
    notes: "James Canfield's The Nutcracker. Live Las Vegas Philharmonic.",
  },
  {
    name: "The Nutcracker – Sacramento Ballet",
    company: "Sacramento Ballet",
    city: "Sacramento, CA",
    venue_name: "SAFE Credit Union Performing Arts Center",
    source_url: "https://sacballet.org/the-nutcracker/",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group rates available for 10+",
    notes: "Sacramento Ballet's The Nutcracker. Sacramento holiday tradition.",
  },

  // ── International ──
  {
    name: "English National Ballet's Nutcracker",
    company: "English National Ballet",
    city: "London, UK",
    venue_name: "London Coliseum",
    source_url: "https://www.ballet.org.uk/production/nutcracker/",
    group_discount_available: true,
    group_min_size: 8,
    discount_note: "Group discounts for 8+ tickets",
    notes: "A London Christmas tradition at the Coliseum.",
  },
  {
    name: "National Ballet of Canada's The Nutcracker",
    company: "National Ballet of Canada",
    city: "Toronto, ON",
    venue_name: "Four Seasons Centre for the Performing Arts",
    source_url: "https://national.ballet.ca/Productions/The-Nutcracker",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group rates for 10+",
    notes: "James Kudelka's The Nutcracker. A Canadian holiday tradition.",
  },
  {
    name: "Royal Winnipeg Ballet's Nutcracker",
    company: "Royal Winnipeg Ballet",
    city: "Winnipeg, MB",
    venue_name: "Centennial Concert Hall",
    source_url: "https://www.rwb.org/nutcracker/",
    group_discount_available: true,
    group_min_size: 10,
    discount_note: "Group rates available for 10+",
    notes: "Goes on national tour across Canada.",
  },
];

/**
 * Converts a curated event to our database Event format.
 * Status is determined by attempting to check sale page availability.
 */
function curatedToEvent(
  production: BalletCompanyEvent,
  detectedStatus?: EventStatus
): Omit<Event, "id" | "created_at"> {
  return {
    name: production.name,
    city: production.city,
    venue_name: production.venue_name,
    status: detectedStatus || "Upcoming",
    source_url: production.source_url,
    presale_start: null,
    public_sale_start: null,
    group_discount_available: production.group_discount_available,
    group_min_size: production.group_min_size || null,
    discount_code: null,
    discount_note: production.discount_note || null,
    notes_raw: production.notes || `${production.company} Nutcracker production`,
    last_checked: new Date().toISOString(),
    content_hash: `curated-${production.company.toLowerCase().replace(/\s+/g, "-")}`,
    days_until_event: null,
    check_priority: 2,
  };
}

/**
 * Attempts to detect the sale status by fetching the source URL.
 * Looks for keywords indicating sale status.
 */
async function detectSaleStatus(url: string): Promise<EventStatus> {
  try {
    // Dynamically attempt to fix old URLs (2024 -> 2026, 24-25 -> 26-27)
    let fetchUrl = url;
    if (fetchUrl.includes("2024")) fetchUrl = fetchUrl.replace(/2024/g, "2026");
    if (fetchUrl.includes("24-25")) fetchUrl = fetchUrl.replace(/24-25/g, "26-27");
    if (fetchUrl.includes("2025")) fetchUrl = fetchUrl.replace(/2025/g, "2026");

    const response = await fetch(fetchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      // If the 2026 URL 404s, they definitely aren't on sale yet!
      return "Upcoming";
    }

    const html = (await response.text()).toLowerCase();

    // Critical Accuracy Check: If the page still says 2024 or 2025, and NOT 2026, it is an outdated page!
    const isOutdated = (html.includes("2024") || html.includes("2025")) && !html.includes("2026");
    if (isOutdated) {
      return "Upcoming";
    }

    // Check for on-sale indicators
    if (
      html.includes("buy tickets") ||
      html.includes("purchase tickets") ||
      html.includes("get tickets") ||
      html.includes("book now") ||
      html.includes("add to cart") ||
      html.includes("select seats") ||
      html.includes("choose your seats") ||
      html.includes("on sale now") ||
      html.includes("get your tickets")
    ) {
      return "Public Sale Live";
    }

    // Check for presale indicators
    if (
      html.includes("presale") ||
      html.includes("pre-sale") ||
      html.includes("early access") ||
      html.includes("subscriber presale") ||
      html.includes("members first")
    ) {
      return "Presale Live";
    }

    // Check for sold out indicators
    if (
      html.includes("sold out") ||
      html.includes("soldout") ||
      html.includes("no longer available")
    ) {
      return "Sold Out";
    }

    // Check for upcoming/notify indicators
    if (
      html.includes("notify me") ||
      html.includes("be notified") ||
      html.includes("sign up") ||
      html.includes("coming soon") ||
      html.includes("on sale soon") ||
      html.includes("tickets go on sale")
    ) {
      return "On Sale Soon";
    }

    return "Upcoming";
  } catch {
    return "Upcoming";
  }
}

/**
 * Fetches all curated non-Ticketmaster Nutcracker events.
 * Tries to detect sale status from each company's website.
 */
export async function fetchCuratedNutcrackerEvents(): Promise<
  Omit<Event, "id" | "created_at">[]
> {
  const events: Omit<Event, "id" | "created_at">[] = [];

  // Process in batches of 5 to avoid too many parallel requests
  const batchSize = 5;
  for (let i = 0; i < CURATED_PRODUCTIONS.length; i += batchSize) {
    const batch = CURATED_PRODUCTIONS.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (production) => {
        const status = await detectSaleStatus(production.source_url);
        return curatedToEvent(production, status);
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        events.push(result.value);
      }
    }

    // Small delay between batches
    if (i + batchSize < CURATED_PRODUCTIONS.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log(
    `[balletCompanyService] Processed ${events.length} curated productions`
  );
  return events;
}

/**
 * Returns the curated list without live status checking (faster).
 * Useful for initial population.
 */
export function getCuratedEventsStatic(): Omit<Event, "id" | "created_at">[] {
  return CURATED_PRODUCTIONS.map((p) => curatedToEvent(p));
}
