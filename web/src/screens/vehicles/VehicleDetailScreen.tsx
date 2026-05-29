import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MoreVertical, User, CalendarDays, Wrench, History, ChevronRight } from 'lucide-react'
import { sampleFleet } from '../../data/sampleData'
import StatusChip from '../../components/StatusChip'

export default function VehicleDetailScreen() {
  const { plate } = useParams<{ plate: string }>()
  const navigate = useNavigate()
  const vehicle = sampleFleet.find(v => v.plate === plate) ?? sampleFleet[0]

  const sections = [
    ...(vehicle.status === 'rentado' && vehicle.currentClient
      ? [{ icon: User, title: 'Renta actual', subtitle: `${vehicle.currentClient} · ${vehicle.clientInfo ?? ''}`, color: '#2D8A56' }]
      : []),
    { icon: CalendarDays, title: 'Próximas reservas', subtitle: '2 reservas programadas', color: '#4444AA' },
    { icon: Wrench, title: 'Mantenimiento', subtitle: 'Último servicio: hace 3 meses', color: '#C98A20' },
    { icon: History, title: 'Historial de rentas', subtitle: '18 rentas completadas', color: '#838390' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF7' }}>
      {/* AppBar */}
      <div className="bg-white flex items-center gap-1 px-2 py-2 border-b border-hairline">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft size={22} style={{ color: '#1E1E26' }} />
        </button>
        <p className="flex-1 text-base font-semibold font-sans" style={{ color: '#1E1E26' }}>{vehicle.model}</p>
        <button className="p-2"><MoreVertical size={20} style={{ color: '#585868' }} /></button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Dark hero */}
        <div className="p-5" style={{ backgroundColor: '#1E1E26' }}>
          {/* Stylized car silhouette */}
          <div className="flex flex-col items-center gap-1 py-4 mb-4">
            <div className="rounded-3xl" style={{ width: 180, height: 38, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <div className="rounded-xl" style={{ width: 220, height: 34, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Plate + status */}
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono font-semibold text-white" style={{ fontSize: 20 }}>{vehicle.plate}</span>
            <StatusChip status={vehicle.status} />
          </div>
          <p className="text-xs font-sans mb-5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {vehicle.model} · {vehicle.year} · {vehicle.color}
          </p>

          <div className="h-px mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />

          <div className="flex justify-between">
            {[
              { label: 'Kilometraje', value: `${vehicle.km} km` },
              { label: 'Combustible', value: '3/4' },
              { label: 'Tarifa diaria', value: '$680' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-mono font-bold text-base text-white">{value}</p>
                <p className="text-xs font-sans" style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sections card */}
        <div className="mx-4 mt-4 bg-white rounded-2xl border border-hairline overflow-hidden">
          {sections.map(({ icon: Icon, title, subtitle, color }, i) => (
            <div key={title}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: color + '18' }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold font-sans" style={{ color: '#1E1E26' }}>{title}</p>
                  <p className="text-xs font-sans" style={{ color: '#838390' }}>{subtitle}</p>
                </div>
                <ChevronRight size={16} style={{ color: '#BCBCC4' }} />
              </div>
              {i < sections.length - 1 && <div className="h-px ml-16" style={{ backgroundColor: '#EAEAE4' }} />}
            </div>
          ))}
        </div>

        {/* Action button */}
        <div className="px-4 mt-6">
          <button
            disabled={vehicle.status !== 'rentado'}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-opacity"
            style={{
              backgroundColor: vehicle.status === 'rentado' ? '#2D8A56' : '#BCBCC4',
              opacity: vehicle.status === 'rentado' ? 1 : 0.7,
            }}
          >
            {vehicle.status === 'rentado' ? 'Registrar devolución' : 'No disponible'}
          </button>
        </div>
      </div>
    </div>
  )
}
