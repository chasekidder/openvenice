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
  per_second?: { usd?: number }
  per_thousand_characters?: { usd?: number }
  per_audio_second?: { usd?: number }
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
