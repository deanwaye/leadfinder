'use client'

import { useState } from 'react'
import { B2B_SEARCH_TERMS, COUNTIES } from '@/lib/types'
import type { County } from '@/lib/types'

type JobStatus = 'pending' | 'running' | 'done' | 'error'

interface Job {
  searchTerm: string
  county: County
  status: JobStatus
  found?: number
  inserted?: number
  error?: string
}

const PASSWORD = 'leadfinder2026'

export default function ScrapePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState<{ totalFound: number; totalInserted: number } | null>(null)

  function buildJobs(): Job[] {
    const all: Job[] = []
    for (const county of Object.keys(COUNTIES) as County[]) {
      for (const term of B2B_SEARCH_TERMS) {
        all.push({ searchTerm: term, county, status: 'pending' })
      }
    }
    return all
  }

  async function runScrape() {
    const allJobs = buildJobs()
    setJobs(allJobs)
    setRunning(true)
    setSummary(null)

    let totalFound = 0
    let totalInserted = 0

    for (let i = 0; i < allJobs.length; i++) {
      const job = allJobs[i]

      setJobs(prev => prev.map((j, idx) =>
        idx === i ? { ...j, status: 'running' } : j
      ))

      try {
        const res = await fetch('/api/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-scrape-password': PASSWORD,
          },
          body: JSON.stringify({ searchTerm: job.searchTerm, county: job.county }),
        })

        const data = await res.json()

        if (!res.ok) {
          setJobs(prev => prev.map((j, idx) =>
            idx === i ? { ...j, status: 'error', error: data.error } : j
          ))
        } else {
          totalFound += data.found ?? 0
          totalInserted += data.inserted ?? 0
          setJobs(prev => prev.map((j, idx) =>
            idx === i ? { ...j, status: 'done', found: data.found, inserted: data.inserted } : j
          ))
        }
      } catch (err) {
        setJobs(prev => prev.map((j, idx) =>
          idx === i ? { ...j, status: 'error', error: String(err) } : j
        ))
      }
    }

    setSummary({ totalFound, totalInserted })
    setRunning(false)
  }

  const countyLabels: Record<County, string> = { guilford: 'Guilford', forsyth: 'Forsyth' }
  const statusIcon: Record<JobStatus, string> = {
    pending: '·',
    running: '⟳',
    done: '✓',
    error: '✗',
  }
  const statusColor: Record<JobStatus, string> = {
    pending: 'text-gray-400',
    running: 'text-blue-500',
    done: 'text-green-600',
    error: 'text-red-500',
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scrape B2B Leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            {B2B_SEARCH_TERMS.length} search terms × 2 counties = {B2B_SEARCH_TERMS.length * 2} API calls
          </p>
        </div>
        <button
          onClick={runScrape}
          disabled={running}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? 'Scraping…' : 'Start Scrape'}
        </button>
      </div>

      {summary && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-semibold">
            Done — found {summary.totalFound} results, inserted {summary.totalInserted} new leads.
          </p>
          <a href="/leads" className="text-green-700 text-sm underline">View leads →</a>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2 border-b border-gray-100">
            <span>Search Term</span>
            <span className="w-20 text-center">County</span>
            <span className="w-16 text-center">Status</span>
            <span className="w-16 text-center">Found</span>
            <span className="w-20 text-center">Inserted</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50">
            {jobs.map((job, i) => (
              <div
                key={i}
                className={`grid grid-cols-[1fr_auto_auto_auto_auto] px-4 py-2 text-sm items-center ${
                  job.status === 'running' ? 'bg-blue-50' : ''
                }`}
              >
                <span className="text-gray-800">{job.searchTerm}</span>
                <span className="w-20 text-center text-gray-500">{countyLabels[job.county]}</span>
                <span className={`w-16 text-center font-medium ${statusColor[job.status]}`}>
                  {statusIcon[job.status]} {job.status}
                </span>
                <span className="w-16 text-center text-gray-600">{job.found ?? '—'}</span>
                <span className="w-20 text-center text-gray-600">{job.inserted ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {jobs.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400">
          Click &ldquo;Start Scrape&rdquo; to populate your leads database.
          <br />
          <span className="text-xs mt-2 block">Takes ~2–3 minutes to complete.</span>
        </div>
      )}
    </div>
  )
}
