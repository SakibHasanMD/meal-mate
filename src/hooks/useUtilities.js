import { useCallback } from 'react'
import { db } from '../db/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { daysInMonth, isoDateForDay } from '../utils/dateHelpers'

/**
 * Utility bill types — additions only (electricity, water, gas, internet...).
 */
export const UTILITY_TYPES = {
  electricity: { label: 'Electricity', icon: '💡' },
  water: { label: 'Water', icon: '💧' },
  gas: { label: 'Gas', icon: '🔥' },
  internet: { label: 'Internet', icon: '🌐' },
  other: { label: 'Other', icon: '📄' },
}

export const UTILITY_TYPE_KEYS = Object.keys(UTILITY_TYPES)

/**
 * Monthly utility bills for the selected month (additions only).
 *
 * @param {string} monthKey - YYYY-MM
 * @returns {{
 *   entries: Array<{id, date, billType, amount, note}>,
 *   monthTotal: number,
 *   totalsByType: Record<string, number>,
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
        billType: UTILITY_TYPE_KEYS.includes(data.billType)
          ? data.billType
          : 'other',
        amount: Number(data.amount) || 0,
        note: data.note?.trim() || '',
        month: date.slice(0, 7),
      })
    },
    [],
  )

  const updateEntry = useCallback(async (id, changes) => {
    if (changes.date) changes.month = changes.date.slice(0, 7)
    return db.utilities.update(id, changes)
  }, [])

  const deleteEntry = useCallback(async (id) => {
    return db.utilities.delete(id)
  }, [])

  const list = entries || []
  const monthTotal = list.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  const totalsByType = {}
  for (const key of UTILITY_TYPE_KEYS) totalsByType[key] = 0
  for (const e of list) {
    const key = UTILITY_TYPE_KEYS.includes(e.billType) ? e.billType : 'other'
    totalsByType[key] += Number(e.amount) || 0
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
