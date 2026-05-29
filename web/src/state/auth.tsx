import { createContext, useContext, useState, ReactNode } from 'react'
import { AppUser } from '../data/sampleData'

interface AuthState {
  currentEmail: string
  currentFirstName: string
  currentInitials: string
  currentRole: string
  currentBranch: string
}

interface AuthContextType extends AuthState {
  setUser: (user: AppUser) => void
  clear: () => void
}

const defaultState: AuthState = {
  currentEmail: '',
  currentFirstName: '',
  currentInitials: '',
  currentRole: '',
  currentBranch: '',
}

const AuthContext = createContext<AuthContextType>({
  ...defaultState,
  setUser: () => {},
  clear: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(defaultState)

  function setUser(user: AppUser) {
    setState({
      currentEmail: user.email,
      currentFirstName: user.firstName,
      currentInitials: user.initials,
      currentRole: user.role,
      currentBranch: user.branch,
    })
  }

  function clear() {
    setState(defaultState)
  }

  return (
    <AuthContext.Provider value={{ ...state, setUser, clear }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
