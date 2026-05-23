require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { db, init } = require('./db')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

init()

const app = express()
app.use(cors())
app.use(express.json())

const DEFAULT_TARIFAS = {
  Particular: { horas12: 6000, porHora: 1500, mensual: 130000 },
  NH: { horas12: 8000, porHora: 2000, mensual: 210000 },
  'Camión Sencillo': { horas12: 10000, porHora: 2500, mensual: 270000 },
  'Doble Troque': { horas12: 12000, porHora: 3000, mensual: 320000 }
}

// Seed admin user if not exists
const seedAdmin = async () => {
  const email = 'administrador@parqueo.com'
  const plain = '@admin20@'
  db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, row) => {
    if (err) return console.error(err)
    if (!row) {
      const hash = await bcrypt.hash(plain, 10)
      db.run('INSERT INTO usuarios (email, password_hash) VALUES (?, ?)', [email, hash])
      console.log('Admin seeded')
    }
  })

  Object.entries(DEFAULT_TARIFAS).forEach(([tipo, config]) => {
    db.run(
      'INSERT OR IGNORE INTO tarifas (tipo, horas12, porHora, mensual) VALUES (?, ?, ?, ?)',
      [tipo, config.horas12, config.porHora, config.mensual]
    )
  })
}

seedAdmin()

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'missing' })

  db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'db' })
    if (!user) return res.status(401).json({ error: 'invalid' })
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'invalid' })
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' })
    res.json({ token })
  })
})

// Middleware simple to check token
function auth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'no token' })
  const parts = authHeader.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'bad token' })
  const token = parts[1]
  try {
    const data = jwt.verify(token, JWT_SECRET)
    req.user = data
    next()
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' })
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.email !== 'administrador@parqueo.com') {
    return res.status(403).json({ error: 'forbidden' })
  }
  next()
}

// Estado completo
app.get('/api/state', auth, (req, res) => {
  db.serialize(() => {
    db.all('SELECT * FROM vehiculos', (err, vehiculos) => {
      if (err) return res.status(500).json({ error: 'db' })
      db.all('SELECT * FROM mensualidades', (err2, mensualidades) => {
        if (err2) return res.status(500).json({ error: 'db' })
        db.all('SELECT * FROM recibos', (err3, recibos) => {
          if (err3) return res.status(500).json({ error: 'db' })
          db.all('SELECT * FROM contador_recibos', (err4, contadorRows) => {
            if (err4) return res.status(500).json({ error: 'db' })
            const contador = {}
            contadorRows.forEach(r => contador[r.fecha] = r.contador)
            db.all('SELECT * FROM tarifas', (err5, tarifasRows) => {
              if (err5) return res.status(500).json({ error: 'db' })
              const tarifas = {}
              const tarifasMensuales = {}
              tarifasRows.forEach((row) => {
                tarifas[row.tipo] = { horas12: row.horas12, porHora: row.porHora }
                tarifasMensuales[row.tipo] = row.mensual
              })
              res.json({ vehiculos, mensualidades, recibos, contadorRecibos: contador, tarifas, tarifasMensuales })
            })
          })
        })
      })
    })
  })
})

// Vehículos CRUD
app.post('/api/vehiculos', auth, (req, res) => {
  const { id, placa, tipo, horaEntrada, quienRecibe, estado } = req.body
  db.run('INSERT INTO vehiculos (id, placa, tipo, horaEntrada, quienRecibe, estado) VALUES (?, ?, ?, ?, ?, ?)',
    [id, placa, tipo, horaEntrada, quienRecibe, estado], function(err) {
    if (err) return res.status(500).json({ error: 'db' })
    res.json({ ok: true })
  })
})

app.delete('/api/vehiculos/:id', auth, (req, res) => {
  db.run('DELETE FROM vehiculos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'db' })
    res.json({ ok: true })
  })
})

// Mensualidades CRUD
app.post('/api/mensualidades', auth, (req, res) => {
  const m = req.body
  db.run(`INSERT INTO mensualidades (id, placa, nombre, telefono, tipo, precio, fechaPago, fechaVencimiento, quienRegistra, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [m.id, m.placa, m.nombre, m.telefono, m.tipo, m.precio, m.fechaPago, m.fechaVencimiento, m.quienRegistra, m.estado], function(err) {
    if (err) return res.status(500).json({ error: 'db' })
    res.json({ ok: true })
  })
})

app.put('/api/mensualidades/:id', auth, (req, res) => {
  const updates = req.body
  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ')
  const params = Object.values(updates)
  params.push(req.params.id)
  db.run(`UPDATE mensualidades SET ${sets} WHERE id = ?`, params, function(err) {
    if (err) return res.status(500).json({ error: 'db' })
    res.json({ ok: true })
  })
})

app.delete('/api/mensualidades/:id', auth, (req, res) => {
  db.run('DELETE FROM mensualidades WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'db' })
    res.json({ ok: true })
  })
})

app.put('/api/tarifas/:tipo', auth, requireAdmin, (req, res) => {
  const tipo = req.params.tipo
  const { horas12, porHora, mensual } = req.body
  db.run(
    'UPDATE tarifas SET horas12 = ?, porHora = ?, mensual = ? WHERE tipo = ?',
    [horas12, porHora, mensual, tipo],
    function(err) {
      if (err) return res.status(500).json({ error: 'db' })
      res.json({ ok: true })
    }
  )
})

// Recibos
app.post('/api/recibos', auth, (req, res) => {
  const r = req.body
  db.run(`INSERT INTO recibos (id, numeroRecibo, tipo, placa, tipoVehiculo, fechaEmision, horaEmision, totalPagado, quienAtendio, horaEntrada, horaSalida, horasCalculadas, nombreCliente, telefono, fechaVencimiento)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [r.id, r.numeroRecibo, r.tipo, r.placa, r.tipoVehiculo, r.fechaEmision, r.horaEmision, r.totalPagado, r.quienAtendio, r.horaEntrada, r.horaSalida, r.horasCalculadas, r.nombreCliente, r.telefono, r.fechaVencimiento], function(err) {
    if (err) return res.status(500).json({ error: 'db' })
    // actualizar contador_recibos
    db.get('SELECT contador FROM contador_recibos WHERE fecha = ?', [r.fechaEmision], (err2, row) => {
      if (err2) return res.status(500).json({ error: 'db' })
      if (!row) {
        db.run('INSERT INTO contador_recibos (fecha, contador) VALUES (?, ?)', [r.fechaEmision, 1])
      } else {
        db.run('UPDATE contador_recibos SET contador = ? WHERE fecha = ?', [row.contador + 1, r.fechaEmision])
      }
      // Si el recibo corresponde a un vehiculo activo, eliminarlo
      db.run('DELETE FROM vehiculos WHERE id = ?', [r.idVehiculo || r.id], () => {
        res.json({ ok: true })
      })
    })
  })
})

app.delete('/api/recibos/:id', auth, (req, res) => {
  db.run('DELETE FROM recibos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'db' })
    res.json({ ok: true })
  })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Server listening on ${PORT}`))
