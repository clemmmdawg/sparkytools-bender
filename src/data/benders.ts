// src/data/benders.ts
// Static bender database. All centerline radii and deducts are from manufacturer spec sheets.
// Values marked // TODO: verify should be confirmed against physical benders or current spec sheets.

export interface BenderShoe {
  conduitType: 'EMT' | 'IMC' | 'Rigid' | 'PVC';
  tradeSize: string;        // e.g. "1/2", "3/4", "1", "1-1/4"
  outsideDiameter: number;  // inches
  centerlineRadius: number; // inches — from manufacturer specs
  deduct: number;           // inches
}

export interface Bender {
  id: string;
  manufacturer: string;     // e.g. "Klein", "Greenlee", "Ideal"
  model: string;            // e.g. "51605", "851", "1800"
  type: 'hand' | 'mechanical' | 'electric' | 'hydraulic';
  shoes: BenderShoe[];
}

export interface CustomBender extends Bender {
  isCustom: true;
}

// ── Klein Hand Benders ────────────────────────────────────────────────────────

const KLEIN_51605: Bender = {
  id: 'klein-51605',
  manufacturer: 'Klein',
  model: '51605',
  type: 'hand',
  shoes: [
    {
      conduitType: 'EMT',
      tradeSize: '1/2',
      outsideDiameter: 0.706,
      centerlineRadius: 4.0, // inches — Klein spec
      deduct: 5,             // Standard 1/2" EMT hand bender deduct
    },
  ],
}

const KLEIN_51606: Bender = {
  id: 'klein-51606',
  manufacturer: 'Klein',
  model: '51606',
  type: 'hand',
  shoes: [
    {
      conduitType: 'EMT',
      tradeSize: '3/4',
      outsideDiameter: 0.922,
      centerlineRadius: 4.5, // inches — Klein spec
      deduct: 6,             // Standard 3/4" EMT hand bender deduct
    },
  ],
}

const KLEIN_51607: Bender = {
  id: 'klein-51607',
  manufacturer: 'Klein',
  model: '51607',
  type: 'hand',
  shoes: [
    {
      conduitType: 'EMT',
      tradeSize: '1',
      outsideDiameter: 1.163,
      centerlineRadius: 5.75, // inches — Klein spec // TODO: verify
      deduct: 8,              // Standard 1" EMT hand bender deduct
    },
  ],
}

// ── Greenlee 851 Series Hand Benders ─────────────────────────────────────────

const GREENLEE_851: Bender = {
  id: 'greenlee-851',
  manufacturer: 'Greenlee',
  model: '851',
  type: 'hand',
  shoes: [
    {
      conduitType: 'EMT',
      tradeSize: '1/2',
      outsideDiameter: 0.706,
      centerlineRadius: 4.0, // inches — Greenlee spec
      deduct: 5,
    },
    {
      conduitType: 'EMT',
      tradeSize: '3/4',
      outsideDiameter: 0.922,
      centerlineRadius: 4.5, // inches — Greenlee spec
      deduct: 6,
    },
    {
      conduitType: 'EMT',
      tradeSize: '1',
      outsideDiameter: 1.163,
      centerlineRadius: 5.75, // inches — Greenlee spec // TODO: verify
      deduct: 8,
    },
    {
      conduitType: 'EMT',
      tradeSize: '1-1/4',
      outsideDiameter: 1.510,
      centerlineRadius: 7.25, // inches — Greenlee spec // TODO: verify
      deduct: 11,
    },
  ],
}

// ── Greenlee 1800 Mechanical Bender — Rigid/IMC ───────────────────────────────
// Mechanical ratchet bender for 1/2"–1" rigid conduit

const GREENLEE_1800: Bender = {
  id: 'greenlee-1800',
  manufacturer: 'Greenlee',
  model: '1800',
  type: 'mechanical',
  shoes: [
    {
      conduitType: 'Rigid',
      tradeSize: '1/2',
      outsideDiameter: 0.840,
      centerlineRadius: 4.0, // inches // TODO: verify against Greenlee 1800 spec sheet
      deduct: 5,
    },
    {
      conduitType: 'Rigid',
      tradeSize: '3/4',
      outsideDiameter: 1.050,
      centerlineRadius: 4.5, // inches // TODO: verify against Greenlee 1800 spec sheet
      deduct: 6,
    },
    {
      conduitType: 'Rigid',
      tradeSize: '1',
      outsideDiameter: 1.315,
      centerlineRadius: 5.75, // inches // TODO: verify against Greenlee 1800 spec sheet
      deduct: 8,
    },
    {
      conduitType: 'IMC',
      tradeSize: '1/2',
      outsideDiameter: 0.815,
      centerlineRadius: 4.0, // inches // TODO: verify
      deduct: 5,
    },
    {
      conduitType: 'IMC',
      tradeSize: '3/4',
      outsideDiameter: 1.029,
      centerlineRadius: 4.5, // inches // TODO: verify
      deduct: 6,
    },
    {
      conduitType: 'IMC',
      tradeSize: '1',
      outsideDiameter: 1.290,
      centerlineRadius: 5.75, // inches // TODO: verify
      deduct: 8,
    },
  ],
}

// ── Greenlee 1801 Mechanical Bender — Rigid/IMC 1-1/4" – 1-1/2" ──────────────

const GREENLEE_1801: Bender = {
  id: 'greenlee-1801',
  manufacturer: 'Greenlee',
  model: '1801',
  type: 'mechanical',
  shoes: [
    {
      conduitType: 'Rigid',
      tradeSize: '1-1/4',
      outsideDiameter: 1.660,
      centerlineRadius: 7.25, // inches // TODO: verify against Greenlee 1801 spec sheet
      deduct: 11,
    },
    {
      conduitType: 'Rigid',
      tradeSize: '1-1/2',
      outsideDiameter: 1.900,
      centerlineRadius: 8.0, // inches // TODO: verify against Greenlee 1801 spec sheet
      deduct: 13, // TODO: verify
    },
    {
      conduitType: 'IMC',
      tradeSize: '1-1/4',
      outsideDiameter: 1.638,
      centerlineRadius: 7.25, // inches // TODO: verify
      deduct: 11,
    },
    {
      conduitType: 'IMC',
      tradeSize: '1-1/2',
      outsideDiameter: 1.883,
      centerlineRadius: 8.0, // inches // TODO: verify
      deduct: 13, // TODO: verify
    },
  ],
}

// ── Master list ───────────────────────────────────────────────────────────────

export const BENDERS: Bender[] = [
  KLEIN_51605,
  KLEIN_51606,
  KLEIN_51607,
  GREENLEE_851,
  GREENLEE_1800,
  GREENLEE_1801,
]

export const DEFAULT_BENDER_ID = 'greenlee-851'
export const DEFAULT_TRADE_SIZE = '1/2'
export const DEFAULT_CONDUIT_TYPE: BenderShoe['conduitType'] = 'EMT'
