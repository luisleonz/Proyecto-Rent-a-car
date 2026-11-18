import { useEffect, useState } from 'react'
import { Repeat, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { insertLog } from '../../lib/log'
import { ivaDe } from '../../lib/empresa'
import { diffDias } from '../../lib/fechas'
import { mensajeError } from '../../lib/operacion'
import type { ReservaConDetalle } from '../../lib/database.types'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any
const fmt = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 2 })
type Opcion = { id: string; modelo: string; placa: string; anio: number | null; tarifa_diaria: number | null; status: string }

/** Swap the car of a reservation for another one free on the same dates; the price follows the new rate unless kept. */
export default function CambiarVehiculo({ res, onHecho, onCancelar }: {
  res: ReservaConDetalle; onHecho: (mensaje: string) => void; onCancelar: () => void
}) {
  const { currentEmail } = useAuth()
  const [opciones, setOpciones] = useState<Opcion[] | null>(null)
  const [elegido, setElegido] = useState<Opcion | null>(null)
  const [mantener, setMantener] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const dias = Math.max(1, diffDias(res.fecha_entrega, res.fecha_devolucion))
  const tarifaActual = res.vehiculos?.tarifa_diaria ?? 0

  useEffect(() => {
    Promise.all([
      db.from('vehiculos').select('id, modelo, placa, anio, tarifa_diaria, status').neq('status', 'taller').neq('id', res.vehiculo_id).order('modelo'),
      db.from('reservas').select('vehiculo_id').in('status', ['pendiente', 'confirmada', 'entregada']).neq('id', res.id)
        .lt('fecha_entrega', res.fecha_devolucion).gt('fecha_devolucion', res.fecha_entrega),
    ]).then(([v, r]: [{ data: Opcion[] | null }, { data: { vehiculo_id: string }[] | null }]) => {
      const ocupados = new Set((r.data ?? []).map(x => x.vehiculo_id))
      setOpciones((v.data ?? []).filter(x => !ocupados.has(x.id)))
    })
  }, [res.id])

  // Price change = rate difference × days, plus its VAT when the booking has VAT
  const calcular = (o: Opcion) => {
    const base = ((o.tarifa_diaria ?? 0) - tarifaActual) * dias
    const iva = (res.iva ?? 0) > 0 ? ivaDe(Math.abs(base)) * Math.sign(base) : 0
    return { base, iva, dif: base + iva }
  }

  async function confirmar() {
    if (!elegido) return
    if (!motivo.trim()) { setError('Falta el motivo del cambio (ej. el auto no regresó a tiempo, se fue al taller).'); return }
    const { dif, iva } = calcular(elegido)
    const recalcula = !mantener && dif !== 0 && res.total != null
    const cambios: Record<string, unknown> = { vehiculo_id: elegido.id }
    if (recalcula) {
      cambios.total = Math.round(((res.total ?? 0) + dif) * 100) / 100
      if (iva) cambios.iva = Math.round(((res.iva ?? 0) + iva) * 100) / 100
    }
    setGuardando(true); setError('')
    const { error: e } = await db.from('reservas').update(cambios).eq('id', res.id)
    if (e) { setError(mensajeError(e)); setGuardando(false); return }
    // Both cars recalculate their availability (the old one is freed, the new one is reserved/rented)
    await Promise.all([res.vehiculo_id, elegido.id].map(id => id && db.rpc('sincronizar_vehiculo', { vid: id }).then(() => null, () => null)))
    const antes = res.vehiculos ? `${res.vehiculos.modelo} (${res.vehiculos.placa})` : 'otro vehículo'
    await insertLog({ accion: 'cambiar_vehiculo', entidad: 'reservas', entidad_id: res.id, realizado_por: currentEmail,
      descripcion: `Reserva #${res.folio ?? '—'}: ${antes} → ${elegido.modelo} (${elegido.placa})${recalcula ? ` · total $${fmt(res.total ?? 0)} → $${fmt(cambios.total as number)}` : ''} · ${motivo.trim()}`,
      datos_nuevos: cambios })
    setGuardando(false)
    onHecho(`Vehículo cambiado a ${elegido.modelo} (${elegido.placa}).${recalcula ? ` Nuevo total: $${fmt(cambios.total as number)}.` : ' El precio no cambió.'}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--paper-alt)', borderRadius: 10, padding: '12px 14px', border: '1.5px solid var(--primary-line)' }}>
      <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Repeat size={15} />Cambiar vehículo</div>
      <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>
        Ahora: {res.vehiculos?.modelo} ({res.vehiculos?.placa}) · ${fmt(tarifaActual)}/día · {dias} {dias === 1 ? 'día' : 'días'}. Solo se muestran autos libres en estas fechas.
      </div>
      {opciones == null ? <div className="spinner" style={{ width: 18, height: 18 }} />
        : opciones.length === 0 ? <div style={{ fontSize: 13, color: 'var(--danger-ink)' }}>No hay otro auto libre en estas fechas.</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {opciones.map(o => {
              const { dif } = calcular(o)
              const sel = elegido?.id === o.id
              return (
                <button key={o.id} type="button" className="btn sm" onClick={() => { setElegido(o); setMantener(false); setError('') }}
                  style={{ justifyContent: 'space-between', textAlign: 'left', ...(sel ? { borderColor: 'var(--primary)', background: 'var(--primary-soft)' } : {}) }}>
                  <span>{sel && <Check size={13} style={{ verticalAlign: -2 }} />} {o.modelo} <span className="mono" style={{ color: 'var(--ink3)' }}>{o.placa}</span></span>
                  <span style={{ color: dif > 0 ? 'var(--warn-ink)' : dif < 0 ? 'var(--primary-dark)' : 'var(--ink3)' }}>
                    ${fmt(o.tarifa_diaria ?? 0)}/día · {dif === 0 ? 'mismo precio' : `${dif > 0 ? '+' : '−'}$${fmt(Math.abs(dif))}`}
                  </span>
                </button>
              )
            })}
          </div>}
      {elegido && (() => {
        const { dif } = calcular(elegido)
        return (
          <>
            {dif !== 0 && res.total != null && (
              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>Total: <b>${fmt(res.total)}</b> → <b>${fmt(mantener ? res.total : res.total + dif)}</b>
                  {(res.iva ?? 0) > 0 && !mantener && <span style={{ color: 'var(--ink3)' }}> (incluye IVA)</span>}</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={mantener} onChange={e => setMantener(e.target.checked)} />
                  Mantener el precio actual (por ejemplo, si el cambio es por causa del negocio)
                </label>
              </div>
            )}
            <input className="field-i" value={motivo} onChange={e => { setMotivo(e.target.value); setError('') }}
              placeholder="Motivo (ej. el auto no regresó a tiempo, se fue al taller)" aria-label="Motivo del cambio de vehículo" />
          </>
        )
      })()}
      {error && <div role="alert" style={{ fontSize: 12.5, color: 'var(--danger-ink)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" style={{ flex: 1 }} onClick={onCancelar}>Cancelar</button>
        <button className="btn primary" style={{ flex: 2 }} onClick={confirmar} disabled={!elegido || guardando}>{guardando ? 'Guardando…' : 'Confirmar cambio'}</button>
      </div>
    </div>
  )
}
