import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../../data/condominio.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function fixDataConsistency() {
  const inconsistentes = db.prepare(`
    SELECT id, apartamento, nombre 
    FROM ingresos 
    WHERE apartamento NOT GLOB '[0-9]*'
  `).all() as any[]

  if (inconsistentes.length === 0) return

  console.log(`[fix] Detectados ${inconsistentes.length} registros con apartamento/nombre invertidos, corrigiendo...`)

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

  updateMany(inconsistentes)
  console.log(`[fix] ${inconsistentes.length} registros corregidos exitosamente`)
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingresos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      apartamento TEXT NOT NULL,
      nombre TEXT NOT NULL,
      saldo_anterior REAL NOT NULL DEFAULT 0,
      mensualidad REAL NOT NULL DEFAULT 0,
      pago REAL NOT NULL DEFAULT 0,
      observacion TEXT,
      fecha TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL,
      efectivo REAL NOT NULL DEFAULT 0,
      cheques REAL NOT NULL DEFAULT 0,
      detalle_cheque TEXT,
      fecha TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resumen_mensual (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL UNIQUE,
      banco_saldo_anterior REAL NOT NULL DEFAULT 0,
      caja_saldo_anterior REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS banco_movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      fecha TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS caja_movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      fecha TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ingresos_fecha ON ingresos(fecha);
    CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
    CREATE INDEX IF NOT EXISTS idx_banco_fecha ON banco_movimientos(fecha);
    CREATE INDEX IF NOT EXISTS idx_caja_fecha ON caja_movimientos(fecha);
  `)

  fixDataConsistency()
}

export default db
