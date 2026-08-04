import { format, parseISO, getDaysInMonth, isValid } from 'date-fns'

/**
 * Format a Date (or ISO string) into the canonical month key `YYYY-MM`.
 */
export function toMonthKey(date) {
  const d = date instanceof Date ? date : new Date(date)
  return format(d, 'yyyy-MM')
}

/**
 * Parse a `YYYY-MM` month key into a Date pointing at the 1st of that month.
 */
export function monthKeyToDate(monthKey) {
  const d = parseISO(`${monthKey}-01`)
  return isValid(d) ? d : new Date(NaN)
}

/**
 * Number of days in the month represented by a `YYYY-MM` key (28/29/30/31).
 */
export function daysInMonth(monthKey) {
  return getDaysInMonth(monthKeyToDate(monthKey))
}

/**
 * Build an ISO date string (`YYYY-MM-DD`) for a given day-of-month in a month key.
 */
export function isoDateForDay(monthKey, day) {
  const d = day.toString().padStart(2, '0')
  return `${monthKey}-${d}`
}

/**
 * Human-friendly month label, e.g. "July 2026".
 */
export function monthLabel(monthKey) {
  const d = monthKeyToDate(monthKey)
  return isValid(d) ? format(d, 'MMMM yyyy') : monthKey
}

/**
 * Short month name + year, e.g. "Jul 2026".
 */
export function shortMonthLabel(monthKey) {
  const d = monthKeyToDate(monthKey)
  return isValid(d) ? format(d, 'MMM yyyy') : monthKey
}

/**
 * The current month key based on today's date.
 */
export function currentMonthKey() {
  return toMonthKey(new Date())
}

/**
 * Move a month key forward or backward by N months.
 * Returns a `YYYY-MM` string.
 */
export function shiftMonth(monthKey, delta) {
  const d = monthKeyToDate(monthKey)
  if (!isValid(d)) return monthKey
  d.setMonth(d.getMonth() + delta)
  return toMonthKey(d)
}

/**
 * List of recent month keys around the given one (for selectors/dropdowns).
 * Returns `count` months ending at `monthKey`.
 */
export function recentMonthKeys(monthKey, count = 12) {
  const keys = []
  for (let i = count - 1; i >= 0; i--) {
    keys.push(shiftMonth(monthKey, -i))
  }
  return keys
}

/**
 * Pretty-print an ISO date as e.g. "14 Jul".
 */
export function prettyDate(iso) {
  const d = parseISO(iso)
  return isValid(d) ? format(d, 'dd MMM') : iso
}