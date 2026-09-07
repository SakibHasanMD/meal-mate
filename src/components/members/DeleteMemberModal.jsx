import Modal from '../common/Modal'
import Button from '../common/Button'

/**
 * Confirmation dialog for PERMANENTLY deleting a member.
 *
 * Deleting erases the member AND all their associated records (meal entries,
 * contributions, month exclusions). This is different from marking them
 * "Left", which keeps all history. Because it is destructive and irreversible,
 * it requires an explicit confirmation here — not a one-click action.
 */
export default function DeleteMemberModal({
  member,
  mealEntryCount,
  contributionCount,
  open,
  onClose,
  onConfirm,
  busy,
}) {
  if (!member) return null

  const recordCount = (mealEntryCount || 0) + (contributionCount || 0)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete member permanently?"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy} type="button">
            {busy ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <p>
          You are about to <strong className="text-red-600 dark:text-red-400">permanently delete</strong>{' '}
          <strong>{member.name}</strong> and everything associated with them.
        </p>

        <ul className="space-y-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          <li>• {recordCount} meal or contribution record{recordCount === 1 ? '' : 's'} will be erased
            ({mealEntryCount || 0} meal{mealEntryCount === 1 ? '' : 's'}, {contributionCount || 0} contribution{contributionCount === 1 ? '' : 's'}).</li>
          <li>• Historical monthly calculations will change (their meals/funds disappear).</li>
          <li>• This cannot be undone.</li>
        </ul>

        <p>
          If the person simply moved out, use{' '}
          <strong>Mark as Left</strong> instead — that keeps all their history
          intact.
        </p>
      </div>
    </Modal>
  )
}