import React, { useEffect, useRef } from 'react'

const LAYER_NAMES = {
  population: 'Population Density',
  heat: 'Heat Anomaly',
  water: 'Water Stress',
  urban: 'Urban Expansion',
}

export default function InfoPanel({ data, onClose }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.opacity = '0'
      panelRef.current.style.transform = 'translateY(8px)'
      requestAnimationFrame(() => {
        if (panelRef.current) {
          panelRef.current.style.transition = 'opacity 200ms, transform 200ms'
          panelRef.current.style.opacity = '1'
          panelRef.current.style.transform = 'translateY(0)'
        }
      })
    }
  }, [data])

  if (!data) return null

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        zIndex: 1000,
        width: 260,
        padding: '14px 16px',
        background: 'rgba(10,10,10,0.88)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>
          {LAYER_NAMES[data.layer] || data.layer}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#8a8a8a',
            cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ fontSize: 24, fontWeight: 600, color: '#f0f0f0', marginBottom: 4 }}>
        {data.value}
      </div>

      <div style={{ fontSize: 11, color: '#8a8a8a', marginBottom: 10 }}>
        {data.unit}
      </div>

      {data.description && (
        <div style={{ fontSize: 12, color: '#8a8a8a', lineHeight: 1.5, marginBottom: 8, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8 }}>
          {data.description}
        </div>
      )}

      <div style={{ fontSize: 10, color: '#4a4a4a', display: 'flex', gap: 12 }}>
        <span>{data.year}</span>
        <span>{data.ssp}</span>
        {data.lat && <span>{data.lat}, {data.lng}</span>}
      </div>
    </div>
  )
}
