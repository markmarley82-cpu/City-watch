/* Echo v1.1 excerpts; explicit playback, source credits and recoverable load errors. */
(() => {
 'use strict';
 const box=document.createElement('dialog');box.className='cw-music-panel';box.hidden=true;box.setAttribute('aria-labelledby','cw-music-title');
 box.innerHTML='<header><h2 id="cw-music-title">Music against the scene</h2><button type="button" aria-label="Close music audition">Close</button></header><p>Echo’s complete 16-track listening shelf · 30-second excerpts. Choose a track, then press Play.</p><label>Music sample<select aria-label="Music sample" disabled><option>Loading…</option></select></label><audio controls preload="none" aria-label="Music sample playback"></audio><div class="cw-review-actions"><button type="button" data-music-play disabled>Play sample</button><button type="button" data-music-stop disabled>Stop</button><button type="button" data-music-retry hidden>Retry loading</button></div><p class="cw-music-state" role="status">Silent until you press Play.</p><label>Audition volume<input class="cw-music-volume" aria-label="Audition volume" type="range" min="0" max="1" step="0.05" value="0.4"></label><p data-music-palette></p><details><summary>Credits and excerpt details</summary><p data-music-credit></p><p data-music-links hidden></p><p data-music-changes></p></details><p style="font-size:12px">Listen in context; this does not select permanent game music.</p>';
 document.body.appendChild(box);
 const controls=document.createElement('section');controls.className='cw-game-audio';controls.dataset.echoAtmosphere='v3';
 controls.innerHTML='<h3>Sound during your patrol</h3><button type="button" data-game-audio-master>Sound OFF</button><label><input type="checkbox" data-game-effects checked> Sound effects</label><label>Effects volume<input type="range" data-game-effects-volume min="0" max="1" step="0.05" value="0.65"></label><label><input type="checkbox" data-game-music checked> Background music</label><label>Music volume<input type="range" data-game-music-volume min="0" max="1" step="0.05" value="0.20"></label><div class="cw-review-actions"><button type="button" data-music-patrol disabled>Play selected music during patrol</button><button type="button" data-music-auto>Use scene music</button></div><p data-game-audio-state role="status">Sound is off.</p><p>Sound comes on with your first tap. If you turn it off, the game remembers.</p>';
 const ambienceControl=document.createElement('div');ambienceControl.innerHTML='<label><input type="checkbox" data-game-ambience checked> Atmosphere &amp; surroundings</label><label>Ambience volume<input type="range" data-game-ambience-volume min="0" max="1" step="0.05" value="0.25"></label><p>Nearby water, weather, city life and interiors with quiet gaps.</p>';controls.appendChild(ambienceControl);
 const shelf=document.createElement('details');shelf.className='cw-track-shelf';
 const summary=document.createElement('summary');summary.textContent='Music samples & credits';shelf.append(summary);
 while(box.children[1])shelf.append(box.children[1]);
 box.append(controls,shelf);
 shelf.querySelector(':scope > p').textContent='Choose a track, then press Play to hear a short sample.';
 shelf.append(box.querySelector('[data-music-patrol]'));
 shelf.addEventListener('toggle',()=>{if(shelf.open&&box.open)load();else audio.pause();});
 box.querySelector('#cw-music-title').textContent='Music & sound';
 box.querySelector('header button').setAttribute('aria-label','Close audio settings');
 const panelStyle=document.createElement('style');panelStyle.textContent='.cw-game-audio{border-top:1px solid #9b794a;margin-top:16px;padding-top:10px}.cw-game-audio label{display:block;margin:10px 0;min-height:44px}.cw-game-audio input[type=checkbox]{width:20px;height:20px;vertical-align:middle;margin-right:8px}.cw-game-audio input[type=range]{display:block;width:100%;min-height:44px}.cw-game-audio button{min-height:44px;max-width:100%;white-space:normal}.cw-game-audio h3{margin:8px 0}';document.head.append(panelStyle);
 const audio=box.querySelector('audio'),select=box.querySelector('select'),state=box.querySelector('.cw-music-state'),play=box.querySelector('[data-music-play]'),stop=box.querySelector('[data-music-stop]'),retry=box.querySelector('[data-music-retry]'),links=box.querySelector('[data-music-links]');
 let tracks=[],pending=null,previousFocus=null,previousBlocked=false,held=false;
 const api=()=>window.CWTeamAudio;
 function renderGameAudio(){const s=api()?.report();if(!s)return;controls.querySelector('[data-game-audio-master]').textContent='Sound '+(s.enabled?'ON':'OFF');controls.querySelector('[data-game-effects]').checked=s.effects;controls.querySelector('[data-game-music]').checked=s.music;controls.querySelector('[data-game-ambience]').checked=s.ambience;controls.querySelector('[data-game-ambience-volume]').value=s.ambienceVolume;controls.querySelector('[data-game-effects-volume]').value=s.effectsVolume;controls.querySelector('[data-game-music-volume]').value=s.musicVolume;controls.querySelector('[data-game-audio-state]').textContent=!s.enabled?'Sound is off.':(s.automaticMusic?'Scene music':'Selected music')+(s.music?' on':' off')+' · Effects '+(s.effects?'on':'off')+(s.musicPlayback==='blocked'?' · Press Sound ON again to retry playback.':s.musicPlayback==='failed'?' · This track could not load; choose another.':'');}
 controls.querySelector('[data-game-audio-master]').onclick=()=>{api()?.setEnabled(!api().report().enabled);renderGameAudio();};
 controls.querySelector('[data-game-effects]').onchange=e=>api()?.setEffects(e.target.checked);
 controls.querySelector('[data-game-ambience]').onchange=e=>api()?.setAmbience(e.target.checked);
 controls.querySelector('[data-game-ambience-volume]').oninput=e=>api()?.setVolume('ambience',e.target.value);
 controls.querySelector('[data-game-music]').onchange=e=>api()?.setMusic(e.target.checked);
 controls.querySelector('[data-game-effects-volume]').oninput=e=>api()?.setVolume('effects',e.target.value);
 controls.querySelector('[data-game-music-volume]').oninput=e=>api()?.setVolume('music',e.target.value);
 box.querySelector('[data-music-patrol]').onclick=()=>{const t=tracks.find(t=>t.id===select.value);if(!t||!api()?.selectMusic(t))return;api().setEnabled(true);close();};
 controls.querySelector('[data-music-auto]').onclick=()=>{api()?.useSceneMusic();api()?.setMusic(true);api()?.setEnabled(true);close();};
 window.addEventListener('cw:audio-state',renderGameAudio);
 audio.volume=.4;audio.dataset.playback='idle';
 const safeURL=value=>{try{return new URL(value).protocol==='https:';}catch{return false;}};
 function clearCredits(){links.replaceChildren();links.hidden=true;for(const q of ['[data-music-credit]','[data-music-palette]','[data-music-changes]'])box.querySelector(q).textContent='';}
 function choose(){
  audio.pause();const t=tracks.find(t=>t.id===select.value);if(!t)return;
  audio.src='assets/echo-all-v012/'+t.sample_file;audio.dataset.track=t.id;audio.dataset.playback='ready';
  state.textContent='Ready — press Play to listen.';play.disabled=false;stop.disabled=false;retry.hidden=true;box.querySelector('[data-music-patrol]').disabled=false;
  box.querySelector('[data-music-palette]').textContent=t.palette+' · '+t.use;box.querySelector('[data-music-credit]').textContent=t.credit;box.querySelector('[data-music-changes]').textContent=t.changes;
  links.replaceChildren();for(const [name,url,key] of [['Creator’s source',t.source,'musicSource'],['Licence',t.licence_url,'musicLicence']]){const a=document.createElement('a');a.textContent=name;a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.dataset[key]='';links.append(a);}links.hidden=false;
 }
 function load(){
  if(pending)return pending;if(tracks.length){choose();return Promise.resolve();}
  select.disabled=true;play.disabled=true;stop.disabled=true;box.querySelector('[data-music-patrol]').disabled=true;retry.hidden=true;clearCredits();state.textContent='Loading music samples and credits…';
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
  pending=fetch('assets/echo-all-v012/tracks.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Music shortlist could not load.');return r.json();}).then(v=>{
   if(!Array.isArray(v)||!v.length||v.some(t=>!t.id||!t.credit||!safeURL(t.source)||!safeURL(t.licence_url)||!/^[-\w]+\.mp3$/.test(t.sample_file)))throw Error('Music samples or credits are incomplete.');
   tracks=v;select.replaceChildren(...tracks.map(t=>{const o=document.createElement('option');o.value=t.id;o.textContent=t.id+' · '+t.title+' — '+t.author;return o;}));select.disabled=false;choose();
  }).catch(()=>{tracks=[];clearCredits();select.replaceChildren(new Option('Samples unavailable',''));state.textContent='Music samples or credits could not load. Retry loading, or close and continue your patrol.';retry.hidden=false;}).finally(()=>{clearTimeout(timeout);pending=null;});
  return pending;
 }
 function restore(){if(!held)return;held=false;window.CW_P20_INPUT_BLOCKED=previousBlocked;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}
 function close(){audio.pause();if(box.open)box.close();box.hidden=true;restore();api()?.suspendMusic(false);}
 box.querySelector('button').onclick=close;box.addEventListener('cancel',e=>{e.preventDefault();close();});box.addEventListener('close',()=>{audio.pause();box.hidden=true;restore();api()?.suspendMusic(false);});
 play.onclick=()=>audio.play().catch(()=>{audio.dataset.playback='blocked';state.textContent='Playback was blocked. Press Play in the audio controls to retry.';});stop.onclick=()=>{audio.pause();audio.currentTime=0;state.textContent='Stopped.';};retry.onclick=()=>{tracks=[];load();};select.onchange=choose;box.querySelector('.cw-music-volume').oninput=e=>audio.volume=Number(e.target.value);
 audio.addEventListener('playing',()=>{audio.dataset.playback='playing';state.textContent='Playing '+select.selectedOptions[0].textContent;});audio.addEventListener('pause',()=>{if(!audio.ended)audio.dataset.playback='paused';});audio.addEventListener('ended',()=>{audio.dataset.playback='ended';state.textContent='Excerpt complete. Compare another track or close the audition.';});audio.addEventListener('error',()=>{audio.dataset.playback='failed';state.textContent='This excerpt could not play. Retry loading, choose another track, or close.';retry.hidden=false;});audio.addEventListener('timeupdate',()=>{if(audio.currentTime>=3)window.dispatchEvent(new CustomEvent('cw:review-step',{detail:'music'}));});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.pause();});window.addEventListener('pagehide',()=>audio.pause());
 window.CWMusicAudition=Object.freeze({open(){if(box.open||document.querySelector('dialog[open]'))return;previousFocus=document.activeElement;previousBlocked=!!window.CW_P20_INPUT_BLOCKED;held=true;window.CW_P20_INPUT_BLOCKED=true;api()?.suspendMusic(true);box.hidden=false;box.showModal();box.querySelector('button').focus();renderGameAudio();if(shelf.open)load();},close});document.querySelectorAll('[data-music-open]').forEach(b=>b.onclick=()=>window.CWMusicAudition.open());
})();
