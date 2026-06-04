import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ChevronRight } from 'lucide-react'
import { todayReservations, tomorrowReservations } from '../../data/sampleData'
import { devolucionState } from '../../state/flowState'
import AvatarCircle from '../../components/AvatarCircle'
import SectionEyebrow from '../../components/SectionEyebrow'

const fmt = (n: number) => new Intl.NumberFormat('en-US').format(Math.abs(n))
const FUEL_OPTS = ['E', '1/4', '1/2', '3/4', 'F']
const ALL_RES = [...todayReservations, ...tomorrowReservations]

// ─── Shared components ────────────────────────────────────────────────────────

function FlowTopBar({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <button
        onClick={() => navigate(-1)}
        className="w-9 h-9 rounded-full border border-hairline flex items-center justify-center"
        style={{ backgroundColor: 'var(--paper-alt)' }}
      >
        <ArrowLeft size={18} style={{ color: 'var(--ink2)' }} />
      </button>
      <button onClick={onCancel} className="text-[13px] font-medium font-sans" style={{ color: 'var(--ink2)' }}>
        Cancelar
      </button>
    </div>
  )
}

function DevHeader({ step }: { step: number }) {
  const labels = ['inspección comparada', 'cargos finales', 'cerrar contrato']
  return (
    <div className="px-5 pb-3.5">
      <div className="flex gap-1.5 mb-2.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full"
            style={{ backgroundColor: i <= step ? 'var(--primary)' : 'var(--card-line)' }} />
        ))}
      </div>
      <p className="text-[22px] font-bold font-serif" style={{ color: 'var(--ink)' }}>Devolución</p>
      <p className="text-xs font-sans mt-1" style={{ color: 'var(--ink2)' }}>Paso {step + 1} de 3 · {labels[step]}</p>
    </div>
  )
}

function DevClientCard({ resId }: { resId: string }) {
  const res = ALL_RES.find(r => r.id === resId) ?? ALL_RES[0]
  return (
    <div className="rounded-2xl border p-2.5 flex items-center gap-2.5"
      style={{ backgroundColor: 'var(--primary-soft)', borderColor: 'var(--primary-line)' }}>
      <AvatarCircle initials={res.clientInitials} size={32} />
      <p className="text-[12px] font-semibold font-sans" style={{ color: 'var(--ink)' }}>
        {res.clientName} · {res.vehicle}
      </p>
    </div>
  )
}

function ContinueButton({ disabled, onClick, label = 'Continuar' }: { disabled?: boolean; onClick: () => void; label?: string }) {
  return (
    <div className="border-t border-hairline p-4 flex-shrink-0" style={{ background: 'var(--card)' }}>
      <button
        disabled={disabled}
        onClick={onClick}
        className="w-full py-3.5 rounded-full text-sm font-semibold font-sans text-white flex items-center justify-center gap-1 transition-opacity"
        style={{ backgroundColor: 'var(--primary)', opacity: disabled ? 0.5 : 1 }}
      >
        {label}
        {label === 'Continuar' && <ChevronRight size={18} />}
      </button>
    </div>
  )
}

function CompareRow({ label, value, color = 'var(--ink)' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-xs font-sans" style={{ color: 'var(--ink2)' }}>{label}</p>
      <p className="text-xs font-semibold font-mono" style={{ color }}>{value}</p>
    </div>
  )
}

function ChargeRow({ label, value, color = 'var(--ink)', faded = false }: { label: string; value: string; color?: string; faded?: boolean }) {
  return (
    <div className="flex justify-between items-center" style={{ opacity: faded ? 0.5 : 1 }}>
      <p className="text-xs font-sans flex-1 pr-2" style={{ color: 'var(--ink2)' }}>{label}</p>
      <p className="text-[13px] font-medium font-mono" style={{ color }}>{value}</p>
    </div>
  )
}

// ─── PASO 1 · Inspección comparada ───────────────────────────────────────────

