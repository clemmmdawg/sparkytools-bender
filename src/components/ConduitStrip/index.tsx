// src/components/ConduitStrip/index.tsx
// Left-rail conduit strip with mark ticks and bend arc blocks.
// Renders as SVG elements to be embedded inside the composite visualizer SVG.

import React from 'react'
import type { OffsetResult } from '../../lib/bendMath'

interface MarkData {
  positionFraction: number        // 0–1 along the strip height
  developedLengthFraction: number // fraction of total height occupied by this bend arc
  validity: 'ok' | 'warning' | 'error'
  label: string
}

interface ConduitStripProps {
  x: number               // left edge of the strip in SVG units
  y: number               // top of the strip (usually 0)
  width: number           // strip width in SVG units
  height: number          // strip height in SVG units
  marks: MarkData[]
}

const VALIDITY_COLORS: Record<string, string> = {
  ok: 'var(--ion-color-success)',
  warning: 'var(--ion-color-warning)',
  error: 'var(--ion-color-danger)',
}

export function ConduitStrip({ x, y, width, height, marks }: ConduitStripProps): JSX.Element {
  const gradId = 'conduit-strip-grad'

  return (
    <g>
      {/* Gradient definition for cylindrical tube effect */}
      <defs>
        <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#1c1c1e" />
          <stop offset="30%" stopColor="#3a3a3c" />
          <stop offset="50%" stopColor="#4a4a4c" />
          <stop offset="70%" stopColor="#3a3a3c" />
          <stop offset="100%" stopColor="#1c1c1e" />
        </linearGradient>
      </defs>

      {/* Tube body — bleeds past top and bottom of viewport */}
      <rect
        x={x}
        y={y - 20}
        width={width}
        height={height + 40}
        rx={width * 0.3}
        fill={`url(#${gradId})`}
      />

      {/* Bend arc blocks */}
      {marks.map((mark, i) => {
        const blockY = y + mark.positionFraction * height
        const blockH = mark.developedLengthFraction * height
        const color = VALIDITY_COLORS[mark.validity] ?? VALIDITY_COLORS.ok

        return (
          <rect
            key={i}
            x={x}
            y={blockY - blockH / 2}
            width={width}
            height={blockH}
            rx={2}
            fill={color}
            opacity={0.9}
          />
        )
      })}

      {/* Mark ticks */}
      {marks.map((mark, i) => {
        const tickY = y + mark.positionFraction * height
        return (
          <g key={`tick-${i}`}>
            {/* Tick line across full strip width */}
            <line
              x1={x}
              y1={tickY}
              x2={x + width}
              y2={tickY}
              stroke="white"
              strokeWidth={1.5}
              opacity={0.9}
            />
            {/* Small arrowhead pointing right (toward the bend diagram) */}
            <polygon
              points={`${x + width},${tickY} ${x + width - 6},${tickY - 4} ${x + width - 6},${tickY + 4}`}
              fill="white"
              opacity={0.9}
            />
          </g>
        )
      })}
    </g>
  )
}

/**
 * Helper: convert an OffsetResult into ConduitStrip mark data.
 * The conduitLength is the total stick length being shown (in inches).
 */
export function offsetResultToStripMarks(
  result: OffsetResult,
  conduitLength: number
): MarkData[] {
  const devLenFraction = result.developedLength / conduitLength

  return [
    {
      positionFraction: result.mark1FromEnd / conduitLength,
      developedLengthFraction: devLenFraction,
      validity: result.validity,
      label: 'Mark 1',
    },
    {
      positionFraction: result.mark2FromEnd / conduitLength,
      developedLengthFraction: devLenFraction,
      validity: result.validity,
      label: 'Mark 2',
    },
  ]
}
