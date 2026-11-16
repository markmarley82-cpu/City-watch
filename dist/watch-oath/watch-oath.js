(function (global) {
  'use strict';
  const oath = "I, [recruit's name], do solemnly swear by [recruit's deity of choice] to uphold the Laws and Ordinances of the City of Ankh-Morpork, serve the public trust, and defend the subjects of his/her (delete whichever is inappropriate) Majesty (name of reigning monarch) without fear, favour, or thought of personal safety; to pursue evildoers and protect the innocent, laying down my life if necessary in the cause of said duty, so help me [aforesaid deity]. Gods Save the King/Queen (delete whichever is inappropriate).";
  let active = null;
  function normaliseName(value) { return String(value).normalize('NFC').trim().replace(/\s+/gu, ' '); }
  function validName(value) { const name = normaliseName(value); return name.length > 0 && Array.from(name).length <= 32 && !/[\p{Cc}\p{Cf}<>]/u.test(name); }
  function mount(options = {}) {
    if (active) throw new Error('The recruitment screen is already open.');
    if (typeof options.onSign !== 'function') throw new TypeError('onSign is required.');
    const previousFocus = document.activeElement;
    const root = document.createElement('section');
    root.className = 'cw-oath'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'cw-oath-title');
    root.innerHTML = `<div class="cw-oath-wrap"><header class="cw-oath-brand"><span aria-hidden="true">⚔</span><div><strong>CITY WATCH</strong><small>THE LANTERN FILES</small></div></header><form class="cw-oath-form" novalidate><article class="cw-oath-paper"><div class="cw-oath-heading"><span class="cw-oath-lantern" aria-hidden="true">♜</span><p>ANKH-MORPORK CITY WATCH</p><h1 id="cw-oath-title" tabindex="-1">Oath of Office</h1></div><p class="cw-oath-words"></p><div class="cw-oath-signature"><label for="cw-oath-name">Recruit’s name</label><input id="cw-oath-name" name="recruitName" type="text" maxlength="64" autocomplete="off" autocapitalize="words" spellcheck="false" aria-describedby="cw-oath-help cw-oath-error" required><p id="cw-oath-help">Type your name to sign. Up to 32 characters.</p><p id="cw-oath-error" role="status" aria-live="polite"></p></div></article><div class="cw-oath-actions"><button class="cw-oath-submit" type="submit" disabled><span aria-hidden="true">✒</span> Sign &amp; Join the Watch</button><button class="cw-oath-cancel" type="button" hidden>Back to my patrol</button><p class="cw-oath-footer">Your watch begins here.</p></div></form></div>`;
    root.querySelector('.cw-oath-words').textContent = oath;
    const input = root.querySelector('input'), form = root.querySelector('form'), submit = root.querySelector('[type=submit]');
    const cancel = root.querySelector('.cw-oath-cancel'), error = root.querySelector('#cw-oath-error');
    // A recruit may bring an unsigned name from the character folio. It remains
    // editable here; only onSign commits it to the existing patrol record.
    if (typeof options.initialName === 'string') input.value = normaliseName(options.initialName);
    if (typeof options.cancelLabel === 'string') cancel.textContent = options.cancelLabel;
    let busy = false, disposed = false;
    const siblings = Array.from(document.body.children).map(node => ({node, inert: node.inert}));
    siblings.forEach(({node}) => { node.inert = true; });
    document.body.append(root);
    function update() { submit.disabled = busy || !validName(input.value); input.setAttribute('aria-invalid', input.value.length > 0 && !validName(input.value) ? 'true' : 'false'); }
    input.addEventListener('input', () => { error.textContent = ''; update(); });
    update();
    function destroy() {
      if (disposed) return;
      disposed = true; root.remove(); siblings.forEach(({node, inert}) => { node.inert = inert; });
      document.removeEventListener('keydown', keyTrap, true); active = null;
      if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
    }
    async function sign(event) {
      event.preventDefault(); if (busy || disposed) return;
      if (!validName(input.value)) { error.textContent = 'Enter a name of 1–32 characters, without angle brackets or control marks.'; input.focus(); return; }
      const name = normaliseName(input.value); busy = true; input.readOnly = true; update(); cancel.disabled = true;
      submit.textContent = 'Signing…';
      try {
        const result = await options.onSign(Object.freeze({name, oathVersion:'1.0'}));
        if (result === false) throw new Error('save-failed');
        destroy();
        if (typeof options.onComplete === 'function') options.onComplete();
      } catch (exception) {
        if (disposed) return;
        error.textContent = 'Your name could not be saved. Please try again; your patrol has not been replaced.';
        busy = false; input.readOnly = false; cancel.disabled = false; submit.textContent = 'Sign & Join the Watch'; update(); input.focus();
      }
    }
    form.addEventListener('submit', sign);
    if (typeof options.onCancel === 'function') { cancel.hidden = false; cancel.addEventListener('click', () => { if (!busy) { destroy(); options.onCancel(); } }); }
    function keyTrap(event) {
      if (!root.isConnected) return;
      if (event.key === 'Escape') { event.preventDefault(); if (!busy && !cancel.hidden) cancel.click(); }
      if (event.key === 'Tab') {
        const controls = Array.from(root.querySelectorAll('input,button')).filter(el => !el.disabled && !el.hidden);
        const first = controls[0], last = controls.at(-1), focused = document.activeElement;
        if (event.shiftKey && (focused === first || !controls.includes(focused))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (focused === last || !controls.includes(focused))) { event.preventDefault(); first.focus(); }
      }
      // Capture on the dialog, never prevent text editing/IME in the live input.
      if (!root.contains(event.target)) event.stopImmediatePropagation();
    }
    document.addEventListener('keydown', keyTrap, true);
    root.addEventListener('keydown', event => event.stopPropagation());
    for (const type of ['pointerdown','pointerup','click','wheel']) root.addEventListener(type, event => event.stopPropagation());
    // Focus the heading first; don't summon a phone keyboard before the player asks.
    root.querySelector('h1').focus({preventScroll:true});
    active = {root, destroy}; return active;
  }
  global.CWWatchOath = Object.freeze({version:'1.0', oath, normaliseName, validName, mount});
})(window);
