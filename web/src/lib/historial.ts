// Turns raw audit rows (before/after copies of a record) into plain sentences for the owner.
import { identificador } from './usuarios'

export type Audit = { id: number; fecha: string; usuario: string | null; tabla: string; operacion: string; registro_id: string | null
  datos_anteriores: Record<string, unknown> | null; datos_nuevos: Record<string, unknown> | null }

type Tipo = 'texto' | 'dinero' | 'fecha' | 'hora' | 'km' | 'gas' | 'estado' | 'si_no' | 'lista' | 'vehiculo' | 'cliente' | 'oculto' | 'metodo'
const CAMPOS: Record<string, Record<string, [string, Tipo]>> = {
  vehiculos: {
    status: ['estado', 'estado'], tarifa_diaria: ['tarifa diaria', 'dinero'], fianza: ['depósito en garantía', 'dinero'], km: ['kilometraje', 'km'],
    combustible: ['gasolina', 'gas'], modelo: ['modelo', 'texto'], placa: ['placa', 'texto'], anio: ['año', 'texto'], color: ['color', 'texto'],
    segmento: ['tipo', 'texto'], transmision: ['transmisión', 'texto'], asientos: ['asientos', 'texto'], vin: ['número de serie', 'texto'],
    info_cliente: ['nota', 'texto'], cliente_actual: ['cliente actual', 'texto'], fotos: ['fotos', 'lista'], foto_url: ['foto principal', 'oculto'],
    seguro_vence: ['vencimiento del seguro', 'fecha'], tarjeta_vence: ['vencimiento de la tarjeta de circulación', 'fecha'],
    verificacion_vence: ['vencimiento de la verificación', 'fecha'], servicio_cada_km: ['servicio cada', 'km'], ultimo_servicio_km: ['último servicio', 'km'],
    tono: ['color en pantalla', 'oculto'],
  },
  reservas: {
    status: ['estado', 'estado'], fecha_entrega: ['fecha de entrega', 'fecha'], fecha_devolucion: ['fecha de devolución', 'fecha'],
    hora_entrega: ['hora de entrega', 'hora'], hora_devolucion: ['hora de devolución', 'hora'], total: ['total', 'dinero'], deposito: ['pagado', 'dinero'],
    iva: ['IVA', 'dinero'], descuento: ['descuento', 'dinero'], cargos_extra: ['cargos extra', 'dinero'], fianza: ['depósito en garantía', 'dinero'],
    fianza_devuelta: ['garantía devuelta', 'dinero'], vehiculo_id: ['vehículo', 'vehiculo'], cliente_id: ['cliente', 'cliente'],
    cobertura: ['cobertura', 'texto'], cobertura_costo: ['costo de cobertura', 'dinero'], lugar_entrega: ['lugar de entrega', 'texto'],
    lugar_devolucion: ['lugar de devolución', 'texto'], km_salida: ['km de salida', 'km'], km_regreso: ['km de regreso', 'km'],
    combustible_salida: ['gasolina de salida', 'gas'], combustible_regreso: ['gasolina de regreso', 'gas'], notas: ['notas', 'texto'],
    metodo_deposito: ['método del anticipo', 'metodo'], metodo_fianza: ['método de la garantía', 'metodo'], firma_cliente: ['firma del cliente', 'si_no'],
    fotos_entrega: ['fotos de entrega', 'lista'], fotos_devolucion: ['fotos de devolución', 'lista'], cargos_detalle: ['detalle de cargos', 'oculto'],
    entregado_at: ['entregado', 'oculto'], devuelto_at: ['devuelto', 'oculto'], fianza_devuelta_at: ['garantía devuelta', 'oculto'],
  },
  clientes: {
    nombre: ['nombre', 'texto'], telefono: ['teléfono', 'texto'], email: ['correo', 'texto'], licencia: ['licencia', 'texto'],
    licencia_vence: ['vigencia de la licencia', 'fecha'], direccion: ['dirección', 'texto'], identificacion: ['identificación', 'texto'],
    fecha_nacimiento: ['fecha de nacimiento', 'fecha'], nacionalidad: ['nacionalidad', 'texto'], contacto_emergencia: ['contacto de emergencia', 'texto'],
    contacto_emergencia_tel: ['teléfono de emergencia', 'texto'], notas: ['notas', 'texto'], no_rentar: ['no rentar', 'si_no'],
    no_rentar_motivo: ['motivo de no rentar', 'texto'], no_rentar_desde: ['', 'oculto'], no_rentar_por: ['', 'oculto'],
  },
  cotizaciones: { status: ['estado', 'estado'], total: ['total', 'dinero'], reserva_id: ['', 'oculto'] },
  pagos: { monto: ['monto', 'dinero'], metodo: ['método', 'metodo'], concepto: ['concepto', 'texto'], notas: ['notas', 'texto'] },
}
// Internal columns never worth showing
const SIEMPRE_OCULTO = new Set(['id', 'created_at', 'updated_at', 'legacy_id', 'registrado_por', 'folio'])

