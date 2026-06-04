import { useState, useEffect } from 'react'
import { Check, Download, MessageCircle, X, ArrowRight, RefreshCw } from 'lucide-react'
import jsPDF from 'jspdf'
import { supabase } from '../../lib/supabase'
import type { Vehiculo, Cotizacion, CotizacionStatus } from '../../lib/database.types'

const db = supabase as any

const fmt = (n: number) => new Intl.NumberFormat('es-MX').format(n)

const INSURANCE_OPTIONS = [
  { label: 'Básico',   cost: 0 },
  { label: 'Estándar', cost: 350 },
  { label: 'Total',    cost: 650 },
]

const STATUS_CHIP: Record<CotizacionStatus, string> = {
  enviada:    '',
  aceptada:   'primary',
  vencida:    '',
  convertida: '',
}
const STATUS_LABEL: Record<CotizacionStatus, string> = {
  enviada:    'Enviada',
  aceptada:   'Aceptada',
  vencida:    'Vencida',
  convertida: 'Convertida',
}
const STATUS_DOT: Record<CotizacionStatus, string> = {
  enviada:    'neutral',
  aceptada:   '',
  vencida:    'neutral',
  convertida: '',
}

const FILTER_TABS = ['Todas', 'Enviadas', 'Aceptadas', 'Vencidas', 'Convertidas']
const FILTER_MAP: Record<string, CotizacionStatus> = {
  'Enviadas':    'enviada',
  'Aceptadas':   'aceptada',
  'Vencidas':    'vencida',
  'Convertidas': 'convertida',
}

/* ─── PDF generation ────────────────────────────────────────── */
interface QuoteData {
  id: string
  clientName: string
  vehicle: string
  plate: string
  days: number
  dailyRate: number
  insurance: { label: string; cost: number }
  discount: number
  total: number
  date: string
}

function generatePDF(q: QuoteData): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const green: [number, number, number] = [38, 120, 72]
  const greenSoft: [number, number, number] = [232, 247, 239]
  const ink: [number, number, number] = [30, 30, 38]
  const ink3: [number, number, number] = [120, 120, 130]

  doc.setFillColor(...green)
  doc.rect(0, 0, W, 46, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('Lucianos Rent-a-Car', 20, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.text('Tu mejor opción en renta de autos', 20, 28)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(q.id, W - 20, 19, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Emitida: ${q.date}`, W - 20, 27, { align: 'right' })
  doc.text('Vigencia: 7 días', W - 20, 34, { align: 'right' })

  doc.setTextColor(...ink3)
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  doc.text('COTIZACIÓN PARA', 20, 60)
  doc.setTextColor(...ink)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text(q.clientName, 20, 70)

  doc.setDrawColor(...green)
  doc.setLineWidth(0.4)
  doc.line(20, 76, W - 20, 76)

  doc.setTextColor(...ink3)
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  doc.text('VEHÍCULO', 20, 88)
  doc.setTextColor(...ink)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(q.vehicle, 20, 97)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(...ink3)
  doc.text(`Placa: ${q.plate}   ·   ${q.days} día${q.days !== 1 ? 's' : ''} de renta`, 20, 105)

  doc.setTextColor(...ink3)
  doc.setFontSize(9.5)
  doc.text('DESGLOSE', 20, 120)

  const rows: [string, string][] = [
    [`${q.days} días × $${fmt(q.dailyRate)}/día`, `$${fmt(q.days * q.dailyRate)}`],
  ]
  if (q.insurance.cost > 0) rows.push([`Seguro ${q.insurance.label}`, `$${fmt(q.insurance.cost)}`])
  if (q.discount > 0) rows.push([`Descuento aplicado`, `-$${fmt(q.discount)}`])

  let y = 130
  rows.forEach(([label, amount]) => {
    doc.setTextColor(...ink)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(label, 25, y)
    doc.text(amount, W - 25, y, { align: 'right' })
    doc.setDrawColor(230, 230, 235)
    doc.setLineWidth(0.2)
    doc.line(25, y + 4, W - 25, y + 4)
    y += 14
  })

  doc.setFillColor(...greenSoft)
  doc.roundedRect(20, y + 2, W - 40, 20, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...ink)
  doc.text('TOTAL', 28, y + 15)
  doc.setFontSize(18)
  doc.setTextColor(...green)
  doc.text(`$${fmt(q.total)} MXN`, W - 27, y + 15, { align: 'right' })

  y += 40
  doc.setDrawColor(200, 200, 205)
  doc.setLineWidth(0.3)
  doc.line(20, y, W - 20, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...ink3)
  doc.text('Lucianos Rent-a-Car  ·  Precios en MXN con IVA incluido  ·  Vigencia 7 días a partir de la fecha de emisión', W / 2, y + 8, { align: 'center' })
  doc.text('Este documento es una cotización y no constituye un contrato de renta.', W / 2, y + 15, { align: 'center' })

  return doc.output('blob')
}

/* ─── WhatsApp share ─────────────────────────────────────────── */
async function shareViaWhatsApp(q: QuoteData) {
  const blob = generatePDF(q)
  const file = new File([blob], `cotizacion-${q.id}.pdf`, { type: 'application/pdf' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Cotización ${q.id} — Lucianos Rent-a-Car` })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `cotizacion-${q.id}.pdf`
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)

  const msg = [
    `Hola ${q.clientName}! 👋`,
    ``,
    `Le compartimos su cotización de *Lucianos Rent-a-Car*:`,
    ``,
    `🚗 *${q.vehicle}* (${q.plate})`,
    `📅 ${q.days} día${q.days !== 1 ? 's' : ''} de renta`,
    `💰 Total: *$${fmt(q.total)} MXN*`,
    ``,
    `Adjunto encontrará el PDF con todos los detalles.`,
    `Vigencia: 7 días · Para confirmar su reserva contáctenos.`,
  ].join('\n')
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
}

