// src/pages/BenderSpecs/index.tsx
// Bender specs page — shows CLR, deduct, gain, setback, travel table.

import React from 'react'
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonPage,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
} from '@ionic/react'
import { developedLength, gain, setback } from '../../lib/bendMath'
import { useBender } from '../../hooks/useBender'
import styles from './BenderSpecs.module.css'

// Common angles for the travel table
const TRAVEL_ANGLES = [5, 10, 15, 22.5, 30, 45, 60, 90]

export function BenderSpecsPage(): JSX.Element {
  const { selectedBender, selectedShoe } = useBender()

  if (!selectedShoe || !selectedBender) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Bender Specs</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p style={{ color: 'var(--ion-text-color-secondary)', textAlign: 'center', marginTop: '60px' }}>
            Select a bender on the Home tab.
          </p>
        </IonContent>
      </IonPage>
    )
  }

  const { centerlineRadius, deduct } = selectedShoe
  const gainAt90 = gain(centerlineRadius, 90)
  const setbackVal = setback(centerlineRadius)

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Bender Specs</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Header info */}
        <div className={styles.header}>
          <div className={styles.benderName}>
            {selectedBender.manufacturer} {selectedBender.model}
          </div>
          <div className={styles.shoeName}>
            {selectedShoe.tradeSize}" {selectedShoe.conduitType}
            {' · OD: '}{selectedShoe.outsideDiameter}"
          </div>
        </div>

        {/* Key specs */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className={styles.cardTitle}>Key Specs</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className={styles.specGrid}>
              <SpecCell label="Centerline Radius" value={`${centerlineRadius}"`} />
              <SpecCell label="Deduct (90°)" value={`${deduct}"`} />
              <SpecCell
                label="Gain (90°)"
                value={`${gainAt90.toFixed(3)}"`}
                note="Formula: devLen(r,90°) − 2·tan(45°)·r"
                calculated
              />
              <SpecCell
                label="Setback"
                value={`${setbackVal.toFixed(3)}"`}
                note="Formula: r · tan(45°)"
                calculated
              />
            </div>
          </IonCardContent>
        </IonCard>

        {/* Travel table */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className={styles.cardTitle}>Developed Length (Travel)</IonCardTitle>
          </IonCardHeader>
          <IonCardContent className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Angle</th>
                  <th>Dev. Length</th>
                  <th>Gain</th>
                </tr>
              </thead>
              <tbody>
                {TRAVEL_ANGLES.map(deg => {
                  const dl = developedLength(centerlineRadius, deg)
                  const g = gain(centerlineRadius, deg)
                  return (
                    <tr key={deg}>
                      <td className={styles.angleCell}>{deg}°</td>
                      <td className={styles.valueCell}>{dl.toFixed(3)}"</td>
                      <td className={styles.valueCell}>{g.toFixed(3)}"</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  )
}

interface SpecCellProps {
  label: string
  value: string
  note?: string
  calculated?: boolean
}

function SpecCell({ label, value, note, calculated }: SpecCellProps): JSX.Element {
  return (
    <div className={styles.specCell}>
      <div className={styles.specLabel}>
        {label}
        {calculated && <span className={styles.calcBadge}>calculated</span>}
      </div>
      <div className={styles.specValue}>{value}</div>
      {note && <div className={styles.specNote}>{note}</div>}
    </div>
  )
}
