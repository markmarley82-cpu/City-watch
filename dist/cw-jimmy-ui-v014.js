/* JIMMY UI repair: decorate retained controls; never replace gameplay callbacks. */
(() => {
  'use strict';
  const app = document.getElementById('app');
  if (!app) return;
  // The map is an isolated paint layer. Its fixed sheet must be a sibling,
  // otherwise later controller masks can paint above that sheet/backdrop.
  const sheetOverlay = document.getElementById('overlay');
  const campaignDock = document.getElementById('cw-p20-dock');
  if (sheetOverlay && campaignDock) {
    app.append(sheetOverlay);
    const syncController = () => {
      const blocked = sheetOverlay.classList.contains('show');
      campaignDock.classList.toggle('cw-ui-sheet-blocked', blocked);
      campaignDock.inert = blocked;
    };
    new MutationObserver(syncController).observe(sheetOverlay, {
      attributes:true, attributeFilter:['class']
    });
    syncController();
  }
  const icons = {
    interact:'interact', map:'atlas', 'p13-menu-launch':'more',
    'cw-ux108b-notebook':'notebook', patrol:'patrol', combat:'attack',
    'city-use':'interact', 'city-save':'save', 'city-appearance':'appearance',
    'city-sound':'sound', 'bridge-route':'route', 'bridge-save':'save',
    'bridge-appearance':'appearance', 'bridge-sound':'sound',
    'cw-patrol-details-open':'details'
  };
  for (const [id, icon] of Object.entries(icons)) {
    const button = document.getElementById(id);
    if (button) {
      button.dataset.uiIcon = icon;
      button.style.setProperty('--cw-ui-icon', `url("assets/jimmy-ui-v014/icons/${icon}.svg")`);
    }
  }
  document.querySelectorAll('[data-music-open]').forEach(button => {
    button.dataset.uiIcon='music';
    button.style.setProperty('--cw-ui-icon','url("assets/jimmy-ui-v014/icons/music.svg")');
  });

  // Keep original nodes, listeners, directions and saves in both isolated scenes.
  const movement = document.querySelector('.city-movement,.bridge-movement');
  const tools = document.querySelector('.city-tools,.bridge-tools');
  if (movement && tools) {
    const dock = document.createElement('section');
    dock.className='cw-ui-scene-dock'; dock.setAttribute('aria-label','Movement and game actions');
    tools.before(dock); dock.append(movement,tools);
    const dpad=movement.querySelector('.city-dpad') || movement.firstElementChild;
    dpad?.classList.add('cw-ui-dpad');
    for(const button of [...movement.children].filter(e=>e.tagName==='BUTTON')) tools.append(button);
  }
  const directions = {'▲':'n','▼':'s','◀':'w','▶':'e','↗':'ne','↖':'nw','↙':'sw','↘':'se'};
  document.querySelectorAll('.dpad button,.cw-ui-dpad button').forEach(button => {
    button.dataset.uiDirection=directions[button.textContent.trim()] || 'n';
  });
})();

/* Utility pages share the retained Notebook shell. Move, never clone, controls:
   each original ID, listener, disabled state and gameplay callback stays intact. */
(() => {
  'use strict';
  const selector = 'html.cw-unified-service #sheet,#cw-room-actions,#cw-restart-dialog,#p13-menu-panel,#cw-patrol-details,#p21-duty-dialog,#atlas-dialog,#place-dialog,dialog.cw-music-panel,#cw-recruitment-gate,#cw-armoury';
  function frame(panel) {
    if (panel.id === 'sheet' && !document.documentElement.classList.contains('cw-unified-service')) return;
    if (panel.classList.contains('cw-notebook-menu') && panel.querySelector(':scope > header') && panel.querySelector(':scope > .cw-notebook-page')) return;
    let header = panel.querySelector(':scope > header');
    if (!header) {
      const title = panel.querySelector(':scope > h2');
      if (!title) return;
      header = document.createElement('header');
      title.before(header);
      header.append(title);
      const close = panel.querySelector(':scope > #p13-menu-close');
      if (close) header.append(close);
      if (panel.id === 'sheet') {
        title.id = 'cw-service-menu-title';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-labelledby', title.id);
        const dismiss = document.createElement('button');
        dismiss.type = 'button'; dismiss.textContent = 'Close';
        dismiss.onclick = () => window.CWP21Engine?.dismissMenu();
        header.append(dismiss);
      }
    }
    const children = [...panel.children].filter(node => node !== header);
    let page;
    if (children.length === 1) page = children[0];
    else {
      page = document.createElement('section');
      page.append(...children);
      panel.append(page);
    }
    page.classList.add('cw-notebook-page');
    panel.classList.add('cw-watch-menu', 'cw-notebook-menu');
  }
  window.CWWatchMenus = Object.freeze({frame});
  document.querySelectorAll(selector).forEach(frame);
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (node.nodeType !== 1) continue;
      if (node.matches(selector)) frame(node);
      node.querySelectorAll(selector).forEach(frame);
    }
  }).observe(document.body, {childList: true});
})();
