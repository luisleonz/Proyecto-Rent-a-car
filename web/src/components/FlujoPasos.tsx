import { ChevronLeft } from 'lucide-react'

/** Full-screen step-by-step layout used by the delivery and return flows. */
export default function FlujoPasos({ titulo, subtitulo, pasos, actual, onAtras, children, pie }: {
  titulo: string; subtitulo?: string; pasos: string[]; actual: number; onAtras: () => void
  children: React.ReactNode; pie: React.ReactNode
}) {
  return (
    <div className="screen" style={{ maxWidth: 720 }}>
      <button className="backlink" onClick={onAtras}><ChevronLeft size={16} />{actual === 0 ? 'Salir' : 'Atrás'}</button>
      <div style={{ margin: '6px 0 14px' }}>
        <div className="eyebrow">{subtitulo}</div>
        <h1 className="h-display" style={{ fontSize: 'clamp(26px, 4cqw, 36px)', marginTop: 4 }}>{titulo}</h1>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {pasos.map((p, i) => (
          <div key={p} style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 2, background: i <= actual ? 'var(--primary)' : 'var(--card-line)' }} />
            <div style={{ fontSize: 11.5, marginTop: 5, color: i === actual ? 'var(--ink)' : 'var(--ink3)', fontWeight: i === actual ? 700 : 500 }}>{i + 1}. {p}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 'var(--pad)', display: 'flex', flexDirection: 'column', gap: 18 }}>{children}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16, position: 'sticky', bottom: 12 }}>{pie}</div>
    </div>
  )
}

export function Bloque({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{titulo}</div>
        {ayuda && <div style={{ fontSize: 12.5, color: 'var(--ink3)', marginTop: 2 }}>{ayuda}</div>}
      </div>
      {children}
    </div>
  )
}

export function Casilla({ ok, onChange, children }: { ok: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, cursor: 'pointer', padding: '10px 12px', borderRadius: 10,
      border: `1.5px solid ${ok ? 'var(--primary-line)' : 'var(--card-line)'}`, background: ok ? 'var(--primary-soft)' : 'var(--card)' }}>
      <input type="checkbox" checked={ok} onChange={e => onChange(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1 }} />
      <span>{children}</span>
    </label>
  )
}
