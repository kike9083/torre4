import { Router } from 'express'
import { cascadeRecalculate } from '../lib/cascade.js'

const router = Router()

router.post('/from/:month/:year', (req, res) => {
  const { month, year } = req.params
  const m = parseInt(month)
  const y = parseInt(year)
  
  if (m < 1 || m > 12 || isNaN(m) || isNaN(y)) {
    return res.status(400).json({ error: 'Mes o año inválido' })
  }
  
  try {
    const result = cascadeRecalculate(m, y)
    res.json({ 
      success: true, 
      message: `Recálculo completado desde ${m}/${y}`,
      monthsUpdated: result.updated 
    })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

export default router
