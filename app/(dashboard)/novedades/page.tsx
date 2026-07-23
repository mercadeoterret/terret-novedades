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
  const [isMobile, setIsMobile] = useState(false)
  const [form, setForm] = useState({
    numero_orden: '',
    cliente: '',
    tipo: '',
    descripcion: '',
    canal: 'whatsapp',
    responsabilidad: 'nuestra',
    costo_reproceso: 0,
  })
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchTodo()
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
      ? `Otros: ${tipoOtrosEspecificar.trim()}`
      : form.tipo

    const { data: nueva } = await supabase.from('novedades').insert([{
      ...form, tipo: tipoFinal, estado: 'nuevo',
    }]).select('*').single()

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

  const input = {
    width: '100%',
    background: '#1f2937',
    color: '#fff',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const selectStyle = {
    background: '#111827',
    color: '#fff',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '1rem' : '1.5rem 1rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700 }}>Novedades</h1>
          {isMobile ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => router.push('/reportes')} style={{ background: '#1f2937', color: '#9ca3af', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                📊
              </button>
              <button onClick={() => router.push('/admin')} style={{ background: '#1f2937', color: '#9ca3af', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                ⚙️
              </button>
              <button onClick={handleLogout} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                Salir
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => router.push('/reportes')} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>Reportes</button>
              <button onClick={() => router.push('/admin')} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>Admin</button>
              <button onClick={() => setShowForm(true)} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}>+ Nueva novedad</button>
              <button onClick={handleLogout} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>Salir</button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: isMobile ? '0.5rem' : '1rem', marginBottom: '1.25rem' }}>
          {Object.entries(ESTADOS).map(([key, val]) => (
            <div key={key} onClick={() => setFiltroEstado(filtroEstado === key ? 'todos' : key)}
              style={{ background: '#111827', borderRadius: '0.75rem', padding: isMobile ? '0.75rem' : '1rem', borderLeft: `4px solid ${val.color}`, cursor: 'pointer', opacity: filtroEstado !== 'todos' && filtroEstado !== key ? 0.4 : 1 }}>
              <p style={{ color: '#9ca3af', fontSize: isMobile ? '0.7rem' : '0.875rem', margin: 0 }}>{val.label}</p>
              <p style={{ fontSize: isMobile ? '1.25rem' : '1.75rem', fontWeight: 700, margin: '0.25rem 0 0' }}>
                {novedades.filter(n => n.estado === key).length}
              </p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            placeholder="Buscar orden o cliente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ flex: 1, minWidth: '150px', background: '#111827', color: '#fff', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none' }}
          />
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={selectStyle}>
            <option value="todos">Todos</option>
            <option value="nuevo">Nuevo</option>
            <option value="en_gestion">En gestión</option>
            <option value="en_espera">En espera</option>
            <option value="resuelto">Resuelto</option>
          </select>
          <select value={filtroResponsabilidad} onChange={e => setFiltroResponsabilidad(e.target.value)} style={selectStyle}>
            <option value="todos">Toda resp.</option>
            <option value="nuestra">Nuestra</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>

        {/* Lista — cards en mobile, tabla en desktop */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Cargando...</div>
        ) : novedadesFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>No hay novedades</div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {novedadesFiltradas.map(n => (
              <div key={n.id} onClick={() => router.push(`/novedades/${n.id}`)}
                style={{ background: '#111827', borderRadius: '0.75rem', padding: '1rem', cursor: 'pointer', borderLeft: `4px solid ${ESTADOS[n.estado]?.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{n.cliente || 'Sin cliente'}</p>
                    <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: '0.125rem 0 0', fontFamily: 'monospace' }}>{n.numero_orden ? `#${n.numero_orden}` : 'Sin orden'}</p>
                  </div>
                  <span style={{ background: ESTADOS[n.estado]?.color, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {ESTADOS[n.estado]?.label}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#d1d5db', margin: '0 0 0.5rem' }}>{n.tipo}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}>{n.canal} · {n.responsabilidad}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{new Date(n.created_at).toLocaleDateString('es-CO')}</span>
                </div>
                {n.costo_reproceso > 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#f87171', margin: '0.5rem 0 0' }}>Costo: ${n.costo_reproceso?.toLocaleString('es-CO')}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: '#111827', borderRadius: '0.75rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#1f2937', color: '#9ca3af' }}>
                  {['Orden', 'Cliente', 'Tipo', 'Canal', 'Responsabilidad', 'Estado', 'Costo', 'Fecha', 'Cambiar estado'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {novedadesFiltradas.map(n => (
                  <tr key={n.id} onClick={() => router.push(`/novedades/${n.id}`)} style={{ borderTop: '1px solid #1f2937', cursor: 'pointer' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{n.numero_orden || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{n.cliente || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{n.tipo}</td>
                    <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>{n.canal}</td>
                    <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>{n.responsabilidad}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: ESTADOS[n.estado]?.color, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem' }}>
                        {ESTADOS[n.estado]?.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>${n.costo_reproceso?.toLocaleString('es-CO')}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#9ca3af' }}>{new Date(n.created_at).toLocaleDateString('es-CO')}</td>
                    <td style={{ padding: '0.75rem 1rem' }} onClick={e => e.stopPropagation()}>
                      <select value={n.estado} onChange={e => handleEstado(n.id, e.target.value)}
                        style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                        {Object.entries(ESTADOS).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FAB mobile */}
      {isMobile && (
        <button onClick={() => setShowForm(true)}
          style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '999px', width: '56px', height: '56px', fontSize: '1.5rem', cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.5)', zIndex: 40 }}>
          +
        </button>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#111827', borderRadius: isMobile ? '1rem 1rem 0 0' : '1rem', padding: '1.5rem', width: '100%', maxWidth: isMobile ? '100%' : '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Nueva novedad</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input placeholder="Número de orden" value={form.numero_orden} onChange={e => setForm({...form, numero_orden: e.target.value})} style={input} />
              <input placeholder="Cliente" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})} style={input} />
              <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} style={input}>
                {tipos.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
              </select>
              {form.tipo === 'Otros' && (
                <input placeholder="Especifica el tipo de novedad..." value={tipoOtrosEspecificar}
                  onChange={e => setTipoOtrosEspecificar(e.target.value)} style={{ ...input, borderColor: '#7c3aed' }} />
              )}
              <textarea placeholder="Descripción del caso" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                style={{ ...input, height: '80px', resize: 'none' }} />
              <select value={form.canal} onChange={e => setForm({...form, canal: e.target.value})} style={input}>
                <option value="whatsapp">WhatsApp</option>
                <option value="llamada">Llamada</option>
                <option value="instagram">Instagram</option>
                <option value="correo">Correo</option>
              </select>
              <select value={form.responsabilidad} onChange={e => setForm({...form, responsabilidad: e.target.value})} style={input}>
                <option value="nuestra">Responsabilidad nuestra</option>
                <option value="cliente">Responsabilidad del cliente</option>
              </select>
              <input type="number" placeholder="Costo del reproceso ($)" value={form.costo_reproceso}
                onChange={e => setForm({...form, costo_reproceso: Number(e.target.value)})} style={input} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={handleSubmit} style={{ flex: 1, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.875rem', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
                Guardar
              </button>
              <button onClick={() => { setShowForm(false); setTipoOtrosEspecificar('') }} style={{ flex: 1, background: '#374151', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.875rem', cursor: 'pointer', fontSize: '1rem' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}