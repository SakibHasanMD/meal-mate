import { useCallback } from 'react'
import { db } from '../db/db'
import { useLiveQuery } from 'dexie-react-hooks'

/**
 * Permanent house-fund ledger: every deposit & spending ever recorded,
 * regardless of the selected month.
 *
 * @returns {{
 *   entries: Array<{id, date, type: 'deposit'|'expense', amount, note}>,
 *   totalDeposits: number,
 *   totalExpenses: number,
 *   balance: number,
 *   addEntry, updateEntry, deleteEntry
 * }}
 */
export function useHouseFunds() {
  const entries = useLiveQuery(
    async () => {
      const list = await db.houseFunds.toArray()
      // Newest first; stable tie-break by id (newer id wins).
      return list.sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id,
      )
    },
    [],
    [],
  )

  const addEntry = useCallback(async (data) => {
    return db.houseFunds.add({
      date: data.date,
      type: data.type === 'deposit' ? 'deposit' : 'expense',
      amount: Number(data.amount) || 0,
      note: data.note?.trim() || '',
    })
  }, [])

  const updateEntry = useCallback(async (id, changes) => {
    return db.houseFunds.update(id, changes)
  }, [])

  const deleteEntry = useCallback(async (id) => {
    return db.houseFunds.delete(id)
  }, [])

  const list = entries || []
  const totalDeposits = list
    .filter((e) => e.type === 'deposit')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const totalExpenses = list
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  return {
    entries: list,
    totalDeposits,
    totalExpenses,
    balance: totalDeposits - totalExpenses,
    addEntry,
    updateEntry,
    deleteEntry,
  }
}

export default useHouseFunds
