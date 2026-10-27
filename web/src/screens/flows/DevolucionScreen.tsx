import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronRight, CornerDownLeft, Wrench, MessageCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { insertLog } from '../../lib/log'
import { hoyISO, diffDias } from '../../lib/fechas'
import { actualizarConExtras } from '../../lib/insertar'
import { subirDocumento, urlsFirmadas } from '../../lib/fotos'
import { registrarPago, mensajeError, metodoLabel, METODOS, whatsappUrl, AVISO_MIGRACION, type MetodoPago } from '../../lib/operacion'
import FlujoPasos, { Bloque, Casilla } from '../../components/FlujoPasos'
import { SelectorGasolina, CapturaFotos, nivelGas, etiquetaGas } from '../../components/Captura'
import type { ReservaContrato } from '../print/ContratoPrint'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any
const fmt = (n: number) => new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(n)
const PASOS = ['Vehículo', 'Cargos', 'Cobro y garantía']

type Cargo = { id: string; concepto: string; monto: string; activo: boolean; ayuda?: string }

export default function DevolucionScreen() {
  const { resId } = useParams()
  const navigate = useNavigate()
  const { currentEmail } = useAuth()
  const [r, setR] = useState<ReservaContrato | null>(null)
  const [error, setError] = useState('')
  const [errConfirm, setErrConfirm] = useState('')
  const [paso, setPaso] = useState(0)
  const [guardando, setGuardando] = useState<string | null>(null)
  const [listo, setListo] = useState<{ avisos: string[]; devolver: number } | null>(null)
  const [fotosSalida, setFotosSalida] = useState<string[]>([])

  const [km, setKm] = useState('')
  const [gas, setGas] = useState<number | null>(null)
  const [fotos, setFotos] = useState<File[]>([])
  const [danos, setDanos] = useState('')
  const [aTaller, setATaller] = useState(false)
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [cobro, setCobro] = useState('')
  const [metodoCobro, setMetodoCobro] = useState<MetodoPago>('efectivo')
  const [usarGarantia, setUsarGarantia] = useState(false)
  const [metodoDevol, setMetodoDevol] = useState<MetodoPago>('efectivo')

  useEffect(() => {
    db.from('reservas').select('*, clientes(*), vehiculos(*)').eq('id', resId).single()
      .then(({ data, error: e }: { data: ReservaContrato | null; error: { message: string } | null }) => {
        if (e || !data) { setError(e?.message ?? 'Reserva no encontrada'); return }
        setR(data)
        setKm(String(data.km_salida ?? data.vehiculos?.km ?? ''))
        setGas(nivelGas(data.combustible_salida ?? 100))
        setMetodoDevol((data.metodo_fianza as MetodoPago) ?? 'efectivo')
        const hoy = hoyISO()
        const tarifa = data.vehiculos?.tarifa_diaria ?? 0
        const diasExtra = Math.max(0, diffDias(data.fecha_devolucion, hoy))
        const esVan = /van/i.test(data.vehiculos?.segmento ?? '') || /van|transit|crafter|avanza/i.test(data.vehiculos?.modelo ?? '')
        setCargos([
          { id: 'dias', concepto: `Días extra (${diasExtra})`, monto: String(diasExtra * tarifa), activo: diasExtra > 0, ayuda: diasExtra > 0 ? `Regresó ${diasExtra} día${diasExtra > 1 ? 's' : ''} tarde × $${fmt(tarifa)}/día (cláusula NOVENA)` : undefined },
          { id: 'gasolina', concepto: 'Gasolina faltante', monto: '', activo: false, ayuda: 'Sin cargo si regresa con 1/4 de tanque o más (cláusula DÉCIMA PRIMERA).' },
          { id: 'limpieza', concepto: 'Lavado de interiores / malos olores', monto: esVan ? '3200' : '1600', activo: false, ayuda: 'Según la póliza: $1,600 sedán/SUV · $3,200 van.' },
          { id: 'danos', concepto: 'Daños', monto: '', activo: false },
          { id: 'otros', concepto: 'Otros (llavero, placas, multas…)', monto: '', activo: false },
        ])
        if (data.fotos_entrega?.length) urlsFirmadas(data.fotos_entrega).then(m => setFotosSalida(Object.values(m)))
      })
  }, [resId])

  const totalCargos = useMemo(() => cargos.filter(c => c.activo).reduce((s, c) => s + (Number(c.monto) || 0), 0), [cargos])

  if (error) return <div className="screen"><p style={{ color: 'var(--danger-ink)' }}>{error}</p></div>
  if (!r) return <div className="screen" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>

  if (r.status !== 'entregada' && !listo) {
    return (
      <div className="screen" style={{ maxWidth: 560 }}>
        <div className="card" style={{ padding: 'var(--pad)', textAlign: 'center' }}>
          <p>Esta reserva está <strong>{r.status}</strong>; solo se registra la devolución de un vehículo entregado.</p>
          <button className="btn" onClick={() => navigate(`/app/reservations?res=${r.id}`)}>Ver reserva</button>
        </div>
      </div>
    )
  }

  const nombre = r.clientes?.nombre ?? 'Cliente'
  const kmNum = Number(km)
  const nuevoTotal = (r.total ?? 0) + totalCargos
  const saldo = Math.max(0, nuevoTotal - (r.deposito ?? 0))
  const fianzaRecibida = r.fianza ?? 0
  const deGarantia = usarGarantia ? Math.min(fianzaRecibida, saldo) : 0
  const cobroNum = Number(cobro) || 0
  const saldoFinal = Math.max(0, saldo - deGarantia - cobroNum)
  const devolver = Math.max(0, fianzaRecibida - deGarantia)

  const setCargo = (id: string, cambios: Partial<Cargo>) => setCargos(cs => cs.map(c => (c.id === id ? { ...c, ...cambios } : c)))

  if (listo) {
    const tel = r.clientes?.telefono
    return (
      <div className="screen" style={{ maxWidth: 560 }}>
        <div className="card" style={{ padding: 'var(--pad)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 30, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={30} color="var(--primary)" /></div>
          <h1 className="h-display" style={{ fontSize: 28 }}>Devolución registrada</h1>
          {listo.devolver > 0 && <p style={{ margin: 0, fontSize: 15 }}>Devuelve al cliente <strong>${fmt(listo.devolver)}</strong> de su garantía ({metodoLabel(metodoDevol)}).</p>}
          {saldoFinal > 0 && <p style={{ margin: 0, color: 'var(--warn-ink)' }}>Queda un saldo pendiente de <strong>${fmt(saldoFinal)}</strong>.</p>}
          {listo.avisos.length > 0 && <div style={{ background: 'var(--warn-soft)', color: 'var(--warn-ink)', borderRadius: 10, padding: '10px 12px', fontSize: 13, textAlign: 'left' }}>{listo.avisos.map(t => <div key={t}>⚠ {t}</div>)}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            {tel && <a className="btn" target="_blank" rel="noreferrer" href={whatsappUrl(tel, `Hola ${nombre.split(' ')[0]}, recibimos su ${r.vehiculos?.modelo}. ¡Gracias por rentar con Luciano's Tours!${saldoFinal > 0 ? ` Queda un saldo pendiente de $${fmt(saldoFinal)}.` : ''}`)}><MessageCircle size={15} />Agradecer por WhatsApp</a>}
            <button className="btn primary" onClick={() => navigate('/app/reservations')}>Volver a reservas</button>
          </div>
        </div>
      </div>
    )
  }

  async function confirmar() {
    if (!r) return
    setErrConfirm('')
    const avisos: string[] = []
    try {
      const rutas: string[] = []
      for (const [i, f] of fotos.entries()) {
        setGuardando(`Subiendo foto ${i + 1} de ${fotos.length}…`)
        try { rutas.push(await subirDocumento(`reservas/${r.id}/devolucion`, f)) } catch { avisos.push(`No se pudo subir la foto ${i + 1}.`) }
      }

      setGuardando('Registrando cobros…')
      let pagado = r.deposito ?? 0
      if (deGarantia > 0) {
        const e = await registrarPago({ reservaId: r.id, pagadoActual: pagado, monto: deGarantia, metodo: (r.metodo_fianza as MetodoPago) ?? 'efectivo',
          concepto: totalCargos > 0 ? 'cargo_extra' : 'renta', notas: 'Tomado del depósito en garantía', por: currentEmail })
        if (e) avisos.push(`No se registró lo tomado de la garantía: ${mensajeError(e)}`); else pagado += deGarantia
      }
      if (cobroNum > 0) {
        const e = await registrarPago({ reservaId: r.id, pagadoActual: pagado, monto: cobroNum, metodo: metodoCobro,
          concepto: totalCargos > 0 ? 'cargo_extra' : 'renta', notas: 'Cobro al recibir', por: currentEmail })
        if (e) avisos.push(`El cobro no se registró: ${mensajeError(e)}`); else pagado += cobroNum
      }
      if (devolver > 0) {
        const e = await registrarPago({ reservaId: r.id, pagadoActual: pagado, monto: devolver, metodo: metodoDevol, concepto: 'devolucion_fianza', por: currentEmail })
        if (e) avisos.push(`La devolución de garantía no se registró: ${mensajeError(e)}`)
      }

      setGuardando('Cerrando la renta…')
      const detalle = cargos.filter(c => c.activo && Number(c.monto) > 0).map(c => ({ concepto: c.concepto, monto: Number(c.monto) }))
      const { error: e, sinExtras } = await actualizarConExtras('reservas', r.id,
        { status: 'devuelta', km_regreso: kmNum, combustible_regreso: gas, devuelto_at: new Date().toISOString(), total: nuevoTotal },
        { recibido_por: currentEmail, fotos_devolucion: rutas, danos_devolucion: danos.trim() || null,
          cargos_extra: totalCargos, cargos_detalle: detalle.length ? detalle : null,
          fianza_devuelta: fianzaRecibida ? devolver : null, fianza_devuelta_at: fianzaRecibida ? new Date().toISOString() : null })
      if (e) throw e
      if (sinExtras) avisos.push(AVISO_MIGRACION)

      await db.from('vehiculos').update({ km: kmNum, combustible: gas, ...(aTaller ? { status: 'taller', info_cliente: danos.trim() || 'Revisión tras devolución' } : {}) }).eq('id', r.vehiculo_id)
      if (!aTaller) {
        const { error: syncErr } = await db.rpc('sincronizar_vehiculo', { vid: r.vehiculo_id })
        if (syncErr) await db.from('vehiculos').update({ status: 'disponible', cliente_actual: null, info_cliente: null }).eq('id', r.vehiculo_id)
      }
      await insertLog({ accion: 'recibir_vehiculo', entidad: 'reservas', entidad_id: r.id, realizado_por: currentEmail,
        descripcion: `${r.vehiculos?.modelo} recibido de ${nombre} (#${r.folio ?? ''}) · ${fmt(kmNum)} km${totalCargos ? ` · cargos $${fmt(totalCargos)}` : ''}`,
        datos_nuevos: { km: kmNum, gasolina: gas, cargos: detalle, garantia_devuelta: devolver } })
      setListo({ avisos, devolver })
    } catch (e) {
      setErrConfirm(`No se pudo registrar la devolución: ${mensajeError(e as { message: string })}`)
    }
    setGuardando(null)
  }

  const puedeSeguir = [!!km && gas != null && (r.km_salida == null || kmNum >= r.km_salida), true, true][paso]

  return (
    <FlujoPasos titulo={`Recibir ${r.vehiculos?.modelo ?? ''}`} subtitulo={`${nombre}${r.folio != null ? ` · contrato #${r.folio}` : ''}`}
      pasos={PASOS} actual={paso} onAtras={() => (paso === 0 ? navigate(-1) : setPaso(paso - 1))}
      pie={paso < PASOS.length - 1
        ? <button className="btn primary" style={{ flex: 1, padding: 14 }} disabled={!puedeSeguir} onClick={() => setPaso(paso + 1)}>Siguiente<ChevronRight size={16} /></button>
        : <button className="btn primary" style={{ flex: 1, padding: 14 }} disabled={!!guardando} onClick={confirmar}><CornerDownLeft size={16} />{guardando ?? 'Confirmar devolución'}</button>}>

      {paso === 0 && <>
        <Bloque titulo="Kilometraje de regreso" ayuda={r.km_salida != null ? `Salió con ${fmt(r.km_salida)} km` : undefined}>
          <input className="field-i" inputMode="numeric" value={km} onChange={e => setKm(e.target.value.replace(/\D/g, ''))} style={{ fontSize: 20, fontWeight: 700 }} />
          {r.km_salida != null && kmNum >= r.km_salida && <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>Recorrió {fmt(kmNum - r.km_salida)} km.</div>}
          {r.km_salida != null && kmNum < r.km_salida && <div style={{ fontSize: 12.5, color: 'var(--danger-ink)' }}>No puede ser menor al kilometraje de salida.</div>}
        </Bloque>
        <Bloque titulo="Gasolina al regresar" ayuda={r.combustible_salida != null ? `Salió con ${etiquetaGas(r.combustible_salida)} de tanque` : undefined}>
          <SelectorGasolina valor={gas} onChange={g => { setGas(g); if (r.combustible_salida != null) setCargo('gasolina', { activo: g < 25 && g < r.combustible_salida }) }} />
        </Bloque>
        <Bloque titulo="Fotos del vehículo" ayuda="Tómalas desde los mismos ángulos que a la salida para comparar.">
          {fotosSalida.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 6 }}>Fotos de la salida:</div>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                {fotosSalida.map(u => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" style={{ height: 70, borderRadius: 8 }} /></a>)}
              </div>
            </div>
          )}
          {r.danos_entrega && <div style={{ fontSize: 12.5, color: 'var(--ink2)' }}>Daños anotados al salir: {r.danos_entrega}</div>}
          <CapturaFotos fotos={fotos} onChange={setFotos} />
        </Bloque>
        <Bloque titulo="Daños nuevos u observaciones">
          <textarea className="field-i" rows={3} value={danos} onChange={e => setDanos(e.target.value)} placeholder="Déjalo vacío si regresó en las mismas condiciones" />
          <Casilla ok={aTaller} onChange={setATaller}><Wrench size={14} style={{ verticalAlign: -2 }} /> Enviar el vehículo a taller después de recibirlo</Casilla>
        </Bloque>
      </>}

      {paso === 1 && <>
        <Bloque titulo="Cargos adicionales" ayuda="Marca los que apliquen y ajusta el monto si hace falta.">
          {cargos.map(c => (
            <div key={c.id} style={{ border: `1.5px solid ${c.activo ? 'var(--primary-line)' : 'var(--card-line)'}`, borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                <input type="checkbox" checked={c.activo} onChange={e => setCargo(c.id, { activo: e.target.checked })} style={{ width: 18, height: 18 }} />{c.concepto}
              </label>
              {c.ayuda && <div style={{ fontSize: 12, color: 'var(--ink3)', marginLeft: 28 }}>{c.ayuda}</div>}
              {c.activo && (
                <div className="field-money" style={{ marginLeft: 28 }}><span>$</span>
                  <input className="field-i" inputMode="decimal" value={c.monto} onChange={e => setCargo(c.id, { monto: e.target.value.replace(/[^0-9.]/g, '') })} placeholder="0" /></div>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, paddingTop: 4 }}>
            <span>Total de cargos</span><span>${fmt(totalCargos)}</span>
          </div>
        </Bloque>
      </>}

      {paso === 2 && <>
        <Bloque titulo="Cuenta final">
          <div style={{ fontSize: 13.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Renta</span><span>${fmt(r.total ?? 0)}</span></div>
            {totalCargos > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cargos adicionales</span><span>+${fmt(totalCargos)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}><span>Pagado</span><span>−${fmt(r.deposito ?? 0)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, padding: '10px 12px', marginTop: 4, borderRadius: 10, background: saldo > 0 ? 'var(--warn-soft)' : 'var(--primary-soft)' }}>
              <span>{saldo > 0 ? 'Saldo por cobrar' : 'Sin saldo'}</span><span>${fmt(saldo)}</span>
            </div>
          </div>
        </Bloque>

        {fianzaRecibida > 0 && saldo > 0 && (
          <Casilla ok={usarGarantia} onChange={setUsarGarantia}>Tomar ${fmt(Math.min(fianzaRecibida, saldo))} del depósito en garantía para cubrir el saldo</Casilla>
        )}

        {saldo - deGarantia > 0 && (
          <Bloque titulo="Cobrar ahora">
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="field-money" style={{ flex: 1 }}><span>$</span><input className="field-i" inputMode="decimal" value={cobro} onChange={e => setCobro(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" /></div>
              <button className="btn sm" onClick={() => setCobro(String(saldo - deGarantia))}>Todo ${fmt(saldo - deGarantia)}</button>
            </div>
            {cobroNum > 0 && <div style={{ display: 'flex', gap: 6 }}>{METODOS.map(m => <button key={m} className={`btn sm${metodoCobro === m ? ' primary' : ''}`} style={{ flex: 1 }} onClick={() => setMetodoCobro(m)}>{metodoLabel(m)}</button>)}</div>}
            {saldoFinal > 0 && <div style={{ fontSize: 12.5, color: 'var(--warn-ink)' }}>Quedará pendiente ${fmt(saldoFinal)}.</div>}
          </Bloque>
        )}

        <Bloque titulo="Depósito en garantía" ayuda={fianzaRecibida > 0 ? `Recibido: $${fmt(fianzaRecibida)}${r.metodo_fianza ? ` (${metodoLabel(r.metodo_fianza)})` : ''}` : 'No se registró depósito en garantía.'}>
          {fianzaRecibida > 0 && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15 }}><span>Devolver al cliente</span><span>${fmt(devolver)}</span></div>
            {devolver > 0 && <div style={{ display: 'flex', gap: 6 }}>{METODOS.map(m => <button key={m} className={`btn sm${metodoDevol === m ? ' primary' : ''}`} style={{ flex: 1 }} onClick={() => setMetodoDevol(m)}>{metodoLabel(m)}</button>)}</div>}
          </>}
        </Bloque>
        {errConfirm && <div style={{ color: 'var(--danger-ink)', fontSize: 13 }}>{errConfirm}</div>}
      </>}
    </FlujoPasos>
  )
}
