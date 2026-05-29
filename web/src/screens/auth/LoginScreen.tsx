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
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
          <Car size={26} className="text-white" />
        </div>
        <span className="text-xl font-bold font-serif text-ink">Lucianos</span>
      </div>

      <h1 className="text-3xl font-bold font-serif text-ink mb-1.5">Iniciar sesión</h1>
      <p className="text-sm text-ink2 leading-5 mb-8">
        Ingresa el correo con el que tu administrador te registró.
      </p>

      {/* Email field */}
      <div className="relative mb-1">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Mail size={18} style={{ color: error ? '#C04040' : '#838390' }} />
        </div>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(null) }}
          onKeyDown={e => e.key === 'Enter' && onContinue()}
          placeholder="Correo electrónico"
          className="w-full pl-11 pr-4 py-3.5 border rounded-xl text-sm font-sans text-ink placeholder-ink4 outline-none transition-colors"
          style={{
            borderColor: error ? '#C04040' : email ? '#2D8A56' : '#EAEAE4',
            fontSize: 14,
          }}
        />
      </div>
      {error && <p className="text-xs mb-4" style={{ color: '#C04040' }}>{error}</p>}
      {!error && <div className="mb-4" />}

      <button
        onClick={onContinue}
        className="w-full py-3.5 rounded-xl text-white font-semibold text-base mb-8 transition-opacity active:opacity-80"
        style={{ backgroundColor: '#2D8A56' }}
      >
        Continuar
      </button>

      {/* Demo card */}
      <div className="rounded-xl p-4" style={{ backgroundColor: '#E8F5EE' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: '#1A5231' }}>Cuentas de prueba</p>
        <p className="font-mono text-xs mb-0.5" style={{ color: '#585868' }}>luciano@lucianos.com</p>
        <p className="text-xs mb-3 leading-4" style={{ color: '#838390' }}>→ tiene contraseña (usa cualquier contraseña de 6+ caracteres)</p>
        <p className="font-mono text-xs mb-0.5" style={{ color: '#585868' }}>esteban@lucianos.com</p>
        <p className="text-xs leading-4" style={{ color: '#838390' }}>→ primer ingreso, creará su contraseña</p>
      </div>
    </div>
  )
}
