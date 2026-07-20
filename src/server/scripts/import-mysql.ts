import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '../../../data')
const dbPath = path.join(dataDir, 'condominio.db')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath)
}

console.log('️  Importando datos desde MySQL a SQLite...\n')

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE ingresos (
    id INTEGER PRIMARY KEY, apartamento TEXT NOT NULL, nombre TEXT NOT NULL,
    saldo_anterior REAL NOT NULL DEFAULT 0, mensualidad REAL NOT NULL DEFAULT 0,
    pago REAL NOT NULL DEFAULT 0, observacion TEXT, fecha TEXT NOT NULL
  );
  CREATE TABLE gastos (
    id INTEGER PRIMARY KEY, descripcion TEXT NOT NULL,
    efectivo REAL NOT NULL DEFAULT 0, cheques REAL NOT NULL DEFAULT 0,
    detalle_cheque TEXT, fecha TEXT NOT NULL
  );
  CREATE TABLE resumen_mensual (
    id INTEGER PRIMARY KEY, fecha TEXT NOT NULL UNIQUE,
    banco_saldo_anterior REAL NOT NULL DEFAULT 0, caja_saldo_anterior REAL NOT NULL DEFAULT 0
  );
  CREATE TABLE banco_movimientos (
    id INTEGER PRIMARY KEY, descripcion TEXT NOT NULL, monto REAL NOT NULL, fecha TEXT NOT NULL
  );
  CREATE TABLE caja_movimientos (
    id INTEGER PRIMARY KEY, descripcion TEXT NOT NULL, monto REAL NOT NULL, fecha TEXT NOT NULL
  );
  CREATE INDEX idx_ingresos_fecha ON ingresos(fecha);
  CREATE INDEX idx_gastos_fecha ON gastos(fecha);
  CREATE INDEX idx_banco_fecha ON banco_movimientos(fecha);
  CREATE INDEX idx_caja_fecha ON caja_movimientos(fecha);
`)

const sql = fs.readFileSync(path.join(__dirname, '../../../condominio.sql'), 'utf-8')

function parseValues(s: string): (string | number | null)[] {
  const result: (string | number | null)[] = []
  let i = 0
  while (i < s.length) {
    while (i < s.length && (s[i] === ' ' || s[i] === ',')) i++
    if (i >= s.length) break
    if (s[i] === "'") {
      let val = ''
      i++
      while (i < s.length) {
        if (s[i] === "'" && s[i + 1] === "'") { val += "'"; i += 2 }
        else if (s[i] === "'") { i++; break }
        else { val += s[i]; i++ }
      }
      result.push(val || null)
    } else {
      let val = ''
      while (i < s.length && s[i] !== ',') { val += s[i]; i++ }
      val = val.trim()
      if (val === 'NULL') result.push(null)
      else result.push(parseFloat(val))
    }
  }
  return result
}

const insertIngreso = db.prepare('INSERT INTO ingresos VALUES (?,?,?,?,?,?,?,?)')
const insertGasto = db.prepare('INSERT INTO gastos VALUES (?,?,?,?,?,?)')
const insertBanco = db.prepare('INSERT INTO banco_movimientos VALUES (?,?,?,?)')
const insertCaja = db.prepare('INSERT INTO caja_movimientos VALUES (?,?,?,?)')
const insertResumen = db.prepare('INSERT INTO resumen_mensual VALUES (?,?,?,?)')

const importAll = db.transaction(() => {
  let total = 0
  
  // Find all INSERT statements
  const insertRegex = /INSERT INTO `(\w+)`\s*\([^)]+\)\s*VALUES\s*([\s\S]*?);/gi
  let match
  
  while ((match = insertRegex.exec(sql)) !== null) {
    const table = match[1]
    const valuesStr = match[2]
    
    // Extract all row tuples
    const rowRegex = /\(([^)]+)\)/g
    let rowMatch
    
    while ((rowMatch = rowRegex.exec(valuesStr)) !== null) {
      const values = parseValues(rowMatch[1])
      try {
        switch (table) {
          case 'ingresos': insertIngreso.run(...values); break
          case 'gastos': insertGasto.run(...values); break
          case 'banco_movimientos': insertBanco.run(...values); break
          case 'caja_movimientos': insertCaja.run(...values); break
          case 'resumen_mensual': insertResumen.run(...values); break
        }
        total++
      } catch (err: any) {
        console.error(`Error ${table}:`, values, err.message)
      }
    }
  }
  
  return total
})

const count = importAll()

console.log(`✅ Importación completada: ${count} registros`)
console.log('\n Resumen:')
console.log(`   • Ingresos: ${(db.prepare('SELECT COUNT(*) as c FROM ingresos').get() as any).c}`)
console.log(`   • Gastos: ${(db.prepare('SELECT COUNT(*) as c FROM gastos').get() as any).c}`)
console.log(`   • Banco: ${(db.prepare('SELECT COUNT(*) as c FROM banco_movimientos').get() as any).c}`)
console.log(`   • Caja: ${(db.prepare('SELECT COUNT(*) as c FROM caja_movimientos').get() as any).c}`)
console.log(`   • Resúmenes: ${(db.prepare('SELECT COUNT(*) as c FROM resumen_mensual').get() as any).c}`)

db.close()
console.log('\n Listo! Ejecuta: npm run dev')
