import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Check } from 'lucide-react'
import { useAuth } from '../../state/auth'
import { turnoState, fmt } from '../../state/turnoState'
import SectionEyebrow from '../../components/SectionEyebrow'
import AvatarCircle from '../../components/AvatarCircle'

// ─── Shared ───────────────────────────────────────────────────────────────────

function FlowAppBar({ title, subtitle, right }: { title: string; subtitle: string; right?: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="border-b border-hairline px-4 py-3 flex items-center gap-3 flex-shrink-0" style={{ background: 'var(--card)' }}>
      <button
        onClick={() => navigate(-1)}
        className="w-9 h-9 rounded-full border border-hairline flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'var(--paper-alt)' }}
      >
        <ArrowLeft size={18} style={{ color: 'var(--ink2)' }} />
      </button>
      <div className="flex-1">
        <p className="text-xl font-bold font-serif" style={{ color: 'var(--ink)' }}>{title}</p>
        <p className="text-xs font-sans" style={{ color: 'var(--ink3)' }}>{subtitle}</p>
      </div>
      {right}
    </div>
  )
}

// ─── CajaTurnoScreen ──────────────────────────────────────────────────────────

function MetodoRow({ label, amount, movs, isZero = false }: { label: string; amount: number; movs: number; isZero?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-3">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--paper-alt)' }}>
        <span className="text-xs font-bold font-mono" style={{ color: isZero ? 'var(--ink3)' : 'var(--primary)' }}>
          {isZero ? '—' : '$'}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-semibold font-sans" style={{ color: isZero ? 'var(--ink3)' : 'var(--ink)' }}>{label}</p>
        <p className="text-[11px] font-sans" style={{ color: 'var(--ink3)' }}>{movs} mov.</p>
      </div>
      <span className="text-sm font-bold font-mono" style={{ color: isZero ? 'var(--ink3)' : 'var(--primary)' }}>
        ${fmt(amount)}
      </span>
    </div>
  )
}

export function CajaTurnoScreen() {
  const navigate = useNavigate()
  const { currentBranch, currentFirstName, currentInitials, currentRole } = useAuth()
  const [isOpen, setIsOpen] = useState(turnoState.isOpen)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--paper)' }}>
      <FlowAppBar
        title="Caja / Turno"
        subtitle={`Sucursal ${currentBranch || 'Polanco'}`}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-8 flex flex-col gap-4">
        {/* Dark turno card */}
        <div className="rounded-[18px] p-[18px]" style={{ backgroundColor: 'var(--primary-deep)' }}>
          <SectionEyebrow text={`TURNO ${turnoState.turnoId} · MATUTINO`} color="rgba(255,255,255,0.6)" />
          <p className="font-serif text-white mt-1.5" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>
            {turnoState.horario}
          </p>
          <div className="h-px my-3" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
          <div className="flex justify-between">
            {[
              { label: 'MOVS',      value: String(turnoState.movimientos),         color: 'white' },
              { label: 'ENTREGAS',  value: String(turnoState.entregas),             color: 'white' },
              { label: 'RETORNOS',  value: String(turnoState.retornos),             color: 'white' },
              { label: 'EN CAJA',   value: `$${fmt(turnoState.totalRecibido)}`,     color: 'oklch(0.75 0.12 155)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className="text-[9px] font-semibold font-sans uppercase" style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.5px' }}>{label}</p>
                <p className="text-[18px] font-serif mt-0.5" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Employee card */}
        <div>
          <SectionEyebrow text="Empleado asignado" />
          <div className="rounded-2xl border border-hairline p-3 flex items-center gap-3 mt-2" style={{ background: 'var(--card)' }}>
            <AvatarCircle initials={currentInitials || '??'} size={36} />
            <div className="flex-1">
              <p className="text-sm font-semibold font-sans" style={{ color: 'var(--ink)' }}>{currentFirstName || 'Empleado'}</p>
              <p className="text-[11px] font-sans mt-0.5" style={{ color: 'var(--ink3)' }}>
                {currentRole || 'Administrador'} · permisos completos
              </p>
            </div>
            <span className="text-[11px] font-semibold font-sans px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary-dark)' }}>
              Activo
            </span>
          </div>
        </div>

        {/* Desglose */}
        <div>
          <SectionEyebrow text="Desglose por método" />
          <div className="rounded-2xl border border-hairline overflow-hidden mt-2" style={{ background: 'var(--card)' }}>
            <MetodoRow label="Efectivo recibido" amount={turnoState.efectivoRecibido} movs={4} />
            <div className="h-px ml-[52px]" style={{ backgroundColor: 'var(--card-line)' }} />
            <MetodoRow label="SPEI" amount={turnoState.speiRecibido} movs={5} />
            <div className="h-px ml-[52px]" style={{ backgroundColor: 'var(--card-line)' }} />
            <MetodoRow label="Por cobrar" amount={0} movs={0} isZero />
          </div>
        </div>

        {!isOpen ? (
          <button
            onClick={() => { turnoState.openTurno(); setIsOpen(true) }}
            className="w-full py-3.5 rounded-full font-semibold font-sans text-sm text-white"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Abrir turno
          </button>
        ) : (
          <button
            onClick={() => { turnoState.resetConteo(); navigate('/app/caja/cierre') }}
            className="w-full py-3.5 rounded-full font-semibold font-sans text-sm text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--primary-deep)' }}
          >
            <Lock size={18} />
            Cerrar turno
          </button>
        )}
      </div>
    </div>
  )
}

