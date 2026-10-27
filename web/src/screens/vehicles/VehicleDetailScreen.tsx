import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Key, Check, Wrench, X, AlertTriangle, Camera, Star, Trash2, Pencil, ShieldCheck, Gauge, CalendarClock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { insertLog } from '../../lib/log'
import { subirFotoVehiculo, borrarFotoVehiculo } from '../../lib/fotos'
import { mensajeError } from '../../lib/operacion'
import { hoyISO, diffDias, addDias } from '../../lib/fechas'
import VehiculoFoto from '../../components/VehiculoFoto'
import type { Vehiculo } from '../../lib/database.types'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

const STATUS_LABEL: Record<string, string> = { disponible: 'Disponible', rentado: 'Rentado', taller: 'En taller', reservado: 'Reservado' }
const STATUS_CHIP: Record<string, string> = { disponible: 'primary', rentado: 'primary', taller: 'warn', reservado: '' }
const STATUS_DOT: Record<string, string> = { disponible: 'primary', rentado: 'primary', taller: 'warn', reservado: 'neutral' }
const RES_STATUS_LABEL: Record<string, string> = { pendiente: 'Pendiente', confirmada: 'Confirmada', entregada: 'Entregada', devuelta: 'Devuelta', cancelada: 'Cancelada' }
const RES_STATUS_DOT: Record<string, string> = { pendiente: 'warn', confirmada: '', entregada: 'primary', devuelta: 'neutral', cancelada: 'neutral' }
const SEGMENTOS = ['Sedán', 'SUV', 'Hatchback', 'Camioneta', 'Pickup', 'Van', 'Coupé', 'Convertible']

const fmt = (n: number) => Math.round(n).toLocaleString('es-MX')
const fmtDate = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

type ReservaHist = { id: string; folio: number | null; fecha_entrega: string; fecha_devolucion: string; status: string; total: number | null; clientes: { nombre: string } | null }

/* ── Expiry badge ── */
function Vence({ label, fecha }: { label: string; fecha?: string | null }) {
  const hoy = hoyISO()
  const dias = fecha ? diffDias(hoy, fecha) : null
  const tono = dias == null ? 'var(--ink4)' : dias < 0 ? 'var(--danger-ink)' : dias <= 30 ? 'var(--warn-ink)' : 'var(--ink2)'
  return (
    <div className="qpanel-row">
      <span className="lbl">{label}</span>
      <span className="val" style={{ color: tono }}>
        {fecha ? `${fmtDate(fecha)}${dias! < 0 ? ' · vencido' : dias! <= 30 ? ` · en ${dias} días` : ''}` : 'Sin registrar'}
      </span>
    </div>
  )
}

/* ── Edit panel (admin) ── */
type Editables = {
  modelo: string; placa: string; anio: string; color: string; segmento: string; transmision: string; asientos: string; vin: string
  tarifa_diaria: string; fianza: string; km: string; combustible: string
  seguro_vence: string; tarjeta_vence: string; verificacion_vence: string; servicio_cada_km: string; ultimo_servicio_km: string; notas: string
}
const NUM = ['anio', 'asientos', 'tarifa_diaria', 'fianza', 'km', 'combustible', 'servicio_cada_km', 'ultimo_servicio_km']

