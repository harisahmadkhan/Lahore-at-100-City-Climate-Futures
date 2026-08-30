import React, { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import Papa from 'papaparse'

const CELL_SIZE = 0.0417 // ~2.5 arcmin

function heatColor(anomaly) {
  // cream → amber → orange → deep red, 0 to 3°C
  const t = Math.min(Math.max(anomaly / 3, 0), 1)
  if (t < 0.33) {
    const s = t / 0.33
    return `rgba(${lerp(255,255,s)},${lerp(247,179,s)},${lerp(230,71,s)},0.65)`
  } else if (t < 0.66) {
    const s = (t - 0.33) / 0.33
    return `rgba(${lerp(255,255,s)},${lerp(179,102,s)},${lerp(71,0,s)},0.65)`
  } else {
    const s = (t - 0.66) / 0.34
    return `rgba(${lerp(255,204,s)},${lerp(102,0,s)},${lerp(0,0,s)},0.65)`
  }
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t) }

const cache = {}

async function fetchCSV(path) {
  if (cache[path]) return cache[path]
  const res = await fetch(path)
  const text = await res.text()
  const parsed = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true })
  cache[path] = parsed.data
  return parsed.data
}

function getHeatPath(year, ssp) {
  const sspNum = parseInt(ssp.replace('SSP', ''))
  const period = year <= 2040 ? '2021_2040' : '2041_2060'
  return `/data/heat/heat_ssp${sspNum}_${period}_lahore.csv`
}

export default function HeatLayer({ year, ssp, onCellClick }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const path = getHeatPath(year, ssp)
      const rows = await fetchCSV(path)
      if (cancelled) return

      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }

      const group = L.layerGroup()

      for (const row of rows) {
        const lat = parseFloat(row.lat)
        const lng = parseFloat(row.lon)
        const anomaly = row.tmax_anomaly

        if (anomaly == null) continue

        const fillColor = heatColor(anomaly)
        const period = year <= 2040 ? '2021–2040' : '2041–2060'

        const rect = L.rectangle(
          [[lat - CELL_SIZE / 2, lng - CELL_SIZE / 2], [lat + CELL_SIZE / 2, lng + CELL_SIZE / 2]],
          { color: 'none', fillColor, fillOpacity: 0.65, weight: 0 }
        )

        rect.on('click', () => {
          onCellClick({
            layer: 'heat',
            value: `+${anomaly.toFixed(2)}°C`,
            unit: 'above 1970–2000 baseline',
            year,
            ssp,
            description: `This area is projected to be ${anomaly.toFixed(2)}°C above its historical temperature average for the ${period} period under ${ssp}.`,
            lat: lat.toFixed(4),
            lng: lng.toFixed(4),
          })
        })

        group.addLayer(rect)
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
