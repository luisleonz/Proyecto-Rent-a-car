import { useEffect, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, DollarSign, CreditCard, FileText, Key, ShieldCheck, RefreshCw, Download, LogOut, ChevronDown, ChevronRight, Lock, Check, Smartphone } from 'lucide-react'
import { useAuth } from '../../state/auth'
import { supabase } from '../../lib/supabase'
import { EMPRESA, Empresa, guardarConfig, cargarConfig } from '../../lib/empresa'
import { METODOS, metodoLabel, mensajeError } from '../../lib/operacion'
import { insertLog } from '../../lib/log'
import { urlFirmaArrendador } from '../../lib/fotos'
import { mensajeContrasena, identificador } from '../../lib/usuarios'
import ReglasContrasena from '../../components/ReglasContrasena'
import InstalarApp from '../../components/InstalarApp'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

function ToggleRow({ on, onChange, label, sub, disabled }: { on: boolean; onChange: () => void; label: string; sub?: string; disabled?: boolean }) {
  return (
    <div className="togglerow" style={{ padding: '10px 0' }}>
      <div className="togglerow-text">
        <div className="togglerow-l">{label}</div>
        {sub && <div className="togglerow-s">{sub}</div>}
      </div>
      <button type="button" className={'toggle' + (on ? ' on' : '')} onClick={onChange} aria-pressed={on} aria-label={label} disabled={disabled}
        style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
        <span className="toggle-knob" />
      </button>
    </div>
  )
}

/** Collapsible settings group: the row opens its form right below it. */
function Seccion({ id, abierta, onToggle, icon, titulo, valor, children }: {
  id: string; abierta: string | null; onToggle: (id: string) => void; icon: ReactNode; titulo: string; valor?: string; children: ReactNode
}) {
  const open = abierta === id
  return (
    <>
      <div className="set-link" role="button" aria-expanded={open} onClick={() => onToggle(id)}>
        {icon}<span className="l">{titulo}</span>{valor && <span className="v">{valor}</span>}
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </div>
      {open && <div style={{ padding: '4px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>}
    </>
  )
}

function Aviso({ tipo, children }: { tipo: 'ok' | 'error' | 'info'; children: ReactNode }) {
  const c = tipo === 'ok' ? ['var(--primary-soft)', 'var(--primary-dark)'] : tipo === 'error' ? ['var(--danger-soft)', 'var(--danger-ink)'] : ['var(--paper-alt)', 'var(--ink2)']
  return <div style={{ padding: '10px 13px', background: c[0], color: c[1], borderRadius: 'var(--radius-sm)', fontSize: 13, lineHeight: 1.45 }}>{children}</div>
}

const SoloDuenoNota = () => (
  <div style={{ fontSize: 12.5, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 6 }}>
    <Lock size={13} />Solo el dueño puede cambiar estos datos.
  </div>
)

/** Form over a subset of the business settings, saved to the database for everyone. */
function useFormConfig<K extends keyof Empresa>(campos: K[]) {
  const inicial = () => Object.fromEntries(campos.map(k => [k, EMPRESA[k]])) as Pick<Empresa, K>
  const [f, setF] = useState(inicial)
  const [estado, setEstado] = useState<{ tipo: 'ok' | 'error'; msg: string } | null>(null)
  const [guardando, setGuardando] = useState(false)
  const set = <T extends K>(k: T, v: Empresa[T]) => { setF(x => ({ ...x, [k]: v })); setEstado(null) }
  async function guardar(validar?: (x: Pick<Empresa, K>) => string | null) {
    const err = validar?.(f)
    if (err) { setEstado({ tipo: 'error', msg: err }); return }
    setGuardando(true)
    const e = await guardarConfig(f as Partial<Empresa>)
    setGuardando(false)
    setEstado(e ? { tipo: 'error', msg: mensajeError(e) } : { tipo: 'ok', msg: 'Guardado. Ya aplica para todos los usuarios.' })
  }
  return { f, set, guardar, estado, guardando, recargar: () => setF(inicial()) }
}

function Campo({ label, value, onChange, disabled, placeholder, tipo = 'text', ayuda }: {
  label: string; value: string | number; onChange: (v: string) => void; disabled?: boolean; placeholder?: string; tipo?: string; ayuda?: string
}) {
  return (
    <div className="field">
      <label className="field-l">{label}</label>
      <input className="field-i" type={tipo} value={value} disabled={disabled} placeholder={placeholder}
        inputMode={tipo === 'number' ? 'decimal' : undefined} onChange={e => onChange(e.target.value)} />
      {ayuda && <div style={{ fontSize: 12, color: 'var(--ink3)' }}>{ayuda}</div>}
    </div>
  )
}

function Dinero({ label, value, onChange, disabled, ayuda }: { label: string; value: number; onChange: (n: number) => void; disabled?: boolean; ayuda?: string }) {
  return (
    <div className="field">
      <label className="field-l">{label}</label>
      <div className="field-money">
        <span>$</span>
        <input className="field-i" type="number" min={0} inputMode="decimal" value={value} disabled={disabled}
          onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))} />
      </div>
      {ayuda && <div style={{ fontSize: 12, color: 'var(--ink3)' }}>{ayuda}</div>}
    </div>
  )
}

