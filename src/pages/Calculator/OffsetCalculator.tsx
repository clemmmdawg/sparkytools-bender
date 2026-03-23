// src/pages/Calculator/OffsetCalculator.tsx
// Offset calculator — inputs (rise, bend angle), visualizer, results.

import React, { useState, useMemo } from 'react'
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonPage,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonAlert,
  IonChip,
  IonIcon,
  IonLabel,
  IonButton,
  IonNote,
} from '@ionic/react'
import { warningOutline, checkmarkCircleOutline, alertCircleOutline, chevronUpOutline, chevronDownOutline } from 'ionicons/icons'
import { computeOffset } from '../../lib/bendMath'
import { formatDisplay } from '../../lib/units'
import { CompositeVisualizer } from '../../components/CompositeVisualizer'
import { InputRow } from '../../components/InputRow'
import { useBender } from '../../hooks/useBender'
import { useSettings } from '../../hooks/useSettings'
import styles from './Calculator.module.css'

// Common offset angles
const QUICK_ANGLES = [10, 15, 22.5, 30, 45]

export function OffsetCalculator(): JSX.Element {
  const { selectedShoe, selectedBender } = useBender()
  const { settings } = useSettings()

  const [riseStr, setRiseStr] = useState('6')
  const [thetaStr, setThetaStr] = useState('22.5')
  const [inputsExpanded, setInputsExpanded] = useState(true)

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

  if (!selectedShoe) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>Offset</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className={styles.noBenderPrompt}>
            <IonIcon icon={alertCircleOutline} className={styles.noBenderIcon} />
            <p>Select a bender on the Home tab to begin.</p>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Offset</IonTitle>
          {result && (
            <IonButtons slot="end">
              <IonChip color={validityColor} className={styles.validityChip}>
                <IonIcon icon={validityIcon} />
                <IonLabel>{result.validity === 'ok' ? 'Valid' : result.validity}</IonLabel>
              </IonChip>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Bender info bar */}
        <div className={styles.benderBar}>
          <span className={styles.benderBarText}>
            {selectedBender?.manufacturer} {selectedBender?.model} — {selectedShoe.tradeSize}" {selectedShoe.conduitType}
          </span>
          <span className={styles.benderBarMeta}>CLR {selectedShoe.centerlineRadius}" · Deduct {selectedShoe.deduct}"</span>
        </div>

        {/* Input section (collapsible) */}
        <div className={styles.inputSection}>
          <button
            className={styles.inputToggle}
            onClick={() => setInputsExpanded(e => !e)}
          >
            <span className={styles.inputToggleLabel}>Inputs</span>
            <IonIcon icon={inputsExpanded ? chevronUpOutline : chevronDownOutline} />
          </button>

          {inputsExpanded && (
            <div className={styles.inputs}>
              <InputRow
                label="Rise"
                value={riseStr}
                onChange={setRiseStr}
                unit={settings.units === 'cm' ? 'cm' : '"'}
                placeholder="6"
                validity={result?.validity ?? 'ok'}
                hint={result?.validityMessage}
                inputMode="decimal"
                min={0}
              />
              <div className={styles.angleRow}>
                <InputRow
                  label="Angle"
                  value={thetaStr}
                  onChange={setThetaStr}
                  unit="°"
                  placeholder="22.5"
                  inputMode="decimal"
                  min={1}
                  max={89}
                />
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
            </div>
          )}
        </div>

        {/* Visualizer */}
        {result && result.validity !== 'error' ? (
          <div className={styles.visualizerWrap}>
            <CompositeVisualizer result={result} unitMode={settings.units} />
          </div>
        ) : result?.validity === 'error' ? (
          <div className={styles.errorState}>
            <IonIcon icon={alertCircleOutline} color="danger" className={styles.errorIcon} />
            <p className={styles.errorMsg}>{result.validityMessage ?? 'Invalid inputs'}</p>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Enter rise and angle to see the bend diagram.</p>
          </div>
        )}

        {/* Scrollable results */}
        {result && (
          <div className={styles.resultSection}>
            <div className={styles.resultSectionTitle}>Marks &amp; Results</div>

            {/* Mark rows */}
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

            {/* Result cards */}
            <div className={styles.resultCards}>
              <ResultCard
                label="Between Bends"
                value={formatDisplay(result.distanceBetweenBends, settings.units)}
                color="secondary"
              />
              <ResultCard
                label="Shrink"
                value={formatDisplay(result.shrink, settings.units)}
                color="secondary"
              />
              <ResultCard
                label="Bend Angle"
                value={`${result.thetaDeg}°`}
                color="primary"
              />
              <ResultCard
                label="Rise"
                value={formatDisplay(result.rise, settings.units)}
                color="primary"
              />
              <ResultCard
                label="Dev. Length"
                value={formatDisplay(result.developedLength, settings.units)}
                color="medium"
              />
              <ResultCard
                label="Gain"
                value={formatDisplay(result.gain, settings.units)}
                color="medium"
              />
            </div>

            {/* Instruction notes */}
            <IonCard className={styles.instructionCard}>
              <IonCardContent>
                <ol className={styles.instructions}>
                  <li>Mark the conduit at <strong>{formatDisplay(result.mark1FromEnd, settings.units)}</strong> from the working end.</li>
                  <li>Bend <strong>{result.thetaDeg}°</strong> upward at Mark 1.</li>
                  <li>Measure <strong>{formatDisplay(result.distanceBetweenBends, settings.units)}</strong> from Mark 1 to Mark 2.</li>
                  <li>Bend <strong>{result.thetaDeg}°</strong> downward at Mark 2 (reverse direction).</li>
                  <li>Your run will be <strong>{formatDisplay(result.shrink, settings.units)}</strong> shorter than measured — deduct this from your total length.</li>
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
