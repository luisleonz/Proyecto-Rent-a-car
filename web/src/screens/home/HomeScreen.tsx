import { useNavigate } from 'react-router-dom'
import { Bell, Wrench } from 'lucide-react'
import { sampleKpi, todayReservations } from '../../data/sampleData'
import { useAuth } from '../../state/auth'
import AvatarCircle from '../../components/AvatarCircle'
import SectionEyebrow from '../../components/SectionEyebrow'
import StatusChip from '../../components/StatusChip'

export default function HomeScreen() {
  const navigate = useNavigate()
  const { currentFirstName, currentInitials } = useAuth()
  const kpi = sampleKpi

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF7' }}>
      {/* AppBar */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-hairline">
        <div className="flex-1">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-base font-sans" style={{ color: '#1E1E26' }}>Buenos días, </span>
            <span className="font-serif italic text-lg" style={{ color: '#2D8A56' }}>{currentFirstName || 'Luciano'}</span>
          </div>
          <p className="text-xs font-sans" style={{ color: '#838390' }}>Martes 21 de mayo · 12 movimientos hoy</p>
        </div>
        <div className="relative">
          <Bell size={22} style={{ color: '#585868' }} />
          <div className="absolute top-0 right-0 w-2 h-2 rounded-full" style={{ backgroundColor: '#C98A20' }} />
        </div>
        <AvatarCircle initials={currentInitials || 'LA'} size={36} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-4">
        {/* KPI dark card */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#1E1E26' }}>
          <SectionEyebrow text="Ingresos de hoy" color="rgba(255,255,255,0.6)" />
          <div className="flex items-end gap-3 mt-1.5 mb-5">
            <span className="font-mono font-bold text-white" style={{ fontSize: 40, lineHeight: 1.1 }}>
              {kpi.incomeToday}
            </span>
            <span className="text-xs font-semibold font-sans rounded-md px-2 py-0.5 mb-1"
              style={{ backgroundColor: 'rgba(45,138,86,0.35)', color: '#7FD9A8' }}>
              {kpi.incomeChange}
            </span>
          </div>

          <div className="h-px w-full mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />

          <div className="flex justify-between">
            {[
              { label: 'Rentados', value: `${kpi.rented}/${kpi.total}`, color: '#2D8A56' },
              { label: 'Entregas hoy', value: String(kpi.deliveries), color: 'white' },
              { label: 'En taller', value: String(kpi.inWorkshop), color: '#C98A20' },
            ].map(({ label, value, color }, i) => (
              <div key={i} className="flex items-stretch gap-0">
                {i > 0 && <div className="w-px mx-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />}
                <div className="text-center">
                  <p className="font-mono font-bold text-xl" style={{ color }}>{value}</p>
                  <p className="text-xs font-sans" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agenda card */}
        <div className="bg-white rounded-2xl border border-hairline overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
            <p className="text-sm font-semibold font-sans" style={{ color: '#1E1E26' }}>Agenda de hoy</p>
            <button onClick={() => navigate('/app/reservations')}
              className="text-xs font-sans font-medium" style={{ color: '#2D8A56' }}>
              Ver todo
            </button>
          </div>
          {todayReservations.map((r, i) => {
            const urgent = r.status === 'urgent'
            return (
              <div key={r.id}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="font-mono text-xs w-10 flex-shrink-0 text-right"
                    style={{ color: urgent ? '#C04040' : '#838390' }}>
                    {r.time}
                  </span>
                  <AvatarCircle initials={r.clientInitials} size={36}
                    accent={urgent ? '#C04040' : '#2D8A56'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold font-sans truncate" style={{ color: '#1E1E26' }}>{r.clientName}</p>
                    <p className="text-xs font-sans truncate" style={{ color: '#838390' }}>{r.vehicle}</p>
                  </div>
                  <StatusChip status={r.type.toLowerCase()} />
                </div>
                {i < todayReservations.length - 1 && (
                  <div className="h-px mx-4" style={{ backgroundColor: '#EAEAE4' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Alert card */}
        <div className="rounded-xl border p-3.5 flex items-center gap-3"
          style={{ backgroundColor: '#FEF8EC', borderColor: 'rgba(201,138,32,0.3)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(201,138,32,0.15)' }}>
            <Wrench size={18} style={{ color: '#C98A20' }} />
          </div>
          <div>
            <p className="text-xs font-semibold font-sans" style={{ color: '#1E1E26' }}>Mantenimiento pendiente</p>
            <p className="text-xs font-sans" style={{ color: '#585868' }}>Kia Rio · cambio de aceite vencido</p>
          </div>
        </div>
      </div>
    </div>
  )
}
