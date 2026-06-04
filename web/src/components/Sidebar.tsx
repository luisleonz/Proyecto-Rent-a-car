import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Calendar, FileText, Car, Users, DollarSign, BarChart3, UserCheck, Settings } from 'lucide-react'
import { useAuth } from '../state/auth'

const NAV = [
  { id: 'inicio',     label: 'Inicio',        icon: Home,       path: '/app/home',         group: 'operacion' },
  { id: 'reservas',   label: 'Reservas',       icon: Calendar,   path: '/app/reservations', group: 'operacion', badge: '14' },
  { id: 'cotizacion', label: 'Cotizaciones',   icon: FileText,   path: '/app/cotizaciones', group: 'operacion' },
  { id: 'flota',      label: 'Flota',          icon: Car,        path: '/app/vehicles',     group: 'operacion' },
  { id: 'clientes',   label: 'Clientes',       icon: Users,      path: '/app/clientes',     group: 'operacion' },
  { id: 'caja',       label: 'Caja',           icon: DollarSign, path: '/app/caja',         group: 'gestion' },
  { id: 'reportes',   label: 'Reportes',       icon: BarChart3,  path: '/app/reportes',     group: 'gestion' },
  { id: 'empleados',  label: 'Empleados',      icon: UserCheck,  path: '/app/empleados',    group: 'gestion' },
  { id: 'ajustes',    label: 'Ajustes',        icon: Settings,   path: '/app/more',         group: 'gestion' },
]

const GROUPS = [
  { key: 'operacion', label: 'Operación' },
  { key: 'gestion',   label: 'Gestión' },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentInitials, currentFirstName, currentRole } = useAuth()

  function handleNav(path: string) {
    navigate(path)
    onClose?.()
  }

  return (
    <nav className="side" style={isOpen ? { left: 0 } : undefined}>
      <div className="logo">
        <div className="ring">L</div>
        <div className="wm">
          <div className="n">Lucianos</div>
          <div className="s">Rent · a · car</div>
        </div>
      </div>
      {GROUPS.map(g => (
        <>
          <div key={g.key + '-label'} className="navlabel">{g.label}</div>
          {NAV.filter(n => n.group === g.key).map(n => {
            const active = location.pathname === n.path || location.pathname.startsWith(n.path + '/')
            return (
              <button key={n.id} className="navitem" data-active={String(active)} onClick={() => handleNav(n.path)}>
                <span className="ico"><n.icon size={18} strokeWidth={active ? 2.4 : 1.8} /></span>
                <span className="label-text">{n.label}</span>
                {n.badge && <span className="badge">{n.badge}</span>}
              </button>
            )
          })}
        </>
      ))}
      <div className="foot">
        <div className="user">
          <div className="ava">{currentInitials || 'LL'}</div>
          <div className="meta">
            <div className="nm">{currentFirstName || 'Luciano'} R.</div>
            <div className="rl">{currentRole || 'Administrador'}</div>
          </div>
        </div>
      </div>
    </nav>
  )
}
