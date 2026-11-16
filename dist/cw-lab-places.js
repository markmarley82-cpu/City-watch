/* City Watch LAB01: read-only source-parity place bindings.
 * Load immediately after cw-city-map.js, before CW_START_R2().
 * No navigation, rendering, storage, quest or map mutations.
 * Numeric positions describe the current GAME build, not canonical geography.
 */
(function (root) {
  'use strict';
  const registry = {"version":"CW-LAB-PLACES-0.1.0","schemaVersion":1,"role":"SOURCE_PARITY_METADATA_ADAPTER; NO EXECUTABLE REMAP","contractVersion":"P20-MAP-002-v1.0","source":{"archive":"P20_GATEB_PHONE_TEST_v0.1.zip","archiveSHA256":"b4461f304f7a56efee736bd017b9b1423b3725d876d83b97fe6f6978e0c9aa3d","mapFile":"cw-city-map.js","mapFileSHA256":"5dcb0b2a9276ff1fddc46408dff0c63f2d065f1090753151c44227d3f31b1500","mapVersion":"CITY-1","dimensions":[160,128],"spawn":[70,63],"buildingCount":340,"landmarkCount":19,"interiorCount":6},"validationScope":"Runtime: all 19 landmark IDs, labels, building types, footprints, doors, interior aliases, counts, city dimensions and spawn. Whole-file SHA-256 parity is verified by build tests, not computed by this runtime module.","namespacePolicy":"Strict methods distinguish stable place IDs, legacy building IDs, legacy interior keys, scene IDs, approach IDs and enterable door IDs. Unknown or wrong-namespace values return null.","geometryPolicy":"No source object, route, collision, actor, case, room, render or storage mutation. No Atlas schematic coordinates are used; no crossing identities are remapped.","places":[{"id":"place:watch-house","legacyBuildingId":"watch","lfRoleId":"LF-01","label":"Watch House","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"watch","footprint":[63,55,5,5],"approach":{"id":"anchor:watch-house:approach","coordinateSpace":"city-tile","point":[67,60],"actionKind":"ENTER"},"interior":{"legacyRoomKey":"watch","sceneId":"room:watch","doorId":"door:watch-house:main","coordinateSpace":"room-image-px","navigationPolicy":"Existing I1 code remains authoritative; no room coordinates transformed.","returnPolicy":"Preserve existing behavior: immediate exit uses captured flags.entry; loading an inside save resolves mapped exterior door."}},{"id":"place:opera-house","legacyBuildingId":"opera","lfRoleId":"LF-02","label":"Opera House","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"opera","footprint":[82,58,5,5],"approach":{"id":"anchor:opera-house:approach","coordinateSpace":"city-tile","point":[86,63],"actionKind":"EXAMINE"},"interior":null},{"id":"place:temple-small-gods","legacyBuildingId":"temple","lfRoleId":"LF-03","label":"Temple of Small Gods","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"temple","footprint":[95,59,4,5],"approach":{"id":"anchor:temple-small-gods:approach","coordinateSpace":"city-tile","point":[98,64],"actionKind":"EXAMINE"},"interior":null},{"id":"place:patrician-palace","legacyBuildingId":"palace","lfRoleId":"LF-04","label":"Patrician’s Palace","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"palace","footprint":[68,20,6,6],"approach":{"id":"anchor:patrician-palace:approach","coordinateSpace":"city-tile","point":[73,26],"actionKind":"EXAMINE"},"interior":null},{"id":"place:unseen-university","legacyBuildingId":"university","lfRoleId":"LF-05","label":"Unseen University","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"university","footprint":[100,24,7,6],"approach":{"id":"anchor:unseen-university:approach","coordinateSpace":"city-tile","point":[106,30],"actionKind":"EXAMINE"},"interior":null},{"id":"place:guild-archives","legacyBuildingId":"archives","lfRoleId":"LF-06","label":"Guild Archives","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"library","footprint":[86,23,5,4],"approach":{"id":"anchor:guild-archives:approach","coordinateSpace":"city-tile","point":[90,27],"actionKind":"ENTER"},"interior":{"legacyRoomKey":"library","sceneId":"room:library","doorId":"door:guild-archives:main","coordinateSpace":"room-image-px","navigationPolicy":"Existing I1 code remains authoritative; no room coordinates transformed.","returnPolicy":"Preserve existing behavior: immediate exit uses captured flags.entry; loading an inside save resolves mapped exterior door."}},{"id":"place:dock-warehouse","legacyBuildingId":"warehouse","lfRoleId":"LF-07","label":"Dock Warehouse","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"warehouse","footprint":[25,72,5,4],"approach":{"id":"anchor:dock-warehouse:approach","coordinateSpace":"city-tile","point":[29,76],"actionKind":"ENTER"},"interior":{"legacyRoomKey":"warehouse","sceneId":"room:warehouse","doorId":"door:dock-warehouse:main","coordinateSpace":"room-image-px","navigationPolicy":"Existing I1 code remains authoritative; no room coordinates transformed.","returnPolicy":"Preserve existing behavior: immediate exit uses captured flags.entry; loading an inside save resolves mapped exterior door."}},{"id":"place:mended-drum","legacyBuildingId":"drum","lfRoleId":"LF-08","label":"Mended Drum","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"tavern","footprint":[59,96,4,4],"approach":{"id":"anchor:mended-drum:approach","coordinateSpace":"city-tile","point":[62,100],"actionKind":"ENTER"},"interior":{"legacyRoomKey":"tavern","sceneId":"room:tavern","doorId":"door:mended-drum:main","coordinateSpace":"room-image-px","navigationPolicy":"Existing I1 code remains authoritative; no room coordinates transformed.","returnPolicy":"Preserve existing behavior: immediate exit uses captured flags.entry; loading an inside save resolves mapped exterior door."}},{"id":"place:market-hall","legacyBuildingId":"market","lfRoleId":"LF-09","label":"Market Hall","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"shop","footprint":[119,77,5,4],"approach":{"id":"anchor:market-hall:approach","coordinateSpace":"city-tile","point":[123,81],"actionKind":"ENTER"},"interior":{"legacyRoomKey":"shop","sceneId":"room:shop","doorId":"door:market-hall:main","coordinateSpace":"room-image-px","navigationPolicy":"Existing I1 code remains authoritative; no room coordinates transformed.","returnPolicy":"Preserve existing behavior: immediate exit uses captured flags.entry; loading an inside save resolves mapped exterior door."}},{"id":"place:old-crypt","legacyBuildingId":"crypt","lfRoleId":"LF-10","label":"Old Crypt","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"crypt","footprint":[138,92,4,4],"approach":{"id":"anchor:old-crypt:approach","coordinateSpace":"city-tile","point":[141,96],"actionKind":"ENTER"},"interior":{"legacyRoomKey":"crypt","sceneId":"room:crypt","doorId":"door:old-crypt:main","coordinateSpace":"room-image-px","navigationPolicy":"Existing I1 code remains authoritative; no room coordinates transformed.","returnPolicy":"Preserve existing behavior: immediate exit uses captured flags.entry; loading an inside save resolves mapped exterior door."}},{"id":"place:shades-tenement","legacyBuildingId":"shades","lfRoleId":"LF-11","label":"The Shades Tenement","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"house","footprint":[135,41,3,3],"approach":{"id":"anchor:shades-tenement:approach","coordinateSpace":"city-tile","point":[137,44],"actionKind":"EXAMINE"},"interior":null},{"id":"place:lantern-row","legacyBuildingId":"lantern","lfRoleId":"LF-12","label":"Lantern Row","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"house","footprint":[126,103,3,3],"approach":{"id":"anchor:lantern-row:approach","coordinateSpace":"city-tile","point":[128,106],"actionKind":"EXAMINE"},"interior":null},{"id":"place:watch-outpost","legacyBuildingId":"outpost","lfRoleId":"LF-13","label":"Watch Outpost","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"outpost","footprint":[76,52,2,3],"approach":{"id":"anchor:watch-outpost:approach","coordinateSpace":"city-tile","point":[77,55],"actionKind":"EXAMINE"},"interior":null},{"id":"place:lantern-and-quill","legacyBuildingId":"books","lfRoleId":"LF-14","label":"Lantern & Quill","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"shopfront","footprint":[94,32,2,2],"approach":{"id":"anchor:lantern-and-quill:approach","coordinateSpace":"city-tile","point":[95,34],"actionKind":"EXAMINE"},"interior":null},{"id":"place:corner-bakery","legacyBuildingId":"bakery","lfRoleId":"LF-15","label":"Corner Bakery","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"bakery","footprint":[111,96,2,2],"approach":{"id":"anchor:corner-bakery:approach","coordinateSpace":"city-tile","point":[112,98],"actionKind":"EXAMINE"},"interior":null},{"id":"place:wayside-shrine","legacyBuildingId":"shrine","lfRoleId":"LF-16","label":"Wayside Shrine","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"shrine","footprint":[116,40,2,2],"approach":{"id":"anchor:wayside-shrine:approach","coordinateSpace":"city-tile","point":[117,42],"actionKind":"EXAMINE"},"interior":null},{"id":"place:crooked-alley-house","legacyBuildingId":"alley","lfRoleId":"LF-17","label":"Crooked Alley House","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"alley-house","footprint":[129,48,2,3],"approach":{"id":"anchor:crooked-alley-house:approach","coordinateSpace":"city-tile","point":[130,51],"actionKind":"EXAMINE"},"interior":null},{"id":"place:netmender-shack","legacyBuildingId":"net","lfRoleId":"LF-18","label":"Netmender’s Shack","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"dock-shack","footprint":[19,66,2,3],"approach":{"id":"anchor:netmender-shack:approach","coordinateSpace":"city-tile","point":[20,69],"actionKind":"EXAMINE"},"interior":null},{"id":"place:riverside-storehouse","legacyBuildingId":"store","lfRoleId":"LF-19","label":"Riverside Storehouse","labelProvenance":"CURRENT GAME LABEL; NOT A CANONICAL GEOGRAPHIC CLAIM","legacyBuildingType":"river-store","footprint":[33,71,2,3],"approach":{"id":"anchor:riverside-storehouse:approach","coordinateSpace":"city-tile","point":[34,74],"actionKind":"EXAMINE"},"interior":null}]};
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };
  const byPlace = new Map();
  const byBuilding = new Map();
  const byInterior = new Map();
  const byScene = new Map();
  const byApproach = new Map();
  const byDoor = new Map();
  const fail = message => { throw new Error('LAB01 place registry: ' + message); };
  const addUnique = (map, key, value, label) => {
    if (typeof key !== 'string' || !key || map.has(key)) fail('invalid or duplicate ' + label + ': ' + key);
    map.set(key, value);
  };
  for (const place of registry.places) {
    addUnique(byPlace, place.id, place, 'place ID');
    addUnique(byBuilding, place.legacyBuildingId, place, 'legacy building ID');
    addUnique(byApproach, place.approach.id, place, 'approach ID');
    if (place.interior) {
      addUnique(byInterior, place.interior.legacyRoomKey, place, 'interior key');
      addUnique(byScene, place.interior.sceneId, place, 'scene ID');
      addUnique(byDoor, place.interior.doorId, place, 'door ID');
    }
  }
  freeze(registry);
  const interiorPlaces = freeze(registry.places.filter(place => !!place.interior));
  const at = (map, key) => typeof key === 'string' ? map.get(key) || null : null;
  const eqPoint = (a, b) => Array.isArray(a) && a.length === b.length && a.every((v, i) => v === b[i]);
  function buildingIssues(place, building) {
    const errors = [];
    const prefix = place.legacyBuildingId + ': ';
    if (!building || typeof building !== 'object') return [prefix + 'building missing'];
    for (const [key, expected] of Object.entries({
      id: place.legacyBuildingId, name: place.label, t: place.legacyBuildingType,
      landmark: true, interior: !!place.interior,
      x: place.footprint[0], y: place.footprint[1], w: place.footprint[2], h: place.footprint[3]
    })) if (building[key] !== expected) errors.push(prefix + key + ' differs from source registry');
    if (!eqPoint(building.door, place.approach.point)) errors.push(prefix + 'exterior approach differs from source registry');
    return errors;
  }
  function validate(mapData = root.CW_CITY_DATA) {
    const errors = [];
    if (!mapData || typeof mapData !== 'object') {
      return freeze({ok: false, scope: registry.validationScope, errors: ['CW_CITY_DATA must load before cw-lab-places.js']});
    }
    if (mapData.version !== registry.source.mapVersion) errors.push('map version differs');
    if (mapData.W !== registry.source.dimensions[0] || mapData.H !== registry.source.dimensions[1]) errors.push('map dimensions differ');
    if (!eqPoint(mapData.spawn, registry.source.spawn)) errors.push('city spawn differs');
    if (!Array.isArray(mapData.buildings)) errors.push('buildings missing');
    else {
      if (mapData.buildings.length !== registry.source.buildingCount) errors.push('building count differs');
      const indexed = new Map();
      for (const building of mapData.buildings) {
        if (!building || typeof building.id !== 'string') { errors.push('building has no ID'); continue; }
        if (indexed.has(building.id)) errors.push('duplicate source building ID: ' + building.id);
        indexed.set(building.id, building);
      }
      const landmarks = mapData.buildings.filter(b => b && b.landmark);
      if (landmarks.length !== registry.places.length) errors.push('landmark count differs');
      for (const building of landmarks) if (!byBuilding.has(building.id)) errors.push('unregistered landmark: ' + building.id);
      for (const place of registry.places) errors.push(...buildingIssues(place, indexed.get(place.legacyBuildingId)));
    }
    return freeze({
      ok: errors.length === 0, scope: registry.validationScope, errors,
      places: registry.places.length, interiors: byInterior.size,
      mapVersion: mapData.version
    });
  }
  // This adapter describes a current data record or the engine's unchanged clone.
  // It rejects a same-ID record with changed geometry; it never edits that record.
  function bindingForBuildingRecord(building) {
    const place = building && at(byBuilding, building.id);
    return place && buildingIssues(place, building).length === 0 ? place : null;
  }
  const initialValidation = validate();
  if (!initialValidation.ok) fail(initialValidation.errors.join('; '));
  const api = freeze({
    version: registry.version,
    registry,
    initialValidation,
    listPlaces: () => registry.places,
    listInteriors: () => interiorPlaces,
    // Strict namespaces: "library" is a room key, "archives" a building ID.
    getPlace: placeId => at(byPlace, placeId),
    fromLegacyBuildingId: buildingId => at(byBuilding, buildingId),
    fromLegacyInteriorKey: roomKey => at(byInterior, roomKey),
    fromSceneId: sceneId => at(byScene, sceneId),
    fromApproachId: anchorId => at(byApproach, anchorId),
    fromDoorId: doorId => at(byDoor, doorId),
    approachForPlace: placeId => at(byPlace, placeId)?.approach || null,
    interiorForPlace: placeId => at(byPlace, placeId)?.interior || null,
    bindingForBuildingRecord,
    validate,
    report: () => freeze({
      version: registry.version,
      role: registry.role,
      currentValidation: validate(),
      sourceMapSHA256: registry.source.mapFileSHA256,
      sourceMapSHA256Meaning: 'Build-time provenance; runtime validation scope is separately declared.',
      modifiesMap: false, modifiesState: false, modifiesStorage: false,
      remapImplemented: false,
      note: 'Metadata bindings only. Existing engine callsites and all gameplay behavior remain in control.'
    })
  });
  if (own(root, 'CW_LAB_PLACES')) fail('CW_LAB_PLACES already registered');
  Object.defineProperty(root, 'CW_LAB_PLACES', {value: api, writable: false, configurable: false, enumerable: true});
  // Match the existing sequential asset loader's component-registration contract.
  (root.CW_R2_PARTS = root.CW_R2_PARTS || []).push('cw-lab-places.js');
})(typeof window !== 'undefined' ? window : globalThis);

