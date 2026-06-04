import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Star, Phone, MessageSquare, FileText, Key } from 'lucide-react'

/* ── Data ── */
interface Cliente {
  i: string
  n: string
  desde: string
  fav: boolean
  rentas: number
  fact: number
  inc: number
  tel: string
  email: string
  ine: string
  lic: string
  tag: string
  tagChip: string
  active: boolean
  warn: boolean
}

const CLIENTES: Cliente[] = [
  { i: 'JD', n: 'Jorge Díaz', desde: 'feb 2024', fav: true, rentas: 8, fact: 26400, inc: 0, tel: '+52 631 777 3344', email: 'jorge.diaz@correo.mx', ine: 'DIAJ850412', lic: '2027', tag: 'frecuente', tagChip: 'warn', active: false, warn: false },
  { i: 'CM', n: 'Carla Mena', desde: 'jun 2024', fav: true, rentas: 6, fact: 19800, inc: 0, tel: '+52 631 210 9087', email: 'carla.mena@correo.mx', ine: 'MENC900221', lic: '2028', tag: 'frecuente', tagChip: 'warn', active: false, warn: false },
  { i: 'MP', n: 'Mariana Pérez', desde: 'may 2026', fav: false, rentas: 1, fact: 2550, inc: 0, tel: '+52 631 555 1212', email: 'mariana.p@correo.mx', ine: 'PEMA920810', lic: '2029', tag: 'renta activa', tagChip: 'primary', active: true, warn: false },
  { i: 'AS', n: 'Ana Soto', desde: 'abr 2026', fav: false, rentas: 2, fact: 5800, inc: 0, tel: '+52 631 333 7766', email: 'ana.soto@correo.mx', ine: 'SOTA880145', lic: '2027', tag: 'al corriente', tagChip: '', active: false, warn: false },
  { i: 'RL', n: 'Ricardo López', desde: 'mar 2026', fav: false, rentas: 1, fact: 1560, inc: 1, tel: '+52 631 901 2233', email: 'r.lopez@correo.mx', ine: 'LOPR910630', lic: '2026', tag: 'adeuda multa', tagChip: 'danger', active: false, warn: true },
  { i: 'PS', n: 'Pedro Soto', desde: 'feb 2026', fav: false, rentas: 3, fact: 4800, inc: 1, tel: '+52 631 612 8890', email: 'pedro.soto@correo.mx', ine: 'SOTP870922', lic: '2028', tag: 'al corriente', tagChip: '', active: false, warn: false },
  { i: 'EV', n: 'Elena Vargas', desde: 'ene 2026', fav: false, rentas: 2, fact: 6400, inc: 0, tel: '+52 631 778 4501', email: 'elena.v@correo.mx', ine: 'VARE950312', lic: '2030', tag: 'al corriente', tagChip: '', active: false, warn: false },
  { i: 'RT', n: 'Raúl Tena', desde: 'dic 2025', fav: false, rentas: 0, fact: 0, inc: 0, tel: '+52 631 220 6754', email: 'raul.tena@correo.mx', ine: 'TENR830518', lic: '2026', tag: 'cotización vencida', tagChip: 'warn', active: false, warn: false },
]

const CLI_RENTAS: Record<string, { car: string; plate: string; tone: string; when: string; total: number; state: string }[]> = {
  JD: [
    { car: 'Nissan Sentra', plate: 'ABC-123', tone: 'blue', when: 'may 2026', total: 3200, state: 'activa' },
    { car: 'VW Polo', plate: 'QRS-115', tone: 'ink', when: 'mar 2026', total: 1800, state: 'cerrada' },
  ],
}

/* ── Car thumbnail ── */
const TONES: Record<string, [string, string]> = {
  blue:  ['oklch(0.62 0.10 245)', 'oklch(0.90 0.04 245)'],
  slate: ['oklch(0.55 0.02 240)', 'oklch(0.92 0.01 240)'],
  rose:  ['oklch(0.62 0.13 20)',  'oklch(0.92 0.04 20)'],
  ink:   ['oklch(0.40 0.01 240)', 'oklch(0.88 0.01 240)'],
  sand:  ['oklch(0.70 0.06 75)',  'oklch(0.93 0.03 80)'],
  white: ['oklch(0.72 0.01 240)', 'oklch(0.95 0.005 240)'],
}

function MiniCarPhoto({ tone }: { tone: string }) {
  const [fg, bg] = TONES[tone] ?? TONES.slate
  return (
    <div className="cli-rent-th" style={{ background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 120 48" style={{ width: '80%' }} preserveAspectRatio="xMidYMid meet">
        <path d="M8 34 L20 34 C22 26 28 20 40 19 L74 19 C86 19 94 24 102 31 L112 33 C114 33.5 115 35 115 37 L115 40 L8 40 Z" fill="currentColor" />
        <circle cx="34" cy="40" r="6" fill={bg} /><circle cx="34" cy="40" r="3" fill="currentColor" />
        <circle cx="92" cy="40" r="6" fill={bg} /><circle cx="92" cy="40" r="3" fill="currentColor" />
      </svg>
    </div>
  )
}

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
          tone === 'warn' ? { color: 'var(--warn-ink)' }
          : tone === 'danger' ? { color: 'var(--danger-ink)' }
          : tone === 'accent' ? { color: 'var(--primary)' }
          : undefined
        }
      >
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>{foot}</div>
    </div>
  )
}

function fmt(n: number) {
  return n.toLocaleString('es-MX')
}

