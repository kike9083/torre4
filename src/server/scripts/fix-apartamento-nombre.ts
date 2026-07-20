import db from '../database.js'

// Identificar registros donde apartamento contiene un nombre (no es un número)
const registrosInconsistentes = db.prepare(`
  SELECT id, apartamento, nombre 
  FROM ingresos 
  WHERE apartamento NOT GLOB '[0-9]*'
`).all() as any[]

console.log(`Encontrados ${registrosInconsistentes.length} registros con datos inconsistentes`)

// Intercambiar los valores
const updateStmt = db.prepare(`
  UPDATE ingresos 
  SET apartamento = ?, nombre = ?
  WHERE id = ?
`)

const updateMany = db.transaction((registros: any[]) => {
  for (const r of registros) {
    updateStmt.run(r.nombre, r.apartamento, r.id)
  }
})

updateMany(registrosInconsistentes)

console.log('Registros corregidos exitosamente')

// Verificar resultado
const todos = db.prepare('SELECT id, apartamento, nombre FROM ingresos ORDER BY id').all() as any[]
console.log('Total de registros:', todos.length)
console.log('Primeros 5 registros:', todos.slice(0, 5))
