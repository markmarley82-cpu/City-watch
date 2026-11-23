/* Named conversation portraits. No image requests are made until mounted. */
const entries = Object.freeze({
  "colon": {
    "name": "Sergeant Fred Colon",
    "file": "assets/conversation-portraits-v1/colon-3ab1fd456804.webp"
  },
  "nobby": {
    "name": "Corporal Nobby Nobbs",
    "file": "assets/conversation-portraits-v1/nobby-8675dd958bf8.webp"
  },
  "carrot": {
    "name": "Captain Carrot",
    "file": "assets/conversation-portraits-v1/carrot-1bbda2769adc.webp"
  },
  "vimes": {
    "name": "Commander Sam Vimes",
    "file": "assets/conversation-portraits-v1/vimes-4cc6951ec00c.webp"
  },
  "mrs-palm": {
    "name": "Mrs Rosemary Palm",
    "file": "assets/conversation-portraits-v1/mrs-palm-bae30ee3462a.webp"
  },
  "dibbler": {
    "name": "C.M.O.T. Dibbler",
    "file": "assets/conversation-portraits-v1/dibbler-a30827375758.webp"
  }
});
const namedIDs = Object.freeze({colon:'colon', nobby:'nobby', carrot:'carrot', vimes:'vimes', palm:'mrs-palm', dibbler:'dibbler'});
const partnerKeys = Object.freeze({'mentor-colon':'colon','mentor-nobby':'nobby','mentor-carrot':'carrot'});

export function conversationPortrait(actor) {
  const id = Object.hasOwn(namedIDs, actor?.id) ? namedIDs[actor.id]
    : actor?.id === 'patrol-partner' && Object.hasOwn(partnerKeys, actor.key) ? partnerKeys[actor.key] : null;
  return id ? {...entries[id], id, url: new URL(entries[id].file, import.meta.url).href} : null;
}

export function mountConversationPortrait(container, actor, {document: doc = globalThis.document, fallback} = {}) {
  const entry = conversationPortrait(actor);
  if (!entry) return false;
  const image = doc.createElement('img');
  image.alt = 'Portrait of ' + (actor.name || entry.name);
  image.width = image.height = 256;
  image.decoding = 'async';
  image.dataset.portraitId = entry.id;
  image.onerror = () => {
    if (image.parentNode === container) {
      image.onerror = null;
      if (fallback) fallback(); else container.replaceChildren();
    }
  };
  image.src = entry.url;
  container.replaceChildren(image);
  return true;
}
