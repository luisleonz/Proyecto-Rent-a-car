import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Home, Calendar, FileText, Car, Users, DollarSign, BarChart3, UserCheck, Settings, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../state/auth'
import { supabase } from '../lib/supabase'

const db = supabase as any

const NAV = [
  { id: 'inicio',     label: 'Inicio',        icon: Home,       path: '/app/home',         group: 'operacion', adminOnly: false },
  { id: 'reservas',   label: 'Reservas',       icon: Calendar,   path: '/app/reservations', group: 'operacion', adminOnly: false },
  { id: 'cotizacion', label: 'Cotizaciones',   icon: FileText,   path: '/app/cotizaciones', group: 'operacion', adminOnly: false },
  { id: 'flota',      label: 'Flota',          icon: Car,        path: '/app/vehicles',     group: 'operacion', adminOnly: false },
  { id: 'clientes',   label: 'Clientes',       icon: Users,      path: '/app/clientes',     group: 'operacion', adminOnly: false },
  { id: 'caja',       label: 'Caja',           icon: DollarSign, path: '/app/caja',         group: 'gestion',   adminOnly: false },
  { id: 'reportes',        label: 'Reportes',        icon: BarChart3,   path: '/app/reportes',        group: 'gestion',   adminOnly: true  },
  { id: 'empleados',       label: 'Empleados',        icon: UserCheck,   path: '/app/empleados',       group: 'gestion',   adminOnly: true  },
  { id: 'autorizaciones',  label: 'Autorizaciones',   icon: ShieldCheck, path: '/app/autorizaciones',  group: 'gestion',   adminOnly: true  },
  { id: 'ajustes',         label: 'Ajustes',          icon: Settings,    path: '/app/more',            group: 'gestion',   adminOnly: false },
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
  const { currentInitials, currentFirstName, currentRole, signOut, isAdmin } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!isAdmin) return
    db.from('solicitudes').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente')
      .then(({ count }: { count: number | null }) => setPendingCount(count ?? 0))
  }, [isAdmin])

  function handleNav(path: string) {
    navigate(path)
    onClose?.()
  }

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
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
          {NAV.filter(n => n.group === g.key && (!n.adminOnly || isAdmin)).map(n => {
            const active = location.pathname === n.path || location.pathname.startsWith(n.path + '/')
            return (
              <button key={n.id} className="navitem" data-active={String(active)} onClick={() => handleNav(n.path)}>
                <span className="ico"><n.icon size={18} strokeWidth={active ? 2.4 : 1.8} /></span>
                <span className="label-text">{n.label}</span>
                {n.id === 'autorizaciones' && pendingCount > 0 && (
                  <span className="badge" style={{ background: '#d68910' }}>{pendingCount}</span>
                )}
              </button>
            )
          })}
        </>
      ))}
      <div className="foot">
        <div className="user">
          <div className="ava">{currentInitials || 'LL'}</div>
          <div className="meta">
            <div className="nm">{currentFirstName || 'Luciano'}</div>
            <div className="rl">{currentRole || 'Administrador'}</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="navitem"
          style={{ marginTop: 4, color: 'rgba(255,255,255,0.50)' }}
        >
          <span className="ico"><LogOut size={16} strokeWidth={1.8} /></span>
          <span className="label-text">Cerrar sesión</span>
        </button>
      </div>
    </nav>
  )
}