export function DevolucionStep1Screen() {
  const navigate = useNavigate()
  const { resId = '3' } = useParams()
  const [km, setKm] = useState('45,680')
  const [fuel, setFuel] = useState('1/2')
  const [damages, setDamages] = useState(0)
  const kmNum = parseInt(km.replace(/,/g, '')) || 45680
  const recorrido = Math.max(0, kmNum - 45200)

  function handleContinue() {
    devolucionState.kmReturn = km.replace(/,/g, '')
    devolucionState.fuelLevel = fuel
    devolucionState.newDamageCount = damages
    navigate(`/app/devolucion/${resId}/2`)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--paper)' }}>
      <div className="border-b border-hairline flex-shrink-0" style={{ background: 'var(--card)' }}>
        <FlowTopBar onCancel={() => navigate('/app/home', { replace: true })} />
        <DevHeader step={0} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        <DevClientCard resId={resId} />

        {/* Comparison */}
        <div>
          <SectionEyebrow text="Comparar con la entrega" />
          <div className="flex gap-2 mt-2">
            <div className="flex-1 rounded-2xl border border-hairline p-3 flex flex-col gap-1.5" style={{ background: 'var(--card)' }}>
              <p className="text-[10px] font-semibold font-sans uppercase tracking-[0.6px]" style={{ color: 'var(--ink3)' }}>ENTREGA · lun 20</p>
              <CompareRow label="Km" value="45,200" />
              <CompareRow label="Tanque" value="3/4" />
              <CompareRow label="Daños" value="2" />
            </div>
            <div className="flex-1 rounded-2xl border p-3 flex flex-col gap-1.5"
              style={{ backgroundColor: 'var(--primary-soft)', borderColor: 'var(--primary-line)' }}>
              <p className="text-[10px] font-bold font-sans uppercase tracking-[0.6px]" style={{ color: 'var(--primary-dark)' }}>DEVOLUCIÓN · hoy</p>
              <CompareRow label="Km" value={km} color="var(--primary)" />
              <CompareRow label="Tanque" value={fuel}
                color={fuel === '3/4' || fuel === 'F' ? 'var(--primary)' : 'var(--warn-ink)'} />
              <CompareRow label="Daños nuevos" value={String(damages)}
                color={damages > 0 ? 'var(--warn-ink)' : 'var(--primary)'} />
            </div>
          </div>
        </div>

        {/* KM input */}
        <div>
          <SectionEyebrow text="Kilometraje actual" />
          <div className="rounded-2xl border border-hairline p-3.5 mt-2" style={{ background: 'var(--card)' }}>
            <div className="flex items-baseline gap-2">
              <input
                type="text"
                value={km}
                onChange={e => setKm(e.target.value)}
                className="flex-1 font-serif outline-none border-b"
                style={{ fontSize: 22, color: 'var(--ink)', borderColor: 'var(--card-line)' }}
              />
              <span className="text-sm font-sans" style={{ color: 'var(--ink3)' }}>km</span>
            </div>
            <p className="text-[11px] font-sans mt-1.5" style={{ color: 'var(--ink2)' }}>
              Recorrido: {fmt(recorrido)} km en 3 días
            </p>
          </div>
        </div>

        {/* Fuel */}
        <div>
          <SectionEyebrow text="Nivel del tanque" />
          <div className="flex gap-1.5 mt-2">
            {FUEL_OPTS.map(opt => {
              const sel = opt === fuel
              return (
                <button key={opt} onClick={() => setFuel(opt)}
                  className="flex-1 py-2.5 rounded-xl border flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: sel ? 'var(--primary-soft)' : 'white',
                    borderColor: sel ? 'var(--primary)' : 'var(--card-line)',
                    borderWidth: sel ? 1.5 : 1,
                  }}>
                  <span className="text-sm font-serif" style={{ color: sel ? 'var(--primary)' : 'var(--ink)', fontWeight: sel ? 600 : 400 }}>
                    {opt}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Damages */}
        <div>
          <SectionEyebrow text="Daños nuevos (si los hay)" />
          <button
            onClick={() => setDamages(d => d + 1)}
            className="w-full rounded-2xl border border-hairline p-3.5 flex flex-col items-center gap-2 mt-2"
            style={{ background: 'var(--card)' }}
          >
            <div className="w-full h-[70px] rounded-xl flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--paper-alt)' }}>
              <span style={{ fontSize: 28 }}>🚗</span>
              {damages > 0 && <span className="text-sm" style={{ color: 'var(--warn-ink)' }}>{damages}⚠</span>}
            </div>
            <p className="text-[11px] font-sans" style={{ color: damages > 0 ? 'var(--warn-ink)' : 'var(--ink3)' }}>
              {damages === 0 ? 'Sin daños nuevos — toca para marcar' : `${damages} daño(s) nuevo(s)`}
            </p>
            {damages > 0 && (
              <button onClick={e => { e.stopPropagation(); setDamages(0) }}
                className="text-[11px] font-sans" style={{ color: 'var(--ink2)' }}>
                Limpiar
              </button>
            )}
          </button>
        </div>
      </div>

      <ContinueButton onClick={handleContinue} />
    </div>
  )
}

