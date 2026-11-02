import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Banknote, CreditCard, Landmark, ArrowDownLeft, ArrowUpRight, Plus, Lock, Wallet, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { hoyISO, addDias, parseISO } from '../../lib/fechas'
import { CONCEPTO_LABEL, metodoLabel, mensajeError, faltaMigracion, metodosActivos, type ConceptoPago } from '../../lib/operacion'
import { useAuth } from '../../state/auth'
import { identificador } from '../../lib/usuarios'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any
const fmt = (n: number) => new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(n)
// Business days run on Sonora time (UTC−7, no daylight saving)
const inicioDia = (iso: string) => `${iso}T00:00:00-07:00`

type Mov = { id: string; monto: number; metodo: string | null; concepto: ConceptoPago; fecha: string; notas: string | null; registrado_por: string | null
  reservas: { id: string; folio: number | null; clientes: { nombre: string } | null } | null }

type Caja = { id: string; tipo: 'apertura' | 'ingreso' | 'retiro' | 'gasto'; monto: number; metodo: string; concepto: string | null; fecha: string; registrado_por: string | null }
const TIPO_LABEL: Record<Caja['tipo'], string> = { apertura: 'Fondo de caja (conteo)', ingreso: 'Entrada', retiro: 'Retiro', gasto: 'Gasto' }
// Sign of each cash movement in the totals; the opening count replaces the balance instead
const signo = (t: Caja['tipo']) => (t === 'ingreso' ? 1 : t === 'apertura' ? 0 : -1)

/** Cash on hand now: last opening count + cash payments and movements since then. */
function useEfectivoAhora(revision: number) {
  const [r, setR] = useState<{ estado: 'cargando' | 'ok' | 'sin_apertura' | 'sin_tabla'; apertura?: Caja; total: number; pagos: number; movs: number; garantias: number }>({ estado: 'cargando', total: 0, pagos: 0, movs: 0, garantias: 0 })
  useEffect(() => {
    (async () => {
      // Deposits held for rentals not yet closed: part of the cash belongs to clients
      const { data: g } = await db.from('pagos').select('monto, concepto, reservas!inner(status)')
        .in('concepto', ['fianza', 'devolucion_fianza']).in('reservas.status', ['pendiente', 'confirmada', 'entregada'])
      const garantias = Math.max(0, (g ?? []).reduce((s: number, x: { monto: number; concepto: string }) => s + (x.concepto === 'fianza' ? x.monto : -x.monto), 0))
      const { data: ap, error: e } = await db.from('caja_movimientos').select('*').eq('tipo', 'apertura').order('fecha', { ascending: false }).limit(1)
      if (e) { setR({ estado: faltaMigracion(e) ? 'sin_tabla' : 'sin_apertura', total: 0, pagos: 0, movs: 0, garantias }); return }
      const apertura = ap?.[0] as Caja | undefined
      if (!apertura) { setR({ estado: 'sin_apertura', total: 0, pagos: 0, movs: 0, garantias }); return }
      const [{ data: p }, { data: m }] = await Promise.all([
        db.from('pagos').select('monto, concepto').eq('metodo', 'efectivo').gt('fecha', apertura.fecha),
        db.from('caja_movimientos').select('tipo, monto').eq('metodo', 'efectivo').neq('tipo', 'apertura').gt('fecha', apertura.fecha),
      ])
      const pagos = (p ?? []).reduce((s: number, x: { monto: number; concepto: string }) => s + (x.concepto === 'devolucion_fianza' ? -x.monto : x.monto), 0)
      const movs = (m ?? []).reduce((s: number, x: Caja) => s + signo(x.tipo) * x.monto, 0)
      setR({ estado: 'ok', apertura, pagos, movs, total: apertura.monto + pagos + movs, garantias })
    })()
  }, [revision])
  return r
}

