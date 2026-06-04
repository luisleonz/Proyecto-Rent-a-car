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

// ─── Layout wrapper ────────────────────────────────────────────────────────────
function FlowPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="screen">
      <div style={{ maxWidth: 540, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  )
}

// ─── Shared components ────────────────────────────────────────────────────────

function FlowTopBar({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--card-line)', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        <ArrowLeft size={17} style={{ color: 'var(--ink2)' }} />
      </button>
      <button
        onClick={onCancel}
        style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink2)', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Cancelar
      </button>
    </div>
  )
}

function DevHeader({ step }: { step: number }) {
  const labels = ['inspección comparada', 'cargos finales', 'cerrar contrato']
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= step ? 'var(--primary)' : 'var(--card-line)' }} />
        ))}
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)', margin: 0 }}>
        Devolución
      </p>
      <p style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 4 }}>
        Paso {step + 1} de 3 · {labels[step]}
      </p>
    </div>
  )
}

function DevClientCard({ resId }: { resId: string }) {
  const res = ALL_RES.find(r => r.id === resId) ?? ALL_RES[0]
  return (
    <div style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary-line)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <AvatarCircle initials={res.clientInitials} size={32} />
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
        {res.clientName} · {res.vehicle}
      </p>
    </div>
  )
}

function ContinueBtn({ disabled, onClick, label = 'Continuar' }: { disabled?: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        width: '100%', padding: '14px 0', borderRadius: 999, background: 'var(--primary)',
        color: 'white', fontSize: 14, fontWeight: 600, border: 0, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontFamily: 'inherit', marginTop: 8,
      }}
    >
      {label}
      {label === 'Continuar' && <ChevronRight size={17} />}
    </button>
  )
}

function CompareRow({ label, value, color = 'var(--ink)' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <p style={{ fontSize: 12, color: 'var(--ink2)', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color, margin: 0 }}>{value}</p>
    </div>
  )
}

