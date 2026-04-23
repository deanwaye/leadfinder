# LeadFinder

A self-hosted B2B lead generation tool that uses the Google Places API to find local businesses, stores them in Supabase, and gives you a simple CRM interface to track outreach.

Built with Next.js, Tailwind CSS, and Supabase.

---

## What it does

1. **Scrapes** — searches Google Maps for businesses matching your target categories within your defined geographic areas
2. **Enriches** — visits each business's website and extracts email addresses, LinkedIn, Facebook, and Instagram links
3. **Manages** — lets you filter, sort, and track leads through a pipeline (New → Contacted → Warm → Meeting → Closed)

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/deanwaye/leadfinder.git
cd leadfinder
npm install
```

### 2. Create your Supabase project

Go to [supabase.com](https://supabase.com), create a new project, then run this SQL in the Supabase SQL editor to create the leads table:

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  place_id text unique not null,
  name text,
  address text,
  city text,
  county text,
  phone text,
  website text,
  category text,
  search_term text,
  rating float,
  review_count int,
  lat float,
  lng float,
  email text,
  linkedin_url text,
  facebook_url text,
  instagram_url text,
  enriched_at timestamptz,
  status text default 'new',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 3. Get a Google Places API key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project and enable the **Places API (New)**
3. Create an API key under Credentials

### 4. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Google Places API — server-side only
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Supabase — get these from your project's API settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Password to protect the scrape endpoint
SCRAPE_PASSWORD=choose_a_password
NEXT_PUBLIC_SCRAPE_PASSWORD=choose_a_password
```

Both `SCRAPE_PASSWORD` and `NEXT_PUBLIC_SCRAPE_PASSWORD` should be the same value. The server checks `SCRAPE_PASSWORD`; the browser UI sends `NEXT_PUBLIC_SCRAPE_PASSWORD`.

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Customizing your target area

Counties (geographic search areas) are defined in `src/lib/types.ts`:

```ts
export const COUNTIES: Record<County, { label: string; lat: number; lng: number; radius: number }> = {
  guilford: { label: 'Guilford', lat: 36.0726, lng: -79.792, radius: 25000 },
  forsyth: { label: 'Forsyth', lat: 36.0999, lng: -80.2442, radius: 20000 },
}
```

To target different areas:

1. Find the latitude/longitude of your target city or county (Google Maps → right-click → copy coordinates)
2. Set `radius` in meters — `25000` = ~15 miles, `50000` = ~30 miles
3. Update the `County` type at the top of the same file to match your keys:

```ts
// Before:
export type County = 'guilford' | 'forsyth'

// After (example):
export type County = 'wake' | 'mecklenburg'
```

4. Update `COUNTIES` to match:

```ts
export const COUNTIES = {
  wake:        { label: 'Wake',        lat: 35.7796, lng: -78.6382, radius: 30000 },
  mecklenburg: { label: 'Mecklenburg', lat: 35.2271, lng: -80.8431, radius: 30000 },
}
```

You can add as many counties or cities as you want — each one multiplies the total scrape jobs.

---

## Customizing business categories

The search terms sent to Google Maps are in `src/lib/types.ts`:

```ts
export const B2B_SEARCH_TERMS = [
  'accounting firm',
  'CPA firm',
  'law firm',
  // ...
]
```

Add, remove, or replace any terms. Be specific — Google Places treats these as text searches, so `"commercial electrician"` returns more targeted results than `"electrician"`.

Each term is searched in every county, so **10 terms × 3 counties = 30 scrape jobs**. Google Places returns up to 20 results per search, giving you up to 200 leads per term per county.

---

## Using the app

### Scraping leads — `/scrape`

Navigate to `/scrape` and click **Start Scrape**. The page runs every search term × county combination sequentially with a short delay between requests to avoid rate limiting. A full run with the default 60 terms across 2 counties takes about 2–3 minutes.

Re-running the scraper is safe — duplicate businesses are identified by their Google `place_id` and silently skipped.

### Viewing leads — `/leads`

Filter by county, pipeline status, or search by company name. Click any row to open the detail view.

### Enriching a lead

On the lead detail page, click **Enrich**. The app fetches the business's website and extracts:

- Email address
- LinkedIn URL
- Facebook URL
- Instagram URL

Not every website will have all of these — the extractor does a best-effort scan of the page HTML.

### CRM statuses

| Status | Meaning |
|--------|---------|
| New | Just scraped, not yet reviewed |
| Contacted | Reached out |
| Warm | Showed interest |
| Meeting | Call or meeting scheduled |
| Closed | Deal done |
| Skip | Not a fit |

Update the status and add notes from the lead detail page. Notes auto-save when you click away.

---

## Project structure

```
src/
  app/
    api/
      scrape/       POST — calls Google Places for one search term + county
      leads/        GET — paginated lead list with filters
      leads/[id]/   GET/PATCH — fetch and update a single lead
      enrich/[id]/  POST — scrapes a lead's website for contact info
    leads/          Lead list and detail pages
    scrape/         Scrape runner UI
  lib/
    types.ts        Counties, search terms, lead schema, status config
    supabase.ts     Supabase client
```

---

## Notes

- **Google Places API costs money.** A full scrape of 60 terms × 2 counties = 120 API calls. Check [Google's pricing](https://mapsplatform.google.com/pricing/) before running large scrapes.
- **Supabase RLS.** The default setup uses the anon key with open read/write access. For a production deployment, add Row Level Security policies in your Supabase project.
- **The `/scrape` route is password-protected by a form field only** — there's no login wall. Don't share your deployed URL publicly if you want to keep scraping under your control.
