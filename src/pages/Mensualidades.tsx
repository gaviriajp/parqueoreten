import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParking } from '../context/ParkingContext'
import { formatCurrency, formatDate, esMensualidadVigente } from '../utils/calculos'
import type { TipoVehiculo } from '../types'

const TIPOS_VEHICULOS: TipoVehiculo[] = ['Particular', 'NH', 'Camión Sencillo', 'Doble Troque']

function Mensualidades() {
  const { state, registrarMensualidad, actualizarMensualidad, eliminarMensualidad } = useParking()
  const [placa, setPlaca] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [tipo, setTipo] = useState<TipoVehiculo>('Particular')
  const [precio, setPrecio] = useState(String(state.tarifasMensuales['Particular']))
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0])
  const [quienRegistra, setQuienRegistra] = useState('')
  const [renovarId, setRenovarId] = useState<string | null>(null)

  useEffect(() => {
    setPrecio(String(state.tarifasMensuales[tipo]))
  }, [state.tarifasMensuales, tipo])
  const [fechaPagoRenovacion, setFechaPagoRenovacion] = useState(new Date().toISOString().split('T')[0])
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)

  const handleRegistrarMensualidad = (e: FormEvent) => {
    e.preventDefault()
    
    if (!placa.trim() || !nombre.trim() || !telefono.trim() || !quienRegistra.trim() || !fechaPago) {
      setMensaje({ tipo: 'error', texto: 'Completa todos los campos' })
      return
    }

    try {
      registrarMensualidad(
        placa,
        nombre,
        telefono,
        tipo,
        Number(precio),
        quienRegistra,
        fechaPago
      )
      
      setMensaje({ tipo: 'success', texto: `✓ Mensualidad registrada para ${placa}` })
      setPlaca('')
      setNombre('')
      setTelefono('')
      setTipo('Particular')
      setPrecio(String(state.tarifasMensuales['Particular']))
      setFechaPago(new Date().toISOString().split('T')[0])
      setQuienRegistra('')
      
      setTimeout(() => setMensaje(null), 3000)
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al registrar' })
    }
  }

  const handleRenovarMensualidad = (id: string) => {
    setRenovarId(id)
    setFechaPagoRenovacion(new Date().toISOString().split('T')[0])
  }

  const handleConfirmarRenovacion = (id: string) => {
    const fechaPago = new Date(`${fechaPagoRenovacion}T00:00:00`)
    if (Number.isNaN(fechaPago.getTime())) {
      setMensaje({ tipo: 'error', texto: 'Fecha de pago inválida' })
      setTimeout(() => setMensaje(null), 3000)
      return
    }

    const vencimiento = new Date(fechaPago.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    actualizarMensualidad(id, {
      fechaPago: fechaPagoRenovacion,
      fechaVencimiento: vencimiento,
      estado: 'VIGENTE'
    })

    setRenovarId(null)
    setMensaje({ tipo: 'success', texto: '✓ Mensualidad renovada' })
    setTimeout(() => setMensaje(null), 3000)
  }

  const handleCancelarRenovacion = () => {
    setRenovarId(null)
  }

  const handleEliminarMensualidad = (id: string) => {
    const m = state.mensualidades.find(x => x.id === id)
    if (m && window.confirm(`¿Eliminar mensualidad de ${m.placa}?`)) {
      eliminarMensualidad(id)
      setMensaje({ tipo: 'success', texto: '✓ Mensualidad eliminada' })
      setTimeout(() => setMensaje(null), 3000)
    }
  }

  const handleCambiarTipo = (nuevoTipo: TipoVehiculo) => {
    setTipo(nuevoTipo)
    setPrecio(String(state.tarifasMensuales[nuevoTipo]))
  }

  return (
    <div className="page-grid">
      {/* Formulario de registro */}
      <section className="panel card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Nueva mensualidad</p>
            <h2>Registrar cliente mensual</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleRegistrarMensualidad}>
          <label>
            Placa
            <input
              type="text"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="ABC-123"
            />
          </label>

          <label>
            Nombre completo
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Juan Pérez"
            />
          </label>

          <label>
            Teléfono
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="3001234567"
            />
          </label>

          <label>
            Fecha de pago
            <input
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
            />
          </label>

          <label>
            Tipo de vehículo
            <select 
              value={tipo} 
              onChange={(e) => handleCambiarTipo(e.target.value as TipoVehiculo)}
            >
              {TIPOS_VEHICULOS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <label>
            Precio
            <input
              type="number"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              min="0"
            />
          </label>

          <label>
            Quién registra
            <input
              type="text"
              value={quienRegistra}
              onChange={(e) => setQuienRegistra(e.target.value)}
              placeholder="Nombre de administrador"
            />
          </label>

          <button className="primary-button full-width" type="submit">
            Registrar mensualidad
          </button>
        </form>

        {mensaje && (
          <div className={`alert alert-${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}
      </section>

      {/* Listado de mensualidades */}
      <section className="panel card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Gestión de mensualidades</p>
            <h3>{state.mensualidades.length} registradas</h3>
          </div>
        </div>

        {state.mensualidades.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Tipo</th>
                  <th>Precio</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {state.mensualidades.map(m => {
                  const vigente = esMensualidadVigente(m.fechaVencimiento)
                  return (
                    <tr key={m.id} className={vigente ? '' : 'row-vencida'}>
                      <td className="font-bold">{m.placa}</td>
                      <td>{m.nombre}</td>
                      <td>{m.telefono}</td>
                      <td>{m.tipo}</td>
                      <td>{formatCurrency(m.precio)}</td>
                      <td>{formatDate(m.fechaVencimiento)}</td>
                      <td>
                        <span className={`badge ${vigente ? 'badge-vigente' : 'badge-vencida'}`}>
                          {vigente ? 'VIGENTE' : 'VENCIDA'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        {renovarId === m.id ? (
                          <div className="renew-row">
                            <input
                              type="date"
                              value={fechaPagoRenovacion}
                              onChange={(e) => setFechaPagoRenovacion(e.target.value)}
                            />
                            <button
                              className="text-button"
                              onClick={() => handleConfirmarRenovacion(m.id)}
                            >
                              Confirmar
                            </button>
                            <button
                              className="text-button danger"
                              onClick={handleCancelarRenovacion}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              className="text-button"
                              onClick={() => handleRenovarMensualidad(m.id)}
                            >
                              Renovar
                            </button>
                            <button
                              className="text-button danger"
                              onClick={() => handleEliminarMensualidad(m.id)}
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No hay mensualidades registradas</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default Mensualidades
