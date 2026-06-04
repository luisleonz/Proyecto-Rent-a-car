import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, DollarSign, Calendar, FileText, Key, Settings, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../../state/auth'

function ToggleRow({ on, onChange, label, sub }: { on: boolean; onChange: () => void; label: string; sub?: string }) {
  return (
    <div className="togglerow">
      <div className="togglerow-text">
        <div className="togglerow-l">{label}</div>
        {sub && <div className="togglerow-s">{sub}</div>}
      </div>
      <button type="button" className={'toggle' + (on ? ' on' : '')} onClick={onChange} aria-pressed={on}>
        <span className="toggle-knob" />
      </button>
    </div>
  )
}

export default function MoreScreen() {
  const navigate = useNavigate()
  const { currentInitials, currentFirstName, currentRole, currentEmail, isAdmin } = useAuth()
  const [notif, setNotif] = useState({ mov: true, cot: true, resumen: false })

  return (
    <div className="screen">
      <div className="pagehead" style={{ marginBottom: 'var(--gap)' }}>
        <div>
          <div className="eyebrow">Cuenta</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 40px)' }}>Ajustes</h1>
          <div style={{ color: 'var(--ink3)', fontSize: 14, marginTop: 6 }}>Preferencias del negocio y de tu perfil</div>
        </div>
      </div>
      <div className="set-wrap">
        {/* Profile card */}
        <div className="card set-profile">
          <div className="avatar accent" style={{ width: 60, height: 60, fontSize: 20 }}>{currentInitials || 'LL'}</div>
          <div className="meta">
            <h2>{currentFirstName || 'Usuario'}</h2>
            <div className="mail">{currentEmail}</div>
          </div>
          <span className={'chip ' + (isAdmin ? 'primary' : '')}>
            {isAdmin ? 'Administrador' : 'Operativo'}
          </span>
          <button className="btn sm" onClick={() => navigate('/app/edit-profile')}>Editar perfil</button>
        </div>

        {/* Notificaciones */}
        <div className="set-section">
          <div className="eyebrow">Notificaciones</div>
          <div className="card set-card split">
            <ToggleRow on={notif.mov} onChange={() => setNotif(n => ({ ...n, mov: !n.mov }))}
              label="Entregas y devoluciones" sub="avisos 30 min antes" />
            <ToggleRow on={notif.cot} onChange={() => setNotif(n => ({ ...n, cot: !n.cot }))}
              label="Cotizaciones vistas" sub="cuando el cliente abre el enlace" />
            <ToggleRow on={notif.resumen} onChange={() => setNotif(n => ({ ...n, resumen: !n.resumen }))}
              label="Resumen diario" sub="cierre del día a las 21:00" />
          </div>
        </div>

        {/* Negocio (admin only) */}
        {isAdmin && (
          <div className="set-section">
            <div className="eyebrow">Negocio</div>
            <div className="card set-card">
              <div className="set-link"><MapPin size={17} /><span className="l">Sucursal</span><span className="v">Centro · Nogales, Son.</span><ChevronRight size={15} /></div>
              <div className="set-link"><DollarSign size={17} /><span className="l">Moneda</span><span className="v">MXN $</span><ChevronRight size={15} /></div>
              <div className="set-link"><Calendar size={17} /><span className="l">Métodos de pago</span><span className="v">efectivo · SPEI · TPV</span><ChevronRight size={15} /></div>
              <div className="set-link"><FileText size={17} /><span className="l">Plantillas de contrato</span><span className="v">2 activas</span><ChevronRight size={15} /></div>
            </div>
          </div>
        )}

        {/* Cuenta */}
        <div className="set-section">
          <div className="eyebrow">Cuenta</div>
          <div className="card set-card">
            <div className="set-link"><Key size={17} /><span className="l">Seguridad y 2FA</span><ChevronRight size={15} /></div>
            <div className="set-link"><Settings size={17} /><span className="l">Sincronización y respaldo</span><ChevronRight size={15} /></div>
            <div className="set-link danger" onClick={() => navigate('/', { replace: true })}>
              <LogOut size={17} /><span className="l">Cerrar sesión</span>
            </div>
          </div>
        </div>

        <div className="set-ver">Lucianos Rent-a-car · v1.0.0</div>
      </div>
    </div>
  )
}
