export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

interface PricingLike {
  input?: { usd?: number }
  output?: { usd?: number }
  generation?: { usd?: number }
  resolutions?: Record<string, { usd?: number }>
  quality?: Record<string, Record<string, { usd?: number }>>
  upscale?: Record<string, { usd?: number }>
  inpaint?: { usd?: number }
  durations?: Record<string, { usd?: number; min_seconds?: number; max_seconds?: number }>
  per_second?: { usd?: number }
  per_thousand_characters?: { usd?: number }
  per_audio_second?: { usd?: number }
}

function pick(obj: Record<string, { usd?: number }>): number | undefined {
  const keys = Object.keys(obj).sort()
  return obj[keys[0]]?.usd
}

export function formatPricingLabel(pricing?: PricingLike | null): string {
  if (!pricing) return ''

  if (pricing.input?.usd && pricing.input.usd > 0) {
    const out = pricing.output?.usd && pricing.output.usd > 0
      ? ` / $${Number(pricing.output.usd).toFixed(2)}`
      : ''
    return `$${Number(pricing.input.usd).toFixed(2)}${out}/M`
  }

  if (pricing.generation?.usd && pricing.generation.usd > 0) {
    const usd = Number(pricing.generation.usd)
    return usd < 0.01 ? `$${usd.toFixed(4)}/gen` : `$${usd.toFixed(2)}/gen`
  }

  if (pricing.resolutions) {
    const usd = pick(pricing.resolutions)
    if (usd && usd > 0) return usd < 0.01 ? `$${usd.toFixed(4)}/gen` : `$${usd.toFixed(2)}/gen`
  }

  if (pricing.quality) {
    const tiers = Object.keys(pricing.quality).sort()
    const qualities = pricing.quality[tiers[0]]
    if (qualities) {
      const levels = Object.keys(qualities).sort()
      const usd = qualities[levels[0]]?.usd
      if (usd && usd > 0) return usd < 0.01 ? `$${usd.toFixed(4)}/gen` : `$${usd.toFixed(2)}/gen`
    }
  }

  if (pricing.inpaint?.usd && pricing.inpaint.usd > 0) {
    return `$${Number(pricing.inpaint.usd).toFixed(4)}/edit`
  }

  if (pricing.per_second?.usd && pricing.per_second.usd > 0) {
    return `$${Number(pricing.per_second.usd).toFixed(4)}/s`
  }

  if (pricing.per_thousand_characters?.usd && pricing.per_thousand_characters.usd > 0) {
    return `$${Number(pricing.per_thousand_characters.usd).toFixed(4)}/Kc`
  }

  if (pricing.per_audio_second?.usd && pricing.per_audio_second.usd > 0) {
    return `$${Number(pricing.per_audio_second.usd).toFixed(4)}/s`
  }

  return ''
}
