import React, { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import Papa from 'papaparse'

// Lahore bounds for image overlay — full district
const BOUNDS = [[31.256, 74.003], [31.717, 74.641]]
const CANVAS_W = 300
const CANVAS_H = 280

function lerp(a, b, t) { return a + (b - a) * t }

function anomalyToRGBA(val) {
  const t = Math.min(Math.max(val / 3, 0), 1)
  let r, g, b
  if (t < 0.33) {
    const s = t / 0.33
    r = 255; g = lerp(247, 179, s); b = lerp(230, 71, s)
  } else if (t < 0.66) {
    const s = (t - 0.33) / 0.33
    r = 255; g = lerp(179, 102, s); b = lerp(71, 0, s)
  } else {
    const s = (t - 0.66) / 0.34
    r = lerp(255, 204, s); g = lerp(102, 0, s); b = 0
  }
  return [Math.round(r), Math.round(g), Math.round(b)]
}

// IDW interpolation at a single (lat, lng) point from all heat cells
function idw(lat, lng, cells, power = 2) {
  let sumW = 0, sumWV = 0
  for (const c of cells) {
    const dlat = c.lat - lat
    const dlng = (c.lon - lng) * 0.78 // cos(31.5°) ≈ 0.855, squared ≈ 0.78
    const d2 = dlat * dlat + dlng * dlng
    if (d2 < 1e-10) return c.tmax_anomaly
    const w = 1 / Math.pow(d2, power / 2)
    sumW += w
    sumWV += w * c.tmax_anomaly
  }
  return sumW > 0 ? sumWV / sumW : 0
}

function buildHeatImageURL(cells) {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(CANVAS_W, CANVAS_H)

  const [[swLat, swLng], [neLat, neLng]] = BOUNDS

  for (let py = 0; py < CANVAS_H; py++) {
    const lat = neLat - (py / CANVAS_H) * (neLat - swLat)
    for (let px = 0; px < CANVAS_W; px++) {
      const lng = swLng + (px / CANVAS_W) * (neLng - swLng)
      const val = idw(lat, lng, cells)
      const [r, g, b] = anomalyToRGBA(val)
      const i = (py * CANVAS_W + px) * 4
      img.data[i] = r
      img.data[i + 1] = g
      img.data[i + 2] = b
      img.data[i + 3] = 168 // 0.66 opacity
    }
  }

  ctx.putImageData(img, 0, 0)
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

function getHeatPath(year, ssp) {
  const n = ssp.replace('SSP', '')
  const period = year <= 2040 ? '2021_2040' : '2041_2060'
  return `/data/heat/heat_ssp${n}_${period}_lahore.csv`
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

      // Build interpolated canvas image
      const dataUrl = buildHeatImageURL(rows)
      if (cancelled) return

      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null }

      const overlay = L.imageOverlay(dataUrl, BOUNDS, {
        opacity: 1,
        interactive: true,
      })

      overlay.on('click', (e) => {
        // Find nearest cell to click
        const { lat, lng } = e.latlng
        const nearest = rows.reduce((best, r) => {
          const d = (r.lat - lat) ** 2 + (r.lon - lng) ** 2
          return d < best.d ? { d, r } : best
        }, { d: Infinity, r: rows[0] })
        const period = year <= 2040 ? '2021–2040' : '2041–2060'
        onCellClick({
          layer: 'heat',
          value: `+${nearest.r.tmax_anomaly.toFixed(2)}°C`,
          unit: 'above 1970–2000 baseline',
          year,
          ssp,
          description: `Projected ${nearest.r.tmax_anomaly.toFixed(2)}°C above the historical baseline for the ${period} period under ${ssp}. This is the interpolated surface derived from the MRI-ESM2-0 climate model.`,
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
  }, [year, ssp, map])

  return null
}
