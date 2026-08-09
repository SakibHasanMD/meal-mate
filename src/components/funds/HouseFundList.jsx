import { useMemo } from 'react'
import Button from '../common/Button'
import { prettyDate } from '../../utils/dateHelpers'
import { formatMoney } from '../../utils/calculations'

/**
 * All-time house fund ledger.
 * Newest entries first; each row shows the running balance at that point
 * (oldest → newest accumulation, displayed against its entry date).
 */
export default function HouseFundList({ entries, onAdd, onEdit, onDelete }) {
  // running balance per entry id, computed oldest → newest.
  const balances = useMemo(() => {
    const map = new Map()
    const sorted = [...entries].sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id,
    )
    let running = 0
    for (const e of sorted) {
      running +=
        e.type === 'deposit'
          ? Number(e.amount) || 0
          : -(Number(e.amount) || 0)
      map.set(e.id, running)
    }
    return map
  }, [entries])

  return (
    <div className="export-target rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            🏠 House Fund
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Permanent ledger — every deposit &amp; spending, all months
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 dark:text-slate-500">
            {entries.length} entries
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No house fund entries yet. Add your first deposit or spending.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-700/60">
              <tr className="text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2">Note</th>
                <th className="px-4 py-2 text-right">Balance</th>
                <th className="export-hide px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const isDeposit = e.type === 'deposit'
                const bal = balances.get(e.id) ?? 0
                return (
                  <tr
                    key={e.id}
                    className="border-t border-slate-100 dark:border-slate-700/60"
                  >
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                      {prettyDate(e.date)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          isDeposit
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                        }`}
                      >
                        {isDeposit ? 'Deposit' : 'Spending'}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        isDeposit
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isDeposit ? '+' : '−'}
                      {formatMoney(e.amount)}
                    </td>
                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                      {e.note || '—'}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-semibold ${
                        bal < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {formatMoney(bal)}
                    </td>
                    <td className="export-hide px-4 py-2">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onEdit(e)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onDelete(e)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="export-hide border-t border-slate-200 p-3 dark:border-slate-700">
        <Button variant="primary" size="sm" onClick={onAdd}>
          + Add Entry
        </Button>
      </div>
    </div>
  )
}
