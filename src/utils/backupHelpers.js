import { db } from '../db/db'

/**
 * Backup & restore for the whole MealMate database.
 *
 * The database is browser-local (IndexedDB), so it can be lost if the
 * browser clears storage. These helpers let the user download a full JSON
 * snapshot of every table and restore it later.
 */

export const BACKUP_TABLES = [
  'members',
  'mealEntries',
  'bazarExpenses',
  'contributions',
  'monthSettings',
  'houseFunds',
  'utilities',
]

const BACKUP_FORMAT_VERSION = 1

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
 * file doesn't look like a MealMate backup.
 */
export function validateBackup(payload) {
  if (!payload || payload.app !== 'MealMate') {
    throw new Error('Not a MealMate backup file.')
  }
  if (payload.formatVersion !== BACKUP_FORMAT_VERSION) {
    throw new Error(
      `Unsupported backup version (${payload.formatVersion}). Expected version ${BACKUP_FORMAT_VERSION}.`,
    )
  }
  if (!payload.tables || typeof payload.tables !== 'object') {
    throw new Error('Backup file is missing table data.')
  }
  for (const name of BACKUP_TABLES) {
    if (!Array.isArray(payload.tables[name])) {
      throw new Error(`Backup file is missing the "${name}" table.`)
    }
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

  await db.transaction('rw', BACKUP_TABLES, async () => {
    for (const name of BACKUP_TABLES) {
      const rows = payload.tables[name] || []
      await db.table(name).clear()
      if (rows.length > 0) await db.table(name).bulkAdd(rows)
    }
  })
}

export default { downloadBackup, restoreBackup }
