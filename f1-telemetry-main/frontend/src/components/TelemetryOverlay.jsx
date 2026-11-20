import React, { useMemo } from 'react';
import usePlaybackStore from '../store/usePlaybackStore';

const TelemetryOverlay = ({ telemetryData = {} }) => {
  const followDriverId = usePlaybackStore((state) => state.followDriverId);
  const currentTime = usePlaybackStore((state) => state.currentTime);
  
  const currentData = useMemo(() => {
    if (!followDriverId || !telemetryData[followDriverId]) return null;
    return telemetryData[followDriverId].find(d => d.session_time >= currentTime) || telemetryData[followDriverId][0];
  }, [followDriverId, telemetryData, currentTime]);

  if (!currentData) {
    return (
      <div className="telemetry-overlay loading">
        <div className="telemetry-label">SYNCING DATA...</div>
      </div>
    );
  }

  return (
    <div className="telemetry-overlay glass-panel">
      <div className="flex-row justify-between items-center mb-6 border-b border-white/10 pb-4">
        <div className="flex-row items-center gap-2">
          <span className="driver-badge-lite">{followDriverId}</span>
          <span className="telemetry-title">LIVE TELEMETRY</span>
        </div>
        <div className={`drs-badge ${currentData.drs ? 'active' : ''}`}>
          DRS {currentData.drs ? 'ON' : 'OFF'}
        </div>
      </div>

      <div className="telemetry-grid">
        <div className="flex-col">
          <label className="stat-label">SPEED</label>
          <div className="stat-value-large">{currentData.speed?.toFixed(0)} <span className="stat-unit">KM/H</span></div>
        </div>

        <div className="flex-col items-end">
          <label className="stat-label">GEAR</label>
          <div className="stat-value-large highlight">{currentData.gear === 0 ? 'N' : currentData.gear}</div>
        </div>
      </div>

      {/* RPM Tachometer */}
      <div className="rpm-container">
        <div className="rpm-header">
          <label className="stat-label">ENGINE RPM</label>
          <span className="rpm-number font-mono">{currentData.rpm || 0}</span>
        </div>
        <div className="rpm-bar-wrapper">
          {Array.from({ length: 15 }).map((_, i) => {
             const rpmPct = (currentData.rpm || 0) / 12000;
             const isLit = (i / 15) < rpmPct;
             let colorClass = 'green';
             if (i > 10) colorClass = 'yellow';
             if (i > 13) colorClass = 'red';
             return <div key={i} className={`rpm-led ${isLit ? colorClass : ''} ${isLit && i > 13 ? 'pulse' : ''}`} />
          })}
        </div>
      </div>

      <div className="telemetry-grid">
        <div className="flex-col gap-2">
          <label className="stat-label">THROTTLE</label>
          <div className="bar-bg-small">
            <div className="bar-fill-small throttle" style={{ width: `${currentData.throttle || 0}%` }}></div>
          </div>
        </div>
        <div className="flex-col gap-2">
          <label className="stat-label text-right">BRAKE</label>
          <div className="bar-bg-small flex-row justify-end">
            <div className="bar-fill-small brake" style={{ width: `${currentData.brake || 0}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryOverlay;
