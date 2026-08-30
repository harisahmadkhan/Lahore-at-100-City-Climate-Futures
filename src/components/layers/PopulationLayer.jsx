import React, { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import Papa from 'papaparse'

const BOUNDS = [[31.256, 74.003], [31.717, 74.641]]

let boundaryRing = null
async function fetchBoundary() {
  if (boundaryRing) return boundaryRing
  const res = await fetch('/data/boundary/lahore_boundary.geojson')
  const geojson = await res.json()
  boundaryRing = geojson.features[0].geometry.coordinates[0][0]
  return boundaryRing
}

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

function buildPopCanvas(popRows, heatRows, ring) {
  const [[swLat, swLng], [neLat, neLng]] = BOUNDS
  const latSpan = neLat - swLat
  const lngSpan = neLng - swLng
  const cellDeg = 0.009
  const halfCell = cellDeg / 2

  // Build regular grid array for fast bilinear lookup
  const numCols = Math.ceil(lngSpan / cellDeg) + 2
  const numRows = Math.ceil(latSpan / cellDeg) + 2
  const grid = new Float32Array(numRows * numCols)
  for (const row of popRows) {
    if (!row.population || row.population <= 0) continue
    const lat = parseFloat(row.lat)
    const lng = parseFloat(row.lon)
    const col = Math.round((lng - swLng - halfCell) / cellDeg)
    const r   = Math.round((neLat - lat - halfCell) / cellDeg)
    if (col >= 0 && col < numCols && r >= 0 && r < numRows)
      grid[r * numCols + col] = row.population
  }

  function bilinearPop(lat, lng) {
    const x = (lng - swLng - halfCell) / cellDeg
    const y = (neLat - lat - halfCell) / cellDeg
    const x0 = Math.floor(x), x1 = x0 + 1
    const y0 = Math.floor(y), y1 = y0 + 1
    const tx = x - x0, ty = y - y0
    const get = (rr, cc) =>
      rr < 0 || rr >= numRows || cc < 0 || cc >= numCols ? 0 : grid[rr * numCols + cc]
    return get(y0,x0)*(1-tx)*(1-ty) + get(y0,x1)*tx*(1-ty)
         + get(y1,x0)*(1-tx)*ty   + get(y1,x1)*tx*ty
  }

  const popVals = popRows.filter(r => r.population > 0).map(r => r.population).sort((a, b) => a - b)
  const heatQuartile = heatRows
    ? (v) => v < 0.75 ? 1 : v < 1.5 ? 2 : v < 2.25 ? 3 : 4
    : null

  // Render each pixel with bilinearly interpolated pop value — smooth continuous surface
  const W = 300, H = 220
  const offscreen = document.createElement('canvas')
  offscreen.width = W; offscreen.height = H
  const offCtx = offscreen.getContext('2d')
  const img = offCtx.createImageData(W, H)

  for (let py = 0; py < H; py++) {
    const lat = neLat - (py / H) * latSpan
    for (let px = 0; px < W; px++) {
      const lng = swLng + (px / W) * lngSpan
      const pop = bilinearPop(lat, lng)
      if (pop <= 0) continue

      let r, g, b
      if (heatRows && heatQuartile) {
        const heatVal = idwHeat(lat, lng, heatRows)
        const pq = quartile(pop, popVals)
        const hq = heatQuartile(heatVal)
        const rgb = BIVAR[`${pq},${hq}`] || [136, 136, 136]
        r = rgb[0]; g = rgb[1]; b = rgb[2]
      } else {
        const rgb = popToRGBA(pop, LOG_MAX)
        if (!rgb) continue
        r = rgb[0]; g = rgb[1]; b = rgb[2]
      }

      const i = (py * W + px) * 4
      img.data[i] = r; img.data[i+1] = g; img.data[i+2] = b; img.data[i+3] = 224
    }
  }
  offCtx.putImageData(img, 0, 0)

  // Scale up to display size with bilinear smoothing, then apply crisp boundary mask
  const DW = 760, DH = 560
  const canvas = document.createElement('canvas')
  canvas.width = DW; canvas.height = DH
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(offscreen, 0, 0, DW, DH)

  ctx.globalCompositeOperation = 'destination-in'
  ctx.fillStyle = 'white'
  ctx.beginPath()
  for (let i = 0; i < ring.length; i++) {
    const [lng, lat] = ring[i]
    const px = (lng - swLng) / lngSpan * DW
    const py = (neLat - lat) / latSpan * DH
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'

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
      const [popRows, heatRows, ring] = await Promise.all([
        fetchCSV(popPath),
        bivariateMode ? fetchCSV(getHeatPath(year, ssp)) : Promise.resolve(null),
        fetchBoundary(),
      ])
      if (cancelled) return

      const dataUrl = buildPopCanvas(popRows, heatRows, ring)
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
