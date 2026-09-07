import Dexie from 'dexie'
import { DEFAULT_UTILITY_TYPES } from '../utils/utilityTypes.js'

/**
 * Local IndexedDB database for the MealMate app.
 * Single-user, browser-only persistence via Dexie.
 *
 * Tables:
 *  - members:        roster of people who eat in the mess
 *  - mealEntries:    one row per member per day (breakfast + dinner counts)
 *  - bazarExpenses:  grocery spending log
 *  - contributions:  money each member deposits for a given month
 *  - monthSettings:  per-month config (e.g. initial bazar taka)
 *  - houseFunds:     permanent house-fund ledger (deposits + spending, all-time)
 *  - utilities:      monthly utility bills (electricity, water, gas, ...)
 *  - utilityTypes:   custom + default utility bill types (name, icon)
 *  - preMigrationBackups: automatic data snapshots taken before each schema
 *                    migration, as a safety net (never exported/restored)
 *
 * All derived numbers (meal rate, dues, etc.) are computed on the fly
 * from these source tables — never stored.
 */
export const db = new Dexie('MealManagerDB')

// v1 — original schema.
db.version(1).stores({
  // Primary key auto-increments as `id`.
  members: '++id, name, active, joinDate',
  // Composite uniqueness on (memberId, date): one row per member per day.
  mealEntries: '++id, memberId, date, [memberId+date]',
  bazarExpenses: '++id, date, month',
  contributions: '++id, memberId, month, [memberId+month]',
  // `month` (YYYY-MM) is the primary key here.
  monthSettings: 'month, initialBazarTaka',
})

// v2 — adds house fund + utilities. Upgrading in place NEVER deletes data;
// existing tables must be re-declared unchanged so Dexie keeps them.
db.version(2).stores({
  members: '++id, name, active, joinDate',
  mealEntries: '++id, memberId, date, [memberId+date]',
  bazarExpenses: '++id, date, month',
  contributions: '++id, memberId, month, [memberId+month]',
  monthSettings: 'month, initialBazarTaka',
  // All-time house fund ledger, one row per transaction.
  houseFunds: '++id, date, type',
  // Monthly utility bills; `month` (YYYY-MM) mirrors the entry date.
  utilities: '++id, date, month, billType',
})

// v3 — member status/type + custom utility bill types.
//
//  * members: the boolean `active` flag becomes a three-state `status`
//    ('active' | 'leave' | 'left') plus a `type` ('member' | 'guest').
//  * utilities: billType switches from fixed keys ('electricity', 'trash', ...)
//    to the human-readable type name ('Electricity', 'Trash', ...), the same
//    value used by the new `utilityTypes` table.
//  * utilityTypes: new table holding the six predefined defaults + custom
//    types the user creates.
//  * preMigrationBackups: automatic full-database snapshot taken at the very
//    start of this upgrade, before anything is modified — the existing data is
//    always recoverable from inside the browser even after a botched migration.
db.version(3)
  .stores({
    members: '++id, name, status, joinDate',
    mealEntries: '++id, memberId, date, [memberId+date]',
    bazarExpenses: '++id, date, month',
    contributions: '++id, memberId, month, [memberId+month]',
    monthSettings: 'month, initialBazarTaka',
    houseFunds: '++id, date, type',
    utilities: '++id, date, month, billType',
    utilityTypes: '++id, &name, isDefault',
    preMigrationBackups: '++id, version',
  })
  .upgrade(async (tx) => {
    const LEGACY_TABLES = [
      'members',
      'mealEntries',
      'bazarExpenses',
      'contributions',
      'monthSettings',
      'houseFunds',
      'utilities',
    ]

    // 1) Snapshot EVERY table BEFORE touching a single row. This is the
    //    complete pre-migration backup, kept inside IndexedDB itself so it
    //    survives even if a later step fails mid-transaction.
    const snapshot = {}
    for (const name of LEGACY_TABLES) {
      snapshot[name] = await tx.table(name).toArray()
    }
    await tx.table('preMigrationBackups').add({
      version: 3,
      takenAt: new Date().toISOString(),
      note: 'Automatic full-database snapshot taken before the v3 migration (member status/type, custom utility types).',
      data: snapshot,
    })

    // 2) members: active → status.
    //    old active=true   → status 'active'
    //    old active=false  → status 'leave'  (the former "Deactivate" flag
    //                         is exactly the "On Leave" concept)
    //    type defaults to 'member' unless already set.
    await tx.table('members').toCollection().modify((m) => {
      m.status = m.active === false ? 'leave' : 'active'
      if (m.type !== 'guest') m.type = 'member'
      delete m.active
    })

    // 3) utilities: billType keys → type names. "water" rows were already
    //    renamed to Trash by the app in earlier versions; any leftovers
    //    are mapped identically so nothing changes visually.
    const KEY_TO_LABEL = {
      electricity: 'Electricity',
      water: 'Trash',
      gas: 'Gas',
      internet: 'Internet',
      trash: 'Trash',
      other: 'Other',
    }
    await tx.table('utilities').toCollection().modify((u) => {
      const label = u.billType && KEY_TO_LABEL[u.billType]
      if (label) u.billType = label
    })

    // 4) Seed the six predefined default types (ids 1..6 = display order).
    await tx.table('utilityTypes').bulkAdd(
      DEFAULT_UTILITY_TYPES.map((t, i) => ({ id: i + 1, ...t, isDefault: true })),
    )
  })

/** Default starting grocery fund for a new month. */
export const DEFAULT_INITIAL_BAZAR_TAKA = 2000

/**
 * Get the monthSettings row for a given month key, creating it with the
 * default initial bazar taka if it doesn't exist yet.
 */
export async function getMonthSettings(monthKey) {
  let settings = await db.monthSettings.get(monthKey)
  if (!settings) {
    settings = { month: monthKey, initialBazarTaka: DEFAULT_INITIAL_BAZAR_TAKA }
    await db.monthSettings.put(settings)
  }
  return settings
}

export default db