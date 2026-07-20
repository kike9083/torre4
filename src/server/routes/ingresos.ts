import { Router } from 'express'
import db from '../database.js'
import { ingresoSchema } from '../schemas.js'

const router = Router()

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
  res.json({ success: true })
})

router.delete('/:id', (req, res) => {
  const { id } = req.params
  db.prepare('DELETE FROM ingresos WHERE id=?').run(id)
  res.json({ success: true })
})

export default router
