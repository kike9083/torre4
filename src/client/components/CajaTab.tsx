import { useStore } from '../store'
import { Plus, ArrowUpRight, ArrowDownRight, Wallet, AlertCircle, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function CajaTab() {
  const { cajaMovimientos, gastos, resumen, openModal, month, year, fetchData } = useStore()

  const handleDelete = async (id: number, desc: string) => {
    if (!confirm(`¿Eliminar movimiento "${desc}"?`)) return
    await fetch(`/api/caja/${id}`, { method: 'DELETE' })
    toast.success('Movimiento eliminado')
    fetchData(month, year)
  }

  const saldoAnterior = resumen?.caja_saldo_anterior ?? 0
  const egresosEfectivo = gastos.reduce((sum, g) => sum + g.efectivo, 0)
  const movimientosExtra = cajaMovimientos.reduce((sum, m) => sum + m.monto, 0)
  const saldoActual = saldoAnterior + movimientosExtra - egresosEfectivo

  const ingresos = cajaMovimientos.filter(m => m.monto >= 0)
  const egresos = cajaMovimientos.filter(m => m.monto < 0)
  const totalIngresos = ingresos.reduce((sum, m) => sum + m.monto, 0)
  const totalEgresos = Math.abs(egresos.reduce((sum, m) => sum + m.monto, 0))

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Wallet className="text-amber-600 dark:text-amber-400" size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Caja Menuda</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">${saldoActual.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Saldo Anterior</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200">${saldoAnterior.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ingresos Extra</p>
            <p className="font-semibold text-green-600">+${totalIngresos.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Gastos Efectivo</p>
            <p className="font-semibold text-red-600">-${egresosEfectivo.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Otros Egresos</p>
            <p className="font-semibold text-red-600">-${totalEgresos.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Total en libros */}
      <div className="card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <p className="font-medium text-slate-700 dark:text-slate-200">Saldo Total en Libros (Banco + Caja)</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ${(saldoActual + (resumen?.banco_saldo_anterior ?? 0) + 
              movimientosExtra - egresosEfectivo).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Movements */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Movimientos de Caja</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {cajaMovimientos.length} movimientos registrados
            </p>
          </div>
          <button onClick={() => openModal('caja', 'add')} className="btn-primary">
            <Plus size={18} />
            Agregar
          </button>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {cajaMovimientos.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={40} />
              <p className="text-slate-500 dark:text-slate-400">No hay movimientos registrados</p>
            </div>
          ) : (
            <>
              {ingresos.length > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/10">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase">Ingresos</p>
                </div>
              )}
              {ingresos.map(m => (
                <MovementRow key={m.id} movimiento={m} onDelete={handleDelete} onEdit={openModal} />
              ))}
              {egresos.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/10">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase">Egresos</p>
                </div>
              )}
              {egresos.map(m => (
                <MovementRow key={m.id} movimiento={m} onDelete={handleDelete} onEdit={openModal} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MovementRow({ movimiento, onDelete, onEdit }: {
  movimiento: { id: number; descripcion: string; monto: number; fecha: string }
  onDelete: (id: number, desc: string) => void
  onEdit: (type: 'caja', mode: 'edit', data: any) => void
}) {
  const isPositive = movimiento.monto >= 0
  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
          {isPositive ? <ArrowUpRight className="text-green-600" size={18} /> : <ArrowDownRight className="text-red-600" size={18} />}
        </div>
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-200">{movimiento.descripcion}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {new Date(movimiento.fecha).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}${movimiento.monto.toFixed(2)}
        </span>
        <div className="flex gap-1">
          <button 
            onClick={() => onEdit('caja', 'edit', movimiento)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDelete(movimiento.id, movimiento.descripcion)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
