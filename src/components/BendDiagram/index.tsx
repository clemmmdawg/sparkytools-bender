// src/components/BendDiagram/index.tsx
// SVG bend geometry diagram — tube path, construction lines, dimension callouts.
// Renders as SVG <g> elements within the composite visualizer SVG.

import React from 'react'
import { buildConduitPath } from '../../lib/svgPath'
import type { Segment } from '../../lib/svgPath'
import type { OffsetResult } from '../../lib/bendMath'
import type { UnitMode } from '../../lib/units'

interface BendDiagramProps {
  x: number             // left edge of diagram area in SVG coords
  y: number             // top of diagram area
  width: number         // available width
  height: number        // available height
  result: OffsetResult
  unitMode: UnitMode
}

const TUBE_WIDTH_INCHES = 0.75   // nominal tube width on diagram in inches (visual)
const LEG_LENGTH_INCHES = 6      // straight section before/after offset (diagram only)
const PADDING_FRACTION = 0.12    // fraction of diagram dimensions for padding

const VALIDITY_COLORS: Record<string, string> = {
  ok: '#30d158',
  warning: '#ff9f0a',
  error: '#ff453a',
}

/**
 * Generate unique IDs for SVG defs to avoid collisions when multiple diagrams exist.
 */
let _diagId = 0
function nextDiagId() {
  return `bd-${++_diagId}`
}

