import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import type { County, LeadStatus } from '@/lib/types'
import LeadsClient from './LeadsClient'

const SORTABLE = ['name', 'category', 'city', 'rating', 'status'] as const
type SortCol = typeof SORTABLE[number]

interface PageProps {
  searchParams: Promise<{
    county?: string
    city?: string
    status?: string
    search?: string
    enriched?: string
    page?: string
    sort?: string
    dir?: string
  }>
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const county = (params.county as County) || null
  const city = params.city || null
  const status = (params.status as LeadStatus) || null
  const search = params.search || ''
  const enriched = params.enriched || null
  const page = parseInt(params.page ?? '1', 10)
  const perPage = 50
  const sort: SortCol = SORTABLE.includes(params.sort as SortCol) ? (params.sort as SortCol) : 'name'
  const ascending = params.dir !== 'desc'

  let query = supabase
    .from('lf_leads')
    .select('*', { count: 'exact' })
    .order(sort, { ascending, nullsFirst: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (county) query = query.eq('county', county)
  if (city) query = query.eq('city', city)
  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('name', `%${search}%`)
  if (enriched === 'true') query = query.not('enriched_at', 'is', null)
  if (enriched === 'false') query = query.is('enriched_at', null)

  const { data: leads, count } = await query

  // Distinct city list for the filter dropdown — scoped to the current county if one is selected
  let citiesQuery = supabase.from('lf_leads').select('city').not('city', 'is', null).order('city')
  if (county) citiesQuery = citiesQuery.eq('county', county)
  const { data: cityRows } = await citiesQuery
  const cities = Array.from(new Set((cityRows ?? []).map(r => r.city as string))).filter(Boolean)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">B2B Leads</h1>
      <Suspense>
        <LeadsClient
          leads={leads ?? []}
          total={count ?? 0}
          page={page}
          perPage={perPage}
          sort={sort}
          dir={ascending ? 'asc' : 'desc'}
          cities={cities}
        />
      </Suspense>
    </div>
  )
}
