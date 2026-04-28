import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import LeadDetail from './LeadDetail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LeadPage({ params }: PageProps) {
  const { id } = await params
  const { data: lead, error } = await supabase.from('lf_leads').select('*').eq('id', id).single()

  if (error || !lead) notFound()

  return <LeadDetail lead={lead} />
}
