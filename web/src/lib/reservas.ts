import type { Reserva } from './database.types'

/** Amount still owed on a reservation (any non-cancelled one). */
export function porCobrar(r: Pick<Reserva, 'status' | 'total' | 'deposito'>) {
  if (r.status === 'cancelada') return 0
  return Math.max(0, (r.total ?? 0) - (r.deposito ?? 0))
}
