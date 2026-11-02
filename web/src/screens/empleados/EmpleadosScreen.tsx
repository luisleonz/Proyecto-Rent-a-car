import { useEffect, useState } from 'react'
import { UserPlus, X, Copy, MessageCircle, Link2, ShieldCheck, Check, RefreshCw, KeyRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { mensajeError, whatsappUrl } from '../../lib/operacion'
import { EMPRESA } from '../../lib/empresa'
import { usuarioValido, normalizarUsuario, mensajeContrasena, faltasContrasena, generarContrasena, identificador, usuarioDeCorreo, USUARIO_REGLA } from '../../lib/usuarios'
import ReglasContrasena from '../../components/ReglasContrasena'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

type Usuario = { id: string; email: string; nombre: string | null; rol: string; creado: string; ultimo_acceso: string | null
  confirmado: boolean; activo?: boolean; dos_pasos?: boolean }
type Actividad = { reservas: number; entregas: number; devoluciones: number; cobros: number; total: number }

const ROL_INFO: Record<string, string> = {
  'Administrador': 'Opera todo: reservas, entregas, cobros, flota, clientes, caja y reportes. No puede borrar registros.',
  'Dueño': 'Todo lo anterior, más usuarios, ajustes del negocio, apertura de caja, borrar registros y ver el historial detallado.',
}

const hace = (iso: string | null) => {
  if (!iso) return 'Nunca'
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 60) return `hace ${Math.max(1, min)} min`
  if (min < 1440) return `hace ${Math.round(min / 60)} h`
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Calls the Netlify function that manages accounts with the service key (owner only). */
async function llamar(accion: string, datos: Record<string, string> = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  try {
    const r = await fetch('/.netlify/functions/usuarios', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${session?.access_token ?? ''}` },
      body: JSON.stringify({ accion, ...datos }),
    })
    // Without the function, Netlify answers with the app's own page (HTML) instead of JSON
    if (r.status === 404 || !(r.headers.get('content-type') ?? '').includes('json'))
      return { error: 'La función de usuarios aún no está publicada en Netlify. Vuelve a publicar el sitio (Deploys → Trigger deploy).', codigo: 'sin_funcion' }
    const j = await r.json().catch(() => ({ error: `Error ${r.status}` }))
    return j as { ok?: boolean; error?: string; codigo?: string; enlace?: string; tipo?: string }
  } catch {
    return { error: 'Sin conexión. Revisa el internet e inténtalo de nuevo.' }
  }
}

const mensajeInvitacion = (nombre: string, enlace: string) =>
  `Hola${nombre ? ` ${nombre.split(' ')[0]}` : ''}, te di acceso a la app de ${EMPRESA.nombreComercial}. Abre este enlace para crear tu contraseña (es personal, no lo compartas):\n${enlace}`

function EnlaceListo({ enlace, nombre, onClose }: { enlace: string; nombre: string; onClose: () => void }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: '10px 13px', background: 'var(--primary-soft)', color: 'var(--primary-dark)', borderRadius: 'var(--radius-sm)', fontSize: 13, lineHeight: 1.5 }}>
        Enlace listo. Envíalo a la persona: al abrirlo crea su contraseña y entra directo. Es de un solo uso y vence en 24 horas.
      </div>
      <code style={{ fontSize: 11.5, wordBreak: 'break-all', background: 'var(--paper-alt)', padding: 10, borderRadius: 8, fontFamily: 'var(--font-mono)' }}>{enlace}</code>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a className="btn primary" href={whatsappUrl('', mensajeInvitacion(nombre, enlace))} target="_blank" rel="noreferrer"><MessageCircle size={15} />Enviar por WhatsApp</a>
        <button className="btn" onClick={() => { navigator.clipboard?.writeText(enlace); setCopiado(true) }}>{copiado ? <Check size={15} /> : <Copy size={15} />}{copiado ? 'Copiado' : 'Copiar'}</button>
        <button className="btn" onClick={onClose}>Listo</button>
      </div>
    </div>
  )
}

const sinAcentos = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const sugerirUsuario = (nombre: string) => sinAcentos(nombre.trim().toLowerCase()).split(/\s+/).slice(0, 2).join('.').replace(/[^a-z0-9._-]/g, '').slice(0, 30)

const mensajeCredenciales = (nombre: string, usuario: string, pass: string) =>
  `Hola${nombre ? ` ${nombre.split(' ')[0]}` : ''}, ya tienes acceso a la app de ${EMPRESA.nombreComercial}.\n${location.origin}\nUsuario: ${usuario}\nContraseña temporal: ${pass}\nAl entrar te pedirá crear tu propia contraseña.`

/** Username + temporary password, ready to send by WhatsApp. */
function CredencialesListas({ nombre, usuario, pass, onClose }: { nombre: string; usuario: string; pass: string; onClose: () => void }) {
  const [copiado, setCopiado] = useState(false)
  const msg = mensajeCredenciales(nombre, usuario, pass)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: '10px 13px', background: 'var(--primary-soft)', color: 'var(--primary-dark)', borderRadius: 'var(--radius-sm)', fontSize: 13, lineHeight: 1.5 }}>
        Cuenta lista. Envíale estos datos; al entrar por primera vez la app le pedirá crear su propia contraseña.
      </div>
      <div style={{ background: 'var(--paper-alt)', borderRadius: 10, padding: 12, fontSize: 14, lineHeight: 1.7 }}>
        Usuario: <b className="mono">{usuario}</b><br />Contraseña temporal: <b className="mono">{pass}</b>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a className="btn primary" href={whatsappUrl('', msg)} target="_blank" rel="noreferrer"><MessageCircle size={15} />Enviar por WhatsApp</a>
        <button className="btn" onClick={() => { navigator.clipboard?.writeText(msg); setCopiado(true) }}>{copiado ? <Check size={15} /> : <Copy size={15} />}{copiado ? 'Copiado' : 'Copiar'}</button>
        <button className="btn" onClick={onClose}>Listo</button>
      </div>
    </div>
  )
}

function CampoContrasena({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label className="field-l">Contraseña temporal *</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="field-i mono" value={value} onChange={e => onChange(e.target.value)} placeholder="Ej. Renta#2026" autoComplete="new-password" autoCapitalize="off" />
        <button type="button" className="btn" onClick={() => onChange(generarContrasena())} title="Generar una contraseña segura"><RefreshCw size={14} />Generar</button>
      </div>
      <ReglasContrasena pass={value} />
    </div>
  )
}

function NuevoUsuario({ onClose, onCreado }: { onClose: () => void; onCreado: () => void }) {
  const [nombre, setNombre] = useState('')
  const [usuario, setUsuario] = useState('')
  const [usuarioEditado, setUsuarioEditado] = useState(false)
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState<'Administrador' | 'Dueño'>('Administrador')
  const [modo, setModo] = useState<'usuario' | 'enlace' | 'correo'>('usuario')
  const [password, setPassword] = useState(() => generarContrasena())
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [listo, setListo] = useState<{ enlace?: string; msg?: string; usuario?: string; pass?: string } | null>(null)

  async function guardar() {
    const conUsuario = modo === 'usuario'
    const faltan = [!nombre.trim() && 'el nombre',
      conUsuario && !usuarioValido(usuario) && `un nombre de usuario válido (${USUARIO_REGLA.toLowerCase()})`,
      !conUsuario && !/^\S+@\S+\.\S+$/.test(email.trim()) && 'un correo válido',
      conUsuario && mensajeContrasena(password) && `una contraseña temporal con ${faltasContrasena(password).join(', ')}`].filter(Boolean)
    if (faltan.length) { setError(`Falta ${faltan.join('; ')}.`); return }
    setGuardando(true); setError('')
    const r = await llamar(conUsuario ? 'crear' : modo === 'enlace' ? 'invitar_enlace' : 'invitar_correo',
      { nombre: nombre.trim(), rol, ...(conUsuario ? { usuario: normalizarUsuario(usuario), password } : { email: email.trim() }) })
    setGuardando(false)
    if (r.error) { setError(r.error); return }
    onCreado()
    setListo(conUsuario ? { usuario: normalizarUsuario(usuario), pass: password } : modo === 'enlace' ? { enlace: r.enlace }
      : { msg: `Se envió la invitación a ${email.trim()}. Si no le llega en unos minutos (revisar spam), usa "Nuevo enlace" en la lista y envíalo por WhatsApp.` })
  }

  return (
    <>
      <div className="qpanel-overlay" onClick={onClose} />
      <div className="qpanel open" role="dialog" aria-label="Agregar usuario">
        <div className="qpanel-head">
          <div><div className="eyebrow">Usuarios</div><h2 className="h-display" style={{ fontSize: 24, marginTop: 4 }}>Agregar usuario</h2></div>
          <button className="iconbtn" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="qpanel-body">
          {listo ? (listo.usuario ? <CredencialesListas nombre={nombre} usuario={listo.usuario} pass={listo.pass!} onClose={onClose} />
            : listo.enlace ? <EnlaceListo enlace={listo.enlace} nombre={nombre} onClose={onClose} /> : (
            <>
              <div style={{ padding: '10px 13px', background: 'var(--primary-soft)', color: 'var(--primary-dark)', borderRadius: 'var(--radius-sm)', fontSize: 13, lineHeight: 1.5 }}>{listo.msg}</div>
              <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={onClose}>Listo</button>
            </>
          )) : (
            <>
              <div className="field"><label className="field-l">Nombre *</label>
                <input className="field-i" value={nombre} placeholder="Nombre y apellido" onChange={e => {
                  setNombre(e.target.value); setError('')
                  if (!usuarioEditado) setUsuario(sugerirUsuario(e.target.value))
                }} /></div>
              <div className="field">
                <label className="field-l">¿Cómo va a entrar?</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {([['usuario', 'Con nombre de usuario (sin correo)', 'Tú eliges su usuario y una contraseña temporal.'],
                    ['enlace', 'Con su correo + enlace por WhatsApp', 'La app genera un enlace para que cree su contraseña.'],
                    ['correo', 'Con su correo + invitación por correo', 'Supabase le envía un correo. Puede tardar o caer en spam.']] as const).map(([v, t, s]) => (
                    <label key={v} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: 13.5 }}>
                      <input type="radio" name="modo" checked={modo === v} onChange={() => { setModo(v); setError('') }} style={{ marginTop: 3 }} />
                      <span><b>{t}</b><br /><span style={{ color: 'var(--ink3)', fontSize: 12 }}>{s}</span></span>
                    </label>
                  ))}
                </div>
              </div>
              {modo === 'usuario' ? <>
                <div className="field"><label className="field-l">Nombre de usuario *</label>
                  <input className="field-i mono" value={usuario} placeholder="ej. ana.lopez" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                    onChange={e => { setUsuario(e.target.value.toLowerCase().replace(/\s/g, '')); setUsuarioEditado(true); setError('') }} />
                  <div style={{ fontSize: 12, color: 'var(--ink3)' }}>{USUARIO_REGLA}</div></div>
                <CampoContrasena value={password} onChange={v => { setPassword(v); setError('') }} />
              </> : (
                <div className="field"><label className="field-l">Correo *</label>
                  <input className="field-i" type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }} placeholder="correo@ejemplo.com" autoCapitalize="off" /></div>
              )}
              <div className="field">
                <label className="field-l">Tipo de usuario</label>
                <div className="filterbar" style={{ margin: 0 }}>
                  {(['Administrador', 'Dueño'] as const).map(r => <button key={r} className={`fbtn${rol === r ? ' on' : ''}`} onClick={() => setRol(r)}>{r}</button>)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.45 }}>{ROL_INFO[rol]}</div>
              </div>
              {error && <div role="alert" style={{ padding: '10px 13px', background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>{error}</div>}
            </>
          )}
        </div>
        {!listo && (
          <div className="qpanel-foot">
            <button className="btn primary" onClick={guardar} disabled={guardando}><UserPlus size={15} />{guardando ? 'Creando…' : 'Agregar usuario'}</button>
          </div>
        )}
      </div>
    </>
  )
}

/** Owner assigns a new temporary password (the person changes it when signing in). */
function NuevaContrasena({ u, onClose }: { u: Usuario; onClose: () => void }) {
  const [password, setPassword] = useState(() => generarContrasena())
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [listo, setListo] = useState(false)
  const ident = identificador(u.email)
  async function guardar() {
    const problema = mensajeContrasena(password)
    if (problema) { setError(problema); return }
    setGuardando(true); setError('')
    const r = await llamar('contrasena', { id: u.id, password })
    setGuardando(false)
    if (r.error) { setError(r.error); return }
    setListo(true)
  }
  return (
    <>
      <div className="qpanel-overlay" onClick={onClose} />
      <div className="qpanel open" role="dialog" aria-label="Nueva contraseña">
        <div className="qpanel-head">
          <div><div className="eyebrow">Usuarios</div><h2 className="h-display" style={{ fontSize: 24, marginTop: 4 }}>Nueva contraseña</h2>
            <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 4 }}>{u.nombre ?? ident} · {ident}</div></div>
          <button className="iconbtn" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="qpanel-body">
          {listo ? <CredencialesListas nombre={u.nombre ?? ''} usuario={ident} pass={password} onClose={onClose} /> : <>
            <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5 }}>Su contraseña actual dejará de funcionar. Al entrar con esta, la app le pedirá crear una propia.</div>
            <CampoContrasena value={password} onChange={v => { setPassword(v); setError('') }} />
            {error && <div role="alert" style={{ padding: '10px 13px', background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>{error}</div>}
          </>}
        </div>
        {!listo && <div className="qpanel-foot"><button className="btn primary" onClick={guardar} disabled={guardando}><KeyRound size={15} />{guardando ? 'Guardando…' : 'Asignar contraseña'}</button></div>}
      </div>
    </>
  )
}

export default function UsuariosScreen() {
  const { user } = useAuth()
  const [lista, setLista] = useState<Usuario[]>([])
  const [act, setAct] = useState<Record<string, Actividad>>({})
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [loading, setLoading] = useState(true)
  const [cambiando, setCambiando] = useState<string | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const [cambiarPass, setCambiarPass] = useState<Usuario | null>(null)
  const [enlace, setEnlace] = useState<{ id: string; enlace: string; nombre: string } | null>(null)

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

  async function cambiarRol(u: Usuario, rol: string) {
    if (rol === u.rol) return
    const quien = u.nombre ?? identificador(u.email)
    if (!confirm(rol === 'Dueño' ? `¿Hacer dueño a ${quien}? Podrá administrar usuarios, ajustes, la caja y borrar registros.`
      : rol === 'Sin acceso' ? `¿Quitar el acceso a ${quien}? Ya no podrá ver ni modificar datos.`
      : `¿Dejar a ${quien} como administrador?`)) return
    setCambiando(u.id); setError(''); setAviso('')
    const { error: e } = await db.rpc('asignar_rol', { uid: u.id, rol })
    setCambiando(null)
    if (e) { setError(mensajeError(e)); return }
    setAviso(`${quien} ahora es ${rol}. El cambio se aplica la próxima vez que abra la app (máximo en una hora).`)
    cargar()
  }

  async function accion(u: Usuario, a: 'enlace' | 'desactivar' | 'reactivar') {
    const quien = u.nombre ?? identificador(u.email)
    if (a === 'desactivar' && !confirm(`¿Desactivar la cuenta de ${quien}? No podrá entrar a la app. Su historial se conserva y puedes reactivarla después.`)) return
    setCambiando(u.id); setError(''); setAviso('')
    const r = await llamar(a, { id: u.id })
    setCambiando(null)
    if (r.error) { setError(r.error); return }
    if (a === 'enlace' && r.enlace) setEnlace({ id: u.id, enlace: r.enlace, nombre: u.nombre ?? '' })
    else setAviso(a === 'desactivar' ? `Cuenta de ${quien} desactivada.` : `Cuenta de ${quien} reactivada.`)
    cargar()
  }

  const activos = lista.filter(u => u.activo !== false && u.rol !== 'Sin acceso')

  return (
    <div className="screen">
      <div className="pagehead">
        <div>
          <div className="eyebrow">Gestión</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>Usuarios</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4 }}>{loading ? 'Cargando…' : `${activos.length} con acceso · ${activos.filter(u => u.rol === 'Dueño').length} dueño(s)`}</p>
        </div>
        <div className="pagehead-actions">
          <button className="btn sm primary" onClick={() => setNuevo(true)}><UserPlus size={14} />Agregar usuario</button>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 16px', marginBottom: 'var(--gap)', fontSize: 13, color: 'var(--ink2)', lineHeight: 1.55 }}>
        <b>Administrador:</b> {ROL_INFO.Administrador}<br />
        <b>Dueño:</b> {ROL_INFO['Dueño']}<br />
        Todo lo que hace cada usuario queda en <b>Actividad</b> y no se puede borrar.
      </div>

      {error && <div style={{ padding: '12px 16px', background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--gap)' }}>{error}</div>}
      {aviso && <div style={{ padding: '12px 16px', background: 'var(--primary-soft)', color: 'var(--primary-dark)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--gap)' }}>{aviso}</div>}
      {enlace && (
        <div className="card" style={{ padding: 16, marginBottom: 'var(--gap)' }}>
          <EnlaceListo enlace={enlace.enlace} nombre={enlace.nombre} onClose={() => setEnlace(null)} />
        </div>
      )}

      <div className="card tilelist">
        {lista.map(u => {
          const a = act[u.email]
          const yo = u.id === user?.id
          const inactivo = u.activo === false
          return (
            <div key={u.id} className="tilerow" style={{ flexWrap: 'wrap', opacity: inactivo ? 0.65 : 1 }}>
              <div className="avatar accent" style={{ width: 40, height: 40, fontSize: 14 }}>{(u.nombre ?? identificador(u.email)).slice(0, 2).toUpperCase()}</div>
              <div className="tile-main" style={{ minWidth: 200 }}>
                <div className="tile-l" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {u.nombre ?? identificador(u.email).split('@')[0]}{yo && <span className="chip sm">tú</span>}
                  <span className={`chip sm ${u.rol === 'Dueño' ? 'primary' : u.rol === 'Sin acceso' ? 'danger' : ''}`}>{u.rol}</span>
                  {inactivo && <span className="chip sm danger">Desactivado</span>}
                  {!u.confirmado && !inactivo && !usuarioDeCorreo(u.email) && <span className="chip sm warn">Invitación pendiente</span>}
                  {u.dos_pasos && <span className="chip sm" title="Verificación en dos pasos activa"><ShieldCheck size={11} />2FA</span>}
                </div>
                <div className="tile-s">{usuarioDeCorreo(u.email) ? `usuario: ${usuarioDeCorreo(u.email)}` : u.email} · último acceso {hace(u.ultimo_acceso)}</div>
                {a && <div className="tile-s">Últimos 30 días: {a.reservas} reservas · {a.entregas} entregas · {a.devoluciones} devoluciones · {a.cobros} cobros</div>}
              </div>
              {!yo && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {!inactivo && (
                    <select className="field-i" style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }} value={u.rol} disabled={cambiando === u.id}
                      onChange={e => cambiarRol(u, e.target.value)} aria-label={`Tipo de usuario de ${identificador(u.email)}`}>
                      <option value="Administrador">Administrador</option>
                      <option value="Dueño">Dueño</option>
                      <option value="Sin acceso">Sin acceso</option>
                    </select>
                  )}
                  {!inactivo && (u.confirmado || usuarioDeCorreo(u.email)
                    ? <button className="btn sm" onClick={() => setCambiarPass(u)} disabled={cambiando === u.id}><KeyRound size={13} />Nueva contraseña</button>
                    : <button className="btn sm" onClick={() => accion(u, 'enlace')} disabled={cambiando === u.id} title="Reenviar invitación"><Link2 size={13} />Nuevo enlace</button>)}
                  {inactivo
                    ? <button className="btn sm primary" onClick={() => accion(u, 'reactivar')} disabled={cambiando === u.id}>Reactivar</button>
                    : <button className="btn sm" style={{ color: 'var(--danger-ink)' }} onClick={() => accion(u, 'desactivar')} disabled={cambiando === u.id}>Desactivar</button>}
                </div>
              )}
            </div>
          )
        })}
        {!loading && !error && lista.length === 0 && <div style={{ padding: 24, color: 'var(--ink3)' }}>Sin usuarios.</div>}
      </div>

      {nuevo && <NuevoUsuario onClose={() => setNuevo(false)} onCreado={cargar} />}
      {cambiarPass && <NuevaContrasena u={cambiarPass} onClose={() => { setCambiarPass(null); cargar() }} />}
    </div>
  )
}
