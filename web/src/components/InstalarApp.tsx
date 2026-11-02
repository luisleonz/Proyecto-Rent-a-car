import { useState } from 'react'
import { Download, Share, PlusSquare, MoreVertical, X, Smartphone, Check } from 'lucide-react'
import { useInstalacion } from '../lib/instalar'

const CLAVE_OCULTO = 'lucianos-ocultar-instalar'
const leerOculto = () => { try { return localStorage.getItem(CLAVE_OCULTO) === '1' } catch { return false } }

/** Explains or triggers installing the app on the phone/computer. */
export default function InstalarApp({ aviso }: { aviso?: boolean }) {
  const { estado, instalar } = useInstalacion()
  const [oculto, setOculto] = useState(leerOculto)

  // Home banner: only on phones/tablets, when it can actually be installed, until dismissed
  if (aviso) {
    if (oculto || estado === 'instalada' || estado === 'manual' || window.innerWidth > 900) return null
    const ocultar = () => { try { localStorage.setItem(CLAVE_OCULTO, '1') } catch { /* private mode */ } setOculto(true) }
    return (
      <div className="card" style={{ padding: '12px 14px', marginBottom: 'var(--gap)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="tile-ic"><Smartphone size={18} /></div>
        <div style={{ flex: 1, minWidth: 0, fontSize: 13.5 }}>
          <b>Instala la app en tu celular</b>
          <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>
            {estado === 'ios' ? <>Toca <Share size={12} style={{ verticalAlign: -2 }} /> Compartir y luego “Agregar a inicio”.</> : 'Se abre como app, a pantalla completa y más rápido.'}
          </div>
        </div>
        {estado === 'disponible' && <button className="btn sm primary" onClick={instalar}><Download size={14} />Instalar</button>}
        <button className="iconbtn" style={{ width: 32, height: 32 }} onClick={ocultar} aria-label="Ocultar aviso de instalación"><X size={15} /></button>
      </div>
    )
  }

  if (estado === 'instalada') return <div style={{ fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary-dark)' }}><Check size={15} />Estás usando la app instalada.</div>
  if (estado === 'disponible') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5 }}>Instálala para abrirla desde un ícono, a pantalla completa, como cualquier otra app. Se actualiza sola.</div>
      <button className="btn primary" style={{ alignSelf: 'flex-start' }} onClick={instalar}><Download size={15} />Instalar la app</button>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6 }}>
      {estado === 'ios' ? <>
        <b>iPhone / iPad (Safari):</b>
        <span>1. Toca <Share size={13} style={{ verticalAlign: -2 }} /> <b>Compartir</b> (abajo en la pantalla).</span>
        <span>2. Elige <PlusSquare size={13} style={{ verticalAlign: -2 }} /> <b>Agregar a inicio</b> y luego <b>Agregar</b>.</span>
      </> : <>
        <b>Android (Chrome):</b>
        <span>Toca <MoreVertical size={13} style={{ verticalAlign: -2 }} /> (arriba a la derecha) → <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.</span>
        <b>Computadora (Chrome o Edge):</b>
        <span>Usa el ícono de instalar en la barra de direcciones, o el menú → <b>Instalar Lucianos Rent-a-Car</b>.</span>
      </>}
    </div>
  )
}
