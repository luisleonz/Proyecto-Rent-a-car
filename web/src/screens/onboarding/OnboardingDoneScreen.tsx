import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useAuth } from '../../state/auth'

export default function OnboardingDoneScreen() {
  const navigate = useNavigate()
  const { currentFirstName, currentRole, currentBranch } = useAuth()

  return (
    <div className="min-h-screen flex flex-col px-6 max-w-md mx-auto" style={{ backgroundColor: '#2D8A56' }}>
      <div className="flex-1 flex flex-col items-center justify-center pt-12">
        {/* Icon */}
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-7"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <CheckCircle size={52} className="text-white" />
        </div>

        <h1 className="font-bold font-serif text-white text-center mb-3" style={{ fontSize: 36, lineHeight: 1.2 }}>
          Bienvenido al<br />equipo, {currentFirstName}.
        </h1>
        <p className="text-sm font-sans text-center mb-8" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Tu cuenta está configurada y lista.
        </p>

        {/* Summary card */}
        <div className="w-full rounded-2xl p-5" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
          {[
            { label: 'Rol', value: currentRole },
            { label: 'Sucursal', value: currentBranch },
            { label: 'ID empleado', value: 'EMP-2024-047' },
            { label: 'Acceso admin', value: 'No' },
          ].map(({ label, value }, i, arr) => (
            <div key={label}>
              <div className="flex justify-between py-2">
                <span className="text-xs font-sans" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
                <span className="text-xs font-semibold font-sans text-white">{value}</span>
              </div>
              {i < arr.length - 1 && (
                <div className="h-px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate('/app/home', { replace: true })}
        className="w-full py-3.5 rounded-xl font-bold text-base mb-5 transition-opacity active:opacity-80"
        style={{ backgroundColor: 'white', color: '#2D8A56' }}
      >
        Entrar al panel
      </button>
    </div>
  )
}
