import { useEffect, useState, Fragment } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { EMPRESA, ivaEtiqueta } from '../../lib/empresa'
import { contrato, basica, ceroDeducible, type Para } from '../../lib/contratoTextos'
import type { Reserva, Cliente, Vehiculo } from '../../lib/database.types'
import { urlsFirmadas } from '../../lib/fotos'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

// Private bucket: only logged-in employees can read it (see supabase_seguridad.sql).
const FIRMA_BUCKET = 'Firma'
const FIRMA_PATH = 'firma-arrendador.png'

export type ReservaContrato = Reserva & { clientes: Cliente | null; vehiculos: Vehiculo | null }
type DocKey = 'contrato' | 'anexo' | 'basica' | 'cero'

const DOC_LABEL: Record<DocKey, string> = {
  contrato: 'Contrato',
  anexo:    'Anexo (datos de la renta)',
  basica:   'Cobertura básica',
  cero:     'Cero deducible',
}

/* ─── Formatting ─────────────────────────────────────────────── */
const money = (n: number | null | undefined) =>
  n == null ? '' : '$' + new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

function fechaLarga(d: string | null | undefined) {
  if (!d) return ''
  return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
const fechaCorta = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
const hora = (t: string | null | undefined) => (t ? t.slice(0, 5) + ' hrs' : '')

export function diasRenta(r: Pick<Reserva, 'fecha_entrega' | 'fecha_devolucion'>) {
  const ms = new Date(r.fecha_devolucion + 'T12:00:00').getTime() - new Date(r.fecha_entrega + 'T12:00:00').getTime()
  return Math.max(1, Math.round(ms / 86400000))
}

/* ─── Building blocks ────────────────────────────────────────── */
function Paras({ items }: { items: Para[] }) {
  const out: JSX.Element[] = []
  let list: Para[] = []
  const flush = () => {
    if (!list.length) return
    out.push(<ul key={`ul${out.length}`}>{list.map((p, i) => <li key={i}><Segs p={p} /></li>)}</ul>)
    list = []
  }
  items.forEach((p, i) => {
    if (p.li) { list.push(p); return }
    flush()
    const text = p.s.map(s => s[1]).join('')
    const isHeading = p.s.length === 1 && p.s[0][0] && text === text.toUpperCase() && text.length < 60
    out.push(isHeading
      ? <h3 key={i}>{text}</h3>
      : <p key={i}><Segs p={p} /></p>)
  })
  flush()
  return <>{out}</>
}

function Segs({ p }: { p: Para }) {
  return <>{p.s.map(([b, t], i) => b ? <strong key={i}>{t}</strong> : <Fragment key={i}>{t}</Fragment>)}</>
}

function Firma({ rol, nombre, img, leyenda = 'Nombre y Firma de Conformidad' }: { rol?: string; nombre?: string; img?: string | null; leyenda?: string }) {
  return (
    <div className="ct-firma">
      <div className="ct-firma-nombre">{img ? <img src={img} alt="" className="ct-firma-img" /> : (nombre ?? '')}</div>
      <div className="ct-firma-linea" />
      {rol && <div className="ct-firma-rol">{rol}</div>}
      <div className="ct-firma-ley">{leyenda}</div>
    </div>
  )
}

function Campo({ label, value, span = 1 }: { label: string; value?: string | number | null; span?: 1 | 2 | 4 }) {
  const empty = value == null || value === ''
  return (
    <div className="ct-campo" style={{ gridColumn: `span ${span}` }}>
      <div className="ct-campo-l">{label}</div>
      <div className={`ct-campo-v${empty ? ' blank' : ''}`}>{empty ? ' ' : value}</div>
    </div>
  )
}

function Gas({ nivel }: { nivel?: number | null }) {
  const marcado = nivel == null ? null : [0, 25, 50, 75, 100].reduce((a, b) => (Math.abs(b - nivel) < Math.abs(a - nivel) ? b : a))
  return (
    <div className="ct-gas">Combustible: {([[0, 'E'], [25, '¼'], [50, '½'], [75, '¾'], [100, 'F']] as const).map(([n, g]) => (
      <span key={g} className="ct-box" style={marcado === n ? { background: '#000', color: '#fff' } : undefined}>{g}</span>
    ))}</div>
  )
}
const kmFmt = (n?: number | null) => (n == null ? '' : new Intl.NumberFormat('es-MX').format(n))

function Check({ on, children }: { on: boolean; children: React.ReactNode }) {
  return <span className="ct-check"><span className={`ct-box${on ? ' on' : ''}`}>{on ? '✕' : ''}</span>{children}</span>
}

function Folio({ r, label = 'CONTRATO NÚM' }: { r: ReservaContrato; label?: string }) {
  return <div className="ct-folio">{label}: <span>{r.folio ?? '__________'}</span></div>
}

/* ─── Documents ──────────────────────────────────────────────── */
function PaginaContrato({ r, firmaUrl, firmaCliente }: { r: ReservaContrato; firmaUrl?: string | null; firmaCliente?: string | null }) {
  return (
    <section className="ct-page">
      <header className="ct-head">
        <img src="/docs/logo-lucianos.png" alt="" className="ct-logo" />
        <div className="ct-title">CONTRATO DE ARRENDAMIENTO DE VEHÍCULOS</div>
        <Folio r={r} />
      </header>
      <div className="ct-cols"><Paras items={contrato} /></div>
      <div className="ct-firmas">
        <Firma rol="ARRENDADOR" nombre={EMPRESA.representante.toUpperCase()} img={firmaUrl} />
        <Firma rol="ARRENDATARIO" nombre={r.clientes?.nombre?.toUpperCase()} img={firmaCliente} />
      </div>
    </section>
  )
}

function PaginaAnexo({ r, firmaUrl, firmaCliente }: { r: ReservaContrato; firmaUrl?: string | null; firmaCliente?: string | null }) {
  const c = r.clientes, v = r.vehiculos
  const dias      = diasRenta(r)
  const tarifa    = v?.tarifa_diaria ?? null
  const subtotal  = tarifa != null ? tarifa * dias : null
  const descuento = r.descuento ?? 0
  const cobCosto  = r.cobertura_costo ?? 0
  const iva       = r.iva ?? 0
  const total     = r.total ?? (subtotal != null ? subtotal - descuento + cobCosto + iva : null)
  const anticipo  = r.deposito ?? 0
  const saldo     = total != null ? Math.max(0, total - anticipo) : null
  const cero      = r.cobertura === 'cero_deducible'
  const metodo    = (m: string | null | undefined) => m ? m[0].toUpperCase() + m.slice(1) : ''

  return (
    <section className="ct-page">
      <header className="ct-head">
        <img src="/docs/logo-lucianos.png" alt="" className="ct-logo" />
        <div className="ct-title">ANEXO DEL CONTRATO DE ARRENDAMIENTO</div>
        <Folio r={r} />
      </header>

      <div className="ct-sec">Arrendador</div>
      <div className="ct-grid">
        <Campo span={2} label="Nombre" value={`${EMPRESA.representante} · ${EMPRESA.nombreComercial}`} />
        <Campo label="RFC" value={EMPRESA.rfc} />
        <Campo label="Teléfono / WhatsApp" value={`${EMPRESA.telefono} / ${EMPRESA.whatsapp}`} />
        <Campo span={2} label="Correo" value={EMPRESA.email} />
        <Campo span={2} label="Domicilio" value={EMPRESA.domicilio} />
      </div>

      <div className="ct-sec">Arrendatario</div>
      <div className="ct-grid">
        <Campo span={2} label="Nombre completo" value={c?.nombre} />
        <Campo label="Teléfono" value={c?.telefono} />
        <Campo label="Correo electrónico" value={c?.email} />
        <Campo span={2} label="Domicilio" value={c?.direccion} />
        <Campo label="Identificación (INE / pasaporte)" value={c?.identificacion} />
        <Campo label="Licencia de conducir · vigencia"
          value={[c?.licencia, c?.licencia_vence ? `vence ${fechaCorta(c.licencia_vence)}` : ''].filter(Boolean).join(' · ')} />
      </div>

      <div className="ct-sec">Vehículo arrendado</div>
      <div className="ct-grid">
        <Campo span={2} label="Marca y modelo" value={v?.modelo} />
        <Campo label="Año" value={v?.anio} />
        <Campo label="Color" value={v?.color} />
        <Campo label="Placas" value={v?.placa} />
        <Campo span={2} label="Núm. de serie (VIN)" value={v?.vin} />
        <Campo label="Transmisión" value={v?.transmision} />
      </div>

      <div className="ct-sec">Vigencia, entrega y devolución · {dias} {dias === 1 ? 'día' : 'días'}</div>
      <div className="ct-grid">
        <Campo span={2} label="Salida (fecha y hora)" value={[fechaLarga(r.fecha_entrega), hora(r.hora_entrega)].filter(Boolean).join(' · ')} />
        <Campo span={2} label="Devolución (fecha y hora)" value={[fechaLarga(r.fecha_devolucion), hora(r.hora_devolucion)].filter(Boolean).join(' · ')} />
        <Campo span={2} label="Lugar de entrega" value={r.lugar_entrega ?? EMPRESA.lugarEntregaPredeterminado} />
        <Campo span={2} label="Lugar de devolución" value={r.lugar_devolucion ?? r.lugar_entrega ?? EMPRESA.lugarEntregaPredeterminado} />
      </div>

      <div className="ct-sec">Precio del arrendamiento y depósitos</div>
      <table className="ct-tabla">
        <tbody>
          <tr><td>Renta: {dias} {dias === 1 ? 'día' : 'días'} × {money(tarifa)} por día</td><td>{money(subtotal)}</td></tr>
          {descuento > 0 && <tr><td>Descuento</td><td>−{money(descuento)}</td></tr>}
          <tr><td>Protección adicional cero deducible</td><td>{cero ? money(cobCosto) : 'No contratada'}</td></tr>
          {iva > 0 && <tr><td>{ivaEtiqueta}</td><td>{money(iva)}</td></tr>}
          <tr className="tot"><td>TOTAL DEL ARRENDAMIENTO (moneda nacional)</td><td>{money(total)}</td></tr>
          <tr><td>Anticipo / apartado recibido{r.metodo_deposito ? ` (${metodo(r.metodo_deposito)})` : ''}</td><td>{money(anticipo)}</td></tr>
          <tr className="tot"><td>SALDO PENDIENTE AL ENTREGAR</td><td>{money(saldo)}</td></tr>
          <tr><td>Depósito en garantía (cláusula OCTAVA){r.metodo_fianza ? ` (${metodo(r.metodo_fianza)})` : ''}</td><td>{r.fianza ? money(r.fianza) : ' '}</td></tr>
        </tbody>
      </table>

      <div className="ct-sec">Cobertura contratada</div>
      <div className="ct-checks">
        <Check on={!cero}>Cobertura amplia con pago de deducible y/o daños (básica)</Check>
        <Check on={cero}>Cobertura amplia con cero deducible (premium)</Check>
      </div>

      <div className="ct-sec">Boleta de inspección</div>
      <div className="ct-insp">
        <div>
          <div className="ct-insp-t">Salida</div>
          <Gas nivel={r.combustible_salida} />
          <div className="ct-linea">Km: {kmFmt(r.km_salida ?? v?.km)}</div>
          <div className="ct-linea">Observaciones: {r.danos_entrega ?? ''}</div>
          <div className="ct-linea" />
        </div>
        <div>
          <div className="ct-insp-t">Devolución</div>
          <Gas nivel={r.combustible_regreso} />
          <div className="ct-linea">Km: {kmFmt(r.km_regreso)}</div>
          <div className="ct-linea">Observaciones: {r.danos_devolucion ?? ''}</div>
          <div className="ct-linea" />
        </div>
      </div>

      <div className="ct-lugar">
        {EMPRESA.ciudadFirma}, a {fechaLarga(r.fecha_entrega)}.
      </div>
      <div className="ct-firmas">
        <Firma rol="ARRENDADOR" nombre={EMPRESA.representante.toUpperCase()} img={firmaUrl} />
        <Firma rol="ARRENDATARIO" nombre={c?.nombre?.toUpperCase()} img={firmaCliente} />
      </div>
    </section>
  )
}

function PaginaPoliza({ r, titulo, subtitulo, items, firmaCliente }: { r: ReservaContrato; titulo: string; subtitulo: string; items: Para[]; firmaCliente?: string | null }) {
  return (
    <section className="ct-page ct-poliza">
      <header className="ct-head">
        <img src="/docs/logo-lucianos.png" alt="" className="ct-logo big" />
        <div className="ct-title">{titulo}<div className="ct-sub">{subtitulo}</div></div>
        <Folio r={r} label="CONTRATO" />
      </header>
      <div className="ct-body"><Paras items={items} /></div>
      <div className="ct-firmas single">
        <Firma nombre={r.clientes?.nombre?.toUpperCase()} img={firmaCliente} leyenda="Nombre y firma de conformidad." />
      </div>
    </section>
  )
}

export function ContratoDocs({ r, docs, firmaUrl, firmaCliente }: { r: ReservaContrato; docs: DocKey[]; firmaUrl?: string | null; firmaCliente?: string | null }) {
  return (
    <div className="ct-root">
      {docs.includes('contrato') && <PaginaContrato r={r} firmaUrl={firmaUrl} firmaCliente={firmaCliente} />}
      {docs.includes('anexo')    && <PaginaAnexo r={r} firmaUrl={firmaUrl} firmaCliente={firmaCliente} />}
      {docs.includes('basica')   && (
        <PaginaPoliza r={r} items={basica} firmaCliente={firmaCliente}
          titulo="PAQUETE DE COBERTURA AMPLIA CON PAGO DE DEDUCIBLE Y/O DAÑOS" subtitulo="(COBERTURA BÁSICA)" />
      )}
      {docs.includes('cero') && (
        <PaginaPoliza r={r} items={ceroDeducible} firmaCliente={firmaCliente}
          titulo="PAQUETE DE COBERTURA AMPLIA CON CERO DE DEDUCIBLE" subtitulo="(COBERTURA PREMIUM)" />
      )}
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function ContratoPrint() {
  const { resId } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [r, setR] = useState<ReservaContrato | null>(null)
  const [error, setError] = useState('')
  const [docs, setDocs] = useState<DocKey[]>([])
  const [firmaUrl, setFirmaUrl] = useState<string | null | undefined>(undefined)
  const [firmaCliente, setFirmaCliente] = useState<string | null>(null)

  useEffect(() => {
    supabase.storage.from(FIRMA_BUCKET).createSignedUrl(FIRMA_PATH, 3600)
      .then(({ data }) => setFirmaUrl(data?.signedUrl ?? null))
  }, [])

  useEffect(() => {
    db.from('reservas').select('*, clientes(*), vehiculos(*)').eq('id', resId).single()
      .then(({ data, error: err }: { data: ReservaContrato | null; error: { message: string } | null }) => {
        if (err || !data) { setError(err?.message ?? 'Reserva no encontrada'); return }
        setR(data)
        if (data.firma_cliente) urlsFirmadas([data.firma_cliente]).then(m => setFirmaCliente(m[data.firma_cliente!] ?? null))
        setDocs(['contrato', 'anexo', 'basica', ...(data.cobertura === 'cero_deducible' ? ['cero' as const] : [])])
        document.title = `Contrato ${data.folio ?? ''} · ${data.clientes?.nombre ?? ''}`.trim()
      })
  }, [resId])

  useEffect(() => {
    if (r && params.get('auto') === '1') setTimeout(() => window.print(), 400)
  }, [r])

  const toggle = (k: DocKey) => setDocs(d => d.includes(k) ? d.filter(x => x !== k) : [...d, k])

  return (
    <div className="ct-screen">
      <style>{CONTRATO_CSS}</style>
      <div className="ct-toolbar">
        <button className="btn sm" onClick={() => navigate(-1)}><ArrowLeft size={15} />Volver</button>
        <div className="ct-toolbar-docs">
          {(Object.keys(DOC_LABEL) as DocKey[]).map(k => (
            <label key={k}><input type="checkbox" checked={docs.includes(k)} onChange={() => toggle(k)} />{DOC_LABEL[k]}</label>
          ))}
        </div>
        {firmaUrl === null && <span className="ct-nofirma">Sin firma guardada: el arrendador firmará a mano</span>}
        <button className="btn sm primary" onClick={() => window.print()} disabled={!r || docs.length === 0}>
          <Printer size={15} />Imprimir
        </button>
      </div>
      {error && <div className="ct-msg">No se pudo cargar la reserva: {error}</div>}
      {!r && !error && <div className="ct-msg"><div className="spinner" /></div>}
      {r && <ContratoDocs r={r} firmaUrl={firmaUrl} firmaCliente={firmaCliente} docs={(Object.keys(DOC_LABEL) as DocKey[]).filter(k => docs.includes(k))} />}
    </div>
  )
}

export const CONTRATO_CSS = `
.ct-screen { min-height: 100dvh; background: #e9e9e6; padding-bottom: 40px; }
.ct-toolbar { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  padding: 12px 16px; background: var(--card); border-bottom: 1px solid var(--card-line); }
.ct-toolbar-docs { display: flex; gap: 14px; flex-wrap: wrap; flex: 1; font-size: 13px; color: var(--ink2); }
.ct-toolbar-docs label { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.ct-msg { display: flex; justify-content: center; padding: 60px 16px; color: var(--ink2); }
.ct-root { display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 24px 0; }

.ct-page { width: 8.5in; min-height: 11in; height: 11in; background: #fff; color: #000; padding: 0.4in 0.45in;
  box-shadow: 0 2px 14px rgba(0,0,0,0.15); display: flex; flex-direction: column; overflow: hidden;
  font-family: Arial, Helvetica, sans-serif; font-size: 8pt; line-height: 1.3; }
.ct-head { display: grid; grid-template-columns: 1.1in 1fr 1.6in; align-items: center; gap: 10px; margin-bottom: 10px; }
.ct-logo { width: 1in; }
.ct-logo.big { width: 1.25in; }
.ct-title { text-align: center; font-weight: 700; font-size: 11pt; letter-spacing: 0.2px; }
.ct-sub { font-size: 9.5pt; margin-top: 3px; }
.ct-folio { text-align: right; font-weight: 700; font-size: 8.5pt; white-space: nowrap; }
.ct-folio span { display: inline-block; min-width: 0.7in; border-bottom: 1px solid #000; text-align: center; font-size: 10pt; }

.ct-cols { column-count: 2; column-gap: 0.28in; font-size: 7.6pt; line-height: 1.26; text-align: justify; flex: 1; }
.ct-cols p { margin: 0 0 3.4pt; }
.ct-cols h3 { margin: 4pt 0 3pt; font-size: 8.2pt; text-align: center; }

.ct-poliza .ct-body { font-size: 8.8pt; line-height: 1.4; text-align: justify; flex: 1; }
.ct-poliza .ct-body p { margin: 0 0 5.5pt; }
.ct-poliza .ct-body h3 { margin: 8pt 0 4pt; font-size: 9.5pt; }
.ct-poliza .ct-body ul { margin: 0 0 6pt; padding-left: 18pt; }

.ct-firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6in; margin-top: 12px; padding: 0 0.2in; }
.ct-firmas.single { grid-template-columns: 1fr; padding: 0 1.8in; }
.ct-firma { text-align: center; font-size: 7.5pt; font-weight: 700; }
.ct-firma-nombre { min-height: 30px; display: flex; align-items: flex-end; justify-content: center; font-size: 8.5pt; padding-bottom: 2px; }
.ct-firmas:not(.single) .ct-firma-nombre { height: 56px; }
.ct-firma-img { height: 60px; max-width: 100%; object-fit: contain; margin-bottom: -6px; }
.ct-firma-linea { border-top: 1px solid #000; margin-bottom: 3px; }
.ct-nofirma { font-size: 12px; color: var(--warn-ink); background: var(--warn-soft); border: 1px solid var(--warn-line); border-radius: 8px; padding: 4px 9px; }
.ct-firma-rol { font-size: 8pt; }
.ct-firma-ley { font-weight: 600; }

.ct-sec { margin: 8px 0 4px; padding: 3px 7px; background: #1d2633; color: #fff; font-weight: 700; font-size: 7.8pt; letter-spacing: 0.6px; text-transform: uppercase; }
.ct-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 3px 12px; }
.ct-campo { min-width: 0; }
.ct-campo-l { font-size: 6.4pt; text-transform: uppercase; color: #444; letter-spacing: 0.3px; }
.ct-campo-v { font-size: 8.8pt; font-weight: 600; border-bottom: 1px solid #999; min-height: 15px; padding: 1px 2px; overflow-wrap: anywhere; }
.ct-tabla { width: 100%; border-collapse: collapse; font-size: 8.6pt; }
.ct-tabla td { padding: 3px 6px; border-bottom: 1px solid #ccc; }
.ct-tabla td:last-child { text-align: right; width: 1.6in; font-weight: 600; }
.ct-tabla tr.tot td { font-weight: 800; background: #f1f1ee; }
.ct-checks { display: flex; gap: 24px; font-size: 8.6pt; padding: 2px 4px; }
.ct-check { display: inline-flex; align-items: center; gap: 6px; }
.ct-box { display: inline-flex; align-items: center; justify-content: center; width: 13px; height: 13px; border: 1px solid #000; font-size: 7pt; font-weight: 800; margin-right: 3px; }
.ct-insp { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; font-size: 8.4pt; }
.ct-insp-t { font-weight: 700; margin-bottom: 3px; }
.ct-gas { display: flex; align-items: center; gap: 3px; margin-bottom: 4px; }
.ct-gas .ct-box { width: 16px; height: 14px; font-weight: 600; }
.ct-linea { border-bottom: 1px solid #999; min-height: 17px; padding-top: 3px; }
.ct-lugar { margin-top: auto; padding-top: 10px; font-size: 8.6pt; }

@media print {
  @page { size: letter; margin: 0; }
  html, body, #root { background: #fff !important; height: auto !important; }
  .ct-screen { background: #fff; padding: 0; }
  .ct-toolbar, .ct-msg { display: none !important; }
  .ct-root { display: block; padding: 0; }
  .ct-page { box-shadow: none; break-after: page; page-break-after: always; }
  .ct-page:last-child { break-after: auto; page-break-after: auto; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
@media screen and (max-width: 860px) {
  .ct-root { zoom: 0.45; }
}
`
