# 🅿️ Sistema de Gestión de Parqueadero

Aplicación web profesional para administración integral de parqueadero, construida con React, TypeScript y Vite.

## ✨ Características principales

### 1. **Control Diario**
- Registro de ingreso de vehículos (placa, tipo, hora automática)
- Búsqueda de vehículos en patio
- Tabla de vehículos activos
- Alerta automática si el vehículo tiene mensualidad vigente

### 2. **Lógica de Cobro Inteligente**
Implementa cálculos automáticos con 4 reglas:
- **Colchón de 15 minutos**: Redondea tiempo hacia arriba si pasa los 15 min
- **Precio por hora suelta**: tarifa de 12 horas ÷ 4
- **Límite de 4 horas**: Cobro de 12h completas si hay más de 4 horas sueltas
- **Límite de 16 horas**: Máximo de 24 horas (2 bloques de 12h)

### 3. **Módulo de Mensualidades**
- Registro de clientes mensuales
- Tarifas automáticas por tipo de vehículo
- Validación de mensualidades vigentes
- Opción de renovar o eliminar

### 4. **Recibos y Historial**
- Generación automática de recibos (formato: RET-YYYYMMDD-XXXX)
- Búsqueda por placa y fecha
- Detalles completos de cada transacción
- Historial completo de cobros y mensualidades

## 📊 Tarifas por defecto

### Por horas
| Tipo | 12h | Por hora |
|------|-----|---------|
| Particular | $6.000 | $1.500 |
| NH | $8.000 | $2.000 |
| Camión Sencillo | $10.000 | $2.500 |
| Doble Troque | $12.000 | $3.000 |

### Mensualidades (30 días)
| Tipo | Precio |
|------|--------|
| Particular | $130.000 |
| NH | $210.000 |
| Camión Sencillo | $270.000 |
| Doble Troque | $320.000 |

## 🚀 Instalación y uso

### Requisitos
- Node.js 16+
- npm 8+

### Pasos
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar build
npm run preview
```

## 📁 Estructura del proyecto

```
src/
├── App.tsx                    # Componente principal con navegación
├── index.css                  # Estilos globales responsivos
├── types.ts                   # Definiciones de tipos TypeScript
├── context/
│   └── ParkingContext.tsx     # Estado global y lógica de negocio
├── pages/
│   ├── ControlDiario.tsx      # Pantalla de ingreso/búsqueda
│   ├── LiquidarCobros.tsx     # Pantalla de cálculo y cobro
│   ├── Mensualidades.tsx      # Gestión de mensualidades
│   └── HistorialRecibos.tsx   # Búsqueda y filtrado de recibos
└── utils/
    └── calculos.ts            # Funciones de cálculo de tarifas
```

## 🎨 Interfaz

- **Diseño responsivo**: Funciona perfectamente en móvil, tablet y desktop
- **Tema claro y moderno**: Colores en azul (#2563eb) y gris (#475569)
- **Accesibilidad**: Navegación clara con 4 pantallas principales
- **Indicadores visuales**: Badges para estados (VIGENTE/VENCIDA)

## 🔧 Administradores disponibles
- Juan
- María
- Carlos
- Ana
- Pedro

## 📝 Notas de desarrollo

- El tiempo se recalcula cada minuto en la pantalla de liquidación
- Los recibos generan números únnicos automáticamente
- Las mensualidades pueden renovarse manualmente
- El estado se mantiene en memoria (usar Context API)

## 📞 Soporte

Para cambios en tarifas, administradores o tipos de vehículos, editar:
- Tarifas: `src/types.ts` (TARIFAS, TARIFAS_MENSUALES)
- Administradores: `src/pages/*.tsx` (ADMINISTRADORES array)
- Tipos de vehículos: `src/types.ts` (TipoVehiculo type)
