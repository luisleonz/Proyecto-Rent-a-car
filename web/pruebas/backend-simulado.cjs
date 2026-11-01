// In-memory stand-in for Supabase (auth, PostgREST tables/RPC, storage) used by the end-to-end tests.
// It keeps state across requests so whole flows can be verified against the stored data.
const fs = require('fs')
const crypto = require('crypto')

const IMG = fs.readFileSync(require('path').join(__dirname, 'foto-prueba.jpg'))
const uuid = () => crypto.randomUUID()
const ahora = () => new Date().toISOString()
const hoyHmo = () => new Date(Date.now() - 7 * 3600e3).toISOString().slice(0, 10)
const sumarDias = (iso, n) => new Date(Date.parse(iso + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10)

const RELACIONES = {
  reservas: { clientes: ['clientes', 'cliente_id'], vehiculos: ['vehiculos', 'vehiculo_id'] },
  pagos: { reservas: ['reservas', 'reserva_id'] },
  cotizaciones: { vehiculos: ['vehiculos', 'vehiculo_id'] },
}

const DEFAULTS = {
  vehiculos: () => ({ status: 'disponible', km: 0, combustible: 100, fotos: [], cliente_actual: null, info_cliente: null, foto_url: null }),
  clientes: () => ({}),
  reservas: () => ({ status: 'pendiente', deposito: 0, iva: 0, cobertura: 'basica', cobertura_costo: 0, fianza: 0, cargos_extra: 0,
    fotos_entrega: [], fotos_devolucion: [], legacy_id: null, notas: null }),
  pagos: () => ({ concepto: 'renta', fecha: ahora() }),
  cotizaciones: () => ({ status: 'enviada', iva: 0, reserva_id: null }),
  solicitudes: () => ({ estado: 'pendiente', revisado_por: null, revisado_at: null, nota_rechazo: null }),
  logs: () => ({}),
  caja_movimientos: () => ({ metodo: 'efectivo', fecha: ahora() }),
  configuracion: () => ({}),
  auditoria: () => ({ fecha: ahora() }),
}
const ACCESO = ['Dueño', 'Administrador', 'Empleado']
const PERMANENTES = ['logs', 'caja_movimientos', 'auditoria']
// Token shaped like a Supabase JWT (unsigned) so the client can read its claims
const jwt = (u, aal = 'aal1') => ['{"alg":"none","typ":"JWT"}', JSON.stringify({ sub: u.id, email: u.email, role: 'authenticated', aal, exp: Math.floor(Date.now() / 1000) + 3600 })]
  .map(x => Buffer.from(x).toString('base64url')).join('.') + '.' + crypto.randomUUID()

function compara(a, b) {
  if (a == null || b == null) return a == null && b == null ? 0 : a == null ? -1 : 1
  if (typeof a === 'number' || typeof b === 'number') return Number(a) - Number(b)
  const fa = /\dT\d/.test(a) ? Date.parse(a) : NaN, fb = /\dT\d/.test(b) ? Date.parse(b) : NaN
  if (!isNaN(fa) && !isNaN(fb)) return fa - fb
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0
}

function partirNivelSuperior(s) {
  const out = []; let d = 0, cur = ''
  for (const ch of s) {
    if (ch === '(') d++
    if (ch === ')') d--
    if (ch === ',' && d === 0) { out.push(cur); cur = '' } else cur += ch
  }
  if (cur) out.push(cur)
  return out.map(x => x.trim()).filter(Boolean)
}

function cumple(fila, col, expr) {
  const v = fila[col]
  const m = expr.match(/^(not\.)?(eq|neq|gt|gte|lt|lte|in|is|ilike|like)\.(.*)$/s)
  if (!m) return true
  const [, neg, op, raw] = m
  let r
  if (op === 'eq') r = String(v) === raw
  else if (op === 'neq') r = String(v) !== raw
  else if (op === 'gt') r = compara(v, raw) > 0
  else if (op === 'gte') r = compara(v, raw) >= 0
  else if (op === 'lt') r = compara(v, raw) < 0
  else if (op === 'lte') r = compara(v, raw) <= 0
  else if (op === 'in') r = raw.replace(/^\(|\)$/g, '').split(',').map(x => x.replace(/^"|"$/g, '')).includes(String(v))
  else if (op === 'is') r = raw === 'null' ? v == null : String(v) === raw
  else {
    const re = new RegExp('^' + raw.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/[%*]/g, '.*') + '$', op === 'ilike' ? 'i' : '')
    r = re.test(String(v ?? ''))
  }
  return neg ? !r : r
}