// ─── CajaCierreScreen ─────────────────────────────────────────────────────────

function ConcilRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <p className="text-xs font-sans" style={{ color: 'var(--ink2)' }}>{label}</p>
      <p className="text-xs font-mono font-medium" style={{ color: 'var(--ink)' }}>{value}</p>
    </div>
  )
}

export function CajaCierreScreen() {
  const navigate = useNavigate()
  const { currentFirstName } = useAuth()
  const denoms = [500, 200, 100, 50, 20]
  const [counts, setCounts] = useState<Record<number, number>>({
    500: turnoState.billetes500,
    200: turnoState.billetes200,
    100: turnoState.billetes100,
    50: turnoState.billetes50,
    20: turnoState.billetes20,
  })

  const totalContado = denoms.reduce((s, d) => s + d * (counts[d] ?? 0), 0)
  const esperado = turnoState.fondoInicial + turnoState.esperadoEnCaja
  const diferencia = totalContado - esperado
  const cuadrada = diferencia === 0

  function handleCerrar() {
    turnoState.billetes500 = counts[500] ?? 0
    turnoState.billetes200 = counts[200] ?? 0
    turnoState.billetes100 = counts[100] ?? 0
    turnoState.billetes50 = counts[50] ?? 0
    turnoState.billetes20 = counts[20] ?? 0
    if (cuadrada) {
      turnoState.isOpen = false
      navigate('/app/caja/ok')
    } else {
      navigate('/app/caja/justificacion')
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--paper)' }}>
      <FlowAppBar
        title="Cerrar turno"
        subtitle={`${currentFirstName || 'Empleado'} · ${turnoState.turnoId} · 5h 50min`}
        right={
          <span className="text-[11px] font-semibold font-sans px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: cuadrada ? 'var(--primary-soft)' : 'var(--warn-soft)',
              color: cuadrada ? 'var(--primary-dark)' : 'var(--warn-ink)',
            }}>
            {cuadrada ? 'Cuadrada' : 'Diferencia'}
          </span>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* Dark summary card */}
        <div className="rounded-[18px] p-4" style={{ backgroundColor: 'var(--primary-deep)' }}>
          <SectionEyebrow text="Resumen del turno" color="rgba(255,255,255,0.6)" />
          <p className="font-serif text-white mt-1" style={{ fontSize: 36, letterSpacing: '-1px' }}>
            ${fmt(turnoState.totalRecibido)}
          </p>
          <div className="h-px my-3" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
          <div className="flex justify-between">
            {[
              { label: 'MOVS',      value: String(turnoState.movimientos) },
              { label: 'ENTREGAS',  value: String(turnoState.entregas) },
              { label: 'RETORNOS',  value: String(turnoState.retornos) },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-[9px] font-semibold font-sans uppercase" style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.5px' }}>{label}</p>
                <p className="text-[18px] font-serif mt-0.5 text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bill count */}
        <div>
          <SectionEyebrow text="Conteo final · efectivo" />
          <div className="rounded-2xl border border-hairline p-3.5 flex flex-col gap-3 mt-2" style={{ background: 'var(--card)' }}>
            {denoms.map(denom => {
              const qty = counts[denom] ?? 0
              return (
                <div key={denom} className="flex items-center gap-2">
                  <span className="text-xs font-semibold font-mono" style={{ width: 54, color: 'var(--ink)' }}>
                    ${fmt(denom)}
                  </span>
                  <button
                    onClick={() => qty > 0 && setCounts(c => ({ ...c, [denom]: qty - 1 }))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-base font-bold"
                    style={{ backgroundColor: 'var(--paper-alt)', color: 'var(--ink2)' }}
                  >−</button>
                  <span className="text-xs font-mono text-center" style={{ width: 40, color: 'var(--ink2)' }}>× {qty}</span>
                  <button
                    onClick={() => setCounts(c => ({ ...c, [denom]: qty + 1 }))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-base font-bold"
                    style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}
                  >+</button>
                  <div className="flex-1" />
                  <span className="text-[13px] font-semibold font-mono"
                    style={{ color: denom * qty > 0 ? 'var(--ink)' : 'var(--ink4)' }}>
                    ${fmt(denom * qty)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Conciliation */}
        <div className="rounded-2xl border p-3.5 flex flex-col gap-1.5"
          style={{
            backgroundColor: cuadrada ? 'var(--primary-soft)' : 'var(--warn-soft)',
            borderColor: cuadrada ? 'var(--primary-line)' : 'var(--warn-line)',
          }}>
          <ConcilRow label="Contado · efectivo" value={`$${fmt(totalContado)}`} />
          <ConcilRow label="− Fondo inicial" value={`−$${fmt(turnoState.fondoInicial)}`} />
          <div className="h-px" style={{ backgroundColor: cuadrada ? 'var(--primary-line)' : 'var(--warn-line)' }} />
          <div className="flex justify-between">
            <p className="text-[13px] font-bold font-sans" style={{ color: cuadrada ? 'var(--primary-dark)' : 'var(--warn-ink)' }}>Esperado en caja</p>
            <p className="text-sm font-bold font-mono" style={{ color: cuadrada ? 'var(--primary)' : 'var(--warn-ink)' }}>
              ${fmt(turnoState.esperadoEnCaja)}
            </p>
          </div>
          {!cuadrada && (
            <div className="rounded-lg border p-3 flex justify-between mt-1"
              style={{ backgroundColor: 'var(--danger-soft)', borderColor: 'var(--danger-line)' }}>
              <p className="text-[13px] font-bold font-sans" style={{ color: 'var(--danger)' }}>Diferencia</p>
              <p className="text-sm font-bold font-mono" style={{ color: 'var(--danger)' }}>
                {diferencia > 0 ? '+' : ''}${fmt(diferencia)}
              </p>
            </div>
          )}
        </div>

        {cuadrada && (
          <div className="rounded-xl border p-3 flex items-center gap-2.5"
            style={{ backgroundColor: 'var(--primary-soft)', borderColor: 'var(--primary-line)' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
              <Check size={14} className="text-white" />
            </div>
            <div>
              <p className="text-[13px] font-semibold font-sans" style={{ color: 'var(--primary-dark)' }}>Conciliación cuadrada</p>
              <p className="text-[11px] font-sans" style={{ color: 'var(--primary)' }}>Lo contado coincide con lo esperado.</p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-hairline p-4 flex gap-2 flex-shrink-0" style={{ background: 'var(--card)' }}>
        <button className="flex-1 py-3 rounded-full border border-hairline text-sm font-semibold font-sans" style={{ color: 'var(--ink)' }}>
          📷  Selfie
        </button>
        <button
          onClick={handleCerrar}
          className="flex-[2] py-3 rounded-full text-sm font-semibold font-sans text-white flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--primary-deep)' }}
        >
          <Lock size={16} />
          Cerrar turno
        </button>
      </div>
    </div>
  )
}

// ─── CajaJustificacionScreen ──────────────────────────────────────────────────

export function CajaJustificacionScreen() {
  const navigate = useNavigate()
  const causas = ['Error conteo', 'Vuelto erróneo', 'Reembolso no reg.', 'Robo', 'Otro']
  const [causa, setCausa] = useState(turnoState.justificacionCausa)
  const [nota, setNota] = useState(turnoState.justificacionNota)
  const diferencia = turnoState.totalContado - turnoState.fondoInicial - turnoState.esperadoEnCaja
  const ready = causa.length > 0

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--paper)' }}>
      <FlowAppBar
        title="Justificar diferencia"
        subtitle={`${diferencia < 0 ? 'Faltante' : 'Sobrante'} · requiere explicación`}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-6 flex flex-col gap-4">
        {/* Difference banner */}
        <div className="rounded-2xl border p-3.5 flex items-center gap-3"
          style={{ backgroundColor: 'var(--danger-soft)', borderColor: 'var(--danger-line)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--danger)' }}>
            <span className="text-white text-xl font-bold font-sans">!</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold font-sans uppercase tracking-[0.5px]" style={{ color: 'var(--danger)' }}>
              {diferencia < 0 ? 'FALTANTE' : 'SOBRANTE'}
            </p>
            <p className="font-serif mt-0.5" style={{ fontSize: 28, color: 'var(--danger)', letterSpacing: '-0.5px' }}>
              {diferencia > 0 ? '+' : ''}${fmt(diferencia)}
            </p>
          </div>
        </div>

        {/* Causa chips */}
        <div>
          <SectionEyebrow text="Causa" />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {causas.map(c => {
              const sel = c === causa
              return (
                <button
                  key={c}
                  onClick={() => setCausa(c)}
                  className="px-2.5 py-1.5 rounded-full text-[11px] font-medium font-sans border transition-colors"
                  style={{
                    backgroundColor: sel ? 'var(--primary)' : 'var(--card)',
                    borderColor: sel ? 'var(--primary)' : 'var(--card-line)',
                    color: sel ? 'white' : 'var(--ink2)',
                  }}
                >
                  {c}
                </button>
              )
            })}
          </div>
        </div>

        {/* Nota */}
        <div>
          <SectionEyebrow text="Detalle (nota libre)" />
          <textarea
            value={nota}
            onChange={e => setNota(e.target.value)}
            rows={3}
            placeholder="Describe lo que ocurrió…"
            className="w-full mt-2 px-3 py-2.5 rounded-xl border text-sm font-sans outline-none resize-none"
            style={{ borderColor: 'var(--card-line)', color: 'var(--ink)', background: 'var(--card)' }}
          />
        </div>

        <div className="rounded-xl border p-3" style={{ backgroundColor: 'var(--warn-soft)', borderColor: 'var(--warn-line)' }}>
          <p className="text-xs font-sans" style={{ color: 'var(--warn-ink)' }}>
            El administrador recibirá una notificación al cerrar con diferencia.
          </p>
        </div>
      </div>

      <div className="border-t border-hairline p-4 flex-shrink-0" style={{ background: 'var(--card)' }}>
        <button
          disabled={!ready}
          onClick={() => {
            turnoState.justificacionCausa = causa
            turnoState.justificacionNota = nota
            turnoState.isOpen = false
            navigate('/app/caja/ok', { replace: true })
          }}
          className="w-full py-3.5 rounded-full text-sm font-semibold font-sans text-white flex items-center justify-center gap-2 transition-opacity"
          style={{ backgroundColor: 'var(--danger)', opacity: ready ? 1 : 0.5 }}
        >
          <Lock size={16} />
          Cerrar turno con diferencia
        </button>
      </div>
    </div>
  )
}

// ─── CajaOkScreen ─────────────────────────────────────────────────────────────

export function CajaOkScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: 'var(--primary-deep)' }}>
      <div className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ backgroundColor: 'oklch(0.52 0.13 155 / 0.4)', top: -120, right: -50 }} />

      <div className="flex-1 flex flex-col justify-between px-7 pt-16 pb-8 relative z-10">
        <div className="flex flex-col gap-[18px]">
          <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--primary)' }}>
            <Lock size={34} className="text-white" />
          </div>

          <div>
            <p className="text-[11px] font-semibold font-sans uppercase" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '1.5px' }}>
              TURNO CERRADO
            </p>
            <p className="font-serif text-white mt-1.5" style={{ fontSize: 34, lineHeight: '1.15' }}>
              ¡Listo!<br />Turno {turnoState.turnoId} registrado.
            </p>
          </div>

          <div className="rounded-2xl border p-4 flex flex-col gap-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }}>
            {[
              { label: 'Total recibido', value: `$${fmt(turnoState.totalRecibido)}` },
              { label: 'Movimientos',    value: String(turnoState.movimientos) },
              { label: 'Entregas',       value: String(turnoState.entregas) },
              { label: 'Devoluciones',   value: String(turnoState.retornos) },
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
          <button
            className="w-full py-3.5 rounded-full text-sm font-semibold font-sans border"
            style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
          >
            📄  Exportar reporte
          </button>
        </div>
      </div>
    </div>
  )
}
