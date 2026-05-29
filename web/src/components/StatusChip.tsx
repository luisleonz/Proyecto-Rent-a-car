const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  rentado:    { bg: '#E8F5EE', text: '#2D8A56', label: 'Rentado' },
  disponible: { bg: '#E8F5EE', text: '#1F6B40', label: 'Disponible' },
  taller:     { bg: '#FEF8EC', text: '#C98A20', label: 'Taller' },
  reservado:  { bg: '#EEEEFF', text: '#4444AA', label: 'Reservado' },
  urgent:     { bg: '#FEEEEE', text: '#C04040', label: 'Urgente' },
  entrega:    { bg: '#E8F5EE', text: '#2D8A56', label: 'Entrega' },
  devolución: { bg: '#EEEEFF', text: '#4444AA', label: 'Devolución' },
}

interface StatusChipProps {
  status: string
}

export default function StatusChip({ status }: StatusChipProps) {
  const config = STATUS_CONFIG[status.toLowerCase()] ?? { bg: '#F0F0F0', text: '#666', label: status }
  return (
    <span
      style={{
        backgroundColor: config.bg,
        color: config.text,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        padding: '3px 8px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  )
}
