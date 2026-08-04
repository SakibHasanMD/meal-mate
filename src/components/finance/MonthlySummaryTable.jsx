import { forwardRef } from 'react'
import { formatMoney, round2 } from '../../utils/calculations'

/**
 * Monthly Summary Table: one row per member.
 * Columns: Total Meals | Food Cost | Contribution | Balance (Due/Credit).
 * Balance is red for due, green for credit.
 * Forwards a ref for export capture.
 */
const MonthlySummaryTable = forwardRef(function MonthlySummaryTable(
  { summary, mealRate: rate },
  ref,
) {
  return (
    <div ref={ref} className="export-target rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">Monthly Summary</h3>
        <div className="text-xs text-slate-500">
          Meal Rate: <span className="font-semibold text-slate-700">{formatMoney(round2(rate))}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-4 py-2.5">Member</th>
              <th className="px-4 py-2.5 text-right">Total Meals</th>
              <th className="px-4 py-2.5 text-right">Food Cost</th>
              <th className="px-4 py-2.5 text-right">Contribution</th>
              <th className="px-4 py-2.5 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {summary.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No members to summarize.
                </td>
              </tr>
            ) : (
              summary.map((row) => (
                <tr key={row.member.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {row.member.name}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600">
                    {row.meals.total}
                    <span className="ml-1 text-[10px] text-slate-400">
                      (B{row.meals.breakfast}/D{row.meals.dinner})
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-700">
                    {formatMoney(row.foodCost)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-700">
                    {formatMoney(row.contribution)}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-semibold ${
                      row.isDue
                        ? 'text-red-600'
                        : row.isCredit
                          ? 'text-emerald-600'
                          : 'text-slate-600'
                    }`}
                  >
                    {formatMoney(Math.abs(row.balance))}
                    <span className="ml-1 text-[10px]">
                      {row.isDue ? 'due' : row.isCredit ? 'credit' : 'settled'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
})

export default MonthlySummaryTable