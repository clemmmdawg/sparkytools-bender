// src/pages/Calculator/OffsetCalculator.tsx
// Offset calculator — inputs integrated into visualizer card, results below.

import React, { useState, useMemo } from 'react'
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonPage,
  IonButtons,
  IonMenuButton,
  IonCard,
  IonCardContent,
  IonChip,
  IonIcon,
  IonLabel,
  IonButton,
} from '@ionic/react'
import {
  warningOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  ellipsisVertical,
} from 'ionicons/icons'
import { computeOffset } from '../../lib/bendMath'
import { formatDisplay } from '../../lib/units'
import { CompositeVisualizer } from '../../components/CompositeVisualizer'
import { useBender } from '../../hooks/useBender'
import { useSettings } from '../../hooks/useSettings'
import styles from './Calculator.module.css'

const QUICK_ANGLES = [10, 15, 22.5, 30, 45]

export function OffsetCalculator(): JSX.Element {
  const { selectedShoe, selectedBender } = useBender()
  const { settings } = useSettings()

  const [riseStr, setRiseStr] = useState('6')
  const [thetaStr, setThetaStr] = useState('22.5')

  const rise = parseFloat(riseStr) || 0
  const thetaDeg = parseFloat(thetaStr) || 22.5

  const result = useMemo(() => {
    if (!selectedShoe || rise <= 0 || thetaDeg <= 0) return null
    try {
      return computeOffset({ rise, thetaDeg, benderShoe: selectedShoe })
    } catch {
      return null
    }
  }, [rise, thetaDeg, selectedShoe])

  const validityColor =
    result?.validity === 'error' ? 'danger' :
    result?.validity === 'warning' ? 'warning' :
    'success'

  const validityIcon =
    result?.validity === 'error' ? alertCircleOutline :
    result?.validity === 'warning' ? warningOutline :
    checkmarkCircleOutline

  const unitLabel = settings.units === 'cm' ? 'cm' : '"'

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
        <IonContent className="ion-padding">
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
            {result && (
              <IonChip color={validityColor} className={styles.validityChip}>
                <IonIcon icon={validityIcon} />
                <IonLabel>{result.validity === 'ok' ? 'Valid' : result.validity}</IonLabel>
              </IonChip>
            )}
            <IonButton disabled>
              <IonIcon slot="icon-only" icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* ── Visualizer card with integrated inputs ─────────── */}
        <div className={styles.vizCard}>
          {/* Diagram area */}
          {result && result.validity !== 'error' ? (
            <CompositeVisualizer result={result} unitMode={settings.units} />
          ) : result?.validity === 'error' ? (
            <div className={styles.errorState}>
              <IonIcon icon={alertCircleOutline} color="danger" className={styles.errorIcon} />
              <p className={styles.errorMsg}>{result.validityMessage ?? 'Invalid inputs'}</p>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>Enter rise and angle above to see the bend diagram.</p>
            </div>
          )}

          {/* Inputs integrated at the bottom of the viz card */}
          <div className={styles.vizInputRow}>
            <div className={styles.vizInputGroup}>
              <span className={styles.vizInputLabel}>Rise</span>
              <input
                className={styles.vizInput}
                type="number"
                inputMode="decimal"
                value={riseStr}
                min={0}
                onChange={e => setRiseStr(e.target.value)}
              />
              <span className={styles.vizInputUnit}>{unitLabel}</span>
            </div>

            <div className={styles.vizInputDivider} />

            <div className={styles.vizInputGroup}>
              <span className={styles.vizInputLabel}>Angle</span>
              <input
                className={styles.vizInput}
                type="number"
                inputMode="decimal"
                value={thetaStr}
                min={1}
                max={89}
                onChange={e => setThetaStr(e.target.value)}
              />
              <span className={styles.vizInputUnit}>°</span>
            </div>
          </div>

          {/* Quick-select angle chips */}
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
        </div>

        {/* ── Scrollable results ──────────────────────────────── */}
        {result && (
          <div className={styles.resultSection}>
            <div className={styles.resultSectionTitle}>Marks &amp; Results</div>

            <div className={styles.markList}>
              <div className={styles.markRow}>
                <div className={styles.markDot} style={{ background: 'var(--ion-color-primary)' }} />
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
                <div className={styles.markDot} style={{ background: 'var(--ion-color-primary)' }} />
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

            <div className={styles.resultCards}>
              <ResultCard label="Between Bends" value={formatDisplay(result.distanceBetweenBends, settings.units)} color="secondary" />
              <ResultCard label="Shrink" value={formatDisplay(result.shrink, settings.units)} color="secondary" />
              <ResultCard label="Bend Angle" value={`${result.thetaDeg}°`} color="primary" />
              <ResultCard label="Rise" value={formatDisplay(result.rise, settings.units)} color="primary" />
              <ResultCard label="Dev. Length" value={formatDisplay(result.developedLength, settings.units)} color="medium" />
              <ResultCard label="Gain" value={formatDisplay(result.gain, settings.units)} color="medium" />
            </div>

            <IonCard className={styles.instructionCard}>
              <IonCardContent>
                <ol className={styles.instructions}>
                  <li>Mark the conduit at <strong>{formatDisplay(result.mark1FromEnd, settings.units)}</strong> from the working end.</li>
                  <li>Bend <strong>{result.thetaDeg}°</strong> upward at Mark 1.</li>
                  <li>Measure <strong>{formatDisplay(result.distanceBetweenBends, settings.units)}</strong> from Mark 1 to Mark 2.</li>
                  <li>Bend <strong>{result.thetaDeg}°</strong> downward at Mark 2 (reverse direction).</li>
                  <li>Your run will be <strong>{formatDisplay(result.shrink, settings.units)}</strong> shorter — deduct from total length.</li>
                </ol>
              </IonCardContent>
            </IonCard>
          </div>
        )}
      </IonContent>
    </IonPage>
  )
}

interface ResultCardProps {
  label: string
  value: string
  color: 'primary' | 'secondary' | 'medium'
}

function ResultCard({ label, value, color }: ResultCardProps): JSX.Element {
  const ionColor = color === 'primary' ? 'var(--ion-color-primary)' :
                   color === 'secondary' ? 'var(--ion-color-secondary)' :
                   'var(--ion-text-color-secondary)'
  return (
    <div className={styles.resultCard}>
      <span className={styles.resultCardLabel} style={{ color: ionColor }}>{label}</span>
      <span className={styles.resultCardValue}>{value}</span>
    </div>
  )
}
