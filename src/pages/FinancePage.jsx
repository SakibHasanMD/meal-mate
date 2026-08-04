import { useRef, useState } from 'react'
import Header, { PageContainer } from '../components/layout/Header'
import Button from '../components/common/Button'
import NumberInput from '../components/common/NumberInput'
import BazarExpenseList from '../components/finance/BazarExpenseList'
import BazarExpenseForm from '../components/finance/BazarExpenseForm'
import MonthlySummaryTable from '../components/finance/MonthlySummaryTable'
import NextMonthDueTable from '../components/finance/NextMonthDueTable'
import { useApp } from '../context/AppContext'
import { useBazarExpenses } from '../hooks/useBazarExpenses'
import { useMonthlySummary } from '../hooks/useMonthlySummary'
import { useContributions, useMonthSettings } from '../hooks/useContributions'
import { monthLabel } from '../utils/dateHelpers'
import { formatMoney, round2 } from '../utils/calculations'
import { exportMonthPdf } from '../utils/exportHelpers'

export default function FinancePage() {
  const { month, members, activeMembers } = useApp()
  const { expenses, addExpense, updateExpense, deleteExpense } = useBazarExpenses(month)
  const { setContribution } = useContributions(month)
  const { setInitialBazarTaka, bazarEqualsContributions, toggleBazarEqualsContributions } =
    useMonthSettings(month)

  const summary = useMonthlySummary(members, month)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [exporting, setExporting] = useState(false)

  const bazarRef = useRef(null)
  const summaryRef = useRef(null)
  const dueRef = useRef(null)

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (e) => {
    setEditing(e)
    setFormOpen(true)
  }
  const handleSave = async (data) => {
    if (editing) await updateExpense(editing.id, data)
    else await addExpense(data)
  }
  const handleDelete = async (e) => {
    if (confirm(`Delete expense of ${formatMoney(e.amount)} on ${e.date}?`)) {
      await deleteExpense(e.id)
    }
  }

  const handlePdf = async () => {
    setExporting(true)
    try {
      await exportMonthPdf(
        [
          { el: summaryRef.current, title: `Meal Calculation — ${monthLabel(month)}` },
          { el: dueRef.current, title: `Bazar Due — ${monthLabel(summary.nextMonth)}` },
        ],
        month,
      )
    } finally {
      setExporting(false)
    }
  }

  const nextInitial = summary.nextMonthSettings?.initialBazarTaka ?? 2000

  // Members included in this month (active and not excluded).
  const excludedMembers = summary.excludedMembers ?? []
  const includedMembers = activeMembers.filter(
    (m) => !excludedMembers.includes(m.id),
  )

  // Total contributions for the contributions footer.
  const totalContributions = includedMembers.reduce((sum, m) => {
    const row = summary.summary.find((r) => r.member.id === m.id)
    return sum + (row?.contribution ?? 0)
  }, 0)

  return (
    <>
      <Header
        title="Finance"
        subtitle={monthLabel(month)}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePdf}
              disabled={exporting}
            >
              {exporting ? 'Exporting…' : '📄 Export PDF'}
            </Button>
          </div>
        }
      />
      <PageContainer>
        {/* Quick totals strip — at the top */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Meals" value={summary.totals.totalMeals} />
          <StatCard
            label="Total Bazar"
            value={formatMoney(summary.totals.totalBazar)}
          />
          <StatCard
            label="Meal Rate"
            value={formatMoney(round2(summary.totals.mealRate))}
          />
          <StatCard label="Active Members" value={summary.totals.dashboard.activeMembers} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left: bazar expenses + contributions */}
          <div className="space-y-4">
            {/* Bazar expenses — hidden when bazarEqualsContributions is on */}
            {bazarEqualsContributions ? (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700">Bazar Total</h3>
                    <p className="text-xs text-slate-400">
                      Set to total contributions (auto)
                    </p>
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {formatMoney(summary.totals.totalBazar)}
                  </div>
                </div>
              </div>
            ) : (
              <BazarExpenseList
                ref={bazarRef}
                expenses={expenses}
                onAdd={openAdd}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            )}

            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">
                    Contributions — {monthLabel(month)}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Money each member deposited this month.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={bazarEqualsContributions}
                    onChange={toggleBazarEqualsContributions}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  Bazar = total contributions
                </label>
              </div>
              <div className="divide-y divide-slate-100">
                {includedMembers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">
                    No active members.
                  </div>
                ) : (
                  includedMembers.map((m) => {
                    const row = summary.summary.find((r) => r.member.id === m.id)
                    const contribution = row?.contribution ?? 0
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <div className="text-sm font-medium text-slate-700">
                          {m.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            {formatMoney(contribution)}
                          </span>
                          <div className="w-32">
                            <NumberInput
                              value={contribution}
                              onCommit={(v) => setContribution(m.id, v)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              {/* Total contributions footer */}
              <div className="flex items-center justify-between border-t-2 border-slate-200 bg-slate-50 px-4 py-2.5">
                <span className="text-xs font-bold uppercase text-slate-500">
                  Total Contributions
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {formatMoney(totalContributions)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: summary + due */}
          <div className="space-y-4">
            <MonthlySummaryTable
              ref={summaryRef}
              summary={summary.summary}
              mealRate={summary.totals.mealRate}
              month={month}
            />

            <NextMonthDueTable
              ref={dueRef}
              due={summary.due}
              month={month}
              nextMonth={summary.nextMonth}
              initialBazarTaka={nextInitial}
              onCommitInitialBazar={(v) => setInitialBazarTaka(v)}
            />
          </div>
        </div>
      </PageContainer>

      <BazarExpenseForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initial={editing}
      />
    </>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-0.5 text-lg font-bold text-slate-800">{value}</div>
    </div>
  )
}