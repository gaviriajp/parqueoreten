const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const dbPath = path.join(__dirname, 'data.db')

const db = new sqlite3.Database(dbPath)

function init() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password_hash TEXT
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS vehiculos (
      id TEXT PRIMARY KEY,
      placa TEXT,
      tipo TEXT,
      horaEntrada TEXT,
      quienRecibe TEXT,
      estado TEXT
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS mensualidades (
      id TEXT PRIMARY KEY,
      placa TEXT,
      nombre TEXT,
      telefono TEXT,
      tipo TEXT,
      precio INTEGER,
      fechaPago TEXT,
      fechaVencimiento TEXT,
      quienRegistra TEXT,
      estado TEXT
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS recibos (
      id TEXT PRIMARY KEY,
      numeroRecibo TEXT,
      tipo TEXT,
      placa TEXT,
      tipoVehiculo TEXT,
      fechaEmision TEXT,
      horaEmision TEXT,
      totalPagado INTEGER,
      quienAtendio TEXT,
      horaEntrada TEXT,
      horaSalida TEXT,
      horasCalculadas INTEGER,
      nombreCliente TEXT,
      telefono TEXT,
      fechaVencimiento TEXT
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS tarifas (
      tipo TEXT PRIMARY KEY,
      horas12 INTEGER,
      porHora INTEGER,
      mensual INTEGER
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS contador_recibos (
      fecha TEXT PRIMARY KEY,
      contador INTEGER
    )`)
  })
}

module.exports = { db, init }
