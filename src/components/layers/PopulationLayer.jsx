import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import Papa from 'papaparse'

const LAHORE_BOUNDS = { minLat: 31.35, maxLat: 31.65, minLng: 74.15, maxLng: 74.55 }
const isInLahore = (lat, lng) =>
  lat >= LAHORE_BOUNDS.minLat && lat <= LAHORE_BOUNDS.maxLat &&
  lng >= LAHORE_BOUNDS.minLng && lng <= LAHORE_BOUNDS.maxLng

const CELL_SIZE = 0.0083

// Log scale colour: warm sand → ochre → indigo
function popColor(value, maxVal) {
  if (!value || value <= 0) return null
  const logVal = Math.log1p(value)
  const logMax = Math.log1p(maxVal)
  const t = Math.min(logVal / logMax, 1)

  if (t < 0.33) {
    const s = t / 0.33
    return `rgba(${lerp(232,196,s)},${lerp(213,146,s)},${lerp(176,42,s)},0.85)`
  } else if (t < 0.66) {
    const s = (t - 0.33) / 0.33
    return `rgba(${lerp(196,80,s)},${lerp(146,60,s)},${lerp(42,120,s)},0.85)`
  } else {
    const s = (t - 0.66) / 0.34
    return `rgba(${lerp(80,45,s)},${lerp(60,27,s)},${lerp(120,105,s)},0.85)`
  }
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t) }

// Bivariate colours (population quartile × heat quartile)
const BIVAR_COLORS = {
  '1,1': '#e8e8e8', '1,2': '#ace4e4', '1,3': '#5ac8c8', '1,4': '#1a9090',
  '2,1': '#dfb0d6', '2,2': '#a5b7c9', '2,3': '#5698b9', '2,4': '#3a7abf',
  '3,1': '#be64ac', '3,2': '#8c62aa', '3,3': '#3d5da7', '3,4': '#1f4fa3',
  '4,1': '#d7191c', '4,2': '#c0392b', '4,3': '#8e2414', '4,4': '#4b1010',
}

function quartile(val, sorted) {
  const idx = sorted.findIndex(v => val <= v)
  if (idx < 0) return 4
  return Math.floor((idx / sorted.length) * 4) + 1
}

const cache = {}

async function fetchCSV(path, filterLahore = false) {
  if (cache[path]) return cache[path]
  const res = await fetch(path)
  const text = await res.text()
  const parsed = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true })
  let rows = parsed.data
  if (filterLahore) {
    rows = rows.filter(r => isInLahore(parseFloat(r.lat), parseFloat(r.lon)))
  }
  cache[path] = rows
  return rows
}

function getPopPath(year, ssp) {
  const sspNum = parseInt(ssp.replace('SSP', ''))
  if (year <= 2024) {
    return `/data/population/pak_pop_${year}_1km.csv`
  }
  const snapYear = [2025, 2030, 2035, 2040, 2045, 2050].find(y => y >= year) || 2050
  return `/data/population/ssp${sspNum}_lahore_${snapYear}_1km.csv`
}

function getHeatPath(year, ssp) {
  const sspNum = parseInt(ssp.replace('SSP', ''))
  const period = year <= 2040 ? '2021_2040' : '2041_2060'
  return `/data/heat/heat_ssp${sspNum}_${period}_lahore.csv`
}

export default function PopulationLayer({ year, ssp, onCellClick, bivariateMode, heatYear, heatSsp }) {
  const map = useMap()
  const layerRef = useRef(null)
  const [isHistorical, setIsHistorical] = useState(year <= 2024)

  useEffect(() => {
    setIsHistorical(year <= 2024)
    let cancelled = false

    async function load() {
      const popPath = getPopPath(year, ssp)
      const popRows = await fetchCSV(popPath, year <= 2024)

      let heatRows = null
      if (bivariateMode) {
        heatRows = await fetchCSV(getHeatPath(heatYear, heatSsp))
      }

      if (cancelled) return

      const validPop = popRows.filter(r => r.population > 0)
      const popVals = validPop.map(r => r.population).sort((a, b) => a - b)
      const maxPop = popVals[popVals.length - 1] || 1

      let heatVals = null
      if (heatRows) {
        heatVals = heatRows.map(r => r.tmax_anomaly).sort((a, b) => a - b)
      }

      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }

      const group = L.layerGroup()

      for (const row of popRows) {
        const lat = parseFloat(row.lat)
        const lng = parseFloat(row.lon)
        const pop = row.population

        if (!pop || pop <= 0) continue

        let fillColor
        if (bivariateMode && heatRows) {
          const nearestHeat = heatRows.reduce((best, hr) => {
            const d = Math.abs(hr.lat - lat) + Math.abs(hr.lon - lng)
            return d < best.d ? { d, v: hr.tmax_anomaly } : best
          }, { d: Infinity, v: 0 })

          const pq = quartile(pop, popVals)
          const hq = quartile(nearestHeat.v, heatVals)
          fillColor = BIVAR_COLORS[`${pq},${hq}`] || '#888'
        } else {
          fillColor = popColor(pop, maxPop)
        }

        if (!fillColor) continue

        const rect = L.rectangle(
          [[lat - CELL_SIZE / 2, lng - CELL_SIZE / 2], [lat + CELL_SIZE / 2, lng + CELL_SIZE / 2]],
          { color: 'none', fillColor, fillOpacity: bivariateMode ? 0.8 : 0.85, weight: 0 }
        )

        rect.on('click', () => {
          onCellClick({
            layer: 'population',
            value: Math.round(pop).toLocaleString(),
            unit: 'people per km²',
            year,
            ssp: year <= 2024 ? 'Historical (HDX)' : ssp,
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
  }, [year, ssp, map, bivariateMode, heatYear, heatSsp])

  return null
}
