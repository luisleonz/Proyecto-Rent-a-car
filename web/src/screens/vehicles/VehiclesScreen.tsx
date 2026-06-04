import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, SlidersHorizontal, Gauge, Fuel, Settings2, User } from 'lucide-react'
import { sampleFleet, Vehicle } from '../../data/sampleData'

/* ─── Status config ─────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, {
  label: string
  dotColor: string
  bgColor: string
  bodyColor: string
  glassColor: string
  textColor: string
}> = {
  disponible: {
    label: 'Disponible',
    dotColor: '#2D8A56',
    bgColor: '#E2EBE4',
    bodyColor: '#8AACB4',
    glassColor: 'rgba(255,255,255,0.5)',
    textColor: '#2D8A56',
  },
  rentado: {
    label: 'Rentado',
    dotColor: '#5E95C0',
    bgColor: '#D8E8F0',
    bodyColor: '#5E95C0',
    glassColor: 'rgba(255,255,255,0.5)',
    textColor: '#2966A0',
  },
  taller: {
    label: 'En taller',
    dotColor: '#C47A6A',
    bgColor: '#F0E0DC',
    bodyColor: '#C47A6A',
    glassColor: 'rgba(255,255,255,0.5)',
    textColor: '#9E4535',
  },
  reservado: {
    label: 'Reservado',
    dotColor: '#8888B8',
    bgColor: '#E5E5F0',
    bodyColor: '#8888B8',
    glassColor: 'rgba(255,255,255,0.5)',
    textColor: '#4444AA',
  },
}

/* ─── Car SVG ───────────────────────────────────────────────── */
function CarSilhouette({ bodyColor, glassColor }: { bodyColor: string; glassColor: string }) {
  return (
    <svg viewBox="0 0 200 72" fill="none" className="w-full max-w-[180px]">
      {/* Body */}
      <path
        d="M12 50 C12 44 15 42 20 42 L48 42 C54 27 70 17 100 15 C130 13 152 23 162 42 L182 42 C187 42 190 44 190 50 L190 58 C190 62 187 64 182 64 L18 64 C14 64 12 62 12 58 Z"
        fill={bodyColor}
      />
      {/* Cabin */}
      <path
        d="M52 42 C56 26 70 17 100 15 C130 13 148 24 156 42 Z"
        fill={bodyColor}
        opacity="0.85"
      />
      {/* Front glass */}
      <path d="M112 16 L154 42 L132 42 Z" fill={glassColor} />
      {/* Rear glass */}
      <path d="M58 42 L82 42 L74 22 Z" fill={glassColor} />
      {/* Wheels */}
      <circle cx="54" cy="64" r="14" fill="#1E1E26" />
      <circle cx="54" cy="64" r="7" fill="#585868" />
      <circle cx="54" cy="64" r="3" fill="#838390" />
      <circle cx="154" cy="64" r="14" fill="#1E1E26" />
      <circle cx="154" cy="64" r="7" fill="#585868" />
      <circle cx="154" cy="64" r="3" fill="#838390" />
    </svg>
  )
}

