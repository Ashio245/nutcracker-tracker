import { Event, EventStatus } from "@/types/database";

/**
 * Venues from the user's curated Google Sheet.
 * Each entry is a real Nutcracker venue with the company's ticket link.
 */

interface SheetVenue {
  venue_name: string;
  source_url: string;
  city?: string;
  company?: string;
}

/** Parsed from the user's Google Sheet (May 2026). */
const SHEET_VENUES: SheetVenue[] = [
  { venue_name: "Lyric Opera House", source_url: "https://joffrey.org/performances-and-tickets/24-25-season/the-nutcracker-3/", city: "Chicago, IL", company: "Joffrey Ballet" },
  { venue_name: "Bass Performance Hall", source_url: "https://texasballettheater.org/performance/nutcracker-2024/", city: "Fort Worth, TX", company: "Texas Ballet Theater" },
  { venue_name: "Winspear Opera House", source_url: "https://texasballettheater.org/performance/nutcracker-2024/", city: "Dallas, TX", company: "Texas Ballet Theater" },
  { venue_name: "Keller Auditorium", source_url: "https://www.obt.org/24-25-season/nutcracker-2024/", city: "Portland, OR", company: "Oregon Ballet Theatre" },
  { venue_name: "Adrienne Arsht Center", source_url: "https://www.miamicityballet.org/nutcracker", city: "Miami, FL", company: "Miami City Ballet" },
  { venue_name: "War Memorial Opera House", source_url: "https://www.sfballet.org/", city: "San Francisco, CA", company: "San Francisco Ballet" },
  { venue_name: "David H. Koch Theater", source_url: "https://www.nycballet.com/", city: "New York, NY", company: "New York City Ballet" },
  { venue_name: "Ohio Theatre", source_url: "https://www.balletmet.org/performances/the-nutcracker/", city: "Columbus, OH", company: "BalletMet" },
  { venue_name: "Symphony Hall", source_url: "https://balletaz.org/performance/the-nutcracker/2024-12-06/", city: "Phoenix, AZ", company: "Ballet Arizona" },
  { venue_name: "Cobb Energy Centre", source_url: "https://www.atlantaballet.com/performances", city: "Atlanta, GA", company: "Atlanta Ballet" },
  { venue_name: "Ellie Caulkins Opera House", source_url: "https://tickets.coloradoballet.org/events", city: "Denver, CO", company: "Colorado Ballet" },
  { venue_name: "Music Hall", source_url: "https://cballet.org/performances/the-nutcracker-presented-by-sheakley-family/", city: "Cincinnati, OH", company: "Cincinnati Ballet" },
  { venue_name: "Raleigh Memorial Auditorium", source_url: "https://www.carolinaballet.com/single-tickets", city: "Raleigh, NC", company: "Carolina Ballet" },
  { venue_name: "Citizens Bank Opera House", source_url: "https://www.bostonballet.org/performances/the-nutcracker/", city: "Boston, MA", company: "Boston Ballet" },
  { venue_name: "Muriel Kauffman Theatre", source_url: "https://kcballet.org/events/the-nutcracker/", city: "Kansas City, MO", company: "Kansas City Ballet" },
  { venue_name: "Whitney Hall", source_url: "https://www.louisvilleballet.org/holidaymagic/", city: "Louisville, KY", company: "Louisville Ballet" },
  { venue_name: "Reynolds Hall", source_url: "https://nevadaballet.org/performances/the-nutcracker/", city: "Las Vegas, NV", company: "Nevada Ballet Theatre" },
  { venue_name: "Steinmetz Hall", source_url: "https://orlandoballet.org/", city: "Orlando, FL", company: "Orlando Ballet" },
  { venue_name: "Orpheum Theater", source_url: "https://amballet.org/", city: "Omaha, NE", company: "American Midwest Ballet" },
  { venue_name: "Civic Center Music Hall", source_url: "https://www.okcballet.org/performance/the-nutcracker/", city: "Oklahoma City, OK", company: "OKC Ballet" },
  { venue_name: "Carpenter Theatre", source_url: "https://richmondballet.com/", city: "Richmond, VA", company: "Richmond Ballet" },
  { venue_name: "Tobin Center for the Performing Arts", source_url: "https://balletsanantonio.org/", city: "San Antonio, TX", company: "Ballet San Antonio" },
  { venue_name: "Pantages Theater", source_url: "https://www.tacomacityballet.com/", city: "Tacoma, WA", company: "Tacoma City Ballet" },
  { venue_name: "Chapman Music Hall", source_url: "https://tulsaballet.org/", city: "Tulsa, OK", company: "Tulsa Ballet" },
  { venue_name: "Valentine Theatre", source_url: "https://www.artstoledo.com/toledoballet/", city: "Toledo, OH", company: "Toledo Ballet" },
  { venue_name: "Uihlein Hall", source_url: "https://milwaukeeballet.org/The-Nutcracker", city: "Milwaukee, WI", company: "Milwaukee Ballet" },
  { venue_name: "Long Center for the Performing Arts", source_url: "https://balletaustin.org/performances/seasontickets/", city: "Austin, TX", company: "Ballet Austin" },
  { venue_name: "Tucson Music Hall", source_url: "https://ballettucson.org/", city: "Tucson, AZ", company: "Ballet Tucson" },
  { venue_name: "McCaw Hall", source_url: "https://www.pnb.org/nutcracker/", city: "Seattle, WA", company: "Pacific Northwest Ballet" },
  { venue_name: "Modell Lyric", source_url: "https://www.balletmaryland.org/24-25-season", city: "Baltimore, MD", company: "Ballet Maryland" },
  { venue_name: "Academy of Music", source_url: "https://philadelphiaballet.org/", city: "Philadelphia, PA", company: "Philadelphia Ballet" },
  { venue_name: "Brown Theater at Wortham Center", source_url: "https://www.houstonballet.org/seasontickets/pdps/2023-2024/the-nutcracker/", city: "Houston, TX", company: "Houston Ballet" },
  { venue_name: "Arizona Financial Theatre", source_url: "https://www.phoenixballet.org/", city: "Phoenix, AZ", company: "Phoenix Ballet" },
  { venue_name: "Benedum Center", source_url: "https://pbt.org/performances/the-nutcracker-2024/", city: "Pittsburgh, PA", company: "Pittsburgh Ballet Theatre" },
  { venue_name: "BJCC Concert Hall", source_url: "https://alabamaballet.org/", city: "Birmingham, AL", company: "Alabama Ballet" },
  { venue_name: "State Theatre", source_url: "https://www.cleveballet.org/2024-2025-season", city: "Cleveland, OH", company: "Cleveland Ballet" },
  { venue_name: "Jackson Hall TPAC", source_url: "https://www.nashvilleballet.com/nashvilles-nutcracker", city: "Nashville, TN", company: "Nashville Ballet" },
  { venue_name: "Community Center Theater", source_url: "https://www.sacballet.org/", city: "Sacramento, CA", company: "Sacramento Ballet" },
  { venue_name: "Irvine Barclay Theatre", source_url: "https://www.thebarclay.org/Online/default.asp?BOparam::WScontent::loadArticle::permalink=nutcracker2026&BOparam::WScontent::loadArticle::context_id=", city: "Irvine, CA", company: "Festival Ballet Theatre" },
  { venue_name: "Overture Center for the Arts", source_url: "https://www.madisonballet.org/performances", city: "Madison, WI", company: "Madison Ballet" },
  { venue_name: "Segerstrom Center for the Arts", source_url: "https://www.scfta.org/shows-events", city: "Costa Mesa, CA", company: "American Ballet Theatre" },
  { venue_name: "Moody Performance Hall", source_url: "https://www.avantchamberballet.org/nutcracker", city: "Dallas, TX", company: "Avant Chamber Ballet" },
  { venue_name: "Robinson Center Music Hall", source_url: "https://www.balletarkansas.org/", city: "Little Rock, AR", company: "Ballet Arkansas" },
  { venue_name: "Buddy Holly Hall", source_url: "https://balletlubbock.org/performance-archive/the-nutcracker/", city: "Lubbock, TX", company: "Ballet Lubbock" },
  { venue_name: "Twichell Auditorium", source_url: "https://www.balletspartanburg.org/", city: "Spartanburg, SC", company: "Ballet Spartanburg" },
  { venue_name: "Janet Quinney Lawson Capitol Theatre", source_url: "https://www.balletwest.org/events/detail/willam-christensens-the-nutcracker", city: "Salt Lake City, UT", company: "Ballet West" },
  { venue_name: "Shea's Buffalo Theatre", source_url: "https://www.sheas.org/performances/", city: "Buffalo, NY", company: "Shea's Performing Arts" },
  { venue_name: "Whitaker Center", source_url: "https://cpyb.org/george-balanchines-the-nutcracker/", city: "Harrisburg, PA", company: "Central PA Youth Ballet" },
  { venue_name: "Belk Theater", source_url: "https://charlotteballet.org/", city: "Charlotte, NC", company: "Charlotte Ballet" },
  { venue_name: "Harris Theater", source_url: "https://www.harristheaterchicago.org/upcoming-events", city: "Chicago, IL", company: "Ballet Chicago" },
  { venue_name: "Martin Luther King Jr. Performing Arts Center", source_url: "https://www.charlottesvilleballet.org/", city: "Charlottesville, VA", company: "Charlottesville Ballet" },
  { venue_name: "Koger Center for the Arts", source_url: "https://columbiacityballet.com/tickets-events/", city: "Columbia, SC", company: "Columbia City Ballet" },
  { venue_name: "Schuster Center", source_url: "https://daytonperformingarts.org/production/nutcracker/", city: "Dayton, OH", company: "Dayton Ballet" },
  { venue_name: "Hult Center for the Performing Arts", source_url: "https://eugeneballet.org/performances/nutcracker/", city: "Eugene, OR", company: "Eugene Ballet" },
  { venue_name: "Veterans Memorial Auditorium", source_url: "https://www.thevetsri.com/events/detail/the-nutcracker-23", city: "Providence, RI", company: "Festival Ballet Providence" },
  { venue_name: "The Grand Opera House", source_url: "https://www.firststateballet.org/", city: "Wilmington, DE", company: "First State Ballet" },
  { venue_name: "San Diego Civic Theatre", source_url: "https://www.goldenstateballet.org/nutcracker", city: "San Diego, CA", company: "Golden State Ballet" },
  { venue_name: "DeVos Performance Hall", source_url: "https://grballet.com/24-25-season/", city: "Grand Rapids, MI", company: "Grand Rapids Ballet" },
  { venue_name: "Colonial Theater", source_url: "https://balletidaho.org/", city: "Boise, ID", company: "Ballet Idaho" },
  { venue_name: "Clowes Memorial Hall", source_url: "https://www.indyballet.org/", city: "Indianapolis, IN", company: "Indianapolis Ballet" },
  { venue_name: "Peace Concert Hall", source_url: "https://www.internationalballetsc.org/", city: "Greenville, SC", company: "International Ballet" },
  { venue_name: "Lexington Opera House", source_url: "https://www.lexingtonballet.org/performances/", city: "Lexington, KY", company: "Lexington Ballet" },
  { venue_name: "Dolby Theatre", source_url: "https://www.losangelesballet.org/the-nutcracker", city: "Los Angeles, CA", company: "Los Angeles Ballet" },
  { venue_name: "Macomb Center for the Performing Arts", source_url: "https://www.macombballet.org/the-nutcracker", city: "Clinton Township, MI", company: "Macomb Ballet" },
  { venue_name: "Merrill Auditorium", source_url: "https://www.mainestateballet.org/", city: "Portland, ME", company: "Maine State Ballet" },
  { venue_name: "Hylton Performing Arts Center", source_url: "https://manassasballet.org/season/the-nutcracker/", city: "Manassas, VA", company: "Manassas Ballet" },
  { venue_name: "Orpheum Theatre", source_url: "https://balletmemphis.org/the-nutcracker", city: "Memphis, TN", company: "Ballet Memphis" },
  { venue_name: "DECC Symphony Hall", source_url: "https://minnesotaballet.org/event/the-nutcracker-a-duluth-tale/", city: "Duluth, MN", company: "Minnesota Ballet" },
  { venue_name: "Mayo Performing Arts Center", source_url: "https://www.mayoarts.org/new-jersey-ballet", city: "Morristown, NJ", company: "New Jersey Ballet" },
  { venue_name: "State Theatre New Jersey", source_url: "https://www.stnj.org/events-tickets", city: "New Brunswick, NJ", company: "State Theatre NJ" },
  { venue_name: "Orpheum Theater", source_url: "https://www.neworleansballettheatre.com/", city: "New Orleans, LA", company: "New Orleans Ballet Theatre" },
  { venue_name: "Saenger Theatre", source_url: "https://www.balletpensacola.org/performances", city: "Pensacola, FL", company: "Ballet Pensacola" },
  { venue_name: "Touhill Performing Arts Center", source_url: "https://www.stlouisballet.org/thenutcracker", city: "St. Louis, MO", company: "St. Louis Ballet" },
  { venue_name: "Covey Center for the Arts", source_url: "https://www.umballet.org/nutcracker", city: "Provo, UT", company: "Utah Metropolitan Ballet" },
  { venue_name: "Sandler Center for the Performing Arts", source_url: "https://vaballet.org/", city: "Virginia Beach, VA", company: "Virginia Ballet" },
  { venue_name: "Warner Theatre", source_url: "https://www.washingtonballet.org/events/the-nutcracker-20th-anniversary/", city: "Washington, DC", company: "The Washington Ballet" },
  { venue_name: "Mountain View Center for the Performing Arts", source_url: "https://tickets.mvcpa.com/eventperformances.asp?evt=716", city: "Mountain View, CA", company: "Western Ballet" },
  { venue_name: "Playhouse Square", source_url: "https://www.playhousesquare.org/", city: "Cleveland, OH", company: "Cleveland Ballet" },
  { venue_name: "Athenaeum Center", source_url: "https://athenaeumcenter.org/events/", city: "Chicago, IL", company: "Ballet Chicago" },
];

