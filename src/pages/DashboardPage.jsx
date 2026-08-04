import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Header, { PageContainer } from '../components/layout/Header'
import Button from '../components/common/Button'
import { useApp } from '../context/AppContext'
import { useMonthlySummary } from '../hooks/useMonthlySummary'
import { monthLabel } from '../utils/dateHelpers'
import { formatMoney, round2 } from '../utils/calculations'
import { exportMonthPdf } from '../utils/exportHelpers'

export default function DashboardPage() {
  const { month, members, activeMembers } = useApp()
  const summary = useMonthlySummary(members, month)
  const [exporting, setExporting] = useState(false)

  const totals = summary.totals

  const handlePdf = async () => {
    setExporting(true)
    try {
      // The dashboard PDF uses the finance summary + due tables.
      // We capture them by their refs on the Finance page is not possible
      // from here, so we render a hidden export container with the data.
      await exportMonthPdf(
        [
          {
            el: hiddenRef.current?.querySelector('.summary-export'),
            title: `Monthly Summary — ${monthLabel(month)}`,
          },
          {
            el: hiddenRef.current?.querySelector('.due-export'),
            title: `Next Month Due — ${monthLabel(summary.nextMonth)}`,
          },
        ],
        month,
      )
    } finally {
      setExporting(false)
    }
  }

  const hiddenRef = useRef(null)

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={monthLabel(month)}
        actions={
          <Button variant="primary" size="sm" onClick={handlePdf} disabled={exporting}>
            {exporting ? 'Exporting…' : '📄 Export Month PDF'}
          </Button>
        }
      />
      <PageContainer>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Meals"
            value={totals.totalMeals}
            tone="brand"
            to="/meal-chart"
          />
          <StatCard
            label="Total Bazar"
            value={formatMoney(totals.totalBazar)}
            tone="amber"
            to="/finance"
          />
          <StatCard
            label="Meal Rate"
            value={formatMoney(round2(totals.mealRate))}
            tone="slate"
            to="/finance"
          />
          <StatCard
            label="Active Members"
            value={totals.dashboard.activeMembers}
            tone="emerald"
            to="/members"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            to="/meal-chart"
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm"
          >
            <div className="text-2xl">🍽️</div>
            <h3 className="mt-2 font-semibold text-slate-800">Meal Chart</h3>
            <p className="mt-1 text-sm text-slate-500">
              Mark breakfast & dinner for each day. Click cells to toggle, use bulk
              actions for everyone.
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-brand-700 group-hover:underline">
              Open chart →
            </span>
          </Link>

          <Link
            to="/finance"
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm"
          >
            <div className="text-2xl">💰</div>
            <h3 className="mt-2 font-semibold text-slate-800">Finance</h3>
            <p className="mt-1 text-sm text-slate-500">
              Log bazar expenses, record contributions, and see each member's due
              or credit for next month.
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-brand-700 group-hover:underline">
              Open finance →
            </span>
          </Link>
        </div>

        {/* Hidden export container for the dashboard PDF. */}
        <div ref={hiddenRef} className="hidden">
          <div className="summary-export">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Total Meals</th>
                  <th>Food Cost</th>
                  <th>Contribution</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {summary.summary.map((r) => (
                  <tr key={r.member.id}>
                    <td>{r.member.name}</td>
                    <td>{r.meals.total}</td>
                    <td>{formatMoney(r.foodCost)}</td>
                    <td>{formatMoney(r.contribution)}</td>
                    <td>{formatMoney(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="due-export">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Balance</th>
                  <th>Initial Bazar</th>
                  <th>Amount to Pay</th>
                </tr>
              </thead>
              <tbody>
                {summary.due.map((r) => (
                  <tr key={r.member.id}>
                    <td>{r.member.name}</td>
                    <td>{formatMoney(r.balance)}</td>
                    <td>{formatMoney(summary.nextMonthSettings?.initialBazarTaka ?? 2000)}</td>
                    <td>{formatMoney(r.amountToPay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

const tones = {
  brand: 'border-brand-200 bg-brand-50 text-brand-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

function StatCard({ label, value, tone = 'slate', to }) {
  const content = (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}