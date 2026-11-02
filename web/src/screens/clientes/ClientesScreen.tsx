import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Plus, Phone, Mail, CreditCard, MapPin, X, Check, ChevronRight, Pencil, Fingerprint, Cake, LifeBuoy, StickyNote, Ban, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { insertLog } from '../../lib/log'
import { insertarConExtras } from '../../lib/insertar'
import { hoyISO } from '../../lib/fechas'
import { mensajeError } from '../../lib/operacion'
import { identificador } from '../../lib/usuarios'
import { marcarNoDeseado, quitarNoDeseado, historialVetos, fechaVeto, type Veto } from '../../lib/noDeseados'
import MotivoNoDeseado from '../../components/MotivoNoDeseado'

const db = supabase as any

/* ─── Types ──────────────────────────────────────────────────── */
type Cliente = {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  licencia: string | null
  direccion: string | null
  identificacion?: string | null
  licencia_vence?: string | null
  fecha_nacimiento?: string | null
  nacionalidad?: string | null
  contacto_emergencia?: string | null
  contacto_emergencia_tel?: string | null
  notas?: string | null
  no_rentar?: boolean
  no_rentar_motivo?: string | null
  no_rentar_desde?: string | null
  no_rentar_por?: string | null
  created_at: string
}

type ReservaResumen = {
  id: string
  fecha_entrega: string
  fecha_devolucion: string
  status: string
  total: number | null
  vehiculos: { modelo: string; placa: string } | null
}

const EXTRAS = ['identificacion', 'licencia_vence', 'fecha_nacimiento', 'nacionalidad', 'contacto_emergencia', 'contacto_emergencia_tel', 'notas'] as const
type Extra = typeof EXTRAS[number]
const EXTRA_VACIO = Object.fromEntries(EXTRAS.map(k => [k, ''])) as Record<Extra, string>
const EXTRA_LABEL: Record<Extra, string> = {
  identificacion: 'Identificación (INE / pasaporte)', licencia_vence: 'Vigencia de la licencia',
  fecha_nacimiento: 'Fecha de nacimiento', nacionalidad: 'Nacionalidad',
  contacto_emergencia: 'Contacto de emergencia', contacto_emergencia_tel: 'Teléfono de emergencia', notas: 'Notas',
}
const edad = (iso: string) => {
  const n = new Date(iso + 'T12:00:00'), h = new Date()
  return h.getFullYear() - n.getFullYear() - (h < new Date(h.getFullYear(), n.getMonth(), n.getDate()) ? 1 : 0)
}

/* ─── Utils ──────────────────────────────────────────────────── */
const fmt = (n: number) => n.toLocaleString('es-MX')
const fmtDate = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
const since = (s: string) => new Date(s).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })
const initials = (nombre: string) => {
  const p = nombre.trim().split(' ')
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?'
}

const STATUS_CHIP: Record<string, string> = {
  pendiente: '', confirmada: 'primary', entregada: 'primary', devuelta: '', cancelada: '',
}
const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', confirmada: 'Confirmada', entregada: 'Entregada',
  devuelta: 'Devuelta', cancelada: 'Cancelada',
}

