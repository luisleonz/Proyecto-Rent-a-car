import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, SlidersHorizontal, Gauge, Fuel, Settings2, User, X, Check, ImageDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/auth'
import { insertLog } from '../../lib/log'
import type { Vehiculo, VehiculoStatus } from '../../lib/database.types'
import VehiculoFoto, { TONES } from '../../components/VehiculoFoto'
import { insertarConExtras } from '../../lib/insertar'
import { sincronizarFlota } from '../../lib/operacion'
import { subirFotoVehiculo } from '../../lib/fotos'

const db = supabase as any

/* ─── Constants ─────────────────────────────────────────────── */

const TONE_LABELS: Record<string, string> = {
  blue: 'Azul', slate: 'Gris', rose: 'Rojo/Rosa', ink: 'Negro', sand: 'Arena/Café', white: 'Blanco/Plata',
}

const SEGMENTOS = ['Sedán', 'SUV', 'Hatchback', 'Camioneta', 'Pickup', 'Van', 'Coupé', 'Convertible']

const STATUS_LABEL: Record<string, string> = {
  disponible: 'Disponible', rentado: 'Rentado', taller: 'En taller', reservado: 'Reservado',
}
const STATUS_CHIP: Record<string, string> = {
  disponible: 'primary', rentado: '', taller: 'warn', reservado: '',
}
const STATUS_DOT: Record<string, string> = {
  disponible: '', rentado: '', taller: 'warn', reservado: 'neutral',
}

const FILTER_TABS = [
  { label: 'Todos',       key: 'todos' },
  { label: 'Disponibles', key: 'disponible' },
  { label: 'Rentados',    key: 'rentado' },
  { label: 'Reservados',  key: 'reservado' },
  { label: 'En taller',   key: 'taller' },
]

const fmt = (n: number) => n.toLocaleString('es-MX')

/* ─── Card photo ─────────────────────────────────────────────── */
function CarPhoto({ v }: { v: Vehiculo }) {
  return (
    <VehiculoFoto url={v.foto_url} tono={v.tono} height={150} className="fc-photo">
      <span className={`chip sm ${STATUS_CHIP[v.status] ?? ''}`} style={{ position: 'absolute', top: 12, left: 12, zIndex: 1 }}>
        <span className={`dot ${STATUS_DOT[v.status] ?? ''}`} />
        {STATUS_LABEL[v.status] ?? v.status}
      </span>
    </VehiculoFoto>
  )
}

/* ─── Fleet Card ────────────────────────────────────────────── */
function FleetCard({ v, onClick }: { v: Vehiculo; onClick: () => void }) {
  const isAvailable = v.status === 'disponible'
  return (
    <button className="card fleetcard" onClick={onClick}>
      <CarPhoto v={v} />
      <div className="fc-body">
        <div className="fc-row1">
          <div>
            <div className="fc-model">{v.modelo}</div>
            <div className="fc-meta">{v.segmento ?? 'Sedán'} · {v.anio} · {v.color}</div>
          </div>
          <span className="fc-plate">{v.placa}</span>
        </div>
        <div className="fc-specs">
          <span><Gauge size={13} />{fmt(v.km ?? 0)} km</span>
          {v.combustible != null && <span><Fuel size={13} />{v.combustible}%</span>}
          {v.transmision && <span><Settings2 size={13} />{v.transmision}</span>}
        </div>
        <div className="fc-foot">
          <div className="fc-who">
            <User size={13} style={{ color: 'var(--ink3)', flexShrink: 0 }} />
            {isAvailable ? (
              <span style={{ color: 'var(--ink3)', fontSize: 13 }}>Listo para rentar</span>
            ) : v.cliente_actual ? (
              <span>{v.cliente_actual}{v.info_cliente && <span className="fc-vence"> · {v.info_cliente}</span>}</span>
            ) : v.info_cliente ? (
              <span style={{ color: 'var(--ink3)', fontSize: 13 }}>{v.info_cliente}</span>
            ) : null}
          </div>
          {v.tarifa_diaria != null && (
            <div className="fc-rate">${fmt(Number(v.tarifa_diaria))}<small>/día</small></div>
          )}
        </div>
      </div>
    </button>
  )
}

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="card statcard">
      <div className="eyebrow">{label}</div>
      <div className="statval mono">{value}</div>
      <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>{sub}</div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card fleetcard" style={{ opacity: 0.5 }}>
      <div style={{ height: 130, background: 'var(--paper-alt)', borderRadius: 'var(--radius) var(--radius) 0 0' }} />
      <div className="fc-body" style={{ gap: 10 }}>
        <div style={{ height: 16, width: '60%', background: 'var(--paper-alt)', borderRadius: 6 }} />
        <div style={{ height: 12, width: '80%', background: 'var(--paper-alt)', borderRadius: 6 }} />
        <div style={{ height: 12, width: '40%', background: 'var(--paper-alt)', borderRadius: 6 }} />
      </div>
    </div>
  )
}

