import { useNavigate } from 'react-router-dom'
import { Car } from 'lucide-react'
import { useAuth } from '../../state/auth'

const STEPS = ['Crear tu contraseña', 'Revisar tus permisos', 'Conocer la app', 'Listo para trabajar']

export default function OnboardingWelcomeScreen() {
  const navigate = useNavigate()
  const { currentFirstName } = useAuth()

  return (
    <div className="min-h-screen flex flex-col px-6 pt-8 max-w-md mx-auto" style={{ backgroundColor: '#1A5231' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2D8A56' }}>
          <Car size={26} className="text-white" />
        </div>
        <span className="text-xl font-bold font-serif text-white">Lucianos</span>
      </div>

      {/* Hero text */}
      <h1 className="font-bold font-serif text-white mb-8" style={{ fontSize: 40, lineHeight: 1.15 }}>
        Hola {currentFirstName},<br />vamos a configurar<br />tu acceso.
      </h1>

      {/* Steps */}
      <div className="flex flex-col gap-4 mb-auto">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0 text-white text-sm font-bold"
              style={{ width: 28, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              {i + 1}
            </div>
            <span className="text-sm font-sans" style={{ color: 'rgba(255,255,255,0.85)' }}>{step}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/onboarding/password')}
        className="w-full py-3.5 rounded-xl font-semibold text-base mt-10 mb-6 transition-opacity active:opacity-80"
        style={{ backgroundColor: 'white', color: '#1A5231' }}
      >
        Empezar configuración
      </button>
    </div>
  )
}
