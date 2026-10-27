import { useEffect, useRef, useState } from 'react'
import { Camera, X, Eraser } from 'lucide-react'

/* ── Fuel level: E ¼ ½ ¾ F ── */
const NIVELES: [number, string][] = [[0, 'E'], [25, '¼'], [50, '½'], [75, '¾'], [100, 'F']]
export const nivelGas = (n: number | null | undefined) => (n == null ? null : NIVELES.reduce((a, b) => (Math.abs(b[0] - n) < Math.abs(a[0] - n) ? b : a))[0])
export const etiquetaGas = (n: number | null | undefined) => (n == null ? '—' : NIVELES.find(x => x[0] === nivelGas(n))![1])

export function SelectorGasolina({ valor, onChange }: { valor: number | null; onChange: (n: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {NIVELES.map(([n, l]) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          style={{ flex: 1, padding: '12px 0', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', font: 'inherit',
            border: `1.5px solid ${valor === n ? 'var(--primary)' : 'var(--card-line)'}`,
            background: valor === n ? 'var(--primary)' : 'var(--card)', color: valor === n ? '#fff' : 'var(--ink2)' }}>
          {l}
        </button>
      ))}
    </div>
  )
}

/* ── Photo capture: takes pictures with the phone camera (or picks files) ── */
export function CapturaFotos({ fotos, onChange, sugeridas }: { fotos: File[]; onChange: (f: File[]) => void; sugeridas?: string[] }) {
  const ref = useRef<HTMLInputElement>(null)
  const [urls, setUrls] = useState<string[]>([])
  useEffect(() => {
    const u = fotos.map(f => URL.createObjectURL(f))
    setUrls(u)
    return () => u.forEach(URL.revokeObjectURL)
  }, [fotos])
  return (
    <div>
      <input ref={ref} type="file" accept="image/*" capture="environment" multiple hidden
        onChange={e => { onChange([...fotos, ...Array.from(e.target.files ?? [])]); e.target.value = '' }} />
      {sugeridas && <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 8 }}>Sugeridas: {sugeridas.join(' · ')}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 8 }}>
        {urls.map((u, i) => (
          <div key={u} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden', background: 'var(--paper-alt)' }}>
            <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button type="button" onClick={() => onChange(fotos.filter((_, j) => j !== i))} aria-label="Quitar foto"
              style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, border: 0, background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => ref.current?.click()}
          style={{ aspectRatio: '4/3', borderRadius: 10, border: '1.5px dashed var(--ink4)', background: 'var(--paper-alt)', color: 'var(--ink2)', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, font: 'inherit', fontSize: 12, fontWeight: 600 }}>
          <Camera size={20} />Tomar foto
        </button>
      </div>
    </div>
  )
}

/* ── On-screen signature ── */
export function FirmaPad({ onChange }: { onChange: (firmado: boolean, canvas: HTMLCanvasElement | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const dibujando = useRef(false)
  const [vacio, setVacio] = useState(true)

  useEffect(() => {
    const c = ref.current!
    const ajustar = () => {
      const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1
      c.width = r.width * dpr; c.height = r.height * dpr
      const ctx = c.getContext('2d')!
      ctx.scale(dpr, dpr); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#111'
    }
    ajustar()
  }, [])

  const punto = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
  const inicio = (e: React.PointerEvent) => {
    dibujando.current = true; ref.current!.setPointerCapture(e.pointerId)
    const ctx = ref.current!.getContext('2d')!; const [x, y] = punto(e); ctx.beginPath(); ctx.moveTo(x, y)
  }
  const mover = (e: React.PointerEvent) => {
    if (!dibujando.current) return
    const ctx = ref.current!.getContext('2d')!; const [x, y] = punto(e); ctx.lineTo(x, y); ctx.stroke()
    if (vacio) { setVacio(false); onChange(true, ref.current) }
  }
  const fin = () => { dibujando.current = false }
  const borrar = () => {
    const c = ref.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); setVacio(true); onChange(false, null)
  }

  return (
    <div>
      <div style={{ position: 'relative', border: '1.5px solid var(--card-line)', borderRadius: 12, background: '#fff' }}>
        <canvas ref={ref} onPointerDown={inicio} onPointerMove={mover} onPointerUp={fin} onPointerLeave={fin}
          style={{ width: '100%', height: 170, display: 'block', touchAction: 'none', cursor: 'crosshair' }} />
        {vacio && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink4)', fontSize: 14, pointerEvents: 'none' }}>Firme aquí con el dedo</div>}
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 34, borderTop: '1px solid var(--ink4)', pointerEvents: 'none' }} />
      </div>
      {!vacio && <button type="button" className="btn sm" style={{ marginTop: 8 }} onClick={borrar}><Eraser size={13} />Borrar firma</button>}
    </div>
  )
}

export const canvasABlob = (c: HTMLCanvasElement) =>
  new Promise<Blob>((ok, mal) => c.toBlob(b => (b ? ok(b) : mal(new Error('No se pudo guardar la firma'))), 'image/png'))
