import Dexie from 'dexie'

/**
 * Local IndexedDB database for the Mess Meal & Bazar Manager.
 * Single-user, browser-only persistence via Dexie.
 *
 * Tables:
 *  - members:        roster of people who eat in the mess
 *  - mealEntries:    one row per member per day (breakfast + dinner flags)
 *  - bazarExpenses:  grocery spending log
 *  - contributions:  money each member deposits for a given month
 *  - monthSettings:  per-month config (e.g. initial bazar taka)
 *
 * All derived numbers (meal rate, dues, etc.) are computed on the fly
 * from these source tables — never stored.
 */
export const db = new Dexie('MealManagerDB')

db.version(1).stores({
  // Primary key auto-increments as `id`.
  members: '++id, name, active, joinDate',
  // Composite uniqueness on (memberId, date): one row per member per day.
  mealEntries: '++id, memberId, date, [memberId+date]',
  bazarExpenses: '++id, date, month',
  contributions: '++id, memberId, month, [memberId+month]',
  // `month` (YYYY-MM) is the primary key here.
  monthSettings: 'month, initialBazarTaka',
})

/** Default starting grocery fund for a new month. */
export const DEFAULT_INITIAL_BAZAR_TAKA = 2000

/**
 * Get the monthSettings row for a given month key, creating it with the
 * default initial bazar taka if it doesn't exist yet.
 */
export async function getMonthSettings(monthKey) {
  let settings = await db.monthSettings.get(monthKey)
  if (!settings) {
    settings = { month: monthKey, initialBazarTaka: DEFAULT_INITIAL_BAZAR_TAKA }
    await db.monthSettings.put(settings)
  }
  return settings
}

export default db