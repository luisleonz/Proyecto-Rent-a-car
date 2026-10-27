import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'

/** Tells users a new version was published, instead of them seeing a stale cached app. */
export default function AvisoVersion() {
  const { needRefresh: [hayNueva], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (reg) setInterval(() => reg.update(), 30 * 60 * 1000)
    },
  })
  if (!hayNueva) return null
  return (
    <div style={{ position: 'fixed', left: 16, right: 16, bottom: 84, zIndex: 100, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--ink)', color: '#fff',
        padding: '10px 12px 10px 16px', borderRadius: 14, boxShadow: 'var(--shadow-pop)', fontSize: 14, maxWidth: 480 }}>
        <span>Hay una versión nueva de la app.</span>
        <button className="btn sm primary" onClick={() => updateServiceWorker(true)}><RefreshCw size={13} />Actualizar</button>
      </div>
    </div>
  )
}
