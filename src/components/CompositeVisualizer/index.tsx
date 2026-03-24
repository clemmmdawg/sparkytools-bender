// src/components/CompositeVisualizer/index.tsx
// Single SVG: left = straight conduit strip, center = annotated result cards,
// right = bent conduit diagram. Cards have leader lines to both sides.

import React, { useMemo } from 'react'
import { ConduitStrip, offsetResultToStripMarks } from '../ConduitStrip'
import { BendDiagram } from '../BendDiagram'
import { buildConduitPath } from '../../lib/svgPath'
import type { Segment } from '../../lib/svgPath'
import type { OffsetResult } from '../../lib/bendMath'
import { formatDisplay } from '../../lib/units'
import type { UnitMode } from '../../lib/units'
import styles from './CompositeVisualizer.module.css'

interface CompositeVisualizerProps {
  result: OffsetResult
  unitMode: UnitMode
}

// ── SVG dimensions ───────────────────────────────────────────────────────────
const SVG_W = 400
const SVG_H = 340

// Zone x-boundaries
const STRIP_X = 6
const STRIP_W = 44
const STRIP_RIGHT = STRIP_X + STRIP_W  // 50

const CARDS_X = 58
const CARDS_W = 106
const CARDS_RIGHT = CARDS_X + CARDS_W  // 164

const DIAG_X = 170
const DIAG_W = SVG_W - DIAG_X - 4     // 226

// Must match BendDiagram internal constants so geometry aligns
const LEG_LENGTH_INCHES = 6
const PADDING_FRACTION = 0.12
const DISPLAY_CONDUIT_LENGTH = 36     // inches shown on strip

const CARD_H = 38
const CARD_GAP = 5

interface CardSpec {
  label: string
  value: string
  naturalY: number          // preferred top-of-card Y (before collision resolution)
  leftY?: number            // strip target Y for left leader
  leftBracket?: boolean     // draw a span bracket instead of simple leader
  leftBracketY1?: number
  leftBracketY2?: number
  rightX?: number           // diagram target for right leader
  rightY?: number
}

