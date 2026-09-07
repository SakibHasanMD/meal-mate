import { memo } from 'react'

/**
 * A single meal-count cell.
 *
 * Default behaviour is unchanged: a click toggles 0 ↔ 1 (normal meal).
 * When the user needs more than one meal (e.g. a resident has a guest and
 * eats twice), hovering the cell reveals tiny +/− buttons that step the
 * count up/down (1 → 2 → 3 … up to MAX_MEAL_COUNT). Counts > 1 are drawn
 * darker so they stand out from normal meals.
 */
function MealChartCellBase({ value, onToggle, onAdjust, disabled, size = 'md' }) {
  const v = Number(value) || 0
  const on = v > 0
  const extra = v > 1
  const sizeClass =
    size === 'sm'
      ? 'h-8 w-9 rounded text-xs'
      : 'h-8 w-8 rounded text-xs'
  return (
    <div className="group relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className={`flex items-center justify-center font-semibold transition-colors ${sizeClass} ${
          on
            ? extra
              ? 'bg-brand-700 text-white hover:bg-brand-600'
              : 'bg-brand-600 text-white hover:bg-brand-700'
            : 'bg-slate-100 text-slate-300 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-500 dark:hover:bg-slate-600'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        aria-label={`${v} meal${v === 1 ? '' : 's'} — click to toggle 0/1`}
        title={
          on
            ? v === 1
              ? '1 meal — click to turn off'
              : `${v} meals — click to turn off, hover +/− to adjust`
            : 'No meal — click to set 1'
        }
      >
        {v}
      </button>
      {onAdjust && (
        <div
          className={`absolute -top-1 inset-x-0 flex items-start justify-between ${
            disabled
              ? 'pointer-events-none opacity-0'
              : 'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'
          }`}
        >
          <StepperBtn label="Decrease meal count (−1)" onClick={() => onAdjust(-1)}>
            −
          </StepperBtn>
          <StepperBtn label="Increase meal count (+1)" onClick={() => onAdjust(1)}>
            +
          </StepperBtn>
        </div>
      )}
    </div>
  )
}

function StepperBtn({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-4 w-4 items-center justify-center rounded-sm bg-slate-600 text-[10px] font-bold leading-none text-white hover:bg-slate-800 dark:bg-slate-500 dark:hover:bg-slate-400"
    >
      {children}
    </button>
  )
}

// Memoize so only the changed cell re-renders on bulk updates.
const MealChartCell = memo(MealChartCellBase)
export default MealChartCell