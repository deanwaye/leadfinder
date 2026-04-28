import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { County, LeadStatus } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const county = searchParams.get('county') as County | null
  const status = searchParams.get('status') as LeadStatus | null
  const search = searchParams.get('search') ?? ''
  const enriched = searchParams.get('enriched')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const perPage = 50

  let query = supabase
    .from('lf_leads')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range((page - 1) * perPage, page * perPage - 1)

  if (county) query = query.eq('county', county)
  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('name', `%${search}%`)
  if (enriched === 'true') query = query.not('enriched_at', 'is', null)
  if (enriched === 'false') query = query.is('enriched_at', null)

  const { data, error, count } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ leads: data, total: count, page, perPage })
}
