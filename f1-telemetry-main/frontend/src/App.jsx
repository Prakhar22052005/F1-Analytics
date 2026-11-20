import React, { useEffect, useState, useRef, useMemo } from 'react';
import usePlaybackStore from './store/usePlaybackStore';
import TrackMap2D from './components/TrackMap2D';
import Standings from './components/Standings';
import TelemetryOverlay from './components/TelemetryOverlay';
import WeatherWidget from './components/WeatherWidget';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

function App() {
  const { 
    currentTime, setPlaybackTime, isPlaying, togglePlay, 
    playbackSpeed, setPlaybackSpeed, selectRace, selectedRace,
    setSelectedDrivers, selectedDrivers, minTime, maxTime
  } = usePlaybackStore();

  const [availableRaces, setAvailableRaces] = useState([]);
  const [telemetryData, setTelemetryData] = useState({});
  const [driverMetadata, setDriverMetadata] = useState({});
  const [weatherData, setWeatherData] = useState([]);
  const [lapData, setLapData] = useState([]);
  const requestRef = useRef();

  // 1. Initial Race Selection
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/races`)
      .then(res => res.json())
      .then(data => {
        setAvailableRaces(data);
        if (data.length > 0 && !selectedRace) {
          selectRace(data[0]);
        }
      });
  }, []);

  // 1.5 Fetch drivers when a race is selected
  useEffect(() => {
    if (!selectedRace) return;
    fetch(`${API_BASE_URL}/api/races/${selectedRace.id}/drivers`)
      .then(res => res.json())
      .then(drivers => {
        const meta = {};
        drivers.forEach(d => { meta[d.id] = d; });
        setDriverMetadata(meta);

        // Grab top 5 drivers to avoid cluttering SVG
        const topDrivers = drivers.slice(0, 5).map(d => d.id);
        setSelectedDrivers(topDrivers);
        if (topDrivers.length > 0 && !usePlaybackStore.getState().followDriverId) {
          usePlaybackStore.getState().setFollowDriver(topDrivers[0]);
        }
      })
      .catch(console.error);

    // Fetch Weather Data
    fetch(`${API_BASE_URL}/api/telemetry/${selectedRace.id}/weather`)
      .then(res => res.json())
      .then(data => setWeatherData(data))
      .catch(console.error);

    // Fetch Lap Strategy Data
    fetch(`${API_BASE_URL}/api/races/${selectedRace.id}/laps`)
      .then(res => res.json())
      .then(data => setLapData(data))
      .catch(console.error);

  }, [selectedRace]);

  // 2. Fetch Telemetry for all selected drivers
  useEffect(() => {
    if (!selectedRace) return;
    selectedDrivers.forEach(driverId => {
      fetch(`${API_BASE_URL}/api/telemetry/${selectedRace.id}/${driverId}?limit=8000`)
        .then(res => res.json())
        .then(data => setTelemetryData(prev => ({ ...prev, [driverId]: data })));
    });
  }, [selectedRace, selectedDrivers]);

  // 2.5 Calculate exact time boundaries to synchronize rendering
  useEffect(() => {
    let minT = Infinity;
    let maxT = -Infinity;

    Object.values(telemetryData).forEach(driverPoints => {
      if (!driverPoints || driverPoints.length === 0) return;
      if (driverPoints[0].session_time < minT) minT = driverPoints[0].session_time;
      if (driverPoints[driverPoints.length - 1].session_time > maxT) maxT = driverPoints[driverPoints.length - 1].session_time;
    });

    if (minT !== Infinity && maxT !== -Infinity) {
      usePlaybackStore.getState().setMinTime(minT);
      usePlaybackStore.getState().setMaxTime(maxT);
      
      const ct = usePlaybackStore.getState().currentTime;
      if (ct < minT || ct > maxT || ct === 0) {
        usePlaybackStore.getState().setPlaybackTime(minT);
      }
    }
  }, [telemetryData]);

  // 3. Playback Animation Thread
  const animate = () => {
    if (isPlaying) {
      setPlaybackTime(currentTime + (0.016 * playbackSpeed));
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, currentTime, playbackSpeed]);

  return (
    <div className="dashboard-container selection-cyan">
      {/* 2D Interactive Radar View */}
      <div className="main-canvas">
        <TrackMap2D 
          telemetryData={telemetryData} 
          selectedRace={selectedRace} 
          driverMetadata={driverMetadata}
        />
        
        {/* Subtle Radar Overlay Layer */}
        <div className="canvas-grid-overlay" />
      </div>

      {/* Broadcast UI Overlays */}
      <header className="broadcast-header">
        <div className="logo-group">
          <div className="live-indicator">LIVE</div>
          <div className="flex-col">
            <h1 className="header-title">F1 TELEMETRY PRO</h1>
            <span className="header-subtitle">Tactical Reconnaissance Unit</span>
          </div>
        </div>
        
        <div className="race-selector-ui">
          <select 
            value={selectedRace?.id || ''}
            onChange={(e) => {
              const race = availableRaces.find(r => r.id == e.target.value);
              if (race) selectRace(race);
            }}
            className="custom-select"
          >
            <option value="">SELECT GRAND PRIX</option>
            {availableRaces.map(r => (
              <option key={r.id} value={r.id}>{r.year} {r.name}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Data Panels */}
      <Standings lapData={lapData} driverMetadata={driverMetadata} telemetryData={telemetryData} />
      <TelemetryOverlay telemetryData={telemetryData} />
      <WeatherWidget weatherData={weatherData} />

      <footer className="playback-footer">
        <div className="footer-content">
          <button 
            className="pause-button"
            onClick={togglePlay}
          >
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>

          <div className="scrubber-control">
            <div className="flex-row items-center gap-4">
              <span className="time-display font-mono">{minTime.toFixed(2)}s</span>
              <input 
                type="range" min={minTime} max={maxTime} step="0.1" 
                value={currentTime} 
                onChange={(e) => setPlaybackTime(parseFloat(e.target.value))} 
                className="custom-slider"
              />
              <span className="time-display font-mono">{maxTime.toFixed(2)}s</span>
            </div>
            <div className="time-stamp">
              TIME: {currentTime.toFixed(2)}s
            </div>
          </div>

          <div className="speed-toggle">
            {[1, 2, 5, 10].map(s => (
              <button 
                key={s} 
                className={`speed-btn ${playbackSpeed === s ? 'active' : ''}`} 
                onClick={() => setPlaybackSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

