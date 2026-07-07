const FOOTER_SELECTORS = [
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
  for (const selector of FOOTER_SELECTORS) {
    const element = document.querySelector(selector);
    if (element && !element.closest('#IDX-Subheader')) {
      return element;
    }
  }

  const main = document.getElementById('IDX-main');
  if (!main) return null;

  let sibling = main.nextElementSibling;
  while (sibling) {
    const idAndClass = `${sibling.id} ${sibling.className}`;
    if (sibling.tagName === 'FOOTER' || /footer/i.test(idAndClass)) {
      return sibling;
    }
    sibling = sibling.nextElementSibling;
  }

  return null;
}

export function repositionSubheaderAboveFooter() {
  const subheader = document.getElementById('IDX-Subheader');
  if (!subheader || subheader.dataset.iliRepositioned === 'true') {
    return Boolean(subheader);
  }

  const footer = findFooter();

  if (footer?.parentNode) {
    footer.parentNode.insertBefore(subheader, footer);
  } else {
    const main = document.getElementById('IDX-main');
    if (main) {
      main.appendChild(subheader);
    } else {
      return false;
    }
  }

  subheader.classList.add('ili-subheader-repositioned');
  subheader.dataset.iliRepositioned = 'true';
  return true;
}

export function initSubheaderReposition({ retries = 3, delayMs = 500 } = {}) {
  const attempt = () => repositionSubheaderAboveFooter();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attempt);
  } else {
    attempt();
  }

  for (let i = 1; i <= retries; i += 1) {
    setTimeout(attempt, delayMs * i);
  }
}