// ─── PASO 2 · Cargos finales ──────────────────────────────────────────────────

export function DevolucionStep2Screen() {
  const navigate = useNavigate()
  const { resId = '3' } = useParams()
  const s = devolucionState
  const isCharge = s.toCharge > 0

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--paper)' }}>
      <div className="border-b border-hairline flex-shrink-0" style={{ background: 'var(--card)' }}>
        <FlowTopBar onCancel={() => navigate('/app/home', { replace: true })} />
        <DevHeader step={1} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* Contract summary */}
        <div className="rounded-2xl border border-hairline p-4 flex flex-col gap-1.5" style={{ background: 'var(--card)' }}>
          <SectionEyebrow text="Resumen del contrato" />
          <div className="mt-1 flex flex-col gap-1.5">
            <ChargeRow label="Renta · 3 días" value="$2,400" />
            <ChargeRow label="Seguro" value="$300" />
            <ChargeRow label="Depósito recibido" value={`$${fmt(s.depositAmount)}`} color="var(--primary)" />
          </div>
        </div>

        {/* Extra charges */}
        <div className="rounded-2xl border border-hairline p-4 flex flex-col gap-2" style={{ background: 'var(--card)' }}>
          <SectionEyebrow text="Cargos extra" />
          <div className="mt-1 flex flex-col gap-2">
            <ChargeRow
              label={s.kmExtra > 0 ? `Km extra (${s.kmExtra} km × $3)` : 'Km dentro del límite'}
              value={`$${fmt(s.kmExtra * 3)}`}
              faded={s.kmExtra === 0}
            />
            <ChargeRow
              label={s.fuelDeficit > 0 ? `Diferencia tanque (${s.fuelDeficit}/4 × $80)` : 'Tanque correcto'}
              value={`$${fmt(s.fuelDeficit * 80)}`}
              faded={s.fuelDeficit === 0}
            />
            <ChargeRow
              label={s.newDamageCount > 0 ? `Daños nuevos (${s.newDamageCount} × $800 estim.)` : 'Sin daños nuevos'}
              value={`$${fmt(s.newDamageCount * 800)}`}
              color={s.newDamageCount > 0 ? 'var(--warn-ink)' : 'var(--ink)'}
              faded={s.newDamageCount === 0}
            />
            <div className="h-px" style={{ backgroundColor: 'var(--card-line)' }} />
            <div className="flex justify-between">
              <p className="text-[13px] font-semibold font-sans" style={{ color: 'var(--ink)' }}>Subtotal extras</p>
              <p className="text-[15px] font-semibold font-mono" style={{ color: 'var(--ink)' }}>${fmt(s.extraCharges)}</p>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="rounded-2xl border p-[18px]"
          style={{
            backgroundColor: isCharge ? 'var(--danger)' : 'var(--primary-soft)',
            borderColor: isCharge ? 'var(--danger)' : 'var(--primary-line)',
          }}>
          <p className="text-[10px] font-semibold font-sans uppercase tracking-[1px]"
            style={{ color: isCharge ? 'rgba(255,255,255,0.75)' : 'var(--primary-dark)' }}>
            {isCharge ? 'COBRAR AL CLIENTE' : 'DEVOLVER AL CLIENTE'}
          </p>
          <p className="font-serif mt-1.5" style={{ fontSize: 42, letterSpacing: '-1px', lineHeight: '44px', color: isCharge ? 'white' : 'var(--primary)' }}>
            ${fmt(isCharge ? s.toCharge : s.toReturn)}
          </p>
          <p className="text-[11px] font-sans mt-1.5"
            style={{ color: isCharge ? 'rgba(255,255,255,0.8)' : 'var(--ink2)' }}>
            {isCharge
              ? `Extras ($${fmt(s.extraCharges)}) excedieron depósito ($${fmt(s.depositAmount)})`
              : `Del depósito de $${fmt(s.depositAmount)} retenemos $${fmt(s.extraCharges)} por extras`
            }
          </p>
        </div>
      </div>

      <ContinueButton onClick={() => navigate(`/app/devolucion/${resId}/3`)} />
    </div>
  )
}

