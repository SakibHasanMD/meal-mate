import Button from '../common/Button'
import { prettyDate } from '../../utils/dateHelpers'
import { formatMoney } from '../../utils/calculations'
import { utilityTypeIcon, utilityTypeLabel } from '../../utils/utilityTypes'

/**
 * Monthly utility bills list. Additions only — every row is money the
 * house paid for a utility (electricity, water, gas, internet, ...).
 *
 * @param {Map} byName - name -> utility type lookup (for icon + label)
 */
export default function UtilityList({
  entries,
  monthTotal,
  memberCount,
  byName,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <div className="export-target rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            ⚡ Monthly Utilities
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {memberCount > 0
              ? `Split equally among ${memberCount} active member${memberCount > 1 ? 's' : ''}`
              : 'Additions only — no active members to split'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 dark:text-slate-500">
            This month
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {formatMoney(monthTotal)}
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No utility bills logged for this month.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-700/60">
              <tr className="text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Bill</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-right">Per Member</th>
                <th className="px-4 py-2">Note</th>
                <th className="export-hide px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const icon = utilityTypeIcon(byName, e.billType)
                const label = utilityTypeLabel(byName, e.billType)
                return (
                  <tr
                    key={e.id}
                    className="border-t border-slate-100 dark:border-slate-700/60"
                  >
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                      {prettyDate(e.date)}
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                        <span>{icon}</span>
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-slate-800 dark:text-slate-100">
                      {formatMoney(e.amount)}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">
                      {memberCount > 0
                        ? formatMoney((Number(e.amount) || 0) / memberCount)
                        : '—'}
                    </td>
                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                      {e.note || '—'}
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
          {entries.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-700/40">
                <td
                  colSpan={2}
                  className="px-4 py-2.5 text-xs font-bold uppercase text-slate-600 dark:text-slate-300"
                >
                  Total
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-800 dark:text-slate-100">
                  {formatMoney(monthTotal)}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-800 dark:text-slate-100">
                  {memberCount > 0 ? formatMoney(monthTotal / memberCount) : '—'}
                </td>
                <td className="px-4 py-2.5" />
                <td className="export-hide px-4 py-2.5" />
              </tr>
            </tfoot>
          )}
          </table>
        )}
      </div>

      <div className="export-hide border-t border-slate-200 p-3 dark:border-slate-700">
        <Button variant="primary" size="sm" onClick={onAdd}>
          + Add Bill
        </Button>
      </div>
    </div>
  )
}