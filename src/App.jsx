import { useState } from 'react';
import Map from './components/Map';
import SearchBar from './components/SearchBar';
import ParcelDetail from './components/ParcelDetail';
import './App.css';

function App() {
  const [showSoil, setShowSoil] = useState(true);
  const [showParcels, setShowParcels] = useState(true);
  const [selectedParcelId, setSelectedParcelId] = useState(null);
  const [soilData, setSoilData] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [mapStyle, setMapStyle] = useState('dark');

  const handleParcelSelect = (parcelId) => {
    setSelectedParcelId(parcelId);
    setShowDetailPanel(true);
  };

  const handleSoilDataSelect = (soilProps) => {
    setSoilData(soilProps);
  };

  const handleCloseDetail = () => {
    setShowDetailPanel(false);
    setSelectedParcelId(null);
    setSoilData(null);
  };

  return (
    <div className="app">
      {/* Search Bar */}
      <div className="search-container">
        <SearchBar onParcelSelect={handleParcelSelect} />
      </div>

      <div className="controls-panel">
        <h2 className="controls-title">Map Layers</h2>

        <div className="layer-controls">
          <button
            className={`layer-toggle ${showSoil ? 'active' : ''}`}
            onClick={() => setShowSoil(!showSoil)}
          >
            <div className="toggle-indicator soil-indicator"></div>
            <div className="toggle-content">
              <span className="toggle-label">Soil Data</span>
              <span className="toggle-status">{showSoil ? 'Visible' : 'Hidden'}</span>
            </div>
          </button>

          <button
            className={`layer-toggle ${showParcels ? 'active' : ''}`}
            onClick={() => setShowParcels(!showParcels)}
          >
            <div className="toggle-indicator parcels-indicator"></div>
            <div className="toggle-content">
              <span className="toggle-label">Parcels</span>
              <span className="toggle-status">{showParcels ? 'Visible' : 'Hidden'}</span>
            </div>
          </button>

          <button
            className={`layer-toggle ${mapStyle === 'satellite' ? 'active' : ''}`}
            onClick={() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark')}
          >
            <div className="toggle-indicator satellite-indicator"></div>
            <div className="toggle-content">
              <span className="toggle-label">Satellite View</span>
              <span className="toggle-status">{mapStyle === 'satellite' ? 'Active' : 'Inactive'}</span>
            </div>
          </button>
        </div>


      </div>

      <Map
        showSoil={showSoil}
        showParcels={showParcels}
        onParcelSelect={handleParcelSelect}
        onSoilDataSelect={handleSoilDataSelect}
        selectedParcelId={selectedParcelId}
        mapStyle={mapStyle}
      />

      {/* Parcel Detail Panel */}
      {showDetailPanel && (
        <ParcelDetail
          parcelId={selectedParcelId}
          soilData={soilData}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}

export default App;
