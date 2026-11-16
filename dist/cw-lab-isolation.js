/* City Watch Lab 01: storage boundary. No automatic legacy import or worker registration. */
(function (global) {
  'use strict';
  const BUILD_ID = global.CW_LAB_RELEASE?.buildId || null;
  const releaseAvailable = typeof BUILD_ID === 'string';
  const LEGACY_NAMESPACE = 'city_watch_lab01_v01_';
  const requestedRoom = new URL(global.location.href).searchParams.get('rebuild-room');
  const roomMode = ['watch','library','warehouse','tavern','shop','crypt'].includes(requestedRoom);
  const NAMESPACE = roomMode ? 'city_watch_lab01_v07_rooms_' : LEGACY_NAMESPACE;
  const keys = Object.freeze({
    player: NAMESPACE + 'player',
    notes: LEGACY_NAMESPACE + 'notes',
    newspapers: LEGACY_NAMESPACE + 'newspaper_clippings_v1',
    living: NAMESPACE + 'living'
  });
  const allowedKeys = new Set(Object.values(keys));
  const page = new URL(global.location.href);
  const hostname = page.hostname.toLowerCase().replace(/\.$/, '');
  const protectedHost = 'little-butterfly-86e2.markmarley82.workers.dev';
  const originAllowed = /^(https?:)$/.test(page.protocol) && hostname !== protectedHost;
  let phase = originAllowed && releaseAvailable ? 'pending' : 'blocked';
  let reason = !releaseAvailable ? 'The test release file is missing. Reload the complete Lab01 package; no saved progress has been changed.' : originAllowed ? null : 'Open this separate test from its own web address. It cannot run at the protected game address or from a local file preview.';
  let preparation;
  const counts = { reads: 0, writes: 0, removes: 0, rejected: 0 };

  function showBlocked() {
    const document = global.document;
    if (!document || !document.createElement) return;
    const show = () => {
      if (!document.body || document.getElementById('cw-lab-blocked')) return;
      const box = document.createElement('section');
      box.id = 'cw-lab-blocked';
      box.setAttribute('role', 'alert');
      box.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:grid;place-content:center;gap:16px;padding:28px;background:#101b23;color:#f5e4c3;font:18px/1.5 system-ui;text-align:center';
      const title = document.createElement('h1');
      title.textContent = 'Watch Square test';
      const message = document.createElement('p');
      message.textContent = reason || 'This test could not start safely. Open its separate test address.';
      box.append(title, message);
      document.body.appendChild(box);
    };
    if (document.body) show();
    else document.addEventListener('DOMContentLoaded', show, { once: true });
  }

  function block(message) {
    phase = 'blocked';
    reason = message;
    showBlocked();
    return new Error(message);
  }

  function assertReady() {
    if (phase !== 'ready' || !originAllowed) {
      counts.rejected++;
      throw new Error(reason || 'Lab isolation preflight has not completed.');
    }
  }

  function checkKey(key) {
    assertReady();
    // Existing engine callers use literal keys. A room fork translates only its
    // two geometry-bearing records; the user's geometry-free notes stay shared.
    if (roomMode && (key === LEGACY_NAMESPACE + 'player' || key === LEGACY_NAMESPACE + 'living')) key = NAMESPACE + key.slice(LEGACY_NAMESPACE.length);
    if (typeof key !== 'string' || !allowedKeys.has(key)) {
      counts.rejected++;
      throw new Error('This storage key does not belong to Watch Square Lab 01.');
    }
    return key;
  }

  const storage = Object.freeze({
    getItem(key) {
      key = checkKey(key);
      const result = global.localStorage.getItem(key);
      counts.reads++;
      return result;
    },
    setItem(key, value) {
      key = checkKey(key);
      global.localStorage.setItem(key, String(value));
      counts.writes++;
    },
    removeItem(key) {
      key = checkKey(key);
      global.localStorage.removeItem(key);
      counts.removes++;
    }
  });

  function prepare() {
    if (preparation) return preparation;
    preparation = (async () => {
      if (!originAllowed || !releaseAvailable) throw block(reason);
      try {
        const worker = global.navigator && global.navigator.serviceWorker;
        if (worker) {
          if (worker.controller) throw new Error('Another installed game version controls this page. Open this test at its own address or in a separate browser profile.');
          if (typeof worker.getRegistrations !== 'function') throw new Error('This browser cannot verify the test address. Use a separate supported browser profile.');
          const registrations = await worker.getRegistrations();
          if (registrations.some(registration => page.href.startsWith(registration.scope))) {
            throw new Error('An installed game version already uses this address. Open the test at a separate address; existing installations have been left untouched.');
          }
          if (worker.controller) throw new Error('Another installed game version took control while the test was starting. Open a separate test address.');
          if (typeof worker.addEventListener === 'function') worker.addEventListener('controllerchange', () => {
            if (worker.controller) block('Another installed game version took control of this page. Close this test and use its separate address.');
          });
        }
        phase = 'ready';
        return report();
      } catch (error) {
        throw block(String(error && error.message || error));
      }
    })();
    return preparation;
  }

  function report() {
    return {
      buildId: BUILD_ID,
      namespace: NAMESPACE,
      keys: { ...keys },
      origin: page.origin,
      originAllowed,
      phase,
      ready: phase === 'ready',
      reason,
      serviceWorkerPolicy: 'disabled; existing registrations and caches are never changed',
      cacheNamespace: NAMESPACE + 'assets_unused',
      legacyImport: false,
      storageOperations: { ...counts }
    };
  }

  const api = Object.freeze({
    buildId: BUILD_ID,
    namespace: NAMESPACE,
    keys,
    originAllowed,
    get ready() { return phase === 'ready'; },
    prepare,
    assertReady,
    storage,
    report,
    showBlocked
  });
  Object.defineProperty(global, 'CW_LAB', { value: api, writable: false, configurable: false, enumerable: true });
  if (!originAllowed || !releaseAvailable) showBlocked();
})(window);
