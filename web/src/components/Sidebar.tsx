import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home, CalendarDays, Tag, Car, Users,
  DollarSign, BarChart3, UserCheck, Settings,
} from 'lucide-react'
import { useAuth } from '../state/auth'

const SIDEBAR_BG = '#1A2D1E'
const SIDEBAR_ACTIVE = '#2D5C3A'

interface NavItemDef {
  label: string
  icon: React.ElementType
  path: string
  badge?: string
}

const OPERACION: NavItemDef[] = [
  { label: 'Inicio',       icon: Home,        path: '/app/home' },
  { label: 'Reservas',     icon: CalendarDays, path: '/app/reservations', badge: '14' },
  { label: 'Cotizaciones', icon: Tag,          path: '/app/cotizaciones' },
  { label: 'Flota',        icon: Car,          path: '/app/vehicles' },
  { label: 'Clientes',     icon: Users,        path: '/app/clientes' },
]

const GESTION: NavItemDef[] = [
  { label: 'Caja',      icon: DollarSign, path: '/app/caja' },
  { label: 'Reportes',  icon: BarChart3,  path: '/app/reportes' },
  { label: 'Empleados', icon: UserCheck,  path: '/app/empleados' },
  { label: 'Ajustes',   icon: Settings,   path: '/app/more' },
]

function NavItem({ label, icon: Icon, path, badge }: NavItemDef) {
  const navigate = useNavigate()
  const location = useLocation()
  const active = location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <button
      onClick={() => navigate(path)}
      className="flex items-center gap-3 px-3 py-2 rounded-xl w-full transition-colors"
      style={{
        backgroundColor: active ? SIDEBAR_ACTIVE : 'transparent',
        color: active ? 'white' : 'rgba(255,255,255,0.8)',
      }}
    >
      <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
      <span className="text-sm font-sans text-left flex-1" style={{ fontWeight: active ? 600 : 400 }}>
        {label}
      </span>
      {badge && (
        <span
          className="text-xs font-bold font-sans px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
            color: 'white',
            fontSize: '10px',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

export default function Sidebar() {
  const { currentInitials, currentFirstName, currentRole } = useAuth()
  const initials = currentInitials || 'LR'
  const name = currentFirstName ? `${currentFirstName} R.` : 'Luciano R.'
  const role = currentRole || 'Administrador'

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 z-40 py-5 px-3"
      style={{ backgroundColor: SIDEBAR_BG }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-7">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#2D8A56' }}
        >
          <span className="text-white font-bold font-serif text-sm">L</span>
        </div>
        <div>
          <p className="font-serif font-bold text-white leading-tight text-sm">Lucianos</p>
          <p className="text-[10px] font-sans uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>
            RENT · A · CAR
          </p>
        </div>
      </div>

      {/* Operación section */}
      <p
        className="text-[10px] font-sans font-semibold uppercase tracking-widest mb-1.5 px-3"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        OPERACIÓN
      </p>
      <div className="flex flex-col gap-0.5 mb-5">
        {OPERACION.map(item => <NavItem key={item.path} {...item} />)}
      </div>

      {/* Gestión section */}
      <p
        className="text-[10px] font-sans font-semibold uppercase tracking-widest mb-1.5 px-3"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        GESTIÓN
      </p>
      <div className="flex flex-col gap-0.5">
        {GESTION.map(item => <NavItem key={item.path} {...item} />)}
      </div>

      {/* User footer */}
      <div className="mt-auto flex items-center gap-2.5 px-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: SIDEBAR_ACTIVE }}
        >
          <span className="text-white font-bold font-sans text-xs">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold font-sans truncate">{name}</p>
          <p className="text-[11px] font-sans truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{role}</p>
        </div>
      </div>
    </aside>
  )
}
