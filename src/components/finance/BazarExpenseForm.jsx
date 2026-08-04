import { useState, useEffect } from 'react'
import Modal from '../common/Modal'

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  amount: '',
  note: '',
}

/**
 * Modal form for adding/editing a bazar expense entry.
 */
export default function BazarExpenseForm({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              date: initial.date || emptyForm.date,
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
      title={initial ? 'Edit Expense' : 'Add Expense'}
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
          <span className="mb-1 block text-xs font-medium text-slate-600">Date</span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Amount (৳)
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            required
            autoFocus
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Note</span>
          <input
            type="text"
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            placeholder="e.g. rice + vegetables"
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
      </form>
    </Modal>
  )
}