export function BendDiagram({
  x,
  y,
  width,
  height,
  result,
  unitMode,
}: BendDiagramProps): JSX.Element {
  const idPrefix = React.useRef(nextDiagId()).current
  const bendColor = VALIDITY_COLORS[result.validity] ?? VALIDITY_COLORS.ok

  // Recover the centerline radius from developed length
  // Formula: devLen = (theta/360) * 2 * PI * radius => radius = devLen / (PI * theta / 180)
  const actualRadius = result.thetaDeg > 0 && result.developedLength > 0
    ? result.developedLength / (Math.PI * result.thetaDeg / 180)
    : 4.0  // fallback

  // Segments for vertical display (conduit going DOWN, offset goes RIGHT).
  // sweepFlag=0 for first bend (right turn from heading=90°=down)
  // sweepFlag=1 for second bend (left turn back to heading=90°)
  const segments: Segment[] = [
    { type: 'line', length: LEG_LENGTH_INCHES },
    { type: 'arc', radius: actualRadius, angleDeg: result.thetaDeg, sweepFlag: 0 },
    { type: 'line', length: result.distanceBetweenBends },
    { type: 'arc', radius: actualRadius, angleDeg: result.thetaDeg, sweepFlag: 1 },
    { type: 'line', length: LEG_LENGTH_INCHES },
  ]

  // Compute raw path bounding box at scale=1 with heading=90° (going down)
  const rawPath = buildConduitPath(segments, 0, 0, 90, 1)
  const bb = rawPath.boundingBox

  // The diagram area (minus padding)
  const pad = Math.min(width, height) * PADDING_FRACTION
  const drawW = width - pad * 2
  const drawH = height - pad * 2

  // Fit the path into the draw area, maintaining aspect ratio
  const scaleX = bb.width > 0 ? drawW / bb.width : 1
  const scaleY = bb.height > 0 ? drawH / bb.height : 1
  const diagramScale = Math.min(scaleX, scaleY)

  // Offset so the path is centered in the available area
  const scaledW = bb.width * diagramScale
  const scaledH = bb.height * diagramScale
  const originX = x + pad + (drawW - scaledW) / 2 - bb.x * diagramScale
  const originY = y + pad + (drawH - scaledH) / 2 - bb.y * diagramScale

  // Rebuild path at the computed scale with correct origin, heading=90° (going down)
  const pathResult = buildConduitPath(segments, originX, originY, 90, diagramScale)
  const endpoints = pathResult.segmentEndpoints
  const tubeHalfW = (TUBE_WIDTH_INCHES * diagramScale) / 2

  // Gradient IDs
  const straightGradId = `${idPrefix}-sg`
  const bendGradId = `${idPrefix}-bg`
  const shadowId = `${idPrefix}-shadow`
  const markerArrowId = `${idPrefix}-arrow`
  const markerArrowRevId = `${idPrefix}-arrow-rev`
  const markerBlueId = `${idPrefix}-blue`

  // Key geometry points from the path
  // segments: [line, arc, line, arc, line]
  // endpoints[0] = end of first leg, [1] = end of first arc, [2] = end of middle leg,
  //               [3] = end of second arc, [4] = end of last leg
  const startPt = { x: originX, y: originY }
  const pt0 = endpoints[0]  // start of first bend
  const pt1 = endpoints[1]  // end of first bend
  const pt2 = endpoints[2]  // start of second bend
  const pt3 = endpoints[3]  // end of second bend
  const pt4 = endpoints[4]  // final end

  // With heading=90°, the conduit goes DOWN and offset goes RIGHT.
  // Rise = horizontal displacement between the two parallel runs.
  // Between-bends = vertical distance from pt0.y to pt2.y (approximate).

  // Rise: horizontal dimension below the end of the conduit
  const riseDimY = (pt4 ? pt4.y : originY) + 22
  const riseX1 = originX                           // x of incoming (top) run
  const riseX2 = pt4 ? pt4.x : originX            // x of outgoing (bottom) run

  // Between-bends: vertical dimension to the left of the conduit
  const dbbDimX = Math.min(pt0?.x ?? originX, riseX1) - 22
  const dbbY1 = pt0 ? pt0.y : originY
  const dbbY2 = pt2 ? pt2.y : originY + result.distanceBetweenBends * diagramScale

  return (
    <g>
      <defs>
        {/* Straight section gradient (gray) */}
        <linearGradient id={straightGradId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#2a2a2c" />
          <stop offset="40%" stopColor="#5a5a5c" />
          <stop offset="50%" stopColor="#6a6a6c" />
          <stop offset="60%" stopColor="#5a5a5c" />
          <stop offset="100%" stopColor="#2a2a2c" />
        </linearGradient>

        {/* Bend arc gradient (uses validity color) */}
        <linearGradient id={bendGradId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={bendColor} stopOpacity={0.6} />
          <stop offset="50%" stopColor={bendColor} />
          <stop offset="100%" stopColor={bendColor} stopOpacity={0.6} />
        </linearGradient>

        {/* Drop shadow filter */}
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.7)" />
        </filter>

        {/* Arrowhead marker — white */}
        <marker
          id={markerArrowId}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="rgba(255,255,255,0.8)" />
        </marker>
        <marker
          id={markerArrowRevId}
          markerWidth="8"
          markerHeight="8"
          refX="2"
          refY="4"
          orient="auto"
        >
          <path d="M8,0 L0,4 L8,8 Z" fill="rgba(255,255,255,0.8)" />
        </marker>

        {/* Arrowhead marker — blue */}
        <marker
          id={markerBlueId}
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#4a9eff" />
        </marker>
      </defs>

      {/* ── Tube path ─────────────────────────────────────────── */}
      {/* Main centerline path with stroke = tube width */}
      <path
        d={pathResult.d}
        fill="none"
        stroke={`url(#${straightGradId})`}
        strokeWidth={tubeHalfW * 2}
        strokeLinecap="round"
        filter={`url(#${shadowId})`}
      />

      {/* Overlay the bend sections with the validity color.
          First arc: sweep=0 (right turn from heading=90°)
          Second arc: sweep=1 (left turn back to heading=90°) */}
      {pt0 && pt1 && (
        <path
          d={`M ${pt0.x.toFixed(2)} ${pt0.y.toFixed(2)} A ${(actualRadius * diagramScale).toFixed(2)} ${(actualRadius * diagramScale).toFixed(2)} 0 0 0 ${pt1.x.toFixed(2)} ${pt1.y.toFixed(2)}`}
          fill="none"
          stroke={bendColor}
          strokeWidth={tubeHalfW * 2}
          strokeLinecap="round"
          opacity={0.9}
        />
      )}
      {pt2 && pt3 && (
        <path
          d={`M ${pt2.x.toFixed(2)} ${pt2.y.toFixed(2)} A ${(actualRadius * diagramScale).toFixed(2)} ${(actualRadius * diagramScale).toFixed(2)} 0 0 1 ${pt3.x.toFixed(2)} ${pt3.y.toFixed(2)}`}
          fill="none"
          stroke={bendColor}
          strokeWidth={tubeHalfW * 2}
          strokeLinecap="round"
          opacity={0.9}
        />
      )}

      {/* ── White construction lines ───────────────────────────── */}
      {/* Extension of the first leg beyond the bend point */}
      {pt0 && pt1 && (
        <line
          x1={startPt.x}
          y1={startPt.y}
          x2={pt0.x + (pt1.x - pt0.x) * 1.5}
          y2={pt0.y + (pt1.y - pt0.y) * 1.5}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      )}
      {/* Extension of the last leg backward through the second bend */}
      {pt3 && pt4 && (
        <line
          x1={pt4 ? pt4.x + (pt4.x - pt3.x) * 0.5 : 0}
          y1={pt4 ? pt4.y + (pt4.y - pt3.y) * 0.5 : 0}
          x2={pt3.x - (pt4.x - pt3.x) * 0.5}
          y2={pt3.y - (pt4.y - pt3.y) * 0.5}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      )}

      {/* ── Blue dimension lines ───────────────────────────────── */}

      {/* Rise: horizontal dimension below the conduit end */}
      {riseX1 !== riseX2 && (
        <g>
          <line
            x1={riseX1}
            y1={riseDimY}
            x2={riseX2}
            y2={riseDimY}
            stroke="var(--dimension-line-color, #4a9eff)"
            strokeWidth={1.5}
            strokeDasharray="5,3"
            markerStart={`url(#${markerBlueId})`}
            markerEnd={`url(#${markerBlueId})`}
          />
          {/* Vertical leader lines from runs to dimension */}
          <line x1={riseX1} y1={originY} x2={riseX1} y2={riseDimY}
            stroke="var(--dimension-line-color, #4a9eff)" strokeWidth={0.75} strokeDasharray="3,3" opacity={0.5} />
          <line x1={riseX2} y1={pt4 ? pt4.y : riseDimY - 10} x2={riseX2} y2={riseDimY}
            stroke="var(--dimension-line-color, #4a9eff)" strokeWidth={0.75} strokeDasharray="3,3" opacity={0.5} />
        </g>
      )}

      {/* Between-bends: vertical dimension to the left of the conduit */}
      {pt0 && pt2 && (
        <g>
          <line
            x1={dbbDimX}
            y1={dbbY1}
            x2={dbbDimX}
            y2={dbbY2}
            stroke="var(--dimension-line-color, #4a9eff)"
            strokeWidth={1.5}
            strokeDasharray="5,3"
            markerStart={`url(#${markerBlueId})`}
            markerEnd={`url(#${markerBlueId})`}
          />
          {/* Horizontal leaders from bend points to dim line */}
          <line x1={pt0.x} y1={pt0.y} x2={dbbDimX} y2={dbbY1}
            stroke="var(--dimension-line-color, #4a9eff)" strokeWidth={0.75} strokeDasharray="3,3" opacity={0.5} />
          <line x1={pt2.x} y1={pt2.y} x2={dbbDimX} y2={dbbY2}
            stroke="var(--dimension-line-color, #4a9eff)" strokeWidth={0.75} strokeDasharray="3,3" opacity={0.5} />
        </g>
      )}

      {/* ── Inline dimension labels ────────────────────────────── */}

      {/* "B/B" label next to the between-bends dimension line */}
      {pt0 && pt2 && (
        <text
          x={dbbDimX - 4}
          y={(dbbY1 + dbbY2) / 2 + 4}
          textAnchor="end"
          fill="var(--dimension-line-color, #4a9eff)"
          fontSize={9}
          fontFamily="sans-serif"
          fontWeight="bold"
        >
          B/B
        </text>
      )}

      {/* "Rise" label next to the rise dimension line */}
      {riseX1 !== riseX2 && (
        <text
          x={(riseX1 + riseX2) / 2}
          y={riseDimY + 12}
          textAnchor="middle"
          fill="var(--dimension-line-color, #4a9eff)"
          fontSize={9}
          fontFamily="sans-serif"
          fontWeight="bold"
        >
          Rise
        </text>
      )}
    </g>
  )
}

