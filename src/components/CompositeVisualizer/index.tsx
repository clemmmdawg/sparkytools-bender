// src/components/CompositeVisualizer/index.tsx
// Three-zone SVG: left = straight conduit, center = annotated cards, right = bent conduit.
// The diagram is scaled so the bend marks align horizontally with the strip marks.

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

// ── Fixed SVG canvas ─────────────────────────────────────────────────────────
const SVG_W = 400
const SVG_H = 340

// Zone boundaries
const STRIP_X    = 6
const STRIP_W    = 44
const STRIP_RIGHT = STRIP_X + STRIP_W   // 50

const CARDS_X    = 58
const CARDS_W    = 106
const CARDS_RIGHT = CARDS_X + CARDS_W  // 164

const DIAG_X     = 170
const DIAG_W     = SVG_W - DIAG_X - 4  // 226

// Must match BendDiagram internals so both compute the same geometry
const LEG_LENGTH_INCHES  = 6
const TUBE_WIDTH_INCHES  = 0.75

// The strip always represents this stick length
const DISPLAY_LENGTH = 36  // inches

const CARD_H  = 38
const CARD_GAP = 5

interface CardSpec {
  label: string
  value: string
  naturalY: number
  leftY?: number
  leftBracket?: boolean
  leftBracketY1?: number
  leftBracketY2?: number
  rightX?: number
  rightY?: number
}

interface Point { x: number; y: number }

