import { useNavigate } from 'react-router-dom'
import { TrendingUp, Wrench, Calendar, FileText } from 'lucide-react'
import { sampleFleet } from '../../data/sampleData'
import { useAuth } from '../../state/auth'

/* ── Local data ── */
interface AgendaItem {
  t: string
  who: string
  i: string
  car: string
  plate: string
  type: 'Entrega' | 'Devolución'
  urgent?: boolean
}

const TODAY_AGENDA: AgendaItem[] = [
  { t: '10:30', who: 'Mariana Pérez',  i: 'MP', car: 'Nissan Sentra',   plate: 'ABC-123', type: 'Entrega',    urgent: true },
  { t: '13:00', who: 'Ricardo López',  i: 'RL', car: 'Nissan Versa',    plate: 'XYZ-908', type: 'Entrega' },
  { t: '15:00', who: 'Lupita Cruz',    i: 'LC', car: 'Chevrolet Aveo',  plate: 'JKL-441', type: 'Devolución' },
  { t: '17:30', who: 'Jorge Díaz',     i: 'JD', car: 'Mazda CX-5',      plate: 'DEF-220', type: 'Entrega' },
]

interface IncomeMonth {
  m: string
  v: number
  now?: boolean
}

const INCOME_MONTHS: IncomeMonth[] = [
  { m: 'Ene', v: 60 },
  { m: 'Feb', v: 72 },
  { m: 'Mar', v: 55 },
  { m: 'Abr', v: 85 },
  { m: 'May', v: 100, now: true },
  { m: 'Jun', v: 40 },
]

interface AttentionItem {
  t: string
  s: string
  tone: 'warn' | 'danger' | 'primary'
  cta: string
}

const ATTENTION: AttentionItem[] = [
  { t: 'Mantenimiento pendiente',   s: 'Kia Rio · cambio de aceite',     tone: 'warn',    cta: 'Ver vehículo' },
  { t: 'Reserva sin confirmar',     s: 'Toyota Yaris · jue 23 · 10:00',  tone: 'danger',  cta: 'Confirmar' },
  { t: 'Cotización por vencer',     s: 'COT-039 · Lupita Cruz',          tone: 'primary', cta: 'Ver cot.' },
]

/* ── Sub-components ── */
function StatCard({
  label,
  value,
  foot,
  tone,
}: {
  label: string
  value: number
  foot: string
  tone?: string
}) {
  return (
    <div className="card statcard">
      <div className="eyebrow">{label}</div>
      <div className={`statval mono${tone ? '' : ''}`} style={tone === 'warn' ? { color: 'var(--warn-ink)' } : tone === 'accent' ? { color: 'var(--primary)' } : undefined}>
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>{foot}</div>
    </div>
  )
}

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

function AttentionIcon({ tone }: { tone: 'warn' | 'danger' | 'primary' }) {
  if (tone === 'warn')    return <Wrench size={18} />
  if (tone === 'danger')  return <Calendar size={18} />
  return <FileText size={18} />
}

