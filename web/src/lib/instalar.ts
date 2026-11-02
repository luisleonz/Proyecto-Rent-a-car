// Install as an app (PWA). Chrome/Edge/Android fire "beforeinstallprompt" once, early: it is kept
// here (this module is imported first in main.tsx) so a button can show the prompt later.
import { useEffect, useState } from 'react'

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
let evento: EventoInstalar | null = null
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach(f => f())

window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); evento = e as EventoInstalar; avisar() })
window.addEventListener('appinstalled', () => { evento = null; avisar() })

export const yaInstalada = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
export const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export type EstadoInstalacion = 'instalada' | 'disponible' | 'ios' | 'manual'

export function useInstalacion() {
  const calcular = (): EstadoInstalacion => (yaInstalada() ? 'instalada' : evento ? 'disponible' : esIOS() ? 'ios' : 'manual')
  const [estado, setEstado] = useState<EstadoInstalacion>(calcular)
  useEffect(() => {
    const f = () => setEstado(calcular())
    oyentes.add(f); f()
    return () => { oyentes.delete(f) }
  }, [])
  async function instalar() {
    if (!evento) return false
    await evento.prompt()
    const { outcome } = await evento.userChoice
    if (outcome === 'accepted') evento = null
    avisar()
    return outcome === 'accepted'
  }
  return { estado, instalar }
}
