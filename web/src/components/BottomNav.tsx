import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Calendar, FileText, Car, Menu } from 'lucide-react'

const BOTNAV = [
  { label: 'Inicio',       icon: Home,     path: '/app/home' },
  { label: 'Reservas',     icon: Calendar, path: '/app/reservations' },
  { label: 'Cotizaciones', icon: FileText, path: '/app/cotizaciones' },
  { label: 'Flota',        icon: Car,      path: '/app/vehicles' },
]

/** Phone navigation: the main screens plus "Más", which opens the full menu. */
export default function BottomNav({ onMenu }: { onMenu: () => void }) {
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
      <button className="bn" data-active={String(!BOTNAV.some(b => location.pathname.startsWith(b.path)))} onClick={onMenu} aria-label="Más opciones">
        <Menu size={21} strokeWidth={1.8} />
        <span>Más</span>
      </button>
    </nav>
  )
}
