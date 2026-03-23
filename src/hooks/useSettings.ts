// src/hooks/useSettings.ts
// Hook to load/save app settings from localStorage.

import { useState, useCallback } from 'react'
import type { UnitMode } from '../lib/units'

export type ThemeMode = 'dark' | 'light' | 'system'

export interface Settings {
  units: UnitMode
  multiplierMethod: boolean  // true = use multiplier method instead of centerline radius
  theme: ThemeMode
}

const DEFAULT_SETTINGS: Settings = {
  units: 'inches',
  multiplierMethod: false,
  theme: 'dark',
}

const STORAGE_KEY = 'sparky_settings'

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Settings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export interface UseSettingsReturn {
  settings: Settings
  setUnits: (units: UnitMode) => void
  setMultiplierMethod: (on: boolean) => void
  setTheme: (theme: ThemeMode) => void
  resolvedTheme: 'dark' | 'light'
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  const setUnits = useCallback((units: UnitMode) => update({ units }), [update])
  const setMultiplierMethod = useCallback((on: boolean) => update({ multiplierMethod: on }), [update])
  const setTheme = useCallback((theme: ThemeMode) => update({ theme }), [update])

  // Resolve 'system' to actual dark/light
  let resolvedTheme: 'dark' | 'light' = 'dark'
  if (settings.theme === 'system') {
    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } else {
    resolvedTheme = settings.theme
  }

  return {
    settings,
    setUnits,
    setMultiplierMethod,
    setTheme,
    resolvedTheme,
  }
}
