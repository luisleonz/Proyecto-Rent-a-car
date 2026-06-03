import { useNavigate, useLocation } from 'react-router-dom'
import { Home, CalendarDays, Tag, Car, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Panel',         icon: Home,         path: '/app/home' },
  { label: 'Reservas',      icon: CalendarDays,  path: '/app/reservations' },
  { label: 'Cotizaciones',  icon: Tag,           path: '/app/cotizaciones' },
  { label: 'Flota',         icon: Car,           path: '/app/vehicles' },
  { label: 'Ajustes',       icon: Settings,      path: '/app/more' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 md:hidden"
      style={{ borderColor: '#EAEAE4' }}
    >
      <div className="flex">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path || location.pathname.startsWith(path + '/')
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1"
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: active ? '#E8F5EE' : 'transparent',
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? '#2D8A56' : '#838390' }}
                />
              </div>
              <span style={{
                fontSize: 9,
                fontWeight: active ? 600 : 400,
                color: active ? '#2D8A56' : '#838390',
                fontFamily: 'Inter, sans-serif',
              }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
