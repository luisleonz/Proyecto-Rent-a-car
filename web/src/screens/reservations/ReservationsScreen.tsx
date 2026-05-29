import { useState } from 'react'
import { CalendarDays, Filter, Plus } from 'lucide-react'
import { todayReservations, tomorrowReservations, Reservation } from '../../data/sampleData'
import AvatarCircle from '../../components/AvatarCircle'
import StatusChip from '../../components/StatusChip'

const DAY_FILTERS = ['Hoy', 'Mañana', 'Mié', 'Jue', 'Vie', 'Sáb']

function ReservationCard({ r }: { r: Reservation }) {
  const urgent = r.status === 'urgent'
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="font-mono text-xs w-11 flex-shrink-0 text-right"
        style={{ color: urgent ? '#C04040' : '#838390' }}>
        {r.time}
      </span>
      <AvatarCircle initials={r.clientInitials} size={40} accent={urgent ? '#C04040' : '#2D8A56'} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-sans truncate" style={{ color: '#1E1E26' }}>{r.clientName}</p>
        <p className="text-xs font-sans truncate" style={{ color: '#838390' }}>{r.vehicle}</p>
      </div>
      <StatusChip status={r.type.toLowerCase()} />
    </div>
  )
}

function DaySection({ header, reservations }: { header: string; reservations: Reservation[] }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold font-sans mb-2.5 uppercase tracking-wide" style={{ color: '#838390' }}>{header}</p>
      <div className="bg-white rounded-2xl border border-hairline overflow-hidden">
        {reservations.map((r, i) => (
          <div key={r.id}>
            <ReservationCard r={r} />
            {i < reservations.length - 1 && <div className="h-px mx-4" style={{ backgroundColor: '#EAEAE4' }} />}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ReservationsScreen() {
  const [selected, setSelected] = useState('Hoy')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF7' }}>
      {/* AppBar */}
      <div className="bg-white px-4 py-3 flex items-center gap-1 border-b border-hairline">
        <h1 className="flex-1 text-xl font-bold font-serif" style={{ color: '#1E1E26' }}>Reservas</h1>
        <button className="p-2"><CalendarDays size={20} style={{ color: '#585868' }} /></button>
        <button className="p-2"><Filter size={20} style={{ color: '#585868' }} /></button>
      </div>

      {/* Day filter chips */}
      <div className="bg-white border-b border-hairline flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide">
        {DAY_FILTERS.map(day => (
          <button
            key={day}
            onClick={() => setSelected(day)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-sans transition-colors"
            style={{
              backgroundColor: selected === day ? '#2D8A56' : '#F0F0F0',
              color: selected === day ? 'white' : '#585868',
              fontWeight: selected === day ? 600 : 400,
            }}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <DaySection header="Hoy · martes 21 mayo" reservations={todayReservations} />
        <DaySection header="Mañana · miércoles 22" reservations={tomorrowReservations} />
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