/**
 * Converts a sheet venue into our Event schema.
 */
function sheetVenueToEvent(
  v: SheetVenue,
  detectedStatus?: EventStatus
): Omit<Event, "id" | "created_at"> {
  // Dynamically fix the URL so the UI link points to 2026 instead of 2024/2025
  let fixedUrl = v.source_url;
  if (fixedUrl.includes("2024")) fixedUrl = fixedUrl.replace(/2024/g, "2026");
  if (fixedUrl.includes("24-25")) fixedUrl = fixedUrl.replace(/24-25/g, "26-27");
  if (fixedUrl.includes("2025")) fixedUrl = fixedUrl.replace(/2025/g, "2026");

  const name = `The Nutcracker – ${v.company || v.venue_name}`;
  return {
    name,
    city: v.city || null,
    venue_name: v.venue_name,
    status: detectedStatus || "Upcoming",
    source_url: fixedUrl,
    presale_start: null,
    public_sale_start: null,
    group_discount_available: false,
    group_min_size: null,
    discount_code: null,
    discount_note: null,
    notes_raw: v.company ? `${v.company} Nutcracker production` : null,
    last_checked: new Date().toISOString(),
    content_hash: `sheet-${v.venue_name.toLowerCase().replace(/\s+/g, "-")}`,
    days_until_event: null,
    check_priority: 2,
  };
}

