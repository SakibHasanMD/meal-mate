import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header, { PageContainer } from '../components/layout/Header'
import Button from '../components/common/Button'
import MealChartGrid from '../components/mealchart/MealChartGrid'
import CombinedMealBazaarTable from '../components/finance/CombinedMealBazaarTable'
import { useApp } from '../context/AppContext'
import { useMonthlySummary } from '../hooks/useMonthlySummary'
import { useMealChart } from '../hooks/useMealChart'
import { useMonthSettings } from '../hooks/useContributions'
import { useUtilities } from '../hooks/useUtilities'
import { useHouseFunds } from '../hooks/useHouseFunds'
import { useUtilityTypes } from '../hooks/useUtilityTypes'
import { monthLabel } from '../utils/dateHelpers'
import { formatMoney, round2 } from '../utils/calculations'
import { exportMonthlyReport } from '../utils/reportHelpers'
import { db } from '../db/db'

/**
 * Overview page (formerly Dashboard).
 *
 * - At-a-glance monthly stats.
 * - Hidden chart surface used only for the monthly-report PDF — it's
 *   absolutely positioned off-screen so the user never sees it, but
 *   html2canvas can still walk and capture it. The chart reuses the
 *   same MealChartGrid component the Meal Chart page uses, so the
 *   report stays consistent with the live UI.
 */
export default function OverviewPage() {
  const { month, members, activeMembers } = useApp()
  const summary = useMonthlySummary(members, month)
  const utils = useUtilities(month)
  const fund = useHouseFunds()
  const { byName } = useUtilityTypes()
  const { entries, toggleMeal, adjustMealCount } = useMealChart(month)
  const { settings, excludedMembers } = useMonthSettings(month)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [skipNextMonth, setSkipNextMonth] = useState(new Set())
  const [customStarting, setCustomStarting] = useState({})

  const memberCount = activeMembers.length
  const perMemberUtility = memberCount > 0 ? utils.monthTotal / memberCount : 0

  const totals = summary.totals

  // Members included in this month (active and not excluded).
  const includedMembers = activeMembers.filter(
    (m) => !excludedMembers.includes(m.id),
  )

  const chartRef = useRef(null)

  // Load Skip Next Month settings
  useEffect(() => {
    const loadSkipSettings = async () => {
      const nextMonthSettings = summary.nextMonthSettings
      if (nextMonthSettings?.skipNextMonth) {
        setSkipNextMonth(new Set(nextMonthSettings.skipNextMonth))
      }
    }
    loadSkipSettings()
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
    await db.monthSettings.update(summary.nextMonth, {
      skipNextMonth: Array.from(newSkip),
    })
  }

  const handleCustomStarting = async (memberId, amount) => {
    const newCustom = { ...customStarting }
    if (amount === summary.nextMonthSettings?.initialBazarTaka) {
      // If set to default, remove custom override
      delete newCustom[memberId]
    } else {
      newCustom[memberId] = amount
    }
    setCustomStarting(newCustom)
    
    // Save to database
    await db.monthSettings.update(summary.nextMonth, {
      customStarting: newCustom,
    })
  }

  const nextInitial = summary.nextMonthSettings?.initialBazarTaka ?? 2000

  const handleReport = async () => {
    if (exporting) return
    setExporting(true)
    setExportError('')
    try {
      await exportMonthlyReport({
        monthKey: month,
        activeMembers,
        totalMeals: totals.totalMeals,
        mealRate: totals.mealRate,
        perMemberUtility,
        utilities: { entries: utils.entries, monthTotal: utils.monthTotal },
        byName,
        mealChartEl: chartRef.current,
        summary: summary.summary,
        due: summary.due,
        nextMonth: summary.nextMonth,
        nextMonthSettings: summary.nextMonthSettings,
        includedMembers,
        skipNextMonth,
      })
    } catch (err) {
      setExportError(err?.message || 'Failed to generate report.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Header
        title="Overview"
        subtitle={monthLabel(month)}
        actions={
          <Button
            variant="primary"
            onClick={handleReport}
            disabled={exporting}
            title="Generate a clean one-file monthly report (summary, utilities, meal chart, calculation, bazaar due)"
          >
            {exporting ? 'Exporting…' : '📄 Export Monthly Report PDF'}
          </Button>
        }
      />
      <PageContainer>
        {exportError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            {exportError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="Total Meals"
            value={totals.totalMeals}
            tone="brand"
            to="/meal-chart"
          />
          <StatCard
            label="Total Bazar"
            value={formatMoney(totals.totalBazar)}
            tone="amber"
            to="/finance"
          />
          <StatCard
            label="Meal Rate"
            value={formatMoney(round2(totals.mealRate))}
            tone="slate"
            to="/finance"
          />
          <StatCard
            label="Active Members"
            value={totals.dashboard.activeMembers}
            tone="emerald"
            to="/members"
          />
          <StatCard
            label="Utilities This Month"
            value={formatMoney(utils.monthTotal)}
            tone="indigo"
            to="/utilities"
          />
          <StatCard
            label="Utilities Per Member"
            value={formatMoney(perMemberUtility)}
            tone="violet"
            to="/utilities"
          />
          <StatCard
            label="House Fund Balance"
            value={formatMoney(fund.balance)}
            tone={fund.balance < 0 ? 'red' : 'teal'}
            to="/house-fund"
          />
        </div>

        {/* Combined Meal Calculation + Bazaar Due Table */}
        <div className="mt-6">
          <CombinedMealBazaarTable
            summary={summary.summary}
            month={month}
            nextMonth={summary.nextMonth}
            initialBazarTaka={nextInitial}
            skipNextMonth={skipNextMonth}
            customStarting={customStarting}
          />
        </div>

        {/*
          Off-screen chart surface used only for the PDF capture.
          Visually hidden but in the DOM and laid out, so html2canvas
          can render it exactly as the Meal Chart page shows it.
        */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: '-10000px',
            width: 'max-content',
            pointerEvents: 'none',
          }}
        >
          <MealChartGrid
            ref={chartRef}
            monthKey={month}
            members={includedMembers}
            entries={entries}
            onToggle={toggleMeal}
            onAdjust={adjustMealCount}
            locked={settings?.finalized === true}
          />
        </div>
      </PageContainer>
    </>
  )
}

const tones = {
  brand: 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-900/30 dark:text-brand-300',
  amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
  slate: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
  teal: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-900/30 dark:text-teal-300',
  indigo:
    'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-300',
  violet:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-900/30 dark:text-violet-300',
  red: 'border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
}

function StatCard({ label, value, tone = 'slate', to, note }) {
  const content = (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-bold break-words">{value}</div>
      {note && <div className="mt-0.5 truncate text-[10px] opacity-70">{note}</div>}
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}