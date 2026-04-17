export type County = 'guilford' | 'forsyth'
export type LeadStatus = 'new' | 'contacted' | 'warm' | 'meeting' | 'closed' | 'skip'

export interface Lead {
  id: string
  place_id: string
  name: string
  address: string | null
  city: string | null
  county: County | null
  phone: string | null
  website: string | null
  category: string | null
  search_term: string | null
  rating: number | null
  review_count: number | null
  lat: number | null
  lng: number | null
  email: string | null
  linkedin_url: string | null
  facebook_url: string | null
  instagram_url: string | null
  enriched_at: string | null
  status: LeadStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  warm: 'Warm',
  meeting: 'Meeting',
  closed: 'Closed',
  skip: 'Skip',
}

export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  warm: 'bg-orange-100 text-orange-700',
  meeting: 'bg-purple-100 text-purple-700',
  closed: 'bg-green-100 text-green-700',
  skip: 'bg-red-100 text-red-600',
}

export const COUNTIES: Record<County, { label: string; lat: number; lng: number; radius: number }> = {
  guilford: { label: 'Guilford', lat: 36.0726, lng: -79.792, radius: 25000 },
  forsyth: { label: 'Forsyth', lat: 36.0999, lng: -80.2442, radius: 20000 },
}

export const B2B_SEARCH_TERMS = [
  'accounting firm',
  'CPA firm',
  'law firm',
  'insurance agency',
  'financial advisor',
  'wealth management',
  'commercial real estate',
  'property management company',
  'staffing agency',
  'employment agency',
  'software company',
  'IT consulting',
  'managed IT services',
  'technology company',
  'marketing agency',
  'advertising agency',
  'business consulting',
  'management consulting',
  'manufacturing company',
  'wholesale distributor',
  'distribution company',
  'general contractor',
  'construction company',
  'commercial electrician',
  'commercial plumber',
  'commercial HVAC',
  'roofing contractor',
  'logistics company',
  'freight company',
  'printing company',
  'commercial cleaning',
  'engineering firm',
  'healthcare company',
  'pharmaceutical company',
  'medical device company',
  'advertising agency',
  'marketing agency',
  'digital marketing agency',
  'public relations firm',
  'private equity firm',
  'venture capital',
  'executive search firm',
  'business broker',
  'mergers and acquisitions',
  'HR consulting',
  'payroll company',
  'corporate training',
  'commercial lending',
  'commercial insurance broker',
  'SaaS company',
  'cybersecurity company',
  'data analytics company',
  'cloud services',
  'textile company',
  'furniture company',
  'food manufacturer',
  'video production company',
  'corporate event planning',
]
