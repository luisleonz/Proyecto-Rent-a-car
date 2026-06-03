import { useState } from 'react'
import { User, Minus, Plus, Send } from 'lucide-react'
import AvatarCircle from '../../components/AvatarCircle'
import { sampleCotizaciones, VEHICLE_TYPES, INSURANCE_OPTIONS, Cotizacion } from '../../data/sampleData'

const fmt = (n: number) => new Intl.NumberFormat('es-MX').format(n)

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  enviada:  { bg: '#EEF4FF', text: '#4444AA', label: 'Enviada' },
  aceptada: { bg: '#E8F5EE', text: '#2D8A56', label: 'Aceptada' },
  vencida:  { bg: '#F0F0F0', text: '#838390', label: 'Vencida' },
}

const FILTER_TABS = ['Todas', 'Enviada', 'Aceptada', 'Vencida']

function CotizacionRow({ c }: { c: Cotizacion }) {
  const s = STATUS_STYLES[c.status]
  const total = c.days * c.dailyRate + c.insuranceCost - c.discount
  return (
    <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-gray-50">
      <AvatarCircle initials={c.clientInitials} size={40} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-sans truncate" style={{ color: '#1E1E26' }}>{c.clientName}</p>
        <p className="text-xs font-sans" style={{ color: '#838390' }}>{c.id} · {c.vehicleType} · {c.days}d · {c.date}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="font-mono text-xs font-bold" style={{ color: '#1E1E26' }}>${fmt(total)}</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF7' }}>
      {/* AppBar */}
      <div className="bg-white px-4 py-3 flex items-center border-b border-hairline">
        <h1 className="flex-1 text-xl font-bold font-serif" style={{ color: '#1E1E26' }}>Cotizaciones</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* ── Cotizador form ── */}
        <div className="px-4 pt-4">
          <div className="bg-white rounded-2xl border border-hairline p-4 flex flex-col gap-4">
            <p className="text-sm font-bold font-sans" style={{ color: '#1E1E26' }}>Cotizador rápido</p>

            {/* Cliente */}
            <div>
              <label className="text-xs font-sans mb-1.5 block" style={{ color: '#838390' }}>Cliente</label>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border"
                style={{ borderColor: clientName ? '#2D8A56' : '#EAEAE4' }}>
                <User size={15} style={{ color: '#838390', flexShrink: 0 }} />
                <input
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Nombre del cliente"
                  className="flex-1 bg-transparent text-sm font-sans outline-none placeholder:text-[#BCBCC4]"
                  style={{ color: '#1E1E26' }}
                />
              </div>
            </div>

            {/* Días */}
            <div>
              <label className="text-xs font-sans mb-1.5 block" style={{ color: '#838390' }}>Días de renta</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setDays(d => Math.max(1, d - 1))}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity active:opacity-70"
                  style={{ backgroundColor: '#F0F0F0' }}
                >
                  <Minus size={16} style={{ color: '#585868' }} />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-mono font-bold" style={{ color: '#1E1E26' }}>{days}</span>
                  <span className="text-sm font-sans ml-1.5" style={{ color: '#838390' }}>día{days !== 1 ? 's' : ''}</span>
                </div>
                <button
                  onClick={() => setDays(d => d + 1)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity active:opacity-70"
                  style={{ backgroundColor: '#2D8A56' }}
                >
                  <Plus size={16} className="text-white" />
                </button>
              </div>
            </div>

            {/* Tipo de vehículo */}
            <div>
              <label className="text-xs font-sans mb-2 block" style={{ color: '#838390' }}>Tipo de vehículo</label>
              <div className="grid grid-cols-3 gap-2">
                {VEHICLE_TYPES.map(vt => {
                  const sel = vehicleType.label === vt.label
                  return (
                    <button
                      key={vt.label}
                      onClick={() => setVehicleType(vt)}
                      className="flex flex-col items-start px-3 py-2.5 rounded-xl border transition-colors"
                      style={{
                        borderColor: sel ? '#2D8A56' : '#EAEAE4',
                        backgroundColor: sel ? '#E8F5EE' : 'white',
                      }}
                    >
                      <span className="text-xs font-semibold font-sans" style={{ color: sel ? '#2D8A56' : '#1E1E26' }}>{vt.label}</span>
                      <span className="text-xs font-mono mt-0.5" style={{ color: '#838390' }}>${fmt(vt.rate)}/d</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Seguro */}
            <div>
              <label className="text-xs font-sans mb-2 block" style={{ color: '#838390' }}>Seguro</label>
              <div className="flex gap-2">
                {INSURANCE_OPTIONS.map(opt => {
                  const sel = insurance.label === opt.label
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setInsurance(opt)}
                      className="flex-1 py-2.5 px-2 rounded-xl border transition-colors"
                      style={{
                        borderColor: sel ? '#2D8A56' : '#EAEAE4',
                        backgroundColor: sel ? '#E8F5EE' : 'white',
                      }}
                    >
                      <span className="block text-xs font-semibold font-sans" style={{ color: sel ? '#2D8A56' : '#585868' }}>
                        {opt.label}
                      </span>
                      <span className="block text-xs font-mono mt-0.5" style={{ color: '#838390' }}>
                        {opt.cost > 0 ? `+$${opt.cost}` : 'gratis'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Descuento */}
            <div>
              <label className="text-xs font-sans mb-1.5 block" style={{ color: '#838390' }}>Descuento (opcional)</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{ borderColor: '#EAEAE4' }}>
                <span className="font-mono text-sm" style={{ color: '#838390' }}>$</span>
                <input
                  value={discount}
                  onChange={e => setDiscount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="flex-1 bg-transparent text-sm font-mono outline-none placeholder:text-[#BCBCC4]"
                  style={{ color: '#1E1E26' }}
                  inputMode="numeric"
                />
              </div>
            </div>

            {/* Breakdown */}
            <div className="rounded-xl p-3.5 flex flex-col gap-2" style={{ backgroundColor: '#F4F4F0' }}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans" style={{ color: '#838390' }}>
                  {days} día{days !== 1 ? 's' : ''} × ${fmt(vehicleType.rate)}
                </span>
                <span className="text-xs font-mono" style={{ color: '#585868' }}>${fmt(subtotal)}</span>
              </div>
              {insurance.cost > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-sans" style={{ color: '#838390' }}>Seguro {insurance.label.toLowerCase()}</span>
                  <span className="text-xs font-mono" style={{ color: '#585868' }}>+${fmt(insurance.cost)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-sans" style={{ color: '#2D8A56' }}>Descuento</span>
                  <span className="text-xs font-mono" style={{ color: '#2D8A56' }}>−${fmt(discountAmount)}</span>
                </div>
              )}
              <div className="h-px" style={{ backgroundColor: '#DEDED8' }} />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold font-sans" style={{ color: '#1E1E26' }}>Total estimado</span>
                <span className="text-base font-bold font-mono" style={{ color: '#2D8A56' }}>${fmt(total)}</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleSend}
              disabled={!clientName.trim()}
              className="w-full py-3.5 rounded-xl font-semibold text-sm font-sans flex items-center justify-center gap-2 transition-opacity"
              style={{
                backgroundColor: clientName.trim() ? '#2D8A56' : '#BCBCC4',
                color: 'white',
                opacity: clientName.trim() ? 1 : 0.7,
              }}
            >
              <Send size={16} />
              {sent ? '¡Cotización enviada!' : 'Enviar cotización'}
            </button>
          </div>
        </div>

        {/* ── Historial ── */}
        <div className="px-4 mt-5 pb-4">
          <p className="text-sm font-bold font-sans mb-3" style={{ color: '#1E1E26' }}>Historial</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Activas',     value: String(activas),      color: '#4444AA', bg: '#EEF4FF' },
              { label: 'Aceptadas',   value: String(aceptadas),    color: '#2D8A56', bg: '#E8F5EE' },
              { label: 'Conversión',  value: `${conversion}%`,     color: '#C98A20', bg: '#FEF8EC' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl border border-hairline p-3 text-center" style={{ backgroundColor: bg }}>
                <p className="text-xl font-bold font-mono" style={{ color }}>{value}</p>
                <p className="text-xs font-sans mt-0.5" style={{ color: '#838390' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-0.5">
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

          {/* List */}
          <div className="bg-white rounded-2xl border border-hairline overflow-hidden">
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
