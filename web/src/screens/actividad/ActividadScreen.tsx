import { useEffect, useMemo, useState } from 'react'
import { Lock, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { mensajeError } from '../../lib/operacion'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

type Log = { id: string; accion: string; descripcion: string | null; realizado_por: string | null; created_at: string }
type Audit = { id: number; fecha: string; usuario: string | null; tabla: string; operacion: string; registro_id: string | null
  datos_anteriores: Record<string, unknown> | null; datos_nuevos: Record<string, unknown> | null }

const TABLA: Record<string, string> = { reservas: 'Reserva', pagos: 'Pago', vehiculos: 'Vehículo', clientes: 'Cliente', cotizaciones: 'Cotización',
  caja_movimientos: 'Caja', configuracion: 'Configuración' }
const OPER: Record<string, string> = { insert: 'creó', update: 'cambió', delete: 'borró' }
const IGNORAR = new Set(['updated_at', 'created_at'])

const fechaHora = (s: string) => new Date(s).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function cambios(a: Audit) {
  if (a.operacion !== 'update' || !a.datos_anteriores || !a.datos_nuevos) return []
  return Object.keys(a.datos_nuevos)
    .filter(k => !IGNORAR.has(k) && JSON.stringify(a.datos_anteriores![k]) !== JSON.stringify(a.datos_nuevos![k]))
    .map(k => ({ campo: k, antes: a.datos_anteriores![k], despues: a.datos_nuevos![k] }))
}
const corto = (v: unknown) => { const s = v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v); return s.length > 60 ? s.slice(0, 57) + '…' : s }

export default function ActividadScreen() {
  const { esDueno } = useAuth()
  const [tab, setTab] = useState<'actividad' | 'detalle'>('actividad')
  const [logs, setLogs] = useState<Log[]>([])
  const [audit, setAudit] = useState<Audit[]>([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true); setError('')
    const req = tab === 'actividad'
      ? db.from('logs').select('id, accion, descripcion, realizado_por, created_at').order('created_at', { ascending: false }).limit(500)
      : db.from('auditoria').select('*').order('fecha', { ascending: false }).limit(500)
    req.then(({ data, error: e }: { data: unknown[] | null; error: { message: string } | null }) => {
      if (e) setError(mensajeError(e))
      if (tab === 'actividad') setLogs((data as Log[]) ?? []); else setAudit((data as Audit[]) ?? [])
      setLoading(false)
    })
  }, [tab])

  const qn = q.trim().toLowerCase()
  const logsF = useMemo(() => logs.filter(l => !qn || `${l.descripcion} ${l.realizado_por} ${l.accion}`.toLowerCase().includes(qn)), [logs, qn])
  const auditF = useMemo(() => audit.filter(a => !qn || `${a.usuario} ${a.tabla} ${JSON.stringify(a.datos_nuevos ?? a.datos_anteriores)}`.toLowerCase().includes(qn)), [audit, qn])

  return (
    <div className="screen">
      <div className="pagehead">
        <div>
          <div className="eyebrow">Gestión</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>Actividad</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={13} />Registro permanente: nadie lo puede editar ni borrar, ni siquiera el dueño.
          </p>
        </div>
        {esDueno && (
          <div className="filterbar" style={{ margin: 0 }}>
            <button className={`fbtn${tab === 'actividad' ? ' on' : ''}`} onClick={() => setTab('actividad')}>Actividad</button>
            <button className={`fbtn${tab === 'detalle' ? ' on' : ''}`} onClick={() => setTab('detalle')}>Cambios detallados</button>
          </div>
        )}
      </div>

      <label className="rs-search" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--card-line)', borderRadius: 11, padding: '0 12px', marginBottom: 12, color: 'var(--ink3)' }}>
        <Search size={15} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por persona, contrato, cliente…"
          style={{ flex: 1, border: 0, outline: 'none', background: 'none', font: 'inherit', fontSize: 14, padding: '10px 0', color: 'var(--ink)' }} />
      </label>

      {error && <div style={{ padding: '12px 16px', background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 'var(--radius-sm)', marginBottom: 12 }}>{error}</div>}

      <div className="card tilelist">
        {loading ? <div style={{ padding: 28, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
          : tab === 'actividad' ? (logsF.length === 0 ? <div style={{ padding: 24, color: 'var(--ink3)' }}>Sin actividad.</div> : logsF.map(l => (
            <div key={l.id} className="tilerow">
              <div className="tile-main">
                <div className="tile-l" style={{ fontWeight: 500 }}>{l.descripcion ?? l.accion}</div>
                <div className="tile-s">{l.realizado_por ?? '—'} · {fechaHora(l.created_at)}</div>
              </div>
            </div>
          ))) : (auditF.length === 0 ? <div style={{ padding: 24, color: 'var(--ink3)' }}>Sin cambios registrados.</div> : auditF.map(a => {
            const cs = cambios(a)
            const datos = (a.datos_nuevos ?? a.datos_anteriores ?? {}) as Record<string, unknown>
            const etiqueta = datos.folio != null ? `#${datos.folio}` : (datos.nombre ?? datos.modelo ?? datos.placa ?? datos.concepto ?? '') as string
            return (
              <div key={a.id} className="tilerow" style={{ alignItems: 'flex-start' }}>
                <div className="tile-main">
                  <div className="tile-l" style={{ fontWeight: 500 }}>{a.usuario ?? 'sistema'} {OPER[a.operacion] ?? a.operacion} {TABLA[a.tabla] ?? a.tabla} {etiqueta}</div>
                  <div className="tile-s">{fechaHora(a.fecha)}</div>
                  {cs.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {cs.slice(0, 8).map(c => <span key={c.campo}><b>{c.campo}</b>: {corto(c.antes)} → {corto(c.despues)}</span>)}
                    </div>
                  )}
                </div>
              </div>
            )
          }))}
      </div>
    </div>
  )
}
