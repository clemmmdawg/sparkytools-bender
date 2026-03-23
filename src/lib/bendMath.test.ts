// src/lib/bendMath.test.ts
import { describe, it, expect } from 'vitest'
import {
  developedLength,
  gain,
  setback,
  shrink,
  distanceBetweenBends,
  computeOffset,
} from './bendMath'
import type { BenderShoe } from '../data/benders'

// ── Test shoe (Greenlee 851, 1/2" EMT) ───────────────────────────────────────
const TEST_SHOE: BenderShoe = {
  conduitType: 'EMT',
  tradeSize: '1/2',
  outsideDiameter: 0.706,
  centerlineRadius: 4.0,
  deduct: 5,
}

const TOLERANCE = 0.01  // ±0.01" tolerance for rounding

describe('developedLength', () => {
  it('returns correct arc length for a 90° bend', () => {
    // Formula: (90/360) * 2π * r = π/2 * r
    const expected = (Math.PI / 2) * 4.0
    expect(developedLength(4.0, 90)).toBeCloseTo(expected, 3)
  })

  it('returns correct arc length for a 45° bend', () => {
    // Formula: (45/360) * 2π * r = π/4 * r
    const expected = (Math.PI / 4) * 4.0
    expect(developedLength(4.0, 45)).toBeCloseTo(expected, 3)
  })

  it('returns correct arc length for 22.5° bend', () => {
    const expected = (22.5 / 360) * (2 * Math.PI * 4.0)
    expect(developedLength(4.0, 22.5)).toBeCloseTo(expected, 3)
  })

  it('scales linearly with radius', () => {
    const dl1 = developedLength(4.0, 45)
    const dl2 = developedLength(8.0, 45)
    expect(dl2).toBeCloseTo(dl1 * 2, 3)
  })
})

describe('gain', () => {
  it('returns a finite number for standard bend angles', () => {
    // gain = devLen(r, theta) - 2 * tan(theta/2) * r
    // For all angles, the arc is slightly shorter than the 2×tangent leg path,
    // so this formula returns a negative number (indicating the arc uses less length).
    // This matches the CLAUDE.md spec.
    expect(isFinite(gain(4.0, 90))).toBe(true)
    expect(isFinite(gain(4.0, 45))).toBe(true)
    expect(isFinite(gain(4.0, 22.5))).toBe(true)
  })

  it('approaches 0 as angle approaches 0', () => {
    expect(gain(4.0, 1)).toBeCloseTo(0, 2)
  })

  it('returns the correct formula result for 90° with r=4"', () => {
    // gain = (π/2 * 4) - 2 * tan(45°) * 4 = 6.2832 - 8.0 = -1.7168
    const expected = (Math.PI / 2) * 4 - 2 * Math.tan(Math.PI / 4) * 4
    expect(gain(4.0, 90)).toBeCloseTo(expected, 3)
  })
})

describe('setback', () => {
  it('equals radius for standard setback', () => {
    // setback = r * tan(45°) = r * 1 = r
    expect(setback(4.0)).toBeCloseTo(4.0, 3)
    expect(setback(5.75)).toBeCloseTo(5.75, 3)
  })
})

describe('shrink', () => {
  it('returns positive value for valid inputs', () => {
    expect(shrink(22.5, 6)).toBeGreaterThan(0)
  })

  it('returns approximately 0.2 * rise for 22.5° (shrink constant check)', () => {
    // Common shrink constant for 22.5° is ≈ 0.20 per inch of rise
    // shrink = tan(11.25°) * rise ≈ 0.199 * 6 ≈ 1.194
    const s = shrink(22.5, 6)
    expect(s).toBeCloseTo(0.199 * 6, 1)
  })

  it('scales linearly with rise', () => {
    const s1 = shrink(30, 4)
    const s2 = shrink(30, 8)
    expect(s2).toBeCloseTo(s1 * 2, 3)
  })
})

describe('distanceBetweenBends', () => {
  it('returns correct distance for 30° and 6" rise', () => {
    // distance = (1 / sin(30°)) * 6 = 2 * 6 = 12"
    expect(distanceBetweenBends(30, 6)).toBeCloseTo(12.0, 2)
  })

  it('returns correct distance for 45° and 6" rise', () => {
    // distance = (1 / sin(45°)) * 6 = √2 * 6 ≈ 8.485"
    expect(distanceBetweenBends(45, 6)).toBeCloseTo(6 * Math.SQRT2, 2)
  })

  it('is the hypotenuse of rise with angle theta', () => {
    const rise = 8
    const theta = 22.5
    const dbb = distanceBetweenBends(theta, rise)
    // The vertical component (rise) of the hypotenuse = dbb * sin(theta)
    expect(dbb * Math.sin(theta * Math.PI / 180)).toBeCloseTo(rise, 2)
  })
})

describe('computeOffset', () => {
  it('returns valid result for standard 6" rise at 22.5°', () => {
    const result = computeOffset({ rise: 6, thetaDeg: 22.5, benderShoe: TEST_SHOE })
    expect(result.validity).toBe('ok')
    expect(result.distanceBetweenBends).toBeGreaterThan(0)
    expect(result.shrink).toBeGreaterThan(0)
    expect(result.mark2FromEnd).toBeGreaterThan(result.mark1FromEnd)
  })

  it('returns error for zero rise', () => {
    const result = computeOffset({ rise: 0, thetaDeg: 22.5, benderShoe: TEST_SHOE })
    expect(result.validity).toBe('error')
  })

  it('returns error for invalid angle', () => {
    const result = computeOffset({ rise: 6, thetaDeg: 0, benderShoe: TEST_SHOE })
    expect(result.validity).toBe('error')
  })

  it('distance between bends matches the cosecant formula', () => {
    const rise = 10
    const theta = 30
    const result = computeOffset({ rise, thetaDeg: theta, benderShoe: TEST_SHOE })
    const expected = rise / Math.sin(theta * Math.PI / 180)
    expect(result.distanceBetweenBends).toBeCloseTo(expected, 2)
  })

  it('mark2 is mark1 + distanceBetweenBends', () => {
    const result = computeOffset({ rise: 6, thetaDeg: 22.5, benderShoe: TEST_SHOE })
    expect(result.mark2FromEnd).toBeCloseTo(result.mark1FromEnd + result.distanceBetweenBends, 3)
  })
})
