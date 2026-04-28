'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import type { Lead, LeadStatus, County } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'

interface Props {
  leads: Lead[]
  total: number
  page: number
  perPage: number
  sort: string
  dir: 'asc' | 'desc'
  cities: string[]
}

export default function LeadsClient({ leads, total, page, perPage, sort, dir, cities }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key !== 'page') params.delete('page')
    startTransition(() => router.push(`/leads?${params.toString()}`))
  }, [router, searchParams])

  const sortBy = useCallback((col: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get('sort') === col) {
      params.set('dir', params.get('dir') === 'asc' ? 'desc' : 'asc')
    } else {
      params.set('sort', col)
      params.set('dir', 'asc')
    }
    params.delete('page')
    startTransition(() => router.push(`/leads?${params.toString()}`))
  }, [router, searchParams])

  const SortHeader = ({ col, label }: { col: string; label: string }) => {
    const active = sort === col
    return (
      <th
        onClick={() => sortBy(col)}
        className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide cursor-pointer select-none hover:text-gray-800 whitespace-nowrap"
      >
        {label}
        <span className="ml-1 text-gray-300">
          {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </th>
    )
  }

  const currentCounty = searchParams.get('county') ?? ''
  const currentCity = searchParams.get('city') ?? ''
  const currentStatus = searchParams.get('status') ?? ''
  const currentSearch = searchParams.get('search') ?? ''
  const currentEnriched = searchParams.get('enriched') ?? ''

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className={isPending ? 'opacity-60 pointer-events-none' : ''}>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          placeholder="Search by name…"
          defaultValue={currentSearch}
          onChange={e => updateParam('search', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={currentCounty}
          onChange={e => {
            const params = new URLSearchParams(searchParams.toString())
            if (e.target.value) params.set('county', e.target.value)
            else params.delete('county')
            params.delete('city')
            params.delete('page')
            startTransition(() => router.push(`/leads?${params.toString()}`))
          }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All counties</option>
          <option value="guilford">Guilford</option>
          <option value="forsyth">Forsyth</option>
        </select>
        <select
          value={currentCity}
          onChange={e => updateParam('city', e.target.value)}
          disabled={cities.length === 0}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">All cities</option>
          {cities.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={currentStatus}
          onChange={e => updateParam('status', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABELS) as LeadStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={currentEnriched}
          onChange={e => updateParam('enriched', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All leads</option>
          <option value="true">Enriched</option>
          <option value="false">Not enriched</option>
        </select>
        <span className="text-sm text-gray-400 self-center ml-auto">{total} leads</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <SortHeader col="name" label="Company" />
              <SortHeader col="city" label="City" />
              <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">County</th>
              <SortHeader col="category" label="Category" />
              <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Phone</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Website</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Email</th>
              <SortHeader col="rating" label="Rating" />
              <SortHeader col="status" label="Status" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  No leads found. <a href="/scrape" className="text-blue-600 underline">Run the scraper</a> to populate your database.
                </td>
              </tr>
            )}
            {leads.map(lead => (
              <tr
                key={lead.id}
                onClick={() => router.push(`/leads/${lead.id}`)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-4 py-2.5 font-medium text-gray-900 max-w-[200px] truncate">{lead.name}</td>
                <td className="px-4 py-2.5 text-gray-500">{lead.city ?? '—'}</td>
                <td className="px-4 py-2.5 text-gray-500 capitalize">{lead.county ?? '—'}</td>
                <td className="px-4 py-2.5 text-gray-500 max-w-[140px] truncate">{lead.category ?? '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{lead.phone ?? '—'}</td>
                <td className="px-4 py-2.5 max-w-[180px] truncate" onClick={e => e.stopPropagation()}>
                  {lead.website ? (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {lead.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                    </a>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-gray-500 max-w-[160px] truncate">{lead.email ?? '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">
                  {lead.rating ? `${lead.rating} (${lead.review_count})` : '—'}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>
                    {STATUS_LABELS[lead.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => updateParam('page', String(page - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => updateParam('page', String(page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
