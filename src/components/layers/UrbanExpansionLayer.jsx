import React, { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import Papa from 'papaparse'

const LAHORE_BOUNDS = { minLat: 31.35, maxLat: 31.65, minLng: 74.15, maxLng: 74.55 }
const isInLahore = (lat, lng) =>
  lat >= LAHORE_BOUNDS.minLat && lat <= LAHORE_BOUNDS.maxLat &&
  lng >= LAHORE_BOUNDS.minLng && lng <= LAHORE_BOUNDS.maxLng

const CLASS_COLORS = {
  1: 'rgba(34, 60, 34, 0.55)',    // rural — dark muted green
  2: 'rgba(100, 140, 100, 0.70)', // suburban — mid green
  3: 'rgba(200, 210, 100, 0.85)', // urban — bright yellow-green
}

const CELL_SIZE_URBAN = 0.009
const CELL_SIZE_SETTLE = 0.0009

const cache = {}

async function fetchCSV(path, filterLahore = false) {
  if (cache[path]) return cache[path]
  const res = await fetch(path)
  const text = await res.text()
  const parsed = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true })
  let rows = parsed.data
  if (filterLahore) rows = rows.filter(r => isInLahore(parseFloat(r.lat), parseFloat(r.lon)))
  cache[path] = rows
  return rows
}

function snapUrbanYear(year) {
  // urbanisation CSVs 2015–2030
  if (year < 2015) return 2015
  if (year > 2030) return 2030
  return year
}

function snapSettlementYear(year) {
  const avail = [2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2013,2015,2016,2017,2018,2019,2020]
  let best = avail[0]
  let bestD = Infinity
  for (const y of avail) {
    const d = Math.abs(y - year)
    if (d < bestD) { bestD = d; best = y }
  }
  return best
}

export default function UrbanExpansionLayer({ year, ssp, onCellClick }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const urbanYear = snapUrbanYear(year)
      const settleYear = snapSettlementYear(Math.min(year, 2020))
      const isHistorical = year <= 2030

      const urbanPath = `/data/urbanisation/urbanisation_lahore_${urbanYear}.csv`
      const settlePath = `/data/settlement/settlement_lahore_${settleYear}.csv`

      const [urbanRows, settleRows] = await Promise.all([
        fetchCSV(urbanPath),
        fetchCSV(settlePath),
      ])

      if (cancelled) return

      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }

      const group = L.layerGroup()

      // Render urbanisation classification
      for (const row of urbanRows) {
        const lat = parseFloat(row.lat)
        const lng = parseFloat(row.lon)
        const cls = row.urban_class

        if (!cls) continue

        const fillColor = CLASS_COLORS[cls] || 'rgba(80,80,80,0.3)'

        const rect = L.rectangle(
          [[lat - CELL_SIZE_URBAN / 2, lng - CELL_SIZE_URBAN / 2],
           [lat + CELL_SIZE_URBAN / 2, lng + CELL_SIZE_URBAN / 2]],
          { color: 'none', fillColor, fillOpacity: 1, weight: 0 }
        )

        rect.on('click', () => {
          const labels = { 1: 'Rural', 2: 'Suburban', 3: 'Urban' }
          onCellClick({
            layer: 'urban',
            value: labels[cls] || `Class ${cls}`,
            unit: 'settlement classification',
            year: urbanYear,
            ssp: isHistorical ? 'Measured (WorldPop)' : ssp,
            description: isHistorical
              ? `Measured settlement classification from WorldPop Degree of Urbanisation data for ${urbanYear}.`
              : `Derived settlement classification projected from population density under ${ssp} for ${year}.`,
            lat: lat.toFixed(4),
            lng: lng.toFixed(4),
          })
        })

        group.addLayer(rect)
      }

      // Settlement overlay (built footprint) — render at finer scale
      // Only show settlement for years where we have data
      if (year <= 2020) {
        let count = 0
        for (const row of settleRows) {
          if (row.built !== 1) continue
          if (count > 8000) break // limit for performance at zoom 11
          const lat = parseFloat(row.lat)
          const lng = parseFloat(row.lon)

          const rect = L.rectangle(
            [[lat - CELL_SIZE_SETTLE / 2, lng - CELL_SIZE_SETTLE / 2],
             [lat + CELL_SIZE_SETTLE / 2, lng + CELL_SIZE_SETTLE / 2]],
            { color: 'none', fillColor: 'rgba(255,220,100,0.35)', fillOpacity: 1, weight: 0 }
          )
          group.addLayer(rect)
          count++
        }
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
