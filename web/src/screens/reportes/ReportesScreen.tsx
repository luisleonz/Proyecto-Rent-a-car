import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { hoyISO, addDias, diffDias, parseISO } from '../../lib/fechas'
import { porCobrar } from '../../lib/reservas'
import type { ReservaConDetalle, Vehiculo } from '../../lib/database.types'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any
const fmt = (n: number) => new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(n)
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

type Pago = { monto: number; concepto: string; fecha: string }
type Periodo = 'mes' | 'mes_ant' | '3m' | 'anio'
const PERIODOS: [Periodo, string][] = [['mes', 'Este mes'], ['mes_ant', 'Mes pasado'], ['3m', '3 meses'], ['anio', 'Este año']]

function rango(p: Periodo): [string, string] {
  const hoy = hoyISO(), [y, m] = hoy.split('-').map(Number)
  const primero = (yy: number, mm: number) => `${yy}-${String(mm).padStart(2, '0')}-01`
  if (p === 'mes') return [primero(y, m), hoy]
  if (p === 'mes_ant') { const [py, pm] = m === 1 ? [y - 1, 12] : [y, m - 1]; return [primero(py, pm), addDias(primero(y, m), -1)] }
  if (p === '3m') return [addDias(hoy, -89), hoy]
  return [`${y}-01-01`, hoy]
}

// Days of [a,b) that fall inside [desde, hasta]
const traslape = (a: string, b: string, desde: string, hasta: string) => {
  const ini = a > desde ? a : desde, fin = b < addDias(hasta, 1) ? b : addDias(hasta, 1)
  return Math.max(0, diffDias(ini, fin))
}

function Barra({ valor, max, color = 'var(--primary)' }: { valor: number; max: number; color?: string }) {
  return <div style={{ height: 8, borderRadius: 4, background: 'var(--paper-alt)', overflow: 'hidden' }}><div style={{ width: `${max ? Math.min(100, (valor / max) * 100) : 0}%`, height: '100%', background: color }} /></div>
}

