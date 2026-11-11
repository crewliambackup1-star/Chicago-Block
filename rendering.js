const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

/**
 * Returns a conservative render profile for the current device.
 * Desktop starts at the highest practical pixel ratio and lets the adaptive
 * controller lower it only when frame time demonstrates sustained pressure.
 */
export function createGraphicsProfile({
  automationMode = false,
  isCoarsePointer = false,
  devicePixelRatio = 1,
  maxTextureSize = 4096
} = {}) {
  const dpr = clamp(Number(devicePixelRatio) || 1, 0.85, 3);

  if (automationMode) {
    return Object.freeze({
      name: 'automation',
      initialPixelRatio: 0.55,
      minimumPixelRatio: 0.55,
      maximumPixelRatio: 0.55,
      shadowMapSize: 0,
      shadowsEnabled: false,
      adaptiveResolution: false,
      renderEveryNthFrame: 3
    });
  }

  if (isCoarsePointer) {
    const maximumPixelRatio = Math.min(dpr, 1.45);
    return Object.freeze({
      name: 'mobile-high',
      initialPixelRatio: maximumPixelRatio,
      minimumPixelRatio: Math.min(1.0, maximumPixelRatio),
      maximumPixelRatio,
      shadowMapSize: Math.min(maxTextureSize, 1024),
      shadowsEnabled: true,
      adaptiveResolution: true,
      renderEveryNthFrame: 1
    });
  }

  const maximumPixelRatio = Math.min(dpr, 2.0);
  return Object.freeze({
    name: 'desktop-ultra',
    initialPixelRatio: maximumPixelRatio,
    minimumPixelRatio: Math.min(1.25, maximumPixelRatio),
    maximumPixelRatio,
    shadowMapSize: Math.min(maxTextureSize, 3072),
    shadowsEnabled: true,
    adaptiveResolution: true,
    renderEveryNthFrame: 1
  });
}

/**
 * Adjusts render resolution only after sustained frame-time evidence.
 * It does not change simulation speed, movement, or gameplay timing.
 */
export function createAdaptiveResolutionController(
  renderer,
  profile,
  {
    getViewport = () => ({
      width: globalThis.innerWidth || 1,
      height: globalThis.innerHeight || 1
    }),
    onChange = null
  } = {}
) {
  let pixelRatio = profile.initialPixelRatio;
  let sampleTotal = 0;
  let sampleCount = 0;
  let slowWindows = 0;
  let fastWindows = 0;
  let lastAverageFrameMs = 0;
  let lastChangeReason = 'initial profile';

  function apply(nextRatio, reason) {
    const rounded = Math.round(nextRatio * 100) / 100;
    if (Math.abs(rounded - pixelRatio) < 0.005) return false;
    pixelRatio = rounded;
    renderer.setPixelRatio(pixelRatio);
    const viewport = getViewport();
    renderer.setSize(viewport.width, viewport.height, true);
    lastChangeReason = reason;
    onChange?.({
      pixelRatio,
      reason,
      averageFrameMs: lastAverageFrameMs
    });
    return true;
  }

  function update(deltaSeconds, enabled = true) {
    if (!profile.adaptiveResolution || !enabled || !Number.isFinite(deltaSeconds)) return false;
    // Ignore negative/very long deltas caused by tab suspension or debugger pauses.
    if (deltaSeconds <= 0 || deltaSeconds > 0.25) return false;

    sampleTotal += deltaSeconds;
    sampleCount += 1;
    if (sampleTotal < 1.5 && sampleCount < 90) return false;

    lastAverageFrameMs = (sampleTotal / Math.max(1, sampleCount)) * 1000;
    sampleTotal = 0;
    sampleCount = 0;

    if (lastAverageFrameMs > 20.5) {
      slowWindows += 1;
      fastWindows = 0;
      if (slowWindows >= 2) {
        slowWindows = 0;
        return apply(
          Math.max(profile.minimumPixelRatio, pixelRatio - 0.08),
          'sustained frame time above 20.5ms'
        );
      }
      return false;
    }

    if (lastAverageFrameMs < 15.5) {
      fastWindows += 1;
      slowWindows = 0;
      if (fastWindows >= 4) {
        fastWindows = 0;
        return apply(
          Math.min(profile.maximumPixelRatio, pixelRatio + 0.04),
          'sustained frame time below 15.5ms'
        );
      }
      return false;
    }

    slowWindows = 0;
    fastWindows = 0;
    return false;
  }

  function resize() {
    renderer.setPixelRatio(pixelRatio);
    const viewport = getViewport();
    renderer.setSize(viewport.width, viewport.height, true);
  }

  return Object.freeze({
    update,
    resize,
    get pixelRatio() { return pixelRatio; },
    get lastAverageFrameMs() { return lastAverageFrameMs; },
    get lastChangeReason() { return lastChangeReason; },
    getSnapshot() {
      return {
        pixelRatio,
        lastAverageFrameMs,
        lastChangeReason,
        minimumPixelRatio: profile.minimumPixelRatio,
        maximumPixelRatio: profile.maximumPixelRatio,
        profile: profile.name
      };
    }
  });
}
