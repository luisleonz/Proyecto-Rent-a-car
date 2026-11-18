import { useState } from 'react'

export const TONES: Record<string, [string, string]> = {
  blue:  ['#4e8cbe', '#c9e2f7'],
  slate: ['#67737c', '#dfe6eb'],
  rose:  ['#c86265',  '#fedbda'],
  ink:   ['#43494d', '#d2d8dd'],
  sand:  ['#b59a75',  '#f3e6d2'],
  white: ['#9fa6aa', '#eceff1'],
}

export function CarIlustracion({ tono, width = '70%' }: { tono?: string | null; width?: string }) {
  const [body] = TONES[tono ?? 'slate'] ?? TONES.slate
  const glass = 'rgba(255,255,255,0.42)'
  return (
    <svg viewBox="0 0 200 72" fill="none" style={{ width, maxWidth: 260 }}>
      <path d="M12 50 C12 44 15 42 20 42 L48 42 C54 27 70 17 100 15 C130 13 152 23 162 42 L182 42 C187 42 190 44 190 50 L190 58 C190 62 187 64 182 64 L18 64 C14 64 12 62 12 58 Z" fill={body} />
      <path d="M52 42 C56 26 70 17 100 15 C130 13 148 24 156 42 Z" fill={body} opacity="0.85" />
      <path d="M112 16 L154 42 L132 42 Z" fill={glass} />
      <path d="M58 42 L82 42 L74 22 Z" fill={glass} />
      {[54, 154].map(cx => (
        <g key={cx}>
          <circle cx={cx} cy="64" r="14" fill="#101214" />
          <circle cx={cx} cy="64" r="7" fill="#44484c" />
          <circle cx={cx} cy="64" r="3" fill="#82878b" />
        </g>
      ))}
    </svg>
  )
}

/** Vehicle photo filling its box, or the illustration when there's no photo (or it fails to load). */
export default function VehiculoFoto({ url, tono, height, className, children }: {
  url?: string | null; tono?: string | null; height: number; className?: string; children?: React.ReactNode
}) {
  const [fallo, setFallo] = useState(false)
  const bg = (TONES[tono ?? 'slate'] ?? TONES.slate)[1]
  const conFoto = !!url && !fallo
  return (
    <div className={className} style={{ position: 'relative', height, background: bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {conFoto
        ? <img src={url!} alt="" loading="lazy" onError={() => setFallo(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <CarIlustracion tono={tono} />}
      {children}
    </div>
  )
}
