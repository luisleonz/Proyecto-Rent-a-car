import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { AuthProvider } from './state/auth'
import BottomNav from './components/BottomNav'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'

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
import CotizacionesScreen from './screens/cotizaciones/CotizacionesScreen'
import { CajaTurnoScreen, CajaCierreScreen, CajaJustificacionScreen, CajaOkScreen } from './screens/caja/CajaFlow'
import { EntregaStep1Screen, EntregaStep2Screen, EntregaStep3Screen, EntregaOkScreen } from './screens/flows/EntregaFlow'
import { DevolucionStep1Screen, DevolucionStep2Screen, DevolucionStep3Screen, DevolucionOkScreen } from './screens/flows/DevolucionFlow'

const FLOW_PREFIXES = ['/app/caja', '/app/entrega', '/app/devolucion']

function AppLayout() {
  const location = useLocation()
  const isFlow = FLOW_PREFIXES.some(p => location.pathname.startsWith(p))
  const isVehicleDetail = location.pathname.startsWith('/app/vehicles/') && location.pathname.split('/').length > 3
  const showNav = !isFlow && !isVehicleDetail

  // Route → title/subtitle for mobile top bar
  const PAGE_INFO: Record<string, [string, string]> = {
    '/app/home':         ['Inicio', '12 movimientos hoy'],
    '/app/reservations': ['Reservas', '14 movimientos'],
    '/app/cotizaciones': ['Cotizaciones', 'Cotizador rápido'],
    '/app/vehicles':     ['Vehículos', '12 unidades'],
    '/app/more':         ['Ajustes', ''],
    '/app/caja':         ['Caja', '22 may · turno T1'],
  }
  const [title, sub] = PAGE_INFO[location.pathname] ?? ['', '']

  return (
    <div className="app">
      {showNav && <Sidebar />}
      {showNav && <TopBar />}
      <div className="main">
        {showNav && (
          <header className="mtop">
            <button className="iconbtn" style={{ width: 38, height: 38 }}><Menu size={19} /></button>
            <div className="grow">
              <div className="title">{title}</div>
              {sub && <div className="sub">{sub}</div>}
            </div>
          </header>
        )}
        <div className="content">
          <Routes>
            {/* Main tabs */}
            <Route path="home"              element={<HomeScreen />} />
            <Route path="reservations"      element={<ReservationsScreen />} />
            <Route path="cotizaciones"      element={<CotizacionesScreen />} />
            <Route path="vehicles"          element={<VehiclesScreen />} />
            <Route path="vehicles/:plate"   element={<VehicleDetailScreen />} />
            <Route path="more"              element={<MoreScreen />} />
            {/* Stub routes for sidebar items not yet built */}
            <Route path="clientes"          element={<ComingSoon title="Clientes" />} />
            <Route path="reportes"          element={<ComingSoon title="Reportes" />} />
            <Route path="empleados"         element={<ComingSoon title="Empleados" />} />
            {/* Caja / Turno */}
            <Route path="caja"              element={<CajaTurnoScreen />} />
            <Route path="caja/cierre"       element={<CajaCierreScreen />} />
            <Route path="caja/justificacion" element={<CajaJustificacionScreen />} />
            <Route path="caja/ok"           element={<CajaOkScreen />} />
            {/* Entrega flow */}
            <Route path="entrega/:resId/1"  element={<EntregaStep1Screen />} />
            <Route path="entrega/:resId/2"  element={<EntregaStep2Screen />} />
            <Route path="entrega/:resId/3"  element={<EntregaStep3Screen />} />
            <Route path="entrega/:resId/ok" element={<EntregaOkScreen />} />
            {/* Devolución flow */}
            <Route path="devolucion/:resId/1"  element={<DevolucionStep1Screen />} />
            <Route path="devolucion/:resId/2"  element={<DevolucionStep2Screen />} />
            <Route path="devolucion/:resId/3"  element={<DevolucionStep3Screen />} />
            <Route path="devolucion/:resId/ok" element={<DevolucionOkScreen />} />
            <Route path="*" element={<Navigate to="home" replace />} />
          </Routes>
        </div>
        {showNav && <BottomNav />}
      </div>
    </div>
  )
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="stub">
      <div className="stub-card">
        <h2>{title}</h2>
        <p>Esta sección estará disponible próximamente.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"                     element={<LoginScreen />} />
        <Route path="/enter-password"       element={<EnterPasswordScreen />} />
        <Route path="/onboarding"           element={<OnboardingWelcomeScreen />} />
        <Route path="/onboarding/password"  element={<OnboardingPasswordScreen />} />
        <Route path="/onboarding/permissions" element={<OnboardingPermissionsScreen />} />
        <Route path="/onboarding/tour"      element={<OnboardingTourScreen />} />
        <Route path="/onboarding/done"      element={<OnboardingDoneScreen />} />
        <Route path="/app/*"                element={<AppLayout />} />
        <Route path="*"                     element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
