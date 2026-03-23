// src/pages/Settings/index.tsx
// Settings page — theme, units, method toggle.

import React from 'react'
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonPage,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonListHeader,
  IonNote,
  IonIcon,
} from '@ionic/react'
import { moonOutline, sunnyOutline, phonePortraitOutline, calculatorOutline, settingsOutline } from 'ionicons/icons'
import { useSettings } from '../../hooks/useSettings'
import type { ThemeMode } from '../../hooks/useSettings'
import type { UnitMode } from '../../lib/units'
import styles from './Settings.module.css'

export function SettingsPage(): JSX.Element {
  const { settings, setTheme, setUnits, setMultiplierMethod } = useSettings()

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>

        {/* Appearance */}
        <IonList inset className={styles.list}>
          <IonListHeader>
            <IonLabel className={styles.listHeader}>Appearance</IonLabel>
          </IonListHeader>

          <IonItem>
            <IonIcon icon={moonOutline} slot="start" color="medium" />
            <IonLabel>Theme</IonLabel>
            <IonSelect
              value={settings.theme}
              onIonChange={e => setTheme(e.detail.value as ThemeMode)}
              interface="action-sheet"
              slot="end"
            >
              <IonSelectOption value="dark">
                Dark
              </IonSelectOption>
              <IonSelectOption value="light">
                Light
              </IonSelectOption>
              <IonSelectOption value="system">
                System
              </IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonList>

        {/* Units */}
        <IonList inset className={styles.list}>
          <IonListHeader>
            <IonLabel className={styles.listHeader}>Measurement</IonLabel>
          </IonListHeader>

          <IonItem>
            <IonIcon icon={phonePortraitOutline} slot="start" color="medium" />
            <IonLabel>Units</IonLabel>
            <IonSelect
              value={settings.units}
              onIonChange={e => setUnits(e.detail.value as UnitMode)}
              interface="action-sheet"
              slot="end"
            >
              <IonSelectOption value="inches">Inches (decimal)</IonSelectOption>
              <IonSelectOption value="ft-in">Feet &amp; Inches</IonSelectOption>
              <IonSelectOption value="cm">Centimeters</IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonList>

        {/* Calculation method */}
        <IonList inset className={styles.list}>
          <IonListHeader>
            <IonLabel className={styles.listHeader}>Calculation Method</IonLabel>
          </IonListHeader>

          <IonItem>
            <IonIcon icon={calculatorOutline} slot="start" color="medium" />
            <IonLabel>
              Multiplier Method
              <IonNote color="medium" className={styles.methodNote}>
                {settings.multiplierMethod
                  ? 'Using cosecant multiplier table (less accurate for large conduit)'
                  : 'Using centerline radius algorithm (default, most accurate)'}
              </IonNote>
            </IonLabel>
            <IonToggle
              checked={settings.multiplierMethod}
              onIonChange={e => setMultiplierMethod(e.detail.checked)}
              slot="end"
            />
          </IonItem>
        </IonList>

        {/* About */}
        <IonList inset className={styles.list}>
          <IonListHeader>
            <IonLabel className={styles.listHeader}>About</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonIcon icon={settingsOutline} slot="start" color="medium" />
            <IonLabel>
              Sparky Tools: Bender
              <IonNote color="medium" className={styles.methodNote}>v0.1.0 — MVP</IonNote>
            </IonLabel>
          </IonItem>
        </IonList>

      </IonContent>
    </IonPage>
  )
}
