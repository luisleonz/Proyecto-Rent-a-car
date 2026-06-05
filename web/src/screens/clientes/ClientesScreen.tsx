import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Phone, X, Check, ChevronRight, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { insertLog } from '../../lib/log'

const db = supabase as any

/* ─── Types ──────────────────────────────────────────────────── */
type Cliente = {
  id: string
  nombre: string
  telefono: string | null
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
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  function reset() { setNombre(''); setTelefono(''); setError('') }

  async function handleGuardar() {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError('')
    const { data, error: err } = await db.from('clientes').insert({
      nombre: nombre.trim(),
      telefono: telefono.trim() || null,
    }).select().single()
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
          <div className="field">
            <label className="field-l">
              Teléfono <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>(requerido para reservas)</span>
            </label>
            <input className="field-i" value={telefono} onChange={e => setTelefono(e.target.value)}
              placeholder="+52 631..." inputMode="tel" />
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink3)', lineHeight: 1.5, padding: '4px 0' }}>
            Puedes completar los datos adicionales (INE, licencia, etc.) antes de la entrega del vehículo.
          </div>
          {error && (
            <div style={{ fontSize: 13, color: '#c0392b', padding: '8px 12px', borderRadius: 8, background: 'oklch(96% 0.03 20)' }}>
              {error}
            </div>
          )}
        </div>
        <div className="qpanel-foot">
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleGuardar} disabled={saving || !nombre.trim()}>
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
  const { currentEmail } = useAuth()
  const [reservas,  setReservas]  = useState<ReservaResumen[]>([])
  const [loading,   setLoading]   = useState(true)

  // Edit state
  const [editing,    setEditing]    = useState(false)
  const [editNombre, setEditNombre] = useState('')
  const [editTel,    setEditTel]    = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError,  setEditError]  = useState('')

  useEffect(() => {
    setEditing(false)
    setLoading(true)
    db.from('reservas')
      .select('id, fecha_entrega, fecha_devolucion, status, total, vehiculos(modelo, placa)')
      .eq('cliente_id', cliente.id)
      .order('fecha_entrega', { ascending: false })
      .limit(10)
      .then(({ data }: { data: ReservaResumen[] | null }) => {
        setReservas(data ?? [])
        setLoading(false)
      })
  }, [cliente.id])

  function startEdit() {
    setEditNombre(cliente.nombre)
    setEditTel(cliente.telefono ?? '')
    setEditError('')
    setEditing(true)
  }

  async function handleSave() {
    if (!editNombre.trim()) { setEditError('El nombre es obligatorio'); return }
    setEditSaving(true); setEditError('')
    const { data, error: err } = await db.from('clientes')
      .update({ nombre: editNombre.trim(), telefono: editTel.trim() || null })
      .eq('id', cliente.id)
      .select().single()
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

  const activa  = reservas.find(r => r.status === 'confirmada' || r.status === 'entregada')
  const totalFacturado = reservas.reduce((s, r) => s + (r.total ?? 0), 0)

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

      {/* Actions */}
      <div className="cli-dactions">
        <button className="btn sm primary" onClick={onNewReserva}>Nueva reserva</button>
        <button className="btn sm" onClick={onCotizar}>Cotizar</button>
        <button className="btn sm" onClick={startEdit} style={{ marginLeft: 'auto' }}>
          <Pencil size={13} />Editar
        </button>
      </div>

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
          {editError && (
            <div style={{ fontSize: 12.5, color: '#c0392b', padding: '6px 10px', borderRadius: 7, background: 'oklch(96% 0.03 20)' }}>
              {editError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditing(false)} disabled={editSaving}>
              Cancelar
            </button>
            <button className="btn primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSave} disabled={editSaving || !editNombre.trim()}>
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
            <div className="cli-data-row">
              <Phone size={15} />
              <span>{cliente.telefono}</span>
            </div>
          ) : (
            <div className="cli-data-row" style={{ color: 'var(--ink4)' }}>
              <Phone size={15} />
              <span>Sin teléfono registrado</span>
            </div>
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

  async function fetchClientes() {
    const { data } = await db.from('clientes').select('*').order('nombre')
    setClientes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchClientes() }, [])

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

  const filtered = query.trim()
    ? clientes.filter(c =>
        c.nombre.toLowerCase().includes(query.toLowerCase()) ||
        (c.telefono ?? '').includes(query.trim())
      )
    : clientes

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
          <div className="card cli-list">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--ink4)', padding: '32px 0', fontSize: 14 }}>
                {clientes.length === 0 ? 'Aún no hay clientes.' : 'Sin resultados.'}
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
                  </div>
                  <div className="cli-row-meta">
                    {c.telefono ?? 'Sin teléfono'} · desde {since(c.created_at)}
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
            onNewReserva={() => navigate(`/app/reservations?new=1`)}
            onCotizar={() => navigate('/app/cotizaciones')}
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
