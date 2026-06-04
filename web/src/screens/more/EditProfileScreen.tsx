import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'

export default function EditProfileScreen() {
  const navigate  = useNavigate()
  const { user, currentFirstName, currentEmail, currentRole, currentBranch } = useAuth()

  const meta = user?.user_metadata ?? {}

  const [firstName, setFirstName] = useState(meta.first_name ?? meta.nombre ?? currentFirstName)
  const [lastName,  setLastName]  = useState(meta.last_name  ?? meta.apellido ?? '')
  const [phone,     setPhone]     = useState(meta.phone      ?? meta.telefono ?? '')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState('')

  async function handleSave() {
    if (!firstName.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError('')

    const initials = [firstName.trim(), lastName.trim()]
      .filter(Boolean)
      .map(s => s[0].toUpperCase())
      .join('')
      .slice(0, 2) || firstName.slice(0, 2).toUpperCase()

    const { error: err } = await supabase.auth.updateUser({
      data: {
        first_name: firstName.trim(),
        nombre:     firstName.trim(),
        last_name:  lastName.trim()  || null,
        apellido:   lastName.trim()  || null,
        phone:      phone.trim()     || null,
        telefono:   phone.trim()     || null,
        initials,
      },
    })

    setSaving(false)
    if (err) { setError(err.message); return }

    setSaved(true)
    setTimeout(() => { setSaved(false); navigate(-1) }, 1200)
  }

  return (
    <div className="screen" style={{ maxWidth: 540, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px', color: 'var(--ink2)', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={22} />
        </button>
        <div>
          <div className="eyebrow">Cuenta</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(22px, 3cqw, 32px)', margin: 0 }}>Editar perfil</h1>
        </div>
      </div>

      <div className="card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Avatar preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
          <div className="avatar accent" style={{ width: 56, height: 56, fontSize: 18, flexShrink: 0 }}>
            {[firstName, lastName].filter(Boolean).map(s => s[0].toUpperCase()).join('').slice(0, 2) || '??'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{firstName || '—'} {lastName}</div>
            <div style={{ fontSize: 13, color: 'var(--ink3)' }}>{currentEmail}</div>
            <div style={{ fontSize: 12, marginTop: 3 }}>
              <span style={{
                padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: currentRole === 'Administrador' ? 'var(--primary-soft)' : 'var(--paper-alt)',
                color: currentRole === 'Administrador' ? 'var(--primary)' : 'var(--ink2)',
              }}>
                {currentRole || 'Empleado'}
              </span>
              {currentBranch && (
                <span style={{ marginLeft: 6, color: 'var(--ink3)', fontSize: 12 }}>{currentBranch}</span>
              )}
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="field">
          <label className="field-l">Nombre <span style={{ color: '#c0392b' }}>*</span></label>
          <input
            className="field-i"
            placeholder="Tu nombre"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="field">
          <label className="field-l">Apellido <span style={{ color: 'var(--ink3)', fontWeight: 400 }}>(opcional)</span></label>
          <input
            className="field-i"
            placeholder="Tu apellido"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-l">WhatsApp / Teléfono <span style={{ color: 'var(--ink3)', fontWeight: 400 }}>(opcional)</span></label>
          <input
            className="field-i"
            placeholder="+52 55 1234 5678"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            inputMode="tel"
          />
        </div>

        {/* Read-only info */}
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Información de cuenta
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--ink2)' }}>Correo</span>
              <span style={{ color: 'var(--ink)' }}>{currentEmail}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--ink2)' }}>Rol</span>
              <span style={{ color: 'var(--ink)' }}>{currentRole || 'Empleado'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--ink2)' }}>Sucursal</span>
              <span style={{ color: 'var(--ink)' }}>{currentBranch || '—'}</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 10 }}>
            El correo, rol y sucursal son gestionados por el administrador.
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ fontSize: 13, color: '#c0392b', padding: '8px 12px', borderRadius: 8, background: 'oklch(96% 0.03 20)' }}>
            {error}
          </div>
        )}

        {/* Save button */}
        <button
          className={`btn primary${saved ? ' is-sent' : ''}`}
          style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '11px 0' }}
          onClick={handleSave}
          disabled={saving || saved}
        >
          {saved
            ? <><Check size={16} />Guardado</>
            : saving
              ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Guardando…</>
              : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
