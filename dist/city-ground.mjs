/* Painted ground only. Bounds are in the existing global projected coordinates.
 * This module has no navigation, doors, save or geometry authority. */
export function intersects(box, view) {
  return box[0] < view[2] && box[2] > view[0] && box[1] < view[3] && box[3] > view[1];
}

export function groundView(camera, zoom, width, height, margin = 64) {
  return [camera.x - width / (2 * zoom) - margin, camera.y - height / (2 * zoom) - margin,
    camera.x + width / (2 * zoom) + margin, camera.y + height / (2 * zoom) + margin];
}

async function decode(url, signal, dimensions) {
  const response = await fetch(url, {signal});
  if (!response.ok) throw Error('Street painting unavailable (' + response.status + ')');
  const blob = await response.blob();
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(blob, {resizeWidth:dimensions[0], resizeHeight:dimensions[1], resizeQuality:'high'}); } catch (error) { if (signal.aborted) throw error; }
  }
  const objectURL = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      const finish = (error, canvas) => {
        image.onload = image.onerror = null;
        signal.removeEventListener('abort', abort);
        if (error) reject(error); else resolve(canvas);
      };
      const abort = () => finish(signal.reason || new DOMException('Aborted', 'AbortError'));
      image.onload = () => {
        try {
          if (signal.aborted) { abort(); return; }
          // Own the pixels before revoking the Blob URL, even at native size.
          // A retained HTMLImageElement can need its source again after WebKit
          // discards decoded pixels. A canvas does not depend on that URL.
          const c = document.createElement('canvas');
          c.width = dimensions[0]; c.height = dimensions[1];
          c.getContext('2d').drawImage(image, 0, 0, c.width, c.height);
          finish(null, c);
        } catch (error) {
          finish(Error('Street painting could not retain pixels: ' + url, {cause:error}));
        }
      };
      image.onerror = () => finish(Error('Street painting could not decode: ' + url));
      signal.addEventListener('abort', abort, {once:true});
      if (signal.aborted) { abort(); return; }
      image.src = objectURL;
    });
  } finally { URL.revokeObjectURL(objectURL); }
}

export class GroundPainter {
  constructor(manifest, {baseURL, maxDecoded = 24, concurrency = 2, loader = decode,
    now = () => performance.now(), onError = () => {}}) {
    this.id = manifest.asset_id;
    this.records = [...manifest.runtime_files, ...(manifest.quay_art_files || [])];
    this.baseURL = baseURL;
    this.limit = maxDecoded;
    this.concurrency = concurrency;
    this.loader = loader;
    this.now = now;
    this.onError = onError;
    this.entries = new Map();
    this.errors = new Map();
    this.visible = [];
    this.wanted = [];
    this.inFlight = 0;
    this.loads = 0;
    this.evictions = 0;
    this.highWater = 0;
    this.overBudget = false;
    this.disposed = false;
    this.resolution = 1;
    this.revision = 0;
    this.highWaterMiB = 0;
  }

  update(view, resolution = 1) {
    if (this.disposed) return;
    if (![1,.5,.25].includes(resolution)) throw Error('Unknown ground resolution');
    const cx = (view[0] + view[2]) / 2, cy = (view[1] + view[3]) / 2;
    this.visible = this.records.filter(r => intersects(r.screen_box, view));
    // A wide view must reduce detail rather than permanently omit outer chunks.
    const bytes = this.visible.reduce((n,r)=>n+r.dimensions[0]*r.dimensions[1]*4,0);
    while(resolution>.25 && bytes*resolution*resolution>this.limit*1048576)resolution/=2;
    this.resolution = resolution;
    const priority = r => Math.hypot((r.screen_box[0] + r.screen_box[2]) / 2 - cx,
      (r.screen_box[1] + r.screen_box[3]) / 2 - cy);
    const capacity = this.limit / (resolution * resolution);
    this.overBudget = this.visible.length > capacity;
    this.wanted = [...this.visible].sort((a, b) => priority(a) - priority(b)).slice(0, capacity);
    const keep = new Set(this.wanted.map(r => this.cacheKey(r)));
    for (const [id, entry] of this.entries) {
      if (keep.has(id)) entry.used = this.now();
      else if (entry.state === 'loading') { entry.controller.abort(); this.entries.delete(id); }
    }
    this.pump();
  }

