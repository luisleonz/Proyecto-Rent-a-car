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
  status: string
  km: string
  currentClient?: string
  clientInfo?: string
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

export const sampleFleet: Vehicle[] = [
  { plate: 'ABC-123', model: 'Nissan Sentra', year: '2022', color: 'Azul', status: 'rentado', km: '45,200', currentClient: 'M. Pérez', clientInfo: 'vence vie' },
  { plate: 'XYZ-908', model: 'Nissan Versa', year: '2023', color: 'Blanco', status: 'disponible', km: '12,100' },
  { plate: 'JKL-441', model: 'Chevrolet Aveo', year: '2021', color: 'Gris', status: 'rentado', km: '78,300', currentClient: 'R. López', clientInfo: 'vence hoy' },
  { plate: 'MNP-772', model: 'Kia Rio', year: '2023', color: 'Rojo', status: 'taller', km: '38,400', clientInfo: 'Cambio de aceite' },
  { plate: 'QRS-115', model: 'VW Polo', year: '2022', color: 'Negro', status: 'disponible', km: '22,800' },
  { plate: 'TUV-309', model: 'Toyota Yaris', year: '2023', color: 'Blanco', status: 'reservado', km: '8,900', clientInfo: 'jue 23 · 10:00' },
]
