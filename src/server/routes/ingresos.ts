import { Router } from 'express'
import db from '../database.js'
import { ingresoSchema } from '../schemas.js'
import { cascadeRecalculate } from '../lib/cascade.js'

const router = Router()

function extractMonthYear(fecha: string): { month: number; year: number } {
  const d = new Date(fecha)
  return { month: d.getMonth() + 1, year: d.getFullYear() }
}

router.get('/', (req, res) => {
  const { month, year } = req.query
  const ingresos = db.prepare(
    `SELECT * FROM ingresos 
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ? 
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?
     ORDER BY CAST(apartamento AS INTEGER) ASC`
  ).all(month, year)
  res.json(ingresos)
})

router.post('/', (req, res) => {
  const result = ingresoSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() })
  }
  const { apartamento, nombre, saldo_anterior, mensualidad, pago, observacion, fecha } = result.data
  const stmt = db.prepare(
    `INSERT INTO ingresos (apartamento, nombre, saldo_anterior, mensualidad, pago, observacion, fecha)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const info = stmt.run(apartamento, nombre, saldo_anterior, mensualidad, pago, observacion || null, fecha)
  
  const { month, year } = extractMonthYear(fecha)
  cascadeRecalculate(month, year)
  
  res.json({ id: info.lastInsertRowid })
})

router.put('/:id', (req, res) => {
  const result = ingresoSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() })
  }
  const { id } = req.params
  const { apartamento, nombre, saldo_anterior, mensualidad, pago, observacion, fecha } = result.data
  const stmt = db.prepare(
    `UPDATE ingresos SET apartamento=?, nombre=?, saldo_anterior=?, mensualidad=?, pago=?, observacion=?, fecha=?
     WHERE id=?`
  )
  stmt.run(apartamento, nombre, saldo_anterior, mensualidad, pago, observacion || null, fecha, id)
  
  const { month, year } = extractMonthYear(fecha)
  cascadeRecalculate(month, year)
  
  res.json({ success: true })
})

router.delete('/:id', (req, res) => {
  const { id } = req.params
  const row = db.prepare('SELECT fecha FROM ingresos WHERE id=?').get(id) as any
  db.prepare('DELETE FROM ingresos WHERE id=?').run(id)
  
  if (row) {
    const { month, year } = extractMonthYear(row.fecha)
    cascadeRecalculate(month, year)
  }
  
  res.json({ success: true })
})

export default router