function BotonGuardar({ guardando, onClick }: { guardando: boolean; onClick: () => void }) {
  return <button className="btn primary" style={{ alignSelf: 'flex-start' }} onClick={onClick} disabled={guardando}>{guardando ? 'Guardando…' : <><Check size={15} />Guardar cambios</>}</button>
}

// ── Negocio ────────────────────────────────────────────────────────────────
function NegocioForm({ puede }: { puede: boolean }) {
  const { f, set, guardar, estado, guardando } = useFormConfig(['nombreComercial', 'representante', 'rfc', 'telefono', 'whatsapp', 'email', 'domicilio', 'ciudadFirma', 'sucursal'])
  return (
    <>
      {!puede && <SoloDuenoNota />}
      <Campo label="Nombre comercial" value={f.nombreComercial} onChange={v => set('nombreComercial', v)} disabled={!puede} />
      <div className="field-row">
        <Campo label="Representante (firma el contrato)" value={f.representante} onChange={v => set('representante', v)} disabled={!puede} />
        <Campo label="RFC" value={f.rfc} onChange={v => set('rfc', v.toUpperCase())} disabled={!puede} />
      </div>
      <div className="field-row">
        <Campo label="Teléfono" value={f.telefono} onChange={v => set('telefono', v)} disabled={!puede} tipo="tel" />
        <Campo label="WhatsApp" value={f.whatsapp} onChange={v => set('whatsapp', v)} disabled={!puede} tipo="tel" ayuda="Se usa en la página pública y en los mensajes." />
      </div>
      <Campo label="Correo" value={f.email} onChange={v => set('email', v)} disabled={!puede} tipo="email" />
      <Campo label="Domicilio fiscal" value={f.domicilio} onChange={v => set('domicilio', v)} disabled={!puede} placeholder="Calle, número, colonia, C.P."
        ayuda="Aparece en el contrato. Si lo dejas vacío se imprime una línea para llenarlo a mano." />
      <div className="field-row">
        <Campo label="Sucursal" value={f.sucursal} onChange={v => set('sucursal', v)} disabled={!puede} />
        <Campo label="Ciudad (lugar de firma)" value={f.ciudadFirma} onChange={v => set('ciudadFirma', v)} disabled={!puede} />
      </div>
      {estado && <Aviso tipo={estado.tipo}>{estado.msg}</Aviso>}
      {puede && <BotonGuardar guardando={guardando} onClick={() => guardar(x => !x.nombreComercial.trim() ? 'Falta el nombre comercial.' : !x.telefono.trim() ? 'Falta el teléfono.' : null)} />}
    </>
  )
}

