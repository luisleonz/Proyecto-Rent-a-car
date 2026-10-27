import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { AuthProvider, useAuth } from './state/auth'
import { supabase } from './lib/supabase'
import BottomNav from './components/BottomNav'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import AvisoVersion from './components/AvisoVersion'

import LoginScreen from './screens/auth/LoginScreen'
import EnterPasswordScreen from './screens/auth/EnterPasswordScreen'
import CrearContrasenaScreen from './screens/auth/CrearContrasenaScreen'
import HomeScreen from './screens/home/HomeScreen'
import ReservationsScreen from './screens/reservations/ReservationsScreen'

// Loaded on first visit so the app opens faster on phones
const VehiclesScreen        = lazy(() => import('./screens/vehicles/VehiclesScreen'))
const VehicleDetailScreen   = lazy(() => import('./screens/vehicles/VehicleDetailScreen'))
const MoreScreen            = lazy(() => import('./screens/more/MoreScreen'))
const CotizacionesScreen    = lazy(() => import('./screens/cotizaciones/CotizacionesScreen'))
const CajaScreen            = lazy(() => import('./screens/caja/CajaScreen'))
const ClientesScreen        = lazy(() => import('./screens/clientes/ClientesScreen'))
const ReportesScreen        = lazy(() => import('./screens/reportes/ReportesScreen'))
const EmpleadosScreen       = lazy(() => import('./screens/empleados/EmpleadosScreen'))
const AutorizacionesScreen  = lazy(() => import('./screens/autorizaciones/AutorizacionesScreen'))
const EditProfileScreen     = lazy(() => import('./screens/more/EditProfileScreen'))
const ContratoPrint         = lazy(() => import('./screens/print/ContratoPrint'))
const CalendarioScreen      = lazy(() => import('./screens/calendario/CalendarioScreen'))
const EntregaScreen         = lazy(() => import('./screens/flows/EntregaScreen'))
const DevolucionScreen      = lazy(() => import('./screens/flows/DevolucionScreen'))
const DisponiblesScreen     = lazy(() => import('./screens/publico/DisponiblesScreen'))

const Cargando = () => (
  <div style={{ minHeight: '50dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
)

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading, tieneAcceso } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
      <div className="spinner" />
    </div>
  )
  if (!session) return <Navigate to="/" replace />
  if (!tieneAcceso) return <SinAcceso />
  return <>{children}</>
}

function SinAcceso() {
  const { currentEmail, signOut } = useAuth()
  const [revisando, setRevisando] = useState(false)
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: 16 }}>
      <div className="card" style={{ maxWidth: 420, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h1 className="h-display" style={{ fontSize: 26 }}>Tu cuenta aún no tiene acceso</h1>
        <p style={{ color: 'var(--ink2)', margin: 0, lineHeight: 1.5 }}>
          Iniciaste sesión como <strong>{currentEmail}</strong>. Pide al administrador que active tu cuenta en la pantalla de Empleados y luego toca “Ya me dieron acceso”.
        </p>
        <button className="btn primary" disabled={revisando}
          onClick={async () => { setRevisando(true); await supabase.auth.refreshSession(); setRevisando(false) }}>
          {revisando ? 'Revisando…' : 'Ya me dieron acceso'}
        </button>
        <button className="btn" onClick={signOut}>Cerrar sesión</button>
      </div>
    </div>
  )
}

function SoloAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth()
  return isAdmin ? <>{children}</> : <Navigate to="/app/home" replace />
}

const PAGE_INFO: Record<string, string> = {
  '/app/home': 'Inicio', '/app/reservations': 'Reservas', '/app/cotizaciones': 'Cotizaciones', '/app/calendario': 'Calendario',
  '/app/vehicles': 'Vehículos', '/app/clientes': 'Clientes', '/app/caja': 'Caja', '/app/reportes': 'Reportes',
  '/app/empleados': 'Empleados', '/app/autorizaciones': 'Autorizaciones', '/app/more': 'Ajustes',
}

function AppLayout() {
  const location = useLocation()
  const [sideOpen, setSideOpen] = useState(false)

  useEffect(() => { setSideOpen(false) }, [location.pathname])

  return (
    <div className="app">
      <Sidebar isOpen={sideOpen} onClose={() => setSideOpen(false)} />
      {sideOpen && (
        <div onClick={() => setSideOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 38, background: 'rgba(0,0,0,0.38)' }} />
      )}
      <TopBar />
      <div className="main">
        <header className="mtop">
          <button className="iconbtn" style={{ width: 38, height: 38 }} onClick={() => setSideOpen(v => !v)} aria-label="Menú">
            <Menu size={19} />
          </button>
          <div className="grow"><div className="title">{PAGE_INFO[location.pathname] ?? ''}</div></div>
        </header>
        <div className="content">
          <Suspense fallback={<Cargando />}>
            <Routes>
              <Route path="home"                 element={<HomeScreen />} />
              <Route path="reservations"         element={<ReservationsScreen />} />
              <Route path="cotizaciones"         element={<CotizacionesScreen />} />
              <Route path="calendario"           element={<CalendarioScreen />} />
              <Route path="vehicles"             element={<VehiclesScreen />} />
              <Route path="vehicles/:plate"      element={<VehicleDetailScreen />} />
              <Route path="clientes"             element={<ClientesScreen />} />
              <Route path="caja"                 element={<CajaScreen />} />
              <Route path="entrega/:resId/*"     element={<EntregaScreen />} />
              <Route path="devolucion/:resId/*"  element={<DevolucionScreen />} />
              <Route path="reportes"             element={<SoloAdmin><ReportesScreen /></SoloAdmin>} />
              <Route path="empleados"            element={<SoloAdmin><EmpleadosScreen /></SoloAdmin>} />
              <Route path="autorizaciones"       element={<SoloAdmin><AutorizacionesScreen /></SoloAdmin>} />
              <Route path="more"                 element={<MoreScreen />} />
              <Route path="edit-profile"         element={<EditProfileScreen />} />
              <Route path="*" element={<Navigate to="home" replace />} />
            </Routes>
          </Suspense>
        </div>
        <BottomNav />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AvisoVersion />
      <Suspense fallback={<Cargando />}>
        <Routes>
          <Route path="/"                         element={<LoginScreen />} />
          <Route path="/enter-password"           element={<EnterPasswordScreen />} />
          <Route path="/crear-contrasena"         element={<CrearContrasenaScreen />} />
          <Route path="/disponibles"              element={<DisponiblesScreen />} />
          <Route path="/app/*"                    element={<RequireAuth><AppLayout /></RequireAuth>} />
          <Route path="/imprimir/contrato/:resId" element={<RequireAuth><ContratoPrint /></RequireAuth>} />
          <Route path="*"                         element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
