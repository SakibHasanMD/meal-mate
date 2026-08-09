import Button from '../common/Button'
import { prettyDate } from '../../utils/dateHelpers'

/**
 * Table of members with edit / activate-deactivate actions.
 */
export default function MemberList({ members, onEdit, onToggleActive, onDelete }) {
  if (!members.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500">
        No members yet. Add your first member to get started.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-700/60 dark:text-slate-400">
            <th className="px-4 py-2.5">Name</th>
            <th className="px-4 py-2.5">Phone</th>
            <th className="px-4 py-2.5">Join Date</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Notes</th>
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700/60">
              <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">{m.name}</td>
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{m.phone || '—'}</td>
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                {m.joinDate ? prettyDate(m.joinDate) : '—'}
              </td>
              <td className="px-4 py-2.5">
                {m.active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                    Inactive
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{m.notes || '—'}</td>
              <td className="px-4 py-2.5">
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => onEdit(m)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={m.active ? 'ghost' : 'success'}
                    onClick={() => onToggleActive(m)}
                  >
                    {m.active ? 'Deactivate' : 'Reactivate'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => onDelete(m)}>
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}