import { useCallback } from 'react'
import { db } from '../db/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { daysInMonth, isoDateForDay } from '../utils/dateHelpers'

/**
 * Reads/writes meal entries for a given month.
 * Returns the live list of entries for the month plus mutation helpers.
 *
 * @param {string} monthKey - YYYY-MM
 */
export function useMealChart(monthKey) {
  const startIso = `${monthKey}-01`
  const endIso = isoDateForDay(monthKey, daysInMonth(monthKey))

  // All meal entries whose date falls within this month.
  const entries = useLiveQuery(
    () =>
      db.mealEntries
        .where('date')
        .between(startIso, endIso, true, true)
        .toArray(),
    [monthKey],
    [],
  )

  /** Upsert a meal entry for (memberId, date). */
  const setEntry = useCallback(async (memberId, date, patch) => {
    const existing = await db.mealEntries
      .where('[memberId+date]')
      .equals([memberId, date])
      .first()

    if (existing) {
      await db.mealEntries.update(existing.id, patch)
    } else {
      await db.mealEntries.add({
        memberId,
        date,
        breakfast: patch.breakfast ?? 0,
        dinner: patch.dinner ?? 0,
      })
    }
  }, [])

  /** Toggle a single meal (breakfast/dinner) for a member on a date. */
  const toggleMeal = useCallback(
    async (memberId, date, mealType) => {
      const existing = await db.mealEntries
        .where('[memberId+date]')
        .equals([memberId, date])
        .first()
      const current = existing ? Number(existing[mealType]) || 0 : 0
      const next = current === 1 ? 0 : 1
      await setEntry(memberId, date, { [mealType]: next })
    },
    [setEntry],
  )

  /**
   * Bulk set a meal type (or both) for every member across one or more dates.
   * @param {number[]} memberIds
   * @param {string[]} dates - ISO date strings (e.g. ['2026-08-01', '2026-08-02'])
   * @param {string} mealType - 'breakfast' | 'dinner' | 'both'
   * @param {boolean} value
   */
  const bulkSet = useCallback(
    async (memberIds, dates, mealType, value) => {
      const val = value ? 1 : 0
      const dateList = Array.isArray(dates) ? dates : [dates]
      await db.transaction('rw', db.mealEntries, async () => {
        for (const date of dateList) {
          for (const memberId of memberIds) {
            const existing = await db.mealEntries
              .where('[memberId+date]')
              .equals([memberId, date])
              .first()
            if (existing) {
              const patch = {}
              if (mealType === 'breakfast' || mealType === 'both') patch.breakfast = val
              if (mealType === 'dinner' || mealType === 'both') patch.dinner = val
              await db.mealEntries.update(existing.id, patch)
            } else {
              await db.mealEntries.add({
                memberId,
                date,
                breakfast:
                  mealType === 'breakfast' || mealType === 'both' ? val : 0,
                dinner: mealType === 'dinner' || mealType === 'both' ? val : 0,
              })
            }
          }
        }
      })
    },
    [],
  )

  return {
    entries: entries || [],
    setEntry,
    toggleMeal,
    bulkSet,
  }
}

export default useMealChart