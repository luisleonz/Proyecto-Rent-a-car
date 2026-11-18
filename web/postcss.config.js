export default {
  plugins: {
    tailwindcss: {},
    // Older Safari (before 15.4 / 16.2) ignores oklch() and color-mix(): add plain-color fallbacks
    '@csstools/postcss-oklab-function': { preserve: true },
    '@csstools/postcss-color-mix-function': { preserve: true },
    autoprefixer: {},
  },
}
