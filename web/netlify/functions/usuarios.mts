// User administration for the owner (Dueño), so the business never needs the Supabase dashboard.
// Runs on Netlify with the service role key, which only exists as a Netlify environment variable
// (SUPABASE_SERVICE_ROLE_KEY) and never reaches the browser or the repository.
import { createClient } from '@supabase/supabase-js'
import { correoDeUsuario, usuarioValido, normalizarUsuario, mensajeContrasena, identificador, USUARIO_REGLA } from '../../src/lib/usuarios'

const URL_SB = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const SERVICIO = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const ROLES = ['Dueño', 'Administrador']
const PARA_SIEMPRE = '876000h'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

export default async (req: Request) => {
  try {
    return await atender(req)
  } catch (e) {
    return json(500, { error: `No se pudo completar: ${(e as Error).message}` })
  }
}

async function atender(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido' })
  if (!URL_SB || !SERVICIO) {
    return json(503, { error: 'Falta configurar la llave de servicio en Netlify (variable SUPABASE_SERVICE_ROLE_KEY). Mientras tanto no se pueden crear usuarios desde la app.', codigo: 'sin_llave' })
  }
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return json(401, { error: 'Inicia sesión de nuevo.' })

  // The caller must pass the same database check as the app: owner role and, if enabled, 2FA
  const comoUsuario = createClient(URL_SB, SERVICIO, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: esDueno, error: eDueno } = await comoUsuario.rpc('es_dueno')
  if (eDueno || !esDueno) return json(403, { error: 'Solo el dueño puede administrar usuarios.' })
  const admin = createClient(URL_SB, SERVICIO, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: { user: yo } } = await admin.auth.getUser(token)
  if (!yo) return json(401, { error: 'Inicia sesión de nuevo.' })

  let p: Record<string, string>
  try { p = await req.json() } catch { return json(400, { error: 'Solicitud no válida' }) }
  const sitio = (process.env.URL ?? new URL(req.url).origin).replace(/\/$/, '') + '/'
  const email = (p.email ?? '').trim().toLowerCase()
  const nombre = (p.nombre ?? '').trim()
  const rol = ROLES.includes(p.rol) ? p.rol : 'Administrador'

  const registrar = (accion: string, descripcion: string, id?: string) =>
    admin.from('logs').insert({ accion, entidad: 'usuarios', entidad_id: id ?? null, descripcion, realizado_por: yo.email })

  async function buscar(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id ?? '')) return null
    const { data, error } = await admin.auth.admin.getUserById(id)
    return error ? null : data.user
  }
  async function otrosDuenosActivos(excepto: string) {
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
    return (data?.users ?? []).filter(u => u.id !== excepto && u.app_metadata?.role === 'Dueño'
      && !(u.banned_until && new Date(u.banned_until) > new Date())).length
  }
  const errorAlta = (m: string) => /already been registered|already registered|exists/i.test(m)
    ? 'Ya existe un usuario con ese correo. Búscalo en la lista para darle acceso o reenviarle su enlace.'
    : /rate limit/i.test(m) ? 'Se alcanzó el límite de correos por hora. Usa la opción de enlace por WhatsApp.'
    : m

  switch (p.accion) {
    // Creates the account and returns a one-time link the owner can send by WhatsApp (no email needed)
    case 'invitar_enlace':
    case 'invitar_correo': {
      if (!/^\S+@\S+\.\S+$/.test(email)) return json(400, { error: 'Escribe un correo válido.' })
      const datos = { first_name: nombre || undefined, nombre: nombre || undefined }
      let id: string | undefined, enlace: string | undefined
      if (p.accion === 'invitar_correo') {
        const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: datos, redirectTo: sitio })
        if (error) return json(400, { error: errorAlta(error.message) })
        id = data.user?.id
      } else {
        const { data, error } = await admin.auth.admin.generateLink({ type: 'invite', email, options: { data: datos, redirectTo: sitio } })
        if (error) return json(400, { error: errorAlta(error.message) })
        id = data.user?.id; enlace = data.properties?.action_link
      }
      if (id) await admin.auth.admin.updateUserById(id, { app_metadata: { role: rol } })
      await registrar('invitar_usuario', `Invitó a ${email} como ${rol}`, id)
      return json(200, { ok: true, enlace })
    }

    // Account ready to use with a temporary password, with a username (no email) or with an email.
    // The person must replace the temporary password the first time they sign in.
    case 'crear': {
      const usuario = p.usuario ? normalizarUsuario(p.usuario) : ''
      if (usuario && !usuarioValido(usuario)) return json(400, { error: `Nombre de usuario no válido. ${USUARIO_REGLA}` })
      if (!usuario && !/^\S+@\S+\.\S+$/.test(email)) return json(400, { error: 'Escribe un correo válido.' })
      const problema = mensajeContrasena(p.password ?? '')
      if (problema) return json(400, { error: problema })
      const correo = usuario ? correoDeUsuario(usuario) : email
      const { data, error } = await admin.auth.admin.createUser({
        email: correo, password: p.password, email_confirm: true,
        user_metadata: { first_name: nombre || undefined, nombre: nombre || undefined, usuario: usuario || undefined, debe_cambiar: true },
        app_metadata: { role: rol },
      })
      if (error) return json(400, { error: usuario && /exists|registered/i.test(error.message) ? 'Ese nombre de usuario ya existe. Elige otro.' : errorAlta(error.message) })
      await registrar('crear_usuario', `Creó la cuenta de ${usuario || email} como ${rol}`, data.user?.id)
      return json(200, { ok: true })
    }

    // The owner sets a new temporary password (for people without email, or who forgot theirs)
    case 'contrasena': {
      const u = await buscar(p.id)
      if (!u) return json(404, { error: 'Usuario no encontrado.' })
      const problema = mensajeContrasena(p.password ?? '')
      if (problema) return json(400, { error: problema })
      const { error } = await admin.auth.admin.updateUserById(u.id, {
        password: p.password, user_metadata: { ...u.user_metadata, debe_cambiar: true },
      })
      if (error) return json(400, { error: error.message })
      await registrar('contrasena_usuario', `Asignó una contraseña temporal a ${identificador(u.email)}`, u.id)
      return json(200, { ok: true })
    }

    // New link: finishes a pending invitation, or lets someone who forgot it set a new password
    case 'enlace': {
      const u = await buscar(p.id)
      if (!u?.email) return json(404, { error: 'Usuario no encontrado.' })
      const tipo = u.email_confirmed_at || u.last_sign_in_at ? 'recovery' : 'invite'
      const { data, error } = await admin.auth.admin.generateLink({ type: tipo, email: u.email, options: { redirectTo: sitio } })
      if (error) return json(400, { error: error.message })
      await registrar('enlace_usuario', `Generó un enlace ${tipo === 'invite' ? 'de invitación' : 'para cambiar contraseña'} para ${u.email}`, u.id)
      return json(200, { ok: true, enlace: data.properties?.action_link, tipo })
    }

    case 'desactivar': {
      if (p.id === yo.id) return json(400, { error: 'No puedes desactivar tu propia cuenta.' })
      const u = await buscar(p.id)
      if (!u) return json(404, { error: 'Usuario no encontrado.' })
      if (u.app_metadata?.role === 'Dueño' && await otrosDuenosActivos(u.id) === 0) return json(400, { error: 'Debe quedar al menos un dueño activo.' })
      const anterior = u.app_metadata?.role ?? u.app_metadata?.rol_anterior ?? null
      const { error } = await admin.auth.admin.updateUserById(u.id, {
        ban_duration: PARA_SIEMPRE, app_metadata: { role: null, rol_anterior: anterior },
      })
      if (error) return json(400, { error: error.message })
      await registrar('desactivar_usuario', `Desactivó la cuenta de ${identificador(u.email)}`, u.id)
      return json(200, { ok: true })
    }

    case 'reactivar': {
      const u = await buscar(p.id)
      if (!u) return json(404, { error: 'Usuario no encontrado.' })
      const nuevo = ROLES.includes(u.app_metadata?.rol_anterior) ? u.app_metadata.rol_anterior : 'Administrador'
      const { error } = await admin.auth.admin.updateUserById(u.id, { ban_duration: 'none', app_metadata: { role: nuevo, rol_anterior: null } })
      if (error) return json(400, { error: error.message })
      await registrar('reactivar_usuario', `Reactivó la cuenta de ${identificador(u.email)} como ${nuevo}`, u.id)
      return json(200, { ok: true })
    }

    case 'estado':
      return json(200, { ok: true })

    default:
      return json(400, { error: 'Acción no válida' })
  }
}
