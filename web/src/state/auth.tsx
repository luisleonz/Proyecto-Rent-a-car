import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  currentEmail: string
  currentFirstName: string
  currentInitials: string
  currentRole: string
  currentBranch: string
  /** Any active user: Administrador or Dueño can run the whole operation. */
  isAdmin: boolean
  /** Owner: users, business settings, opening cash, audit trail, backups. */
  esDueno: boolean
  tieneAcceso: boolean
  /** Signed in with password but two-step verification is still pending. */
  falta2fa: boolean
  recargarAcceso: () => void
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, loading: true,
  signOut: async () => {},
  currentEmail: '', currentFirstName: '', currentInitials: '',
  currentRole: '', currentBranch: '', isAdmin: false, esDueno: false, tieneAcceso: false, falta2fa: false,
  recargarAcceso: () => {},
})

type Acceso = 'cargando' | 'previo' | 'si' | 'no' | 'dos_pasos'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // 'previo' = the roles migration hasn't been run yet, so access works as before it
  const [acceso, setAcceso] = useState<Acceso>('cargando')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // The server decides access from the session token (refreshed after the owner grants it)
  useEffect(() => {
    if (!session) { setAcceso('cargando'); return }
    let vigente = true
    ;(async () => {
      // An unreadable token just skips the 2FA check here; the database still enforces it
      const nivel = await supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(r => r.data, () => null)
      if (nivel?.nextLevel === 'aal2' && nivel.currentLevel !== 'aal2') { if (vigente) setAcceso('dos_pasos'); return }
      const { data, error } = await (supabase as any).rpc('es_empleado') // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!vigente) return
      if (error) setAcceso(error.code === 'PGRST202' || error.code === '42883' ? 'previo' : 'si')
      else setAcceso(data ? 'si' : 'no')
    })()
    return () => { vigente = false }
  }, [session?.access_token, revision])

  async function signOut() {
    await supabase.auth.signOut()
  }

  const user = session?.user ?? null
  const meta = user?.user_metadata ?? {}
  const email     = user?.email ?? ''
  const firstName = meta.first_name ?? meta.nombre ?? email.split('@')[0] ?? ''
  const initials  = meta.initials ?? firstName.slice(0, 2).toUpperCase()
  // Role lives in app_metadata, which users cannot edit themselves (user_metadata they can)
  const rolApp = user?.app_metadata?.role as string | undefined
  const role = acceso === 'previo'
    ? (rolApp === 'Administrador' || meta.role === 'Administrador' ? 'Dueño' : rolApp ?? meta.role ?? 'Administrador')
    : rolApp === 'Empleado' ? 'Administrador' : rolApp ?? 'Sin acceso'
  const tieneAcceso = acceso === 'previo' || acceso === 'si'

  return (
    <AuthContext.Provider value={{
      session, user, loading: loading || (!!session && acceso === 'cargando'), signOut,
      currentEmail: email,
      currentFirstName: firstName,
      currentInitials: initials,
      currentRole: role,
      currentBranch: meta.branch ?? meta.sucursal ?? '',
      isAdmin: tieneAcceso,
      esDueno: tieneAcceso && role === 'Dueño',
      tieneAcceso,
      falta2fa: acceso === 'dos_pasos',
      recargarAcceso: () => setRevision(r => r + 1),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
