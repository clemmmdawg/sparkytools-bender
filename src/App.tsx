// src/App.tsx
// Root component: IonApp + IonReactRouter with side-drawer navigation.

import React, { useEffect } from 'react'
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Route, Redirect } from 'react-router-dom'

import { HomePage } from './pages/Home'
import { CalculatorPage } from './pages/Calculator'
import { SettingsPage } from './pages/Settings'
import { BenderSpecsPage } from './pages/BenderSpecs'
import { AboutPage } from './pages/About'
import { AppMenu } from './components/AppMenu'
import { useSettings } from './hooks/useSettings'

setupIonicReact({
  mode: 'ios',
  swipeBackEnabled: false,
})

function AppContent(): JSX.Element {
  const { resolvedTheme } = useSettings()

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
        <AppMenu />
        <IonRouterOutlet id="main-content">
          <Route exact path="/home" component={HomePage} />
          <Route exact path="/calculator" render={() => <Redirect to="/calculator/offset" />} />
          <Route path="/calculator/:bendType" component={CalculatorPage} />
          <Route exact path="/bender-specs" component={BenderSpecsPage} />
          <Route exact path="/settings" component={SettingsPage} />
          <Route exact path="/about" component={AboutPage} />
          <Route exact path="/" render={() => <Redirect to="/calculator/offset" />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  )
}

export default function App(): JSX.Element {
  return <AppContent />
}
