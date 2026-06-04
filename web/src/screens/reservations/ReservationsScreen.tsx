import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, CalendarDays, ChevronRight, Plus } from 'lucide-react'

/* ── Local data ── */
interface ResItem {
  id: string
  t: string
  dur: number
  type: 'Entrega' | 'Devolución'
  who: string
  i: string
  car: string
  plate: string
  tone: string
  total: number
  days: number
  urgent?: boolean
}

interface ResDay {
  key: string
  label: string
  date: string
  dow: string
  items: ResItem[]
}

const RES_DAYS: ResDay[] = [
  {
    key: 'hoy', label: 'Hoy', date: 'mar 21 may', dow: 'M',
    items: [
      { id: '1',  t: '10:30', dur: 2.5, type: 'Entrega',    who: 'Mariana Pérez', i: 'MP', car: 'Nissan Sentra',   plate: 'ABC-123', tone: 'blue',  total: 2550, days: 3, urgent: true },
      { id: '2',  t: '13:00', dur: 1.5, type: 'Entrega',    who: 'Ricardo López', i: 'RL', car: 'Nissan Versa',    plate: 'XYZ-908', tone: 'white', total: 1560, days: 2 },
      { id: '3',  t: '15:00', dur: 1,   type: 'Devolución', who: 'Lupita Cruz',   i: 'LC', car: 'Chevrolet Aveo',  plate: 'JKL-441', tone: 'slate', total: 2100, days: 3 },
      { id: '4',  t: '17:30', dur: 2,   type: 'Entrega',    who: 'Jorge Díaz',    i: 'JD', car: 'Mazda CX-5',      plate: 'DEF-220', tone: 'blue',  total: 5800, days: 4 },
    ],
  },
  {
    key: 'mar', label: 'Mañana', date: 'mié 22 may', dow: 'X',
    items: [
      { id: '5',  t: '09:00', dur: 1,   type: 'Devolución', who: 'Lupita Cruz',   i: 'LC', car: 'Toyota Yaris',   plate: 'TUV-309', tone: 'white', total: 2370, days: 3 },
      { id: '6',  t: '11:00', dur: 2,   type: 'Entrega',    who: 'Pedro Soto',    i: 'PS', car: 'VW Polo',         plate: 'QRS-115', tone: 'ink',   total: 1600, days: 2 },
      { id: '7',  t: '14:00', dur: 1.5, type: 'Entrega',    who: 'Elena Vargas',  i: 'EV', car: 'Nissan Kicks',   plate: 'KLM-013', tone: 'rose',  total: 6400, days: 5 },
    ],
  },
  {
    key: 'jue', label: 'Jueves', date: 'jue 23 may', dow: 'J',
    items: [
      { id: '8',  t: '10:00', dur: 2,   type: 'Entrega',    who: 'Sofía Romero',  i: 'SR', car: 'Toyota Yaris',   plate: 'TUV-309', tone: 'white', total: 3160, days: 4 },
      { id: '9',  t: '16:00', dur: 1,   type: 'Devolución', who: 'C. Mendoza',    i: 'CM', car: 'Mazda CX-5',     plate: 'DEF-220', tone: 'blue',  total: 5800, days: 4 },
    ],
  },
  {
    key: 'vie', label: 'Viernes', date: 'vie 24 may', dow: 'V',
    items: [
      { id: '10', t: '08:30', dur: 1,   type: 'Devolución', who: 'Mariana Pérez', i: 'MP', car: 'Nissan Sentra',   plate: 'ABC-123', tone: 'blue',  total: 2550, days: 3 },
      { id: '11', t: '12:00', dur: 2,   type: 'Entrega',    who: 'Hugo Castro',   i: 'HC', car: 'Honda City',      plate: 'GHI-554', tone: 'slate', total: 2640, days: 3 },
      { id: '12', t: '18:00', dur: 1.5, type: 'Entrega',    who: 'Diana Flores',  i: 'DF', car: 'Toyota Hilux',   plate: 'RST-887', tone: 'white', total: 4950, days: 3 },
    ],
  },
  {
    key: 'sab', label: 'Sábado', date: 'sáb 25 may', dow: 'S',
    items: [
      { id: '13', t: '11:00', dur: 1,   type: 'Devolución', who: 'A. Ruiz',       i: 'AR', car: 'VW Tiguan',      plate: 'WXY-660', tone: 'ink',   total: 7600, days: 5 },
    ],
  },
]

/* ── Calendar hours ── */
const CAL_HOURS = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

