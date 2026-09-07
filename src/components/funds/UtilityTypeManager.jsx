import { useState } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { PRESET_UTILITY_ICONS } from '../../utils/utilityTypes'
import { useUtilityTypes } from '../../hooks/useUtilityTypes'

/**
 * "Manage Types" dialog for utility bills.
 *
 * Shows the predefined default types (Electricity, Water, Gas, Internet,
 * Trash, Other — non-removable) and any custom types the user created, with
 * a small form to add new ones: a name plus one of the preset icons. The
 * chosen icon is displayed alongside the type name everywhere in the app.
 *
 * Deleting a custom type does not touch existing bills — they keep their
 * name and render with a generic icon.
 */
export default function UtilityTypeManager({ open, onClose }) {
  const { types, addType, deleteType } = useUtilityTypes()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(PRESET_UTILITY_ICONS[0])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('') // '' | 'adding' | id being deleted

  const submit = async (e) => {
    e?.preventDefault()
    if (!name.trim()) return
    setBusy('adding')
    setError('')
    try {
      await addType({ name, icon })
      setName('')
      // Keep the selected icon for the next type but reset to a sane default.
      setIcon(PRESET_UTILITY_ICONS[0])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const remove = async (id, typeName) => {
    if (
      !confirm(
        `Delete the "${typeName}" type? Existing bills of this type will stay, showing a generic icon.`,
      )
    ) {
      return
    }
    setBusy(String(id))
    setError('')
    try {
      await deleteType(id)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage Utility Bill Types"
      footer={
        <Button variant="secondary" onClick={onClose} type="button">
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Add form */}
        <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
          <div>
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              New type name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cable TV, Security, Cleaning…"
              maxLength={40}
              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Pick an icon
            </span>
            <div className="grid grid-cols-8 gap-1 sm:grid-cols-12">
              {PRESET_UTILITY_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  title={ic}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-base transition-colors ${
                    icon === ic
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/40'
                      : 'border-slate-200 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700'
                  }`}
                  aria-pressed={icon === ic}
                  aria-label={`Icon ${ic}`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}

          <Button variant="primary" size="sm" type="submit" disabled={busy !== '' || !name.trim()}>
            {busy === 'adding' ? 'Adding…' : '+ Add Type'}
          </Button>
        </form>

        {/* Type list */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              All types ({types.length})
            </span>
          </div>
          {types.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-600 dark:text-slate-500">
              No types yet — add one above.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-700/60 dark:border-slate-700">
              {types.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between bg-white px-3 py-2 dark:bg-slate-800"
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <span className="text-base">{t.icon}</span>
                    <span className="truncate font-medium">{t.name}</span>
                    {t.isDefault && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                        Default
                      </span>
                    )}
                  </span>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={t.isDefault || busy !== ''}
                    onClick={() => remove(t.id, t.name)}
                    title={
                      t.isDefault
                        ? 'Default types cannot be removed'
                        : 'Delete this custom type'
                    }
                  >
                    {busy === String(t.id) ? '…' : 'Delete'}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
            The six default types are fixed and cannot be removed. Deleting a
            custom type keeps existing bills — they just show a generic icon.
          </p>
        </div>
      </div>
    </Modal>
  )
}