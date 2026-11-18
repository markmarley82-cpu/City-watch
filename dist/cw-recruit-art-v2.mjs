/* The same authored recruit poses and fitted layers for streets, rooms and combat. */
const directory = 'assets/recruit-art-v2/';
const clips = ['idle', 'walk', 'attack', 'guard', 'hit', 'shove', 'restrain', 'surrender', 'down'];
const frameTimes = [200, 100, 85, 90, 75, 90, 100, 110, 120];
const contact = {attack: 3, shove: 3, restrain: 4};
const held = new Set(['guard', 'surrender', 'down']);
const armour = {
  'watch-plate': 'watch-breastplate',
  'service-mail': 'service-mail',
  'work-jerkin': 'leather-jerkin',
};
// Fit the saved cuts and finishes to the garment regions of the new painted bodies.
const fittedFinishes = {
  'drawn-fitted-breeches': [91, 77, 62],
  'drawn-split-panels': [103, 76, 58],
  'drawn-fitted-footwear': [78, 61, 46],
  'drawn-watch-helmet': [104, 106, 102],
};
const regionSlots = ['helmet', 'trousers', 'boots'];
const playerActor = actor => actor === 'player' || actor === 'battle:officer';

function canvas(width, height) {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(width, height);
  return Object.assign(document.createElement('canvas'), {width, height});
}

export async function openRecruitArt(baseURL, loadImage) {
  const response = await fetch(new URL(directory + 'manifest.json', baseURL));
  if (!response.ok) throw Error('Recruit art catalogue unavailable');
  const data = await response.json();
  return createRecruitArt(data, {baseURL, loadImage});
}

