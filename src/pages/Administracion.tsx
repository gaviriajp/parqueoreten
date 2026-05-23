import { useEffect, useState } from 'react'
import { useParking } from '../context/ParkingContext'
import type { TipoVehiculo } from '../types'
import { formatCurrency } from '../utils/calculos'

const TIPOS_VEHICULOS: TipoVehiculo[] = ['Particular', 'NH', 'Camión Sencillo', 'Doble Troque']

interface TarifasEdicion {
  horas12: number
  mensual: number
}

function Administracion() {
  const { state, actualizarTarifas } = useParking()
  const [edits, setEdits] = useState<Record<TipoVehiculo, TarifasEdicion>>({
    Particular: { horas12: 0, mensual: 0 },
    NH: { horas12: 0, mensual: 0 },
    'Camión Sencillo': { horas12: 0, mensual: 0 },
    'Doble Troque': { horas12: 0, mensual: 0 }
  })
  const [mensaje, setMensaje] = useState<string | null>(null)

  useEffect(() => {
    setEdits({
      Particular: {
        horas12: state.tarifas.Particular.horas12,
        mensual: state.tarifasMensuales.Particular
      },
      NH: {
        horas12: state.tarifas.NH.horas12,
        mensual: state.tarifasMensuales.NH
      },
      'Camión Sencillo': {
        horas12: state.tarifas['Camión Sencillo'].horas12,
        mensual: state.tarifasMensuales['Camión Sencillo']
      },
      'Doble Troque': {
        horas12: state.tarifas['Doble Troque'].horas12,
        mensual: state.tarifasMensuales['Doble Troque']
      }
    })
  }, [state.tarifas, state.tarifasMensuales])

  const handleChange = (tipo: TipoVehiculo, field: 'horas12' | 'mensual', value: string) => {
    const cantidad = Number(value)
    if (Number.isNaN(cantidad)) return
    setEdits(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [field]: cantidad
      }
    }))
  }

  const handleGuardar = () => {
    TIPOS_VEHICULOS.forEach(tipo => {
      const config = edits[tipo]
      if (config) {
        actualizarTarifas(tipo, config.horas12, config.mensual)
      }
    })
    setMensaje('Tarifas actualizadas correctamente')
    setTimeout(() => setMensaje(null), 3000)
  }

  return (
    <div className="page-grid">
      <section className="panel card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Administración</p>
            <h2>Modificar tarifas por categoría</h2>
          </div>
        </div>

        <p className="page-description">
          Ajusta el precio de 12 horas y la mensualidad por tipo de vehículo.
          El precio por hora se calcula automáticamente como 1/4 del valor de 12 horas.
        </p>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Precio 12h</th>
                <th>Precio por hora</th>
                <th>Precio mensual</th>
              </tr>
            </thead>
            <tbody>
              {TIPOS_VEHICULOS.map(tipo => {
                const config = edits[tipo]
                const porHora = Math.round(config.horas12 / 4)
                return (
                  <tr key={tipo}>
                    <td>{tipo}</td>
                    <td>
                      <input
                        type="number"
                        value={config.horas12}
                        min={0}
                        onChange={(e) => handleChange(tipo, 'horas12', e.target.value)}
                      />
                    </td>
                    <td>{formatCurrency(porHora)}</td>
                    <td>
                      <input
                        type="number"
                        value={config.mensual}
                        min={0}
                        onChange={(e) => handleChange(tipo, 'mensual', e.target.value)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="form-actions">
          <button className="primary-button" onClick={handleGuardar}>
            Guardar tarifas
          </button>
        </div>
        {mensaje && <div className="alert alert-success">{mensaje}</div>}
      </section>
    </div>
  )
}

export default Administracion
