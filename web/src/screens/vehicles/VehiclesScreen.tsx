import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, SlidersHorizontal, Gauge, Fuel, Settings2, User, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import type { Vehiculo, VehiculoStatus } from '../../lib/database.types'

const db = supabase as any

/* ─── Constants ─────────────────────────────────────────────── */
const TONES: Record<string, [string, string]> = {
  blue:  ['oklch(0.62 0.10 245)', 'oklch(0.90 0.04 245)'],
  slate: ['oklch(0.55 0.02 240)', 'oklch(0.92 0.01 240)'],
  rose:  ['oklch(0.62 0.13 20)',  'oklch(0.92 0.04 20)'],
  ink:   ['oklch(0.40 0.01 240)', 'oklch(0.88 0.01 240)'],
  sand:  ['oklch(0.70 0.06 75)',  'oklch(0.93 0.03 80)'],
  white: ['oklch(0.72 0.01 240)', 'oklch(0.95 0.005 240)'],
}

const TONE_LABELS: Record<string, string> = {
  blue: 'Azul', slate: 'Gris', rose: 'Rojo/Rosa', ink: 'Negro', sand: 'Arena/Café', white: 'Blanco/Plata',
}

const SEGMENTOS = ['Sedán', 'SUV', 'Hatchback', 'Camioneta', 'Pickup', 'Van', 'Coupé', 'Convertible']

const STATUS_LABEL: Record<string, string> = {
  disponible: 'Disponible', rentado: 'Rentado', taller: 'En taller', reservado: 'Reservado',
}
const STATUS_CHIP: Record<string, string> = {
  disponible: 'primary', rentado: '', taller: 'warn', reservado: '',
}
const STATUS_DOT: Record<string, string> = {
  disponible: '', rentado: '', taller: 'warn', reservado: 'neutral',
}

const FILTER_TABS = [
  { label: 'Todos',       key: 'todos' },
  { label: 'Disponibles', key: 'disponible' },
  { label: 'Rentados',    key: 'rentado' },
  { label: 'Reservados',  key: 'reservado' },
  { label: 'En taller',   key: 'taller' },
]

const fmt = (n: number) => n.toLocaleString('es-MX')

/* ─── Car Photo SVG ──────────────────────────────────────────── */
function CarPhoto({ v }: { v: Vehiculo }) {
  const [bodyColor, bgColor] = TONES[v.tono ?? 'slate'] ?? TONES.slate
  const glassColor = 'rgba(255,255,255,0.42)'
  return (
    <div className="fc-photo photo" style={{ backgroundColor: bgColor, minHeight: 130 }}>
      <span className={`chip sm ${STATUS_CHIP[v.status] ?? ''}`} style={{ position: 'absolute', top: 12, left: 12 }}>
        <span className={`dot ${STATUS_DOT[v.status] ?? ''}`} />
        {STATUS_LABEL[v.status] ?? v.status}
      </span>
      <svg viewBox="0 0 200 72" fill="none" style={{ width: '100%', maxWidth: 180 }}>
        <path d="M12 50 C12 44 15 42 20 42 L48 42 C54 27 70 17 100 15 C130 13 152 23 162 42 L182 42 C187 42 190 44 190 50 L190 58 C190 62 187 64 182 64 L18 64 C14 64 12 62 12 58 Z" fill={bodyColor} />
        <path d="M52 42 C56 26 70 17 100 15 C130 13 148 24 156 42 Z" fill={bodyColor} opacity="0.85" />
        <path d="M112 16 L154 42 L132 42 Z" fill={glassColor} />
        <path d="M58 42 L82 42 L74 22 Z" fill={glassColor} />
        <circle cx="54"  cy="64" r="14" fill="oklch(0.18 0.005 240)" />
        <circle cx="54"  cy="64" r="7"  fill="oklch(0.40 0.008 240)" />
        <circle cx="54"  cy="64" r="3"  fill="oklch(0.62 0.008 240)" />
        <circle cx="154" cy="64" r="14" fill="oklch(0.18 0.005 240)" />
        <circle cx="154" cy="64" r="7"  fill="oklch(0.40 0.008 240)" />
        <circle cx="154" cy="64" r="3"  fill="oklch(0.62 0.008 240)" />
      </svg>
      <span className="lbl mono">{v.placa}</span>
    </div>
  )
}

