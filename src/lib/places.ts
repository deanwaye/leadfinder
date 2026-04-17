import type { County } from './types'
import { COUNTIES } from './types'

const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText'
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.primaryType',
  'places.location',
  'places.addressComponents',
].join(',')

interface PlaceResult {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  websiteUri?: string
  rating?: number
  userRatingCount?: number
  primaryType?: string
  location?: { latitude: number; longitude: number }
  addressComponents?: Array<{
    longText: string
    shortText: string
    types: string[]
  }>
}

function extractAddressComponent(components: PlaceResult['addressComponents'], type: string): string | null {
  if (!components) return null
  const match = components.find(c => c.types.includes(type))
  return match?.longText ?? null
}

function detectCounty(components: PlaceResult['addressComponents']): County | null {
  const level2 = extractAddressComponent(components, 'administrative_area_level_2')
  if (!level2) return null
  const lower = level2.toLowerCase()
  if (lower.includes('guilford')) return 'guilford'
  if (lower.includes('forsyth')) return 'forsyth'
  return null
}

export interface ScrapedLead {
  place_id: string
  name: string
  address: string | null
  city: string | null
  county: County | null
  phone: string | null
  website: string | null
  category: string | null
  search_term: string
  rating: number | null
  review_count: number | null
  lat: number | null
  lng: number | null
}

export async function searchPlaces(
  searchTerm: string,
  county: County
): Promise<ScrapedLead[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY is not set')

  const { lat, lng, radius } = COUNTIES[county]

  const body = {
    textQuery: `${searchTerm} near ${county === 'guilford' ? 'Greensboro NC' : 'Winston-Salem NC'}`,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius,
      },
    },
    maxResultCount: 20,
  }

  const res = await fetch(PLACES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Places API ${res.status}: ${text}`)
  }

  const data = await res.json()
  const places: PlaceResult[] = data.places ?? []

  return places.map(p => ({
    place_id: p.id,
    name: p.displayName?.text ?? 'Unknown',
    address: p.formattedAddress ?? null,
    city: extractAddressComponent(p.addressComponents, 'locality'),
    county: detectCounty(p.addressComponents) ?? county,
    phone: p.nationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    category: p.primaryType ?? null,
    search_term: searchTerm,
    rating: p.rating ?? null,
    review_count: p.userRatingCount ?? null,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
  }))
}
