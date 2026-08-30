import React, { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

// Row = demand_cls (1=low, 4=high), Col = supply_cls (1=low, 4=high)
const BIVARIATE_COLORS = {
  '1,1': '#e8e8e8', '1,2': '#ace4e4', '1,3': '#5ac8c8', '1,4': '#1a9090',
  '2,1': '#dfb0d6', '2,2': '#a5b7c9', '2,3': '#5698b9', '2,4': '#3a7abf',
  '3,1': '#be64ac', '3,2': '#8c62aa', '3,3': '#3d5da7', '3,4': '#1f4fa3',
  '4,1': '#d7191c', '4,2': '#c0392b', '4,3': '#8e2414', '4,4': '#4b1010',
}

function getColor(demandCls, supplyCls) {
  return BIVARIATE_COLORS[`${demandCls},${supplyCls}`] || '#888'
}

// Slider year → property suffix
function getPeriodKey(year) {
  if (year <= 2040) return '2030'
  return '2050'
}

const cache = {}

async function fetchGeoJSON(path) {
  if (cache[path]) return cache[path]
  const res = await fetch(path)
  const data = await res.json()
  cache[path] = data
  return data
}

function getSSPFiles(ssp) {
  switch (ssp) {
    case 'SSP1': return ['/data/water/water_optimistic_lahore.geojson']
    case 'SSP2': return ['/data/water/water_optimistic_lahore.geojson', '/data/water/water_bau_lahore.geojson']
    case 'SSP3': return ['/data/water/water_bau_lahore.geojson']
    case 'SSP4': return ['/data/water/water_bau_lahore.geojson', '/data/water/water_pessimistic_lahore.geojson']
    case 'SSP5': return ['/data/water/water_pessimistic_lahore.geojson']
    default: return ['/data/water/water_bau_lahore.geojson']
  }
}

function isInterpolated(ssp) { return ssp === 'SSP2' || ssp === 'SSP4' }

export default function WaterLayer({ year, ssp, onCellClick }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const files = getSSPFiles(ssp)
      const datasets = await Promise.all(files.map(fetchGeoJSON))
      if (cancelled) return

      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }

      const periodKey = getPeriodKey(year)
      const group = L.layerGroup()
      const interpolated = isInterpolated(ssp)

      // For each feature in dataset[0], pair with same-index from dataset[1] if available
      const features = datasets[0].features

      for (let i = 0; i < features.length; i++) {
        const feat = features[i]
        const feat2 = datasets[1]?.features?.[i]

        let demandCls = feat.properties[`demand_cls_${periodKey}`]
        let supplyCls = feat.properties[`supply_cls_${periodKey}`]

        if (interpolated && feat2) {
          const d2 = feat2.properties[`demand_cls_${periodKey}`]
          const s2 = feat2.properties[`supply_cls_${periodKey}`]
          demandCls = Math.round((demandCls + d2) / 2)
          supplyCls = Math.round((supplyCls + s2) / 2)
        }

        const color = getColor(demandCls, supplyCls)

        const layer = L.geoJSON(feat, {
          style: {
            color,
            weight: 1,
            fillColor: color,
            fillOpacity: 0.85,
          },
        })

        layer.on('click', () => {
          onCellClick({
            layer: 'water',
            value: `Demand: ${demandCls}/4 · Supply: ${supplyCls}/4`,
            unit: 'Aqueduct classification',
            year,
            ssp: interpolated ? `${ssp} (estimated)` : ssp,
            description: 'Lahore\'s water basins rank in the highest demand quartile globally under every climate scenario. Water stress here is structural, not scenario-dependent. What changes across scenarios is how much worse it gets — not whether stress is present.',
            lat: '',
            lng: '',
          })
        })

        layer.on('mouseover', function () {
          this.setStyle({ weight: 2, color: 'rgba(255,255,255,0.4)' })
        })
        layer.on('mouseout', function () {
          this.setStyle({ weight: 1, color })
        })

        group.addLayer(layer)
      }

      if (!cancelled) {
        group.addTo(map)
        layerRef.current = group
      }
    }

    load().catch(console.error)

    return () => {
      cancelled = true
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [year, ssp, map])

  return null
}
