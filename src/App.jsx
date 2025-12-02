import { useState } from 'react';
import Map from './components/Map';
import SearchBar from './components/SearchBar';
import ParcelDetail from './components/ParcelDetail';
import './App.css';

function App() {
  const [showSoil, setShowSoil] = useState(true);
  const [showParcels, setShowParcels] = useState(true);
  const [selectedParcelId, setSelectedParcelId] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  const handleParcelSelect = (parcelId) => {
    setSelectedParcelId(parcelId);
    setShowDetailPanel(true);
  };

  const handleCloseDetail = () => {
    setShowDetailPanel(false);
    setSelectedParcelId(null);
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
        </div>

        <div className="legend">
          <h3 className="legend-title">Legend</h3>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color soil-gradient"></div>
              <span>Soil Types</span>
            </div>
            <div className="legend-item">
              <div className="legend-color parcels-color"></div>
              <span>Property Parcels</span>
            </div>
          </div>
        </div>
      </div>

      <Map
        showSoil={showSoil}
        showParcels={showParcels}
        onParcelSelect={handleParcelSelect}
        selectedParcelId={selectedParcelId}
      />

      {/* Parcel Detail Panel */}
      {showDetailPanel && (
        <ParcelDetail
          parcelId={selectedParcelId}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}

export default App;
