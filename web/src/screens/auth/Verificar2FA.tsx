import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'

/** Second step after the password, for users who turned on two-step verification. */
export default function Verificar2FA() {
  const { currentEmail, signOut, recargarAcceso } = useAuth()
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [verificando, setVerificando] = useState(false)

  async function verificar() {
    if (codigo.length !== 6) { setError('Escribe los 6 dígitos que muestra tu aplicación de autenticación.'); return }
    setVerificando(true); setError('')
    const { data: f } = await supabase.auth.mfa.listFactors()
    const factor = f?.totp?.find(x => x.status === 'verified')
    if (!factor) { setError('No se encontró tu verificación en dos pasos. Cierra sesión y vuelve a entrar.'); setVerificando(false); return }
    const { error: e } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: codigo })
    setVerificando(false)
    if (e) { setError('Código incorrecto o vencido. Revisa que la hora de tu celular sea la correcta e inténtalo de nuevo.'); setCodigo(''); return }
    recargarAcceso()
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: 16 }}>
      <div className="card" style={{ maxWidth: 400, width: '100%', padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={30} color="var(--primary)" />
          </div>
        </div>
        <h1 className="h-display" style={{ fontSize: 26 }}>Verificación en dos pasos</h1>
        <p style={{ color: 'var(--ink2)', margin: 0, lineHeight: 1.5 }}>
          Abre tu aplicación de autenticación (Google Authenticator, Microsoft Authenticator…) y escribe el código de <strong>{currentEmail}</strong>.
        </p>
        <input className="field-i" value={codigo} inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6}
          onChange={e => { setCodigo(e.target.value.replace(/\D/g, '')); setError('') }} onKeyDown={e => e.key === 'Enter' && verificar()}
          placeholder="000000" style={{ fontSize: 26, letterSpacing: 8, textAlign: 'center', fontFamily: 'var(--font-mono)' }} />
        {error && <div style={{ color: 'var(--danger-ink)', fontSize: 13 }}>{error}</div>}
        <button className="btn primary" onClick={verificar} disabled={verificando}>{verificando ? 'Verificando…' : 'Verificar'}</button>
        <button className="btn" onClick={signOut}>Cerrar sesión</button>
      </div>
    </div>
  )
}
