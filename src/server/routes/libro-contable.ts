import { Router } from 'express'
import db from '../database.js'

const router = Router()

router.get('/:month/:year', (req, res) => {
  const { month, year } = req.params
  const m = parseInt(month)
  const y = parseInt(year)

  const fecha = `${y}-${String(m).padStart(2, '0')}-01`

  const resumen = db.prepare(
    'SELECT * FROM resumen_mensual WHERE fecha = ?'
  ).get(fecha) as any

  const ingresos = db.prepare(
    `SELECT * FROM ingresos
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ?
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?`
  ).all(m, y) as any[]

  const bancoMov = db.prepare(
    `SELECT * FROM banco_movimientos
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ?
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?
     ORDER BY fecha, id`
  ).all(m, y) as any[]

  const cajaMov = db.prepare(
    `SELECT * FROM caja_movimientos
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ?
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?
     ORDER BY fecha, id`
  ).all(m, y) as any[]

  const gastos = db.prepare(
    `SELECT * FROM gastos
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ?
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?
     ORDER BY fecha, id`
  ).all(m, y) as any[]

  const bSA = resumen?.banco_saldo_anterior ?? 0
  const cSA = resumen?.caja_saldo_anterior ?? 0

  const totalCobros = ingresos.reduce((s: number, i: any) => s + i.pago, 0)
  const round = (v: number) => Math.round(v * 100) / 100

  const aptosPagaron = ingresos.filter((i: any) => i.pago > 0).length

  const gastosCheque = gastos.filter((g: any) => g.cheques > 0)
  const totalCheques = gastosCheque.reduce((s: number, g: any) => s + g.cheques, 0)

  const gastosEfectivo = gastos.filter((g: any) => g.efectivo > 0)
  const totalEfectivo = gastosEfectivo.reduce((s: number, g: any) => s + g.efectivo, 0)

  const fondeos = cajaMov.filter((m: any) => m.monto > 0)
  const totalFondeos = fondeos.reduce((s: number, m: any) => s + m.monto, 0)

  const totalBancoMov = bancoMov.reduce((s: number, m: any) => s + m.monto, 0)

  const saldoBanco = round(bSA + totalCobros - totalCheques + totalBancoMov)
  const saldoCaja = round(cSA + totalFondeos - totalEfectivo)

  res.json({
    banco: {
      saldoAnterior: round(bSA),
      cobros: { total: round(totalCobros), aptos: aptosPagaron },
      gastosCheque: gastosCheque.map((g: any) => ({
        id: g.id, descripcion: g.descripcion, monto: round(g.cheques),
        detalle: g.detalle_cheque, fecha: g.fecha
      })),
      movimientos: bancoMov.map((m: any) => ({
        id: m.id, descripcion: m.descripcion, monto: round(m.monto), fecha: m.fecha
      })),
      saldoFinal: saldoBanco
    },
    caja: {
      saldoInicial: round(cSA),
      fondeos: fondeos.map((m: any) => ({
        id: m.id, descripcion: m.descripcion, monto: round(m.monto), fecha: m.fecha
      })),
      gastosEfectivo: { total: round(totalEfectivo), recibos: gastosEfectivo.length },
      saldoFinal: saldoCaja
    },
    totalConsolidado: round(saldoBanco + saldoCaja)
  })
})

export default router
