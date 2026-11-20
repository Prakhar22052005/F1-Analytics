import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import usePlaybackStore from '../store/usePlaybackStore';

const TrackMap2D = ({ telemetryData, selectedRace, driverMetadata = {} }) => {
  const [trackPoints, setTrackPoints] = useState([]);
  const { currentTime, followDriverId } = usePlaybackStore();
  
  // ViewBox Zoom/Pan State
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1000, h: 1000 });
  const svgRef = useRef(null);
  const dragRef = useRef({ active: false, x: 0, y: 0 });

  // 1. Fetch Track Data (Coordinates)
  useEffect(() => {
    if (!selectedRace) return;
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
    fetch(`${API_BASE_URL}/api/telemetry/${selectedRace.id}/track`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.length === 0) return;
        setTrackPoints(data);
      });
  }, [selectedRace]);

  // 2. High-Performance Bounds Calculation (No Spread)
  const bounds = useMemo(() => {
    if (trackPoints.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    return trackPoints.reduce((acc, p) => ({
      minX: Math.min(acc.minX, p.x),
      maxX: Math.max(acc.maxX, p.x),
      minY: Math.min(acc.minY, p.y),
      maxY: Math.max(acc.maxY, p.y)
    }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
  }, [trackPoints]);

  // 3. Absolute Coordinate Transformer
  const transform = useCallback((x, y) => {
    const padding = 100;
    const size = 800;
    const rangeX = bounds.maxX - bounds.minX || 1;
    const rangeY = bounds.maxY - bounds.minY || 1;
    const scale = Math.min(size / rangeX, size / rangeY);
    
    return {
      x: (x - bounds.minX) * scale + padding,
      y: (y - bounds.minY) * scale + padding
    };
  }, [bounds]);

  // 4. Generate SVG Path
  const trackPathD = useMemo(() => {
    if (trackPoints.length === 0) return "";
    return trackPoints.reduce((acc, p, i) => {
      const { x, y } = transform(p.x, p.y);
      return acc + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, "") + " Z";
  }, [trackPoints, transform]);

  // 5. Calculate Current Positions for Cars
  const carMarkers = useMemo(() => {
    return Object.entries(telemetryData).map(([driverId, points]) => {
      if (!points || points.length === 0) return null;
      const point = points.reduce((prev, curr) => 
        Math.abs(curr.session_time - currentTime) < Math.abs(prev.session_time - currentTime) ? curr : prev
      );
      const { x, y } = transform(point.x, point.y);
      const color = driverMetadata[driverId]?.color || '#E80020';
      return { driverId, x, y, color };
    }).filter(Boolean);
  }, [telemetryData, currentTime, transform, driverMetadata]);

  // --- Interaction Handlers (Custom Zoom/Pan) ---
  
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox(prev => {
        const newW = prev.w * zoomFactor;
        const newH = prev.h * zoomFactor;
        // Keep zoom at a reasonable min/max
        if (newW < 200 || newW > 3000) return prev;
        
        // Offset to zoom towards mouse center (simplified)
        return {
            ...prev,
            w: newW,
            h: newH,
            x: prev.x - (newW - prev.w) / 2,
            y: prev.y - (newH - prev.h) / 2
        };
    });
  };

  const handleMouseDown = (e) => {
    dragRef.current = { active: true, x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    
    setViewBox(prev => ({
        ...prev,
        x: prev.x - dx * (prev.w / 1000), // Speed adjusted by zoom
        y: prev.y - dy * (prev.h / 1000)
    }));
    
    dragRef.current = { ...dragRef.current, x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    dragRef.current.active = false;
  };

  return (
    <div 
        className="track-map-container"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      {/* High-Tech Grid Background */}
      <div className="track-grid-bg" />
      
      <svg 
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="track-svg"
      >
        {/* Radar Faint Circles */}
        <circle cx="500" cy="500" r="200" fill="none" stroke="rgba(0,243,255,0.03)" strokeWidth="1" />
        <circle cx="500" cy="500" r="400" fill="none" stroke="rgba(0,243,255,0.03)" strokeWidth="1" />
        <circle cx="500" cy="500" r="600" fill="none" stroke="rgba(0,243,255,0.03)" strokeWidth="1" />

        {/* Track Loop (Glowing Blue) */}
        <path
          d={trackPathD}
          fill="rgba(0, 243, 255, 0.02)"
          stroke="#00f3ff"
          strokeWidth="3"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 8px rgba(0, 243, 255, 0.6))' }}
        />

        {/* Car Markers */}
        {carMarkers.map(car => {
          const isFocused = followDriverId === car.driverId;
          return (
          <g key={car.driverId} style={{ transition: 'all 0.3s ease-out', opacity: !isFocused ? 0.6 : 1 }}>
            {/* Outer Glow */}
            <circle
              cx={car.x}
              cy={car.y}
              r={isFocused ? "26" : "14"}
              fill={car.color}
              style={{ filter: `blur(${isFocused ? 12 : 6}px)`, opacity: isFocused ? 0.4 : 0.2 }}
            />
            {/* Core Dot */}
            <circle
              cx={car.x}
              cy={car.y}
              r={isFocused ? "8" : "4"}
              fill="white"
              stroke={car.color}
              strokeWidth={isFocused ? "3" : "2"}
              style={{ filter: `drop-shadow(0 0 5px ${car.color})` }}
            />
            {/* Identifier Tag */}
            <text
                x={car.x + (isFocused ? 15 : 10)}
                y={car.y - (isFocused ? 15 : 10)}
                fill="white"
                className="font-mono"
                style={{ 
                    fontSize: isFocused ? '16px' : '10px', 
                    fontWeight: '900', 
                    pointerEvents: 'none',
                    letterSpacing: '-1px',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                    opacity: isFocused ? 1 : 0.5
                }}
            >
                {car.driverId}
            </text>
          </g>
        )})}
      </svg>

      {/* Radar Overlay Metadata */}
      <div className="radar-metadata">
           <div className="flex-row items-center gap-2">
                <div className="radar-status-dot pulse" />
                <span className="radar-status-text">FEED ACTIVE // ALPHA-9</span>
           </div>
           <span className="radar-coords">POS: {viewBox.x.toFixed(0)} / {viewBox.y.toFixed(0)}</span>
           <span className="radar-coords">MAG: {(1000 / viewBox.w).toFixed(2)}x</span>
      </div>

      {/* Controller Guide */}
      <div className="interaction-guide">
           <span className="guide-label">PROTOCOL:</span>
           <span className="guide-text">L-CLICK DRAG: PAN</span>
           <span className="guide-text">SCROLL: ZOOM</span>
      </div>
    </div>
  );
};

export default TrackMap2D;
