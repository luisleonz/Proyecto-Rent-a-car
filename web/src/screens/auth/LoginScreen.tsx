import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Car } from 'lucide-react'
import { sampleUsers } from '../../data/sampleData'
import { useAuth } from '../../state/auth'

export default function LoginScreen() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  function onContinue() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) { setError('Ingresa tu correo electrónico'); return }
    const user = sampleUsers.find(u => u.email === trimmed)
    if (!user) { setError('No encontramos una cuenta con ese correo'); return }
    setError(null)
    setUser(user)
    if (user.hasPassword) {
      navigate(`/enter-password?email=${encodeURIComponent(trimmed)}`)
    } else {
      navigate('/onboarding')
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-8 pb-6 max-w-md mx-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
          <Car size={26} className="text-white" />
        </div>
        <span className="text-xl font-bold font-serif" style={{ color: 'var(--ink)' }}>Lucianos</span>
      </div>

      <h1 className="text-3xl font-bold font-serif mb-1.5" style={{ color: 'var(--ink)' }}>Iniciar sesión</h1>
      <p className="text-sm leading-5 mb-8" style={{ color: 'var(--ink3)' }}>
        Ingresa el correo con el que tu administrador te registró.
      </p>

      {/* Email field */}
      <div className="relative mb-1">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Mail size={18} style={{ color: error ? 'var(--danger)' : 'var(--ink3)' }} />
        </div>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(null) }}
          onKeyDown={e => e.key === 'Enter' && onContinue()}
          placeholder="Correo electrónico"
          className="w-full pl-11 pr-4 py-3.5 border rounded-xl text-sm font-sans outline-none transition-colors"
          style={{
            borderColor: error ? 'var(--danger)' : email ? 'var(--primary)' : 'var(--card-line)',
            color: 'var(--ink)',
            fontSize: 14,
          }}
        />
      </div>
      {error && <p className="text-xs mb-4" style={{ color: 'var(--danger)' }}>{error}</p>}
      {!error && <div className="mb-4" />}

      <button
        onClick={onContinue}
        className="w-full py-3.5 rounded-xl text-white font-semibold text-base mb-8 transition-opacity active:opacity-80"
        style={{ background: 'var(--primary)' }}
      >
        Continuar
      </button>

      {/* Demo card */}
      <div className="rounded-xl p-4" style={{ background: 'var(--primary-soft)' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--primary-dark)' }}>Cuentas de prueba</p>
        <p className="font-mono text-xs mb-0.5" style={{ color: 'var(--ink2)' }}>luciano@lucianos.com</p>
        <p className="text-xs mb-3 leading-4" style={{ color: 'var(--ink3)' }}>→ tiene contraseña (usa cualquier contraseña de 6+ caracteres)</p>
        <p className="font-mono text-xs mb-0.5" style={{ color: 'var(--ink2)' }}>esteban@lucianos.com</p>
        <p className="text-xs leading-4" style={{ color: 'var(--ink3)' }}>→ primer ingreso, creará su contraseña</p>
      </div>
    </div>
  )
}