export function CompositeVisualizer({ result, unitMode }: CompositeVisualizerProps): JSX.Element {
  // ── Compute bend geometry so we know where endpoints land in the right zone ─
  const geo = useMemo(() => {
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

    const rawPath = buildConduitPath(segments, 0, 0, 90, 1)
    const bb = rawPath.boundingBox

    const pad = Math.min(DIAG_W, SVG_H) * PADDING_FRACTION
    const drawW = DIAG_W - pad * 2
    const drawH = SVG_H - pad * 2

    const scale = Math.min(
      bb.width  > 0 ? drawW / bb.width  : 1,
      bb.height > 0 ? drawH / bb.height : 1,
    )

    const originX = DIAG_X + pad + (drawW - bb.width  * scale) / 2 - bb.x * scale
    const originY =       0 + pad + (drawH - bb.height * scale) / 2 - bb.y * scale

    const pathResult = buildConduitPath(segments, originX, originY, 90, scale)
    const eps = pathResult.segmentEndpoints

    return {
      originX,
      originY,
      pt0: eps[0],  // end of first straight leg (start of first arc)
      pt1: eps[1],  // end of first arc
      pt2: eps[2],  // end of middle leg (start of second arc)
      pt3: eps[3],  // end of second arc
      pt4: eps[4],  // end of final straight leg
    }
  }, [result])

  // ── Strip mark Y positions ────────────────────────────────────────────────
  const stripMarks = offsetResultToStripMarks(result, DISPLAY_CONDUIT_LENGTH)
  const mark1Y = (result.mark1FromEnd / DISPLAY_CONDUIT_LENGTH) * SVG_H
  const mark2Y = (result.mark2FromEnd / DISPLAY_CONDUIT_LENGTH) * SVG_H

  const { originX, pt0, pt1, pt2, pt4 } = geo

  // ── Card definitions ──────────────────────────────────────────────────────
  const rawCards: CardSpec[] = [
    {
      label: 'Mark 1',
      value: formatDisplay(result.mark1FromEnd, unitMode),
      naturalY: mark1Y - CARD_H / 2,
      leftY: mark1Y,
      rightX: pt0?.x,
      rightY: pt0?.y,
    },
    {
      label: 'B / B',
      value: formatDisplay(result.distanceBetweenBends, unitMode),
      naturalY: (mark1Y + mark2Y) / 2 - CARD_H / 2,
      leftBracket: true,
      leftBracketY1: mark1Y,
      leftBracketY2: mark2Y,
      rightX: pt1 && pt2 ? (pt1.x + pt2.x) / 2 : undefined,
      rightY: pt1 && pt2 ? (pt1.y + pt2.y) / 2 : undefined,
    },
    {
      label: 'Mark 2',
      value: formatDisplay(result.mark2FromEnd, unitMode),
      naturalY: mark2Y - CARD_H / 2,
      leftY: mark2Y,
      rightX: pt2?.x,
      rightY: pt2?.y,
    },
    {
      label: 'Rise',
      value: formatDisplay(result.rise, unitMode),
      naturalY: pt4 ? pt4.y - CARD_H / 2 : SVG_H * 0.78,
      rightX: pt4 ? (originX + pt4.x) / 2 : undefined,
      rightY: pt4?.y,
    },
  ]

  const cards = spreadCards(rawCards, SVG_H, CARD_H, CARD_GAP)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className={styles.svg}
        aria-label="Conduit bend visualizer"
      >
        <rect width={SVG_W} height={SVG_H} fill="var(--diagram-bg, #0f0f0f)" />

        <defs>
          <marker id="cv-arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#4a9eff" opacity={0.85} />
          </marker>
          <marker id="cv-arr-rev" markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto">
            <path d="M7,0 L0,3.5 L7,7 Z" fill="#4a9eff" opacity={0.85} />
          </marker>
        </defs>

        {/* ── Left zone: straight conduit ──────────────────── */}
        <ConduitStrip
          x={STRIP_X}
          y={0}
          width={STRIP_W}
          height={SVG_H}
          marks={stripMarks}
        />

        {/* ── Right zone: bent conduit ──────────────────────── */}
        <BendDiagram
          x={DIAG_X}
          y={0}
          width={DIAG_W}
          height={SVG_H}
          result={result}
        />

        {/* ── Center zone: cards + leader lines ─────────────── */}
        {cards.map((card, i) => {
          const cardCY = card.naturalY + CARD_H / 2

          return (
            <g key={i}>
              {/* Left leader */}
              {card.leftBracket && card.leftBracketY1 != null && card.leftBracketY2 != null ? (
                <g stroke="#4a9eff" strokeWidth={1.5} opacity={0.65} fill="none">
                  {/* Vertical bracket bar on strip right edge */}
                  <line x1={STRIP_RIGHT + 5} y1={card.leftBracketY1} x2={STRIP_RIGHT + 5} y2={card.leftBracketY2} />
                  {/* Bracket end ticks */}
                  <line x1={STRIP_RIGHT + 5} y1={card.leftBracketY1} x2={STRIP_RIGHT + 10} y2={card.leftBracketY1} />
                  <line x1={STRIP_RIGHT + 5} y1={card.leftBracketY2} x2={STRIP_RIGHT + 10} y2={card.leftBracketY2} />
                  {/* Horizontal leader from bracket midpoint to card */}
                  <line
                    x1={STRIP_RIGHT + 5}
                    y1={(card.leftBracketY1 + card.leftBracketY2) / 2}
                    x2={CARDS_X}
                    y2={cardCY}
                    strokeDasharray="4,3"
                    strokeWidth={1}
                    markerEnd="url(#cv-arr)"
                  />
                </g>
              ) : card.leftY != null ? (
                <line
                  x1={STRIP_RIGHT}
                  y1={card.leftY}
                  x2={CARDS_X}
                  y2={cardCY}
                  stroke="#4a9eff"
                  strokeWidth={1}
                  strokeDasharray="4,3"
                  opacity={0.65}
                  markerEnd="url(#cv-arr)"
                />
              ) : null}

              {/* Right leader */}
              {card.rightX != null && card.rightY != null && (
                <line
                  x1={CARDS_RIGHT}
                  y1={cardCY}
                  x2={card.rightX}
                  y2={card.rightY}
                  stroke="#4a9eff"
                  strokeWidth={1}
                  strokeDasharray="4,3"
                  opacity={0.65}
                  markerEnd="url(#cv-arr)"
                />
              )}

              {/* Card body */}
              <rect
                x={CARDS_X}
                y={card.naturalY}
                width={CARDS_W}
                height={CARD_H}
                rx={7}
                fill="rgba(20,20,22,0.96)"
                stroke="#4a9eff"
                strokeWidth={0.8}
              />
              <text
                x={CARDS_X + CARDS_W / 2}
                y={card.naturalY + 13}
                textAnchor="middle"
                fill="#4a9eff"
                fontSize={8.5}
                fontFamily="sans-serif"
                fontWeight="700"
                letterSpacing="0.07em"
              >
                {card.label.toUpperCase()}
              </text>
              <text
                x={CARDS_X + CARDS_W / 2}
                y={card.naturalY + 29}
                textAnchor="middle"
                fill="white"
                fontSize={13}
                fontFamily="'IBM Plex Mono', monospace"
                fontWeight="700"
              >
                {card.value}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Spread cards vertically to prevent overlap ────────────────────────────────

function spreadCards(
  cards: CardSpec[],
  svgH: number,
  cardH: number,
  gap: number,
): CardSpec[] {
  const out = [...cards].sort((a, b) => a.naturalY - b.naturalY)

  // Push down to resolve overlaps
  for (let i = 1; i < out.length; i++) {
    const prevBottom = out[i - 1].naturalY + cardH
    if (out[i].naturalY < prevBottom + gap) {
      out[i] = { ...out[i], naturalY: prevBottom + gap }
    }
  }

  // Shift up if bottom overflows
  const last = out[out.length - 1]
  const overflow = last.naturalY + cardH - (svgH - 4)
  if (overflow > 0) {
    for (let i = 0; i < out.length; i++) {
      out[i] = { ...out[i], naturalY: out[i].naturalY - overflow }
    }
  }

  // Clamp top
  if (out[0]?.naturalY < 4) {
    const shift = 4 - out[0].naturalY
    for (let i = 0; i < out.length; i++) {
      out[i] = { ...out[i], naturalY: out[i].naturalY + shift }
    }
  }

  return out
}
