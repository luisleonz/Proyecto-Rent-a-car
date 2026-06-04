import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, SlidersHorizontal, Gauge, Fuel, Settings2, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Vehiculo } from '../../lib/database.types'

/* ─── Tone → colors ─────────────────────────────────────────── */
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
  disponible: 'primary', rentado: '', taller: 'warn', reservado: '',
}
const STATUS_DOT: Record<string, string> = {
  disponible: '', rentado: '', taller: 'warn', reservado: 'neutral',
}

/* ─── Car Photo ─────────────────────────────────────────────── */
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
          <span><Gauge size={13} />{(v.km ?? 0).toLocaleString('es-MX')} km</span>
          {v.combustible != null && <span><Fuel size={13} />{v.combustible}%</span>}
          {v.transmision && <span><Settings2 size={13} />{v.transmision}</span>}
        </div>
        <div className="fc-foot">
          <div className="fc-who">
            <User size={13} style={{ color: 'var(--ink3)', flexShrink: 0 }} />
            {isAvailable ? (
              <span style={{ color: 'var(--ink3)', fontSize: 13 }}>Listo para rentar</span>
            ) : v.cliente_actual ? (
              <span>
                {v.cliente_actual}
                {v.info_cliente && <span className="fc-vence"> · {v.info_cliente}</span>}
              </span>
            ) : v.info_cliente ? (
              <span style={{ color: 'var(--ink3)', fontSize: 13 }}>{v.info_cliente}</span>
            ) : null}
          </div>
          {v.tarifa_diaria != null && (
            <div className="fc-rate">
              ${Number(v.tarifa_diaria).toLocaleString('es-MX')}<small>/día</small>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

/* ─── Filter tabs ───────────────────────────────────────────── */
const FILTER_TABS = [
  { label: 'Todos',       key: 'todos' },
  { label: 'Disponibles', key: 'disponible' },
  { label: 'Rentados',    key: 'rentado' },
  { label: 'Reservados',  key: 'reservado' },
  { label: 'En taller',   key: 'taller' },
]

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="card statcard">
      <div className="eyebrow">{label}</div>
      <div className="statval mono">{value}</div>
      <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>{sub}</div>
    </div>
  )
}

/* ─── Skeleton loader ───────────────────────────────────────── */
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

/* ─── Main Screen ───────────────────────────────────────────── */
export default function VehiclesScreen() {
  const navigate = useNavigate()
  const [filter, setFilter]     = useState('todos')
  const [fleet, setFleet]       = useState<Vehiculo[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    async function fetchFleet() {
      setLoading(true)
      const { data, error } = await supabase
        .from('vehiculos')
        .select('*')
        .order('modelo')

      if (error) {
        setError('No se pudo cargar la flota')
      } else {
        setFleet(data ?? [])
      }
      setLoading(false)
    }
    fetchFleet()
  }, [])

  const count = (status: string) => fleet.filter(v => v.status === status).length
  const available = count('disponible')
  const rented    = count('rentado')
  const reserved  = count('reservado')
  const workshop  = count('taller')
  const total     = fleet.length

  const filtered = fleet.filter(v => filter === 'todos' || v.status === filter)

  return (
    <div className="screen">
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
          <button className="btn sm"><SlidersHorizontal size={14} />Filtros</button>
          <button className="btn sm primary"><Plus size={14} />Agregar</button>
        </div>
      </div>

      {/* Error */}
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

      {/* Filter bar */}
      <div className="filterbar">
        {FILTER_TABS.map(tab => {
          const c = tab.key === 'todos' ? total : count(tab.key)
          return (
            <button
              key={tab.key}
              className={`fbtn${filter === tab.key ? ' on' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label} <span className="fbtn-n">{c}</span>
            </button>
          )
        })}
      </div>

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
