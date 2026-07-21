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
    <div style={{
      minHeight: '100vh',
      background: '#030712',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#111827',
        padding: '2rem',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
            Terret Novedades
          </h1>
          <p style={{ color: '#9ca3af', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            Gestión interna de casos
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@terret.co"
              style={{
                width: '100%',
                background: '#1f2937',
                color: '#fff',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              style={{
                width: '100%',
                background: '#1f2937',
                color: '#fff',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#6b21a8' : '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Entrando...' : 'Ingresar'}
          </button>
        </div>
      </div>
    </div>
  )
}