/* ─── Vehicle Card ──────────────────────────────────────────── */
function VehicleCard({ v, onClick }: { v: Vehicle; onClick: () => void }) {
  const cfg = STATUS_CONFIG[v.status] ?? STATUS_CONFIG.disponible
  const isAvailable = v.status === 'disponible'

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden flex flex-col text-left transition-shadow hover:shadow-md active:scale-[0.98]"
      style={{ border: '1px solid #EAEAE4' }}
    >
      {/* Image area */}
      <div
        className="relative flex flex-col items-center justify-center px-5 pt-5 pb-4"
        style={{ backgroundColor: cfg.bgColor, minHeight: 120 }}
      >
        {/* Status chip top-left */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dotColor }} />
          <span className="text-[10px] font-semibold font-sans" style={{ color: cfg.textColor }}>
            {cfg.label}
          </span>
        </div>

        {/* Car silhouette */}
        <CarSilhouette bodyColor={cfg.bodyColor} glassColor={cfg.glassColor} />

        {/* Plate badge bottom-center */}
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.08)' }}
        >
          <span className="font-mono text-[10px] font-bold" style={{ color: '#1E1E26' }}>{v.plate}</span>
        </div>
      </div>

      {/* Info area */}
      <div className="px-3.5 pt-3 pb-3 flex flex-col gap-1.5">
        {/* Model + plate */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold font-sans leading-snug" style={{ color: '#1E1E26' }}>{v.model}</p>
          <span className="font-mono text-[10px] font-semibold flex-shrink-0 mt-0.5" style={{ color: '#838390' }}>
            {v.plate}
          </span>
        </div>

        {/* Segment · year · color */}
        <p className="text-xs font-sans" style={{ color: '#838390' }}>
          {v.segment ?? 'Sedán'} · {v.year} · {v.color}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-0.5">
          <div className="flex items-center gap-1">
            <Gauge size={11} style={{ color: '#838390', flexShrink: 0 }} />
            <span className="text-[11px] font-mono font-medium" style={{ color: '#585868' }}>{v.km} km</span>
          </div>
          {v.fuel != null && (
            <div className="flex items-center gap-1">
              <Fuel size={11} style={{ color: '#838390', flexShrink: 0 }} />
              <span className="text-[11px] font-mono font-medium" style={{ color: '#585868' }}>{v.fuel} %</span>
            </div>
          )}
          {v.transmission && (
            <div className="flex items-center gap-1">
              <Settings2 size={11} style={{ color: '#838390', flexShrink: 0 }} />
              <span className="text-[11px] font-sans font-medium" style={{ color: '#585868' }}>{v.transmission}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px w-full mt-1" style={{ backgroundColor: '#EAEAE4' }} />

        {/* Footer */}
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <User size={11} style={{ color: '#838390', flexShrink: 0 }} />
            {isAvailable ? (
              <span className="text-[11px] font-sans" style={{ color: '#838390' }}>Listo para rentar</span>
            ) : v.currentClient ? (
              <span className="text-[11px] font-sans truncate" style={{ color: '#585868' }}>
                {v.currentClient}
                {v.clientInfo ? ` · vence ${v.clientInfo}` : ''}
              </span>
            ) : v.clientInfo ? (
              <span className="text-[11px] font-sans truncate" style={{ color: '#585868' }}>{v.clientInfo}</span>
            ) : null}
          </div>
          {v.dailyRate != null && (
            <span className="text-xs font-bold font-mono flex-shrink-0" style={{ color: '#2D8A56' }}>
              ${v.dailyRate.toLocaleString('es-MX')}/día
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

/* ─── Filter tabs config ────────────────────────────────────── */
const FILTER_TABS = [
  { label: 'Todos',       key: 'todos' },
  { label: 'Disponibles', key: 'disponible' },
  { label: 'Rentados',    key: 'rentado' },
  { label: 'Reservados',  key: 'reservado' },
  { label: 'En taller',   key: 'taller' },
]

/* ─── Main Screen ───────────────────────────────────────────── */
export default function VehiclesScreen() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('todos')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)

  const available = sampleFleet.filter(v => v.status === 'disponible').length
  const rented    = sampleFleet.filter(v => v.status === 'rentado').length
  const reserved  = sampleFleet.filter(v => v.status === 'reservado').length
  const workshop  = sampleFleet.filter(v => v.status === 'taller').length
  const total     = sampleFleet.length

  const filtered = sampleFleet.filter(v => {
    const matchesFilter = filter === 'todos' || v.status === filter
    const q = query.toLowerCase()
    const matchesQuery = !q || v.plate.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)
    return matchesFilter && matchesQuery
  })

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5EF' }}>
      {/* Mobile AppBar */}
      <div className="md:hidden bg-white px-4 py-3 flex items-center gap-2 border-b border-hairline">
        {searching ? (
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onBlur={() => { if (!query) setSearching(false) }}
            placeholder="Placa o modelo…"
            className="flex-1 text-sm font-sans outline-none bg-transparent"
            style={{ color: '#1E1E26' }}
          />
        ) : (
          <h1 className="flex-1 text-xl font-bold font-serif" style={{ color: '#1E1E26' }}>Flota</h1>
        )}
        <button className="p-2" onClick={() => setSearching(s => !s)}>
          <Search size={20} style={{ color: '#585868' }} />
        </button>
      </div>

      {/* Page header */}
      <div className="px-8 pt-6 pb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-sans uppercase tracking-widest" style={{ color: '#838390' }}>FLOTA</p>
          <h1 className="font-serif text-4xl font-bold mt-1" style={{ color: '#1E1E26' }}>Vehículos</h1>
          <p className="text-sm font-sans mt-1" style={{ color: '#838390' }}>
            {total} unidades · {available} disponible{available !== 1 ? 's' : ''} ahora
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-shrink-0">
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold font-sans border transition-colors"
            style={{ borderColor: '#DEDED8', color: '#585868', backgroundColor: 'white' }}
          >
            <SlidersHorizontal size={14} />
            Filtros
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold font-sans text-white transition-opacity active:opacity-80"
            style={{ backgroundColor: '#2D8A56' }}
          >
            <Plus size={14} />
            Agregar
          </button>
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="px-8 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'DISPONIBLES', value: available, valueColor: '#2D8A56', sub: 'listos para rentar' },
          { label: 'RENTADOS',    value: rented,    valueColor: '#2D8A56', sub: 'en la calle' },
          { label: 'RESERVADOS',  value: reserved,  valueColor: '#4444AA', sub: 'próximas salidas' },
          { label: 'EN TALLER',   value: workshop,  valueColor: '#C98A20', sub: 'mantenimiento' },
        ].map(({ label, value, valueColor, sub }) => (
          <div
            key={label}
            className="bg-white rounded-2xl px-4 py-3.5 flex flex-col gap-0.5"
            style={{ border: '1px solid #EAEAE4' }}
          >
            <p className="text-[10px] font-sans font-semibold uppercase tracking-widest" style={{ color: '#838390' }}>
              {label}
            </p>
            <p className="font-mono font-bold text-3xl leading-tight" style={{ color: valueColor }}>{value}</p>
            <p className="text-xs font-sans" style={{ color: '#838390' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="px-8 pb-4 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {FILTER_TABS.map(tab => {
          const count = tab.key === 'todos' ? total
            : sampleFleet.filter(v => v.status === tab.key).length
          const active = filter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold font-sans transition-colors"
              style={{
                backgroundColor: active ? '#1E1E26' : 'transparent',
                color: active ? 'white' : '#838390',
                border: active ? '1px solid #1E1E26' : '1px solid #DEDED8',
              }}
            >
              {tab.label} <span className="font-mono">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Vehicle grid */}
      <div className="px-8 pb-28 flex-1">
        {filtered.length === 0 ? (
          <p className="text-center text-sm font-sans py-16" style={{ color: '#BCBCC4' }}>
            Sin vehículos en esta categoría
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(v => (
              <VehicleCard
                key={v.plate}
                v={v}
                onClick={() => navigate(`/app/vehicles/${v.plate}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
