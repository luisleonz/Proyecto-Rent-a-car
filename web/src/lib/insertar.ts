import { supabase } from './supabase'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

// Inserts base + extras; if a newer column doesn't exist yet (PGRST204, migration not run), retries with base only.
export async function insertarConExtras(tabla: string, base: Record<string, unknown>, extras: Record<string, unknown>) {
  let res = await db.from(tabla).insert({ ...base, ...extras }).select().single()
  let sinExtras = false
  if (res.error?.code === 'PGRST204') {
    res = await db.from(tabla).insert(base).select().single()
    sinExtras = true
  }
  return { data: res.data, error: res.error as { message: string } | null, sinExtras }
}

// Same idea for updates: if newer columns don't exist yet, apply only the base change.
export async function actualizarConExtras(tabla: string, id: string, base: Record<string, unknown>, extras: Record<string, unknown>) {
  let res = await db.from(tabla).update({ ...base, ...extras }).eq('id', id)
  let sinExtras = false
  if (res.error?.code === 'PGRST204') {
    res = await db.from(tabla).update(base).eq('id', id)
    sinExtras = true
  }
  return { error: res.error as { code?: string; message: string } | null, sinExtras }
}