/* ── Main screen ── */
export default function HomeScreen() {
  const navigate = useNavigate()
  const { currentFirstName, currentRole } = useAuth()

  const first = currentFirstName || 'Luciano'
  const isAdmin = !currentRole || currentRole === 'Administrador' || currentRole === 'admin'

  const counts = sampleFleet.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="screen">
      <PageHead
        eyebrow="Martes 21 de mayo"
        title={<>Hola, {first}</>}
        sub="12 movimientos hoy · 4 entregas, 2 devoluciones"
        actions={
          <>
            <button className="btn sm">Cotizar</button>
            <button className="btn sm primary">Nueva reserva</button>
          </>
        }
      />

      {/* Top grid: hero + spark */}
      <div className="dash-top">
        {isAdmin ? (
          <div className="card dash-hero">
            <div>
              <div className="dash-hero-top">
                <div className="eyebrow">Ingresos de hoy</div>
                <span className="dash-pill">
                  <TrendingUp size={13} />
                  +12% sem.
                </span>
              </div>
              <div className="dash-rev">$8,400</div>
            </div>
            <div className="dash-hero-foot">
              <div className="dash-mini">
                <div className="dash-mini-l">Rentados</div>
                <div className="dash-mini-v">
                  {counts.rentado ?? 0}<small>/{sampleFleet.length}</small>
                </div>
              </div>
              <div className="dash-mini">
                <div className="dash-mini-l">Cobrado</div>
                <div className="dash-mini-v">$6.1k</div>
              </div>
              <div className="dash-mini">
                <div className="dash-mini-l">Por cobrar</div>
                <div className="dash-mini-v">$2.3k</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card dash-hero">
            <div>
              <div className="dash-hero-top">
                <div className="eyebrow">Resumen operativo</div>
              </div>
              <div className="dash-rev">{counts.rentado ?? 0}<small style={{ fontSize: 22 }}>/{sampleFleet.length}</small></div>
            </div>
            <div className="dash-hero-foot">
              <div className="dash-mini">
                <div className="dash-mini-l">Entregas hoy</div>
                <div className="dash-mini-v">4</div>
              </div>
              <div className="dash-mini">
                <div className="dash-mini-l">Devoluciones</div>
                <div className="dash-mini-v">2</div>
              </div>
            </div>
          </div>
        )}

        <div className="card dash-spark">
          <div className="dash-spark-head">
            <div className="eyebrow">Ingresos · 6 meses</div>
            <span className="h-display" style={{ fontSize: 20 }}>$184k</span>
          </div>
          <div className="dash-bars">
            {INCOME_MONTHS.map(mo => (
              <div key={mo.m} className={'dash-bar' + (mo.now ? ' now' : '')}>
                <div className="bar" style={{ height: mo.v + '%' }} />
                <div className="lab">{mo.m}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="statgrid">
        <StatCard label="Disponibles" value={counts.disponible ?? 0} foot="listos para rentar" tone="accent" />
        <StatCard label="Rentados"    value={counts.rentado    ?? 0} foot="en la calle" />
        <StatCard label="Reservados"  value={counts.reservado  ?? 0} foot="próximas salidas" />
        <StatCard label="En taller"   value={counts.taller     ?? 0} foot="mantenimiento" tone="warn" />
      </div>

      {/* Bottom grid: agenda + attention */}
      <div className="dash-grid">
        <div>
          <div className="sect-head">
            <h2 className="sect-title">Agenda de hoy</h2>
            <span className="link" onClick={() => navigate('/app/reservations')}>Ver todo →</span>
          </div>
          <div className="card tilelist">
            {TODAY_AGENDA.map((e, i) => (
              <button key={i} className="agenda-row">
                <span className="agenda-time">{e.t}</span>
                <div className="avatar accent" style={{ width: 38, height: 38, fontSize: 13 }}>{e.i}</div>
                <div className="agenda-main">
                  <div className="agenda-who">{e.who}</div>
                  <div className="agenda-car">
                    {e.car} · <span className="mono">{e.plate}</span>
                  </div>
                </div>
                <span className={'chip sm ' + (e.type === 'Entrega' ? 'primary' : 'warn')}>
                  {e.type}
                </span>
                {e.urgent && <span className="chip sm danger">Pronto</span>}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect-head">
            <h2 className="sect-title">Atención requerida</h2>
          </div>
          <div className="card tilelist">
            {ATTENTION.map((a, i) => (
              <div key={i} className="tilerow">
                <div className={'tile-ic ' + a.tone}>
                  <AttentionIcon tone={a.tone} />
                </div>
                <div className="tile-main">
                  <div className="tile-l">{a.t}</div>
                  <div className="tile-s">{a.s}</div>
                </div>
                <span className="link" style={{ fontSize: 12.5 }}>{a.cta}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