/* ─── Fleet Card ────────────────────────────────────────────── */
function FleetCard({ v, onClick }: { v: Vehiculo; onClick: () => void }) {
  const isAvailable = v.status === 'disponible'
  return (
    <button className="card fleetcard" onClick={onClick}>
      <CarPhoto v={v} />
      <div className="fc-body">
        <div className="fc-row1">
          <div>
            <div className="fc-model">{v.modelo}</div>
            <div className="fc-meta">{v.segmento ?? 'Sedán'} · {v.anio} · {v.color}</div>
          </div>
          <span className="fc-plate">{v.placa}</span>
        </div>
        <div className="fc-specs">
          <span><Gauge size={13} />{fmt(v.km ?? 0)} km</span>
          {v.combustible != null && <span><Fuel size={13} />{v.combustible}%</span>}
          {v.transmision && <span><Settings2 size={13} />{v.transmision}</span>}
        </div>
        <div className="fc-foot">
          <div className="fc-who">
            <User size={13} style={{ color: 'var(--ink3)', flexShrink: 0 }} />
            {isAvailable ? (
              <span style={{ color: 'var(--ink3)', fontSize: 13 }}>Listo para rentar</span>
            ) : v.cliente_actual ? (
              <span>{v.cliente_actual}{v.info_cliente && <span className="fc-vence"> · {v.info_cliente}</span>}</span>
            ) : v.info_cliente ? (
              <span style={{ color: 'var(--ink3)', fontSize: 13 }}>{v.info_cliente}</span>
            ) : null}
          </div>
          {v.tarifa_diaria != null && (
            <div className="fc-rate">${fmt(Number(v.tarifa_diaria))}<small>/día</small></div>
          )}
        </div>
      </div>
    </button>
  )
}

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="card statcard">
      <div className="eyebrow">{label}</div>
      <div className="statval mono">{value}</div>
      <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>{sub}</div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card fleetcard" style={{ opacity: 0.5 }}>
      <div style={{ height: 130, background: 'var(--paper-alt)', borderRadius: 'var(--radius) var(--radius) 0 0' }} />
      <div className="fc-body" style={{ gap: 10 }}>
        <div style={{ height: 16, width: '60%', background: 'var(--paper-alt)', borderRadius: 6 }} />
        <div style={{ height: 12, width: '80%', background: 'var(--paper-alt)', borderRadius: 6 }} />
        <div style={{ height: 12, width: '40%', background: 'var(--paper-alt)', borderRadius: 6 }} />
      </div>
    </div>
  )
}

/* ─── Agregar vehículo panel ─────────────────────────────────── */
interface AgregarPanelProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