/* ─── Add client panel ───────────────────────────────────────── */
function AgregarClientePanel({ open, onClose, onCreated }: {
  open: boolean
  onClose: () => void
  onCreated: (c: Cliente) => void
}) {
  const { currentEmail } = useAuth()
  const [nombre,   setNombre]   = useState('')
  const [telefono, setTelefono] = useState('')
  const [email,    setEmail]    = useState('')
  const [licencia, setLicencia] = useState('')
  const [direccion,setDireccion]= useState('')
  const [ident,    setIdent]    = useState('')
  const [licVence, setLicVence] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  function reset() {
    setNombre(''); setTelefono(''); setEmail(''); setLicencia(''); setDireccion(''); setIdent(''); setLicVence(''); setError('')
  }

  async function handleGuardar() {
    if (!nombre.trim()) { setError('Falta el nombre del cliente.'); return }
    setSaving(true); setError('')
    const { data, error: err } = await insertarConExtras('clientes', {
      nombre:   nombre.trim(),
      telefono: telefono.trim() || null,
      email:    email.trim()    || null,
      licencia: licencia.trim() || null,
      direccion:direccion.trim()|| null,
    }, {
      identificacion: ident.trim() || null,
      licencia_vence: licVence || null,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    await insertLog({
      accion: 'crear_cliente',
      entidad: 'clientes',
      entidad_id: data?.id,
      descripcion: `Cliente ${nombre.trim()} agregado`,
      realizado_por: currentEmail,
      datos_nuevos: { nombre: nombre.trim(), telefono: telefono.trim() || null },
    })
    reset()
    onCreated(data as Cliente)
    onClose()
  }

  return (
    <>
      {open && <div className="qpanel-overlay" onClick={() => { reset(); onClose() }} />}
      <div className={`qpanel${open ? ' open' : ''}`}>
        <div className="qpanel-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Clientes</div>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
              Nuevo cliente
            </div>
          </div>
          <button onClick={() => { reset(); onClose() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--ink3)', flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>
        <div className="qpanel-body">
          <div className="field">
            <label className="field-l">Nombre completo *</label>
            <input className="field-i" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Nombre apellido" autoFocus />
          </div>

          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: -4 }}>
            Contacto
          </div>

          <div className="field">
            <label className="field-l">
              Teléfono <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>(requerido para reservas)</span>
            </label>
            <input className="field-i" value={telefono} onChange={e => setTelefono(e.target.value)}
              placeholder="+52 631..." inputMode="tel" />
          </div>
          <div className="field">
            <label className="field-l">Correo electrónico</label>
            <input className="field-i" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com" type="email" inputMode="email" />
          </div>
          <div className="field">
            <label className="field-l">Dirección</label>
            <input className="field-i" value={direccion} onChange={e => setDireccion(e.target.value)}
              placeholder="Calle, número, colonia…" />
          </div>

          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: -4 }}>
            Documentos
          </div>

          <div className="field">
            <label className="field-l">Identificación (INE / pasaporte)</label>
            <input className="field-i" value={ident} onChange={e => setIdent(e.target.value)} placeholder="IDMEX…" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="field" style={{ flex: 3 }}>
              <label className="field-l">Número de licencia</label>
              <input className="field-i" value={licencia} onChange={e => setLicencia(e.target.value)}
                placeholder="Número de licencia de manejo" />
            </div>
            <div className="field" style={{ flex: 2 }}>
              <label className="field-l">Vence</label>
              <input className="field-i" type="date" value={licVence} onChange={e => setLicVence(e.target.value)} />
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.5, padding: '2px 0' }}>
            Solo nombre es obligatorio. El resto puede completarse antes de la entrega del vehículo.
          </div>

          {error && (
            <div style={{ fontSize: 13, color: '#c0392b', padding: '8px 12px', borderRadius: 8, background: 'oklch(96% 0.03 20)' }}>
              {error}
            </div>
          )}
        </div>
        <div className="qpanel-foot">
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleGuardar} disabled={saving}>
            {saving
              ? <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Guardando…</>
              : <><Check size={15} />Agregar cliente</>}
          </button>
        </div>
      </div>
    </>
  )
}

