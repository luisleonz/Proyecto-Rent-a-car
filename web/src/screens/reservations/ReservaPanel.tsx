import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check, Clock, Printer, Key, CornerDownLeft, Ban, Archive, MessageCircle, Plus, Pencil, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { insertLog } from '../../lib/log'
import { hoyISO, diffDias } from '../../lib/fechas'
import { registrarPago, mensajeError, whatsappUrl, metodoLabel, CONCEPTO_LABEL, METODOS,
  type Pago, type MetodoPago, type ConceptoPago } from '../../lib/operacion'
import { urlsFirmadas } from '../../lib/fotos'
import type { ReservaConDetalle, ReservaStatus } from '../../lib/database.types'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

const STATUS_LABEL: Record<ReservaStatus, string> = { pendiente: 'Pendiente', confirmada: 'Confirmada', entregada: 'Entregada', devuelta: 'Devuelta', cancelada: 'Cancelada' }
const STATUS_CHIP: Record<ReservaStatus, string> = { pendiente: '', confirmada: 'primary', entregada: 'primary', devuelta: '', cancelada: '' }
const fmt = (n: number) => new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(n)
const fmtDate = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
const fmtFecha = (s: string) => new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const gas = (n?: number | null) => (n == null ? '—' : n >= 100 ? 'Lleno' : n <= 0 ? 'Vacío' : `${n}%`)

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <div className="qpanel-section"><div className="qpanel-section-title">{titulo}</div>{children}</div>
}
function Fila({ l, v, tono }: { l: string; v: React.ReactNode; tono?: string }) {
  return <div className="qpanel-row"><span className="lbl">{l}</span><span className="val" style={tono ? { color: tono } : undefined}>{v}</span></div>
}

