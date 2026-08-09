import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'

const emptyForm = {
  name: '',
  phone: '',
  joinDate: new Date().toISOString().slice(0, 10),
  active: true,
  notes: '',
}

/**
 * Modal form for adding/editing a member.
 */
export default function MemberForm({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...emptyForm, ...initial } : emptyForm)
    }
  }, [open, initial])

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const submit = async (e) => {
    e?.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      await onSave(form)
      onClose?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Member' : 'Add Member'}
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
        <Field label="Name" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="input"
            required
            autoFocus
          />
        </Field>

        <Field label="Phone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Join Date">
          <input
            type="date"
            value={form.joinDate}
            onChange={(e) => set('joinDate', e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Active">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set('active', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-slate-600 dark:text-slate-300">
              {form.active ? 'Currently staying' : 'Left / inactive'}
            </span>
          </label>
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
            className="input"
          />
        </Field>
      </form>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid #cbd5e1;
          background: #fff;
          color: #1e293b;
          padding: 0.375rem 0.625rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: #22c55e;
          box-shadow: 0 0 0 1px #22c55e;
        }
        .dark .input {
          background: #1e293b;
          color: #e2e8f0;
          border-color: #475569;
        }
        .dark .input::placeholder {
          color: #64748b;
        }
      `}</style>
    </Modal>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}