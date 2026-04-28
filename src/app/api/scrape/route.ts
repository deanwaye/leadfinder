import { NextRequest } from 'next/server'
import { searchPlaces } from '@/lib/places'
import { supabase } from '@/lib/supabase'
import type { County } from '@/lib/types'

export async function POST(req: NextRequest) {
  const password = req.headers.get('x-scrape-password')
  if (password !== process.env.SCRAPE_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchTerm, county, zipCode } = await req.json() as {
    searchTerm: string
    county?: County
    zipCode?: string
  }

  if (!searchTerm || (!county && !zipCode)) {
    return Response.json({ error: 'searchTerm and either county or zipCode are required' }, { status: 400 })
  }

  try {
    const target = zipCode
      ? { kind: 'zip' as const, zipCode }
      : { kind: 'county' as const, county: county! }
    const results = await searchPlaces(searchTerm, target)

    if (results.length === 0) {
      return Response.json({ inserted: 0, skipped: 0 })
    }

    const { data, error } = await supabase
      .from('lf_leads')
      .upsert(results, { onConflict: 'place_id', ignoreDuplicates: true })
      .select('id')

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({
      found: results.length,
      inserted: data?.length ?? 0,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 500 })
  }
}
