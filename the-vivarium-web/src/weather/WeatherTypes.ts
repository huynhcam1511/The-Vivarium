/**
 * Weather & Atmospheric Simulation Interfaces
 * PACK-005 / TASK-020 Specification
 */

export type WeatherType = 'CLEAR_SUNNY' | 'OVERCAST' | 'GENTLE_RAIN' | 'STORMY_TEMPEST' | 'HEATWAVE' | 'AUTUMN_BREEZE' | 'FOGGY_MIST';

export interface WeatherProfile {
  id: WeatherType;
  nameVi: string;
  icon: string;
  temperatureTarget: number; // in °C
  humidityTarget: number;    // in %
  windSpeed: number;         // in m/s
  windAngle: number;         // in radians (e.g. slight slant)
  cloudCoverage: number;     // 0.0 to 1.0
  rainIntensity: number;     // 0.0 to 1.0 (drops per frame factor)
  stormLighting: boolean;    // thunderstorm flashes
  soilMoistureDelta: number; // rate of ground moisture change
  waterLevelDelta: number;   // rate of lake basin fill/evaporation
}

export interface WeatherSystemState {
  currentWeather: WeatherType;
  targetWeather: WeatherType;
  transitionProgress: number; // 0.0 to 1.0
  temperature: number;        // °C
  humidity: number;           // %
  windSpeed: number;          // m/s
  windAngle: number;          // radians
  cloudCoverage: number;      // 0.0 to 1.0
  rainIntensity: number;      // 0.0 to 1.0
  isThundering: boolean;
  thunderFlashAlpha: number;  // 0.0 to 1.0
}

/**
 * Environmental Contract for cross-system integration:
 * Exposes clean interfaces for Underground (TASK-018) and Aquatic (TASK-019).
 */
export interface IEnvironmentalAtmosphere {
  getWeatherState(): WeatherSystemState;
  getRainIntensity(): number;
  getWind(): { speed: number; angle: number };
  getTemperature(): number;
  getHumidity(): number;
  getSoilMoisture(): number; // 0.0 (arid) to 1.0 (waterlogged saturated)
  getAquaticRainInflow(): number; // lake surface rain deposit rate
  setWeather(type: WeatherType, transitionDuration?: number): void;
}
