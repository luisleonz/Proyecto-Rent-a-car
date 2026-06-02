import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './state/auth'
import BottomNav from './components/BottomNav'

import LoginScreen from './screens/auth/LoginScreen'
import EnterPasswordScreen from './screens/auth/EnterPasswordScreen'
import OnboardingWelcomeScreen from './screens/onboarding/OnboardingWelcomeScreen'
import OnboardingPasswordScreen from './screens/onboarding/OnboardingPasswordScreen'
import OnboardingPermissionsScreen from './screens/onboarding/OnboardingPermissionsScreen'
import OnboardingTourScreen from './screens/onboarding/OnboardingTourScreen'
import OnboardingDoneScreen from './screens/onboarding/OnboardingDoneScreen'
import HomeScreen from './screens/home/HomeScreen'
import ReservationsScreen from './screens/reservations/ReservationsScreen'
import VehiclesScreen from './screens/vehicles/VehiclesScreen'
import VehicleDetailScreen from './screens/vehicles/VehicleDetailScreen'
import MoreScreen from './screens/more/MoreScreen'
import { CajaTurnoScreen, CajaCierreScreen, CajaJustificacionScreen, CajaOkScreen } from './screens/caja/CajaFlow'
import { EntregaStep1Screen, EntregaStep2Screen, EntregaStep3Screen, EntregaOkScreen } from './screens/flows/EntregaFlow'
import { DevolucionStep1Screen, DevolucionStep2Screen, DevolucionStep3Screen, DevolucionOkScreen } from './screens/flows/DevolucionFlow'

const FLOW_PREFIXES = ['/app/caja', '/app/entrega', '/app/devolucion']

function AppLayout() {
  const location = useLocation()
  const isFlow = FLOW_PREFIXES.some(p => location.pathname.startsWith(p))
  const isVehicleDetail = location.pathname.startsWith('/app/vehicles/') && location.pathname.split('/').length > 3

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: '#FAFAF7' }}>
      <Routes>
        {/* Main tabs */}
        <Route path="home" element={<HomeScreen />} />
        <Route path="reservations" element={<ReservationsScreen />} />
        <Route path="vehicles" element={<VehiclesScreen />} />
        <Route path="vehicles/:plate" element={<VehicleDetailScreen />} />
        <Route path="more" element={<MoreScreen />} />
        {/* Caja / Turno */}
        <Route path="caja" element={<CajaTurnoScreen />} />
        <Route path="caja/cierre" element={<CajaCierreScreen />} />
        <Route path="caja/justificacion" element={<CajaJustificacionScreen />} />
        <Route path="caja/ok" element={<CajaOkScreen />} />
        {/* Entrega flow */}
        <Route path="entrega/:resId/1" element={<EntregaStep1Screen />} />
        <Route path="entrega/:resId/2" element={<EntregaStep2Screen />} />
        <Route path="entrega/:resId/3" element={<EntregaStep3Screen />} />
        <Route path="entrega/:resId/ok" element={<EntregaOkScreen />} />
        {/* Devolución flow */}
        <Route path="devolucion/:resId/1" element={<DevolucionStep1Screen />} />
        <Route path="devolucion/:resId/2" element={<DevolucionStep2Screen />} />
        <Route path="devolucion/:resId/3" element={<DevolucionStep3Screen />} />
        <Route path="devolucion/:resId/ok" element={<DevolucionOkScreen />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Routes>
      {!isFlow && !isVehicleDetail && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/enter-password" element={<EnterPasswordScreen />} />
        <Route path="/onboarding" element={<OnboardingWelcomeScreen />} />
        <Route path="/onboarding/password" element={<OnboardingPasswordScreen />} />
        <Route path="/onboarding/permissions" element={<OnboardingPermissionsScreen />} />
        <Route path="/onboarding/tour" element={<OnboardingTourScreen />} />
        <Route path="/onboarding/done" element={<OnboardingDoneScreen />} />
        <Route path="/app/*" element={<AppLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
