import type { Reserva } from './database.types'

// Balance to collect at delivery. Payments after delivery aren't recorded yet, so only upcoming rentals count.
export function porCobrar(r: Pick<Reserva, 'status' | 'total' | 'deposito'>) {
  if (r.status !== 'confirmada' && r.status !== 'pendiente') return 0
  return Math.max(0, (r.total ?? 0) - (r.deposito ?? 0))
}