// ── Cobros: métodos de pago, IVA y montos predeterminados ─────────────────
function CobrosForm({ puede }: { puede: boolean }) {
  const { f, set, guardar, estado, guardando } = useFormConfig(['metodosPago', 'ivaTasa', 'ivaPorDefecto', 'fianzaPredeterminada', 'ceroDeducibleDia', 'limpiezaSedan', 'limpiezaVan'])
  const toggleMetodo = (m: string) => set('metodosPago', f.metodosPago.includes(m) ? f.metodosPago.filter(x => x !== m) : [...f.metodosPago, m])
  return (
    <>
      {!puede && <SoloDuenoNota />}
      <div>
        <div className="field-l" style={{ marginBottom: 2 }}>Métodos de pago que aceptas</div>
        {METODOS.map(m => <ToggleRow key={m} label={metodoLabel(m)} on={f.metodosPago.includes(m)} onChange={() => toggleMetodo(m)} disabled={!puede}
          sub={m === 'efectivo' ? 'Suma al efectivo en caja' : m === 'tarjeta' ? 'Terminal / TPV' : 'SPEI o depósito'} />)}
      </div>
      <div className="field">
        <label className="field-l">Tasa de IVA</label>
        <div className="filterbar" style={{ margin: 0 }}>
          {[0.08, 0.16].map(t => (
            <button key={t} className={`fbtn${f.ivaTasa === t ? ' on' : ''}`} disabled={!puede} onClick={() => set('ivaTasa', t)}>
              {t * 100}% {t === 0.08 ? '· región fronteriza' : '· general'}
            </button>
          ))}
        </div>
      </div>
      <ToggleRow label="Cobrar IVA por defecto" sub="En reservas y cotizaciones nuevas (se puede quitar en cada una)" on={f.ivaPorDefecto} onChange={() => set('ivaPorDefecto', !f.ivaPorDefecto)} disabled={!puede} />
      <div className="field-row">
        <Dinero label="Fianza predeterminada" value={f.fianzaPredeterminada} onChange={n => set('fianzaPredeterminada', n)} disabled={!puede} ayuda="Para autos nuevos de la flota." />
        <Dinero label="Cero deducible por día" value={f.ceroDeducibleDia} onChange={n => set('ceroDeducibleDia', n)} disabled={!puede} ayuda="0 = se captura en cada reserva." />
      </div>
      <div className="field-row">
        <Dinero label="Limpieza (sedán)" value={f.limpiezaSedan} onChange={n => set('limpiezaSedan', n)} disabled={!puede} ayuda="Cargo sugerido en la devolución." />
        <Dinero label="Limpieza (van)" value={f.limpiezaVan} onChange={n => set('limpiezaVan', n)} disabled={!puede} />
      </div>
      {estado && <Aviso tipo={estado.tipo}>{estado.msg}</Aviso>}
      {puede && <BotonGuardar guardando={guardando} onClick={() => guardar(x => x.metodosPago.length === 0 ? 'Activa al menos un método de pago.' : null)} />}
    </>
  )
}

