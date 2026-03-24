// src/pages/Calculator/OffsetCalculator.tsx

import React, { useState, useMemo } from 'react'
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonPage,
  IonButtons,
  IonMenuButton,
  IonIcon,
  IonButton,
} from '@ionic/react'
import { alertCircleOutline, ellipsisVertical } from 'ionicons/icons'
import { computeOffset } from '../../lib/bendMath'
import { formatDisplay } from '../../lib/units'
import { buildConduitPath } from '../../lib/svgPath'
import type { Segment } from '../../lib/svgPath'
import { useBender } from '../../hooks/useBender'
import { useSettings } from '../../hooks/useSettings'
import { ConduitStrip, offsetResultToStripMarks } from '../../components/ConduitStrip'
import styles from './Calculator.module.css'

const QUICK_ANGLES = [10, 15, 22.5, 30, 45]
const LEG_IN      = 6     // straight leg in diagram (inches)
const TUBE_IN     = 0.75  // tube visual half-width (inches)
// DISPLAY_DIST is the fixed reference distance-between-bends used ONLY for
// computing the diagram scale. Changing rise never resizes the visual.
const DISPLAY_DIST  = 14  // inches
const STRIP_LEN     = 60  // inches — display conduit length for the straight strip

// SVG canvas (4:3 matches diagramContainer aspect-ratio)
const VW = 400
const VH = 300

// SVG layout zones
const STRIP_X = 6
const STRIP_W = 20
const DIAG_X  = 34           // diagram left edge
const DIAG_W  = 246          // diagram width — right 120px reserved for card overlay

const DIM_COLOR = '#4a9eff'
const DIM_DASH  = '4 3'

const VALIDITY_COLORS: Record<string, string> = {
  ok:      '#30d158',
  warning: '#ff9f0a',
  error:   '#ff453a',
}

function toRad(deg: number): number { return deg * Math.PI / 180 }

