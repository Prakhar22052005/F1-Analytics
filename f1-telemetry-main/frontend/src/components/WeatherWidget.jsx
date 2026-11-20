import React, { useMemo } from 'react';
import usePlaybackStore from '../store/usePlaybackStore';

const WeatherWidget = ({ weatherData }) => {
  const { currentTime } = usePlaybackStore();

  const currentWeather = useMemo(() => {
    if (!weatherData || weatherData.length === 0) return null;
    return weatherData.reduce((prev, curr) => 
      Math.abs(curr.session_time - currentTime) < Math.abs(prev.session_time - currentTime) ? curr : prev
    );
  }, [weatherData, currentTime]);

  if (!currentWeather) return null;

  return (
    <div className="glass-panel weather-widget">
      
      <div className="weather-item">
        <span className="weather-label">Track</span>
        <span className="weather-value">{currentWeather.track_temp?.toFixed(1)}°C</span>
      </div>

      <div className="weather-divider" />

      <div className="weather-item">
        <span className="weather-label">Air</span>
        <span className="weather-value">{currentWeather.air_temp?.toFixed(1)}°C</span>
      </div>

      <div className="weather-divider" />

      <div className="weather-item">
        <span className="weather-label">Wind</span>
        <span className="weather-value">{currentWeather.wind_speed?.toFixed(1)} m/s</span>
      </div>

      <div className="weather-divider" />

      <div className="weather-item">
        <span className="weather-label">Rain</span>
        <span className="weather-value" style={{ color: currentWeather.rainfall ? '#3b82f6' : 'rgba(255,255,255,0.5)' }}>
          {currentWeather.rainfall ? 'ACTIVE' : 'NONE'}
        </span>
      </div>
      
    </div>
  );
};

export default WeatherWidget;
