import { useEffect, useMemo, useState } from 'react'
import { Lock, Search, Bot } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { mensajeError } from '../../lib/operacion'
import { identificador } from '../../lib/usuarios'
import { cambiosLegibles, tituloCambio, esCambioVacio, esAutomatico, type Audit } from '../../lib/historial'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

type Log = { id: string; accion: string; descripcion: string | null; realizado_por: string | null; created_at: string }
const fechaHora = (s: string) => new Date(s).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function ActividadScreen() {
  const { esDueno } = useAuth()
  const [tab, setTab] = useState<'actividad' | 'detalle'>('actividad')
  const [logs, setLogs] = useState<Log[]>([])
  const [audit, setAudit] = useState<Audit[]>([])
  const [q, setQ] = useState('')
  const [verAuto, setVerAuto] = useState(false)
  const [nombres, setNombres] = useState<Record<string, string>>({})
  useEffect(() => {
    db.from('vehiculos').select('id, modelo, placa').then(({ data }: { data: { id: string; modelo: string; placa: string }[] | null }) =>
      setNombres(Object.fromEntries((data ?? []).map(v => [v.id, `${v.modelo} (${v.placa})`]))))
  }, [])
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
  const logsF = useMemo(() => logs.filter(l => !qn || `${l.descripcion} ${identificador(l.realizado_por)} ${l.accion}`.toLowerCase().includes(qn)), [logs, qn])
  const auditVisibles = useMemo(() => audit.filter(a => !esCambioVacio(a) && (verAuto || !esAutomatico(a))), [audit, verAuto])
  const auditF = useMemo(() => auditVisibles.filter(a => !qn || `${tituloCambio(a, nombres)} ${cambiosLegibles(a, nombres).join(' ')}`.toLowerCase().includes(qn)), [auditVisibles, qn, nombres])
  const nAuto = useMemo(() => audit.filter(a => !esCambioVacio(a) && esAutomatico(a)).length, [audit])

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

      {tab === 'detalle' && nAuto > 0 && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink2)', marginBottom: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={verAuto} onChange={e => setVerAuto(e.target.checked)} />
          Mostrar cambios automáticos de disponibilidad ({nAuto}): los hace la app según las reservas, no una persona.
        </label>
      )}
      {error && <div style={{ padding: '12px 16px', background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 'var(--radius-sm)', marginBottom: 12 }}>{error}</div>}

      <div className="card tilelist">
        {loading ? <div style={{ padding: 28, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
          : tab === 'actividad' ? (logsF.length === 0 ? <div style={{ padding: 24, color: 'var(--ink3)' }}>Sin actividad.</div> : logsF.map(l => (
            <div key={l.id} className="tilerow">
              <div className="tile-main">
                <div className="tile-l" style={{ fontWeight: 500 }}>{l.descripcion ?? l.accion}</div>
                <div className="tile-s">{l.realizado_por ? identificador(l.realizado_por) : '—'} · {fechaHora(l.created_at)}</div>
              </div>
            </div>
          ))) : (auditF.length === 0 ? <div style={{ padding: 24, color: 'var(--ink3)' }}>Sin cambios registrados.</div> : auditF.map(a => {
            const cs = cambiosLegibles(a, nombres)
            const auto = esAutomatico(a)
            return (
              <div key={a.id} className="tilerow" style={{ alignItems: 'flex-start', ...(auto ? { opacity: 0.75 } : {}) }}>
                <div className="tile-main">
                  <div className="tile-l" style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>{auto && <Bot size={14} />}{tituloCambio(a, nombres)}</div>
                  <div className="tile-s">{fechaHora(a.fecha)}{auto ? ' · según las reservas, nadie lo editó' : ''}</div>
                  {cs.length > 0 && (
                    <ul style={{ fontSize: 12.5, color: 'var(--ink2)', margin: '4px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {cs.slice(0, 10).map(c => <li key={c}>{c[0].toUpperCase() + c.slice(1)}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            )
          }))}
      </div>
    </div>
  )
}
