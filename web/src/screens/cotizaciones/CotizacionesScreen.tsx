import { useState, useEffect, useCallback } from 'react'
import { Check, Download, MessageCircle, X, ArrowRight, RefreshCw } from 'lucide-react'
import jsPDF from 'jspdf'
import { supabase } from '../../lib/supabase'
import type { Vehiculo, Cotizacion, CotizacionStatus } from '../../lib/database.types'

// Supabase v2 generic resolution breaks with complex multi-table inserts;
// this helper restores the typed interface without the circular inference issue.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

/* ─── Constants ─────────────────────────────────────────────── */
const fmt = (n: number) => new Intl.NumberFormat('es-MX').format(n)

const INSURANCE_OPTIONS = [
  { label: 'Básico',     cost: 300 },
  { label: 'Amplio',     cost: 550 },
  { label: 'Sin seguro', cost: 0   },
]

const STATUS_LABEL: Record<CotizacionStatus, string> = {
  enviada:    'Enviada',
  aceptada:   'Aceptada',
  vencida:    'Vencida',
  convertida: 'Convertida',
}
const STATUS_CHIP: Record<CotizacionStatus, string> = {
  enviada: '', aceptada: 'primary', vencida: '', convertida: '',
}
const STATUS_DOT: Record<CotizacionStatus, string> = {
  enviada: 'neutral', aceptada: '', vencida: 'neutral', convertida: 'neutral',
}

const FILTER_TABS = ['Todas', 'Enviadas', 'Aceptadas', 'Vencidas', 'Convertidas']
const FILTER_MAP: Record<string, CotizacionStatus> = {
  'Enviadas': 'enviada', 'Aceptadas': 'aceptada',
  'Vencidas': 'vencida', 'Convertidas': 'convertida',
}

/* ─── PDF generation ────────────────────────────────────────── */
interface QuoteData {
  id: string; clientName: string; clientPhone?: string
  vehicle: string; plate: string; days: number; dailyRate: number
  insurance: { label: string; cost: number }
  discount: number; total: number; date: string
}

function generatePDF(q: QuoteData): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const green: [number, number, number]    = [38, 120, 72]
  const greenSoft: [number, number, number] = [232, 247, 239]
  const ink: [number, number, number]      = [30, 30, 38]
  const ink3: [number, number, number]     = [120, 120, 130]

  doc.setFillColor(...green)
  doc.rect(0, 0, W, 46, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.text('Lucianos Rent-a-Car', 20, 20)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5)
  doc.text('Tu mejor opción en renta de autos', 20, 28)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16)
  doc.text(q.id, W - 20, 19, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  doc.text(`Emitida: ${q.date}`, W - 20, 27, { align: 'right' })
  doc.text('Vigencia: 7 días', W - 20, 34, { align: 'right' })

  doc.setTextColor(...ink3); doc.setFontSize(9.5)
  doc.text('COTIZACIÓN PARA', 20, 60)
  doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(17)
  doc.text(q.clientName, 20, 70)
  if (q.clientPhone) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(...ink3)
    doc.text(q.clientPhone, 20, 78)
  }

  doc.setDrawColor(...green); doc.setLineWidth(0.4)
  doc.line(20, q.clientPhone ? 84 : 76, W - 20, q.clientPhone ? 84 : 76)

  const y0 = q.clientPhone ? 96 : 88
  doc.setTextColor(...ink3); doc.setFontSize(9.5); doc.setFont('helvetica', 'normal')
  doc.text('VEHÍCULO', 20, y0)
  doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
  doc.text(q.vehicle, 20, y0 + 9)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(...ink3)
  doc.text(`Placa: ${q.plate}   ·   ${q.days} día${q.days !== 1 ? 's' : ''} de renta`, 20, y0 + 17)

  const y1 = y0 + 32
  doc.setTextColor(...ink3); doc.setFontSize(9.5)
  doc.text('DESGLOSE', 20, y1)

  const rows: [string, string][] = [
    [`${q.days} días × $${fmt(q.dailyRate)}/día`, `$${fmt(q.days * q.dailyRate)}`],
  ]
  if (q.insurance.cost > 0) rows.push([`Seguro ${q.insurance.label}`, `$${fmt(q.insurance.cost)}`])
  if (q.discount > 0) rows.push([`Descuento`, `-$${fmt(q.discount)}`])

  let y = y1 + 10
  rows.forEach(([label, amount]) => {
    doc.setTextColor(...ink); doc.setFont('helvetica', 'normal'); doc.setFontSize(11)
    doc.text(label, 25, y); doc.text(amount, W - 25, y, { align: 'right' })
    doc.setDrawColor(230, 230, 235); doc.setLineWidth(0.2)
    doc.line(25, y + 4, W - 25, y + 4)
    y += 14
  })

  doc.setFillColor(...greenSoft)
  doc.roundedRect(20, y + 2, W - 40, 20, 3, 3, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...ink)
  doc.text('TOTAL', 28, y + 15)
  doc.setFontSize(18); doc.setTextColor(...green)
  doc.text(`$${fmt(q.total)} MXN`, W - 27, y + 15, { align: 'right' })

  const yf = y + 40
  doc.setDrawColor(200, 200, 205); doc.setLineWidth(0.3)
  doc.line(20, yf, W - 20, yf)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...ink3)
  doc.text('Lucianos Rent-a-Car  ·  Precios en MXN con IVA incluido  ·  Vigencia 7 días a partir de la fecha de emisión', W / 2, yf + 8, { align: 'center' })
  doc.text('Este documento es una cotización y no constituye un contrato de renta.', W / 2, yf + 15, { align: 'center' })

  return doc.output('blob')
}

