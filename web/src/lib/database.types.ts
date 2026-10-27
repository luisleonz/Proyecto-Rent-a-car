// Types matching the actual Supabase schema

export type VehiculoStatus   = 'disponible' | 'rentado' | 'taller' | 'reservado'
export type ReservaStatus    = 'pendiente' | 'confirmada' | 'entregada' | 'devuelta' | 'cancelada'
export type CotizacionStatus = 'enviada' | 'aceptada' | 'vencida' | 'convertida'

export type SolicitudEstado = 'pendiente' | 'aprobada' | 'rechazada'
export type Cobertura       = 'basica' | 'cero_deducible'

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
          vin?: string | null; asientos?: number | null; fianza?: number | null
          foto_url?: string | null; fotos?: string[] | null; notas?: string | null
          seguro_vence?: string | null; tarjeta_vence?: string | null; verificacion_vence?: string | null
          servicio_cada_km?: number | null; ultimo_servicio_km?: number | null; legacy_id?: string | null
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
          id: string; nombre: string; telefono: string | null
          email: string | null; licencia: string | null; direccion: string | null
          licencia_vence?: string | null; identificacion?: string | null
          fecha_nacimiento?: string | null; nacionalidad?: string | null; notas?: string | null
          contacto_emergencia?: string | null; contacto_emergencia_tel?: string | null
          created_at: string
        }
        Insert: {
          nombre: string; telefono?: string | null
          email?: string | null; licencia?: string | null; direccion?: string | null
        }
        Update: {
          nombre?: string; telefono?: string | null
          email?: string | null; licencia?: string | null; direccion?: string | null
        }
      }
      reservas: {
        Row: {
          id: string; cliente_id: string | null; vehiculo_id: string | null
          fecha_entrega: string; fecha_devolucion: string
          status: ReservaStatus; total: number | null
          deposito: number; metodo_deposito: string | null; created_at: string
          folio?: number | null
          hora_entrega?: string | null; hora_devolucion?: string | null
          lugar_entrega?: string | null; lugar_devolucion?: string | null
          descuento?: number | null
          cobertura?: Cobertura | null; cobertura_costo?: number | null
          iva?: number | null
          fianza?: number | null; metodo_fianza?: string | null
          notas?: string | null
          km_salida?: number | null; km_regreso?: number | null
          combustible_salida?: number | null; combustible_regreso?: number | null
          entregado_at?: string | null; devuelto_at?: string | null
          entregado_por?: string | null; recibido_por?: string | null
          fotos_entrega?: string[] | null; fotos_devolucion?: string[] | null
          danos_entrega?: string | null; danos_devolucion?: string | null
          firma_cliente?: string | null
          cargos_extra?: number | null; cargos_detalle?: { concepto: string; monto: number }[] | null
          fianza_devuelta?: number | null; fianza_devuelta_at?: string | null
          legacy_id?: string | null
        }
        Insert: {
          cliente_id?: string | null; vehiculo_id?: string | null
          fecha_entrega: string; fecha_devolucion: string
          status?: ReservaStatus; total?: number | null
          deposito?: number; metodo_deposito?: string | null
        }
        Update: {
          cliente_id?: string | null; vehiculo_id?: string | null
          fecha_entrega?: string; fecha_devolucion?: string
          status?: ReservaStatus; total?: number | null
          deposito?: number; metodo_deposito?: string | null
        }
      }
      cotizaciones: {
        Row: {
          id: string; cliente_nombre: string; cliente_telefono: string | null
          vehiculo_id: string | null; vehiculo_modelo: string | null; vehiculo_placa: string | null
          dias: number; tarifa_diaria: number | null; seguro_nombre: string | null
          seguro_costo: number; descuento: number; total: number
          status: CotizacionStatus; reserva_id: string | null; created_at: string
          iva?: number | null
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
      solicitudes: {
        Row: {
          id: string
          tipo: string
          tabla: string
          registro_id: string
          datos_actuales: Record<string, unknown> | null
          datos_nuevos: Record<string, unknown>
          solicitado_por: string | null
          estado: SolicitudEstado
          revisado_por: string | null
          revisado_at: string | null
          nota_rechazo: string | null
          created_at: string
        }
        Insert: {
          tipo: string; tabla: string; registro_id: string
          datos_actuales?: Record<string, unknown> | null
          datos_nuevos: Record<string, unknown>
          solicitado_por?: string | null
          estado?: SolicitudEstado
        }
        Update: {
          estado?: SolicitudEstado
          revisado_por?: string | null
          revisado_at?: string | null
          nota_rechazo?: string | null
        }
      }
    }
  }
}

// Convenience row types
export type Vehiculo   = Database['public']['Tables']['vehiculos']['Row']
export type Cliente    = Database['public']['Tables']['clientes']['Row']
export type Reserva    = Database['public']['Tables']['reservas']['Row']
export type Cotizacion = Database['public']['Tables']['cotizaciones']['Row']
export type Solicitud  = Database['public']['Tables']['solicitudes']['Row']

export interface ReservaConDetalle extends Reserva {
  clientes:  { nombre: string; telefono: string | null } | null
  vehiculos: { modelo: string; placa: string; anio: number | null; tarifa_diaria: number | null } | null
}
