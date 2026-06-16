import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { VehiculoActivo, Mensualidad, Recibo, ParkingState, TipoVehiculo } from '../types'
import { TARIFAS, TARIFAS_MENSUALES } from '../types'
import { apiUrl } from '../api'

interface ParkingContextType {
  state: ParkingState
  registrarIngreso: (placa: string, tipo: TipoVehiculo, quienRecibe: string, horaEntrada: string) => void
  buscarVehiculo: (placa: string) => VehiculoActivo | undefined
  verificarMensualidad: (placa: string) => Mensualidad | undefined
  registrarSalida: (vehiculoId: string, quienCobra: string, totalCobrado: number, horasCalculadas: number, horaSalida?: string) => Recibo
  registrarMensualidad: (placa: string, nombre: string, telefono: string, tipo: TipoVehiculo, precio: number, quienRegistra: string, fechaPago?: string) => void
  actualizarMensualidad: (id: string, updates: Partial<Mensualidad>) => void
  eliminarMensualidad: (id: string) => void
  eliminarVehiculoActivo: (vehiculoId: string) => void
  eliminarRecibo: (reciboId: string) => void
  buscarRecibos: (placa?: string, fecha?: string) => Recibo[]
  obtenerContadorRecibos: (fecha: string) => number
  actualizarTarifas: (tipo: TipoVehiculo, horas12: number, mensual: number) => void
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined)

