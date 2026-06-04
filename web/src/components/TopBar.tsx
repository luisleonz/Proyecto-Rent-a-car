import { useLocation } from 'react-router-dom'
import { Search, Bell } from 'lucide-react'

const CRUMBS: Record<string, string[]> = {
  '/app/home':         ['Lucianos', 'Inicio'],
  '/app/reservations': ['Lucianos', 'Reservas'],
  '/app/cotizaciones': ['Lucianos', 'Cotizaciones'],
  '/app/vehicles':     ['Lucianos', 'Flota'],
  '/app/more':         ['Lucianos', 'Ajustes'],
  '/app/caja':         ['Lucianos', 'Caja'],
  '/app/clientes':     ['Lucianos', 'Clientes'],
  '/app/reportes':     ['Lucianos', 'Reportes'],
  '/app/empleados':    ['Lucianos', 'Empleados'],
}

export default function TopBar() {
  const location = useLocation()
  const crumbs = CRUMBS[location.pathname] ?? ['Lucianos']

  return (
    <header className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            {i > 0 && <span style={{ color: 'var(--ink4)', fontSize: 13 }}>›</span>}
            <span className={i === crumbs.length - 1 ? 'cur' : ''}>{c}</span>
          </span>
        ))}
      </div>
      <div className="search">
        <Search size={16} />
        <span>Buscar placa, cliente o reserva…</span>
      </div>
      <div className="actions">
        <button className="iconbtn"><Bell size={17} /></button>
      </div>
    </header>
  )
}
