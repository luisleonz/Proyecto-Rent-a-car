// Auto-generated types for Lucianos Rent-a-Car schema
// Run `npx supabase gen types typescript` to regenerate after schema changes

export type VehiculoStatus = 'disponible' | 'rentado' | 'taller' | 'reservado'
export type ReservaStatus  = 'pendiente' | 'confirmada' | 'entregada' | 'devuelta' | 'cancelada'
export type EmpleadoRol    = 'administrador' | 'operativo' | 'cajero'
export type MetodoPago     = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto'

export interface Database {
  public: {
    Tables: {
      empleados: {
        Row: {
          id: string
          email: string
          nombre: string
          apellido: string
          rol: EmpleadoRol
          sucursal: string | null
          activo: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['empleados']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['empleados']['Insert']>
      }
      vehiculos: {
        Row: {
          id: string
          placa: string
          modelo: string
          anio: number
          color: string
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
          apellido: string
          email: string | null
          telefono: string | null
          licencia: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['clientes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['clientes']['Insert']>
      }
      reservas: {
        Row: {
          id: string
          cliente_id: string
          vehiculo_id: string
          empleado_id: string | null
          fecha_entrega: string
          fecha_devolucion: string
          hora_entrega: string | null
          status: ReservaStatus
          dias: number
          tarifa_diaria: number
          seguro: number
          deposito: number
          descuento: number
          total: number
          notas: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reservas']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reservas']['Insert']>
      }
      movimientos_caja: {
        Row: {
          id: string
          empleado_id: string | null
          reserva_id: string | null
          tipo: string
          monto: number
          metodo: MetodoPago | null
          descripcion: string | null
          turno: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['movimientos_caja']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['movimientos_caja']['Insert']>
      }
    }
  }
}

// Convenience row types
export type Empleado       = Database['public']['Tables']['empleados']['Row']
export type Vehiculo       = Database['public']['Tables']['vehiculos']['Row']
export type Cliente        = Database['public']['Tables']['clientes']['Row']
export type Reserva        = Database['public']['Tables']['reservas']['Row']
export type MovimientoCaja = Database['public']['Tables']['movimientos_caja']['Row']
