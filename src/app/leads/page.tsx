import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import type { County, LeadStatus } from '@/lib/types'
import LeadsClient from './LeadsClient'

interface PageProps {
  searchParams: Promise<{
    county?: string
    status?: string
    search?: string
    enriched?: string
    page?: string
  }>
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const county = (params.county as County) || null
  const status = (params.status as LeadStatus) || null
  const search = params.search || ''
  const enriched = params.enriched || null
  const page = parseInt(params.page ?? '1', 10)
  const perPage = 50

  let query = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range((page - 1) * perPage, page * perPage - 1)

  if (county) query = query.eq('county', county)
  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('name', `%${search}%`)
  if (enriched === 'true') query = query.not('enriched_at', 'is', null)
  if (enriched === 'false') query = query.is('enriched_at', null)

  const { data: leads, count } = await query

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">B2B Leads</h1>
      <Suspense>
        <LeadsClient
          leads={leads ?? []}
          total={count ?? 0}
          page={page}
          perPage={perPage}
        />
      </Suspense>
    </div>
  )
}