export default function ReservaPanel({ res, open, onClose, onChanged }: {
  res: ReservaConDetalle | null; open: boolean; onClose: () => void; onChanged: () => void
}) {
  const { currentEmail, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [pagos, setPagos] = useState<Pago[]>([])
  const [fotos, setFotos] = useState<Record<string, string>>({})
  const [aviso, setAviso] = useState<{ ok: boolean; t: string } | null>(null)
  const [working, setWorking] = useState(false)
  // payment form
  const [pagoOpen, setPagoOpen] = useState(false)
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
  const [concepto, setConcepto] = useState<ConceptoPago>('renta')
  const [notaPago, setNotaPago] = useState('')
  // edit form
  const [editing, setEditing] = useState(false)
  const [ed, setEd] = useState({ fecha_entrega: '', hora_entrega: '', fecha_devolucion: '', hora_devolucion: '', total: '', notas: '', motivo: '' })

  const hoy = hoyISO()
  const pagado = res?.deposito ?? 0
  const saldo = res ? Math.max(0, (res.total ?? 0) - pagado) : 0
  const tel = res?.clientes?.telefono

  async function cargarPagos() {
    if (!res) return
    const { data } = await db.from('pagos').select('*').eq('reserva_id', res.id).order('fecha')
    setPagos(data ?? [])
  }

  useEffect(() => {
    if (!res) return
    setAviso(null); setPagoOpen(false); setEditing(false); setPagos([]); setFotos({})
    cargarPagos()
    const rutas = [...(res.fotos_entrega ?? []), ...(res.fotos_devolucion ?? []), ...(res.firma_cliente ? [res.firma_cliente] : [])]
    if (rutas.length) urlsFirmadas(rutas).then(setFotos)
  }, [res?.id])

  if (!res) return <div className={`qpanel${open ? ' open' : ''}`} />

  const vencida = res.status === 'entregada' && res.fecha_devolucion < hoy
  const noSalio = (res.status === 'confirmada' || res.status === 'pendiente') && res.fecha_entrega < hoy
  const abierta = res.status !== 'devuelta' && res.status !== 'cancelada'

  async function cambiarDirecto(cambios: Record<string, unknown>, accion: string, descripcion: string) {
    setWorking(true)
    const { error } = await db.from('reservas').update(cambios).eq('id', res!.id)
    setWorking(false)
    if (error) { setAviso({ ok: false, t: mensajeError(error) }); return false }
    await insertLog({ accion, entidad: 'reservas', entidad_id: res!.id, descripcion, realizado_por: currentEmail, datos_nuevos: cambios })
    onChanged()
    return true
  }

  async function solicitar(tipo: string, datos_nuevos: Record<string, unknown>) {
    setWorking(true)
    const datos_actuales = Object.fromEntries(Object.keys(datos_nuevos).map(k => [k, (res as unknown as Record<string, unknown>)[k] ?? null]))
    const { error } = await db.from('solicitudes').insert({
      tipo, tabla: 'reservas', registro_id: res!.id, datos_actuales,
      datos_nuevos, solicitado_por: currentEmail,
    })
    setWorking(false)
    setAviso(error ? { ok: false, t: mensajeError(error) } : { ok: true, t: 'Solicitud enviada; un administrador debe aprobarla.' })
  }

  async function cancelar() {
    const motivo = prompt(noSalio ? 'Motivo (ej. el cliente no se presentó):' : 'Motivo de la cancelación:')
    if (motivo === null) return
    const notas = [res!.notas, `Cancelada: ${motivo || 'sin motivo'}`].filter(Boolean).join('\n')
    if (isAdmin) {
      if (await cambiarDirecto({ status: 'cancelada', notas }, 'cancelar_reserva', `Reserva #${res!.folio ?? ''} cancelada: ${motivo}`))
        setAviso({ ok: true, t: 'Reserva cancelada; el vehículo quedó libre.' })
    } else {
      solicitar('cancelar_reserva', { status: 'cancelada', notas })
    }
  }

  async function cerrarComoDevuelta() {
    if (!confirm('Esto marca la renta como terminada sin registrar kilometraje ni gasolina. Úsalo solo para rentas viejas que ya regresaron. ¿Continuar?')) return
    const cambios = { status: 'devuelta', devuelto_at: `${res!.fecha_devolucion}T12:00:00`, recibido_por: currentEmail,
      notas: [res!.notas, 'Cerrada sin registro de devolución'].filter(Boolean).join('\n') }
    if (await cambiarDirecto(cambios, 'cerrar_reserva', `Reserva #${res!.folio ?? ''} cerrada como devuelta`))
      setAviso({ ok: true, t: 'Renta cerrada como devuelta.' })
  }

  async function guardarPago() {
    const m = Number(monto)
    if (!m || m <= 0) { setAviso({ ok: false, t: 'Escribe un monto válido.' }); return }
    setWorking(true)
    const err = await registrarPago({ reservaId: res!.id, pagadoActual: pagado, monto: m, metodo, concepto, notas: notaPago, por: currentEmail })
    setWorking(false)
    if (err) { setAviso({ ok: false, t: mensajeError(err) }); return }
    await insertLog({ accion: 'registrar_pago', entidad: 'reservas', entidad_id: res!.id, descripcion: `${CONCEPTO_LABEL[concepto]} de $${fmt(m)} (${metodo}) · reserva #${res!.folio ?? ''}`, realizado_por: currentEmail })
    setPagoOpen(false); setMonto(''); setNotaPago('')
    setAviso({ ok: true, t: 'Pago registrado.' })
    cargarPagos(); onChanged()
  }

  function abrirEdicion() {
    setEd({ fecha_entrega: res!.fecha_entrega, hora_entrega: res!.hora_entrega?.slice(0, 5) ?? '', fecha_devolucion: res!.fecha_devolucion,
      hora_devolucion: res!.hora_devolucion?.slice(0, 5) ?? '', total: String(res!.total ?? ''), notas: res!.notas ?? '', motivo: '' })
    setEditing(true)
  }

  async function guardarEdicion() {
    const nuevos: Record<string, unknown> = {}
    if (ed.fecha_entrega !== res!.fecha_entrega) nuevos.fecha_entrega = ed.fecha_entrega
    if (ed.fecha_devolucion !== res!.fecha_devolucion) nuevos.fecha_devolucion = ed.fecha_devolucion
    if (ed.hora_entrega !== (res!.hora_entrega?.slice(0, 5) ?? '')) nuevos.hora_entrega = ed.hora_entrega || null
    if (ed.hora_devolucion !== (res!.hora_devolucion?.slice(0, 5) ?? '')) nuevos.hora_devolucion = ed.hora_devolucion || null
    if (ed.total !== String(res!.total ?? '')) nuevos.total = ed.total === '' ? null : Number(ed.total)
    if (ed.notas !== (res!.notas ?? '')) nuevos.notas = ed.notas || null
    if (!Object.keys(nuevos).length) { setEditing(false); return }
    if (ed.fecha_devolucion < ed.fecha_entrega) { setAviso({ ok: false, t: 'La devolución no puede ser antes de la entrega.' }); return }
    if (isAdmin) {
      if (await cambiarDirecto(nuevos, 'editar_reserva', `Reserva #${res!.folio ?? ''} editada`)) { setEditing(false); setAviso({ ok: true, t: 'Cambios guardados.' }) }
    } else {
      await solicitar('editar_reserva', nuevos); setEditing(false)
    }
  }

  const nombre = res.clientes?.nombre ?? 'Cliente'
  const veh = res.vehiculos ? `${res.vehiculos.modelo} (${res.vehiculos.placa})` : 'el vehículo'
  const msjEntrega = `Hola ${nombre.split(' ')[0]}, le recordamos su renta de ${veh} con Luciano's Tours el ${fmtDate(res.fecha_entrega)}${res.hora_entrega ? ` a las ${res.hora_entrega.slice(0, 5)}` : ''}. Traiga su licencia vigente e identificación.${saldo > 0 ? ` Saldo por pagar: $${fmt(saldo)}.` : ''}`
  const msjDevolucion = `Hola ${nombre.split(' ')[0]}, le recordamos que la devolución de ${veh} es el ${fmtDate(res.fecha_devolucion)}${res.hora_devolucion ? ` a las ${res.hora_devolucion.slice(0, 5)}` : ''}. Gracias por rentar con Luciano's Tours.`
  const msjSaldo = `Hola ${nombre.split(' ')[0]}, de su renta #${res.folio ?? ''} con Luciano's Tours queda un saldo pendiente de $${fmt(saldo)}. Puede pagarlo en efectivo, tarjeta o transferencia. ¡Gracias!`

  return (
    <>
      {open && <div className="qpanel-overlay" onClick={onClose} />}
      <div className={`qpanel${open ? ' open' : ''}`}>
        <div className="qpanel-head">
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Reserva{res.folio != null ? ` #${res.folio}` : ''}</div>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-display)' }}>{nombre}</div>
            {tel && <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 3 }}>{tel}</div>}
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className={`chip sm ${STATUS_CHIP[res.status]}`}>{STATUS_LABEL[res.status]}</span>
              {vencida && <span className="chip sm danger">Devolución atrasada {diffDias(res.fecha_devolucion, hoy)}d</span>}
              {noSalio && <span className="chip sm warn">Debió salir hace {diffDias(res.fecha_entrega, hoy)}d</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--ink3)', flexShrink: 0 }}><X size={20} /></button>
        </div>

        <div className="qpanel-body">
          {aviso && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 10, fontSize: 13,
              background: aviso.ok ? 'var(--primary-soft)' : 'var(--danger-soft)', color: aviso.ok ? 'var(--primary-dark)' : 'var(--danger-ink)' }}>
              {aviso.ok ? <Check size={15} /> : <AlertTriangle size={15} />}<span>{aviso.t}</span>
            </div>
          )}

          {/* Main actions */}
          {abierta && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {res.status === 'entregada'
                ? <button className="btn primary" onClick={() => navigate(`/app/devolucion/${res.id}`)}><CornerDownLeft size={15} />Registrar devolución</button>
                : <button className="btn primary" onClick={() => navigate(`/app/entrega/${res.id}`)}><Key size={15} />Registrar entrega</button>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {res.status !== 'entregada' && (
                  <button className="btn sm" style={{ flex: 1 }} onClick={cancelar} disabled={working}><Ban size={14} />{noSalio ? 'No se presentó' : 'Cancelar'}</button>
                )}
                {isAdmin && res.fecha_devolucion < hoy && (
                  <button className="btn sm" style={{ flex: 1 }} onClick={cerrarComoDevuelta} disabled={working}><Archive size={14} />Ya regresó (cerrar)</button>
                )}
              </div>
            </div>
          )}

          {/* WhatsApp */}
          {tel && res.status !== 'cancelada' && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(res.status === 'confirmada' || res.status === 'pendiente') && <a className="btn sm" href={whatsappUrl(tel, msjEntrega)} target="_blank" rel="noreferrer"><MessageCircle size={14} />Recordar entrega</a>}
              {res.status === 'entregada' && <a className="btn sm" href={whatsappUrl(tel, msjDevolucion)} target="_blank" rel="noreferrer"><MessageCircle size={14} />Recordar devolución</a>}
              {saldo > 0 && <a className="btn sm" href={whatsappUrl(tel, msjSaldo)} target="_blank" rel="noreferrer"><MessageCircle size={14} />Cobrar saldo</a>}
            </div>
          )}

          {/* Vehicle */}
          <button onClick={() => res.vehiculos && navigate(`/app/vehicles/${res.vehiculos.placa}`)}
            style={{ background: 'var(--paper-alt)', borderRadius: 10, padding: '12px 14px', border: 0, textAlign: 'left', font: 'inherit', cursor: 'pointer' }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{res.vehiculos?.modelo ?? '—'}</div>
            <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 2 }}>{res.vehiculos?.placa}{res.vehiculos?.anio ? ` · ${res.vehiculos.anio}` : ''}</div>
          </button>

          {/* Details / edit */}
          {!editing ? (
            <Seccion titulo="Detalle">
              <Fila l="Entrega" v={`${fmtDate(res.fecha_entrega)}${res.hora_entrega ? ` · ${res.hora_entrega.slice(0, 5)}` : ''}`} />
              <Fila l="Devolución" v={`${fmtDate(res.fecha_devolucion)}${res.hora_devolucion ? ` · ${res.hora_devolucion.slice(0, 5)}` : ''}`} tono={vencida ? 'var(--danger-ink)' : undefined} />
              {res.cobertura && <Fila l="Cobertura" v={res.cobertura === 'cero_deducible' ? 'Cero deducible' : 'Básica'} />}
              {res.lugar_entrega && <Fila l="Lugar" v={res.lugar_entrega} />}
              {res.notas && <div style={{ fontSize: 12.5, color: 'var(--ink2)', whiteSpace: 'pre-line', background: 'var(--paper-alt)', borderRadius: 8, padding: '8px 10px', marginTop: 4 }}>{res.notas}</div>}
              {abierta && <button className="btn sm" style={{ alignSelf: 'flex-start', marginTop: 6 }} onClick={abrirEdicion}><Pencil size={13} />{isAdmin ? 'Editar' : 'Solicitar cambio'}</button>}
            </Seccion>
          ) : (
            <Seccion titulo={isAdmin ? 'Editar reserva' : 'Solicitar cambio'}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([['fecha_entrega', 'Entrega', 'date'], ['hora_entrega', 'Hora', 'time'], ['fecha_devolucion', 'Devolución', 'date'], ['hora_devolucion', 'Hora', 'time']] as const).map(([k, l, t]) => (
                  <div className="field" key={k}><label className="field-l">{l}</label>
                    <input className="field-i" type={t} value={ed[k]} onChange={e => setEd(x => ({ ...x, [k]: e.target.value }))} /></div>
                ))}
              </div>
              <div className="field"><label className="field-l">Total $</label>
                <input className="field-i" inputMode="decimal" value={ed.total} onChange={e => setEd(x => ({ ...x, total: e.target.value.replace(/[^0-9.]/g, '') }))} /></div>
              <div className="field"><label className="field-l">Notas</label>
                <textarea className="field-i" rows={2} value={ed.notas} onChange={e => setEd(x => ({ ...x, notas: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancelar</button>
                <button className="btn primary" style={{ flex: 2 }} onClick={guardarEdicion} disabled={working}><Check size={14} />{isAdmin ? 'Guardar' : 'Enviar solicitud'}</button>
              </div>
            </Seccion>
          )}

          {/* Money */}
          <Seccion titulo="Cobro">
            {res.total != null && <Fila l={`Total${res.iva ? ' (con IVA)' : ''}`} v={`$${fmt(res.total)}`} />}
            {(res.cargos_extra ?? 0) > 0 && <Fila l="Incluye cargos extra" v={`$${fmt(res.cargos_extra ?? 0)}`} />}
            <Fila l="Pagado" v={`$${fmt(pagado)}`} tono="var(--primary)" />
            {res.total != null && res.status !== 'cancelada' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, padding: '10px 12px', borderRadius: 9,
                background: saldo > 0 ? 'var(--warn-soft)' : 'var(--primary-soft)', border: `1px solid ${saldo > 0 ? 'var(--warn-line)' : 'var(--primary-line)'}` }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: saldo > 0 ? 'var(--warn-ink)' : 'var(--primary-dark)' }}>{saldo > 0 ? 'Saldo pendiente' : 'Pagado completo'}</span>
                <span style={{ fontSize: 17, fontWeight: 800, color: saldo > 0 ? 'var(--warn-ink)' : 'var(--primary-dark)' }}>{saldo > 0 ? `$${fmt(saldo)}` : '✓'}</span>
              </div>
            )}
            {(res.fianza ?? 0) > 0 && (
              <Fila l="Depósito en garantía" v={`$${fmt(res.fianza ?? 0)}${res.fianza_devuelta != null ? ` · devuelto $${fmt(res.fianza_devuelta)}` : ''}`} />
            )}

            {pagos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {pagos.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, padding: '6px 0', borderTop: '1px solid var(--hairline)' }}>
                    <span style={{ color: 'var(--ink2)' }}>
                      {new Date(p.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })} · {CONCEPTO_LABEL[p.concepto] ?? p.concepto} · {metodoLabel(p.metodo)}
                      {p.notas && <span style={{ color: 'var(--ink3)' }}> · {p.notas}</span>}
                    </span>
                    <strong style={{ color: p.concepto === 'devolucion_fianza' ? 'var(--danger-ink)' : 'var(--ink)' }}>{p.concepto === 'devolucion_fianza' ? '−' : ''}${fmt(p.monto)}</strong>
                  </div>
                ))}
              </div>
            )}

            {res.status !== 'cancelada' && !pagoOpen && (
              <button className="btn sm" style={{ alignSelf: 'flex-start', marginTop: 8 }}
                onClick={() => { setPagoOpen(true); setMonto(saldo > 0 ? String(saldo) : ''); setConcepto('renta') }}>
                <Plus size={13} />Registrar pago
              </button>
            )}
            {pagoOpen && (
              <div style={{ background: 'var(--paper-alt)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="field-money" style={{ flex: 1 }}><span>$</span>
                    <input className="field-i" inputMode="decimal" value={monto} onChange={e => setMonto(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Monto" autoFocus /></div>
                  <select className="field-i" style={{ flex: 1 }} value={concepto} onChange={e => setConcepto(e.target.value as ConceptoPago)}>
                    {(Object.keys(CONCEPTO_LABEL) as ConceptoPago[]).map(c => <option key={c} value={c}>{CONCEPTO_LABEL[c]}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {METODOS.map(m => (
                    <button key={m} className={`btn sm${metodo === m ? ' primary' : ''}`} style={{ flex: 1 }} onClick={() => setMetodo(m)}>{metodoLabel(m)}</button>
                  ))}
                </div>
                <input className="field-i" value={notaPago} onChange={e => setNotaPago(e.target.value)} placeholder="Nota (opcional): referencia, folio de terminal…" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn sm" style={{ flex: 1 }} onClick={() => setPagoOpen(false)}>Cancelar</button>
                  <button className="btn sm primary" style={{ flex: 2 }} onClick={guardarPago} disabled={working}><Check size={13} />Guardar pago</button>
                </div>
              </div>
            )}
          </Seccion>

          {/* Delivery / return record */}
          {(res.entregado_at || res.km_salida != null || res.devuelto_at) && (
            <Seccion titulo="Registro del vehículo">
              {res.entregado_at && <Fila l="Entregado" v={fmtFecha(res.entregado_at)} />}
              {res.km_salida != null && <Fila l="Salida" v={`${fmt(res.km_salida)} km · gasolina ${gas(res.combustible_salida)}`} />}
              {res.devuelto_at && <Fila l="Devuelto" v={fmtFecha(res.devuelto_at)} />}
              {res.km_regreso != null && <Fila l="Regreso" v={`${fmt(res.km_regreso)} km · gasolina ${gas(res.combustible_regreso)}${res.km_salida != null ? ` · ${fmt(res.km_regreso - res.km_salida)} km recorridos` : ''}`} />}
              {res.danos_entrega && <Fila l="Daños al salir" v={res.danos_entrega} />}
              {res.danos_devolucion && <Fila l="Daños al regresar" v={res.danos_devolucion} tono="var(--warn-ink)" />}
              {([['Fotos de salida', res.fotos_entrega], ['Fotos de regreso', res.fotos_devolucion]] as const).map(([t, lista]) => lista && lista.length > 0 && (
                <div key={t}>
                  <div style={{ fontSize: 12, color: 'var(--ink3)', margin: '6px 0 4px' }}>{t}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {lista.map(r => fotos[r] && <a key={r} href={fotos[r]} target="_blank" rel="noreferrer"><img src={fotos[r]} alt="" style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 6 }} /></a>)}
                  </div>
                </div>
              ))}
              {res.firma_cliente && fotos[res.firma_cliente] && (
                <div><div style={{ fontSize: 12, color: 'var(--ink3)', margin: '6px 0 4px' }}>Firma del cliente</div>
                  <img src={fotos[res.firma_cliente]} alt="Firma" style={{ height: 50, background: '#fff', borderRadius: 6, border: '1px solid var(--card-line)' }} /></div>
              )}
            </Seccion>
          )}
        </div>

        <div className="qpanel-foot">
          {res.status !== 'cancelada' && (
            <button className="btn dark" style={{ width: '100%' }} onClick={() => navigate(`/imprimir/contrato/${res.id}`)}><Printer size={15} />Imprimir contrato y póliza</button>
          )}
          {!isAdmin && <div style={{ fontSize: 11.5, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={12} />Cancelaciones y cambios requieren aprobación de un administrador.</div>}
        </div>
      </div>
    </>
  )
}
