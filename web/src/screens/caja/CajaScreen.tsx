import { useNavigate } from 'react-router-dom'
import { FileText, Check, DollarSign, ArrowLeftRight, FileCheck } from 'lucide-react'
import { useAuth } from '../../state/auth'

/* ── Data ── */
const CAJA_HOY = {
  total: 14250,
  movs: 11,
  entregas: 4,
  retornos: 2,
  fondo: 3000,
  contado: 11200,
  esperado: 8200,
  metodos: [
    { label: 'Efectivo recibido', amount: 8200, movs: 4, dim: false },
    { label: 'SPEI / transferencia', amount: 6050, movs: 5, dim: false },
    { label: 'Por cobrar', amount: 0, movs: 0, dim: true },
  ],
}

const TURNOS = [
  { id: 'T1', who: 'Juan Pérez · L01', horario: '09:00 — 15:00', movs: 11, total: 14250, status: 'diff', label: 'Faltante −$250' },
  { id: 'T2', who: 'Ana Cruz · L02', horario: '15:00 — 21:00', movs: 9, total: 11820, status: 'ok', label: 'Cuadrada' },
  { id: 'T3', who: 'Luis Vega · L03', horario: '21:00 — 03:00', movs: 4, total: 2350, status: 'open', label: 'Abierto' },
]

const DIFS = [
  { date: '22 may', who: 'J. Pérez', amount: -250, reason: 'Vuelto erróneo' },
  { date: '14 may', who: 'L. Vega', amount: -200, reason: 'Error de conteo' },
  { date: '8 may', who: 'A. Cruz', amount: -130, reason: 'Vuelto erróneo' },
]

/* ── Sub-components ── */
function PageHead({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow: string
  title: React.ReactNode
  sub?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="pagehead">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>{title}</h1>
        {sub && <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4 }}>{sub}</p>}
      </div>
      {actions && <div className="pagehead-actions">{actions}</div>}
    </div>
  )
}

function fmt(n: number) {
  return n.toLocaleString('es-MX')
}

function MethodIcon({ label }: { label: string }) {
  if (label.toLowerCase().includes('efectivo')) return <DollarSign size={16} />
  if (label.toLowerCase().includes('spei') || label.toLowerCase().includes('transferencia')) return <ArrowLeftRight size={16} />
  return <FileCheck size={16} />
}

function turnoChip(status: string) {
  if (status === 'diff') return <span className="chip sm danger">{TURNOS.find(t => t.status === status)?.label ?? 'Diferencia'}</span>
  if (status === 'ok') return <span className="chip sm primary"><span className="dot primary" />Cuadrada</span>
  return <span className="chip sm">Abierto</span>
}

