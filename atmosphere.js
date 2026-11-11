const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

const mix = (a, b, t) => a + (b - a) * t;

/**
 * A deterministic, renderer-independent lighting model. Keeping the time and
 * weather curve here makes sunrise, sunset and weather states easy to test.
 */
export function getAtmosphereState(hours, weatherMode = 'clear') {
  const hour = ((Number(hours) % 24) + 24) % 24;
  const solarAngle = ((hour - 6) / 12) * Math.PI;
  const solarElevation = Math.sin(solarAngle);
  const daylight = clamp(solarElevation, 0, 1);
  const night = 1 - daylight;
  const dawn = Math.exp(-0.5 * ((hour - 6.9) / 1.15) ** 2);
  const dusk = Math.exp(-0.5 * ((hour - 17.1) / 1.15) ** 2);
  const goldenHour = clamp(dawn + dusk, 0, 1);
  const rain = weatherMode === 'rain';
  const fog = weatherMode === 'fog';
  const weatherDim = rain ? 0.78 : fog ? 0.66 : 1;

  const daylightFog = [0.56, 0.68, 0.73];
  const sunsetFog = [0.68, 0.43, 0.34];
  const nightFog = [0.045, 0.065, 0.105];
  const overcastFog = fog ? [0.47, 0.54, 0.57] : [0.34, 0.42, 0.48];
  const skyBase = daylightFog.map((value, index) => mix(value, nightFog[index], night));
  const skyColor = skyBase.map((value, index) => mix(value, sunsetFog[index], goldenHour * (1 - night) * 0.72));
  if (rain || fog) {
    for (let index = 0; index < 3; index++) skyColor[index] = mix(skyColor[index], overcastFog[index], rain ? 0.58 : 0.78);
  }

  const sunColor = goldenHour > 0.12 ? 0xffb47f : 0xffecd7;
  return Object.freeze({
    hour,
    solarAngle,
    solarElevation,
    daylight,
    night,
    goldenHour,
    sunIntensity: (0.025 + daylight * 2.55) * weatherDim,
    ambientIntensity: (0.3 + daylight * 1.18) * (fog ? 0.92 : rain ? 0.94 : 1),
    environmentIntensity: 0.2 + daylight * 0.72,
    exposure: 1.02 + goldenHour * 0.09 - (rain ? 0.045 : 0),
    sunColor,
    skyColor,
    fogNear: fog ? 17 : rain ? 52 : 138,
    fogFar: fog ? 158 : rain ? 225 : 390,
    cloudOpacity: fog ? 0.48 : rain ? 0.43 : 0.22 + goldenHour * 0.06,
    cloudSpeed: rain ? 0.0022 : 0.0011,
    rain,
    fog
  });
}
