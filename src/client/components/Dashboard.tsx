import { useStore } from '../store'
import { TrendingUp, TrendingDown, DollarSign, Building2, Wallet, Users, AlertTriangle } from 'lucide-react'

export function Dashboard() {
  const { ingresos, gastos, bancoMovimientos, cajaMovimientos, resumen } = useStore()

  const totalIngresos = ingresos.reduce((sum, i) => sum + i.pago, 0)
  const totalMensualidad = ingresos.reduce((sum, i) => sum + i.mensualidad, 0)
  const totalPendiente = totalMensualidad - totalIngresos
  const totalGastosEfectivo = gastos.reduce((sum, g) => sum + g.efectivo, 0)
  const totalGastosCheques = gastos.reduce((sum, g) => sum + g.cheques, 0)
  const totalGastos = totalGastosEfectivo + totalGastosCheques
  
  const saldoBanco = (resumen?.banco_saldo_anterior ?? 0) + totalIngresos - totalGastosCheques + bancoMovimientos.reduce((s, m) => s + m.monto, 0)
  const saldoCaja = (resumen?.caja_saldo_anterior ?? 0) + cajaMovimientos.reduce((s, m) => s + m.monto, 0) - totalGastosEfectivo
  const saldoTotal = saldoBanco + saldoCaja

  const pagoRate = totalMensualidad > 0 ? (totalIngresos / totalMensualidad) * 100 : 0
  
  const apartamentosMorosos = ingresos.filter(i => i.pago === 0 && (i.saldo_anterior + i.mensualidad) > 0).length
  const apartamentosAlDia = ingresos.filter(i => i.pago >= i.mensualidad && i.mensualidad > 0).length

  const maxGasto = Math.max(...gastos.map(g => g.efectivo + g.cheques), 1)
  const topGastos = [...gastos].sort((a, b) => (b.efectivo + b.cheques) - (a.efectivo + a.cheques)).slice(0, 5)

  const maxMoroso = Math.max(...ingresos.map(i => i.saldo_anterior + i.mensualidad - i.pago), 1)
  const topMorosos = ingresos
    .map(i => ({ ...i, debe: i.saldo_anterior + i.mensualidad - i.pago }))
    .filter(i => i.debe > 0)
    .sort((a, b) => b.debe - a.debe)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Saldo Total" value={saldoTotal} color="blue" />
        <StatCard icon={TrendingUp} label="Ingresos" value={totalIngresos} subtitle={`${pagoRate.toFixed(0)}% cobrado`} color="green" />
        <StatCard icon={TrendingDown} label="Gastos" value={totalGastos} color="red" />
        <StatCard icon={Users} label="Aptos" value={ingresos.length} subtitle={`${apartamentosAlDia} al día`} color="purple" />
      </div>

      {/* Banco + Caja */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Building2 className="text-blue-600 dark:text-blue-400" size={22} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500 dark:text-slate-400">Banco General</p>
              <p className="text-2xl font-bold">${saldoBanco.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <Wallet className="text-amber-600 dark:text-amber-400" size={22} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500 dark:text-slate-400">Caja Menuda</p>
              <p className="text-2xl font-bold">${saldoCaja.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta pendiente */}
      {totalPendiente > 0 && (
        <div className="card p-4 border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-600 shrink-0" size={20} />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                Pendiente por cobrar: ${totalPendiente.toFixed(2)}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {apartamentosMorosos} apartamento(s) con saldo pendiente
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top gastos + Top morosos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">Top Gastos del Mes</h3>
          {topGastos.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sin gastos este mes</p>
          ) : (
            <div className="space-y-3">
              {topGastos.map((g) => {
                const total = g.efectivo + g.cheques
                const pct = (total / maxGasto) * 100
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 dark:text-slate-300 truncate mr-2">{g.descripcion}</span>
                      <span className="font-semibold text-slate-900 dark:text-white shrink-0">${total.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">Apartamentos con Saldo</h3>
          {topMorosos.length === 0 ? (
            <p className="text-sm text-green-600 text-center py-8">Todos al día!</p>
          ) : (
            <div className="space-y-3">
              {topMorosos.map((i) => {
                const pct = Math.min((i.debe / maxMoroso) * 100, 100)
                return (
                  <div key={i.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 dark:text-slate-300 truncate mr-2">
                        Apt {i.apartamento} - {i.nombre}
                      </span>
                      <span className="font-semibold text-red-600 shrink-0">${i.debe.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, subtitle, color }: {
  icon: any; label: string; value: number; subtitle?: string; color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  }

  return (
    <div className="card p-5">
      <div className={`p-2 rounded-lg w-fit ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold mt-3 text-slate-900 dark:text-white">${value.toFixed(2)}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}
