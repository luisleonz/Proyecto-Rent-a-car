import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Key, Check, Wrench, X, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { insertLog } from '../../lib/log'
import type { Vehiculo } from '../../lib/database.types'

const db = supabase as any

/* ── Constants ── */
const TONES: Record<string, [string, string]> = {
  blue:  ['oklch(0.62 0.10 245)', 'oklch(0.90 0.04 245)'],
  slate: ['oklch(0.55 0.02 240)', 'oklch(0.92 0.01 240)'],
  rose:  ['oklch(0.62 0.13 20)',  'oklch(0.92 0.04 20)'],
  ink:   ['oklch(0.40 0.01 240)', 'oklch(0.88 0.01 240)'],
  sand:  ['oklch(0.70 0.06 75)',  'oklch(0.93 0.03 80)'],
  white: ['oklch(0.72 0.01 240)', 'oklch(0.95 0.005 240)'],
}

const STATUS_LABEL: Record<string, string> = {
  disponible: 'Disponible', rentado: 'Rentado', taller: 'En taller', reservado: 'Reservado',
}
const STATUS_CHIP: Record<string, string> = {
  disponible: 'primary', rentado: 'primary', taller: 'warn', reservado: '',
}
const STATUS_DOT: Record<string, string> = {
  disponible: 'primary', rentado: 'primary', taller: 'warn', reservado: 'neutral',
}

const RES_STATUS_LABEL: Record<string, string> = {
  pendiente: 'Reserva pendiente', confirmada: 'Confirmada', entregada: 'Entregada',
  devuelta: 'Devuelta', cancelada: 'Cancelada',
}
const RES_STATUS_DOT: Record<string, string> = {
  pendiente: 'warn', confirmada: '', entregada: 'primary', devuelta: 'neutral', cancelada: 'neutral',
}

const GALLERY = ['Frente', '3/4', 'Interior', 'Tablero']
const fmt     = (n: number) => n.toLocaleString('es-MX')
const fmtDate = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

type ReservaHist = {
  id: string
  fecha_entrega: string
  fecha_devolucion: string
  status: string
  total: number | null
  clientes: { nombre: string } | null
}

/* ── CarPhoto ── */
function CarPhoto({ v, height = 200 }: { v: Vehiculo; height?: number }) {
  const [body, bg] = TONES[v.tono ?? 'slate'] ?? TONES.slate
  const glass = 'rgba(255,255,255,0.42)'
  return (
    <div className="photo" style={{ height, background: bg, color: body }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 200 72" fill="none" style={{ width: '70%' }}>
          <path d="M12 50 C12 44 15 42 20 42 L48 42 C54 27 70 17 100 15 C130 13 152 23 162 42 L182 42 C187 42 190 44 190 50 L190 58 C190 62 187 64 182 64 L18 64 C14 64 12 62 12 58 Z" fill={body} />
          <path d="M52 42 C56 26 70 17 100 15 C130 13 148 24 156 42 Z" fill={body} opacity="0.85" />
          <path d="M112 16 L154 42 L132 42 Z" fill={glass} />
          <path d="M58 42 L82 42 L74 22 Z" fill={glass} />
          <circle cx="54"  cy="64" r="14" fill="oklch(0.18 0.005 240)" />
          <circle cx="54"  cy="64" r="7"  fill="oklch(0.40 0.008 240)" />
          <circle cx="54"  cy="64" r="3"  fill="oklch(0.62 0.008 240)" />
          <circle cx="154" cy="64" r="14" fill="oklch(0.18 0.005 240)" />
          <circle cx="154" cy="64" r="7"  fill="oklch(0.40 0.008 240)" />
          <circle cx="154" cy="64" r="3"  fill="oklch(0.62 0.008 240)" />
        </svg>
      </div>
    </div>
  )
}

/* ── SpecTile ── */
function SpecTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="spectile">
      <div className="spectile-ic">{icon}</div>
      <div>
        <div className="spectile-v">{value}</div>
        <div className="spectile-l">{label}</div>
      </div>
    </div>
  )
}