/* ── ResRow component ── */
function ResRow({ r, onClick }: { r: ResItem; onClick: () => void }) {
  const isPickup = r.type === 'Entrega'
  const typeClass = isPickup ? 'pickup' : 'return'
  return (
    <button className="resrow" onClick={onClick}>
      <div className="resrow-time">
        <div className="rt-h">{r.t}</div>
        <div className={'rt-tag ' + typeClass}>{r.type}</div>
      </div>
      <div className={'resrow-bar ' + typeClass} />
      <div className="avatar accent" style={{ width: 40, height: 40, fontSize: 14 }}>{r.i}</div>
      <div className="resrow-main">
        <div className="rr-who">{r.who}</div>
        <div className="rr-car">{r.car} · <span className="mono">{r.plate}</span></div>
      </div>
      <div className="resrow-end">
        <div className="rr-total">${r.total.toLocaleString('es-MX')}</div>
        <div className="rr-days">{r.days} días</div>
      </div>
      <ChevronRight size={16} />
    </button>
  )
}

/* ── List view ── */
function ResListView({ onNav }: { onNav: (r: ResItem) => void }) {
  return (
    <div className="reslist">
      {RES_DAYS.map(day => (
        <div key={day.key}>
          <div className="resday-head">
            <span className="sect-title" style={{ fontSize: 18 }}>{day.label}</span>
            <span className="resday-date">{day.date}</span>
            <span className="resday-count">{day.items.length} mov.</span>
          </div>
          <div className="resday-items">
            {day.items.map(r => (
              <ResRow key={r.id} r={r} onClick={() => onNav(r)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Calendar view ── */
function ResCalendarView() {
  const hourIndex = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number)
    return (h - 8) + (m / 60)
  }

  return (
    <div className="calwrap">
      <div className="callegend">
        <span><span className="lg pickup" />&nbsp;Entrega</span>
        <span><span className="lg return" />&nbsp;Devolución</span>
      </div>
      <div className="calgrid">
        {/* Hours column */}
        <div className="calhours">
          <div className="calcorner" />
          {CAL_HOURS.map(h => (
            <div key={h} className="calhour"><span>{h}</span></div>
          ))}
        </div>
        {/* Day columns */}
        {RES_DAYS.map(day => (
          <div key={day.key} className="calday">
            <div className="calday-head">
              <div className="cdh-dow">{day.dow}</div>
              <div className="cdh-date">{day.date}</div>
            </div>
            <div className="caltrack">
              {/* Hour lines */}
              {CAL_HOURS.map((_, hi) => (
                <div key={hi} className="calline" style={{ top: hi * 46 }} />
              ))}
              {/* Events */}
              {day.items.map(r => {
                const top = hourIndex(r.t) * 46
                const height = r.dur * 46
                const isPickup = r.type === 'Entrega'
                return (
                  <div
                    key={r.id}
                    className={'calevent ' + (isPickup ? 'pickup' : 'return')}
                    style={{ top, height }}
                  >
                    <div className="ce-time">{r.t}</div>
                    <div className="ce-who">{r.who}</div>
                    <div className="ce-car">{r.plate}</div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main screen ── */
export default function ReservationsScreen() {
  const navigate = useNavigate()
  const [view, setView] = useState<'lista' | 'cal'>('lista')

  function handleNav(r: ResItem) {
    if (r.type === 'Entrega') {
      navigate(`/app/entrega/${r.id}/1`)
    } else {
      navigate(`/app/devolucion/${r.id}/1`)
    }
  }

  const totalItems = RES_DAYS.reduce((s, d) => s + d.items.length, 0)

  return (
    <div className="screen">
      {/* Page head */}
      <div className="pagehead">
        <div>
          <div className="eyebrow">Agenda</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4cqw, 42px)', marginTop: 6 }}>
            Reservas
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginTop: 4 }}>
            {totalItems} movimientos · esta semana
          </p>
        </div>
        <div className="pagehead-actions">
          {/* View toggle */}
          <div className="viewtoggle">
            <button className={view === 'lista' ? 'on' : ''} onClick={() => setView('lista')}>
              <List size={14} />
              Lista
            </button>
            <button className={view === 'cal' ? 'on' : ''} onClick={() => setView('cal')}>
              <CalendarDays size={14} />
              Calendario
            </button>
          </div>
          <button className="btn sm primary">
            <Plus size={14} />
            Nueva reserva
          </button>
        </div>
      </div>

      {view === 'lista' ? (
        <ResListView onNav={handleNav} />
      ) : (
        <ResCalendarView />
      )}
    </div>
  )
}
