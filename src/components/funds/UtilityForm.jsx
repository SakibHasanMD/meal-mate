import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { UTILITY_TYPES, UTILITY_TYPE_KEYS } from '../../hooks/useUtilities'

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  billType: 'electricity',
  amount: '',
  note: '',
}

/**
 * Modal form for adding/editing a utility bill entry.
 * Amounts are additions only — there is no way to subtract.
 */
export default function UtilityForm({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              date: initial.date || emptyForm.date,
              billType: UTILITY_TYPE_KEYS.includes(initial.billType)
                ? initial.billType
                : 'other',
              amount: initial.amount != null ? String(initial.amount) : '',
              note: initial.note || '',
            }
          : emptyForm,
      )
    }
  }, [open, initial])

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const submit = async (e) => {
    e?.preventDefault()
    if (!form.date || !form.amount) return
    setLoading(true)
    try {
      await onSave({
        date: form.date,
        billType: form.billType,
        amount: Number(form.amount) || 0,
        note: form.note,
      })
      onClose?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Utility Bill' : 'Add Utility Bill'}
      footer={
        <Modal.Footer
          onCancel={onClose}
          onConfirm={submit}
          loading={loading}
          confirmText={initial ? 'Update' : 'Add'}
        />
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Bill Type
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {UTILITY_TYPE_KEYS.map((key) => {
              const t = UTILITY_TYPES[key]
              const active = form.billType === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('billType', key)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                      : 'border-slate-300 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="mr-1">{t.icon}</span>
                  {t.label}
                </button>
              )
            })}
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Date
          </span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Amount (৳)
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            required
            autoFocus
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Note
          </span>
          <input
            type="text"
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            placeholder="e.g. DESCO bill, WASA, cylinder refill"
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
      </form>
    </Modal>
  )
}