function EditarPanel({ v, open, onClose, onSaved }: { v: Vehiculo; open: boolean; onClose: () => void; onSaved: (v: Vehiculo) => void }) {
  const { currentEmail } = useAuth()
  const inicial = (): Editables => ({
    modelo: v.modelo, placa: v.placa, anio: String(v.anio ?? ''), color: v.color ?? '', segmento: v.segmento ?? 'Sedán',
    transmision: v.transmision ?? 'Automático', asientos: String(v.asientos ?? ''), vin: v.vin ?? '',
    tarifa_diaria: String(v.tarifa_diaria ?? ''), fianza: String(v.fianza ?? ''), km: String(v.km ?? 0), combustible: String(v.combustible ?? 100),
    seguro_vence: v.seguro_vence ?? '', tarjeta_vence: v.tarjeta_vence ?? '', verificacion_vence: v.verificacion_vence ?? '',
    servicio_cada_km: String(v.servicio_cada_km ?? ''), ultimo_servicio_km: String(v.ultimo_servicio_km ?? ''), notas: v.notas ?? '',
  })
  const [f, setF] = useState<Editables>(inicial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { if (open) { setF(inicial()); setError('') } }, [open, v.id])

  const set = (k: keyof Editables) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF(x => ({ ...x, [k]: NUM.includes(k) ? e.target.value.replace(/[^0-9.]/g, '') : e.target.value }))

  async function guardar() {
    if (!f.modelo.trim() || !f.placa.trim()) { setError('Modelo y placa son obligatorios'); return }
    setSaving(true); setError('')
    const cambios: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(f)) {
      const t = val.trim()
      cambios[k] = NUM.includes(k) ? (t === '' ? null : Number(t)) : (t === '' ? null : t)
    }
    cambios.placa = String(cambios.placa).toUpperCase()
    cambios.km = cambios.km ?? 0
    cambios.combustible = Math.min(100, Number(cambios.combustible ?? 100))
    const { data, error: err } = await db.from('vehiculos').update(cambios).eq('id', v.id).select().single()
    setSaving(false)
    if (err) { setError(mensajeError(err)); return }
    await insertLog({ accion: 'editar_vehiculo', entidad: 'vehiculos', entidad_id: v.id, descripcion: `${f.modelo} (${f.placa}) editado`, realizado_por: currentEmail })
    onSaved(data); onClose()
  }

  const campo = (k: keyof Editables, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="field" style={{ flex: 1, minWidth: 0 }}>
      <label className="field-l">{label}</label>
      <input className="field-i" value={f[k]} onChange={set(k)} {...props} />
    </div>
  )

  return (
    <>
      {open && <div className="qpanel-overlay" onClick={onClose} />}
      <div className={`qpanel${open ? ' open' : ''}`}>
        <div className="qpanel-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Flota</div>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-display)' }}>Editar vehículo</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--ink3)' }}><X size={20} /></button>
        </div>
        <div className="qpanel-body" style={{ gap: 12 }}>
          <div className="qpanel-section-title">Datos</div>
          {campo('modelo', 'Marca y modelo *')}
          <div style={{ display: 'flex', gap: 10 }}>{campo('placa', 'Placa *', { style: { textTransform: 'uppercase' } })}{campo('anio', 'Año', { inputMode: 'numeric' })}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {campo('color', 'Color')}
            <div className="field" style={{ flex: 1 }}>
              <label className="field-l">Segmento</label>
              <select className="field-i" value={f.segmento} onChange={set('segmento')}>{SEGMENTOS.map(s => <option key={s}>{s}</option>)}</select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label className="field-l">Transmisión</label>
              <select className="field-i" value={f.transmision} onChange={set('transmision')}><option>Automático</option><option>Manual</option></select>
            </div>
            {campo('asientos', 'Asientos', { inputMode: 'numeric' })}
          </div>
          {campo('vin', 'Número de serie (VIN)', { style: { textTransform: 'uppercase' } })}

          <div className="qpanel-section-title" style={{ marginTop: 6 }}>Precio</div>
          <div style={{ display: 'flex', gap: 10 }}>{campo('tarifa_diaria', 'Tarifa diaria $', { inputMode: 'decimal' })}{campo('fianza', 'Depósito en garantía $', { inputMode: 'numeric' })}</div>

          <div className="qpanel-section-title" style={{ marginTop: 6 }}>Estado actual</div>
          <div style={{ display: 'flex', gap: 10 }}>{campo('km', 'Kilometraje', { inputMode: 'numeric' })}{campo('combustible', 'Gasolina %', { inputMode: 'numeric' })}</div>

          <div className="qpanel-section-title" style={{ marginTop: 6 }}>Mantenimiento y documentos</div>
          <div style={{ display: 'flex', gap: 10 }}>{campo('servicio_cada_km', 'Servicio cada (km)', { inputMode: 'numeric', placeholder: '10000' })}{campo('ultimo_servicio_km', 'Último servicio (km)', { inputMode: 'numeric' })}</div>
          <div style={{ display: 'flex', gap: 10 }}>{campo('seguro_vence', 'Seguro vence', { type: 'date' })}{campo('tarjeta_vence', 'Tarjeta de circulación', { type: 'date' })}</div>
          {campo('verificacion_vence', 'Verificación vence', { type: 'date' })}
          <div className="field">
            <label className="field-l">Notas</label>
            <textarea className="field-i" rows={3} value={f.notas} onChange={set('notas')} />
          </div>
          {error && <div style={{ fontSize: 13, color: 'var(--danger-ink)', background: 'var(--danger-soft)', borderRadius: 8, padding: '8px 12px' }}>{error}</div>}
        </div>
        <div className="qpanel-foot">
          <button className="btn primary" style={{ width: '100%' }} onClick={guardar} disabled={saving}>
            <Check size={15} />{saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </>
  )
}

