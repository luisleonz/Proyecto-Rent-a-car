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

function EntregaHeader({ step }: { step: number }) {
  const labels = ['documentos y firma', 'inspección + fotos', 'cobro']
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= step ? 'var(--primary)' : 'var(--card-line)' }} />
        ))}
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)', margin: 0 }}>
        Entrega · check-in
      </p>
      <p style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 4 }}>
        Paso {step + 1} de 3 · {labels[step]}
      </p>
    </div>
  )
}

function ClientCard({ resId }: { resId: string }) {
  const res = ALL_RES.find(r => r.id === resId) ?? ALL_RES[0]
  return (
    <div style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary-line)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <AvatarCircle initials={res.clientInitials} size={40} />
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{res.clientName}</p>
        <p style={{ fontSize: 11.5, color: 'var(--ink2)', marginTop: 2 }}>
          {res.vehicle} · Entrega · 3 días
        </p>
      </div>
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
    <FlowPage>
      <FlowTopBar onCancel={() => navigate('/app/reservations', { replace: true })} />
      <EntregaHeader step={0} />
      <ClientCard resId={resId} />

      <div>
        <SectionEyebrow text="Verificar documentos" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {DOCS.map(({ key, label, hint }) => {
            const ok = docs[key]
            return (
              <button
                key={key}
                onClick={() => setDocs(d => ({ ...d, [key]: !ok }))}
                style={{
                  width: '100%', borderRadius: 'var(--radius-sm)', border: `${ok ? 1.5 : 1}px solid ${ok ? 'var(--primary-line)' : 'var(--card-line)'}`,
                  background: ok ? 'var(--primary-soft)' : 'var(--card)', textAlign: 'left', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontFamily: 'inherit',
                }}
              >
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${ok ? 'var(--primary)' : 'var(--card-line)'}`, background: ok ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {ok && <Check size={12} color="white" />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: ok ? 'var(--primary-dark)' : 'var(--ink)', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 2 }}>{hint}</p>
                </div>
                {!ok && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink2)', border: '1px solid var(--card-line)', borderRadius: 999, padding: '3px 10px' }}>
                    Subir
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <SectionEyebrow text="Firma del cliente" />
        <button
          onClick={() => setSigned(true)}
          style={{
            width: '100%', marginTop: 8, borderRadius: 'var(--radius-sm)', border: `${signed ? 1.5 : 1}px solid ${signed ? 'var(--primary-line)' : 'var(--card-line)'}`,
            background: signed ? 'var(--primary-soft)' : 'var(--card)', cursor: 'pointer', minHeight: 90,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit',
          }}
        >
          {signed ? (
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary-dark)' }}>✓ Firmado</p>
          ) : (
            <>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--ink4)' }}>— — — — — — — — — — — —</p>
              <p style={{ fontSize: 12, color: 'var(--ink3)' }}>Toca para firmar</p>
            </>
          )}
        </button>
      </div>

      <ContinueBtn disabled={!ready} onClick={handleContinue} />
    </FlowPage>
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
    <FlowPage>
      <FlowTopBar onCancel={() => navigate('/app/reservations', { replace: true })} />
      <EntregaHeader step={1} />

      {/* KM + Tank summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="card" style={{ padding: 14 }}>
          <SectionEyebrow text="Tanque" />
          <p style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--primary)', marginTop: 6 }}>{fuel}</p>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <SectionEyebrow text="Kilometraje" />
          <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: 6 }}>{km}</p>
          <p style={{ fontSize: 11, color: 'var(--ink3)' }}>km</p>
        </div>
      </div>

      {/* Fuel selector */}
      <div>
        <SectionEyebrow text="Nivel del tanque" />
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {FUEL_OPTS.map(opt => {
            const sel = opt === fuel
            return (
              <button
                key={opt}
                onClick={() => setFuel(opt)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)', border: `${sel ? 1.5 : 1}px solid ${sel ? 'var(--primary)' : 'var(--card-line)'}`,
                  background: sel ? 'var(--primary-soft)' : 'var(--card)', cursor: 'pointer', fontFamily: 'var(--font-display)',
                  fontSize: 14, color: sel ? 'var(--primary)' : 'var(--ink)', fontWeight: sel ? 600 : 400,
                }}
              >
                {opt}
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
          className="card"
          style={{ width: '100%', marginTop: 8, padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid var(--card-line)' }}
        >
          <div style={{ width: '100%', height: 70, borderRadius: 10, background: 'var(--paper-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--ink3)' }}>🚗  Vista del vehículo  🚗</span>
          </div>
          <p style={{ fontSize: 11, color: damages > 0 ? 'var(--warn-ink)' : 'var(--ink3)' }}>
            {damages === 0 ? 'Sin daños marcados — toca para agregar' : `${damages} daño(s) marcado(s)`}
          </p>
          {damages > 0 && (
            <button onClick={e => { e.stopPropagation(); setDamages(0) }} style={{ fontSize: 11, color: 'var(--ink2)', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
              Limpiar
            </button>
          )}
        </button>
      </div>

      {/* Photos */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <SectionEyebrow text="Fotos de entrega" />
          <span style={{ fontSize: 11, fontWeight: 600, color: photoCount >= 3 ? 'var(--primary)' : 'var(--warn-ink)' }}>
            {photoCount} / {PHOTO_SLOTS.length}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {PHOTO_SLOTS.map((slot, idx) => {
            const has = idx < photoCount
            return (
              <button
                key={slot}
                onClick={() => !has && setPhotoCount(idx + 1)}
                style={{
                  aspectRatio: '1', borderRadius: 10, border: `${has ? 1 : 1.5}px solid ${has ? 'var(--card-line)' : 'var(--ink4)'}`,
                  background: has ? 'var(--paper-alt)' : 'transparent', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {has ? (
                  <>
                    <span style={{ fontSize: 20 }}>📷</span>
                    <span style={{ fontSize: 9, color: 'var(--ink3)' }}>{slot}</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 18, color: 'var(--ink4)', fontWeight: 300 }}>+</span>
                    <span style={{ fontSize: 9, color: 'var(--ink4)' }}>{slot}</span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <ContinueBtn disabled={!ready} onClick={handleContinue} />
    </FlowPage>
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
    <FlowPage>
      <FlowTopBar onCancel={() => navigate('/app/reservations', { replace: true })} />
      <EntregaHeader step={2} />

      {/* Amount card */}
      <div style={{ borderRadius: 'var(--radius)', padding: 18, background: 'var(--primary)' }}>
        <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', margin: 0 }}>A COBRAR AHORA</p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 42, color: 'white', letterSpacing: -1, lineHeight: '44px', marginTop: 4 }}>
          ${fmt(TOTAL)}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
          $2,400 renta · $300 seguro · $2,000 depósito
        </p>
      </div>

      {/* Payment method */}
      <div>
        <SectionEyebrow text="Método de pago" />
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {PAYMENT_METHODS.map(({ id, label }) => {
            const sel = id === method
            return (
              <button
                key={id}
                onClick={() => setMethod(id)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 'var(--radius-sm)', border: `${sel ? 1.5 : 1}px solid ${sel ? 'var(--primary)' : 'var(--card-line)'}`,
                  background: sel ? 'var(--primary-soft)' : 'var(--card)', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 11, fontWeight: 600, color: sel ? 'var(--primary)' : 'var(--ink)',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Cash input */}
      {method === 'cash' && (
        <div className="card" style={{ padding: 14 }}>
          <SectionEyebrow text="Recibido" />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink3)' }}>$</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink)', border: 0, borderBottom: '1px solid var(--card-line)', outline: 'none', background: 'transparent' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--ink2)' }}>Cambio</span>
            <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)', color: change >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
              ${fmt(Math.abs(change))}
            </span>
          </div>
        </div>
      )}

      {/* WhatsApp row */}
      <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 22, height: 22, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={13} color="white" />
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink)' }}>Enviar recibo por WhatsApp al cliente</p>
      </div>

      <ContinueBtn label="Cobrar y entregar auto" onClick={handleCobrar} />
    </FlowPage>
  )
}

// ─── SUCCESS ──────────────────────────────────────────────────────────────────

export function EntregaOkScreen() {
  const navigate = useNavigate()
  const { resId = '1' } = useParams()
  const res = ALL_RES.find(r => r.id === resId) ?? ALL_RES[0]
  const firstName = res.clientName.split(' ')[0]

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'var(--primary-deep)' }}>
      <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'oklch(0.52 0.13 155 / 0.4)', top: -120, right: -50, pointerEvents: 'none' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 28px 32px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 32 }}>🔑</span>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.6)', margin: 0 }}>ENTREGA COMPLETADA</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'white', lineHeight: 1.15, marginTop: 6 }}>
              ¡Auto entregado!<br />¡Buen viaje, {firstName}!
            </p>
          </div>
          <div style={{ borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Cobrado', value: `$${fmt(TOTAL)}` },
              { label: 'Devuelve', value: 'Vie 24 may · 18:00' },
              { label: 'Recordatorio', value: '1 día antes' },
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
            💬  Reenviar recibo
          </button>
        </div>
      </div>
    </div>
  )
}
