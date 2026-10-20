import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { WeatherSystem, WEATHER_PROFILES } from './WeatherSystem';

describe('TASK-020 PACK-005 WeatherSystem Logic & Transitions', () => {
  let weather: WeatherSystem;

  beforeEach(() => {
    weather = new WeatherSystem('CLEAR_SUNNY');
  });

  it('1. Initializes with correct default CLEAR_SUNNY profile values', () => {
    const state = weather.getWeatherState();
    assert.equal(state.currentWeather, 'CLEAR_SUNNY');
    assert.equal(state.transitionProgress, 1.0);
    assert.equal(weather.getRainIntensity(), 0.0);
    assert.equal(weather.getWind().speed, 1.5);
    assert.equal(weather.getTemperature(), WEATHER_PROFILES.CLEAR_SUNNY.temperatureTarget);
    assert.equal(weather.getHumidity(), WEATHER_PROFILES.CLEAR_SUNNY.humidityTarget);
  });

  it('2. Smoothly transitions from CLEAR_SUNNY to STORMY_TEMPEST over duration', () => {
    weather.setWeather('STORMY_TEMPEST', 2.0); // 2 seconds
    let state = weather.getWeatherState();
    assert.equal(state.targetWeather, 'STORMY_TEMPEST');
    assert.equal(state.transitionProgress, 0.0);

    // Step 1.0 second (50% progress)
    weather.update(1.0, 0.5);
    state = weather.getWeatherState();
    assert.ok(state.transitionProgress >= 0.45 && state.transitionProgress <= 0.55);
    assert.ok(state.rainIntensity > 0.0);
    assert.ok(state.rainIntensity < 1.0);
    assert.ok(state.windSpeed > 1.5);

    // Step another 1.1 seconds (100% progress)
    weather.update(1.1, 0.5);
    state = weather.getWeatherState();
    assert.equal(state.transitionProgress, 1.0);
    assert.equal(state.currentWeather, 'STORMY_TEMPEST');
    assert.equal(state.rainIntensity, 1.0);
    assert.equal(state.windSpeed, WEATHER_PROFILES.STORMY_TEMPEST.windSpeed);
  });

  it('3. Increases soil moisture during rain and decreases during heatwave', () => {
    const initialMoisture = weather.getSoilMoisture();

    // Turn on heavy storm
    weather.setWeather('STORMY_TEMPEST', 0.1);
    weather.update(0.2, 0.5);

    // Advance 10 seconds of rain
    for (let i = 0; i < 20; i++) {
      weather.update(0.5, 0.5);
    }
    const wetMoisture = weather.getSoilMoisture();
    assert.ok(wetMoisture > initialMoisture, 'Moisture should increase during storm');

    // Switch to heatwave
    weather.setWeather('HEATWAVE', 0.1);
    weather.update(0.2, 0.5);
    for (let i = 0; i < 40; i++) {
      weather.update(0.5, 0.5);
    }
    const dryMoisture = weather.getSoilMoisture();
    assert.ok(dryMoisture < wetMoisture, 'Moisture should decrease during heatwave');
  });

  it('4. Diurnal cycle modulates temperature and humidity naturally', () => {
    weather.setWeather('CLEAR_SUNNY', 0.1);
    weather.update(0.2, 0.5); // Noon (sunFactor = 1.0)
    for (let i = 0; i < 10; i++) weather.update(0.5, 0.5);
    const noonTemp = weather.getTemperature();

    // Switch to Midnight (timeOfDay = 0.0, sunFactor = 0.0)
    for (let i = 0; i < 20; i++) weather.update(0.5, 0.0);
    const nightTemp = weather.getTemperature();

    assert.ok(noonTemp > nightTemp, 'Noon temperature should be higher than night temperature');
  });

  it('5. Time-scaling / pause safety check', () => {
    weather.setWeather('STORMY_TEMPEST', 2.0);
    // When dt is 0 (Paused)
    weather.update(0.0, 0.5);
    const state = weather.getWeatherState();
    assert.equal(state.transitionProgress, 0.0);
  });

  it('6. Environmental contract exposes aquatic inflow and subterranean soil moisture', () => {
    weather.setWeather('GENTLE_RAIN', 0.1);
    weather.update(0.2, 0.5);
    assert.ok(weather.getAquaticRainInflow() > 0.2);
    assert.ok(weather.getSoilMoisture() > 0.0);
  });
});
