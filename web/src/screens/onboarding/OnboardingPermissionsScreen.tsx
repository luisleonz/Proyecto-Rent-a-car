import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, Info } from 'lucide-react'
import { useAuth } from '../../state/auth'

const ALLOWED = [
  'Ver y gestionar reservas del día',
  'Registrar entregas y devoluciones',
  'Consultar estado de vehículos',
  'Procesar pagos en efectivo',
  'Ver perfil de clientes',
]
const NOT_ALLOWED = [
  'Modificar tarifas o precios',
  'Agregar o eliminar vehículos',
  'Ver reportes financieros',
  'Gestionar cuentas de empleados',
]

export default function OnboardingPermissionsScreen() {
  const navigate = useNavigate()
  const { currentRole } = useAuth()

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto overflow-y-auto">
      <div className="flex items-center gap-2 px-2 pt-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-background">
          <ArrowLeft size={22} style={{ color: '#1E1E26' }} />
        </button>
        <div>
          <p className="text-base font-semibold font-sans" style={{ color: '#1E1E26' }}>Tus permisos</p>
          <p className="text-xs font-sans" style={{ color: '#838390' }}>Paso 2 de 4</p>
        </div>
      </div>

      <div className="flex gap-1 px-5 mt-2 mb-7">
        {[0,1,2,3].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ backgroundColor: i <= 1 ? '#2D8A56' : '#EAEAE4' }} />
        ))}
      </div>

      <div className="px-5 pb-8 flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif mb-1.5" style={{ color: '#1E1E26' }}>Lo que puedes hacer</h2>
          <p className="text-sm font-sans" style={{ color: '#585868' }}>
            Como {currentRole.toLowerCase()}, estos son tus accesos.
          </p>
        </div>

        {/* Allowed */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#E8F5EE' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#1A5231' }}>Permitido</p>
          {ALLOWED.map(item => (
            <div key={item} className="flex items-center gap-2 py-1.5">
              <Check size={14} style={{ color: '#2D8A56', flexShrink: 0 }} />
              <span className="text-xs font-sans" style={{ color: '#585868' }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Not allowed */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: '#FEEEEE', borderColor: 'rgba(192,64,64,0.3)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#C04040' }}>No disponible para tu rol</p>
          {NOT_ALLOWED.map(item => (
            <div key={item} className="flex items-center gap-2 py-1.5">
              <X size={14} style={{ color: '#C04040', flexShrink: 0 }} />
              <span className="text-xs font-sans" style={{ color: '#585868' }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="rounded-xl p-3 flex gap-2" style={{ backgroundColor: '#EEF2FF' }}>
          <Info size={16} style={{ color: '#4444AA', flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs font-sans leading-relaxed" style={{ color: '#585868' }}>
            Si necesitas acceso adicional, contacta al administrador de tu sucursal.
          </p>
        </div>

        <button
          onClick={() => navigate('/onboarding/tour')}
          className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-opacity active:opacity-80"
          style={{ backgroundColor: '#2D8A56' }}
        >
          Entendido, continuar
        </button>
      </div>
    </div>
  )
}
