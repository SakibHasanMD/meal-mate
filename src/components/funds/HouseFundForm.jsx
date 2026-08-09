import { useState, useEffect } from 'react'
import Modal from '../common/Modal'

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  type: 'deposit',
  amount: '',
  note: '',
}

/**
 * Modal form for adding/editing a house fund entry.
 * Type: deposit (money in) or spending (money out).
 */
export default function HouseFundForm({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              date: initial.date || emptyForm.date,
              type: initial.type === 'expense' ? 'expense' : 'deposit',
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
        type: form.type,
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
      title={initial ? 'Edit House Fund Entry' : 'Add House Fund Entry'}
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
            Type
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => set('type', 'deposit')}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                form.type === 'deposit'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'border-slate-300 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              + Deposit
            </button>
            <button
              type="button"
              onClick={() => set('type', 'expense')}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                form.type === 'expense'
                  ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                  : 'border-slate-300 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              − Spending
            </button>
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
            placeholder="e.g. rent, wifi, cleaning supplies"
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
      </form>
    </Modal>
  )
}
