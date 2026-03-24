// src/pages/Calculator/OffsetCalculator.tsx
// Clean layout inspired by mockup: bender chips → diagram + floating cards → mark list.

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
import styles from './Calculator.module.css'

const QUICK_ANGLES = [10, 15, 22.5, 30, 45]
const LEG_IN = 6        // straight leg length shown in diagram (inches)
const TUBE_IN = 0.75    // visual tube width (inches)
// Fixed reference distance used solely for computing diagram scale.
// Rise input never affects visual size — only angle changes the shape.
const DISPLAY_DIST = 14  // inches

const VALIDITY_COLORS: Record<string, string> = {
  ok: '#30d158',
  warning: '#ff9f0a',
  error: '#ff453a',
}

// SVG canvas — 4:3, matches diagramContainer CSS aspect-ratio
const VW = 400
const VH = 300

export function OffsetCalculator(): JSX.Element {
  const { selectedShoe, selectedBender } = useBender()
  const { settings } = useSettings()

  const [riseStr, setRiseStr] = useState('6')
  const [thetaStr, setThetaStr] = useState('22.5')

  const rise = parseFloat(riseStr) || 0
  const thetaDeg = parseFloat(thetaStr) || 22.5
  const unitLabel = settings.units === 'cm' ? 'cm' : '"'

  const result = useMemo(() => {
    if (!selectedShoe || rise <= 0 || thetaDeg <= 0) return null
    try { return computeOffset({ rise, thetaDeg, benderShoe: selectedShoe }) }
    catch { return null }
  }, [rise, thetaDeg, selectedShoe])

  // Build the conduit SVG path.
  // Scale is derived from a FIXED reference distance (DISPLAY_DIST) so that
  // the diagram size never changes when rise changes — only the angle affects shape.
  const diagram = useMemo(() => {
    if (!result) return null

    // Formula: centerline radius from developed length and angle
    const r = result.developedLength / (Math.PI * (thetaDeg / 180)) || 4

    // Reference segments — use fixed DISPLAY_DIST to compute a stable scale
    const refSegments: Segment[] = [
      { type: 'line', length: LEG_IN },
      { type: 'arc', radius: r, angleDeg: thetaDeg, sweepFlag: 0 },
      { type: 'line', length: DISPLAY_DIST },
      { type: 'arc', radius: r, angleDeg: thetaDeg, sweepFlag: 1 },
      { type: 'line', length: LEG_IN },
    ]
    const refBb = buildConduitPath(refSegments, 0, 0, 90, 1).boundingBox
    const pad = 20
    const scale = Math.min(
      refBb.width  > 0 ? (VW - pad * 2) / refBb.width  : 1,
      refBb.height > 0 ? (VH - pad * 2) / refBb.height : 1,
    )

    // Actual segments use the real distanceBetweenBends — centered at fixed scale
    const segments: Segment[] = [
      { type: 'line', length: LEG_IN },
      { type: 'arc', radius: r, angleDeg: thetaDeg, sweepFlag: 0 },
      { type: 'line', length: result.distanceBetweenBends },
      { type: 'arc', radius: r, angleDeg: thetaDeg, sweepFlag: 1 },
      { type: 'line', length: LEG_IN },
    ]
    const rawBb = buildConduitPath(segments, 0, 0, 90, 1).boundingBox
    const ox = VW / 2 - (rawBb.x + rawBb.width  / 2) * scale
    const oy = VH / 2 - (rawBb.y + rawBb.height / 2) * scale

    const fin = buildConduitPath(segments, ox, oy, 90, scale)
    const eps = fin.segmentEndpoints
    const rs  = (r * scale).toFixed(1)

    return {
      d: fin.d,
      tubeW: TUBE_IN * scale,
      bendColor: VALIDITY_COLORS[result.validity] ?? VALIDITY_COLORS.ok,
      r, scale, rs,
      pt0: eps[0], pt1: eps[1], pt2: eps[2], pt3: eps[3], pt4: eps[4],
    }
  }, [result, thetaDeg])

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

        {/* ── Diagram + overlaid input/result cards ───────────── */}
        <div className={styles.diagramContainer}>

          {/* SVG conduit geometry */}
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            className={styles.diagramSvg}
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width={VW} height={VH} fill="#0f0f0f" rx={0} />

            {diagram ? (
              <>
                <defs>
                  <linearGradient id="oc-sg" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%"   stopColor="#1c1c1e" />
                    <stop offset="50%"  stopColor="#5a5a5c" />
                    <stop offset="100%" stopColor="#1c1c1e" />
                  </linearGradient>
                  <filter id="oc-shadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.8)" />
                  </filter>
                </defs>

                {/* Full tube in gray */}
                <path
                  d={diagram.d}
                  fill="none"
                  stroke="url(#oc-sg)"
                  strokeWidth={diagram.tubeW}
                  strokeLinecap="round"
                  filter="url(#oc-shadow)"
                />

                {/* First bend arc in validity color */}
                {diagram.pt0 && diagram.pt1 && (
                  <path
                    d={`M ${diagram.pt0.x.toFixed(1)} ${diagram.pt0.y.toFixed(1)} A ${diagram.rs} ${diagram.rs} 0 0 0 ${diagram.pt1.x.toFixed(1)} ${diagram.pt1.y.toFixed(1)}`}
                    fill="none"
                    stroke={diagram.bendColor}
                    strokeWidth={diagram.tubeW}
                    strokeLinecap="round"
                  />
                )}

                {/* Second bend arc in validity color */}
                {diagram.pt2 && diagram.pt3 && (
                  <path
                    d={`M ${diagram.pt2.x.toFixed(1)} ${diagram.pt2.y.toFixed(1)} A ${diagram.rs} ${diagram.rs} 0 0 1 ${diagram.pt3.x.toFixed(1)} ${diagram.pt3.y.toFixed(1)}`}
                    fill="none"
                    stroke={diagram.bendColor}
                    strokeWidth={diagram.tubeW}
                    strokeLinecap="round"
                  />
                )}
              </>
            ) : (
              <text
                x={VW / 2} y={VH / 2}
                textAnchor="middle"
                fill="rgba(255,255,255,0.2)"
                fontSize={14}
                fontFamily="sans-serif"
              >
                Enter values below
              </text>
            )}
          </svg>

          {/* Floating card column — overlaid on right side of diagram */}
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
