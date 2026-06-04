import { useState } from 'react'

/* ── Types ── */
interface Empleado {
  i: string
  n: string
  id: string
  rol: string
  suc: string
  st: string
  delta: string
  extra: string
  tel: string
  email: string
  desde: string
  last: string
  rating: number | null
  cuadre: string
}

interface PermCat {
  cat: string
  items: [string, boolean, string?][]
}

/* ── Data ── */
const EMPLEADOS: Empleado[] = [
  { i: 'JP', n: 'Juan Pérez',     id: 'L01', rol: 'Mostrador',     suc: 'Centro',  st: 'active',  delta: '+$72,400 mes', extra: '32 reservas', tel: '+52 631 9999 1234', email: 'juan.p@lucianos.mx',    desde: '15 mar 2024', last: 'Hoy · 09:00',  rating: 4.8, cuadre: '20/22' },
  { i: 'AC', n: 'Ana Cruz',       id: 'L02', rol: 'Mostrador',     suc: 'Centro',  st: 'active',  delta: '+$58,100 mes', extra: '28 reservas', tel: '+52 631 8888 4521', email: 'ana.c@lucianos.mx',     desde: '02 jun 2024', last: 'Hoy · 08:40',  rating: 4.7, cuadre: '21/22' },
  { i: 'LV', n: 'Luis Vega',      id: 'L03', rol: 'Mostrador',     suc: 'Centro',  st: 'active',  delta: '+$42,300 mes', extra: '20 reservas', tel: '+52 631 7777 9087', email: 'luis.v@lucianos.mx',    desde: '20 ago 2024', last: 'Ayer · 21:00', rating: 4.5, cuadre: '18/22' },
  { i: 'MR', n: 'Mónica Reyes',   id: 'L04', rol: 'Mostrador',     suc: 'Kennedy', st: 'active',  delta: '+$48,000 mes', extra: '24 reservas', tel: '+52 631 6666 3344', email: 'monica.r@lucianos.mx',  desde: '10 oct 2024', last: 'Hoy · 10:15',  rating: 4.9, cuadre: '22/22' },
  { i: 'EF', n: 'Esteban Flores', id: 'L05', rol: 'Mostrador',     suc: 'Kennedy', st: 'invited', delta: 'Pendiente onboarding', extra: '', tel: '+52 631 5555 7878', email: 'esteban@lucianos.mx',   desde: '—', last: '—', rating: null, cuadre: '—' },
  { i: 'LL', n: 'Luciano Leon',   id: 'A01', rol: 'Administrador', suc: 'Todas',   st: 'active',  delta: 'Dueño',        extra: '', tel: '+52 631 4444 0001', email: 'luciano@lucianos.mx',   desde: '01 ene 2023', last: 'Ahora', rating: null, cuadre: '—' },
]

const EMP_PERMS: PermCat[] = [
  {
    cat: 'Reservas',
    items: [
      ['Crear reserva', true],
      ['Editar reserva', true],
      ['Cancelar reserva', false, 'Requiere admin'],
      ['Aplicar descuento', false, 'Requiere admin'],
    ],
  },
  {
    cat: 'Cobros',
    items: [
      ['Registrar cobro en efectivo', true],
      ['Registrar cobro SPEI', true],
      ['Devolver depósito', true],
      ['Editar cobros pasados', false, 'Solo administrador'],
    ],
  },
  {
    cat: 'Flota',
    items: [
      ['Crear orden de servicio', true, 'Tope $3,500'],
      ['Marcar auto fuera de servicio', true],
      ['Editar info del auto', false, 'Requiere admin'],
    ],
  },
  {
    cat: 'Equipo',
    items: [
      ['Ver equipo', false],
      ['Invitar / dar de baja', false],
      ['Cambiar permisos', false],
    ],
  },
]

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
        <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>
          {title}
        </h1>
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

