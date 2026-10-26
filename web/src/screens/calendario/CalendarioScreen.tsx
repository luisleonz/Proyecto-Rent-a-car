import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Search, Gauge, KeyRound, CornerDownLeft, AlertTriangle, Layers } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { hoyISO, addDias, diffDias, parseISO } from '../../lib/fechas'
import type { Vehiculo, Reserva } from '../../lib/database.types'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

export type ResCal = Pick<Reserva, 'id' | 'vehiculo_id' | 'fecha_entrega' | 'fecha_devolucion' | 'status' | 'folio'> & {
  clientes: { nombre: string } | null
}
export type VehCal = Pick<Vehiculo, 'id' | 'modelo' | 'placa' | 'status'>

const RANGOS = [
  { key: 'semana', label: 'Semana', dias: 7 },
  { key: '2sem', label: '2 semanas', dias: 14 },
  { key: 'mes', label: 'Mes', dias: 31 },
] as const

type Tono = 'activo' | 'reservado' | 'devuelto' | 'vencido'

export function tonoDe(r: ResCal, hoy: string): Tono {
  if (r.status === 'devuelta') return 'devuelto'
  if (r.status === 'entregada') return r.fecha_devolucion < hoy ? 'vencido' : 'activo'
  return 'reservado'
}

const DIA_SEM = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/* ─── Grid (pure) ─────────────────────────────────────────────── */
export function FleetGrid({ vehiculos, reservas, desde, dias, hoy, onBar, onCell }: {
  vehiculos: VehCal[]; reservas: ResCal[]; desde: string; dias: number; hoy: string
  onBar: (r: ResCal) => void; onCell: (vehiculoId: string, fecha: string) => void
}) {
  const fechas = useMemo(() => Array.from({ length: dias }, (_, i) => addDias(desde, i)), [desde, dias])
  const hasta  = fechas[fechas.length - 1]
  const hoyIdx = diffDias(desde, hoy)
  const colMin = dias > 20 ? 30 : 44

  const porVehiculo = useMemo(() => {
    const m = new Map<string, ResCal[]>()
    reservas.forEach(r => {
      const fin = tonoDe(r, hoy) === 'vencido' ? hoy : r.fecha_devolucion
      if (!r.vehiculo_id || fin < desde || r.fecha_entrega > hasta) return
      m.set(r.vehiculo_id, [...(m.get(r.vehiculo_id) ?? []), r])
    })
    return m
  }, [reservas, desde, hasta, hoy])

  const cols = `minmax(124px, 210px) repeat(${dias}, minmax(${colMin}px, 1fr))`

  return (
    <div className="fc-scroll">
      <div className="fc-grid" style={{ minWidth: 124 + dias * colMin }}>
        <div className="fc-row fc-headrow" style={{ gridTemplateColumns: cols }}>
          <div className="fc-vcell fc-hlabel">Vehículo</div>
          {fechas.map((f, i) => {
            const d = parseISO(f)
            return (
              <div key={f} className={`fc-day${i === hoyIdx ? ' hoy' : ''}${d.getDay() === 0 || d.getDay() === 6 ? ' finde' : ''}`}>
                <span>{DIA_SEM[d.getDay()]}</span>
                <b>{d.getDate()}</b>
                {(d.getDate() === 1 || i === 0) && <span>{MES[d.getMonth()]}</span>}
              </div>
            )
          })}
        </div>

        {vehiculos.map(v => (
          <div key={v.id} className="fc-row" style={{ gridTemplateColumns: cols }}>
            <div className="fc-vcell">
              <span className={`fc-dot ${v.status}`} />
              <div style={{ minWidth: 0 }}>
                <div className="fc-vname">{v.modelo}</div>
                <div className="fc-vplate">{v.placa}</div>
              </div>
            </div>
            {fechas.map((f, i) => (
              <button key={f} className={`fc-cell${i === hoyIdx ? ' hoy' : ''}`} title="Nueva reserva"
                style={{ gridColumn: i + 2 }} onClick={() => onCell(v.id, f)} />
            ))}
            <div className="fc-track" style={{ gridColumn: `2 / span ${dias}` }}>
              {(porVehiculo.get(v.id) ?? []).map(r => {
                // Bars run from mid-pickup-day to mid-return-day so same-day turnovers sit side by side
                const tono = tonoDe(r, hoy)
                // An overdue car is still out, so its bar runs through today
                const finReal = tono === 'vencido' ? hoy : r.fecha_devolucion
                const ini = Math.max(-0.5, diffDias(desde, r.fecha_entrega)) + 0.5
                const fin = Math.min(dias, diffDias(desde, finReal) + (tono === 'vencido' ? 1 : 0.5))
                const nombre = r.clientes?.nombre ?? 'Sin cliente'
                return (
                  <button key={r.id} className={`fc-bar ${tono}`}
                    style={{ left: `${(ini / dias) * 100}%`, width: `calc(${((fin - ini) / dias) * 100}% - 3px)` }}
                    title={`${r.folio ? `#${r.folio} · ` : ''}${nombre}\n${r.fecha_entrega} → ${r.fecha_devolucion}`}
                    onClick={() => onBar(r)}>
                    {r.folio ? <b>#{r.folio}</b> : null}{r.folio ? ' · ' : ''}{nombre}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Screen ──────────────────────────────────────────────────── */
export default function CalendarioScreen() {
  const navigate = useNavigate()
  const hoy = hoyISO()
  const [rango, setRango] = useState<typeof RANGOS[number]['key']>('2sem')
  const dias = RANGOS.find(r => r.key === rango)!.dias
  const [desde, setDesde] = useState(addDias(hoy, -1))
  const hasta = addDias(desde, dias - 1)
  const [vehiculos, setVehiculos] = useState<VehCal[]>([])
  const [reservas, setReservas] = useState<ResCal[]>([])
  const [hoyRes, setHoyRes] = useState<ResCal[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    db.from('vehiculos').select('id, modelo, placa, status').order('modelo')
      .then(({ data }: { data: VehCal[] | null }) => setVehiculos(data ?? []))
    // Everything active today, regardless of the visible range, for the headline numbers
    db.from('reservas').select('*, clientes(nombre)')
      .in('status', ['pendiente', 'confirmada', 'entregada'])
      .lte('fecha_entrega', hoy)
      .then(({ data }: { data: ResCal[] | null }) => setHoyRes(data ?? []))
  }, [])

  useEffect(() => {
    setLoading(true)
    db.from('reservas').select('*, clientes(nombre)')
      .neq('status', 'cancelada')
      .lte('fecha_entrega', hasta)
      .or(`fecha_devolucion.gte.${desde},status.eq.entregada`)
      .then(({ data, error }: { data: ResCal[] | null; error: { message: string } | null }) => {
        if (error) console.error('calendario:', error)
        setReservas(data ?? [])
        setLoading(false)
      })
  }, [desde, hasta])

  const stats = useMemo(() => {
    const ocupados = new Set(hoyRes.filter(r => r.fecha_devolucion > hoy || r.status === 'entregada').map(r => r.vehiculo_id))
    const enTaller = vehiculos.filter(v => v.status === 'taller').length
    return {
      libres:   vehiculos.filter(v => v.status !== 'taller' && !ocupados.has(v.id)).length,
      total:    vehiculos.length - enTaller,
      salen:    hoyRes.filter(r => r.fecha_entrega === hoy && r.status !== 'entregada').length,
      regresan: hoyRes.filter(r => r.fecha_devolucion === hoy && r.status === 'entregada').length,
      vencidas: hoyRes.filter(r => r.status === 'entregada' && r.fecha_devolucion < hoy).length,
    }
  }, [hoyRes, vehiculos, hoy])

  const visibles = vehiculos.filter(v => !q.trim() || `${v.modelo} ${v.placa}`.toLowerCase().includes(q.trim().toLowerCase()))
  const enPeriodo = reservas.filter(r => r.status !== 'devuelta').length
  const fmtCorto = (iso: string) => { const d = parseISO(iso); return `${d.getDate()} ${MES[d.getMonth()]}` }

  return (
    <div className="screen">
      <style>{FC_CSS}</style>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Agenda</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>Calendario de flota</h1>
        </div>
        <div className="pagehead-actions">
          <button className="btn primary" onClick={() => navigate('/app/reservations?new=1')}>
            <Plus size={16} />Nueva reserva
          </button>
        </div>
      </div>

      <div className="fc-stats">
        <Stat icon={<Gauge size={17} />} n={stats.libres} label={`Libres hoy · ${stats.libres} de ${stats.total}`} tone="ok" />
        <Stat icon={<KeyRound size={17} />} n={stats.salen} label="Salen hoy" />
        <Stat icon={<CornerDownLeft size={17} />} n={stats.regresan} label="Regresan hoy" />
        <Stat icon={<AlertTriangle size={17} />} n={stats.vencidas} label="Vencidas" tone={stats.vencidas > 0 ? 'danger' : undefined} />
        <Stat icon={<Layers size={17} />} n={enPeriodo} label="Reservas en el periodo" />
      </div>

      <div className="fc-toolbar">
        <div className="fc-seg">
          {RANGOS.map(r => (
            <button key={r.key} data-on={String(rango === r.key)} onClick={() => setRango(r.key)}>{r.label}</button>
          ))}
        </div>
        <div className="fc-nav">
          <button className="iconbtn" onClick={() => setDesde(addDias(desde, -Math.min(dias, 7)))} aria-label="Anterior"><ChevronLeft size={17} /></button>
          <span className="fc-range">{fmtCorto(desde)} — {fmtCorto(hasta)}</span>
          <button className="iconbtn" onClick={() => setDesde(addDias(desde, Math.min(dias, 7)))} aria-label="Siguiente"><ChevronRight size={17} /></button>
          <button className="btn sm" onClick={() => setDesde(addDias(hoy, -1))}>Hoy</button>
        </div>
        <label className="fc-search">
          <Search size={15} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar vehículo o placa" />
        </label>
      </div>

      <div className="fc-legend">
        <span><i className="activo" />Rentado</span>
        <span><i className="reservado" />Reservado</span>
        <span><i className="devuelto" />Devuelto</span>
        <span><i className="vencido" />Vencido</span>
        <span><i className="hoy" />Hoy</span>
        <span style={{ marginLeft: 'auto' }}>Toca un espacio vacío para reservar ese vehículo ese día</span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
        <FleetGrid vehiculos={visibles} reservas={reservas} desde={desde} dias={dias} hoy={hoy}
          onBar={r => navigate(`/app/reservations?res=${r.id}`)}
          onCell={(vid, f) => navigate(`/app/reservations?new=1&vehiculoId=${vid}&fecha=${f < hoy ? hoy : f}`)} />
      </div>
    </div>
  )
}

function Stat({ icon, n, label, tone }: { icon: React.ReactNode; n: number; label: string; tone?: 'ok' | 'danger' }) {
  return (
    <div className={`fc-stat${tone ? ` ${tone}` : ''}`}>
      <div className="fc-stat-ico">{icon}</div>
      <div>
        <div className="fc-stat-n">{n}</div>
        <div className="fc-stat-l">{label}</div>
      </div>
    </div>
  )
}

export const FC_CSS = `
.fc-stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
.fc-stat { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: var(--card); border: 1px solid var(--card-line); border-radius: var(--radius-sm); }
.fc-stat-ico { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: var(--paper-alt); color: var(--ink2); flex-shrink: 0; }
.fc-stat.ok .fc-stat-ico { background: var(--primary-soft); color: var(--primary); }
.fc-stat.danger .fc-stat-ico { background: var(--danger-soft); color: var(--danger); }
.fc-stat.danger .fc-stat-n { color: var(--danger); }
.fc-stat-n { font-size: 20px; font-weight: 700; line-height: 1.1; }
.fc-stat-l { font-size: 11.5px; color: var(--ink3); }

.fc-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
.fc-seg { display: inline-flex; background: var(--card); border: 1px solid var(--card-line); border-radius: 10px; padding: 3px; }
.fc-seg button { border: 0; background: none; font: inherit; font-size: 13px; font-weight: 600; color: var(--ink3); padding: 6px 12px; border-radius: 7px; cursor: pointer; }
.fc-seg button[data-on="true"] { background: var(--ink); color: var(--paper); }
.fc-nav { display: inline-flex; align-items: center; gap: 6px; }
.fc-range { font-size: 13.5px; font-weight: 600; min-width: 120px; text-align: center; }
.fc-search { margin-left: auto; display: inline-flex; align-items: center; gap: 7px; background: var(--card); border: 1px solid var(--card-line); border-radius: 10px; padding: 0 11px; color: var(--ink3); }
.fc-search input { border: 0; outline: none; background: none; font: inherit; font-size: 13.5px; padding: 8px 0; width: 190px; color: var(--ink); }

.fc-legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: var(--ink3); margin-bottom: 10px; align-items: center; }
.fc-legend span { display: inline-flex; align-items: center; gap: 6px; }
.fc-legend i { width: 18px; height: 10px; border-radius: 3px; display: inline-block; }
.fc-legend i.activo { background: var(--ink); }
.fc-legend i.reservado { background: var(--primary-soft); border: 1px solid var(--primary-line); }
.fc-legend i.devuelto { background: var(--card); border: 1px solid var(--ink4); }
.fc-legend i.vencido { background: var(--danger); }
.fc-legend i.hoy { background: oklch(0.93 0.09 95); border: 1px solid oklch(0.82 0.13 90); }

.fc-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.fc-grid { display: flex; flex-direction: column; }
.fc-row { display: grid; position: relative; border-bottom: 1px solid var(--hairline); min-height: 46px; }
.fc-row:last-child { border-bottom: 0; }
.fc-headrow { min-height: 52px; background: var(--paper-alt); }
.fc-vcell { grid-row: 1; grid-column: 1; position: sticky; left: 0; z-index: 3; background: var(--card); display: flex; align-items: center; gap: 9px; padding: 6px 12px; border-right: 1px solid var(--card-line); }
.fc-headrow .fc-vcell { background: var(--paper-alt); }
.fc-hlabel { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: var(--ink3); }
.fc-vname { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fc-vplate { font-size: 11px; color: var(--ink3); font-family: var(--font-mono); }
.fc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: var(--ink4); }
.fc-dot.disponible { background: var(--primary); }
.fc-dot.rentado { background: var(--ink); }
.fc-dot.reservado { background: var(--warn); }
.fc-dot.taller { background: var(--danger); }
.fc-day { grid-row: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10.5px; color: var(--ink3); border-left: 1px solid var(--hairline); line-height: 1.25; }
.fc-day b { font-size: 13px; color: var(--ink); }
.fc-day.finde { background: oklch(0.955 0.006 80); }
.fc-day.hoy { background: oklch(0.93 0.09 95); color: var(--ink); }
.fc-cell { grid-row: 1; border: 0; border-left: 1px solid var(--hairline); background: transparent; cursor: pointer; padding: 0; }
.fc-cell:hover { background: var(--primary-soft); }
.fc-cell.hoy { background: oklch(0.97 0.05 95); }
.fc-track { grid-row: 1; position: relative; pointer-events: none; }
.fc-bar { pointer-events: auto; position: absolute; top: 50%; transform: translateY(-50%); height: 28px; margin-left: 1.5px; border-radius: 7px;
  font: inherit; font-size: 11.5px; font-weight: 600; text-align: left; padding: 0 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; border: 1px solid transparent; }
.fc-bar b { font-weight: 800; }
.fc-bar.activo { background: var(--ink); color: var(--paper); }
.fc-bar.reservado { background: var(--primary-soft); color: var(--primary-dark); border-color: var(--primary-line); }
.fc-bar.devuelto { background: var(--card); color: var(--ink3); border-color: var(--ink4); }
.fc-bar.vencido { background: var(--danger); color: #fff; }
.fc-bar:hover { filter: brightness(0.95); box-shadow: 0 2px 8px rgba(0,0,0,0.12); }

@container app (max-width: 900px) {
  .fc-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .fc-search { margin-left: 0; width: 100%; }
  .fc-search input { width: 100%; }
  .fc-legend span:last-child { display: none; }
}
`