class Backend {
  constructor(semilla) {
    this.t = { vehiculos: [], clientes: [], reservas: [], pagos: [], cotizaciones: [], solicitudes: [], logs: [], caja_movimientos: [], configuracion: [{ id: 1, datos: {} }], auditoria: [] }
    this.usuarios = []       // { id, email, password, user_metadata, app_metadata, email_confirmed_at, last_sign_in_at }
    this.tokens = {}         // token → user id
    this.archivos = {}       // "bucket/path" → Buffer
    this.buckets = new Set(['vehiculos', 'documentos', 'Firma'])
    this.peticiones = []     // non-GET calls, for assertions
    this.externas = {}       // external URL → Buffer (old platform photos)
    if (semilla) semilla(this)
  }

  insertar(tabla, fila) {
    const base = { id: uuid(), created_at: ahora(), ...DEFAULTS[tabla]() }
    if (tabla === 'reservas') base.folio = Math.max(0, ...this.t.reservas.map(r => r.folio ?? 0)) + 1
    const nueva = { ...base, ...fila }
    this.t[tabla].push(nueva)
    if (tabla === 'reservas') this.trigger([nueva.vehiculo_id])
    return nueva
  }

  // Mirrors public.sincronizar_vehiculo in the SQL migration
  sincronizar(vid) {
    const v = this.t.vehiculos.find(x => x.id === vid)
    if (!v || v.status === 'taller') return
    const cli = id => this.t.clientes.find(c => c.id === id)?.nombre ?? null
    const act = this.t.reservas.filter(r => r.vehiculo_id === vid && r.status === 'entregada').sort((a, b) => compara(b.fecha_entrega, a.fecha_entrega))[0]
    if (act) return Object.assign(v, { status: 'rentado', cliente_actual: cli(act.cliente_id), info_cliente: 'regresa ' + act.fecha_devolucion.slice(8, 10) + '/' + act.fecha_devolucion.slice(5, 7) })
    const prox = this.t.reservas.filter(r => r.vehiculo_id === vid && ['confirmada', 'pendiente'].includes(r.status) && r.fecha_entrega <= sumarDias(hoyHmo(), 1) && r.fecha_devolucion >= hoyHmo())
      .sort((a, b) => compara(a.fecha_entrega, b.fecha_entrega))[0]
    if (prox) return Object.assign(v, { status: 'reservado', cliente_actual: cli(prox.cliente_id), info_cliente: 'sale ' + prox.fecha_entrega.slice(8, 10) + '/' + prox.fecha_entrega.slice(5, 7) })
    Object.assign(v, { status: 'disponible', cliente_actual: null, info_cliente: null })
  }
  trigger(ids) { [...new Set(ids.filter(Boolean))].forEach(id => this.sincronizar(id)) }

  usuarioDe(req) {
    const tok = (req.headers()['authorization'] ?? '').replace('Bearer ', '')
    return this.usuarios.find(u => u.id === this.tokens[tok]) ?? null
  }
  rol(u) { const r = u?.app_metadata?.role ?? null; return r === 'Empleado' ? 'Administrador' : r }

  embeber(tabla, fila, select) {
    const out = { ...fila }
    for (const parte of partirNivelSuperior(select)) {
      const m = parte.match(/^(\w+)(?:!\w+)?\((.*)\)$/s)
      if (!m) continue
      const [, nombre, sub] = m
      const rel = RELACIONES[tabla]?.[nombre]
      if (!rel) continue
      const destino = this.t[rel[0]].find(x => x.id === fila[rel[1]])
      out[nombre] = destino ? this.embeber(rel[0], destino, sub) : null
    }
    return out
  }

  filtrar(tabla, params) {
    let filas = this.t[tabla]
    for (const [k, val] of params) {
      if (['select', 'order', 'limit', 'offset', 'columns'].includes(k)) continue
      if (k.includes('.')) {
        // Filter on an embedded table (used with !inner joins)
        const [rel, col] = k.split('.'), def = RELACIONES[tabla]?.[rel]
        if (def) filas = filas.filter(f => { const d = this.t[def[0]].find(x => x.id === f[def[1]]); return d && cumple(d, col, val) })
        continue
      }
      if (k === 'or') {
        const conds = partirNivelSuperior(val.replace(/^\(|\)$/g, ''))
        filas = filas.filter(f => conds.some(c => { const i = c.indexOf('.'); return cumple(f, c.slice(0, i), c.slice(i + 1)) }))
      } else filas = filas.filter(f => cumple(f, k, val))
    }
    return filas
  }

