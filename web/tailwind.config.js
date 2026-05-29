/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2D8A56',
        'primary-dark': '#1F6B40',
        'primary-deep': '#1A5231',
        'primary-soft': '#E8F5EE',
        'primary-line': '#B8DFC8',
        'primary-container': '#D0F0E0',
        background: '#FAFAF7',
        'paper-alt': '#F2F1EC',
        hairline: '#EAEAE4',
        ink: '#1E1E26',
        ink2: '#585868',
        ink3: '#838390',
        ink4: '#BCBCC4',
        warn: '#C98A20',
        'warn-soft': '#FEF8EC',
        danger: '#C04040',
        'danger-soft': '#FEEEEE',
        'dark-card': '#1E1E26',
        'dark-card2': '#272730',
        'success-muted': '#7FD9A8',
        'purple-muted': '#9999CC',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
}
