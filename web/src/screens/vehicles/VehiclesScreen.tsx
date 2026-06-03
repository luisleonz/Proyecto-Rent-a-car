import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { sampleFleet, Vehicle } from '../../data/sampleData'
import StatusChip from '../../components/StatusChip'

const FILTERS = ['Todos', 'Disponibles', 'Rentados', 'Taller']

const STATUS_ACCENT: Record<string, string> = {
  disponible: '#2D8A56',
  rentado:    '#1F6B40',
  taller:     '#C98A20',
  reservado:  '#4444AA',
}

const SILHOUETTE_COLORS: Record<string, { body: string; glass: string }> = {
  disponible: { body: '#2D8A56', glass: '#7FD9A8' },
  rentado:    { body: '#1F6B40', glass: '#4BAE78' },
  taller:     { body: '#C98A20', glass: '#F0C060' },
  reservado:  { body: '#4444AA', glass: '#8888DD' },
}

function CarSilhouette({ status }: { status: string }) {
  const c = SILHOUETTE_COLORS[status] ?? SILHOUETTE_COLORS.disponible
  return (
    <svg viewBox="0 0 120 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Body */}
      <rect x="6" y="22" width="108" height="18" rx="5" fill={c.body} opacity="0.9" />
      {/* Cabin */}
      <path d="M28 22 C32 10 42 8 60 8 C78 8 88 10 92 22Z" fill={c.body} />
      {/* Windshield front */}
      <path d="M62 10 C74 10 82 14 88 22 L70 22Z" fill={c.glass} opacity="0.7" />
      {/* Windshield rear */}
      <path d="M30 22 L50 22 L50 22 C46 14 38 11 32 12Z" fill={c.glass} opacity="0.7" />
      {/* Wheels */}
      <circle cx="28" cy="40" r="7" fill="#1E1E26" />
      <circle cx="28" cy="40" r="3.5" fill="#585868" />
      <circle cx="92" cy="40" r="7" fill="#1E1E26" />
      <circle cx="92" cy="40" r="3.5" fill="#585868" />
    </svg>
  )
}

function VehicleCard({ v, onClick }: { v: Vehicle; onClick: () => void }) {
  const accent = STATUS_ACCENT[v.status] ?? '#838390'
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-hairline overflow-hidden flex flex-col text-left transition-shadow hover:shadow-md active:scale-95"
    >
      {/* Silhouette hero */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-center"
        style={{ backgroundColor: (SILHOUETTE_COLORS[v.status] ?? SILHOUETTE_COLORS.disponible).body + '18' }}>
        <div className="w-full max-w-[140px]">
          <CarSilhouette status={v.status} />
        </div>
      </div>

      {/* Info */}
      <div className="px-3 pb-3 pt-2 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-1">
          <span className="font-mono text-xs font-bold" style={{ color: '#1E1E26' }}>{v.plate}</span>
          <StatusChip status={v.status} />
        </div>
        <p className="text-xs font-sans leading-snug" style={{ color: '#585868' }}>{v.model}</p>
        <p className="text-xs font-sans" style={{ color: '#838390' }}>{v.color} · {v.year}</p>

        {/* Stats row */}
        <div className="flex gap-2 mt-1 pt-2 border-t" style={{ borderColor: '#EAEAE4' }}>
          <div className="flex-1 text-center">
            <p className="font-mono text-xs font-bold" style={{ color: accent }}>{v.km}</p>
            <p className="text-[10px] font-sans" style={{ color: '#838390' }}>km</p>
          </div>
          {v.currentClient && (
            <div className="flex-1 text-center border-l" style={{ borderColor: '#EAEAE4' }}>
              <p className="text-xs font-semibold font-sans truncate" style={{ color: accent }}>{v.currentClient}</p>
              <p className="text-[10px] font-sans" style={{ color: '#838390' }}>{v.clientInfo ?? 'activo'}</p>
            </div>
          )}
          {!v.currentClient && v.clientInfo && (
            <div className="flex-1 text-center border-l" style={{ borderColor: '#EAEAE4' }}>
              <p className="text-xs font-semibold font-sans truncate" style={{ color: accent }}>{v.clientInfo}</p>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

export default function VehiclesScreen() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('Todos')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)

  const filtered = sampleFleet.filter(v => {
    const matchesFilter =
      filter === 'Disponibles' ? v.status === 'disponible' :
      filter === 'Rentados'    ? v.status === 'rentado' :
      filter === 'Taller'      ? v.status === 'taller' : true
    const q = query.toLowerCase()
    const matchesQuery = !q || v.plate.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)
    return matchesFilter && matchesQuery
  })

  const rented    = sampleFleet.filter(v => v.status === 'rentado').length
  const workshop  = sampleFleet.filter(v => v.status === 'taller').length
  const reserved  = sampleFleet.filter(v => v.status === 'reservado').length
  const available = sampleFleet.filter(v => v.status === 'disponible').length
  const total     = sampleFleet.length

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF7' }}>
      {/* AppBar */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-hairline">
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

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 flex flex-col gap-4">
        {/* Occupancy bar */}
        <div className="bg-white rounded-2xl border border-hairline p-4">
          <div className="flex justify-between mb-3">
            <p className="text-sm font-semibold font-sans" style={{ color: '#1E1E26' }}>Ocupación</p>
            <p className="text-xs font-sans" style={{ color: '#838390' }}>{total} vehículos</p>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden mb-3 gap-px">
            {rented    > 0 && <div style={{ flex: rented,    backgroundColor: '#2D8A56' }} />}
            {workshop  > 0 && <div style={{ flex: workshop,  backgroundColor: '#C98A20' }} />}
            {reserved  > 0 && <div style={{ flex: reserved,  backgroundColor: '#4444AA' }} />}
            {available > 0 && <div style={{ flex: available, backgroundColor: '#D0D0C8' }} />}
          </div>
          <div className="flex gap-4 flex-wrap">
            {[
              { color: '#2D8A56', label: `Rentados ${rented}` },
              { color: '#C98A20', label: `Taller ${workshop}` },
              { color: '#4444AA', label: `Reservado ${reserved}` },
              { color: '#D0D0C8', label: `Libre ${available}` },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs font-sans" style={{ color: '#838390' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Segmented filter */}
        <div className="flex rounded-xl overflow-hidden p-1 gap-1" style={{ backgroundColor: '#EAEAE4' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-1 py-2 rounded-lg text-xs font-sans transition-colors"
              style={{
                backgroundColor: filter === f ? 'white' : 'transparent',
                color: filter === f ? '#2D8A56' : '#838390',
                fontWeight: filter === f ? 600 : 400,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Vehicle grid */}
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(v => (
            <VehicleCard
              key={v.plate}
              v={v}
              onClick={() => navigate(`/app/vehicles/${v.plate}`)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm font-sans py-12" style={{ color: '#BCBCC4' }}>
            Sin vehículos en esta categoría
          </p>
        )}
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-opacity active:opacity-80 md:bottom-6"
        style={{ backgroundColor: '#2D8A56' }}
      >
        <Plus size={24} className="text-white" />
      </button>
    </div>
  )
}