  cacheKey(record) { return record.file + "@" + this.resolution; }
  reservedBytes() { return [...this.entries.values()].reduce((n,e)=>n+e.bytes,0); }

  evict(bytes) {
    while (this.reservedBytes() + bytes > this.limit * 1048576) {
    const wanted = new Set(this.wanted.map(r => this.cacheKey(r)));
    const old = [...this.entries].filter(([id, e]) => e.state === 'ready' && !wanted.has(id))
      .sort((a, b) => a[1].used - b[1].used)[0];
    if (!old) return false;
    this.release(old[1]); this.entries.delete(old[0]); this.evictions++;
    }
    return true;
  }

  pump() {
    if (this.disposed) return;
    for (const record of this.wanted) {
      if (this.inFlight >= this.concurrency) break;
      const id=this.cacheKey(record), dimensions=record.dimensions.map(x=>Math.round(x*this.resolution)), bytes=dimensions[0]*dimensions[1]*4;
      if (this.entries.has(id) || (this.errors.get(id)?.retryAt || 0) > this.now()) continue;
      if (!this.evict(bytes)) break;
      const entry = {state:'loading', used:this.now(), controller:new AbortController(), record, dimensions, bytes};
      this.entries.set(id, entry); this.inFlight++;
      const url = this.baseURL + (record.sharedFile || record.file.split('/').pop());
      Promise.resolve().then(() => this.loader(url, entry.controller.signal, dimensions)).then(image => {
        if (this.disposed || this.entries.get(id) !== entry || entry.controller.signal.aborted) {
          image.close?.(); return;
        }
        if (image.width !== dimensions[0] || image.height !== dimensions[1]) {
          image.close?.(); throw Error('Street painting dimensions changed');
        }
        entry.image = image; entry.state = 'ready'; this.loads++; this.errors.delete(id);
        this.highWater = Math.max(this.highWater, [...this.entries.values()].filter(e => e.state === 'ready').length);
        this.highWaterMiB = Math.max(this.highWaterMiB, this.reservedBytes()/1048576);
      }).catch(error => {
        if (this.entries.get(id) === entry) this.entries.delete(id);
        if (!entry.controller.signal.aborted && !this.disposed) {
          this.errors.set(id, {message:error.message, retryAt:this.now()+10000});
          this.onError(error);
        }
      }).finally(() => { this.inFlight--; this.revision++; this.pump(); });
    }
  }

  draw(ctx) {
    for (const record of this.visible) {
      const entry = this.entries.get(this.cacheKey(record)) ||
        [...this.entries.values()].find(e=>e.record.file===record.file&&e.state==='ready');
      if (entry?.state === 'ready') ctx.drawImage(entry.image, record.screen_box[0], record.screen_box[1], ...record.dimensions);
    }
  }

  release(entry) { entry.controller?.abort(); entry.image?.close?.(); }
  dispose() { this.disposed = true; for (const e of this.entries.values()) this.release(e); this.entries.clear(); }

  report() {
    const ready = [...this.entries.values()].filter(e => e.state === 'ready');
    const visibleReady = this.visible.filter(r => this.entries.get(this.cacheKey(r))?.state === 'ready').length;
    return {id:this.id, total:this.records.length, streetChunks:this.records.filter(r=>r.file.startsWith('runtime/')).length,
      visible:this.visible.length, visibleReady, pending:this.inFlight, decoded:ready.length,
      decodedMiB:ready.reduce((n,e)=>n+e.image.width*e.image.height*4,0)/1048576,
      maxDecodedMiB:this.limit, resolution:this.resolution, highWater:this.highWater, highWaterMiB:this.highWaterMiB, reservedMiB:this.reservedBytes()/1048576, loads:this.loads, evictions:this.evictions,
      overBudget:this.overBudget, errors:[...this.errors].map(([file,e])=>({file,message:e.message}))};
  }
}
