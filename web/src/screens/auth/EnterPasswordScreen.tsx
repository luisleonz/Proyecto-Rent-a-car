import { useState } from 'react'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { ArrowLeft, Lock, Eye, EyeOff, Car } from 'lucide-react'
import { supabase, rutaTrasSesion } from '../../lib/supabase'
import { useAuth } from '../../state/auth'

function mensajeDeError(e: { message: string; code?: string; status?: number; name?: string }) {
  if (e.code === 'invalid_credentials') return 'Correo o contraseña incorrectos'
  if (e.code === 'email_not_confirmed') return 'Este correo no ha sido confirmado. Confírmalo en Supabase → Authentication → Users.'
  if (e.code === 'email_provider_disabled') return 'El inicio de sesión con correo está desactivado en Supabase (Authentication → Sign In / Providers → Email).'
  if (e.code === 'user_banned') return 'Este usuario está bloqueado en Supabase.'
  if (e.code === 'over_request_rate_limit' || e.status === 429) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
  if (e.name === 'AuthRetryableFetchError' || !e.status || e.status >= 500)
    return 'No se pudo conectar con el servidor. Revisa tu internet o que el proyecto de Supabase esté activo (no pausado).'
  return `No se pudo iniciar sesión: ${e.message}`
}

export default function EnterPasswordScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = decodeURIComponent(params.get('email') ?? '')
  const { session } = useAuth()

  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [aviso, setAviso]             = useState<string | null>(null)

  // Already authenticated — go to app
  if (session) return <Navigate to={rutaTrasSesion()} replace />

  // No email in URL — back to login
  if (!email) return <Navigate to="/" replace />

  async function onOlvide() {
    setError(null); setAviso(null)
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` })
    if (e) setError(e.status === 429 ? 'Ya se envió un correo hace poco. Espera unos minutos e inténtalo de nuevo.' : mensajeDeError(e))
    else setAviso(`Te enviamos un correo a ${email} con un enlace para crear una nueva contraseña.`)
  }

  async function onLogin() {
    if (!password) { setError('Ingresa tu contraseña'); return }
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) setError(mensajeDeError(authError))
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

        {aviso && (
          <p style={{ fontSize: 13, color: 'var(--primary-dark)', background: 'var(--primary-soft)', borderRadius: 10, padding: '10px 12px', marginTop: 16, lineHeight: 1.45 }}>{aviso}</p>
        )}
        <button onClick={onOlvide}
          style={{ display: 'block', margin: '18px auto 0', background: 'none', border: 0, cursor: 'pointer', fontSize: 13, color: 'var(--primary)', fontWeight: 600, fontFamily: 'inherit' }}>
          ¿Olvidaste tu contraseña?
        </button>
      </div>
    </div>
  )
}
