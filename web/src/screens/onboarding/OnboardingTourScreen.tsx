import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, CalendarDays, Car, Star } from 'lucide-react'

const TOUR_ITEMS = [
  { icon: Home, title: 'Panel del día', desc: 'Ve los ingresos, movimientos y alertas del turno en un vistazo.', color: '#2D8A56' },
  { icon: CalendarDays, title: 'Reservas', desc: 'Consulta y gestiona todas las entregas y devoluciones programadas.', color: '#4444AA' },
  { icon: Car, title: 'Autos disponibles', desc: 'Estado en tiempo real de toda la flotilla: disponibles, rentados y en taller.', color: '#C98A20' },
]

export default function OnboardingTourScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto overflow-y-auto">
      <div className="flex items-center gap-2 px-2 pt-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-background">
          <ArrowLeft size={22} style={{ color: '#1E1E26' }} />
        </button>
        <div>
          <p className="text-base font-semibold font-sans" style={{ color: '#1E1E26' }}>Tour rápido</p>
          <p className="text-xs font-sans" style={{ color: '#838390' }}>Paso 3 de 4</p>
        </div>
      </div>

      <div className="flex gap-1 px-5 mt-2 mb-7">
        {[0,1,2,3].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ backgroundColor: i <= 2 ? '#2D8A56' : '#EAEAE4' }} />
        ))}
      </div>

      <div className="px-5 pb-8 flex flex-col gap-4">
        <h2 className="text-2xl font-bold font-serif leading-8" style={{ color: '#1E1E26' }}>
          3 pantallas que verás<br />todos los días
        </h2>

        {TOUR_ITEMS.map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="rounded-2xl border border-hairline p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: color + '18' }}>
              <Icon size={22} style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-semibold font-sans mb-0.5" style={{ color: '#1E1E26' }}>{title}</p>
              <p className="text-xs font-sans leading-relaxed" style={{ color: '#585868' }}>{desc}</p>
            </div>
          </div>
        ))}

        {/* Tip */}
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: '#1E1E26' }}>
          <Star size={18} style={{ color: '#FFD700', flexShrink: 0 }} />
          <p className="text-xs font-sans leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Tip: Toca cualquier reserva para ver los detalles completos del cliente y el vehículo.
          </p>
        </div>

        <button
          onClick={() => navigate('/onboarding/done')}
          className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-opacity active:opacity-80"
          style={{ backgroundColor: '#2D8A56' }}
        >
          Continuar
        </button>
        <button
          onClick={() => navigate('/onboarding/done')}
          className="w-full py-2 text-sm text-center font-sans"
          style={{ color: '#838390' }}
        >
          Saltar tour
        </button>
      </div>
    </div>
  )
}
