import { forwardRef } from 'react'
import Button from '../common/Button'
import { prettyDate } from '../../utils/dateHelpers'
import { formatMoney, totalBazar } from '../../utils/calculations'

/**
 * List of bazar expenses for the month with a running total at the top.
 * Add/edit/delete via the parent handlers.
 * Forwards a ref for export capture.
 */
const BazarExpenseList = forwardRef(function BazarExpenseList(
  { expenses, onAdd, onEdit, onDelete },
  ref,
) {
  const total = totalBazar(expenses)

  return (
    <div ref={ref} className="export-target rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bazar Expenses</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">{expenses.length} entries this month</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 dark:text-slate-500">Total</div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatMoney(total)}</div>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {expenses.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400 dark:text-slate-500">
            No expenses logged yet.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-700/60">
              <tr className="text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2">Note</th>
                <th className="export-hide px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t border-slate-100 dark:border-slate-700/60">
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{prettyDate(e.date)}</td>
                  <td className="px-4 py-2 text-right font-medium text-slate-800 dark:text-slate-100">
                    {formatMoney(e.amount)}
                  </td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{e.note || '—'}</td>
                  <td className="export-hide px-4 py-2">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => onEdit(e)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => onDelete(e)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="export-hide border-t border-slate-200 p-3 dark:border-slate-700">
        <Button variant="primary" size="sm" onClick={onAdd}>
          + Add Expense
        </Button>
      </div>
    </div>
  )
})

export default BazarExpenseList