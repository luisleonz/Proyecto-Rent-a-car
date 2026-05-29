import { useNavigate } from 'react-router-dom'
import { DollarSign, Users, BarChart3, Settings, Headphones, LogOut, ChevronRight, LucideIcon } from 'lucide-react'
import { useAuth } from '../../state/auth'
import AvatarCircle from '../../components/AvatarCircle'

interface MenuItem {
  icon: LucideIcon
  label: string
  sublabel?: string
  isDanger?: boolean
  iconColor: string
  iconBg: string
}

const MENU_ITEMS: MenuItem[] = [
  { icon: DollarSign, label: 'Caja / Turno', sublabel: 'Cierre del día', iconColor: '#2D8A56', iconBg: '#E8F5EE' },
  { icon: Users, label: 'Equipo', sublabel: '4 empleados activos', iconColor: '#4444AA', iconBg: '#EEEEFF' },
  { icon: BarChart3, label: 'Reportes', sublabel: 'Semana actual', iconColor: '#888800', iconBg: '#FFFFF0' },
  { icon: Settings, label: 'Configuración', iconColor: '#585868', iconBg: '#F0F0F0' },
  { icon: Headphones, label: 'Soporte', iconColor: '#585868', iconBg: '#F0F0F0' },
]

const LOGOUT: MenuItem = {
  icon: LogOut, label: 'Cerrar sesión', isDanger: true, iconColor: '#C04040', iconBg: '#FEEEEE'
}

function MenuRow({ item, showChevron = true }: { item: MenuItem; showChevron?: boolean }) {
  return (
    <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: item.iconBg }}>
        <item.icon size={18} style={{ color: item.iconColor }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium font-sans" style={{ color: item.isDanger ? '#C04040' : '#1E1E26' }}>
          {item.label}
        </p>
        {item.sublabel && (
          <p className="text-xs font-sans" style={{ color: '#838390' }}>{item.sublabel}</p>
        )}
      </div>
      {showChevron && !item.isDanger && (
        <ChevronRight size={16} style={{ color: '#BCBCC4' }} />
      )}
    </button>
  )
}

export default function MoreScreen() {
  const navigate = useNavigate()
  const { currentFirstName, currentInitials, currentRole, currentBranch } = useAuth()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF7' }}>
      {/* AppBar */}
      <div className="bg-white px-4 py-3 border-b border-hairline">
        <h1 className="text-xl font-bold font-serif" style={{ color: '#1E1E26' }}>Más</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-24 flex flex-col gap-3">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-hairline p-4 flex items-center gap-3.5">
          <AvatarCircle initials={currentInitials || 'LA'} size={52} />
          <div className="flex-1">
            <p className="text-lg font-bold font-serif" style={{ color: '#1E1E26' }}>
              {currentFirstName || 'Luciano'}
            </p>
            <p className="text-xs font-sans mb-2" style={{ color: '#838390' }}>
              {currentRole || 'Administrador'} · {currentBranch || 'Polanco'}
            </p>
            <span className="text-xs font-semibold font-sans px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#E8F5EE', color: '#2D8A56' }}>
              {currentRole === 'Administrador' ? 'Admin' : 'Mostrador'}
            </span>
          </div>
        </div>

        {/* Main menu */}
        <div className="bg-white rounded-2xl border border-hairline overflow-hidden">
          {MENU_ITEMS.map((item, i) => (
            <div key={item.label}>
              <MenuRow item={item} />
              {i < MENU_ITEMS.length - 1 && (
                <div className="h-px ml-16" style={{ backgroundColor: '#EAEAE4' }} />
              )}
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: '#FEEEEE', borderColor: 'rgba(192,64,64,0.2)' }}>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full flex items-center gap-3 px-4 py-3.5"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#FEEEEE' }}>
              <LogOut size={18} style={{ color: '#C04040' }} />
            </div>
            <span className="text-sm font-medium font-sans" style={{ color: '#C04040' }}>Cerrar sesión</span>
          </button>
        </div>

        <p className="text-center text-xs font-sans" style={{ color: '#838390' }}>
          Lucianos Rent-a-Car v1.0
        </p>
      </div>
    </div>
  )
}
