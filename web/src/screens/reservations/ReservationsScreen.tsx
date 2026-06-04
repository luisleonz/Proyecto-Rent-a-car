import { useState, useEffect } from 'react'
import { Plus, ChevronRight, X, Check, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
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

const fmt = (n: number) => new Intl.NumberFormat('es-MX').format(n)
const fmtDate = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
const toInput  = (s: string) => s  // already YYYY-MM-DD from DB

function clientName(r: ReservaConDetalle) {
  if (!r.clientes) return 'Cliente desconocido'
  return [r.clientes.nombre, r.clientes.apellido].filter(Boolean).join(' ')
}
function initials(r: ReservaConDetalle) {
  if (!r.clientes) return '?'
  return ((r.clientes.nombre[0] ?? '') + (r.clientes.apellido?.[0] ?? '')).toUpperCase() || '?'
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
                    <div className="qpanel-total-row" style={{ marginTop: 8 }}>
                      <span className="lbl">Total</span>
                      <span className="val">${fmt(res.total)}</span>
                    </div>
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
function NuevaReservaModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [vehicles, setVehicles]         = useState<{ id: string; modelo: string; placa: string; tarifa_diaria: number | null }[]>([])
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTel, setClienteTel]     = useState('')
  const [vehiculoId, setVehiculoId]     = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [fechaDev, setFechaDev]         = useState('')
  const [working, setWorking]           = useState(false)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!open) return
    db.from('vehiculos').select('id, modelo, placa, tarifa_diaria').in('status', ['disponible']).order('modelo')
      .then(({ data }: { data: { id: string; modelo: string; placa: string; tarifa_diaria: number | null }[] | null }) => {
        const list = data ?? []
        setVehicles(list)
        if (list.length) setVehiculoId(list[0].id)
      })
  }, [open])

  async function handleCreate() {
    if (!clienteNombre.trim() || !fechaEntrega || !fechaDev || !vehiculoId) return
    setWorking(true)

    const v = vehicles.find(x => x.id === vehiculoId)
    const dias = Math.max(1, Math.ceil((new Date(fechaDev).getTime() - new Date(fechaEntrega).getTime()) / 86400000))
    const total = (v?.tarifa_diaria ?? 0) * dias

    const { data: cliente } = await db.from('clientes').insert({
      nombre: clienteNombre.trim(), telefono: clienteTel.trim() || null, apellido: null, email: null,
    }).select('id').single()

    await db.from('reservas').insert({
      cliente_id: cliente?.id ?? null, vehiculo_id: vehiculoId,
      fecha_entrega: fechaEntrega, fecha_devolucion: fechaDev,
      status: 'confirmada', total,
    })

    await db.from('vehiculos').update({ status: 'reservado', cliente_actual: clienteNombre.trim() }).eq('id', vehiculoId)

    setWorking(false)
    setClienteNombre(''); setClienteTel(''); setFechaEntrega(''); setFechaDev('')
    onCreated()
    onClose()
  }

  if (!open) return null
  return (
    <>
      <div className="qpanel-overlay" onClick={onClose} />
      <div className="qpanel open">
        <div className="qpanel-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Nueva reserva</div>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Crear reserva</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--ink3)' }}>
            <X size={20} />
          </button>
        </div>
        <div className="qpanel-body">
          <div className="field">
            <label className="field-l">Nombre del cliente</label>
            <input className="field-i" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Nombre completo" />
          </div>
          <div className="field">
            <label className="field-l">Teléfono <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>(opcional)</span></label>
            <input className="field-i" value={clienteTel} onChange={e => setClienteTel(e.target.value)} placeholder="+52 55..." inputMode="tel" />
          </div>
          <div className="field">
            <label className="field-l">Vehículo</label>
            <select className="field-i" value={vehiculoId} onChange={e => setVehiculoId(e.target.value)}
              style={{ fontFamily: 'var(--font-sans)', fontSize: 14 }}>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.modelo} — {v.placa}</option>)}
              {vehicles.length === 0 && <option disabled>Sin vehículos disponibles</option>}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label className="field-l">Entrega</label>
              <input type="date" className="field-i" value={fechaEntrega} min={today}
                onChange={e => { setFechaEntrega(e.target.value); if (!fechaDev || fechaDev < e.target.value) setFechaDev(e.target.value) }} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="field-l">Devolución</label>
              <input type="date" className="field-i" value={fechaDev} min={fechaEntrega || today}
                onChange={e => setFechaDev(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="qpanel-foot">
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleCreate}
            disabled={working || !clienteNombre.trim() || !fechaEntrega || !fechaDev || !vehiculoId}>
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

  async function fetchReservas() {
    const { data } = await supabase
      .from('reservas')
      .select('*, clientes(nombre, apellido, telefono), vehiculos(modelo, placa, anio, tarifa_diaria)')
      .order('fecha_entrega', { ascending: true })
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
        onClose={() => setModalOpen(false)}
        onCreated={fetchReservas}
      />
    </div>
  )
}
