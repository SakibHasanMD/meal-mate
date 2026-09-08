import { useCallback, useEffect } from 'react'
import { db, DEFAULT_INITIAL_BAZAR_TAKA } from '../db/db'
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
  // Read-only query — never write inside useLiveQuery (it causes crash loops).
  // Map undefined (not found) to null so we can tell "loading" from "not found".
  const settings = useLiveQuery(
    async () => (await db.monthSettings.get(monthKey)) ?? null,
    [monthKey],
  )

  // Create default settings in a separate effect so the live query stays read-only.
  useEffect(() => {
    if (settings === undefined) return // still loading
    if (settings === null) {
      db.monthSettings.put({
        month: monthKey,
        initialBazarTaka: DEFAULT_INITIAL_BAZAR_TAKA,
      })
    }
  }, [settings, monthKey])

  const setInitialBazarTaka = useCallback(
    async (value) => {
      const num = Number(value) || 0
      const existing = await db.monthSettings.get(monthKey)
      await db.monthSettings.put({
        month: monthKey,
        initialBazarTaka: num,
        finalized: existing?.finalized ?? false,
        excludedMembers: existing?.excludedMembers ?? [],
        bazarEqualsContributions: existing?.bazarEqualsContributions ?? false,
        skipNextMonth: existing?.skipNextMonth ?? [],
        customStarting: existing?.customStarting ?? {},
      })
    },
    [monthKey],
  )

  /** Toggle whether a member is excluded from this month (not eating at all). */
  const toggleMemberExclusion = useCallback(
    async (memberId) => {
      const existing = await db.monthSettings.get(monthKey)
      const excluded = existing?.excludedMembers ?? []
      const isExcluded = excluded.includes(memberId)
      const next = isExcluded
        ? excluded.filter((id) => id !== memberId)
        : [...excluded, memberId]
      await db.monthSettings.put({
        month: monthKey,
        initialBazarTaka: existing?.initialBazarTaka ?? DEFAULT_INITIAL_BAZAR_TAKA,
        finalized: existing?.finalized ?? false,
        excludedMembers: next,
        bazarEqualsContributions: existing?.bazarEqualsContributions ?? false,
        skipNextMonth: existing?.skipNextMonth ?? [],
        customStarting: existing?.customStarting ?? {},
      })
    },
    [monthKey],
  )

  /** Toggle whether bazar total = total contributions (skip expense tracking). */
  const toggleBazarEqualsContributions = useCallback(
    async () => {
      const existing = await db.monthSettings.get(monthKey)
      const current = existing?.bazarEqualsContributions ?? false
      await db.monthSettings.put({
        month: monthKey,
        initialBazarTaka: existing?.initialBazarTaka ?? DEFAULT_INITIAL_BAZAR_TAKA,
        finalized: existing?.finalized ?? false,
        excludedMembers: existing?.excludedMembers ?? [],
        bazarEqualsContributions: !current,
        skipNextMonth: existing?.skipNextMonth ?? [],
        customStarting: existing?.customStarting ?? {},
      })
    },
    [monthKey],
  )

  const excludedMembers = settings?.excludedMembers ?? []
  const bazarEqualsContributions = settings?.bazarEqualsContributions ?? false

  return {
    settings,
    initialBazarTaka: settings?.initialBazarTaka ?? DEFAULT_INITIAL_BAZAR_TAKA,
    setInitialBazarTaka,
    excludedMembers,
    toggleMemberExclusion,
    bazarEqualsContributions,
    toggleBazarEqualsContributions,
  }
}

export default useContributions