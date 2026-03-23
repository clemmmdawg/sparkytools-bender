// src/pages/Calculator/index.tsx
// Routes to the appropriate calculator based on bend type URL parameter.

import React from 'react'
import { useParams } from 'react-router-dom'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
} from '@ionic/react'
import { OffsetCalculator } from './OffsetCalculator'

interface CalcParams {
  bendType: string
}

export function CalculatorPage(): JSX.Element {
  const { bendType } = useParams<CalcParams>()

  switch (bendType) {
    case 'offset':
      return <OffsetCalculator />

    default:
      return (
        <IonPage>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonBackButton defaultHref="/home" />
              </IonButtons>
              <IonTitle>{bendType?.replace(/-/g, ' ')}</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <p style={{ color: 'var(--ion-text-color-secondary)', textAlign: 'center', marginTop: '60px' }}>
              This calculator is coming soon.
            </p>
          </IonContent>
        </IonPage>
      )
  }
}
