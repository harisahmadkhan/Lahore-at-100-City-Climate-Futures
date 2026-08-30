import { useRef } from 'react'
import Papa from 'papaparse'

const LAHORE_BOUNDS = {
  minLat: 31.35,
  maxLat: 31.65,
  minLng: 74.15,
  maxLng: 74.55,
}

const isInLahore = (lat, lng) =>
  lat >= LAHORE_BOUNDS.minLat &&
  lat <= LAHORE_BOUNDS.maxLat &&
  lng >= LAHORE_BOUNDS.minLng &&
  lng <= LAHORE_BOUNDS.maxLng

export function useDataCache() {
  const cache = useRef({})

  const loadCSV = async (path, filterLahore = false) => {
    if (cache.current[path]) return cache.current[path]

    const res = await fetch(path)
    const text = await res.text()
    const parsed = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true })
    let rows = parsed.data

    if (filterLahore) {
      rows = rows.filter(r => isInLahore(parseFloat(r.lat), parseFloat(r.lon)))
    }

    cache.current[path] = rows
    return rows
  }

  const loadGeoJSON = async (path) => {
    if (cache.current[path]) return cache.current[path]
    const res = await fetch(path)
    const data = await res.json()
    cache.current[path] = data
    return data
  }

  return { loadCSV, loadGeoJSON }
}
