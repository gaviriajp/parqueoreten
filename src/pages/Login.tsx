import { useState } from 'react'
import type { FormEvent } from 'react'

interface Props {
  onLogin: (token: string) => void
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error || 'Login fallido')
        return
      }
      const data = await res.json()
      localStorage.setItem('authToken', data.token)
      onLogin(data.token)
    } catch (err) {
      setError('Error de red')
    }
  }

  return (
    <div className="page-grid">
      <section className="panel card">
        <div className="section-header">
          <h2>Iniciar sesión</h2>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Correo
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Contraseña
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-actions full-width">
            <button className="primary-button" type="submit">Entrar</button>
          </div>
        </form>
      </section>
    </div>
  )
}
