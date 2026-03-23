// src/App.tsx
// Root component: IonApp + IonReactRouter with bottom tab navigation.

import React, { useEffect } from 'react'
import { IonApp, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, IonIcon, IonLabel, setupIonicReact } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Route, Redirect } from 'react-router-dom'
import { homeOutline, constructOutline, settingsOutline, flashOutline } from 'ionicons/icons'

import { HomePage } from './pages/Home'
import { CalculatorPage } from './pages/Calculator'
import { SettingsPage } from './pages/Settings'
import { BenderSpecsPage } from './pages/BenderSpecs'
import { useSettings } from './hooks/useSettings'

setupIonicReact({
  mode: 'ios',
})

function AppContent(): JSX.Element {
  const { resolvedTheme } = useSettings()

  // Apply theme class to the document body
  useEffect(() => {
    const body = document.body
    if (resolvedTheme === 'dark') {
      body.classList.add('dark')
      body.classList.remove('light')
    } else {
      body.classList.add('light')
      body.classList.remove('dark')
    }
  }, [resolvedTheme])

  return (
    <IonApp className={resolvedTheme}>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/home" component={HomePage} />
            <Route exact path="/calculator" render={() => <Redirect to="/calculator/offset" />} />
            <Route path="/calculator/:bendType" component={CalculatorPage} />
            <Route exact path="/bender-specs" component={BenderSpecsPage} />
            <Route exact path="/settings" component={SettingsPage} />
            <Route exact path="/" render={() => <Redirect to="/home" />} />
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton tab="home" href="/home">
              <IonIcon icon={homeOutline} />
              <IonLabel>Home</IonLabel>
            </IonTabButton>

            <IonTabButton tab="calculator" href="/calculator/offset">
              <IonIcon icon={flashOutline} />
              <IonLabel>Calculator</IonLabel>
            </IonTabButton>

            <IonTabButton tab="bender-specs" href="/bender-specs">
              <IonIcon icon={constructOutline} />
              <IonLabel>Specs</IonLabel>
            </IonTabButton>

            <IonTabButton tab="settings" href="/settings">
              <IonIcon icon={settingsOutline} />
              <IonLabel>Settings</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  )
}

export default function App(): JSX.Element {
  return <AppContent />
}
