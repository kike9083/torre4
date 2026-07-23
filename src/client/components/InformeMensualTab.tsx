import { useRef, useState } from 'react'
import { useStore } from '../store'
import { FileDown, Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export function InformeMensualTab() {
  const reportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const { ingresos, gastos, bancoMovimientos, cajaMovimientos, resumen, month, year } = useStore()

  const totalIngresos = ingresos.reduce((s, i) => s + i.pago, 0)
  const totalMensualidad = ingresos.reduce((s, i) => s + i.mensualidad, 0)
  const totalPendiente = totalMensualidad - totalIngresos
  const totalEfectivo = gastos.reduce((s, g) => s + g.efectivo, 0)
  const totalCheques = gastos.reduce((s, g) => s + g.cheques, 0)
  const totalGastos = totalEfectivo + totalCheques

  const saldoBanco = (resumen?.banco_saldo_anterior ?? 0) + totalIngresos - totalCheques + bancoMovimientos.reduce((s, m) => s + m.monto, 0)
  const saldoCaja = (resumen?.caja_saldo_anterior ?? 0) + cajaMovimientos.reduce((s, m) => s + m.monto, 0) - totalEfectivo
  const saldoTotal = saldoBanco + saldoCaja

  const pagoRate = totalMensualidad > 0 ? (totalIngresos / totalMensualidad) * 100 : 0
  const aptosAlDia = ingresos.filter(i => i.pago >= i.mensualidad && i.mensualidad > 0).length

  const fmt = (v: number) => v.toFixed(2)
  const monthName = new Date(year, month - 1).toLocaleDateString('es', { month: 'long', year: 'numeric' })

  const handleExportPDF = async () => {
    if (!reportRef.current) return
    setExporting(true)

    try {
      const el = reportRef.current
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()

      const imgW = canvas.width
      const imgH = canvas.height
      const ratio = imgW / pdfW
      const totalPages = Math.ceil(imgH / ratio / pdfH)

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage()
        const srcY = page * pdfH * ratio
        const srcH = Math.min(pdfH * ratio, imgH - srcY)
        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, srcH / ratio, undefined, 'FAST')
      }

      pdf.save(`informe-${monthName.replace(/\s/g, '-')}.pdf`)
    } catch (err) {
      console.error('PDF error:', err)
    } finally {
      setExporting(false)
    }
  }

  const bMovRows = [...bancoMovimientos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  const cMovRows = [...cajaMovimientos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

  let bRunning = resumen?.banco_saldo_anterior ?? 0
  const libroBanco: { desc: string; debito: string; credito: string; saldo: string }[] = []
  libroBanco.push({ desc: 'SALDO ANTERIOR BANCO GENERAL', debito: '', credito: '', saldo: fmt(bRunning) })

  if (totalIngresos > 0) {
    bRunning += totalIngresos
    libroBanco.push({
      desc: `Cobro de Cuotas de Mantenimiento (${ingresos.filter(i => i.pago > 0).length} aptos)`,
      debito: fmt(totalIngresos), credito: '', saldo: fmt(bRunning)
    })
  }

  const gastosCheque = gastos.filter(g => g.cheques > 0)
  for (const g of gastosCheque) {
    bRunning -= g.cheques
    libroBanco.push({
      desc: g.descripcion + (g.detalle_cheque ? ` (${g.detalle_cheque})` : ''),
      debito: '', credito: fmt(g.cheques), saldo: fmt(bRunning)
    })
  }

  for (const m of bMovRows) {
    bRunning += m.monto
    libroBanco.push({
      desc: m.descripcion + ' (Pagado directo por Banco)',
      debito: m.monto >= 0 ? fmt(m.monto) : '',
      credito: m.monto < 0 ? fmt(Math.abs(m.monto)) : '',
      saldo: fmt(bRunning)
    })
  }

  let cRunning = resumen?.caja_saldo_anterior ?? 0
  const libroCaja: { desc: string; debito: string; credito: string; saldo: string }[] = []
  libroCaja.push({ desc: 'SALDO INICIAL CAJA MENUDA', debito: '', credito: '', saldo: fmt(cRunning) })

  for (const m of cMovRows) {
    cRunning += m.monto
    libroCaja.push({
      desc: `Ingreso a Caja Menuda (${m.descripcion})`,
      debito: fmt(m.monto), credito: '', saldo: fmt(cRunning)
    })
  }

  if (totalEfectivo > 0) {
    cRunning -= totalEfectivo
    libroCaja.push({
      desc: `Gastos Varios en Efectivo (${gastos.filter(g => g.efectivo > 0).length} recibos)`,
      debito: '', credito: fmt(totalEfectivo), saldo: fmt(cRunning)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={handleExportPDF} disabled={exporting} className="btn-primary">
          {exporting ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />}
          {exporting ? 'Generando...' : 'Descargar PDF'}
        </button>
      </div>

      <div ref={reportRef} className="bg-white text-slate-900">
        <style>{`
          .inf-table { width: 100%; border-collapse: collapse; font-size: 10px; font-family: Arial, sans-serif; }
          .inf-table th { background: #f1f5f9; padding: 6px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
          .inf-table td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
          .inf-table .tr { text-align: right; }
          .inf-table .tc { text-align: center; }
          .inf-section { margin-bottom: 20px; }
          .inf-section h2 { font-size: 13px; font-weight: 700; margin: 0 0 8px; padding: 8px 12px; background: #2563eb; color: #fff; border-radius: 4px; }
          .inf-total { font-weight: 700; background: #f8fafc; }
          .inf-red { color: #dc2626; }
          .inf-green { color: #16a34a; }
        `}</style>

        <div style={{ padding: '20px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '3px solid #2563eb', paddingBottom: 12 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>CONDOMINIO VISTA DEL GOLF - TORRE 4</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>INFORME MENSUAL - {monthName.toUpperCase()}</p>
          </div>

          <div className="inf-section">
            <h2>RESUMEN</h2>
            <table className="inf-table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th className="tr">Valor ($)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Saldo Total Disponible</td><td className="tr font-bold">${fmt(saldoTotal)}</td></tr>
                <tr><td>Ingresos del Mes (Cuotas cobradas)</td><td className="tr inf-green">${fmt(totalIngresos)}</td></tr>
                <tr><td>Gastos del Mes</td><td className="tr inf-red">${fmt(totalGastos)}</td></tr>
                <tr><td>Por cobrar (Pendiente)</td><td className="tr inf-red">${fmt(totalPendiente)}</td></tr>
                <tr><td>% Cobrado</td><td className="tr">{pagoRate.toFixed(0)}%</td></tr>
                <tr><td>Apartamentos al Día</td><td className="tr">{aptosAlDia} / {ingresos.length}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="inf-section">
            <h2>INGRESOS - CUOTAS DE MANTENIMIENTO</h2>
            <table className="inf-table">
              <thead>
                <tr>
                  <th>Apto</th>
                  <th>Nombre</th>
                  <th className="tr">Saldo Ant.</th>
                  <th className="tr">Mensualidad</th>
                  <th className="tr">Pagó</th>
                  <th className="tr">Saldo Actual</th>
                </tr>
              </thead>
              <tbody>
                {ingresos.map(i => {
                  const saldoActual = i.saldo_anterior + i.mensualidad - i.pago
                  return (
                    <tr key={i.id}>
                      <td>{i.apartamento}</td>
                      <td>{i.nombre}</td>
                      <td className="tr">${fmt(i.saldo_anterior)}</td>
                      <td className="tr">${fmt(i.mensualidad)}</td>
                      <td className="tr inf-green" style={{ fontWeight: i.pago > 0 ? 700 : 400 }}>${fmt(i.pago)}</td>
                      <td className="tr" style={{ fontWeight: 700, color: saldoActual > 0 ? '#dc2626' : '#16a34a' }}>${fmt(saldoActual)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="inf-total">
                  <td colSpan={2}>TOTAL</td>
                  <td className="tr">${fmt(ingresos.reduce((s, i) => s + i.saldo_anterior, 0))}</td>
                  <td className="tr">${fmt(totalMensualidad)}</td>
                  <td className="tr inf-green">${fmt(totalIngresos)}</td>
                  <td className="tr">{fmt(ingresos.reduce((s, i) => s + i.saldo_anterior + i.mensualidad - i.pago, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="inf-section">
            <h2>GASTOS</h2>
            <table className="inf-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th className="tr">Efectivo ($)</th>
                  <th className="tr">Cheques ($)</th>
                  <th className="tr">Total ($)</th>
                </tr>
              </thead>
              <tbody>
                {gastos.length === 0 ? (
                  <tr><td colSpan={5} className="tc" style={{ padding: 20, color: '#94a3b8' }}>Sin gastos registrados</td></tr>
                ) : gastos.map(g => (
                  <tr key={g.id}>
                    <td>{new Date(g.fecha).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                    <td>{g.descripcion}{g.detalle_cheque ? ` (${g.detalle_cheque})` : ''}</td>
                    <td className="tr">{g.efectivo > 0 ? `$${fmt(g.efectivo)}` : ''}</td>
                    <td className="tr">{g.cheques > 0 ? `$${fmt(g.cheques)}` : ''}</td>
                    <td className="tr font-bold">${fmt(g.efectivo + g.cheques)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="inf-total">
                  <td colSpan={2}>TOTAL GASTOS</td>
                  <td className="tr">${fmt(totalEfectivo)}</td>
                  <td className="tr">${fmt(totalCheques)}</td>
                  <td className="tr">${fmt(totalGastos)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="inf-section">
            <h2>BANCO GENERAL</h2>
            <table className="inf-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th className="tr">Débito ($)</th>
                  <th className="tr">Crédito ($)</th>
                  <th className="tr">Saldo ($)</th>
                </tr>
              </thead>
              <tbody>
                {libroBanco.map((r, i) => (
                  <tr key={i} style={r.desc.includes('SALDO') ? { background: '#f8fafc', fontWeight: 700 } : {}}>
                    <td>{r.desc}</td>
                    <td className="tr inf-green">{r.debito}</td>
                    <td className="tr inf-red">{r.credito}</td>
                    <td className="tr font-bold">{r.saldo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="inf-section">
            <h2>CAJA MENUDA</h2>
            <table className="inf-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th className="tr">Débito ($)</th>
                  <th className="tr">Crédito ($)</th>
                  <th className="tr">Saldo ($)</th>
                </tr>
              </thead>
              <tbody>
                {libroCaja.map((r, i) => (
                  <tr key={i} style={r.desc.includes('SALDO') ? { background: '#f8fafc', fontWeight: 700 } : {}}>
                    <td>{r.desc}</td>
                    <td className="tr inf-green">{r.debito}</td>
                    <td className="tr inf-red">{r.credito}</td>
                    <td className="tr font-bold">{r.saldo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="inf-section">
            <h2 style={{ background: '#4f46e5' }}>TOTAL CONSOLIDADO</h2>
            <table className="inf-table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th className="tr">Valor ($)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Saldo Banco General</td><td className="tr">${fmt(saldoBanco)}</td></tr>
                <tr><td>Saldo Caja Menuda</td><td className="tr">${fmt(saldoCaja)}</td></tr>
                <tr className="inf-total"><td>TOTAL FONDOS DISPONIBLES</td><td className="tr" style={{ fontSize: 14 }}>${fmt(saldoTotal)}</td></tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 24, paddingTop: 12, borderTop: '1px solid #e2e8f0', fontSize: 9, color: '#94a3b8', textAlign: 'center' }}>
            <p>Informe generado el {new Date().toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <p>Condominio Vista del Golf - Torre 4 | Panamá</p>
          </div>
        </div>
      </div>
    </div>
  )
}
