// Occasional extra services charged on a rental, typed by hand (concept + amount).
// Kept as a list on the reservation so after a few months Reportes shows which ones repeat.

export type Servicio = { concepto: string; monto: number }
/** Row being edited on screen (amount still as typed). */
export type FilaServicio = { concepto: string; monto: string }

export const totalServicios = (s?: Servicio[] | null) => (s ?? []).reduce((t, x) => t + (Number(x.monto) || 0), 0)

export const aFilas = (s?: Servicio[] | null): FilaServicio[] => (s ?? []).map(x => ({ concepto: x.concepto, monto: String(x.monto) }))

/** Clean list to save, plus what is missing in half-filled rows. Fully empty rows are ignored. */
export function leerFilas(filas: FilaServicio[]) {
  const servicios: Servicio[] = []
  const faltan: string[] = []
  filas.forEach((f, i) => {
    const concepto = f.concepto.trim(), monto = f.monto.trim()
    if (!concepto && !monto) return
    if (!concepto) faltan.push(`La descripción del concepto adicional ${i + 1}`)
    else if (monto === '') faltan.push(`El monto de "${concepto}"`)
    else servicios.push({ concepto, monto: Number(monto) || 0 })
  })
  return { servicios, faltan }
}
