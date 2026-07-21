import db from '../database.js'
import { cascadeRecalculate } from '../lib/cascade.js'

const args = process.argv.slice(2)

if (args.length < 2) {
  console.log('Uso: npm run recalculate -- <mes> <año>')
  console.log('Ejemplo: npm run recalculate -- 9 2025')
  console.log('')
  console.log('Esto recalcula todos los saldos desde el mes indicado hacia adelante.')
  process.exit(1)
}

const month = parseInt(args[0])
const year = parseInt(args[1])

if (month < 1 || month > 12 || isNaN(year)) {
  console.error('Error: Mes debe ser 1-12 y año debe ser un número válido')
  process.exit(1)
}

console.log(`Recalculando saldos desde ${month}/${year}...`)

try {
  const result = cascadeRecalculate(month, year)
  console.log(`✓ Recálculo completado. ${result.updated} meses actualizados.`)
} catch (error: any) {
  console.error(`Error: ${error.message}`)
  process.exit(1)
}
