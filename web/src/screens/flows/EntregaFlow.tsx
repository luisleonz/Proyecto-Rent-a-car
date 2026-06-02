import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ChevronRight } from 'lucide-react'
import { todayReservations, tomorrowReservations } from '../../data/sampleData'
import { entregaState } from '../../state/flowState'
import AvatarCircle from '../../components/AvatarCircle'
import SectionEyebrow from '../../components/SectionEyebrow'

const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n)
const FUEL_OPTS = ['E', '1/4', '1/2', '3/4', 'F']
const PHOTO_SLOTS = ['frente', 'lat. izq', 'lat. der', 'trasera', 'interior', 'tablero']
const ALL_RES = [...todayReservations, ...tomorrowReservations]

// ─── Shared components ────────────────────────────────────────────────────────

function FlowTopBar({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <button
        onClick={() => navigate(-1)}
        className="w-9 h-9 rounded-full border border-hairline flex items-center justify-center"
        style={{ backgroundColor: '#F2F1EC' }}
      >
        <ArrowLeft size={18} style={{ color: '#585868' }} />
      </button>
      <button onClick={onCancel} className="text-[13px] font-medium font-sans" style={{ color: '#585868' }}>
        Cancelar
      </button>
    </div>
  )
}

function EntregaHeader({ step }: { step: number }) {
  const labels = ['documentos y firma', 'inspección + fotos', 'cobro']
  return (
    <div className="px-5 pb-3.5">
      <div className="flex gap-1.5 mb-2.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full"
            style={{ backgroundColor: i <= step ? '#2D8A56' : '#EAEAE4' }} />
        ))}
      </div>
      <p className="text-[22px] font-bold font-serif" style={{ color: '#1E1E26' }}>Entrega · check-in</p>
      <p className="text-xs font-sans mt-1" style={{ color: '#585868' }}>Paso {step + 1} de 3 · {labels[step]}</p>
    </div>
  )
}

function ClientCard({ resId }: { resId: string }) {
  const res = ALL_RES.find(r => r.id === resId) ?? ALL_RES[0]
  return (
    <div className="rounded-2xl border p-3.5 flex items-center gap-3"
      style={{ backgroundColor: '#E8F5EE', borderColor: '#B8DFC8' }}>
      <AvatarCircle initials={res.clientInitials} size={42} />
      <div>
        <p className="text-sm font-semibold font-sans" style={{ color: '#1E1E26' }}>{res.clientName}</p>
        <p className="text-[11px] font-sans mt-0.5" style={{ color: '#585868' }}>
          {res.vehicle} · {res.type} · 3 días
        </p>
      </div>
    </div>
  )
}

