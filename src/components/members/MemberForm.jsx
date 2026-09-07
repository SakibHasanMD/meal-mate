import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { MEMBER_STATUS, MEMBER_TYPE } from '../../hooks/useMembers'

const emptyForm = {
  name: '',
  phone: '',
  joinDate: new Date().toISOString().slice(0, 10),
  type: MEMBER_TYPE.MEMBER,
  status: MEMBER_STATUS.ACTIVE,
  notes: '',
}

const STATUS_OPTIONS = [
  { value: MEMBER_STATUS.ACTIVE, label: 'Active', hint: 'Living in the flat, included in calculations' },
  { value: MEMBER_STATUS.LEAVE, label: 'On Leave', hint: 'Still a resident but temporarily away' },
  { value: MEMBER_STATUS.LEFT, label: 'Left', hint: 'Moved out permanently — history is kept' },
]

const TYPE_OPTIONS = [
  { value: MEMBER_TYPE.MEMBER, label: 'Member', hint: 'Regular resident' },
  { value: MEMBER_TYPE.GUEST, label: 'Guest', hint: 'Staying for a while — same meals & finance as a member' },
]

/**
 * Modal form for adding/editing a member.
 * Includes Member Type (Member/Guest) and Status (Active/On Leave/Left).
 */
export default function MemberForm({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      const base = initial ? { ...emptyForm, ...initial } : emptyForm
      setForm({
        ...base,
        type: base.type === MEMBER_TYPE.GUEST ? MEMBER_TYPE.GUEST : MEMBER_TYPE.MEMBER,
        status: STATUS_OPTIONS.some((s) => s.value === base.status)
          ? base.status
          : MEMBER_STATUS.ACTIVE,
      })
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

        <Field label="Member Type">
          <PillGroup
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(v) => set('type', v)}
          />
        </Field>

        <Field label="Status">
          <PillGroup
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(v) => set('status', v)}
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

/** Radio-style pill selector with a small hint under each option. */
function PillGroup({ options, value, onChange }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-lg border px-3 py-2 text-left transition-colors ${
              active
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/40'
                : 'border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700'
            }`}
          >
            <span
              className={`block text-sm font-medium ${
                active
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {opt.label}
            </span>
            <span className="mt-0.5 block text-[11px] text-slate-400 dark:text-slate-500">
              {opt.hint}
            </span>
          </button>
        )
      })}
    </div>
  )
}