// src/components/CompositeVisualizer/index.tsx
// Single SVG containing ConduitStrip (left) + BendDiagram (right).

import React from 'react'
import { ConduitStrip, offsetResultToStripMarks } from '../ConduitStrip'
import { BendDiagram } from '../BendDiagram'
import type { OffsetResult } from '../../lib/bendMath'
import type { UnitMode } from '../../lib/units'
import styles from './CompositeVisualizer.module.css'

interface CompositeVisualizerProps {
  result: OffsetResult
  unitMode: UnitMode
}

const SVG_WIDTH = 360
const SVG_HEIGHT = 320
const STRIP_WIDTH = 40
const STRIP_MARGIN = 8

// Estimated total conduit length shown (in inches) — for strip proportions
const DISPLAY_CONDUIT_LENGTH_INCHES = 36

export function CompositeVisualizer({ result, unitMode }: CompositeVisualizerProps): JSX.Element {
  const stripX = STRIP_MARGIN
  const stripY = 0
  const diagX = STRIP_WIDTH + STRIP_MARGIN * 2
  const diagWidth = SVG_WIDTH - diagX - STRIP_MARGIN

  const stripMarks = offsetResultToStripMarks(result, DISPLAY_CONDUIT_LENGTH_INCHES)

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className={styles.svg}
        aria-label="Conduit bend visualizer"
      >
        {/* Dark background */}
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="var(--diagram-bg, #0f0f0f)" />

        {/* Conduit strip (left rail) */}
        <ConduitStrip
          x={stripX}
          y={stripY}
          width={STRIP_WIDTH}
          height={SVG_HEIGHT}
          marks={stripMarks}
        />

        {/* Bend diagram (main area) */}
        <BendDiagram
          x={diagX}
          y={0}
          width={diagWidth}
          height={SVG_HEIGHT}
          result={result}
          unitMode={unitMode}
        />
      </svg>
    </div>
  )
}
