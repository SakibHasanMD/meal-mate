import { useCallback } from 'react'
import { db } from '../db/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { daysInMonth, isoDateForDay } from '../utils/dateHelpers'

/**
 * Monthly utility bills for the selected month (additions only).
 *
 * Since v3, `billType` stores the human-readable type name (e.g. 'Electricity',
 * 'Water', or any custom type the user created) rather than a fixed key.
 * Existing rows were migrated in place; unknown names (a type that was deleted
 * after bills were logged) simply render with a generic icon.
 *
 * @param {string} monthKey - YYYY-MM
 * @returns {{
 *   entries: Array<{id, date, billType, amount, note}>,
 *   monthTotal: number,
 *   totalsByType: Record<string, number>,   // keyed by type name
 *   addEntry, updateEntry, deleteEntry
 * }}
 */
export function useUtilities(monthKey) {
  const startIso = `${monthKey}-01`
  const endIso = isoDateForDay(monthKey, daysInMonth(monthKey))

  const entries = useLiveQuery(
    async () => {
      const list = await db.utilities
        .where('date')
        .between(startIso, endIso, true, true)
        .toArray()
      return list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    },
    [monthKey],
    [],
  )

  const addEntry = useCallback(
    async (data) => {
      const date = data.date
      return db.utilities.add({
        date,
        billType: String(data.billType || 'Other'),
        amount: Number(data.amount) || 0,
        note: data.note?.trim() || '',
        month: date.slice(0, 7),
      })
    },
    [],
  )

  const updateEntry = useCallback(async (id, changes) => {
    if (changes.date) changes.month = changes.date.slice(0, 7)
    if (changes.billType) changes.billType = String(changes.billType)
    return db.utilities.update(id, changes)
  }, [])

  const deleteEntry = useCallback(async (id) => {
    return db.utilities.delete(id)
  }, [])

  const list = entries || []
  const monthTotal = list.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  const totalsByType = {}
  for (const e of list) {
    const key = e.billType || 'Other'
    totalsByType[key] = (totalsByType[key] || 0) + (Number(e.amount) || 0)
  }

  return {
    entries: list,
    monthTotal,
    totalsByType,
    addEntry,
    updateEntry,
    deleteEntry,
  }
}

export default useUtilities