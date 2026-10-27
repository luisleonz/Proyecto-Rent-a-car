import { useEffect, useState } from 'react'
import { UserPlus, ShieldCheck, Shield, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { insertLog } from '../../lib/log'
import { mensajeError } from '../../lib/operacion'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

type Empleado = { id: string; email: string; nombre: string | null; rol: string; creado: string; ultimo_acceso: string | null; confirmado: boolean }
type Actividad = { reservas: number; entregas: number; devoluciones: number; cobros: number; total: number }

const proyecto = new URL(import.meta.env.VITE_SUPABASE_URL as string).hostname.split('.')[0]
const URL_USUARIOS = `https://supabase.com/dashboard/project/${proyecto}/auth/users`
const hace = (iso: string | null) => {
  if (!iso) return 'Nunca'
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 60) return `hace ${Math.max(1, min)} min`
  if (min < 1440) return `hace ${Math.round(min / 60)} h`
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function EmpleadosScreen() {
  const { user, currentEmail } = useAuth()
  const [lista, setLista] = useState<Empleado[]>([])
  const [act, setAct] = useState<Record<string, Actividad>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [cambiando, setCambiando] = useState<string | null>(null)

  async function cargar() {
    const { data, error: e } = await db.rpc('listar_empleados')
    if (e) { setError(mensajeError(e)); setLoading(false); return }
    setLista(data ?? [])
    const desde = new Date(Date.now() - 30 * 864e5).toISOString()
    const { data: logs } = await db.from('logs').select('accion, realizado_por').gte('created_at', desde).limit(5000)
    const a: Record<string, Actividad> = {}
    for (const l of logs ?? []) {
      if (!l.realizado_por) continue
      const x = (a[l.realizado_por] ??= { reservas: 0, entregas: 0, devoluciones: 0, cobros: 0, total: 0 })
      x.total++
      if (l.accion === 'crear_reserva' || l.accion === 'convertir_cotizacion') x.reservas++
      if (l.accion === 'entregar_vehiculo') x.entregas++
      if (l.accion === 'recibir_vehiculo') x.devoluciones++
      if (l.accion === 'registrar_pago') x.cobros++
    }
    setAct(a); setLoading(false)
  }
  useEffect(() => { cargar() }, [])

  async function cambiarRol(e: Empleado, nuevo: 'Administrador' | 'Empleado' | 'Sin acceso') {
    const quien = e.nombre ?? e.email
    if (!confirm(nuevo === 'Administrador' ? `¿Dar permisos de administrador a ${quien}? Podrá editar precios y vehículos, aprobar cambios y ver reportes.`
      : nuevo === 'Sin acceso' ? `¿Quitar el acceso a ${quien}? Ya no podrá ver ni modificar datos.`
      : e.rol === 'Administrador' ? `¿Quitar permisos de administrador a ${quien}?` : `¿Dar acceso a ${quien} como empleado?`)) return
    setCambiando(e.id)
    const { error: err } = await db.rpc('asignar_rol', { uid: e.id, rol: nuevo })
    setCambiando(null)
    if (err) { setError(mensajeError(err)); return }
    await insertLog({ accion: 'cambiar_rol', entidad: 'empleados', entidad_id: e.id, descripcion: `${e.email} ahora es ${nuevo}`, realizado_por: currentEmail })
    cargar()
  }

  return (
    <div className="screen">
      <div className="pagehead">
        <div>
          <div className="eyebrow">Gestión</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>Empleados</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4 }}>{loading ? 'Cargando…' : `${lista.length} usuarios · ${lista.filter(e => e.rol === 'Administrador').length} administradores`}</p>
        </div>
        <div className="pagehead-actions">
          <a className="btn sm primary" href={URL_USUARIOS} target="_blank" rel="noreferrer"><UserPlus size={14} />Invitar empleado<ExternalLink size={12} /></a>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 16px', marginBottom: 'var(--gap)', fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5 }}>
        Para dar de alta a alguien: <strong>Invitar empleado</strong> abre Supabase → <em>Invite user</em> → escribe su correo. Le llegará un enlace para crear su contraseña. Después aparecerá aquí <strong>Sin acceso</strong>: toca <strong>Dar acceso</strong> para que pueda trabajar. Los cambios de permisos se aplican la próxima vez que entre a la app.
      </div>

      {error && <div style={{ padding: '12px 16px', background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--gap)' }}>{error}</div>}

      <div className="card tilelist">
        {lista.map(e => {
          const a = act[e.email]
          const yo = e.id === user?.id
          return (
            <div key={e.id} className="tilerow" style={{ flexWrap: 'wrap' }}>
              <div className="avatar accent" style={{ width: 40, height: 40, fontSize: 14 }}>{(e.nombre ?? e.email).slice(0, 2).toUpperCase()}</div>
              <div className="tile-main" style={{ minWidth: 200 }}>
                <div className="tile-l" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {e.nombre ?? e.email.split('@')[0]}{yo && <span className="chip sm">tú</span>}
                  <span className={`chip sm ${e.rol === 'Administrador' ? 'primary' : e.rol === 'Sin acceso' ? 'danger' : ''}`}>{e.rol}</span>
                  {!e.confirmado && <span className="chip sm warn">Invitación pendiente</span>}
                </div>
                <div className="tile-s">{e.email} · último acceso {hace(e.ultimo_acceso)}</div>
                {a && <div className="tile-s">Últimos 30 días: {a.reservas} reservas · {a.entregas} entregas · {a.devoluciones} devoluciones · {a.cobros} cobros</div>}
              </div>
              {!yo && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {e.rol === 'Sin acceso' && <button className="btn sm primary" onClick={() => cambiarRol(e, 'Empleado')} disabled={cambiando === e.id}><ShieldCheck size={13} />Dar acceso</button>}
                  {e.rol === 'Empleado' && <button className="btn sm" onClick={() => cambiarRol(e, 'Administrador')} disabled={cambiando === e.id}><ShieldCheck size={13} />Hacer admin</button>}
                  {e.rol === 'Administrador' && <button className="btn sm" onClick={() => cambiarRol(e, 'Empleado')} disabled={cambiando === e.id}><Shield size={13} />Quitar admin</button>}
                  {e.rol !== 'Sin acceso' && <button className="btn sm" onClick={() => cambiarRol(e, 'Sin acceso')} disabled={cambiando === e.id}>Quitar acceso</button>}
                </div>
              )}
            </div>
          )
        })}
        {!loading && !error && lista.length === 0 && <div style={{ padding: 24, color: 'var(--ink3)' }}>Sin usuarios.</div>}
      </div>
    </div>
  )
}
