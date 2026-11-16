/* Buddy LAB01. Presentation + read-only detail adapter over the real P12 Notebook.
 * Never calls game conversations, collecting, item use, quests or player save.
 * Notes keep P12's explicit Save handler and the lab-isolated notes store.
 */
(function () {
  'use strict';
  const overlay = document.getElementById('watch-notebook');
  const api = window.CW_NOTEBOOK;
  if (!overlay || !api) return;
  const book = overlay.querySelector('.book');
  const content = document.getElementById('nb-content');
  const tabs = document.getElementById('nb-tabs');
  const closeButton = document.getElementById('nb-close');
  const title = book.querySelector('h2');
  const app = document.getElementById('app');
  const sections = ['Cases', 'Evidence', 'Suspects', 'Witnesses', 'Timeline', 'My Notes'];
  const style = document.createElement('link');
  style.rel = 'stylesheet'; style.href = 'cw-lab-notebook.css?v=p21-b407-s039-reuse&build=' + encodeURIComponent(window.CW_LAB_RELEASE.version);
  document.head.appendChild(style);
  overlay.classList.add('cw-lab-notebook');
  book.classList.add('lab-nb-responsive');
  title.textContent = 'Watch Notebook'; title.id = 'lab-nb-title';
  closeButton.textContent = 'Close'; closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close Watch Notebook');
  book.setAttribute('aria-labelledby', title.id);
  const header = document.createElement('header');
  header.className = 'lab-nb-header'; header.append(title, closeButton);
  const sectionArea = document.createElement('div');
  sectionArea.className = 'lab-nb-sections'; sectionArea.appendChild(tabs);
  const paper = document.createElement('div'); paper.className = 'lab-nb-paper'; paper.appendChild(content);
  book.replaceChildren(header, sectionArea, paper);
  tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Notebook sections');
  tabs.setAttribute('aria-orientation', 'horizontal');
  content.setAttribute('role', 'tabpanel'); content.tabIndex = 0;
  let detail = null, held = false, previousFocus = null, previousInert = false, detailVisits = 0;
  const isOpen = () => overlay.classList.contains('open');
  const activeSection = () => tabs.querySelector('button.selected')?.dataset.tab || 'Cases';
  function updateTabScrollHints() {
    sectionArea.classList.toggle('can-scroll-left', tabs.scrollLeft > 1);
    sectionArea.classList.toggle('can-scroll-right', tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 1);
  }
  function revealActiveTab() {
    const selected = tabs.querySelector('button.selected');
    if (!selected || !isOpen()) return;
    const viewport = tabs.getBoundingClientRect(), tab = selected.getBoundingClientRect();
    // Native clicks can honour scroll-padding; keyboard tab selection uses this
    // manual reveal, so keep it inside the same reserved scroll-cue gutters.
    const style = window.getComputedStyle?.(tabs);
    const left = Math.max(2, Number.parseFloat(style?.paddingLeft) || 0, Number.parseFloat(style?.scrollPaddingLeft) || 0);
    const right = Math.max(2, Number.parseFloat(style?.paddingRight) || 0, Number.parseFloat(style?.scrollPaddingRight) || 0);
    if (tab.left < viewport.left + left) tabs.scrollLeft -= viewport.left + left - tab.left;
    else if (tab.right > viewport.right - right) tabs.scrollLeft += tab.right - viewport.right + right;
    updateTabScrollHints();
  }
  function returnToList() {
    if (!detail) return;
    const saved = detail; detail = null;
    content.replaceChildren(...saved.nodes);
    content.scrollTop = saved.scroll;
    saved.focus?.focus({preventScroll: true});
  }
  function readEntry(button, record) {
    if (detail) return;
    detailVisits++;
    detail = { nodes: [...content.childNodes], scroll: content.scrollTop, focus: button };
    const article = document.createElement('article'); article.className = 'lab-nb-detail';
    const back = document.createElement('button'); back.type = 'button'; back.id = 'lab-nb-back'; back.textContent = '← Back to ' + activeSection(); back.onclick = returnToList;
    const heading = document.createElement('h3'); heading.textContent = record.title;
    const description = document.createElement('p'); description.textContent = record.description;
    article.append(back, heading, description);
    if (record.extra) { const extra = document.createElement('small'); extra.textContent = record.extra; article.appendChild(extra); }
    content.replaceChildren(article); content.scrollTop = 0; back.focus({preventScroll: true});
  }
  function enhance() {
    tabs.querySelectorAll('button[data-tab]').forEach((button, i) => {
      button.type = 'button'; button.id = 'lab-nb-tab-' + i;
      button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', content.id);
      button.setAttribute('aria-selected', String(button.classList.contains('selected')));
      button.tabIndex = button.classList.contains('selected') ? 0 : -1;
      if (button.classList.contains('selected')) content.setAttribute('aria-labelledby', button.id);
    });
    if (!detail) content.querySelectorAll('.entry:not([data-nb-empty]):not([data-lab-ready])').forEach(row => {
      const record = { title: row.querySelector('b')?.textContent || 'Entry', description: row.querySelector('div')?.textContent || '', extra: row.querySelector('small')?.textContent || '' };
      row.dataset.labReady = 'true';
      const button = document.createElement('button'); button.type = 'button'; button.className = 'lab-nb-entry';
      button.setAttribute('aria-label', 'Read ' + record.title);
      const heading = document.createElement('strong'); heading.textContent = record.title;
      const description = document.createElement('span'); description.textContent = record.description;
      const hint = document.createElement('small'); hint.className = 'lab-nb-read-hint'; hint.textContent = 'Read entry ›';
      button.append(heading, description, hint); button.onclick = () => readEntry(button, record);
      row.replaceChildren(button);
    });
    const text = content.querySelector('#nb-text');
    content.classList.toggle('lab-nb-notes', !!text);
    if (text) { text.setAttribute('aria-label', 'Personal field notes'); text.setAttribute('autocomplete', 'off'); }
    const status = content.querySelector('#nb-status');
    if (status) { status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); }
    revealActiveTab();
  }
  tabs.addEventListener('scroll', updateTabScrollHints, {passive: true});
  tabs.addEventListener('click', event => {
    const button = event.target.closest('[data-tab]'); if (!button) return;
    detail = null; content.scrollTop = 0; enhance();
    const current = tabs.querySelector('button.selected'); current?.focus({preventScroll: true});
  });
  function syncModal() {
    if (isOpen() && !held) {
      held = true; previousFocus = document.activeElement; previousInert = !!app?.inert;
      if (app) app.inert = true;
      window.CW_P20_INPUT_BLOCKED = true;
      app?.querySelectorAll('.dpad button').forEach(button => button.dispatchEvent(new Event('pointercancel')));
      window.dispatchEvent(new CustomEvent('cw:p20-modal', {detail: {open: true}}));
      enhance(); closeButton.focus({preventScroll: true});
    } else if (!isOpen() && held) {
      held = false; detail = null;
      if (app) app.inert = previousInert;
      window.CW_P20_INPUT_BLOCKED = false;
      window.dispatchEvent(new CustomEvent('cw:p20-modal', {detail: {open: false}}));
      const target = previousFocus?.isConnected && previousFocus.getClientRects().length ? previousFocus : document.getElementById('cw-ux108b-notebook');
      target?.focus({preventScroll: true});
      if (new URLSearchParams(location.search).get('unified') === '1' && parent !== window && document.documentElement.classList.contains('p21-menu-only') && typeof window.CWP21Engine?.leave === 'function') {
        try { window.CWP21Engine.leave(); }
        finally { if (app) app.inert = true; document.body.inert = true; document.body.style.visibility = 'hidden'; }
      }
    }
  }
  const originalOpen = api.open, originalRefresh = api.refresh, originalRequestClose = api.requestClose;
  const otherModalOpen = () => !!document.querySelector('#cw-p16-inventory.open, #cw-clean-reader[open], #p20-base-review:not([hidden])');
  api.open = function () {
    if (!isOpen() && otherModalOpen()) return false;
    detail = null; originalOpen(); enhance(); syncModal(); return true;
  };
  // The original P12 launcher captures its old closure; route it through this guard.
  const launcher = document.getElementById('cw-ux108b-notebook');
  if (launcher) launcher.onclick = () => api.open();
  api.requestClose = function () { detail = null; const closed = originalRequestClose(); enhance(); syncModal(); return closed; };
  api.refresh = function () { detail = null; originalRefresh(); enhance(); };
  new MutationObserver(syncModal).observe(overlay, {attributes: true, attributeFilter: ['class']});
  new MutationObserver(enhance).observe(content, {childList: true, subtree: true});
  new MutationObserver(enhance).observe(tabs, {childList: true});
  if (window.ResizeObserver) new ResizeObserver(revealActiveTab).observe(book);
  window.addEventListener('resize', revealActiveTab);
  window.addEventListener('keydown', event => {
    if (!isOpen()) return;
    if (event.isComposing) { event.stopImmediatePropagation(); return; }
    const activeTab = event.target.closest?.('#nb-tabs button[data-tab]');
    if (activeTab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const list = [...tabs.querySelectorAll('button[data-tab]')], at = list.indexOf(activeTab);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? list.length - 1 : (at + (event.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length;
      list[next]?.click();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (detail) returnToList(); else api.requestClose();
    } else if (event.key === 'Tab') {
      const focusable = [...book.querySelectorAll('button,select,textarea,[tabindex="0"]')].filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !book.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    // Let text editing and native control defaults run, but never send keys to the game.
    event.stopImmediatePropagation();
  }, true);
  window.CWLabNotebook = Object.freeze({
    version: 'LAB01-NOTEBOOK-v0.2', buildId: window.CW_LAB_RELEASE.buildId, open: () => api.open(), close() { return api.requestClose(); },
    report() { return {open: isOpen(), section: activeSection(), detail: !!detail, detailVisits, modalHeld: held, compactSections: false, sectionNavigation: 'horizontal-top-tabs', sections: sections.slice(), source: 'Jimmy B03 v1.3', noteSave: 'Original P12 explicit Save handler, isolated LAB01 store', mutationPolicy: 'DOM-only entry/detail adapter; behavior verified in separate QA report'}; }
  });
  enhance(); syncModal();
})();
