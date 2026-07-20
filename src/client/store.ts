import { create } from 'zustand'

interface Ingreso {
  id: number
  apartamento: string
  nombre: string
  saldo_anterior: number
  mensualidad: number
  pago: number
  observacion: string | null
  fecha: string
}

interface Gasto {
  id: number
  descripcion: string
  efectivo: number
  cheques: number
  detalle_cheque: string | null
  fecha: string
}

interface Movimiento {
  id: number
  descripcion: string
  monto: number
  fecha: string
}

interface Resumen {
  banco_saldo_anterior: number
  caja_saldo_anterior: number
}

interface ModalState {
  type: 'ingreso' | 'gasto' | 'banco' | 'caja' | null
  mode: 'add' | 'edit'
  data?: Ingreso | Gasto | Movimiento
}

interface Store {
  month: number
  year: number
  ingresos: Ingreso[]
  gastos: Gasto[]
  bancoMovimientos: Movimiento[]
  cajaMovimientos: Movimiento[]
  resumen: Resumen | null
  modal: ModalState
  setMonth: (m: number) => void
  setYear: (y: number) => void
  setIngresos: (i: Ingreso[]) => void
  setGastos: (g: Gasto[]) => void
  setBancoMovimientos: (m: Movimiento[]) => void
  setCajaMovimientos: (m: Movimiento[]) => void
  setResumen: (r: Resumen | null) => void
  openModal: (type: ModalState['type'], mode: ModalState['mode'], data?: Ingreso | Gasto | Movimiento) => void
  closeModal: () => void
  fetchData: (month: number, year: number) => Promise<void>
}

export const useStore = create<Store>((set) => ({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  ingresos: [],
  gastos: [],
  bancoMovimientos: [],
  cajaMovimientos: [],
  resumen: null,
  modal: { type: null, mode: 'add' },

  setMonth: (m) => set({ month: m }),
  setYear: (y) => set({ year: y }),
  setIngresos: (i) => set({ ingresos: i }),
  setGastos: (g) => set({ gastos: g }),
  setBancoMovimientos: (m) => set({ bancoMovimientos: m }),
  setCajaMovimientos: (m) => set({ cajaMovimientos: m }),
  setResumen: (r) => set({ resumen: r }),

  openModal: (type, mode, data) => set({ modal: { type, mode, data } }),
  closeModal: () => set({ modal: { type: null, mode: 'add' } }),

  fetchData: async (month, year) => {
    const res = await fetch(`/api/all/${month}/${year}`)
    const data = await res.json()
    set({ 
      ingresos: data.ingresos, 
      gastos: data.gastos, 
      bancoMovimientos: data.banco, 
      cajaMovimientos: data.caja, 
      resumen: data.resumen 
    })
  }
}))
