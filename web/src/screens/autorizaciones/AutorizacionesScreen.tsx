import { useState, useEffect, useCallback } from 'react'
import { Check, X, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import type { Solicitud } from '../../lib/database.types'

const db = supabase as any

type FilterTab = 'pendiente' | 'aprobada' | 'rechazada' | 'todas'

const TAB_LABELS: Record<FilterTab, string> = {
  pendiente: 'Pendientes',
  aprobada: 'Aprobadas',
  rechazada: 'Rechazadas',
  todas: 'Todas',
}

const TABLE_LABELS: Record<string, string> = {
  reservas: 'Reserva',
  vehiculos: 'Vehículo',
  clientes: 'Cliente',
  cotizaciones: 'Cotización',
}

const TIPO_LABELS: Record<string, string> = {
  update: 'Edición',
  create: 'Creación',
  delete: 'Eliminación',
}

function formatValue(key: string, val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'Sí' : 'No'
  if (key.includes('fecha') && typeof val === 'string') {
    return new Date(val + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  if (key === 'total' || key === 'tarifa_diaria') {
    const n = Number(val)
    return isNaN(n) ? String(val) : `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return String(val)
}

const FIELD_LABELS: Record<string, string> = {
  cliente_id: 'Cliente',
  vehiculo_id: 'Vehículo',
  fecha_entrega: 'Fecha entrega',
  fecha_devolucion: 'Fecha devolución',
  status: 'Estado',
  total: 'Total',
  tarifa_diaria: 'Tarifa diaria',
  modelo: 'Modelo',
  placa: 'Placa',
  km: 'Kilometraje',
  combustible: 'Combustible',
  nombre: 'Nombre',
  apellido: 'Apellido',
  email: 'Correo',
  telefono: 'Teléfono',
}

function DiffRow({ field, oldVal, newVal }: { field: string; oldVal: unknown; newVal: unknown }) {
  const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal)
  const label = FIELD_LABELS[field] ?? field
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '6px 0',
      borderBottom: '1px solid var(--line)',
      background: changed ? 'oklch(97% 0.01 155)' : 'transparent',
      borderRadius: 4, paddingLeft: changed ? 6 : 0,
    }}>
      <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: changed ? 600 : 400 }}>{label}</span>
      <span style={{ fontSize: 13, color: changed ? '#c0392b' : 'var(--ink-2)', textDecoration: changed ? 'line-through' : 'none' }}>
        {formatValue(field, oldVal)}
      </span>
      <span style={{ fontSize: 13, color: changed ? 'var(--primary)' : 'var(--ink-2)', fontWeight: changed ? 600 : 400 }}>
        {formatValue(field, newVal)}
      </span>
    </div>
  )
}

interface SolicitudCardProps {
  sol: Solicitud
  onApprove: (sol: Solicitud) => Promise<void>
  onReject: (sol: Solicitud, nota: string) => Promise<void>
  loading: boolean
}

function SolicitudCard({ sol, onApprove, onReject, loading }: SolicitudCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [nota, setNota] = useState('')
  const [busy, setBusy] = useState(false)

  const actuales = (sol.datos_actuales ?? {}) as Record<string, unknown>
  const nuevos   = (sol.datos_nuevos   ?? {}) as Record<string, unknown>
  const allKeys  = Array.from(new Set([...Object.keys(actuales), ...Object.keys(nuevos)]))
  const changedKeys = allKeys.filter(k => JSON.stringify(actuales[k]) !== JSON.stringify(nuevos[k]))

  async function handleApprove() {
    setBusy(true)
    await onApprove(sol)
    setBusy(false)
  }

  async function handleReject() {
    setBusy(true)
    await onReject(sol, nota)
    setBusy(false)
    setRejecting(false)
    setNota('')
  }

  const isPending = sol.estado === 'pendiente'
  const createdAt = new Date(sol.created_at).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12,
      marginBottom: 12, overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: sol.estado === 'aprobada' ? 'oklch(92% 0.08 155)' : sol.estado === 'rechazada' ? 'oklch(92% 0.08 20)' : 'oklch(92% 0.06 80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {sol.estado === 'aprobada' ? <Check size={18} color="var(--primary)" /> :
           sol.estado === 'rechazada' ? <X size={18} color="#c0392b" /> :
           <Clock size={18} color="#d68910" />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {TIPO_LABELS[sol.tipo] ?? sol.tipo} — {TABLE_LABELS[sol.tabla] ?? sol.tabla}
            </span>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
              background: sol.estado === 'aprobada' ? 'oklch(88% 0.12 155)' : sol.estado === 'rechazada' ? 'oklch(88% 0.1 20)' : 'oklch(88% 0.08 80)',
              color: sol.estado === 'aprobada' ? 'var(--primary)' : sol.estado === 'rechazada' ? '#c0392b' : '#d68910',
            }}>
              {sol.estado.charAt(0).toUpperCase() + sol.estado.slice(1)}
            </span>
            {isPending && (
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                background: 'oklch(94% 0.06 260)', color: 'oklch(40% 0.18 260)',
              }}>
                {changedKeys.length} campo{changedKeys.length !== 1 ? 's' : ''} modificado{changedKeys.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
            Solicitado por <strong>{sol.solicitado_por ?? 'Empleado'}</strong> · {createdAt}
          </div>
          {sol.estado === 'rechazada' && sol.nota_rechazo && (
            <div style={{ fontSize: 12, color: '#c0392b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={12} />
              {sol.nota_rechazo}
            </div>
          )}
        </div>

        <div style={{ color: 'var(--ink-2)', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Expanded diff */}
      {expanded && (
        <div style={{ padding: '0 16px 14px' }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Campo</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Antes</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Después</span>
          </div>
          {allKeys.map(k => (
            <DiffRow key={k} field={k} oldVal={actuales[k]} newVal={nuevos[k]} />
          ))}

          {/* Actions for pending */}
          {isPending && !loading && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rejecting ? (
                <>
                  <textarea
                    value={nota}
                    onChange={e => setNota(e.target.value)}
                    placeholder="Motivo del rechazo (opcional)"
                    rows={2}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--line)',
                      background: 'var(--paper)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleReject}
                      disabled={busy}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: '#c0392b', color: '#fff', fontWeight: 600, fontSize: 13,
                        opacity: busy ? 0.6 : 1,
                      }}
                    >
                      {busy ? 'Rechazando…' : 'Confirmar rechazo'}
                    </button>
                    <button
                      onClick={() => { setRejecting(false); setNota('') }}
                      style={{
                        padding: '9px 16px', borderRadius: 8, border: '1.5px solid var(--line)',
                        background: 'transparent', cursor: 'pointer', fontSize: 13,
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleApprove}
                    disabled={busy}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'var(--primary)', color: '#fff', fontWeight: 600, fontSize: 13,
                      opacity: busy ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    {busy ? 'Aprobando…' : <><Check size={15} /> Aprobar cambios</>}
                  </button>
                  <button
                    onClick={() => setRejecting(true)}
                    disabled={busy}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 8, fontWeight: 600, fontSize: 13,
                      border: '1.5px solid #c0392b', background: 'transparent', color: '#c0392b',
                      cursor: 'pointer', opacity: busy ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <X size={15} /> Rechazar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AutorizacionesScreen() {
  const { isAdmin, currentEmail } = useAuth()
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>('pendiente')
  const [actionBusy, setActionBusy] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3200)
  }

  const fetchSolicitudes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await db.from('solicitudes').select('*').order('created_at', { ascending: false })
    if (!error) setSolicitudes((data as Solicitud[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchSolicitudes() }, [fetchSolicitudes])

  const filtered = tab === 'todas' ? solicitudes : solicitudes.filter(s => s.estado === tab)
  const pendingCount = solicitudes.filter(s => s.estado === 'pendiente').length

  async function handleApprove(sol: Solicitud) {
    setActionBusy(true)
    try {
      // Apply the changes to the target table
      const { error: updateErr } = await db
        .from(sol.tabla)
        .update(sol.datos_nuevos)
        .eq('id', sol.registro_id)

      if (updateErr) throw updateErr

      // Mark solicitud as approved
      const { error: solErr } = await db
        .from('solicitudes')
        .update({ estado: 'aprobada', revisado_por: currentEmail, revisado_at: new Date().toISOString() })
        .eq('id', sol.id)

      if (solErr) throw solErr

      showToast('Cambios aplicados correctamente')
      await fetchSolicitudes()
    } catch (e: any) {
      showToast(e?.message ?? 'Error al aprobar', false)
    }
    setActionBusy(false)
  }

  async function handleReject(sol: Solicitud, nota: string) {
    setActionBusy(true)
    try {
      const { error } = await db
        .from('solicitudes')
        .update({
          estado: 'rechazada',
          revisado_por: currentEmail,
          revisado_at: new Date().toISOString(),
          nota_rechazo: nota || null,
        })
        .eq('id', sol.id)

      if (error) throw error

      showToast('Solicitud rechazada')
      await fetchSolicitudes()
    } catch (e: any) {
      showToast(e?.message ?? 'Error al rechazar', false)
    }
    setActionBusy(false)
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-2)' }}>
        <AlertCircle size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
        <div style={{ fontWeight: 600, fontSize: 16 }}>Acceso restringido</div>
        <div style={{ fontSize: 14, marginTop: 4 }}>Solo los administradores pueden ver este panel.</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 20px 100px', maxWidth: 720, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: toast.ok ? 'var(--primary)' : '#c0392b', color: '#fff',
          padding: '10px 20px', borderRadius: 24, fontSize: 14, fontWeight: 600,
          zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.18)', whiteSpace: 'nowrap',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Autorizaciones</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '4px 0 0' }}>
          Solicitudes de cambio del equipo
          {pendingCount > 0 && (
            <span style={{
              marginLeft: 8, background: '#d68910', color: '#fff',
              borderRadius: 20, padding: '1px 8px', fontSize: 12, fontWeight: 700,
            }}>
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {(Object.keys(TAB_LABELS) as FilterTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
              borderColor: tab === t ? 'var(--primary)' : 'var(--line)',
              background: tab === t ? 'var(--primary)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--ink-2)',
              fontWeight: tab === t ? 600 : 400, fontSize: 13, cursor: 'pointer',
            }}
          >
            {TAB_LABELS[t]}
            {t === 'pendiente' && pendingCount > 0 && (
              <span style={{
                marginLeft: 6, background: tab === t ? 'rgba(255,255,255,0.3)' : '#d68910',
                color: '#fff', borderRadius: 20, padding: '0 6px', fontSize: 11, fontWeight: 700,
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-2)' }}>
          <Clock size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <div style={{ fontWeight: 600 }}>Sin solicitudes {tab !== 'todas' ? TAB_LABELS[tab].toLowerCase() : ''}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Aquí aparecerán las solicitudes de cambio del equipo.</div>
        </div>
      ) : (
        filtered.map(sol => (
          <SolicitudCard
            key={sol.id}
            sol={sol}
            onApprove={handleApprove}
            onReject={handleReject}
            loading={actionBusy}
          />
        ))
      )}
    </div>
  )
}
