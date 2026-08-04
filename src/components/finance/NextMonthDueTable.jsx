import { forwardRef } from 'react'
import NumberInput from '../common/NumberInput'
import { formatMoney } from '../../utils/calculations'
import { monthLabel } from '../../utils/dateHelpers'
import { DEFAULT_INITIAL_BAZAR_TAKA } from '../../db/db'

/**
 * Bazar Due Table: one row per member.
 * Columns: Member | {month} Balance | Starting Contributions | Amount to Pay.
 * The header includes the editable default starting contributions input.
 * Forwards a ref for export capture.
 */
const NextMonthDueTable = forwardRef(function NextMonthDueTable(
  { due, month, nextMonth, initialBazarTaka, onCommitInitialBazar },
  ref,
) {
  return (
    <div ref={ref} className="export-target rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Bazar Due — {monthLabel(nextMonth)}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>
            Default Starting Contributions:{' '}
            <span className="font-semibold text-slate-700">
              ৳ {DEFAULT_INITIAL_BAZAR_TAKA.toLocaleString()}
            </span>
          </span>
          <div className="w-28">
            <NumberInput
              value={initialBazarTaka}
              onCommit={onCommitInitialBazar}
              placeholder={String(DEFAULT_INITIAL_BAZAR_TAKA)}
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-4 py-2.5">Member</th>
              <th className="px-4 py-2.5 text-right">{monthLabel(month)} Balance</th>
              <th className="px-4 py-2.5 text-right">Starting Contributions</th>
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
                    {row.isDue ? '+' : row.isCredit ? '-' : ''}
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