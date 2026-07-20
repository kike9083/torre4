import { useStore } from '../store'
import { Plus, Edit2, Trash2, ArrowUpRight, ArrowDownRight, Building2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function BancoTab() {
  const { bancoMovimientos, ingresos, gastos, resumen, openModal, month, year, fetchData } = useStore()

  const handleDelete = async (id: number, desc: string) => {
    if (!confirm(`¿Eliminar movimiento "${desc}"?`)) return
    await fetch(`/api/banco/${id}`, { method: 'DELETE' })
    toast.success('Movimiento eliminado')
    fetchData(month, year)
  }

  const saldoAnterior = resumen?.banco_saldo_anterior ?? 0
  const cuotasMantenimiento = ingresos.reduce((sum, i) => sum + i.pago, 0)
  const egresosCheques = gastos.reduce((sum, g) => sum + g.cheques, 0)
  const movimientosExtra = bancoMovimientos.reduce((sum, m) => sum + m.monto, 0)
  const saldoActual = saldoAnterior + cuotasMantenimiento - egresosCheques + movimientosExtra

  const depositos = bancoMovimientos.filter(m => m.monto >= 0)
  const retiros = bancoMovimientos.filter(m => m.monto < 0)
  const totalDepositos = depositos.reduce((sum, m) => sum + m.monto, 0)
  const totalRetiros = Math.abs(retiros.reduce((sum, m) => sum + m.monto, 0))

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Building2 className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Banco General</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">${saldoActual.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Saldo Anterior</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200">${saldoAnterior.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Cuotas Cobradas</p>
            <p className="font-semibold text-green-600">+${cuotasMantenimiento.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Cheques Emitidos</p>
            <p className="font-semibold text-red-600">-${egresosCheques.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Otros Movimientos</p>
            <p className={`font-semibold ${movimientosExtra >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {movimientosExtra >= 0 ? '+' : ''}${movimientosExtra.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Movements */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Movimientos Adicionales</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Depósitos: ${totalDepositos.toFixed(2)} | Retiros: ${totalRetiros.toFixed(2)}
            </p>
          </div>
          <button onClick={() => openModal('banco', 'add')} className="btn-primary">
            <Plus size={18} />
            Agregar
          </button>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {bancoMovimientos.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={40} />
              <p className="text-slate-500 dark:text-slate-400">No hay movimientos adicionales</p>
            </div>
          ) : (
            <>
              {depositos.length > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/10">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase">Depósitos</p>
                </div>
              )}
              {depositos.map(m => (
                <MovementRow key={m.id} movimiento={m} onDelete={handleDelete} onEdit={openModal} type="banco" />
              ))}
              {retiros.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/10">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase">Retiros</p>
                </div>
              )}
              {retiros.map(m => (
                <MovementRow key={m.id} movimiento={m} onDelete={handleDelete} onEdit={openModal} type="banco" />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MovementRow({ movimiento, onDelete, onEdit, type }: {
  movimiento: { id: number; descripcion: string; monto: number; fecha: string }
  onDelete: (id: number, desc: string) => void
  onEdit: (type: 'banco' | 'caja', mode: 'edit', data: any) => void
  type: 'banco' | 'caja'
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
            onClick={() => onEdit(type, 'edit', movimiento)}
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
