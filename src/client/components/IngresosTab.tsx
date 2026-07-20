import { useState } from 'react'
import { useStore } from '../store'
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function IngresosTab() {
  const { ingresos, openModal, month, year, fetchData } = useStore()
  const [search, setSearch] = useState('')

  const filtered = ingresos.filter(i => 
    i.apartamento.toLowerCase().includes(search.toLowerCase()) ||
    i.nombre.toLowerCase().includes(search.toLowerCase())
  )

  const totals = ingresos.reduce((acc, i) => ({
    saldo_anterior: acc.saldo_anterior + i.saldo_anterior,
    mensualidad: acc.mensualidad + i.mensualidad,
    pago: acc.pago + i.pago,
    saldo_actual: acc.saldo_actual + (i.saldo_anterior + i.mensualidad - i.pago)
  }), { saldo_anterior: 0, mensualidad: 0, pago: 0, saldo_actual: 0 })

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar ingreso de ${nombre}?`)) return
    await fetch(`/api/ingresos/${id}`, { method: 'DELETE' })
    toast.success('Ingreso eliminado')
    fetchData(month, year)
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Cuotas de Mantenimiento
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {ingresos.length} apartamentos registrados
            </p>
          </div>
          <button onClick={() => openModal('ingreso', 'add')} className="btn-primary">
            <Plus size={18} />
            Agregar Ingreso
          </button>
        </div>
        
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por apartamento o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">AP.</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">NOMBRE</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">SALDO ANT.</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">MENS.</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">PAGOS</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">SALDO ACTUAL</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">ESTADO</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-300">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <AlertCircle className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={40} />
                  <p className="text-slate-500 dark:text-slate-400">
                    {search ? 'No se encontraron resultados' : 'No hay ingresos registrados'}
                  </p>
                </td>
              </tr>
            ) : filtered.map((i) => {
              const saldoActual = i.saldo_anterior + i.mensualidad - i.pago
              const estado = saldoActual <= 0 ? 'al-dia' : i.pago > 0 ? 'parcial' : 'pendiente'
              return (
                <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{i.apartamento}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{i.nombre}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">${i.saldo_anterior.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">${i.mensualidad.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">${i.pago.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${saldoActual > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${saldoActual.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={estado} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => openModal('ingreso', 'edit', i)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(i.id, i.nombre)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {filtered.length > 0 && (
            <tfoot className="bg-slate-50 dark:bg-slate-700/50 font-bold">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-slate-700 dark:text-slate-200">TOTAL</td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">${totals.saldo_anterior.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">${totals.mensualidad.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-green-600">${totals.pago.toFixed(2)}</td>
                <td className={`px-4 py-3 text-right ${totals.saldo_actual > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${totals.saldo_actual.toFixed(2)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'al-dia' | 'parcial' | 'pendiente' }) {
  const styles = {
    'al-dia': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    'parcial': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    'pendiente': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  }
  const labels = {
    'al-dia': 'Al día',
    'parcial': 'Parcial',
    'pendiente': 'Pendiente',
  }
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
