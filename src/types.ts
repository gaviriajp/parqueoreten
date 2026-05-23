// Tipos de vehículos
export type TipoVehiculo = 'Particular' | 'NH' | 'Camión Sencillo' | 'Doble Troque'

// Vehículos activos en el parqueadero
export interface VehiculoActivo {
  id: string
  placa: string
  tipo: TipoVehiculo
  horaEntrada: string // ISO string
  quienRecibe: string
  estado: 'ACTIVO' | 'LIQUIDADO'
}

// Mensualidades
export interface Mensualidad {
  id: string
  placa: string
  nombre: string
  telefono: string
  tipo: TipoVehiculo
  precio: number
  fechaPago: string // YYYY-MM-DD
  fechaVencimiento: string // YYYY-MM-DD
  quienRegistra: string
  estado: 'VIGENTE' | 'VENCIDA'
}

// Recibos
export interface Recibo {
  id: string
  numeroRecibo: string // RET-YYYYMMDD-XXXX
  tipo: 'POR_HORAS' | 'MENSUALIDAD'
  placa: string
  tipoVehiculo: TipoVehiculo
  fechaEmision: string // YYYY-MM-DD
  horaEmision: string // HH:MM:SS
  totalPagado: number
  quienAtendio: string
  
  // Detalles por horas
  horaEntrada?: string
  horaSalida?: string
  horasCalculadas?: number
  
  // Detalles de mensualidad
  nombreCliente?: string
  telefono?: string
  fechaVencimiento?: string
}

// Estado global de la aplicación
export interface ParkingState {
  vehiculosActivos: VehiculoActivo[]
  mensualidades: Mensualidad[]
  historialRecibos: Recibo[]
  contadorRecibos: Record<string, number> // { "20260518": 5 }
  tarifas: Record<TipoVehiculo, { horas12: number; porHora: number }>
  tarifasMensuales: Record<TipoVehiculo, number>
}

// Tarifas
export const TARIFAS: Record<TipoVehiculo, { horas12: number; porHora: number }> = {
  'Particular': { horas12: 6000, porHora: 1500 },
  'NH': { horas12: 8000, porHora: 2000 },
  'Camión Sencillo': { horas12: 10000, porHora: 2500 },
  'Doble Troque': { horas12: 12000, porHora: 3000 }
}

export const TARIFAS_MENSUALES: Record<TipoVehiculo, number> = {
  'Doble Troque': 320000,
  'Camión Sencillo': 270000,
  'NH': 210000,
  'Particular': 130000
}
