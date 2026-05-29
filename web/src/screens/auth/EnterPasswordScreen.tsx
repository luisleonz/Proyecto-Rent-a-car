import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react'
import { sampleUsers } from '../../data/sampleData'
import AvatarCircle from '../../components/AvatarCircle'

export default function EnterPasswordScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = decodeURIComponent(params.get('email') ?? '')
  const user = sampleUsers.find(u => u.email === email)

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onLogin() {
    if (password.length < 6) { setError('Contraseña incorrecta'); return }
    navigate('/app/home', { replace: true })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
      {/* Back button */}
      <div className="px-2 pt-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-background transition-colors"
        >
          <ArrowLeft size={22} style={{ color: '#1E1E26' }} />
        </button>
      </div>

      <div className="px-6 flex-1">
        <AvatarCircle initials={user?.initials ?? '?'} size={60} />

        <div className="mt-4 mb-2">
          <h1 className="text-2xl font-bold font-serif" style={{ color: '#1E1E26' }}>
            Hola, {user?.firstName ?? ''}
          </h1>
        </div>
        <p className="text-sm mb-8" style={{ color: '#838390' }}>{email}</p>

        {/* Password field */}
        <div className="relative mb-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Lock size={18} style={{ color: '#838390' }} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && onLogin()}
            placeholder="Contraseña"
            className="w-full pl-11 pr-12 py-3.5 border rounded-xl text-sm font-sans text-ink outline-none transition-colors"
            style={{ borderColor: error ? '#C04040' : password ? '#2D8A56' : '#EAEAE4' }}
          />
          <button
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
          >
            {showPassword
              ? <EyeOff size={18} style={{ color: '#838390' }} />
              : <Eye size={18} style={{ color: '#838390' }} />}
          </button>
        </div>
        {error && <p className="text-xs mb-4" style={{ color: '#C04040' }}>{error}</p>}
        {!error && <div className="mb-4" />}

        <button
          onClick={onLogin}
          className="w-full py-3.5 rounded-xl text-white font-semibold text-base mb-3 transition-opacity active:opacity-80"
          style={{ backgroundColor: '#2D8A56' }}
        >
          Iniciar sesión
        </button>

        <button className="w-full py-2 text-sm text-center" style={{ color: '#585868' }}>
          ¿Olvidaste tu contraseña? Contacta al administrador
        </button>
      </div>
    </div>
  )
}
