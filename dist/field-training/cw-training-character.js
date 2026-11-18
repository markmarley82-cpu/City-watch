/* Shared recruit appearance and accepted action outcomes. No campaign writes. */
(function (root) {
  'use strict';
  const base = new URL('../', root.location.href);
  const C = root.CWCharacters;
  let library = null, ready = false, error = null, recruit = C.defaultRecruit, name = '';
  const loading=new Map(),failures=new Map();let assignedKey=null;
  const identities = {partner: 'watch-recruit-female', patron: 'dockworker', lookout: 'cutpurse'};
  const opponentKeys=new Set(['cutpurse','dockworker','produce-vendor','dwarf','troll','scholar','p3_gnoll_01','zombie','vampire','werefolk']);
  const artKey=actor=>actor.id==='officer'?recruit:actor.mentorId?root.CWPatrolPartner.art(actor.mentorId):opponentKeys.has(actor.appearance)?actor.appearance:identities[actor.art];
  const readyPromise = (async () => {
    await root.CW_LAB.prepare();
    try {
      const save = JSON.parse(root.CW_LAB.storage.getItem(root.CW_LAB.keys.player) || 'null');
      const chosen = save?.flags?.recruitName;
      if (typeof chosen === 'string') name = chosen.trim().slice(0, 48);
    } catch { /* A missing/corrupt campaign save must not prevent practice. */ }
    recruit = C.selected();
    library = await C.createLibrary({baseURL: base});
    library.pin([recruit, ...Object.values(identities)]);
    await Promise.all([recruit, ...Object.values(identities)].map(key => key===recruit&&root.CWRacePlayer.current.supports(key)?root.CWRacePlayer.current.ensure(key):library.ensure(key)));
    const meta = root.CWRacePlayer.current.get(recruit)||library.get(recruit);
    await root.CWHeads.ensure(base);
    await library.ensureRecruitArt(recruit,{clothing:true,head:true},true);
    if(!root.CWRacePlayer.current.supports(recruit))await root.CWClothing.ensure(meta, root.CWClothing.selected(recruit), root.CWHeads.selected(recruit), base);
    ready = true;
    const scene = root.document.getElementById?.('scene');
    if (scene) {
      scene.dataset.recruit = recruit;
      scene.dataset.head = root.CWHeads.selected(recruit);
      scene.dataset.wardrobe = JSON.stringify(root.CWClothing.selected(recruit));
    }
    root.document.dispatchEvent(new Event('cw:training-character-ready'));
  })().catch(e => { error = String(e.message || e); });
  function nameState(state) {
    const officer = state.actors.find(a => a.id === 'officer');
    if (officer && name) officer.name = name;
    return state;
  }
  function height(actor) {
    const key = artKey(actor);
    const meta = root.CWDrawnCharacters?.current?.entries[key]||library?.get(key);
    return meta ? 108 * (meta.renderHeight||C.height(meta,key)) / 60 : 108;
  }
  function draw(ctx, actor, pose, x, y) {
    if(actor.hp<=0||actor.status==='incapacitated')pose={...pose,clip:'down',elapsed:1e6};else if(actor.status==='surrendered')pose={...pose,clip:'surrender',elapsed:1e6};else if(actor.guard&&pose.clip==='idle')pose={...pose,clip:'guard',elapsed:1e6};
    if (!ready) return true; // Reserve the actor slot until its selected appearance is ready.
    const key = artKey(actor);
    let meta=actor.id==='officer'&&root.CWRacePlayer.current.supports(key)?root.CWRacePlayer.current.get(key):actor.mentorId?root.CWDrawnCharacters.current.get(key):library.get(key);
    if(actor.appearance&&opponentKeys.has(actor.appearance)&&!meta){if(!loading.has(key)&&!failures.has(key)){const pending=library.ensure(key).then(()=>root.document.dispatchEvent(new Event('cw:training-character-ready'))).catch(e=>failures.set(key,String(e.message))).finally(()=>loading.delete(key));loading.set(key,pending);}return true;}
    if(actor.mentorId&&!meta){if(!loading.has(key)&&!failures.has(key)){const pending=root.CWDrawnCharacters.current.ensureAppearance(key,{}).then(()=>{assignedKey=key;root.document.dispatchEvent(new Event('cw:training-character-ready'));}).catch(e=>failures.set(key,String(e.message))).finally(()=>loading.delete(key));loading.set(key,pending);}return true;}
    if(!meta)return !!root.CWDrawnCharacters?.current?.entries?.[key];
    const rendered=C.draw(ctx, meta, {...pose, weapon:actor.weapon, actorId: 'battle:' + actor.id,
      clothing: actor.id === 'officer', head: actor.id === 'officer'}, x, y, height(actor));if(actor.id==='officer'&&rendered?.drawn){root.CWWeaponArt?.draw(ctx,meta,{...pose,loaded:actor.loaded,recruitArt:rendered.recruitArt},x,y,height(actor),actor.weaponProfile);}if(actor.id==='officer'){const scene=root.document.getElementById('scene');scene.dataset.officerDrawn=String(!!rendered?.drawn);scene.dataset.officerWardrobe=String(!!rendered?.drawnWardrobe);scene.dataset.officerArt=rendered?.recruitArt||'';scene.dataset.officerClip=rendered?.clip||pose.clip;}if(actor.mentorId){const scene=root.document.getElementById('scene');scene.dataset.partner=actor.mentorId;scene.dataset.partnerArt=key;scene.dataset.partnerDrawn=String(!!rendered?.drawn);scene.dataset.partnerClip=rendered?.clip||pose.clip;scene.dataset.partnerFrame=String(rendered?.index??'');scene.dataset.partnerEquipment=rendered?.equipment||'original';}return !!rendered || !!root.CWDrawnCharacters?.current?.entries?.[key]; // Respect drawn-first suppression while its image loads.
  }
  function outcomes(before, after, command, result) {
    if (!result?.ok) return;
    const A = root.CWActionFrames;
    const actor = before.actors.find(a => a.id === before.turn) || before.actors.find(a => a.id === before.activeId);
    // The engine's current actor is authoritative even when endTurn advances it.
    const current = root.BastionCombat.current(before) || actor;
    const specialist = current && command.type === 'skill' && root.BastionMentors?.skill(current);
    const cue = specialist ? specialist.cue : current && command.type === 'talk' && current.specialAction === 'piecemaker-warning' ? 'guard' :
      ({defend:'guard',strike:'attack',shove:'shove',restrain:'restrain',reload:'guard',stow:'guard'})[command.type];
    if (current && cue) A.play('battle:' + current.id, cue);
    for (const next of after.actors) {
      const old = before.actors.find(a => a.id === next.id);
      if (old && next.hp < old.hp) {
        A.play('battle:' + next.id, next.hp <= 0 ? 'down' : 'hit');
        if (command.type === 'endTurn') {
          const attacker = after.actors.find(a => a.id===after.lastOpponentAction?.actor) || after.actors.find(a => a.team === 'opposition' && a.status === 'active');
          if (attacker) A.play('battle:' + attacker.id, 'attack');
        }
      }
    }
  }
  root.CWTrainingCharacter = Object.freeze({draw, height, outcomes, nameState, ready: readyPromise,
    report: () => ({ready, error, recruit, name, clothing: ready ? root.CWClothing.selected(recruit) : null,
      head: ready ? root.CWHeads.selected(recruit) : null, partnerArt:assignedKey,partnerErrors:[...failures],campaignWrites: 0})});
})(window);
