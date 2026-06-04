import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { useState } from 'react'

const SECTION_NAMES: Record<string, string> = {
  '/app/home': 'Inicio',
  '/app/reservations': 'Reservas',
  '/app/cotizaciones': 'Cotizaciones',
  '/app/vehicles': 'Flota',
  '/app/more': 'Ajustes',
  '/app/caja': 'Caja',
  '/app/clientes': 'Clientes',
  '/app/reportes': 'Reportes',
  '/app/empleados': 'Empleados',
}

export default function TopBar() {
  const location = useLocation()
  const [mode, setMode] = useState<'admin' | 'operativo'>('admin')

  const section = SECTION_NAMES[location.pathname] ?? 'Inicio'

  return (
    <header
      className="hidden md:flex fixed top-0 right-0 z-30 items-center gap-4 px-6"
      style={{ left: 240, height: 56, backgroundColor: 'white', borderBottom: '1px solid #EAEAE4' }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mr-2">
        <span className="text-sm font-sans" style={{ color: '#838390' }}>Lucianos</span>
        <span className="text-sm font-sans" style={{ color: '#BCBCC4' }}>›</span>
        <span className="text-sm font-semibold font-sans" style={{ color: '#1E1E26' }}>{section}</span>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 flex-1 max-w-xs px-3 py-2 rounded-xl border"
        style={{ borderColor: '#EAEAE4', backgroundColor: '#F5F5EF' }}
      >
        <Search size={14} style={{ color: '#838390', flexShrink: 0 }} />
        <input
          placeholder="Buscar placa, cliente o reserva..."
          className="flex-1 text-xs font-sans bg-transparent outline-none placeholder:text-[#BCBCC4]"
          style={{ color: '#1E1E26' }}
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Bell */}
        <button className="relative p-1.5">
          <Bell size={18} style={{ color: '#585868' }} />
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#C98A20' }} />
        </button>

        {/* Admin / Operativo toggle */}
        <div
          className="flex rounded-lg overflow-hidden border"
          style={{ borderColor: '#EAEAE4' }}
        >
          <button
            onClick={() => setMode('admin')}
            className="px-3 py-1.5 text-xs font-semibold font-sans transition-colors"
            style={{
              backgroundColor: mode === 'admin' ? '#1E1E26' : 'transparent',
              color: mode === 'admin' ? 'white' : '#838390',
            }}
          >
            Admin
          </button>
          <button
            onClick={() => setMode('operativo')}
            className="px-3 py-1.5 text-xs font-semibold font-sans transition-colors border-l"
            style={{
              borderColor: '#EAEAE4',
              backgroundColor: 'transparent',
              color: mode === 'operativo' ? '#1E1E26' : '#838390',
              outline: mode === 'operativo' ? '1.5px solid #1E1E26' : 'none',
            }}
          >
            Operativo
          </button>
        </div>
      </div>
    </header>
  )
}
