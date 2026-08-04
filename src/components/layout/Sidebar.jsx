import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/members', label: 'Members', icon: '👥' },
  { to: '/meal-chart', label: 'Meal Chart', icon: '🍽️' },
  { to: '/finance', label: 'Finance', icon: '💰' },
]

export default function Sidebar() {
  return (
    <aside className="flex w-56 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="px-4 py-5">
        <div className="text-lg font-bold text-brand-700">Mess Manager</div>
        <div className="text-xs text-slate-400">Meal & Bazar</div>
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
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 text-xs text-slate-400">
        Local-only · IndexedDB
      </div>
    </aside>
  )
}