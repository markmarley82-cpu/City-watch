/* B03 team integration. Campaign state/geometry and save identities stay unchanged. */
(() => {
  'use strict';
  function createAudio() {
    const sources={
      'paper-open':'echo-effects-v2/book-open.mp3','paper-close':'echo-effects-v2/book-close.mp3',
      'page-turn':['echo-effects-v2/page-turn-1.mp3','echo-effects-v2/page-turn-2.mp3'],'bag-open':['echo-atmosphere-v3/cloth-1.mp3','echo-atmosphere-v3/cloth-2.mp3'],
      'door-open':'echo-all-v012/B03_door-02.mp3','door-close':'echo-all-v012/B03_door-01.mp3',
      'step-stone':['echo-effects-v2/step-stone-1.mp3','echo-effects-v2/step-stone-2.mp3','echo-effects-v2/step-stone-3.mp3','echo-effects-v2/step-stone-4.mp3'],
      'step-wood':['echo-effects-v2/step-wood-1.mp3','echo-effects-v2/step-wood-2.mp3','echo-effects-v2/step-wood-3.mp3','echo-effects-v2/step-wood-4.mp3'],
      'step-bridge':['echo-effects-v2/step-bridge-1.mp3','echo-effects-v2/step-bridge-2.mp3','echo-effects-v2/step-bridge-3.mp3','echo-effects-v2/step-bridge-4.mp3'],'hit':'echo-all-v012/F10-06.mp3',
      'reward':'echo-all-v012/F11-08.mp3','write':'echo-all-v012/F10-01.mp3','ui':'echo-all-v012/B03_paper-01.mp3',
      // Recordings already in the repo, now given game events.
      'case-closed':'echo-all-v012/F11-10.mp3','clue':'echo-all-v012/F10-01.mp3','whistle':'echo-all-v012/F11-20.mp3',
      'arrest':['echo-all-v012/F10-07.mp3','echo-all-v012/F10-08.mp3'],
      'step-gravel':['echo-steps-v1/step-gravel-1.mp3','echo-steps-v1/step-gravel-2.mp3','echo-steps-v1/step-gravel-3.mp3','echo-steps-v1/step-gravel-4.mp3'],
      'step-dirt':['echo-steps-v1/step-dirt-1.mp3','echo-steps-v1/step-dirt-2.mp3','echo-steps-v1/step-dirt-3.mp3','echo-steps-v1/step-dirt-4.mp3']
    };
    // Fight sounds (assets/fight-v1, see its CREDITS.txt): fists, truncheon, sword, crossbow, a troll's swing, a wizard's dazzle, grit, guard, shove, falls.
    for(const [kind,n] of Object.entries({punch:4,heavy:2,club:3,blade:2,swish:3,block:2,guard:1,shove:2,fall:2,crossbow:3,bolt:2,spell:1,grit:1,bandage:1}))
      sources['fight-'+kind]=Array.from({length:n},(_,i)=>'fight-v1/'+kind+'-'+(i+1)+'.mp3');
    // Voices (assets/voices-v1, CC0 recordings, see its CREDITS.txt): a suspect or an officer taking a blow, a troll, someone going down.
    for(const [kind,n] of Object.entries({suspect:8,officer:7,down:2,troll:3}))
      sources['voice-'+kind]=Array.from({length:n},(_,i)=>'voices-v1/'+kind+'-'+(i+1)+'.mp3');
    // Street life by district: occasional one-off sounds, at most one at a time (see sampleAmbience).
    const DISTRICT={
      docks:/wharfinger|treacle|dock|quay|warehouse|netmender|misbegot|bridge|cut\b|storehouse|riverside/i,
      market:/cheapside|market|cattle|trading|filigree|baker|butcher|isle of gods|broad way|plaza|small gods/i,
      workshop:/artificers|dimwell|workshop|cobbler|joinery|dye|smith|locksmith|ironmonger|polestaff/i,
      shades:/shades|don.t look back|body street|sheer|alley|tenement/i
    };
    const DETAILS={
      horse:{files:['echo-all-v012/REAL07_04.mp3','echo-all-v012/REAL07_09.mp3','echo-all-v012/REAL07_06.mp3','echo-all-v012/REAL07_05.mp3'],gap:[38000,70000],gain:.30,when:c=>!c.inside&&!c.night&&(c.district==='market'||c.district==='street')},
      dog:{files:['echo-all-v012/F10-02.mp3','echo-all-v012/F10-03.mp3','echo-all-v012/F10-04.mp3'],gap:[24000,52000],gain:.22,when:c=>!c.inside&&(c.district==='shades'||c.night&&c.district!=='docks')},
      crows:{files:['echo-all-v012/F10-05.mp3'],gap:[50000,90000],gain:.20,when:c=>!c.inside&&!c.night&&(c.district==='docks'||c.district==='shades'||/crypt|park|temple/i.test(c.location||''))},
      hammer:{files:['echo-all-v012/F10-09.mp3','echo-all-v012/F10-10.mp3','echo-all-v012/F10-11.mp3','echo-all-v012/F10-16.mp3'],gap:[5000,12000],gain:.18,when:c=>!c.inside&&!c.night&&c.district==='workshop'},
      splash:{files:['echo-all-v012/F10-17.mp3','echo-all-v012/F10-18.mp3','echo-all-v012/F10-19.mp3','echo-all-v012/F10-20.mp3'],gap:[14000,28000],gain:.22,when:c=>!c.inside&&c.district==='docks'},
      rigging:{files:['echo-all-v012/F10-12.mp3','echo-all-v012/F10-13.mp3','echo-all-v012/F11-19.mp3'],gap:[18000,34000],gain:.20,when:c=>!c.inside&&c.district==='docks'},
      tavern:{files:['echo-all-v012/F11-15.mp3','echo-all-v012/F11-11.mp3','echo-all-v012/F11-12.mp3','echo-all-v012/F11-13.mp3'],gap:[12000,26000],gain:.30,when:c=>c.inside&&/mended drum|tavern/i.test(c.location||'')}
    };
    const districtOf=location=>Object.keys(DISTRICT).find(k=>DISTRICT[k].test(location||''))||'street';
    // Full-length music (assets/music-full-v1, see its CREDITS.txt) and a playlist per scene; tracks follow one another.
    const FULL={N01:'N01-medieval-exploration.mp3',N02:'N02-medieval-harvest-season.mp3',N03:'N03-medieval-king-s-feast.mp3',N04:'N04-evening-fall-harp.mp3',
      N05:'N05-folk-round.mp3',N06:'N06-fairytale-waltz.mp3',P01:'P01-village-consort.mp3',P02:'P02-medieval-rejoicing.mp3',P03:'P03-celtic-impulse.mp3',
      P04:'P04-fantasy-lament-for-a-warrior-s-soul.mp3',U01:'U01-town-theme-rpg.mp3'};
    const TITLES={N01:'Medieval: Exploration',N02:'Medieval: Harvest Season',N03:'Medieval: King’s Feast',N04:'Evening Fall (Harp)',N05:'Folk Round',N06:'Fairytale Waltz',
      P01:'Village Consort',P02:'Medieval: Rejoicing',P03:'Celtic Impulse',P04:'Fantasy: Lament for a Warrior’s Soul',U01:'Town Theme RPG'};
    const PLAYLISTS={patrol:['N01','U01','P01','N05'],market:['N02','P02','N05','U01'],night:['N04','N06','P04'],interior:['N06','N04'],tavern:['N03','N05','P02'],pursuit:['P03']};
    const musicFile=t=>FULL[t.id]?'music-full-v1/'+FULL[t.id]:'echo-all-v012/'+t.sample_file;
    let recentTracks=[],fading=null,switching=false,pendingScene=null,pendingSince=0,pursuitCheckedAt=0,pursuitNow=false;
    const counts={played:0,blocked:0,failed:0},pool=new Map(),recent=new Map(),variants=new Map();
    let enabled=false,effects=true,musicWanted=true,effectsVolume=.65,musicVolume=.20,ambienceWanted=true,ambienceVolume=.25;
    // Sound comes on with the player's first tap (browsers allow no sound before one) unless they turned it off; the choice is remembered.
    const SOUND_PREF='city_watch_sound_v1';
    let autoOn=(()=>{try{return localStorage.getItem(SOUND_PREF)!=='off';}catch{return true;}})();
    const rememberSound=on=>{autoOn=on;try{localStorage.setItem(SOUND_PREF,on?'on':'off');}catch{}};
    let ambience=null,ambienceZone=null,ambientGeneration=0,atmosphereContext=null,atmosphereSceneKey=null;
    const beds=new Map(),details=new Map(),detailTimes=new Map();let detailSequence=0;
    const isAmbient=a=>a.dataset.cueId==='ambience';
    let music=null,track=null,manualTrack=false,suspended=false,generation=0,scene='patrol',lastPosition=null,lastCoordinates=null,lastRoom=null,lastSceneAt=0,lastInside=null;
    const finiteVolume=v=>Number.isFinite(Number(v))?Math.max(0,Math.min(1,Number(v))):0;
    function changed(){window.dispatchEvent(new CustomEvent('cw:audio-state'));}
    function makeAudio(src,id){
      const a=new Audio(src);a.preload='none';a.hidden=true;a.setAttribute('aria-hidden','true');a.dataset.cueId=id;a.dataset.playback='idle';
      a.addEventListener('playing',()=>{a.dataset.playback='playing';changed();});
      a.addEventListener('ended',()=>a.dataset.playback='ended');
      a.addEventListener('error',()=>{a.dataset.playback='failed';counts.failed++;changed();});
      document.body.appendChild(a);return a;
    }
    function play(a){
      const epoch=generation;
      const request={epoch,ambientToken:ambientGeneration};a._cwPlayRequest=request;a._cwWanted=true;
      try{Promise.resolve(a.play()).then(()=>{
        if(a._cwPlayRequest!==request)return;
        if(!a._cwWanted||!enabled||document.hidden||suspended||epoch!==generation||(isAmbient(a)&&request.ambientToken!==ambientGeneration)||(a===music?!musicWanted:isAmbient(a)?!ambienceWanted:!effects)){a.pause();return;}
        counts.played++;changed();
      }).catch(error=>{
        if(a._cwPlayRequest!==request)return;
        if(error?.name==='AbortError'&&!a._cwWanted){a.dataset.playback='stopped';return;}
        const failed=error?.name==='NotSupportedError';if(failed)counts.failed++;else counts.blocked++;
        a.dataset.playback=failed?'failed':'blocked';a.dataset.playbackError=String(error?.name||'Error')+': '+String(error?.message||error);changed();});}
      catch{counts.failed++;a.dataset.playback='failed';changed();}
    }
    function stopEffects(){for(const a of pool.values()){a._cwWanted=false;a.pause();try{a.currentTime=0;}catch{}}}
    function stopAmbientSource(a){a._cwWanted=false;a.pause();try{a.currentTime=0;}catch{}}
    function stopAmbience(){ambientGeneration++;for(const b of beds.values())if(b.audio)stopAmbientSource(b.audio);for(const a of details.values())stopAmbientSource(a);}
    function atmosphereDetail(id,gain){
      if(!enabled||!ambienceWanted||document.hidden||suspended||gain<=0)return;
      const extra=DETAILS[id],files=extra?extra.files:id==='fountain'?['fountain-1.mp3','fountain-2.mp3','fountain-3.mp3']:['timber-1.mp3','timber-2.mp3'];
      let a=details.get(id);if(!a){a=makeAudio('', 'ambience');a.dataset.layer=id;details.set(id,a);}
      for(const other of details.values())if(other!==a)stopAmbientSource(other);
      a._cwAmbientGain=gain;a.src=extra?'assets/'+files[Math.floor(Math.random()*files.length)]:'assets/echo-atmosphere-v3/'+files[(detailSequence++)%files.length];detailSequence+=extra?1:0;a.volume=finiteVolume(ambienceVolume*gain);a.loop=false;play(a);
    }
    function sampleAmbience(zone,context={},duck=1){
      const now=Date.now(),sceneKey=context.sceneKey||zone;
      ambienceZone=zone;
      if(sceneKey!==atmosphereSceneKey){stopAmbience();atmosphereSceneKey=sceneKey;for(const b of beds.values())b.due=now+1500;detailTimes.clear();}
      atmosphereContext={...context,duck};
      for(const a of details.values())a.volume=finiteVolume(ambienceVolume*(a._cwAmbientGain||0)*duck);
      if(!enabled||!ambienceWanted||document.hidden||suspended||context.paused){stopAmbience();return;}
      const weights={city:zone==='city'?(scene==='night'?.32:.75):0,water:zone==='water'?.65:Number(context.waterGain)||0,
        rain:context.weather==='rain'&&!context.inside?.48:0,hearth:Number(context.hearthGain)||0};
      const wanted=Object.entries(weights).filter(([,v])=>v>.025).sort((a,b)=>b[1]-a[1]).slice(0,2);
      const active=new Set(wanted.map(([id])=>id));
      for(const [id,b] of beds)if(!active.has(id)){if(b.audio)stopAmbientSource(b.audio);b.due=now+1500;}
      for(const [id,weight] of wanted){
        let b=beds.get(id);if(!b){b={audio:null,due:now+1500,sequence:0};beds.set(id,b);}
        const target=finiteVolume(ambienceVolume*weight*duck);
        if(b.audio)b.audio.volume=finiteVolume(b.audio.volume+(target-b.audio.volume)*.25);
        if(now<b.due)continue;
        if(!b.audio){b.audio=makeAudio('', 'ambience');b.audio.dataset.layer=id;}
        const variant=(b.sequence++%2)?'b':'a';b.audio.src='assets/echo-atmosphere-v3/'+id+'-'+variant+'.mp3';
        b.audio.dataset.zone=id;b.audio.volume=target;b.audio.loop=false;ambience=b.audio;
        b.due=now+(id==='rain'?24000:id==='hearth'?26000:40000);play(b.audio);
      }
      const nearFountain=(Number(context.fountainGain)||0)>.05;
      for(const [id,available,gap,gain] of [['fountain',nearFountain,7000,(Number(context.fountainGain)||0)*.70],['timber',!!context.woodenInterior,32000,.32]]){
        if(!available){detailTimes.delete(id);const a=details.get(id);if(a)stopAmbientSource(a);continue;}
        if(!detailTimes.has(id))detailTimes.set(id,now+(id==='fountain'?2500:12000));
        if(now>=detailTimes.get(id)&&duck>=1){atmosphereDetail(id,gain);detailTimes.set(id,now+gap+(detailSequence%3)*1100);}
      }
      const life={...context,district:districtOf(context.location),night:scene==='night'};
      for(const [id,d] of Object.entries(DETAILS)){
        if(!d.when(life)){detailTimes.delete(id);continue;}
        const between=()=>d.gap[0]+Math.random()*(d.gap[1]-d.gap[0]);
        if(!detailTimes.has(id))detailTimes.set(id,now+between()*0.4);
        const busy=[...details.values()].some(a=>!a.paused&&!a.ended);
        if(now>=detailTimes.get(id)&&duck>=1&&!busy){atmosphereDetail(id,d.gain);detailTimes.set(id,now+between());}
      }
    }
    function cue(id){
      if(!enabled||!effects||document.hidden||suspended||!sources[id])return false;
      const now=Date.now(),limit=id.startsWith('step-')?120:id==='reward'||id==='case-closed'||id==='whistle'||id.startsWith('door-')?650:90;
      if(now-(recent.get(id)??-Infinity)<limit)return true;
      recent.set(id,now);
      try{
        const options=Array.isArray(sources[id])?sources[id]:[sources[id]],cursor=variants.get(id)||0;
        const file=options[cursor%options.length];variants.set(id,cursor+1);
        let a=pool.get(file);if(!a){a=makeAudio('assets/'+file,id);pool.set(file,a);}
        if(id.startsWith('step-'))for(const other of pool.values())if(other!==a&&other.dataset.cueId?.startsWith('step-')){other._cwWanted=false;other.pause();}
        a.volume=effectsVolume*(id.startsWith('step-')?.65:id==='reward'?.55:id==='case-closed'?.6:id==='whistle'?.45:id.startsWith('fight-')?.9:id.startsWith('voice-')?.75:.80);
        if(crowdWanted&&(id==='fight-fall'||id==='arrest'||id==='voice-down'))swellCrowd();
        a.currentTime=0;play(a);return true;
      }catch{counts.failed++;changed();return false;}
    }
    // Plays sounds one after another: each item is an id, or [id, milliseconds after the previous one] (default 220).
    function sequence(list){
      let at=0;const epoch=generation;
      (list||[]).forEach((item,i)=>{const [id,gap]=Array.isArray(item)?item:[item,i?220:0];at+=gap;if(!at)cue(id);else setTimeout(()=>{if(epoch===generation)cue(id);},at);});
    }
    // Onlookers during a fight (assets/voices-v1/crowd-loop.mp3): the crowd fades in with the fight, swells at a fall or an arrest,
    // and fades out when the fight ends or its window closes (checked in sampleScene).
    let crowdAudio=null,crowdWanted=false,crowdFade=null,crowdSwellUntil=0;
    const crowdLevel=()=>effectsVolume*.35*(scene==='night'?.5:1)*(Date.now()<crowdSwellUntil?1.8:1);
    function crowdTo(target,ms,done){
      if(!crowdAudio)return;clearInterval(crowdFade);const from=crowdAudio.volume,start=Date.now();
      crowdFade=setInterval(()=>{const k=Math.min(1,(Date.now()-start)/ms),to=typeof target==='function'?target():target;crowdAudio.volume=finiteVolume(from+(to-from)*k);if(k>=1){clearInterval(crowdFade);crowdFade=null;done?.();}},60);
    }
    function stopCrowd(){if(!crowdAudio)return;clearInterval(crowdFade);crowdFade=null;crowdAudio._cwWanted=false;crowdAudio.pause();}
    function crowd(on){
      crowdWanted=!!on;
      if(crowdWanted&&enabled&&effects&&!document.hidden&&!suspended){
        if(!crowdAudio){crowdAudio=makeAudio('assets/voices-v1/crowd-loop.mp3','crowd');crowdAudio.loop=true;crowdAudio.volume=0;}
        if(crowdAudio.paused){crowdAudio.volume=0;play(crowdAudio);}crowdTo(crowdLevel,1500);
      }else if(crowdAudio&&!crowdAudio.paused){if(crowdWanted)stopCrowd();else crowdTo(0,1800,stopCrowd);}
    }
    function swellCrowd(){
      if(!crowdAudio||crowdAudio.paused)return;crowdSwellUntil=Date.now()+1800;crowdTo(crowdLevel,300);
      setTimeout(()=>{if(crowdWanted&&crowdAudio&&!crowdAudio.paused)crowdTo(crowdLevel,1200);},1850);
    }
    function fadeMusic(target,ms,done){
      clearInterval(fading);const from=music.volume,start=Date.now();
      fading=setInterval(()=>{const k=Math.min(1,(Date.now()-start)/ms),to=typeof target==='function'?target():target;music.volume=finiteVolume(from+(to-from)*k);if(k>=1){clearInterval(fading);fading=null;done?.();}},50);
    }
    function nextTrack(name){
      const list=PLAYLISTS[name]||PLAYLISTS.patrol,fresh=list.filter(id=>!recentTracks.includes(id)),from=fresh.length?fresh:list;
      const id=from[Math.floor(Math.random()*from.length)];return {id,title:TITLES[id]};
    }
    // Scene music: a track plays to its end and the scene's playlist picks the next; a change of scene fades out and the new scene's music fades in.
    function startMusic(){
      if(!enabled||!musicWanted||document.hidden||suspended)return;
      if(!music){music=makeAudio('', 'background-music');music.addEventListener('ended',()=>{if(!manualTrack){music.dataset.track='';startMusic();}});}
      if(switching)return;
      const current=music.dataset.track,list=PLAYLISTS[scene]||PLAYLISTS.patrol;
      const keep=manualTrack?current===track?.id:!!current&&list.includes(current)&&!music.ended;
      if(!keep){
        const go=()=>{switching=false;if(!enabled||!musicWanted||document.hidden||suspended)return;
          const next=manualTrack?track:nextTrack(scene);if(!next)return;
          music.pause();music.src='assets/'+musicFile(next);music.dataset.track=next.id;music.dataset.title=next.title||next.id;music.dataset.playback='ready';
          recentTracks=[next.id,...recentTracks.filter(x=>x!==next.id)].slice(0,2);music.loop=!!manualTrack;music.volume=0;play(music);fadeMusic(()=>musicVolume,1800);};
        if(!music.paused&&music.volume>.01){switching=true;fadeMusic(0,1000,go);}else go();
        return;
      }
      music.loop=!!manualTrack;if(!fading)music.volume=musicVolume;
      if(music.paused!==false)play(music);
    }
    function sync(){
      for(const id of ['sound','city-sound','bridge-sound']){
        const b=document.getElementById(id);if(!b)continue;
        b.textContent=(id==='sound'?'♫ SOUND ':'Sound ')+(enabled?'ON':'OFF');b.classList.toggle('active',enabled);b.setAttribute('aria-pressed',String(enabled));
      }
      changed();
    }
    function setEnabled(value){
      enabled=!!value;generation++;lastPosition=null;lastCoordinates=null;lastInside=null;recent.clear();ambienceZone=null;atmosphereSceneKey=null;stopAmbience();
      if(!enabled){stopAmbience();stopEffects();stopCrowd();music?.pause();}else{startMusic();sampleScene();crowd(crowdWanted);}rememberSound(enabled);sync();
    }
    function sampleScene(){
      if(crowdWanted&&!document.getElementById('p21-combat-dialog')?.open)crowd(false);
      if(!enabled||document.hidden||suspended)return;
      let owner=window,doc=document;
      try{const frame=document.getElementById('p21-engine-dialog')?.open?document.getElementById('p21-engine-frame'):document.getElementById('room-frame');if(frame&&frame.getAttribute('src')!=='about:blank'&&(document.getElementById('room-dialog')?.open||document.getElementById('p21-engine-dialog')?.open)&&frame.contentWindow?.CW_PATROL_DESCRIPTION){owner=frame.contentWindow;doc=frame.contentDocument;}}catch{}
      const state=owner.CW_PATROL_DESCRIPTION?.();if(!state){sampleAmbience(null);return;}
      // The text view exposes the real recruit coordinates without running the
      // expensive interior path/reachability diagnostic on every audio tick.
      const inside=/room coordinates/.test(state.position||'');
      const room={room:/crypt/i.test(state.location||'')?'crypt':state.location};
      if(Date.now()-pursuitCheckedAt>1000){pursuitCheckedAt=Date.now();try{pursuitNow=!!window.CWP21State?.create(localStorage).read().pending?.chase;}catch{pursuitNow=false;}}
      const dark=/NIGHT|EVENING/i.test(doc.getElementById('time')?.textContent||'')||(Number(window.CWP21City?.clock?.()?.darkness)||0)>.5;
      const next=inside?(/mended drum|tavern/i.test(state.location||'')?'tavern':'interior'):pursuitNow?'pursuit':dark?'night':districtOf(state.location)==='market'?'market':'patrol';
      if(next!==pendingScene){pendingScene=next;pendingSince=Date.now();}
      // Going indoors, outdoors or into a chase changes the music at once; street-to-street changes wait 8 seconds so passing corners do not flip it.
      const settled=[next,scene].some(x=>x==='pursuit'||x==='tavern'||x==='interior')||Date.now()-pendingSince>8000;
      if(next!==scene&&settled){scene=next;if(!manualTrack)startMusic();}
      const bridge=doc.getElementById('bridge-scene'),city=doc.getElementById('city-scene');
      const current=String(bridge?.dataset.position||city?.dataset.position||state.position||'');
      const coordinates=(current.match(/-?\d+(?:\.\d+)?/g)||[]).slice(0,2).map(Number);
      const place=inside?'room:'+state.location:bridge?'bridge':city?'rebuilt-city':'campaign-city';
      const modal=!!doc.querySelector('dialog[open],#watch-notebook.open,#p13-menu.open,.overlay.show')||!!owner.CW_P20_INPUT_BLOCKED;
      const delta=coordinates.length===2&&lastCoordinates?.length===2?Math.abs(coordinates[0]-lastCoordinates[0])+Math.abs(coordinates[1]-lastCoordinates[1]):Infinity;
      const now=Date.now(),moved=lastPosition!==null&&current!==lastPosition&&place===lastRoom&&now-lastSceneAt<1200&&delta>0&&delta<=(inside?120:3);
      if(lastInside!==null&&inside!==lastInside&&!document.getElementById('room-frame'))cue(inside?'door-open':'door-close');
      lastInside=inside;
      const talking=!!doc.getElementById('cw-npc-dialogue')?.open;
      if(music&&!fading)music.volume=musicVolume*(talking?.45:1);
      const provided=owner.CW_AUDIO_CONTEXT?.()||{};
      sampleAmbience(inside?null:bridge||/bridge|crossing/i.test(state.location||'')?'water':'city',{...provided,inside,location:state.location,sceneKey:provided.sceneKey||place,paused:modal&&!talking},talking?.28:1);
      if(!modal&&moved)cue(inside&&room?.room!=='crypt'?'step-wood':doc.getElementById('bridge-scene')||/bridge|crossing/i.test(state.location||'')?'step-bridge':/shades|dimwell|don.t look back|body street|cattle|treacle|park lane|hide park/i.test(state.location||'')?'step-dirt':/forecourt|plaza|park|garden/i.test(state.location||'')?'step-gravel':'step-stone');
      lastPosition=current;lastCoordinates=coordinates;lastRoom=place;lastSceneAt=now;
    }
    const api=Object.freeze({
      cue,sequence,crowd,setEnabled,
      setAmbience(value){ambienceWanted=!!value;if(!ambienceWanted)stopAmbience();else{ambienceZone=null;atmosphereSceneKey=null;sampleScene();}changed();},
      setEffects(value){effects=!!value;if(!effects){stopEffects();stopCrowd();}else crowd(crowdWanted);changed();},
      setMusic(value){musicWanted=!!value;if(musicWanted)startMusic();else music?.pause();changed();},
      setVolume(kind,value){if(kind==='ambience'){const previous=ambienceVolume;ambienceVolume=finiteVolume(value);for(const b of beds.values())if(b.audio){b.audio.volume=previous?b.audio.volume*ambienceVolume/previous:0;if(!previous)b.due=Date.now();}for(const a of details.values())a.volume=finiteVolume(ambienceVolume*(a._cwAmbientGain||0));if(!ambienceVolume)stopAmbience();else sampleScene();}else if(kind==='music'){musicVolume=finiteVolume(value);if(music&&!fading)music.volume=musicVolume;}else{effectsVolume=finiteVolume(value);for(const a of pool.values())a.volume=effectsVolume*(a.dataset.cueId.startsWith('step-')?.65:a.dataset.cueId==='reward'?.55:.80);}changed();},
      selectMusic(value){if(!value||!/^[-\w]+\.mp3$/.test(value.sample_file)||!value.id)return false;track={id:value.id,title:String(value.title||value.id),sample_file:value.sample_file};manualTrack=true;musicWanted=true;if(enabled)startMusic();changed();return true;},
      useSceneMusic(){manualTrack=false;startMusic();changed();},
      suspendMusic(value){const next=!!value;if(next===suspended){if(!next)startMusic();return;}suspended=next;generation++;if(suspended){stopAmbience();stopEffects();stopCrowd();music?.pause();}else{startMusic();crowd(crowdWanted);}changed();},
      sampleScene,
      report:()=>({enabled,effects,music:musicWanted,ambience:ambienceWanted,ambienceVolume,ambienceZone,atmosphereContext,ambientLayers:[...beds].map(([id,b])=>({id,playing:!!b.audio&&!b.audio.paused,volume:b.audio?.volume||0,file:b.audio?.src||null})),ambientDetails:[...details].map(([id,a])=>({id,playing:!a.paused,volume:a.volume})),ambiencePlayback:ambience?.dataset.playback||'idle',ambiencePaused:ambience?.paused??true,musicVolume,effectsVolume,scene,automaticMusic:!manualTrack,track:music?.dataset.track||null,trackTitle:music?.dataset.title||null,musicPlayback:music?.dataset.playback||'idle',musicPaused:music?.paused??true,poolSize:pool.size,...counts,source:'Echo atmosphere v3; retained recordings, scene-driven candidate layers'})
    });
    let timer=null;
    const startSampling=()=>{if(timer===null)timer=setInterval(sampleScene,80);};
    const stopSampling=()=>{if(timer!==null){clearInterval(timer);timer=null;}};
    const quiesce=()=>{generation++;lastPosition=null;lastCoordinates=null;ambienceZone=null;atmosphereSceneKey=null;stopAmbience();stopEffects();stopCrowd();music?.pause();};
    const resume=()=>{if(enabled&&!document.hidden&&!suspended){startMusic();sampleScene();crowd(crowdWanted);}};
    startSampling();
    document.addEventListener('visibilitychange',()=>{quiesce();if(!document.hidden)resume();});
    window.addEventListener('pagehide',(event={})=>{quiesce();if(!event.persisted)enabled=false;stopSampling();});
    window.addEventListener('pageshow',event=>{if(!event.persisted)return;startSampling();resume();});
    document.addEventListener('pointerdown',resume,{passive:true});document.addEventListener('keydown',resume);
    // First tap or key: switch sound on if wanted. A tap on a sound switch is left to that switch.
    const firstGesture=e=>{if(enabled||!autoOn||document.hidden)return;if(e.target?.closest?.('#sound,#city-sound,#bridge-sound,[data-game-audio-master]'))return;setEnabled(true);};
    for(const type of ['pointerup','touchend','click','keydown'])document.addEventListener(type,firstGesture,{capture:true,passive:true});
    return api;
  }
  let shared;
  try{if(['room-frame','p21-engine-frame'].includes(window.frameElement?.id))shared=window.parent.CWTeamAudio;}catch{}
  const audio=shared||createAudio();window.CWTeamAudio=audio;
  const cue=id=>audio.cue(id);
  // Own only the Sound control; all movement/action callbacks are retained.
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#sound,#city-sound,#bridge-sound');if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();audio.setEnabled(!audio.report().enabled);
    b.textContent=(b.id==='sound'?'♫ SOUND ':'Sound ')+(audio.report().enabled?'ON':'OFF');b.setAttribute('aria-pressed',String(audio.report().enabled));b.classList.toggle('active',audio.report().enabled);
  },true);
  document.addEventListener('click',e=>{if(e.target.closest?.('#nb-save,#lab-notes-save,[data-notes-save],#city-save,#bridge-save,#save'))cue('write');});
  const book=document.getElementById('watch-notebook');
  if(book) {
    let wasOpen=book.classList.contains('open');
    new MutationObserver(()=>{const open=book.classList.contains('open');if(open!==wasOpen){cue(open?'paper-open':'paper-close');wasOpen=open;}}).observe(book,{attributes:true,attributeFilter:['class']});
    // Capture runs before P12 draw()/detail callbacks detach the activated node.
    book.addEventListener('click',e=>{const b=e.target.closest?.('#nb-tabs button,.lab-nb-entry,#lab-nb-back');if(b&&(!b.matches?.('#nb-tabs button')||!b.classList.contains('selected')))cue('page-turn');},true);
  }
  const newspaperReaders=new WeakSet();
  function bindNewspaperAudio(){
    const reader=document.getElementById('cw-newspaper-reader');
    if(!reader||newspaperReaders.has(reader))return;
    newspaperReaders.add(reader);
    let wasOpen=reader.open;
    new MutationObserver(()=>{
      const open=reader.open;
      if(open!==wasOpen){cue(open?'paper-open':'paper-close');wasOpen=open;}
    }).observe(reader,{attributes:true,attributeFilter:['open']});
    reader.addEventListener('click',e=>{
      const b=e.target.closest?.('.cw-news-toolbar button,.cw-news-paging button');
      if(!b||b.disabled||b.matches?.('.cw-news-close,[aria-pressed="true"]'))return;
      const changesPaper=!!b.closest?.('.cw-news-toolbar');
      const turnsPage=!!b.closest?.('.cw-news-paging')&&/Previous|Next/.test(b.textContent||'');
      if(changesPaper||turnsPage)cue('page-turn');
    },true);
  }
  bindNewspaperAudio();
  document.addEventListener('cw:newspapers-ready',bindNewspaperAudio);
  document.addEventListener('click',e=>{if(e.target.closest?.('#inventory,[data-bag-open]'))cue('bag-open');if(e.target.closest?.('#casebook,#map,#chronicle'))cue('paper-open');},true);
  const styles=document.createElement('link');styles.rel='stylesheet';styles.href='cw-team-notebook.css?v=p21-b407-s039-reuse'+encodeURIComponent(window.CW_LAB_RELEASE?.version||'0.6');document.head.appendChild(styles);
  const finalStyles=document.createElement('link');finalStyles.rel='stylesheet';finalStyles.href='cw-jimmy-b03-v13.css?v=p21-b407-s039-reuse'+encodeURIComponent(window.CW_LAB_RELEASE?.version||'0.6');document.head.appendChild(finalStyles);
  const notesFix=document.createElement('link');notesFix.rel='stylesheet';notesFix.href='cw-jimmy-b03-v131.css?v=p21-b407-s039-reuse'+encodeURIComponent(window.CW_LAB_RELEASE?.version||'0.6');document.head.appendChild(notesFix);
  const grid=document.getElementById('p13-menu-grid');
  if(grid){const b=document.createElement('button');b.textContent='◈ Rebuilt city · Watch Square';b.onclick=()=>location.assign('city.html');grid.prepend(b);}
})();
