import { useRef, useState } from 'react'
import Header, { PageContainer } from '../components/layout/Header'
import Button from '../components/common/Button'
import NumberInput from '../components/common/NumberInput'
import BazarExpenseList from '../components/finance/BazarExpenseList'
import BazarExpenseForm from '../components/finance/BazarExpenseForm'
import MonthlySummaryTable from '../components/finance/MonthlySummaryTable'
import NextMonthDueTable from '../components/finance/NextMonthDueTable'
import InitialBazarTakaSetting from '../components/finance/InitialBazarTakaSetting'
import { useApp } from '../context/AppContext'
import { useBazarExpenses } from '../hooks/useBazarExpenses'
import { useMonthlySummary } from '../hooks/useMonthlySummary'
import { useContributions, useMonthSettings } from '../hooks/useContributions'
import { monthLabel } from '../utils/dateHelpers'
import { formatMoney, round2 } from '../utils/calculations'
import { exportScreenshot, exportMonthPdf } from '../utils/exportHelpers'

export default function FinancePage() {
  const { month, members, activeMembers } = useApp()
  const { expenses, addExpense, updateExpense, deleteExpense } = useBazarExpenses(month)
  const { setContribution } = useContributions(month)
  const { setInitialBazarTaka } = useMonthSettings(month)

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

  const handleScreenshot = async (ref, name) => {
    setExporting(true)
    try {
      await exportScreenshot(ref.current, `${name}_${month}.png`)
    } finally {
      setExporting(false)
    }
  }

  const handlePdf = async () => {
    setExporting(true)
    try {
      await exportMonthPdf(
        [
          { el: summaryRef.current, title: `Monthly Summary — ${monthLabel(month)}` },
          { el: dueRef.current, title: `Next Month Due — ${monthLabel(summary.nextMonth)}` },
        ],
        month,
      )
    } finally {
      setExporting(false)
    }
  }

  const nextInitial = summary.nextMonthSettings?.initialBazarTaka ?? 2000

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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left: bazar expenses + contributions */}
          <div className="space-y-4">
            <BazarExpenseList
              ref={bazarRef}
              expenses={expenses}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={handleDelete}
            />

            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  Contributions — {monthLabel(month)}
                </h3>
                <p className="text-xs text-slate-400">
                  Money each member deposited this month.
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {activeMembers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">
                    No active members.
                  </div>
                ) : (
                  activeMembers.map((m) => {
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
            </div>
          </div>

          {/* Right: summary + due */}
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Summary</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleScreenshot(summaryRef, 'Summary')}
                  disabled={exporting}
                >
                  📸
                </Button>
              </div>
              <MonthlySummaryTable
                ref={summaryRef}
                summary={summary.summary}
                mealRate={summary.totals.mealRate}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Next Month</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleScreenshot(dueRef, 'NextMonthDue')}
                  disabled={exporting}
                >
                  📸
                </Button>
              </div>
              <InitialBazarTakaSetting
                nextMonth={summary.nextMonth}
                initialBazarTaka={nextInitial}
                onCommit={(v) => setInitialBazarTaka(v)}
              />
              <div className="mt-2">
                <NextMonthDueTable
                  ref={dueRef}
                  due={summary.due}
                  nextMonth={summary.nextMonth}
                  initialBazarTaka={nextInitial}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick totals strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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