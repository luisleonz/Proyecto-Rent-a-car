import { useNavigate, useLocation } from 'react-router-dom'
import { Home, CalendarDays, Car, MoreHorizontal } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Panel', icon: Home, path: '/app/home' },
  { label: 'Reservas', icon: CalendarDays, path: '/app/reservations' },
  { label: 'Vehículos', icon: Car, path: '/app/vehicles' },
  { label: 'Más', icon: MoreHorizontal, path: '/app/more' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-hairline safe-bottom z-50"
      style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="flex">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const active = location.pathname.startsWith(path)
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 transition-colors"
            >
              <div
                className="flex items-center justify-center rounded-full transition-colors"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: active ? '#E8F5EE' : 'transparent',
                }}
              >
                <Icon
                  size={20}
                  style={{ color: active ? '#2D8A56' : '#838390' }}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#2D8A56' : '#838390',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
