import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { enrichWebsite } from '@/lib/enrichment'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id } = await params

  const { data: lead, error: fetchError } = await supabase
    .from('lf_leads')
    .select('website')
    .eq('id', id)
    .single()

  if (fetchError || !lead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 })
  }

  if (!lead.website) {
    return Response.json({ error: 'No website to enrich' }, { status: 400 })
  }

  const result = await enrichWebsite(lead.website)

  const { data, error } = await supabase
    .from('lf_leads')
    .update({ ...result, enriched_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
