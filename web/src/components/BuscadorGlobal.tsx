import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Car, User, CalendarDays, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

type Resultado = { tipo: 'cliente' | 'vehiculo' | 'reserva'; id: string; titulo: string; detalle: string; ruta: string }

const ESTADO: Record<string, string> = { pendiente: 'pendiente', confirmada: 'confirmada', entregada: 'en renta', devuelta: 'devuelta', cancelada: 'cancelada' }
const ESTADO_AUTO: Record<string, string> = { disponible: 'disponible', rentado: 'en renta', reservado: 'reservado', taller: 'en taller' }
const fechaCorta = (s: string | null) => (s ? new Date(`${s.slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '')

async function buscar(texto: string): Promise<Resultado[]> {
  // Characters with meaning in PostgREST filters are dropped
  const q = texto.replace(/[,()%*\\:"']/g, ' ').trim()
  if (q.length < 2) return []
  const like = `%${q}%`
  const soloDigitos = q.replace(/\D/g, '')
  const [cli, veh, folio] = await Promise.all([
    db.from('clientes').select('*')
      .or(`nombre.ilike.${like},telefono.ilike.${like},email.ilike.${like}${soloDigitos.length >= 4 && soloDigitos !== q ? `,telefono.ilike.%${soloDigitos}%` : ''}`).order('nombre').limit(5),
    db.from('vehiculos').select('id, modelo, placa, anio, status').or(`placa.ilike.${like},modelo.ilike.${like}`).limit(5),
    /^#?\d{1,7}$/.test(q)
      ? db.from('reservas').select('id, folio, status, fecha_entrega, fecha_devolucion, clientes(nombre), vehiculos(modelo)').eq('folio', Number(soloDigitos)).limit(3)
      : Promise.resolve({ data: [] }),
  ])
  const clientes = (cli.data ?? []) as { id: string; nombre: string; telefono: string | null; email: string | null; no_rentar?: boolean }[]
  // Latest reservations of the matching clients, so typing a name also finds their bookings
  const porCliente = clientes.length
    ? (await db.from('reservas').select('id, folio, status, fecha_entrega, fecha_devolucion, clientes(nombre), vehiculos(modelo)')
        .in('cliente_id', clientes.map(c => c.id)).neq('status', 'cancelada').order('fecha_entrega', { ascending: false }).limit(4)).data ?? []
    : []
  type R = { id: string; folio: number | null; status: string; fecha_entrega: string | null; fecha_devolucion: string | null; clientes: { nombre: string } | null; vehiculos: { modelo: string } | null }
  const reservas = [...(folio.data ?? []), ...porCliente].filter((r: R, i: number, a: R[]) => a.findIndex(x => x.id === r.id) === i) as R[]
  return [
    ...reservas.map(r => ({ tipo: 'reserva' as const, id: r.id, ruta: `/app/reservations?res=${r.id}`,
      titulo: `#${r.folio ?? '—'} · ${r.clientes?.nombre ?? 'Sin cliente'}`,
      detalle: `${r.vehiculos?.modelo ?? ''} · ${fechaCorta(r.fecha_entrega)} → ${fechaCorta(r.fecha_devolucion)} · ${ESTADO[r.status] ?? r.status}` })),
    ...clientes.map(c => ({ tipo: 'cliente' as const, id: c.id, ruta: `/app/clientes?c=${c.id}`, titulo: c.nombre, detalle: [c.no_rentar && '⛔ No rentar', c.telefono, c.email].filter(Boolean).join(' · ') || 'Cliente' })),
    ...((veh.data ?? []) as { id: string; modelo: string; placa: string; anio: number | null; status: string | null }[]).map(v => ({
      tipo: 'vehiculo' as const, id: v.id, ruta: `/app/vehicles/${encodeURIComponent(v.placa)}`,
      titulo: `${v.modelo}${v.anio ? ` ${v.anio}` : ''}`, detalle: `${v.placa}${v.status ? ` · ${ESTADO_AUTO[v.status] ?? v.status}` : ''}` })),
  ]
}

