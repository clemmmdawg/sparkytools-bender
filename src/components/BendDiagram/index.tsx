// src/components/BendDiagram/index.tsx
// Bent conduit geometry — tube path + construction lines only.
// Dimension annotations are handled by CompositeVisualizer's center card zone.

import React from 'react'
import { buildConduitPath } from '../../lib/svgPath'
import type { Segment } from '../../lib/svgPath'
import type { OffsetResult } from '../../lib/bendMath'

interface BendDiagramProps {
  x: number
  y: number
  width: number
  height: number
  result: OffsetResult
  /** Pre-computed layout from CompositeVisualizer for alignment. Falls back to auto-fit if absent. */
  layoutOverride?: { originX: number; originY: number; scale: number }
}

const TUBE_WIDTH_INCHES = 0.75
const LEG_LENGTH_INCHES = 6
const PADDING_FRACTION = 0.12

const VALIDITY_COLORS: Record<string, string> = {
  ok: '#30d158',
  warning: '#ff9f0a',
  error: '#ff453a',
}

let _diagId = 0
function nextDiagId() { return `bd-${++_diagId}` }

export function BendDiagram({ x, y, width, height, result, layoutOverride }: BendDiagramProps): JSX.Element {
  const idPrefix = React.useRef(nextDiagId()).current
  const bendColor = VALIDITY_COLORS[result.validity] ?? VALIDITY_COLORS.ok

  const actualRadius =
    result.thetaDeg > 0 && result.developedLength > 0
      ? result.developedLength / (Math.PI * (result.thetaDeg / 180))
      : 4.0

  const segments: Segment[] = [
    { type: 'line', length: LEG_LENGTH_INCHES },
    { type: 'arc', radius: actualRadius, angleDeg: result.thetaDeg, sweepFlag: 0 },
    { type: 'line', length: result.distanceBetweenBends },
    { type: 'arc', radius: actualRadius, angleDeg: result.thetaDeg, sweepFlag: 1 },
    { type: 'line', length: LEG_LENGTH_INCHES },
  ]

  let originX: number
  let originY: number
  let scale: number

  if (layoutOverride) {
    // Use parent-supplied layout so diagram aligns with the conduit strip
    ;({ originX, originY, scale } = layoutOverride)
  } else {
    // Auto-fit to available area (used when rendered standalone)
    const rawPath = buildConduitPath(segments, 0, 0, 90, 1)
    const bb = rawPath.boundingBox
    const pad = Math.min(width, height) * PADDING_FRACTION
    const drawW = width - pad * 2
    const drawH = height - pad * 2
    scale = Math.min(
      bb.width  > 0 ? drawW / bb.width  : 1,
      bb.height > 0 ? drawH / bb.height : 1,
    )
    originX = x + pad + (drawW - bb.width  * scale) / 2 - bb.x * scale
    originY = y + pad + (drawH - bb.height * scale) / 2 - bb.y * scale
  }

  const pathResult = buildConduitPath(segments, originX, originY, 90, scale)
  const eps = pathResult.segmentEndpoints
  const tubeHalfW = (TUBE_WIDTH_INCHES * scale) / 2

  const pt0 = eps[0]
  const pt1 = eps[1]
  const pt2 = eps[2]
  const pt3 = eps[3]
  const pt4 = eps[4]

  const straightGradId = `${idPrefix}-sg`
  const bendGradId     = `${idPrefix}-bg`
  const shadowId       = `${idPrefix}-shadow`

  return (
    <g>
      <defs>
        <linearGradient id={straightGradId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%"   stopColor="#2a2a2c" />
          <stop offset="40%"  stopColor="#5a5a5c" />
          <stop offset="50%"  stopColor="#6a6a6c" />
          <stop offset="60%"  stopColor="#5a5a5c" />
          <stop offset="100%" stopColor="#2a2a2c" />
        </linearGradient>

        <linearGradient id={bendGradId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%"   stopColor={bendColor} stopOpacity={0.6} />
          <stop offset="50%"  stopColor={bendColor} />
          <stop offset="100%" stopColor={bendColor} stopOpacity={0.6} />
        </linearGradient>

        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.7)" />
        </filter>
      </defs>

      {/* ── Tube — full path in gray, arcs overlaid in validity color ── */}
      <path
        d={pathResult.d}
        fill="none"
        stroke={`url(#${straightGradId})`}
        strokeWidth={tubeHalfW * 2}
        strokeLinecap="round"
        filter={`url(#${shadowId})`}
      />

      {pt0 && pt1 && (
        <path
          d={`M ${pt0.x.toFixed(2)} ${pt0.y.toFixed(2)} A ${(actualRadius * scale).toFixed(2)} ${(actualRadius * scale).toFixed(2)} 0 0 0 ${pt1.x.toFixed(2)} ${pt1.y.toFixed(2)}`}
          fill="none"
          stroke={bendColor}
          strokeWidth={tubeHalfW * 2}
          strokeLinecap="round"
          opacity={0.9}
        />
      )}

      {pt2 && pt3 && (
        <path
          d={`M ${pt2.x.toFixed(2)} ${pt2.y.toFixed(2)} A ${(actualRadius * scale).toFixed(2)} ${(actualRadius * scale).toFixed(2)} 0 0 1 ${pt3.x.toFixed(2)} ${pt3.y.toFixed(2)}`}
          fill="none"
          stroke={bendColor}
          strokeWidth={tubeHalfW * 2}
          strokeLinecap="round"
          opacity={0.9}
        />
      )}

      {/* ── White construction lines (theoretical straight-line extensions) ── */}
      {pt0 && pt1 && (
        <line
          x1={originX}
          y1={originY}
          x2={pt0.x + (pt1.x - pt0.x) * 1.5}
          y2={pt0.y + (pt1.y - pt0.y) * 1.5}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      )}
      {pt3 && pt4 && (
        <line
          x1={pt4.x + (pt4.x - pt3.x) * 0.5}
          y1={pt4.y + (pt4.y - pt3.y) * 0.5}
          x2={pt3.x - (pt4.x - pt3.x) * 0.5}
          y2={pt3.y - (pt4.y - pt3.y) * 0.5}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      )}
    </g>
  )
}
