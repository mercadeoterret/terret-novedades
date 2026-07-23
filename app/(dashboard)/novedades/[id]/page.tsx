'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

const ESTADOS: Record<string, { label: string; color: string }> = {
  nuevo: { label: 'Nuevo', color: '#4b5563' },
  en_gestion: { label: 'En gestión', color: '#d97706' },
  en_espera: { label: 'En espera', color: '#2563eb' },
  resuelto: { label: 'Resuelto', color: '#16a34a' },
}

const TIPOS = [
  'Garantías', 'Cambio de producto', 'Producto defectuoso',
  'Dirección no encontrada por transportadora',
  'Cliente diligencia mal la dirección', 'Pedido incorrecto', 'No entregado',
]

export default function NovedadDetalle() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [novedad, setNovedad] = useState<any>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [archivos, setArchivos] = useState<any[]>([])
  const [perfil, setPerfil] = useState<any>(null)
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchTodo() }, [id])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [historial])

  const fetchTodo = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const [{ data: p }, { data: n }, { data: h }, { data: a }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('novedades').select('*, asignado:profiles!novedades_asignado_a_fkey(nombre)').eq('id', id).single(),
      supabase.from('novedad_historial').select('*, usuario:profiles(nombre)').eq('novedad_id', id).order('created_at', { ascending: true }),
      supabase.from('novedad_archivos').select('*').eq('novedad_id', id).order('created_at', { ascending: false }),
    ])

    setPerfil(p)
    setNovedad(n)
    setForm(n)
    setHistorial(h || [])
    setArchivos(a || [])
    setLoading(false)
  }

  const agregarNota = async () => {
    if (!nota.trim()) return
    const contenido = nota
    setNota('')

    const { data: nuevo } = await supabase.from('novedad_historial').insert({
      novedad_id: id,
      usuario_id: perfil.id,
      tipo: 'nota',
      contenido,
    }).select('*, usuario:profiles(nombre)').single()

    if (nuevo) setHistorial(prev => [...prev, nuevo])
  }

  const cambiarEstado = async (estado: string) => {
    if (estado === novedad.estado) return
    const anterior = novedad.estado
    setNovedad((prev: any) => ({ ...prev, estado }))

    await supabase.from('novedades').update({ estado, updated_at: new Date().toISOString() }).eq('id', id)

    const { data: entrada } = await supabase.from('novedad_historial').insert({
      novedad_id: id,
      usuario_id: perfil.id,
      tipo: 'estado',
      contenido: `Cambió el estado de "${ESTADOS[anterior]?.label}" a "${ESTADOS[estado]?.label}"`,
      estado_anterior: anterior,
      estado_nuevo: estado,
    }).select('*, usuario:profiles(nombre)').single()

    if (entrada) setHistorial(prev => [...prev, entrada])
  }

  const guardarEdicion = async () => {
    await supabase.from('novedades').update({
      numero_orden: form.numero_orden,
      cliente: form.cliente,
      tipo: form.tipo,
      descripcion: form.descripcion,
      canal: form.canal,
      responsabilidad: form.responsabilidad,
      costo_reproceso: form.costo_reproceso,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    const { data: entrada } = await supabase.from('novedad_historial').insert({
      novedad_id: id,
      usuario_id: perfil.id,
      tipo: 'nota',
      contenido: 'Editó los datos de la novedad',
    }).select('*, usuario:profiles(nombre)').single()

    setNovedad((prev: any) => ({ ...prev, ...form }))
    if (entrada) setHistorial(prev => [...prev, entrada])
    setEditando(false)
  }

  const eliminar = async () => {
    if (!confirm('¿Eliminar esta novedad? Esta acción no se puede deshacer.')) return
    await supabase.from('novedades').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    router.push('/novedades')
  }

  const subirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendoArchivo(true)

    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('novedades-archivos').upload(path, file)

    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('novedades-archivos').getPublicUrl(path)

      const { data: archivoNuevo } = await supabase.from('novedad_archivos').insert({
        novedad_id: id,
        usuario_id: perfil.id,
        nombre: file.name,
        url: publicUrl,
      }).select('*').single()

      const { data: entrada } = await supabase.from('novedad_historial').insert({
        novedad_id: id,
        usuario_id: perfil.id,
        tipo: 'archivo',
        contenido: `${file.name}||${publicUrl}`,
      }).select('*, usuario:profiles(nombre)').single()

      if (archivoNuevo) setArchivos(prev => [archivoNuevo, ...prev])
      if (entrada) setHistorial(prev => [...prev, entrada])
    }
    setSubiendoArchivo(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const esImagen = (nombre: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(nombre)

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
    <div style={{ minHeight: '100vh', background: '#030712', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Cargando...
    </div>
  )

  if (!novedad) return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Novedad no encontrada
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button onClick={() => router.push('/novedades')}
            style={{ background: '#1f2937', border: 'none', color: '#9ca3af', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}>
            ← Volver
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, flex: 1 }}>
            Novedad {novedad.numero_orden ? `#${novedad.numero_orden}` : `ID ${String(id).slice(0, 8)}`}
          </h1>
          <span style={{ background: ESTADOS[novedad.estado]?.color, padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
            {ESTADOS[novedad.estado]?.label}
          </span>
          {perfil?.rol === 'admin' && (
            <button onClick={eliminar}
              style={{ background: '#7f1d1d', border: 'none', color: '#fca5a5', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              Eliminar
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* Columna izquierda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Info */}
            <div style={{ background: '#111827', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#9ca3af' }}>INFORMACIÓN</h2>
                <button onClick={() => setEditando(!editando)}
                  style={{ background: editando ? '#374151' : '#1f2937', border: 'none', color: '#d1d5db', borderRadius: '0.375rem', padding: '0.25rem 0.625rem', cursor: 'pointer', fontSize: '0.75rem' }}>
                  {editando ? 'Cancelar' : 'Editar'}
                </button>
              </div>

              {editando ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <input placeholder="Número de orden" value={form.numero_orden || ''} onChange={e => setForm({...form, numero_orden: e.target.value})} style={input} />
                  <input placeholder="Cliente" value={form.cliente || ''} onChange={e => setForm({...form, cliente: e.target.value})} style={input} />
                  <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} style={input}>
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <textarea value={form.descripcion || ''} onChange={e => setForm({...form, descripcion: e.target.value})}
                    style={{ ...input, height: '70px', resize: 'none' }} placeholder="Descripción" />
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
                  <input type="number" placeholder="Costo reproceso" value={form.costo_reproceso || 0}
                    onChange={e => setForm({...form, costo_reproceso: Number(e.target.value)})} style={input} />
                  <button onClick={guardarEdicion}
                    style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                    Guardar cambios
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                  {[
                    ['Cliente', novedad.cliente || '-'],
                    ['Orden', novedad.numero_orden || '-'],
                    ['Tipo', novedad.tipo],
                    ['Canal', novedad.canal],
                    ['Responsabilidad', novedad.responsabilidad],
                    ['Costo reproceso', `$${Number(novedad.costo_reproceso || 0).toLocaleString('es-CO')}`],
                    ['Fecha creación', new Date(novedad.created_at).toLocaleDateString('es-CO')],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>{label}</span>
                      <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%', textTransform: 'capitalize' }}>{value}</span>
                    </div>
                  ))}
                  {novedad.descripcion && (
                    <div style={{ borderTop: '1px solid #1f2937', paddingTop: '0.75rem', color: '#d1d5db' }}>
                      {novedad.descripcion}
                    </div>
                  )}
                </div>
              )}

              {/* Cambiar estado */}
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid #1f2937', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>CAMBIAR ESTADO</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {Object.entries(ESTADOS).map(([key, val]) => (
                    <button key={key} onClick={() => cambiarEstado(key)}
                      style={{
                        background: novedad.estado === key ? val.color : '#1f2937',
                        border: `1px solid ${novedad.estado === key ? val.color : '#374151'}`,
                        color: '#fff', borderRadius: '0.375rem', padding: '0.375rem 0.75rem',
                        cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left',
                        fontWeight: novedad.estado === key ? 600 : 400,
                      }}>
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Archivos */}
            <div style={{ background: '#111827', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#9ca3af' }}>ARCHIVOS ({archivos.length})</h2>
                <button onClick={() => fileInputRef.current?.click()}
                  disabled={subiendoArchivo}
                  style={{ background: '#1f2937', border: 'none', color: '#d1d5db', borderRadius: '0.375rem', padding: '0.25rem 0.625rem', cursor: 'pointer', fontSize: '0.75rem' }}>
                  {subiendoArchivo ? 'Subiendo...' : '+ Adjuntar'}
                </button>
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={subirArchivo} />
              </div>

              {archivos.length === 0 ? (
                <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>Sin archivos adjuntos</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {archivos.map(a => (
                    <a key={a.id} href={a.url} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#1f2937', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', textDecoration: 'none', color: '#fff' }}>
                      {esImagen(a.nombre) ? (
                        <img src={a.url} alt={a.nombre} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '0.375rem' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', background: '#374151', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>
                          DOC
                        </div>
                      )}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</p>
                        <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0 }}>{new Date(a.created_at).toLocaleDateString('es-CO')}</p>
                      </div>
                      <span style={{ background: '#374151', color: '#d1d5db', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        Ver →
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: '#111827', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '700px' }}>
            <h2 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1rem' }}>ACTIVIDAD</h2>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
              {historial.length === 0 && (
                <p style={{ color: '#4b5563', fontSize: '0.875rem', textAlign: 'center', marginTop: '2rem' }}>
                  Sin actividad aún
                </p>
              )}
              {historial.map(h => (
                <div key={h.id} style={{
                  background: h.tipo === 'estado' ? '#1f2937' : h.tipo === 'archivo' ? '#1a2e1a' : '#1e1b4b',
                  borderRadius: '0.625rem',
                  padding: '0.625rem 0.875rem',
                  borderLeft: `3px solid ${h.tipo === 'estado' ? '#374151' : h.tipo === 'archivo' ? '#16a34a' : '#7c3aed'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: h.tipo === 'estado' ? '#9ca3af' : h.tipo === 'archivo' ? '#4ade80' : '#a78bfa' }}>
                      {h.usuario?.nombre || 'Sistema'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#4b5563' }}>
                      {new Date(h.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  {h.tipo === 'archivo' ? (
                    <a href={h.contenido.split('||')[1]} target="_blank" rel="noreferrer"
                      style={{ fontSize: '0.875rem', color: '#4ade80', textDecoration: 'underline', display: 'block' }}>
                      📎 {h.contenido.split('||')[0]}
                    </a>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: h.tipo === 'estado' ? '#6b7280' : '#e5e7eb', margin: 0 }}>
                      {h.contenido}
                    </p>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <textarea
                value={nota}
                onChange={e => setNota(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); agregarNota() } }}
                placeholder="Escribe una nota... (Enter para enviar)"
                style={{ flex: 1, background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none', resize: 'none', height: '60px' }}
              />
              <button onClick={agregarNota}
                style={{ background: '#7c3aed', border: 'none', color: '#fff', borderRadius: '0.5rem', padding: '0 1rem', cursor: 'pointer', fontWeight: 600 }}>
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}