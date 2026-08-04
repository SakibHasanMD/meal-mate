import NumberInput from '../common/NumberInput'
import { formatMoney } from '../../utils/calculations'
import { monthLabel } from '../../utils/dateHelpers'

/**
 * Editor for next month's Initial Bazar Taka (default 2000, editable).
 * This value feeds into the Next Month Due calculation.
 */
export default function InitialBazarTakaSetting({
  nextMonth,
  initialBazarTaka,
  onCommit,
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-700">
          Initial Bazar Taka — {monthLabel(nextMonth)}
        </h3>
        <p className="text-xs text-slate-400">
          Starting grocery fund for next month. Default ৳ 2,000.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right text-xs text-slate-400">
          Current: <span className="font-semibold text-slate-700">{formatMoney(initialBazarTaka)}</span>
        </div>
        <div className="w-32">
          <NumberInput
            value={initialBazarTaka}
            onCommit={onCommit}
            placeholder="2000"
          />
        </div>
      </div>
    </div>
  )
}