export default function VehicleDetailScreen() {
  const { plate }  = useParams<{ plate: string }>()
  const navigate   = useNavigate()
  const { currentEmail } = useAuth()

  const [v,           setV]           = useState<Vehiculo | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [gallery,     setGallery]     = useState(0)
  const [history,     setHistory]     = useState<ReservaHist[]>([])
  const [activeResId, setActiveResId] = useState<string | null>(null)
  const [working,     setWorking]     = useState(false)
  const [successMsg,  setSuccessMsg]  = useState('')

  // Taller form
  const [showTallerForm, setShowTallerForm] = useState(false)
  const [tallerNota,     setTallerNota]     = useState('')

  useEffect(() => {
    if (!plate) return
    db.from('vehiculos').select('*').eq('placa', plate).single()
      .then(async ({ data, error }: any) => {
        if (error || !data) { setLoading(false); return }
        setV(data)
        setLoading(false)

        // Load reservation history
        const { data: hist } = await db
          .from('reservas')
          .select('id, fecha_entrega, fecha_devolucion, status, total, clientes(nombre)')
          .eq('vehiculo_id', data.id)
          .order('fecha_entrega', { ascending: false })
          .limit(10)
        setHistory(hist ?? [])

        // Find active reservation for action buttons
        const { data: active } = await db
          .from('reservas')
          .select('id')
          .eq('vehiculo_id', data.id)
          .in('status', ['confirmada', 'entregada'])
          .order('fecha_entrega', { ascending: true })
          .limit(1)
          .maybeSingle()
        if (active) setActiveResId(active.id)
      })
  }, [plate])

  async function handleMarkListo() {
    if (!v) return
    setWorking(true)
    await db.from('vehiculos').update({ status: 'disponible', cliente_actual: null, info_cliente: null }).eq('id', v.id)
    await insertLog({
      accion: 'vehiculo_listo',
      entidad: 'vehiculos',
      entidad_id: v.id,
      descripcion: `${v.modelo} (${v.placa}) marcado como disponible desde taller`,
      realizado_por: currentEmail,
      datos_anteriores: { status: 'taller' },
      datos_nuevos: { status: 'disponible' },
    })
    setV(prev => prev ? { ...prev, status: 'disponible', cliente_actual: null, info_cliente: null } : prev)
    setSuccessMsg('Vehículo marcado como disponible.')
    setWorking(false)
  }

  async function handleEnviarTaller() {
    if (!v) return
    setWorking(true)
    const nota = tallerNota.trim() || null
    await db.from('vehiculos').update({ status: 'taller', info_cliente: nota }).eq('id', v.id)
    await insertLog({
      accion: 'vehiculo_taller',
      entidad: 'vehiculos',
      entidad_id: v.id,
      descripcion: `${v.modelo} (${v.placa}) enviado a taller${nota ? ` — ${nota}` : ''}`,
      realizado_por: currentEmail,
      datos_anteriores: { status: v.status },
      datos_nuevos: { status: 'taller', info_cliente: nota },
    })
    setV(prev => prev ? { ...prev, status: 'taller', info_cliente: nota } : prev)
    setShowTallerForm(false)
    setTallerNota('')
    setSuccessMsg('Vehículo enviado a taller.')
    setWorking(false)
  }

  if (loading) return (
    <div className="screen detail" style={{ opacity: 0.5 }}>
      <div style={{ height: 20, width: 140, background: 'var(--paper-alt)', borderRadius: 6, marginBottom: 20 }} />
      <div className="detail-grid">
        <div style={{ height: 400, background: 'var(--paper-alt)', borderRadius: 'var(--radius)' }} />
        <div style={{ height: 400, background: 'var(--paper-alt)', borderRadius: 'var(--radius)' }} />
      </div>
    </div>
  )

  if (!v) return (
    <div className="screen">
      <button className="backlink" onClick={() => navigate('/app/vehicles')}>
        <ChevronLeft size={16} />Volver a flota
      </button>
      <p style={{ color: 'var(--ink3)', marginTop: 24 }}>Vehículo no encontrado.</p>
    </div>
  )

  const fuelPct   = v.combustible ?? 75
  const fuelColor = fuelPct < 35 ? 'var(--danger)' : fuelPct < 60 ? 'var(--warn)' : 'var(--primary)'

  return (
    <div className="screen detail">
      <button className="backlink" onClick={() => navigate('/app/vehicles')}>
        <ChevronLeft size={16} />Volver a flota
      </button>

      <div className="detail-grid">
        {/* LEFT — gallery + identity */}
        <div className="detail-left">
          <div className="card" style={{ overflow: 'hidden' }}>
            <CarPhoto v={v} height={260} />
            <div className="gallery-strip">
              {GALLERY.map((g, i) => (
                <button key={g} className={'thumb' + (i === gallery ? ' on' : '')} onClick={() => setGallery(i)}>
                  <svg viewBox="0 0 200 72" fill="none" style={{ width: '60%' }}>
                    <path d="M12 50 C12 44 15 42 20 42 L48 42 C54 27 70 17 100 15 C130 13 152 23 162 42 L182 42 C187 42 190 44 190 50 L190 58 C190 62 187 64 182 64 L18 64 C14 64 12 62 12 58 Z" fill="currentColor" opacity="0.6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="card detail-id">
            <div className="detail-idhead">
              <div>
                <div className="eyebrow">{v.segmento ?? 'Sedán'} · {v.anio}</div>
                <h1 className="h-display detail-title">{v.modelo}</h1>
              </div>
              <div className="detail-plate mono">{v.placa}</div>
            </div>
            <div className="detail-chips">
              <span className={'chip ' + (STATUS_CHIP[v.status] || '')}>
                <span className={'dot ' + (STATUS_DOT[v.status] || 'neutral')} />
                {STATUS_LABEL[v.status] ?? v.status}
              </span>
              {v.color && <span className="chip">{v.color}</span>}
              {v.transmision && <span className="chip">{v.transmision}</span>}
            </div>
          </div>
        </div>

        {/* RIGHT — actions, specs, history */}
        <div className="detail-right">
          <div className="card detail-actions">
            <div className="detail-actions-head">
              <div>
                <div className="eyebrow">Estado actual</div>
                {v.status === 'rentado'    && <div className="detail-status">Rentado a <strong>{v.cliente_actual}</strong>{v.info_cliente ? ` · ${v.info_cliente}` : ''}</div>}
                {v.status === 'taller'     && <div className="detail-status">En taller{v.info_cliente ? ` — ${v.info_cliente}` : ''}</div>}
                {v.status === 'reservado'  && <div className="detail-status">Reservado{v.info_cliente ? ` · ${v.info_cliente}` : ''}</div>}
                {v.status === 'disponible' && <div className="detail-status">Disponible para rentar</div>}
              </div>
              {v.tarifa_diaria != null && (
                <div className="detail-rate">
                  <span className="h-display">${Number(v.tarifa_diaria).toLocaleString('es-MX')}</span>
                  <small>/día</small>
                </div>
              )}
            </div>

            {/* Success banner */}
            {successMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
                background: 'oklch(95% 0.06 155)', borderRadius: 9,
                border: '1px solid oklch(82% 0.1 155)', fontSize: 13,
                color: 'var(--primary)', fontWeight: 600,
              }}>
                <Check size={14} />
                {successMsg}
              </div>
            )}

            {/* Taller note form */}
            {showTallerForm && (
              <div style={{
                background: 'var(--paper-alt)', borderRadius: 10, padding: '12px 14px',
                border: '1.5px solid var(--warn-line)', display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} color="var(--warn-ink)" />Enviar a taller
                  </span>
                  <button onClick={() => { setShowTallerForm(false); setTallerNota('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', padding: 2 }}>
                    <X size={16} />
                  </button>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="field-l">Motivo / nota</label>
                  <input className="field-i" value={tallerNota} onChange={e => setTallerNota(e.target.value)}
                    placeholder="Ej. Cambio de aceite, revisión general…" autoFocus />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => { setShowTallerForm(false); setTallerNota('') }}>Cancelar</button>
                  <button className="btn warn" style={{ flex: 2, justifyContent: 'center', background: 'oklch(96% 0.05 65)', borderColor: 'var(--warn-line)', color: 'var(--warn-ink)' }}
                    onClick={handleEnviarTaller} disabled={working}>
                    <Wrench size={14} />Confirmar envío
                  </button>
                </div>
              </div>
            )}

            <div className="detail-btns">
              {/* Primary action depends on status */}
              {v.status === 'disponible' && (
                <button className="btn primary"
                  onClick={() => navigate(`/app/reservations?new=1&vehiculoId=${v.id}&vehiculo=${encodeURIComponent(v.modelo)}&placa=${v.placa}`)}>
                  <Key size={15} />Crear reserva
                </button>
              )}
              {v.status === 'reservado' && (
                <button className="btn primary" disabled={!activeResId || working}
                  onClick={() => activeResId && navigate(`/app/entrega/${activeResId}/1`)}>
                  <Key size={15} />{activeResId ? 'Entregar ahora' : 'Buscando reserva…'}
                </button>
              )}
              {v.status === 'rentado' ? (
                <button className="btn primary" disabled={!activeResId || working}
                  onClick={() => activeResId && navigate(`/app/devolucion/${activeResId}/1`)}>
                  <Check size={15} />{activeResId ? 'Registrar devolución' : 'Buscando reserva…'}
                </button>
              ) : null}
              {v.status === 'taller' && (
                <button className="btn primary" onClick={handleMarkListo} disabled={working}>
                  <Check size={15} />Marcar como listo
                </button>
              )}

              {/* Secondary: send to taller (not shown if already in taller) */}
              {v.status !== 'taller' && !showTallerForm && (
                <button className="btn" onClick={() => setShowTallerForm(true)} disabled={working}>
                  <Wrench size={15} />Enviar a taller
                </button>
              )}
            </div>
          </div>

          <div className="card detail-specs">
            <div className="eyebrow" style={{ marginBottom: 14 }}>Especificaciones</div>
            <div className="spec-tiles">
              <SpecTile icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M4 14a8 8 0 1 1 16 0"/><path d="M12 14l4-3"/><circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none"/></svg>} label="Kilometraje" value={(v.km ?? 0).toLocaleString('es-MX') + ' km'} />
              <SpecTile icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>} label="Transmisión" value={v.transmision ?? 'Aut.'} />
              <SpecTile icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>} label="Capacidad" value="5 personas" />
              <SpecTile icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M3 14l2-5a2 2 0 0 1 2-1.4h10a2 2 0 0 1 2 1.4l2 5v5h-3v-2H6v2H3v-5z"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/></svg>} label="Segmento" value={v.segmento ?? 'Sedán'} />
            </div>
            <div className="fuel-row">
              <div className="fuel-head">
                <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="5" y="4" width="9" height="16" rx="1.5"/><path d="M5 10h9M16 8l3 3v6a2 2 0 0 1-2 2 2 2 0 0 1-2-2V8z"/></svg>Combustible</span>
                <strong>{fuelPct}%</strong>
              </div>
              <div className="meter"><span style={{ width: fuelPct + '%', background: fuelColor }} /></div>
            </div>
          </div>

          <div className="card detail-history">
            <div className="eyebrow" style={{ marginBottom: 6 }}>Historial de rentas</div>
            {history.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--ink3)', padding: '8px 0' }}>Sin rentas registradas.</p>
            ) : (
              <div className="timeline">
                {history.map(r => (
                  <div key={r.id} className="tl-item">
                    <span className={`tl-dot dot ${RES_STATUS_DOT[r.status] ?? 'neutral'}`} />
                    <div className="tl-body">
                      <div className="tl-row1">
                        <strong>{RES_STATUS_LABEL[r.status] ?? r.status}</strong>
                        <span className="tl-date">{fmtDate(r.fecha_entrega)}</span>
                      </div>
                      <div className="tl-note">
                        {r.clientes?.nombre ?? 'Cliente desconocido'}
                        {' · '}
                        {fmtDate(r.fecha_entrega)} → {fmtDate(r.fecha_devolucion)}
                        {r.total != null ? ` · $${fmt(r.total)}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
