'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', nombre: '', password: '', rol: 'operador' })
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { fetchTodo() }, [])

  const fetchTodo = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (p?.rol !== 'admin') return router.push('/novedades')
    setPerfil(p)

    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
    setUsuarios(data || [])
    setLoading(false)
  }

  const crearUsuario = async () => {
    setError('')
    setExito('')
    if (!form.email || !form.nombre || !form.password) {
      setError('Todos los campos son obligatorios')
      return
    }

    const res = await fetch('/api/admin/crear-usuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Error al crear usuario')
    } else {
      setExito('Usuario creado correctamente')
      setForm({ email: '', nombre: '', password: '', rol: 'operador' })
      setShowForm(false)
      fetchTodo()
    }
  }

  const toggleActivo = async (id: string, activo: boolean) => {
    await supabase.from('profiles').update({ activo: !activo }).eq('id', id)
    fetchTodo()
  }

  const input = {
    width: '100%',
    background: '#1f2937',
    color: '#fff',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    outline: 'none',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => router.push('/novedades')}
              style={{ background: '#1f2937', border: 'none', color: '#9ca3af', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              ← Volver
            </button>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Usuarios</h1>
          </div>
          <button onClick={() => setShowForm(true)}
            style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}>
            + Nuevo usuario
          </button>
        </div>

        {exito && <p style={{ background: '#065f46', color: '#6ee7b7', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{exito}</p>}

        {/* Lista usuarios */}
        <div style={{ background: '#111827', borderRadius: '0.75rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#1f2937', color: '#9ca3af' }}>
                {['Nombre', 'Rol', 'Estado', 'Acción'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} style={{ borderTop: '1px solid #1f2937' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{u.nombre}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ background: u.rol === 'admin' ? '#1e1b4b' : '#1f2937', color: u.rol === 'admin' ? '#a78bfa' : '#9ca3af', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem' }}>
                      {u.rol}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ background: u.activo ? '#052e16' : '#1f2937', color: u.activo ? '#4ade80' : '#6b7280', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem' }}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {u.id !== perfil?.id && (
                      <button onClick={() => toggleActivo(u.id, u.activo)}
                        style={{ background: u.activo ? '#7f1d1d' : '#065f46', color: u.activo ? '#fca5a5' : '#6ee7b7', border: 'none', borderRadius: '0.375rem', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '0.75rem' }}>
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nuevo usuario */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#111827', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '420px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Nuevo usuario</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} style={input} />
              <input placeholder="Correo" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={input} />
              <input placeholder="Contraseña" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={input} />
              <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})} style={input}>
                <option value="operador">Operador</option>
                <option value="admin">Admin</option>
              </select>
              {error && <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={crearUsuario}
                style={{ flex: 1, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: 600, cursor: 'pointer' }}>
                Crear
              </button>
              <button onClick={() => { setShowForm(false); setError('') }}
                style={{ flex: 1, background: '#374151', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}