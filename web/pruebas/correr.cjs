// Builds the app against the simulated backend, serves it and runs the end-to-end suite.
const { execSync, spawn } = require('child_process')
const path = require('path')
const os = require('os')

const web = path.join(__dirname, '..')
const salida = process.env.SALIDA ?? os.tmpdir()
const dist = path.join(salida, 'dist-pruebas')
execSync(`npx vite build --outDir "${dist}" --emptyOutDir`, {
  cwd: web, stdio: 'ignore', env: { ...process.env, VITE_SUPABASE_URL: 'http://localhost:1', VITE_SUPABASE_ANON_KEY: 'prueba' },
})
const srv = spawn('npx', ['vite', 'preview', '--outDir', dist, '--port', '5181', '--strictPort'], { cwd: web, stdio: 'ignore' })
setTimeout(() => {
  const t = spawn('node', [path.join(__dirname, 'e2e.cjs')], { stdio: 'inherit', env: { ...process.env, SALIDA: salida } })
  t.on('exit', code => { srv.kill(); process.exit(code ?? 1) })
}, 3000)
