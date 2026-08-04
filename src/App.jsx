import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import DashboardPage from './pages/DashboardPage'
import MembersPage from './pages/MembersPage'
import MealChartPage from './pages/MealChartPage'
import FinancePage from './pages/FinancePage'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/meal-chart" element={<MealChartPage />} />
          <Route path="/finance" element={<FinancePage />} />
        </Routes>
      </div>
    </div>
  )
}