const ESTADO: Record<string, string> = { disponible: 'Disponible', reservado: 'Reservado', rentado: 'Rentado', taller: 'En taller',
  pendiente: 'Pendiente', confirmada: 'Confirmada', entregada: 'Entregada', devuelta: 'Devuelta', cancelada: 'Cancelada',
  enviada: 'Enviada', vista: 'Vista', aceptada: 'Aceptada', rechazada: 'Rechazada', vencida: 'Vencida', convertida: 'Convertida' }
const CONFIG: Record<string, string> = { nombreComercial: 'nombre comercial', representante: 'representante', rfc: 'RFC', telefono: 'teléfono',
  whatsapp: 'WhatsApp', email: 'correo', ciudadFirma: 'ciudad', sucursal: 'sucursal', domicilio: 'domicilio',
  lugarEntregaPredeterminado: 'lugar de entrega predeterminado', ivaTasa: 'tasa de IVA', ivaPorDefecto: 'IVA por defecto',
  metodosPago: 'métodos de pago', fianzaPredeterminada: 'fianza predeterminada', ceroDeducibleDia: 'cero deducible por día',
  limpiezaSedan: 'limpieza sedán', limpiezaVan: 'limpieza van' }

const dinero = (v: unknown) => `$${Number(v ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 2 })}`
const fecha = (v: unknown) => new Date(`${String(v).slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

function valor(v: unknown, tipo: Tipo, nombres: Record<string, string>) {
  if (v == null || v === '') return 'vacío'
  switch (tipo) {
    case 'dinero': return dinero(v)
    case 'fecha': return fecha(v)
    case 'hora': return String(v).slice(0, 5)
    case 'km': return `${Number(v).toLocaleString('es-MX')} km`
    case 'gas': return `${v}%`
    case 'estado': return ESTADO[String(v)] ?? String(v)
    case 'si_no': return v ? 'sí' : 'no'
    case 'metodo': { const s = String(v); return s[0].toUpperCase() + s.slice(1) }
    case 'vehiculo': return nombres[String(v)] ?? 'otro vehículo'
    default: { const s = typeof v === 'object' ? JSON.stringify(v) : String(v); return s.length > 60 ? s.slice(0, 57) + '…' : s }
  }
}

/** Plain-language list of what changed in an update, e.g. "tarifa diaria de $1,500 a $1,700". */
export function cambiosLegibles(a: Audit, nombres: Record<string, string> = {}): string[] {
  if (a.operacion !== 'update' || !a.datos_anteriores || !a.datos_nuevos) return []
  const antes = a.datos_anteriores, despues = a.datos_nuevos
  const campos = CAMPOS[a.tabla] ?? {}
  const out: string[] = []
  for (const k of Object.keys(despues)) {
    if (SIEMPRE_OCULTO.has(k) || JSON.stringify(antes[k]) === JSON.stringify(despues[k])) continue
    if (a.tabla === 'configuracion' && k === 'datos') {
      const x = (antes[k] ?? {}) as Record<string, unknown>, y = (despues[k] ?? {}) as Record<string, unknown>
      for (const c of Object.keys(y)) {
        if (JSON.stringify(x[c]) === JSON.stringify(y[c])) continue
        if (c === 'ivaTasa') out.push(`tasa de IVA de ${Math.round(Number(x[c] ?? 0) * 100)}% a ${Math.round(Number(y[c]) * 100)}%`)
        else if (Array.isArray(y[c])) out.push(`${CONFIG[c] ?? c}: ${(y[c] as string[]).join(', ') || 'ninguno'}`)
        else out.push(`${CONFIG[c] ?? c} de ${valor(x[c], typeof y[c] === 'number' ? 'dinero' : typeof y[c] === 'boolean' ? 'si_no' : 'texto', nombres)} a ${valor(y[c], typeof y[c] === 'number' ? 'dinero' : typeof y[c] === 'boolean' ? 'si_no' : 'texto', nombres)}`)
      }
      continue
    }
    const [etiqueta, tipo] = campos[k] ?? [k.replace(/_/g, ' '), 'texto' as Tipo]
    if (tipo === 'oculto') continue
    if (tipo === 'lista') {
      const n0 = Array.isArray(antes[k]) ? (antes[k] as unknown[]).length : 0, n1 = Array.isArray(despues[k]) ? (despues[k] as unknown[]).length : 0
      out.push(n1 > n0 ? `agregó ${n1 - n0} ${etiqueta.replace(/^fotos/, n1 - n0 === 1 ? 'foto' : 'fotos')}` : n1 < n0 ? `quitó ${n0 - n1} ${etiqueta.replace(/^fotos/, n0 - n1 === 1 ? 'foto' : 'fotos')}` : `cambió el orden de las ${etiqueta}`)
    } else if (tipo === 'cliente') out.push('cambió el cliente')
    else if (antes[k] == null || antes[k] === '') out.push(`${etiqueta}: ${valor(despues[k], tipo, nombres)}`)
    else out.push(`${etiqueta} de ${valor(antes[k], tipo, nombres)} a ${valor(despues[k], tipo, nombres)}`)
  }
  return out
}

const QUE: Record<string, (d: Record<string, unknown>, n: Record<string, string>) => string> = {
  vehiculos: d => `el vehículo ${d.modelo ?? ''}${d.placa ? ` (${d.placa})` : ''}`,
  reservas: (d, n) => `la reserva #${d.folio ?? '—'}${d.vehiculo_id && n[String(d.vehiculo_id)] ? ` · ${n[String(d.vehiculo_id)]}` : ''}`,
  clientes: d => `al cliente ${d.nombre ?? ''}`,
  cotizaciones: d => `la cotización de ${d.cliente_nombre ?? ''}`,
  pagos: d => `un pago de ${dinero(d.monto)}`,
  caja_movimientos: d => `un movimiento de caja de ${dinero(d.monto)}${d.concepto ? ` (${d.concepto})` : ''}`,
  configuracion: () => 'los ajustes del negocio',
  clientes_vetos: d => `${d.accion === 'quitar' ? 'permitió de nuevo' : 'marcó como no deseado'} a ${d.cliente_nombre ?? ''}`,
}

