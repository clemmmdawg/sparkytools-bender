// src/components/AppMenu/index.tsx
// Left drawer navigation menu.

import React from 'react'
import {
  IonContent,
  IonHeader,
  IonMenu,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonMenuToggle,
  IonBadge,
  IonNote,
} from '@ionic/react'
import { useLocation } from 'react-router-dom'
import {
  analyticsOutline,
  reorderFourOutline,
  squareOutline,
  ellipseOutline,
  flashOutline,
  settingsOutline,
  constructOutline,
  informationCircleOutline,
} from 'ionicons/icons'
import { useBender } from '../../hooks/useBender'
import styles from './AppMenu.module.css'

interface BendMenuItem {
  id: string
  label: string
  group: string
  icon: string
  implemented: boolean
}

const MENU_ITEMS: BendMenuItem[] = [
  // Offsets
  { id: 'offset', label: 'Offset', group: 'Offsets', icon: analyticsOutline, implemented: true },
  { id: 'rolling-offset', label: 'Rolling Offset', group: 'Offsets', icon: analyticsOutline, implemented: false },
  { id: 'parallel-offset', label: 'Parallel Offset', group: 'Offsets', icon: reorderFourOutline, implemented: false },

  // Saddles
  { id: 'three-point-saddle', label: '3-Point Saddle', group: 'Saddles', icon: squareOutline, implemented: false },
  { id: 'four-point-saddle', label: '4-Point Saddle', group: 'Saddles', icon: squareOutline, implemented: false },

  // 90° Bends
  { id: '90-bend', label: '90° Bend', group: '90° Bends', icon: flashOutline, implemented: false },
  { id: 'kick-with-90', label: 'Kick w/ 90°', group: '90° Bends', icon: flashOutline, implemented: false },

  // Compound 90°
  { id: 'compound-90-circle', label: 'Around Circle', group: 'Compound 90°', icon: ellipseOutline, implemented: false },
  { id: 'compound-90-rectangle', label: 'Around Rectangle', group: 'Compound 90°', icon: squareOutline, implemented: false },

  // Segmented
  { id: 'segmented-90', label: 'Segmented 90°', group: 'Segmented', icon: analyticsOutline, implemented: false },
]

const GROUPS = ['Offsets', 'Saddles', '90° Bends', 'Compound 90°', 'Segmented']

export function AppMenu(): JSX.Element {
  const location = useLocation()
  const { selectedBender, selectedShoe } = useBender()

  return (
    <IonMenu contentId="main-content" type="overlay" className={styles.menu}>
      <IonHeader>
        <IonToolbar className={styles.menuToolbar}>
          <div className={styles.menuTitle}>Sparky Tools</div>
          <div className={styles.menuSubtitle}>Bender</div>
        </IonToolbar>
      </IonHeader>

      <IonContent className={styles.menuContent}>
        {/* Selected bender card — tapping navigates to bender selector */}
        <IonMenuToggle autoHide={false}>
          <IonItem
            routerLink="/home"
            routerDirection="root"
            detail={false}
            lines="none"
            style={{ '--padding-start': '0', '--inner-padding-end': '0', '--background': 'transparent' }}
          >
          <div className={styles.benderCard} style={{ width: '100%' }}>
            {selectedBender && selectedShoe ? (
              <>
                <div className={styles.benderName}>
                  {selectedBender.manufacturer} {selectedBender.model}
                </div>
                <div className={styles.benderShoe}>
                  {selectedShoe.tradeSize}" {selectedShoe.conduitType}
                </div>
                <div className={styles.benderStats}>
                  <span className={styles.stat}>
                    <span className={styles.statLabel}>CLR</span>
                    <span className={styles.statValue}>{selectedShoe.centerlineRadius}"</span>
                  </span>
                  <span className={styles.stat}>
                    <span className={styles.statLabel}>Deduct</span>
                    <span className={styles.statValue}>{selectedShoe.deduct}"</span>
                  </span>
                  <span className={styles.stat}>
                    <span className={styles.statLabel}>OD</span>
                    <span className={styles.statValue}>{selectedShoe.outsideDiameter}"</span>
                  </span>
                </div>
                <div className={styles.changeBender}>Tap to change bender →</div>
              </>
            ) : (
              <div className={styles.noBender}>No bender selected — tap to choose</div>
            )}
          </div>
          </IonItem>
        </IonMenuToggle>

        {/* Bend type groups */}
        {GROUPS.map(group => {
          const items = MENU_ITEMS.filter(i => i.group === group)
          return (
            <div key={group} className={styles.group}>
              <div className={styles.groupHeader}>{group}</div>
              <IonList lines="none" className={styles.groupList}>
                {items.map(item => {
                  const isActive = location.pathname === `/calculator/${item.id}`
                  return (
                    <IonMenuToggle key={item.id} autoHide={false}>
                      <IonItem
                        routerLink={item.implemented ? `/calculator/${item.id}` : undefined}
                        routerDirection="root"
                        detail={false}
                        disabled={!item.implemented}
                        className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ''} ${!item.implemented ? styles.menuItemDisabled : ''}`}
                      >
                        <IonIcon icon={item.icon} slot="start" className={styles.itemIcon} />
                        <IonLabel className={styles.itemLabel}>{item.label}</IonLabel>
                        {!item.implemented && (
                          <IonBadge color="medium" className={styles.soonBadge}>Soon</IonBadge>
                        )}
                      </IonItem>
                    </IonMenuToggle>
                  )
                })}
              </IonList>
            </div>
          )
        })}

        {/* Bottom links */}
        <div className={styles.bottomLinks}>
          <IonList lines="none" className={styles.groupList}>
            <IonMenuToggle autoHide={false}>
              <IonItem
                routerLink="/bender-specs"
                routerDirection="root"
                detail={false}
                className={`${styles.menuItem} ${location.pathname === '/bender-specs' ? styles.menuItemActive : ''}`}
              >
                <IonIcon icon={constructOutline} slot="start" className={styles.itemIcon} />
                <IonLabel className={styles.itemLabel}>Bender Specs</IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonMenuToggle autoHide={false}>
              <IonItem
                routerLink="/settings"
                routerDirection="root"
                detail={false}
                className={`${styles.menuItem} ${location.pathname === '/settings' ? styles.menuItemActive : ''}`}
              >
                <IonIcon icon={settingsOutline} slot="start" className={styles.itemIcon} />
                <IonLabel className={styles.itemLabel}>Settings</IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonMenuToggle autoHide={false}>
              <IonItem
                routerLink="/about"
                routerDirection="root"
                detail={false}
                className={`${styles.menuItem} ${location.pathname === '/about' ? styles.menuItemActive : ''}`}
              >
                <IonIcon icon={informationCircleOutline} slot="start" className={styles.itemIcon} />
                <IonLabel className={styles.itemLabel}>About</IonLabel>
              </IonItem>
            </IonMenuToggle>
          </IonList>
        </div>
      </IonContent>
    </IonMenu>
  )
}
