// src/pages/Home/index.tsx
// Home page — bender selector, conduit type/size picker, bend type grid.

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
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonButtons,
  IonMenuButton,
  IonIcon,
  IonLabel,
  IonBadge,
} from '@ionic/react'
import { useHistory } from 'react-router-dom'
import { flashOutline, reorderFourOutline, squareOutline, ellipseOutline, analyticsOutline } from 'ionicons/icons'
import { useBender } from '../../hooks/useBender'
import type { BenderShoe } from '../../data/benders'
import styles from './Home.module.css'

interface BendTypeCard {
  id: string
  label: string
  group: string
  icon: string
}

const BEND_TYPES: BendTypeCard[] = [
  // Group 1 — Offsets
  { id: 'offset', label: 'Offset', group: 'Offsets', icon: analyticsOutline },
  { id: 'rolling-offset', label: 'Rolling Offset', group: 'Offsets', icon: analyticsOutline },
  { id: 'parallel-offset', label: 'Parallel Offset', group: 'Offsets', icon: reorderFourOutline },

  // Group 2 — Saddles
  { id: 'three-point-saddle', label: '3-Point Saddle', group: 'Saddles', icon: squareOutline },
  { id: 'four-point-saddle', label: '4-Point Saddle', group: 'Saddles', icon: squareOutline },

  // Group 3 — 90° Bends
  { id: '90-bend', label: '90° Bend', group: '90° Bends', icon: flashOutline },
  { id: 'kick-with-90', label: 'Kick w/ 90°', group: '90° Bends', icon: flashOutline },

  // Group 4 — Compound 90°
  { id: 'compound-90-circle', label: 'Around Circle', group: 'Compound 90°', icon: ellipseOutline },
  { id: 'compound-90-rectangle', label: 'Around Rectangle', group: 'Compound 90°', icon: squareOutline },

  // Group 5 — Segmented
  { id: 'segmented-90', label: 'Segmented 90°', group: 'Segmented', icon: analyticsOutline },
]

const GROUPS = ['Offsets', 'Saddles', '90° Bends', 'Compound 90°', 'Segmented']

const IMPLEMENTED = new Set(['offset'])

export function HomePage(): JSX.Element {
  const history = useHistory()
  const {
    allBenders,
    selectedBender,
    selectedShoe,
    selectedBenderId,
    selectedTradeSize,
    selectedConduitType,
    selectBender,
    selectShoe,
  } = useBender()

  const [activeGroup, setActiveGroup] = React.useState('Offsets')

  // Shoes available for the selected bender
  const availableShoes = selectedBender?.shoes ?? []

  // Get unique trade sizes and conduit types for the selected bender
  const tradeSizes = [...new Set(availableShoes.map(s => s.tradeSize))]
  const conduitTypes = [...new Set(
    availableShoes
      .filter(s => s.tradeSize === selectedTradeSize)
      .map(s => s.conduitType)
  )] as BenderShoe['conduitType'][]

  const filteredBendTypes = BEND_TYPES.filter(bt => bt.group === activeGroup)

  function handleBendTypeSelect(bendType: string) {
    if (!IMPLEMENTED.has(bendType)) return
    history.push(`/calculator/${bendType}`)
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Bender Setup</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding-bottom">
        {/* Bender selector */}
        <IonCard className={styles.selectorCard}>
          <IonCardHeader>
            <IonCardTitle className={styles.cardTitle}>Bender</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className={styles.selectRow}>
              <IonLabel className={styles.selectLabel}>Model</IonLabel>
              <IonSelect
                value={selectedBenderId}
                onIonChange={e => selectBender(e.detail.value)}
                interface="action-sheet"
                className={styles.select}
              >
                {allBenders.map(b => (
                  <IonSelectOption key={b.id} value={b.id}>
                    {b.manufacturer} {b.model} ({b.type})
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>

            <div className={styles.selectRow}>
              <IonLabel className={styles.selectLabel}>Size</IonLabel>
              <IonSelect
                value={selectedTradeSize}
                onIonChange={e => selectShoe(e.detail.value, selectedConduitType)}
                interface="action-sheet"
                className={styles.select}
              >
                {tradeSizes.map(size => (
                  <IonSelectOption key={size} value={size}>{size}"</IonSelectOption>
                ))}
              </IonSelect>
            </div>

            <div className={styles.selectRow}>
              <IonLabel className={styles.selectLabel}>Type</IonLabel>
              <IonSelect
                value={selectedConduitType}
                onIonChange={e => selectShoe(selectedTradeSize, e.detail.value)}
                interface="action-sheet"
                className={styles.select}
              >
                {conduitTypes.map(ct => (
                  <IonSelectOption key={ct} value={ct}>{ct}</IonSelectOption>
                ))}
              </IonSelect>
            </div>

            {selectedShoe && (
              <div className={styles.shoeStats}>
                <span className={styles.statItem}>
                  <span className={styles.statLabel}>CLR</span>
                  <span className={styles.statValue}>{selectedShoe.centerlineRadius}"</span>
                </span>
                <span className={styles.statItem}>
                  <span className={styles.statLabel}>Deduct</span>
                  <span className={styles.statValue}>{selectedShoe.deduct}"</span>
                </span>
                <span className={styles.statItem}>
                  <span className={styles.statLabel}>OD</span>
                  <span className={styles.statValue}>{selectedShoe.outsideDiameter}"</span>
                </span>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Bend type selector */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Bend Type</span>
        </div>

        {/* Group tabs */}
        <div className={styles.groupScroll}>
          {GROUPS.map(g => (
            <button
              key={g}
              className={`${styles.groupTab} ${activeGroup === g ? styles.groupTabActive : ''}`}
              onClick={() => setActiveGroup(g)}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Bend type grid */}
        <IonGrid className={styles.bendGrid}>
          <IonRow>
            {filteredBendTypes.map(bt => {
              const implemented = IMPLEMENTED.has(bt.id)
              return (
                <IonCol size="6" key={bt.id}>
                  <button
                    className={`${styles.bendCard} ${!implemented ? styles.bendCardDisabled : ''}`}
                    onClick={() => handleBendTypeSelect(bt.id)}
                    disabled={!implemented}
                  >
                    <IonIcon icon={bt.icon} className={styles.bendIcon} />
                    <span className={styles.bendLabel}>{bt.label}</span>
                    {!implemented && (
                      <IonBadge color="medium" className={styles.comingSoon}>Soon</IonBadge>
                    )}
                  </button>
                </IonCol>
              )
            })}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  )
}
