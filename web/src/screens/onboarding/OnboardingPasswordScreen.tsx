import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Info } from 'lucide-react'

function req(met: boolean, text: string) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="w-3.5 h-3.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: met ? '#2D8A56' : '#BCBCC4' }} />
      <span className="text-xs font-sans" style={{ color: met ? '#2D8A56' : '#838390' }}>{text}</span>
    </div>
  )
}

export default function OnboardingPasswordScreen() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showP, setShowP] = useState(false)
  const [showC, setShowC] = useState(false)
  const [twoFactor, setTwoFactor] = useState(true)

  const hasLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasMatch = password === confirm && password.length > 0

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-3 pb-0">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-background">
          <ArrowLeft size={22} style={{ color: '#1E1E26' }} />
        </button>
        <div>
          <p className="text-base font-semibold font-sans" style={{ color: '#1E1E26' }}>Tu contraseña</p>
          <p className="text-xs font-sans" style={{ color: '#838390' }}>Paso 1 de 4</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1 px-5 mt-2 mb-7">
        {[0,1,2,3].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ backgroundColor: i === 0 ? '#2D8A56' : '#EAEAE4' }} />
        ))}
      </div>

      <div className="px-5 pb-8 flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif mb-1.5" style={{ color: '#1E1E26' }}>Crea tu contraseña</h2>
          <p className="text-sm font-sans" style={{ color: '#585868' }}>Será la que usarás para entrar a Lucianos cada vez.</p>
        </div>

        {/* Password */}
        <div className="relative">
          <input
            type={showP ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Nueva contraseña"
            className="w-full px-4 pr-12 py-3.5 border rounded-xl text-sm font-sans text-ink outline-none"
            style={{ borderColor: password ? '#2D8A56' : '#EAEAE4' }}
          />
          <button onClick={() => setShowP(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2">
            {showP ? <EyeOff size={18} style={{ color: '#838390' }} /> : <Eye size={18} style={{ color: '#838390' }} />}
          </button>
        </div>

        {/* Confirm */}
        <div className="relative">
          <input
            type={showC ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Confirmar contraseña"
            className="w-full px-4 pr-12 py-3.5 border rounded-xl text-sm font-sans text-ink outline-none"
            style={{ borderColor: confirm ? '#2D8A56' : '#EAEAE4' }}
          />
          <button onClick={() => setShowC(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2">
            {showC ? <EyeOff size={18} style={{ color: '#838390' }} /> : <Eye size={18} style={{ color: '#838390' }} />}
          </button>
        </div>

        {/* Requirements */}
        <div className="rounded-xl p-4" style={{ backgroundColor: '#E8F5EE' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#1A5231' }}>Requisitos</p>
          {req(hasLength, 'Mínimo 8 caracteres')}
          {req(hasUpper, 'Al menos una mayúscula')}
          {req(hasNumber, 'Al menos un número')}
          {req(hasMatch, 'Las contraseñas coinciden')}
        </div>

        {/* 2FA toggle */}
        <div className="rounded-xl border border-hairline p-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold font-sans" style={{ color: '#1E1E26' }}>Verificación en 2 pasos</p>
            <p className="text-xs font-sans" style={{ color: '#838390' }}>Recomendado para mayor seguridad</p>
          </div>
          <button
            onClick={() => setTwoFactor(v => !v)}
            className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors"
            style={{ backgroundColor: twoFactor ? '#2D8A56' : '#BCBCC4' }}
          >
            <span
              className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5"
              style={{ transform: twoFactor ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
        </div>

        {/* Warning */}
        <div className="rounded-xl p-3 flex gap-2" style={{ backgroundColor: '#FEF8EC' }}>
          <Info size={16} style={{ color: '#C98A20', flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs font-sans leading-relaxed" style={{ color: '#585868' }}>
            Esta contraseña es personal. No la compartas con nadie, ni con el administrador.
          </p>
        </div>

        <button
          onClick={() => navigate('/onboarding/permissions')}
          className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-opacity active:opacity-80"
          style={{ backgroundColor: '#2D8A56' }}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
