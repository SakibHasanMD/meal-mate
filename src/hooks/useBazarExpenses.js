import { useCallback } from 'react'
import { db } from '../db/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { daysInMonth, isoDateForDay } from '../utils/dateHelpers'

/**
 * Reads/writes grocery expense entries for a month.
 *
 * @param {string} monthKey - YYYY-MM
 */
export function useBazarExpenses(monthKey) {
  const startIso = `${monthKey}-01`
  const endIso = isoDateForDay(monthKey, daysInMonth(monthKey))

  const expenses = useLiveQuery(
    () =>
      db.bazarExpenses
        .where('date')
        .between(startIso, endIso, true, true)
        .reverse()
        .sortBy('date'),
    [monthKey],
    [],
  )

  const addExpense = useCallback(async (data) => {
    return db.bazarExpenses.add({
      date: data.date,
      amount: Number(data.amount) || 0,
      note: data.note?.trim() || '',
      month: data.date.slice(0, 7),
    })
  }, [])

  const updateExpense = useCallback(async (id, changes) => {
    if (changes.date) changes.month = changes.date.slice(0, 7)
    return db.bazarExpenses.update(id, changes)
  }, [])

  const deleteExpense = useCallback(async (id) => {
    return db.bazarExpenses.delete(id)
  }, [])

  return {
    expenses: expenses || [],
    addExpense,
    updateExpense,
    deleteExpense,
  }
}

export default useBazarExpenses