/* ── Main screen ── */
export default function ClientesScreen() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Cliente | null>(null)
  const [query, setQuery] = useState('')

  const filtered = query
    ? CLIENTES.filter(c => c.n.toLowerCase().includes(query.toLowerCase()))
    : CLIENTES

  const rentas = selected ? (CLI_RENTAS[selected.i] ?? []) : []

  return (
    <div className="screen">
      <PageHead
        eyebrow="Registro"
        title="Clientes"
        sub={`${CLIENTES.length} clientes registrados`}
        actions={
          <button className="btn sm primary" onClick={() => navigate('/app/clientes')}>
            + Nuevo cliente
          </button>
        }
      />

      {/* Stats */}
      <div className="statgrid">
        <StatCard label="Total" value={CLIENTES.length} foot="registrados" />
        <StatCard label="Activos" value={CLIENTES.filter(c => c.active).length} foot="con renta abierta" tone="accent" />
        <StatCard label="Frecuentes" value={CLIENTES.filter(c => c.fav).length} foot="5+ rentas" tone="warn" />
        <StatCard label="Incidencias" value={CLIENTES.reduce((a, c) => a + c.inc, 0)} foot="este mes" tone="danger" />
      </div>

      <div className="cli-grid">
        {/* Left: list */}
        <div>
          <div className="cli-search" onClick={() => {}}>
            <Search size={15} />
            <input
              type="text"
              placeholder="Buscar cliente…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ border: 0, background: 'transparent', outline: 'none', flex: 1, font: 'inherit', fontSize: 13.5, color: 'var(--ink)' }}
            />
          </div>
          <div className="card cli-list">
            {filtered.map((c) => (
              <button
                key={c.i}
                className="cli-row"
                data-on={selected?.i === c.i ? 'true' : 'false'}
                onClick={() => setSelected(c)}
              >
                <div className="avatar accent" style={{ width: 40, height: 40, fontSize: 14 }}>{c.i}</div>
                <div className="cli-row-main">
                  <div className="cli-row-top">
                    <span className="cli-row-n">{c.n}</span>
                    {c.fav && <span className="cli-star"><Star size={12} fill="currentColor" /></span>}
                    {c.tagChip && (
                      <span className={'chip sm ' + c.tagChip}>{c.tag}</span>
                    )}
                  </div>
                  <div className={'cli-row-meta' + (c.warn ? ' warn' : '')}>
                    desde {c.desde} {c.warn ? '· adeuda multa' : ''}
                  </div>
                </div>
                <div className="cli-row-end">
                  <div className="cli-row-rentas">{c.rentas}<small> rent.</small></div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginTop: 2 }}>${fmt(c.fact)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: detail */}
        {selected ? (
          <div className="card cli-detail">
            {/* Head */}
            <div className="cli-dhead">
              <div className="avatar accent" style={{ width: 52, height: 52, fontSize: 17 }}>{selected.i}</div>
              <div className="meta">
                <h2>{selected.n}</h2>
                <div className="cli-dsince">
                  <span>desde {selected.desde}</span>
                  {selected.tagChip && (
                    <span className={'chip sm ' + selected.tagChip}>{selected.tag}</span>
                  )}
                  {selected.fav && (
                    <span className="cli-star"><Star size={12} fill="currentColor" /> frecuente</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="cli-dactions">
              <button className="btn sm primary">Nueva reserva</button>
              <button className="btn sm">Cotizar</button>
            </div>

            {/* KPIs */}
            <div className="cli-dkpis">
              <div className="cli-dkpi">
                <div className="cli-dkpi-v">{selected.rentas}</div>
                <div className="cli-dkpi-l">Rentas</div>
              </div>
              <div className="cli-dkpi">
                <div className="cli-dkpi-v">${selected.fact >= 1000 ? (selected.fact / 1000).toFixed(0) + 'k' : fmt(selected.fact)}</div>
                <div className="cli-dkpi-l">Facturado</div>
              </div>
              <div className="cli-dkpi">
                <div className={'cli-dkpi-v' + (selected.inc > 0 ? ' warn' : '')}>{selected.inc}</div>
                <div className="cli-dkpi-l">Incidencias</div>
              </div>
            </div>

            {/* Contact data */}
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Datos de contacto</div>
              <div className="cli-data">
                <div className="cli-data-row">
                  <Phone size={15} />
                  <span>{selected.tel}</span>
                </div>
                <div className="cli-data-row">
                  <MessageSquare size={15} />
                  <span>{selected.email}</span>
                </div>
                <div className="cli-data-row">
                  <FileText size={15} />
                  <span>INE: <span className="mono">{selected.ine}</span></span>
                </div>
                <div className="cli-data-row">
                  <Key size={15} />
                  <span>Licencia vence: <span className="mono">{selected.lic}</span></span>
                </div>
              </div>
            </div>

            {/* Rentas */}
            <div>
              <div className="sect-head" style={{ marginBottom: 6 }}>
                <div className="eyebrow">Historial de rentas</div>
              </div>
              {rentas.length > 0 ? (
                <div className="cli-data">
                  {rentas.map((r, i) => (
                    <div key={i} className="cli-rent">
                      <MiniCarPhoto tone={r.tone} />
                      <div className="cli-rent-main">
                        <div className="cli-rent-car">{r.car} <span className="mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>{r.plate}</span></div>
                        <div className="cli-rent-when">{r.when} · {r.state}</div>
                      </div>
                      <div className="cli-rent-end">
                        <div className="cli-rent-total">${fmt(r.total)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--ink3)', padding: '12px 0' }}>
                  Sin rentas registradas.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={'card cli-detail is-empty'}>
            <div className="cli-empty">
              <div className="ic">
                <Search size={24} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink2)' }}>Selecciona un cliente</div>
              <div style={{ fontSize: 13, marginTop: 6, color: 'var(--ink3)' }}>Elige un cliente de la lista para ver su detalle.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
