import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDeviceMetrics — Collects real-time metrics from the client device
 * using browser APIs (CPU estimation, memory, battery, network, storage).
 *
 * Returns: { deviceMetrics, deviceInfo, history, error }
 *
 *   deviceMetrics = { cpu, memory, battery, network, storage }  ← latest snapshot
 *   deviceInfo    = { os, browser, cores, deviceMemory, screen, platform }
 *   history       = Array<{ ts, cpu, memory, battery, network }>  ← trend data
 *   error         = string | null
 */
export default function useDeviceMetrics({ pollInterval = 10000, maxHistory = 20, enabled = true } = {}) {
  const [metrics, setMetrics] = useState({
    cpu: 0,
    memory: 0,
    memoryUsed: 0,
    memoryTotal: 0,
    battery: null,
    batteryCharging: false,
    network: 'unknown',
    networkSpeed: 0,
    storage: null,
    storageQuota: 0,
    storageUsage: 0,
  });

  const [deviceInfo, setDeviceInfo] = useState({
    os: '',
    browser: '',
    cores: 0,
    deviceMemory: 0,
    screen: '',
    platform: '',
  });

  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  // ── Frame-timing CPU estimator ──────────────────────────────────────────
  // Uses requestAnimationFrame callback timing to estimate CPU load.
  // When frames take longer than expected (16ms for 60fps), CPU is busy.
  const cpuRef = useRef({ prevTime: performance.now(), estimate: 0 });
  const rafId = useRef(null);

  const estimateCpu = useCallback(() => {
    const now = performance.now();
    const elapsed = now - cpuRef.current.prevTime;
    cpuRef.current.prevTime = now;

    // At 60fps, frames arrive every ~16ms. Longer = busier CPU.
    // Map elapsed time to 0-100%:
    //   ≤16ms = 0% (idle)
    //   ≥100ms = 100% (maxed)
    const raw = Math.min(100, Math.max(0, ((elapsed - 16) / (100 - 16)) * 100));

    // Smooth with exponential moving average (alpha=0.3)
    cpuRef.current.estimate = Math.round(
      cpuRef.current.estimate * 0.7 + raw * 0.3
    );

    rafId.current = requestAnimationFrame(estimateCpu);
  }, []);

  // ── Detect OS and browser from user agent ────────────────────────────────
  function detectPlatform() {
    const ua = navigator.userAgent;
    const platform = navigator.platform || '';

    // OS
    let os = 'Unknown';
    if (/Windows/.test(ua)) os = 'Windows';
    else if (/Mac OS X/.test(ua)) os = 'macOS';
    else if (/Linux/.test(ua)) os = 'Linux';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/iOS|iPhone|iPad/.test(ua)) os = 'iOS';
    else if (/CrOS/.test(ua)) os = 'Chrome OS';

    // Browser
    let browser = 'Unknown';
    if (/Edg\//.test(ua)) browser = 'Edge';
    else if (/Chrome\//.test(ua)) browser = 'Chrome';
    else if (/Firefox\//.test(ua)) browser = 'Firefox';
    else if (/Safari\//.test(ua)) browser = 'Safari';
    else if (/OPR\//.test(ua)) browser = 'Opera';

    const cores = navigator.hardwareConcurrency || 0;
    const deviceMem = navigator.deviceMemory || 0;
    const screen = `${window.screen.width}×${window.screen.height} @${window.devicePixelRatio}x`;

    return { os, browser, cores, deviceMemory: deviceMem, screen, platform };
  }

  // ── Collect battery info ──────────────────────────────────────────────
  async function getBatteryInfo() {
    try {
      if (!navigator.getBattery) return { level: null, charging: false };
      const bat = await navigator.getBattery();
      return { level: Math.round(bat.level * 100), charging: bat.charging };
    } catch {
      return { level: null, charging: false };
    }
  }

  // ── Collect network info ──────────────────────────────────────────────
  function getNetworkInfo() {
    try {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!conn) return { type: 'unknown', speed: 0 };
      return {
        type: conn.effectiveType || 'unknown',
        speed: conn.downlink || 0,
      };
    } catch {
      return { type: 'unknown', speed: 0 };
    }
  }

  // ── Collect storage info ──────────────────────────────────────────────
  async function getStorageInfo() {
    try {
      if (!navigator.storage || !navigator.storage.estimate) return { quota: 0, usage: 0 };
      const est = await navigator.storage.estimate();
      return {
        quota: est.quota || 0,
        usage: est.usage || 0,
      };
    } catch {
      return { quota: 0, usage: 0 };
    }
  }

  const deviceInfoSetRef = useRef(false);

  // ── Poll metrics periodically ─────────────────────────────────────────
  useEffect(() => {
    // Set device info once (always, even when disabled)
    if (!deviceInfoSetRef.current) {
      setDeviceInfo(detectPlatform());
      deviceInfoSetRef.current = true;
    }

    if (!enabled) return;

    let interval;
    let mounted = true;

    async function poll() {
      try {
        const memoryJs = performance.memory
          ? { used: performance.memory.usedJSHeapSize, total: performance.memory.jsHeapSizeLimit }
          : null;

        // Memory percentage: JS heap used / heap limit, or estimate from deviceMemory
        let memPct = 0;
        let memUsed = 0;
        let memTotal = 0;
        if (memoryJs && memoryJs.total > 0) {
          memPct = Math.round((memoryJs.used / memoryJs.total) * 100);
          memUsed = memoryJs.used;
          memTotal = memoryJs.total;
        } else if (navigator.deviceMemory) {
          // Without performance.memory, estimate based on deviceMemory
          memPct = 0; // Can't estimate % without heap info
          memTotal = navigator.deviceMemory * 1073741824; // GB to bytes
        }

        const [battery, storage] = await Promise.all([
          getBatteryInfo(),
          getStorageInfo(),
        ]);
        const network = getNetworkInfo();

        const storagePct = storage.quota > 0
          ? Math.round((storage.usage / storage.quota) * 100)
          : 0;

        if (!mounted) return;

        const snapshot = {
          cpu: cpuRef.current.estimate,
          memory: memPct,
          memoryUsed: memUsed,
          memoryTotal: memTotal,
          battery: battery.level,
          batteryCharging: battery.charging,
          network: network.type,
          networkSpeed: network.speed,
          storage: storagePct,
          storageQuota: storage.quota,
          storageUsage: storage.usage,
        };

        setMetrics(snapshot);

        // Build history (timestamp + key metrics)
        const historyEntry = {
          ts: new Date().toISOString(),
          cpu: snapshot.cpu,
          memory: snapshot.memory,
          battery: snapshot.battery ?? 0,
          network: snapshot.networkSpeed,
        };

        setHistory(prev => {
          const next = [...prev, historyEntry];
          if (next.length > maxHistory) return next.slice(-maxHistory);
          return next;
        });
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setTimeout(() => { if (mounted) setError(null); }, 5000);
        }
      }
    }

    // Start CPU frame-timing loop
    rafId.current = requestAnimationFrame(estimateCpu);

    // Start polling
    poll();
    interval = setInterval(poll, pollInterval);

    return () => {
      mounted = false;
      clearInterval(interval);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [pollInterval, maxHistory, estimateCpu, enabled]);

  return { deviceMetrics: metrics, deviceInfo, history, error };
}
