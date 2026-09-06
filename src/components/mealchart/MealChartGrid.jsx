import { forwardRef, useMemo } from 'react'
import { parseISO, getDay, isValid, format } from 'date-fns'
import MealChartCell from './MealChartCell'
import { daysInMonth, isoDateForDay } from '../../utils/dateHelpers'
import { memberMealTotals } from '../../utils/calculations'

/**
 * The meal chart grid, transposed to fit a desktop screen:
 *
 * - Rows    = one per member.
 * - Columns = days 1..N of the selected month (weekend days are tinted).
 * - Each day cell holds two stacked toggles: breakfast (top) and dinner (bottom).
 * - Sticky left  = member name, sticky right = per-member totals (B/D/total).
 *
 * This mirrors the paper register but reads left-to-right across the month,
 * so the whole chart fits the page width on a PC instead of scrolling.
 *
 * The ref is forwarded so the parent can capture it for export.
 */
const MealChartGrid = forwardRef(function MealChartGrid(
  { monthKey, members, entries, onToggle, locked },
  ref,
) {
  const days = daysInMonth(monthKey)

  // Build a lookup: `${memberId}|${date}` -> entry
  const lookup = useMemo(() => {
    const map = new Map()
    for (const e of entries) {
      map.set(`${e.memberId}|${e.date}`, e)
    }
    return map
  }, [entries])

  // Per-member totals (breakfast / dinner / combined) for the right column.
  const totals = useMemo(
    () => memberMealTotals(members, entries),
    [members, entries],
  )

  const dayNumbers = Array.from({ length: days }, (_, i) => i + 1)

  const isWeekend = (iso) => {
    const d = parseISO(iso)
    return isValid(d) && (getDay(d) === 0 || getDay(d) === 6)
  }

  // Today's date in the chart's own month (highlights the current day).
  const todayIso = format(new Date(), 'yyyy-MM-dd')
  const isToday = (iso) => iso === todayIso

  if (!members.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500">
        No active members. Add members on the Members page first.
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="export-target inline-block min-w-full rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th
                className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-300"
              >
                Member
              </th>
              {dayNumbers.map((day) => {
                const date = isoDateForDay(monthKey, day)
                const weekend = isWeekend(date)
                const today = isToday(date)
                return (
                  <th
                    key={day}
                    className={`border-b border-l border-slate-200 px-1 py-1.5 text-center text-sm font-semibold dark:border-slate-700 ${
                      today
                        ? 'bg-[rgb(22,163,74)] text-white ring-1 ring-inset ring-[rgb(22,163,74)]'
                        : weekend
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                          : 'bg-slate-50 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {day}
                  </th>
                )
              })}
              <th
                className="sticky right-0 z-20 border-b border-l border-slate-200 bg-slate-50 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-400"
              >
                Totals
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const t = totals.get(m.id) || { breakfast: 0, dinner: 0, total: 0 }
              return (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-200">
                    {m.name}
                  </td>
                  {dayNumbers.map((day) => {
                    const date = isoDateForDay(monthKey, day)
                    const entry = lookup.get(`${m.id}|${date}`)
                    const weekend = isWeekend(date)
                    const today = isToday(date)
                    return (
                      <td
                        key={day}
                        className={`border-b border-l border-slate-100 px-0.5 py-1 text-center dark:border-slate-700/60 ${
                          today
                            ? 'bg-[rgba(22,163,74,0.15)]'
                            : weekend
                              ? 'bg-amber-50/40 dark:bg-amber-900/10'
                              : ''
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <MealChartCell
                            size="sm"
                            value={entry?.breakfast ?? 0}
                            onToggle={() => onToggle(m.id, date, 'breakfast')}
                            disabled={locked}
                          />
                          <MealChartCell
                            size="sm"
                            value={entry?.dinner ?? 0}
                            onToggle={() => onToggle(m.id, date, 'dinner')}
                            disabled={locked}
                          />
                        </div>
                      </td>
                    )
                  })}
                  <td className="sticky right-0 z-10 border-b border-l border-slate-100 bg-slate-50 px-2 py-2 text-center dark:border-slate-700/60 dark:bg-slate-700">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {t.total}
                    </div>
                    <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
                      B{t.breakfast} · D{t.dinner}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
        Each cell: top = breakfast, bottom = dinner · Weekend days are tinted ·
        Today is highlighted green · Right column = per-member totals (B/D)
      </div>
    </div>
  )
})

export default MealChartGrid