function downloadPDF(q: QuoteData) {
  const blob = generatePDF(q)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `cotizacion-${q.id}.pdf`
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}

function cotizacionToQuoteData(cot: Cotizacion): QuoteData {
  const ins = INSURANCE_OPTIONS.find(o => o.label === cot.seguro_nombre) ?? { label: cot.seguro_nombre ?? 'Básico', cost: cot.seguro_costo }
  return {
    id:         cot.id,
    clientName: cot.cliente_nombre,
    vehicle:    cot.vehiculo_modelo ?? 'Vehículo',
    plate:      cot.vehiculo_placa  ?? '',
    days:       cot.dias,
    dailyRate:  cot.tarifa_diaria   ?? 0,
    insurance:  ins,
    discount:   cot.descuento,
    total:      cot.total,
    date:       new Date(cot.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
  }
}

/* ─── Quote detail panel ────────────────────────────────────── */
const toDateInput = (d: Date) => d.toISOString().split('T')[0]

interface PanelProps {
  cot: Cotizacion | null
  open: boolean
  onClose: () => void
  onStatusChange: (id: string, status: CotizacionStatus) => Promise<void>
  onConvert: (cot: Cotizacion, fechaEntrega: string, fechaDevolucion: string) => Promise<void>
}

function QuoteDetailPanel({ cot, open, onClose, onStatusChange, onConvert }: PanelProps) {
  const [working, setWorking]         = useState(false)
  const [confirmStep, setConfirmStep] = useState(false)
  const today = toDateInput(new Date())

  const defaultDevolucion = () => {
    const d = new Date(); d.setDate(d.getDate() + (cot?.dias ?? 1)); return toDateInput(d)
  }
  const [fechaEntrega, setFechaEntrega]       = useState(today)
  const [fechaDevolucion, setFechaDevolucion] = useState(defaultDevolucion)

  if (!open && confirmStep) setConfirmStep(false)

  async function handleStatus(status: CotizacionStatus) {
    if (!cot || working) return
    setWorking(true)
    await onStatusChange(cot.id, status)
    setWorking(false)
  }

  async function handleConvert() {
    if (!cot || working) return
    setWorking(true)
    await onConvert(cot, fechaEntrega, fechaDevolucion)
    setConfirmStep(false)
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
              <div className="qpanel-section">
                <div className="qpanel-section-title">Vehículo</div>
                <div style={{ background: 'var(--paper-alt)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{cot.vehiculo_modelo ?? '—'}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 3 }}>
                    {cot.vehiculo_placa}{cot.dias ? ` · ${cot.dias} días` : ''}
                  </div>
                </div>
              </div>

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
                confirmStep ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)', marginBottom: 2 }}>
                      Fechas de la reserva
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 4 }}>Entrega</div>
                        <input type="date" className="field-i" value={fechaEntrega}
                          min={today}
                          onChange={e => {
                            setFechaEntrega(e.target.value)
                            const d = new Date(e.target.value); d.setDate(d.getDate() + cot.dias)
                            setFechaDevolucion(toDateInput(d))
                          }}
                          style={{ width: '100%', fontSize: 13 }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 4 }}>Devolución</div>
                        <input type="date" className="field-i" value={fechaDevolucion}
                          min={fechaEntrega}
                          onChange={e => setFechaDevolucion(e.target.value)}
                          style={{ width: '100%', fontSize: 13 }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmStep(false)} disabled={working}>
                        Cancelar
                      </button>
                      <button className="btn primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleConvert} disabled={working || !fechaEntrega || !fechaDevolucion}>
                        {working
                          ? <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Creando…</>
                          : <><Check size={15} />Confirmar reserva</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setConfirmStep(true)}>
                    <ArrowRight size={15} />Convertir a reserva
                  </button>
                )
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
      <div className="avatar" style={{ width: 38, height: 38, fontSize: 13 }}>
        {c.cliente_nombre.slice(0, 2).toUpperCase()}
      </div>
      <div className="qrow-main">
        <div className="qrow-who">{c.cliente_nombre}</div>
        <div className="qrow-meta">
          {c.id} · {c.vehiculo_modelo ?? '—'}{c.vehiculo_placa ? ` · ${c.vehiculo_placa}` : ''} · {c.dias}d
        </div>
      </div>
      <div className="qrow-end">
        <span className="qrow-total mono">${fmt(c.total)}</span>
        <span className={`chip sm ${STATUS_CHIP[c.status] ?? ''}`}>
          <span className={`dot ${STATUS_DOT[c.status] ?? ''}`} />
          {STATUS_LABEL[c.status]}
        </span>
      </div>
    </button>
  )
}

