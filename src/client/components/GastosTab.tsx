import { useState } from 'react'
import { useStore } from '../store'
import { Plus, Search, Edit2, Trash2, AlertCircle, Receipt } from 'lucide-react'
import { toast } from 'sonner'

export function GastosTab() {
  const { gastos, openModal, month, year, fetchData } = useStore()
  const [search, setSearch] = useState('')

  const filtered = gastos.filter(g => 
    g.descripcion.toLowerCase().includes(search.toLowerCase())
  )

  const totals = gastos.reduce((acc, g) => ({
    efectivo: acc.efectivo + g.efectivo,
    cheques: acc.cheques + g.cheques,
    total: acc.total + g.efectivo + g.cheques
  }), { efectivo: 0, cheques: 0, total: 0 })

  const handleDelete = async (id: number, desc: string) => {
    if (!confirm(`¿Eliminar gasto "${desc}"?`)) return
    await fetch(`/api/gastos/${id}`, { method: 'DELETE' })
    toast.success('Gasto eliminado')
    fetchData(month, year)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Efectivo</p>
          <p className="text-xl font-bold text-green-600">${totals.efectivo.toFixed(2)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Cheques</p>
          <p className="text-xl font-bold text-blue-600">${totals.cheques.toFixed(2)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Gastos</p>
          <p className="text-xl font-bold text-red-600">${totals.total.toFixed(2)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Registro de Gastos
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {gastos.length} gastos registrados
              </p>
            </div>
            <button onClick={() => openModal('gasto', 'add')} className="btn-primary">
              <Plus size={18} />
              Agregar Gasto
            </button>
          </div>
          
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar gasto..."
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
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">DESCRIPCIÓN</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">EFECTIVO</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">CHEQUES</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">DETALLE</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">TOTAL</th>
                <th className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-300">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <AlertCircle className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={40} />
                    <p className="text-slate-500 dark:text-slate-400">
                      {search ? 'No se encontraron resultados' : 'No hay gastos registrados'}
                    </p>
                  </td>
                </tr>
              ) : filtered.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Receipt size={16} className="text-slate-400" />
                      <span className="text-slate-700 dark:text-slate-200">{g.descripcion}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {g.efectivo > 0 ? `$${g.efectivo.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600">
                    {g.cheques > 0 ? `$${g.cheques.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {g.detalle_cheque || '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    ${(g.efectivo + g.cheques).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => openModal('gasto', 'edit', g)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(g.id, g.descripcion)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-slate-50 dark:bg-slate-700/50 font-bold">
                <tr>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">TOTAL</td>
                  <td className="px-4 py-3 text-right text-green-600">${totals.efectivo.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-blue-600">${totals.cheques.toFixed(2)}</td>
                  <td></td>
                  <td className="px-4 py-3 text-right text-red-600">${totals.total.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
