import { Router } from 'express'
import db from '../database.js'
import { movimientoSchema } from '../schemas.js'

const router = Router()

router.get('/', (req, res) => {
  const { month, year } = req.query
  const movimientos = db.prepare(
    `SELECT * FROM banco_movimientos 
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
    `INSERT INTO banco_movimientos (descripcion, monto, fecha) VALUES (?, ?, ?)`
  )
  const info = stmt.run(descripcion, monto, fecha)
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
    `UPDATE banco_movimientos SET descripcion=?, monto=?, fecha=? WHERE id=?`
  )
  stmt.run(descripcion, monto, fecha, id)
  res.json({ success: true })
})

router.delete('/:id', (req, res) => {
  const { id } = req.params
  db.prepare('DELETE FROM banco_movimientos WHERE id=?').run(id)
  res.json({ success: true })
})

export default router
