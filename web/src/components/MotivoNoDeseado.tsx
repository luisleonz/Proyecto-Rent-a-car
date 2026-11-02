import { MOTIVOS_NO_DESEADO } from '../lib/noDeseados'

/** Reason picker: quick chips plus free text (the reason is required). */
export default function MotivoNoDeseado({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {MOTIVOS_NO_DESEADO.map(m => (
          <button key={m} type="button" className={`fbtn${value === m ? ' on' : ''}`} style={{ padding: '6px 11px', fontSize: 12.5 }} onClick={() => onChange(m)}>{m}</button>
        ))}
      </div>
      <textarea className="field-i" rows={2} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Motivo (obligatorio): qué pasó, montos, fechas…'} aria-label="Motivo" />
    </div>
  )
}
