import { forwardRef, useMemo, Fragment } from 'react'
import MealChartCell from './MealChartCell'
import { daysInMonth, isoDateForDay } from '../../utils/dateHelpers'
import { memberMealTotals } from '../../utils/calculations'

/**
 * The core meal chart grid, mirroring the paper register.
 *
 * - Rows = days 1..N of the selected month.
 * - Columns = one pair per active member: [Name] B (breakfast) and [Name] D (dinner).
 * - Click a cell to toggle 0/1; auto-saves immediately.
 * - Bottom Totals row per member (breakfasts, dinners, combined).
 * - Date column sticky on the left; Totals row sticky at the bottom.
 * - Horizontally scrollable for many members.
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

  // Per-member totals for the bottom row.
  const totals = useMemo(
    () => memberMealTotals(members, entries),
    [members, entries],
  )

  if (!members.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
        No active members. Add members on the Members page first.
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="export-target inline-block min-w-full rounded-lg border border-slate-200 bg-white p-3"
    >
      <div className="max-h-[70vh] overflow-auto no-scrollbar">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th
                className="sticky left-0 z-20 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600"
              >
                Date
              </th>
              {members.map((m) => (
                <th
                  key={m.id}
                  colSpan={2}
                  className="border-b border-l border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-700"
                >
                  {m.name}
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-20 border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs font-normal text-slate-400">
                Day
              </th>
              {members.map((m) => (
                <Fragment key={m.id}>
                  <th
                    className="border-b border-l border-slate-200 bg-slate-50 px-1.5 py-1.5 text-center text-[10px] font-medium text-slate-400"
                  >
                    B
                  </th>
                  <th
                    className="border-b border-slate-200 bg-slate-50 px-1.5 py-1.5 text-center text-[10px] font-medium text-slate-400"
                  >
                    D
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
              const date = isoDateForDay(monthKey, day)
              return (
                <tr key={day} className="hover:bg-slate-50/50">
                  <td className="sticky left-0 z-10 border-b border-slate-100 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                    {day}
                  </td>
                  {members.map((m) => {
                    const entry = lookup.get(`${m.id}|${date}`)
                    return (
                      <Fragment key={m.id}>
                        <td
                          className="border-b border-l border-slate-100 px-1 py-1 text-center"
                        >
                          <MealChartCell
                            value={entry?.breakfast ?? 0}
                            onToggle={() => onToggle(m.id, date, 'breakfast')}
                            disabled={locked}
                          />
                        </td>
                        <td
                          className="border-b border-slate-100 px-1 py-1 text-center"
                        >
                          <MealChartCell
                            value={entry?.dinner ?? 0}
                            onToggle={() => onToggle(m.id, date, 'dinner')}
                            disabled={locked}
                          />
                        </td>
                      </Fragment>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            {/* Totals row — B and D per member */}
            <tr className="sticky bottom-0 z-10 border-t-2 border-slate-400 bg-slate-100">
              <td className="sticky left-0 z-20 border-t-2 border-slate-400 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                Totals
              </td>
              {members.map((m) => {
                const t = totals.get(m.id) || { breakfast: 0, dinner: 0, total: 0 }
                return (
                  <Fragment key={m.id}>
                    <td
                      className="border-t-2 border-l border-slate-400 bg-slate-100 px-1 py-2 text-center text-xs font-bold text-slate-700"
                    >
                      {t.breakfast}
                    </td>
                    <td
                      className="border-t-2 border-slate-400 bg-slate-100 px-1 py-2 text-center text-xs font-bold text-slate-700"
                    >
                      {t.dinner}
                    </td>
                  </Fragment>
                )
              })}
            </tr>
            {/* Combined row — B+D per member, separated by a clear line */}
            <tr className="border-t border-slate-300 bg-slate-50">
              <td className="sticky left-0 z-20 border-t border-slate-300 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase text-slate-500">
                Combined
              </td>
              {members.map((m) => {
                const t = totals.get(m.id) || { total: 0 }
                return (
                  <td
                    key={`${m.id}-tt`}
                    colSpan={2}
                    className="border-t border-l border-slate-300 bg-slate-50 px-1 py-1.5 text-center text-sm font-bold text-brand-700"
                  >
                    {t.total}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
})

export default MealChartGrid