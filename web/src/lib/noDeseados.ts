import { supabase } from './supabase'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

export type Veto = { id: string; cliente_id: string; cliente_nombre: string; cliente_telefono: string | null; accion: 'marcar' | 'quitar'
  motivo: string; reserva_id: string | null; reserva_folio: number | null; fecha: string; registrado_por: string | null }

export const MOTIVOS_NO_DESEADO = ['No pagó', 'Daños al vehículo', 'Regresó tarde sin avisar', 'Mal uso del vehículo', 'Conducta agresiva', 'Documentos falsos']

type ClienteMin = { id: string; nombre: string; telefono?: string | null }

/** Adds a "no rentar" entry; the database updates the client's flag and the activity log. */
export async function marcarNoDeseado(c: ClienteMin, motivo: string, reserva?: { id: string; folio: number | null } | null) {
  const { error } = await db.from('clientes_vetos').insert({ cliente_id: c.id, cliente_nombre: c.nombre, cliente_telefono: c.telefono ?? null,
    accion: 'marcar', motivo: motivo.trim(), reserva_id: reserva?.id ?? null, reserva_folio: reserva?.folio ?? null })
  return error as { code?: string; message: string } | null
}

/** Owner only: allows renting to the client again (stays in the history). */
export async function quitarNoDeseado(c: ClienteMin, motivo: string) {
  const { error } = await db.from('clientes_vetos').insert({ cliente_id: c.id, cliente_nombre: c.nombre, cliente_telefono: c.telefono ?? null,
    accion: 'quitar', motivo: motivo.trim() })
  return error as { code?: string; message: string } | null
}

export async function historialVetos(clienteId?: string) {
  let q = db.from('clientes_vetos').select('*').order('fecha', { ascending: false }).limit(500)
  if (clienteId) q = q.eq('cliente_id', clienteId)
  const { data } = await q
  return (data ?? []) as Veto[]
}

export const fechaVeto = (s: string) => new Date(s).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

const digitos = (t?: string | null) => (t ?? '').replace(/\D/g, '').slice(-10)
const normal = (t?: string | null) => (t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ')

/** Is this person marked "no rentar"? By id, or (for a name typed as new) by same name or phone. */
export async function clienteVetado(c: { id?: string | null; nombre?: string | null; telefono?: string | null }) {
  if (c.id) {
    const { data } = await db.from('clientes').select('*').eq('id', c.id).maybeSingle()
    return data?.no_rentar ? { nombre: data.nombre as string, motivo: (data.no_rentar_motivo ?? '') as string } : null
  }
  const { data, error } = await db.from('clientes').select('*').eq('no_rentar', true).limit(1000)
  if (error) return null // database not updated yet: nothing is marked
  const tel = digitos(c.telefono), nom = normal(c.nombre)
  const x = (data ?? []).find((v: { nombre: string; telefono: string | null }) => (nom && normal(v.nombre) === nom) || (tel.length === 10 && digitos(v.telefono) === tel))
  return x ? { nombre: x.nombre as string, motivo: (x.no_rentar_motivo ?? '') as string } : null
}

export const mensajeVetado = (v: { nombre: string; motivo: string }) =>
  `${v.nombre} está marcado como cliente no deseado${v.motivo ? ` (${v.motivo})` : ''}. No se le puede rentar; solo el dueño puede quitar la marca en Clientes.`
