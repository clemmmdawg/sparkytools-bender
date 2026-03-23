// src/lib/bendMath.ts
// ALL calculation logic — pure functions, no React imports.
// All angles in degrees, all distances in decimal inches.

import type { BenderShoe } from '../data/benders'

// ── Constants ─────────────────────────────────────────────────────────────────

const DEG_TO_RAD = Math.PI / 180

// Multiplier table (cosecant method fallback)
// [thetaDeg, multiplier, shrinkConstant]
export const MULTIPLIER_TABLE: Array<[number, number, number]> = [
  [5,    11.47, 0.04],
  [10,    5.75, 0.08],
  [15,    3.86, 0.13],
  [22.5,  2.61, 0.20],
  [30,    2.00, 0.27],
  [45,    1.41, 0.41],
  [60,    1.15, 0.58],
]

// ── Basic trig helper ─────────────────────────────────────────────────────────

function toRad(deg: number): number {
  return deg * DEG_TO_RAD
}

// ── Core geometry functions ───────────────────────────────────────────────────

/**
 * Developed Length — arc length of conduit consumed by the bend.
 * Formula: (theta / 360) * (2 * π * radius)
 */
export function developedLength(radius: number, thetaDeg: number): number {
  return (thetaDeg / 360) * (2 * Math.PI * radius)
}

/**
 * Gain — conduit length saved vs a square right-angle path.
 * Formula: developedLength - (2 * X) where X = tan(theta/2) * radius
 */
export function gain(radius: number, thetaDeg: number): number {
  const X = Math.tan(toRad(thetaDeg / 2)) * radius
  return developedLength(radius, thetaDeg) - X * 2
}

/**
 * Setback — distance from bend mark to start of 90° leg.
 * Formula: radius * tan(45°) = radius * 1
 */
export function setback(radius: number): number {
  // Formula: setback = radius * tan(45°) = radius
  return radius * Math.tan(toRad(45))
}

/**
 * Shrink (multiplier method fallback) — how much conduit shrinks when offset.
 * Formula: tan(theta/2) * rise
 */
export function shrink(thetaDeg: number, rise: number): number {
  // Formula: shrink = tan(theta / 2) * rise
  return Math.tan(toRad(thetaDeg / 2)) * rise
}

/**
 * Distance between bends (multiplier method / cosecant method).
 * Formula: (1 / sin(theta)) * rise
 */
export function distanceBetweenBends(thetaDeg: number, rise: number): number {
  // Formula: distance = (1 / sin(theta)) * rise  [cosecant method]
  return (1 / Math.sin(toRad(thetaDeg))) * rise
}

// ── Multiplier table lookup ───────────────────────────────────────────────────

/**
 * Get the closest multiplier table entry for a given angle.
 * Returns [multiplier, shrinkConstant].
 */
export function getMultiplierForAngle(thetaDeg: number): [number, number] {
  let bestEntry = MULTIPLIER_TABLE[0]
  let bestDiff = Infinity
  for (const entry of MULTIPLIER_TABLE) {
    const diff = Math.abs(entry[0] - thetaDeg)
    if (diff < bestDiff) {
      bestDiff = diff
      bestEntry = entry
    }
  }
  return [bestEntry[1], bestEntry[2]]
}

// ── Offset calculator ─────────────────────────────────────────────────────────

export interface OffsetInputs {
  rise: number        // inches — perpendicular distance between the two parallel runs
  thetaDeg: number    // degrees — bend angle for each of the two bends
  benderShoe: BenderShoe
}

export interface OffsetResult {
  // Primary outputs
  distanceBetweenBends: number   // inches — measured along the conduit
  shrink: number                  // inches — total conduit shortening
  mark1FromEnd: number            // inches — first bend mark from working end
  mark2FromEnd: number            // inches — second bend mark from working end

  // Intermediate values (for display/diagram)
  developedLength: number         // arc length for each bend
  gain: number                    // gain per bend
  thetaDeg: number                // confirmed bend angle
  rise: number                    // confirmed rise

  // Validity
  validity: 'ok' | 'warning' | 'error'
  validityMessage?: string
}

export function computeOffset(inputs: OffsetInputs): OffsetResult {
  const { rise, thetaDeg, benderShoe } = inputs
  const { centerlineRadius } = benderShoe

  const validity = checkOffsetValidity(inputs)

  // Distance between bends (cosecant method — accurate for centerline radius)
  // Formula: rise / sin(theta)
  const dbb = rise / Math.sin(toRad(thetaDeg))

  // Developed length (arc consumed at each bend)
  const devLen = developedLength(centerlineRadius, thetaDeg)

  // Gain per bend
  const gainPerBend = gain(centerlineRadius, thetaDeg)

  // Total shrink = 2 * tan(theta/2) * rise
  // This is the centerline-radius method shrink (not multiplier method)
  const totalShrink = shrink(thetaDeg, rise) * 2

  // Mark placement:
  // mark1 is the first bend mark from the working end
  // mark2 = mark1 + distanceBetweenBends (measured along the conduit)
  // For a standard offset, mark1 is an arbitrary reference distance.
  // We present the spacing between marks; mark1 is set by the user based on
  // where they want the offset to begin. Here we output the spacing only.
  // Convention: set mark1 at deduct distance from the start of the run.
  const mark1FromEnd = benderShoe.deduct
  const mark2FromEnd = mark1FromEnd + dbb

  return {
    distanceBetweenBends: dbb,
    shrink: totalShrink,
    mark1FromEnd,
    mark2FromEnd,
    developedLength: devLen,
    gain: gainPerBend,
    thetaDeg,
    rise,
    validity: validity.state,
    validityMessage: validity.message,
  }
}

// ── Validity checks ───────────────────────────────────────────────────────────

interface ValidityResult {
  state: 'ok' | 'warning' | 'error'
  message?: string
}

function checkOffsetValidity(inputs: OffsetInputs): ValidityResult {
  const { rise, thetaDeg, benderShoe } = inputs

  if (rise <= 0) {
    return { state: 'error', message: 'Rise must be greater than 0' }
  }
  if (thetaDeg <= 0 || thetaDeg >= 90) {
    return { state: 'error', message: 'Bend angle must be between 1° and 89°' }
  }
  if (rise < 0.5) {
    return { state: 'warning', message: 'Very small rise — verify bender capability' }
  }
  if (thetaDeg > 60) {
    return { state: 'warning', message: 'Angles above 60° are uncommon for offsets' }
  }
  // Check that the distance between bends is larger than 2 × developed length
  // (bends would physically overlap if not)
  const dbb = rise / Math.sin(thetaDeg * DEG_TO_RAD)
  const devLen = developedLength(benderShoe.centerlineRadius, thetaDeg)
  if (dbb < devLen * 2) {
    return { state: 'error', message: 'Bends would overlap — increase rise or decrease angle' }
  }
  if (dbb < devLen * 2.5) {
    return { state: 'warning', message: 'Bends are very close together' }
  }

  return { state: 'ok' }
}

/**
 * Generic validity check entry point.
 */
export function checkValidity(
  bendType: string,
  inputs: Record<string, number>,
  benderShoe: BenderShoe
): 'ok' | 'warning' | 'error' {
  if (bendType === 'offset') {
    const result = checkOffsetValidity({
      rise: inputs.rise ?? 0,
      thetaDeg: inputs.thetaDeg ?? 22.5,
      benderShoe,
    })
    return result.state
  }
  return 'ok'
}
