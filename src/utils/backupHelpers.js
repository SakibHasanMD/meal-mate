import { db } from '../db/db.js'
import { DEFAULT_UTILITY_TYPES } from './utilityTypes.js'

/**
 * Backup & restore for the whole MealMate database.
 *
 * The database is browser-local (IndexedDB), so it can be lost if the
 * browser clears storage. These helpers let the user download a full JSON
 * snapshot of every table and restore it later.
 */

// v2 adds the `utilityTypes` table. v1 backups (the original 7 tables) are
// still accepted and get the default utility types seeded on restore.
export const BACKUP_TABLES = [
  'members',
  'mealEntries',
  'bazarExpenses',
  'contributions',
  'monthSettings',
  'houseFunds',
  'utilities',
  'utilityTypes',
]

const LEGACY_TABLES = BACKUP_TABLES.filter((t) => t !== 'utilityTypes')
const BACKUP_FORMAT_VERSION = 2
const LEGACY_FORMAT_VERSION = 1

/** Build the backup payload from the live database. */
export async function buildBackup() {
  const tables = {}
  for (const name of BACKUP_TABLES) {
    tables[name] = await db.table(name).toArray()
  }
  return {
    app: 'MealMate',
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    tables,
  }
}

/** Download the whole database as a JSON file. */
export async function downloadBackup() {
  const payload = await buildBackup()
  const stamp = new Date().toISOString().slice(0, 10)
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `MealMate_backup_${stamp}.json`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Validate a parsed backup payload. Throws with a friendly message if the
 * file doesn't look like a MealMate backup. Returns which format version
 * the payload uses so restoreBackup can handle legacy files.
 */
export function validateBackup(payload) {
  if (!payload || payload.app !== 'MealMate') {
    throw new Error('Not a MealMate backup file.')
  }
  if (
    payload.formatVersion !== BACKUP_FORMAT_VERSION &&
    payload.formatVersion !== LEGACY_FORMAT_VERSION
  ) {
    throw new Error(
      `Unsupported backup version (${payload.formatVersion}). Expected version ${BACKUP_FORMAT_VERSION} (or legacy ${LEGACY_FORMAT_VERSION}).`,
    )
  }
  if (!payload.tables || typeof payload.tables !== 'object') {
    throw new Error('Backup file is missing table data.')
  }
  const required =
    payload.formatVersion === LEGACY_FORMAT_VERSION
      ? LEGACY_TABLES
      : BACKUP_TABLES
  for (const name of required) {
    if (!Array.isArray(payload.tables[name])) {
      throw new Error(`Backup file is missing the "${name}" table.`)
    }
  }
  return payload.formatVersion
}

/**
 * Normalize restored rows so older data matches the current schema.
 * - members: `active` boolean → `status` string; default `type` member.
 * - utilities: legacy billType keys → type names (same mapping as the v3
 *   migration), so restored v1 backups render identically.
 * - utilityTypes: missing (legacy backups) → seed the predefined defaults.
 */
async function normalizeForRestore(payload) {
  const { tables } = payload

  for (const m of tables.members || []) {
    if (!m.status) m.status = m.active === false ? 'leave' : 'active'
    if (!m.type) m.type = 'member'
    delete m.active
  }

  const KEY_TO_LABEL = {
    electricity: 'Electricity',
    water: 'Trash',
    gas: 'Gas',
    internet: 'Internet',
    trash: 'Trash',
    other: 'Other',
  }
  for (const u of tables.utilities || []) {
    const label = u.billType && KEY_TO_LABEL[u.billType]
    if (label) u.billType = label
  }

  // Legacy backups have no utilityTypes table — restore the defaults so the
  // Utilities page always has its six predefined types.
  if (!Array.isArray(tables.utilityTypes)) {
    tables.utilityTypes = DEFAULT_UTILITY_TYPES.map((t, i) => ({
      id: i + 1,
      ...t,
      isDefault: true,
    }))
  }
}

/**
 * Replace ALL current data with the contents of a backup file.
 * Runs inside a single Dexie transaction, so either everything is restored
 * or nothing changes. Explicit `id` values are preserved so cross-table
 * references (e.g. mealEntries.memberId) keep pointing at the right member.
 */
export async function restoreBackup(file) {
  const text = await file.text()
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('Could not read that file — it is not valid JSON.')
  }
  validateBackup(payload)
  await normalizeForRestore(payload)

  await db.transaction('rw', BACKUP_TABLES, async () => {
    for (const name of BACKUP_TABLES) {
      const rows = payload.tables[name] || []
      await db.table(name).clear()
      if (rows.length > 0) await db.table(name).bulkAdd(rows)
    }
  })
}

export default { downloadBackup, restoreBackup }