// src/pages/About/index.tsx

import React from 'react'
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonPage,
  IonButtons,
  IonMenuButton,
} from '@ionic/react'

export function AboutPage(): JSX.Element {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>About</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2 style={{ color: 'var(--ion-color-primary)', fontWeight: 800 }}>Sparky Tools: Bender</h2>
        <p style={{ color: 'var(--ion-text-color-secondary)', lineHeight: 1.6 }}>
          A mobile-first conduit bending calculator for electricians. Built with accurate
          centerline radius math — not just the multiplier method.
        </p>
        <p style={{ color: 'var(--ion-text-color-secondary)', lineHeight: 1.6 }}>
          Works fully offline as a Progressive Web App (PWA).
        </p>
      </IonContent>
    </IonPage>
  )
}
