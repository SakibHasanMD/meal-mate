import { useState } from 'react'
import Header, { PageContainer } from '../components/layout/Header'
import Button from '../components/common/Button'
import HouseFundList from '../components/funds/HouseFundList'
import HouseFundForm from '../components/funds/HouseFundForm'
import { useHouseFunds } from '../hooks/useHouseFunds'
import { formatMoney } from '../utils/calculations'

/**
 * House Fund page — a permanent all-time ledger of deposits (+) and
 * spending (−), NOT tied to the selected month.
 */
export default function HouseFundPage() {
  const fund = useHouseFunds()

  const [form, setForm] = useState({ open: false, editing: null })

  const openAdd = () => setForm({ open: true, editing: null })
  const openEdit = (e) => setForm({ open: true, editing: e })
  const closeForm = () => setForm({ open: false, editing: null })

  const save = async (data) => {
    if (form.editing) await fund.updateEntry(form.editing.id, data)
    else await fund.addEntry(data)
  }

  const remove = async (e) => {
    const label = `${e.type === 'deposit' ? 'deposit of' : 'spending of'} ${formatMoney(e.amount)} on ${e.date}`
    if (confirm(`Delete house fund ${label}?`)) {
      await fund.deleteEntry(e.id)
    }
  }

  return (
    <>
      <Header
        title="House Fund"
        subtitle="Permanent ledger — deposits & spending, all months"
        actions={
          <Button variant="primary" onClick={openAdd}>
            + Add Entry
          </Button>
        }
      />
      <PageContainer>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Balance"
            value={formatMoney(fund.balance)}
            tone={fund.balance < 0 ? 'red' : 'emerald'}
          />
          <StatCard
            label="Total Deposits"
            value={formatMoney(fund.totalDeposits)}
            tone="amber"
          />
          <StatCard
            label="Total Spending"
            value={formatMoney(fund.totalExpenses)}
            tone="red"
          />
        </div>

        <HouseFundList
          entries={fund.entries}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={remove}
        />
      </PageContainer>

      <HouseFundForm
        open={form.open}
        onClose={closeForm}
        onSave={save}
        initial={form.editing}
      />
    </>
  )
}

const tones = {
  emerald:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
  red: 'border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-900/30 dark:text-red-300',
  amber:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
}

function StatCard({ label, value, tone = 'emerald' }) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${tones[tone] || tones.emerald}`}
    >
      <div className="truncate text-xs font-medium opacity-80">{label}</div>
      <div className="mt-0.5 truncate text-lg font-bold">{value}</div>
    </div>
  )
}