export function CompositeVisualizer({ result, unitMode }: CompositeVisualizerProps): JSX.Element {
  // ── Compute geometry so we control scale/origin for alignment ─────────────
  const layout = useMemo(() => {
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

    // Fixed scale — never changes with inputs. 1 inch = SVG_H / DISPLAY_LENGTH pixels.
    const scale = SVG_H / DISPLAY_LENGTH

    // Get raw bounding box for horizontal centering
    const rawPath = buildConduitPath(segments, 0, 0, 90, 1)
    const bb      = rawPath.boundingBox

    // Strip mark positions at the same fixed scale
    const mark1Y = Math.min(result.mark1FromEnd * scale, SVG_H - 60)
    const mark2Y = Math.min(result.mark2FromEnd * scale, SVG_H - 20)

    // Align pt0 (end of first straight leg, y_raw = LEG_LENGTH) with mark1Y
    const originY = mark1Y - LEG_LENGTH_INCHES * scale

    // Center the path horizontally in the diagram zone
    const centerRawX = bb.x + bb.width / 2
    const originX    = DIAG_X + DIAG_W / 2 - centerRawX * scale

    // Build final path at fixed scale
    const finalPath = buildConduitPath(segments, originX, originY, 90, scale)
    const eps        = finalPath.segmentEndpoints

    return {
      mark1Y, mark2Y,
      scale, originX, originY,
      d: finalPath.d,
      pt0: eps[0] as Point | undefined,
      pt1: eps[1] as Point | undefined,
      pt2: eps[2] as Point | undefined,
      pt3: eps[3] as Point | undefined,
      pt4: eps[4] as Point | undefined,
      actualRadius,
      segments,
    }
  }, [result])

  const { mark1Y, mark2Y, scale, originX, originY, pt0, pt1, pt2, pt4 } = layout

  // ── Strip marks ──────────────────────────────────────────────────────────
  const stripMarks = useMemo(
    () => offsetResultToStripMarks(result, DISPLAY_LENGTH),
    [result],
  )

  // ── Card definitions ─────────────────────────────────────────────────────
  // Cards: Rise, Angle, Between Bends, Shrink
  // naturalY = preferred top-of-card Y before collision resolution.

  const midArcX = pt0 && pt1 ? (pt0.x + pt1.x) / 2 : undefined
  const midArcY = pt0 && pt1 ? (pt0.y + pt1.y) / 2 : undefined

  const midLegX = pt1 && pt2 ? (pt1.x + pt2.x) / 2 : undefined
  const midLegY = pt1 && pt2 ? (pt1.y + pt2.y) / 2 : undefined

  // Rise arrow: point to horizontal midpoint between the two parallel runs
  const riseArrowX = pt4 ? (originX + pt4.x) / 2 : undefined
  const riseArrowY = pt4?.y

  const rawCards: CardSpec[] = [
    {
      label: 'Angle',
      value: `${result.thetaDeg}°`,
      naturalY: mark1Y - CARD_H / 2,
      leftY: mark1Y,
      rightX: midArcX,
      rightY: midArcY,
    },
    {
      label: 'B / B',
      value: formatDisplay(result.distanceBetweenBends, unitMode),
      naturalY: (mark1Y + mark2Y) / 2 - CARD_H / 2,
      leftBracket: true,
      leftBracketY1: mark1Y,
      leftBracketY2: mark2Y,
      rightX: midLegX,
      rightY: midLegY,
    },
    {
      label: 'Rise',
      value: formatDisplay(result.rise, unitMode),
      naturalY: riseArrowY != null ? riseArrowY - CARD_H / 2 : SVG_H * 0.78,
      rightX: riseArrowX,
      rightY: riseArrowY,
    },
    {
      label: 'Shrink',
      value: formatDisplay(result.shrink, unitMode),
      naturalY: SVG_H * 0.88 - CARD_H / 2,
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
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#4a9eff" opacity={0.9} />
          </marker>
          <clipPath id="diag-zone-clip">
            <rect x={DIAG_X} y={0} width={DIAG_W} height={SVG_H} />
          </clipPath>
        </defs>

        {/* ── Left zone: straight conduit strip ── */}
        <ConduitStrip
          x={STRIP_X} y={0}
          width={STRIP_W} height={SVG_H}
          marks={stripMarks}
        />

        {/* ── Right zone: bent conduit (pre-computed layout for alignment) ── */}
        <g clipPath="url(#diag-zone-clip)">
          <BendDiagram
            x={DIAG_X} y={0}
            width={DIAG_W} height={SVG_H}
            result={result}
            layoutOverride={{ originX, originY, scale }}
          />
        </g>

        {/* ── Center zone: annotated result cards ── */}
        {cards.map((card, i) => {
          const cardCY = card.naturalY + CARD_H / 2

          return (
            <g key={i}>
              {/* Left leader */}
              {card.leftBracket && card.leftBracketY1 != null && card.leftBracketY2 != null ? (
                <g stroke="#4a9eff" strokeWidth={1.5} opacity={0.6} fill="none">
                  {/* Vertical bracket on strip right edge */}
                  <line x1={STRIP_RIGHT + 5} y1={card.leftBracketY1} x2={STRIP_RIGHT + 5} y2={card.leftBracketY2} />
                  {/* Tick caps */}
                  <line x1={STRIP_RIGHT + 5} y1={card.leftBracketY1} x2={STRIP_RIGHT + 10} y2={card.leftBracketY1} />
                  <line x1={STRIP_RIGHT + 5} y1={card.leftBracketY2} x2={STRIP_RIGHT + 10} y2={card.leftBracketY2} />
                  {/* Leader from bracket midpoint to card */}
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
                  x1={STRIP_RIGHT} y1={card.leftY}
                  x2={CARDS_X}     y2={cardCY}
                  stroke="#4a9eff" strokeWidth={1}
                  strokeDasharray="4,3" opacity={0.6}
                  markerEnd="url(#cv-arr)"
                />
              ) : null}

              {/* Right leader */}
              {card.rightX != null && card.rightY != null && (
                <line
                  x1={CARDS_RIGHT} y1={cardCY}
                  x2={card.rightX} y2={card.rightY}
                  stroke="#4a9eff" strokeWidth={1}
                  strokeDasharray="4,3" opacity={0.6}
                  markerEnd="url(#cv-arr)"
                />
              )}

              {/* Card body */}
              <rect
                x={CARDS_X} y={card.naturalY}
                width={CARDS_W} height={CARD_H}
                rx={7}
                fill="rgba(20,20,22,0.96)"
                stroke="#4a9eff" strokeWidth={0.8}
              />
              <text
                x={CARDS_X + CARDS_W / 2} y={card.naturalY + 13}
                textAnchor="middle"
                fill="#4a9eff" fontSize={8.5}
                fontFamily="sans-serif" fontWeight="700"
                letterSpacing="0.07em"
              >
                {card.label.toUpperCase()}
              </text>
              <text
                x={CARDS_X + CARDS_W / 2} y={card.naturalY + 29}
                textAnchor="middle"
                fill="white" fontSize={13}
                fontFamily="'IBM Plex Mono', monospace" fontWeight="700"
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

// ── Collision-avoidance: spread cards vertically ──────────────────────────────

function spreadCards(
  cards: CardSpec[],
  svgH: number,
  cardH: number,
  gap: number,
): CardSpec[] {
  const out = [...cards].sort((a, b) => a.naturalY - b.naturalY)

  for (let i = 1; i < out.length; i++) {
    const prevBottom = out[i - 1].naturalY + cardH
    if (out[i].naturalY < prevBottom + gap) {
      out[i] = { ...out[i], naturalY: prevBottom + gap }
    }
  }

  const last     = out[out.length - 1]
  const overflow = last.naturalY + cardH - (svgH - 4)
  if (overflow > 0) {
    for (let i = 0; i < out.length; i++) {
      out[i] = { ...out[i], naturalY: out[i].naturalY - overflow }
    }
  }

  if (out[0]?.naturalY < 4) {
    const shift = 4 - out[0].naturalY
    for (let i = 0; i < out.length; i++) {
      out[i] = { ...out[i], naturalY: out[i].naturalY + shift }
    }
  }

  return out
}
