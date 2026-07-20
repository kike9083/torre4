import { Router } from 'express'
import db from '../database.js'
import { gastoSchema } from '../schemas.js'

const router = Router()

router.get('/', (req, res) => {
  const { month, year } = req.query
  const gastos = db.prepare(
    `SELECT * FROM gastos 
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ? 
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?`
  ).all(month, year)
  res.json(gastos)
})

router.post('/', (req, res) => {
  const result = gastoSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() })
  }
  const { descripcion, efectivo, cheques, detalle_cheque, fecha } = result.data
  const stmt = db.prepare(
    `INSERT INTO gastos (descripcion, efectivo, cheques, detalle_cheque, fecha)
     VALUES (?, ?, ?, ?, ?)`
  )
  const info = stmt.run(descripcion, efectivo, cheques, detalle_cheque || null, fecha)
  res.json({ id: info.lastInsertRowid })
})

router.put('/:id', (req, res) => {
  const result = gastoSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() })
  }
  const { id } = req.params
  const { descripcion, efectivo, cheques, detalle_cheque, fecha } = result.data
  const stmt = db.prepare(
    `UPDATE gastos SET descripcion=?, efectivo=?, cheques=?, detalle_cheque=?, fecha=?
     WHERE id=?`
  )
  stmt.run(descripcion, efectivo, cheques, detalle_cheque || null, fecha, id)
  res.json({ success: true })
})

router.delete('/:id', (req, res) => {
  const { id } = req.params
  db.prepare('DELETE FROM gastos WHERE id=?').run(id)
  res.json({ success: true })
})

export default router
