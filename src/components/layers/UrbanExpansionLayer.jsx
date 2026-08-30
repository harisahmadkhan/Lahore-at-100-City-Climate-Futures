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

function applyBoundaryPath(ctx, ring, W, H) {
  const [[swLat, swLng], [neLat, neLng]] = BOUNDS
  ctx.beginPath()
  for (let i = 0; i < ring.length; i++) {
    const [lng, lat] = ring[i]
    const px = (lng - swLng) / (neLng - swLng) * W
    const py = (neLat - lat) / (neLat - swLat) * H
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

// Urban class colours
const CLASS_RGBA = {
  1: [34,  60,  34,  130], // rural — dark muted green
  2: [80, 130,  80,  160], // suburban — mid green
  3: [210, 220, 80,  200], // urban — bright yellow-green
}

// Settlement built pixel colour (warm amber dot)
const SETTLE_RGBA = [255, 200, 80, 140]

const cache = {}

async function fetchCSV(path) {
  if (cache[path]) return cache[path]
  const res = await fetch(path)
  const text = await res.text()
  const { data } = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true })
  cache[path] = data
  return data
}

function snapUrbanYear(year) {
  return Math.min(Math.max(year, 2015), 2030)
}

function snapSettlementYear(year) {
  const avail = [2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2013,2015,2016,2017,2018,2019,2020]
  return avail.reduce((best, y) => Math.abs(y - year) < Math.abs(best - year) ? y : best, avail[0])
}

function buildUrbanCanvas(urbanRows, ring) {
  const [[swLat, swLng], [neLat, neLng]] = BOUNDS
  const W = 800, H = 640

  const offscreen = document.createElement('canvas')
  offscreen.width = W; offscreen.height = H
  const offCtx = offscreen.getContext('2d')
  const img = offCtx.createImageData(W, H)

  const cellLat = 0.009
  const cellLng = 0.009
  const cellPxW = Math.ceil((cellLng / (neLng - swLng)) * W) + 1
  const cellPxH = Math.ceil((cellLat / (neLat - swLat)) * H) + 1

  for (const row of urbanRows) {
    const cls = row.urban_class
    if (!cls) continue
    const rgba = CLASS_RGBA[cls]
    if (!rgba) continue

    const lat = parseFloat(row.lat)
    const lng = parseFloat(row.lon)
    const cx = Math.round((lng - swLng) / (neLng - swLng) * W)
    const cy = Math.round((neLat - lat) / (neLat - swLat) * H)

    const x0 = Math.max(0, cx - Math.floor(cellPxW / 2))
    const y0 = Math.max(0, cy - Math.floor(cellPxH / 2))
    const x1 = Math.min(W, x0 + cellPxW)
    const y1 = Math.min(H, y0 + cellPxH)

    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        const i = (py * W + px) * 4
        img.data[i] = rgba[0]; img.data[i+1] = rgba[1]; img.data[i+2] = rgba[2]; img.data[i+3] = rgba[3]
      }
    }
  }
  offCtx.putImageData(img, 0, 0)

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.drawImage(offscreen, 0, 0)
  ctx.globalCompositeOperation = 'destination-in'
  ctx.fillStyle = 'white'
  applyBoundaryPath(ctx, ring, W, H)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  return canvas.toDataURL()
}

function buildSettlementCanvas(settleRows, ring) {
  const [[swLat, swLng], [neLat, neLng]] = BOUNDS
  const W = 444, H = 510

  const offscreen = document.createElement('canvas')
  offscreen.width = W; offscreen.height = H
  const offCtx = offscreen.getContext('2d')
  const img = offCtx.createImageData(W, H)

  for (const row of settleRows) {
    if (row.built !== 1) continue
    const lat = parseFloat(row.lat)
    const lng = parseFloat(row.lon)
    const px = Math.round((lng - swLng) / (neLng - swLng) * W)
    const py = Math.round((neLat - lat) / (neLat - swLat) * H)
    if (px < 0 || px >= W || py < 0 || py >= H) continue
    const i = (py * W + px) * 4
    img.data[i] = SETTLE_RGBA[0]; img.data[i+1] = SETTLE_RGBA[1]
    img.data[i+2] = SETTLE_RGBA[2]; img.data[i+3] = SETTLE_RGBA[3]
  }
  offCtx.putImageData(img, 0, 0)

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.drawImage(offscreen, 0, 0)
  ctx.globalCompositeOperation = 'destination-in'
  ctx.fillStyle = 'white'
  applyBoundaryPath(ctx, ring, W, H)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  return canvas.toDataURL()
}

export default function UrbanExpansionLayer({ year, ssp, onCellClick }) {
  const map = useMap()
  const urbanRef = useRef(null)
  const settleRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const urbanYear = snapUrbanYear(year)
      const settleYear = snapSettlementYear(Math.min(year, 2020))
      const showSettle = year <= 2020

      const [urbanRows, settleRows, ring] = await Promise.all([
        fetchCSV(`/data/urbanisation/urbanisation_lahore_${urbanYear}.csv`),
        showSettle ? fetchCSV(`/data/settlement/settlement_lahore_${settleYear}.csv`) : Promise.resolve([]),
        fetchBoundary(),
      ])
      if (cancelled) return

      const urbanUrl = buildUrbanCanvas(urbanRows, ring)
      const settleUrl = showSettle ? buildSettlementCanvas(settleRows, ring) : null
      if (cancelled) return

      // Remove old layers
      if (urbanRef.current) { map.removeLayer(urbanRef.current); urbanRef.current = null }
      if (settleRef.current) { map.removeLayer(settleRef.current); settleRef.current = null }

      // Urban classification overlay
      const urbanOverlay = L.imageOverlay(urbanUrl, BOUNDS, { opacity: 1, interactive: true })
      urbanOverlay.on('click', (e) => {
        const { lat, lng } = e.latlng
        const nearest = urbanRows.reduce((best, r) => {
          const d = (r.lat - lat) ** 2 + (r.lon - lng) ** 2
          return d < best.d ? { d, r } : best
        }, { d: Infinity, r: urbanRows[0] })
        const labels = { 1: 'Rural', 2: 'Suburban', 3: 'Urban' }
        onCellClick({
          layer: 'urban',
          value: labels[nearest.r.urban_class] || `Class ${nearest.r.urban_class}`,
          unit: 'settlement classification',
          year: urbanYear,
          ssp: year <= 2030 ? 'Measured (WorldPop)' : ssp,
          description: `WorldPop Degree of Urbanisation classification for ${urbanYear}. Classes are derived from population density: Rural (<300 people/km²), Suburban (300–1500), Urban (>1500).`,
          lat: lat.toFixed(4),
          lng: lng.toFixed(4),
        })
      })

      if (!cancelled) { urbanOverlay.addTo(map); urbanRef.current = urbanOverlay }

      // Settlement built-footprint overlay (100m pixels)
      if (settleUrl && !cancelled) {
        const settleOverlay = L.imageOverlay(settleUrl, BOUNDS, { opacity: 0.7, interactive: false })
        settleOverlay.addTo(map)
        settleRef.current = settleOverlay
      }
    }

    load().catch(console.error)

    return () => {
      cancelled = true
      if (urbanRef.current) { map.removeLayer(urbanRef.current); urbanRef.current = null }
      if (settleRef.current) { map.removeLayer(settleRef.current); settleRef.current = null }
    }
  }, [year, ssp, map])

  return null
}
