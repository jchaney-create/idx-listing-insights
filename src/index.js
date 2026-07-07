import { isDetailsPage, waitForListingData } from './parser.js';
import { generateListingSummary, buildSummaryHighlights, normalizeRemarks } from './summary.js';
import { fetchLocalInsights, getDemoLocalInsights } from './local-info.js';
import { injectGeoMarkup } from './geo.js';
import { findContactAction, attachContactCta } from './contact.js';
import { renderWidget, renderLoading, renderError, mountWidget, attachExpandableToggles } from './widget.js';

function findWidgetScript() {
  if (document.currentScript?.src?.includes('idx-listing-insights')) {
    return document.currentScript;
  }

  const scripts = document.querySelectorAll(
    'script[data-idx-listing-insights], script[src*="idx-listing-insights"]'
  );
  return scripts[scripts.length - 1] || null;
}

function readConfig() {
  const script = findWidgetScript();

  const demoModeAttr = script?.dataset?.demoMode ?? script?.dataset?.demo;
  const hasApiBase = Boolean(script?.dataset?.apiBase);

  return {
    containerId: script?.dataset?.containerId || 'idx-listing-insights',
    apiBase: script?.dataset?.apiBase || undefined,
    demoMode: demoModeAttr === 'false' ? false : demoModeAttr === 'true' || !hasApiBase,
    onlyDetailsPages: script?.dataset?.onlyDetailsPages !== 'false',
    autoMount: script?.dataset?.autoMount !== 'false',
  };
}

function ensureContainer(config) {
  let container = document.getElementById(config.containerId);
  if (container) return container;

  if (!config.autoMount) return null;

  container = document.createElement('div');
  container.id = config.containerId;

  const mountTargets = [
    '#IDX-Subheader-Page',
    '#IDX-Subheader',
    '#IDX-main',
    '#IDX-detailsWrapper',
  ];

  for (const selector of mountTargets) {
    const target = document.querySelector(selector);
    if (!target) continue;

    if (selector === '#IDX-Subheader-Page' || selector === '#IDX-Subheader') {
      target.appendChild(container);
    } else {
      target.insertBefore(container, target.firstChild);
    }
    return container;
  }

  document.body.insertBefore(container, document.body.firstChild);
  return container;
}

async function initWidget(config) {
  if (config.onlyDetailsPages && !isDetailsPage()) {
    const existing = document.getElementById(config.containerId);
    if (existing) existing.style.display = 'none';
    return;
  }

  const container = ensureContainer(config);
  if (!container) {
    console.warn(`[idx-listing-insights] Container #${config.containerId} not found`);
    return;
  }

  renderLoading(container);

  try {
    const listing = await waitForListingData();
    const summary = generateListingSummary(listing);
    const remarksSummary = normalizeRemarks(listing.description);
    const highlights = buildSummaryHighlights(listing);
    const contactAction = findContactAction();

    let localInsights;
    let demoMode = config.demoMode;

    if (config.demoMode) {
      localInsights = getDemoLocalInsights(listing);
    } else {
      try {
        localInsights = await fetchLocalInsights(listing, config);
      } catch (error) {
        console.warn('[idx-listing-insights] Falling back to demo local data:', error);
        localInsights = getDemoLocalInsights(listing);
        demoMode = true;
      }
    }

    if (listing.schools?.length) {
      localInsights.schools = listing.schools.map((school) => ({
        name: school.name,
        level: school.level,
        rating: school.rating ?? null,
        distanceMiles: school.distanceMiles ?? null,
        source: 'mls',
      }));
    }

    const faqItems = injectGeoMarkup({ listing, localInsights, summary, remarksSummary });

    mountWidget(
      container,
      renderWidget({
        listing,
        summary,
        remarksSummary,
        highlights,
        localInsights,
        demoMode,
        faqItems,
        contactAction,
      })
    );

    attachContactCta(container, contactAction);
    attachExpandableToggles(container);
  } catch (error) {
    renderError(container, error.message || 'Unable to load listing insights.');
  }
}

function boot() {
  const config = readConfig();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initWidget(config));
  } else {
    initWidget(config);
  }
}

boot();

export { initWidget, readConfig, ensureContainer };
