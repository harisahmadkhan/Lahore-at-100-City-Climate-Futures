import React from 'react'
import PopulationLayer from './layers/PopulationLayer'
import HeatLayer from './layers/HeatLayer'
import WaterLayer from './layers/WaterLayer'
import UrbanExpansionLayer from './layers/UrbanExpansionLayer'

export default function MapLayers({ year, ssp, activeLayers, onCellClick }) {
  const bothPopHeat = activeLayers.population && activeLayers.heat

  return (
    <>
      {activeLayers.urban && (
        <UrbanExpansionLayer year={year} ssp={ssp} onCellClick={onCellClick} />
      )}
      {activeLayers.water && (
        <WaterLayer year={year} ssp={ssp} onCellClick={onCellClick} />
      )}
      {activeLayers.population && (
        <PopulationLayer
          year={year}
          ssp={ssp}
          onCellClick={onCellClick}
          bivariateMode={bothPopHeat}
          heatYear={year}
          heatSsp={ssp}
        />
      )}
      {activeLayers.heat && !bothPopHeat && (
        <HeatLayer year={year} ssp={ssp} onCellClick={onCellClick} />
      )}
    </>
  )
}
