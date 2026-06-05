import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, ChevronRight, X, Check, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { insertLog } from '../../lib/log'
import type { ReservaConDetalle, ReservaStatus } from '../../lib/database.types'

/* ─── Constants ─────────────────────────────────────────────── */
const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

const STATUS_LABEL: Record<ReservaStatus, string> = {
  pendiente:  'Pendiente',
  confirmada: 'Confirmada',
  entregada:  'Entregada',
  devuelta:   'Devuelta',
  cancelada:  'Cancelada',
}
const STATUS_CHIP: Record<ReservaStatus, string> = {
  pendiente:  '',
  confirmada: 'primary',
  entregada:  'primary',
  devuelta:   '',
  cancelada:  '',
}
const STATUS_DOT: Record<ReservaStatus, string> = {
  pendiente:  'warn',
  confirmada: '',
  entregada:  '',
  devuelta:   'neutral',
  cancelada:  'neutral',
}

const ALL_STATUSES: ReservaStatus[] = ['pendiente', 'confirmada', 'entregada', 'devuelta', 'cancelada']
const FILTER_TABS = ['Todas', 'Confirmadas', 'Pendientes', 'Entregadas', 'Devueltas']
const FILTER_MAP: Record<string, ReservaStatus> = {
  'Confirmadas': 'confirmada', 'Pendientes': 'pendiente',
  'Entregadas':  'entregada',  'Devueltas': 'devuelta',
}

const fmt      = (n: number) => new Intl.NumberFormat('es-MX').format(n)
const fmtDate  = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
const toInput  = (s: string) => s

