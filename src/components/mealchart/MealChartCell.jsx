import { memo } from 'react'

/**
 * A single click-to-toggle 0/1 cell.
 * - Shows 1 as a filled green dot, 0 as an empty circle.
 * - Clicking toggles the value and auto-saves via the parent callback.
 */
function MealChartCellBase({ value, onToggle, disabled, size = 'md' }) {
  const on = Number(value) === 1
  const sizeClass =
    size === 'sm'
      ? 'h-8 w-9 rounded text-xs'
      : 'h-8 w-8 rounded text-xs'
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={`flex items-center justify-center font-semibold transition-colors ${sizeClass} ${
        on
          ? 'bg-brand-600 text-white hover:bg-brand-700'
          : 'bg-slate-100 text-slate-300 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-500 dark:hover:bg-slate-600'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      aria-label={on ? 'On (click to turn off)' : 'Off (click to turn on)'}
    >
      {on ? '1' : '0'}
    </button>
  )
}

// Memoize so only the changed cell re-renders on bulk updates.
const MealChartCell = memo(MealChartCellBase)
export default MealChartCell