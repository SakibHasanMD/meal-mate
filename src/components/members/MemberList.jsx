import Button from '../common/Button'
import { prettyDate } from '../../utils/dateHelpers'
import { MEMBER_STATUS, MEMBER_TYPE } from '../../hooks/useMembers'

const STATUS_STYLES = {
  [MEMBER_STATUS.ACTIVE]:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  [MEMBER_STATUS.LEAVE]:
    'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  [MEMBER_STATUS.LEFT]:
    'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
}

const STATUS_LABELS = {
  [MEMBER_STATUS.ACTIVE]: 'Active',
  [MEMBER_STATUS.LEAVE]: 'On Leave',
  [MEMBER_STATUS.LEFT]: 'Left',
}

/**
 * Table of members. Sorted by the provider (active → on leave → left).
 * One row per member with status-appropriate actions:
 *   Active  → "On Leave", "Mark Left", Delete
 *   On Leave → "Active", "Mark Left", Delete
 *   Left    → "Back to Active", Delete
 */
export default function MemberList({ members, onEdit, onSetStatus, onDelete }) {
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
            <th className="px-4 py-2.5">Type</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Phone</th>
            <th className="px-4 py-2.5">Join Date</th>
            <th className="px-4 py-2.5">Notes</th>
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700/60">
              <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">{m.name}</td>
              <td className="px-4 py-2.5">
                {m.type === MEMBER_TYPE.GUEST ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">
                    Guest
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                    Member
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_STYLES[m.status] || STATUS_STYLES[MEMBER_STATUS.ACTIVE]
                  }`}
                >
                  {STATUS_LABELS[m.status] || 'Active'}
                </span>
              </td>
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{m.phone || '—'}</td>
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                {m.joinDate ? prettyDate(m.joinDate) : '—'}
              </td>
              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{m.notes || '—'}</td>
              <td className="px-4 py-2.5">
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => onEdit(m)}>
                    Edit
                  </Button>

                  {m.status === MEMBER_STATUS.LEFT ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => onSetStatus(m, MEMBER_STATUS.ACTIVE)}
                      title="Bring this member back as active"
                    >
                      Back to Active
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant={m.status === MEMBER_STATUS.ACTIVE ? 'ghost' : 'success'}
                        onClick={() =>
                          onSetStatus(
                            m,
                            m.status === MEMBER_STATUS.ACTIVE
                              ? MEMBER_STATUS.LEAVE
                              : MEMBER_STATUS.ACTIVE,
                          )
                        }
                        title={
                          m.status === MEMBER_STATUS.ACTIVE
                            ? 'Temporarily away (kept out of calculations)'
                            : 'Back in the flat, included in calculations'
                        }
                      >
                        {m.status === MEMBER_STATUS.ACTIVE ? 'On Leave' : 'Active'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSetStatus(m, MEMBER_STATUS.LEFT)}
                        title="Permanently moved out — history is kept"
                      >
                        Mark Left
                      </Button>
                    </>
                  )}

                  <Button size="sm" variant="danger" onClick={() => onDelete(m)}>
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
        <strong>Active</strong> + <strong>On Leave</strong> = living in the flat ·{' '}
        <strong>Left</strong> = moved out (history kept) · <strong>Delete</strong> erases the member
        and all their records permanently.
      </div>
    </div>
  )
}