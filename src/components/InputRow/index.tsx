// src/components/InputRow/index.tsx
// Reusable labeled input row with optional unit toggle.

import React from 'react'
import { IonItem, IonLabel, IonInput, IonNote } from '@ionic/react'
import styles from './InputRow.module.css'

interface InputRowProps {
  label: string
  value: string
  onChange: (val: string) => void
  unit?: string
  placeholder?: string
  validity?: 'ok' | 'warning' | 'error'
  hint?: string
  inputMode?: 'decimal' | 'numeric' | 'text'
  min?: number
  max?: number
}

export function InputRow({
  label,
  value,
  onChange,
  unit,
  placeholder,
  validity = 'ok',
  hint,
  inputMode = 'decimal',
  min,
  max,
}: InputRowProps): JSX.Element {
  const borderColor =
    validity === 'error' ? 'var(--ion-color-danger)' :
    validity === 'warning' ? 'var(--ion-color-warning)' :
    'var(--ion-color-step-300)'

  return (
    <div className={styles.row} style={{ borderColor }}>
      <IonItem lines="none" className={styles.item}>
        <IonLabel className={styles.label}>{label}</IonLabel>
        <div className={styles.inputWrap}>
          <IonInput
            className={styles.input}
            value={value}
            placeholder={placeholder ?? '0'}
            inputMode={inputMode}
            min={min}
            max={max}
            onIonInput={e => onChange(String(e.detail.value ?? ''))}
          />
          {unit && <span className={styles.unit}>{unit}</span>}
        </div>
      </IonItem>
      {hint && (
        <IonNote
          className={styles.hint}
          color={validity === 'error' ? 'danger' : validity === 'warning' ? 'warning' : 'medium'}
        >
          {hint}
        </IonNote>
      )}
    </div>
  )
}
