import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { db } from '../db/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { currentMonthKey } from '../utils/dateHelpers'

const AppContext = createContext(null)

/**
 * App-wide state: members list + the currently selected month (YYYY-MM).
 * The selected month drives the Meal Chart and Finance pages.
 */
export function AppProvider({ children }) {
  const [month, setMonth] = useState(() => {
    return localStorage.getItem('selectedMonth') || currentMonthKey()
  })

  // Persist the selected month so it survives reloads.
  useEffect(() => {
    localStorage.setItem('selectedMonth', month)
  }, [month])

  // Dark mode: saved choice wins; otherwise follow the system preference.
  // The class is applied immediately (not just in the effect) so the very
  // first paint already has the right theme — no light-mode flash on load.
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    let isDark
    if (saved === 'dark') isDark = true
    else if (saved === 'light') isDark = false
    else isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    document.documentElement.classList.toggle('dark', isDark)
    return isDark
  })

  // Apply + persist the theme.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggleDark = useCallback(() => setDark((d) => !d), [])

  // Live query of all members (sorted by name).
  const members = useLiveQuery(() => db.members.orderBy('name').toArray(), [], [])

  const activeMembers = (members || []).filter((m) => m.active)

  const setMonthSafe = useCallback((m) => setMonth(m), [])

  const value = {
    month,
    setMonth: setMonthSafe,
    members: members || [],
    activeMembers,
    dark,
    toggleDark,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within an AppProvider')
  return ctx
}

export default AppContext