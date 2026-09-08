import { useRef, useState, useEffect } from 'react'
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
import { db } from '../db/db'

export default function FinancePage() {
  const { month, members, activeMembers } = useApp()
  const { expenses, addExpense, updateExpense, deleteExpense } = useBazarExpenses(month)
  const { setContribution } = useContributions(month)
  const { bazarEqualsContributions, toggleBazarEqualsContributions } =
    useMonthSettings(month)

  const summary = useMonthlySummary(members, month)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [skipNextMonth, setSkipNextMonth] = useState(new Set())
  const [customStarting, setCustomStarting] = useState({})

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

  const nextInitial = summary.nextMonthSettings?.initialBazarTaka ?? 2000

  // Handler to update next month's default starting contribution
  const handleSetInitialBazar = async (value) => {
    const num = Number(value) || 0
    const nextMonthKey = summary.nextMonth
    const preservedSkippedStarting = {}
    skipNextMonth.forEach((memberId) => {
      preservedSkippedStarting[memberId] = customStarting[memberId] ?? nextInitial
    })
    setCustomStarting(preservedSkippedStarting)
    const existing = await db.monthSettings.get(nextMonthKey)
    if (existing) {
      await db.monthSettings.update(nextMonthKey, {
        initialBazarTaka: num,
        customStarting: preservedSkippedStarting,
      })
    } else {
      await db.monthSettings.put({
        month: nextMonthKey,
        initialBazarTaka: num,
        customStarting: preservedSkippedStarting,
      })
    }
  }

  // Load Skip Next Month and Custom Starting settings
  useEffect(() => {
    const loadSettings = async () => {
      const nextMonthSettings = summary.nextMonthSettings
      if (nextMonthSettings?.skipNextMonth) {
        setSkipNextMonth(new Set(nextMonthSettings.skipNextMonth))
      } else {
        setSkipNextMonth(new Set())
      }
      if (nextMonthSettings?.customStarting) {
        setCustomStarting(nextMonthSettings.customStarting)
      } else {
        setCustomStarting({})
      }
    }
    loadSettings()
  }, [summary.nextMonth, summary.nextMonthSettings])

  const handleToggleSkip = async (memberId) => {
    const newSkip = new Set(skipNextMonth)
    if (newSkip.has(memberId)) {
      newSkip.delete(memberId)
    } else {
      newSkip.add(memberId)
    }
    setSkipNextMonth(newSkip)
    
    // Save to database
    const nextMonthKey = summary.nextMonth
    const existing = await db.monthSettings.get(nextMonthKey)
    if (existing) {
      await db.monthSettings.update(nextMonthKey, {
        skipNextMonth: Array.from(newSkip),
      })
    } else {
      await db.monthSettings.put({
        month: nextMonthKey,
        initialBazarTaka: nextInitial,
        skipNextMonth: Array.from(newSkip),
      })
    }
  }

  const handleCustomStarting = async (memberId, amount) => {
    const newCustom = { ...customStarting }
    if (amount === nextInitial) {
      // If set to default, remove custom override
      delete newCustom[memberId]
    } else {
      newCustom[memberId] = amount
    }
    setCustomStarting(newCustom)
    
    // Save to database
    const nextMonthKey = summary.nextMonth
    const existing = await db.monthSettings.get(nextMonthKey)
    if (existing) {
      await db.monthSettings.update(nextMonthKey, {
        customStarting: newCustom,
      })
    } else {
      await db.monthSettings.put({
        month: nextMonthKey,
        initialBazarTaka: nextInitial,
        customStarting: newCustom,
      })
    }
  }

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
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bazar Total</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Set to total contributions (auto)
                    </p>
                  </div>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
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

            <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Contributions — {monthLabel(month)}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Money each member deposited this month.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={bazarEqualsContributions}
                    onChange={toggleBazarEqualsContributions}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  Bazar = total contributions
                </label>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {includedMembers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">
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
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {m.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 dark:text-slate-500">
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
              <div className="flex items-center justify-between border-t-2 border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-700/40">
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Total Contributions
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
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
              onCommitInitialBazar={handleSetInitialBazar}
              skipNextMonth={skipNextMonth}
              onToggleSkip={handleToggleSkip}
              customStarting={customStarting}
              onCommitCustomStarting={handleCustomStarting}
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
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="text-xs text-slate-400 dark:text-slate-500">{label}</div>
      <div className="mt-0.5 text-lg font-bold text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  )
}