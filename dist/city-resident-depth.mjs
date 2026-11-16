// The mixed scene comparator can skip a resident/roof pair when its depth
// relationships form a cycle. Constrain resident slots against the final
// scenery order, leaving the existing order of buildings and other actors.
export function constrainResidentDepth(render, {boundsFor, inFront, isStructure, fullyCovers}) {
  const residents = render.filter(object => object.streetLife);
  if (!residents.length) return;
  const structures = new Set(render.filter(object => !object.person && (object.bridgePart || isStructure(object))));
  for (const resident of residents) {
    const body = boundsFor(resident);
    if (!body) continue;
    const [left, top, width, height] = body;
    const current = render.indexOf(resident);
    let first = 0;
    let last = render.length - 1;
    for (let i = 0; i < render.length; i++) {
      const object = render[i];
      if (!structures.has(object) || !object.bounds || !object.rect) continue;
      const [x, y, w, h] = object.bounds;
      if (x >= left + width || x + w <= left || y >= top + height || y + h <= top) continue;
      // Slots are measured in the list with this resident removed.
      const slot = i > current ? i - 1 : i;
      if (inFront(resident.p, object)) first = Math.max(first, slot + 1);
      else if (fullyCovers?.(object, body)) {
        render.splice(current, 1);
        last = -1;
        break;
      } else last = Math.min(last, slot);
    }
    // Where two scenery planes disagree, the foreground still covers the
    // resident. Transparent roof pixels show the resident naturally.
    const target = Math.min(last, Math.max(first, current));
    if (last < 0 || target === current) continue;
    render.splice(current, 1);
    render.splice(target, 0, resident);
  }
}
