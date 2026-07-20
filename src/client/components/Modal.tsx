import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import { useStore } from '../store'
import { toast } from 'sonner'

export function Modal() {
  const { modal, closeModal, fetchData, month, year } = useStore()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const data: Record<string, any> = {}
    
    formData.forEach((value, key) => {
      if (key === 'monto' || key === 'saldo_anterior' || key === 'mensualidad' || key === 'pago' || key === 'efectivo' || key === 'cheques') {
        data[key] = parseFloat(value as string) || 0
      } else {
        data[key] = value
      }
    })
    
    const endpointMap: Record<string, string> = { ingreso: 'ingresos', gasto: 'gastos', banco: 'banco', caja: 'caja' }
    const endpoint = endpointMap[modal.type] || modal.type
    const method = modal.mode === 'add' ? 'POST' : 'PUT'
    const url = modal.mode === 'edit' && modal.data ? `/api/${endpoint}/${modal.data.id}` : `/api/${endpoint}`

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error('Error al guardar')

      toast.success(modal.mode === 'add' ? 'Registro creado' : 'Registro actualizado')
      closeModal()
      fetchData(month, year)
    } catch {
      toast.error('Error al guardar')
    }
  }

  const titles = {
    ingreso: { add: 'Nuevo Ingreso', edit: 'Editar Ingreso' },
    gasto: { add: 'Nuevo Gasto', edit: 'Editar Gasto' },
    banco: { add: 'Nuevo Movimiento Banco', edit: 'Editar Movimiento' },
    caja: { add: 'Nuevo Movimiento Caja', edit: 'Editar Movimiento' },
  }

  if (!modal.type) return null

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                  <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                    {titles[modal.type][modal.mode]}
                  </Dialog.Title>
                  <button
                    onClick={closeModal}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {modal.type === 'ingreso' && <IngresoFields data={modal.data} />}
                  {modal.type === 'gasto' && <GastoFields data={modal.data} />}
                  {(modal.type === 'banco' || modal.type === 'caja') && <MovimientoFields data={modal.data} />}
                  
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={closeModal} className="btn-secondary flex-1 justify-center">
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary flex-1 justify-center">
                      Guardar
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

function IngresoFields({ data }: { data?: any }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field name="apartamento" label="Apartamento" defaultValue={data?.apartamento} required />
        <Field name="nombre" label="Nombre" defaultValue={data?.nombre} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field name="saldo_anterior" label="Saldo Anterior" type="number" step="0.01" defaultValue={data?.saldo_anterior} required />
        <Field name="mensualidad" label="Mensualidad" type="number" step="0.01" defaultValue={data?.mensualidad} required />
      </div>
      <Field name="pago" label="Pago" type="number" step="0.01" defaultValue={data?.pago} />
      <Field name="observacion" label="Observación" defaultValue={data?.observacion} />
      <Field name="fecha" label="Fecha" type="date" defaultValue={data?.fecha} required />
    </>
  )
}

function GastoFields({ data }: { data?: any }) {
  return (
    <>
      <Field name="descripcion" label="Descripción" defaultValue={data?.descripcion} required />
      <div className="grid grid-cols-2 gap-4">
        <Field name="efectivo" label="Efectivo" type="number" step="0.01" defaultValue={data?.efectivo} />
        <Field name="cheques" label="Cheques" type="number" step="0.01" defaultValue={data?.cheques} />
      </div>
      <Field name="detalle_cheque" label="Detalle Cheque" defaultValue={data?.detalle_cheque} />
      <Field name="fecha" label="Fecha" type="date" defaultValue={data?.fecha} required />
    </>
  )
}

function MovimientoFields({ data }: { data?: any }) {
  return (
    <>
      <Field name="descripcion" label="Descripción" defaultValue={data?.descripcion} required />
      <Field 
        name="monto" 
        label="Monto" 
        type="number" 
        step="0.01" 
        defaultValue={data?.monto} 
        required 
        hint="Positivo para ingreso, negativo para egreso"
      />
      <Field name="fecha" label="Fecha" type="date" defaultValue={data?.fecha} required />
    </>
  )
}

function Field({ name, label, type = 'text', defaultValue, step, required, hint }: {
  name: string; label: string; type?: string; defaultValue?: any; step?: string; required?: boolean; hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue ?? (type === 'number' ? 0 : '')}
        required={required}
        className="input-field"
      />
      {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}
