import { forwardRef } from 'react'
import { formatMoney } from '../../utils/calculations'
import { monthLabel, monthName } from '../../utils/dateHelpers'

/**
 * Combined table matching the PDF structure:
 * Member | Meals | Food Cost | Contributions | Balance | Starting | To Pay
 * 
 * This is a single flat table, not two sections glued together.
 */
const CombinedMealBazaarTable = forwardRef(function CombinedMealBazaarTable(
  { 
    summary, 
    month, 
    nextMonth, 
    initialBazarTaka,
    skipNextMonth = new Set(),
    customStarting = {},
  },
  ref,
) {
  return (
    <div ref={ref} className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {monthName(month)} Meal Calculation + {monthName(nextMonth)} Bazaar Due
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500 dark:bg-slate-700/60 dark:text-slate-400">
              <th className="px-4 py-2.5">Member</th>
              <th className="px-4 py-2.5 text-right">Meals</th>
              <th className="px-4 py-2.5 text-right">Food Cost</th>
              <th className="px-4 py-2.5 text-right">Contributions</th>
              <th className="px-4 py-2.5 text-right">{monthName(month)} Balance</th>
              <th className="px-4 py-2.5 text-right">Starting</th>
              <th className="px-4 py-2.5 text-right">To Pay</th>
            </tr>
          </thead>
          <tbody>
            {summary.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                  No members.
                </td>
              </tr>
            ) : (
              summary.map((row) => {
                const isSkipped = skipNextMonth.has(row.member.id)
                const customAmount = customStarting[row.member.id]
                const actualStarting = isSkipped ? 0 : (customAmount ?? initialBazarTaka)
                const actualToPay = actualStarting - row.balance
                
                return (
                  <tr key={row.member.id} className="border-t border-slate-100 dark:border-slate-700/60">
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">
                      {row.member.name}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-300">
                      {row.meals.total}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-700 dark:text-slate-200">
                      {formatMoney(row.foodCost)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-700 dark:text-slate-200">
                      {formatMoney(row.contribution)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right ${
                        row.isDue
                          ? 'text-red-600 dark:text-red-400'
                          : row.isCredit
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {formatMoney(Math.abs(row.balance))}
                      <span className="ml-1 text-[10px]">
                        {row.isDue ? 'due' : row.isCredit ? 'credit' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-700 dark:text-slate-200">
                      {formatMoney(actualStarting)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatMoney(actualToPay)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          {summary.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-700/40">
                <td className="px-4 py-2.5 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Total
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">
                  {summary.reduce((s, r) => s + r.meals.total, 0)}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">
                  {formatMoney(summary.reduce((s, r) => s + r.foodCost, 0))}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">
                  {formatMoney(summary.reduce((s, r) => s + r.contribution, 0))}
                </td>
                <td
                  className={`px-4 py-2.5 text-right font-bold ${
                    Math.abs(summary.reduce((s, r) => s + r.balance, 0)) < 0.01
                      ? 'text-slate-500 dark:text-slate-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {formatMoney(Math.abs(summary.reduce((s, r) => s + r.balance, 0)))}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">
                  {formatMoney(summary.reduce((s, r) => {
                    const customAmount = customStarting[r.member.id]
                    return s + (skipNextMonth.has(r.member.id) ? 0 : (customAmount ?? initialBazarTaka))
                  }, 0))}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">
                  {formatMoney(summary.reduce((s, r) => {
                    const customAmount = customStarting[r.member.id]
                    const actualStarting = skipNextMonth.has(r.member.id) ? 0 : (customAmount ?? initialBazarTaka)
                    return s + actualStarting - r.balance
                  }, 0))}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
})

export default CombinedMealBazaarTable