function ContinueButton({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  return (
    <div className="bg-white border-t border-hairline p-4 flex-shrink-0">
      <button
        disabled={disabled}
        onClick={onClick}
        className="w-full py-3.5 rounded-full text-sm font-semibold font-sans text-white flex items-center justify-center gap-1 transition-opacity"
        style={{ backgroundColor: '#2D8A56', opacity: disabled ? 0.5 : 1 }}
      >
        Continuar
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

// ─── PASO 1 · Documentos + Firma ─────────────────────────────────────────────

const DOCS = [
  { key: 'lic' as const, label: 'Licencia vigente', hint: 'foto del frente' },
  { key: 'ine' as const, label: 'INE / pasaporte', hint: 'frente y reverso' },
  { key: 'dom' as const, label: 'Comprobante domicilio', hint: 'no mayor a 3 meses' },
  { key: 'tarj' as const, label: 'Tarjeta de garantía', hint: 'depósito' },
]

export function EntregaStep1Screen() {
  const navigate = useNavigate()
  const { resId = '1' } = useParams()
  const [docs, setDocs] = useState({ lic: entregaState.docLic, ine: entregaState.docIne, dom: entregaState.docDom, tarj: entregaState.docTarj })
  const [signed, setSigned] = useState(entregaState.signed)
  const allDocs = Object.values(docs).every(Boolean)
  const ready = allDocs && signed

  function handleContinue() {
    entregaState.docLic = docs.lic; entregaState.docIne = docs.ine
    entregaState.docDom = docs.dom; entregaState.docTarj = docs.tarj
    entregaState.signed = signed
    navigate(`/app/entrega/${resId}/2`)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF7' }}>
      <div className="bg-white border-b border-hairline flex-shrink-0">
        <FlowTopBar onCancel={() => navigate('/app/home', { replace: true })} />
        <EntregaHeader step={0} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        <ClientCard resId={resId} />

        <SectionEyebrow text="Verificar documentos" />
        {DOCS.map(({ key, label, hint }) => {
          const ok = docs[key]
          return (
            <button
              key={key}
              onClick={() => setDocs(d => ({ ...d, [key]: !ok }))}
              className="w-full rounded-2xl border text-left transition-colors"
              style={{
                backgroundColor: ok ? '#E8F5EE' : 'white',
                borderColor: ok ? '#B8DFC8' : '#EAEAE4',
                borderWidth: ok ? 1.5 : 1,
              }}
            >
              <div className="flex items-center gap-3 px-3.5 py-3">
                <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 border-2"
                  style={{
                    backgroundColor: ok ? '#2D8A56' : 'transparent',
                    borderColor: ok ? '#2D8A56' : '#EAEAE4',
                  }}>
                  {ok && <Check size={12} className="text-white" />}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold font-sans" style={{ color: ok ? '#1F6B40' : '#1E1E26' }}>{label}</p>
                  <p className="text-[11px] font-sans mt-0.5" style={{ color: '#585868' }}>{hint}</p>
                </div>
                {!ok && (
                  <span className="text-[11px] font-semibold font-sans px-2.5 py-1 rounded-full border border-hairline" style={{ color: '#585868' }}>
                    Subir
                  </span>
                )}
              </div>
            </button>
          )
        })}

        <SectionEyebrow text="Firma del cliente" />
        <button
          onClick={() => setSigned(true)}
          className="w-full rounded-2xl border transition-colors"
          style={{
            backgroundColor: signed ? '#E8F5EE' : 'white',
            borderColor: signed ? '#B8DFC8' : '#EAEAE4',
            borderWidth: signed ? 1.5 : 1,
            minHeight: 90,
          }}
        >
          <div className="flex flex-col items-center justify-center py-4 px-4 gap-1.5">
            {signed ? (
              <p className="text-[13px] font-semibold font-sans" style={{ color: '#1F6B40' }}>✓ Firmado</p>
            ) : (
              <>
                <p className="font-mono text-xs tracking-[2px]" style={{ color: '#BCBCC4' }}>— — — — — — — — — — — —</p>
                <p className="text-xs font-sans" style={{ color: '#838390' }}>Toca para firmar</p>
              </>
            )}
          </div>
        </button>
      </div>

      <ContinueButton disabled={!ready} onClick={handleContinue} />
    </div>
  )
}

// ─── PASO 2 · Inspección + Fotos ─────────────────────────────────────────────

export function EntregaStep2Screen() {
  const navigate = useNavigate()
  const { resId = '1' } = useParams()
  const [fuel, setFuel] = useState('3/4')
  const [km, setKm] = useState('45,200')
  const [damages, setDamages] = useState(0)
  const [photoCount, setPhotoCount] = useState(3)
  const ready = photoCount >= 3

  function handleContinue() {
    entregaState.fuelLevel = fuel
    entregaState.kmStart = km.replace(/,/g, '')
    entregaState.damageCount = damages
    entregaState.photoCount = photoCount
    navigate(`/app/entrega/${resId}/3`)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF7' }}>
      <div className="bg-white border-b border-hairline flex-shrink-0">
        <FlowTopBar onCancel={() => navigate('/app/home', { replace: true })} />
        <EntregaHeader step={1} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* KM + Tank info cards */}
        <div className="flex gap-2.5">
          <div className="flex-1 bg-white rounded-2xl border border-hairline p-3">
            <SectionEyebrow text="Tanque" />
            <p className="font-serif mt-2" style={{ fontSize: 24, color: '#2D8A56' }}>{fuel}</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-hairline p-3">
            <SectionEyebrow text="Kilometraje" />
            <p className="font-serif mt-2" style={{ fontSize: 20, color: '#1E1E26' }}>{km}</p>
            <p className="text-[11px] font-sans" style={{ color: '#838390' }}>km</p>
          </div>
        </div>

        {/* Fuel selector */}
        <div>
          <SectionEyebrow text="Nivel del tanque" />
          <div className="flex gap-1.5 mt-2">
            {FUEL_OPTS.map(opt => {
              const sel = opt === fuel
              return (
                <button
                  key={opt}
                  onClick={() => setFuel(opt)}
                  className="flex-1 py-2.5 rounded-xl border flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: sel ? '#E8F5EE' : 'white',
                    borderColor: sel ? '#2D8A56' : '#EAEAE4',
                    borderWidth: sel ? 1.5 : 1,
                  }}
                >
                  <span className="text-sm font-serif" style={{ color: sel ? '#2D8A56' : '#1E1E26', fontWeight: sel ? 600 : 400 }}>
                    {opt}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Damages */}
        <div>
          <SectionEyebrow text="Daños existentes (toca para marcar)" />
          <button
            onClick={() => setDamages(d => d + 1)}
            className="w-full bg-white rounded-2xl border border-hairline p-3.5 flex flex-col items-center gap-2 mt-2"
          >
            <div className="w-full h-[80px] rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F2F1EC' }}>
              <span className="text-[13px] font-sans" style={{ color: '#838390' }}>🚗  Vista del vehículo  🚗</span>
            </div>
            <p className="text-[11px] font-sans" style={{ color: damages > 0 ? '#C98A20' : '#838390' }}>
              {damages === 0 ? 'Sin daños marcados — toca para agregar' : `${damages} daño(s) marcado(s)`}
            </p>
            {damages > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setDamages(0) }}
                className="text-[11px] font-sans" style={{ color: '#585868' }}
              >
                Limpiar
              </button>
            )}
          </button>
        </div>

        {/* Photos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionEyebrow text="Fotos de entrega" />
            <span className="text-[11px] font-semibold font-sans" style={{ color: photoCount >= 3 ? '#2D8A56' : '#C98A20' }}>
              {photoCount} / {PHOTO_SLOTS.length}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {PHOTO_SLOTS.map((slot, idx) => {
              const has = idx < photoCount
              return (
                <button
                  key={slot}
                  onClick={() => !has && setPhotoCount(idx + 1)}
                  className="aspect-square rounded-xl border flex flex-col items-center justify-center gap-1"
                  style={{
                    backgroundColor: has ? '#F2F1EC' : 'transparent',
                    borderColor: has ? '#EAEAE4' : '#BCBCC4',
                    borderWidth: has ? 1 : 1.5,
                  }}
                >
                  {has ? (
                    <>
                      <span style={{ fontSize: 20 }}>📷</span>
                      <span className="text-[9px] font-sans" style={{ color: '#838390' }}>{slot}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-light" style={{ color: '#BCBCC4' }}>+</span>
                      <span className="text-[9px] font-sans" style={{ color: '#BCBCC4' }}>{slot}</span>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <ContinueButton disabled={!ready} onClick={handleContinue} />
    </div>
  )
}

// ─── PASO 3 · Cobro ───────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Efectivo' },
  { id: 'card', label: 'Tarjeta' },
  { id: 'tx', label: 'Transfer.' },
  { id: 'mix', label: 'Mixto' },
]
const TOTAL = 4700

export function EntregaStep3Screen() {
  const navigate = useNavigate()
  const { resId = '1' } = useParams()
  const [method, setMethod] = useState('cash')
  const [amount, setAmount] = useState('5000')
  const amountNum = parseInt(amount.replace(/\D/g, '')) || 0
  const change = amountNum - TOTAL

  function handleCobrar() {
    entregaState.paymentMethod = method
    entregaState.amountReceived = amount
    navigate(`/app/entrega/${resId}/ok`)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF7' }}>
      <div className="bg-white border-b border-hairline flex-shrink-0">
        <FlowTopBar onCancel={() => navigate('/app/home', { replace: true })} />
        <EntregaHeader step={2} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* Amount card */}
        <div className="rounded-[18px] p-[18px]" style={{ backgroundColor: '#2D8A56' }}>
          <p className="text-[10px] font-semibold font-sans uppercase tracking-[1px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
            A COBRAR AHORA
          </p>
          <p className="font-serif text-white mt-1" style={{ fontSize: 42, letterSpacing: '-1px', lineHeight: '44px' }}>
            ${fmt(TOTAL)}
          </p>
          <p className="text-[11px] font-sans mt-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
            $2,400 renta · $300 seguro · $2,000 depósito
          </p>
        </div>

        {/* Payment method */}
        <div>
          <SectionEyebrow text="Método de pago" />
          <div className="flex gap-1.5 mt-2">
            {PAYMENT_METHODS.map(({ id, label }) => {
              const sel = id === method
              return (
                <button
                  key={id}
                  onClick={() => setMethod(id)}
                  className="flex-1 py-3 rounded-xl border flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: sel ? '#E8F5EE' : 'white',
                    borderColor: sel ? '#2D8A56' : '#EAEAE4',
                    borderWidth: sel ? 1.5 : 1,
                  }}
                >
                  <span className="text-[11px] font-semibold font-sans" style={{ color: sel ? '#2D8A56' : '#1E1E26' }}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Cash input */}
        {method === 'cash' && (
          <div className="bg-white rounded-2xl border border-hairline p-3.5">
            <SectionEyebrow text="Recibido" />
            <div className="flex items-baseline gap-1 mt-2 mb-3">
              <span className="font-serif" style={{ fontSize: 22, color: '#838390' }}>$</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="flex-1 font-serif outline-none border-b"
                style={{ fontSize: 28, color: '#1E1E26', borderColor: '#EAEAE4' }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] font-sans" style={{ color: '#585868' }}>Cambio</span>
              <span className="text-base font-semibold font-mono"
                style={{ color: change >= 0 ? '#2D8A56' : '#C04040' }}>
                ${fmt(Math.abs(change))}
              </span>
            </div>
          </div>
        )}

        {/* WhatsApp */}
        <div className="bg-white rounded-2xl border border-hairline px-3.5 py-3 flex items-center gap-3">
          <div className="w-[22px] h-[22px] rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2D8A56' }}>
            <Check size={14} className="text-white" />
          </div>
          <p className="text-xs font-sans" style={{ color: '#1E1E26' }}>Enviar recibo por WhatsApp al cliente</p>
        </div>
      </div>

      <div className="bg-white border-t border-hairline p-4 flex-shrink-0">
        <button
          onClick={handleCobrar}
          className="w-full py-3.5 rounded-full text-sm font-semibold font-sans text-white"
          style={{ backgroundColor: '#2D8A56' }}
        >
          Cobrar y entregar auto
        </button>
      </div>
    </div>
  )
}

// ─── SUCCESS ──────────────────────────────────────────────────────────────────

export function EntregaOkScreen() {
  const navigate = useNavigate()
  const { resId = '1' } = useParams()
  const res = ALL_RES.find(r => r.id === resId) ?? ALL_RES[0]
  const firstName = res.clientName.split(' ')[0]

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: '#1A5231' }}>
      <div className="absolute w-[320px] h-[320px] rounded-full pointer-events-none"
        style={{ backgroundColor: 'rgba(45,138,86,0.4)', top: -120, right: -50 }} />

      <div className="flex-1 flex flex-col justify-between px-7 pt-16 pb-8 relative z-10">
        <div className="flex flex-col gap-[18px]">
          <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#2D8A56' }}>
            <span style={{ fontSize: 32 }}>🔑</span>
          </div>

          <div>
            <p className="text-[11px] font-semibold font-sans uppercase" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '1.5px' }}>
              ENTREGA COMPLETADA
            </p>
            <p className="font-serif text-white mt-1.5" style={{ fontSize: 34, lineHeight: '1.15' }}>
              ¡Auto entregado!<br />¡Buen viaje, {firstName}!
            </p>
          </div>

          <div className="rounded-2xl border p-4 flex flex-col gap-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }}>
            {[
              { label: 'Cobrado', value: `$${fmt(TOTAL)}` },
              { label: 'Devuelve', value: 'Vie 24 may · 18:00' },
              { label: 'Recordatorio', value: '1 día antes' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <p className="text-xs font-sans" style={{ color: 'rgba(255,255,255,0.65)' }}>{label}</p>
                <p className="text-xs font-sans font-medium text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => navigate('/app/home', { replace: true })}
            className="w-full py-3.5 rounded-full text-sm font-semibold font-sans"
            style={{ backgroundColor: 'white', color: '#1E1E26' }}
          >
            Volver al inicio
          </button>
          <button className="w-full py-3.5 rounded-full text-sm font-semibold font-sans border"
            style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            💬  Reenviar recibo
          </button>
        </div>
      </div>
    </div>
  )
}
