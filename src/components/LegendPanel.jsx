import React from 'react'

const PANEL_STYLE = {
  position: 'absolute',
  bottom: 20,
  right: 20,
  zIndex: 1000,
  width: 180,
  padding: '12px',
  background: 'rgba(10,10,10,0.88)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 10,
}

const LABEL_STYLE = {
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#8a8a8a',
  marginBottom: 8,
  display: 'block',
}

function PopulationLegend() {
  return (
    <div>
      <span style={LABEL_STYLE}>Population Density</span>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
        <div style={{
          width: 12,
          height: 80,
          borderRadius: 2,
          background: 'linear-gradient(to bottom, #2d1b69, #c4922a, #e8d5b0)',
          flexShrink: 0,
        }}/>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 9, color: '#8a8a8a' }}>
          <span>High density</span>
          <span>Low density</span>
        </div>
      </div>
    </div>
  )
}

function HeatLegend() {
  return (
    <div>
      <span style={LABEL_STYLE}>Temp. Anomaly</span>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
        <div style={{
          width: 12,
          height: 100,
          borderRadius: 2,
          background: 'linear-gradient(to bottom, #cc0000, #ff6600, #ffb347, #fff7e6)',
          flexShrink: 0,
        }}/>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 9, color: '#8a8a8a' }}>
          <span>+3°C</span>
          <span>+2°C</span>
          <span>+1°C</span>
          <span>0°C</span>
        </div>
      </div>
    </div>
  )
}

function WaterLegend() {
  // 4×4 bivariate diamond
  const size = 120
  const half = size / 2
  const colors = {
    '1,1': '#e8e8e8', '1,2': '#ace4e4', '1,3': '#5ac8c8', '1,4': '#1a9090',
    '2,1': '#dfb0d6', '2,2': '#a5b7c9', '2,3': '#5698b9', '2,4': '#3a7abf',
    '3,1': '#be64ac', '3,2': '#8c62aa', '3,3': '#3d5da7', '3,4': '#1f4fa3',
    '4,1': '#d7191c', '4,2': '#c0392b', '4,3': '#8e2414', '4,4': '#4b1010',
  }

  const cells = []
  const cellW = half / 4

  for (let d = 1; d <= 4; d++) {
    for (let s = 1; s <= 4; s++) {
      // Transform to diamond: rotate 45deg
      // d = row (demand, 1=low top, 4=high bottom visually)
      // s = col (supply, 1=low left, 4=high right)
      const col = s - 1
      const row = d - 1
      const x = half + (col - row) * cellW - cellW / 2
      const y = half - (col + row - 3) * cellW + cellW / 2 - cellW * 2

      cells.push(
        <rect
          key={`${d},${s}`}
          x={x - cellW / 2}
          y={y - cellW / 2}
          width={cellW}
          height={cellW}
          fill={colors[`${d},${s}`]}
          transform={`rotate(45, ${x}, ${y})`}
        />
      )
    }
  }

  return (
    <div>
      <span style={LABEL_STYLE}>Water Stress</span>
      <div style={{ position: 'relative', width: size, height: size + 20 }}>
        <svg width={size} height={size} style={{ display: 'block' }}>
          {cells}
        </svg>
        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: '#8a8a8a', whiteSpace: 'nowrap' }}>
          High Stress
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: '#8a8a8a', whiteSpace: 'nowrap' }}>
          Low Stress
        </div>
        <div style={{ position: 'absolute', left: -28, top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontSize: 8, color: '#8a8a8a', whiteSpace: 'nowrap', transformOrigin: 'center' }}>
          Supply
        </div>
        <div style={{ position: 'absolute', bottom: 8, right: -20, fontSize: 8, color: '#8a8a8a', whiteSpace: 'nowrap' }}>
          Demand →
        </div>
      </div>
    </div>
  )
}

function UrbanLegend() {
  const classes = [
    { label: 'Urban', color: 'rgba(200, 210, 100, 0.85)' },
    { label: 'Suburban', color: 'rgba(100, 140, 100, 0.70)' },
    { label: 'Rural', color: 'rgba(34, 60, 34, 0.75)' },
  ]
  return (
    <div>
      <span style={LABEL_STYLE}>Urban Expansion</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {classes.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: c.color, flexShrink: 0 }}/>
            <span style={{ fontSize: 10, color: '#8a8a8a' }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BivariateLegend() {
  const size = 110
  const colors = {
    '1,1': '#e8e8e8', '1,2': '#ace4e4', '1,3': '#5ac8c8', '1,4': '#1a9090',
    '2,1': '#dfb0d6', '2,2': '#a5b7c9', '2,3': '#5698b9', '2,4': '#3a7abf',
    '3,1': '#be64ac', '3,2': '#8c62aa', '3,3': '#3d5da7', '3,4': '#1f4fa3',
    '4,1': '#d7191c', '4,2': '#c0392b', '4,3': '#8e2414', '4,4': '#4b1010',
  }
  const cell = size / 4

  return (
    <div>
      <span style={LABEL_STYLE}>Population × Heat Risk</span>
      <div style={{ position: 'relative' }}>
        <svg width={size} height={size} style={{ display: 'block' }}>
          {[1, 2, 3, 4].map(p =>
            [1, 2, 3, 4].map(h => (
              <rect
                key={`${p},${h}`}
                x={(p - 1) * cell}
                y={(4 - h) * cell}
                width={cell}
                height={cell}
                fill={colors[`${p},${h}`]}
              />
            ))
          )}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
          <span style={{ fontSize: 8, color: '#8a8a8a' }}>Low pop.</span>
          <span style={{ fontSize: 8, color: '#c9a227' }}>High Risk →</span>
        </div>
        <div style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontSize: 8, color: '#8a8a8a', whiteSpace: 'nowrap' }}>
          Heat ↑
        </div>
      </div>
    </div>
  )
}

export default function LegendPanel({ activeLayers }) {
  const { urban, population, water, heat } = activeLayers
  const bothPopHeat = population && heat
  const anyActive = urban || population || water || heat

  if (!anyActive) return null

  const legends = []
  if (urban) legends.push(<UrbanLegend key="urban" />)
  if (water) legends.push(<WaterLegend key="water" />)
  if (bothPopHeat) {
    legends.push(<BivariateLegend key="bivar" />)
  } else {
    if (population) legends.push(<PopulationLegend key="pop" />)
    if (heat) legends.push(<HeatLegend key="heat" />)
  }

  return (
    <div style={PANEL_STYLE}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {legends}
      </div>
    </div>
  )
}
