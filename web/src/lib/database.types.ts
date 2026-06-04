// Types matching the actual Supabase schema

export type VehiculoStatus = 'disponible' | 'rentado' | 'taller' | 'reservado'
export type ReservaStatus  = 'pendiente' | 'confirmada' | 'entregada' | 'devuelta' | 'cancelada'

export interface Database {
  public: {
    Tables: {
      vehiculos: {
        Row: {
          id: string
          placa: string
          modelo: string
          anio: number | null
          color: string | null
          tono: string | null
          segmento: string | null
          transmision: string | null
          km: number
          combustible: number
          status: VehiculoStatus
          tarifa_diaria: number | null
          cliente_actual: string | null
          info_cliente: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['vehiculos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vehiculos']['Insert']>
      }
      clientes: {
        Row: {
          id: string
          nombre: string
          apellido: string | null
          email: string | null
          telefono: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['clientes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['clientes']['Insert']>
      }
      reservas: {
        Row: {
          id: string
          cliente_id: string | null
          vehiculo_id: string | null
          fecha_entrega: string
          fecha_devolucion: string
          status: ReservaStatus
          total: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reservas']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reservas']['Insert']>
      }
    }
  }
}

// Convenience row types
export type Vehiculo = Database['public']['Tables']['vehiculos']['Row']
export type Cliente  = Database['public']['Tables']['clientes']['Row']
export type Reserva  = Database['public']['Tables']['reservas']['Row']
