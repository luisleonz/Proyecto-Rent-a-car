export interface AppUser {
  email: string
  name: string
  firstName: string
  role: string
  branch: string
  hasPassword: boolean
  initials: string
}

export interface Reservation {
  id: string
  time: string
  type: string
  clientName: string
  vehicle: string
  clientInitials: string
  status?: string
}

export interface Vehicle {
  plate: string
  model: string
  year: string
  color: string
  tone?: string
  status: string
  km: string
  currentClient?: string
  clientInfo?: string
  fuel?: number
  transmission?: 'Aut.' | 'Man.'
  segment?: string
  dailyRate?: number
}

export interface DailyKpi {
  incomeToday: string
  incomeChange: string
  rented: number
  total: number
  deliveries: number
  inWorkshop: number
}

export const sampleUsers: AppUser[] = [
  { email: 'luciano@lucianos.com', name: 'Luciano Ortega', firstName: 'Luciano', role: 'Administrador', branch: 'Polanco', hasPassword: true, initials: 'LO' },
  { email: 'esteban@lucianos.com', name: 'Esteban Ruiz', firstName: 'Esteban', role: 'Mostrador', branch: 'Polanco', hasPassword: false, initials: 'ER' },
  { email: 'maria@lucianos.com', name: 'María González', firstName: 'María', role: 'Mostrador', branch: 'Polanco', hasPassword: true, initials: 'MG' },
]

export const sampleKpi: DailyKpi = {
  incomeToday: '$8,400',
  incomeChange: '+12% sem.',
  rented: 7,
  total: 14,
  deliveries: 3,
  inWorkshop: 1,
}

export const todayReservations: Reservation[] = [
  { id: '1', time: '10:30', type: 'Entrega', clientName: 'Mariana Pérez', vehicle: 'Sentra · ABC-123', clientInitials: 'MP', status: 'urgent' },
  { id: '2', time: '13:00', type: 'Entrega', clientName: 'Ricardo López', vehicle: 'Versa · XYZ-908', clientInitials: 'RL' },
  { id: '3', time: '15:00', type: 'Devolución', clientName: 'Lupita Cruz', vehicle: 'Aveo · JKL-441', clientInitials: 'LC' },
  { id: '4', time: '17:30', type: 'Entrega', clientName: 'Jorge Díaz', vehicle: 'Aveo · ABC-771', clientInitials: 'JD' },
]

export const tomorrowReservations: Reservation[] = [
  { id: '5', time: '09:00', type: 'Devolución', clientName: 'Lupita Cruz', vehicle: 'Yaris · TUV-309', clientInitials: 'LC' },
  { id: '6', time: '11:00', type: 'Entrega', clientName: 'Pedro Soto', vehicle: 'Polo · QRS-115', clientInitials: 'PS' },
]

export interface Cotizacion {
  id: string
  clientName: string
  clientInitials: string
  vehicleType: string
  plate?: string
  days: number
  dailyRate: number
  insuranceName: string
  insuranceCost: number
  discount: number
  status: 'enviada' | 'aceptada' | 'vencida'
  date: string
}

export const VEHICLE_TYPES = [
  { label: 'Compacto', rate: 700 },
  { label: 'Sedán', rate: 850 },
  { label: 'Hatchback', rate: 760 },
  { label: 'SUV', rate: 1350 },
  { label: 'Pickup', rate: 1650 },
]

export const INSURANCE_OPTIONS = [
  { label: 'Básico', cost: 300 },
  { label: 'Amplio', cost: 550 },
  { label: 'Sin seguro', cost: 0 },
]

