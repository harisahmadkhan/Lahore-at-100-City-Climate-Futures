import React from 'react'
import { SSP_DESCRIPTIONS, SSP_KEYS } from '../data/sspDescriptions'

const PANEL_STYLE = {
  position: 'absolute',
  top: 20,
  right: 20,
  zIndex: 1000,
  width: 260,
  padding: '16px',
  background: 'rgba(10,10,10,0.88)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 10,
}

const LAYER_ICONS = {
  urban: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="8" width="4" height="8" fill="currentColor" opacity="0.9"/>
      <rect x="7" y="5" width="4" height="11" fill="currentColor" opacity="0.9"/>
      <rect x="12" y="10" width="4" height="6" fill="currentColor" opacity="0.9"/>
    </svg>
  ),
  population: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="6" cy="7" r="2.5" fill="currentColor"/>
      <circle cx="12" cy="7" r="2.5" fill="currentColor"/>
      <path d="M1 16c0-2.8 2.2-5 5-5h6c2.8 0 5 2.2 5 5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  water: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2L3 10c0 3.3 2.7 6 6 6s6-2.7 6-6L9 2z" fill="currentColor"/>
    </svg>
  ),
  heat: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="4" fill="currentColor"/>
      <line x1="9" y1="1" x2="9" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="9" y1="15" x2="9" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="1" y1="9" x2="3" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="15" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
}

const LAYER_LABELS = {
  urban: 'Urban Growth',
  population: 'Population',
  water: 'Water Stress',
  heat: 'Heat',
}

export default function ControlPanel({
  year, ssp, activeLayers, yearSteps,
  onYearChange, onSspChange, onLayerToggle, onOpenExplainer,
}) {
  const sliderMin = yearSteps[0]
  const sliderMax = yearSteps[yearSteps.length - 1]
  const sliderVal = yearSteps.indexOf(year)

  const handleSliderChange = (e) => {
    const idx = parseInt(e.target.value)
    onYearChange(yearSteps[idx])
  }

  return (
    <div style={PANEL_STYLE}>
      {/* Year Slider */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8a8a8a', marginBottom: 4 }}>
          Year
        </div>
        <div style={{ fontSize: 32, fontWeight: 600, color: '#f0f0f0', lineHeight: 1, marginBottom: 10 }}>
          {year}
          {year >= 2045 && year <= 2050 && (
            <span style={{ fontSize: 10, color: '#c9a227', marginLeft: 8, fontWeight: 500, letterSpacing: '0.05em' }}>
              → Centenary
            </span>
          )}
        </div>

        {/* Step buttons as slider — each step is a clickable button */}
        <div style={{ position: 'relative', paddingBottom: 4 }}>
          {/* Track line */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 0,
            right: 0,
            height: 2,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 1,
          }}>
            {/* Active fill */}
            <div style={{
              height: '100%',
              width: `${(sliderVal / (yearSteps.length - 1)) * 100}%`,
              background: '#c9a227',
              borderRadius: 1,
              transition: 'width 200ms',
            }}/>
          </div>

          {/* Step dots + labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {yearSteps.map((y, i) => {
              const active = y === year
              const past = i < sliderVal
              return (
                <button
                  key={y}
                  onClick={() => onYearChange(y)}
                  title={String(y)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px 2px 0',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  <div style={{
                    width: active ? 12 : 6,
                    height: active ? 12 : 6,
                    borderRadius: '50%',
                    background: active ? '#c9a227' : past ? 'rgba(201,162,39,0.5)' : 'rgba(255,255,255,0.2)',
                    transition: 'all 200ms',
                    marginTop: active ? -3 : 0,
                  }}/>
                  <span style={{
                    fontSize: 8,
                    color: active ? '#c9a227' : '#4a4a4a',
                    fontWeight: active ? 600 : 400,
                    transition: 'color 150ms',
                  }}>
                    {`'${String(y).slice(2)}`}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 2047 centenary marker */}
          <div style={{
            position: 'absolute',
            left: `${(5.4 / 6) * 100}%`,
            top: -16,
            transform: 'translateX(-50%)',
            fontSize: 7,
            color: '#c9a227',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            opacity: 0.8,
          }}>
            <div style={{ width: 1, height: 5, background: '#c9a227', margin: '0 auto 2px' }}/>
            PK@100
          </div>
        </div>
      </div>

      {/* Scenario Toggle */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8a8a8a', marginBottom: 8 }}>
          Scenario
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {SSP_KEYS.map(key => (
            <button
              key={key}
              onClick={() => onSspChange(key)}
              style={{
                flex: 1,
                height: 32,
                background: ssp === key ? '#c9a227' : 'transparent',
                color: ssp === key ? '#0a0a0a' : '#8a8a8a',
                fontWeight: ssp === key ? 600 : 400,
                border: ssp === key ? 'none' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 150ms',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {key}
            </button>
          ))}
        </div>
        <div style={{
          marginTop: 8,
          fontSize: 10,
          color: '#8a8a8a',
          lineHeight: 1.4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <span style={{ flex: 1 }}>{SSP_DESCRIPTIONS[ssp]?.short}</span>
          <button
            onClick={onOpenExplainer}
            style={{
              marginLeft: 8,
              background: 'none',
              border: 'none',
              color: '#c9a227',
              cursor: 'pointer',
              fontSize: 10,
              padding: 0,
              fontFamily: 'Inter, system-ui, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            Read →
          </button>
        </div>
      </div>

      {/* Layer Toggles — 2×2 grid */}
      <div>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8a8a8a', marginBottom: 8 }}>
          Layers
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {Object.keys(activeLayers).map(key => {
            const active = activeLayers[key]
            return (
              <button
                key={key}
                onClick={() => onLayerToggle(key)}
                style={{
                  height: 72,
                  background: 'transparent',
                  border: active ? '1px solid #c9a227' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  color: active ? '#f0f0f0' : 'rgba(255,255,255,0.4)',
                  transition: 'all 150ms',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                <span style={{ opacity: active ? 1 : 0.4, transition: 'opacity 150ms' }}>
                  {LAYER_ICONS[key]}
                </span>
                <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {LAYER_LABELS[key]}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
