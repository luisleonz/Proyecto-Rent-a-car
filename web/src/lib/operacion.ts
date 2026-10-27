import { supabase } from './supabase'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia'
export type ConceptoPago = 'renta' | 'cargo_extra' | 'fianza' | 'devolucion_fianza'

export const CONCEPTO_LABEL: Record<ConceptoPago, string> = {
  renta: 'Pago de renta', cargo_extra: 'Cargo extra', fianza: 'Depósito en garantía', devolucion_fianza: 'Devolución de garantía',
}
export const METODOS: MetodoPago[] = ['efectivo', 'tarjeta', 'transferencia']
export const metodoLabel = (m?: string | null) => (m ? m[0].toUpperCase() + m.slice(1) : '—')

export type Pago = {
  id: string; reserva_id: string; monto: number; metodo: string | null; concepto: ConceptoPago
  fecha: string; notas: string | null; registrado_por: string | null
}

/** Errors caused by the latest database update not having been run yet. */
export function faltaMigracion(e: { code?: string; message?: string } | null | undefined) {
  return !!e && (['PGRST204', 'PGRST202', 'PGRST205', '42703', '42883', '42P01'].includes(e.code ?? '') || /schema cache|does not exist/i.test(e.message ?? ''))
}
export const AVISO_MIGRACION = 'Falta ejecutar en Supabase la actualización "supabase_migracion_2026_10_operacion.sql".'
export const mensajeError = (e: { code?: string; message?: string }) => (faltaMigracion(e) ? AVISO_MIGRACION : e.message ?? 'Error desconocido')

/** Records a payment; rent and extra-charge payments also raise the reservation's paid amount. */
export async function registrarPago(p: {
  reservaId: string; pagadoActual: number; monto: number; metodo: MetodoPago; concepto: ConceptoPago; notas?: string; por?: string | null
}) {
  const { error } = await db.from('pagos').insert({
    reserva_id: p.reservaId, monto: p.monto, metodo: p.metodo, concepto: p.concepto,
    notas: p.notas?.trim() || null, registrado_por: p.por ?? null,
  })
  if (error) return error as { code?: string; message: string }
  if (p.concepto === 'renta' || p.concepto === 'cargo_extra') {
    const { error: e2 } = await db.from('reservas').update({ deposito: p.pagadoActual + p.monto }).eq('id', p.reservaId)
    if (e2) return e2 as { code?: string; message: string }
  }
  return null
}

/** Recalculates every vehicle's status from its reservations (no-op until the migration runs). */
export async function sincronizarFlota() {
  try { await db.rpc('sincronizar_flota') } catch { /* migration not run yet */ }
}

export function whatsappUrl(telefono: string | null | undefined, mensaje: string) {
  const digitos = (telefono ?? '').replace(/\D/g, '')
  const numero = digitos.length === 10 ? `52${digitos}` : digitos
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}
