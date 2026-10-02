// Genera el instalador release/DevPulse.exe.
// Uso: node scripts/dist.mjs
// Llama a cada herramienta con Node directamente: el ejecutor de scripts de npm
// de este equipo corta los procesos largos (como electron-builder) a los pocos segundos.
import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'

const steps = [
  ['Comprobando tipos', ['node_modules/typescript/bin/tsc', '--noEmit']],
  ['Compilando la interfaz', ['node_modules/vite/bin/vite.js', 'build']],
  ['Empaquetando el instalador', ['node_modules/electron-builder/cli.js', '--win', 'nsis']],
]

rmSync('release', { recursive: true, force: true })

for (const [label, args] of steps) {
  console.log(`\n▸ ${label}…`)
  const { status } = spawnSync(process.execPath, args, { stdio: 'inherit' })
  if (status !== 0) {
    console.error(`\n✗ Falló: ${label}. Revisa el mensaje de arriba.`)
    process.exit(status ?? 1)
  }
}

console.log('\n✓ Listo: release/DevPulse.exe')
