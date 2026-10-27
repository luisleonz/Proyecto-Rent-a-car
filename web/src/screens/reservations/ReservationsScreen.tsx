import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, X, Check, Clock, Printer, Search, CalendarRange, AlertTriangle, CornerDownLeft, KeyRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { insertLog } from '../../lib/log'
import { EMPRESA, ivaDe, ivaEtiqueta } from '../../lib/empresa'
import { insertarConExtras } from '../../lib/insertar'
import { hoyISO, addDias, diffDias } from '../../lib/fechas'
import { porCobrar } from '../../lib/reservas'
import ReservaPanel from './ReservaPanel'
import type { ReservaConDetalle, ReservaStatus, Cobertura } from '../../lib/database.types'

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
const FILTER_TABS = ['Todas', 'Requieren acción', 'Próximas', 'En curso', 'Por cobrar', 'Devueltas', 'Canceladas']

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

/* ─── Reservation timing & money helpers ─────────────────────── */
const fmtDia = (s: string, h?: string | null) =>
  new Date(s + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) + (h ? ` ${h.slice(0, 5)}` : '')

type Alerta = 'vencida' | 'termina_hoy' | 'sale_hoy' | 'por_cobrar'

function alertasDe(r: ReservaConDetalle, hoy: string): Alerta[] {
  const a: Alerta[] = []
  if (r.status === 'entregada' && r.fecha_devolucion < hoy) a.push('vencida')
  if (r.status === 'entregada' && r.fecha_devolucion === hoy) a.push('termina_hoy')
  if ((r.status === 'confirmada' || r.status === 'pendiente') && r.fecha_entrega <= hoy) a.push('sale_hoy')
  if (porCobrar(r) > 0) a.push('por_cobrar')
  return a
}

function cuando(r: ReservaConDetalle, hoy: string): { txt: string; tone?: 'danger' | 'warn' } | null {
  if (r.status === 'entregada') {
    const d = diffDias(hoy, r.fecha_devolucion)
    if (d < 0) return { txt: `vencida hace ${-d}d`, tone: 'danger' }
    if (d === 0) return { txt: 'regresa hoy', tone: 'warn' }
    return { txt: `regresa en ${d}d` }
  }
  if (r.status === 'confirmada' || r.status === 'pendiente') {
    const d = diffDias(hoy, r.fecha_entrega)
    if (d < 0) return { txt: `debió salir hace ${-d}d`, tone: 'danger' }
    if (d === 0) return { txt: 'sale hoy', tone: 'warn' }
    return { txt: `sale en ${d}d` }
  }
  return null
}

/* ─── Reservation row ────────────────────────────────────────── */
function ResRow({ r, hoy, onClick }: { r: ReservaConDetalle; hoy: string; onClick: () => void }) {
  const c = cuando(r, hoy)
  const saldo = porCobrar(r)
  return (
    <button className={`rs-row${alertasDe(r, hoy).includes('vencida') ? ' late' : ''}`} onClick={onClick}>
      <div className="rs-status">
        <span className={`chip sm ${STATUS_CHIP[r.status]}`}>
          <span className={`dot ${STATUS_DOT[r.status]}`} />{STATUS_LABEL[r.status]}
        </span>
        {c && <span className={`rs-when${c.tone ? ` ${c.tone}` : ''}`}><Clock size={11} />{c.txt}</span>}
      </div>
      <div className="rs-folio mono">{r.folio != null ? `#${r.folio}` : ''}</div>
      <div className="rs-who">
        <div className="avatar accent" style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>{initials(r)}</div>
        <div style={{ minWidth: 0 }}>
          <div className="rs-name">{clientName(r)}</div>
          {r.clientes?.telefono && <div className="rs-sub">{r.clientes.telefono}</div>}
        </div>
      </div>
      <div className="rs-car">
        <div className="rs-name">{r.vehiculos?.modelo ?? '—'}</div>
        {r.vehiculos?.placa && <span className="rs-plate mono">{r.vehiculos.placa}</span>}
      </div>
      <div className="rs-dates">
        <div className="rs-sub">{fmtDia(r.fecha_entrega, r.hora_entrega)}</div>
        <div className="rs-name">→ {fmtDia(r.fecha_devolucion, r.hora_devolucion)}</div>
      </div>
      <div className="rs-money">
        <div className="rs-name">{r.total != null ? `$${fmt(r.total)}` : '—'}</div>
        {saldo > 0
          ? <div className="rs-due">Por cobrar ${fmt(saldo)}</div>
          : r.total != null && (r.deposito ?? 0) >= r.total ? <div className="rs-paid">Pagado</div> : null}
      </div>
      <ChevronRight size={16} className="rs-chev" />
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
type VehicleOption   = { id: string; modelo: string; placa: string; tarifa_diaria: number | null; fianza?: number | null; returnsToday?: boolean }
type ClienteOption   = { id: string; nombre: string; telefono: string | null }

function Opt({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        flex: 1, padding: '8px 6px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        border: `1.5px solid ${active ? 'var(--primary)' : 'var(--card-line)'}`,
        background: active ? 'var(--primary-soft)' : 'var(--paper)',
        color: active ? 'var(--primary)' : 'var(--ink3)',
      }}>
      {children}
    </button>
  )
}

