# Lahore at 100
### Climate Conscious City Futures

Lahore is one of the fastest-growing megacities on earth. By 2047 — a century after independence — it will hold more people than many countries do today, pressed against shrinking water reserves and rising heat. The question is not whether the city will change. It is whether anyone can see clearly enough, far enough ahead, to shape how it changes.

**Lahore at 100** is a climate intelligence platform that makes that future visible. Four data lenses, five diverging futures, one city — rendered interactively from 2001 to 2080 without a single line of server code.

**Live platform:** [lahore-at-100-city-climate-futures.vercel.app](https://lahore-at-100-city-climate-futures.vercel.app)

Built for the Smart City Hackathon Lahore 2026 · Theme 2: City Intelligence

---

## The Four Lenses

**Urban Expansion** — Where the city is spreading and how fast. This lens draws from WorldPop's Degree of Urbanisation classifications and the Built-Settlement Growth Model to trace the physical footprint of Lahore from 2001 onward. Past 2030, settlement extent is derived from WorldPop FuturePop population density thresholds, letting the map answer a question planners rarely get to ask in advance: *which fields and villages become city next?*

**Population Growth** — Who will be here, and how many. Measured HDX Pakistan census counts carry the story through 2030, at which point five diverging WorldPop FuturePop SSP projections take over — each one a coherent narrative about how global development choices ripple down to a single city's growth curve. The transition is seamless and intentional: certainty gives way to scenario precisely where the data does.

**Water Stress** — How strained the watershed becomes under each future. WRI Aqueduct 4.0 demand-and-supply classifications, disaggregated to HydroSHEDS Level 6 sub-basins, map Lahore's water vulnerability at 2030, 2050, and 2080 across three stress pathways aligned to the SSP framework. The picture it draws is not comfortable.

**Heat Anomaly** — How much hotter Lahore becomes relative to the world it already knew. Maximum temperature anomalies against the 1970–2000 historical baseline, drawn from WorldClim CMIP6 downscaled output (MRI-ESM2-0), show five distinct warming trajectories through 2060. Some are survivable. Some are not.

---

## Scenarios

The platform covers all five Shared Socioeconomic Pathways — from SSP1's sustainable development to SSP5's fossil-fuelled growth. SSP2 and SSP4 are synthesized as per-cell means of their bracketing scenarios, because the primary datasets do not publish them directly. The scenario toggle is intentionally locked before 2025: before that point, the data is measured, not modelled, and the distinction matters.

| Scenario | Description |
|----------|-------------|
| SSP1 | Sustainability — low challenges to mitigation and adaptation |
| SSP2 | Middle of the road |
| SSP3 | Regional rivalry — high challenges to both |
| SSP4 | Inequality — low mitigation, high adaptation challenges |
| SSP5 | Fossil-fuelled development — high mitigation, low adaptation challenges |

---

## Data Sources

| Lens | Source | Coverage |
|------|--------|----------|
| Urban Expansion | WorldPop DUG (id 125016) + BSGM (id 17217) | 2001–2030 |
| Population | HDX Pakistan + WorldPop FuturePop (id 110984) | 2015–2050 |
| Water Stress | WRI Aqueduct 4.0 + HydroSHEDS L6 | 2030 / 2050 / 2080 |
| Heat Anomaly | WorldClim CMIP6 MRI-ESM2-0 | 2025–2060 |

Full data span across all lenses: **2001–2080**

All sources are open, peer-reviewed, and freely accessible. No proprietary feeds. No government portals. No data access agreements.

---

## Architecture

There is no backend. No database. No server to maintain.

Each lens is a single, self-contained HTML file produced by a Python processing pipeline in Google Colab. All geospatial data — rasterized, reprojected, and classified — is embedded directly as JavaScript arrays inside the HTML. The files open in any browser, work offline, and deploy to a global CDN edge network with zero configuration.

This is a deliberate constraint. A platform built for a city with unreliable infrastructure should not itself depend on infrastructure to function.

- **Processing:** Python — rasterio, geopandas, pyproj — in Google Colab
- **Rendering:** Leaflet.js with explicit pane z-ordering for pixel-perfect layer control
- **Deployment:** Vercel static hosting, zero build step

---

## License

MIT. Use it, fork it, extend it.

---

*Designed and built with curiosity by Haris Ahmad Khan*
