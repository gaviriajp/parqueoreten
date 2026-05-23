import { useEffect, useState } from 'react'
import { ParkingProvider } from './context/ParkingContext'
import ControlDiario from './pages/ControlDiario'
import LiquidarCobros from './pages/LiquidarCobros'
import Mensualidades from './pages/Mensualidades'
import HistorialRecibos from './pages/HistorialRecibos'
import Administracion from './pages/Administracion'
import Login from './pages/Login'

type Pantalla = 'inicio' | 'liquidar' | 'mensualidades' | 'recibos' | 'tarifas'

function AppContent({ onLogout, userEmail }: { onLogout: () => void; userEmail: string | null }) {
  const [pantalla, setPantalla] = useState<Pantalla>('inicio')
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<string | null>(null)

  return (
    <div className="app-shell">
      {/* Header con navegación */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">🅿️ Gestor de Parqueadero</h1>
          <nav className="nav-principal">
            <button
              className={`nav-btn ${pantalla === 'inicio' ? 'active' : ''}`}
              onClick={() => {
                setPantalla('inicio')
                setVehiculoSeleccionado(null)
              }}
            >
              Control Diario
            </button>
            <button
              className={`nav-btn ${pantalla === 'mensualidades' ? 'active' : ''}`}
              onClick={() => setPantalla('mensualidades')}
            >
              Mensualidades
            </button>
            <button
              className={`nav-btn ${pantalla === 'recibos' ? 'active' : ''}`}
              onClick={() => setPantalla('recibos')}
            >
              Historial
            </button>
            {userEmail === 'administrador@parqueo.com' && (
              <button
                className={`nav-btn ${pantalla === 'tarifas' ? 'active' : ''}`}
                onClick={() => setPantalla('tarifas')}
              >
                Administración
              </button>
            )}
            <button className="nav-btn logout-button" onClick={onLogout}>
              Cerrar sesión
            </button>
          </nav>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="main-content">
        {pantalla === 'inicio' && vehiculoSeleccionado === null && (
          <ControlDiario
            onSeleccionarVehiculo={(vehiculoId) => {
              setVehiculoSeleccionado(vehiculoId)
              setPantalla('liquidar')
            }}
          />
        )}

        {pantalla === 'liquidar' && vehiculoSeleccionado && (
          <LiquidarCobros
            vehiculoId={vehiculoSeleccionado}
            onRegresarListado={() => {
              setVehiculoSeleccionado(null)
              setPantalla('inicio')
            }}
          />
        )}

        {pantalla === 'mensualidades' && <Mensualidades />}
        {pantalla === 'recibos' && <HistorialRecibos />}
        {pantalla === 'tarifas' && userEmail === 'administrador@parqueo.com' && <Administracion />}
      </main>

    </div>
  )
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'))
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setUserEmail(null)
      return
    }
    try {
      const payload = token.split('.')[1]
      const decoded = JSON.parse(atob(payload))
      setUserEmail(decoded.email || null)
    } catch (error) {
      setUserEmail(null)
    }
  }, [token])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    setToken(null)
    setUserEmail(null)
  }

  if (!token) {
    return (
      <Login onLogin={(t) => { setToken(t) }} />
    )
  }

  return (
    <ParkingProvider>
      <AppContent onLogout={handleLogout} userEmail={userEmail} />
    </ParkingProvider>
  )
}

export default App