/* ─── Vehicle option ────────────────────────────────────────── */
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
  const [clientName, setClientName]     = useState('')
  const [clientPhone, setClientPhone]   = useState('')
  const [days, setDays]                 = useState(3)
  const [discount, setDiscount]         = useState('')
  const [selectedId, setSelectedId]     = useState<string>('')
  const [insurance, setInsurance]       = useState(INSURANCE_OPTIONS[0])
  const [filter, setFilter]             = useState('Todas')
  const [sent, setSent]                 = useState(false)
  const [vehicles, setVehicles]         = useState<Vehiculo[]>([])
  const [loadingVeh, setLoadingVeh]     = useState(true)
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [panelOpen, setPanelOpen]       = useState(false)
  const [panelCot, setPanelCot]         = useState<Cotizacion | null>(null)

  useEffect(() => {
    supabase
      .from('vehiculos')
      .select('*')
      .in('status', ['disponible', 'reservado'])
      .order('modelo')
      .then(({ data }) => {
        const list: Vehiculo[] = data ?? []
        setVehicles(list)
        if (list.length > 0) setSelectedId(list[0].id)
        setLoadingVeh(false)
      })

    db.from('cotizaciones').select('*').order('created_at', { ascending: false })
      .then(({ data }: { data: Cotizacion[] | null }) => {
        setCotizaciones(data ?? [])
      })
  }, [])

  const selectedVehicle = vehicles.find(v => v.id === selectedId)

  const discountAmount = parseInt(discount) || 0
  const vehicleRate    = selectedVehicle?.tarifa_diaria ?? 0
  const subtotal       = days * vehicleRate
  const total          = Math.max(0, subtotal + insurance.cost - discountAmount)

  function buildQuoteData(): QuoteData {
    const now = new Date()
    const dateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    const id = `COT-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*900)+100)}`
    return {
      id,
      clientName: clientName.trim() || 'Cliente',
      vehicle: selectedVehicle ? `${selectedVehicle.modelo} ${selectedVehicle.anio ?? ''}`.trim() : 'Vehículo',
      plate: selectedVehicle?.placa ?? '',
      days,
      dailyRate: vehicleRate,
      insurance,
      discount: discountAmount,
      total,
      date: dateStr,
    }
  }

  async function saveCotizacion(q: QuoteData): Promise<Cotizacion | null> {
    const payload = {
      id: q.id,
      cliente_nombre: q.clientName,
      cliente_telefono: clientPhone.trim() || null,
      vehiculo_id: selectedVehicle?.id ?? null,
      vehiculo_modelo: selectedVehicle ? `${selectedVehicle.modelo} ${selectedVehicle.anio ?? ''}`.trim() : null,
      vehiculo_placa: selectedVehicle?.placa ?? null,
      dias: q.days,
      tarifa_diaria: q.dailyRate,
      seguro_nombre: q.insurance.label,
      seguro_costo: q.insurance.cost,
      descuento: q.discount,
      total: q.total,
      status: 'enviada' as CotizacionStatus,
    }
    const { data } = await db.from('cotizaciones').insert(payload).select().single()
    return data ?? null
  }

  async function handleWhatsApp() {
    if (!clientName.trim()) return
    const q = buildQuoteData()
    setSent(true)
    setTimeout(() => setSent(false), 3000)
    const saved = await saveCotizacion(q)
    if (saved) setCotizaciones(prev => [saved, ...prev])
    await shareViaWhatsApp(q)
  }

  function handleDownload() {
    const q = buildQuoteData()
    downloadPDF(q)
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

  async function handleConvert(cot: Cotizacion, fechaEntrega: string, fechaDevolucion: string) {
    const { data: cliente } = await db.from('clientes').insert({
      nombre: cot.cliente_nombre,
      telefono: cot.cliente_telefono ?? null,
      apellido: null, email: null,
    }).select().single()

    const { data: reserva } = await db.from('reservas').insert({
      cliente_id: cliente?.id ?? null,
      vehiculo_id: cot.vehiculo_id ?? null,
      fecha_entrega: fechaEntrega,
      fecha_devolucion: fechaDevolucion,
      status: 'confirmada',
      total: cot.total,
    }).select().single()

    if (!reserva) return

    if (cot.vehiculo_id) {
      await db.from('vehiculos').update({
        status: 'reservado',
        cliente_actual: cot.cliente_nombre,
        info_cliente: `reserva ${reserva.id.slice(0, 8)}`,
      }).eq('id', cot.vehiculo_id)
    }

    const { data: updated } = await db
      .from('cotizaciones').update({ status: 'convertida', reserva_id: reserva.id })
      .eq('id', cot.id).select().single()

    if (updated) {
      setCotizaciones(prev => prev.map(c => c.id === cot.id ? updated : c))
      setPanelCot(updated)
    }
  }

  const activas    = cotizaciones.filter(c => c.status === 'enviada').length
  const aceptadas  = cotizaciones.filter(c => c.status === 'aceptada').length
  const total_cots = cotizaciones.length
  const conversion = total_cots > 0 ? Math.round((aceptadas / total_cots) * 100) : 0

  const filtered = cotizaciones.filter(c => filter === 'Todas' ? true : c.status === FILTER_MAP[filter])

  return (
    <div className="screen">
      <QuoteDetailPanel
        cot={panelCot}
        open={panelOpen}
        onClose={closePanel}
        onStatusChange={handleStatusChange}
        onConvert={handleConvert}
      />

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
            <input
              className="field-i"
              placeholder="Nombre completo"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-l">WhatsApp del cliente <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>(opcional)</span></label>
            <input
              className="field-i"
              placeholder="+52 55 1234 5678"
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
              inputMode="tel"
            />
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
                <input
                  className="field-i"
                  placeholder="0"
                  value={discount}
                  onChange={e => setDiscount(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>

          <div className="field">
            <label className="field-l">Vehículo</label>
            {loadingVeh ? (
              <div style={{ padding: '14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                <span style={{ fontSize: 13, color: 'var(--ink3)' }}>Cargando vehículos…</span>
              </div>
            ) : vehicles.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--ink3)', padding: '10px 0' }}>Sin vehículos disponibles en este momento.</p>
            ) : (
              <div className="veh-pick">
                {vehicles.map(v => (
                  <VehOption
                    key={v.id}
                    v={v}
                    selected={selectedId === v.id}
                    onSelect={() => setSelectedId(v.id)}
                  />
                ))}
              </div>
            )}
            <p className="veh-hint">Solo vehículos disponibles y reservados</p>
          </div>

          <div className="field">
            <label className="field-l">Seguro</label>
            <div className="segchips">
              {INSURANCE_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  className={`segchip${insurance.label === opt.label ? ' on' : ''}`}
                  onClick={() => setInsurance(opt)}
                >
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
            <button
              className="btn"
              onClick={handleDownload}
              disabled={!clientName.trim() || vehicles.length === 0}
            >
              <Download size={15} />PDF
            </button>
            <button
              className={`btn primary${sent ? ' is-sent' : ''}`}
              onClick={handleWhatsApp}
              disabled={!clientName.trim() || vehicles.length === 0}
            >
              {sent
                ? <><Check size={15} />¡Listo!</>
                : <><MessageCircle size={15} />Enviar por WhatsApp</>}
            </button>
          </div>
        </div>

        {/* ── RIGHT: History ── */}
        <div className="qhistory">
          <div className="card qstats">
            <div className="qstat">
              <div className="qstat-v">{activas}</div>
              <div className="qstat-l">Activas</div>
            </div>
            <div className="qstat">
              <div className="qstat-v">{aceptadas}</div>
              <div className="qstat-l">Aceptadas</div>
            </div>
            <div className="qstat">
              <div className="qstat-v">{conversion}%</div>
              <div className="qstat-l">Conversión</div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--card-line)' }}>
              <div className="qh-head">
                <h3 className="h-display" style={{ fontSize: 18 }}>Historial</h3>
                <div className="qh-filters">
                  {FILTER_TABS.map(tab => (
                    <button
                      key={tab}
                      className={`qhf${filter === tab ? ' on' : ''}`}
                      onClick={() => setFilter(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="qlist" style={{ padding: '12px 14px 14px' }}>
              {filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--ink4)', padding: '24px 0', fontSize: 14 }}>
                  Sin cotizaciones en esta categoría
                </p>
              ) : filtered.map(c => (
                <QuoteRow key={c.id} c={c} onClick={() => openPanel(c)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
