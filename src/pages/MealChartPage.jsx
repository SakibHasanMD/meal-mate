import { useRef, useState } from 'react'
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
  const { settings } = useMonthSettings(month)

  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  const locked = settings?.finalized === true

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
    await db.monthSettings.put({
      month,
      initialBazarTaka: settings?.initialBazarTaka ?? 2000,
      finalized: true,
    })
    navigate('/finance')
  }

  const unfinalize = async () => {
    await db.monthSettings.put({
      month,
      initialBazarTaka: settings?.initialBazarTaka ?? 2000,
      finalized: false,
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
              disabled={exporting || !activeMembers.length}
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
          <BulkActionBar
            monthKey={month}
            members={activeMembers}
            onBulkSet={bulkSet}
            locked={locked}
          />

          <MealChartGrid
            ref={gridRef}
            monthKey={month}
            members={activeMembers}
            entries={entries}
            onToggle={toggleMeal}
            locked={locked}
          />

          {locked && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
              This month is finalized. Click <strong>Unlock</strong> to make changes.
            </div>
          )}
        </div>
      </PageContainer>
    </>
  )
}