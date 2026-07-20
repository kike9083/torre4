import { z } from 'zod'

export const ingresoSchema = z.object({
  apartamento: z.string().min(1),
  nombre: z.string().min(1),
  saldo_anterior: z.number(),
  mensualidad: z.number(),
  pago: z.number().default(0),
  observacion: z.string().optional(),
  fecha: z.string()
})

export const gastoSchema = z.object({
  descripcion: z.string().min(1),
  efectivo: z.number().default(0),
  cheques: z.number().default(0),
  detalle_cheque: z.string().optional(),
  fecha: z.string()
})

export const movimientoSchema = z.object({
  descripcion: z.string().min(1),
  monto: z.number(),
  fecha: z.string()
})

export const resumenSchema = z.object({
  fecha: z.string(),
  banco_saldo_anterior: z.number(),
  caja_saldo_anterior: z.number()
})

export type IngresoInput = z.infer<typeof ingresoSchema>
export type GastoInput = z.infer<typeof gastoSchema>
export type MovimientoInput = z.infer<typeof movimientoSchema>
export type ResumenInput = z.infer<typeof resumenSchema>
