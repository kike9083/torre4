import { Router } from 'express'
import db from '../database.js'
import { movimientoSchema } from '../schemas.js'
import { cascadeRecalculate } from '../lib/cascade.js'

const router = Router()

function extractMonthYear(fecha: string): { month: number; year: number } {
  const d = new Date(fecha)
  return { month: d.getMonth() + 1, year: d.getFullYear() }
}

router.get('/', (req, res) => {
  const { month, year } = req.query
  const movimientos = db.prepare(
    `SELECT * FROM caja_movimientos 
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ? 
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?
     ORDER BY fecha ASC`
  ).all(month, year)
  res.json(movimientos)
})

router.post('/', (req, res) => {
  const result = movimientoSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() })
  }
  const { descripcion, monto, fecha } = result.data
  const stmt = db.prepare(
    `INSERT INTO caja_movimientos (descripcion, monto, fecha) VALUES (?, ?, ?)`
  )
  const info = stmt.run(descripcion, monto, fecha)
  
  const { month, year } = extractMonthYear(fecha)
  cascadeRecalculate(month, year)
  
  res.json({ id: info.lastInsertRowid })
})

router.put('/:id', (req, res) => {
  const result = movimientoSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() })
  }
  const { id } = req.params
  const { descripcion, monto, fecha } = result.data
  const stmt = db.prepare(
    `UPDATE caja_movimientos SET descripcion=?, monto=?, fecha=? WHERE id=?`
  )
  stmt.run(descripcion, monto, fecha, id)
  
  const { month, year } = extractMonthYear(fecha)
  cascadeRecalculate(month, year)
  
  res.json({ success: true })
})

router.delete('/:id', (req, res) => {
  const { id } = req.params
  const row = db.prepare('SELECT fecha FROM caja_movimientos WHERE id=?').get(id) as any
  db.prepare('DELETE FROM caja_movimientos WHERE id=?').run(id)
  
  if (row) {
    const { month, year } = extractMonthYear(row.fecha)
    cascadeRecalculate(month, year)
  }
  
  res.json({ success: true })
})

export default router
