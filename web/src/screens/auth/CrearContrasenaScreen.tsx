import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, Car, User } from 'lucide-react'
import { supabase, enlaceAtendido } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { mensajeContrasena, identificador } from '../../lib/usuarios'
import ReglasContrasena from '../../components/ReglasContrasena'

const inputStyle = (activo: boolean): React.CSSProperties => ({
  width: '100%', boxSizing: 'border-box', padding: '13px 44px 13px 44px',
  border: `1.5px solid ${activo ? 'var(--primary)' : 'var(--card-line)'}`, borderRadius: 12,
  fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--ink)', background: 'var(--paper)', outline: 'none',
})
const icono: React.CSSProperties = { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }

export default function CrearContrasenaScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const recuperar = params.get('modo') === 'recuperar'
  // Signed in with a temporary password the owner assigned: must choose a personal one
  const temporal = params.get('modo') === 'temporal'
  const { session, user, loading } = useAuth()
  const [nombre, setNombre] = useState('')
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const coincide = pass.length > 0 && pass === confirm

  async function guardar() {
    const problema = mensajeContrasena(pass)
    if (problema) { setError(problema); return }
    if (!coincide) { setError('Las contraseñas no coinciden'); return }
    setGuardando(true); setError(null)
    const { error: e } = await supabase.auth.updateUser({
      password: pass,
      data: { debe_cambiar: false, ...(nombre.trim() ? { first_name: nombre.trim() } : {}) },
    })
    setGuardando(false)
    if (e) {
      setError(e.code === 'same_password' ? 'Esa es tu contraseña actual; escribe una diferente.'
        : e.code === 'weak_password' ? 'La contraseña es muy débil; usa una más larga o con números.'
        : `No se pudo guardar: ${e.message}`)
      return
    }
    enlaceAtendido()
    navigate('/app/home', { replace: true })
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-pop)', padding: '40px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Car size={32} color="var(--primary)" />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><div className="spinner" /></div>
        ) : !session ? (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, textAlign: 'center', margin: '0 0 10px' }}>Enlace no válido</h1>
            <p style={{ fontSize: 14, color: 'var(--ink3)', textAlign: 'center', lineHeight: 1.5, margin: '0 0 22px' }}>
              El enlace del correo ya expiró o ya se usó. Pide una nueva invitación al administrador, o en la pantalla de inicio usa “¿Olvidaste tu contraseña?”.
            </p>
            <button className="btn primary" style={{ width: '100%' }} onClick={() => navigate('/', { replace: true })}>Ir a iniciar sesión</button>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, textAlign: 'center', margin: '0 0 6px' }}>
              {recuperar ? 'Nueva contraseña' : temporal ? 'Crea tu contraseña personal' : 'Crea tu contraseña'}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink3)', textAlign: 'center', margin: '0 0 24px' }}>
              {identificador(user?.email)}
              {temporal && <><br />Entraste con una contraseña temporal. Elige una que solo tú conozcas.</>}
            </p>

            {!recuperar && !temporal && (
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <div style={icono}><User size={17} color="var(--ink3)" /></div>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre (opcional)" autoComplete="given-name" style={inputStyle(!!nombre)} />
              </div>
            )}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div style={icono}><Lock size={17} color="var(--ink3)" /></div>
              <input type={ver ? 'text' : 'password'} value={pass} onChange={e => { setPass(e.target.value); setError(null) }}
                placeholder="Contraseña nueva" autoComplete="new-password" autoFocus style={inputStyle(!!pass)} />
              <button type="button" onClick={() => setVer(v => !v)} aria-label="Mostrar contraseña"
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink3)', display: 'flex' }}>
                {ver ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div style={icono}><Lock size={17} color="var(--ink3)" /></div>
              <input type={ver ? 'text' : 'password'} value={confirm} onChange={e => { setConfirm(e.target.value); setError(null) }}
                onKeyDown={e => e.key === 'Enter' && guardar()} placeholder="Repite la contraseña" autoComplete="new-password" style={inputStyle(!!confirm)} />
            </div>

            <div style={{ margin: '4px 2px 16px' }}>
              <ReglasContrasena pass={pass} extra={[[coincide, 'Las dos contraseñas coinciden']]} />
            </div>

            {error && <p style={{ fontSize: 12.5, color: 'var(--danger)', margin: '0 0 14px 2px' }}>{error}</p>}

            <button className="btn primary" onClick={guardar} disabled={guardando}
              style={{ width: '100%', padding: 14, fontSize: 15, opacity: guardando ? 0.7 : 1 }}>
              {guardando ? 'Guardando…' : 'Guardar y entrar'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