function cotizacionToQuoteData(c: Cotizacion): QuoteData {
  const ins = INSURANCE_OPTIONS.find(o => o.label === c.seguro_nombre) ?? { label: c.seguro_nombre ?? 'Sin seguro', cost: c.seguro_costo }
  return {
    id: c.id,
    clientName: c.cliente_nombre,
    clientPhone: c.cliente_telefono ?? undefined,
    vehicle: c.vehiculo_modelo ?? 'Vehículo',
    plate: c.vehiculo_placa ?? '',
    days: c.dias,
    dailyRate: c.tarifa_diaria ?? 0,
    insurance: ins,
    discount: c.descuento,
    total: c.total,
    date: new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
  }
}

async function shareViaWhatsApp(q: QuoteData) {
  const blob = generatePDF(q)
  const file = new File([blob], `cotizacion-${q.id}.pdf`, { type: 'application/pdf' })
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: `Cotización ${q.id}` }); return }
    catch (e) { if ((e as Error).name === 'AbortError') return }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `cotizacion-${q.id}.pdf`
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  const phone = q.clientPhone?.replace(/\D/g, '') ?? ''
  const msg = [
    `Hola ${q.clientName}! 👋`,
    ``,
    `Le compartimos su cotización de *Lucianos Rent-a-Car*:`,
    ``,
    `🚗 *${q.vehicle}* (${q.plate})`,
    `📅 ${q.days} día${q.days !== 1 ? 's' : ''} de renta`,
    `💰 Total: *$${fmt(q.total)} MXN*`,
    ``,
    `Adjunto encontrará el PDF. Vigencia: 7 días.`,
  ].join('\n')
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
}

function downloadPDF(q: QuoteData) {
  const blob = generatePDF(q)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `cotizacion-${q.id}.pdf`
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}

/* ─── Quote detail panel ────────────────────────────────────── */
interface PanelProps {
  cot: Cotizacion | null
  open: boolean
  onClose: () => void
  onStatusChange: (id: string, status: CotizacionStatus) => Promise<void>
  onConvert: (cot: Cotizacion) => Promise<void>
}