const ICONO = { cliente: User, vehiculo: Car, reserva: CalendarDays }

/** Search box for clients, cars (plate/model) and reservations (folio or client name). */
export default function BuscadorGlobal({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [res, setRes] = useState<Resultado[]>([])
  const [abierto, setAbierto] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const caja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (q.trim().length < 2) { setRes([]); setBuscando(false); return }
    setBuscando(true)
    let vigente = true
    const t = setTimeout(() => {
      buscar(q).then(r => { if (vigente) { setRes(r); setSel(0); setBuscando(false) } }).catch(() => vigente && setBuscando(false))
    }, 250)
    return () => { vigente = false; clearTimeout(t) }
  }, [q])

  // "/" or Ctrl+K jumps to the search box from anywhere
  useEffect(() => {
    const atajo = (e: KeyboardEvent) => {
      const escribiendo = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName ?? '')
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !escribiendo)) { e.preventDefault(); input.current?.focus() }
    }
    const fuera = (e: MouseEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierto(false) }
    window.addEventListener('keydown', atajo); document.addEventListener('mousedown', fuera)
    return () => { window.removeEventListener('keydown', atajo); document.removeEventListener('mousedown', fuera) }
  }, [])

  function ir(r: Resultado) {
    navigate(r.ruta)
    setQ(''); setRes([]); setAbierto(false); input.current?.blur()
    onDone?.()
  }

  function teclas(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(res.length - 1, s + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(0, s - 1)) }
    else if (e.key === 'Enter' && res[sel]) ir(res[sel])
    else if (e.key === 'Escape') { setAbierto(false); input.current?.blur(); onDone?.() }
  }

  const mostrar = abierto && q.trim().length >= 2
  return (
    <div ref={caja} className="search" style={{ position: 'relative' }}>
      <Search size={16} />
      <input ref={input} value={q} autoFocus={autoFocus} onChange={e => { setQ(e.target.value); setAbierto(true) }} onFocus={() => setAbierto(true)} onKeyDown={teclas}
        placeholder="Buscar placa, cliente o reserva…" aria-label="Buscar placa, cliente o reserva" role="combobox" aria-expanded={mostrar}
        style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'none', font: 'inherit', color: 'var(--ink)' }} />
      {q && <button onClick={() => { setQ(''); input.current?.focus() }} aria-label="Borrar búsqueda" style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink3)', display: 'flex' }}><X size={15} /></button>}
      {mostrar && (
        <div role="listbox" style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 60, background: 'var(--card)', border: '1px solid var(--card-line)',
          borderRadius: 12, boxShadow: 'var(--shadow-pop)', maxHeight: '65vh', overflowY: 'auto', padding: 6 }}>
          {buscando && res.length === 0 ? <div style={{ padding: 14, color: 'var(--ink3)', fontSize: 13 }}>Buscando…</div>
            : res.length === 0 ? <div style={{ padding: 14, color: 'var(--ink3)', fontSize: 13 }}>Sin resultados para “{q.trim()}”. Prueba con la placa, el teléfono o el número de contrato.</div>
            : res.map((r, i) => {
              const Icono = ICONO[r.tipo]
              return (
                <button key={r.tipo + r.id} role="option" aria-selected={i === sel} onMouseEnter={() => setSel(i)} onClick={() => ir(r)}
                  style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', textAlign: 'left', border: 0, borderRadius: 9, padding: '9px 10px', cursor: 'pointer',
                    background: i === sel ? 'var(--paper-alt)' : 'transparent', font: 'inherit', color: 'var(--ink)' }}>
                  <span className="tile-ic" style={{ width: 32, height: 32, borderRadius: 9 }}><Icono size={15} /></span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.titulo}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--ink3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.detalle}</span>
                  </span>
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}
