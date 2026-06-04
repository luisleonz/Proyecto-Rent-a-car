import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Calendar, FileText, Car, Settings } from 'lucide-react'

const BOTNAV = [
  { label: 'Inicio',       icon: Home,     path: '/app/home' },
  { label: 'Reservas',     icon: Calendar, path: '/app/reservations' },
  { label: 'Cotizaciones', icon: FileText, path: '/app/cotizaciones' },
  { label: 'Flota',        icon: Car,      path: '/app/vehicles' },
  { label: 'Ajustes',      icon: Settings, path: '/app/more' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <nav className="botnav">
      {BOTNAV.map(({ label, icon: Icon, path }) => {
        const active = location.pathname === path || location.pathname.startsWith(path + '/')
        return (
          <button key={path} className="bn" data-active={String(active)} onClick={() => navigate(path)}>
            <Icon size={21} strokeWidth={active ? 2.4 : 1.8} />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
