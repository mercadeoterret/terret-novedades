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

const ESTADOS = {
  nuevo: { label: 'Nuevo', color: 'bg-gray-600' },
  en_gestion: { label: 'En gestión', color: 'bg-yellow-600' },
  en_espera: { label: 'En espera', color: 'bg-blue-600' },
  resuelto: { label: 'Resuelto', color: 'bg-green-600' },
}

export default function NovedadesPage() {
  const [novedades, setNovedades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
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

  useEffect(() => {
    fetchNovedades()
  }, [])

  const fetchNovedades = async () => {
    const { data } = await supabase
      .from('novedades')
      .select('*')
      .order('created_at', { ascending: false })
    setNovedades(data || [])
    setLoading(false)
  }

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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Novedades</h1>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold transition">
              + Nueva novedad
            </button>
            <button onClick={handleLogout} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition">
              Salir
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(ESTADOS).map(([key, val]) => (
            <div key={key} className="bg-gray-900 rounded-xl p-4">
              <p className="text-gray-400 text-sm">{val.label}</p>
              <p className="text-2xl font-bold mt-1">{novedades.filter(n => n.estado === key).length}</p>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400">
              <tr>
                <th className="text-left px-4 py-3">Orden</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Costo</th>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Cargando...</td></tr>
              ) : novedades.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No hay novedades</td></tr>
              ) : novedades.map(n => (
                <tr key={n.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono">{n.numero_orden || '-'}</td>
                  <td className="px-4 py-3">{n.cliente || '-'}</td>
                  <td className="px-4 py-3">{n.tipo}</td>
                  <td className="px-4 py-3">
                    <span className={`${ESTADOS[n.estado as keyof typeof ESTADOS]?.color} px-2 py-1 rounded-full text-xs`}>
                      {ESTADOS[n.estado as keyof typeof ESTADOS]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">${n.costo_reproceso?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(n.created_at).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-3">
                    <select
                      value={n.estado}
                      onChange={e => handleEstado(n.id, e.target.value)}
                      className="bg-gray-700 text-white rounded px-2 py-1 text-xs"
                    >
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

      {/* Modal nueva novedad */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-bold mb-4">Nueva novedad</h2>
            <div className="space-y-3">
              <input placeholder="Número de orden" value={form.numero_orden} onChange={e => setForm({...form, numero_orden: e.target.value})} className="w-full bg-gray-800 rounded-lg px-4 py-2 text-sm outline-none" />
              <input placeholder="Cliente" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})} className="w-full bg-gray-800 rounded-lg px-4 py-2 text-sm outline-none" />
              <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="w-full bg-gray-800 rounded-lg px-4 py-2 text-sm outline-none">
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
              <textarea placeholder="Descripción" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="w-full bg-gray-800 rounded-lg px-4 py-2 text-sm outline-none h-20 resize-none" />
              <select value={form.canal} onChange={e => setForm({...form, canal: e.target.value})} className="w-full bg-gray-800 rounded-lg px-4 py-2 text-sm outline-none">
                <option value="whatsapp">WhatsApp</option>
                <option value="llamada">Llamada</option>
                <option value="instagram">Instagram</option>
                <option value="correo">Correo</option>
              </select>
              <select value={form.responsabilidad} onChange={e => setForm({...form, responsabilidad: e.target.value})} className="w-full bg-gray-800 rounded-lg px-4 py-2 text-sm outline-none">
                <option value="nuestra">Responsabilidad nuestra</option>
                <option value="cliente">Responsabilidad del cliente</option>
              </select>
              <input type="number" placeholder="Costo del reproceso ($)" value={form.costo_reproceso} onChange={e => setForm({...form, costo_reproceso: Number(e.target.value)})} className="w-full bg-gray-800 rounded-lg px-4 py-2 text-sm outline-none" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSubmit} className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg font-semibold transition">Guardar</button>
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg transition">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}