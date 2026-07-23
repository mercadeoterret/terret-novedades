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

export default function ReportesPage() {
  const [novedades, setNovedades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroFecha, setFiltroFecha] = useState('mes')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { fetchData() }, [filtroFecha])

  const fetchData = async () => {
    setLoading(true)
    let desde = new Date()
    if (filtroFecha === 'semana') desde.setDate(desde.getDate() - 7)
    else if (filtroFecha === 'mes') desde.setMonth(desde.getMonth() - 1)
    else if (filtroFecha === 'trimestre') desde.setMonth(desde.getMonth() - 3)
    else if (filtroFecha === 'año') desde.setFullYear(desde.getFullYear() - 1)
    const { data } = await supabase.from('novedades').select('*').is('deleted_at', null).gte('created_at', desde.toISOString()).order('created_at', { ascending: false })
    setNovedades(data || [])
    setLoading(false)
  }

  const exportarCSV = () => {
    const headers = ['Orden', 'Cliente', 'Tipo', 'Canal', 'Responsabilidad', 'Estado', 'Costo', 'Fecha']
    const rows = novedades.map(n => [n.numero_orden || '', n.cliente || '', n.tipo, n.canal, n.responsabilidad, ESTADOS[n.estado]?.label, n.costo_reproceso || 0, new Date(n.created_at).toLocaleDateString('es-CO')])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `novedades_${filtroFecha}.csv`
    a.click()
  }

  const totalCosto = novedades.reduce((sum, n) => sum + (Number(n.costo_reproceso) || 0), 0)
  const costoNuestro = novedades.filter(n => n.responsabilidad === 'nuestra').reduce((s, n) => s + (Number(n.costo_reproceso) || 0), 0)
  const porEstado = Object.keys(ESTADOS).map(k => ({ key: k, label: ESTADOS[k].label, color: ESTADOS[k].color, count: novedades.filter(n => n.estado === k).length }))
  const porTipo = [...new Set(novedades.map(n => n.tipo))].map(tipo => ({ tipo, count: novedades.filter(n => n.tipo === tipo).length, costo: novedades.filter(n => n.tipo === tipo).reduce((s, n) => s + (Number(n.costo_reproceso) || 0), 0) })).sort((a, b) => b.count - a.count)
  const porResponsabilidad = [
    { label: 'Nuestra', count: novedades.filter(n => n.responsabilidad === 'nuestra').length, color: '#dc2626' },
    { label: 'Cliente', count: novedades.filter(n => n.responsabilidad === 'cliente').length, color: '#16a34a' },
  ]

  if (loading) return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div className="btn-group">
            <button className="btn btn-back" onClick={() => router.push('/novedades')}>← Volver</button>
            <h1 className="page-title">Reportes</h1>
          </div>
          <div className="btn-group">
            <select className="filter-select" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}>
              <option value="semana">Última semana</option>
              <option value="mes">Último mes</option>
              <option value="trimestre">Último trimestre</option>
              <option value="año">Último año</option>
            </select>
            <button className="btn btn-success" onClick={exportarCSV}>Exportar CSV</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="kpi-grid">
          {[
            { label: 'Total novedades', value: novedades.length, color: '#7c3aed' },
            { label: 'Costo total', value: `$${totalCosto.toLocaleString('es-CO')}`, color: '#dc2626' },
            { label: 'Costo nuestra resp.', value: `$${costoNuestro.toLocaleString('es-CO')}`, color: '#d97706' },
            { label: 'Resueltas', value: `${novedades.filter(n => n.estado === 'resuelto').length} / ${novedades.length}`, color: '#16a34a' },
          ].map(k => (
            <div key={k.label} className="card" style={{ borderLeft: `4px solid ${k.color}` }}>
              <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{k.label}</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="charts-grid">
          <div className="card">
            <h2 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1rem' }}>POR ESTADO</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {porEstado.map(e => (
                <div key={e.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    <span>{e.label}</span><span style={{ fontWeight: 600 }}>{e.count}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ background: e.color, width: novedades.length ? `${(e.count / novedades.length) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1rem' }}>POR RESPONSABILIDAD</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {porResponsabilidad.map(r => (
                <div key={r.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    <span>{r.label}</span><span style={{ fontWeight: 600 }}>{r.count}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ background: r.color, width: novedades.length ? `${(r.count / novedades.length) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1rem' }}>POR TIPO DE NOVEDAD</h2>
          {porTipo.length === 0 ? (
            <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>Sin datos</p>
          ) : (
            <table className="table" style={{ background: 'transparent' }}>
              <thead>
                <tr style={{ background: 'transparent' }}>
                  <th style={{ background: 'transparent', color: '#6b7280', fontWeight: 500 }}>Tipo</th>
                  <th style={{ background: 'transparent', color: '#6b7280', fontWeight: 500, textAlign: 'center' }}>Casos</th>
                  <th style={{ background: 'transparent', color: '#6b7280', fontWeight: 500, textAlign: 'right' }}>Costo</th>
                </tr>
              </thead>
              <tbody>
                {porTipo.map(t => (
                  <tr key={t.tipo} style={{ cursor: 'default' }}>
                    <td style={{ padding: '0.625rem 0' }}>{t.tipo}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, padding: '0.625rem 0' }}>{t.count}</td>
                    <td style={{ textAlign: 'right', color: '#f87171', padding: '0.625rem 0' }}>${t.costo.toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}