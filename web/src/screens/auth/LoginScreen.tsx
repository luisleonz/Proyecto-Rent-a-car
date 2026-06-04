import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Mail, Car } from 'lucide-react'
import { useAuth } from '../../state/auth'

export default function LoginScreen() {
  const navigate  = useNavigate()
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (session) return <Navigate to="/app/home" replace />

  function onContinue() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) { setError('Ingresa tu correo electrónico'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError('Correo electrónico no válido'); return }
    setError(null)
    navigate(`/enter-password?email=${encodeURIComponent(trimmed)}`)
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
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Car size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink)', lineHeight: 1.1 }}>Lucianos</div>
            <div style={{ fontSize: 10.5, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--ink3)', marginTop: 2 }}>Rent · a · car</div>
          </div>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 30, fontWeight: 400,
          color: 'var(--ink)', margin: '0 0 8px',
          lineHeight: 1.15,
        }}>
          Iniciar sesión
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink3)', margin: '0 0 28px', lineHeight: 1.5 }}>
          Ingresa el correo con el que tu administrador te registró.
        </p>

        {/* Email field */}
        <div style={{ position: 'relative', marginBottom: error ? 6 : 20 }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Mail size={17} color={error ? 'var(--danger)' : 'var(--ink3)'} />
          </div>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && onContinue()}
            placeholder="Correo electrónico"
            autoComplete="email"
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '13px 14px 13px 44px',
              border: `1.5px solid ${error ? 'var(--danger)' : email ? 'var(--primary)' : 'var(--card-line)'}`,
              borderRadius: 12,
              fontSize: 14, fontFamily: 'var(--font-sans)',
              color: 'var(--ink)', background: 'var(--paper)',
              outline: 'none', transition: 'border-color 150ms',
            }}
          />
        </div>
        {error && (
          <p style={{ fontSize: 12, color: 'var(--danger)', margin: '0 0 16px 2px' }}>{error}</p>
        )}

        <button
          onClick={onContinue}
          className="btn primary"
          style={{ width: '100%', padding: '14px', fontSize: 15, justifyContent: 'center' }}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
