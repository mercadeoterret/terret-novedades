'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [tipos, setTipos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [nuevoTipo, setNuevoTipo] = useState('')
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
    const [{ data: u }, { data: t }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('tipos_novedad').select('*').order('orden', { ascending: true }),
    ])
    setUsuarios(u || [])
    setTipos(t || [])
    setLoading(false)
  }

  const crearUsuario = async () => {
    setError('')
    setExito('')
    if (!form.email || !form.nombre || !form.password) { setError('Todos los campos son obligatorios'); return }
    const res = await fetch('/api/admin/crear-usuario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error al crear usuario') }
    else {
      setExito('Usuario creado correctamente')
      setForm({ email: '', nombre: '', password: '', rol: 'operador' })
      setShowForm(false)
      const { data: u } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
      setUsuarios(u || [])
    }
  }

  const toggleActivo = async (id: string, activo: boolean) => {
    await supabase.from('profiles').update({ activo: !activo }).eq('id', id)
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: !activo } : u))
  }

  const agregarTipo = async () => {
    if (!nuevoTipo.trim()) return
    const { data } = await supabase.from('tipos_novedad').insert({ nombre: nuevoTipo.trim(), orden: tipos.length + 1 }).select('*').single()
    if (data) setTipos(prev => [...prev, data])
    setNuevoTipo('')
  }

  const toggleTipo = async (id: string, activo: boolean) => {
    await supabase.from('tipos_novedad').update({ activo: !activo }).eq('id', id)
    setTipos(prev => prev.map(t => t.id === id ? { ...t, activo: !activo } : t))
  }

  const eliminarTipo = async (id: string, nombre: string) => {
    if (nombre === 'Otros') return
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    await supabase.from('tipos_novedad').delete().eq('id', id)
    setTipos(prev => prev.filter(t => t.id !== id))
  }

  if (loading) return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>

  return (
    <div className="page">
      <div className="container-sm">
        <div className="page-header">
          <div className="btn-group">
            <button className="btn btn-back" onClick={() => router.push('/novedades')}>← Volver</button>
            <h1 className="page-title">Administración</h1>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nuevo usuario</button>
        </div>

        {exito && <p className="msg-success">{exito}</p>}

        <div className="admin-grid">
          {/* Usuarios */}
          <div>
            <h2 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#9ca3af', marginBottom: '0.75rem' }}>USUARIOS</h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {['Nombre', 'Rol', 'Estado', ''].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id} style={{ cursor: 'default' }}>
                      <td style={{ fontWeight: 500 }}>{u.nombre}</td>
                      <td><span className="badge" style={{ background: u.rol === 'admin' ? '#1e1b4b' : '#1f2937', color: u.rol === 'admin' ? '#a78bfa' : '#9ca3af' }}>{u.rol}</span></td>
                      <td><span className="badge" style={{ background: u.activo ? '#052e16' : '#1f2937', color: u.activo ? '#4ade80' : '#6b7280' }}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                      <td>{u.id !== perfil?.id && <button className={`btn ${u.activo ? 'btn-danger' : 'btn-success'}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }} onClick={() => toggleActivo(u.id, u.activo)}>{u.activo ? 'Desactivar' : 'Activar'}</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile user list */}
            <div className="desktop-only" style={{ display: 'none' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {usuarios.map(u => (
                <div key={u.id + 'm'} className="card-dark" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>{u.nombre}</p>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>{u.rol} · {u.activo ? 'Activo' : 'Inactivo'}</p>
                  </div>
                  {u.id !== perfil?.id && (
                    <button className={`btn ${u.activo ? 'btn-danger' : 'btn-success'}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }} onClick={() => toggleActivo(u.id, u.activo)}>
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tipos */}
          <div>
            <h2 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#9ca3af', marginBottom: '0.75rem' }}>TIPOS DE NOVEDAD</h2>
            <div className="card">
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input className="input" style={{ flex: 1 }} placeholder="Nuevo tipo..." value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarTipo()} />
                <button className="btn btn-primary" onClick={agregarTipo}>+ Agregar</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tipos.map(t => (
                  <div key={t.id} className="card-dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: t.activo ? '#fff' : '#6b7280', flex: 1 }}>
                      {t.nombre}{t.nombre === 'Otros' && <span style={{ fontSize: '0.7rem', color: '#6b7280', marginLeft: '0.5rem' }}>(fijo)</span>}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className={`btn ${t.activo ? 'btn-secondary' : 'btn-success'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }} onClick={() => toggleTipo(t.id, t.activo)}>
                        {t.activo ? 'Ocultar' : 'Mostrar'}
                      </button>
                      {t.nombre !== 'Otros' && (
                        <button className="btn btn-danger" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }} onClick={() => eliminarTipo(t.id, t.nombre)}>✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Nuevo usuario</h2>
            <div className="modal-form">
              <input className="input" placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
              <input className="input" type="email" placeholder="Correo" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <input className="input" type="password" placeholder="Contraseña" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              <select className="input" value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}>
                <option value="operador">Operador</option>
                <option value="admin">Admin</option>
              </select>
              {error && <p className="msg-error">{error}</p>}
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" style={{ flex: 1, padding: '0.875rem' }} onClick={crearUsuario}>Crear</button>
              <button className="btn btn-gray" style={{ flex: 1, padding: '0.875rem' }} onClick={() => { setShowForm(false); setError('') }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}