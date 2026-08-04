import { useState, useMemo } from 'react'
import Button from '../common/Button'
import { daysInMonth, isoDateForDay } from '../../utils/dateHelpers'

/**
 * Toolbar to bulk-set all members' breakfast/dinner/both for a date.
 */
export default function BulkActionBar({ monthKey, members, onBulkSet, locked }) {
  const days = daysInMonth(monthKey)
  const [day, setDay] = useState(1)
  const [mealType, setMealType] = useState('both')

  const date = useMemo(() => isoDateForDay(monthKey, Number(day)), [monthKey, day])

  const run = (value) => {
    onBulkSet(members.map((m) => m.id), date, mealType, value)
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              Day {d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Meal</label>
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="both">Both</option>
          <option value="breakfast">Breakfast</option>
          <option value="dinner">Dinner</option>
        </select>
      </div>

      <div className="flex gap-2">
        <Button variant="success" size="sm" onClick={() => run(true)} disabled={locked || !members.length}>
          Set all to 1
        </Button>
        <Button variant="secondary" size="sm" onClick={() => run(false)} disabled={locked || !members.length}>
          Set all to 0
        </Button>
      </div>

      {locked && (
        <span className="text-xs text-amber-600">Month finalized — unlock to edit.</span>
      )}
    </div>
  )
}