export default function VehicleDetailScreen() {
  const { plate } = useParams<{ plate: string }>()
  const navigate = useNavigate()
  const { currentEmail, isAdmin } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [v, setV] = useState<Vehiculo | null>(null)
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState(0)
  const [history, setHistory] = useState<ReservaHist[]>([])
  const [activa, setActiva] = useState<{ id: string; status: string } | null>(null)
  const [working, setWorking] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const [subiendo, setSubiendo] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [showTaller, setShowTaller] = useState(false)
  const [tallerNota, setTallerNota] = useState('')

  async function cargar() {
    if (!plate) return
    const { data, error } = await db.from('vehiculos').select('*').eq('placa', plate).single()
    if (error || !data) { setLoading(false); return }
    setV(data); setLoading(false)
    const { data: hist } = await db.from('reservas')
      .select('id, folio, fecha_entrega, fecha_devolucion, status, total, clientes(nombre)')
      .eq('vehiculo_id', data.id).order('fecha_entrega', { ascending: false })
    setHistory(hist ?? [])
    const act = (hist ?? []).filter((r: ReservaHist) => r.status === 'entregada' || r.status === 'confirmada' || r.status === 'pendiente')
      .sort((a: ReservaHist, b: ReservaHist) => (a.status === 'entregada' ? -1 : b.status === 'entregada' ? 1 : a.fecha_entrega.localeCompare(b.fecha_entrega)))[0]
    setActiva(act ? { id: act.id, status: act.status } : null)
  }
  useEffect(() => { cargar() }, [plate])

  const fotos = v ? Array.from(new Set([v.foto_url, ...(v.fotos ?? [])].filter(Boolean) as string[])) : []

  async function guardarFotos(nuevas: string[], principal?: string | null) {
    const { error } = await db.from('vehiculos').update({ fotos: nuevas, foto_url: principal ?? nuevas[0] ?? null }).eq('id', v!.id)
    if (error) { setMsg({ ok: false, t: mensajeError(error) }); return false }
    setV(x => x ? { ...x, fotos: nuevas, foto_url: principal ?? nuevas[0] ?? null } : x)
    return true
  }

  async function subir(files: FileList | null) {
    if (!v || !files?.length) return
    const nuevas: string[] = []
    try {
      for (const [i, file] of Array.from(files).entries()) {
        setSubiendo(`Subiendo ${i + 1} de ${files.length}…`)
        nuevas.push(await subirFotoVehiculo(v.id, file))
      }
      const todas = [...fotos, ...nuevas]
      if (await guardarFotos(todas, v.foto_url ?? todas[0])) setMsg({ ok: true, t: `${nuevas.length} foto${nuevas.length > 1 ? 's' : ''} agregada${nuevas.length > 1 ? 's' : ''}.` })
    } catch (e) {
      setMsg({ ok: false, t: mensajeError(e as { message: string }) })
    }
    setSubiendo(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function hacerPrincipal(url: string) {
    if (await guardarFotos([url, ...fotos.filter(f => f !== url)], url)) { setSel(0); setMsg({ ok: true, t: 'Foto principal actualizada.' }) }
  }

  async function borrar(url: string) {
    if (!confirm('¿Borrar esta foto?')) return
    const resto = fotos.filter(f => f !== url)
    if (await guardarFotos(resto, v!.foto_url === url ? resto[0] ?? null : v!.foto_url)) {
      await borrarFotoVehiculo(url)
      setSel(0); setMsg({ ok: true, t: 'Foto borrada.' })
    }
  }

  async function marcarListo() {
    if (!v) return
    setWorking(true)
    await db.from('vehiculos').update({ status: 'disponible', cliente_actual: null, info_cliente: null }).eq('id', v.id)
    await db.rpc('sincronizar_vehiculo', { vid: v.id }).then(() => null, () => null)
    await insertLog({ accion: 'vehiculo_listo', entidad: 'vehiculos', entidad_id: v.id, descripcion: `${v.modelo} (${v.placa}) salió del taller`, realizado_por: currentEmail })
    setMsg({ ok: true, t: 'Vehículo fuera del taller.' }); setWorking(false); cargar()
  }

  async function enviarTaller() {
    if (!v) return
    setWorking(true)
    const nota = tallerNota.trim() || null
    await db.from('vehiculos').update({ status: 'taller', info_cliente: nota }).eq('id', v.id)
    await insertLog({ accion: 'vehiculo_taller', entidad: 'vehiculos', entidad_id: v.id, descripcion: `${v.modelo} (${v.placa}) enviado a taller${nota ? ` — ${nota}` : ''}`, realizado_por: currentEmail })
    setV(x => x ? { ...x, status: 'taller', info_cliente: nota } : x)
    setShowTaller(false); setTallerNota(''); setMsg({ ok: true, t: 'Vehículo enviado a taller.' }); setWorking(false)
  }

  async function registrarServicio() {
    if (!v) return
    const { error } = await db.from('vehiculos').update({ ultimo_servicio_km: v.km ?? 0 }).eq('id', v.id)
    if (error) { setMsg({ ok: false, t: mensajeError(error) }); return }
    await insertLog({ accion: 'servicio_vehiculo', entidad: 'vehiculos', entidad_id: v.id, descripcion: `Servicio registrado a ${v.modelo} (${v.placa}) a los ${fmt(v.km ?? 0)} km`, realizado_por: currentEmail })
    setV(x => x ? { ...x, ultimo_servicio_km: x.km ?? 0 } : x); setMsg({ ok: true, t: 'Servicio registrado.' })
  }

  if (loading) return (
    <div className="screen detail" style={{ opacity: 0.5 }}>
      <div className="detail-grid">
        <div style={{ height: 400, background: 'var(--paper-alt)', borderRadius: 'var(--radius)' }} />
        <div style={{ height: 400, background: 'var(--paper-alt)', borderRadius: 'var(--radius)' }} />
      </div>
    </div>
  )
  if (!v) return (
    <div className="screen">
      <button className="backlink" onClick={() => navigate('/app/vehicles')}><ChevronLeft size={16} />Volver a flota</button>
      <p style={{ color: 'var(--ink3)', marginTop: 24 }}>Vehículo no encontrado.</p>
    </div>
  )

  // Figures
  const hoy = hoyISO()
  const validas = history.filter(r => r.status !== 'cancelada')
  const ingresos = validas.reduce((s, r) => s + (r.total ?? 0), 0)
  const desde90 = addDias(hoy, -90)
  const dias90 = validas.reduce((s, r) => {
    const a = r.fecha_entrega > desde90 ? r.fecha_entrega : desde90
    const b = r.fecha_devolucion < hoy ? r.fecha_devolucion : hoy
    return s + Math.max(0, diffDias(a, b))
  }, 0)
  const proxServicio = v.servicio_cada_km ? (v.ultimo_servicio_km ?? 0) + v.servicio_cada_km : null
  const faltaKm = proxServicio != null ? proxServicio - (v.km ?? 0) : null
  const fuel = v.combustible ?? 100
  const actual = fotos[sel] ?? fotos[0]

  return (
    <div className="screen detail">
      <EditarPanel v={v} open={editOpen} onClose={() => setEditOpen(false)}
        onSaved={nv => { setV(nv); setMsg({ ok: true, t: 'Cambios guardados.' }); if (nv.placa !== plate) navigate(`/app/vehicles/${nv.placa}`, { replace: true }) }} />
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => subir(e.target.files)} />

      <button className="backlink" onClick={() => navigate('/app/vehicles')}><ChevronLeft size={16} />Volver a flota</button>

      <div className="detail-grid">
        <div className="detail-left">
          <div className="card" style={{ overflow: 'hidden' }}>
            <VehiculoFoto url={actual} tono={v.tono} height={280}>
              {actual && (
                <div style={{ position: 'absolute', right: 10, bottom: 10, display: 'flex', gap: 6 }}>
                  {actual !== v.foto_url && <button className="btn sm" onClick={() => hacerPrincipal(actual)}><Star size={13} />Principal</button>}
                  {isAdmin && <button className="btn sm" onClick={() => borrar(actual)} aria-label="Borrar foto"><Trash2 size={13} /></button>}
                </div>
              )}
            </VehiculoFoto>
            <div className="gallery-strip" style={{ overflowX: 'auto' }}>
              {fotos.map((f, i) => (
                <button key={f} className={'thumb' + (f === actual ? ' on' : '')} onClick={() => setSel(i)}
                  style={{ flex: '0 0 72px', padding: 0, position: 'relative' }}>
                  <img src={f} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {f === v.foto_url && <Star size={11} fill="#fff" color="#fff" style={{ position: 'absolute', top: 4, left: 4 }} />}
                </button>
              ))}
              <button className="thumb" style={{ flex: '0 0 72px', flexDirection: 'column', gap: 2, fontSize: 10.5, fontWeight: 600 }}
                onClick={() => fileRef.current?.click()} disabled={!!subiendo}>
                <Camera size={18} />{subiendo ? '…' : 'Agregar'}
              </button>
            </div>
            {subiendo && <div style={{ fontSize: 12.5, color: 'var(--ink3)', padding: '0 12px 12px' }}>{subiendo}</div>}
          </div>

          <div className="card detail-id">
            <div className="detail-idhead">
              <div>
                <div className="eyebrow">{v.segmento ?? 'Sedán'} · {v.anio}</div>
                <h1 className="h-display detail-title">{v.modelo}</h1>
              </div>
              <div className="detail-plate mono">{v.placa}</div>
            </div>
            <div className="detail-chips">
              <span className={'chip ' + (STATUS_CHIP[v.status] || '')}><span className={'dot ' + (STATUS_DOT[v.status] || 'neutral')} />{STATUS_LABEL[v.status] ?? v.status}</span>
              {v.color && <span className="chip">{v.color}</span>}
              {v.transmision && <span className="chip">{v.transmision}</span>}
              {isAdmin && <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => setEditOpen(true)}><Pencil size={13} />Editar</button>}
            </div>
            {v.notas && <p style={{ fontSize: 13, color: 'var(--ink2)', whiteSpace: 'pre-line', margin: '12px 0 0' }}>{v.notas}</p>}
          </div>

          <div className="card" style={{ padding: 'var(--pad)' }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Resultados</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
              {[[`$${fmt(ingresos)}`, 'Ingresos totales'], [String(validas.length), 'Rentas'], [`${Math.round((dias90 / 90) * 100)}%`, 'Utilización 90 días']].map(([n, l]) => (
                <div key={l}><div style={{ fontSize: 20, fontWeight: 700 }}>{n}</div><div style={{ fontSize: 11.5, color: 'var(--ink3)' }}>{l}</div></div>
              ))}
            </div>
          </div>
        </div>

        <div className="detail-right">
          <div className="card detail-actions">
            <div className="detail-actions-head">
              <div>
                <div className="eyebrow">Estado actual</div>
                {v.status === 'rentado' && <div className="detail-status">Rentado a <strong>{v.cliente_actual}</strong>{v.info_cliente ? ` · ${v.info_cliente}` : ''}</div>}
                {v.status === 'taller' && <div className="detail-status">En taller{v.info_cliente ? ` — ${v.info_cliente}` : ''}</div>}
                {v.status === 'reservado' && <div className="detail-status">Reservado{v.cliente_actual ? ` para ${v.cliente_actual}` : ''}{v.info_cliente ? ` · ${v.info_cliente}` : ''}</div>}
                {v.status === 'disponible' && <div className="detail-status">Disponible para rentar</div>}
              </div>
              {v.tarifa_diaria != null && <div className="detail-rate"><span className="h-display">${fmt(Number(v.tarifa_diaria))}</span><small>/día</small></div>}
            </div>

            {msg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                background: msg.ok ? 'var(--primary-soft)' : 'var(--danger-soft)', color: msg.ok ? 'var(--primary-dark)' : 'var(--danger-ink)',
                border: `1px solid ${msg.ok ? 'var(--primary-line)' : 'var(--danger-line)'}` }}>
                {msg.ok ? <Check size={14} /> : <AlertTriangle size={14} />}{msg.t}
              </div>
            )}

            {showTaller && (
              <div style={{ background: 'var(--paper-alt)', borderRadius: 10, padding: '12px 14px', border: '1.5px solid var(--warn-line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="field-l">Motivo del taller</label>
                  <input className="field-i" value={tallerNota} onChange={e => setTallerNota(e.target.value)} placeholder="Ej. Cambio de aceite, revisión general…" autoFocus />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ flex: 1 }} onClick={() => { setShowTaller(false); setTallerNota('') }}>Cancelar</button>
                  <button className="btn" style={{ flex: 2, background: 'var(--warn-soft)', borderColor: 'var(--warn-line)', color: 'var(--warn-ink)' }} onClick={enviarTaller} disabled={working}>
                    <Wrench size={14} />Confirmar envío
                  </button>
                </div>
              </div>
            )}

            <div className="detail-btns">
              {activa?.status === 'entregada' && (
                <button className="btn primary" onClick={() => navigate(`/app/devolucion/${activa.id}`)}><Check size={15} />Registrar devolución</button>
              )}
              {activa && activa.status !== 'entregada' && v.status !== 'taller' && (
                <button className="btn primary" onClick={() => navigate(`/app/entrega/${activa.id}`)}><Key size={15} />Entregar</button>
              )}
              {v.status !== 'taller' && (
                <button className={activa ? 'btn' : 'btn primary'} onClick={() => navigate(`/app/reservations?new=1&vehiculoId=${v.id}`)}><Key size={15} />Nueva reserva</button>
              )}
              {v.status === 'taller' && <button className="btn primary" onClick={marcarListo} disabled={working}><Check size={15} />Salió del taller</button>}
              {v.status !== 'taller' && !showTaller && <button className="btn" onClick={() => setShowTaller(true)} disabled={working}><Wrench size={15} />Enviar a taller</button>}
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--pad)' }}>
            <div className="eyebrow" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={13} />Mantenimiento y documentos</div>
            <Vence label="Seguro" fecha={v.seguro_vence} />
            <Vence label="Tarjeta de circulación" fecha={v.tarjeta_vence} />
            <Vence label="Verificación" fecha={v.verificacion_vence} />
            <div className="qpanel-row">
              <span className="lbl" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Gauge size={13} />Próximo servicio</span>
              <span className="val" style={{ color: faltaKm == null ? 'var(--ink4)' : faltaKm <= 0 ? 'var(--danger-ink)' : faltaKm <= 1000 ? 'var(--warn-ink)' : 'var(--ink2)' }}>
                {faltaKm == null ? 'Sin configurar' : faltaKm <= 0 ? `Vencido por ${fmt(-faltaKm)} km` : `a los ${fmt(proxServicio!)} km · faltan ${fmt(faltaKm)}`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {v.servicio_cada_km != null && <button className="btn sm" onClick={registrarServicio}><CalendarClock size={13} />Registrar servicio hoy</button>}
              {isAdmin && (v.servicio_cada_km == null || !v.seguro_vence) && <button className="btn sm" onClick={() => setEditOpen(true)}><Pencil size={13} />Completar datos</button>}
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--pad)' }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Especificaciones</div>
            {[
              ['Kilometraje', `${fmt(v.km ?? 0)} km`], ['Gasolina', `${fuel}%`], ['Transmisión', v.transmision ?? '—'],
              ['Asientos', v.asientos ? String(v.asientos) : '—'], ['Segmento', v.segmento ?? '—'], ['VIN', v.vin ?? '—'],
              ['Depósito en garantía', v.fianza ? `$${fmt(v.fianza)}` : '—'],
            ].map(([l, val]) => (
              <div className="qpanel-row" key={l}><span className="lbl">{l}</span><span className="val" style={l === 'VIN' ? { fontFamily: 'var(--font-mono)', fontSize: 12.5 } : undefined}>{val}</span></div>
            ))}
          </div>

          <div className="card detail-history">
            <div className="eyebrow" style={{ marginBottom: 6 }}>Historial de rentas · {history.length}</div>
            {history.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--ink3)', padding: '8px 0' }}>Sin rentas registradas.</p>
            ) : (
              <div className="timeline" style={{ maxHeight: 420, overflowY: 'auto' }}>
                {history.map(r => (
                  <button key={r.id} className="tl-item" onClick={() => navigate(`/app/reservations?res=${r.id}`)}
                    style={{ background: 'none', border: 0, width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer', padding: 0 }}>
                    <span className={`tl-dot dot ${RES_STATUS_DOT[r.status] ?? 'neutral'}`} />
                    <div className="tl-body">
                      <div className="tl-row1">
                        <strong>{r.folio != null ? `#${r.folio} · ` : ''}{RES_STATUS_LABEL[r.status] ?? r.status}</strong>
                        <span className="tl-date">{r.total != null ? `$${fmt(r.total)}` : ''}</span>
                      </div>
                      <div className="tl-note">{r.clientes?.nombre ?? 'Cliente'} · {fmtDate(r.fecha_entrega)} → {fmtDate(r.fecha_devolucion)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
