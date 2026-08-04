import { forwardRef } from 'react'
import { formatMoney } from '../../utils/calculations'
import { monthLabel } from '../../utils/dateHelpers'

/**
 * Next Month Due Table: one row per member.
 * Columns: Member | This Month's Balance | Next Month Initial Bazar | Amount to Pay.
 * Forwards a ref for export capture.
 */
const NextMonthDueTable = forwardRef(function NextMonthDueTable(
  { due, nextMonth, initialBazarTaka },
  ref,
) {
  return (
    <div ref={ref} className="export-target rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Next Month Due — {monthLabel(nextMonth)}
        </h3>
        <div className="text-xs text-slate-500">
          Initial Bazar: <span className="font-semibold text-slate-700">{formatMoney(initialBazarTaka)}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-4 py-2.5">Member</th>
              <th className="px-4 py-2.5 text-right">This Month Balance</th>
              <th className="px-4 py-2.5 text-right">Initial Bazar</th>
              <th className="px-4 py-2.5 text-right">Amount to Pay</th>
            </tr>
          </thead>
          <tbody>
            {due.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No members.
                </td>
              </tr>
            ) : (
              due.map((row) => (
                <tr key={row.member.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {row.member.name}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right ${
                      row.isDue
                        ? 'text-red-600'
                        : row.isCredit
                          ? 'text-emerald-600'
                          : 'text-slate-600'
                    }`}
                  >
                    {row.balance < 0 ? '-' : '+'}
                    {formatMoney(Math.abs(row.balance))}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-700">
                    {formatMoney(initialBazarTaka)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                    {formatMoney(row.amountToPay)}
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

export default NextMonthDueTable