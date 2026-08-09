import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import ErrorBoundary from './components/common/ErrorBoundary'
import DashboardPage from './pages/DashboardPage'
import MembersPage from './pages/MembersPage'
import MealChartPage from './pages/MealChartPage'
import FinancePage from './pages/FinancePage'
import HouseFundPage from './pages/HouseFundPage'
import UtilitiesPage from './pages/UtilitiesPage'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/meal-chart" element={<MealChartPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/house-fund" element={<HouseFundPage />} />
            <Route path="/utilities" element={<UtilitiesPage />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </div>
  )
}
