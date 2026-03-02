/**
 * Platform URL mapping for gig/micro-task platforms.
 * Used to create clickable links to actual platform sites.
 */

export const PLATFORM_URLS: Record<string, string> = {
  'Amazon MTurk': 'https://www.mturk.com',
  'Clickworker': 'https://www.clickworker.com',
  'Swagbucks': 'https://www.swagbucks.com',
  'Prolific': 'https://www.prolific.com',
  'Appen': 'https://appen.com',
  'Toloka': 'https://toloka.ai',
  'Microworkers': 'https://www.microworkers.com',
  'Neevo': 'https://www.neevo.ai',
  'Hive Micro': 'https://hivemicro.com',
  'Remotasks': 'https://www.remotasks.com',
}

/**
 * Get the URL for a gig platform by name.
 * Does fuzzy matching if exact match not found.
 * Returns null if no match.
 */
export function getPlatformUrl(platform: string): string | null {
  if (!platform) return null
  const direct = PLATFORM_URLS[platform]
  if (direct) return direct
  // Fuzzy match: check if any key is contained in the platform string
  const lower = platform.toLowerCase()
  for (const [key, url] of Object.entries(PLATFORM_URLS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return url
    }
  }
  return null
}
