import { useCallback, useEffect, useMemo } from 'react'
import { db } from '../db/db'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  DEFAULT_UTILITY_TYPES,
  FALLBACK_UTILITY_ICON,
} from '../utils/utilityTypes'

/**
 * Live access to the `utilityTypes` table: the predefined defaults plus any
 * custom types the user has created.
 *
 * Types are ordered by id — the defaults are seeded first, so they always
 * appear before custom types. Default types cannot be deleted; custom types
 * can, without affecting existing utility bills (they merely fall back to a
 * generic icon in the lists).
 *
 * @returns {{
 *   types: Array<{id, name, icon, isDefault}>,
 *   byName: Map<string, {id, name, icon, isDefault}>,
 *   addType: ({name, icon}) => Promise<number>,
 *   deleteType: (id) => Promise<void>
 * }}
 */
export function useUtilityTypes() {
  // No default value on purpose: `undefined` then means "still loading", which
  // is what tells the self-heal effect below apart from a genuinely empty
  // `utilityTypes` table. A `[]` default would conflate the two and the
  // defaults would never be seeded on a fresh install.
  const types = useLiveQuery(() => db.utilityTypes.orderBy('id').toArray())

  const byName = useMemo(() => {
    const map = new Map()
    for (const t of types || []) map.set(t.name, t)
    return map
  }, [types])

  // Self-heal the default types.
  //
  // Dexie only runs a version's `upgrade()` when upgrading an EXISTING
  // database, so a database created directly at the current version never gets
  // the defaults seeded and starts with an empty `utilityTypes` table. Adding a
  // new default (e.g. "Maid" in v4) would likewise be invisible to anyone
  // whose defaults were seeded by a migration that is already applied.
  //
  // So: whenever a default is missing, insert just the missing ones. Existing
  // rows are never touched, and this is a no-op write-free fast path once the
  // defaults are all present.
  useEffect(() => {
    if (types === undefined) return // still loading (an empty array is real data)
    const present = new Set(types.map((t) => t.name))
    const missing = DEFAULT_UTILITY_TYPES.filter((t) => !present.has(t.name))
    if (missing.length === 0) return
    db.utilityTypes.bulkAdd(
      missing.map((t) => ({ ...t, isDefault: true })),
      { allKeys: true },
    ).catch(() => {
      // A concurrent tab may have inserted the same names first; `name` is a
      // unique index, so swallow the conflict — the next render settles it.
    })
  }, [types])

  /** Create a custom utility type. Throws on empty/duplicate names. */
  const addType = useCallback(async ({ name, icon }) => {
    const trimmed = String(name || '').trim()
    if (!trimmed) throw new Error('Please enter a name for the utility type.')
    const existing = await db.utilityTypes
      .where('name')
      .equalsIgnoreCase(trimmed)
      .first()
    if (existing) {
      throw new Error(`A utility type named "${trimmed}" already exists.`)
    }
    return db.utilityTypes.add({
      name: trimmed,
      icon: icon || FALLBACK_UTILITY_ICON,
      isDefault: false,
    })
  }, [])

  /** Delete a custom type. Default types are protected. */
  const deleteType = useCallback(async (id) => {
    const t = await db.utilityTypes.get(id)
    if (!t) return
    if (t.isDefault) {
      throw new Error('Default utility types cannot be removed.')
    }
    return db.utilityTypes.delete(id)
  }, [])

  return { types: types || [], byName, addType, deleteType }
}

export default useUtilityTypes