function ChargeRow({ label, value, color = 'var(--ink)', faded = false }: { label: string; value: string; color?: string; faded?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: faded ? 0.5 : 1 }}>
      <p style={{ fontSize: 12, color: 'var(--ink2)', flex: 1, paddingRight: 8, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-mono)', color, margin: 0 }}>{value}</p>
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
    <FlowPage>
      <FlowTopBar onCancel={() => navigate('/app/reservations', { replace: true })} />
      <DevHeader step={0} />
      <DevClientCard resId={resId} />

      {/* Comparison */}
      <div>
        <SectionEyebrow text="Comparar con la entrega" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
          <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--ink3)', margin: 0 }}>ENTREGA · lun 20</p>
            <CompareRow label="Km" value="45,200" />
            <CompareRow label="Tanque" value="3/4" />
            <CompareRow label="Daños" value="2" />
          </div>
          <div style={{ borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--primary-line)', background: 'var(--primary-soft)', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--primary-dark)', margin: 0 }}>DEVOLUCIÓN · hoy</p>
            <CompareRow label="Km" value={km} color="var(--primary)" />
            <CompareRow label="Tanque" value={fuel} color={fuel === '3/4' || fuel === 'F' ? 'var(--primary)' : 'var(--warn-ink)'} />
            <CompareRow label="Daños nuevos" value={String(damages)} color={damages > 0 ? 'var(--warn-ink)' : 'var(--primary)'} />
          </div>
        </div>
      </div>

      {/* KM input */}
      <div>
        <SectionEyebrow text="Kilometraje actual" />
        <div className="card" style={{ padding: 14, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <input
              type="text"
              value={km}
              onChange={e => setKm(e.target.value)}
              style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', border: 0, borderBottom: '1px solid var(--card-line)', outline: 'none', background: 'transparent' }}
            />
            <span style={{ fontSize: 13, color: 'var(--ink3)' }}>km</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 6 }}>
            Recorrido: {fmt(recorrido)} km en 3 días
          </p>
        </div>
      </div>

      {/* Fuel */}
      <div>
        <SectionEyebrow text="Nivel del tanque" />
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {FUEL_OPTS.map(opt => {
            const sel = opt === fuel
            return (
              <button key={opt} onClick={() => setFuel(opt)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)', border: `${sel ? 1.5 : 1}px solid ${sel ? 'var(--primary)' : 'var(--card-line)'}`,
                  background: sel ? 'var(--primary-soft)' : 'var(--card)', cursor: 'pointer', fontFamily: 'var(--font-display)',
                  fontSize: 14, color: sel ? 'var(--primary)' : 'var(--ink)', fontWeight: sel ? 600 : 400,
                }}>
                {opt}
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
          className="card"
          style={{ width: '100%', marginTop: 8, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid var(--card-line)' }}
        >
          <div style={{ width: '100%', height: 70, borderRadius: 10, background: 'var(--paper-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 28 }}>🚗</span>
            {damages > 0 && <span style={{ fontSize: 14, color: 'var(--warn-ink)' }}>{damages}⚠</span>}
          </div>
          <p style={{ fontSize: 11, color: damages > 0 ? 'var(--warn-ink)' : 'var(--ink3)' }}>
            {damages === 0 ? 'Sin daños nuevos — toca para marcar' : `${damages} daño(s) nuevo(s)`}
          </p>
          {damages > 0 && (
            <button onClick={e => { e.stopPropagation(); setDamages(0) }} style={{ fontSize: 11, color: 'var(--ink2)', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
              Limpiar
            </button>
          )}
        </button>
      </div>

      <ContinueBtn onClick={handleContinue} />
    </FlowPage>
  )
}

// ─── PASO 2 · Cargos finales ──────────────────────────────────────────────────

export function DevolucionStep2Screen() {
  const navigate = useNavigate()
  const { resId = '3' } = useParams()
  const s = devolucionState
  const isCharge = s.toCharge > 0

  return (
    <FlowPage>
      <FlowTopBar onCancel={() => navigate('/app/reservations', { replace: true })} />
      <DevHeader step={1} />

      {/* Contract summary */}
      <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionEyebrow text="Resumen del contrato" />
        <ChargeRow label="Renta · 3 días" value="$2,400" />
        <ChargeRow label="Seguro" value="$300" />
        <ChargeRow label="Depósito recibido" value={`$${fmt(s.depositAmount)}`} color="var(--primary)" />
      </div>

      {/* Extra charges */}
      <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionEyebrow text="Cargos extra" />
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
        <div style={{ height: 1, background: 'var(--card-line)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Subtotal extras</p>
          <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--ink)', margin: 0 }}>${fmt(s.extraCharges)}</p>
        </div>
      </div>

      {/* Balance */}
      <div style={{
        borderRadius: 'var(--radius)', padding: 18,
        background: isCharge ? 'var(--danger)' : 'var(--primary-soft)',
        border: `1px solid ${isCharge ? 'var(--danger)' : 'var(--primary-line)'}`,
      }}>
        <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, margin: 0, color: isCharge ? 'rgba(255,255,255,0.75)' : 'var(--primary-dark)' }}>
          {isCharge ? 'COBRAR AL CLIENTE' : 'DEVOLVER AL CLIENTE'}
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 42, letterSpacing: -1, lineHeight: '44px', marginTop: 6, color: isCharge ? 'white' : 'var(--primary)' }}>
          ${fmt(isCharge ? s.toCharge : s.toReturn)}
        </p>
        <p style={{ fontSize: 11, marginTop: 6, color: isCharge ? 'rgba(255,255,255,0.8)' : 'var(--ink2)' }}>
          {isCharge
            ? `Extras ($${fmt(s.extraCharges)}) excedieron depósito ($${fmt(s.depositAmount)})`
            : `Del depósito de $${fmt(s.depositAmount)} retenemos $${fmt(s.extraCharges)} por extras`
          }
        </p>
      </div>

      <ContinueBtn onClick={() => navigate(`/app/devolucion/${resId}/3`)} />
    </FlowPage>
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
    <FlowPage>
      <FlowTopBar onCancel={() => navigate('/app/reservations', { replace: true })} />
      <DevHeader step={2} />

      {/* Return method */}
      <div className="card" style={{ padding: 14 }}>
        <SectionEyebrow text="Forma de devolución" />
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {RETURN_METHODS.map(({ id, label }) => {
            const sel = id === returnMethod
            return (
              <button key={id} onClick={() => setReturnMethod(id)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)', border: `${sel ? 1.5 : 1}px solid ${sel ? 'var(--primary)' : 'var(--card-line)'}`,
                  background: sel ? 'var(--primary-soft)' : 'white', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 11, fontWeight: 600, color: sel ? 'var(--primary)' : 'var(--ink)',
                }}>
                {label}
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
          style={{
            width: '100%', marginTop: 8, borderRadius: 'var(--radius-sm)', border: `${photoTaken ? 1.5 : 1}px solid ${photoTaken ? 'var(--primary-line)' : 'var(--card-line)'}`,
            background: photoTaken ? 'var(--primary-soft)' : 'var(--card)', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <div style={{ margin: 8, height: 90, borderRadius: 10, background: photoTaken ? 'rgba(184,223,200,0.3)' : 'var(--paper-alt)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {photoTaken ? (
              <>
                <span style={{ fontSize: 28 }}>📷</span>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-dark)', margin: 0 }}>✓ Foto de cierre</p>
              </>
            ) : (
              <>
                <span style={{ fontSize: 20 }}>📷</span>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)', margin: 0 }}>Tomar foto de cierre</p>
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
          style={{
            width: '100%', marginTop: 8, borderRadius: 'var(--radius-sm)', border: `${signed ? 1.5 : 1}px solid ${signed ? 'var(--primary-line)' : 'var(--card-line)'}`,
            background: signed ? 'var(--primary-soft)' : 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', minHeight: 88,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {signed ? (
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary-dark)', margin: 0 }}>✓ Conforme con la devolución</p>
          ) : (
            <>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--ink4)', margin: 0 }}>— — — — — — — — — — — —</p>
              <p style={{ fontSize: 12, color: 'var(--ink3)', margin: 0 }}>Toca para firmar conformidad</p>
            </>
          )}
        </button>
      </div>

      {/* Receipt row */}
      <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 22, height: 22, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={13} color="white" />
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink)', margin: 0 }}>Enviar comprobante y recibir calificación</p>
      </div>

      <ContinueBtn disabled={!ready} onClick={handleCerrar} label="Cerrar contrato" />
    </FlowPage>
  )
}

// ─── SUCCESS ──────────────────────────────────────────────────────────────────

export function DevolucionOkScreen() {
  const navigate = useNavigate()
  const { resId = '3' } = useParams()
  const res = ALL_RES.find(r => r.id === resId) ?? ALL_RES[0]
  const aDevolver = devolucionState.toReturn

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'var(--primary-deep)' }}>
      <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'oklch(0.52 0.13 155 / 0.4)', top: -120, right: -50, pointerEvents: 'none' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 28px 32px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={36} color="white" />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.6)', margin: 0 }}>CONTRATO CERRADO</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'white', lineHeight: 1.15, marginTop: 6 }}>
              ¡Listo!<br />Auto devuelto y disponible.
            </p>
          </div>
          <div style={{ borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Cliente', value: res.clientName },
              { label: 'Devuelto al cliente', value: `$${fmt(aDevolver)}` },
              { label: 'Auto', value: res.vehicle },
              { label: 'Estado', value: '● Disponible' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{label}</p>
                <p style={{ fontSize: 12, color: 'white', fontWeight: 500, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => navigate('/app/home', { replace: true })}
            style={{ width: '100%', padding: '14px 0', borderRadius: 999, background: 'white', color: 'var(--ink)', fontSize: 14, fontWeight: 600, border: 0, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Volver al inicio
          </button>
          <button
            style={{ width: '100%', padding: '14px 0', borderRadius: 999, background: 'transparent', color: 'white', fontSize: 14, fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            💬  Enviar comprobante
          </button>
        </div>
      </div>
    </div>
  )
}
