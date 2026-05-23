import { useState } from 'react'
import { useParking } from '../context/ParkingContext'
import { formatCurrency, formatDate, formatDateTime, formatearDuracionHoras } from '../utils/calculos'

function HistorialRecibos() {
  const { buscarRecibos, eliminarRecibo } = useParking()
  const [placaBusqueda, setPlacaBusqueda] = useState('')
  const [fechaBusqueda, setFechaBusqueda] = useState('')

  const recibosFiltrados = buscarRecibos(placaBusqueda || undefined, fechaBusqueda || undefined)

  const handleLimpiarFiltros = () => {
    setPlacaBusqueda('')
    setFechaBusqueda('')
  }

  const handleEliminarRecibo = (reciboId: string) => {
    const recibo = recibosFiltrados.find(r => r.id === reciboId)
    if (recibo && window.confirm(`¿Eliminar recibo ${recibo.numeroRecibo}?`)) {
      eliminarRecibo(reciboId)
    }
  }

  const totalRecaudado = recibosFiltrados.reduce((sum, r) => sum + r.totalPagado, 0)

  return (
    <div className="page-grid">
      {/* Filtros */}
      <section className="panel card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Búsqueda</p>
            <h2>Filtrar recibos</h2>
          </div>
        </div>

        <div className="form-grid">
          <label>
            Buscar por placa
            <input
              type="text"
              value={placaBusqueda}
              onChange={(e) => setPlacaBusqueda(e.target.value)}
              placeholder="ABC-123"
            />
          </label>

          <label>
            Buscar por fecha
            <input
              type="date"
              value={fechaBusqueda}
              onChange={(e) => setFechaBusqueda(e.target.value)}
            />
          </label>

          <button
            className="secondary-button"
            onClick={handleLimpiarFiltros}
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      {/* Resumen */}
      {recibosFiltrados.length > 0 && (
        <section className="panel card">
          <div className="overview-item">
            <span>Recibos encontrados</span>
            <strong>{recibosFiltrados.length}</strong>
            <p>Total recaudado: {formatCurrency(totalRecaudado)}</p>
          </div>
        </section>
      )}

      {/* Tabla de recibos */}
      <section className="panel card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Historial</p>
            <h3>{recibosFiltrados.length} recibos</h3>
          </div>
        </div>

        {recibosFiltrados.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Recibo</th>
                  <th>Tipo</th>
                  <th>Placa</th>
                  <th>Vehículo</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Monto</th>
                  <th>Atendió</th>
                  <th>Detalles</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {recibosFiltrados.map(recibo => (
                  <tr key={recibo.id}>
                    <td className="font-bold">{recibo.numeroRecibo}</td>
                    <td>
                      <span className={`badge ${recibo.tipo === 'POR_HORAS' ? 'badge-horas' : 'badge-mensual'}`}>
                        {recibo.tipo === 'POR_HORAS' ? 'Por horas' : 'Mensualidad'}
                      </span>
                    </td>
                    <td>{recibo.placa}</td>
                    <td>{recibo.tipoVehiculo}</td>
                    <td>{formatDateTime(`${recibo.fechaEmision}T${recibo.horaEmision}`)}</td>
                    <td>{recibo.horaEmision}</td>
                    <td className="font-bold">{formatCurrency(recibo.totalPagado)}</td>
                    <td>{recibo.quienAtendio}</td>
                    <td>
                      <details className="details-cell">
                        <summary>Ver</summary>
                        <div className="details-content">
                          {recibo.tipo === 'POR_HORAS' && (
                            <>
                              <p><strong>Entrada:</strong> {recibo.horaEntrada ? formatDateTime(recibo.horaEntrada) : '---'}</p>
                              <p><strong>Salida:</strong> {recibo.horaSalida ? formatDateTime(recibo.horaSalida) : '---'}</p>
                              <p><strong>Días / horas cobradas:</strong> {formatearDuracionHoras(recibo.horasCalculadas || 0)}</p>
                            </>
                          )}
                          {recibo.tipo === 'MENSUALIDAD' && (
                            <>
                              <p><strong>Cliente:</strong> {recibo.nombreCliente}</p>
                              <p><strong>Teléfono:</strong> {recibo.telefono}</p>
                              <p><strong>Vence:</strong> {formatDate(recibo.fechaVencimiento!)}</p>
                            </>
                          )}
                        </div>
                      </details>
                    </td>
                    <td>
                      <button
                        className="text-button danger small"
                        onClick={() => handleEliminarRecibo(recibo.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No hay recibos que coincidan con los filtros</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default HistorialRecibos

