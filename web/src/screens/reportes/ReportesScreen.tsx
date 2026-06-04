import { useState } from 'react'

/* ── Local sub-components ── */
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

function StatCard({
  label,
  value,
  foot,
  tone,
}: {
  label: string
  value: string | number
  foot: string
  tone?: string
}) {
  return (
    <div className="card statcard">
      <div className="eyebrow">{label}</div>
      <div
        className="statval mono"
        style={
          tone === 'warn'
            ? { color: 'var(--warn-ink)' }
            : tone === 'accent'
            ? { color: 'var(--primary)' }
            : undefined
        }
      >
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>{foot}</div>
    </div>
  )
}

/* ── Data ── */
const PERIODS = ['Semana', 'Mes', 'Trimestre', 'Año'] as const

const OCC: [string, number][] = [
  ['Nissan Sentra', 92],
  ['Toyota Yaris', 85],
  ['VW Polo', 74],
  ['Chevrolet Aveo', 61],
  ['Mazda CX-5', 88],
  ['VW Tiguan', 70],
]

interface IncomeMonth {
  m: string
  v: number
  now?: boolean
}

const INCOME_MONTHS: IncomeMonth[] = [
  { m: 'Dic', v: 58 },
  { m: 'Ene', v: 64 },
  { m: 'Feb', v: 71 },
  { m: 'Mar', v: 66 },
  { m: 'Abr', v: 82 },
  { m: 'May', v: 94, now: true },
]

/* ── Screen ── */
export default function ReportesScreen() {
  const [period, setPeriod] = useState<string>('Mes')

  return (
    <div className="screen">
      <PageHead
        eyebrow="Análisis"
        title="Reportes"
        sub="mayo 2026 · ingresos y ocupación"
        actions={
          <>
            <button className="btn sm">Filtros</button>
            <button className="btn sm">Exportar</button>
          </>
        }
      />

      <div className="periodtoggle">
        {PERIODS.map(p => (
          <button
            key={p}
            className={period === p ? 'on' : ''}
            onClick={() => setPeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="statgrid">
        <StatCard label="Ingresos"         value="$184,200" foot="+14% vs abril"  tone="accent" />
        <StatCard label="Ocupación prom."  value="78%"      foot="de la flota" />
        <StatCard label="Rentas cerradas"  value="96"       foot="este mes" />
        <StatCard label="Ticket promedio"  value="$1,920"   foot="por renta" />
      </div>

      <div className="rep-grid">
        {/* Income chart */}
        <div className="card" style={{ padding: 'var(--pad)' }}>
          <div className="sect-head" style={{ marginBottom: 0 }}>
            <div>
              <div className="eyebrow">Ingresos por mes</div>
              <div className="h-display" style={{ fontSize: 36, marginTop: 6, lineHeight: 1 }}>
                $184,200
              </div>
            </div>
            <span className="chip primary">+14%</span>
          </div>
          <div className="rep-bars">
            {INCOME_MONTHS.map(mo => (
              <div key={mo.m} className={'rep-bar' + (mo.now ? ' now' : '')}>
                <div className="bar" style={{ height: mo.v + '%' }} />
                <div className="lab">{mo.m}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet occupancy */}
        <div className="card" style={{ padding: 'var(--pad)' }}>
          <div className="sect-head" style={{ marginBottom: 0 }}>
            <div className="eyebrow">Ocupación de flota</div>
            <span className="h-display" style={{ fontSize: 18 }}>
              78%
              <span style={{ fontSize: 12, color: 'var(--ink3)' }}> prom.</span>
            </span>
          </div>
          {OCC.map(([name, pct], i) => (
            <div key={i} className="occ-row">
              <div className="occ-name">{name}</div>
              <div className="occ-track">
                <div className="occ-fill" style={{ width: pct + '%' }} />
              </div>
              <div className="occ-pct">{pct}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rep-top">
        <div className="card rep-topcard">
          <div className="eyebrow">Auto más rentable</div>
          <div className="name">
            Nissan Sentra ·{' '}
            <span className="mono" style={{ fontSize: 13, color: 'var(--ink3)' }}>
              ABC-123
            </span>
          </div>
          <div className="val">$32,800</div>
        </div>
        <div className="card rep-topcard">
          <div className="eyebrow">Cliente top</div>
          <div className="name">Jorge Díaz</div>
          <div className="val">8 rentas · $26,400</div>
        </div>
      </div>
    </div>
  )
}
