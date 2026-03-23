// src/lib/units.ts
// Unit conversion helpers. All internal math uses decimal inches.
// Conversion only happens at the input/display boundary.

export type UnitMode = 'inches' | 'ft-in' | 'cm'

const CM_PER_INCH = 2.54
const INCHES_PER_FOOT = 12

// ── Conversion TO decimal inches ─────────────────────────────────────────────

/**
 * Convert a display value to decimal inches.
 * For 'inches' mode, value is already decimal inches.
 * For 'ft-in' mode, value is total inches (caller should pass pre-converted).
 * For 'cm' mode, value is centimeters.
 */
export function toInches(value: number, mode: UnitMode): number {
  switch (mode) {
    case 'inches':
      return value
    case 'ft-in':
      // In ft-in mode, numeric inputs are still entered as total inches
      // The display shows fractional feet but input binding is decimal inches
      return value
    case 'cm':
      return value / CM_PER_INCH
  }
}

/**
 * Convert decimal inches to display units.
 */
export function fromInches(inches: number, mode: UnitMode): number {
  switch (mode) {
    case 'inches':
      return inches
    case 'ft-in':
      return inches // return total inches; formatDisplay handles the ft/in split
    case 'cm':
      return inches * CM_PER_INCH
  }
}

// ── Fraction helpers ──────────────────────────────────────────────────────────

const FRACTION_DENOMINATORS = [2, 4, 8, 16] as const

/**
 * Convert a decimal remainder (0–1) to the nearest common fraction string.
 * e.g. 0.5 → "1/2", 0.25 → "1/4", 0.125 → "1/8"
 */
function decimalToFraction(decimal: number, maxDenominator: 2 | 4 | 8 | 16 = 16): string {
  if (decimal < 0.03) return ''
  if (decimal > 0.97) return '' // will be rounded to next whole

  let bestNum = 0
  let bestDen = 1
  let bestErr = Infinity

  for (const den of FRACTION_DENOMINATORS) {
    if (den > maxDenominator) break
    const num = Math.round(decimal * den)
    if (num === 0 || num === den) continue
    const err = Math.abs(decimal - num / den)
    if (err < bestErr) {
      bestErr = err
      bestNum = num
      bestDen = den
    }
  }

  if (bestNum === 0) return ''
  // Simplify the fraction
  const gcd = findGcd(bestNum, bestDen)
  return `${bestNum / gcd}/${bestDen / gcd}`
}

function findGcd(a: number, b: number): number {
  return b === 0 ? a : findGcd(b, a % b)
}

// ── Formatted display strings ─────────────────────────────────────────────────

/**
 * Format decimal inches as a human-readable string in the given mode.
 * 'inches'  → "12.5"" or "12 1/2""
 * 'ft-in'   → "1' 0 1/2""
 * 'cm'      → "31.8 cm"
 */
export function formatDisplay(inches: number, mode: UnitMode): string {
  if (!isFinite(inches) || isNaN(inches)) return '—'

  switch (mode) {
    case 'inches': {
      const whole = Math.floor(inches)
      const frac = decimalToFraction(inches - whole)
      if (frac) return `${whole} ${frac}"`
      return `${whole}"`
    }
    case 'ft-in': {
      const totalFeet = Math.floor(inches / INCHES_PER_FOOT)
      const remInches = inches % INCHES_PER_FOOT
      const wholeIn = Math.floor(remInches)
      const frac = decimalToFraction(remInches - wholeIn)
      const inPart = frac ? `${wholeIn} ${frac}"` : `${wholeIn}"`
      if (totalFeet === 0) return inPart
      return `${totalFeet}' ${inPart}`
    }
    case 'cm': {
      const cm = inches * CM_PER_INCH
      return `${cm.toFixed(1)} cm`
    }
  }
}

/**
 * Format a degree value for display.
 */
export function formatDegrees(deg: number): string {
  if (!isFinite(deg)) return '—'
  // Show up to 1 decimal place, strip trailing zero
  const s = deg.toFixed(1).replace(/\.0$/, '')
  return `${s}°`
}

/**
 * Parse a display string back to decimal inches.
 * Handles: "12.5", "12 1/2", "1' 0 1/2\"", "31.8 cm"
 * Returns NaN if unparseable.
 */
export function parseDisplayToInches(str: string, mode: UnitMode): number {
  str = str.trim()
  if (!str) return NaN

  switch (mode) {
    case 'inches': {
      // Could be "12.5" or "12 1/2"
      const fracMatch = str.replace('"', '').match(/^(\d+)\s+(\d+)\/(\d+)$/)
      if (fracMatch) {
        return parseInt(fracMatch[1]) + parseInt(fracMatch[2]) / parseInt(fracMatch[3])
      }
      return parseFloat(str.replace('"', ''))
    }
    case 'ft-in': {
      // Could be "1' 6 1/2\"" or "18 1/2\""
      const ftInMatch = str.match(/^(\d+)'\s*(\d+)(?:\s+(\d+)\/(\d+))?\"?$/)
      if (ftInMatch) {
        let total = parseInt(ftInMatch[1]) * INCHES_PER_FOOT + parseInt(ftInMatch[2])
        if (ftInMatch[3] && ftInMatch[4]) {
          total += parseInt(ftInMatch[3]) / parseInt(ftInMatch[4])
        }
        return total
      }
      // Fall through to inches parsing
      return parseFloat(str.replace('"', ''))
    }
    case 'cm': {
      return parseFloat(str.replace(' cm', '')) / CM_PER_INCH
    }
  }
}
