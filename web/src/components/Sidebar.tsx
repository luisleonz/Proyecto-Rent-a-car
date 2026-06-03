import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home, CalendarDays, Tag, Car, Users,
  DollarSign, BarChart3, UserCheck, Settings,
} from 'lucide-react'

const OPERACION = [
  { label: 'Inicio',        icon: Home,         path: '/app/home' },
  { label: 'Reservas',      icon: CalendarDays,  path: '/app/reservations' },
  { label: 'Cotizaciones',  icon: Tag,           path: '/app/cotizaciones' },
  { label: 'Flota',         icon: Car,           path: '/app/vehicles' },
  { label: 'Clientes',      icon: Users,         path: '/app/clientes' },
]

const GESTION = [
  { label: 'Caja',      icon: DollarSign, path: '/app/caja' },
  { label: 'Reportes',  icon: BarChart3,  path: '/app/reportes' },
  { label: 'Empleados', icon: UserCheck,  path: '/app/empleados' },
  { label: 'Ajustes',   icon: Settings,   path: '/app/more' },
]

function NavItem({ label, icon: Icon, path }: { label: string; icon: React.ElementType; path: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const active = location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <button
      onClick={() => navigate(path)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-colors"
      style={{
        backgroundColor: active ? '#E8F5EE' : 'transparent',
        color: active ? '#2D8A56' : '#585868',
      }}
    >
      <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
      <span className="text-sm font-sans text-left" style={{ fontWeight: active ? 600 : 400 }}>
        {label}
      </span>
    </button>
  )
}

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-white border-r z-40 py-5 px-3"
      style={{ borderColor: '#EAEAE4' }}>
      {/* Logo */}
      <div className="px-3 mb-6">
        <p className="font-serif font-bold text-lg leading-tight" style={{ color: '#1E1E26' }}>Lucianos</p>
        <p className="text-xs font-sans" style={{ color: '#838390' }}>Rent-a-Car</p>
      </div>

      {/* Operación */}
      <p className="text-xs font-semibold font-sans uppercase tracking-wider mb-1.5 px-3"
        style={{ color: '#BCBCC4' }}>
        Operación
      </p>
      <div className="flex flex-col gap-0.5 mb-4">
        {OPERACION.map(item => <NavItem key={item.path} {...item} />)}
      </div>

      {/* Gestión */}
      <p className="text-xs font-semibold font-sans uppercase tracking-wider mb-1.5 px-3"
        style={{ color: '#BCBCC4' }}>
        Gestión
      </p>
      <div className="flex flex-col gap-0.5">
        {GESTION.map(item => <NavItem key={item.path} {...item} />)}
      </div>

      {/* Version */}
      <div className="mt-auto px-3">
        <p className="text-xs font-sans" style={{ color: '#BCBCC4' }}>v1.0 · Polanco</p>
      </div>
    </aside>
  )
}