/* ─── Basic color list ───────────────────────────────────────── */
const BASIC_COLORS = [
  'Blanco', 'Negro', 'Plata', 'Gris', 'Rojo', 'Azul',
  'Azul Marino', 'Beige', 'Verde', 'Naranja', 'Amarillo', 'Café', 'Morado',
]
const COLOR_DOT: Record<string, string> = {
  'Blanco': '#F0F0F0', 'Negro': '#1C1C1C', 'Plata': '#C4C4D0', 'Gris': '#808090',
  'Rojo': '#C82000', 'Azul': '#1A5ECC', 'Azul Marino': '#1A2868', 'Beige': '#CEB490',
  'Verde': '#28742A', 'Naranja': '#D85800', 'Amarillo': '#CCA800', 'Café': '#6A4828',
  'Morado': '#683DA0',
}

/* ─── Combobox ───────────────────────────────────────────────── */
function Combobox({ label, value, onChange, suggestions, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void
  suggestions: string[]; placeholder: string; required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const filtered = suggestions
    .filter(s => s.toLowerCase() !== value.toLowerCase())
    .filter(s => !value || s.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 7)

  return (
    <div className="field">
      <label className="field-l">{label}{required ? ' *' : ''}</label>
      <input
        className="field-i"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
      />
      {open && filtered.length > 0 && (
        <div style={{
          background: 'var(--paper)', border: '1.5px solid var(--border)',
          borderRadius: 10, overflow: 'hidden', marginTop: 4,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}>
          {filtered.map(s => (
            <button key={s}
              onMouseDown={() => { onChange(s); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 14px', fontSize: 13.5, background: 'none',
                border: 'none', borderBottom: '1px solid var(--line)',
                cursor: 'pointer', color: 'var(--ink)',
              }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Agregar vehículo panel ─────────────────────────────────── */
interface AgregarPanelProps {
  open: boolean
  onClose: () => void
  onCreated: (placa: string) => void
  fleet: Vehiculo[]
}

function AgregarPanel({ open, onClose, onCreated, fleet }: AgregarPanelProps) {
  const { currentEmail } = useAuth()
  const [placa,       setPlaca]       = useState('')
  const [marca,       setMarca]       = useState('')
  const [modeloNom,   setModeloNom]   = useState('')
  const [anio,        setAnio]        = useState(String(new Date().getFullYear()))
  const [colorPick,   setColorPick]   = useState('')
  const [colorCustom, setColorCustom] = useState(false)
  const [colorText,   setColorText]   = useState('')
  const [tono,        setTono]        = useState('slate')
  const [segmento,    setSegmento]    = useState('Sedán')
  const [transmision, setTransmision] = useState('Automático')
  const [tarifa,      setTarifa]      = useState('')
  const [km,          setKm]          = useState('0')
  const [combustible, setCombustible] = useState('100')
  const [asientos,    setAsientos]    = useState('5')
  const [fianza,      setFianza]      = useState('2000')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  // Derived from fleet
  const existingBrands = [...new Set(fleet.map(v => v.modelo.split(' ')[0]).filter(Boolean))].sort()
  const existingModels = marca
    ? [...new Set(
        fleet
          .filter(v => v.modelo.toLowerCase().startsWith(marca.toLowerCase() + ' '))
          .map(v => v.modelo.trim().substring(marca.trim().length).trim())
      )].filter(Boolean).sort()
    : []

  const color  = colorCustom ? colorText : colorPick
  const modelo = `${marca.trim()} ${modeloNom.trim()}`.trim()

  function reset() {
    setPlaca(''); setMarca(''); setModeloNom(''); setAnio(String(new Date().getFullYear()))
    setColorPick(''); setColorCustom(false); setColorText(''); setTono('slate')
    setSegmento('Sedán'); setTransmision('Automático'); setTarifa('')
    setKm('0'); setCombustible('100'); setAsientos('5'); setFianza('2000'); setError('')
  }

  async function handleGuardar() {
    if (!placa.trim() || !marca.trim() || !modeloNom.trim()) {
      setError('Placa, marca y modelo son obligatorios'); return
    }
    setSaving(true); setError('')
    const { error: err } = await insertarConExtras('vehiculos', {
      placa:        placa.trim().toUpperCase(),
      modelo:       modelo,
      anio:         parseInt(anio) || null,
      color:        color.trim() || null,
      tono:         tono,
      segmento:     segmento,
      transmision:  transmision,
      tarifa_diaria: tarifa ? parseFloat(tarifa) : null,
      km:           parseInt(km) || 0,
      combustible:  parseInt(combustible) || 100,
      status:       'disponible' as VehiculoStatus,
    }, { asientos: parseInt(asientos) || null, fianza: Number(fianza) || 0 })
    setSaving(false)
    if (err) { setError(err.message); return }

    await insertLog({
      accion: 'agregar_vehiculo',
      entidad: 'vehiculos',
      descripcion: `Vehículo ${modelo} (${placa.trim().toUpperCase()}) agregado a la flota`,
      realizado_por: currentEmail,
      datos_nuevos: { placa: placa.trim().toUpperCase(), modelo, anio, color, segmento },
    })

    const nuevaPlaca = placa.trim().toUpperCase()
    reset()
    onCreated(nuevaPlaca)
    onClose()
  }

  const previewTone = TONES[tono] ?? TONES.slate

  return (
    <>
      {open && <div className="qpanel-overlay" onClick={onClose} />}
      <div className={`qpanel${open ? ' open' : ''}`}>
        <div className="qpanel-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Flota</div>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
              Agregar vehículo
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--ink3)', flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        <div className="qpanel-body" style={{ gap: 14 }}>
          {/* Preview */}
          <div style={{
            height: 64, borderRadius: 10, background: previewTone[1],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: previewTone[0], fontWeight: 600, transition: 'background 0.2s',
          }}>
            {modelo || 'Vista previa'} · {placa || 'PLACA'}
          </div>

          {/* Placa + Año */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label className="field-l">Placa *</label>
              <input className="field-i" placeholder="ABC-123" value={placa}
                onChange={e => setPlaca(e.target.value)} style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="field">
              <label className="field-l">Año</label>
              <input className="field-i" placeholder="2024" value={anio} inputMode="numeric"
                onChange={e => setAnio(e.target.value.replace(/\D/g, ''))} />
            </div>
          </div>

          {/* Marca combobox */}
          <Combobox
            label="Marca" value={marca} onChange={v => { setMarca(v); setModeloNom('') }}
            suggestions={existingBrands} placeholder="Nissan, Toyota, Kia…" required
          />

          {/* Modelo combobox */}
          <Combobox
            label="Modelo" value={modeloNom} onChange={setModeloNom}
            suggestions={existingModels}
            placeholder={marca ? `Modelo para ${marca}` : 'Selecciona primero la marca'}
            required
          />

          {/* Color */}
          <div className="field">
            <label className="field-l">Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: colorCustom ? 8 : 0 }}>
              {BASIC_COLORS.map(c => {
                const active = !colorCustom && colorPick === c
                return (
                  <button key={c} onClick={() => { setColorPick(c); setColorCustom(false) }}
                    style={{
                      padding: '5px 10px', borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                      border: '1.5px solid', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                      borderColor: active ? 'var(--primary)' : 'var(--line)',
                      background: active ? 'var(--primary-soft)' : 'transparent',
                      color: active ? 'var(--primary)' : 'var(--ink2)',
                    }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: COLOR_DOT[c] ?? '#888',
                      border: '1px solid rgba(0,0,0,0.15)', display: 'inline-block',
                    }} />
                    {c}
                  </button>
                )
              })}
              <button onClick={() => { setColorCustom(true); setColorPick('') }}
                style={{
                  padding: '5px 10px', borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                  border: '1.5px solid', cursor: 'pointer',
                  borderColor: colorCustom ? 'var(--primary)' : 'var(--line)',
                  background: colorCustom ? 'var(--primary-soft)' : 'transparent',
                  color: colorCustom ? 'var(--primary)' : 'var(--ink2)',
                }}>Otro</button>
            </div>
            {colorCustom && (
              <input className="field-i" value={colorText} onChange={e => setColorText(e.target.value)}
                placeholder="Escribe el color…" autoFocus />
            )}
          </div>

          {/* Tono SVG */}
          <div className="field">
            <label className="field-l">Tono del ícono</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(TONE_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => setTono(key)}
                  style={{
                    padding: '5px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: '1.5px solid', cursor: 'pointer',
                    borderColor: tono === key ? TONES[key][0] : 'var(--line)',
                    background: tono === key ? TONES[key][1] : 'transparent',
                    color: tono === key ? TONES[key][0] : 'var(--ink2)',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: TONES[key][0], display: 'inline-block', flexShrink: 0 }} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Segmento + Transmisión */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label className="field-l">Segmento</label>
              <select className="field-i" value={segmento} onChange={e => setSegmento(e.target.value)}>
                {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-l">Transmisión</label>
              <select className="field-i" value={transmision} onChange={e => setTransmision(e.target.value)}>
                <option>Automático</option>
                <option>Manual</option>
              </select>
            </div>
          </div>

          {/* Tarifa */}
          <div className="field">
            <label className="field-l">Tarifa diaria</label>
            <div className="field-money">
              <span>$</span>
              <input className="field-i" placeholder="0" value={tarifa} inputMode="decimal"
                onChange={e => setTarifa(e.target.value.replace(/[^0-9.]/g, ''))} />
              <span style={{ color: 'var(--ink3)', fontSize: 13, paddingRight: 2 }}>/día</span>
            </div>
          </div>

          {/* KM + Combustible */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label className="field-l">Kilometraje</label>
              <input className="field-i" placeholder="0" value={km} inputMode="numeric"
                onChange={e => setKm(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className="field">
              <label className="field-l">Combustible %</label>
              <input className="field-i" placeholder="100" value={combustible} inputMode="numeric"
                onChange={e => setCombustible(Math.min(100, parseInt(e.target.value.replace(/\D/g, '')) || 0).toString())} />
            </div>
          </div>

          {/* Asientos + Fianza */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label className="field-l">Asientos</label>
              <input className="field-i" value={asientos} inputMode="numeric" onChange={e => setAsientos(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className="field">
              <label className="field-l">Depósito en garantía</label>
              <div className="field-money">
                <span>$</span>
                <input className="field-i" value={fianza} inputMode="numeric" onChange={e => setFianza(e.target.value.replace(/\D/g, ''))} />
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Después de agregarlo podrás subir sus fotos y completar sus datos.</div>

          {error && (
            <div style={{ fontSize: 13, color: '#c0392b', padding: '8px 12px', borderRadius: 8, background: 'oklch(96% 0.03 20)' }}>
              {error}
            </div>
          )}
        </div>

        <div className="qpanel-foot">
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center', fontSize: 15 }}
            onClick={handleGuardar} disabled={saving}>
            {saving
              ? <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Guardando…</>
              : <><Check size={15} />Agregar vehículo</>}
          </button>
        </div>
      </div>
    </>
  )
}

/* ─── Main Screen ───────────────────────────────────────────── */
export default function VehiclesScreen() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [filter,       setFilter]       = useState('todos')
  const [segFilter,    setSegFilter]    = useState('todos')
  const [showFilters,  setShowFilters]  = useState(false)
  const [fleet,        setFleet]        = useState<Vehiculo[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [panelOpen,    setPanelOpen]    = useState(false)

  const [copiando,     setCopiando]     = useState<string | null>(null)

  async function fetchFleet() {
    setLoading(true)
    await sincronizarFlota()
    const { data, error } = await supabase.from('vehiculos').select('*').order('modelo')
    if (error) setError('No se pudo cargar la flota')
    else setFleet(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchFleet() }, [])

  // Unique segments from actual fleet data
  const segments = ['todos', ...Array.from(new Set(fleet.map(v => v.segmento).filter(Boolean) as string[])).sort()]

  const count = (status: string) => fleet.filter(v => v.status === status).length
  const available = count('disponible')
  const rented    = count('rentado')
  const reserved  = count('reservado')
  const workshop  = count('taller')
  const total     = fleet.length

  const propio = (import.meta.env.VITE_SUPABASE_URL as string ?? '').replace(/\/$/, '')
  const fotosExternas = fleet.filter(v => v.foto_url && !v.foto_url.startsWith(propio))

  async function copiarFotos() {
    let ok = 0, mal = 0
    for (const [i, v] of fotosExternas.entries()) {
      setCopiando(`Copiando ${i + 1} de ${fotosExternas.length}…`)
      try {
        const resp = await fetch(v.foto_url!)
        if (!resp.ok) throw new Error(String(resp.status))
        const url = await subirFotoVehiculo(v.id, await resp.blob())
        const fotos = [url, ...((v.fotos ?? []).filter(f => f !== v.foto_url))]
        const { error } = await db.from('vehiculos').update({ foto_url: url, fotos }).eq('id', v.id)
        if (error) throw error
        ok++
      } catch { mal++ }
    }
    setCopiando(null)
    setError(mal ? `Se copiaron ${ok} fotos; ${mal} no se pudieron copiar (puede que ya no existan o falte la actualización de la base de datos).` : null)
    fetchFleet()
  }

  const filtered = fleet.filter(v =>
    (filter === 'todos' || v.status === filter) &&
    (segFilter === 'todos' || v.segmento === segFilter)
  )

  return (
    <div className="screen">
      <AgregarPanel open={panelOpen} onClose={() => setPanelOpen(false)} fleet={fleet}
        onCreated={p => { fetchFleet(); navigate(`/app/vehicles/${p}`) }} />

      {/* Page head */}
      <div className="pagehead">
        <div>
          <div className="eyebrow">Flota</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>Vehículos</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4 }}>
            {loading ? 'Cargando…' : `${total} unidades · ${available} disponible${available !== 1 ? 's' : ''} ahora`}
          </p>
        </div>
        <div className="pagehead-actions">
          <button
            className={`btn sm${showFilters ? ' primary' : ''}`}
            onClick={() => { setShowFilters(v => !v); setSegFilter('todos') }}
          >
            <SlidersHorizontal size={14} />Filtros{segFilter !== 'todos' ? ' ·' + segFilter : ''}
          </button>
          {isAdmin && (
            <button className="btn sm primary" onClick={() => setPanelOpen(true)}>
              <Plus size={14} />Agregar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', background: 'var(--danger-soft)', border: '1px solid var(--danger-line)', borderRadius: 'var(--radius-sm)', color: 'var(--danger-ink)', fontSize: 14, marginBottom: 'var(--gap)' }}>
          {error}
        </div>
      )}

      {/* Photos still hosted by the previous platform: copy before that account closes */}
      {isAdmin && fotosExternas.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 16px', marginBottom: 'var(--gap)',
          background: 'var(--warn-soft)', border: '1px solid var(--warn-line)', borderRadius: 'var(--radius-sm)', fontSize: 13.5, color: 'var(--warn-ink)' }}>
          <ImageDown size={18} />
          <span style={{ flex: 1, minWidth: 220 }}>
            {fotosExternas.length} {fotosExternas.length === 1 ? 'foto sigue' : 'fotos siguen'} guardadas en la plataforma anterior y se perderán al cancelarla.
          </span>
          <button className="btn sm" onClick={copiarFotos} disabled={!!copiando}>{copiando ?? 'Copiar a esta app'}</button>
        </div>
      )}

      {/* Stat grid */}
      <div className="statgrid">
        <StatCard label="Disponibles" value={available} sub="listos para rentar" />
        <StatCard label="Rentados"    value={rented}    sub="en la calle" />
        <StatCard label="Reservados"  value={reserved}  sub="próximas salidas" />
        <StatCard label="En taller"   value={workshop}  sub="mantenimiento" />
      </div>

      {/* Status filter bar */}
      <div className="filterbar">
        {FILTER_TABS.map(tab => {
          const c = tab.key === 'todos' ? total : count(tab.key)
          return (
            <button key={tab.key} className={`fbtn${filter === tab.key ? ' on' : ''}`}
              onClick={() => setFilter(tab.key)}>
              {tab.label} <span className="fbtn-n">{c}</span>
            </button>
          )
        })}
      </div>

      {/* Segment filter row (expandable) */}
      {showFilters && segments.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 'var(--gap)' }}>
          <span style={{ fontSize: 12, color: 'var(--ink3)', alignSelf: 'center', fontWeight: 600 }}>Segmento:</span>
          {segments.map(seg => (
            <button key={seg}
              onClick={() => setSegFilter(seg)}
              style={{
                padding: '5px 13px', borderRadius: 20, fontSize: 12.5, fontWeight: segFilter === seg ? 600 : 400,
                border: '1.5px solid', cursor: 'pointer',
                borderColor: segFilter === seg ? 'var(--primary)' : 'var(--line)',
                background:  segFilter === seg ? 'var(--primary-soft)' : 'transparent',
                color:       segFilter === seg ? 'var(--primary)' : 'var(--ink2)',
              }}>
              {seg === 'todos' ? 'Todos' : seg}
              <span style={{ marginLeft: 5, opacity: 0.6, fontSize: 11 }}>
                {seg === 'todos' ? total : fleet.filter(v => v.segmento === seg).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Fleet grid */}
      {loading ? (
        <div className="fleetgrid">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--ink4)', padding: '48px 0', fontSize: 14 }}>
          Sin vehículos en esta categoría
        </p>
      ) : (
        <div className="fleetgrid">
          {filtered.map(v => (
            <FleetCard key={v.id} v={v} onClick={() => navigate(`/app/vehicles/${v.placa}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
