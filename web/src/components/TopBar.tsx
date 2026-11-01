import { useLocation } from 'react-router-dom'
import BuscadorGlobal from './BuscadorGlobal'

const CRUMBS: Record<string, string> = {
  '/app/home': 'Inicio', '/app/reservations': 'Reservas', '/app/calendario': 'Calendario', '/app/cotizaciones': 'Cotizaciones',
  '/app/vehicles': 'Flota', '/app/clientes': 'Clientes', '/app/caja': 'Caja', '/app/reportes': 'Reportes',
  '/app/actividad': 'Actividad', '/app/usuarios': 'Usuarios', '/app/more': 'Ajustes', '/app/edit-profile': 'Perfil',
}

export default function TopBar() {
  const location = useLocation()
  const seccion = CRUMBS[location.pathname] ?? (location.pathname.startsWith('/app/vehicles/') ? 'Flota' : location.pathname.startsWith('/app/entrega') ? 'Entrega'
    : location.pathname.startsWith('/app/devolucion') ? 'Devolución' : '')
  const crumbs = ['Lucianos', ...(seccion ? [seccion] : [])]

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
      <BuscadorGlobal />
    </header>
  )
}