// ── Firma del arrendador (fija: la misma para todos los contratos) ─────────
function FirmaArrendador() {
  const [url, setUrl] = useState<string | null | undefined>(undefined)
  useEffect(() => { urlFirmaArrendador().then(setUrl, () => setUrl(null)) }, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="field-l">Firma del arrendador ({EMPRESA.representante})</div>
      {url === undefined ? <div className="spinner" style={{ width: 18, height: 18 }} />
        : url
          ? <img src={url} alt="Firma del arrendador" style={{ maxWidth: 260, maxHeight: 110, objectFit: 'contain', background: '#fff', border: '1px solid var(--card-line)', borderRadius: 10, padding: 8 }} />
          : <Aviso tipo="error">No se encontró la firma guardada. Mientras tanto los contratos salen con la línea para firmar a mano.</Aviso>}
      <div style={{ fontSize: 12.5, color: 'var(--ink3)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <Lock size={13} style={{ flexShrink: 0, marginTop: 1 }} />Firma fija para todos los contratos. No se puede cambiar desde la app; para cambiarla, pídelo al desarrollador.
      </div>
    </div>
  )
}

// ── Contrato ──────────────────────────────────────────────────────────────
function ContratoForm({ puede }: { puede: boolean }) {
  const { f, set, guardar, estado, guardando } = useFormConfig(['lugarEntregaPredeterminado'])
  const [ultima, setUltima] = useState<{ id: string; folio: number | null } | null>(null)
  useEffect(() => {
    db.from('reservas').select('id, folio').order('created_at', { ascending: false }).limit(1)
      .then(({ data }: { data: { id: string; folio: number | null }[] | null }) => setUltima(data?.[0] ?? null))
  }, [])
  return (
    <>
      <Aviso tipo="info">
        El contrato usa un solo formato (contrato de arrendamiento + anexo de inventario y pagaré). Se llena solo con los datos del
        <b> negocio</b>, del cliente, del auto y de la reserva, y se firma en la entrega. Las cláusulas legales no se editan desde la app
        para que el texto se mantenga igual al registrado; si necesitas cambiar una cláusula, pídelo al desarrollador.
      </Aviso>
      {!puede && <SoloDuenoNota />}
      <Campo label="Lugar de entrega predeterminado" value={f.lugarEntregaPredeterminado} onChange={v => set('lugarEntregaPredeterminado', v)} disabled={!puede}
        ayuda="Se propone al crear una reserva; se puede cambiar en cada una." />
      <div style={{ borderTop: '1px solid var(--hairline)', margin: '4px 0' }} />
      <FirmaArrendador />
      <div style={{ borderTop: '1px solid var(--hairline)', margin: '4px 0' }} />
      <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6 }}>
        Datos del arrendador en el contrato: <b>{EMPRESA.nombreComercial}</b> · {EMPRESA.representante} · RFC {EMPRESA.rfc} · {EMPRESA.domicilio || 'domicilio a mano'} · {EMPRESA.ciudadFirma}
      </div>
      {estado && <Aviso tipo={estado.tipo}>{estado.msg}</Aviso>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {puede && <BotonGuardar guardando={guardando} onClick={() => guardar()} />}
        {ultima && <a className="btn" href={`#/imprimir/contrato/${ultima.id}`} target="_blank" rel="noreferrer"><FileText size={15} />Ver ejemplo (contrato #{ultima.folio ?? '—'})</a>}
      </div>
    </>
  )
}

// ── Seguridad: contraseña y verificación en dos pasos ─────────────────────
type Factor = { id: string; status: string; friendly_name?: string; factor_type: string }

function SeguridadForm() {
  const { recargarAcceso } = useAuth()
  const [pass, setPass] = useState(''); const [pass2, setPass2] = useState('')
  const [msgPass, setMsgPass] = useState<{ tipo: 'ok' | 'error'; msg: string } | null>(null)
  const [factores, setFactores] = useState<Factor[]>([])
  const [alta, setAlta] = useState<{ id: string; qr: string; secreto: string } | null>(null)
  const [codigo, setCodigo] = useState('')
  const [msg2fa, setMsg2fa] = useState<{ tipo: 'ok' | 'error'; msg: string } | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function cargarFactores() {
    const { data } = await supabase.auth.mfa.listFactors()
    setFactores(((data?.all ?? []) as Factor[]).filter(x => x.factor_type === 'totp'))
  }
  useEffect(() => { cargarFactores() }, [])
  const activo = factores.find(x => x.status === 'verified')

  async function cambiarPass() {
    const problema = mensajeContrasena(pass)
    if (problema) { setMsgPass({ tipo: 'error', msg: problema }); return }
    if (pass !== pass2) { setMsgPass({ tipo: 'error', msg: 'Las dos contraseñas no coinciden.' }); return }
    setOcupado(true)
    const { error } = await supabase.auth.updateUser({ password: pass, data: { debe_cambiar: false } })
    setOcupado(false)
    if (error) { setMsgPass({ tipo: 'error', msg: /different from the old/i.test(error.message) ? 'La nueva contraseña debe ser distinta de la actual.' : error.message }); return }
    setPass(''); setPass2(''); setMsgPass({ tipo: 'ok', msg: 'Contraseña actualizada.' })
    insertLog({ accion: 'cambio_contrasena', descripcion: 'Cambió su contraseña' })
  }

  async function iniciarAlta() {
    setOcupado(true); setMsg2fa(null)
    // Clean up half-finished attempts so a new one can start
    for (const x of factores.filter(x => x.status !== 'verified')) await supabase.auth.mfa.unenroll({ factorId: x.id })
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Lucianos ${new Date().toISOString().slice(0, 16)}` })
    setOcupado(false)
    if (error || !data) { setMsg2fa({ tipo: 'error', msg: error?.message ?? 'No se pudo iniciar. Intenta de nuevo.' }); return }
    setAlta({ id: data.id, qr: data.totp.qr_code, secreto: data.totp.secret })
  }

  async function confirmarAlta() {
    if (!alta) return
    if (codigo.length !== 6) { setMsg2fa({ tipo: 'error', msg: 'Escribe los 6 dígitos que muestra la aplicación.' }); return }
    setOcupado(true)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: alta.id, code: codigo })
    setOcupado(false)
    if (error) { setMsg2fa({ tipo: 'error', msg: 'Código incorrecto. Revisa que la hora del celular sea la correcta.' }); setCodigo(''); return }
    setAlta(null); setCodigo('')
    setMsg2fa({ tipo: 'ok', msg: 'Listo: a partir de ahora, al entrar se te pedirá el código de tu aplicación.' })
    insertLog({ accion: 'activo_2fa', descripcion: 'Activó la verificación en dos pasos' })
    await cargarFactores(); recargarAcceso()
  }

  async function desactivar() {
    if (!activo || !confirm('¿Quitar la verificación en dos pasos? Tu cuenta quedará protegida solo con contraseña.')) return
    setOcupado(true)
    const { error } = await supabase.auth.mfa.unenroll({ factorId: activo.id })
    setOcupado(false)
    if (error) { setMsg2fa({ tipo: 'error', msg: /aal2/i.test(error.message) ? 'Por seguridad, cierra sesión y vuelve a entrar con tu código antes de quitarla.' : error.message }); return }
    setMsg2fa({ tipo: 'ok', msg: 'Verificación en dos pasos desactivada.' })
    insertLog({ accion: 'desactivo_2fa', descripcion: 'Desactivó la verificación en dos pasos' })
    await supabase.auth.refreshSession(); await cargarFactores(); recargarAcceso()
  }

  return (
    <>
      <div className="field-l">Cambiar contraseña</div>
      <div className="field-row">
        <Campo label="Nueva contraseña" tipo="password" value={pass} onChange={v => { setPass(v); setMsgPass(null) }} />
        <Campo label="Repítela" tipo="password" value={pass2} onChange={v => { setPass2(v); setMsgPass(null) }} />
      </div>
      {pass && <ReglasContrasena pass={pass} extra={[[!!pass2 && pass === pass2, 'Las dos contraseñas coinciden']]} />}
      {msgPass && <Aviso tipo={msgPass.tipo}>{msgPass.msg}</Aviso>}
      <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={cambiarPass} disabled={ocupado || !pass}><Key size={15} />Cambiar contraseña</button>

      <div style={{ borderTop: '1px solid var(--hairline)', margin: '6px 0' }} />
      <div className="field-l">Verificación en dos pasos (2FA)</div>
      <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5 }}>
        Además de la contraseña, al entrar se pide un código de 6 dígitos que genera tu celular con Google Authenticator,
        Microsoft Authenticator o similar. Muy recomendado para el dueño.
      </div>
      {activo ? (
        <>
          <Aviso tipo="ok"><ShieldCheck size={14} style={{ verticalAlign: -2 }} /> Activada en esta cuenta.</Aviso>
          <button className="btn" style={{ alignSelf: 'flex-start', color: 'var(--danger-ink)' }} onClick={desactivar} disabled={ocupado}>Quitar verificación en dos pasos</button>
        </>
      ) : alta ? (
        <>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6 }}>
            <li>Abre tu aplicación de autenticación y elige <b>agregar cuenta → escanear código QR</b>.</li>
            <li>Escanea este código (o escribe la clave manualmente).</li>
            <li>Escribe aquí el código de 6 dígitos que aparece.</li>
          </ol>
          <img src={alta.qr} alt="Código QR para la aplicación de autenticación" style={{ width: 180, height: 180, background: '#fff', borderRadius: 12, padding: 8, border: '1px solid var(--card-line)' }} />
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Clave manual: <code style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{alta.secreto}</code></div>
          <input className="field-i" value={codigo} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000"
            onChange={e => { setCodigo(e.target.value.replace(/\D/g, '')); setMsg2fa(null) }} onKeyDown={e => e.key === 'Enter' && confirmarAlta()}
            style={{ maxWidth: 200, fontSize: 22, letterSpacing: 6, textAlign: 'center', fontFamily: 'var(--font-mono)' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn primary" onClick={confirmarAlta} disabled={ocupado}>Activar</button>
            <button className="btn" onClick={() => { setAlta(null); setCodigo('') }}>Cancelar</button>
          </div>
        </>
      ) : (
        <button className="btn primary" style={{ alignSelf: 'flex-start' }} onClick={iniciarAlta} disabled={ocupado}><ShieldCheck size={15} />Activar verificación en dos pasos</button>
      )}
      {msg2fa && <Aviso tipo={msg2fa.tipo}>{msg2fa.msg}</Aviso>}
    </>
  )
}

// ── Sincronización y respaldo ─────────────────────────────────────────────
const TABLAS_RESPALDO = ['configuracion', 'vehiculos', 'clientes', 'reservas', 'pagos', 'cotizaciones', 'documentos', 'caja_movimientos', 'clientes_vetos', 'logs', 'auditoria']

function RespaldoForm({ esDueno }: { esDueno: boolean }) {
  const [conexion, setConexion] = useState<'probando' | 'ok' | 'error'>('probando')
  const [ms, setMs] = useState(0)
  const [progreso, setProgreso] = useState('')
  const [error, setError] = useState('')

  async function probar() {
    setConexion('probando')
    const t = performance.now()
    const { error: e } = await db.from('vehiculos').select('id', { head: true, count: 'exact' })
    setMs(Math.round(performance.now() - t)); setConexion(e ? 'error' : 'ok')
  }
  useEffect(() => { probar() }, [])

  async function actualizarApp() {
    const reg = await navigator.serviceWorker?.getRegistration()
    await reg?.update()
    await cargarConfig()
    location.reload()
  }

  async function descargar() {
    setError('')
    const respaldo: Record<string, unknown> = { app: 'Lucianos Rent-a-car', version: __VERSION__, fecha: new Date().toISOString() }
    try {
      for (const t of TABLAS_RESPALDO) {
        const filas: unknown[] = []
        for (let desde = 0; ; desde += 1000) {
          setProgreso(`Descargando ${t}… (${filas.length})`)
          const { data, error: e } = await db.from(t).select('*').range(desde, desde + 999)
          if (e) { if (e.code === '42P01' || e.code === 'PGRST205') break; throw e }
          filas.push(...(data ?? []))
          if (!data || data.length < 1000) break
        }
        respaldo[t] = filas
      }
    } catch (e) {
      setError(mensajeError(e as { message: string })); setProgreso(''); return
    }
    const blob = new Blob([JSON.stringify(respaldo, null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `respaldo-lucianos-${new Date().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(a.href)
    const total = TABLAS_RESPALDO.reduce((s, t) => s + ((respaldo[t] as unknown[])?.length ?? 0), 0)
    setProgreso(`Respaldo descargado: ${total} registros.`)
    insertLog({ accion: 'respaldo_descargado', descripcion: `Descargó un respaldo completo (${total} registros)` })
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
        <span style={{ width: 9, height: 9, borderRadius: 9, background: conexion === 'ok' ? 'var(--primary)' : conexion === 'error' ? 'var(--danger-ink)' : 'var(--ink4)' }} />
        {conexion === 'probando' ? 'Probando conexión…' : conexion === 'ok' ? `Conectado a la base de datos · ${ms} ms` : 'Sin conexión con la base de datos. Revisa el internet.'}
        <button className="btn sm" onClick={probar}>Probar</button>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5 }}>
        Todo se guarda al instante en la nube: cualquier cambio lo ven los demás usuarios al abrir o refrescar la pantalla. No hay que sincronizar a mano.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13 }}>
        <span style={{ color: 'var(--ink3)' }}>Versión instalada: <code style={{ fontFamily: 'var(--font-mono)' }}>{__VERSION__}</code></span>
        <button className="btn sm" onClick={actualizarApp}><RefreshCw size={13} />Buscar actualización</button>
      </div>
      <div style={{ borderTop: '1px solid var(--hairline)', margin: '6px 0' }} />
      <div className="field-l">Respaldo</div>
      <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5 }}>
        Supabase guarda copias automáticas de la base de datos. Además, el dueño puede descargar aquí un archivo con toda la información
        (autos, clientes, reservas, pagos, caja y registro de actividad) para guardarlo en su computadora o en Drive.
      </div>
      {esDueno
        ? <button className="btn primary" style={{ alignSelf: 'flex-start' }} onClick={descargar} disabled={!!progreso && !progreso.startsWith('Respaldo')}><Download size={15} />Descargar respaldo completo</button>
        : <SoloDuenoNota />}
      {progreso && <Aviso tipo={progreso.startsWith('Respaldo') ? 'ok' : 'info'}>{progreso}</Aviso>}
      {error && <Aviso tipo="error">{error}</Aviso>}
    </>
  )
}

