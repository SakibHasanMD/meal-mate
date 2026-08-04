import { useMemo } from 'react'
import { db } from '../db/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { daysInMonth, isoDateForDay, shiftMonth } from '../utils/dateHelpers'
import {
  monthlySummary,
  nextMonthDue,
  totalMeals,
  totalBazar,
  mealRate,
  dashboardTotals,
} from '../utils/calculations'

/**
 * Derives all calculated totals for a month from source data.
 * Pulls meal entries, bazar expenses, contributions, and month settings
 * via live queries, then runs the pure calculation functions.
 *
 * @param {Array} members - members list (from AppContext)
 * @param {string} monthKey - YYYY-MM
 */
export function useMonthlySummary(members, monthKey) {
  const startIso = `${monthKey}-01`
  const endIso = isoDateForDay(monthKey, daysInMonth(monthKey))
  const nextMonth = shiftMonth(monthKey, 1)

  const mealEntries = useLiveQuery(
    () =>
      db.mealEntries.where('date').between(startIso, endIso, true, true).toArray(),
    [monthKey],
    [],
  )

  const bazarExpenses = useLiveQuery(
    () =>
      db.bazarExpenses.where('date').between(startIso, endIso, true, true).toArray(),
    [monthKey],
    [],
  )

  const contributions = useLiveQuery(
    () => db.contributions.where('month').equals(monthKey).toArray(),
    [monthKey],
    [],
  )

  const thisMonthSettings = useLiveQuery(
    () => db.monthSettings.get(monthKey),
    [monthKey],
  )

  const nextMonthSettings = useLiveQuery(() => db.monthSettings.get(nextMonth), [
    nextMonth,
  ])

  return useMemo(() => {
    const meals = mealEntries || []
    const bazar = bazarExpenses || []
    const contribs = contributions || []
    const allMembers = members || []

    // Filter out members excluded for this month — they don't eat, so they
    // shouldn't appear in the summary or due calculations.
    const excluded = thisMonthSettings?.excludedMembers ?? []
    const membersList = excluded.length
      ? allMembers.filter((m) => !excluded.includes(m.id))
      : allMembers

    const summary = monthlySummary(membersList, meals, bazar, contribs)
    const due = nextMonthDue(summary, nextMonthSettings?.initialBazarTaka ?? 2000)

    return {
      mealEntries: meals,
      bazarExpenses: bazar,
      contributions: contribs,
      thisMonthSettings,
      nextMonthSettings,
      nextMonth,
      excludedMembers: excluded,
      summary,
      due,
      totals: {
        totalMeals: totalMeals(meals),
        totalBazar: totalBazar(bazar),
        mealRate: mealRate(bazar, meals),
        dashboard: dashboardTotals(membersList, meals, bazar),
      },
    }
  }, [
    mealEntries,
    bazarExpenses,
    contributions,
    members,
    thisMonthSettings,
    nextMonthSettings,
    nextMonth,
  ])
}

export default useMonthlySummary