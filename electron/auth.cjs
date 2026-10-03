const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

/**
 * Cuentas locales: viven solo en este equipo (%APPDATA%\DevPulse\users.json).
 * Las contraseñas se guardan con scrypt y sal aleatoria; nunca en claro.
 * Cada cuenta tiene su propio archivo de datos, así que dos personas que
 * compartan el PC no ven ni entrenan el modelo de la otra.
 */
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const hashPassword = (password, salt) =>
  crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p }).toString('hex')

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt })

function createAuth(dir) {
  const file = path.join(dir, 'users.json')
  let db = { users: [], remembered: null }
  try {
    db = { ...db, ...JSON.parse(fs.readFileSync(file, 'utf8')) }
  } catch {
    // primera ejecución
  }
