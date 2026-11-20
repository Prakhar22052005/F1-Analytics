import React, { useMemo } from 'react';
import usePlaybackStore from '../store/usePlaybackStore';

const Standings = ({ lapData = [], driverMetadata = {} }) => {
  const selectedDrivers = usePlaybackStore((state) => state.selectedDrivers);
  const followDriverId = usePlaybackStore((state) => state.followDriverId);
  const setFollowDriver = usePlaybackStore((state) => state.setFollowDriver);
  const currentTime = usePlaybackStore((state) => state.currentTime);

  const getDriverState = (driverId) => {
    const driverLaps = lapData.filter(l => l.driver_id === driverId && l.lap_time > 0);
    if (!driverLaps.length) return null;
    
    // Estimate current lap based on session bounds approximation, or just show their best/current active.
    // Assuming laps are ordered chronologically:
    const activeLap = driverLaps[driverLaps.length - 1]; 
    return activeLap;
  };

  return (
    <div className="glass-panel standings-panel">
      <div className="standings-header">
        <h3>LIVE STANDINGS</h3>
      </div>
      
      <div className="driver-list">
        {selectedDrivers.map((driver, index) => {
          const isFocused = followDriverId === driver;
          const meta = driverMetadata[driver];
          const lapState = getDriverState(driver);
          
          let tyreColor = 'white';
          let tyreLetter = 'H';
          if (lapState?.compound === 'SOFT') { tyreColor = '#ef4444'; tyreLetter = 'S'; }
          if (lapState?.compound === 'MEDIUM') { tyreColor = '#eab308'; tyreLetter = 'M'; }
          
          return (
            <div 
              key={driver} 
              className={`driver-row ${isFocused ? 'active' : ''}`}
              onClick={() => setFollowDriver(driver)}
            >
              <span className="rank-badge">{index + 1}</span>
              
              <div className="driver-color-line" style={{ background: meta?.color || '#e10600', boxShadow: `0 0 5px ${meta?.color || '#e10600'}` }} />
              
              <div className="driver-info">
                <span className="driver-name">{driver}</span>
                <span className="team-name">{meta?.team || 'TBD'}</span>
              </div>
              
              {lapState && (
                <div className="lap-state-box">
                  <div className="flex-row items-center gap-1">
                    <div className="tyre-icon" style={{ borderColor: tyreColor, color: tyreColor }}>
                      {tyreLetter}
                    </div>
                    <span className="tyre-life">{lapState.tyre_life}L</span>
                  </div>
                  <span className="lap-time">{lapState.lap_time.toFixed(3)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Standings;
