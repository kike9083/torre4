import { Router } from 'express'
import db from '../database.js'

const router = Router()

router.get('/:month/:year', (req, res) => {
  const { month, year } = req.params
  const m = parseInt(month)
  const y = parseInt(year)
  
  // Calcular mes anterior
  let prevMonth = m - 1
  let prevYear = y
  if (prevMonth < 1) {
    prevMonth = 12
    prevYear = y - 1
  }
  
  // Obtener ingresos del mes anterior para calcular saldos
  const ingresosPrevios = db.prepare(
    `SELECT apartamento, nombre, saldo_anterior, mensualidad, pago
     FROM ingresos 
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ? 
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?`
  ).all(prevMonth, prevYear) as any[]
  
  // Crear mapa de saldo actual del mes anterior por nombre (el nombre es consistente entre meses)
  const saldoActualPrevio = new Map<string, number>()
  ingresosPrevios.forEach(i => {
    const saldoActual = i.saldo_anterior + i.mensualidad - i.pago
    saldoActualPrevio.set(i.nombre, saldoActual)
  })
  
  // Obtener ingresos del mes actual
  const ingresosRaw = db.prepare(
    `SELECT * FROM ingresos 
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ? 
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?
     ORDER BY CAST(apartamento AS INTEGER) ASC`
  ).all(month, year) as any[]
  
  // Ajustar saldo_anterior de cada ingreso con el saldo actual del mes anterior
  // Primero intentar match por nombre, luego por apartamento (fallback para datos inconsistentes)
  const ingresos = ingresosRaw.map(i => {
    const saldoPorNombre = saldoActualPrevio.get(i.nombre)
    if (saldoPorNombre !== undefined) return { ...i, saldo_anterior: saldoPorNombre }
    const saldoPorApt = saldoActualPrevio.get(i.apartamento)
    if (saldoPorApt !== undefined) return { ...i, saldo_anterior: saldoPorApt }
    return i
  })

  const gastos = db.prepare(
    `SELECT * FROM gastos 
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ? 
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?`
  ).all(month, year)

  const banco = db.prepare(
    `SELECT * FROM banco_movimientos 
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ? 
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?
     ORDER BY fecha ASC`
  ).all(month, year)

  const caja = db.prepare(
    `SELECT * FROM caja_movimientos 
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ? 
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?
     ORDER BY fecha ASC`
  ).all(month, year)

  const fecha = `${year}-${String(m).padStart(2, '0')}-01`
  const resumen = db.prepare(
    `SELECT * FROM resumen_mensual WHERE fecha = ?`
  ).get(fecha) as any

  res.json({ ingresos, gastos, banco, caja, resumen: resumen || null })
})

export default router