export default function ReportesScreen() {
  const navigate = useNavigate()
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [reservas, setReservas] = useState<ReservaConDetalle[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const desde = addDias(hoyISO(), -400)
    Promise.all([
      db.from('reservas').select('*, clientes(nombre, telefono), vehiculos(modelo, placa, anio, tarifa_diaria)').gte('fecha_devolucion', desde),
      db.from('pagos').select('monto, concepto, fecha').gte('fecha', `${desde}T00:00:00-07:00`),
      db.from('vehiculos').select('*').order('modelo'),
    ]).then(([r, p, v]) => { setReservas(r.data ?? []); setPagos(p.data ?? []); setVehiculos(v.data ?? []); setLoading(false) })
  }, [])

  const [desde, hasta] = rango(periodo)
  const diasPeriodo = diffDias(desde, hasta) + 1

  const d = useMemo(() => {
    const enPeriodo = reservas.filter(r => r.fecha_entrega >= desde && r.fecha_entrega <= hasta)
    const validas = enPeriodo.filter(r => r.status !== 'cancelada')
    const canceladas = enPeriodo.length - validas.length
    const reservado = validas.reduce((s, r) => s + (r.total ?? 0), 0)
    const cobrado = pagos.filter(p => (p.concepto === 'renta' || p.concepto === 'cargo_extra'))
      .filter(p => { const f = new Date(new Date(p.fecha).getTime() - 7 * 3600e3).toISOString().slice(0, 10); return f >= desde && f <= hasta })
      .reduce((s, p) => s + p.monto, 0)
    const ocupacion = reservas.filter(r => r.status !== 'cancelada')

    const porVeh = vehiculos.map(v => {
      const rs = ocupacion.filter(r => r.vehiculo_id === v.id)
      const dias = rs.reduce((s, r) => s + traslape(r.fecha_entrega, r.fecha_devolucion, desde, hasta), 0)
      const ingreso = rs.filter(r => r.fecha_entrega >= desde && r.fecha_entrega <= hasta).reduce((s, r) => s + (r.total ?? 0), 0)
      return { v, dias, ingreso, rentas: rs.filter(r => r.fecha_entrega >= desde && r.fecha_entrega <= hasta).length, util: Math.min(100, (dias / diasPeriodo) * 100) }
    }).sort((a, b) => b.ingreso - a.ingreso)
    const diasRentados = porVeh.reduce((s, x) => s + x.dias, 0)
    const utilizacion = vehiculos.length ? (diasRentados / (vehiculos.length * diasPeriodo)) * 100 : 0

    const clientes = new Map<string, { nombre: string; total: number; rentas: number }>()
    validas.forEach(r => {
      const k = r.cliente_id ?? r.id
      const c = clientes.get(k) ?? { nombre: r.clientes?.nombre ?? 'Cliente', total: 0, rentas: 0 }
      c.total += r.total ?? 0; c.rentas++; clientes.set(k, c)
    })
    const topClientes = [...clientes.values()].sort((a, b) => b.total - a.total).slice(0, 8)

    const meses = Array.from({ length: 12 }, (_, i) => {
      const f = parseISO(hoyISO()); f.setDate(1); f.setMonth(f.getMonth() - (11 - i))
      const k = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`
      return { k, l: MES[f.getMonth()], v: reservas.filter(r => r.status !== 'cancelada' && r.fecha_entrega.startsWith(k)).reduce((s, r) => s + (r.total ?? 0), 0) }
    })
    const saldos = reservas.filter(r => r.status === 'devuelta' || r.status === 'entregada').map(r => ({ r, s: porCobrar(r) })).filter(x => x.s > 0)

    return { validas, canceladas, reservado, cobrado, porVeh, utilizacion, diasRentados, topClientes, meses, saldos,
      ticket: validas.length ? reservado / validas.length : 0, total: enPeriodo.length }
  }, [reservas, pagos, vehiculos, desde, hasta, diasPeriodo])

  const maxMes = Math.max(1, ...d.meses.map(m => m.v))
  const maxVeh = Math.max(1, ...d.porVeh.map(x => x.ingreso))

  return (
    <div className="screen">
      <div className="pagehead">
        <div>
          <div className="eyebrow">Gestión</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>Reportes</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4 }}>
            {parseISO(desde).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} — {parseISO(hasta).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="filterbar" style={{ margin: 0 }}>
          {PERIODOS.map(([k, l]) => <button key={k} className={`fbtn${periodo === k ? ' on' : ''}`} onClick={() => setPeriodo(k)}>{l}</button>)}
        </div>
      </div>

      {loading ? <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div> : <>
        <div className="statgrid">
          {[
            ['Reservado', `$${fmt(d.reservado)}`, `${d.validas.length} rentas · ticket promedio $${fmt(d.ticket)}`],
            ['Cobrado', `$${fmt(d.cobrado)}`, 'pagos de renta y cargos registrados'],
            ['Utilización', `${Math.round(d.utilizacion)}%`, `${fmt(d.diasRentados)} días-auto rentados`],
            ['Cancelaciones', String(d.canceladas), d.total ? `${Math.round((d.canceladas / d.total) * 100)}% de las reservas` : '—'],
          ].map(([l, v, s]) => (
            <div key={l} className="card statcard"><div className="eyebrow">{l}</div><div className="statval mono">{v}</div><div style={{ fontSize: 12, color: 'var(--ink3)' }}>{s}</div></div>
          ))}
        </div>

        <div className="card dash-spark" style={{ marginBottom: 'var(--gap)' }}>
          <div className="dash-spark-head"><div className="eyebrow">Reservado por mes · últimos 12 meses</div></div>
          <div className="dash-bars">
            {d.meses.map((m, i) => (
              <div key={m.k} className={'dash-bar' + (i === 11 ? ' now' : '')} title={`$${fmt(m.v)}`}>
                <div className="bar" style={{ height: `${(m.v / maxMes) * 100}%` }} /><div className="lab">{m.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-grid">
          <div>
            <div className="sect-head"><h2 className="sect-title">Por vehículo</h2></div>
            <div className="card tilelist">
              {d.porVeh.map(x => (
                <button key={x.v.id} className="agenda-row" onClick={() => navigate(`/app/vehicles/${x.v.placa}`)} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span className="agenda-who">{x.v.modelo} <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink3)' }}>{x.v.placa}</span></span>
                    <strong>${fmt(x.ingreso)}</strong>
                  </div>
                  <Barra valor={x.ingreso} max={maxVeh} />
                  <div style={{ fontSize: 12, color: 'var(--ink3)' }}>{x.rentas} rentas · {x.dias} días rentado · {Math.round(x.util)}% de utilización</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="sect-head"><h2 className="sect-title">Mejores clientes</h2></div>
            <div className="card tilelist">
              {d.topClientes.length === 0 ? <div style={{ padding: 20, color: 'var(--ink3)', fontSize: 13 }}>Sin rentas en el periodo.</div>
                : d.topClientes.map((c, i) => (
                  <div key={i} className="tilerow">
                    <div className="tile-ic">{i + 1}</div>
                    <div className="tile-main"><div className="tile-l">{c.nombre}</div><div className="tile-s">{c.rentas} renta{c.rentas > 1 ? 's' : ''}</div></div>
                    <strong>${fmt(c.total)}</strong>
                  </div>
                ))}
            </div>
            <div className="sect-head" style={{ marginTop: 'var(--gap)' }}><h2 className="sect-title">Saldos pendientes</h2></div>
            <div className="card tilelist">
              {d.saldos.length === 0 ? <div style={{ padding: 20, color: 'var(--ink3)', fontSize: 13 }}>No hay saldos pendientes.</div>
                : <>
                  <div className="tilerow"><div className="tile-main"><div className="tile-l">Total por cobrar</div></div><strong style={{ color: 'var(--warn-ink)' }}>${fmt(d.saldos.reduce((s, x) => s + x.s, 0))}</strong></div>
                  {d.saldos.slice(0, 10).map(({ r, s }) => (
                    <button key={r.id} className="agenda-row" onClick={() => navigate(`/app/reservations?res=${r.id}`)}>
                      <div className="agenda-main"><div className="agenda-who">{r.clientes?.nombre}</div><div className="agenda-car">#{r.folio ?? '?'} · {r.vehiculos?.modelo}</div></div>
                      <strong style={{ color: 'var(--warn-ink)' }}>${fmt(s)}</strong>
                    </button>
                  ))}
                </>}
            </div>
          </div>
        </div>
      </>}
    </div>
  )
}