  async manejar(route) {
    const req = route.request(), url = new URL(req.url()), metodo = req.method(), ruta = url.pathname
    const cuerpo = () => { try { return JSON.parse(req.postData() ?? 'null') } catch { return null } }
    // Like Supabase, let the browser read Content-Range (used for counts)
    const cors = { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' }
    const json = (status, body, headers = {}) => route.fulfill({ status, contentType: 'application/json', headers: { ...cors, ...headers }, body: body === undefined ? '' : JSON.stringify(body) })
    if (metodo !== 'GET' && metodo !== 'HEAD') this.peticiones.push({ metodo, ruta, cuerpo: ruta.startsWith('/storage') ? null : cuerpo() })

    /* ── auth ── */
    if (ruta.startsWith('/auth/v1/')) {
      const sesion = (u, aal = 'aal1') => { const tok = jwt(u, aal); this.tokens[tok] = u.id; u.last_sign_in_at = ahora()
        return { access_token: tok, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'rt-' + u.id, user: this.publico(u) } }
      if (ruta === '/auth/v1/token' && url.searchParams.get('grant_type') === 'password') {
        const { email, password } = cuerpo()
        const u = this.usuarios.find(x => x.email === email && x.password === password)
        if (u?.desactivado) return json(400, { code: 'user_banned', error_code: 'user_banned', msg: 'User is banned' })
        return u ? json(200, sesion(u)) : json(400, { code: 'invalid_credentials', error_code: 'invalid_credentials', msg: 'Invalid login credentials' })
      }
      if (ruta === '/auth/v1/token' && url.searchParams.get('grant_type') === 'refresh_token') {
        const u = this.usuarios.find(x => 'rt-' + x.id === cuerpo().refresh_token)
        return u ? json(200, sesion(u)) : json(400, { code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' })
      }
      if (ruta === '/auth/v1/user' && metodo === 'GET') { const u = this.usuarioDe(req); return u ? json(200, this.publico(u)) : json(401, { msg: 'no session' }) }
      if (ruta === '/auth/v1/user' && metodo === 'PUT') {
        const u = this.usuarioDe(req), b = cuerpo()
        if (b.password) u.password = b.password
        if (b.data) u.user_metadata = { ...u.user_metadata, ...b.data }
        return json(200, this.publico(u))
      }
      // Two-step verification (TOTP); the valid code in tests is 123456
      const mf = ruta.match(/^\/auth\/v1\/factors(?:\/([^/]+))?(?:\/(challenge|verify))?$/)
      if (mf) {
        const u = this.usuarioDe(req); if (!u) return json(401, { msg: 'no session' })
        u.factores ??= []
        const [, fid, paso] = mf
        if (!fid && metodo === 'POST') {
          const f = { id: uuid(), factor_type: 'totp', status: 'unverified', friendly_name: cuerpo().friendly_name, created_at: ahora(), updated_at: ahora() }
          u.factores.push(f)
          return json(200, { id: f.id, type: 'totp', friendly_name: f.friendly_name, totp: { qr_code: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>', secret: 'JBSWY3DPEHPK3PXP', uri: 'otpauth://totp/x' } })
        }
        const f = u.factores.find(x => x.id === fid)
        if (!f) return json(404, { msg: 'factor not found' })
        if (metodo === 'DELETE') { u.factores = u.factores.filter(x => x !== f); return json(200, { id: f.id }) }
        if (paso === 'challenge') return json(200, { id: uuid(), type: 'totp', expires_at: Math.floor(Date.now() / 1000) + 300 })
        if (paso === 'verify') {
          if (cuerpo().code !== '123456') return json(422, { code: 'mfa_verification_failed', error_code: 'mfa_verification_failed', msg: 'Invalid TOTP code entered' })
          f.status = 'verified'
          return json(200, sesion(u, 'aal2'))
        }
      }
      if (ruta === '/auth/v1/recover') return json(200, {})
      if (ruta === '/auth/v1/logout') return json(204)
      return json(404, { msg: 'auth ' + ruta })
    }

    /* ── storage ── */
    if (ruta.startsWith('/storage/v1/object')) {
      const resto = ruta.replace('/storage/v1/object/', '')
      if (metodo === 'GET') {
        if (resto.startsWith('external/')) return route.fulfill({ status: 200, contentType: 'image/jpeg', body: IMG })
        const clave = decodeURIComponent(resto.replace(/^(public|sign)\//, ''))
        const buf = this.archivos[clave]
        return buf ? route.fulfill({ status: 200, contentType: 'image/jpeg', body: buf }) : json(400, { statusCode: '404', error: 'not_found', message: 'Object not found' })
      }
      if (resto.startsWith('sign/')) {
        const b = cuerpo(), bucket = resto.slice(5).split('/')[0]
        if (!this.buckets.has(bucket)) return json(400, { statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' })
        if (b?.paths) return json(200, b.paths.map(p => ({ path: p, signedURL: this.archivos[`${bucket}/${p}`] ? `/object/sign/${bucket}/${p}?token=x` : null, error: this.archivos[`${bucket}/${p}`] ? null : 'not found' })))
        const p = resto.slice(5).split('/').slice(1).join('/')
        return this.archivos[`${bucket}/${p}`] ? json(200, { signedURL: `/object/sign/${bucket}/${p}?token=x` }) : json(400, { statusCode: '404', error: 'not_found', message: 'Object not found' })
      }
      const [bucket, ...partes] = resto.split('/')
      if (!this.buckets.has(bucket)) return json(400, { statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' })
      if (metodo === 'DELETE') { (cuerpo()?.prefixes ?? []).forEach(p => delete this.archivos[`${bucket}/${p}`]); return json(200, []) }
      this.archivos[`${bucket}/${partes.join('/')}`] = req.postDataBuffer() ?? IMG
      return json(200, { Key: `${bucket}/${partes.join('/')}`, Id: uuid() })
    }

    /* ── RPC ── */
    if (ruta.startsWith('/rest/v1/rpc/')) {
      const fn = ruta.split('/').pop(), args = cuerpo() ?? {}, u = this.usuarioDe(req), rol = this.rol(u)
      if (this.sinMigracion) return json(404, { code: 'PGRST202', message: `Could not find the function public.${fn}` })
      if (fn === 'es_empleado') return json(200, ACCESO.includes(rol))
      if (fn === 'es_dueno') return json(200, rol === 'Dueño')
      if (fn === 'datos_publicos') { const d = this.t.configuracion[0].datos; return json(200, { nombreComercial: d.nombreComercial ?? null, telefono: d.telefono ?? null, whatsapp: d.whatsapp ?? null, email: d.email ?? null, ciudadFirma: d.ciudadFirma ?? null }) }
      if (fn === 'sincronizar_vehiculo') { this.sincronizar(args.vid); return json(204) }
      if (fn === 'sincronizar_flota') { this.t.vehiculos.forEach(v => this.sincronizar(v.id)); return json(204) }
      if (fn === 'vehiculos_publicos') return json(200, this.t.vehiculos.filter(v => v.status !== 'taller').map(v => ({ id: v.id, modelo: v.modelo, anio: v.anio, segmento: v.segmento,
        transmision: v.transmision, asientos: v.asientos, tarifa_diaria: v.tarifa_diaria, foto_url: v.foto_url, disponible_hoy: v.status === 'disponible' })))
      if (rol !== 'Dueño' && ['listar_empleados', 'asignar_rol'].includes(fn)) return json(400, { code: 'P0001', message: 'Solo el dueño puede ver los usuarios' })
      if (fn === 'listar_empleados') return json(200, this.usuarios.map(x => ({ id: x.id, email: x.email, nombre: x.user_metadata?.first_name ?? null,
        rol: this.rol(x) ?? 'Sin acceso', creado: ahora(), ultimo_acceso: x.last_sign_in_at ?? null, confirmado: !!x.email_confirmed_at, activo: !x.desactivado,
        dos_pasos: (x.factores ?? []).some(f => f.status === 'verified') })))
      if (fn === 'asignar_rol') {
        const nuevo = args.rol === 'Empleado' ? 'Administrador' : args.rol
        if (args.uid === u.id && nuevo !== 'Dueño') return json(400, { code: 'P0001', message: 'No puedes quitarte tu propio rol de dueño' })
        const x = this.usuarios.find(y => y.id === args.uid)
        if (nuevo !== 'Dueño' && this.rol(x) === 'Dueño' && this.usuarios.filter(y => this.rol(y) === 'Dueño').length <= 1) return json(400, { code: 'P0001', message: 'Debe quedar al menos un dueño' })
        if (nuevo === 'Sin acceso') delete x.app_metadata.role; else x.app_metadata.role = nuevo
        this.insertar('logs', { accion: 'cambiar_rol', entidad: 'usuarios', entidad_id: x.id, descripcion: `${x.email} ahora es ${nuevo}`, realizado_por: u.email })
        return json(204)
      }
      return json(404, { code: 'PGRST202', message: 'unknown rpc ' + fn })
    }

    /* ── tables ── */
    const tabla = ruta.replace('/rest/v1/', '')
    if (!this.t[tabla]) return json(404, { code: 'PGRST205', message: `Could not find the table 'public.${tabla}'` })
    const u = this.usuarioDe(req), rol = this.rol(u)
    if (!ACCESO.includes(rol)) return metodo === 'GET' ? json(200, []) : json(403, { code: '42501', message: 'new row violates row-level security policy' })
    const permanente = () => json(400, { code: 'P0001', message: 'Este registro es permanente: no se puede modificar ni borrar.' })
    const rls = () => json(403, { code: '42501', message: 'new row violates row-level security policy' })
    if (PERMANENTES.includes(tabla) && (metodo === 'PATCH' || metodo === 'DELETE')) return permanente()
    if (tabla === 'auditoria' && metodo === 'GET' && rol !== 'Dueño') return json(200, [])
    if (tabla === 'caja_movimientos' && metodo === 'POST' && (Array.isArray(cuerpo()) ? cuerpo() : [cuerpo()]).some(f => f.tipo === 'apertura') && rol !== 'Dueño') return rls()
    const params = [...url.searchParams.entries()]
    const select = url.searchParams.get('select') ?? '*'
    const unico = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object')
    const devolver = (filas, status) => {
      const out = filas.map(f => this.embeber(tabla, f, select))
      if (unico) return out.length === 1 ? json(status, out[0]) : json(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' })
      return json(status, out, { 'content-range': `0-${Math.max(0, out.length - 1)}/${out.length}` })
    }

    if (metodo === 'GET' || metodo === 'HEAD') {
      let filas = this.filtrar(tabla, params)
      const orden = url.searchParams.get('order')
      if (orden) for (const o of orden.split(',').reverse()) {
        const [col, dir] = o.split('.')
        filas = [...filas].sort((a, b) => compara(a[col], b[col]) * (dir === 'desc' ? -1 : 1))
      }
      const lim = url.searchParams.get('limit')
      if (lim) filas = filas.slice(0, Number(lim))
      if (metodo === 'HEAD') return route.fulfill({ status: 200, headers: { ...cors, 'content-range': `*/${filas.length}` }, body: '' })
      return devolver(filas, 200)
    }
    if (metodo === 'POST') {
      const b = cuerpo(), lista = Array.isArray(b) ? b : [b]
      // Like the "quien" trigger: who did it comes from the session, not from the app
      const quien = f => (tabla === 'logs' ? { ...f, realizado_por: u.email } : ['caja_movimientos', 'pagos'].includes(tabla) ? { ...f, registrado_por: u.email } : f)
      return devolver(lista.map(f => this.insertar(tabla, quien(f))), 201)
    }
    if (metodo === 'PATCH') {
      // Without permission Postgres changes nothing and returns no rows
      if (tabla === 'configuracion' && rol !== 'Dueño') return devolver([], 200)
      const filas = this.filtrar(tabla, params), b = cuerpo()
      const viejos = filas.map(f => f.vehiculo_id)
      filas.forEach(f => Object.assign(f, b))
      if (tabla === 'reservas') this.trigger([...viejos, ...filas.map(f => f.vehiculo_id)])
      return devolver(filas, 200)
    }
    if (metodo === 'DELETE') {
      if (rol !== 'Dueño') return devolver([], 200)
      const filas = this.filtrar(tabla, params)
      this.t[tabla] = this.t[tabla].filter(f => !filas.includes(f))
      return devolver(filas, 200)
    }
    return json(405, { message: metodo })
  }

  publico(u) { return { id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, user_metadata: u.user_metadata, app_metadata: { ...u.app_metadata }, factors: u.factores ?? [], created_at: '2026-01-01T00:00:00Z' } }

  agregarUsuario(email, password, rol, nombre) {
    const u = { id: uuid(), email, password, user_metadata: { first_name: nombre }, app_metadata: rol ? { role: rol } : {}, email_confirmed_at: ahora() }
    this.usuarios.push(u); return u
  }
}

module.exports = { Backend, hoyHmo, sumarDias, jwt }
