import { Check } from 'lucide-react'
import { REGLAS_CONTRASENA } from '../lib/usuarios'

/** Live checklist of the password policy. */
export default function ReglasContrasena({ pass, extra }: { pass: string; extra?: [boolean, string][] }) {
  const filas: [boolean, string][] = [...REGLAS_CONTRASENA.map(r => [r.cumple(pass), r.texto] as [boolean, string]), ...(extra ?? [])]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5 }}>
      {filas.map(([ok, t]) => (
        <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, color: ok ? 'var(--primary-dark)' : 'var(--ink3)' }}>
          <Check size={13} strokeWidth={ok ? 3 : 2} color={ok ? 'var(--primary)' : 'var(--ink4)'} />{t}
        </span>
      ))}
    </div>
  )
}
