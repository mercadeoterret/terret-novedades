'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const ESTADOS: Record<string, { label: string; color: string }> = {
  nuevo: { label: 'Nuevo', color: '#4b5563' },
  en_gestion: { label: 'En gestión', color: '#d97706' },
  en_espera: { label: 'En espera', color: '#2563eb' },
  resuelto: { label: 'Resuelto', color: '#16a34a' },
}

export default function NovedadesPage() {
  const [novedades, setNovedades] = useState<any[]>([])
  const [tipos, setTipos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroResponsabilidad, setFiltroResponsabilidad] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [tipoOtrosEspecificar, setTipoOtrosEspecificar] = useState('')
  const [form, setForm] = useState({
    numero_orden: '', cliente: '', tipo: '', descripcion: '',
    canal: 'whatsapp', responsabilidad: 'nuestra', costo_reproceso: 0,
  })
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { fetchTodo() }, [])

  const fetchTodo = async () => {
    const [{ data: n }, { data: t }] = await Promise.all([
      supabase.from('novedades').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('tipos_novedad').select('*').eq('activo', true).order('orden', { ascending: true }),
    ])
    setNovedades(n || [])
    setTipos(t || [])
    if (t && t.length > 0) setForm(prev => ({ ...prev, tipo: t[0].nombre }))
    setLoading(false)
  }

  const novedadesFiltradas = novedades
    .filter(n => filtroEstado === 'todos' || n.estado === filtroEstado)
    .filter(n => filtroResponsabilidad === 'todos' || n.responsabilidad === filtroResponsabilidad)
    .filter(n => !busqueda ||
      n.numero_orden?.toLowerCase().includes(busqueda.toLowerCase()) ||
      n.cliente?.toLowerCase().includes(busqueda.toLowerCase())
    )

  const handleSubmit = async () => {
    const tipoFinal = form.tipo === 'Otros' && tipoOtrosEspecificar.trim()
      ? `Otros: ${tipoOtrosEspecificar.trim()}` : form.tipo
    const { data: nueva } = await supabase.from('novedades').insert([{ ...form, tipo: tipoFinal, estado: 'nuevo' }]).select('*').single()
    if (nueva) setNovedades(prev => [nueva, ...prev])
    setShowForm(false)
    setTipoOtrosEspecificar('')
    setForm({ numero_orden: '', cliente: '', tipo: tipos[0]?.nombre || '', descripcion: '', canal: 'whatsapp', responsabilidad: 'nuestra', costo_reproceso: 0 })
  }

  const handleEstado = async (id: string, estado: string) => {
    await supabase.from('novedades').update({ estado, updated_at: new Date().toISOString() }).eq('id', id)
    setNovedades(prev => prev.map(n => n.id === id ? { ...n, estado } : n))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="page">
      <div className="container">

        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Novedades</h1>
          <div className="btn-group">
            <button className="btn btn-secondary" onClick={() => router.push('/reportes')}>
              <span className="btn-text">Reportes</span>
              <span className="btn-icon-only">📊</span>
            </button>
            <button className="btn btn-secondary" onClick={() => router.push('/admin')}>
              <span className="btn-text">Admin</span>
              <span className="btn-icon-only">⚙️</span>
            </button>
            <button className="btn btn-primary desktop-only" onClick={() => setShowForm(true)}>+ Nueva novedad</button>
            <button className="btn btn-gray" onClick={handleLogout}>Salir</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {Object.entries(ESTADOS).map(([key, val]) => (
            <div key={key} className={`stat-card ${filtroEstado !== 'todos' && filtroEstado !== key ? 'dimmed' : ''}`}
              style={{ borderLeft: `4px solid ${val.color}` }}
              onClick={() => setFiltroEstado(filtroEstado === key ? 'todos' : key)}>
              <p className="stat-label">{val.label}</p>
              <p className="stat-value">{novedades.filter(n => n.estado === key).length}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="filters">
          <input className="filter-search" placeholder="Buscar orden o cliente..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <select className="filter-select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="nuevo">Nuevo</option>
            <option value="en_gestion">En gestión</option>
            <option value="en_espera">En espera</option>
            <option value="resuelto">Resuelto</option>
          </select>
          <select className="filter-select" value={filtroResponsabilidad} onChange={e => setFiltroResponsabilidad(e.target.value)}>
            <option value="todos">Toda resp.</option>
            <option value="nuestra">Nuestra</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>

        {/* Tabla desktop */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Cargando...</div>
        ) : novedadesFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>No hay novedades</div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {['Orden', 'Cliente', 'Tipo', 'Canal', 'Responsabilidad', 'Estado', 'Costo', 'Fecha', 'Cambiar estado'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {novedadesFiltradas.map(n => (
                    <tr key={n.id} onClick={() => router.push(`/novedades/${n.id}`)}>
                      <td style={{ fontFamily: 'monospace' }}>{n.numero_orden || '-'}</td>
                      <td>{n.cliente || '-'}</td>
                      <td>{n.tipo}</td>
                      <td style={{ textTransform: 'capitalize' }}>{n.canal}</td>
                      <td style={{ textTransform: 'capitalize' }}>{n.responsabilidad}</td>
                      <td><span className="badge" style={{ background: ESTADOS[n.estado]?.color }}>{ESTADOS[n.estado]?.label}</span></td>
                      <td>${n.costo_reproceso?.toLocaleString('es-CO')}</td>
                      <td style={{ color: '#9ca3af' }}>{new Date(n.created_at).toLocaleDateString('es-CO')}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <select value={n.estado} onChange={e => handleEstado(n.id, e.target.value)}
                          style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                          {Object.entries(ESTADOS).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards mobile */}
            <div className="mobile-cards">
              {novedadesFiltradas.map(n => (
                <div key={n.id + 'm'} className="novedad-card" style={{ borderLeft: `4px solid ${ESTADOS[n.estado]?.color}` }}
                  onClick={() => router.push(`/novedades/${n.id}`)}>
                  <div className="novedad-card-header">
                    <div>
                      <p className="novedad-card-title">{n.cliente || 'Sin cliente'}</p>
                      <p className="novedad-card-order">{n.numero_orden || 'Sin orden'}</p>
                    </div>
                    <span className="badge" style={{ background: ESTADOS[n.estado]?.color }}>{ESTADOS[n.estado]?.label}</span>
                  </div>
                  <p className="novedad-card-tipo">{n.tipo}</p>
                  <div className="novedad-card-footer">
                    <span className="novedad-card-meta">{n.canal} · {n.responsabilidad}</span>
                    <span className="novedad-card-meta">{new Date(n.created_at).toLocaleDateString('es-CO')}</span>
                  </div>
                  {n.costo_reproceso > 0 && <p className="novedad-card-costo">Costo: ${n.costo_reproceso?.toLocaleString('es-CO')}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* FAB mobile */}
      <button className="fab" onClick={() => setShowForm(true)}>+</button>

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Nueva novedad</h2>
            <div className="modal-form">
              <input className="input" placeholder="Número de orden" value={form.numero_orden} onChange={e => setForm({...form, numero_orden: e.target.value})} />
              <input className="input" placeholder="Cliente" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})} />
              <select className="input" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                {tipos.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
              </select>
              {form.tipo === 'Otros' && (
                <input className="input input-highlight" placeholder="Especifica el tipo..." value={tipoOtrosEspecificar} onChange={e => setTipoOtrosEspecificar(e.target.value)} />
              )}
              <textarea className="textarea" placeholder="Descripción del caso" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} style={{ height: '80px' }} />
              <select className="input" value={form.canal} onChange={e => setForm({...form, canal: e.target.value})}>
                <option value="whatsapp">WhatsApp</option>
                <option value="llamada">Llamada</option>
                <option value="instagram">Instagram</option>
                <option value="correo">Correo</option>
              </select>
              <select className="input" value={form.responsabilidad} onChange={e => setForm({...form, responsabilidad: e.target.value})}>
                <option value="nuestra">Responsabilidad nuestra</option>
                <option value="cliente">Responsabilidad del cliente</option>
              </select>
              <input className="input" type="number" placeholder="Costo del reproceso ($)" value={form.costo_reproceso} onChange={e => setForm({...form, costo_reproceso: Number(e.target.value)})} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" style={{ flex: 1, padding: '0.875rem' }} onClick={handleSubmit}>Guardar</button>
              <button className="btn btn-gray" style={{ flex: 1, padding: '0.875rem' }} onClick={() => { setShowForm(false); setTipoOtrosEspecificar('') }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}