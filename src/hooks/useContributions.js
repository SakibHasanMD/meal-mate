import { useCallback } from 'react'
import { db, DEFAULT_INITIAL_BAZAR_TAKA, getMonthSettings } from '../db/db'
import { useLiveQuery } from 'dexie-react-hooks'

/**
 * Reads/writes contributions (member deposits for a month) and the
 * per-month initial bazar taka setting.
 *
 * @param {string} monthKey - YYYY-MM
 */
export function useContributions(monthKey) {
  const contributions = useLiveQuery(
    () => db.contributions.where('month').equals(monthKey).toArray(),
    [monthKey],
    [],
  )

  /** Set (replace) a member's contribution for the month. */
  const setContribution = useCallback(
    async (memberId, amount) => {
      const existing = await db.contributions
        .where('[memberId+month]')
        .equals([memberId, monthKey])
        .first()

      const value = Number(amount) || 0
      if (existing) {
        await db.contributions.update(existing.id, { amount: value })
      } else {
        await db.contributions.add({
          memberId,
          month: monthKey,
          amount: value,
        })
      }
    },
    [monthKey],
  )

  /** Add to a member's existing contribution for the month. */
  const addContribution = useCallback(
    async (memberId, amount) => {
      const existing = await db.contributions
        .where('[memberId+month]')
        .equals([memberId, monthKey])
        .first()
      const value = Number(amount) || 0
      if (existing) {
        await db.contributions.update(existing.id, {
          amount: (Number(existing.amount) || 0) + value,
        })
      } else {
        await db.contributions.add({
          memberId,
          month: monthKey,
          amount: value,
        })
      }
    },
    [monthKey],
  )

  const deleteContribution = useCallback(async (id) => {
    return db.contributions.delete(id)
  }, [])

  return {
    contributions: contributions || [],
    setContribution,
    addContribution,
    deleteContribution,
  }
}

/**
 * Read + update the initial bazar taka for a month.
 */
export function useMonthSettings(monthKey) {
  const settings = useLiveQuery(() => getMonthSettings(monthKey), [monthKey])

  const setInitialBazarTaka = useCallback(
    async (value) => {
      const num = Number(value) || 0
      await db.monthSettings.put({
        month: monthKey,
        initialBazarTaka: num,
      })
    },
    [monthKey],
  )

  return {
    settings,
    initialBazarTaka: settings?.initialBazarTaka ?? DEFAULT_INITIAL_BAZAR_TAKA,
    setInitialBazarTaka,
  }
}

export default useContributions