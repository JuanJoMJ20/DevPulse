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

  const save = () => {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(db))
    fs.renameSync(`${file}.tmp`, file)
  }

  const findByEmail = (email) => db.users.find((u) => u.email === email.trim().toLowerCase())

  return {
    dataFileFor: (userId) => `devpulse-data-${userId}.json`,

    status() {
      const remembered = db.users.find((u) => u.id === db.remembered)
      return { hasUsers: db.users.length > 0, user: remembered ? publicUser(remembered) : null }
    },

    register({ name, email, password }) {
      const cleanName = String(name ?? '').trim()
      const cleanEmail = String(email ?? '').trim().toLowerCase()
      if (cleanName.length < 2) return { ok: false, code: 'name' }
      if (!EMAIL_RE.test(cleanEmail)) return { ok: false, code: 'email' }
      if (String(password ?? '').length < 8) return { ok: false, code: 'weak' }
      if (findByEmail(cleanEmail)) return { ok: false, code: 'exists' }

      const salt = crypto.randomBytes(16).toString('hex')
      const user = { id: crypto.randomUUID(), name: cleanName, email: cleanEmail, salt, hash: hashPassword(password, salt), createdAt: Date.now() }
      const isFirst = db.users.length === 0
      db.users.push(user)
      db.remembered = user.id
      save()
      return { ok: true, user: publicUser(user), isFirst }
    },

    login({ email, password, remember }) {
      const user = findByEmail(String(email ?? ''))
      // Mismo coste y mismo mensaje exista o no la cuenta: no revela qué correos están registrados
      const salt = user?.salt ?? 'no-user'
      const attempt = Buffer.from(hashPassword(String(password ?? ''), salt), 'hex')
      const stored = Buffer.from(user?.hash ?? '0'.repeat(SCRYPT.keylen * 2), 'hex')
      if (!user || !crypto.timingSafeEqual(attempt, stored)) return { ok: false, code: 'credentials' }
      db.remembered = remember ? user.id : null
      save()
      return { ok: true, user: publicUser(user) }
    },

    logout() {
      db.remembered = null
      save()
    },
  }
}

module.exports = { createAuth }