/* ── EmpleadoDetail ── */
function EmpleadoDetail({ e }: { e: Empleado }) {
  const [perms, setPerms] = useState<boolean[][]>(() =>
    EMP_PERMS.map(c => c.items.map(it => it[1]))
  )

  const toggle = (ci: number, ii: number) => {
    setPerms(p =>
      p.map((cat, x) =>
        x === ci ? cat.map((v, y) => (y === ii ? !v : v)) : cat
      )
    )
  }

  const perf =
    e.rating != null
      ? ([
          ['Reservas creadas', e.extra.replace(' reservas', ''), '+8 vs prom.'],
          ['Ingreso facturado', e.delta.replace('+', '').replace(' mes', ''), '+12%'],
          [
            'Cierres cuadrados',
            e.cuadre,
            Math.round(
              (parseInt(e.cuadre.split('/')[0]) /
                parseInt(e.cuadre.split('/')[1])) *
                100
            ) + '%',
          ],
          ['Calificación', String(e.rating), '★'],
        ] as [string, string, string][])
      : null

  return (
    <>
      <div className="emp-dhead">
        <div
          className={'avatar' + (e.rol === 'Administrador' ? ' accent' : '')}
          style={{ width: 64, height: 64, fontSize: 22 }}
        >
          {e.i}
        </div>
        <div>
          <h2>{e.n}</h2>
          <div className="emp-dmail">
            {e.id} · {e.email}
          </div>
        </div>
        <div className="emp-dchips">
          <span className={'chip sm' + (e.rol === 'Administrador' ? ' dark' : '')}>
            {e.rol}
          </span>
          <span className="chip sm">{e.suc}</span>
          <span className={'chip sm ' + (e.st === 'active' ? 'primary' : 'warn')}>
            {e.st === 'active' ? 'Activo' : 'Invitado'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn sm" style={{ flex: 1 }}>Reset acceso</button>
        <button className="btn sm" style={{ flex: 1 }}>Mensaje</button>
        <button className="btn sm" style={{ flex: 1 }}>
          {e.st === 'active' ? 'Suspender' : 'Reenviar invitación'}
        </button>
      </div>

      {perf && (
        <div className="card-flat" style={{ padding: 16, borderRadius: 'var(--radius-sm)' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Rendimiento · mayo
          </div>
          <div className="emp-perf">
            {perf.map((r, i) => (
              <div key={i} className="emp-perf-row">
                <span className="emp-perf-l">{r[0]}</span>
                <div>
                  <div className="emp-perf-v">{r[1]}</div>
                  <div className="emp-perf-d">{r[2]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="sect-head" style={{ marginBottom: 6 }}>
          <div className="eyebrow">Permisos</div>
          <span className="chip sm">Rol: {e.rol}</span>
        </div>
        {EMP_PERMS.map((cat, ci) => (
          <div key={cat.cat}>
            <div className="perm-cat">{cat.cat}</div>
            {cat.items.map((it, ii) => (
              <div key={ii} className="perm-row">
                <button
                  type="button"
                  className={'toggle' + (perms[ci][ii] ? ' on' : '')}
                  onClick={() => toggle(ci, ii)}
                  aria-pressed={perms[ci][ii]}
                >
                  <span className="toggle-knob" />
                </button>
                <div className="perm-text">
                  <div className={'perm-l' + (perms[ci][ii] ? '' : ' off')}>{it[0]}</div>
                  {it[2] && <div className="perm-s">{it[2]}</div>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

/* ── Main screen ── */
export default function EmpleadosScreen() {
  const [sel, setSel] = useState<Empleado>(EMPLEADOS[0])

  const activos  = EMPLEADOS.filter(e => e.st === 'active').length
  const invitados = EMPLEADOS.filter(e => e.st === 'invited').length

  return (
    <div className="screen">
      <PageHead
        eyebrow="Equipo"
        title="Empleados"
        sub={`${EMPLEADOS.length} personas · ${activos} activas`}
        actions={
          <>
            <button className="btn sm">Sucursal: Todas</button>
            <button className="btn sm primary">Invitar persona</button>
          </>
        }
      />

      <div className="statgrid">
        <StatCard label="Activos"         value={activos}   foot="con acceso"   tone="accent" />
        <StatCard label="Invitados"       value={invitados} foot="pendientes"   tone="warn" />
        <StatCard
          label="Mostrador"
          value={EMPLEADOS.filter(e => e.rol === 'Mostrador').length}
          foot="operativos"
        />
        <StatCard
          label="Administradores"
          value={EMPLEADOS.filter(e => e.rol === 'Administrador').length}
          foot="acceso total"
        />
      </div>

      <div className="emp-grid">
        {/* Table */}
        <div className="card emp-table">
          <div className="emp-thead">
            <span />
            <span>Nombre</span>
            <span>Sucursal</span>
            <span>Estado</span>
            <span>Actividad</span>
          </div>
          {EMPLEADOS.map(e => (
            <button
              key={e.id}
              className="emp-row"
              data-on={String(sel?.id === e.id)}
              onClick={() => setSel(e)}
            >
              <div
                className={'avatar' + (e.rol === 'Administrador' ? ' accent' : '')}
                style={{ width: 34, height: 34, fontSize: 12 }}
              >
                {e.i}
              </div>
              <div>
                <div className="emp-name">{e.n}</div>
                <div className="emp-id">
                  {e.id} · {e.rol}
                </div>
              </div>
              <span className="emp-suc">{e.suc}</span>
              <span className={'chip sm ' + (e.st === 'active' ? 'primary' : 'warn')}>
                {e.st === 'active' ? 'Activo' : 'Invitado'}
              </span>
              <div className="emp-delta-cell">
                <div className={'emp-delta' + (e.delta.startsWith('+') ? '' : ' dim')}>
                  {e.delta}
                </div>
                {e.extra && <div className="emp-extra">{e.extra}</div>}
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className={'card emp-detail' + (sel ? '' : ' is-empty')}>
          {sel && <EmpleadoDetail e={sel} />}
        </div>
      </div>
    </div>
  )
}
