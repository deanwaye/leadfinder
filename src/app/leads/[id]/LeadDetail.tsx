'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Lead, LeadStatus } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'

export default function LeadDetail({ lead: initial }: { lead: Lead }) {
  const [lead, setLead] = useState(initial)
  const [notes, setNotes] = useState(initial.notes ?? '')
  const [enriching, setEnriching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function updateLead(patch: Partial<Pick<Lead, 'status' | 'notes'>>) {
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const updated = await res.json()
      setLead(updated)
    }
  }

  async function enrichLead() {
    setEnriching(true)
    const res = await fetch(`/api/enrich/${lead.id}`, { method: 'POST' })
    if (res.ok) {
      const updated = await res.json()
      setLead(updated)
      setNotes(updated.notes ?? '')
    }
    setEnriching(false)
  }

  const field = (label: string, value: string | null | undefined, href?: string) => (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-800">
        {value ? (
          href ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{value}</a> : value
        ) : <span className="text-gray-300">—</span>}
      </dd>
    </div>
  )

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => startTransition(() => router.back())}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
        {lead.enriched_at && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Enriched</span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: company info */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Company Info</h2>
          <dl>
            {field('Address', lead.address)}
            {field('City', lead.city)}
            {field('County', lead.county ? lead.county.charAt(0).toUpperCase() + lead.county.slice(1) : null)}
            {field('Category', lead.category)}
            {field('Phone', lead.phone)}
            {field('Website', lead.website, lead.website ?? undefined)}
            {field('Rating', lead.rating ? `${lead.rating} ★ (${lead.review_count} reviews)` : null)}
            {field('Search term', lead.search_term)}
          </dl>
        </div>

        {/* Right: contact + CRM */}
        <div className="flex flex-col gap-4">
          {/* Contact (enrichment) */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Contact</h2>
              {lead.website && (
                <button
                  onClick={enrichLead}
                  disabled={enriching}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {enriching ? 'Enriching…' : lead.enriched_at ? 'Re-enrich' : 'Enrich'}
                </button>
              )}
            </div>
            <dl>
              {field('Email', lead.email, lead.email ? `mailto:${lead.email}` : undefined)}
              {field('LinkedIn', lead.linkedin_url, lead.linkedin_url ?? undefined)}
              {field('Facebook', lead.facebook_url, lead.facebook_url ?? undefined)}
              {field('Instagram', lead.instagram_url, lead.instagram_url ?? undefined)}
            </dl>
          </div>

          {/* CRM */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">CRM</h2>
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1">Status</label>
              <select
                value={lead.status}
                onChange={e => updateLead({ status: e.target.value as LeadStatus })}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(STATUS_LABELS) as LeadStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <div className="mt-1.5">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>
                  {STATUS_LABELS[lead.status]}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onBlur={() => updateLead({ notes })}
                rows={4}
                placeholder="Add notes about this lead…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-300 mt-0.5">Auto-saves on blur</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
