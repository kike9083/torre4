import { Router } from 'express'
import db from '../database.js'
import { resumenSchema } from '../schemas.js'
import { cascadeRecalculate } from '../lib/cascade.js'

const router = Router()

router.get('/latest', (_req, res) => {
  const resumen = db.prepare(
    `SELECT * FROM resumen_mensual ORDER BY fecha DESC LIMIT 1`
  ).get()
  res.json(resumen || null)
})

router.get('/:month/:year', (req, res) => {
  const { month, year } = req.params
  const fecha = `${year}-${month.padStart(2, '0')}-01`
  const resumen = db.prepare(
    `SELECT * FROM resumen_mensual WHERE fecha = ?`
  ).get(fecha)
  res.json(resumen || null)
})

router.post('/', (req, res) => {
  const result = resumenSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() })
  }
  const { fecha, banco_saldo_anterior, caja_saldo_anterior } = result.data
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO resumen_mensual (fecha, banco_saldo_anterior, caja_saldo_anterior)
     VALUES (?, ?, ?)`
  )
  stmt.run(fecha, banco_saldo_anterior, caja_saldo_anterior)
  
  const d = new Date(fecha)
  const month = d.getMonth() + 1
  const year = d.getFullYear()
  cascadeRecalculate(month, year)
  
  res.json({ success: true })
})

router.delete('/month/:month/:year', (req, res) => {
  const { month, year } = req.params
  const startDate = `${year}-${month.padStart(2, '0')}-01`
  const endMonth = parseInt(month)
  const endYear = parseInt(year)
  const lastDay = new Date(endYear, endMonth, 0).getDate()
  const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`

  const deleteAll = db.transaction(() => {
    db.prepare(`DELETE FROM ingresos WHERE fecha BETWEEN ? AND ?`).run(startDate, endDate)
    db.prepare(`DELETE FROM gastos WHERE fecha BETWEEN ? AND ?`).run(startDate, endDate)
    db.prepare(`DELETE FROM banco_movimientos WHERE fecha BETWEEN ? AND ?`).run(startDate, endDate)
    db.prepare(`DELETE FROM caja_movimientos WHERE fecha BETWEEN ? AND ?`).run(startDate, endDate)
    db.prepare(`DELETE FROM resumen_mensual WHERE fecha = ?`).run(startDate)
  })
  deleteAll()
  
  cascadeRecalculate(endMonth, endYear)
  
  res.json({ success: true })
})

export default router
