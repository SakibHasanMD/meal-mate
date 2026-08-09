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
    <div ref={ref} className="export-target rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Bazar Due — {monthLabel(nextMonth)}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Default Starting Contributions:{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
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
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500 dark:bg-slate-700/60 dark:text-slate-400">
              <th className="px-4 py-2.5">Member</th>
              <th className="px-4 py-2.5 text-right">{monthLabel(month)} Balance</th>
              <th className="px-4 py-2.5 text-right">Starting Contributions</th>
              <th className="px-4 py-2.5 text-right">Amount to Pay</th>
            </tr>
          </thead>
          <tbody>
            {due.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                  No members.
                </td>
              </tr>
            ) : (
              due.map((row) => (
                <tr key={row.member.id} className="border-t border-slate-100 dark:border-slate-700/60">
                  <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">
                    {row.member.name}
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
                    {row.isDue ? '+' : row.isCredit ? '-' : ''}
                    {formatMoney(Math.abs(row.balance))}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-700 dark:text-slate-200">
                    {formatMoney(initialBazarTaka)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
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