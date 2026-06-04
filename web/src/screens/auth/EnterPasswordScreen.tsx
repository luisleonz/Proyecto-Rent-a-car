import { useState } from 'react'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { ArrowLeft, Lock, Eye, EyeOff, Car } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'

export default function EnterPasswordScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = decodeURIComponent(params.get('email') ?? '')
  const { session } = useAuth()

  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)

  // Already authenticated — go to app
  if (session) return <Navigate to="/app/home" replace />

  // No email in URL — back to login
  if (!email) return <Navigate to="/" replace />

  async function onLogin() {
    if (!password) { setError('Ingresa tu contraseña'); return }
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError('Correo o contraseña incorrectos')
    }
    // On success, onAuthStateChange fires → session updates → Navigate above redirects to /app/home
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--card)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-pop)',
        padding: '44px 40px',
        position: 'relative',
      }}>
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 16, left: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 8, borderRadius: 8, color: 'var(--ink3)',
            display: 'flex', alignItems: 'center',
          }}
        >
          <ArrowLeft size={20} />
        </button>

        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, marginTop: 8 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'var(--primary-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Car size={32} color="var(--primary)" />
          </div>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 26, fontWeight: 400,
          color: 'var(--ink)', margin: '0 0 6px',
          textAlign: 'center',
        }}>
          Bienvenido
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink3)', margin: '0 0 28px', textAlign: 'center' }}>
          {email}
        </p>

        {/* Password field */}
        <div style={{ position: 'relative', marginBottom: error ? 6 : 20 }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Lock size={17} color={error ? 'var(--danger)' : 'var(--ink3)'} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && onLogin()}
            placeholder="Contraseña"
            autoFocus
            autoComplete="current-password"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '13px 48px 13px 44px',
              border: `1.5px solid ${error ? 'var(--danger)' : password ? 'var(--primary)' : 'var(--card-line)'}`,
              borderRadius: 12,
              fontSize: 14, fontFamily: 'var(--font-sans)',
              color: 'var(--ink)', background: 'var(--paper)',
              outline: 'none', transition: 'border-color 150ms',
            }}
          />
          <button
            onClick={() => setShowPassword(v => !v)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, color: 'var(--ink3)', display: 'flex', alignItems: 'center',
            }}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {error && (
          <p style={{ fontSize: 12, color: 'var(--danger)', margin: '0 0 16px 2px' }}>{error}</p>
        )}

        <button
          onClick={onLogin}
          disabled={loading}
          className="btn primary"
          style={{ width: '100%', padding: '14px', fontSize: 15, justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink4)', marginTop: 18, lineHeight: 1.5 }}>
          ¿Olvidaste tu contraseña?<br />Contacta al administrador del sistema.
        </p>
      </div>
    </div>
  )
}
