import MonthSelector from './MonthSelector'
import { monthLabel } from '../../utils/dateHelpers'
import { useApp } from '../../context/AppContext'

/**
 * Top header with the page title and the month selector.
 */
export default function Header({ title, subtitle, actions }) {
  const { month } = useApp()
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-slate-700/60">
          <span className="text-xs text-slate-400 dark:text-slate-400">Month</span>
          <MonthSelector />
        </div>
      </div>
    </header>
  )
}

export function PageContainer({ children, className = '' }) {
  return <main className={`flex-1 overflow-y-auto p-6 ${className}`}>{children}</main>
}