/* ── Main screen ── */
export default function CajaScreen() {
  const navigate = useNavigate()
  const { currentRole } = useAuth()
  const isAdmin = currentRole === 'admin' || currentRole === 'Administrador' || !currentRole

  return (
    <div className="screen">
      <PageHead
        eyebrow="Tesorería"
        title="Caja del día"
        sub="22 may 2026 · Sucursal Centro"
        actions={
          <>
            {isAdmin && (
              <button className="btn sm" onClick={() => navigate('/app/caja/turno')}>
                <FileText size={15} />
                Exportar
              </button>
            )}
            <button className="btn sm primary" onClick={() => navigate('/app/caja/turno')}>
              <Check size={15} />
              Cerrar turno
            </button>
          </>
        }
      />

      <div className="caja-grid">
        {/* Left column */}
        <div className="caja-left">
          {/* Hero card */}
          <div className="card caja-hero">
            <div className="caja-hero-head">
              <div>
                <div className="eyebrow">Ingreso del día</div>
                <div className="caja-hero-v">${fmt(CAJA_HOY.total)}</div>
              </div>
              <span className="chip dark" style={{ background: 'rgba(255,255,255,0.16)', color: '#fff', border: '0' }}>
                {CAJA_HOY.movs} movimientos
              </span>
            </div>
            <div className="caja-hero-foot">
              <div className="dash-mini">
                <div className="dash-mini-l">Movimientos</div>
                <div className="dash-mini-v">{CAJA_HOY.movs}</div>
              </div>
              <div className="dash-mini">
                <div className="dash-mini-l">Entregas</div>
                <div className="dash-mini-v">{CAJA_HOY.entregas}</div>
              </div>
              <div className="dash-mini">
                <div className="dash-mini-l">Devoluciones</div>
                <div className="dash-mini-v">{CAJA_HOY.retornos}</div>
              </div>
            </div>
          </div>

          {/* Desglose por método */}
          <div className="card" style={{ padding: 'var(--pad)' }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Desglose por método</div>
            {CAJA_HOY.metodos.map((m) => (
              <div key={m.label} className="method-row">
                <div className={'method-ic' + (m.dim ? ' dim' : '')}>
                  <MethodIcon label={m.label} />
                </div>
                <div className="method-main">
                  <div className="method-t" style={m.dim ? { color: 'var(--ink3)' } : undefined}>{m.label}</div>
                  <div className="method-n">{m.movs} mov.</div>
                </div>
                <div className={'method-v' + (m.dim ? ' dim' : '')}>${fmt(m.amount)}</div>
              </div>
            ))}
          </div>

          {/* Conciliación de efectivo */}
          <div className="card" style={{ padding: 'var(--pad)' }}>
            <div className="sect-head" style={{ marginBottom: 6 }}>
              <div className="eyebrow">Conciliación de efectivo</div>
              <span className="chip sm primary"><span className="dot primary" />Cuadrada</span>
            </div>
            <div className="conc">
              <div className="conc-row">
                <span>Contado físicamente</span>
                <span className="mono">${fmt(CAJA_HOY.contado)}</span>
              </div>
              <div className="conc-row">
                <span>− Fondo inicial</span>
                <span className="mono">−${fmt(CAJA_HOY.fondo)}</span>
              </div>
              <div className="conc-row total">
                <span>Esperado en caja</span>
                <span className="mono">${fmt(CAJA_HOY.esperado)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="caja-right">
          {/* Turnos del día */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: 'var(--pad)', paddingBottom: 8 }}>
              <div className="sect-head" style={{ marginBottom: 0 }}>
                <div className="eyebrow">Turnos del día</div>
                <button className="btn sm" onClick={() => navigate('/app/caja/turno')}>
                  Ver turno
                </button>
              </div>
            </div>
            {TURNOS.map((t) => (
              <div key={t.id} className="cturno">
                <div className="cturno-no">{t.id}</div>
                <div className="cturno-main">
                  <div className="cturno-who">{t.who}</div>
                  <div className="cturno-hr">{t.horario} · {t.movs} mov.</div>
                </div>
                {t.status === 'diff' ? (
                  <span className="chip sm danger">{t.label}</span>
                ) : t.status === 'ok' ? (
                  <span className="chip sm primary"><span className="dot primary" />{t.label}</span>
                ) : (
                  <span className="chip sm">{t.label}</span>
                )}
              </div>
            ))}
          </div>

          {/* Diferencias */}
          {isAdmin && (
            <div className="card" style={{ padding: 'var(--pad)' }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Diferencias del mes</div>
              {DIFS.map((d, i) => (
                <div key={i} className="dif-row">
                  <div>
                    <div className="dif-l">{d.reason}</div>
                    <div className="dif-meta">{d.date} · {d.who}</div>
                  </div>
                  <div className="dif-v">{d.amount}</div>
                </div>
              ))}
            </div>
          )}

          {/* Neto del mes */}
          {isAdmin && (
            <div className="card caja-neto">
              <div className="eyebrow">Neto del mes</div>
              <div className="caja-neto-v">$184,200</div>
              <div className="caja-neto-s">22 días · 3 turnos activos · Sucursal Centro</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