/* ─── Client detail ──────────────────────────────────────────── */
function ClienteDetail({ cliente, onNewReserva, onCotizar, onUpdated }: {
  cliente: Cliente
  onNewReserva: () => void
  onCotizar: () => void
  onUpdated: (c: Cliente) => void
}) {
  const { currentEmail, esDueno } = useAuth()
  const [reservas, setReservas] = useState<ReservaResumen[]>([])
  const [loading,  setLoading]  = useState(true)

  // "No rentar" (unwanted client)
  const [vetos, setVetos] = useState<Veto[]>([])
  const [vetoForm, setVetoForm] = useState(false)
  const [vetoMotivo, setVetoMotivo] = useState('')
  const [vetoError, setVetoError] = useState('')
  const [vetoGuardando, setVetoGuardando] = useState(false)
  useEffect(() => { setVetoForm(false); setVetoMotivo(''); setVetoError(''); historialVetos(cliente.id).then(setVetos) }, [cliente.id, cliente.no_rentar])

  async function guardarVeto() {
    if (!vetoMotivo.trim()) { setVetoError('Falta el motivo.'); return }
    setVetoGuardando(true); setVetoError('')
    const e = cliente.no_rentar ? await quitarNoDeseado(cliente, vetoMotivo) : await marcarNoDeseado(cliente, vetoMotivo)
    if (e) { setVetoError(mensajeError(e)); setVetoGuardando(false); return }
    const { data } = await db.from('clientes').select('*').eq('id', cliente.id).single()
    setVetoGuardando(false)
    if (data) onUpdated(data as Cliente)
  }
  const proximas = reservas.filter(r => (r.status === 'pendiente' || r.status === 'confirmada') && r.fecha_devolucion >= hoyISO())

  // Edit state
  const [editing,    setEditing]    = useState(false)
  const [editNombre, setEditNombre] = useState('')
  const [editTel,    setEditTel]    = useState('')
  const [editEmail,  setEditEmail]  = useState('')
  const [editLic,    setEditLic]    = useState('')
  const [editDir,    setEditDir]    = useState('')
  const [editExtra,  setEditExtra]  = useState<Record<Extra, string>>(EXTRA_VACIO)
  const [editSaving, setEditSaving] = useState(false)
  const [editError,  setEditError]  = useState('')

  useEffect(() => {
    setEditing(false)
    setLoading(true)
    db.from('reservas')
      .select('id, fecha_entrega, fecha_devolucion, status, total, vehiculos(modelo, placa)')
      .eq('cliente_id', cliente.id)
      .order('fecha_entrega', { ascending: false })
      .limit(200)
      .then(({ data }: { data: ReservaResumen[] | null }) => {
        setReservas(data ?? [])
        setLoading(false)
      })
  }, [cliente.id])

  function startEdit() {
    setEditNombre(cliente.nombre)
    setEditTel(cliente.telefono ?? '')
    setEditEmail(cliente.email ?? '')
    setEditLic(cliente.licencia ?? '')
    setEditDir(cliente.direccion ?? '')
    setEditExtra(Object.fromEntries(EXTRAS.map(k => [k, cliente[k] ?? ''])) as Record<Extra, string>)
    setEditError('')
    setEditing(true)
  }

  async function handleSave() {
    if (!editNombre.trim()) { setEditError('Falta el nombre del cliente.'); return }
    setEditSaving(true); setEditError('')
    const base = {
      nombre:   editNombre.trim(),
      telefono: editTel.trim()   || null,
      email:    editEmail.trim() || null,
      licencia: editLic.trim()   || null,
      direccion:editDir.trim()   || null,
    }
    const extras = Object.fromEntries(EXTRAS.map(k => [k, editExtra[k].trim() || null]))
    let { data, error: err } = await db.from('clientes').update({ ...base, ...extras }).eq('id', cliente.id).select().single()
    // PGRST204: newer columns not migrated yet
    if (err?.code === 'PGRST204') ({ data, error: err } = await db.from('clientes').update(base).eq('id', cliente.id).select().single())
    setEditSaving(false)
    if (err) { setEditError(err.message); return }
    await insertLog({
      accion: 'editar_cliente',
      entidad: 'clientes',
      entidad_id: cliente.id,
      descripcion: `Cliente ${cliente.nombre} actualizado`,
      realizado_por: currentEmail,
      datos_anteriores: { nombre: cliente.nombre, telefono: cliente.telefono },
      datos_nuevos: { nombre: editNombre.trim(), telefono: editTel.trim() || null },
    })
    setEditing(false)
    onUpdated(data as Cliente)
  }

  const activa = reservas.find(r => r.status === 'confirmada' || r.status === 'entregada')
  const totalFacturado = reservas.filter(r => r.status !== 'cancelada').reduce((s, r) => s + (r.total ?? 0), 0)

  return (
    <div className="card cli-detail">
      {/* Head */}
      <div className="cli-dhead">
        <div className="avatar accent" style={{ width: 52, height: 52, fontSize: 17 }}>
          {initials(cliente.nombre)}
        </div>
        <div className="meta">
          <h2>{cliente.nombre}</h2>
          <div className="cli-dsince">
            <span>desde {since(cliente.created_at)}</span>
            {activa && <span className="chip sm primary">renta activa</span>}
          </div>
        </div>
      </div>

      {cliente.no_rentar && (
        <div role="alert" style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-line)', color: 'var(--danger-ink)', borderRadius: 10, padding: '11px 14px', fontSize: 13.5, lineHeight: 1.5 }}>
          <b style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ban size={15} />Cliente no deseado: no rentarle</b>
          {cliente.no_rentar_motivo}
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            {cliente.no_rentar_desde ? `Desde ${fechaVeto(cliente.no_rentar_desde)}` : ''}{cliente.no_rentar_por ? ` · marcado por ${identificador(cliente.no_rentar_por)}` : ''}
          </div>
          {proximas.length > 0 && <div style={{ marginTop: 4, fontWeight: 600 }}>Tiene {proximas.length === 1 ? '1 reserva próxima' : `${proximas.length} reservas próximas`}: revísalas o cancélalas en Reservas.</div>}
        </div>
      )}

      {/* Actions */}
      <div className="cli-dactions">
        <button className="btn sm primary" onClick={onNewReserva} disabled={!!cliente.no_rentar} title={cliente.no_rentar ? 'Cliente no deseado' : undefined}>Nueva reserva</button>
        <button className="btn sm" onClick={onCotizar}>Cotizar</button>
        <button className="btn sm" onClick={startEdit} style={{ marginLeft: 'auto' }}>
          <Pencil size={13} />Editar
        </button>
        {!cliente.no_rentar && !vetoForm && (
          <button className="btn sm" style={{ color: 'var(--danger-ink)' }} onClick={() => setVetoForm(true)}><Ban size={13} />No rentarle</button>
        )}
        {cliente.no_rentar && esDueno && !vetoForm && (
          <button className="btn sm" onClick={() => setVetoForm(true)}><ShieldCheck size={13} />Volver a permitir</button>
        )}
      </div>

      {vetoForm && (
        <div style={{ background: 'var(--paper-alt)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
          border: `1.5px solid ${cliente.no_rentar ? 'var(--primary-line)' : 'var(--danger-line)'}` }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{cliente.no_rentar ? 'Volver a permitir rentarle' : 'Marcar como cliente no deseado'}</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink3)', lineHeight: 1.45 }}>
            {cliente.no_rentar ? 'Explica por qué ya se le puede rentar (por ejemplo, pagó lo que debía).'
              : 'No se le podrán hacer reservas nuevas. Queda en el historial con tu nombre; solo el dueño puede quitar la marca.'}
          </div>
          {cliente.no_rentar
            ? <textarea className="field-i" rows={2} value={vetoMotivo} onChange={e => { setVetoMotivo(e.target.value); setVetoError('') }} placeholder="Motivo (obligatorio)" aria-label="Motivo" />
            : <MotivoNoDeseado value={vetoMotivo} onChange={v => { setVetoMotivo(v); setVetoError('') }} />}
          {vetoError && <div role="alert" style={{ fontSize: 12.5, color: 'var(--danger-ink)' }}>{vetoError}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setVetoForm(false); setVetoMotivo(''); setVetoError('') }}>Cancelar</button>
            <button className="btn" style={{ flex: 2, justifyContent: 'center', ...(cliente.no_rentar ? {} : { background: 'var(--danger-soft)', borderColor: 'var(--danger-line)', color: 'var(--danger-ink)' }) }}
              onClick={guardarVeto} disabled={vetoGuardando}>
              {vetoGuardando ? 'Guardando…' : cliente.no_rentar ? 'Permitir de nuevo' : 'Marcar como no deseado'}
            </button>
          </div>
        </div>
      )}

      {/* Inline edit form */}
      {editing && (
        <div style={{
          background: 'var(--paper-alt)', borderRadius: 10, padding: '14px 16px',
          display: 'flex', flexDirection: 'column', gap: 10,
          border: '1.5px solid var(--primary-line)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)' }}>Editar datos</div>
          <div className="field">
            <label className="field-l">Nombre *</label>
            <input className="field-i" value={editNombre} onChange={e => setEditNombre(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label className="field-l">Teléfono</label>
            <input className="field-i" value={editTel} onChange={e => setEditTel(e.target.value)} inputMode="tel" placeholder="+52 631..." />
          </div>
          <div className="field">
            <label className="field-l">Correo electrónico</label>
            <input className="field-i" value={editEmail} onChange={e => setEditEmail(e.target.value)} type="email" placeholder="correo@ejemplo.com" />
          </div>
          <div className="field">
            <label className="field-l">Dirección</label>
            <input className="field-i" value={editDir} onChange={e => setEditDir(e.target.value)} placeholder="Calle, número, colonia…" />
          </div>
          <div className="field">
            <label className="field-l">Número de licencia</label>
            <input className="field-i" value={editLic} onChange={e => setEditLic(e.target.value)} placeholder="Número de licencia" />
          </div>
          {EXTRAS.map(k => (
            <div className="field" key={k}>
              <label className="field-l">{EXTRA_LABEL[k]}</label>
              {k === 'notas'
                ? <textarea className="field-i" rows={3} value={editExtra[k]} onChange={e => setEditExtra(x => ({ ...x, [k]: e.target.value }))} />
                : <input className="field-i" type={k === 'licencia_vence' || k === 'fecha_nacimiento' ? 'date' : 'text'}
                    value={editExtra[k]} onChange={e => setEditExtra(x => ({ ...x, [k]: e.target.value }))} />}
            </div>
          ))}
          {editError && (
            <div style={{ fontSize: 12.5, color: '#c0392b', padding: '6px 10px', borderRadius: 7, background: 'oklch(96% 0.03 20)' }}>
              {editError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditing(false)} disabled={editSaving}>
              Cancelar
            </button>
            <button className="btn primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSave} disabled={editSaving}>
              {editSaving
                ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Guardando…</>
                : <><Check size={14} />Guardar cambios</>}
            </button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="cli-dkpis">
        <div className="cli-dkpi">
          <div className="cli-dkpi-v">{reservas.length}</div>
          <div className="cli-dkpi-l">Rentas</div>
        </div>
        <div className="cli-dkpi">
          <div className="cli-dkpi-v">
            {totalFacturado >= 1000
              ? `$${(totalFacturado / 1000).toFixed(0)}k`
              : `$${fmt(totalFacturado)}`}
          </div>
          <div className="cli-dkpi-l">Facturado</div>
        </div>
      </div>

      {/* Contact */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Datos de contacto</div>
        <div className="cli-data">
          {cliente.telefono ? (
            <div className="cli-data-row"><Phone size={15} /><span>{cliente.telefono}</span></div>
          ) : (
            <div className="cli-data-row" style={{ color: 'var(--ink4)' }}><Phone size={15} /><span>Sin teléfono</span></div>
          )}
          {cliente.email && (
            <div className="cli-data-row"><Mail size={15} /><span>{cliente.email}</span></div>
          )}
          {cliente.direccion && (
            <div className="cli-data-row"><MapPin size={15} /><span>{cliente.direccion}</span></div>
          )}
          {cliente.identificacion && (
            <div className="cli-data-row"><Fingerprint size={15} /><span>INE / pasaporte: {cliente.identificacion}</span></div>
          )}
          {cliente.licencia && (
            <div className="cli-data-row"><CreditCard size={15} />
              <span>Licencia: {cliente.licencia}
                {cliente.licencia_vence && (
                  <span style={{ color: cliente.licencia_vence < hoyISO() ? 'var(--danger-ink)' : 'var(--ink3)', fontWeight: cliente.licencia_vence < hoyISO() ? 700 : 400 }}>
                    {' '}· {cliente.licencia_vence < hoyISO() ? 'VENCIDA' : 'vence'} {fmtDate(cliente.licencia_vence)}
                  </span>
                )}
              </span>
            </div>
          )}
          {cliente.fecha_nacimiento && (
            <div className="cli-data-row"><Cake size={15} /><span>{fmtDate(cliente.fecha_nacimiento)} · {edad(cliente.fecha_nacimiento)} años{cliente.nacionalidad ? ` · ${cliente.nacionalidad}` : ''}</span></div>
          )}
          {cliente.contacto_emergencia && (
            <div className="cli-data-row"><LifeBuoy size={15} /><span>Emergencia: {cliente.contacto_emergencia}{cliente.contacto_emergencia_tel ? ` · ${cliente.contacto_emergencia_tel}` : ''}</span></div>
          )}
          {cliente.notas && (
            <div className="cli-data-row" style={{ alignItems: 'flex-start' }}><StickyNote size={15} /><span style={{ whiteSpace: 'pre-line' }}>{cliente.notas}</span></div>
          )}
        </div>
      </div>

      {/* Reservations */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Historial de rentas</div>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: 'var(--ink3)', fontSize: 13 }}>
            <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Cargando…
          </div>
        ) : reservas.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--ink3)', padding: '8px 0' }}>Sin rentas registradas.</div>
        ) : (
          <div className="cli-data">
            {reservas.map(r => (
              <div key={r.id} className="cli-rent">
                <div className="cli-rent-main">
                  <div className="cli-rent-car">
                    {r.vehiculos?.modelo ?? '—'}{' '}
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>
                      {r.vehiculos?.placa ?? ''}
                    </span>
                  </div>
                  <div className="cli-rent-when">
                    {fmtDate(r.fecha_entrega)} → {fmtDate(r.fecha_devolucion)}
                  </div>
                </div>
                <div className="cli-rent-end">
                  {r.total != null && (
                    <div className="cli-rent-total">${fmt(r.total)}</div>
                  )}
                  <span className={`chip sm ${STATUS_CHIP[r.status] ?? ''}`} style={{ fontSize: 11 }}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {vetos.length > 0 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Historial de no deseado</div>
          <div className="cli-data">
            {vetos.map(v => (
              <div key={v.id} className="cli-data-row" style={{ alignItems: 'flex-start' }}>
                {v.accion === 'marcar' ? <Ban size={15} color="var(--danger-ink)" /> : <ShieldCheck size={15} color="var(--primary)" />}
                <span><b>{v.accion === 'marcar' ? 'Marcado' : 'Permitido de nuevo'}</b> · {fechaVeto(v.fecha)}{v.registrado_por ? ` · ${identificador(v.registrado_por)}` : ''}
                  {v.reserva_folio != null ? ` · renta #${v.reserva_folio}` : ''}<br /><span style={{ color: 'var(--ink2)' }}>{v.motivo}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Skeleton row ───────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="cli-row" style={{ opacity: 0.4, pointerEvents: 'none' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--paper-alt)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 14, width: '50%', background: 'var(--paper-alt)', borderRadius: 5 }} />
        <div style={{ height: 11, width: '35%', background: 'var(--paper-alt)', borderRadius: 5 }} />
      </div>
    </div>
  )
}

/* ─── Main screen ─────────────────────────────────────────────── */
export default function ClientesScreen() {
  const navigate = useNavigate()
  const [clientes,  setClientes]  = useState<Cliente[]>([])
  const [loading,   setLoading]   = useState(true)
  const [query,     setQuery]     = useState('')
  const [selected,  setSelected]  = useState<Cliente | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [soloNoDeseados, setSoloNoDeseados] = useState(false)

  async function fetchClientes() {
    const { data } = await db.from('clientes').select('*').order('nombre')
    setClientes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchClientes() }, [])

  // Open a client picked from the global search (?c=id)
  const [params, setParams] = useSearchParams()
  const pedido = params.get('c')
  useEffect(() => {
    if (!pedido || clientes.length === 0) return
    const c = clientes.find(x => x.id === pedido)
    if (c) setSelected(c)
    setParams({}, { replace: true })
  }, [pedido, clientes])

  function handleCreated(c: Cliente) {
    setClientes(prev =>
      [c, ...prev].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    )
    setSelected(c)
  }

  function handleUpdated(updated: Cliente) {
    setClientes(prev =>
      prev.map(c => c.id === updated.id ? updated : c)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    )
    setSelected(updated)
  }

  function goToReserva(c: Cliente) {
    const params = new URLSearchParams({
      new: '1',
      clienteId: c.id,
      nombre: c.nombre,
      ...(c.telefono ? { telefono: c.telefono } : {}),
    })
    navigate(`/app/reservations?${params.toString()}`)
  }

  function goToCotizar(c: Cliente) {
    const params = new URLSearchParams({
      nombre: c.nombre,
      ...(c.telefono ? { telefono: c.telefono } : {}),
    })
    navigate(`/app/cotizaciones?${params.toString()}`)
  }

  const noDeseados = clientes.filter(c => c.no_rentar)
  const base = soloNoDeseados ? noDeseados : clientes
  const filtered = query.trim()
    ? base.filter(c =>
        c.nombre.toLowerCase().includes(query.toLowerCase()) ||
        (c.telefono ?? '').includes(query.trim())
      )
    : base

  return (
    <div className="screen">
      <AgregarClientePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onCreated={handleCreated}
      />

      <div className="pagehead">
        <div>
          <div className="eyebrow">Registro</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>Clientes</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4 }}>
            {loading ? 'Cargando…' : `${clientes.length} clientes registrados`}
          </p>
        </div>
        <div className="pagehead-actions">
          <button className="btn sm primary" onClick={() => setPanelOpen(true)}>
            <Plus size={14} />Nuevo cliente
          </button>
        </div>
      </div>

      <div className="cli-grid">
        {/* Left: list */}
        <div>
          <div className="cli-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ border: 0, background: 'transparent', outline: 'none', flex: 1, font: 'inherit', fontSize: 13.5, color: 'var(--ink)' }}
            />
          </div>
          <div className="filterbar" style={{ margin: '0 0 10px' }}>
            <button className={`fbtn${!soloNoDeseados ? ' on' : ''}`} onClick={() => setSoloNoDeseados(false)}>Todos <span className="fbtn-n">{clientes.length}</span></button>
            <button className={`fbtn${soloNoDeseados ? ' on' : ''}`} onClick={() => setSoloNoDeseados(true)}><Ban size={13} />No deseados <span className="fbtn-n">{noDeseados.length}</span></button>
          </div>
          <div className="card cli-list">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--ink4)', padding: '32px 0', fontSize: 14 }}>
                {soloNoDeseados && !query.trim() ? 'No hay clientes marcados como no deseados.' : clientes.length === 0 ? 'Aún no hay clientes.' : 'Sin resultados.'}
              </p>
            ) : filtered.map(c => (
              <button
                key={c.id}
                className="cli-row"
                data-on={selected?.id === c.id ? 'true' : 'false'}
                onClick={() => setSelected(c)}
              >
                <div className="avatar accent" style={{ width: 40, height: 40, fontSize: 14 }}>
                  {initials(c.nombre)}
                </div>
                <div className="cli-row-main">
                  <div className="cli-row-top">
                    <span className="cli-row-n">{c.nombre}</span>
                    {c.no_rentar && <span className="chip sm danger"><Ban size={10} />No rentar</span>}
                  </div>
                  <div className="cli-row-meta">
                    {c.no_rentar && soloNoDeseados ? `${c.no_rentar_motivo ?? ''}${c.no_rentar_desde ? ` · ${fechaVeto(c.no_rentar_desde)}` : ''}` : `${c.telefono ?? 'Sin teléfono'} · desde ${since(c.created_at)}`}
                  </div>
                </div>
                <ChevronRight size={15} style={{ color: 'var(--ink4)', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>

        {/* Right: detail */}
        {selected ? (
          <ClienteDetail
            cliente={selected}
            onNewReserva={() => goToReserva(selected)}
            onCotizar={() => goToCotizar(selected)}
            onUpdated={handleUpdated}
          />
        ) : (
          <div className="card cli-detail is-empty">
            <div className="cli-empty">
              <div className="ic"><Search size={24} /></div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink2)' }}>
                Selecciona un cliente
              </div>
              <div style={{ fontSize: 13, marginTop: 6, color: 'var(--ink3)' }}>
                Elige un cliente de la lista para ver su historial.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
