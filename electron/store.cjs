const fs = require('node:fs')
const path = require('node:path')

/**
 * Almacén JSON en la carpeta de datos del usuario (%APPDATA%\DevPulse).
 * Escribe con retardo y de forma atómica (archivo temporal + rename)
 * para no corromper los datos si la app se cierra a mitad de escritura.
 */
function createStore(dir, filename = 'devpulse-data.json') {
  const file = path.join(dir, filename)
  let data = {}
  let timer = null

  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    data = {}
  }

  function flush() {