const inits = (n: string) => {
  const p = n.trim().split(' ')
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?'
}

function NuevaReservaModal({ open, onClose, onCreated, prefilledCliente, prefilledVehiculo, prefilledFecha }: {
  open: boolean; onClose: () => void; onCreated: () => void
  prefilledCliente?: { id: string; nombre: string; telefono: string | null } | null
  prefilledVehiculo?: { id: string } | null
  prefilledFecha?: string | null
}) {
  const { currentEmail } = useAuth()
  const navigate = useNavigate()
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

  // Contract details
  const [horaEntrega,  setHoraEntrega]  = useState('10:00')
  const [horaDev,      setHoraDev]      = useState('10:00')
  const [lugarEntrega, setLugarEntrega] = useState(EMPRESA.lugarEntregaPredeterminado)
  const [lugarDev,     setLugarDev]     = useState(EMPRESA.lugarEntregaPredeterminado)
  const [cobertura,    setCobertura]    = useState<Cobertura>('basica')
  const [ceroDiario,   setCeroDiario]   = useState('')
  const [fianza,       setFianza]       = useState('')
  const [metodoFianza, setMetodoFianza] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo')
  const [conIva,       setConIva]       = useState(true)

  const [working, setWorking] = useState(false)
  const [error,   setError]   = useState('')
  const [created, setCreated] = useState<{ id: string; aviso: string } | null>(null)
  const [alertasCliente, setAlertasCliente] = useState<string[]>([])

  // Warn about an expired license or money owed from earlier rentals
  useEffect(() => {
    setAlertasCliente([])
    if (!selectedCliente) return
    Promise.all([
      db.from('clientes').select('*').eq('id', selectedCliente.id).single(),
      db.from('reservas').select('total, deposito, status, folio').eq('cliente_id', selectedCliente.id).neq('status', 'cancelada'),
    ]).then(([c, r]: [{ data: { licencia_vence?: string | null; licencia?: string | null } | null }, { data: { total: number | null; deposito: number; status: string; folio: number | null }[] | null }]) => {
      const a: string[] = []
      const lic = c.data?.licencia_vence
      if (lic && lic < (fechaDev || today)) a.push(`Su licencia ${lic < today ? 'está vencida' : 'vence antes de la devolución'} (${new Date(lic + 'T12:00:00').toLocaleDateString('es-MX')}).`)
      if (c.data && !c.data.licencia) a.push('No tiene número de licencia registrado.')
      const deudas = (r.data ?? []).filter(x => x.status === 'devuelta' && (x.total ?? 0) > (x.deposito ?? 0))
      if (deudas.length) a.push(`Debe $${fmt(deudas.reduce((t, x) => t + (x.total ?? 0) - (x.deposito ?? 0), 0))} de rentas anteriores (${deudas.map(x => `#${x.folio ?? '?'}`).join(', ')}).`)
      setAlertasCliente(a)
    })
  }, [selectedCliente?.id, fechaDev])
  const today = hoyISO()

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
      db.from('vehiculos').select('*').neq('status', 'taller').order('modelo'),
      db.from('reservas').select('vehiculo_id')
        .in('status', ['pendiente', 'confirmada', 'entregada'])
        .lt('fecha_entrega', fechaDev)
        .gt('fecha_devolucion', fechaEntrega),
      db.from('reservas').select('vehiculo_id')
        .in('status', ['confirmada', 'entregada'])
        .eq('fecha_devolucion', fechaEntrega),
    ]).then(([vRes, rRes, rtRes]) => {
      const busy       = new Set((rRes.data  ?? []).map((r: any) => r.vehiculo_id))
      const returning  = new Set((rtRes.data ?? []).map((r: any) => r.vehiculo_id))
      const avail: VehicleOption[] = (vRes.data ?? [])
        .filter((v: any) => !busy.has(v.id))
        .map((v: any) => ({ ...v, returnsToday: returning.has(v.id) }))
      setVehicles(avail)
      if (prefilledVehiculo && avail.find(v => v.id === prefilledVehiculo.id)) {
        setVehiculoId(prefilledVehiculo.id)
      }
      setLoadingVeh(false)
    })
  }, [fechaEntrega, fechaDev])

  function reset() {
    setClientSearch(''); setClientResults([]); setSelectedCliente(null); setClienteTel('')
    setFechaEntrega(''); setFechaDev(''); setVehicles([]); setVehiculoId('')
    setDescuento(''); setTieneDeposito(false); setDeposito(''); setMetodoDeposito('efectivo')
    setHoraEntrega('10:00'); setHoraDev('10:00')
    setLugarEntrega(EMPRESA.lugarEntregaPredeterminado); setLugarDev(EMPRESA.lugarEntregaPredeterminado)
    setCobertura('basica'); setCeroDiario(''); setFianza(''); setMetodoFianza('efectivo'); setConIva(true)
    setError(''); setCreated(null)
  }

  useEffect(() => {
    if (open && prefilledFecha) {
      setFechaEntrega(prefilledFecha)
      setFechaDev(addDias(prefilledFecha, 1))
    }
  }, [open, prefilledFecha])

  // Suggest the vehicle's usual security deposit when one is picked
  useEffect(() => {
    const f = vehicles.find(v => v.id === vehiculoId)?.fianza
    if (f) setFianza(String(f))
  }, [vehiculoId])

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
  const ceroCosto = cobertura === 'cero_deducible' ? (Number(ceroDiario) || 0) * dias : 0
  const ivaMonto = conIva ? ivaDe(subtotal - descNum + ceroCosto) : 0
  const total    = subtotal - descNum + ceroCosto + ivaMonto
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

    const base = {
      cliente_id: clienteId,
      vehiculo_id: vehiculoId,
      fecha_entrega: fechaEntrega,
      fecha_devolucion: fechaDev,
      status: 'confirmada',
      total: showCalc ? total : null,
      deposito: tieneDeposito ? (Number(deposito) || 0) : 0,
      metodo_deposito: tieneDeposito ? metodoDeposito : null,
    }
    const fianzaNum = Number(fianza) || 0
    const contrato = {
      hora_entrega: horaEntrega || null,
      hora_devolucion: horaDev || null,
      lugar_entrega: lugarEntrega.trim() || null,
      lugar_devolucion: lugarDev.trim() || null,
      descuento: descNum,
      cobertura,
      cobertura_costo: ceroCosto,
      iva: ivaMonto,
      fianza: fianzaNum,
      metodo_fianza: fianzaNum > 0 ? metodoFianza : null,
    }
    const { data: reservaData, error: rErr, sinExtras } = await insertarConExtras('reservas', base, contrato)
    const aviso = sinExtras
      ? 'La reserva se guardó, pero sin hora, cobertura, IVA ni fianza: falta ejecutar la migración SQL más reciente en Supabase.'
      : ''
    if (rErr) { setError(`Error al crear reserva: ${rErr.message}`); setWorking(false); return }

    // Booking advance goes into the payments history too
    if (base.deposito > 0) {
      await db.from('pagos').insert({ reserva_id: reservaData.id, monto: base.deposito, metodo: base.metodo_deposito,
        concepto: 'renta', notas: 'Anticipo al reservar', registrado_por: currentEmail }).then(() => null, () => null)
    }
    // Vehicle status is recalculated by the database from its reservations
    const { error: syncErr } = await db.rpc('sincronizar_vehiculo', { vid: vehiculoId })
    if (syncErr) await db.from('vehiculos').update({ status: 'reservado', cliente_actual: clienteNombre }).eq('id', vehiculoId)

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
        cobertura,
      },
    })

    setWorking(false)
    onCreated()
    setCreated({ id: reservaData.id, aviso })
  }

  if (!open) return null

  if (created) return (
    <>
      <div className="qpanel-overlay" onClick={handleClose} />
      <div className="qpanel open">
        <div className="qpanel-body" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={28} color="var(--primary)" strokeWidth={2.6} />
          </div>
          <div style={{ fontSize: 22, fontFamily: 'var(--font-display)' }}>Reserva creada</div>
          <div style={{ fontSize: 14, color: 'var(--ink2)', maxWidth: 320 }}>
            {clienteNombre} · {selectedVehicle?.modelo}<br />
            Imprime el contrato, el anexo y la póliza para que el cliente los firme.
          </div>
          {created.aviso && (
            <div style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn-line)', color: 'var(--warn-ink)', borderRadius: 10, padding: '10px 14px', fontSize: 13, textAlign: 'left' }}>
              {created.aviso}
            </div>
          )}
        </div>
        <div className="qpanel-foot">
          <button className="btn primary" style={{ width: '100%' }} onClick={() => navigate(`/imprimir/contrato/${created.id}`)}>
            <Printer size={15} />Imprimir contrato
          </button>
          <button className="btn" style={{ width: '100%' }} onClick={handleClose}>Listo</button>
        </div>
      </div>
    </>
  )

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

          {alertasCliente.length > 0 && (
            <div style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn-line)', color: 'var(--warn-ink)', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {alertasCliente.map(t => <span key={t}>⚠ {t}</span>)}
            </div>
          )}

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
          <div style={{ display: 'flex', gap: 10, marginTop: -8 }}>
            <div className="field" style={{ flex: 1 }}>
              <label className="field-l">Hora de entrega</label>
              <input type="time" className="field-i" value={horaEntrega} onChange={e => setHoraEntrega(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="field-l">Hora de devolución</label>
              <input type="time" className="field-i" value={horaDev} onChange={e => setHoraDev(e.target.value)} />
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
                        {v.returnsToday && (
                          <div style={{
                            fontSize: 11, fontWeight: 600, color: 'oklch(55% 0.14 60)',
                            background: 'oklch(96% 0.06 60)', border: '1px solid oklch(82% 0.12 60)',
                            borderRadius: 6, padding: '2px 7px', flexShrink: 0, whiteSpace: 'nowrap',
                          }}>
                            Devuelto hoy
                          </div>
                        )}
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
                {ceroCosto > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink3)' }}>
                    <span>Cero deducible · {dias} × ${fmt(Number(ceroDiario) || 0)}</span>
                    <span>+${fmt(ceroCosto)}</span>
                  </div>
                )}
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--ink3)', cursor: 'pointer' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={conIva} onChange={e => setConIva(e.target.checked)} />{ivaEtiqueta}
                  </span>
                  <span>{conIva ? `+$${fmt(ivaMonto)}` : 'sin IVA'}</span>
                </label>
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

          {/* ── Coverage ── */}
          <div className="field">
            <label className="field-l">Cobertura</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Opt active={cobertura === 'basica'} onClick={() => setCobertura('basica')}>Básica (con deducible)</Opt>
              <Opt active={cobertura === 'cero_deducible'} onClick={() => setCobertura('cero_deducible')}>Cero deducible</Opt>
            </div>
            {cobertura === 'cero_deducible' && (
              <div className="field-money" style={{ width: '100%', marginTop: 8 }}>
                <span>$</span>
                <input className="field-i" value={ceroDiario} inputMode="numeric" placeholder="Costo por día"
                  onChange={e => setCeroDiario(e.target.value.replace(/[^0-9]/g, ''))} />
                <span style={{ fontSize: 12, color: 'var(--ink3)', paddingRight: 10 }}>/día</span>
              </div>
            )}
          </div>

          {/* ── Security deposit (cláusula OCTAVA) ── */}
          <div className="field">
            <label className="field-l">
              Depósito en garantía <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>(se devuelve al regresar el auto)</span>
            </label>
            <div className="field-money" style={{ width: '100%', marginBottom: 8 }}>
              <span>$</span>
              <input className="field-i" value={fianza} inputMode="numeric" placeholder="0"
                onChange={e => setFianza(e.target.value.replace(/[^0-9]/g, ''))} />
            </div>
            {Number(fianza) > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {(['efectivo', 'tarjeta', 'transferencia'] as const).map(m => (
                  <Opt key={m} active={metodoFianza === m} onClick={() => setMetodoFianza(m)}>
                    {m[0].toUpperCase() + m.slice(1)}
                  </Opt>
                ))}
              </div>
            )}
          </div>

          {/* ── Places ── */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label className="field-l">Lugar de entrega</label>
              <input className="field-i" value={lugarEntrega}
                onChange={e => { if (lugarDev === lugarEntrega) setLugarDev(e.target.value); setLugarEntrega(e.target.value) }} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="field-l">Lugar de devolución</label>
              <input className="field-i" value={lugarDev} onChange={e => setLugarDev(e.target.value)} />
            </div>
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
  const [prefilledVehiculo, setPrefilledVehiculo] = useState<{ id: string } | null>(null)
  const [prefilledFecha, setPrefilledFecha] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      const clienteId  = searchParams.get('clienteId')
      const nombre     = searchParams.get('nombre')
      const telefono   = searchParams.get('telefono')
      const vehiculoId = searchParams.get('vehiculoId')
      if (clienteId && nombre) {
        setPrefilledCliente({ id: clienteId, nombre, telefono: telefono || null })
      }
      if (vehiculoId) {
        setPrefilledVehiculo({ id: vehiculoId })
      }
      setPrefilledFecha(searchParams.get('fecha'))
      setModalOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [])

  // Open a specific reservation (e.g. clicked from the fleet calendar)
  useEffect(() => {
    const id = searchParams.get('res')
    if (!id || reservas.length === 0) return
    const r = reservas.find(x => x.id === id)
    if (r) openPanel(r)
    setSearchParams({}, { replace: true })
  }, [reservas])

  async function fetchReservas() {
    const { data, error } = await db
      .from('reservas')
      .select('*, clientes(nombre, telefono), vehiculos(modelo, placa, anio, tarifa_diaria)')
      .order('fecha_entrega', { ascending: true })
    if (error) console.error('fetchReservas:', error)
    const lista = (data as ReservaConDetalle[]) ?? []
    setReservas(lista)
    setPanelRes(p => (p ? lista.find(r => r.id === p.id) ?? p : p))
    setLoading(false)
  }

  useEffect(() => { fetchReservas() }, [])

  const hoy = hoyISO()
  const mes = hoy.slice(0, 7)
  const conAlerta = (a: Alerta) => reservas.filter(r => alertasDe(r, hoy).includes(a))
  const alertas = {
    vencida:     conAlerta('vencida'),
    termina_hoy: conAlerta('termina_hoy'),
    sale_hoy:    conAlerta('sale_hoy'),
    por_cobrar:  conAlerta('por_cobrar'),
  }
  const delMes = reservas.filter(r => r.status !== 'cancelada' && r.fecha_entrega.startsWith(mes))
  const montoMes = delMes.reduce((s, r) => s + (r.total ?? 0), 0)
  const montoPorCobrar = alertas.por_cobrar.reduce((s, r) => s + porCobrar(r), 0)

  const matches = (tab: string, r: ReservaConDetalle) => {
    switch (tab) {
      case 'Requieren acción': return alertasDe(r, hoy).some(a => a !== 'por_cobrar')
      case 'Próximas':   return r.status === 'confirmada' || r.status === 'pendiente'
      case 'En curso':   return r.status === 'entregada'
      case 'Por cobrar': return porCobrar(r) > 0
      case 'Devueltas':  return r.status === 'devuelta'
      case 'Canceladas': return r.status === 'cancelada'
      default:           return true
    }
  }
  const qn = q.trim().toLowerCase()
  const filtered = reservas
    .filter(r => matches(filter, r))
    .filter(r => !qn || [r.clientes?.nombre, r.clientes?.telefono, r.vehiculos?.modelo, r.vehiculos?.placa, r.folio != null ? `#${r.folio}` : '', String(r.folio ?? '')]
      .some(x => x?.toLowerCase().includes(qn)))
    .sort((a, b) => {
      const pasado = filter === 'Devueltas' || filter === 'Canceladas'
      return pasado ? b.fecha_entrega.localeCompare(a.fecha_entrega) : a.fecha_entrega.localeCompare(b.fecha_entrega)
    })

  function openPanel(r: ReservaConDetalle) { setPanelRes(r); setPanelOpen(true) }
  function closePanel() { setPanelOpen(false); setTimeout(() => setPanelRes(null), 280) }

  return (
    <div className="screen">
      <div className="pagehead">
        <div>
          <div className="eyebrow">Agenda</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>Reservas</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4 }}>
            {loading ? 'Cargando…' : `$${fmt(montoMes)} reservado este mes · ${delMes.length} reservas`}
          </p>
        </div>
        <div className="pagehead-actions">
          <button className="btn sm" onClick={() => navigate('/app/calendario')}>
            <CalendarRange size={14} />Calendario
          </button>
          <button className="btn sm primary" onClick={() => setModalOpen(true)}>
            <Plus size={14} />Nueva reserva
          </button>
        </div>
      </div>

      {/* Alerts */}
      {!loading && (
        <div className="rs-alerts">
          {alertas.vencida.length > 0 && (
            <button className="rs-alert danger" onClick={() => setFilter('Requieren acción')}>
              <AlertTriangle size={14} />{alertas.vencida.length} vencida{alertas.vencida.length > 1 ? 's' : ''} — llamar ahora
            </button>
          )}
          {alertas.termina_hoy.length > 0 && (
            <button className="rs-alert warn" onClick={() => setFilter('Requieren acción')}>
              <CornerDownLeft size={14} />{alertas.termina_hoy.length} regresa{alertas.termina_hoy.length > 1 ? 'n' : ''} hoy
            </button>
          )}
          {alertas.sale_hoy.length > 0 && (
            <button className="rs-alert warn" onClick={() => setFilter('Requieren acción')}>
              <KeyRound size={14} />{alertas.sale_hoy.length} por entregar
            </button>
          )}
          {alertas.por_cobrar.length > 0 && (
            <button className="rs-alert" onClick={() => setFilter('Por cobrar')}>
              {alertas.por_cobrar.length} con saldo por cobrar · ${fmt(montoPorCobrar)}
            </button>
          )}
          {alertas.vencida.length + alertas.termina_hoy.length + alertas.sale_hoy.length === 0 && (
            <span className="rs-alert ok"><Check size={14} />Nada urgente hoy</span>
          )}
        </div>
      )}

      {/* Search + filters */}
      <div className="rs-tools">
        <label className="rs-search">
          <Search size={15} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar nombre, #contrato, placa o teléfono" />
        </label>
        <div className="filterbar" style={{ margin: 0 }}>
          {FILTER_TABS.map(tab => (
            <button key={tab} className={`fbtn${filter === tab ? ' on' : ''}`} onClick={() => setFilter(tab)}>
              {tab} <span className="fbtn-n">{reservas.filter(r => matches(tab, r)).length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="rs-list">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--ink4)', padding: '40px 0', fontSize: 14 }}>
              {reservas.length === 0 ? 'Aún no hay reservas.' : 'Sin reservas que coincidan.'}
            </p>
          ) : filtered.map(r => (
            <ResRow key={r.id} r={r} hoy={hoy} onClick={() => openPanel(r)} />
          ))}
        </div>
      </div>
      <style>{RS_CSS}</style>

      <ReservaPanel res={panelRes} open={panelOpen} onClose={closePanel} onChanged={fetchReservas} />

      <NuevaReservaModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setPrefilledCliente(null); setPrefilledVehiculo(null); setPrefilledFecha(null) }}
        onCreated={fetchReservas}
        prefilledCliente={prefilledCliente}
        prefilledVehiculo={prefilledVehiculo}
        prefilledFecha={prefilledFecha}
      />
    </div>
  )
}

