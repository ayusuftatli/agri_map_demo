import { useState } from 'react';
import Map from './components/Map';
import './App.css';

function App() {
  const [showSoil, setShowSoil] = useState(true);
  const [showParcels, setShowParcels] = useState(true);

  return (
    <div className="app">
      <header className="app-header glass fade-in">
        <div className="header-content">
          <h1 className="app-title">
            <span className="gradient-text">Sampson County</span>
            <span className="subtitle">North Carolina</span>
          </h1>
          <p className="app-description">Interactive Agricultural Data Visualization</p>
        </div>
      </header>

      <div className="controls-panel glass fade-in">
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

      <Map showSoil={showSoil} showParcels={showParcels} />
    </div>
  );
}

export default App;