function NuevoMovimiento({ tipoInicial, esDueno, sugerido, onClose, onGuardado }: {
  tipoInicial: Caja['tipo']; esDueno: boolean; sugerido?: number; onClose: () => void; onGuardado: () => void
}) {
  const [tipo, setTipo] = useState<Caja['tipo']>(tipoInicial)
  const [monto, setMonto] = useState(sugerido != null ? String(sugerido) : '')
  const [metodo, setMetodo] = useState('efectivo')
  const [concepto, setConcepto] = useState(tipoInicial === 'apertura' ? 'Conteo de efectivo' : '')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const tipos = (['ingreso', 'retiro', 'gasto', 'apertura'] as const).filter(t => t !== 'apertura' || esDueno)

  async function guardar() {
    const n = Number(monto)
    const faltan = [!(n > 0 || (tipo === 'apertura' && monto !== '' && n === 0)) && 'el monto', !concepto.trim() && 'el concepto (para qué fue)'].filter(Boolean)
    if (faltan.length) { setError(`Falta ${faltan.join(' y ')}.`); return }
    setGuardando(true)
    const { error: e } = await db.from('caja_movimientos').insert({ tipo, monto: n, metodo: tipo === 'apertura' ? 'efectivo' : metodo, concepto: concepto.trim() })
    setGuardando(false)
    if (e) { setError(mensajeError(e)); return }
    onGuardado(); onClose()
  }

  return (
    <>
      <div className="qpanel-overlay" onClick={onClose} />
      <div className="qpanel open" role="dialog" aria-label="Movimiento de caja">
        <div className="qpanel-head">
          <div><div className="eyebrow">Caja</div><h2 className="h-display" style={{ fontSize: 24, marginTop: 4 }}>{tipo === 'apertura' ? 'Fondo de caja' : 'Registrar movimiento'}</h2></div>
          <button className="iconbtn" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="qpanel-body">
          <div className="filterbar" style={{ margin: 0 }}>
            {tipos.map(t => <button key={t} className={`fbtn${tipo === t ? ' on' : ''}`} onClick={() => { setTipo(t); setError('') }}>{t === 'apertura' ? 'Fondo (conteo)' : TIPO_LABEL[t]}</button>)}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink3)', lineHeight: 1.5 }}>
            {tipo === 'apertura' ? 'Cuenta el efectivo que hay físicamente en la caja y escríbelo. Desde este momento la app calcula el efectivo a partir de esta cantidad (sirve para el arranque y para ajustar después de un corte).'
              : tipo === 'ingreso' ? 'Dinero que entra y no es de una reserva (ej. cambio que se trae del banco).'
              : tipo === 'retiro' ? 'Dinero que sale de la caja sin ser gasto (ej. depósito al banco, retiro del dueño).'
              : 'Pagos del negocio: gasolina, lavado, refacciones, papelería…'}
          </div>
          <div className="field"><label className="field-l">{tipo === 'apertura' ? 'Efectivo contado *' : 'Monto *'}</label>
            <div className="field-money"><span>$</span><input className="field-i" inputMode="decimal" value={monto} autoFocus
              onChange={e => { setMonto(e.target.value.replace(/[^0-9.]/g, '')); setError('') }} /></div></div>
          {tipo !== 'apertura' && (
            <div className="field"><label className="field-l">Método</label>
              <div className="filterbar" style={{ margin: 0 }}>
                {metodosActivos().map(m => <button key={m} className={`fbtn${metodo === m ? ' on' : ''}`} onClick={() => setMetodo(m)}>{metodoLabel(m)}</button>)}
              </div></div>
          )}
          <div className="field"><label className="field-l">Concepto *</label>
            <input className="field-i" value={concepto} onChange={e => { setConcepto(e.target.value); setError('') }}
              placeholder={tipo === 'gasto' ? 'Ej. Gasolina Versa ABC-123' : tipo === 'retiro' ? 'Ej. Depósito a BBVA' : ''} /></div>
          <div style={{ fontSize: 12, color: 'var(--ink3)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <Lock size={13} style={{ flexShrink: 0, marginTop: 1 }} />Los movimientos de caja no se pueden editar ni borrar. Si te equivocas, registra uno contrario (por ejemplo, una entrada por el mismo monto) explicando el motivo.
          </div>
          {error && <div style={{ padding: '10px 13px', background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>{error}</div>}
        </div>
        <div className="qpanel-foot">
          <button className="btn primary" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>
    </>
  )
}

const RANGOS = [{ k: 'dia', l: 'Día', d: 1 }, { k: 'semana', l: '7 días', d: 7 }, { k: 'mes', l: '30 días', d: 30 }] as const

export default function CajaScreen() {
  const navigate = useNavigate()
  const { esDueno } = useAuth()
  const [revision, setRevision] = useState(0)
  const ahora = useEfectivoAhora(revision)
  const [form, setForm] = useState<{ tipo: Caja['tipo']; sugerido?: number } | null>(null)
  const [cajaMovs, setCajaMovs] = useState<Caja[]>([])
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
    db.from('caja_movimientos').select('*').gte('fecha', inicioDia(desde)).lt('fecha', inicioDia(addDias(hasta, 1))).order('fecha', { ascending: false })
      .then(({ data }: { data: Caja[] | null }) => setCajaMovs(data ?? []))
  }, [desde, hasta, revision])

  const t = useMemo(() => {
    const porMetodo: Record<string, { entra: number; sale: number }> = {}
    for (const m of movs) {
      const k = m.metodo ?? 'efectivo'
      porMetodo[k] ??= { entra: 0, sale: 0 }
      if (m.concepto === 'devolucion_fianza') porMetodo[k].sale += m.monto; else porMetodo[k].entra += m.monto
    }
    for (const c of cajaMovs) {
      if (c.tipo === 'apertura') continue
      porMetodo[c.metodo] ??= { entra: 0, sale: 0 }
      if (c.tipo === 'ingreso') porMetodo[c.metodo].entra += c.monto; else porMetodo[c.metodo].sale += c.monto
    }
    const gastos = cajaMovs.filter(c => c.tipo === 'gasto').reduce((s, c) => s + c.monto, 0)
    const neto = (k: string) => (porMetodo[k]?.entra ?? 0) - (porMetodo[k]?.sale ?? 0)
    const renta = movs.filter(m => m.concepto === 'renta' || m.concepto === 'cargo_extra').reduce((s, m) => s + m.monto, 0)
    const garantiasEntran = movs.filter(m => m.concepto === 'fianza').reduce((s, m) => s + m.monto, 0)
    const garantiasSalen = movs.filter(m => m.concepto === 'devolucion_fianza').reduce((s, m) => s + m.monto, 0)
    return { porMetodo, neto, renta, garantiasEntran, garantiasSalen, gastos }
  }, [movs, cajaMovs])

  const efectivoEsperado = ahora.estado === 'ok' ? ahora.total : t.neto('efectivo')
  const diferencia = contado === '' ? null : Number(contado) - efectivoEsperado
  const etiquetaFecha = (iso: string) => parseISO(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="screen">
      <div className="pagehead">
        <div>
          <div className="eyebrow">Gestión</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>Caja</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4 }}>
            Corte {dias === 1 ? `del ${etiquetaFecha(hasta)}` : `del ${etiquetaFecha(desde)} al ${etiquetaFecha(hasta)}`} · {movs.length + cajaMovs.length} movimientos
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

      <div className="card" style={{ padding: 'var(--pad)', marginBottom: 'var(--gap)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="tile-ic" style={{ width: 46, height: 46 }}><Wallet size={22} /></div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="eyebrow">Efectivo en caja ahora</div>
          {ahora.estado === 'cargando' ? <div className="spinner" style={{ margin: '8px 0' }} />
            : ahora.estado === 'ok' ? (
              <>
                <div className="statval mono" style={{ color: ahora.total < 0 ? 'var(--danger-ink)' : undefined }}>${fmt(ahora.total)}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>
                  Fondo ${fmt(ahora.apertura!.monto)} del {new Date(ahora.apertura!.fecha).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {' '}{ahora.pagos >= 0 ? '+' : '−'} cobros ${fmt(Math.abs(ahora.pagos))} {ahora.movs >= 0 ? '+' : '−'} movimientos ${fmt(Math.abs(ahora.movs))}
                  {ahora.garantias > 0 && <> · de esto, hasta <b>${fmt(ahora.garantias)}</b> son garantías por devolver</>}
                </div>
              </>
            ) : ahora.estado === 'sin_tabla' ? <div style={{ fontSize: 13, color: 'var(--ink2)', marginTop: 4 }}>{mensajeError({ code: '42P01' })}</div>
            : (
              <div style={{ fontSize: 13, color: 'var(--ink2)', marginTop: 4, lineHeight: 1.5 }}>
                Falta registrar el <b>fondo de caja</b>: {esDueno ? 'cuenta el efectivo que hay hoy y regístralo.' : 'pídele al dueño que cuente el efectivo y lo registre.'} A partir de ese conteo la app calcula el efectivo, sin arrastrar números del sistema anterior.
                {ahora.garantias > 0 && <> Hay <b>${fmt(ahora.garantias)}</b> en garantías de rentas abiertas por devolver.</>}
              </div>
            )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {esDueno && ahora.estado !== 'sin_tabla' && <button className="btn sm" onClick={() => setForm({ tipo: 'apertura' })}><Wallet size={14} />{ahora.estado === 'ok' ? 'Nuevo conteo' : 'Registrar fondo'}</button>}
          {ahora.estado !== 'sin_tabla' && <button className="btn sm primary" onClick={() => setForm({ tipo: 'gasto' })}><Plus size={14} />Movimiento</button>}
        </div>
      </div>

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
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>garantías: +${fmt(t.garantiasEntran)} / −${fmt(t.garantiasSalen)}{t.gastos > 0 ? ` · gastos −$${fmt(t.gastos)}` : ''}</div>
        </div>
      </div>

      <div className="dash-grid">
        <div>
          <div className="sect-head"><h2 className="sect-title">Movimientos</h2></div>
          <div className="card tilelist">
            {cajaMovs.map(c => {
              const sale = signo(c.tipo) < 0
              return (
                <div key={c.id} className="agenda-row" style={{ cursor: 'default' }}>
                  <div className={`tile-ic${sale ? ' danger' : c.tipo === 'apertura' ? ' warn' : ''}`}>{c.tipo === 'apertura' ? <Wallet size={17} /> : sale ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}</div>
                  <div className="agenda-main">
                    <div className="agenda-who">{TIPO_LABEL[c.tipo]} · {metodoLabel(c.metodo)}</div>
                    <div className="agenda-car">
                      {c.concepto ?? ''}{' · '}{new Date(c.fecha).toLocaleString('es-MX', { day: dias > 1 ? '2-digit' : undefined, month: dias > 1 ? 'short' : undefined, hour: '2-digit', minute: '2-digit' })}
                      {c.registrado_por ? ` · ${identificador(c.registrado_por).split('@')[0]}` : ''}
                    </div>
                  </div>
                  <strong style={{ color: sale ? 'var(--danger-ink)' : 'var(--ink)', whiteSpace: 'nowrap' }}>{c.tipo === 'apertura' ? '= ' : sale ? '−' : ''}${fmt(c.monto)}</strong>
                </div>
              )
            })}
            {loading ? <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              : movs.length === 0 && cajaMovs.length === 0 ? <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--ink3)', fontSize: 13.5 }}>Sin movimientos en este periodo.</div>
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
                        {m.registrado_por ? ` · ${identificador(m.registrado_por).split('@')[0]}` : ''}
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
            <div className="qpanel-row"><span className="lbl">Efectivo que debe haber{ahora.estado === 'ok' ? ' (ahora)' : ' (periodo)'}</span><span className="val mono" style={{ fontSize: 18 }}>${fmt(efectivoEsperado)}</span></div>
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
            {diferencia != null && Math.abs(diferencia) >= 1 && esDueno && (
              <button className="btn sm" onClick={() => setForm({ tipo: 'apertura', sugerido: Number(contado) })}>Ajustar el fondo a lo contado</button>
            )}
            <p style={{ fontSize: 12, color: 'var(--ink3)', margin: 0 }}>
              {ahora.estado === 'ok'
                ? 'Fondo de caja más cobros en efectivo, garantías recibidas y entradas, menos garantías devueltas, retiros y gastos en efectivo desde el último conteo.'
                : 'Sin fondo registrado: solo suma lo cobrado en efectivo en el periodo, menos garantías devueltas, retiros y gastos.'}
            </p>
          </div>
        </div>
      </div>
      {form && <NuevoMovimiento tipoInicial={form.tipo} sugerido={form.sugerido} esDueno={esDueno} onClose={() => setForm(null)} onGuardado={() => setRevision(r => r + 1)} />}
    </div>
  )
}