/**
 * Detect sale status from a venue's ticket page.
 */
async function detectStatus(url: string): Promise<EventStatus> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });
    if (!res.ok) return "Upcoming";
    const html = (await res.text()).toLowerCase();

    if (html.includes("buy tickets") || html.includes("purchase tickets") || html.includes("get tickets") ||
        html.includes("book now") || html.includes("add to cart") || html.includes("select seats") ||
        html.includes("on sale now") || html.includes("get your tickets")) return "Public Sale Live";
    if (html.includes("presale") || html.includes("pre-sale") || html.includes("early access") ||
        html.includes("members first")) return "Presale Live";
    if (html.includes("sold out") || html.includes("soldout")) return "Sold Out";
    if (html.includes("notify me") || html.includes("coming soon") || html.includes("on sale soon") ||
        html.includes("tickets go on sale")) return "On Sale Soon";
    return "Upcoming";
  } catch {
    return "Upcoming";
  }
}

/**
 * Fetch all Google Sheet venues with live status detection.
 */
export async function fetchSheetVenues(): Promise<Omit<Event, "id" | "created_at">[]> {
  const events: Omit<Event, "id" | "created_at">[] = [];
  const batchSize = 8;

  for (let i = 0; i < SHEET_VENUES.length; i += batchSize) {
    const batch = SHEET_VENUES.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (v) => {
        const status = await detectStatus(v.source_url);
        return sheetVenueToEvent(v, status);
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") events.push(r.value);
    }
    if (i + batchSize < SHEET_VENUES.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`[sheetVenueService] Processed ${events.length} sheet venues`);
  return events;
}
