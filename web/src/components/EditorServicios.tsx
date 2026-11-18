import { Plus, X } from 'lucide-react'
import type { FilaServicio } from '../lib/servicios'

/** Add / remove extra charges by hand: a description and an amount each. */
export default function EditorServicios({ filas, onChange }: { filas: FilaServicio[]; onChange: (f: FilaServicio[]) => void }) {
  const cambiar = (i: number, c: Partial<FilaServicio>) => onChange(filas.map((f, j) => (j === i ? { ...f, ...c } : f)))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {filas.map((f, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input className="field-i" style={{ flex: 3 }} value={f.concepto} placeholder="Concepto (ej. silla para bebé)"
            aria-label={`Concepto adicional ${i + 1}`} onChange={e => cambiar(i, { concepto: e.target.value })} />
          <div className="field-money" style={{ flex: 2 }}>
            <span>$</span>
            <input className="field-i" value={f.monto} inputMode="decimal" placeholder="0" aria-label={`Monto del concepto adicional ${i + 1}`}
              onChange={e => cambiar(i, { monto: e.target.value.replace(/[^0-9.]/g, '') })} />
          </div>
          <button type="button" className="iconbtn" style={{ width: 34, height: 34, flexShrink: 0 }} aria-label={`Quitar concepto ${i + 1}`}
            onClick={() => onChange(filas.filter((_, j) => j !== i))}><X size={15} /></button>
        </div>
      ))}
      <button type="button" className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => onChange([...filas, { concepto: '', monto: '' }])}>
        <Plus size={13} />Agregar concepto
      </button>
    </div>
  )
}
