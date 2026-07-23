'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
    } else {
      router.push('/novedades')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Terret Novedades</h1>
        <p className="login-subtitle">Gestión interna de casos</p>
        <div className="modal-form">
          <div className="form-group">
            <label className="form-label">Correo</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@terret.co" />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" />
          </div>
          {error && <p className="msg-error">{error}</p>}
          <button className="btn btn-primary btn-lg" onClick={handleLogin} disabled={loading}>
            {loading ? 'Entrando...' : 'Ingresar'}
          </button>
        </div>
      </div>
    </div>
  )
}