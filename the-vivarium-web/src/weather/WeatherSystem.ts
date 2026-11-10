import type { WeatherType, WeatherProfile, WeatherSystemState, IEnvironmentalAtmosphere } from './WeatherTypes';

export const WEATHER_PROFILES: Record<WeatherType, WeatherProfile> = {
  CLEAR_SUNNY: {
    id: 'CLEAR_SUNNY',
    nameVi: 'Trời Nắng Trong',
    icon: '☀️',
    temperatureTarget: 28.5,
    humidityTarget: 48.0,
    windSpeed: 1.5,
    windAngle: 0.2,
    cloudCoverage: 0.1,
    rainIntensity: 0.0,
    stormLighting: false,
    soilMoistureDelta: -0.015,
    waterLevelDelta: -0.01,
  },
  OVERCAST: {
    id: 'OVERCAST',
    nameVi: 'Trời Nhiều Mây',
    icon: '☁️',
    temperatureTarget: 22.0,
    humidityTarget: 68.0,
    windSpeed: 3.2,
    windAngle: 0.35,
    cloudCoverage: 0.75,
    rainIntensity: 0.0,
    stormLighting: false,
    soilMoistureDelta: -0.005,
    waterLevelDelta: -0.002,
  },
  GENTLE_RAIN: {
    id: 'GENTLE_RAIN',
    nameVi: 'Mưa Rào Rải Rác',
    icon: '🌦️',
    temperatureTarget: 20.5,
    humidityTarget: 86.0,
    windSpeed: 4.5,
    windAngle: 0.45,
    cloudCoverage: 0.85,
    rainIntensity: 0.45,
    stormLighting: false,
    soilMoistureDelta: 0.04,
    waterLevelDelta: 0.025,
  },
  STORMY_TEMPEST: {
    id: 'STORMY_TEMPEST',
    nameVi: 'Bão Nhiệt Đới Sấm Sét',
    icon: '⛈️',
    temperatureTarget: 17.0,
    humidityTarget: 96.0,
    windSpeed: 9.8,
    windAngle: 0.65,
    cloudCoverage: 1.0,
    rainIntensity: 1.0,
    stormLighting: true,
    soilMoistureDelta: 0.12,
    waterLevelDelta: 0.08,
  },
  HEATWAVE: {
    id: 'HEATWAVE',
    nameVi: 'Nắng Gắt Hạn Hán',
    icon: '🔥',
    temperatureTarget: 36.5,
    humidityTarget: 28.0,
    windSpeed: 1.0,
    windAngle: 0.1,
    cloudCoverage: 0.0,
    rainIntensity: 0.0,
    stormLighting: false,
    soilMoistureDelta: -0.05,
    waterLevelDelta: -0.035,
  },
  AUTUMN_BREEZE: {
    id: 'AUTUMN_BREEZE',
    nameVi: 'Gió Thu Lá Rụng',
    icon: '🍂',
    temperatureTarget: 21.0,
    humidityTarget: 55.0,
    windSpeed: 5.5,
    windAngle: 0.5,
    cloudCoverage: 0.3,
    rainIntensity: 0.0,
    stormLighting: false,
    soilMoistureDelta: -0.01,
    waterLevelDelta: -0.005,
  },
  FOGGY_MIST: {
    id: 'FOGGY_MIST',
    nameVi: 'Sương Mù Buổi Sớm',
    icon: '🌫️',
    temperatureTarget: 16.5,
    humidityTarget: 92.0,
    windSpeed: 0.8,
    windAngle: 0.05,
    cloudCoverage: 0.6,
    rainIntensity: 0.08,
    stormLighting: false,
    soilMoistureDelta: 0.01,
    waterLevelDelta: 0.005,
  },
};

export class WeatherSystem implements IEnvironmentalAtmosphere {
  private state: WeatherSystemState;
  private currentProfile: WeatherProfile;
  private targetProfile: WeatherProfile;
  private transitionDuration: number = 5.0; // default 5 seconds transition
  private transitionTimer: number = 5.0;

  // Environmental accumulators
  private soilMoisture: number = 0.45; // 0.0 to 1.0
  private aquaticRainInflow: number = 0.0;
  private thunderTimer: number = 0;
  private nextThunderInterval: number = 4.0;

  constructor(initialWeather: WeatherType = 'CLEAR_SUNNY') {
    this.currentProfile = WEATHER_PROFILES[initialWeather];
    this.targetProfile = WEATHER_PROFILES[initialWeather];
    this.state = {
      currentWeather: initialWeather,
      targetWeather: initialWeather,
      transitionProgress: 1.0,
      temperature: this.currentProfile.temperatureTarget,
      humidity: this.currentProfile.humidityTarget,
      windSpeed: this.currentProfile.windSpeed,
      windAngle: this.currentProfile.windAngle,
      cloudCoverage: this.currentProfile.cloudCoverage,
      rainIntensity: this.currentProfile.rainIntensity,
      isThundering: false,
      thunderFlashAlpha: 0.0,
    };
  }

