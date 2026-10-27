import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Wrench, FileText, KeyRound, Car } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { hoyISO, addDias, diffDias, parseISO } from '../../lib/fechas'
import { porCobrar } from '../../lib/reservas'
import type { Vehiculo, ReservaConDetalle } from '../../lib/database.types'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

const fmt = (n: number) => new Intl.NumberFormat('es-MX').format(Math.round(n))
const fmtK = (n: number) => n >= 10000 ? `$${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : `$${fmt(n)}`
const MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const ini = (n: string) => { const p = n.trim().split(/\s+/); return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?' }

type Mov = { r: ReservaConDetalle; tipo: 'Entrega' | 'Devolución'; fecha: string; hora: string | null }
type Rango = 'hoy' | 'manana' | 'semana'

function StatCard({ label, value, foot, tone }: { label: string; value: number; foot: string; tone?: 'warn' | 'accent' }) {
  return (
    <div className="card statcard">
      <div className="eyebrow">{label}</div>
      <div className="statval mono" style={tone === 'warn' ? { color: 'var(--warn-ink)' } : tone === 'accent' ? { color: 'var(--primary)' } : undefined}>
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>{foot}</div>
    </div>
  )
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const { currentFirstName, isAdmin } = useAuth()
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [reservas, setReservas] = useState<ReservaConDetalle[]>([])
  const [cotPendientes, setCotPendientes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [rango, setRango] = useState<Rango>('hoy')
  const hoy = hoyISO()

  useEffect(() => {
    const desde6m = addDias(hoy, -190)
    Promise.all([
      db.from('vehiculos').select('*').order('modelo'),
      db.from('reservas').select('*, clientes(nombre, telefono), vehiculos(modelo, placa, anio, tarifa_diaria)')
        .neq('status', 'cancelada').gte('fecha_devolucion', desde6m),
      db.from('cotizaciones').select('id', { count: 'exact', head: true }).eq('status', 'enviada'),
    ]).then(([v, r, c]) => {
      setVehiculos(v.data ?? [])
      setReservas(r.data ?? [])
      setCotPendientes(c.count ?? 0)
      setLoading(false)
    })
  }, [])

  const d = useMemo(() => {
    const mes = hoy.slice(0, 7)
    const delMes = reservas.filter(r => r.fecha_entrega.startsWith(mes))
    const vencidas = reservas.filter(r => r.status === 'entregada' && r.fecha_devolucion < hoy)
    const noSalieron = reservas.filter(r => (r.status === 'confirmada' || r.status === 'pendiente') && r.fecha_entrega < hoy)
    const porCobrarTotal = reservas.reduce((s, r) => s + porCobrar(r), 0)
    const counts = vehiculos.reduce<Record<string, number>>((a, v) => { a[v.status] = (a[v.status] ?? 0) + 1; return a }, {})

    const meses = Array.from({ length: 6 }, (_, i) => {
      const f = parseISO(hoy); f.setDate(1); f.setMonth(f.getMonth() - (5 - i))
      const key = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`
      return { key, label: MES[f.getMonth()], v: reservas.filter(r => r.fecha_entrega.startsWith(key)).reduce((s, r) => s + (r.total ?? 0), 0) }
    })

    const movs: Mov[] = []
    reservas.forEach(r => {
      if (r.status === 'confirmada' || r.status === 'pendiente') movs.push({ r, tipo: 'Entrega', fecha: r.fecha_entrega, hora: r.hora_entrega ?? null })
      if (r.status === 'entregada') movs.push({ r, tipo: 'Devolución', fecha: r.fecha_devolucion, hora: r.hora_devolucion ?? null })
    })
    movs.sort((a, b) => (a.fecha + (a.hora ?? '99')).localeCompare(b.fecha + (b.hora ?? '99')))

    return {
      montoMes: delMes.reduce((s, r) => s + (r.total ?? 0), 0),
      anticiposMes: delMes.reduce((s, r) => s + (r.deposito ?? 0), 0),
      reservasMes: delMes.length,
      vencidas, noSalieron, porCobrarTotal, counts, meses, movs,
      salenHoy: movs.filter(m => m.tipo === 'Entrega' && m.fecha === hoy).length,
      regresanHoy: movs.filter(m => m.tipo === 'Devolución' && m.fecha === hoy).length,
    }
  }, [reservas, vehiculos, hoy])

  const agenda = d.movs.filter(m => {
    if (rango === 'hoy') return m.fecha === hoy
    if (rango === 'manana') return m.fecha === addDias(hoy, 1)
    return m.fecha >= hoy && m.fecha <= addDias(hoy, 6)
  })
  const maxMes = Math.max(1, ...d.meses.map(m => m.v))
  const total = vehiculos.length
  const rentados = d.counts.rentado ?? 0
  const disponibles = vehiculos.filter(v => v.status === 'disponible')
  const fechaHoy = parseISO(hoy).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  const abrir = (id: string) => navigate(`/app/reservations?res=${id}`)

  return (
    <div className="screen">
      <div className="pagehead">
        <div>
          <div className="eyebrow">{fechaHoy}</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>Hola, {currentFirstName || 'Luciano'}</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4 }}>
            {loading ? 'Cargando…' : `Hoy: ${d.salenHoy} ${d.salenHoy === 1 ? 'entrega' : 'entregas'}, ${d.regresanHoy} ${d.regresanHoy === 1 ? 'devolución' : 'devoluciones'}`}
          </p>
        </div>
        <div className="pagehead-actions">
          <button className="btn sm" onClick={() => navigate('/app/cotizaciones')}>Cotizar</button>
          <button className="btn sm" onClick={() => navigate('/app/calendario')}>Calendario</button>
          <button className="btn sm primary" onClick={() => navigate('/app/reservations?new=1')}>Nueva reserva</button>
        </div>
      </div>

      <div className="dash-top">
        <div className="card dash-hero">
          <div>
            <div className="dash-hero-top">
              <div className="eyebrow">{isAdmin ? 'Reservado este mes' : 'Vehículos rentados'}</div>
              <span className="dash-pill">{d.reservasMes} reservas</span>
            </div>
            <div className="dash-rev">
              {isAdmin ? `$${fmt(d.montoMes)}` : <>{rentados}<small style={{ fontSize: 22 }}>/{total}</small></>}
            </div>
          </div>
          <div className="dash-hero-foot">
            {isAdmin && (
              <div className="dash-mini">
                <div className="dash-mini-l">Rentados</div>
                <div className="dash-mini-v">{rentados}<small>/{total}</small></div>
              </div>
            )}
            {isAdmin ? (
              <>
                <div className="dash-mini">
                  <div className="dash-mini-l">Anticipos del mes</div>
                  <div className="dash-mini-v">{fmtK(d.anticiposMes)}</div>
                </div>
                <div className="dash-mini">
                  <div className="dash-mini-l">Saldos por cobrar</div>
                  <div className="dash-mini-v">{fmtK(d.porCobrarTotal)}</div>
                </div>
              </>
            ) : (
              <>
                <div className="dash-mini">
                  <div className="dash-mini-l">Entregas hoy</div>
                  <div className="dash-mini-v">{d.salenHoy}</div>
                </div>
                <div className="dash-mini">
                  <div className="dash-mini-l">Devoluciones hoy</div>
                  <div className="dash-mini-v">{d.regresanHoy}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {isAdmin ? (
          <div className="card dash-spark">
            <div className="dash-spark-head">
              <div className="eyebrow">Reservado · 6 meses</div>
              <span className="h-display" style={{ fontSize: 20 }}>{fmtK(d.meses.reduce((s, m) => s + m.v, 0))}</span>
            </div>
            <div className="dash-bars">
              {d.meses.map((m, i) => (
                <div key={m.key} className={'dash-bar' + (i === 5 ? ' now' : '')} title={`$${fmt(m.v)}`}>
                  <div className="bar" style={{ height: `${(m.v / maxMes) * 100}%` }} />
                  <div className="lab">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card dash-spark">
            <div className="dash-spark-head">
              <div className="eyebrow">Utilización de la flota</div>
              <span className="h-display" style={{ fontSize: 20 }}>{total ? Math.round((rentados / total) * 100) : 0}%</span>
            </div>
            <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', background: 'var(--paper-alt)', margin: '18px 0 12px' }}>
              {([['rentado', 'var(--ink)'], ['reservado', 'var(--warn)'], ['disponible', 'var(--primary)'], ['taller', 'var(--danger)']] as const).map(([k, c]) => (
                <div key={k} style={{ width: `${total ? ((d.counts[k] ?? 0) / total) * 100 : 0}%`, background: c }} />
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink3)' }}>
              {rentados} rentados · {d.counts.reservado ?? 0} reservados · {disponibles.length} disponibles · {d.counts.taller ?? 0} en taller
            </div>
          </div>
        )}
      </div>

      <div className="statgrid">
        <StatCard label="Disponibles" value={d.counts.disponible ?? 0} foot="listos para rentar" tone="accent" />
        <StatCard label="Rentados"    value={rentados}                 foot="en la calle" />
        <StatCard label="Reservados"  value={d.counts.reservado ?? 0}  foot="próximas salidas" />
        <StatCard label="En taller"   value={d.counts.taller ?? 0}     foot="mantenimiento" tone="warn" />
      </div>

      <div className="dash-grid">
        <div>
          <div className="sect-head">
            <h2 className="sect-title">Próximos movimientos</h2>
            <span className="link" onClick={() => navigate('/app/reservations')}>Ver todo →</span>
          </div>
          <div className="filterbar" style={{ marginBottom: 10 }}>
            {([['hoy', 'Hoy'], ['manana', 'Mañana'], ['semana', '7 días']] as const).map(([k, l]) => (
              <button key={k} className={`fbtn${rango === k ? ' on' : ''}`} onClick={() => setRango(k)}>{l}</button>
            ))}
          </div>
          <div className="card tilelist">
            {agenda.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--ink3)', fontSize: 13.5 }}>
                {loading ? 'Cargando…' : 'Sin entregas ni devoluciones en este periodo.'}
              </div>
            ) : agenda.map(m => (
              <button key={m.r.id + m.tipo} className="agenda-row" onClick={() => abrir(m.r.id)}>
                <span className="agenda-time" style={{ width: rango === 'semana' ? 74 : 56 }}>
                  {rango === 'semana' && <span style={{ display: 'block', fontSize: 11, color: 'var(--ink3)', fontWeight: 500 }}>
                    {parseISO(m.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })}
                  </span>}
                  {m.hora ? m.hora.slice(0, 5) : '—'}
                </span>
                <div className="avatar accent" style={{ width: 38, height: 38, fontSize: 13 }}>{ini(m.r.clientes?.nombre ?? '?')}</div>
                <div className="agenda-main">
                  <div className="agenda-who">{m.r.clientes?.nombre ?? 'Cliente'}</div>
                  <div className="agenda-car">
                    {m.r.vehiculos?.modelo ?? '—'} · <span className="mono">{m.r.vehiculos?.placa ?? ''}</span>
                    {m.r.folio != null && <> · #{m.r.folio}</>}
                  </div>
                </div>
                <span className={'chip sm ' + (m.tipo === 'Entrega' ? 'primary' : 'warn')}>{m.tipo}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect-head">
            <h2 className="sect-title">Requiere atención</h2>
          </div>
          <div className="card tilelist">
            {d.vencidas.map(r => (
              <div key={r.id} className="tilerow">
                <div className="tile-ic danger"><AlertTriangle size={18} /></div>
                <div className="tile-main">
                  <div className="tile-l">Devolución atrasada · {r.vehiculos?.modelo}</div>
                  <div className="tile-s">{r.clientes?.nombre} · {diffDias(r.fecha_devolucion, hoy)}d de retraso{r.clientes?.telefono ? ` · ${r.clientes.telefono}` : ''}</div>
                </div>
                <span className="link" style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => abrir(r.id)}>Ver</span>
              </div>
            ))}
            {d.noSalieron.map(r => (
              <div key={r.id} className="tilerow">
                <div className="tile-ic warn"><KeyRound size={18} /></div>
                <div className="tile-main">
                  <div className="tile-l">Entrega sin registrar · {r.vehiculos?.modelo}</div>
                  <div className="tile-s">{r.clientes?.nombre} · debió salir hace {diffDias(r.fecha_entrega, hoy)}d</div>
                </div>
                <span className="link" style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => abrir(r.id)}>Ver</span>
              </div>
            ))}
            {(d.counts.taller ?? 0) > 0 && (
              <div className="tilerow">
                <div className="tile-ic warn"><Wrench size={18} /></div>
                <div className="tile-main">
                  <div className="tile-l">{d.counts.taller} en taller</div>
                  <div className="tile-s">{vehiculos.filter(v => v.status === 'taller').map(v => v.modelo).join(', ')}</div>
                </div>
                <span className="link" style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/app/vehicles')}>Flota</span>
              </div>
            )}
            {cotPendientes > 0 && (
              <div className="tilerow">
                <div className="tile-ic"><FileText size={18} /></div>
                <div className="tile-main">
                  <div className="tile-l">{cotPendientes} cotizaci{cotPendientes === 1 ? 'ón' : 'ones'} sin respuesta</div>
                  <div className="tile-s">Dar seguimiento por WhatsApp</div>
                </div>
                <span className="link" style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/app/cotizaciones')}>Ver</span>
              </div>
            )}
            {!loading && d.vencidas.length + d.noSalieron.length + (d.counts.taller ?? 0) + cotPendientes === 0 && (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--ink3)', fontSize: 13.5 }}>Todo en orden.</div>
            )}
          </div>

          <div className="sect-head" style={{ marginTop: 'var(--gap)' }}>
            <h2 className="sect-title">Disponibles ahora</h2>
            <span className="link" onClick={() => navigate('/app/vehicles')}>Flota →</span>
          </div>
          <div className="card tilelist">
            {disponibles.length === 0 ? (
              <div style={{ padding: '22px 16px', textAlign: 'center', color: 'var(--ink3)', fontSize: 13.5 }}>
                {loading ? 'Cargando…' : 'No hay vehículos disponibles.'}
              </div>
            ) : disponibles.slice(0, 6).map(v => (
              <div key={v.id} className="tilerow">
                <div className="tile-ic"><Car size={18} /></div>
                <div className="tile-main">
                  <div className="tile-l">{v.modelo}</div>
                  <div className="tile-s"><span className="mono">{v.placa}</span>{v.tarifa_diaria ? ` · $${fmt(v.tarifa_diaria)}/día` : ''}</div>
                </div>
                <button className="btn sm primary" onClick={() => navigate(`/app/reservations?new=1&vehiculoId=${v.id}&fecha=${hoy}`)}>Rentar</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
