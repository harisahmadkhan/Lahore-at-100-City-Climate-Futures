import React, { useState, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import ControlPanel from './components/ControlPanel'
import MapLayers from './components/MapLayers'
import InfoPanel from './components/InfoPanel'
import LegendPanel from './components/LegendPanel'
import SSPExplainerPanel from './components/SSPExplainerPanel'

const YEAR_STEPS = [2020, 2025, 2030, 2035, 2040, 2045, 2050]
const LAHORE_CENTER = [31.5204, 74.3587]
const BASEMAP = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'

export default function App() {
  const [year, setYear] = useState(2025)
  const [ssp, setSsp] = useState('SSP1')
  const [activeLayers, setActiveLayers] = useState({ urban: false, population: true, water: false, heat: false })
  const [infoData, setInfoData] = useState(null)
  const [showExplainer, setShowExplainer] = useState(false)
  const [boundary, setBoundary] = useState(null)

  const toggleLayer = useCallback((key) => {
    setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleCellClick = useCallback((data) => {
    setInfoData(data)
  }, [])

  // Load boundary once
  React.useEffect(() => {
    fetch('/data/boundary/lahore_boundary.geojson')
      .then(r => r.json())
      .then(setBoundary)
      .catch(() => {})
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <MapContainer
        center={LAHORE_CENTER}
        zoom={11}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url={BASEMAP}
          attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
          maxZoom={16}
        />

        {boundary && (
          <GeoJSON
            data={boundary}
            style={{
              color: 'rgba(201,162,39,0.5)',
              weight: 1.5,
              fillOpacity: 0,
            }}
          />
        )}

        <MapLayers
          year={year}
          ssp={ssp}
          activeLayers={activeLayers}
          onCellClick={handleCellClick}
        />
      </MapContainer>

      {/* Project title — top left */}
      <div style={{
        position: 'absolute', top: 20, left: 20, zIndex: 1000,
        pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', letterSpacing: '0.02em', lineHeight: 1.1 }}>
          Lahore at 100
        </div>
        <div style={{ fontSize: 11, color: '#c9a227', fontWeight: 500, marginTop: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Climate Conscious City Futures
        </div>
        <div style={{ fontSize: 10, color: '#8a8a8a', marginTop: 4, letterSpacing: '0.05em' }}>
          2020 to 2050 — Pakistan&rsquo;s Centenary
        </div>
      </div>

      {/* Control panel — top right */}
      <ControlPanel
        year={year}
        ssp={ssp}
        activeLayers={activeLayers}
        yearSteps={YEAR_STEPS}
        onYearChange={setYear}
        onSspChange={setSsp}
        onLayerToggle={toggleLayer}
        onOpenExplainer={() => setShowExplainer(true)}
      />

      {/* Info panel — bottom left */}
      {infoData && (
        <InfoPanel data={infoData} onClose={() => setInfoData(null)} />
      )}

      {/* Legend panel — bottom right */}
      <LegendPanel activeLayers={activeLayers} ssp={ssp} />

      {/* SSP explainer — slides in from right */}
      {showExplainer && (
        <SSPExplainerPanel ssp={ssp} onClose={() => setShowExplainer(false)} />
      )}
    </div>
  )
}
