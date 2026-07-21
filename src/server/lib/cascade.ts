import db from '../database.js'

interface MonthData {
  month: number
  year: number
  banco_saldo_anterior: number
  caja_saldo_anterior: number
  total_pagos: number
  total_cheques: number
  total_efectivo: number
  total_banco_mov: number
  total_caja_mov: number
}

function getNextMonth(month: number, year: number): { month: number; year: number } {
  if (month === 12) return { month: 1, year: year + 1 }
  return { month: month + 1, year }
}

function getMonthData(month: number, year: number): MonthData | null {
  const fecha = `${year}-${String(month).padStart(2, '0')}-01`
  
  const resumen = db.prepare(
    'SELECT banco_saldo_anterior, caja_saldo_anterior FROM resumen_mensual WHERE fecha = ?'
  ).get(fecha) as any
  
  if (!resumen) return null
  
  const totalPagos = db.prepare(
    `SELECT COALESCE(SUM(pago), 0) as total FROM ingresos 
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ? 
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?`
  ).get(month, year) as any
  
  const totalCheques = db.prepare(
    `SELECT COALESCE(SUM(cheques), 0) as total FROM gastos 
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ? 
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?`
  ).get(month, year) as any
  
  const totalEfectivo = db.prepare(
    `SELECT COALESCE(SUM(efectivo), 0) as total FROM gastos 
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ? 
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?`
  ).get(month, year) as any
  
  const totalBancoMov = db.prepare(
    `SELECT COALESCE(SUM(monto), 0) as total FROM banco_movimientos 
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ? 
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?`
  ).get(month, year) as any
  
  const totalCajaMov = db.prepare(
    `SELECT COALESCE(SUM(monto), 0) as total FROM caja_movimientos 
     WHERE CAST(strftime('%m', fecha) AS INTEGER) = ? 
     AND CAST(strftime('%Y', fecha) AS INTEGER) = ?`
  ).get(month, year) as any
  
  return {
    month,
    year,
    banco_saldo_anterior: resumen.banco_saldo_anterior,
    caja_saldo_anterior: resumen.caja_saldo_anterior,
    total_pagos: totalPagos.total,
    total_cheques: totalCheques.total,
    total_efectivo: totalEfectivo.total,
    total_banco_mov: totalBancoMov.total,
    total_caja_mov: totalCajaMov.total
  }
}

function monthExists(month: number, year: number): boolean {
  const fecha = `${year}-${String(month).padStart(2, '0')}-01`
  const count = db.prepare(
    'SELECT COUNT(*) as count FROM resumen_mensual WHERE fecha = ?'
  ).get(fecha) as any
  return count.count > 0
}

function getAllMonths(): { month: number; year: number }[] {
  const rows = db.prepare(
    `SELECT CAST(strftime('%m', fecha) AS INTEGER) as month, 
            CAST(strftime('%Y', fecha) AS INTEGER) as year 
     FROM resumen_mensual ORDER BY fecha ASC`
  ).all() as any[]
  return rows
}

export function recalculateFromMonth(startMonth: number, startYear: number): { updated: number } {
  const allMonths = getAllMonths()
  const startIndex = allMonths.findIndex(m => m.month === startMonth && m.year === startYear)
  
  if (startIndex === -1) {
    throw new Error(`Month ${startMonth}/${startYear} not found`)
  }
  
  let updated = 0
  
  const updateResumen = db.prepare(
    `UPDATE resumen_mensual SET banco_saldo_anterior = ?, caja_saldo_anterior = ? WHERE fecha = ?`
  )
  
  const updateIngresos = db.prepare(
    `UPDATE ingresos SET saldo_anterior = ? WHERE id = ?`
  )
  
  for (let i = startIndex; i < allMonths.length - 1; i++) {
    const current = allMonths[i]
    const next = allMonths[i + 1]
    
    const data = getMonthData(current.month, current.year)
    if (!data) continue
    
    const bancoFinal = Math.round(
      (data.banco_saldo_anterior + data.total_pagos - data.total_cheques + data.total_banco_mov) * 100
    ) / 100
    
    const cajaFinal = Math.round(
      (data.caja_saldo_anterior - data.total_efectivo + data.total_caja_mov) * 100
    ) / 100
    
    const nextFecha = `${next.year}-${String(next.month).padStart(2, '0')}-01`
    updateResumen.run(bancoFinal, cajaFinal, nextFecha)
    
    const prevIngresos = db.prepare(
      `SELECT id, nombre, apartamento, saldo_anterior, mensualidad, pago FROM ingresos 
       WHERE CAST(strftime('%m', fecha) AS INTEGER) = ? 
       AND CAST(strftime('%Y', fecha) AS INTEGER) = ?`
    ).all(current.month, current.year) as any[]
    
    const saldoMap = new Map<string, number>()
    prevIngresos.forEach(ing => {
      const saldoActual = Math.round(
        (ing.saldo_anterior + ing.mensualidad - ing.pago) * 100
      ) / 100
      saldoMap.set(ing.nombre, saldoActual)
      saldoMap.set(ing.apartamento, saldoActual)
    })
    
    const nextIngresos = db.prepare(
      `SELECT id, nombre, apartamento FROM ingresos 
       WHERE CAST(strftime('%m', fecha) AS INTEGER) = ? 
       AND CAST(strftime('%Y', fecha) AS INTEGER) = ?`
    ).all(next.month, next.year) as any[]
    
    nextIngresos.forEach(ing => {
      const saldoPorNombre = saldoMap.get(ing.nombre)
      const saldoPorApt = saldoMap.get(ing.apartamento)
      const nuevoSaldo = saldoPorNombre !== undefined ? saldoPorNombre : (saldoPorApt !== undefined ? saldoPorApt : 0)
      updateIngresos.run(nuevoSaldo, ing.id)
    })
    
    updated++
  }
  
  return { updated }
}

export function cascadeRecalculate(month: number, year: number): { updated: number } {
  return recalculateFromMonth(month, year)
}
