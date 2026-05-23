interface CalculoCobro {
  horasCalculadas: number
  totalCobro: number
  detalles: string
}

export function calcularCobro(horaEntrada: string, horaActual?: Date): CalculoCobro {
  const ahora = horaActual || new Date()
  const fechaEntrada = new Date(horaEntrada)
  
  // Calcular minutos totales
  const minutosTotales = Math.floor((ahora.getTime() - fechaEntrada.getTime()) / 1000 / 60)
  
  // Regla 1: Colchón de 15 minutos
  const horasEnteras = Math.floor(minutosTotales / 60)
  const minutosRestantes = minutosTotales % 60
  
  let horasACobrar = minutosRestantes > 15 ? horasEnteras + 1 : horasEnteras
  if (horasACobrar === 0) horasACobrar = 1 // Mínimo 1 hora
  
  return {
    horasCalculadas: horasACobrar,
    totalCobro: 0, // Se calcula en calcularTotal
    detalles: `${horasEnteras}h ${minutosRestantes}m → ${horasACobrar}h a cobrar`
  }
}

export function calcularTotal(tarifa: { horas12: number; porHora: number }, horasACobrar: number): CalculoCobro {
  const precioHora = tarifa.porHora

  const dias = Math.floor(horasACobrar / 24)
  const horasRestantes = horasACobrar % 24
  const bloques12h = Math.floor(horasRestantes / 12)
  const horasSueltas = horasRestantes % 12

  let total = dias * tarifa.horas12 * 2
  total += bloques12h * tarifa.horas12

  if (horasSueltas > 4) {
    // Si hay más de 4 horas sueltas, cobrar una fracción de 12 horas completa
    total += tarifa.horas12
  } else {
    // Si hay 4 o menos horas sueltas, cobrar por hora
    total += horasSueltas * precioHora
  }

  const partesDetalles = []
  if (dias > 0) {
    partesDetalles.push(`${dias} día${dias > 1 ? 's' : ''} × $${(tarifa.horas12 * 2).toLocaleString('es-CO')}`)
  }
  if (bloques12h > 0) {
    partesDetalles.push(`${bloques12h} bloque${bloques12h > 1 ? 's' : ''} × $${tarifa.horas12.toLocaleString('es-CO')}`)
  }
  if (horasSueltas > 0 || partesDetalles.length === 0) {
    partesDetalles.push(`${horasSueltas}h sueltas`)
  }

  return {
    horasCalculadas: horasACobrar,
    totalCobro: total,
    detalles: partesDetalles.join(' + ')
  }
}

export function calcularCobrosCompleto(horaEntrada: string, tarifa: { horas12: number; porHora: number }, horaSalida?: string | Date): CalculoCobro {
  const horaSalidaDate = typeof horaSalida === 'string' ? new Date(horaSalida) : horaSalida
  const paso1 = calcularCobro(horaEntrada, horaSalidaDate)
  const paso2 = calcularTotal(tarifa, paso1.horasCalculadas)
  
  return {
    horasCalculadas: paso2.horasCalculadas,
    totalCobro: paso2.totalCobro,
    detalles: paso2.detalles
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function tiempoTranscurrido(horaEntrada: string, horaActual?: Date): string {
  const ahora = horaActual || new Date()
  const fecha = new Date(horaEntrada)
  const minutosTotales = Math.floor((ahora.getTime() - fecha.getTime()) / 1000 / 60)
  const dias = Math.floor(minutosTotales / 60 / 24)
  const horas = Math.floor((minutosTotales % (24 * 60)) / 60)
  const minutos = minutosTotales % 60

  const partes = []
  if (dias > 0) partes.push(`${dias}d`)
  if (horas > 0 || dias > 0) partes.push(`${horas}h`)
  partes.push(`${minutos}m`)

  return partes.join(' ')
}

export function formatearDuracionHoras(horasCalculadas: number): string {
  if (horasCalculadas <= 0) return '0h'
  const dias = Math.floor(horasCalculadas / 24)
  const horas = horasCalculadas % 24
  if (dias > 0) {
    return horas > 0 ? `${dias}d ${horas}h` : `${dias}d`
  }
  return `${horas}h`
}

export function esMensualidadVigente(fechaVencimiento: string): boolean {
  const hoy = new Date().toISOString().split('T')[0]
  return fechaVencimiento >= hoy
}
