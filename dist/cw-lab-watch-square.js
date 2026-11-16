/*
 * City Watch P20 LAB01 — painted visual candidate v0.2.
 * Original transparent PNGs are cropped at draw time, never warped or flattened
 * into a scene. Existing Gate-B geometry, doors, actors and saves are retained.
 * Mark's creative acceptance remains open; see the versioned asset manifest.
 */
(function () {
  'use strict';
  if (window.CWLabArt) return;
  const VERSION = 'P20-LAB01-WATCH-SQUARE-ART-v0.2';
  const BASE = 'assets/lab01-artfix-v02/';
  const WATCH = Object.freeze({ x: 63, y: 55, w: 5, h: 5, width: 262, door: [67, 60] });
  const FOUNTAIN = Object.freeze({ x: 72, y: 65, width: 53.2, key: 'pseudopolis_yard_lion_fountain' });
  const layers = {
    watch: { file: 'watch-house.webp', dimensions: [1254, 1254], crop: [40, 14, 1166, 1220] },
    fountain: { file: 'fountain.webp', dimensions: [1536, 1024], crop: [312, 18, 912, 944] }
  };
  // Selected ground-contact pixels. Registration does not change collision.
  const watchAnchor = [500, 1121];
  const fountainAnchor = [768, 957];
  const fountainFrontCrop = [312, 835, 912, 127];
  const watchScale = WATCH.width / layers.watch.crop[2];
  const fountainScale = FOUNTAIN.width / layers.fountain.crop[2];
  const state = {
    requestedMode: 'study', errors: [], watchDraws: 0,
    fountainRearDraws: 0, fountainFrontDraws: 0, fallbackCalls: 0,
    watchSignatureMatched: false, fountainSignatureMatched: false,
    lastWatch: null, lastFountain: null
  };
  const ready = Promise.all(Object.entries(layers).map(([id, layer]) => new Promise(resolve => {
    const im = layer.image = new Image();
    layer.ready = false;
    im.onload = () => {
      layer.ready = im.naturalWidth === layer.dimensions[0] && im.naturalHeight === layer.dimensions[1];
      if (!layer.ready) state.errors.push(id + ': unexpected source dimensions');
      resolve(layer.ready);
    };
    im.onerror = () => { state.errors.push(id + ': image failed to load'); resolve(false); };
    im.src = BASE + layer.file;
  })));
  const allReady = () => Object.values(layers).every(layer => layer.ready);
  const active = () => state.requestedMode === 'study' && allReady() && !state.errors.length;
  function boundsAt(layer, point, anchor, scale) {
    const [x, y, w, h] = layer.crop;
    return { x: point.x + (x - anchor[0]) * scale, y: point.y + (y - anchor[1]) * scale,
      width: w * scale, height: h * scale };
  }
  function drawAnchored(ctx, layer, point, anchor, scale, crop = layer.crop) {
    const [x, y, w, h] = crop;
    ctx.drawImage(layer.image, x, y, w, h,
      point.x + (x - anchor[0]) * scale, point.y + (y - anchor[1]) * scale,
      w * scale, h * scale);
  }
  function watchAlpha(xy, player, door) {
    if (!player) return 1;
    const pp = xy(player.x, player.y), bounds = boundsAt(layers.watch, door, watchAnchor, watchScale);
    const behind = player.x + player.y < WATCH.x + WATCH.y + (WATCH.w + WATCH.h) * .5;
    const near = Math.abs(player.x - (WATCH.x + WATCH.w * .5)) +
      Math.abs(player.y - (WATCH.y + WATCH.h * .5)) < 6;
    const overlaps = pp.x > bounds.x && pp.x < bounds.x + bounds.width &&
      pp.y > bounds.y && pp.y < bounds.y + bounds.height;
    return behind && near && overlaps ? .48 : 1;
  }
  function drawWatch(ctx, xy, building, player) {
    if (!building || building.id !== 'watch') return false;
    const matches = building.x === WATCH.x && building.y === WATCH.y &&
      building.w === WATCH.w && building.h === WATCH.h &&
      building.door && building.door[0] === WATCH.door[0] && building.door[1] === WATCH.door[1];
    state.watchSignatureMatched = !!matches;
    if (!active() || !matches) { state.fallbackCalls++; return false; }
    const door = xy(...WATCH.door), alpha = watchAlpha(xy, player, door);
    ctx.save();
    try {
      ctx.globalAlpha *= alpha;
      drawAnchored(ctx, layers.watch, door, watchAnchor, watchScale);
      state.watchDraws++;
      state.lastWatch = { doorScreen: { x: door.x, y: door.y }, alpha,
        bounds: boundsAt(layers.watch, door, watchAnchor, watchScale), bodySort: 122.3,
        registeredContactScreen: { x: door.x, y: door.y } };
    } finally { ctx.restore(); }
    return true;
  }
  function drawFountain(ctx, xy, x, y, key, scale) {
    if (x !== FOUNTAIN.x || y !== FOUNTAIN.y || key !== FOUNTAIN.key) return false;
    const matches = scale === undefined || scale === 1;
    state.fountainSignatureMatched = matches;
    if (!active() || !matches) { state.fallbackCalls++; return false; }
    const tile = xy(x, y), contact = { x: tile.x, y: tile.y + 3 };
    drawAnchored(ctx, layers.fountain, contact, fountainAnchor, fountainScale);
    state.fountainRearDraws++;
    state.lastFountain = { tileScreen: { x: tile.x, y: tile.y }, contactScreen: contact,
      width: FOUNTAIN.width, height: layers.fountain.crop[3] * fountainScale,
      rearSort: 137.01, frontSort: 137.18, sourceAnchor: fountainAnchor.slice(),
      retainedLegacyContactOffsetY: 3 };
    return true;
  }
  function enqueueForeground(objects, context) {
    if (!active() || !context || context.player?.place !== 'city') return;
    const { ctx, xy, visible } = context;
    // Reuse only the near rim in the existing foreground queue. The underlying
    // fountain cell remains walkable, as in Gate-B; no collider is added here.
    if (state.fountainSignatureMatched && (!visible || visible(FOUNTAIN.x, FOUNTAIN.y, 120))) objects.push({ z: 137.18, labLayer: 'fountain-front', draw() {
      if (!active()) return;
      const tile = xy(FOUNTAIN.x, FOUNTAIN.y);
      drawAnchored(ctx, layers.fountain, { x: tile.x, y: tile.y + 3 }, fountainAnchor, fountainScale, fountainFrontCrop);
      state.fountainFrontDraws++;
    } });
  }
  // Camera bounds come from the SAME registered pixels used by the renderer.
  // These are presentation extents, never world cells or collision footprints.
  function framingBounds(project, which = 'wide') {
    if (typeof project !== 'function') return null;
    const watch = boundsAt(layers.watch, project(...WATCH.door), watchAnchor, watchScale);
    const tile = project(FOUNTAIN.x, FOUNTAIN.y);
    const fountain = boundsAt(layers.fountain, { x: tile.x, y: tile.y + 3 }, fountainAnchor, fountainScale);
    const selected = which === 'fountain' ? [fountain] : which === 'watch' ? [watch] : [watch, fountain];
    const left = Math.min(...selected.map(b => b.x)) - 16;
    const top = Math.min(...selected.map(b => b.y));
    const right = Math.max(...selected.map(b => b.x + b.width)) + 16;
    const bottom = Math.max(...selected.map(b => b.y + b.height)) + 28;
    return { x: left, y: top, width: right - left, height: bottom - top };
  }
  function status() {
    return {
      version: VERSION, requestedMode: state.requestedMode, effectiveMode: active() ? 'study' : 'reference',
      ready: allReady(), layers: Object.fromEntries(Object.entries(layers).map(([id, layer]) =>
        [id, { file: layer.file, ready: layer.ready, dimensions: layer.dimensions.slice(), crop: layer.crop.slice() }])),
      errors: state.errors.slice(), counts: { watch: state.watchDraws, entrance: 0,
        fountainRear: state.fountainRearDraws, fountainFront: state.fountainFrontDraws, fallback: state.fallbackCalls },
      signatures: { watch: state.watchSignatureMatched, fountain: state.fountainSignatureMatched },
      anchors: { watchDoor: WATCH.door.slice(), fountain: [FOUNTAIN.x, FOUNTAIN.y] },
      lastWatch: state.lastWatch, lastFountain: state.lastFountain,
      registration: { watchScale, sourceGroundContact: watchAnchor.slice(), transform: 'uniform scale only',
        fountainScale, fountainSourceContact: fountainAnchor.slice(), fountainFrontCrop: fountainFrontCrop.slice() },
      mapChanged: false, collisionChanged: false, saveChanged: false, actorPositionsChanged: false,
      artStatus: 'PAINTED CANDIDATE v0.2 — MARK CREATIVE ACCEPTANCE OPEN',
      knownLimits: ['Pre-existing fountain cell is walkable; no collider added',
        'Fixed legacy square composition; full VIS-123 environment milestone remains open']
    };
  }
  window.CWLabArt = {
    version: VERSION, ready, drawWatch, drawFountain, enqueueForeground, framingBounds, status, report: status,
    setMode(mode) {
      if (mode !== 'study' && mode !== 'reference') throw new RangeError('Art mode must be study or reference');
      state.requestedMode = mode;
      return status();
    }
  };
})();
