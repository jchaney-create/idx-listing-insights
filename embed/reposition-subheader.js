/**
 * Standalone snippet: paste into IDX subheader to move #IDX-Subheader above the site footer.
 * Works on any *.idxbroker.com domain with a standard wrapper footer.
 */
(function () {
  var FOOTER_SELECTORS = [
    '#IDX-main + footer',
    'footer.site-footer',
    'footer#footer',
    'footer',
    '#footer',
    '.site-footer',
    '#site-footer',
    '.footer',
    '[role="contentinfo"]',
  ];

  function findFooter() {
    for (var i = 0; i < FOOTER_SELECTORS.length; i++) {
      var el = document.querySelector(FOOTER_SELECTORS[i]);
      if (el && !el.closest('#IDX-Subheader')) return el;
    }

    var main = document.getElementById('IDX-main');
    if (!main) return null;

    var sibling = main.nextElementSibling;
    while (sibling) {
      var idAndClass = (sibling.id || '') + ' ' + (sibling.className || '');
      if (sibling.tagName === 'FOOTER' || /footer/i.test(idAndClass)) return sibling;
      sibling = sibling.nextElementSibling;
    }

    return null;
  }

  function moveSubheader() {
    var subheader = document.getElementById('IDX-Subheader');
    if (!subheader || subheader.getAttribute('data-ili-repositioned') === 'true') return;

    var footer = findFooter();

    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(subheader, footer);
    } else {
      var main = document.getElementById('IDX-main');
      if (main) main.appendChild(subheader);
      else return;
    }

    subheader.classList.add('ili-subheader-repositioned');
    subheader.setAttribute('data-ili-repositioned', 'true');
  }

  function boot() {
    moveSubheader();
    setTimeout(moveSubheader, 500);
    setTimeout(moveSubheader, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