export function OffsetCalculator(): JSX.Element {
  const { selectedShoe, selectedBender } = useBender()
  const { settings } = useSettings()

  const [riseStr,  setRiseStr]  = useState('6')
  const [thetaStr, setThetaStr] = useState('22.5')

  const rise     = parseFloat(riseStr)  || 0
  const thetaDeg = parseFloat(thetaStr) || 22.5
  const unitLabel = settings.units === 'cm' ? 'cm' : '"'

  // ── Computed values from actual inputs (cards + mark list only) ──────────
  const result = useMemo(() => {
    if (!selectedShoe || rise <= 0 || thetaDeg <= 0) return null
    try { return computeOffset({ rise, thetaDeg, benderShoe: selectedShoe }) }
    catch { return null }
  }, [rise, thetaDeg, selectedShoe])

  // ── SVG diagram — depends ONLY on shoe + angle, NOT on rise ─────────────
  // Uses DISPLAY_DIST for scale so visual size is constant regardless of rise.
  const diagram = useMemo(() => {
    if (!selectedShoe || thetaDeg <= 0) return null

    const r   = selectedShoe.centerlineRadius
    const pad = 12

    // Reference segments: fixed DISPLAY_DIST used purely for scale computation
    const refSegs: Segment[] = [
      { type: 'line', length: LEG_IN },
      { type: 'arc',  radius: r, angleDeg: thetaDeg, sweepFlag: 0 },
      { type: 'line', length: DISPLAY_DIST },
      { type: 'arc',  radius: r, angleDeg: thetaDeg, sweepFlag: 1 },
      { type: 'line', length: LEG_IN },
    ]
    const refBb = buildConduitPath(refSegs, 0, 0, 90, 1).boundingBox
    const scale = Math.min(
      refBb.width  > 0 ? (DIAG_W - pad * 2) / refBb.width  : 1,
      refBb.height > 0 ? (VH     - pad * 2) / refBb.height : 1,
    )

    // Center the reference path within the diagram zone
    const ox = DIAG_X + pad + (DIAG_W - pad * 2 - refBb.width  * scale) / 2 - refBb.x * scale
    const oy =          pad + (VH     - pad * 2 - refBb.height * scale) / 2 - refBb.y * scale

    const fin = buildConduitPath(refSegs, ox, oy, 90, scale)
    const eps = fin.segmentEndpoints   // [0]=end of leg1, [1]=end of arc1, [2]=end of mid, [3]=end of arc2, [4]=end of leg2

    return {
      d: fin.d,
      tubeW: Math.max(4, TUBE_IN * scale),
      rs:    (r * scale).toFixed(1),
      scale,
      startX: ox,
      startY: oy,
      // Named endpoints for annotation math
      pt0: eps[0],  // start of first arc
      pt1: eps[1],  // end of first arc / start of middle leg
      pt2: eps[2],  // end of middle leg / start of second arc
      pt3: eps[3],  // end of second arc / start of last leg
      pt4: eps[4],  // tip of last leg
    }
  }, [selectedShoe, thetaDeg])

  // Bend arc color from validity (changes with rise but doesn't affect shape)
  const bendColor = result
    ? (VALIDITY_COLORS[result.validity] ?? VALIDITY_COLORS.ok)
    : VALIDITY_COLORS.ok

  // ── Annotation geometry (derived from fixed diagram, not from rise) ──────
  const annot = diagram ? (() => {
    const { pt0, pt1, pt2, pt3, startX, tubeW } = diagram

    // ① Angle arc indicator at pt0 (start of first bend)
    // Two rays + small arc showing how much the conduit deflects
    const arcIndR   = 14
    // Incoming direction: straight down (heading 90°) → ray goes downward from pt0
    const inRayEnd  = { x: pt0.x,                                        y: pt0.y + arcIndR }
    // Outgoing direction: (90 − thetaDeg)° → ray goes diagonally from pt0
    const outRayEnd = {
      x: pt0.x + arcIndR * Math.sin(toRad(thetaDeg)),
      y: pt0.y + arcIndR * Math.cos(toRad(thetaDeg)),
    }

    // ② Rise: horizontal double-arrow spanning entry-x to exit-x
    // Drawn at the vertical midpoint of the middle diagonal segment
    const riseY  = (pt1.y + pt2.y) / 2
    const riseX1 = startX     // entry run centerline x (same as startX — first leg goes straight down)
    const riseX2 = pt3.x      // exit run centerline x (offset horizontally by display-rise)

    // ③ Between-bends: dashed double-arrow from pt1 to pt2
    // Offset slightly toward upper-right (perpendicular CW from diagonal heading)
    const diagHeadingDeg = 90 - thetaDeg   // conduit heading along middle segment
    const perpCwDx =  (tubeW / 2 + 8) * Math.sin(toRad(diagHeadingDeg))   //  CW perp = rotate +90°
    const perpCwDy = -(tubeW / 2 + 8) * Math.cos(toRad(diagHeadingDeg))
    const bb1 = { x: pt1.x + perpCwDx, y: pt1.y + perpCwDy }
    const bb2 = { x: pt2.x + perpCwDx, y: pt2.y + perpCwDy }

    return { arcIndR, inRayEnd, outRayEnd, riseY, riseX1, riseX2, bb1, bb2 }
  })() : null

  // Strip marks from actual result (shows real mark distances on a straight stick)
  const stripMarks = result ? offsetResultToStripMarks(result, STRIP_LEN) : []

  // ── No bender selected ───────────────────────────────────────────────────
  if (!selectedShoe) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start"><IonMenuButton /></IonButtons>
            <IonTitle>Offset</IonTitle>
            <IonButtons slot="end">
              <IonButton disabled><IonIcon slot="icon-only" icon={ellipsisVertical} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className={styles.noBenderPrompt}>
            <IonIcon icon={alertCircleOutline} className={styles.noBenderIcon} />
            <p>Open the menu and select a bender to begin.</p>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Offset</IonTitle>
          <IonButtons slot="end">
            <IonButton disabled><IonIcon slot="icon-only" icon={ellipsisVertical} /></IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>

        {/* ── Bender chip row ─────────────────────────────────── */}
        <div className={styles.benderRow}>
          <div className={styles.benderChip}>
            {selectedBender?.manufacturer} {selectedBender?.model}
          </div>
          <div className={styles.benderChip}>{selectedShoe.conduitType}</div>
          <div className={styles.benderChip}>{selectedShoe.tradeSize}"</div>
        </div>

        {/* ── Diagram + overlaid cards ─────────────────────────── */}
        <div className={styles.diagramContainer}>

          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            className={styles.diagramSvg}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Cylindrical tube gradient */}
              <linearGradient id="oc-tube-g" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%"   stopColor="#1c1c1e" />
                <stop offset="50%"  stopColor="#5a5a5c" />
                <stop offset="100%" stopColor="#1c1c1e" />
              </linearGradient>
              {/* Drop shadow */}
              <filter id="oc-shadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.8)" />
              </filter>
              {/* Dimension arrowhead (forward) */}
              <marker id="da" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill={DIM_COLOR} />
              </marker>
              {/* Dimension arrowhead (reverse) */}
              <marker id="da-r" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
                <path d="M0,0 L6,3 L0,6 Z" fill={DIM_COLOR} />
              </marker>
            </defs>

            {/* ── Left: straight conduit strip with mark ticks ── */}
            <ConduitStrip
              x={STRIP_X}
              y={0}
              width={STRIP_W}
              height={VH}
              marks={stripMarks}
            />

            {/* Vertical separator between strip and diagram */}
            <line
              x1={STRIP_X + STRIP_W + 4} y1={10}
              x2={STRIP_X + STRIP_W + 4} y2={VH - 10}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />

            {/* ── Right: bent conduit diagram ── */}
            {diagram ? (
              <>
                {/* Full tube in gray (rendered first so color arcs sit on top) */}
                <path
                  d={diagram.d}
                  fill="none"
                  stroke="url(#oc-tube-g)"
                  strokeWidth={diagram.tubeW}
                  strokeLinecap="round"
                  filter="url(#oc-shadow)"
                />

                {/* First bend arc colored by validity */}
                <path
                  d={`M ${diagram.pt0.x.toFixed(1)} ${diagram.pt0.y.toFixed(1)} A ${diagram.rs} ${diagram.rs} 0 0 0 ${diagram.pt1.x.toFixed(1)} ${diagram.pt1.y.toFixed(1)}`}
                  fill="none"
                  stroke={bendColor}
                  strokeWidth={diagram.tubeW}
                  strokeLinecap="round"
                />

                {/* Second bend arc colored by validity */}
                <path
                  d={`M ${diagram.pt2.x.toFixed(1)} ${diagram.pt2.y.toFixed(1)} A ${diagram.rs} ${diagram.rs} 0 0 1 ${diagram.pt3.x.toFixed(1)} ${diagram.pt3.y.toFixed(1)}`}
                  fill="none"
                  stroke={bendColor}
                  strokeWidth={diagram.tubeW}
                  strokeLinecap="round"
                />

                {/* ── Dimension annotations ── */}
                {annot && (
                  <g>
                    {/* ① Angle indicator: two rays + arc at pt0 */}
                    <line
                      x1={diagram.pt0.x} y1={diagram.pt0.y}
                      x2={annot.inRayEnd.x}  y2={annot.inRayEnd.y}
                      stroke={DIM_COLOR} strokeWidth={1} opacity={0.6}
                    />
                    <line
                      x1={diagram.pt0.x} y1={diagram.pt0.y}
                      x2={annot.outRayEnd.x} y2={annot.outRayEnd.y}
                      stroke={DIM_COLOR} strokeWidth={1} opacity={0.6}
                    />
                    {/* Arc sweeps CCW from inRayEnd to outRayEnd (same sweep as the actual bend) */}
                    <path
                      d={`M ${annot.inRayEnd.x.toFixed(1)} ${annot.inRayEnd.y.toFixed(1)} A ${annot.arcIndR} ${annot.arcIndR} 0 0 0 ${annot.outRayEnd.x.toFixed(1)} ${annot.outRayEnd.y.toFixed(1)}`}
                      fill="none"
                      stroke={DIM_COLOR}
                      strokeWidth={1.5}
                    />
                    {/* "ANGLE" label near the arc */}
                    <text
                      x={diagram.pt0.x + annot.arcIndR + 3}
                      y={diagram.pt0.y + annot.arcIndR * 0.6}
                      fill={DIM_COLOR} fontSize={7} fontFamily="monospace"
                    >ANGLE</text>

                    {/* ② Rise: short tick marks + horizontal double-arrow */}
                    {/* Left tick */}
                    <line
                      x1={annot.riseX1} y1={annot.riseY - 7}
                      x2={annot.riseX1} y2={annot.riseY + 7}
                      stroke={DIM_COLOR} strokeWidth={1}
                    />
                    {/* Right tick */}
                    <line
                      x1={annot.riseX2} y1={annot.riseY - 7}
                      x2={annot.riseX2} y2={annot.riseY + 7}
                      stroke={DIM_COLOR} strokeWidth={1}
                    />
                    {/* Horizontal arrow */}
                    <line
                      x1={annot.riseX1 + 1} y1={annot.riseY}
                      x2={annot.riseX2 - 1} y2={annot.riseY}
                      stroke={DIM_COLOR} strokeWidth={1.5}
                      markerStart="url(#da-r)"
                      markerEnd="url(#da)"
                    />
                    <text
                      x={(annot.riseX1 + annot.riseX2) / 2}
                      y={annot.riseY - 9}
                      textAnchor="middle"
                      fill={DIM_COLOR} fontSize={7} fontFamily="monospace"
                    >RISE</text>

                    {/* ③ Between-bends: dashed diagonal double-arrow offset from tube */}
                    <line
                      x1={annot.bb1.x.toFixed(1)} y1={annot.bb1.y.toFixed(1)}
                      x2={annot.bb2.x.toFixed(1)} y2={annot.bb2.y.toFixed(1)}
                      stroke={DIM_COLOR} strokeWidth={1.5}
                      strokeDasharray={DIM_DASH}
                      markerStart="url(#da-r)"
                      markerEnd="url(#da)"
                    />
                    <text
                      x={((annot.bb1.x + annot.bb2.x) / 2 + 4).toFixed(1)}
                      y={((annot.bb1.y + annot.bb2.y) / 2 - 5).toFixed(1)}
                      fill={DIM_COLOR} fontSize={7} fontFamily="monospace"
                    >B/B</text>
                  </g>
                )}
              </>
            ) : (
              <text
                x={DIAG_X + DIAG_W / 2} y={VH / 2}
                textAnchor="middle"
                fill="rgba(255,255,255,0.2)"
                fontSize={14}
                fontFamily="sans-serif"
              >Enter an angle to preview</text>
            )}
          </svg>

          {/* ── Floating card column (HTML overlay, right side) ── */}
          <div className={styles.cardCol}>

            <div className={styles.fCard}>
              <span className={styles.fLabel}>Between Bends</span>
              <span className={styles.fValue}>
                {result ? formatDisplay(result.distanceBetweenBends, settings.units) : '—'}
              </span>
            </div>

            <div className={styles.fCard}>
              <span className={styles.fLabel}>Bend</span>
              <div className={styles.fInputRow}>
                <input
                  className={styles.fInput}
                  type="number"
                  inputMode="decimal"
                  value={thetaStr}
                  onChange={e => setThetaStr(e.target.value)}
                />
                <span className={styles.fUnit}>°</span>
              </div>
            </div>

            <div className={styles.fCard}>
              <span className={styles.fLabel}>Rise</span>
              <div className={styles.fInputRow}>
                <input
                  className={styles.fInput}
                  type="number"
                  inputMode="decimal"
                  value={riseStr}
                  onChange={e => setRiseStr(e.target.value)}
                />
                <span className={styles.fUnit}>{unitLabel}</span>
              </div>
            </div>

            <div className={styles.fCard}>
              <span className={styles.fLabel}>Shrink</span>
              <span className={styles.fValue}>
                {result ? formatDisplay(result.shrink, settings.units) : '—'}
              </span>
            </div>

          </div>
        </div>

        {/* ── Quick angle chips ────────────────────────────────── */}
        <div className={styles.quickAngles}>
          {QUICK_ANGLES.map(a => (
            <button
              key={a}
              className={`${styles.angleChip} ${parseFloat(thetaStr) === a ? styles.angleChipActive : ''}`}
              onClick={() => setThetaStr(String(a))}
            >
              {a}°
            </button>
          ))}
        </div>

        {/* ── Mark list ────────────────────────────────────────── */}
        {result && (
          <div className={styles.markList}>
            <div className={styles.markRow}>
              <div className={styles.markDot} />
              <div className={styles.markInfo}>
                <span className={styles.markLabel}>Mark 1</span>
                <span className={styles.markAngle}>{result.thetaDeg}° ↑</span>
              </div>
              <div className={styles.markDist}>
                {formatDisplay(result.mark1FromEnd, settings.units)}
                <span className={styles.markDistLabel}> from end</span>
              </div>
            </div>
            <div className={styles.markRow}>
              <div className={styles.markDot} />
              <div className={styles.markInfo}>
                <span className={styles.markLabel}>Mark 2</span>
                <span className={styles.markAngle}>{result.thetaDeg}° ↓</span>
              </div>
              <div className={styles.markDist}>
                {formatDisplay(result.mark2FromEnd, settings.units)}
                <span className={styles.markDistLabel}> from end</span>
              </div>
            </div>
          </div>
        )}

      </IonContent>
    </IonPage>
  )
}
