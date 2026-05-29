interface AvatarCircleProps {
  initials: string
  size?: number
  accent?: string
}

export default function AvatarCircle({ initials, size = 40, accent = '#2D8A56' }: AvatarCircleProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: accent + '22',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: `1.5px solid ${accent}44`,
      }}
    >
      <span
        style={{
          color: accent,
          fontSize: size * 0.36,
          fontWeight: 700,
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1,
        }}
      >
        {initials}
      </span>
    </div>
  )
}