function AgregarPanel({ open, onClose, onCreated }: AgregarPanelProps) {
  const [placa,       setPlaca]       = useState('')
  const [modelo,      setModelo]      = useState('')
  const [anio,        setAnio]        = useState(String(new Date().getFullYear()))
  const [color,       setColor]       = useState('')
  const [tono,        setTono]        = useState('slate')
  const [segmento,    setSegmento]    = useState('Sedán')
  const [transmision, setTransmision] = useState('Automático')
  const [tarifa,      setTarifa]      = useState('')
  const [km,          setKm]          = useState('0')
  const [combustible, setCombustible] = useState('100')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  function reset() {
    setPlaca(''); setModelo(''); setAnio(String(new Date().getFullYear()))
    setColor(''); setTono('slate'); setSegmento('Sedán'); setTransmision('Automático')
    setTarifa(''); setKm('0'); setCombustible('100'); setError('')
  }

  async function handleGuardar() {
    if (!placa.trim() || !modelo.trim()) { setError('Placa y modelo son obligatorios'); return }
    setSaving(true); setError('')
    const { error: err } = await db.from('vehiculos').insert({
      placa:        placa.trim().toUpperCase(),
      modelo:       modelo.trim(),
      anio:         parseInt(anio) || null,
      color:        color.trim() || null,
      tono:         tono,
      segmento:     segmento,
      transmision:  transmision,
      tarifa_diaria: tarifa ? parseFloat(tarifa) : null,
      km:           parseInt(km) || 0,
      combustible:  parseInt(combustible) || 100,
      status:       'disponible' as VehiculoStatus,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    reset()
    onCreated()
    onClose()
  }

  const previewTone = TONES[tono] ?? TONES.slate

  return (
    <>
      {open && <div className="qpanel-overlay" onClick={onClose} />}
      <div className={`qpanel${open ? ' open' : ''}`}>
        <div className="qpanel-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Flota</div>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
              Agregar vehículo
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--ink3)', flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        <div className="qpanel-body" style={{ gap: 14 }}>
          {/* Color preview */}
          <div style={{
            height: 64, borderRadius: 10, background: previewTone[1],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: previewTone[0], fontWeight: 600, transition: 'background 0.2s',
          }}>
            {modelo || 'Vista previa'} · {placa || 'PLACA'}
          </div>

          {/* Placa + Modelo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <div className="field">
              <label className="field-l">Placa *</label>
              <input className="field-i" placeholder="ABC-123" value={placa}
                onChange={e => setPlaca(e.target.value)} style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="field">
              <label className="field-l">Modelo *</label>
              <input className="field-i" placeholder="Nissan Versa" value={modelo}
                onChange={e => setModelo(e.target.value)} />
            </div>
          </div>

          {/* Año + Color */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label className="field-l">Año</label>
              <input className="field-i" placeholder="2024" value={anio} inputMode="numeric"
                onChange={e => setAnio(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className="field">
              <label className="field-l">Color</label>
              <input className="field-i" placeholder="Blanco" value={color}
                onChange={e => setColor(e.target.value)} />
            </div>
          </div>

          {/* Tono SVG */}
          <div className="field">
            <label className="field-l">Tono (color del ícono)</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(TONE_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => setTono(key)}
                  style={{
                    padding: '5px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: '1.5px solid', cursor: 'pointer',
                    borderColor: tono === key ? TONES[key][0] : 'var(--line)',
                    background: tono === key ? TONES[key][1] : 'transparent',
                    color: tono === key ? TONES[key][0] : 'var(--ink2)',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: TONES[key][0], display: 'inline-block', flexShrink: 0 }} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Segmento + Transmisión */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label className="field-l">Segmento</label>
              <select className="field-i" value={segmento} onChange={e => setSegmento(e.target.value)}>
                {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-l">Transmisión</label>
              <select className="field-i" value={transmision} onChange={e => setTransmision(e.target.value)}>
                <option>Automático</option>
                <option>Manual</option>
              </select>
            </div>
          </div>

          {/* Tarifa */}
          <div className="field">
            <label className="field-l">Tarifa diaria</label>
            <div className="field-money">
              <span>$</span>
              <input className="field-i" placeholder="0" value={tarifa} inputMode="decimal"
                onChange={e => setTarifa(e.target.value.replace(/[^0-9.]/g, ''))} />
              <span style={{ color: 'var(--ink3)', fontSize: 13, paddingRight: 2 }}>/día</span>
            </div>
          </div>

          {/* KM + Combustible */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label className="field-l">Kilometraje</label>
              <input className="field-i" placeholder="0" value={km} inputMode="numeric"
                onChange={e => setKm(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className="field">
              <label className="field-l">Combustible %</label>
              <input className="field-i" placeholder="100" value={combustible} inputMode="numeric"
                onChange={e => setCombustible(Math.min(100, parseInt(e.target.value.replace(/\D/g, '')) || 0).toString())} />
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: '#c0392b', padding: '8px 12px', borderRadius: 8, background: 'oklch(96% 0.03 20)' }}>
              {error}
            </div>
          )}
        </div>

        <div className="qpanel-foot">
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center', fontSize: 15 }}
            onClick={handleGuardar} disabled={saving}>
            {saving
              ? <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Guardando…</>
              : <><Check size={15} />Agregar vehículo</>}
          </button>
        </div>
      </div>
    </>
  )
}

/* ─── Main Screen ───────────────────────────────────────────── */
export default function VehiclesScreen() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [filter,       setFilter]       = useState('todos')
  const [segFilter,    setSegFilter]    = useState('todos')
  const [showFilters,  setShowFilters]  = useState(false)
  const [fleet,        setFleet]        = useState<Vehiculo[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [panelOpen,    setPanelOpen]    = useState(false)

  async function fetchFleet() {
    setLoading(true)
    const { data, error } = await supabase.from('vehiculos').select('*').order('modelo')
    if (error) setError('No se pudo cargar la flota')
    else setFleet(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchFleet() }, [])

  // Unique segments from actual fleet data
  const segments = ['todos', ...Array.from(new Set(fleet.map(v => v.segmento).filter(Boolean) as string[])).sort()]

  const count = (status: string) => fleet.filter(v => v.status === status).length
  const available = count('disponible')
  const rented    = count('rentado')
  const reserved  = count('reservado')
  const workshop  = count('taller')
  const total     = fleet.length

  const filtered = fleet.filter(v =>
    (filter === 'todos' || v.status === filter) &&
    (segFilter === 'todos' || v.segmento === segFilter)
  )

  return (
    <div className="screen">
      <AgregarPanel open={panelOpen} onClose={() => setPanelOpen(false)} onCreated={fetchFleet} />

      {/* Page head */}
      <div className="pagehead">
        <div>
          <div className="eyebrow">Flota</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>Vehículos</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4 }}>
            {loading ? 'Cargando…' : `${total} unidades · ${available} disponible${available !== 1 ? 's' : ''} ahora`}
          </p>
        </div>
        <div className="pagehead-actions">
          <button
            className={`btn sm${showFilters ? ' primary' : ''}`}
            onClick={() => { setShowFilters(v => !v); setSegFilter('todos') }}
          >
            <SlidersHorizontal size={14} />Filtros{segFilter !== 'todos' ? ' ·' + segFilter : ''}
          </button>
          {isAdmin && (
            <button className="btn sm primary" onClick={() => setPanelOpen(true)}>
              <Plus size={14} />Agregar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', background: 'var(--danger-soft)', border: '1px solid var(--danger-line)', borderRadius: 'var(--radius-sm)', color: 'var(--danger-ink)', fontSize: 14, marginBottom: 'var(--gap)' }}>
          {error}
        </div>
      )}

      {/* Stat grid */}
      <div className="statgrid">
        <StatCard label="Disponibles" value={available} sub="listos para rentar" />
        <StatCard label="Rentados"    value={rented}    sub="en la calle" />
        <StatCard label="Reservados"  value={reserved}  sub="próximas salidas" />
        <StatCard label="En taller"   value={workshop}  sub="mantenimiento" />
      </div>

      {/* Status filter bar */}
      <div className="filterbar">
        {FILTER_TABS.map(tab => {
          const c = tab.key === 'todos' ? total : count(tab.key)
          return (
            <button key={tab.key} className={`fbtn${filter === tab.key ? ' on' : ''}`}
              onClick={() => setFilter(tab.key)}>
              {tab.label} <span className="fbtn-n">{c}</span>
            </button>
          )
        })}
      </div>

      {/* Segment filter row (expandable) */}
      {showFilters && segments.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 'var(--gap)' }}>
          <span style={{ fontSize: 12, color: 'var(--ink3)', alignSelf: 'center', fontWeight: 600 }}>Segmento:</span>
          {segments.map(seg => (
            <button key={seg}
              onClick={() => setSegFilter(seg)}
              style={{
                padding: '5px 13px', borderRadius: 20, fontSize: 12.5, fontWeight: segFilter === seg ? 600 : 400,
                border: '1.5px solid', cursor: 'pointer',
                borderColor: segFilter === seg ? 'var(--primary)' : 'var(--line)',
                background:  segFilter === seg ? 'var(--primary-soft)' : 'transparent',
                color:       segFilter === seg ? 'var(--primary)' : 'var(--ink2)',
              }}>
              {seg === 'todos' ? 'Todos' : seg}
              <span style={{ marginLeft: 5, opacity: 0.6, fontSize: 11 }}>
                {seg === 'todos' ? total : fleet.filter(v => v.segmento === seg).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Fleet grid */}
      {loading ? (
        <div className="fleetgrid">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--ink4)', padding: '48px 0', fontSize: 14 }}>
          Sin vehículos en esta categoría
        </p>
      ) : (
        <div className="fleetgrid">
          {filtered.map(v => (
            <FleetCard key={v.id} v={v} onClick={() => navigate(`/app/vehicles/${v.placa}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
