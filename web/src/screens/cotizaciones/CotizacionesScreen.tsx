import { useState } from 'react'
import { User, Minus, Plus, Send } from 'lucide-react'
import AvatarCircle from '../../components/AvatarCircle'
import { sampleCotizaciones, VEHICLE_TYPES, INSURANCE_OPTIONS, Cotizacion } from '../../data/sampleData'

const fmt = (n: number) => new Intl.NumberFormat('es-MX').format(n)

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  enviada:  { bg: 'rgba(68,68,170,0.15)', text: '#8888DD', label: 'Enviada' },
  aceptada: { bg: 'rgba(45,138,86,0.2)',  text: '#7FD9A8', label: 'Aceptada' },
  vencida:  { bg: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.4)', label: 'Vencida' },
}

const STATUS_STYLES_LIGHT: Record<string, { bg: string; text: string; label: string }> = {
  enviada:  { bg: '#EEF4FF', text: '#4444AA', label: 'Enviada' },
  aceptada: { bg: '#E8F5EE', text: '#2D8A56', label: 'Aceptada' },
  vencida:  { bg: '#F0F0F0', text: '#838390', label: 'Vencida' },
}

const FILTER_TABS = ['Todas', 'Enviada', 'Aceptada', 'Vencida']

function CotizacionRow({ c }: { c: Cotizacion }) {
  const s = STATUS_STYLES_LIGHT[c.status]
  const total = c.days * c.dailyRate + c.insuranceCost - c.discount
  return (
    <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-gray-50 hover:bg-gray-50">
      <AvatarCircle initials={c.clientInitials} size={40} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-sans truncate" style={{ color: '#1E1E26' }}>{c.clientName}</p>
        <p className="text-xs font-sans" style={{ color: '#838390' }}>
          {c.id} · {c.vehicleType} · {c.days}d · {c.date}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="font-mono text-xs font-bold" style={{ color: '#1E1E26' }}>${fmt(total)}</span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: s.bg, color: s.text }}
        >
          {s.label}
        </span>
      </div>
    </button>
  )
}

