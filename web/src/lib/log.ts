import { supabase } from './supabase'

const db = supabase as any

export async function insertLog(params: {
  accion: string
  entidad?: string
  entidad_id?: string
  descripcion: string
  realizado_por?: string | null
  datos_anteriores?: Record<string, unknown> | null
  datos_nuevos?: Record<string, unknown> | null
}) {
  try {
    await db.from('logs').insert({
      accion:           params.accion,
      entidad:          params.entidad          ?? null,
      entidad_id:       params.entidad_id       ?? null,
      descripcion:      params.descripcion,
      realizado_por:    params.realizado_por    ?? null,
      datos_anteriores: params.datos_anteriores ?? null,
      datos_nuevos:     params.datos_nuevos     ?? null,
    })
  } catch {
    // Log failures never break the main flow
  }
}
