import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Building2, Wallet, Banknote, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

interface LibroContableData {
  banco: {
    saldoAnterior: number
    cobros: { total: number; aptos: number }
    gastosCheque: { id: number; descripcion: string; monto: number; detalle: string | null; fecha: string }[]
    movimientos: { id: number; descripcion: string; monto: number; fecha: string }[]
    saldoFinal: number
  }
  caja: {
    saldoInicial: number
    fondeos: { id: number; descripcion: string; monto: number; fecha: string }[]
    gastosEfectivo: { total: number; recibos: number }
    saldoFinal: number
  }
  totalConsolidado: number
}

export function LibroContableTab() {
  const { month, year } = useStore()
  const [data, setData] = useState<LibroContableData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/libro-contable/${month}/${year}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [month, year])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  )

  if (error || !data) return (
    <div className="card p-12 text-center">
      <AlertCircle className="mx-auto text-red-400 mb-3" size={40} />
      <p className="text-slate-500">{error || 'No hay datos disponibles'}</p>
    </div>
  )

  const fmt = (v: number) => v.toFixed(2)

  return (
    <div className="space-y-6">
      <LibroBanco data={data.banco} fmt={fmt} />
      <LibroCaja data={data.caja} fmt={fmt} />
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <Banknote className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Total Consolidado</h3>
        </div>
        <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <span>Banco: ${fmt(data.banco.saldoFinal)}</span>
            <span className="text-slate-300 dark:text-slate-600">+</span>
            <span>Caja: ${fmt(data.caja.saldoFinal)}</span>
            <ArrowRight size={18} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
            ${fmt(data.totalConsolidado)}
          </p>
        </div>
      </div>
    </div>
  )
}

function LibroBanco({ data, fmt }: { data: LibroContableData['banco']; fmt: (v: number) => string }) {
  let running = data.saldoAnterior

  const rows: { fecha: string; desc: string; debito: string; credito: string; saldo: string }[] = [
    { fecha: '01/09/2025', desc: 'SALDO ANTERIOR BANCO GENERAL', debito: '', credito: '', saldo: fmt(running) }
  ]

  if (data.cobros.total > 0) {
    running += data.cobros.total
    rows.push({
      fecha: '30/09/2025',
      desc: `Cobro de Cuotas de Mantenimiento (${data.cobros.aptos} aptos)`,
      debito: fmt(data.cobros.total),
      credito: '',
      saldo: fmt(running)
    })
  }

  for (const g of data.gastosCheque) {
    running -= g.monto
    rows.push({
      fecha: formatDate(g.fecha),
      desc: g.descripcion + (g.detalle ? ` (${g.detalle})` : ''),
      debito: '',
      credito: fmt(g.monto),
      saldo: fmt(running)
    })
  }

  for (const m of data.movimientos) {
    running += m.monto
    rows.push({
      fecha: formatDate(m.fecha),
      desc: m.descripcion,
      debito: m.monto >= 0 ? fmt(m.monto) : '',
      credito: m.monto < 0 ? fmt(Math.abs(m.monto)) : '',
      saldo: fmt(running)
    })
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Building2 className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Banco General</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Saldo Final: <span className="font-bold text-slate-700 dark:text-slate-200">${fmt(data.saldoFinal)}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
              <th className="text-left p-3 font-medium">FECHA</th>
              <th className="text-left p-3 font-medium">DESCRIPCIÓN</th>
              <th className="text-right p-3 font-medium">DÉBITO ($)</th>
              <th className="text-right p-3 font-medium">CRÉDITO ($)</th>
              <th className="text-right p-3 font-medium">SALDO ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows.map((r, i) => (
              <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 ${r.desc.includes('SALDO') ? 'bg-slate-50/50 dark:bg-slate-700/20 font-medium' : ''}`}>
                <td className="p-3 text-slate-500 dark:text-slate-400">{r.fecha}</td>
                <td className="p-3 text-slate-700 dark:text-slate-200">{r.desc}</td>
                <td className="p-3 text-right text-green-600 font-medium">{r.debito}</td>
                <td className="p-3 text-right text-red-600 font-medium">{r.credito}</td>
                <td className="p-3 text-right text-slate-900 dark:text-white font-bold">{r.saldo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LibroCaja({ data, fmt }: { data: LibroContableData['caja']; fmt: (v: number) => string }) {
  let running = data.saldoInicial

  const rows: { fecha: string; desc: string; debito: string; credito: string; saldo: string }[] = [
    { fecha: '01/09/2025', desc: 'SALDO INICIAL CAJA MENUDA', debito: '', credito: '', saldo: fmt(running) }
  ]

  for (const f of data.fondeos) {
    running += f.monto
    rows.push({
      fecha: formatDate(f.fecha),
      desc: `Ingreso a Caja Menuda (${f.descripcion})`,
      debito: fmt(f.monto),
      credito: '',
      saldo: fmt(running)
    })
  }

  if (data.gastosEfectivo.total > 0) {
    running -= data.gastosEfectivo.total
    rows.push({
      fecha: '30/09/2025',
      desc: `Gastos Varios en Efectivo (${data.gastosEfectivo.recibos} recibos de Caja Chica)`,
      debito: '',
      credito: fmt(data.gastosEfectivo.total),
      saldo: fmt(running)
    })
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Wallet className="text-amber-600 dark:text-amber-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Caja Menuda</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Saldo Final: <span className="font-bold text-slate-700 dark:text-slate-200">${fmt(data.saldoFinal)}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
              <th className="text-left p-3 font-medium">FECHA</th>
              <th className="text-left p-3 font-medium">DESCRIPCIÓN</th>
              <th className="text-right p-3 font-medium">DÉBITO ($)</th>
              <th className="text-right p-3 font-medium">CRÉDITO ($)</th>
              <th className="text-right p-3 font-medium">SALDO ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows.map((r, i) => (
              <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 ${r.desc.includes('SALDO') ? 'bg-slate-50/50 dark:bg-slate-700/20 font-medium' : ''}`}>
                <td className="p-3 text-slate-500 dark:text-slate-400">{r.fecha}</td>
                <td className="p-3 text-slate-700 dark:text-slate-200">{r.desc}</td>
                <td className="p-3 text-right text-green-600 font-medium">{r.debito}</td>
                <td className="p-3 text-right text-red-600 font-medium">{r.credito}</td>
                <td className="p-3 text-right text-slate-900 dark:text-white font-bold">{r.saldo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
