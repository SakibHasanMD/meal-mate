import { useState } from 'react'
import Header, { PageContainer } from '../components/layout/Header'
import Button from '../components/common/Button'
import UtilityList from '../components/funds/UtilityList'
import UtilityForm from '../components/funds/UtilityForm'
import UtilityTypeManager from '../components/funds/UtilityTypeManager'
import { useApp } from '../context/AppContext'
import { useUtilities } from '../hooks/useUtilities'
import { useUtilityTypes } from '../hooks/useUtilityTypes'
import { monthLabel } from '../utils/dateHelpers'
import { formatMoney } from '../utils/calculations'

/**
 * Monthly Utilities page — utility bills for the selected month.
 * Bill types come from the `utilityTypes` table: six fixed defaults plus any
 * custom types the user creates in "Manage Types" (each with its own icon).
 */
export default function UtilitiesPage() {
  const { month, activeMembers } = useApp()
  const utils = useUtilities(month)
  const { types, byName } = useUtilityTypes()

  // Utility costs are split equally among all active members.
  const memberCount = activeMembers.length
  const perMemberTotal = memberCount > 0 ? utils.monthTotal / memberCount : 0

  const [form, setForm] = useState({ open: false, editing: null })
  const [managerOpen, setManagerOpen] = useState(false)

  const openAdd = () => setForm({ open: true, editing: null })
  const openEdit = (e) => setForm({ open: true, editing: e })
  const closeForm = () => setForm({ open: false, editing: null })

  const save = async (data) => {
    if (form.editing) await utils.updateEntry(form.editing.id, data)
    else await utils.addEntry(data)
  }

  const remove = async (e) => {
    if (confirm(`Delete utility bill of ${formatMoney(e.amount)} on ${e.date}?`)) {
      await utils.deleteEntry(e.id)
    }
  }

  return (
    <>
      <Header
        title="Utilities"
        subtitle={monthLabel(month)}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setManagerOpen(true)}>
              🗂️ Manage Bill Types
            </Button>
            <Button variant="primary" onClick={openAdd}>
              + Add Bill
            </Button>
          </div>
        }
      />
      <PageContainer>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <StatCard
            label="Per Member"
            value={formatMoney(perMemberTotal)}
            tone="brand"
            note={
              memberCount > 0
                ? `÷ ${memberCount} active member${memberCount > 1 ? 's' : ''}`
                : 'no active members'
            }
          />
          <StatCard label="Total" value={formatMoney(utils.monthTotal)} tone="slate" />
          {types.map((t) => (
            <StatCard
              key={t.id}
              label={`${t.icon} ${t.name}`}
              value={formatMoney(utils.totalsByType[t.name] || 0)}
              tone="slate"
              muted={!utils.totalsByType[t.name]}
            />
          ))}
        </div>

        <UtilityList
          entries={utils.entries}
          monthTotal={utils.monthTotal}
          memberCount={memberCount}
          byName={byName}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={remove}
        />
      </PageContainer>

      <UtilityForm
        open={form.open}
        onClose={closeForm}
        onSave={save}
        initial={form.editing}
        types={types}
      />

      <UtilityTypeManager open={managerOpen} onClose={() => setManagerOpen(false)} />
    </>
  )
}

const tones = {
  brand: 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-900/30 dark:text-brand-300',
  slate:
    'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
}

function StatCard({ label, value, tone = 'slate', muted, note }) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${tones[tone] || tones.slate} ${
        muted ? 'opacity-60' : ''
      }`}
    >
      <div className="truncate text-xs font-medium opacity-80">{label}</div>
      <div className="mt-0.5 truncate text-lg font-bold">{value}</div>
      {note && <div className="mt-0.5 truncate text-[10px] opacity-70">{note}</div>}
    </div>
  )
}