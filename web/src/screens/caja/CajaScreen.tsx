import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Banknote, CreditCard, Landmark, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { hoyISO, addDias, parseISO } from '../../lib/fechas'
import { CONCEPTO_LABEL, metodoLabel, mensajeError, type ConceptoPago } from '../../lib/operacion'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any
const fmt = (n: number) => new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(n)
// Business days run on Sonora time (UTC−7, no daylight saving)
const inicioDia = (iso: string) => `${iso}T00:00:00-07:00`

type Mov = { id: string; monto: number; metodo: string | null; concepto: ConceptoPago; fecha: string; notas: string | null; registrado_por: string | null
  reservas: { id: string; folio: number | null; clientes: { nombre: string } | null } | null }

const RANGOS = [{ k: 'dia', l: 'Día', d: 1 }, { k: 'semana', l: '7 días', d: 7 }, { k: 'mes', l: '30 días', d: 30 }] as const

export default function CajaScreen() {
  const navigate = useNavigate()
  const [hasta, setHasta] = useState(hoyISO())
  const [rango, setRango] = useState<typeof RANGOS[number]['k']>('dia')
  const dias = RANGOS.find(r => r.k === rango)!.d
  const desde = addDias(hasta, -(dias - 1))
  const [movs, setMovs] = useState<Mov[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contado, setContado] = useState('')

  useEffect(() => {
    setLoading(true); setError('')
    db.from('pagos').select('*, reservas(id, folio, clientes(nombre))')
      .gte('fecha', inicioDia(desde)).lt('fecha', inicioDia(addDias(hasta, 1))).order('fecha', { ascending: false })
      .then(({ data, error: e }: { data: Mov[] | null; error: { message: string } | null }) => {
        if (e) setError(mensajeError(e))
        setMovs(data ?? []); setLoading(false)
      })
  }, [desde, hasta])

  const t = useMemo(() => {
    const porMetodo: Record<string, { entra: number; sale: number }> = {}
    for (const m of movs) {
      const k = m.metodo ?? 'efectivo'
      porMetodo[k] ??= { entra: 0, sale: 0 }
      if (m.concepto === 'devolucion_fianza') porMetodo[k].sale += m.monto; else porMetodo[k].entra += m.monto
    }
    const neto = (k: string) => (porMetodo[k]?.entra ?? 0) - (porMetodo[k]?.sale ?? 0)
    const renta = movs.filter(m => m.concepto === 'renta' || m.concepto === 'cargo_extra').reduce((s, m) => s + m.monto, 0)
    const garantiasEntran = movs.filter(m => m.concepto === 'fianza').reduce((s, m) => s + m.monto, 0)
    const garantiasSalen = movs.filter(m => m.concepto === 'devolucion_fianza').reduce((s, m) => s + m.monto, 0)
    return { porMetodo, neto, renta, garantiasEntran, garantiasSalen }
  }, [movs])

  const efectivoEsperado = t.neto('efectivo')
  const diferencia = contado === '' ? null : Number(contado) - efectivoEsperado
  const etiquetaFecha = (iso: string) => parseISO(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="screen">
      <div className="pagehead">
        <div>
          <div className="eyebrow">Gestión</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>Caja</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4 }}>
            Corte {dias === 1 ? `del ${etiquetaFecha(hasta)}` : `del ${etiquetaFecha(desde)} al ${etiquetaFecha(hasta)}`} · {movs.length} movimientos
          </p>
        </div>
        <div className="pagehead-actions" style={{ flexWrap: 'wrap' }}>
          <div className="filterbar" style={{ margin: 0 }}>
            {RANGOS.map(r => <button key={r.k} className={`fbtn${rango === r.k ? ' on' : ''}`} onClick={() => setRango(r.k)}>{r.l}</button>)}
          </div>
          <button className="iconbtn" onClick={() => setHasta(addDias(hasta, -dias))} aria-label="Anterior"><ChevronLeft size={17} /></button>
          <input type="date" className="field-i" style={{ width: 150, padding: '8px 10px' }} value={hasta} max={hoyISO()} onChange={e => e.target.value && setHasta(e.target.value)} />
          <button className="iconbtn" onClick={() => setHasta(addDias(hasta, dias) > hoyISO() ? hoyISO() : addDias(hasta, dias))} aria-label="Siguiente" disabled={hasta >= hoyISO()}><ChevronRight size={17} /></button>
        </div>
      </div>

      {error && <div style={{ padding: '12px 16px', background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--gap)' }}>{error}</div>}

      <div className="statgrid">
        {([['efectivo', 'Efectivo', Banknote], ['tarjeta', 'Tarjeta', CreditCard], ['transferencia', 'Transferencia', Landmark]] as const).map(([k, l, Icon]) => (
          <div key={k} className="card statcard">
            <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon size={13} />{l}</div>
            <div className="statval mono">${fmt(t.neto(k))}</div>
            <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
              entró ${fmt(t.porMetodo[k]?.entra ?? 0)}{(t.porMetodo[k]?.sale ?? 0) > 0 ? ` · salió $${fmt(t.porMetodo[k]!.sale)}` : ''}
            </div>
          </div>
        ))}
        <div className="card statcard">
          <div className="eyebrow">Cobrado de rentas</div>
          <div className="statval mono" style={{ color: 'var(--primary)' }}>${fmt(t.renta)}</div>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>garantías: +${fmt(t.garantiasEntran)} / −${fmt(t.garantiasSalen)}</div>
        </div>
      </div>

      <div className="dash-grid">
        <div>
          <div className="sect-head"><h2 className="sect-title">Movimientos</h2></div>
          <div className="card tilelist">
            {loading ? <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              : movs.length === 0 ? <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--ink3)', fontSize: 13.5 }}>Sin movimientos en este periodo.</div>
              : movs.map(m => {
                const sale = m.concepto === 'devolucion_fianza'
                return (
                  <button key={m.id} className="agenda-row" onClick={() => m.reservas && navigate(`/app/reservations?res=${m.reservas.id}`)}>
                    <div className={`tile-ic${sale ? ' danger' : ''}`}>{sale ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}</div>
                    <div className="agenda-main">
                      <div className="agenda-who">{CONCEPTO_LABEL[m.concepto] ?? m.concepto} · {metodoLabel(m.metodo)}</div>
                      <div className="agenda-car">
                        {m.reservas?.folio != null ? `#${m.reservas.folio} · ` : ''}{m.reservas?.clientes?.nombre ?? ''}
                        {' · '}{new Date(m.fecha).toLocaleString('es-MX', { day: dias > 1 ? '2-digit' : undefined, month: dias > 1 ? 'short' : undefined, hour: '2-digit', minute: '2-digit' })}
                        {m.registrado_por ? ` · ${m.registrado_por.split('@')[0]}` : ''}
                      </div>
                    </div>
                    <strong style={{ color: sale ? 'var(--danger-ink)' : 'var(--ink)', whiteSpace: 'nowrap' }}>{sale ? '−' : ''}${fmt(m.monto)}</strong>
                  </button>
                )
              })}
          </div>
        </div>

        <div>
          <div className="sect-head"><h2 className="sect-title">Cuadre de efectivo</h2></div>
          <div className="card" style={{ padding: 'var(--pad)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="qpanel-row"><span className="lbl">Efectivo que debe haber</span><span className="val mono" style={{ fontSize: 18 }}>${fmt(efectivoEsperado)}</span></div>
            <div className="field">
              <label className="field-l">Efectivo contado</label>
              <div className="field-money"><span>$</span><input className="field-i" inputMode="decimal" value={contado} onChange={e => setContado(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Cuenta los billetes y escribe el total" /></div>
            </div>
            {diferencia != null && (
              <div style={{ padding: '12px 14px', borderRadius: 10, fontWeight: 700, display: 'flex', justifyContent: 'space-between',
                background: Math.abs(diferencia) < 1 ? 'var(--primary-soft)' : 'var(--danger-soft)', color: Math.abs(diferencia) < 1 ? 'var(--primary-dark)' : 'var(--danger-ink)' }}>
                <span>{Math.abs(diferencia) < 1 ? 'Cuadra' : diferencia > 0 ? 'Sobra' : 'Falta'}</span><span>${fmt(Math.abs(diferencia))}</span>
              </div>
            )}
            <p style={{ fontSize: 12, color: 'var(--ink3)', margin: 0 }}>
              Incluye cobros de renta, cargos y garantías recibidas en efectivo, menos las garantías devueltas en efectivo. No incluye el fondo inicial de la caja.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
