import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronRight, AlertTriangle, Printer, MessageCircle, Key } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { insertLog } from '../../lib/log'
import { hoyISO } from '../../lib/fechas'
import { actualizarConExtras } from '../../lib/insertar'
import { subirDocumento } from '../../lib/fotos'
import { registrarPago, mensajeError, metodoLabel, METODOS, whatsappUrl, AVISO_MIGRACION, type MetodoPago } from '../../lib/operacion'
import FlujoPasos, { Bloque, Casilla } from '../../components/FlujoPasos'
import { SelectorGasolina, CapturaFotos, FirmaPad, canvasABlob, nivelGas } from '../../components/Captura'
import type { ReservaContrato } from '../print/ContratoPrint'
import { EMPRESA } from '../../lib/empresa'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any
const fmt = (n: number) => new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(n)
const PASOS = ['Documentos', 'Vehículo', 'Cobro', 'Firma']

export default function EntregaScreen() {
  const { resId } = useParams()
  const navigate = useNavigate()
  const { currentEmail } = useAuth()
  const [r, setR] = useState<ReservaContrato | null>(null)
  const [error, setError] = useState('')
  const [paso, setPaso] = useState(0)
  const [guardando, setGuardando] = useState<string | null>(null)
  const [listo, setListo] = useState<string[] | null>(null)
  const [errConfirm, setErrConfirm] = useState('')

  // Step 1 · documents
  const [licencia, setLicencia] = useState('')
  const [licVence, setLicVence] = useState('')
  const [ident, setIdent] = useState('')
  const [licOk, setLicOk] = useState(false)
  const [idOk, setIdOk] = useState(false)
  // Step 2 · vehicle
  const [km, setKm] = useState('')
  const [gas, setGas] = useState<number | null>(null)
  const [fotos, setFotos] = useState<File[]>([])
  const [danos, setDanos] = useState('')
  // Step 3 · money
  const [cobro, setCobro] = useState('')
  const [metodoCobro, setMetodoCobro] = useState<MetodoPago>('efectivo')
  const [fianza, setFianza] = useState('')
  const [metodoFianza, setMetodoFianza] = useState<MetodoPago>('efectivo')
  const [fianzaOk, setFianzaOk] = useState(true)
  // Step 4 · signature
  const [firma, setFirma] = useState<HTMLCanvasElement | null>(null)

  useEffect(() => {
    db.from('reservas').select('*, clientes(*), vehiculos(*)').eq('id', resId).single()
      .then(({ data, error: e }: { data: ReservaContrato | null; error: { message: string } | null }) => {
        if (e || !data) { setError(e?.message ?? 'Reserva no encontrada'); return }
        setR(data)
        setLicencia(data.clientes?.licencia ?? ''); setLicVence(data.clientes?.licencia_vence ?? ''); setIdent(data.clientes?.identificacion ?? '')
        setKm(String(data.vehiculos?.km ?? '')); setGas(nivelGas(data.vehiculos?.combustible ?? 100))
        setCobro(String(Math.max(0, (data.total ?? 0) - (data.deposito ?? 0)) || ''))
        setFianza(String(data.fianza || data.vehiculos?.fianza || ''))
        setMetodoFianza((data.metodo_fianza as MetodoPago) ?? 'efectivo')
      })
  }, [resId])

  if (error) return <div className="screen"><p style={{ color: 'var(--danger-ink)' }}>{error}</p></div>
  if (!r) return <div className="screen" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>

  const hoy = hoyISO()
  const nombre = r.clientes?.nombre ?? 'Cliente'
  const saldo = Math.max(0, (r.total ?? 0) - (r.deposito ?? 0))
  const licVencida = !!licVence && licVence < hoy
  const licVenceAntes = !!licVence && licVence < r.fecha_devolucion
  const kmNum = Number(km)

  if (r.status === 'entregada' || r.status === 'devuelta' || r.status === 'cancelada') {
    return (
      <div className="screen" style={{ maxWidth: 560 }}>
        <div className="card" style={{ padding: 'var(--pad)', textAlign: 'center' }}>
          <p>Esta reserva ya está <strong>{r.status}</strong>.</p>
          <button className="btn" onClick={() => navigate(`/app/reservations?res=${r.id}`)}>Ver reserva</button>
        </div>
      </div>
    )
  }

  if (listo) {
    const tel = r.clientes?.telefono
    return (
      <div className="screen" style={{ maxWidth: 560 }}>
        <div className="card" style={{ padding: 'var(--pad)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 30, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={30} color="var(--primary)" /></div>
          <h1 className="h-display" style={{ fontSize: 28 }}>Vehículo entregado</h1>
          <p style={{ color: 'var(--ink2)', margin: 0 }}>{r.vehiculos?.modelo} con {nombre}. Devolución: {new Date(r.fecha_devolucion + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}{r.hora_devolucion ? ` a las ${r.hora_devolucion.slice(0, 5)}` : ''}.</p>
          {listo.length > 0 && <div style={{ background: 'var(--warn-soft)', color: 'var(--warn-ink)', borderRadius: 10, padding: '10px 12px', fontSize: 13, textAlign: 'left' }}>{listo.map(t => <div key={t}>⚠ {t}</div>)}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <button className="btn primary" onClick={() => navigate(`/imprimir/contrato/${r.id}`)}><Printer size={15} />Imprimir contrato</button>
            {tel && <a className="btn" target="_blank" rel="noreferrer" href={whatsappUrl(tel, `Hola ${nombre.split(' ')[0]}, gracias por rentar con Luciano's Tours. Su ${r.vehiculos?.modelo} debe regresar el ${new Date(r.fecha_devolucion + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}${r.hora_devolucion ? ` a las ${r.hora_devolucion.slice(0, 5)}` : ''}. Cualquier duda: ${EMPRESA.telefono}.`)}><MessageCircle size={15} />Enviar confirmación por WhatsApp</a>}
            <button className="btn" onClick={() => navigate('/app/reservations')}>Volver a reservas</button>
          </div>
        </div>
      </div>
    )
  }

  const puedeSeguir = [
    licOk && idOk && !!licencia.trim(),
    !!km && gas != null && (r.vehiculos?.km == null || kmNum >= 0),
    !fianzaOk || Number(fianza) >= 0,
    true,
  ][paso]

  async function confirmar() {
    if (!r) return
    setErrConfirm('')
    const avisos: string[] = []
    try {
      // documents back to the client record
      const docs: Record<string, unknown> = {}
      if (licencia.trim() !== (r.clientes?.licencia ?? '')) docs.licencia = licencia.trim() || null
      if (licVence !== (r.clientes?.licencia_vence ?? '')) docs.licencia_vence = licVence || null
      if (ident.trim() !== (r.clientes?.identificacion ?? '')) docs.identificacion = ident.trim() || null
      if (r.cliente_id && Object.keys(docs).length) {
        setGuardando('Guardando documentos…')
        const { error: e } = await db.from('clientes').update(docs).eq('id', r.cliente_id)
        if (e) avisos.push('No se guardaron los datos de licencia/INE.')
      }

      const carpeta = `reservas/${r.id}/entrega`
      const rutas: string[] = []
      for (const [i, f] of fotos.entries()) {
        setGuardando(`Subiendo foto ${i + 1} de ${fotos.length}…`)
        try { rutas.push(await subirDocumento(carpeta, f)) } catch { avisos.push(`No se pudo subir la foto ${i + 1}.`) }
      }
      let firmaRuta: string | null = null
      if (firma) {
        setGuardando('Guardando firma…')
        try { firmaRuta = await subirDocumento(carpeta, await canvasABlob(firma), false) } catch { avisos.push('No se pudo guardar la firma.') }
      }

      setGuardando('Registrando cobro…')
      let pagado = r.deposito ?? 0
      const montoCobro = Number(cobro) || 0
      if (montoCobro > 0) {
        const e = await registrarPago({ reservaId: r.id, pagadoActual: pagado, monto: montoCobro, metodo: metodoCobro, concepto: 'renta', notas: 'Cobro al entregar', por: currentEmail })
        if (e) avisos.push(`El cobro no se registró: ${mensajeError(e)}`); else pagado += montoCobro
      }
      const montoFianza = fianzaOk ? Number(fianza) || 0 : 0
      if (montoFianza > 0) {
        const e = await registrarPago({ reservaId: r.id, pagadoActual: pagado, monto: montoFianza, metodo: metodoFianza, concepto: 'fianza', por: currentEmail })
        if (e) avisos.push(`La garantía no se registró: ${mensajeError(e)}`)
      }

      setGuardando('Marcando como entregada…')
      const { error: e, sinExtras } = await actualizarConExtras('reservas', r.id,
        { status: 'entregada', km_salida: kmNum, combustible_salida: gas },
        { entregado_at: new Date().toISOString(), entregado_por: currentEmail, fotos_entrega: rutas, danos_entrega: danos.trim() || null,
          firma_cliente: firmaRuta, fianza: montoFianza || r.fianza || 0, metodo_fianza: montoFianza ? metodoFianza : r.metodo_fianza ?? null })
      if (e) throw e
      if (sinExtras) avisos.push(AVISO_MIGRACION)

      await db.from('vehiculos').update({ km: kmNum, combustible: gas }).eq('id', r.vehiculo_id)
      const { error: syncErr } = await db.rpc('sincronizar_vehiculo', { vid: r.vehiculo_id })
      if (syncErr) await db.from('vehiculos').update({ status: 'rentado', cliente_actual: nombre }).eq('id', r.vehiculo_id)
      await insertLog({ accion: 'entregar_vehiculo', entidad: 'reservas', entidad_id: r.id, realizado_por: currentEmail,
        descripcion: `${r.vehiculos?.modelo} entregado a ${nombre} (#${r.folio ?? ''}) · ${fmt(kmNum)} km`, datos_nuevos: { km: kmNum, gasolina: gas, cobro: montoCobro, fianza: montoFianza } })
      setListo(avisos)
    } catch (e) {
      setErrConfirm(`No se pudo completar la entrega: ${mensajeError(e as { message: string })}`)
    }
    setGuardando(null)
  }

  return (
    <FlujoPasos titulo={`Entregar ${r.vehiculos?.modelo ?? ''}`} subtitulo={`${nombre}${r.folio != null ? ` · contrato #${r.folio}` : ''}`}
      pasos={PASOS} actual={paso} onAtras={() => (paso === 0 ? navigate(-1) : setPaso(paso - 1))}
      pie={paso < PASOS.length - 1
        ? <button className="btn primary" style={{ flex: 1, padding: 14 }} disabled={!puedeSeguir} onClick={() => setPaso(paso + 1)}>Siguiente<ChevronRight size={16} /></button>
        : <button className="btn primary" style={{ flex: 1, padding: 14 }} disabled={!!guardando} onClick={confirmar}><Key size={16} />{guardando ?? 'Confirmar entrega'}</button>}>

      {paso === 0 && <>
        {r.fecha_entrega > hoy && (
          <div style={{ background: 'var(--warn-soft)', color: 'var(--warn-ink)', borderRadius: 10, padding: '10px 12px', fontSize: 13 }}>
            Esta reserva es para el {new Date(r.fecha_entrega + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}. Puedes entregarla antes si el cliente ya está aquí.
          </div>
        )}
        <Bloque titulo="Licencia de conducir" ayuda="Revisa que sea original, vigente y a nombre del cliente.">
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="field-i" style={{ flex: 3 }} value={licencia} onChange={e => setLicencia(e.target.value)} placeholder="Número de licencia" />
            <input className="field-i" style={{ flex: 2 }} type="date" value={licVence} onChange={e => setLicVence(e.target.value)} />
          </div>
          {(licVencida || licVenceAntes) && (
            <div style={{ display: 'flex', gap: 6, color: 'var(--danger-ink)', fontSize: 13, fontWeight: 600 }}><AlertTriangle size={15} />
              {licVencida ? 'La licencia está vencida. No se debe entregar el vehículo.' : 'La licencia vence antes de la devolución.'}</div>
          )}
          <Casilla ok={licOk} onChange={setLicOk}>Revisé la licencia física y está vigente</Casilla>
        </Bloque>
        <Bloque titulo="Identificación oficial">
          <input className="field-i" value={ident} onChange={e => setIdent(e.target.value)} placeholder="INE o pasaporte (IDMEX…)" />
          <Casilla ok={idOk} onChange={setIdOk}>Revisé la identificación y coincide con el cliente</Casilla>
        </Bloque>
      </>}

      {paso === 1 && <>
        <Bloque titulo="Kilometraje de salida" ayuda={r.vehiculos?.km != null ? `Último registrado: ${fmt(r.vehiculos.km)} km` : undefined}>
          <input className="field-i" inputMode="numeric" value={km} onChange={e => setKm(e.target.value.replace(/\D/g, ''))} style={{ fontSize: 20, fontWeight: 700 }} />
          {r.vehiculos?.km != null && kmNum < r.vehiculos.km && <div style={{ fontSize: 12.5, color: 'var(--warn-ink)' }}>Es menor al último kilometraje registrado; revisa el tablero.</div>}
        </Bloque>
        <Bloque titulo="Gasolina al salir"><SelectorGasolina valor={gas} onChange={setGas} /></Bloque>
        <Bloque titulo="Fotos del vehículo" ayuda="Sirven de prueba si al regresar aparece un daño nuevo.">
          <CapturaFotos fotos={fotos} onChange={setFotos} sugeridas={['Frente', 'Atrás', 'Lado izquierdo', 'Lado derecho', 'Tablero', 'Interior']} />
        </Bloque>
        <Bloque titulo="Daños o detalles existentes">
          <textarea className="field-i" rows={3} value={danos} onChange={e => setDanos(e.target.value)} placeholder="Ej. rayón en defensa trasera, tapete roto…" />
        </Bloque>
      </>}

      {paso === 2 && <>
        <Bloque titulo="Saldo de la renta" ayuda={`Total $${fmt(r.total ?? 0)} · pagado $${fmt(r.deposito ?? 0)}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: saldo > 0 ? 'var(--warn-soft)' : 'var(--primary-soft)', fontWeight: 700 }}>
            <span>{saldo > 0 ? 'Saldo pendiente' : 'Renta pagada'}</span><span>${fmt(saldo)}</span>
          </div>
          <label className="field-l">Cobrar ahora</label>
          <div className="field-money"><span>$</span><input className="field-i" inputMode="decimal" value={cobro} onChange={e => setCobro(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" /></div>
          {Number(cobro) > 0 && <div style={{ display: 'flex', gap: 6 }}>{METODOS.map(m => <button key={m} className={`btn sm${metodoCobro === m ? ' primary' : ''}`} style={{ flex: 1 }} onClick={() => setMetodoCobro(m)}>{metodoLabel(m)}</button>)}</div>}
          {Number(cobro) < saldo && <div style={{ fontSize: 12.5, color: 'var(--warn-ink)' }}>Quedará un saldo de ${fmt(saldo - (Number(cobro) || 0))}.</div>}
        </Bloque>
        <Bloque titulo="Depósito en garantía" ayuda="Se devuelve al regresar el vehículo en buen estado (cláusula OCTAVA).">
          <Casilla ok={fianzaOk} onChange={setFianzaOk}>Recibí el depósito en garantía</Casilla>
          {fianzaOk && <>
            <div className="field-money"><span>$</span><input className="field-i" inputMode="numeric" value={fianza} onChange={e => setFianza(e.target.value.replace(/\D/g, ''))} /></div>
            <div style={{ display: 'flex', gap: 6 }}>{METODOS.map(m => <button key={m} className={`btn sm${metodoFianza === m ? ' primary' : ''}`} style={{ flex: 1 }} onClick={() => setMetodoFianza(m)}>{metodoLabel(m)}</button>)}</div>
          </>}
        </Bloque>
      </>}

      {paso === 3 && <>
        <Bloque titulo="Firma del cliente" ayuda="Al firmar acepta el contrato, el anexo y la cobertura. Si prefieres que firme en papel, déjalo en blanco.">
          <FirmaPad onChange={(_, c) => setFirma(c)} />
        </Bloque>
        <Bloque titulo="Resumen">
          <div style={{ fontSize: 13.5, display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--ink2)' }}>
            <span>Salida: {fmt(kmNum)} km · gasolina {gas}% · {fotos.length} foto{fotos.length === 1 ? '' : 's'}</span>
            <span>Cobro ahora: ${fmt(Number(cobro) || 0)}{Number(cobro) > 0 ? ` (${metodoLabel(metodoCobro)})` : ''}</span>
            <span>Garantía: {fianzaOk ? `$${fmt(Number(fianza) || 0)} (${metodoLabel(metodoFianza)})` : 'no recibida'}</span>
          </div>
        </Bloque>
        {errConfirm && <div style={{ color: 'var(--danger-ink)', fontSize: 13 }}>{errConfirm}</div>}
      </>}
    </FlujoPasos>
  )
}
