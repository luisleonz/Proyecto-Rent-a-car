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
  isAdmin: boolean
  tieneAcceso: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, loading: true,
  signOut: async () => {},
  currentEmail: '', currentFirstName: '', currentInitials: '',
  currentRole: '', currentBranch: '', isAdmin: false, tieneAcceso: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // 'previo' = the roles migration hasn't been run yet, so access works as before it
  const [acceso, setAcceso] = useState<'cargando' | 'previo' | 'si' | 'no'>('cargando')

  useEffect(() => {
    // Restore existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Keep in sync with Supabase auth events (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // The server decides access from the session token (refreshed after an admin grants it)
  useEffect(() => {
    if (!session) { setAcceso('cargando'); return }
    ;(supabase as any).rpc('es_empleado').then(({ data, error }: { data: boolean | null; error: { code?: string } | null }) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (error) setAcceso(error.code === 'PGRST202' || error.code === '42883' ? 'previo' : 'si')
      else setAcceso(data ? 'si' : 'no')
    })
  }, [session?.access_token])

  async function signOut() {
    await supabase.auth.signOut()
  }

  const user = session?.user ?? null
  const meta = user?.user_metadata ?? {}

  // Derive display info from metadata set when creating the user
  const email         = user?.email ?? ''
  const firstName     = meta.first_name ?? meta.nombre ?? email.split('@')[0] ?? ''
  const initials      = meta.initials  ?? firstName.slice(0, 2).toUpperCase()
  // Role lives in app_metadata, which users cannot edit themselves (user_metadata they can)
  const role          = acceso === 'previo'
    ? (meta.role ?? 'Empleado')
    : (user?.app_metadata?.role as string | undefined) ?? 'Sin acceso'
  const branch   = meta.branch ?? meta.sucursal ?? 'Polanco'
  const isAdmin  = role === 'Administrador'
  const tieneAcceso = acceso === 'previo' || acceso === 'si'

  return (
    <AuthContext.Provider value={{
      session, user, loading: loading || (!!session && acceso === 'cargando'), signOut,
      currentEmail: email,
      currentFirstName: firstName,
      currentInitials: initials,
      currentRole: role,
      currentBranch: branch,
      isAdmin,
      tieneAcceso,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
