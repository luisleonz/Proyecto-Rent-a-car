// Shared by the app and the Netlify function (no imports on purpose).

// Accounts without an email sign in with a username. Supabase still needs an address, so each
// username maps to a "+alias" of the business Gmail: unique per person, never typed by anyone, and
// if a message were ever sent it would land in the business inbox, not with a stranger.
const BUZON = 'lucianostoursnogales'
const DOMINIO = 'gmail.com'

export const USUARIO_REGLA = 'De 3 a 30 letras minúsculas, números, punto, guion o guion bajo, sin espacios ni acentos.'
export const normalizarUsuario = (u: string) => u.trim().toLowerCase()
export const usuarioValido = (u: string) => /^[a-z0-9._-]{3,30}$/.test(normalizarUsuario(u))
export const correoDeUsuario = (u: string) => `${BUZON}+${normalizarUsuario(u)}@${DOMINIO}`

/** The username behind an internal address, or null for people who use their own email. */
export function usuarioDeCorreo(email: string | null | undefined) {
  const m = (email ?? '').toLowerCase().match(new RegExp(`^${BUZON}\\+([a-z0-9._-]+)@${DOMINIO.replace('.', '\\.')}$`))
  return m ? m[1] : null
}

/** How a person is identified on screen: their username, or their email. */
export const identificador = (email: string | null | undefined) => usuarioDeCorreo(email) ?? email ?? ''

// Password policy: 8+ characters with an uppercase letter, a number and a symbol
export const REGLAS_CONTRASENA: { texto: string; cumple: (p: string) => boolean }[] = [
  { texto: 'Al menos 8 caracteres', cumple: p => p.length >= 8 },
  { texto: 'Una letra mayúscula', cumple: p => /[A-ZÁÉÍÓÚÑ]/.test(p) },
  { texto: 'Un número', cumple: p => /\d/.test(p) },
  { texto: 'Un símbolo (por ejemplo ! @ # $ % * ?)', cumple: p => /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]/.test(p) },
]
export const faltasContrasena = (p: string) => REGLAS_CONTRASENA.filter(r => !r.cumple(p)).map(r => r.texto.toLowerCase())
export const mensajeContrasena = (p: string) => {
  const f = faltasContrasena(p)
  return f.length ? `La contraseña necesita: ${f.join(', ')}.` : null
}

/** A temporary password that meets the policy, easy to read aloud (no 0/O or 1/l). */
export function generarContrasena() {
  const may = 'ABCDEFGHJKLMNPQRSTUVWXYZ', min = 'abcdefghijkmnpqrstuvwxyz', num = '23456789', sim = '#$%*?!'
  const azar = (s: string) => s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length]
  return azar(may) + Array.from({ length: 5 }, () => azar(min)).join('') + azar(num) + azar(num) + azar(sim)
}
