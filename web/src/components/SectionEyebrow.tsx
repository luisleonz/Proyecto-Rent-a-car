interface SectionEyebrowProps {
  text: string
  color?: string
}

export default function SectionEyebrow({ text, color = '#838390' }: SectionEyebrowProps) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color,
        fontFamily: 'Inter, sans-serif',
        margin: 0,
      }}
    >
      {text}
    </p>
  )
}
