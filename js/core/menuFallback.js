(function () {
  'use strict';

  var scrollY = 0;

  function getPanel() { return document.getElementById('settingsPanel'); }
  function getButton() { return document.getElementById('settingsButton'); }
  function getClose() { return document.getElementById('closeSettings'); }
  function getBody() { return getPanel() && getPanel().querySelector('.settings-panel__body'); }

  function isOpen() {
    var panel = getPanel();
    return !!(panel && panel.classList.contains('is-open'));
  }

  function lockScroll() {
    scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add('settings-open');
    document.body.classList.add('settings-open');
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + scrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }

  function unlockScroll() {
    document.documentElement.classList.remove('settings-open');
    document.body.classList.remove('settings-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY || 0);
  }

  function setOpen(open) {
    var panel = getPanel();
    var button = getButton();
    if (!panel || !button) return;

    if (open) {
      panel.hidden = false;
      panel.removeAttribute('hidden');
      panel.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
      panel.setAttribute('aria-modal', 'true');
      lockScroll();
      requestAnimationFrame(function () {
        var body = getBody();
        if (body) body.scrollTop = 0;
      });
    } else {
      panel.classList.remove('is-open');
      panel.hidden = true;
      panel.setAttribute('hidden', '');
      button.setAttribute('aria-expanded', 'false');
      panel.removeAttribute('aria-modal');
      unlockScroll();
    }
  }

  function clickHandler(event) {
    var button = event.target && event.target.closest && event.target.closest('#settingsButton');
    var close = event.target && event.target.closest && event.target.closest('#closeSettings');

    if (button) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      setOpen(!isOpen());
      return;
    }

    if (close) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      setOpen(false);
      return;
    }
  }

  function keyHandler(event) {
    if (event.key === 'Escape' && isOpen()) setOpen(false);
  }

  function outsideHandler(event) {
    if (!isOpen()) return;
    if (event.target.closest('#settingsPanel') || event.target.closest('#settingsButton')) return;
    setOpen(false);
  }

  function touchMoveHandler(event) {
    if (!isOpen()) return;
    var body = event.target.closest && event.target.closest('.settings-panel__body');
    if (body && body.scrollHeight > body.clientHeight) return;
    event.preventDefault();
  }

  function init() {
    var panel = getPanel();
    var button = getButton();
    if (!panel || !button) return;

    // Always start closed. This prevents stale cached states from leaving the drawer stuck open.
    setOpen(false);

    document.addEventListener('click', clickHandler, true);
    document.addEventListener('keydown', keyHandler, true);
    document.addEventListener('click', outsideHandler, false);
    document.addEventListener('touchmove', touchMoveHandler, { passive: false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.TechCalcMenu = { open: function () { setOpen(true); }, close: function () { setOpen(false); }, toggle: function () { setOpen(!isOpen()); } };
}());
