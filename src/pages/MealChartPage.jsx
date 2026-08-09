import { useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header, { PageContainer } from '../components/layout/Header'
import Button from '../components/common/Button'
import BulkActionBar from '../components/mealchart/BulkActionBar'
import MealChartGrid from '../components/mealchart/MealChartGrid'
import { useApp } from '../context/AppContext'
import { useMealChart } from '../hooks/useMealChart'
import { useMonthSettings } from '../hooks/useContributions'
import { db } from '../db/db'
import { monthLabel } from '../utils/dateHelpers'
import { exportScreenshot } from '../utils/exportHelpers'

export default function MealChartPage() {
  const { month, activeMembers } = useApp()
  const { entries, toggleMeal, bulkSet } = useMealChart(month)
  const { settings, excludedMembers, toggleMemberExclusion } = useMonthSettings(month)

  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [exporting, setExporting] = useState(false)
  const [showMemberPanel, setShowMemberPanel] = useState(false)

  const locked = settings?.finalized === true

  // Members who are active AND not excluded for this month.
  const includedMembers = useMemo(
    () => activeMembers.filter((m) => !excludedMembers.includes(m.id)),
    [activeMembers, excludedMembers],
  )

  const handleScreenshot = async () => {
    setExporting(true)
    try {
      await exportScreenshot(gridRef.current, `MealChart_${month}.png`)
    } finally {
      setExporting(false)
    }
  }

  const finalize = async () => {
    // Soft/UI-level lock: mark the month as finalized.
    const existing = await db.monthSettings.get(month)
    await db.monthSettings.put({
      month,
      initialBazarTaka: existing?.initialBazarTaka ?? 2000,
      finalized: true,
      excludedMembers: existing?.excludedMembers ?? [],
    })
    navigate('/finance')
  }

  const unfinalize = async () => {
    const existing = await db.monthSettings.get(month)
    await db.monthSettings.put({
      month,
      initialBazarTaka: existing?.initialBazarTaka ?? 2000,
      finalized: false,
      excludedMembers: existing?.excludedMembers ?? [],
    })
  }

  return (
    <>
      <Header
        title="Meal Chart"
        subtitle={monthLabel(month)}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleScreenshot}
              disabled={exporting || !includedMembers.length}
            >
              {exporting ? 'Capturing…' : '📸 Screenshot'}
            </Button>
            {locked ? (
              <Button variant="ghost" size="sm" onClick={unfinalize}>
                Unlock
              </Button>
            ) : (
              <Button variant="success" size="sm" onClick={finalize}>
                Finalize Month
              </Button>
            )}
          </div>
        }
      />
      <PageContainer>
        <div className="space-y-4">
          {/* Member inclusion panel toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMemberPanel((s) => !s)}
            >
              {showMemberPanel ? '▾' : '▸'} Members for this month ({includedMembers.length}/{activeMembers.length})
            </Button>
            {excludedMembers.length > 0 && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {excludedMembers.length} excluded
              </span>
            )}
          </div>

          {/* Member exclusion panel */}
          {showMemberPanel && (
            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
              <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                Toggle which members are included in this month's meal chart. Excluded members won't appear in the grid or calculations.
              </p>
              <div className="flex flex-wrap gap-2">
                {activeMembers.map((m) => {
                  const isExcluded = excludedMembers.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => !locked && toggleMemberExclusion(m.id)}
                      disabled={locked}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        isExcluded
                          ? 'bg-slate-100 text-slate-400 line-through dark:bg-slate-700 dark:text-slate-500'
                          : 'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/40 dark:text-brand-300 dark:hover:bg-brand-900/60'
                      } ${locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                      {m.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <BulkActionBar
            monthKey={month}
            members={includedMembers}
            onBulkSet={bulkSet}
            locked={locked}
          />

          <MealChartGrid
            ref={gridRef}
            monthKey={month}
            members={includedMembers}
            entries={entries}
            onToggle={toggleMeal}
            locked={locked}
          />

          {locked && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-900/30 dark:text-amber-300">
              This month is finalized. Click <strong>Unlock</strong> to make changes.
            </div>
          )}
        </div>
      </PageContainer>
    </>
  )
}