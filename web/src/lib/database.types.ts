// Types matching the actual Supabase schema

export type VehiculoStatus   = 'disponible' | 'rentado' | 'taller' | 'reservado'
export type ReservaStatus    = 'pendiente' | 'confirmada' | 'entregada' | 'devuelta' | 'cancelada'
export type CotizacionStatus = 'enviada' | 'aceptada' | 'vencida' | 'convertida'

export interface Database {
  public: {
    Tables: {
      vehiculos: {
        Row: {
          id: string; placa: string; modelo: string; anio: number | null
          color: string | null; tono: string | null; segmento: string | null
          transmision: string | null; km: number; combustible: number
          status: VehiculoStatus; tarifa_diaria: number | null
          cliente_actual: string | null; info_cliente: string | null; created_at: string
        }
        Insert: {
          placa: string; modelo: string; anio?: number | null; color?: string | null
          tono?: string | null; segmento?: string | null; transmision?: string | null
          km?: number; combustible?: number; status?: VehiculoStatus
          tarifa_diaria?: number | null; cliente_actual?: string | null; info_cliente?: string | null
        }
        Update: {
          placa?: string; modelo?: string; anio?: number | null; color?: string | null
          tono?: string | null; segmento?: string | null; transmision?: string | null
          km?: number; combustible?: number; status?: VehiculoStatus
          tarifa_diaria?: number | null; cliente_actual?: string | null; info_cliente?: string | null
        }
      }
      clientes: {
        Row: {
          id: string; nombre: string; apellido: string | null
          email: string | null; telefono: string | null; created_at: string
        }
        Insert: {
          nombre: string; apellido?: string | null; email?: string | null; telefono?: string | null
        }
        Update: {
          nombre?: string; apellido?: string | null; email?: string | null; telefono?: string | null
        }
      }
      reservas: {
        Row: {
          id: string; cliente_id: string | null; vehiculo_id: string | null
          fecha_entrega: string; fecha_devolucion: string
          status: ReservaStatus; total: number | null; created_at: string
        }
        Insert: {
          cliente_id?: string | null; vehiculo_id?: string | null
          fecha_entrega: string; fecha_devolucion: string
          status?: ReservaStatus; total?: number | null
        }
        Update: {
          cliente_id?: string | null; vehiculo_id?: string | null
          fecha_entrega?: string; fecha_devolucion?: string
          status?: ReservaStatus; total?: number | null
        }
      }
      cotizaciones: {
        Row: {
          id: string; cliente_nombre: string; cliente_telefono: string | null
          vehiculo_id: string | null; vehiculo_modelo: string | null; vehiculo_placa: string | null
          dias: number; tarifa_diaria: number | null; seguro_nombre: string | null
          seguro_costo: number; descuento: number; total: number
          status: CotizacionStatus; reserva_id: string | null; created_at: string
        }
        Insert: {
          id: string; cliente_nombre: string; cliente_telefono?: string | null
          vehiculo_id?: string | null; vehiculo_modelo?: string | null; vehiculo_placa?: string | null
          dias: number; tarifa_diaria?: number | null; seguro_nombre?: string | null
          seguro_costo?: number; descuento?: number; total: number
          status?: CotizacionStatus; reserva_id?: string | null
        }
        Update: {
          status?: CotizacionStatus; reserva_id?: string | null
        }
      }
    }
  }
}

// Convenience row types
export type Vehiculo    = Database['public']['Tables']['vehiculos']['Row']
export type Cliente     = Database['public']['Tables']['clientes']['Row']
export type Reserva     = Database['public']['Tables']['reservas']['Row']
export type Cotizacion  = Database['public']['Tables']['cotizaciones']['Row']