const RS_CSS = `
.rs-alerts { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.rs-alert { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 999px; font: inherit; font-size: 12.5px; font-weight: 600;
  border: 1px solid var(--card-line); background: var(--card); color: var(--ink2); cursor: pointer; }
.rs-alert.danger { background: var(--danger-soft); border-color: var(--danger-line); color: var(--danger-ink); }
.rs-alert.warn { background: var(--warn-soft); border-color: var(--warn-line); color: var(--warn-ink); }
.rs-alert.ok { background: var(--primary-soft); border-color: var(--primary-line); color: var(--primary-dark); cursor: default; }
.rs-tools { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
.rs-search { display: flex; align-items: center; gap: 8px; background: var(--card); border: 1px solid var(--card-line); border-radius: 11px; padding: 0 12px; color: var(--ink3); }
.rs-search input { flex: 1; border: 0; outline: none; background: none; font: inherit; font-size: 14px; padding: 10px 0; color: var(--ink); min-width: 0; }
.rs-list { display: flex; flex-direction: column; }
.rs-row { display: grid; grid-template-columns: 150px 52px minmax(0, 1.3fr) minmax(0, 1fr) 128px 118px 16px; align-items: center; gap: 12px;
  width: 100%; text-align: left; padding: 12px 16px; border: 0; border-bottom: 1px solid var(--hairline); background: var(--card); font: inherit; color: inherit; cursor: pointer; }
.rs-row:last-child { border-bottom: 0; }
.rs-row:hover { background: var(--paper-alt); }
.rs-row.late { box-shadow: inset 3px 0 0 var(--danger); }
.rs-status { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.rs-when { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--ink3); }
.rs-when.warn { color: var(--warn-ink); font-weight: 600; }
.rs-when.danger { color: var(--danger-ink); font-weight: 700; }
.rs-folio { font-size: 13px; font-weight: 700; color: var(--ink2); }
.rs-who { display: flex; align-items: center; gap: 10px; min-width: 0; }
.rs-name { font-size: 13.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rs-sub { font-size: 12px; color: var(--ink3); white-space: nowrap; }
.rs-car { min-width: 0; }
.rs-plate { display: inline-block; margin-top: 3px; font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 5px; background: oklch(0.93 0.09 95); color: var(--ink); }
.rs-money { text-align: right; }
.rs-due { font-size: 11.5px; font-weight: 600; color: var(--warn-ink); }
.rs-paid { font-size: 11.5px; font-weight: 600; color: var(--primary); }
.rs-chev { color: var(--ink4); }
@container app (max-width: 900px) {
  .rs-row { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "who money" "car dates" "status folio"; row-gap: 6px; }
  .rs-who { grid-area: who; } .rs-money { grid-area: money; } .rs-car { grid-area: car; display: flex; gap: 8px; align-items: center; }
  .rs-car .rs-plate { margin-top: 0; } .rs-dates { grid-area: dates; text-align: right; }
  .rs-status { grid-area: status; flex-direction: row; align-items: center; gap: 8px; } .rs-folio { grid-area: folio; text-align: right; }
  .rs-chev { display: none; }
}
`
