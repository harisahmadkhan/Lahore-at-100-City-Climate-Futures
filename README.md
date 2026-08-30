# Lahore at 100 — Climate Conscious City Futures

An interactive climate intelligence map built around a single question: **what does Lahore look like when Pakistan turns one hundred in 2047, and does the answer change depending on which climate future arrived?**

The tool shows Lahore across four data lenses from 2020 to 2050, driven by a year slider and a five-scenario SSP toggle.

---

## Live Demo

Deployed on Vercel → [lahore-at-100.vercel.app](https://lahore-at-100.vercel.app)

---

## Four Lenses

| Lens | Data source | Period |
|---|---|---|
| **Urban Expansion** | WorldPop Degree of Urbanisation + Built-Settlement Growth | 2015–2030 (measured) |
| **Population** | WorldPop HDX baseline / FuturePop SSP1–5 | 2015–2050 |
| **Water Stress** | WRI Aqueduct 4.0 Future Annual | 2030 / 2050 |
| **Heat** | WorldClim CMIP6 MRI-ESM2-0, tmax anomaly vs 1970–2000 | 2021–2060 |

---

## Five Scenarios

| Scenario | Narrative |
|---|---|
| **SSP1** | Sustainability — rapid decarbonisation, global cooperation, under 2°C |
| **SSP2** | Middle of the Road — unfinished business, slow progress |
| **SSP3** | Regional Rivalry — fragmented world, high emissions, mass migration |
| **SSP4** | Inequality — uneven adaptation, two Lahores within one city |
| **SSP5** | Fossil-Fuelled Development — largest and hottest version of the city |

2047 is the centenary marker. It is the destination the slider is pointing toward.

---

## Combined Mode

When **Population** and **Heat** are active simultaneously, the map switches to a 4×4 bivariate risk matrix. The critical corner — high population density, high heat anomaly — identifies which specific Lahore cells carry both pressure and thermal risk simultaneously. This is the single most important output the tool produces.

---

## Tech Stack

- **React 18** + **Vite**
- **Leaflet** + **react-leaflet** — map rendering
- **PapaParse** — CSV streaming
- **Canvas API** — interpolated heat surface (IDW from 72 model cells), population raster, settlement bitmap
- **ESRI Dark Canvas** — basemap (no API key required)
- **Vercel** — deployment

---

## Data

All data is pre-processed and Lahore-clipped. Placed in `public/data/` and served as static assets — no backend, no API keys, no CORS.

```
public/data/
├── boundary/          lahore_boundary.geojson
├── heat/              10 CSVs — heat_ssp{1-5}_{2021_2040|2041_2060}_lahore.csv
├── population/        16 HDX baseline + 30 SSP projection CSVs
├── settlement/        18 built-footprint CSVs at 100m resolution (2001–2020)
├── urbanisation/      16 classification CSVs + statistics reference
└── water/             3 GeoJSONs — optimistic / BAU / pessimistic scenarios
```

**Sources:**
- WorldPop FuturePop SSP projections — [hub.worldpop.org](https://hub.worldpop.org/geodata/summary?id=110984)
- WorldPop HDX baseline — [data.humdata.org](https://data.humdata.org/dataset/worldpop-population-counts-2015-2030-pak)
- WorldPop Degree of Urbanisation — [hub.worldpop.org](https://hub.worldpop.org/geodata/listing?id=146)
- WorldPop Built-Settlement Growth — [hub.worldpop.org](https://hub.worldpop.org/geodata/summary?id=17217)
- WRI Aqueduct 4.0 — [wri.org](https://www.wri.org/data/aqueduct-global-maps-40-data)
- WorldClim CMIP6 — [worldclim.org](https://www.worldclim.org/data/cmip6/cmip6climate.html)
- Pakistan COD-AB admin boundary — [data.humdata.org](https://data.humdata.org/dataset/cod-ab-pak)

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build & Deploy

```bash
npm run build
```

Connect the repository to [Vercel](https://vercel.com). Framework preset: **Vite**. No environment variables required.

---

## Project

*Ainda Ka Lahore* — a climate futures project for Pakistan's centenary year.
