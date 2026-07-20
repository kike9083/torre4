import express from 'express'
import cors from 'cors'
import { initDatabase } from './database.js'
import ingresosRouter from './routes/ingresos.js'
import gastosRouter from './routes/gastos.js'
import bancoRouter from './routes/banco.js'
import cajaRouter from './routes/caja.js'
import resumenRouter from './routes/resumen.js'
import allRouter from './routes/all.js'

initDatabase()

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.use('/api/all', allRouter)
app.use('/api/ingresos', ingresosRouter)
app.use('/api/gastos', gastosRouter)
app.use('/api/banco', bancoRouter)
app.use('/api/caja', cajaRouter)
app.use('/api/resumen', resumenRouter)

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
