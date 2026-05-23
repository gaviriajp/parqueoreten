import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useParking } from '../context/ParkingContext'
import { calcularCobrosCompleto, formatCurrency, formatearDuracionHoras } from '../utils/calculos'
import type { VehiculoActivo } from '../types'

interface LiquidarCobrosProps {
  vehiculoId: string
  onRegresarListado: () => void
}

function LiquidarCobros({ vehiculoId, onRegresarListado }: LiquidarCobrosProps) {
  const { state, registrarSalida } = useParking()
  const vehiculo = state.vehiculosActivos.find(v => v.id === vehiculoId) as VehiculoActivo
  const [quienCobra, setQuienCobra] = useState('')
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  
  // Estados para fecha y hora de salida
  const horaActualDefault = new Date()
  const [fechaSalida, setFechaSalida] = useState(horaActualDefault.toISOString().split('T')[0])
  const [horaSalida, setHoraSalida] = useState(horaActualDefault.toTimeString().slice(0, 5))

  const tarifaVehiculo = vehiculo ? state.tarifas[vehiculo.tipo] : { horas12: 0, porHora: 0 }
  const [calculoActual, setCalculoActual] = useState(() => {
    if (!vehiculo) return { horasCalculadas: 0, totalCobro: 0, detalles: '' }
    const horaSalidaISO = `${fechaSalida}T${horaSalida}:00`
    return calcularCobrosCompleto(vehiculo.horaEntrada, tarifaVehiculo, horaSalidaISO)
  })

  // Recalcular cuando cambie la hora de salida
  useEffect(() => {
    if (!vehiculo) return
    const horaSalidaISO = `${fechaSalida}T${horaSalida}:00`
    setCalculoActual(calcularCobrosCompleto(vehiculo.horaEntrada, tarifaVehiculo, horaSalidaISO))
  }, [fechaSalida, horaSalida, vehiculo, tarifaVehiculo])

  // Actualizar cálculo cada minuto
  useEffect(() => {
    if (!vehiculo) return
    const intervalo = setInterval(() => {
      const horaSalidaISO = `${fechaSalida}T${horaSalida}:00`
      setCalculoActual(calcularCobrosCompleto(vehiculo.horaEntrada, tarifaVehiculo, horaSalidaISO))
    }, 60000)
    return () => clearInterval(intervalo)
  }, [vehiculo, fechaSalida, horaSalida, tarifaVehiculo])

  if (!vehiculo) {
    return (
      <div className="page-grid">
        <div className="panel card">
          <p>Vehículo no encontrado</p>
          <button className="primary-button" onClick={onRegresarListado}>
            Volver al listado
          </button>
        </div>
      </div>
    )
  }

  const horaEntrada = new Date(vehiculo.horaEntrada)
  const horaSalidaISO = `${fechaSalida}T${horaSalida}:00`
  const horaSalidaObj = new Date(horaSalidaISO)
  const tiempoTranscurrido = Math.floor((horaSalidaObj.getTime() - horaEntrada.getTime()) / 1000 / 60)
  const horasTranscurridas = Math.floor(tiempoTranscurrido / 60)
  const minutosTranscurridos = tiempoTranscurrido % 60

  const handleConfirmarSalida = (e: FormEvent) => {
    e.preventDefault()
    if (!aceptaTerminos || !quienCobra.trim()) {
      alert('Completa el nombre de quién cobra')
      return
    }

    try {
      const recibo = registrarSalida(
        vehiculoId,
        quienCobra,
        calculoActual.totalCobro,
        calculoActual.horasCalculadas,
        horaSalidaISO
      )

      // Mostrar recibo (en una app real sería mejor una modal)
      alert(`Cobro confirmado\n\nRecibo: ${recibo.numeroRecibo}\nTotal: ${formatCurrency(recibo.totalPagado)}`)
      onRegresarListado()
    } catch (error) {
      alert('Error al registrar salida')
    }
  }

  const fechaEntrada = horaEntrada.toLocaleDateString('es-CO')
  const horaEntradaStr = horaEntrada.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  const fechaSalidaStr = horaSalidaObj.toLocaleDateString('es-CO')
  const horaSalidaStr = horaSalidaObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="page-grid">
      {/* Información del vehículo */}
      <section className="panel card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Cobro por salida</p>
            <h2>Liquidar vehículo {vehiculo.placa}</h2>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <span>Placa</span>
            <strong>{vehiculo.placa}</strong>
          </div>
          <div className="info-item">
            <span>Tipo</span>
            <strong>{vehiculo.tipo}</strong>
          </div>
          <div className="info-item">
            <span>Recibido por</span>
            <strong>{vehiculo.quienRecibe}</strong>
          </div>
          <div className="info-item">
            <span>Fecha entrada</span>
            <strong>{fechaEntrada}</strong>
          </div>
        </div>
      </section>

      {/* Timeline de ingreso y salida */}
      <section className="panel card">
        <div className="section-header">
          <p className="eyebrow">Tiempo en patio</p>
        </div>

        <div className="timeline-section">
          <div className="timeline-item">
            <span className="timeline-label">Entrada</span>
            <strong>{fechaEntrada} {horaEntradaStr}</strong>
          </div>
          <div className="timeline-arrow">→</div>
          <div className="timeline-item">
            <span className="timeline-label">Salida</span>
            <strong>{fechaSalidaStr} {horaSalidaStr}</strong>
          </div>
          <div className="timeline-arrow">→</div>
          <div className="timeline-item highlight">
            <span className="timeline-label">Tiempo total</span>
            <strong>{horasTranscurridas}h {minutosTranscurridos}m</strong>
          </div>
        </div>
      </section>

      {/* Cálculo de cobro */}
      <section className="panel card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Cálculo de tarifa</p>
            <h2>Desglose del cobro</h2>
          </div>
        </div>

        <div className="calc-section">
          <div className="calc-step">
            <span className="step-number">1</span>
            <div className="step-content">
              <span className="step-label">Tiempo transcurrido</span>
              <strong>{horasTranscurridas}h {minutosTranscurridos}m</strong>
            </div>
          </div>

          <div className="calc-step">
            <span className="step-number">2</span>
            <div className="step-content">
              <span className="step-label">Horas a cobrar</span>
              <strong className="highlight">{formatearDuracionHoras(calculoActual.horasCalculadas)} a cobrar</strong>
            </div>
          </div>

          <div className="calc-step">
            <span className="step-number">3</span>
            <div className="step-content">
              <span className="step-label">Cálculo de tarifa</span>
              <strong>{calculoActual.detalles}</strong>
            </div>
          </div>

          <div className="divider"></div>

          <div className="calc-result">
            <span>TOTAL A PAGAR:</span>
            <strong className="total-amount">{formatCurrency(calculoActual.totalCobro)}</strong>
          </div>
        </div>
      </section>

      {/* Formulario de confirmación */}
      <section className="panel card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Confirmación de cobro</p>
            <h3>Finalizar transacción</h3>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleConfirmarSalida}>
          <label>
            Fecha de salida
            <input
              type="date"
              value={fechaSalida}
              onChange={(e) => setFechaSalida(e.target.value)}
            />
          </label>

          <label>
            Hora de salida
            <input
              type="time"
              value={horaSalida}
              onChange={(e) => setHoraSalida(e.target.value)}
            />
          </label>

          <label>
            ¿Quién entrega y cobra?
            <input
              type="text"
              value={quienCobra}
              onChange={(e) => setQuienCobra(e.target.value)}
              placeholder="Nombre de quien realiza el cobro"
            />
          </label>

          <label className="full-width checkbox">
            <input
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
            />
            Confirmo que el monto de {formatCurrency(calculoActual.totalCobro)} fue cobrado
          </label>

          <div className="form-actions full-width">
            <button
              type="button"
              className="secondary-button"
              onClick={onRegresarListado}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={!aceptaTerminos || !quienCobra.trim()}
            >
              Confirmar salida
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default LiquidarCobros

