import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '../../../data')
const dbPath = path.join(dataDir, 'condominio.db')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)

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
`)

console.log('Insertando datos de ejemplo...')

db.prepare(`INSERT INTO resumen_mensual (fecha, banco_saldo_anterior, caja_saldo_anterior) VALUES (?, ?, ?)`)
  .run('2025-08-01', 8778.74, 37.09)

const ingresosData = [
  ['1', 'ITZEL DE VALENCIA', 80.00, 40.00, 0.00, null, '2025-08-31'],
  ['2', 'EDITHA BETHANCOURT', 1200.00, 40.00, 0.00, null, '2025-08-31'],
  ['3', 'ANGEL DE MARCO', 0.00, 40.00, 40.00, 'R1389-TR.02/08', '2025-08-31'],
  ['4', 'CARMEN RODRIGUEZ', 0.00, 40.00, 0.00, null, '2025-08-31'],
  ['5', 'JOESAIDA GARCIA', 0.00, 40.00, 0.00, null, '2025-08-31'],
  ['6', 'CHRISTIAN FIGUEROA', 0.00, 40.00, 0.00, null, '2025-08-31'],
  ['7', 'ROSENDO ORO', 3080.00, 40.00, 0.00, null, '2025-08-31'],
  ['8', 'BENIGNA GONZÁLEZ', -80.00, 40.00, 0.00, null, '2025-08-31'],
  ['9', 'CECILIA SIU', 0.00, 40.00, 40.00, 'R1390-TR.08/AGO', '2025-08-31'],
  ['10', 'THOMAS BISANG', -40.00, 40.00, 40.00, 'R1391-TR.30/AGO', '2025-08-31'],
]

const insertIngreso = db.prepare(
  `INSERT INTO ingresos (apartamento, nombre, saldo_anterior, mensualidad, pago, observacion, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)`
)

for (const row of ingresosData) {
  insertIngreso.run(...row)
}

const gastosData = [
  ['LIMPIEZA EDIFICIO - AARON', 50.00, 0.00, 'C524', '2025-08-31'],
  ['INTERNET Y ELECTRICIDAD CAMARAS FEB 25', 10.00, 0.00, 'C525', '2025-08-31'],
  ['CARGO BANCARIO FIRMA CHEQUE INCORRECTA', 0.00, 32.10, null, '2025-08-31'],
  ['NATURGY JUL Y AGO 25', 0.00, 261.21, 'CH 117', '2025-08-31'],
  ['ABONO REPARACIÓN BOMBA AGUA', 0.00, 1000.00, 'CH 115', '2025-08-31'],
  ['SALDO REPARACIÓN BOMBA AGUA', 0.00, 990.11, 'CH 116', '2025-08-31'],
  ['TIMBRES BANCARIOS', 0.00, 0.30, null, '2025-08-31'],
]

const insertGasto = db.prepare(
  `INSERT INTO gastos (descripcion, efectivo, cheques, detalle_cheque, fecha) VALUES (?, ?, ?, ?, ?)`
)

for (const row of gastosData) {
  insertGasto.run(...row)
}

console.log('Datos insertados correctamente!')
console.log('')
console.log('Ahora puedes ejecutar: npm run dev')

db.close()
