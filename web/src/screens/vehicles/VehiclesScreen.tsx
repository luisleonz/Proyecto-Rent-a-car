import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Plus, ChevronRight } from 'lucide-react'
import { sampleFleet, Vehicle } from '../../data/sampleData'
import StatusChip from '../../components/StatusChip'

const FILTERS = ['Todos', 'Disponibles', 'Rentados', 'Taller']

function VehicleRow({ v, onClick }: { v: Vehicle; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-3.5 text-left">
      {/* Status bar */}
      <div className="w-1 h-10 rounded-full flex-shrink-0"
        style={{
          backgroundColor:
            v.status === 'disponible' ? '#2D8A56' :
            v.status === 'rentado' ? '#1F6B40' :
            v.status === 'taller' ? '#C98A20' : '#9999CC'
        }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-xs font-semibold" style={{ color: '#1E1E26' }}>{v.plate}</span>
          <StatusChip status={v.status} />
        </div>
        <p className="text-sm font-sans truncate" style={{ color: '#1E1E26' }}>{v.model} · {v.color}</p>
        {v.currentClient || v.clientInfo ? (
          <p className="text-xs font-sans truncate mt-0.5" style={{ color: '#838390' }}>
            {[v.currentClient, v.clientInfo].filter(Boolean).join(' · ')}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="font-mono text-xs" style={{ color: '#838390' }}>{v.km} km</span>
        <ChevronRight size={16} style={{ color: '#BCBCC4' }} />
      </div>
    </button>
  )
}

export default function VehiclesScreen() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('Todos')

  const filtered = sampleFleet.filter(v => {
    if (filter === 'Disponibles') return v.status === 'disponible'
    if (filter === 'Rentados') return v.status === 'rentado'
    if (filter === 'Taller') return v.status === 'taller'
    return true
  })

  const rented = sampleFleet.filter(v => v.status === 'rentado').length
  const workshop = sampleFleet.filter(v => v.status === 'taller').length
  const reserved = sampleFleet.filter(v => v.status === 'reservado').length
  const available = sampleFleet.filter(v => v.status === 'disponible').length
  const total = sampleFleet.length

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF7' }}>
      {/* AppBar */}
      <div className="bg-white px-4 py-3 flex items-center gap-1 border-b border-hairline">
        <h1 className="flex-1 text-xl font-bold font-serif" style={{ color: '#1E1E26' }}>Vehículos</h1>
        <button className="p-2"><Search size={20} style={{ color: '#585868' }} /></button>
        <button className="p-2"><Filter size={20} style={{ color: '#585868' }} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-4">
        {/* Occupancy card */}
        <div className="bg-white rounded-2xl border border-hairline p-4">
          <div className="flex justify-between mb-3">
            <p className="text-sm font-semibold font-sans" style={{ color: '#1E1E26' }}>Ocupación</p>
            <p className="text-xs font-sans" style={{ color: '#838390' }}>{total} vehículos</p>
          </div>
          {/* Progress bar */}
          <div className="flex h-2.5 rounded-full overflow-hidden mb-3">
            {rented > 0 && <div style={{ flex: rented, backgroundColor: '#2D8A56' }} />}
            {workshop > 0 && <div style={{ flex: workshop, backgroundColor: '#C98A20' }} />}
            {reserved > 0 && <div style={{ flex: reserved, backgroundColor: '#9999CC' }} />}
            {available > 0 && <div style={{ flex: available, backgroundColor: '#BCBCC4' }} />}
          </div>
          {/* Legend */}
          <div className="flex gap-4 flex-wrap">
            {[
              { color: '#2D8A56', label: `Rentados ${rented}` },
              { color: '#C98A20', label: `Taller ${workshop}` },
              { color: '#9999CC', label: `Reservado ${reserved}` },
              { color: '#BCBCC4', label: `Libre ${available}` },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs font-sans" style={{ color: '#838390' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Segmented filter */}
        <div className="flex rounded-xl overflow-hidden p-1 gap-1" style={{ backgroundColor: '#F0F0F0' }}>
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

        {/* Vehicle list */}
        <div className="bg-white rounded-2xl border border-hairline px-4 overflow-hidden">
          {filtered.map((v, i) => (
            <div key={v.plate}>
              <VehicleRow v={v} onClick={() => navigate(`/app/vehicles/${v.plate}`)} />
              {i < filtered.length - 1 && <div className="h-px" style={{ backgroundColor: '#EAEAE4' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-opacity active:opacity-80"
        style={{ backgroundColor: '#2D8A56' }}
      >
        <Plus size={24} className="text-white" />
      </button>
    </div>
  )
}
