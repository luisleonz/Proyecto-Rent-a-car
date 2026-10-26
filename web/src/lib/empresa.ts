// Datos fijos del arrendador que se imprimen en el contrato y su anexo.
export const EMPRESA = {
  nombreComercial: "Luciano's Tours",
  representante:   'Luciano León C.',
  rfc:             'LECL760507R33',
  telefono:        '631 134 2266',
  whatsapp:        '631 999 7000',
  email:           'lucianostoursnogales@gmail.com',
  ciudadFirma:     'Nogales, Sonora',
  // Si se deja vacío, el anexo imprime una línea en blanco para llenarlo a mano.
  domicilio:       '',
  lugarEntregaPredeterminado: "Oficina Luciano's Tours",
  // IVA de región fronteriza; las tarifas no lo incluyen y se suma al final.
  ivaTasa: 0.08,
}

export const ivaDe = (base: number) => Math.round(Math.max(0, base) * EMPRESA.ivaTasa * 100) / 100
export const ivaEtiqueta = `IVA ${Math.round(EMPRESA.ivaTasa * 100)}%`
