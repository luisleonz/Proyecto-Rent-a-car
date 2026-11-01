import { supabase } from './supabase'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

// Business settings. These are the defaults; the owner edits them in Ajustes and they are
// loaded from the "configuracion" table at startup (cargarConfig), overriding these values.
export const EMPRESA = {
  nombreComercial: "Luciano's Tours",
  representante:   'Luciano León C.',
  rfc:             'LECL760507R33',
  telefono:        '631 134 2266',
  whatsapp:        '631 999 7000',
  email:           'lucianostoursnogales@gmail.com',
  ciudadFirma:     'Nogales, Sonora',
  sucursal:        'Matriz',
  // Si se deja vacío, el anexo imprime una línea en blanco para llenarlo a mano.
  domicilio:       '',
  lugarEntregaPredeterminado: "Oficina Luciano's Tours",
  // IVA de región fronteriza; las tarifas no lo incluyen y se suma al final.
  ivaTasa: 0.08,
  ivaPorDefecto: true,
  metodosPago: ['efectivo', 'tarjeta', 'transferencia'] as string[],
  fianzaPredeterminada: 2000,
  ceroDeducibleDia: 0,
  limpiezaSedan: 1600,
  limpiezaVan: 3200,
}
export type Empresa = typeof EMPRESA

export const ivaDe = (base: number) => Math.round(Math.max(0, base) * EMPRESA.ivaTasa * 100) / 100
export const ivaEtiqueta = () => `IVA ${Math.round(EMPRESA.ivaTasa * 100)}%`

export async function cargarConfig() {
  const { data } = await db.from('configuracion').select('datos').eq('id', 1).maybeSingle()
  if (data?.datos) Object.assign(EMPRESA, data.datos)
}

/** Public page: only contact details are readable without signing in. */
export async function cargarDatosPublicos() {
  const { data } = await db.rpc('datos_publicos')
  if (data) Object.assign(EMPRESA, Object.fromEntries(Object.entries(data).filter(([, v]) => v != null && v !== '')))
}

export async function guardarConfig(cambios: Partial<Empresa>) {
  const datos = { ...EMPRESA, ...cambios }
  const { data, error } = await db.from('configuracion').update({ datos, updated_at: new Date().toISOString() }).eq('id', 1).select('id')
  if (error) return error as { code?: string; message: string }
  // Without permission the database silently changes nothing
  if (!data?.length) return { message: 'No se guardó: solo el dueño puede cambiar los ajustes del negocio.' }
  Object.assign(EMPRESA, cambios)
  return null
}
