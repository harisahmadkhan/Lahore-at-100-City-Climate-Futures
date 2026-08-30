import React, { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import Papa from 'papaparse'

// Full Lahore district bounds for the image overlay
const BOUNDS = [[31.256, 74.003], [31.717, 74.641]]

function lerp(a, b, t) { return Math.round(a + (b - a) * t) }

// Log-scale population → RGB. Fixed scale 0–35000 people/km²
function popToRGBA(pop, logMax) {
  if (!pop || pop <= 0) return null
  const t = Math.min(Math.log1p(pop) / logMax, 1)
  let r, g, b
  if (t < 0.33) {
    const s = t / 0.33
    r = lerp(232, 196, s); g = lerp(213, 146, s); b = lerp(176, 42, s)
  } else if (t < 0.66) {
    const s = (t - 0.33) / 0.33
    r = lerp(196, 80, s); g = lerp(146, 60, s); b = lerp(42, 120, s)
  } else {
    const s = (t - 0.66) / 0.34
    r = lerp(80, 45, s); g = lerp(60, 27, s); b = lerp(120, 105, s)
  }
  return [r, g, b]
}

// Bivariate colour matrix — pop quartile × heat quartile
const BIVAR = {
  '1,1': [232,232,232], '1,2': [172,228,228], '1,3': [90,200,200], '1,4': [26,144,144],
  '2,1': [223,176,214], '2,2': [165,183,201], '2,3': [86,152,185], '2,4': [58,122,191],
  '3,1': [190,100,172], '3,2': [140,98,170], '3,3': [61,93,167], '3,4': [31,79,163],
  '4,1': [215,25,28],   '4,2': [192,57,43],  '4,3': [142,36,20],  '4,4': [75,16,16],
}

function quartile(val, sorted) {
  if (!sorted.length) return 1
  const idx = sorted.findIndex(v => val <= v)
  if (idx < 0) return 4
  return Math.min(4, Math.floor((idx / sorted.length) * 4) + 1)
}

// IDW heat interpolation at (lat, lng) from 72 heat cells
function idwHeat(lat, lng, heatCells) {
  let sumW = 0, sumWV = 0
  for (const c of heatCells) {
    const dlat = c.lat - lat
    const dlng = (c.lon - lng) * 0.78
    const d2 = dlat * dlat + dlng * dlng
    if (d2 < 1e-10) return c.tmax_anomaly
    const w = 1 / d2
    sumW += w; sumWV += w * c.tmax_anomaly
  }
  return sumW > 0 ? sumWV / sumW : 0
}

const LOG_MAX = Math.log1p(35000)

function buildPopCanvas(popRows, heatRows) {
  const [[swLat, swLng], [neLat, neLng]] = BOUNDS
  const latSpan = neLat - swLat
  const lngSpan = neLng - swLng

  // Canvas resolution: ~8 pixels per 1km cell at zoom 11 (2× upscale at full view)
  const W = 760, H = 560
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

    // Population relative quartile — sorted ascending
  const popVals = popRows.filter(r => r.population > 0).map(r => r.population).sort((a, b) => a - b)

  // Heat uses absolute thresholds (0–3°C global range) so SSP identity is preserved
  // Q1 <0.75°C, Q2 0.75–1.5°C, Q3 1.5–2.25°C, Q4 ≥2.25°C
  const heatQuartile = heatRows
    ? (v) => v < 0.75 ? 1 : v < 1.5 ? 2 : v < 2.25 ? 3 : 4
    : null

  // Cell size in degrees (1km population grid)
  const cellDegLat = 0.009
  const cellDegLng = 0.009

  const cellW = Math.ceil((cellDegLng / lngSpan) * W) + 1
  const cellH = Math.ceil((cellDegLat / latSpan) * H) + 1

  for (const row of popRows) {
    const pop = row.population
    if (!pop || pop <= 0) continue

    const lat = parseFloat(row.lat)
    const lng = parseFloat(row.lon)

    const px = Math.round((lng - swLng) / lngSpan * W)
    const py = Math.round((neLat - lat) / latSpan * H)

    let rgba
    if (heatRows && heatQuartile) {
      const heatVal = idwHeat(lat, lng, heatRows)
      const pq = quartile(pop, popVals)
      const hq = heatQuartile(heatVal)
      rgba = BIVAR[`${pq},${hq}`] || [136, 136, 136]
    } else {
      rgba = popToRGBA(pop, LOG_MAX)
      if (!rgba) continue
    }

    ctx.fillStyle = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},0.88)`
    ctx.fillRect(px - Math.floor(cellW / 2), py - Math.floor(cellH / 2), cellW, cellH)
  }

  return canvas.toDataURL()
}

const cache = {}

async function fetchCSV(path) {
  if (cache[path]) return cache[path]
  const res = await fetch(path)
  const text = await res.text()
  const { data } = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true })
  cache[path] = data
  return data
}

function getPopPath(year, ssp) {
  const n = ssp.replace('SSP', '')
  if (year <= 2024) return `/data/population/pak_pop_${year}_1km.csv`
  const snap = [2025, 2030, 2035, 2040, 2045, 2050].find(y => y >= year) || 2050
  return `/data/population/ssp${n}_lahore_${snap}_1km.csv`
}

function getHeatPath(year, ssp) {
  const n = ssp.replace('SSP', '')
  const period = year <= 2040 ? '2021_2040' : '2041_2060'
  return `/data/heat/heat_ssp${n}_${period}_lahore.csv`
}

export default function PopulationLayer({ year, ssp, onCellClick, bivariateMode }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const popPath = getPopPath(year, ssp)
      const [popRows, heatRows] = await Promise.all([
        fetchCSV(popPath),
        bivariateMode ? fetchCSV(getHeatPath(year, ssp)) : Promise.resolve(null),
      ])
      if (cancelled) return

      const dataUrl = buildPopCanvas(popRows, heatRows)
      if (cancelled) return

      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null }

      const overlay = L.imageOverlay(dataUrl, BOUNDS, { opacity: 1, interactive: true })

      overlay.on('click', (e) => {
        const { lat, lng } = e.latlng
        const nearest = popRows
          .filter(r => r.population > 0)
          .reduce((best, r) => {
            const d = (r.lat - lat) ** 2 + (r.lon - lng) ** 2
            return d < best.d ? { d, r } : best
          }, { d: Infinity, r: popRows[0] })
        onCellClick({
          layer: 'population',
          value: Math.round(nearest.r.population).toLocaleString(),
          unit: 'people per km²',
          year,
          ssp: year <= 2024 ? 'Historical (HDX baseline)' : ssp,
          lat: lat.toFixed(4),
          lng: lng.toFixed(4),
        })
      })

      if (!cancelled) { overlay.addTo(map); layerRef.current = overlay }
    }

    load().catch(console.error)

    return () => {
      cancelled = true
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null }
    }
  }, [year, ssp, map, bivariateMode])

  return null
}
