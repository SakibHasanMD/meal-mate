import { useCallback, useMemo } from 'react'
import { db } from '../db/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { FALLBACK_UTILITY_ICON } from '../utils/utilityTypes'

/**
 * Live access to the `utilityTypes` table: the six predefined defaults plus
 * any custom types the user has created.
 *
 * Types are ordered by id — defaults are seeded first (1..6), so they always
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
  const types = useLiveQuery(() => db.utilityTypes.orderBy('id').toArray(), [], [])

  const byName = useMemo(() => {
    const map = new Map()
    for (const t of types || []) map.set(t.name, t)
    return map
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