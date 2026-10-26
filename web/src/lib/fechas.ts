// Date-only helpers in local time ('YYYY-MM-DD'). toISOString() is UTC and shifts the day in the evening.
export function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const hoyISO = () => isoLocal(new Date())

export function parseISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDias(iso: string, n: number) {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return isoLocal(d)
}

export function diffDias(desde: string, hasta: string) {
  return Math.round((parseISO(hasta).getTime() - parseISO(desde).getTime()) / 86400000)
}