export const sampleCotizaciones: Cotizacion[] = [
  { id: 'COT-041', clientName: 'Mariana Pérez', clientInitials: 'MP', vehicleType: 'Sedán', plate: 'ABC-123', days: 4, dailyRate: 850, insuranceName: 'Básico', insuranceCost: 300, discount: 200, status: 'enviada', date: 'hoy 11:22' },
  { id: 'COT-040', clientName: 'Ricardo López', clientInitials: 'RL', vehicleType: 'SUV', plate: 'LMN-300', days: 7, dailyRate: 1350, insuranceName: 'Amplio', insuranceCost: 550, discount: 0, status: 'aceptada', date: 'ayer 14:05' },
  { id: 'COT-039', clientName: 'Lupita Cruz', clientInitials: 'LC', vehicleType: 'Compacto', plate: 'TUV-309', days: 2, dailyRate: 700, insuranceName: 'Sin seguro', insuranceCost: 0, discount: 0, status: 'vencida', date: 'lun 09:40' },
  { id: 'COT-038', clientName: 'Jorge Díaz', clientInitials: 'JD', vehicleType: 'Hatchback', plate: 'QRS-115', days: 3, dailyRate: 760, insuranceName: 'Básico', insuranceCost: 300, discount: 100, status: 'aceptada', date: 'dom 16:30' },
  { id: 'COT-037', clientName: 'Pedro Soto', clientInitials: 'PS', vehicleType: 'Pickup', plate: 'GHI-884', days: 5, dailyRate: 1650, insuranceName: 'Amplio', insuranceCost: 550, discount: 0, status: 'enviada', date: 'sáb 10:15' },
  { id: 'COT-036', clientName: 'Ana Torres', clientInitials: 'AT', vehicleType: 'Sedán', plate: 'JKL-441', days: 3, dailyRate: 850, insuranceName: 'Básico', insuranceCost: 300, discount: 0, status: 'vencida', date: 'vie 08:00' },
]

export const sampleFleet: Vehicle[] = [
  { plate: 'ABC-123', model: 'Nissan Sentra', year: '2022', color: 'Azul', tone: 'blue', status: 'rentado', km: '45,200', currentClient: 'M. Pérez', clientInfo: 'vence vie', fuel: 78, transmission: 'Aut.', segment: 'Sedán', dailyRate: 850 },
  { plate: 'XYZ-908', model: 'Nissan Versa', year: '2023', color: 'Blanco', tone: 'white', status: 'disponible', km: '12,100', fuel: 100, transmission: 'Aut.', segment: 'Sedán', dailyRate: 780 },
  { plate: 'JKL-441', model: 'Chevrolet Aveo', year: '2021', color: 'Gris', tone: 'slate', status: 'rentado', km: '78,300', currentClient: 'R. López', clientInfo: 'vence hoy', fuel: 40, transmission: 'Man.', segment: 'Sedán', dailyRate: 700 },
  { plate: 'MNP-772', model: 'Kia Rio', year: '2023', color: 'Rojo', tone: 'rose', status: 'taller', km: '38,400', clientInfo: 'Cambio de aceite', fuel: 60, transmission: 'Man.', segment: 'Compacto', dailyRate: 650 },
  { plate: 'QRS-115', model: 'VW Polo', year: '2022', color: 'Negro', tone: 'ink', status: 'disponible', km: '22,800', fuel: 90, transmission: 'Man.', segment: 'Hatchback', dailyRate: 760 },
  { plate: 'TUV-309', model: 'Toyota Yaris', year: '2023', color: 'Blanco', tone: 'white', status: 'reservado', km: '8,900', clientInfo: 'jue 23 · 10:00', fuel: 95, transmission: 'Aut.', segment: 'Compacto', dailyRate: 700 },
  { plate: 'LMN-300', model: 'Honda CR-V', year: '2022', color: 'Arena', tone: 'sand', status: 'disponible', km: '31,500', fuel: 85, transmission: 'Aut.', segment: 'SUV', dailyRate: 1350 },
  { plate: 'DEF-556', model: 'Mazda 3', year: '2023', color: 'Azul', tone: 'blue', status: 'disponible', km: '9,200', fuel: 100, transmission: 'Aut.', segment: 'Sedán', dailyRate: 920 },
  { plate: 'GHI-884', model: 'Toyota Hilux', year: '2021', color: 'Gris', tone: 'slate', status: 'rentado', km: '62,400', currentClient: 'P. Soto', clientInfo: 'vence lun', fuel: 55, transmission: 'Man.', segment: 'Pickup', dailyRate: 1650 },
  { plate: 'PQR-667', model: 'Nissan X-Trail', year: '2022', color: 'Blanco', tone: 'white', status: 'reservado', km: '27,800', clientInfo: 'sáb 25 · 09:00', fuel: 70, transmission: 'Aut.', segment: 'SUV', dailyRate: 1280 },
  { plate: 'STU-221', model: 'Chevrolet Trax', year: '2023', color: 'Rojo', tone: 'rose', status: 'disponible', km: '5,600', fuel: 100, transmission: 'Aut.', segment: 'SUV', dailyRate: 1100 },
  { plate: 'VWX-443', model: 'Kia Picanto', year: '2022', color: 'Arena', tone: 'sand', status: 'taller', km: '41,200', clientInfo: 'Revisión frenos', fuel: 30, transmission: 'Man.', segment: 'Compacto', dailyRate: 580 },
]
