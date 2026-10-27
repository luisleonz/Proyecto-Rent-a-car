import { useEffect, useState } from 'react'
import { MessageCircle, Users, Settings2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { EMPRESA } from '../../lib/empresa'
import { whatsappUrl } from '../../lib/operacion'
import VehiculoFoto from '../../components/VehiculoFoto'

const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any
type Auto = { id: string; modelo: string; anio: number | null; segmento: string | null; transmision: string | null; asientos: number | null
  tarifa_diaria: number | null; foto_url: string | null; disponible_hoy: boolean }

const fmt = (n: number) => new Intl.NumberFormat('es-MX').format(n)

/** Public page (no login): fleet showcase with WhatsApp booking. */
export default function DisponiblesScreen() {
  const [autos, setAutos] = useState<Auto[]>([])
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'error'>('cargando')

  useEffect(() => {
    document.title = `${EMPRESA.nombreComercial} · Renta de autos en ${EMPRESA.ciudadFirma}`
    db.rpc('vehiculos_publicos').then(({ data, error }: { data: Auto[] | null; error: unknown }) => {
      if (error) { setEstado('error'); return }
      setAutos(data ?? []); setEstado('ok')
    })
  }, [])

  const mensaje = (a?: Auto) => a
    ? `Hola, me interesa rentar el ${a.modelo}${a.anio ? ` ${a.anio}` : ''}. ¿Está disponible para las fechas que necesito?`
    : 'Hola, quiero información para rentar un auto.'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--paper)' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid var(--card-line)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <img src="/docs/logo-lucianos.png" alt={EMPRESA.nombreComercial} style={{ height: 52 }} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Renta de autos y vans</div>
            <div style={{ fontSize: 13, color: 'var(--ink3)' }}>{EMPRESA.ciudadFirma} · Seguro incluido · Atención por WhatsApp</div>
          </div>
          <a className="btn primary" href={whatsappUrl(EMPRESA.whatsapp, mensaje())} target="_blank" rel="noreferrer"><MessageCircle size={16} />WhatsApp</a>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 60px' }}>
        <h1 className="h-display" style={{ fontSize: 'clamp(28px, 5vw, 40px)', margin: '0 0 6px' }}>Nuestra flota</h1>
        <p style={{ color: 'var(--ink2)', margin: '0 0 22px' }}>Elige tu auto y escríbenos por WhatsApp para apartarlo. Precios por día, IVA no incluido.</p>

        {estado === 'cargando' && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>}
        {estado === 'error' && <p style={{ color: 'var(--ink3)' }}>No pudimos cargar los autos en este momento. Escríbenos por WhatsApp.</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {autos.map(a => (
            <article key={a.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <VehiculoFoto url={a.foto_url} height={180}>
                <span className={`chip sm ${a.disponible_hoy ? 'primary' : ''}`} style={{ position: 'absolute', top: 10, left: 10 }}>
                  {a.disponible_hoy ? 'Disponible hoy' : 'Consultar fechas'}
                </span>
              </VehiculoFoto>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{a.modelo}{a.anio ? <span style={{ color: 'var(--ink3)', fontWeight: 500 }}> · {a.anio}</span> : null}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--ink2)' }}>
                  {a.asientos && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Users size={14} />{a.asientos} pasajeros</span>}
                  {a.transmision && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Settings2 size={14} />{a.transmision}</span>}
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
                  {a.tarifa_diaria != null && <div><span style={{ fontSize: 22, fontWeight: 800 }}>${fmt(a.tarifa_diaria)}</span><span style={{ fontSize: 12, color: 'var(--ink3)' }}> /día</span></div>}
                  <a className="btn sm primary" href={whatsappUrl(EMPRESA.whatsapp, mensaje(a))} target="_blank" rel="noreferrer"><MessageCircle size={14} />Reservar</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--card-line)', padding: '18px 16px', textAlign: 'center', fontSize: 12.5, color: 'var(--ink3)' }}>
        {EMPRESA.nombreComercial} · Tel. {EMPRESA.telefono} · WhatsApp {EMPRESA.whatsapp} · {EMPRESA.email}
      </footer>
    </div>
  )
}
