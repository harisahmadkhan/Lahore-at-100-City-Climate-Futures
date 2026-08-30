import React, { useEffect, useRef } from 'react'
import { SSP_DESCRIPTIONS } from '../data/sspDescriptions'

export default function SSPExplainerPanel({ ssp, onClose }) {
  const desc = SSP_DESCRIPTIONS[ssp]
  const panelRef = useRef(null)

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.transform = 'translateX(100%)'
      requestAnimationFrame(() => {
        if (panelRef.current) {
          panelRef.current.style.transition = 'transform 300ms ease'
          panelRef.current.style.transform = 'translateX(0)'
        }
      })
    }
  }, [ssp])

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 1100,
        width: 340,
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        padding: '28px 24px',
        overflowY: 'auto',
      }}
    >
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none', color: '#8a8a8a',
          cursor: 'pointer', fontSize: 20, position: 'absolute', top: 16, right: 20,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        ×
      </button>

      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c9a227', marginBottom: 6 }}>
        {ssp}
      </div>

      <div style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f0', marginBottom: 16, lineHeight: 1.2 }}>
        {desc?.label}
      </div>

      <div style={{
        fontSize: 13,
        color: '#aaa',
        lineHeight: 1.7,
        whiteSpace: 'pre-line',
      }}>
        {desc?.full}
      </div>

      <div style={{ marginTop: 24, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 10, color: '#4a4a4a' }}>
        Source: IPCC Shared Socioeconomic Pathways (SSPs)
      </div>
    </div>
  )
}