// ─── PASO 3 · Cerrar contrato ─────────────────────────────────────────────────

const RETURN_METHODS = [
  { id: 'cash', label: 'Efectivo' },
  { id: 'tx', label: 'Transfer.' },
  { id: 'card', label: 'A tarjeta' },
]

export function DevolucionStep3Screen() {
  const navigate = useNavigate()
  const { resId = '3' } = useParams()
  const [returnMethod, setReturnMethod] = useState('cash')
  const [photoTaken, setPhotoTaken] = useState(false)
  const [signed, setSigned] = useState(false)
  const ready = photoTaken && signed

  function handleCerrar() {
    devolucionState.returnMethod = returnMethod
    devolucionState.photoTaken = photoTaken
    devolucionState.signed = signed
    navigate(`/app/devolucion/${resId}/ok`)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--paper)' }}>
      <div className="border-b border-hairline flex-shrink-0" style={{ background: 'var(--card)' }}>
        <FlowTopBar onCancel={() => navigate('/app/home', { replace: true })} />
        <DevHeader step={2} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* Return method */}
        <div className="rounded-2xl border border-hairline p-3.5" style={{ background: 'var(--card)' }}>
          <SectionEyebrow text="Forma de devolución" />
          <div className="flex gap-1.5 mt-2.5">
            {RETURN_METHODS.map(({ id, label }) => {
              const sel = id === returnMethod
              return (
                <button key={id} onClick={() => setReturnMethod(id)}
                  className="flex-1 py-2.5 rounded-xl border flex items-center justify-center"
                  style={{
                    backgroundColor: sel ? 'var(--primary-soft)' : 'white',
                    borderColor: sel ? 'var(--primary)' : 'var(--card-line)',
                    borderWidth: sel ? 1.5 : 1,
                  }}>
                  <span className="text-[11px] font-semibold font-sans" style={{ color: sel ? 'var(--primary)' : 'var(--ink)' }}>{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Photo */}
        <div>
          <SectionEyebrow text="Foto final del auto" />
          <button
            onClick={() => setPhotoTaken(true)}
            className="w-full rounded-2xl border mt-2 transition-colors"
            style={{
              backgroundColor: photoTaken ? 'var(--primary-soft)' : 'white',
              borderColor: photoTaken ? 'var(--primary-line)' : 'var(--card-line)',
              borderWidth: photoTaken ? 1.5 : 1,
            }}
          >
            <div className="m-2 h-[90px] rounded-xl flex items-center justify-center gap-2"
              style={{ backgroundColor: photoTaken ? 'rgba(184,223,200,0.3)' : 'var(--paper-alt)' }}>
              {photoTaken ? (
                <div className="flex flex-col items-center gap-1">
                  <span style={{ fontSize: 28 }}>📷</span>
                  <p className="text-xs font-semibold font-sans" style={{ color: 'var(--primary-dark)' }}>✓ Foto de cierre</p>
                </div>
              ) : (
                <>
                  <span style={{ fontSize: 20 }}>📷</span>
                  <p className="text-[13px] font-semibold font-sans" style={{ color: 'var(--ink2)' }}>Tomar foto de cierre</p>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Signature */}
        <div>
          <SectionEyebrow text="Firma del cliente" />
          <button
            onClick={() => setSigned(true)}
            className="w-full rounded-2xl border mt-2 transition-colors"
            style={{
              backgroundColor: signed ? 'var(--primary-soft)' : 'white',
              borderColor: signed ? 'var(--primary-line)' : 'var(--card-line)',
              borderWidth: signed ? 1.5 : 1,
              minHeight: 88,
            }}
          >
            <div className="flex flex-col items-center justify-center py-4 gap-1.5">
              {signed ? (
                <p className="text-[13px] font-semibold font-sans" style={{ color: 'var(--primary-dark)' }}>✓ Conforme con la devolución</p>
              ) : (
                <>
                  <p className="font-mono text-xs tracking-[2px]" style={{ color: 'var(--ink4)' }}>— — — — — — — — — — — —</p>
                  <p className="text-xs font-sans" style={{ color: 'var(--ink3)' }}>Toca para firmar conformidad</p>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Receipt */}
        <div className="rounded-2xl border border-hairline px-3.5 py-3 flex items-center gap-3" style={{ background: 'var(--card)' }}>
          <div className="w-[22px] h-[22px] rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
            <Check size={14} className="text-white" />
          </div>
          <p className="text-xs font-sans" style={{ color: 'var(--ink)' }}>Enviar comprobante y recibir calificación</p>
        </div>
      </div>

      <ContinueButton disabled={!ready} onClick={handleCerrar} label="Cerrar contrato" />
    </div>
  )
}

// ─── SUCCESS ──────────────────────────────────────────────────────────────────

export function DevolucionOkScreen() {
  const navigate = useNavigate()
  const { resId = '3' } = useParams()
  const res = ALL_RES.find(r => r.id === resId) ?? ALL_RES[0]
  const aDevolver = devolucionState.toReturn

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: 'var(--primary-deep)' }}>
      <div className="absolute w-[320px] h-[320px] rounded-full pointer-events-none"
        style={{ backgroundColor: 'oklch(0.52 0.13 155 / 0.4)', top: -120, right: -50 }} />

      <div className="flex-1 flex flex-col justify-between px-7 pt-16 pb-8 relative z-10">
        <div className="flex flex-col gap-[18px]">
          <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--primary)' }}>
            <Check size={36} className="text-white" />
          </div>

          <div>
            <p className="text-[11px] font-semibold font-sans uppercase" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '1.5px' }}>
              CONTRATO CERRADO
            </p>
            <p className="font-serif text-white mt-1.5" style={{ fontSize: 34, lineHeight: '1.15' }}>
              ¡Listo!<br />Auto devuelto y disponible.
            </p>
          </div>

          <div className="rounded-2xl border p-4 flex flex-col gap-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }}>
            {[
              { label: 'Cliente', value: res.clientName },
              { label: 'Devuelto al cliente', value: `$${fmt(aDevolver)}` },
              { label: 'Auto', value: res.vehicle },
              { label: 'Estado', value: '● Disponible' },
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
            style={{ backgroundColor: 'white', color: 'var(--ink)' }}
          >
            Volver al inicio
          </button>
          <button className="w-full py-3.5 rounded-full text-sm font-semibold font-sans border"
            style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            💬  Enviar comprobante
          </button>
        </div>
      </div>
    </div>
  )
}