export default function MoreScreen() {
  const navigate = useNavigate()
  const { currentInitials, currentFirstName, currentRole, currentEmail, esDueno, signOut } = useAuth()
  const [abierta, setAbierta] = useState<string | null>(null)
  const toggle = (id: string) => setAbierta(a => (a === id ? null : id))

  async function salir() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="screen">
      <div className="pagehead" style={{ marginBottom: 'var(--gap)' }}>
        <div>
          <div className="eyebrow">Cuenta</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 40px)' }}>Ajustes</h1>
          <div style={{ color: 'var(--ink3)', fontSize: 14, marginTop: 6 }}>Datos del negocio, cobros, contrato y seguridad de tu cuenta</div>
        </div>
      </div>
      <div className="set-wrap">
        <div className="card set-profile">
          <div className="avatar accent" style={{ width: 60, height: 60, fontSize: 20 }}>{currentInitials || 'LL'}</div>
          <div className="meta">
            <h2>{currentFirstName || 'Usuario'}</h2>
            <div className="mail">{identificador(currentEmail)}</div>
          </div>
          <span className={'chip ' + (esDueno ? 'primary' : '')}>{currentRole}</span>
          <button className="btn sm" onClick={() => navigate('/app/edit-profile')}>Editar perfil</button>
        </div>

        <div className="set-section">
          <div className="eyebrow">Negocio</div>
          <div className="card set-card">
            <Seccion id="negocio" abierta={abierta} onToggle={toggle} icon={<Building2 size={17} />} titulo="Datos del negocio y sucursal" valor={`${EMPRESA.sucursal} · ${EMPRESA.ciudadFirma}`}>
              <NegocioForm puede={esDueno} />
            </Seccion>
            <Seccion id="moneda" abierta={abierta} onToggle={toggle} icon={<DollarSign size={17} />} titulo="Moneda" valor="MXN $">
              <Aviso tipo="info">Todos los precios, pagos y reportes se manejan en <b>pesos mexicanos (MXN)</b>. Si un cliente paga en dólares, registra el equivalente en pesos y anota el tipo de cambio en la nota del pago.</Aviso>
            </Seccion>
            <Seccion id="cobros" abierta={abierta} onToggle={toggle} icon={<CreditCard size={17} />} titulo="Métodos de pago, IVA y cargos"
              valor={`${EMPRESA.metodosPago.map(metodoLabel).join(' · ')} · IVA ${Math.round(EMPRESA.ivaTasa * 100)}%`}>
              <CobrosForm puede={esDueno} />
            </Seccion>
            <Seccion id="contrato" abierta={abierta} onToggle={toggle} icon={<FileText size={17} />} titulo="Contrato" valor="1 formato">
              <ContratoForm puede={esDueno} />
            </Seccion>
          </div>
        </div>

        <div className="set-section">
          <div className="eyebrow">Cuenta</div>
          <div className="card set-card">
            <Seccion id="seguridad" abierta={abierta} onToggle={toggle} icon={<Key size={17} />} titulo="Seguridad y 2FA">
              <SeguridadForm />
            </Seccion>
            <Seccion id="instalar" abierta={abierta} onToggle={toggle} icon={<Smartphone size={17} />} titulo="Instalar la app en este dispositivo">
              <InstalarApp />
            </Seccion>
            <Seccion id="respaldo" abierta={abierta} onToggle={toggle} icon={<RefreshCw size={17} />} titulo="Sincronización y respaldo">
              <RespaldoForm esDueno={esDueno} />
            </Seccion>
            <div className="set-link danger" onClick={salir}>
              <LogOut size={17} /><span className="l">Cerrar sesión</span>
            </div>
          </div>
        </div>

        <div className="set-ver">Lucianos Rent-a-car · versión {__VERSION__}</div>
      </div>
    </div>
  )
}
