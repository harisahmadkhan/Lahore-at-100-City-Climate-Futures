# Lahore at 100
### Climate Conscious City Futures

An interactive climate intelligence platform showing Lahore across four data
lenses from 2001 to 2080, driven by a year slider and five SSP scenario toggles.
Built for the Smart City Hackathon Lahore 2026 (Theme 2: City Intelligence).

**Live platform:** [lahoreat100.vercel.app](https://lahoreat100.vercel.app)

---

## Lenses

**Urban Expansion** — WorldPop Degree of Urbanisation (2015-2030) and
Built-Settlement Growth Model (2001-2020). Beyond 2030, classification is
derived from WorldPop FuturePop population density thresholds.

**Population Growth** — HDX Pakistan measured counts (2015-2030) transitioning
to five diverging WorldPop FuturePop SSP projections (2025-2050) at the exact
point where certainty ends.

**Water Stress** *(final stage)* — WRI Aqueduct 4.0 watershed demand and supply
classifications across three scenarios mapped onto the SSP framework.

**Heat Anomaly** *(final stage)* — Maximum temperature anomaly against the
1970-2000 historical baseline from WorldClim CMIP6 (MRI-ESM2-0) across five
SSP pathways.

---

## SSP Scenarios

The platform covers all five Shared Socioeconomic Pathways. SSP2 and SSP4 are
synthesized as per-cell means of bracketing scenarios where source datasets do
not publish them directly. The scenario toggle is greyed out before 2025.

---

## Data Sources

| Lens | Source | Coverage |
|------|--------|----------|
| Urban Expansion | WorldPop DUG (id 125016) + BSGM (id 17217) | 2001-2030 |
| Population | HDX Pakistan + WorldPop FuturePop (id 110984) | 2015-2050 |
| Water Stress | WRI Aqueduct 4.0 + HydroSHEDS L6 | 2030/2050/2080 |
| Heat Anomaly | WorldClim CMIP6 MRI-ESM2-0 | 2025-2060 |

Full data span across all lenses: **2001-2080**

---

## Architecture

No backend. No database. No government data access required.

Each lens is a self-contained HTML file generated from a Google Colab processing
pipeline. All data is embedded as JavaScript arrays inside the HTML file.

- **Processing:** Python (rasterio, geopandas, pyproj) in Google Colab
- **Rendering:** Leaflet.js with explicit pane z-ordering
- **Deployment:** Vercel static hosting

---

## License

MIT. Use it, fork it, extend it.

---

*Designed and built with curiosity by Haris Ahmad Khan*