function clientName(r: ReservaConDetalle) {
  return r.clientes?.nombre ?? 'Cliente desconocido'
}
function initials(r: ReservaConDetalle) {
  const n = r.clientes?.nombre ?? ''
  const parts = n.trim().split(' ')
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

/* ─── Detail / edit panel ────────────────────────────────────── */
interface PanelProps {
  res: ReservaConDetalle | null
  open: boolean
  onClose: () => void
  onSolicitudCreada: () => void
}

function ReservaPanel({ res, open, onClose, onSolicitudCreada }: PanelProps) {
  const { currentEmail } = useAuth()
  const [editing, setEditing]           = useState(false)
  const [working, setWorking]           = useState(false)
  const [successMsg, setSuccessMsg]     = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [fechaDev, setFechaDev]         = useState('')
  const [status, setStatus]             = useState<ReservaStatus>('confirmada')
  const [total, setTotal]               = useState('')
  const [nota, setNota]                 = useState('')

  useEffect(() => {
    if (res) {
      setFechaEntrega(res.fecha_entrega)
      setFechaDev(res.fecha_devolucion)
      setStatus(res.status)
      setTotal(String(res.total ?? ''))
      setEditing(false)
      setSuccessMsg('')
    }
  }, [res?.id])

  if (!open && editing) setEditing(false)

  async function handleSolicitud() {
    if (!res) return
    setWorking(true)
    const datos_nuevos: Record<string, unknown> = {}
    if (fechaEntrega !== res.fecha_entrega) datos_nuevos.fecha_entrega = fechaEntrega
    if (fechaDev !== res.fecha_devolucion)  datos_nuevos.fecha_devolucion = fechaDev
    if (status !== res.status)              datos_nuevos.status = status
    if (total !== String(res.total ?? ''))  datos_nuevos.total = Number(total) || null

    if (Object.keys(datos_nuevos).length === 0) { setWorking(false); setEditing(false); return }

    await db.from('solicitudes').insert({
      tipo: 'editar_reserva',
      tabla: 'reservas',
      registro_id: res.id,
      datos_actuales: {
        fecha_entrega: res.fecha_entrega,
        fecha_devolucion: res.fecha_devolucion,
        status: res.status,
        total: res.total,
      },
      datos_nuevos,
      solicitado_por: currentEmail,
    })

    setWorking(false)
    setEditing(false)
    setSuccessMsg('Solicitud enviada — esperando aprobación del administrador.')
    onSolicitudCreada()
  }

  async function handleCancelar() {
    if (!res) return
    setWorking(true)
    await db.from('solicitudes').insert({
      tipo: 'cancelar_reserva',
      tabla: 'reservas',
      registro_id: res.id,
      datos_actuales: { status: res.status },
      datos_nuevos: { status: 'cancelada' },
      solicitado_por: currentEmail,
    })
    setWorking(false)
    setSuccessMsg('Solicitud de cancelación enviada — esperando aprobación.')
    onSolicitudCreada()
  }

  return (
    <>
      {open && <div className="qpanel-overlay" onClick={onClose} />}
      <div className={`qpanel${open ? ' open' : ''}`}>
        {res && (
          <>
            <div className="qpanel-head">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>Reserva</div>
                <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                  {clientName(res)}
                </div>
                {res.clientes?.telefono && (
                  <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 3 }}>{res.clientes.telefono}</div>
                )}
                <div style={{ marginTop: 8 }}>
                  <span className={`chip sm ${STATUS_CHIP[res.status]}`}>
                    <span className={`dot ${STATUS_DOT[res.status]}`} />
                    {STATUS_LABEL[res.status]}
                  </span>
                </div>
              </div>
              <button onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--ink3)', flexShrink: 0 }}>
                <X size={20} />
              </button>
            </div>

            <div className="qpanel-body">
              {/* Vehicle */}
              <div className="qpanel-section">
                <div className="qpanel-section-title">Vehículo</div>
                <div style={{ background: 'var(--paper-alt)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{res.vehiculos?.modelo ?? '—'}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 2 }}>
                    {res.vehiculos?.placa}{res.vehiculos?.anio ? ` · ${res.vehiculos.anio}` : ''}
                  </div>
                </div>
              </div>

              {/* Deposit badge */}
              {(res.deposito > 0) && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
                  background: 'oklch(95% 0.06 155)', borderRadius: 9,
                  border: '1px solid oklch(82% 0.1 155)',
                }}>
                  <Check size={14} color="var(--primary)" strokeWidth={2.5} />
                  <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                    Depósito de apartado recibido
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--primary)', marginLeft: 'auto', fontWeight: 700 }}>
                    ${fmt(res.deposito)}
                  </span>
                  {res.metodo_deposito && (
                    <span style={{
                      fontSize: 11, padding: '2px 7px', borderRadius: 20, fontWeight: 600,
                      background: 'oklch(88% 0.12 155)', color: 'var(--primary)',
                    }}>
                      {res.metodo_deposito === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                    </span>
                  )}
                </div>
              )}

              {/* Dates & total */}
              {!editing ? (
                <div className="qpanel-section">
                  <div className="qpanel-section-title">Detalle</div>
                  <div className="qpanel-row">
                    <span className="lbl">Entrega</span>
                    <span className="val">{fmtDate(res.fecha_entrega)}</span>
                  </div>
                  <div className="qpanel-row">
                    <span className="lbl">Devolución</span>
                    <span className="val">{fmtDate(res.fecha_devolucion)}</span>
                  </div>
                  {res.total != null && (
                    <>
                      <div className="qpanel-row" style={{ marginTop: 8 }}>
                        <span className="lbl">Total de la renta</span>
                        <span className="val">${fmt(res.total)}</span>
                      </div>
                      {res.deposito > 0 && (
                        <div className="qpanel-row">
                          <span className="lbl" style={{ color: 'var(--primary)' }}>Depósito pagado</span>
                          <span className="val" style={{ color: 'var(--primary)' }}>-${fmt(res.deposito)}</span>
                        </div>
                      )}
                      {res.deposito > 0 && (
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          marginTop: 6, padding: '10px 12px', borderRadius: 9,
                          background: res.deposito >= res.total
                            ? 'oklch(95% 0.06 155)'
                            : 'oklch(96% 0.06 60)',
                          border: `1px solid ${res.deposito >= res.total
                            ? 'oklch(82% 0.1 155)'
                            : 'oklch(82% 0.12 60)'}`,
                        }}>
                          <span style={{
                            fontSize: 13, fontWeight: 600,
                            color: res.deposito >= res.total ? 'var(--primary)' : 'oklch(0.45 0.14 60)',
                          }}>
                            {res.deposito >= res.total ? 'Pagado en su totalidad' : 'Saldo pendiente'}
                          </span>
                          <span style={{
                            fontSize: 16, fontWeight: 800,
                            color: res.deposito >= res.total ? 'var(--primary)' : 'oklch(0.45 0.14 60)',
                          }}>
                            {res.deposito >= res.total
                              ? '✓ $0'
                              : `$${fmt(res.total - res.deposito)}`}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="qpanel-section">
                  <div className="qpanel-section-title">Editar datos</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 4 }}>Entrega</div>
                      <input type="date" className="field-i" value={toInput(fechaEntrega)} onChange={e => setFechaEntrega(e.target.value)} style={{ width: '100%', fontSize: 13 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 4 }}>Devolución</div>
                      <input type="date" className="field-i" value={toInput(fechaDev)} onChange={e => setFechaDev(e.target.value)} style={{ width: '100%', fontSize: 13 }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 4 }}>Estado</div>
                    <div className="status-btns">
                      {ALL_STATUSES.filter(s => s !== 'cancelada').map(s => (
                        <button key={s} className={`status-btn${status === s ? ` active-${s === 'confirmada' || s === 'entregada' ? 'aceptada' : s}` : ''}`}
                          onClick={() => setStatus(s)}>
                          {STATUS_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 4 }}>Total</div>
                    <div className="field-money" style={{ width: '100%' }}>
                      <span>$</span>
                      <input className="field-i" value={total} onChange={e => setTotal(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="0" />
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 4 }}>Nota (opcional)</div>
                    <input className="field-i" value={nota} onChange={e => setNota(e.target.value)} placeholder="Motivo del cambio" style={{ width: '100%', fontSize: 13 }} />
                  </div>
                </div>
              )}

              {/* Success message */}
              {successMsg && (
                <div style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary-line)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'var(--primary-dark)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Clock size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  {successMsg}
                </div>
              )}
            </div>

            <div className="qpanel-foot">
              {!editing ? (
                <>
                  {res.status !== 'cancelada' && res.status !== 'devuelta' && !successMsg && (
                    <>
                      <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setEditing(true)}>
                        Solicitar cambio
                      </button>
                      <button className="btn" style={{ width: '100%', justifyContent: 'center', color: 'var(--danger)', borderColor: 'var(--danger-line)' }}
                        onClick={handleCancelar} disabled={working}>
                        Solicitar cancelación
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditing(false)} disabled={working}>
                    Cancelar
                  </button>
                  <button className="btn primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSolicitud} disabled={working}>
                    {working
                      ? <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Enviando…</>
                      : <><Check size={15} />Enviar solicitud</>}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}

/* ─── Reservation row ────────────────────────────────────────── */
function ResRow({ r, onClick }: { r: ReservaConDetalle; onClick: () => void }) {
  const name = clientName(r)
  const ini  = initials(r)
  return (
    <button className="resrow" onClick={onClick}>
      <div className="avatar accent" style={{ width: 40, height: 40, fontSize: 14, flexShrink: 0 }}>{ini}</div>
      <div className="resrow-main">
        <div className="rr-who">{name}</div>
        <div className="rr-car">
          {r.vehiculos?.modelo ?? '—'} · <span className="mono">{r.vehiculos?.placa ?? ''}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>
          {fmtDate(r.fecha_entrega)} → {fmtDate(r.fecha_devolucion)}
        </div>
      </div>
      <div className="resrow-end">
        {r.total != null && <div className="rr-total">${fmt(r.total)}</div>}
        <span className={`chip sm ${STATUS_CHIP[r.status]}`}>
          <span className={`dot ${STATUS_DOT[r.status]}`} />
          {STATUS_LABEL[r.status]}
        </span>
      </div>
      <ChevronRight size={16} />
    </button>
  )
}

/* ─── Skeleton ───────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="resrow" style={{ opacity: 0.45, pointerEvents: 'none' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--paper-alt)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 14, width: '45%', background: 'var(--paper-alt)', borderRadius: 6 }} />
        <div style={{ height: 12, width: '65%', background: 'var(--paper-alt)', borderRadius: 6 }} />
      </div>
    </div>
  )
}

/* ─── New reservation modal ──────────────────────────────────── */
type VehicleOption   = { id: string; modelo: string; placa: string; tarifa_diaria: number | null }
type ClienteOption   = { id: string; nombre: string; telefono: string | null }

const inits = (n: string) => {
  const p = n.trim().split(' ')
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?'
}

function NuevaReservaModal({ open, onClose, onCreated, prefilledCliente }: {
  open: boolean; onClose: () => void; onCreated: () => void
  prefilledCliente?: { id: string; nombre: string; telefono: string | null } | null
}) {
  const { currentEmail } = useAuth()
  // Client search
  const [clientSearch,     setClientSearch]     = useState('')
  const [clientResults,    setClientResults]     = useState<ClienteOption[]>([])
  const [showClientDrop,   setShowClientDrop]    = useState(false)
  const [selectedCliente,  setSelectedCliente]   = useState<ClienteOption | null>(null)
  const [clienteTel,       setClienteTel]        = useState('')

  // Pre-fill from client navigation
  useEffect(() => {
    if (open && prefilledCliente) {
      setSelectedCliente(prefilledCliente)
      setClientSearch(prefilledCliente.nombre)
      setClienteTel(prefilledCliente.telefono ?? '')
    }
  }, [open, prefilledCliente?.id])

  // Dates
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [fechaDev,     setFechaDev]     = useState('')

  // Vehicles (loaded after dates)
  const [vehicles,    setVehicles]    = useState<VehicleOption[]>([])
  const [loadingVeh,  setLoadingVeh]  = useState(false)
  const [vehiculoId,  setVehiculoId]  = useState('')

  // Pricing
  const [descuento,      setDescuento]      = useState('')
  const [tieneDeposito,  setTieneDeposito]  = useState(false)
  const [deposito,       setDeposito]       = useState('')
  const [metodoDeposito, setMetodoDeposito] = useState<'efectivo' | 'transferencia'>('efectivo')

  const [working, setWorking] = useState(false)
  const [error,   setError]   = useState('')
  const today = new Date().toISOString().split('T')[0]

  // Debounced client search
  useEffect(() => {
    const s = clientSearch.trim()
    if (s.length < 2) { setClientResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await db.from('clientes').select('id, nombre, telefono')
        .ilike('nombre', `%${s}%`).limit(6)
      setClientResults(data ?? [])
      if ((data ?? []).length > 0) setShowClientDrop(true)
    }, 300)
    return () => clearTimeout(t)
  }, [clientSearch])

  // Load available vehicles when dates are set
  useEffect(() => {
    setVehiculoId('')
    setVehicles([])
    if (!fechaEntrega || !fechaDev || fechaDev <= fechaEntrega) return
    setLoadingVeh(true)
    Promise.all([
      db.from('vehiculos').select('id, modelo, placa, tarifa_diaria').neq('status', 'taller').order('modelo'),
      db.from('reservas').select('vehiculo_id')
        .in('status', ['pendiente', 'confirmada', 'entregada'])
        .lt('fecha_entrega', fechaDev)
        .gt('fecha_devolucion', fechaEntrega),
    ]).then(([vRes, rRes]) => {
      const busy = new Set((rRes.data ?? []).map((r: any) => r.vehiculo_id))
      const avail: VehicleOption[] = (vRes.data ?? []).filter((v: any) => !busy.has(v.id))
      setVehicles(avail)
      setLoadingVeh(false)
    })
  }, [fechaEntrega, fechaDev])

  function reset() {
    setClientSearch(''); setClientResults([]); setSelectedCliente(null); setClienteTel('')
    setFechaEntrega(''); setFechaDev(''); setVehicles([]); setVehiculoId('')
    setDescuento(''); setTieneDeposito(false); setDeposito(''); setMetodoDeposito('efectivo')
    setError('')
  }

  function handleClose() { reset(); onClose() }

  // Derived
  const clienteNombre  = selectedCliente ? selectedCliente.nombre : clientSearch.trim()
  const selectedVehicle = vehicles.find(v => v.id === vehiculoId)
  const dias     = (fechaEntrega && fechaDev)
    ? Math.max(0, Math.ceil((new Date(fechaDev).getTime() - new Date(fechaEntrega).getTime()) / 86400000))
    : 0
  const tarifa   = selectedVehicle?.tarifa_diaria ?? 0
  const subtotal = tarifa * dias
  const descNum  = Math.min(Math.max(0, Number(descuento) || 0), subtotal)
  const total    = subtotal - descNum
  const showCalc = dias > 0 && tarifa > 0
  const datesSet = !!(fechaEntrega && fechaDev && fechaDev > fechaEntrega)

  async function handleCreate() {
    if (!clienteNombre || !fechaEntrega || !fechaDev || !vehiculoId) return
    setWorking(true); setError('')

    let clienteId: string | null = null
    if (selectedCliente) {
      clienteId = selectedCliente.id
    } else {
      const { data: c, error: cErr } = await db.from('clientes').insert({
        nombre: clienteNombre,
        telefono: clienteTel.trim() || null,
      }).select('id').single()
      if (cErr) { setError(`Error al crear cliente: ${cErr.message}`); setWorking(false); return }
      clienteId = c?.id ?? null
    }

    const { data: reservaData, error: rErr } = await db.from('reservas').insert({
      cliente_id: clienteId,
      vehiculo_id: vehiculoId,
      fecha_entrega: fechaEntrega,
      fecha_devolucion: fechaDev,
      status: 'confirmada',
      total: showCalc ? total : null,
      deposito: tieneDeposito ? (Number(deposito) || 0) : 0,
      metodo_deposito: tieneDeposito ? metodoDeposito : null,
    }).select('id').single()
    if (rErr) { setError(`Error al crear reserva: ${rErr.message}`); setWorking(false); return }

    await db.from('vehiculos')
      .update({ status: 'reservado', cliente_actual: clienteNombre })
      .eq('id', vehiculoId)

    await insertLog({
      accion: 'crear_reserva',
      entidad: 'reservas',
      entidad_id: reservaData?.id,
      descripcion: `Nueva reserva para ${clienteNombre} — ${selectedVehicle?.modelo ?? vehiculoId}`,
      realizado_por: currentEmail,
      datos_nuevos: {
        cliente: clienteNombre,
        vehiculo: selectedVehicle?.modelo,
        fecha_entrega: fechaEntrega,
        fecha_devolucion: fechaDev,
        total: showCalc ? total : null,
      },
    })

    setWorking(false)
    reset()
    onCreated()
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div className="qpanel-overlay" onClick={handleClose} />
      <div className="qpanel open">
        <div className="qpanel-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Nueva reserva</div>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Crear reserva</div>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--ink3)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="qpanel-body">
          {/* ── Client search ── */}
          <div className="field">
            <label className="field-l">Cliente</label>
            {selectedCliente ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                border: '1.5px solid var(--primary)', borderRadius: 10,
                background: 'oklch(96% 0.04 155)',
              }}>
                <div className="avatar accent" style={{ width: 34, height: 34, fontSize: 12, flexShrink: 0 }}>
                  {inits(selectedCliente.nombre)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{selectedCliente.nombre}</div>
                  {selectedCliente.telefono && (
                    <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 1 }}>{selectedCliente.telefono}</div>
                  )}
                </div>
                <button onClick={() => { setSelectedCliente(null); setClientSearch(''); setClienteTel('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', padding: 4 }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <input
                  className="field-i"
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setShowClientDrop(true) }}
                  onFocus={() => clientResults.length > 0 && setShowClientDrop(true)}
                  onBlur={() => setTimeout(() => setShowClientDrop(false), 180)}
                  placeholder="Buscar cliente existente o nombre nuevo"
                />
                {showClientDrop && clientResults.length > 0 && (
                  <div style={{
                    background: 'var(--paper)', border: '1.5px solid var(--border)',
                    borderRadius: 10, overflow: 'hidden', marginTop: 4,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  }}>
                    {clientResults.map(c => (
                      <button key={c.id}
                        onMouseDown={() => {
                          setSelectedCliente(c)
                          setClientSearch(c.nombre)
                          setClienteTel(c.telefono ?? '')
                          setShowClientDrop(false)
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          textAlign: 'left', padding: '10px 14px', fontSize: 13.5,
                          background: 'none', border: 'none',
                          borderBottom: '1px solid var(--line)', cursor: 'pointer', color: 'var(--ink)',
                        }}>
                        <div className="avatar accent" style={{ width: 30, height: 30, fontSize: 11, flexShrink: 0 }}>
                          {inits(c.nombre)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                          {c.telefono && <div style={{ fontSize: 12, color: 'var(--ink3)' }}>{c.telefono}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Phone (only for new clients) */}
          {!selectedCliente && (
            <div className="field">
              <label className="field-l">
                Teléfono{' '}
                <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>
                  {clientSearch.trim() ? '(nuevo cliente)' : '(opcional)'}
                </span>
              </label>
              <input className="field-i" value={clienteTel}
                onChange={e => setClienteTel(e.target.value)} placeholder="+52 631..." inputMode="tel" />
            </div>
          )}

          {/* ── Dates ── */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label className="field-l">Entrega</label>
              <input type="date" className="field-i" value={fechaEntrega} min={today}
                onChange={e => {
                  setFechaEntrega(e.target.value)
                  if (!fechaDev || fechaDev <= e.target.value) setFechaDev(e.target.value)
                }} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="field-l">Devolución</label>
              <input type="date" className="field-i" value={fechaDev} min={fechaEntrega || today}
                onChange={e => setFechaDev(e.target.value)} />
            </div>
          </div>

          {/* ── Vehicles (appear after dates) ── */}
          {datesSet && (
            <div className="field">
              <label className="field-l" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Vehículo disponible para esas fechas</span>
                {vehicles.length > 0 && (
                  <span style={{ fontSize: 11.5, color: 'var(--ink3)', fontWeight: 400 }}>
                    {vehicles.length} disponible{vehicles.length !== 1 ? 's' : ''}
                  </span>
                )}
              </label>
              {loadingVeh ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: 'var(--ink3)', fontSize: 13 }}>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Verificando disponibilidad…
                </div>
              ) : vehicles.length === 0 ? (
                <div style={{ fontSize: 13.5, color: 'var(--ink3)', padding: '10px 0' }}>
                  Sin vehículos disponibles para esas fechas.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {vehicles.map(v => {
                    const sel = vehiculoId === v.id
                    return (
                      <button key={v.id} onClick={() => setVehiculoId(v.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                          border: `1.5px solid ${sel ? 'var(--primary)' : 'var(--border)'}`,
                          background: sel ? 'oklch(96% 0.04 155)' : 'var(--paper)',
                        }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{v.modelo}</div>
                          <div style={{ fontSize: 12, color: 'var(--ink3)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{v.placa}</div>
                        </div>
                        {v.tarifa_diaria != null && (
                          <div style={{ fontWeight: 700, fontSize: 15, color: sel ? 'var(--primary)' : 'var(--ink)', flexShrink: 0 }}>
                            ${fmt(v.tarifa_diaria)}
                            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink3)' }}>/día</span>
                          </div>
                        )}
                        {sel && <Check size={16} color="var(--primary)" strokeWidth={2.5} style={{ flexShrink: 0 }} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Calculation ── */}
          {showCalc && (() => {
            const depNum   = tieneDeposito ? (Number(deposito) || 0) : 0
            const saldo    = Math.max(0, total - depNum)
            return (
              <div style={{
                background: 'var(--paper-alt)', borderRadius: 12, padding: '14px 16px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink3)' }}>
                  <span>{dias} {dias === 1 ? 'día' : 'días'} × ${fmt(tarifa)}/día</span>
                  <span>${fmt(subtotal)}</span>
                </div>
                {descNum > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--warn-ink)' }}>
                    <span>Descuento</span>
                    <span>-${fmt(descNum)}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--ink)',
                  borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 2,
                }}>
                  <span>Total</span>
                  <span>${fmt(total)}</span>
                </div>
                {depNum > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--primary)' }}>
                      <span>Depósito de apartado</span>
                      <span>-${fmt(depNum)}</span>
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '9px 12px', borderRadius: 8,
                      background: saldo === 0 ? 'oklch(95% 0.06 155)' : 'oklch(96% 0.06 60)',
                      border: `1px solid ${saldo === 0 ? 'oklch(82% 0.1 155)' : 'oklch(82% 0.12 60)'}`,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: saldo === 0 ? 'var(--primary)' : 'oklch(0.45 0.14 60)' }}>
                        {saldo === 0 ? 'Liquidado' : 'Saldo pendiente al entregar'}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: saldo === 0 ? 'var(--primary)' : 'oklch(0.45 0.14 60)' }}>
                        {saldo === 0 ? '✓ $0' : `$${fmt(saldo)}`}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )
          })()}

          {/* ── Discount ── */}
          {showCalc && (
            <div className="field">
              <label className="field-l">Descuento <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>(opcional)</span></label>
              <div className="field-money" style={{ width: '100%' }}>
                <span>$</span>
                <input className="field-i" value={descuento}
                  onChange={e => setDescuento(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric" placeholder="0" />
              </div>
            </div>
          )}

          {/* ── Deposit ── */}
          <div className="field">
            <label className="field-l">Depósito de apartado</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: tieneDeposito ? 10 : 0 }}>
              {(['No', 'Sí'] as const).map(opt => {
                const active = opt === 'Sí' ? tieneDeposito : !tieneDeposito
                return (
                  <button key={opt} onClick={() => setTieneDeposito(opt === 'Sí')}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13.5, fontWeight: 600,
                      border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                      background: active ? 'oklch(96% 0.04 155)' : 'var(--paper)',
                      color: active ? 'var(--primary)' : 'var(--ink3)', cursor: 'pointer',
                    }}>{opt}</button>
                )
              })}
            </div>
            {tieneDeposito && (
              <>
                <div className="field-money" style={{ width: '100%', marginBottom: 8 }}>
                  <span>$</span>
                  <input className="field-i" value={deposito}
                    onChange={e => setDeposito(e.target.value.replace(/[^0-9]/g, ''))}
                    inputMode="numeric" placeholder="Monto del depósito" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['efectivo', 'transferencia'] as const).map(m => (
                    <button key={m} onClick={() => setMetodoDeposito(m)}
                      style={{
                        flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        border: `1.5px solid ${metodoDeposito === m ? 'var(--primary)' : 'var(--border)'}`,
                        background: metodoDeposito === m ? 'oklch(96% 0.04 155)' : 'var(--paper)',
                        color: metodoDeposito === m ? 'var(--primary)' : 'var(--ink3)', cursor: 'pointer',
                      }}>
                      {m === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'oklch(96% 0.04 25)', border: '1px solid oklch(85% 0.1 25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'oklch(40% 0.15 25)' }}>
              {error}
            </div>
          )}
        </div>

        <div className="qpanel-foot">
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleCreate}
            disabled={working || !clienteNombre || !fechaEntrega || !fechaDev || !vehiculoId}>
            {working
              ? <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Creando…</>
              : <><Check size={15} />Crear reserva</>}
          </button>
        </div>
      </div>
    </>
  )
}

/* ─── Main screen ───────────────────────────────────────────── */
export default function ReservationsScreen() {
  const [reservas, setReservas]         = useState<ReservaConDetalle[]>([])
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState('Todas')
  const [panelRes, setPanelRes]         = useState<ReservaConDetalle | null>(null)
  const [panelOpen, setPanelOpen]       = useState(false)
  const [modalOpen, setModalOpen]       = useState(false)
  const [prefilledCliente, setPrefilledCliente] = useState<{ id: string; nombre: string; telefono: string | null } | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      const clienteId = searchParams.get('clienteId')
      const nombre    = searchParams.get('nombre')
      const telefono  = searchParams.get('telefono')
      if (clienteId && nombre) {
        setPrefilledCliente({ id: clienteId, nombre, telefono: telefono || null })
      }
      setModalOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [])

  async function fetchReservas() {
    const { data, error } = await db
      .from('reservas')
      .select('*, clientes(nombre, telefono), vehiculos(modelo, placa, anio, tarifa_diaria)')
      .order('fecha_entrega', { ascending: true })
    if (error) console.error('fetchReservas:', error)
    setReservas((data as ReservaConDetalle[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchReservas() }, [])

  const filtered = reservas.filter(r =>
    filter === 'Todas' ? true : r.status === FILTER_MAP[filter]
  )

  const totals = {
    pendientes:  reservas.filter(r => r.status === 'pendiente').length,
    confirmadas: reservas.filter(r => r.status === 'confirmada').length,
    entregadas:  reservas.filter(r => r.status === 'entregada').length,
  }

  function openPanel(r: ReservaConDetalle) { setPanelRes(r); setPanelOpen(true) }
  function closePanel() { setPanelOpen(false); setTimeout(() => setPanelRes(null), 280) }

  return (
    <div className="screen">
      <div className="pagehead">
        <div>
          <div className="eyebrow">Agenda</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>Reservas</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4 }}>
            {loading ? 'Cargando…' : `${reservas.length} reservas · ${totals.confirmadas} confirmadas`}
          </p>
        </div>
        <div className="pagehead-actions">
          <button className="btn sm primary" onClick={() => setModalOpen(true)}>
            <Plus size={14} />Nueva reserva
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="statgrid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Pendientes',  value: totals.pendientes,  sub: 'por confirmar' },
          { label: 'Confirmadas', value: totals.confirmadas, sub: 'activas' },
          { label: 'En curso',    value: totals.entregadas,  sub: 'vehículo entregado' },
        ].map(s => (
          <div key={s.label} className="card statcard">
            <div className="eyebrow">{s.label}</div>
            <div className="statval mono">{s.value}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filterbar">
        {FILTER_TABS.map(tab => {
          const count = tab === 'Todas' ? reservas.length : reservas.filter(r => r.status === FILTER_MAP[tab]).length
          return (
            <button key={tab} className={`fbtn${filter === tab ? ' on' : ''}`} onClick={() => setFilter(tab)}>
              {tab} <span className="fbtn-n">{count}</span>
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="reslist" style={{ padding: '8px 0' }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--ink4)', padding: '40px 0', fontSize: 14 }}>
              {reservas.length === 0 ? 'Aún no hay reservas.' : 'Sin reservas en esta categoría.'}
            </p>
          ) : filtered.map(r => (
            <ResRow key={r.id} r={r} onClick={() => openPanel(r)} />
          ))}
        </div>
      </div>

      <ReservaPanel
        res={panelRes}
        open={panelOpen}
        onClose={closePanel}
        onSolicitudCreada={() => {}}
      />

      <NuevaReservaModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setPrefilledCliente(null) }}
        onCreated={fetchReservas}
        prefilledCliente={prefilledCliente}
      />
    </div>
  )
}
