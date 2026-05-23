import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParking } from '../context/ParkingContext'
import { tiempoTranscurrido } from '../utils/calculos'
import type { TipoVehiculo, VehiculoActivo } from '../types'

interface ControlDiarioProps {
  onSeleccionarVehiculo: (vehiculoId: string) => void
}

const TIPOS_VEHICULOS: TipoVehiculo[] = ['Particular', 'NH', 'Camión Sencillo', 'Doble Troque']

function ControlDiario({ onSeleccionarVehiculo }: ControlDiarioProps) {
  const { state, registrarIngreso, verificarMensualidad, eliminarVehiculoActivo } = useParking()
  const [placa, setPlaca] = useState('')
  const [tipo, setTipo] = useState<TipoVehiculo>('Particular')
  const [quienRecibe, setQuienRecibe] = useState('')
  const [fechaEntrada, setFechaEntrada] = useState(new Date().toISOString().split('T')[0])
  const [horaEntrada, setHoraEntrada] = useState(new Date().toTimeString().slice(0, 5))
  const [busqueda, setBusqueda] = useState('')
  const [alerta, setAlerta] = useState<{ tipo: 'error' | 'warning' | 'success', mensaje: string } | null>(null)

  const handleRegistrarIngreso = (e: FormEvent) => {
    e.preventDefault()
    if (!placa.trim() || !quienRecibe.trim()) {
      setAlerta({ tipo: 'error', mensaje: 'Ingresa placa y quién recibe' })
      return
    }

    const isoDateTime = `${fechaEntrada}T${horaEntrada}:00`
    registrarIngreso(placa, tipo, quienRecibe, isoDateTime)
    setAlerta({ tipo: 'success', mensaje: `✓ Vehículo ${placa.toUpperCase()} registrado` })
    setPlaca('')
    setQuienRecibe('')
    setFechaEntrada(new Date().toISOString().split('T')[0])
    setHoraEntrada(new Date().toTimeString().slice(0, 5))
    setTimeout(() => setAlerta(null), 3000)
  }

  const vehiculosFiltrados = state.vehiculosActivos.filter(v =>
    v.placa.toUpperCase().includes(busqueda.toUpperCase())
  )

  const handleSeleccionar = (vehiculoId: string) => {
    const vehiculo = state.vehiculosActivos.find(v => v.id === vehiculoId)
    if (vehiculo) {
      const mensualidad = verificarMensualidad(vehiculo.placa)
      if (mensualidad) {
        setAlerta({
          tipo: 'warning',
          mensaje: `⚠️ Vehículo ${vehiculo.placa} tiene mensualidad vigente hasta ${mensualidad.fechaVencimiento}. No cobrar por horas.`
        })
        return
      }
      onSeleccionarVehiculo(vehiculoId)
    }
  }

  const handleEliminarVehiculo = (vehiculoId: string) => {
    const vehiculo = state.vehiculosActivos.find(v => v.id === vehiculoId)
    if (vehiculo && window.confirm(`¿Eliminar ${vehiculo.placa} del patio?`)) {
      eliminarVehiculoActivo(vehiculoId)
      setAlerta({ tipo: 'success', mensaje: `✓ ${vehiculo.placa} eliminado` })
      setTimeout(() => setAlerta(null), 3000)
    }
  }

  const renderVehiculoFila = (vehiculo: VehiculoActivo) => {
    const fechaEntrada = new Date(vehiculo.horaEntrada)
    const entradaFecha = fechaEntrada.toLocaleDateString('es-CO')
    const entradaHora = fechaEntrada.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

    return (
      <tr key={vehiculo.id}>
        <td className="font-bold">{vehiculo.placa}</td>
        <td>{vehiculo.tipo}</td>
        <td>
          <div>{entradaFecha}</div>
          <div>{entradaHora}</div>
        </td>
        <td>{tiempoTranscurrido(vehiculo.horaEntrada)}</td>
        <td>{vehiculo.quienRecibe}</td>
        <td className="actions-cell">
          <button
            className="primary-button small"
            onClick={() => handleSeleccionar(vehiculo.id)}
          >
            Cobrar
          </button>
          <button
            className="text-button danger small"
            onClick={() => handleEliminarVehiculo(vehiculo.id)}
          >
            Eliminar
          </button>
        </td>
      </tr>
    )
  }

  return (
    <div className="page-grid">
      {/* Formulario de Ingreso */}
      <section className="panel card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Nuevo ingreso</p>
            <h2>Registrar vehículo en el patio</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleRegistrarIngreso}>
          <label>
            Placa
            <input
              type="text"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="ABC-123"
              autoFocus
            />
          </label>

          <label>
            Tipo de vehículo
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoVehiculo)}>
              {TIPOS_VEHICULOS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <label>
            Quién recibe
            <input
              type="text"
              value={quienRecibe}
              onChange={(e) => setQuienRecibe(e.target.value)}
              placeholder="Nombre del administrador"
            />
          </label>

          <label>
            Fecha de entrada
            <input
              type="date"
              value={fechaEntrada}
              onChange={(e) => setFechaEntrada(e.target.value)}
            />
          </label>

          <label>
            Hora de entrada
            <input
              type="time"
              value={horaEntrada}
              onChange={(e) => setHoraEntrada(e.target.value)}
            />
          </label>

          <button className="primary-button" type="submit">
            Registrar ingreso
          </button>
        </form>

        {alerta && (
          <div className={`alert alert-${alerta.tipo}`}>
            {alerta.mensaje}
          </div>
        )}
      </section>

      {/* Buscador */}
      <section className="panel card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Buscar vehículo</p>
            <h3>En el patio</h3>
          </div>
          <span className="badge">{vehiculosFiltrados.length}</span>
        </div>

        <label>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por placa..."
            className="full-width"
          />
        </label>
      </section>

      {/* Tabla de vehículos activos */}
      <section className="panel card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Vehículos activos</p>
            <h3>{vehiculosFiltrados.length || 'Sin'} vehículos</h3>
          </div>
        </div>

        {vehiculosFiltrados.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Tipo</th>
                  <th>Entrada</th>
                  <th>Tiempo</th>
                  <th>Recibido por</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {vehiculosFiltrados.map(renderVehiculoFila)}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No hay vehículos en el patio {busqueda && `para "${busqueda}"`}</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default ControlDiario

