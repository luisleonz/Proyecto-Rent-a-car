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

function AppLayout() {
  const location = useLocation()
  const hideNav = location.pathname.startsWith('/app/vehicles/') && location.pathname.split('/').length > 3

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: '#FAFAF7' }}>
      <Routes>
        <Route path="home" element={<HomeScreen />} />
        <Route path="reservations" element={<ReservationsScreen />} />
        <Route path="vehicles" element={<VehiclesScreen />} />
        <Route path="vehicles/:plate" element={<VehicleDetailScreen />} />
        <Route path="more" element={<MoreScreen />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Routes>
      {!hideNav && <BottomNav />}
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