export function createRecruitArt(data, {
  baseURL, loadImage, makeCanvas = canvas, maxDecodedBytes = 28 * 1024 * 1024,
} = {}) {
  const {cols, rows, cellWidth: width, cellHeight: height, footX, footY, bodies} = data;
  if (data.schemaVersion !== 1 || cols !== 6 || rows !== 10 || width !== 128 || height !== 96 ||
      footX !== 64 || footY !== 92 || !bodies) throw Error('Invalid recruit atlas contract');

  const images = new Map();
  const pending = new Map();
  const failures = new Map();
  const compositions = new Map();
  const imageBytes = cols * width * rows * height * 4;
  const maxImages = Math.max(6, Math.floor(maxDecodedBytes / imageBytes));
  const limitCompositions = 64;
  let pinned = new Set();

  function touch(cache, key) {
    if (!cache.has(key)) return null;
    const value = cache.get(key);
    cache.delete(key);
    cache.set(key, value);
    return value;
  }

  function load(file) {
    const hit = touch(images, file);
    if (hit) return Promise.resolve(hit);
    if (pending.has(file)) return pending.get(file);
    const request = loadImage(new URL(directory + file, baseURL).href).then(image => {
      if ((image.naturalWidth || image.width) !== cols * width ||
          (image.naturalHeight || image.height) !== rows * height) {
        throw Error('Recruit atlas has the wrong dimensions: ' + file);
      }
      images.set(file, image);
      while (images.size > maxImages) {
        const oldest = [...images.keys()].find(key => !pinned.has(key));
        if (!oldest) break;
        images.delete(oldest);
      }
      failures.delete(file);
      return image;
    }).catch(error => {
      // A transient fetch failure should not strand an otherwise playable recruit.
      failures.set(file, Date.now() + 15000);
      throw error;
    }).finally(() => pending.delete(file));
    pending.set(file, request);
    return request;
  }

  function appearance(id, pose) {
    const body = bodies[id];
    const spec = {body: body.files.body};
    const wardrobe = globalThis.CWDrawnWardrobe;
    const raw = pose.clothing === true ? globalThis.CWClothing?.selected(id) : pose.clothing;
    const outfit = wardrobe?.current?.normalize(raw) || raw || {};
    const head = pose.head === true || pose.head == null && pose.clothing === true
      ? globalThis.CWHeads?.selected(id) : pose.head;
    const selectedArmour = globalThis.CWFittedEquipment?.current?.choice(id, pose) ||
      pose.equipment || String(outfit.coat || '').replace(/^fitted-/, '');
    const piece = armour[selectedArmour];
    if (piece && body.files[piece]) spec.armour = body.files[piece];

    const headIndex = ['a', 'b'].indexOf(head);
    if (headIndex >= 0) {
      spec.head = body.files['head-' + body.heads[headIndex]];
      spec.headMask = body.files['head-mask'];
    }

    const colours = wardrobe?.colours || {};
    const coat = colours.coat?.[outfit.coat];
    if (coat && body.files['coat-mask']) spec.coatMask = body.files['coat-mask'];
    const tint = regionSlots.map(slot => colours[slot]?.[outfit[slot]] || fittedFinishes[outfit[slot]]);
    if (tint.some(Boolean) && body.files['regions-mask']) spec.regions = body.files['regions-mask'];
    const badge = ['watch', 'copper'].includes(outfit.badge) ? outfit.badge : null;
    if (badge && !spec.coatMask && body.files['coat-mask']) spec.badgeMask = body.files['coat-mask'];
    return {spec, coat, tint, badge, equipment: piece ? selectedArmour : 'original'};
  }

  function ensure(id, pose = {}, pin = false) {
    if (!bodies[id]) return Promise.resolve(false);
    const files = Object.values(appearance(id, pose).spec);
    if (pin) pinned = new Set(files);
    return Promise.all(files.map(load)).then(() => true);
  }

  function regionPixels(image, frame) {
    const temp = makeCanvas(width, height);
    const context = temp.getContext('2d', {willReadFrequently: true});
    context.drawImage(image, frame.sx, frame.sy, width, height, 0, 0, width, height);
    return context.getImageData(0, 0, width, height).data;
  }

  function compose(id, frame, style, layers) {
    const key = JSON.stringify([id, frame.index, style]);
    const cached = touch(compositions, key);
    if (cached) return cached;
    const result = makeCanvas(width, height);
    const context = result.getContext('2d', {willReadFrequently: true});
    const stamp = image => context.drawImage(image, frame.sx, frame.sy, width, height, 0, 0, width, height);
    stamp(layers.body);
    let badgePoint = null;
    if (layers.coatMask || layers.regions || layers.headMask || layers.badgeMask) {
      const coatMask = layers.coatMask && regionPixels(layers.coatMask, frame);
      const regions = layers.regions && regionPixels(layers.regions, frame);
      const headMask = layers.headMask && regionPixels(layers.headMask, frame);
      const badgeMask = coatMask || (layers.badgeMask && regionPixels(layers.badgeMask, frame));
      const pixels = context.getImageData(0, 0, width, height);
      let minX = width, maxX = 0, minY = height;
      for (let i = 0; i < pixels.data.length; i += 4) {
        if (!pixels.data[i + 3]) continue;
        if (headMask?.[i]) {
          pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = pixels.data[i + 3] = 0;
          continue;
        }
        if (badgeMask?.[i]) {
          const x = (i / 4) % width;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, Math.floor(i / (4 * width)));
        }
        const tint = coatMask?.[i] ? style.coat : regions?.[i] ? style.tint[0]
          : regions?.[i + 1] ? style.tint[1] : regions?.[i + 2] ? style.tint[2] : null;
        if (!tint) continue;
        const shade = .35 + (.2126 * pixels.data[i] + .7152 * pixels.data[i + 1] +
          .0722 * pixels.data[i + 2]) / 170;
        for (let channel = 0; channel < 3; channel++) pixels.data[i + channel] = tint[channel] * shade;
      }
      context.putImageData(pixels, 0, 0);
      if (minX < maxX) badgePoint = [minX + (maxX - minX) * .39, minY + 6];
    }
    if (layers.armour) stamp(layers.armour);
    if (badgePoint) {
      const [x, y] = badgePoint;
      context.fillStyle = style.badge === 'copper' ? '#ba784e' : '#d8ba69';
      context.beginPath();
      context.moveTo(x - 1.4, y - 1);
      context.lineTo(x + 1.4, y - 1);
      context.lineTo(x + 1.2, y + 1);
      context.lineTo(x, y + 2);
      context.lineTo(x - 1.2, y + 1);
      context.fill();
    }
    if (layers.head) stamp(layers.head);
    compositions.set(key, result);
    while (compositions.size > limitCompositions) compositions.delete(compositions.keys().next().value);
    return result;
  }

  function draw(context, id, pose, x, y, renderHeight) {
    const body = bodies[id];
    if (!body) return null;
    const action = pose.clip || 'idle';
    const actionRow = clips.indexOf(action);
    if (actionRow < 0) return null;
    const truncheon = action === 'attack' && /truncheon|baton/.test(String(pose.weapon));
    const row = truncheon ? 9 : actionRow;
    const repeating = actionRow < 2;
    const tick = pose.reduced ? (held.has(action) ? 5 : contact[action] ?? 0)
      : Number.isFinite(pose.frame) ? Math.max(0, Math.floor(pose.frame))
      : Math.floor(Math.max(0, Number(pose.elapsed) || 0) / frameTimes[actionRow]);
    const localFrame = repeating ? tick % cols : Math.min(cols - 1, tick);
    const frame = {
      index: row * cols + localFrame, frame: localFrame, sx: localFrame * width, sy: row * height,
      sw: width, sh: height, flip: pose.facing > 0, clip: action,
      drawn: true, available: true, provenance: 'drawn-poses', recruitArt: 'v2',
      playerArt: playerActor(pose.actorId), weapon: truncheon ? 'truncheon' : 'unarmed',
    };
    const style = appearance(id, pose);
    const expected = Object.entries(style.spec);
    if (frame.playerArt) pinned = new Set(expected.map(([, file]) => file));
    const loaded = {};
    for (const [layer, file] of expected) {
      const image = touch(images, file);
      if (image) loaded[layer] = image;
      else if (!pending.has(file) && !(failures.get(file) > Date.now())) load(file).catch(() => {});
    }
    if (!loaded.body) return null;
    const ready = Object.keys(loaded).length === expected.length;
    const scale = renderHeight / body.visibleHeight;
    if (!Number.isFinite(scale) || scale <= 0 || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    context.save();
    try {
      context.translate(x, y);
      if (frame.flip) context.scale(-1, 1);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      if (ready && expected.length > 1) {
        context.drawImage(compose(id, frame, style, loaded), -footX * scale, -footY * scale,
          width * scale, height * scale);
      } else {
        context.drawImage(loaded.body, frame.sx, frame.sy, width, height,
          -footX * scale, -footY * scale, width * scale, height * scale);
      }
    } finally {
      context.restore();
    }
    return {...frame, appearancePending: !ready, equipment: style.equipment, equipmentReady: ready,
      drawnWardrobe: ready && !!(style.spec.head || style.spec.regions || style.spec.coatMask || style.badge)};
  }

  return {supports: id => Object.hasOwn(bodies, id), ensure, draw,
    report: () => ({bodies: Object.keys(bodies).length, decodedBytes: images.size * imageBytes,
      pending: pending.size, compositions: compositions.size})};
}
