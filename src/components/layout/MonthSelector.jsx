import { useApp } from '../../context/AppContext'
import { monthLabel, shiftMonth, currentMonthKey } from '../../utils/dateHelpers'

/**
 * Month + year selector that drives the whole app via AppContext.month.
 * Prev/Next buttons plus a dropdown of recent months.
 */
export default function MonthSelector({ className = '' }) {
  const { month, setMonth } = useApp()

  const go = (delta) => setMonth(shiftMonth(month, delta))

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => go(-1)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        aria-label="Previous month"
      >
        ‹
      </button>

      <select
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
      >
        {/* Show 12 months back + 3 months forward */}
        {Array.from({ length: 16 }, (_, i) => shiftMonth(currentMonthKey(), -12 + i)).map(
          (k) => (
            <option key={k} value={k}>
              {monthLabel(k)}
            </option>
          ),
        )}
      </select>

      <button
        onClick={() => go(1)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        aria-label="Next month"
      >
        ›
      </button>

      {month !== currentMonthKey() && (
        <button
          onClick={() => setMonth(currentMonthKey())}
          className="ml-1 rounded-md px-2 py-1.5 text-xs text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40"
        >
          Today
        </button>
      )}
    </div>
  )
}