/** "Luis cambió el vehículo MAZDA 2 #7 (ABC123)" / "Automático: …" */
export function tituloCambio(a: Audit, nombres: Record<string, string> = {}) {
  const d = (a.datos_nuevos ?? a.datos_anteriores ?? {}) as Record<string, unknown>
  const que = (QUE[a.tabla] ?? (() => a.tabla))(d, nombres)
  const auto = esAutomatico(a)
  const quien = auto ? 'Automático' : a.usuario ? identificador(a.usuario) : 'Sistema'
  if (a.tabla === 'clientes_vetos') return `${quien} ${que}`
  if (a.tabla === 'pagos' && a.operacion === 'insert') return `${quien} registró ${que}`
  const verbo = a.operacion === 'insert' ? (a.tabla === 'clientes' ? 'registró' : 'creó') : a.operacion === 'delete' ? 'borró' : auto ? 'actualizó' : 'editó'
  return `${quien} ${verbo} ${que}`
}

/** Updates where nothing visible changed (older records saved the same values again). */
export const esCambioVacio = (a: Audit) => a.operacion === 'update' && cambiosLegibles(a).length === 0
const CAMPOS_AUTO = new Set(['status', 'cliente_actual', 'info_cliente'])
/** Changes the app makes by itself. Older records were saved under the person who opened the screen:
 *  a vehicle update that only touched its availability (not the workshop) was the app too. */
export function esAutomatico(a: Audit) {
  if (a.usuario === 'automático') return true
  if (a.tabla !== 'vehiculos' || a.operacion !== 'update' || !a.datos_anteriores || !a.datos_nuevos) return false
  const x = a.datos_anteriores, y = a.datos_nuevos
  const tocados = Object.keys(y).filter(k => !SIEMPRE_OCULTO.has(k) && JSON.stringify(x[k]) !== JSON.stringify(y[k]))
  return tocados.length > 0 && tocados.every(k => CAMPOS_AUTO.has(k)) && x.status !== 'taller' && y.status !== 'taller'
}
