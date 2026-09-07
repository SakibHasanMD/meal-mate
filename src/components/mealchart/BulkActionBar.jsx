import { useState, useMemo } from 'react'
import Button from '../common/Button'
import { daysInMonth, isoDateForDay } from '../../utils/dateHelpers'

/**
 * Toolbar to bulk-set all members' breakfast/dinner/both for a range of days.
 *
 * Single-day support: if "To Day" is left unselected (the default), only the
 * "From Day" is affected — a single-day operation. Selecting "To Day" turns it
 * into the classic from→to range operation.
 */
export default function BulkActionBar({ monthKey, members, onBulkSet, locked }) {
  const days = daysInMonth(monthKey)
  const [fromDay, setFromDay] = useState(1)
  const [toDay, setToDay] = useState('') // '' = not selected → single day
  const [mealType, setMealType] = useState('both')

  // Build the list of ISO dates for the selection.
  // A blank "To Day" ('' = not selected) means exactly the From Day only.
  const dates = useMemo(() => {
    const from = Number(fromDay)
    if (toDay === '' || toDay == null) {
      return [isoDateForDay(monthKey, from)]
    }
    const to = Number(toDay)
    const start = Math.min(from, to)
    const end = Math.max(from, to)
    const list = []
    for (let d = start; d <= end; d++) {
      list.push(isoDateForDay(monthKey, d))
    }
    return list
  }, [monthKey, fromDay, toDay])

  const dayCount = dates.length
  const singleDay = toDay === ''

  const run = (value) => {
    onBulkSet(members.map((m) => m.id), dates, mealType, value)
  }

  const dayOptions = Array.from({ length: days }, (_, i) => i + 1)

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">From Day</label>
        <select
          value={fromDay}
          onChange={(e) => setFromDay(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        >
          {dayOptions.map((d) => (
            <option key={d} value={d}>
              Day {d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">To Day</label>
        <select
          value={toDay}
          onChange={(e) => setToDay(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        >
          <option value="">Not selected</option>
          {dayOptions.map((d) => (
            <option key={d} value={d}>
              Day {d}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center pb-1.5 text-xs text-slate-400 dark:text-slate-500">
        {singleDay ? (
          <span className="text-brand-700 dark:text-brand-400">Only Day {fromDay}</span>
        ) : (
          `${dayCount} days`
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Meal</label>
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        >
          <option value="both">Both</option>
          <option value="breakfast">Breakfast</option>
          <option value="dinner">Dinner</option>
        </select>
      </div>

      <div className="flex gap-2">
        <Button variant="success" size="sm" onClick={() => run(true)} disabled={locked || !members.length}>
          Set all to 1
        </Button>
        <Button variant="secondary" size="sm" onClick={() => run(false)} disabled={locked || !members.length}>
          Set all to 0
        </Button>
      </div>

      <div className="w-full text-[11px] text-slate-400 dark:text-slate-500">
        Leave <strong>To Day</strong> unselected to update only the day in{' '}
        <strong>From Day</strong>. Select both for a day-range update.
      </div>

      {locked && (
        <span className="text-xs text-amber-600 dark:text-amber-400">Month finalized — unlock to edit.</span>
      )}
    </div>
  )
}