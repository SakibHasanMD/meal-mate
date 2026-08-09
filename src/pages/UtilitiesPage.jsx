import { useState } from 'react'
import Header, { PageContainer } from '../components/layout/Header'
import Button from '../components/common/Button'
import UtilityList from '../components/funds/UtilityList'
import UtilityForm from '../components/funds/UtilityForm'
import { useApp } from '../context/AppContext'
import { useUtilities, UTILITY_TYPES } from '../hooks/useUtilities'
import { monthLabel } from '../utils/dateHelpers'
import { formatMoney } from '../utils/calculations'

/**
 * Monthly Utilities page — utility bills for the selected month
 * (electricity, water, gas, internet, ...). Additions only.
 */
export default function UtilitiesPage() {
  const { month, activeMembers } = useApp()
  const utils = useUtilities(month)

  // Utility costs are split equally among all active members.
  const memberCount = activeMembers.length
  const perMemberTotal = memberCount > 0 ? utils.monthTotal / memberCount : 0

  const [form, setForm] = useState({ open: false, editing: null })

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
          <Button variant="primary" size="sm" onClick={openAdd}>
            + Add Bill
          </Button>
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
          {Object.keys(UTILITY_TYPES).map((key) => (
            <StatCard
              key={key}
              label={`${UTILITY_TYPES[key].icon} ${UTILITY_TYPES[key].label}`}
              value={formatMoney(utils.totalsByType[key] || 0)}
              tone="slate"
              muted={!utils.totalsByType[key]}
            />
          ))}
        </div>

        <UtilityList
          entries={utils.entries}
          monthTotal={utils.monthTotal}
          memberCount={memberCount}
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
      />
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
