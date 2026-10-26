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
