'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const TIPOS = [
  'Garantías',
  'Cambio de producto',
  'Producto defectuoso',
  'Dirección no encontrada por transportadora',
  'Cliente diligencia mal la dirección',
  'Pedido incorrecto',
  'No entregado',
]

const ESTADOS: Record<string, { label: string; color: string }> = {
  nuevo: { label: 'Nuevo', color: '#4b5563' },
  en_gestion: { label: 'En gestión', color: '#d97706' },
  en_espera: { label: 'En espera', color: '#2563eb' },
  resuelto: { label: 'Resuelto', color: '#16a34a' },
}

export default function NovedadesPage() {
  const [novedades, setNovedades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroResponsabilidad, setFiltroResponsabilidad] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState({
    numero_orden: '',
    cliente: '',
    tipo: TIPOS[0],
    descripcion: '',
    canal: 'whatsapp',
    responsabilidad: 'nuestra',
    costo_reproceso: 0,
  })
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { fetchNovedades() }, [])

  const fetchNovedades = async () => {
    const { data } = await supabase
      .from('novedades')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    setNovedades(data || [])
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
    await supabase.from('novedades').insert([{ ...form, estado: 'nuevo' }])
    setShowForm(false)
    setForm({ numero_orden: '', cliente: '', tipo: TIPOS[0], descripcion: '', canal: 'whatsapp', responsabilidad: 'nuestra', costo_reproceso: 0 })
    fetchNovedades()
  }

  const handleEstado = async (id: string, estado: string) => {
    await supabase.from('novedades').update({ estado, updated_at: new Date().toISOString() }).eq('id', id)
    fetchNovedades()
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
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    outline: 'none',
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
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Novedades</h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => router.push('/reportes')} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
              Reportes
            </button>
            <button onClick={() => router.push('/admin')} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
              Admin
            </button>
            <button onClick={() => setShowForm(true)} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}>
              + Nueva novedad
            </button>
            <button onClick={handleLogout} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
              Salir
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {Object.entries(ESTADOS).map(([key, val]) => (
            <div key={key} style={{ background: '#111827', borderRadius: '0.75rem', padding: '1rem', borderLeft: `4px solid ${val.color}` }}>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{val.label}</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>
                {novedades.filter(n => n.estado === key).length}
              </p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            placeholder="Buscar por orden o cliente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ flex: 1, minWidth: '200px', background: '#111827', color: '#fff', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none' }}
          />
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={selectStyle}>
            <option value="todos">Todos los estados</option>
            <option value="nuevo">Nuevo</option>
            <option value="en_gestion">En gestión</option>
            <option value="en_espera">En espera</option>
            <option value="resuelto">Resuelto</option>
          </select>
          <select value={filtroResponsabilidad} onChange={e => setFiltroResponsabilidad(e.target.value)} style={selectStyle}>
            <option value="todos">Toda responsabilidad</option>
            <option value="nuestra">Nuestra</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>

        {/* Tabla */}
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
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Cargando...</td></tr>
              ) : novedadesFiltradas.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No hay novedades</td></tr>
              ) : novedadesFiltradas.map(n => (
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
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#111827', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Nueva novedad</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input placeholder="Número de orden" value={form.numero_orden} onChange={e => setForm({...form, numero_orden: e.target.value})} style={input} />
              <input placeholder="Cliente" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})} style={input} />
              <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} style={input}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
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
              <button onClick={handleSubmit} style={{ flex: 1, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: 600, cursor: 'pointer' }}>
                Guardar
              </button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: '#374151', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}