import React from 'react';
import type { WeatherType, WeatherProfile } from './WeatherTypes';
import { WEATHER_PROFILES } from './WeatherSystem';

interface WeatherControlPanelProps {
  currentWeather: WeatherType;
  targetWeather: WeatherType;
  transitionProgress: number;
  onSelectWeather: (weather: WeatherType) => void;
  temperature: number;
  humidity: number;
  windSpeed: number;
  soilMoisture: number;
}

export const WeatherControlPanel: React.FC<WeatherControlPanelProps> = ({
  currentWeather,
  targetWeather,
  transitionProgress,
  onSelectWeather,
  temperature,
  humidity,
  windSpeed,
  soilMoisture,
}) => {
  const weatherOptions: WeatherType[] = [
    'CLEAR_SUNNY',
    'OVERCAST',
    'GENTLE_RAIN',
    'STORMY_TEMPEST',
    'HEATWAVE',
    'AUTUMN_BREEZE',
    'FOGGY_MIST',
  ];

  return (
    <div className="bg-neutral-900/95 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-2xl text-xs text-neutral-200 pointer-events-auto max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 font-bold text-amber-300">
          <span>🌦️</span>
          <span>Khí Quyển & Thời Tiết (PACK-005)</span>
        </div>
        <span className="text-[10px] text-neutral-400" data-testid="status-transition">
          {transitionProgress < 1.0 ? `Đang chuyển (${(transitionProgress * 100).toFixed(0)}%)` : `Ổn định (${currentWeather})`}
        </span>
      </div>

      {/* Weather Selector Grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {weatherOptions.map((type) => {
          const profile: WeatherProfile = WEATHER_PROFILES[type];
          const isSelected = targetWeather === type;
          return (
            <button
              key={type}
              data-testid={`btn-weather-${type}`}
              onClick={() => onSelectWeather(type)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-emerald-600/90 border-emerald-400 text-white font-semibold shadow-md shadow-emerald-700/30'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              <span className="text-base">{profile.icon}</span>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-medium">{profile.nameVi}</span>
                <span className="text-[9px] text-neutral-400">{profile.temperatureTarget}°C</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Atmospheric & Soil Telemetry */}
      <div className="grid grid-cols-4 gap-1 bg-black/40 p-2 rounded-xl border border-white/5 text-[10px] text-center">
        <div>
          <span className="text-neutral-400 block text-[9px]">Nhiệt độ</span>
          <span className="font-bold text-rose-300" data-testid="telemetry-temperature">{temperature.toFixed(1)}°C</span>
        </div>
        <div>
          <span className="text-neutral-400 block text-[9px]">Độ ẩm</span>
          <span className="font-bold text-sky-300" data-testid="telemetry-humidity">{humidity.toFixed(0)}%</span>
        </div>
        <div>
          <span className="text-neutral-400 block text-[9px]">Sức gió</span>
          <span className="font-bold text-teal-300" data-testid="telemetry-wind">{windSpeed.toFixed(1)} m/s</span>
        </div>
        <div>
          <span className="text-neutral-400 block text-[9px]">Ẩm đất ngầm</span>
          <span className="font-bold text-amber-300" data-testid="telemetry-soil">{(soilMoisture * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};