function QuoteDetailPanel({ cot, open, onClose, onStatusChange, onConvert }: PanelProps) {
  const [working, setWorking] = useState(false)

  async function handleStatus(status: CotizacionStatus) {
    if (!cot || working) return
    setWorking(true)
    await onStatusChange(cot.id, status)
    setWorking(false)
  }

  async function handleConvert() {
    if (!cot || working) return
    setWorking(true)
    await onConvert(cot)
    setWorking(false)
  }

  const q = cot ? cotizacionToQuoteData(cot) : null

  return (
    <>
      {open && <div className="qpanel-overlay" onClick={onClose} />}
      <div className={`qpanel${open ? ' open' : ''}`}>
        {cot && q && (
          <>
            <div className="qpanel-head">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>{cot.id}</div>
                <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                  {cot.cliente_nombre}
                </div>
                {cot.cliente_telefono && (
                  <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 3 }}>{cot.cliente_telefono}</div>
                )}
                <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 4 }}>
                  {new Date(cot.created_at).toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--ink3)', flexShrink: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="qpanel-body">
              {/* Vehicle */}
              <div className="qpanel-section">
                <div className="qpanel-section-title">Vehículo</div>
                <div style={{ background: 'var(--paper-alt)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{cot.vehiculo_modelo ?? '—'}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 3 }}>
                    {cot.vehiculo_placa}{cot.dias ? ` · ${cot.dias} días` : ''}
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="qpanel-section">
                <div className="qpanel-section-title">Desglose</div>
                <div className="qpanel-row">
                  <span className="lbl">{cot.dias} días × ${fmt(cot.tarifa_diaria ?? 0)}</span>
                  <span className="val mono">${fmt(cot.dias * (cot.tarifa_diaria ?? 0))}</span>
                </div>
                {cot.seguro_costo > 0 && (
                  <div className="qpanel-row">
                    <span className="lbl">Seguro {cot.seguro_nombre}</span>
                    <span className="val mono">${fmt(cot.seguro_costo)}</span>
                  </div>
                )}
                {cot.descuento > 0 && (
                  <div className="qpanel-row">
                    <span className="lbl">Descuento</span>
                    <span className="val mono" style={{ color: 'var(--primary)' }}>−${fmt(cot.descuento)}</span>
                  </div>
                )}
                <div className="qpanel-total-row">
                  <span className="lbl">Total</span>
                  <span className="val">${fmt(cot.total)}</span>
                </div>
              </div>

              {/* Status */}
              {cot.status !== 'convertida' && (
                <div className="qpanel-section">
                  <div className="qpanel-section-title">Estado</div>
                  <div className="status-btns">
                    {(['enviada', 'aceptada', 'vencida'] as CotizacionStatus[]).map(s => (
                      <button
                        key={s}
                        className={`status-btn${cot.status === s ? ` active-${s}` : ''}`}
                        onClick={() => handleStatus(s)}
                        disabled={working || cot.status === s}
                      >
                        {STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {cot.status === 'convertida' && (
                <div style={{ background: 'oklch(0.95 0.03 250)', border: '1px solid oklch(0.80 0.08 250)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'oklch(0.42 0.10 250)' }}>✓ Convertida a reserva</div>
                  {cot.reserva_id && (
                    <div style={{ fontSize: 12, color: 'oklch(0.55 0.08 250)', marginTop: 3 }}>ID: {cot.reserva_id}</div>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="qpanel-foot">
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => downloadPDF(q)}>
                  <Download size={15} />PDF
                </button>
                <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => shareViaWhatsApp(q)}>
                  <RefreshCw size={15} />Reenviar
                </button>
              </div>
              {(cot.status === 'enviada' || cot.status === 'aceptada') && (
                <button
                  className="btn primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleConvert}
                  disabled={working}
                >
                  {working
                    ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Creando reserva…</>
                    : <><ArrowRight size={15} />Convertir a reserva</>}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}

/* ─── Quote row ─────────────────────────────────────────────── */
function QuoteRow({ c, onClick }: { c: Cotizacion; onClick: () => void }) {
  return (
    <button className="qrow" onClick={onClick}>
      <div className="avatar" style={{ width: 38, height: 38, fontSize: 13, flexShrink: 0 }}>
        {c.cliente_nombre.slice(0, 2).toUpperCase()}
      </div>
      <div className="qrow-main">
        <div className="qrow-who">{c.cliente_nombre}</div>
        <div className="qrow-meta">
          {c.id} · {c.vehiculo_modelo ?? '—'} · {c.dias}d ·{' '}
          {new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
        </div>
      </div>
      <div className="qrow-end">
        <span className="qrow-total mono">${fmt(c.total)}</span>
        <span className={`chip sm ${STATUS_CHIP[c.status]}`}>
          <span className={`dot ${STATUS_DOT[c.status]}`} />
          {STATUS_LABEL[c.status]}
        </span>
      </div>
    </button>
  )
}

/* ─── Vehicle picker option ──────────────────────────────────── */
function VehOption({ v, selected, onSelect }: { v: Vehiculo; selected: boolean; onSelect: () => void }) {
  return (
    <button className={`veh-opt${selected ? ' on' : ''}`} onClick={onSelect}>
      <span className="veh-dot" style={{ background: 'var(--primary-soft)', border: '2px solid var(--primary-line)' }} />
      <div className="veh-info">
        <span className="veh-name">{v.modelo} <span className="veh-year">{v.anio}</span></span>
        <span className="veh-meta">{v.placa}{v.segmento ? ` · ${v.segmento}` : ''}{v.transmision ? ` · ${v.transmision}` : ''}</span>
      </div>
      <div className="veh-rate">
        <span className="vr-v">${fmt(v.tarifa_diaria ?? 0)}</span>
        <span className="vr-u">/día</span>
      </div>
      {selected && <span className="veh-check"><Check size={11} /></span>}
    </button>
  )
}

/* ─── Main screen ───────────────────────────────────────────── */
export default function CotizacionesScreen() {
  // Builder state
  const [clientName, setClientName]   = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [days, setDays]               = useState(3)
  const [discount, setDiscount]       = useState('')
  const [selectedId, setSelectedId]   = useState('')
  const [insurance, setInsurance]     = useState(INSURANCE_OPTIONS[0])
  const [sending, setSending]         = useState(false)
  const [saving, setSaving]           = useState(false)

  // Data
  const [vehicles, setVehicles]       = useState<Vehiculo[]>([])
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [loadingVeh, setLoadingVeh]   = useState(true)
  const [loadingCots, setLoadingCots] = useState(true)

  // Panel
  const [panelCot, setPanelCot]       = useState<Cotizacion | null>(null)
  const [panelOpen, setPanelOpen]     = useState(false)

  // Filter
  const [filter, setFilter]           = useState('Todas')

  const fetchVehicles = useCallback(async () => {
    const { data } = await supabase.from('vehiculos').select('*').in('status', ['disponible', 'reservado']).order('modelo')
    const list: Vehiculo[] = data ?? []
    setVehicles(list)
    if (list.length > 0 && !selectedId) setSelectedId(list[0].id)
    setLoadingVeh(false)
  }, [selectedId])

  const fetchCotizaciones = useCallback(async () => {
    const { data } = await supabase.from('cotizaciones').select('*').order('created_at', { ascending: false })
    setCotizaciones(data ?? [])
    setLoadingCots(false)
  }, [])

  useEffect(() => { fetchVehicles() }, [])
  useEffect(() => { fetchCotizaciones() }, [])

  const selectedVehicle = vehicles.find(v => v.id === selectedId)
  const discountAmount  = parseInt(discount) || 0
  const vehicleRate     = selectedVehicle?.tarifa_diaria ?? 0
  const subtotal        = days * vehicleRate
  const total           = Math.max(0, subtotal + insurance.cost - discountAmount)

  function buildQuoteData(): QuoteData {
    const now = new Date()
    const id = `COT-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*900)+100)}`
    return {
      id,
      clientName: clientName.trim() || 'Cliente',
      clientPhone: clientPhone.trim() || undefined,
      vehicle: selectedVehicle ? `${selectedVehicle.modelo} ${selectedVehicle.anio ?? ''}`.trim() : 'Vehículo',
      plate: selectedVehicle?.placa ?? '',
      days, dailyRate: vehicleRate, insurance,
      discount: discountAmount, total,
      date: now.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
    }
  }

  async function saveCotizacion(q: QuoteData, status: CotizacionStatus): Promise<Cotizacion | null> {
    const { data, error } = await db.from('cotizaciones').insert({
      id: q.id,
      cliente_nombre: q.clientName,
      cliente_telefono: q.clientPhone ?? null,
      vehiculo_id: selectedVehicle?.id ?? null,
      vehiculo_modelo: q.vehicle,
      vehiculo_placa: q.plate,
      dias: q.days,
      tarifa_diaria: q.dailyRate,
      seguro_nombre: q.insurance.label,
      seguro_costo: q.insurance.cost,
      descuento: q.discount,
      total: q.total,
      status,
      reserva_id: null,
    }).select().single()
    if (!error && data) {
      setCotizaciones(prev => [data, ...prev])
      return data
    }
    return null
  }

  function resetForm() {
    setClientName(''); setClientPhone(''); setDays(3); setDiscount('')
    setInsurance(INSURANCE_OPTIONS[0])
  }

  async function handleSave() {
    if (!clientName.trim()) return
    setSaving(true)
    const q = buildQuoteData()
    await saveCotizacion(q, 'enviada')
    resetForm()
    setSaving(false)
  }

  async function handleWhatsApp() {
    if (!clientName.trim()) return
    setSending(true)
    const q = buildQuoteData()
    await saveCotizacion(q, 'enviada')
    await shareViaWhatsApp(q)
    resetForm()
    setSending(false)
  }

  function openPanel(cot: Cotizacion) {
    setPanelCot(cot)
    setPanelOpen(true)
  }

  function closePanel() {
    setPanelOpen(false)
    setTimeout(() => setPanelCot(null), 280)
  }

  async function handleStatusChange(id: string, status: CotizacionStatus) {
    const { data } = await db.from('cotizaciones').update({ status }).eq('id', id).select().single()
    if (data) {
      setCotizaciones(prev => prev.map(c => c.id === id ? data : c))
      setPanelCot(data)
    }
  }

  async function handleConvert(cot: Cotizacion) {
    // 1. Create client
    const { data: cliente } = await db.from('clientes').insert({
      nombre: cot.cliente_nombre,
      telefono: cot.cliente_telefono ?? null,
      apellido: null, email: null,
    }).select().single()

    // 2. Create reserva
    const today      = new Date()
    const devolucion = new Date(today); devolucion.setDate(today.getDate() + cot.dias)
    const { data: reserva } = await db.from('reservas').insert({
      cliente_id: cliente?.id ?? null,
      vehiculo_id: cot.vehiculo_id ?? null,
      fecha_entrega: today.toISOString().split('T')[0],
      fecha_devolucion: devolucion.toISOString().split('T')[0],
      status: 'confirmada',
      total: cot.total,
    }).select().single()

    if (!reserva) return

    // 3. Mark vehicle as reservado
    if (cot.vehiculo_id) {
      await db.from('vehiculos').update({
        status: 'reservado',
        cliente_actual: cot.cliente_nombre,
        info_cliente: `reserva ${reserva.id.slice(0, 8)}`,
      }).eq('id', cot.vehiculo_id)
    }

    // 4. Update cotizacion → convertida
    const { data: updated } = await db
      .from('cotizaciones').update({ status: 'convertida', reserva_id: reserva.id })
      .eq('id', cot.id).select().single()

    if (updated) {
      setCotizaciones(prev => prev.map(c => c.id === cot.id ? updated : c))
      setPanelCot(updated)
    }
  }

  // Stats
  const activas    = cotizaciones.filter(c => c.status === 'enviada').length
  const aceptadas  = cotizaciones.filter(c => c.status === 'aceptada').length
  const total_cots = cotizaciones.length
  const conversion = total_cots > 0 ? Math.round((aceptadas / total_cots) * 100) : 0

  const filtered = cotizaciones.filter(c => filter === 'Todas' ? true : c.status === FILTER_MAP[filter])

  return (
    <div className="screen">
      <div className="pagehead">
        <div>
          <div className="eyebrow">Cotizaciones</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>Cotizaciones</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4 }}>Crea y envía cotizaciones a tus clientes</p>
        </div>
      </div>

      <div className="cot-grid">

        {/* ── LEFT: Builder ── */}
        <div className="card qbuilder">
          <div className="qb-head">
            <div>
              <div className="eyebrow">Cotizador</div>
              <h2 className="h-display qb-title">Nueva cotización</h2>
            </div>
            <span className="chip">Vigente 7 días</span>
          </div>

          <div className="field">
            <label className="field-l">Nombre del cliente</label>
            <input className="field-i" placeholder="Nombre completo" value={clientName} onChange={e => setClientName(e.target.value)} />
          </div>

          <div className="field">
            <label className="field-l">
              WhatsApp <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <input className="field-i" placeholder="+52 55 1234 5678" value={clientPhone}
              onChange={e => setClientPhone(e.target.value)} inputMode="tel" />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-l">Días de renta</label>
              <div className="stepper">
                <button onClick={() => setDays(d => Math.max(1, d - 1))}>−</button>
                <span className="stepper-v mono">{days}</span>
                <button onClick={() => setDays(d => d + 1)}>+</button>
              </div>
            </div>
            <div className="field">
              <label className="field-l">Descuento</label>
              <div className="field-money">
                <span>$</span>
                <input className="field-i" placeholder="0" value={discount}
                  onChange={e => setDiscount(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" />
              </div>
            </div>
          </div>

          <div className="field">
            <label className="field-l">Vehículo</label>
            {loadingVeh ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                <span style={{ fontSize: 13, color: 'var(--ink3)' }}>Cargando…</span>
              </div>
            ) : vehicles.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--ink3)', padding: '8px 0' }}>Sin vehículos disponibles.</p>
            ) : (
              <div className="veh-pick">
                {vehicles.map(v => (
                  <VehOption key={v.id} v={v} selected={selectedId === v.id} onSelect={() => setSelectedId(v.id)} />
                ))}
              </div>
            )}
            <p className="veh-hint">Solo vehículos disponibles y reservados</p>
          </div>

          <div className="field">
            <label className="field-l">Seguro</label>
            <div className="segchips">
              {INSURANCE_OPTIONS.map(opt => (
                <button key={opt.label} className={`segchip${insurance.label === opt.label ? ' on' : ''}`} onClick={() => setInsurance(opt)}>
                  {opt.label}
                  <small>{opt.cost > 0 ? `$${fmt(opt.cost)}/renta` : 'sin costo'}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="qb-breakdown">
            <div className="qb-line">
              <span>{days} días × ${fmt(vehicleRate)}</span>
              <span className="mono">${fmt(subtotal)}</span>
            </div>
            {insurance.cost > 0 && (
              <div className="qb-line">
                <span>Seguro {insurance.label.toLowerCase()}</span>
                <span className="mono">${fmt(insurance.cost)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="qb-line discount">
                <span>Descuento</span>
                <span className="mono">−${fmt(discountAmount)}</span>
              </div>
            )}
            <div className="qb-total">
              <span>Total</span>
              <span className="qb-total-v">${fmt(total)}</span>
            </div>
            <p className="qb-note">Incluye IVA · vigencia 7 días</p>
          </div>

          <div className="qb-actions">
            <button className="btn" onClick={handleSave} disabled={!clientName.trim() || saving}>
              {saving ? <div className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> : <Download size={15} />}
              Guardar
            </button>
            <button className="btn primary" onClick={handleWhatsApp} disabled={!clientName.trim() || sending}>
              {sending
                ? <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Enviando…</>
                : <><MessageCircle size={15} />Enviar por WhatsApp</>}
            </button>
          </div>
        </div>

        {/* ── RIGHT: History ── */}
        <div className="qhistory">
          <div className="card qstats">
            <div className="qstat"><div className="qstat-v">{activas}</div><div className="qstat-l">Activas</div></div>
            <div className="qstat"><div className="qstat-v">{aceptadas}</div><div className="qstat-l">Aceptadas</div></div>
            <div className="qstat"><div className="qstat-v">{conversion}%</div><div className="qstat-l">Conversión</div></div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--card-line)' }}>
              <div className="qh-head">
                <h3 className="h-display" style={{ fontSize: 18 }}>Historial</h3>
                <div className="qh-filters">
                  {FILTER_TABS.map(tab => (
                    <button key={tab} className={`qhf${filter === tab ? ' on' : ''}`} onClick={() => setFilter(tab)}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="qlist" style={{ padding: '12px 14px 14px' }}>
              {loadingCots ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                  <div className="spinner" />
                </div>
              ) : filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--ink4)', padding: '24px 0', fontSize: 14 }}>
                  {cotizaciones.length === 0 ? 'Aún no hay cotizaciones. ¡Crea la primera!' : 'Sin cotizaciones en esta categoría'}
                </p>
              ) : filtered.map(c => (
                <QuoteRow key={c.id} c={c} onClick={() => openPanel(c)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <QuoteDetailPanel
        cot={panelCot}
        open={panelOpen}
        onClose={closePanel}
        onStatusChange={handleStatusChange}
        onConvert={handleConvert}
      />
    </div>
  )
}
