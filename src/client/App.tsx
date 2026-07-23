import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { useStore } from './store'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { IngresosTab } from './components/IngresosTab'
import { GastosTab } from './components/GastosTab'
import { BancoTab } from './components/BancoTab'
import { CajaTab } from './components/CajaTab'
import { LibroContableTab } from './components/LibroContableTab'
import { Modal } from './components/Modal'
import { LayoutDashboard, Users, Receipt, Building2, Wallet, BookOpen } from 'lucide-react'

type Tab = 'dashboard' | 'ingresos' | 'gastos' | 'banco' | 'caja' | 'libro-contable'

export default function App() {
  const { month, year, setMonth, setYear, fetchData } = useStore()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData(month, year).finally(() => setLoading(false))
  }, [month, year])

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ingresos' as Tab, label: 'Ingresos', icon: Users },
    { id: 'gastos' as Tab, label: 'Gastos', icon: Receipt },
    { id: 'banco' as Tab, label: 'Banco', icon: Building2 },
    { id: 'caja' as Tab, label: 'Caja', icon: Wallet },
    { id: 'libro-contable' as Tab, label: 'Libro Contable', icon: BookOpen },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" richColors />
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Month Selector */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              {new Date(year, month - 1).toLocaleDateString('es', { month: 'long', year: 'numeric' }).toUpperCase()}
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (month === 1) { setMonth(12); setYear(year - 1) }
                  else setMonth(month - 1)
                }}
                className="btn-secondary !px-3 !py-2"
              >
                ←
              </button>
              <select 
                value={month} 
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="input-field !w-auto"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleDateString('es', { month: 'long' })}
                  </option>
                ))}
              </select>
              <input 
                type="number" 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="input-field !w-24"
              />
              <button 
                onClick={() => {
                  if (month === 12) { setMonth(1); setYear(year + 1) }
                  else setMonth(month + 1)
                }}
                className="btn-secondary !px-3 !py-2"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card p-2 mb-6">
          <nav className="flex flex-wrap gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="animate-slide-in">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'ingresos' && <IngresosTab />}
          {activeTab === 'gastos' && <GastosTab />}
          {activeTab === 'banco' && <BancoTab />}
          {activeTab === 'caja' && <CajaTab />}
          {activeTab === 'libro-contable' && <LibroContableTab />}
        </div>
      </div>

      <Modal />
    </div>
  )
}