  public setWeather(type: WeatherType, transitionDuration: number = 4.0): void {
    if (this.state.targetWeather === type && this.state.transitionProgress < 1.0) {
      return;
    }
    this.targetProfile = WEATHER_PROFILES[type];
    this.state.targetWeather = type;
    this.transitionDuration = Math.max(0.1, transitionDuration);
    this.transitionTimer = 0.0;
    this.state.transitionProgress = 0.0;
  }

  public update(dt: number, timeOfDay: number = 0.5): void {
    if (dt <= 0) return;

    // 1. Advance transition
    if (this.state.transitionProgress < 1.0) {
      this.transitionTimer += dt;
      const progress = Math.min(1.0, this.transitionTimer / this.transitionDuration);
      this.state.transitionProgress = progress;

      // Smooth step interpolation
      const smoothT = progress * progress * (3 - 2 * progress);

      // Lerp properties
      const c = this.currentProfile;
      const t = this.targetProfile;

      this.state.windSpeed = c.windSpeed + (t.windSpeed - c.windSpeed) * smoothT;
      this.state.windAngle = c.windAngle + (t.windAngle - c.windAngle) * smoothT;
      this.state.cloudCoverage = c.cloudCoverage + (t.cloudCoverage - c.cloudCoverage) * smoothT;
      this.state.rainIntensity = c.rainIntensity + (t.rainIntensity - c.rainIntensity) * smoothT;

      if (progress >= 1.0) {
        this.currentProfile = this.targetProfile;
        this.state.currentWeather = this.state.targetWeather;
      }
    } else {
      this.state.windSpeed = this.currentProfile.windSpeed;
      this.state.windAngle = this.currentProfile.windAngle;
      this.state.cloudCoverage = this.currentProfile.cloudCoverage;
      this.state.rainIntensity = this.currentProfile.rainIntensity;
    }

    // 2. Diurnal variation + Weather base temperature/humidity
    const sunFactor = Math.sin(timeOfDay * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
    const baseTargetTemp = this.currentProfile.temperatureTarget + (this.targetProfile.temperatureTarget - this.currentProfile.temperatureTarget) * this.state.transitionProgress;
    const baseTargetHum = this.currentProfile.humidityTarget + (this.targetProfile.humidityTarget - this.currentProfile.humidityTarget) * this.state.transitionProgress;

    // Diurnal swing: +/- 4°C, humidity +/- 15%
    const expectedTemp = baseTargetTemp + (sunFactor - 0.5) * 8.0;
    const expectedHum = Math.min(100, Math.max(15, baseTargetHum - (sunFactor - 0.5) * 25.0));

    // Natural lag towards expected value
    this.state.temperature += (expectedTemp - this.state.temperature) * Math.min(1.0, dt * 0.8);
    this.state.humidity += (expectedHum - this.state.humidity) * Math.min(1.0, dt * 0.8);

    // 3. Soil moisture and aquatic inflow accumulation
    const moistureDelta = (this.currentProfile.soilMoistureDelta + (this.targetProfile.soilMoistureDelta - this.currentProfile.soilMoistureDelta) * this.state.transitionProgress) * dt * 0.05;
    this.soilMoisture = Math.max(0.05, Math.min(1.0, this.soilMoisture + moistureDelta));

    this.aquaticRainInflow = this.state.rainIntensity;

    // 4. Thunder & Lightning processing
    const hasStorm = (this.currentProfile.stormLighting && this.state.transitionProgress > 0.5) ||
                     (this.targetProfile.stormLighting && this.state.transitionProgress > 0.3);

    if (hasStorm) {
      this.thunderTimer += dt;
      if (this.thunderTimer >= this.nextThunderInterval) {
        this.thunderTimer = 0;
        this.nextThunderInterval = 3.0 + Math.random() * 5.0;
        this.state.isThundering = true;
        this.state.thunderFlashAlpha = 0.95;
      }
    } else {
      this.state.isThundering = false;
      this.thunderTimer = 0;
    }

    // Decay thunder flash
    if (this.state.thunderFlashAlpha > 0.0) {
      this.state.thunderFlashAlpha = Math.max(0.0, this.state.thunderFlashAlpha - dt * 2.8);
    }
  }

  // --- IEnvironmentalAtmosphere Implementation ---
  public getWeatherState(): WeatherSystemState {
    return { ...this.state };
  }

  public getRainIntensity(): number {
    return this.state.rainIntensity;
  }

  public getWind(): { speed: number; angle: number } {
    return { speed: this.state.windSpeed, angle: this.state.windAngle };
  }

  public getTemperature(): number {
    return this.state.temperature;
  }

  public getHumidity(): number {
    return this.state.humidity;
  }

  public getSoilMoisture(): number {
    return this.soilMoisture;
  }

  public getAquaticRainInflow(): number {
    return this.aquaticRainInflow;
  }

  public getCurrentProfile(): WeatherProfile {
    return this.currentProfile;
  }
}
