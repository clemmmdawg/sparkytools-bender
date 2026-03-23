// src/hooks/useBender.ts
// Hook to load/save the selected bender and shoe from localStorage.

import { useState, useCallback } from 'react'
import {
  BENDERS,
  DEFAULT_BENDER_ID,
  DEFAULT_TRADE_SIZE,
  DEFAULT_CONDUIT_TYPE,
  type Bender,
  type BenderShoe,
  type CustomBender,
} from '../data/benders'

const STORAGE_KEY_BENDER_ID = 'sparky_selected_bender_id'
const STORAGE_KEY_TRADE_SIZE = 'sparky_selected_trade_size'
const STORAGE_KEY_CONDUIT_TYPE = 'sparky_selected_conduit_type'
const STORAGE_KEY_CUSTOM_BENDERS = 'sparky_custom_benders'

function loadCustomBenders(): CustomBender[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_BENDERS)
    if (!raw) return []
    return JSON.parse(raw) as CustomBender[]
  } catch {
    return []
  }
}

function saveCustomBenders(custom: CustomBender[]): void {
  localStorage.setItem(STORAGE_KEY_CUSTOM_BENDERS, JSON.stringify(custom))
}

function getAllBenders(custom: CustomBender[]): Bender[] {
  return [...BENDERS, ...custom]
}

export interface UseBenderReturn {
  allBenders: Bender[]
  selectedBender: Bender | null
  selectedShoe: BenderShoe | null
  selectedBenderId: string
  selectedTradeSize: string
  selectedConduitType: BenderShoe['conduitType']
  selectBender: (benderId: string) => void
  selectShoe: (tradeSize: string, conduitType: BenderShoe['conduitType']) => void
  addCustomBender: (bender: CustomBender) => void
  removeCustomBender: (benderId: string) => void
}

export function useBender(): UseBenderReturn {
  const [customBenders, setCustomBenders] = useState<CustomBender[]>(() => loadCustomBenders())

  const [selectedBenderId, setSelectedBenderId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_BENDER_ID) ?? DEFAULT_BENDER_ID
  })

  const [selectedTradeSize, setSelectedTradeSize] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_TRADE_SIZE) ?? DEFAULT_TRADE_SIZE
  })

  const [selectedConduitType, setSelectedConduitType] = useState<BenderShoe['conduitType']>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_CONDUIT_TYPE)
    return (stored as BenderShoe['conduitType']) ?? DEFAULT_CONDUIT_TYPE
  })

  const allBenders = getAllBenders(customBenders)

  const selectedBender = allBenders.find(b => b.id === selectedBenderId) ?? null

  const selectedShoe = selectedBender?.shoes.find(
    s => s.tradeSize === selectedTradeSize && s.conduitType === selectedConduitType
  ) ?? selectedBender?.shoes[0] ?? null

  const selectBender = useCallback((benderId: string) => {
    setSelectedBenderId(benderId)
    localStorage.setItem(STORAGE_KEY_BENDER_ID, benderId)
    // Pick a sensible default shoe for the new bender
    const bender = allBenders.find(b => b.id === benderId)
    if (bender && bender.shoes.length > 0) {
      const shoe = bender.shoes[0]
      setSelectedTradeSize(shoe.tradeSize)
      setSelectedConduitType(shoe.conduitType)
      localStorage.setItem(STORAGE_KEY_TRADE_SIZE, shoe.tradeSize)
      localStorage.setItem(STORAGE_KEY_CONDUIT_TYPE, shoe.conduitType)
    }
  }, [allBenders])

  const selectShoe = useCallback(
    (tradeSize: string, conduitType: BenderShoe['conduitType']) => {
      setSelectedTradeSize(tradeSize)
      setSelectedConduitType(conduitType)
      localStorage.setItem(STORAGE_KEY_TRADE_SIZE, tradeSize)
      localStorage.setItem(STORAGE_KEY_CONDUIT_TYPE, conduitType)
    },
    []
  )

  const addCustomBender = useCallback((bender: CustomBender) => {
    setCustomBenders(prev => {
      const updated = [...prev.filter(b => b.id !== bender.id), bender]
      saveCustomBenders(updated)
      return updated
    })
  }, [])

  const removeCustomBender = useCallback((benderId: string) => {
    setCustomBenders(prev => {
      const updated = prev.filter(b => b.id !== benderId)
      saveCustomBenders(updated)
      return updated
    })
  }, [])

  return {
    allBenders,
    selectedBender,
    selectedShoe,
    selectedBenderId,
    selectedTradeSize,
    selectedConduitType,
    selectBender,
    selectShoe,
    addCustomBender,
    removeCustomBender,
  }
}