export const ParkingProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ParkingState>({
    vehiculosActivos: [],
    mensualidades: [],
    historialRecibos: [],
    contadorRecibos: {},
    tarifas: TARIFAS,
    tarifasMensuales: TARIFAS_MENSUALES
  })

  const saveTarifasToStorage = (tarifas: Record<TipoVehiculo, { horas12: number; porHora: number }>, tarifasMensuales: Record<TipoVehiculo, number>) => {
    try {
      localStorage.setItem('tarifas', JSON.stringify(tarifas))
      localStorage.setItem('tarifasMensuales', JSON.stringify(tarifasMensuales))
    } catch (err) {
      console.warn('No se pudo guardar tarifas en localStorage', err)
    }
  }

  // Cargar estado desde API si hay token
  useEffect(() => {
    try {
      const tarifasGuardadas = localStorage.getItem('tarifas')
      const mensualidadesGuardadas = localStorage.getItem('tarifasMensuales')
      setState(prev => ({
        ...prev,
        tarifas: tarifasGuardadas ? JSON.parse(tarifasGuardadas) : prev.tarifas,
        tarifasMensuales: mensualidadesGuardadas ? JSON.parse(mensualidadesGuardadas) : prev.tarifasMensuales
      }))
    } catch (err) {
      console.warn('Error al leer tarifas locales', err)
    }

    const token = localStorage.getItem('authToken')
    if (!token) return
    fetch(apiUrl('/api/state'), {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      setState(prev => ({
        ...prev,
        vehiculosActivos: data.vehiculos || [],
        mensualidades: data.mensualidades || [],
        historialRecibos: data.recibos || [],
        contadorRecibos: data.contadorRecibos || {},
        tarifas: data.tarifas || prev.tarifas,
        tarifasMensuales: data.tarifasMensuales || prev.tarifasMensuales
      }))
    }).catch(err => console.error('state load', err))
  }, [])

  const registrarIngreso = useCallback((placa: string, tipo: TipoVehiculo, quienRecibe: string, horaEntrada: string) => {
    const nuevo: VehiculoActivo = {
      id: `vh-${Date.now()}`,
      placa: placa.toUpperCase(),
      tipo,
      horaEntrada,
      quienRecibe,
      estado: 'ACTIVO'
    }
    setState(prev => ({ ...prev, vehiculosActivos: [...prev.vehiculosActivos, nuevo] }))

    const token = localStorage.getItem('authToken')
    if (token) {
      fetch(apiUrl('/api/vehiculos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(nuevo)
      }).catch(e => console.error('save vehiculo', e))
    }
  }, [])

  const buscarVehiculo = useCallback((placa: string): VehiculoActivo | undefined => {
    return state.vehiculosActivos.find(v => v.placa.toUpperCase() === placa.toUpperCase())
  }, [state.vehiculosActivos])

  const verificarMensualidad = useCallback((placa: string): Mensualidad | undefined => {
    const hoy = new Date().toISOString().split('T')[0]
    return state.mensualidades.find(
      m => m.placa.toUpperCase() === placa.toUpperCase() && m.fechaVencimiento >= hoy
    )
  }, [state.mensualidades])

  const registrarSalida = useCallback((vehiculoId: string, quienCobra: string, totalCobrado: number, horasCalculadas: number, horaSalida?: string): Recibo => {
    const vehiculo = state.vehiculosActivos.find(v => v.id === vehiculoId)
    if (!vehiculo) throw new Error('Vehículo no encontrado')

    // Usar hora de salida proporcionada o la actual
    const horaSalidaIso = horaSalida || new Date().toISOString()
    const ahora = new Date(horaSalidaIso)
    const fecha = horaSalidaIso.split('T')[0]
    const hora = horaSalidaIso.split('T')[1]?.slice(0, 5) || ahora.toTimeString().split(' ')[0]
    
    // Generar número de recibo
    const contador = (state.contadorRecibos[fecha] || 0) + 1
    const numeroRecibo = `RET-${fecha.replace(/-/g, '')}-${String(contador).padStart(4, '0')}`

    const recibo: Recibo = {
      id: `rec-${Date.now()}`,
      numeroRecibo,
      tipo: 'POR_HORAS',
      placa: vehiculo.placa,
      tipoVehiculo: vehiculo.tipo,
      fechaEmision: fecha,
      horaEmision: hora,
      totalPagado: totalCobrado,
      quienAtendio: quienCobra,
      horaEntrada: vehiculo.horaEntrada,
      horaSalida: horaSalidaIso,
      horasCalculadas
    }

    setState(prev => ({
      ...prev,
      vehiculosActivos: prev.vehiculosActivos.filter(v => v.id !== vehiculoId),
      historialRecibos: [...prev.historialRecibos, recibo],
      contadorRecibos: {
        ...prev.contadorRecibos,
        [fecha]: contador
      }
    }))

    // Persistir en backend
    const token = localStorage.getItem('authToken')
    if (token) {
      const payload = { ...recibo, idVehiculo: vehiculoId }
      fetch(apiUrl('/api/recibos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      }).catch(e => console.error('save recibo', e))
    }

    return recibo
  }, [state])

  const registrarMensualidad = useCallback((placa: string, nombre: string, telefono: string, tipo: TipoVehiculo, precio: number, quienRegistra: string, fechaPago?: string) => {
    const fechaInicio = fechaPago ? new Date(`${fechaPago}T00:00:00`) : new Date()
    const fechaPagoIso = fechaInicio.toISOString().split('T')[0]
    const vencimiento = new Date(fechaInicio.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const mensualidad: Mensualidad = {
      id: `mens-${Date.now()}`,
      placa: placa.toUpperCase(),
      nombre,
      telefono,
      tipo,
      precio,
      fechaPago: fechaPagoIso,
      fechaVencimiento: vencimiento,
      quienRegistra,
      estado: 'VIGENTE'
    }

    const fecha = fechaPagoIso
    const contador = (state.contadorRecibos[fecha] || 0) + 1
    const numeroRecibo = `RET-${fecha.replace(/-/g, '')}-${String(contador).padStart(4, '0')}`

    const recibo: Recibo = {
      id: `rec-${Date.now()}`,
      numeroRecibo,
      tipo: 'MENSUALIDAD',
      placa: mensualidad.placa,
      tipoVehiculo: mensualidad.tipo,
      fechaEmision: fecha,
      horaEmision: new Date().toTimeString().split(' ')[0],
      totalPagado: precio,
      quienAtendio: quienRegistra,
      nombreCliente: nombre,
      telefono,
      fechaVencimiento: vencimiento
    }

    setState(prev => ({
      ...prev,
      mensualidades: [...prev.mensualidades, mensualidad],
      historialRecibos: [...prev.historialRecibos, recibo],
      contadorRecibos: {
        ...prev.contadorRecibos,
        [fecha]: contador
      }
    }))

      const token = localStorage.getItem('authToken')
      if (token) {
        fetch(apiUrl('/api/mensualidades'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(mensualidad)
        }).catch(e => console.error('save mensualidad', e))

        fetch(apiUrl('/api/recibos'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(recibo)
        }).catch(e => console.error('save recibo mens', e))
      }
  }, [state])

  const actualizarMensualidad = useCallback((id: string, updates: Partial<Mensualidad>) => {
    setState(prev => ({
      ...prev,
      mensualidades: prev.mensualidades.map(m => 
        m.id === id ? { ...m, ...updates } : m
      )
    }))
    const token = localStorage.getItem('authToken')
    if (token) {
      fetch(apiUrl(`/api/mensualidades/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates)
      }).catch(e => console.error('update mens', e))
    }
  }, [])

  const eliminarMensualidad = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      mensualidades: prev.mensualidades.filter(m => m.id !== id)
    }))
    const token = localStorage.getItem('authToken')
    if (token) {
      fetch(apiUrl(`/api/mensualidades/${id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(e => console.error('del mens', e))
    }
  }, [])

  const actualizarTarifas = useCallback((tipo: TipoVehiculo, horas12: number, mensual: number) => {
    const porHora = Math.round(horas12 / 4)
    setState(prev => {
      const nuevasTarifas = {
        ...prev.tarifas,
        [tipo]: { horas12, porHora }
      }
      const nuevasMensuales = {
        ...prev.tarifasMensuales,
        [tipo]: mensual
      }
      saveTarifasToStorage(nuevasTarifas, nuevasMensuales)
      return {
        ...prev,
        tarifas: nuevasTarifas,
        tarifasMensuales: nuevasMensuales
      }
    })

    const token = localStorage.getItem('authToken')
    if (token) {
      fetch(apiUrl(`/api/tarifas/${encodeURIComponent(tipo)}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ horas12, porHora, mensual })
      }).catch(e => console.error('update tarifas', e))
    }
  }, [])

  const buscarRecibos = useCallback((placa?: string, fecha?: string): Recibo[] => {
    return state.historialRecibos.filter(r => {
      const placaMatch = !placa || r.placa.toUpperCase().includes(placa.toUpperCase())
      const fechaMatch = !fecha || r.fechaEmision === fecha
      return placaMatch && fechaMatch
    }).sort((a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime())
  }, [state.historialRecibos])

  const obtenerContadorRecibos = useCallback((fecha: string): number => {
    return state.contadorRecibos[fecha] || 0
  }, [state.contadorRecibos])

  const eliminarVehiculoActivo = useCallback((vehiculoId: string) => {
    setState(prev => ({
      ...prev,
      vehiculosActivos: prev.vehiculosActivos.filter(v => v.id !== vehiculoId)
    }))
    const token = localStorage.getItem('authToken')
    if (token) {
      fetch(apiUrl(`/api/vehiculos/${vehiculoId}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(e => console.error('del veh', e))
    }
  }, [])

  const eliminarRecibo = useCallback((reciboId: string) => {
    setState(prev => ({
      ...prev,
      historialRecibos: prev.historialRecibos.filter(r => r.id !== reciboId)
    }))
    const token = localStorage.getItem('authToken')
    if (token) {
      fetch(apiUrl(`/api/recibos/${reciboId}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(e => console.error('del rec', e))
    }
  }, [])

  const value: ParkingContextType = {
    state,
    registrarIngreso,
    buscarVehiculo,
    verificarMensualidad,
    registrarSalida,
    registrarMensualidad,
    actualizarMensualidad,
    eliminarMensualidad,
    actualizarTarifas,
    eliminarVehiculoActivo,
    eliminarRecibo,
    buscarRecibos,
    obtenerContadorRecibos
  }

  return (
    <ParkingContext.Provider value={value}>
      {children}
    </ParkingContext.Provider>
  )
}

export const useParking = () => {
  const context = useContext(ParkingContext)
  if (!context) {
    throw new Error('useParking debe usarse dentro de ParkingProvider')
  }
  return context
}