export default function CotizacionesScreen() {
  const [clientName, setClientName] = useState('')
  const [days, setDays] = useState(3)
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[1])
  const [insurance, setInsurance] = useState(INSURANCE_OPTIONS[0])
  const [discount, setDiscount] = useState('')
  const [filter, setFilter] = useState('Todas')
  const [sent, setSent] = useState(false)

  const discountAmount = parseInt(discount) || 0
  const subtotal = days * vehicleType.rate
  const total = Math.max(0, subtotal + insurance.cost - discountAmount)

  const activas    = sampleCotizaciones.filter(c => c.status === 'enviada').length
  const aceptadas  = sampleCotizaciones.filter(c => c.status === 'aceptada').length
  const conversion = Math.round((aceptadas / sampleCotizaciones.length) * 100)

  const filtered = sampleCotizaciones.filter(c =>
    filter === 'Todas' ? true : c.status === filter.toLowerCase()
  )

  function handleSend() {
    setSent(true)
    setTimeout(() => setSent(false), 2500)
    setClientName('')
    setDays(3)
    setDiscount('')
    setVehicleType(VEHICLE_TYPES[1])
    setInsurance(INSURANCE_OPTIONS[0])
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5EF' }}>
      {/* Mobile AppBar */}
      <div className="md:hidden bg-white px-4 py-3 flex items-center border-b border-hairline">
        <h1 className="flex-1 text-xl font-bold font-serif" style={{ color: '#1E1E26' }}>Cotizaciones</h1>
      </div>

      {/* Page header */}
      <div className="px-8 pt-6 pb-4">
        <p className="text-xs font-sans uppercase tracking-widest" style={{ color: '#838390' }}>COTIZACIONES</p>
        <h1 className="font-serif text-4xl font-bold mt-1" style={{ color: '#1E1E26' }}>Cotizaciones</h1>
        <p className="text-sm font-sans mt-1" style={{ color: '#838390' }}>Crea y gestiona cotizaciones para clientes</p>
      </div>

      {/* Main layout: stacked mobile, 2-col desktop */}
      <div className="flex-1 flex flex-col md:flex-row gap-5 px-8 pb-28">

        {/* ── LEFT: Cotizador (dark) ── */}
        <div className="md:w-[45%] flex-shrink-0">
          <div
            className="rounded-2xl p-6 flex flex-col gap-4 relative"
            style={{ backgroundColor: '#1A2D1E' }}
          >
            {/* Badge top-right */}
            <div
              className="absolute top-5 right-5 px-2.5 py-1 rounded-full border text-[10px] font-sans font-semibold"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.55)' }}
            >
              Vigente 7 días
            </div>

            {/* Eyebrow + title */}
            <div>
              <p
                className="text-[10px] font-sans font-semibold uppercase tracking-widest mb-1"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                COTIZADOR
              </p>
              <p
                className="font-serif italic text-2xl leading-tight"
                style={{ color: 'white' }}
              >
                Nueva cotización
              </p>
            </div>

            {/* Client input */}
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: `1px solid ${clientName ? '#2D8A56' : 'rgba(255,255,255,0.15)'}`,
              }}
            >
              <User size={15} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
              <input
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Nombre del cliente"
                className="flex-1 bg-transparent text-sm font-sans outline-none"
                style={{ color: 'white' }}
              />
            </div>

            {/* Días + Descuento row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Días stepper */}
              <div>
                <label
                  className="block text-[10px] font-sans font-semibold uppercase tracking-wide mb-2"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Días de renta
                </label>
                <div
                  className="flex items-center rounded-xl overflow-hidden"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <button
                    onClick={() => setDays(d => Math.max(1, d - 1))}
                    className="w-9 h-9 flex items-center justify-center flex-shrink-0 transition-opacity active:opacity-70"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                  >
                    <Minus size={14} />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="font-mono font-bold text-lg text-white">{days}</span>
                  </div>
                  <button
                    onClick={() => setDays(d => d + 1)}
                    className="w-9 h-9 flex items-center justify-center flex-shrink-0 transition-opacity active:opacity-70"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Descuento */}
              <div>
                <label
                  className="block text-[10px] font-sans font-semibold uppercase tracking-wide mb-2"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Descuento
                </label>
                <div
                  className="flex items-center gap-2 px-3 h-9 rounded-xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <span className="font-mono text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>$</span>
                  <input
                    value={discount}
                    onChange={e => setDiscount(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    className="flex-1 bg-transparent text-sm font-mono outline-none w-0"
                    style={{ color: 'white' }}
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>

            {/* Tipo de vehículo */}
            <div>
              <label
                className="block text-[10px] font-sans font-semibold uppercase tracking-wide mb-2"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Tipo de vehículo
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {VEHICLE_TYPES.map(vt => {
                  const sel = vehicleType.label === vt.label
                  return (
                    <button
                      key={vt.label}
                      onClick={() => setVehicleType(vt)}
                      className="flex flex-col items-start px-2.5 py-2 rounded-xl border transition-colors"
                      style={{
                        borderColor: sel ? '#2D8A56' : 'rgba(255,255,255,0.12)',
                        backgroundColor: sel ? 'rgba(45,138,86,0.25)' : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      <span
                        className="text-[11px] font-semibold font-sans"
                        style={{ color: sel ? '#7FD9A8' : 'rgba(255,255,255,0.8)' }}
                      >
                        {vt.label}
                      </span>
                      <span
                        className="text-[10px] font-mono mt-0.5"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        ${fmt(vt.rate)}/d
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Seguro */}
            <div>
              <label
                className="block text-[10px] font-sans font-semibold uppercase tracking-wide mb-2"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Seguro
              </label>
              <div className="flex gap-2">
                {INSURANCE_OPTIONS.map(opt => {
                  const sel = insurance.label === opt.label
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setInsurance(opt)}
                      className="flex-1 py-2.5 px-2 rounded-xl border transition-colors"
                      style={{
                        borderColor: sel ? '#2D8A56' : 'rgba(255,255,255,0.12)',
                        backgroundColor: sel ? 'rgba(45,138,86,0.25)' : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      <span
                        className="block text-[11px] font-semibold font-sans"
                        style={{ color: sel ? '#7FD9A8' : 'rgba(255,255,255,0.8)' }}
                      >
                        {opt.label}
                      </span>
                      <span className="block text-[10px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {opt.cost > 0 ? `$${opt.cost}` : 'gratis'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Breakdown */}
            <div
              className="rounded-xl p-4 flex flex-col gap-2"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {days} días × ${fmt(vehicleType.rate)}
                </span>
                <span className="text-xs font-mono text-white">${fmt(subtotal)}</span>
              </div>
              {insurance.cost > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-sans" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Seguro {insurance.label.toLowerCase()}
                  </span>
                  <span className="text-xs font-mono text-white">${fmt(insurance.cost)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-sans" style={{ color: '#7FD9A8' }}>Descuento</span>
                  <span className="text-xs font-mono" style={{ color: '#7FD9A8' }}>−${fmt(discountAmount)}</span>
                </div>
              )}
              <div className="h-px" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold font-sans text-white">Total</span>
                <span className="text-lg font-bold font-mono text-white">${fmt(total)}</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleSend}
              disabled={!clientName.trim()}
              className="w-full py-3.5 rounded-xl font-semibold text-sm font-sans flex items-center justify-center gap-2 transition-opacity"
              style={{
                backgroundColor: clientName.trim() ? '#2D8A56' : 'rgba(255,255,255,0.15)',
                color: clientName.trim() ? 'white' : 'rgba(255,255,255,0.4)',
              }}
            >
              <Send size={15} />
              {sent ? '¡Cotización enviada!' : 'Enviar cotización'}
            </button>
          </div>
        </div>

        {/* ── RIGHT: Historial (light) ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Cotiz. activas', value: String(activas),       color: '#4444AA', bg: '#EEF4FF' },
              { label: 'Aceptadas',      value: String(aceptadas),     color: '#2D8A56', bg: '#E8F5EE' },
              { label: 'Conversión',     value: `${conversion}%`,      color: '#C98A20', bg: '#FEF8EC' },
            ].map(({ label, value, color, bg }) => (
              <div
                key={label}
                className="rounded-2xl px-4 py-3 text-center"
                style={{ backgroundColor: bg, border: '1px solid #EAEAE4' }}
              >
                <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
                <p className="text-[11px] font-sans mt-0.5" style={{ color: '#838390' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Historial header + filter tabs */}
          <div>
            <p className="font-serif text-lg font-bold mb-3" style={{ color: '#1E1E26' }}>Historial</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold font-sans transition-colors"
                  style={{
                    backgroundColor: filter === tab ? '#1E1E26' : '#F0F0F0',
                    color: filter === tab ? 'white' : '#585868',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EAEAE4' }}>
            {filtered.length === 0 ? (
              <p className="text-center text-sm font-sans py-10" style={{ color: '#BCBCC4' }}>
                Sin cotizaciones en esta categoría
              </p>
            ) : filtered.map((c, i) => (
              <div key={c.id}>
                <CotizacionRow c={c} />
                {i < filtered.length - 1 && (
                  <div className="h-px mx-4" style={{ backgroundColor: '#EAEAE4' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
