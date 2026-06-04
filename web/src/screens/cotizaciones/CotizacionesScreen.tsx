import { useState } from 'react'
import { Check } from 'lucide-react'
import { sampleCotizaciones, sampleFleet, INSURANCE_OPTIONS, Cotizacion, Vehicle } from '../../data/sampleData'

const fmt = (n: number) => new Intl.NumberFormat('es-MX').format(n)

const STATUS_CHIP: Record<string, string> = {
  enviada:  '',
  aceptada: 'primary',
  vencida:  '',
}

const STATUS_LABEL: Record<string, string> = {
  enviada:  'Enviada',
  aceptada: 'Aceptada',
  vencida:  'Vencida',
}

const STATUS_DOT: Record<string, string> = {
  enviada:  'neutral',
  aceptada: '',
  vencida:  'neutral',
}

const FILTER_TABS = ['Todas', 'Enviadas', 'Aceptadas', 'Vencidas']

const FILTER_MAP: Record<string, string> = {
  'Enviadas':  'enviada',
  'Aceptadas': 'aceptada',
  'Vencidas':  'vencida',
}

/* ─── Quote row ─────────────────────────────────────────────── */
function QuoteRow({ c }: { c: Cotizacion }) {
  const total = c.days * c.dailyRate + c.insuranceCost - c.discount
  const chipClass = STATUS_CHIP[c.status] ?? ''
  const dotClass  = STATUS_DOT[c.status] ?? ''

  return (
    <button className="qrow">
      <div className="avatar" style={{ width: 38, height: 38, fontSize: 13 }}>
        {c.clientInitials}
      </div>
      <div className="qrow-main">
        <div className="qrow-who">{c.clientName}</div>
        <div className="qrow-meta">
          {c.id} · {c.vehicleType}{c.plate ? ` · ${c.plate}` : ''} · {c.days}d · {c.date}
        </div>
      </div>
      <div className="qrow-end">
        <span className="qrow-total mono">${fmt(total)}</span>
        <span className={`chip sm ${chipClass}`}>
          <span className={`dot ${dotClass}`} />
          {STATUS_LABEL[c.status]}
        </span>
      </div>
    </button>
  )
}

/* ─── Vehicle option ────────────────────────────────────────── */
function VehOption({ v, selected, onSelect }: { v: Vehicle; selected: boolean; onSelect: () => void }) {
  return (
    <button className={`veh-opt${selected ? ' on' : ''}`} onClick={onSelect}>
      <span className={`veh-dot tone-${v.tone ?? 'slate'}`} />
      <div className="veh-info">
        <span className="veh-name">{v.model} <span className="veh-year">{v.year}</span></span>
        <span className="veh-meta">{v.plate} · {v.segment} · {v.transmission}</span>
      </div>
      <div className="veh-rate">
        <span className="vr-v">${fmt(v.dailyRate ?? 0)}</span>
        <span className="vr-u">/día</span>
      </div>
      {selected && (
        <span className="veh-check"><Check size={11} /></span>
      )}
    </button>
  )
}

/* ─── Main screen ───────────────────────────────────────────── */
export default function CotizacionesScreen() {
  const [clientName, setClientName] = useState('')
  const [days, setDays] = useState(3)
  const [discount, setDiscount] = useState('')
  const [selectedPlate, setSelectedPlate] = useState<string>(sampleFleet[0].plate)
  const [insurance, setInsurance] = useState(INSURANCE_OPTIONS[0])
  const [filter, setFilter] = useState('Todas')
  const [sent, setSent] = useState(false)

  const availableVehicles = sampleFleet.filter(v => v.status === 'disponible' || v.status === 'reservado')
  const selectedVehicle = availableVehicles.find(v => v.plate === selectedPlate) ?? availableVehicles[0]

  const discountAmount = parseInt(discount) || 0
  const vehicleRate = selectedVehicle?.dailyRate ?? 0
  const subtotal = days * vehicleRate
  const total = Math.max(0, subtotal + insurance.cost - discountAmount)

  const activas    = sampleCotizaciones.filter(c => c.status === 'enviada').length
  const aceptadas  = sampleCotizaciones.filter(c => c.status === 'aceptada').length
  const conversion = Math.round((aceptadas / sampleCotizaciones.length) * 100)

  const filtered = sampleCotizaciones.filter(c =>
    filter === 'Todas' ? true : c.status === FILTER_MAP[filter]
  )

  function handleSave() {
    setClientName('')
    setDays(3)
    setDiscount('')
    setInsurance(INSURANCE_OPTIONS[0])
  }

  function handleSend() {
    setSent(true)
    setTimeout(() => setSent(false), 2500)
    handleSave()
  }

  return (
    <div className="screen">
      {/* Page head */}
      <div className="pagehead">
        <div>
          <div className="eyebrow">Cotizaciones</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>Cotizaciones</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4 }}>Crea y gestiona cotizaciones para clientes</p>
        </div>
      </div>

      {/* 2-col grid */}
      <div className="cot-grid">

        {/* ── LEFT: Builder ── */}
        <div className="card qbuilder">
          {/* Head */}
          <div className="qb-head">
            <div>
              <div className="eyebrow">Cotizador</div>
              <h2 className="h-display qb-title">Nueva cotización</h2>
            </div>
            <span className="chip">Vigente 7 días</span>
          </div>

          {/* Client */}
          <div className="field">
            <label className="field-l">Cliente</label>
            <input
              className="field-i"
              placeholder="Nombre del cliente"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
            />
          </div>

          {/* Días + Descuento */}
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

          {/* Vehicle picker */}
          <div className="field">
            <label className="field-l">Vehículo</label>
            <div className="veh-pick">
              {availableVehicles.map(v => (
                <VehOption
                  key={v.plate}
                  v={v}
                  selected={selectedPlate === v.plate}
                  onSelect={() => setSelectedPlate(v.plate)}
                />
              ))}
            </div>
            <p className="veh-hint">Solo se muestran vehículos disponibles y reservados</p>
          </div>

          {/* Insurance chips */}
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

          {/* Breakdown */}
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

          {/* Actions */}
          <div className="qb-actions">
            <button className="btn" onClick={handleSave}>Guardar</button>
            <button
              className={`btn primary${sent ? ' is-sent' : ''}`}
              onClick={handleSend}
              disabled={!clientName.trim()}
            >
              {sent ? '¡Enviada!' : 'Enviar por WhatsApp'}
            </button>
          </div>
        </div>

        {/* ── RIGHT: History ── */}
        <div className="qhistory">
          {/* Stats */}
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

          {/* History list */}
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
                <QuoteRow key={c.id} c={c} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
