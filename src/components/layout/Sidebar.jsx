import { useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { downloadBackup, restoreBackup } from '../../utils/backupHelpers'

const navItems = [
  { to: '/', label: 'Overview', icon: '📊', end: true },
  { to: '/members', label: 'Members', icon: '👥' },
  { to: '/meal-chart', label: 'Meal Chart', icon: '🍽️' },
  { to: '/finance', label: 'Finance', icon: '💰' },
  { to: '/house-fund', label: 'House Fund', icon: '🏠' },
  { to: '/utilities', label: 'Utilities', icon: '⚡' },
]

export default function Sidebar() {
  const { dark, toggleDark } = useApp()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState('')

  const handleBackup = async () => {
    setBusy('backup')
    try {
      await downloadBackup()
    } finally {
      setBusy('')
    }
  }

  const handleRestoreFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    if (
      !confirm(
        'Restore backup? This will REPLACE all current data with the backup contents. Continue?',
      )
    ) {
      return
    }
    setBusy('restore')
    try {
      await restoreBackup(file)
      alert('Backup restored successfully.')
    } catch (err) {
      alert(`Restore failed: ${err.message}`)
    } finally {
      setBusy('')
    }
  }

  return (
    <aside className="flex w-56 flex-shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="px-4 py-5">
        <div className="text-lg font-bold text-brand-700 dark:text-brand-400">
          MealMate
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500">
          Meal & Bazar Share
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t border-slate-200 p-3 dark:border-slate-700">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleBackup}
            disabled={busy !== ''}
            title="Download a full JSON backup of all your data"
            aria-label="Download backup"
            className="flex-1 rounded-md border border-slate-300 bg-white py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {busy === 'backup' ? '⏳' : '⬇️'}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy !== ''}
            title="Restore all your data from a JSON backup"
            aria-label="Restore backup"
            className="flex-1 rounded-md border border-slate-300 bg-white py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {busy === 'restore' ? '⏳' : '⬆️'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleRestoreFile}
          />
          <button
            onClick={toggleDark}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
            className="flex-1 rounded-md border border-slate-300 bg-white py-1.5 text-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="px-1 text-xs text-slate-400 dark:text-slate-500">
          Local-only · IndexedDB
        </div>
      </div>
    </aside>
  )
}
