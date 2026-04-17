const EMAIL_RE = /[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/g
const LINKEDIN_RE = /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[\w%-]+(?:\/[^"'\s]*)*/gi
const FACEBOOK_RE = /https?:\/\/(?:www\.)?facebook\.com\/[\w.%-]+(?:\/[^"'\s]*)*/gi
const INSTAGRAM_RE = /https?:\/\/(?:www\.)?instagram\.com\/[\w.%-]+(?:\/[^"'\s]*)*/gi

function firstMatch(html: string, re: RegExp): string | null {
  re.lastIndex = 0
  const match = re.exec(html)
  return match ? match[0].replace(/['">\s]+$/, '') : null
}

function allMatches(html: string, re: RegExp): string[] {
  re.lastIndex = 0
  const results: string[] = []
  let m
  while ((m = re.exec(html)) !== null) {
    results.push(m[0].replace(/['">\s]+$/, ''))
  }
  return results
}

function filterEmails(emails: string[]): string[] {
  const ignored = ['example.com', 'sentry.io', 'schema.org', 'w3.org', 'png', 'jpg', 'svg', 'gif', 'webp']
  return emails.filter(e =>
    !ignored.some(i => e.includes(i)) &&
    !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.svg')
  )
}

export interface EnrichmentResult {
  email: string | null
  linkedin_url: string | null
  facebook_url: string | null
  instagram_url: string | null
}

export async function enrichWebsite(url: string): Promise<EnrichmentResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LeadFinder/1.0)',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) return { email: null, linkedin_url: null, facebook_url: null, instagram_url: null }

    const html = await res.text()

    const emails = filterEmails(allMatches(html, EMAIL_RE))
    const email = emails[0] ?? null

    const linkedin_url = firstMatch(html, LINKEDIN_RE)
    const facebook_url = firstMatch(html, FACEBOOK_RE)
    const instagram_url = firstMatch(html, INSTAGRAM_RE)

    return { email, linkedin_url, facebook_url, instagram_url }
  } catch {
    return { email: null, linkedin_url: null, facebook_url: null, instagram_url: null }
  }
}
