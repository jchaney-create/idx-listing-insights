import { isDetailsPage, waitForListingData } from './parser.js';
import { generateListingSummary, buildSummaryHighlights } from './summary.js';
import { fetchLocalInsights, getDemoLocalInsights } from './local-info.js';
import { injectGeoMarkup } from './geo.js';
import { renderWidget, renderLoading, renderError, mountWidget } from './widget.js';

function readConfig() {
  const script =
    document.currentScript ||
    document.querySelector('script[data-idx-listing-insights], script[src*="idx-listing-insights"]');

  return {
    containerId: script?.dataset?.containerId || 'idx-listing-insights',
    apiBase: script?.dataset?.apiBase || undefined,
    demoMode: script?.dataset?.demoMode === 'true' || script?.dataset?.demo === 'true',
    onlyDetailsPages: script?.dataset?.onlyDetailsPages !== 'false',
  };
}

async function initWidget(config) {
  const container = document.getElementById(config.containerId);
  if (!container) {
    console.warn(`[idx-listing-insights] Container #${config.containerId} not found`);
    return;
  }

  if (config.onlyDetailsPages && !isDetailsPage()) {
    container.style.display = 'none';
    return;
  }

  renderLoading(container);

  try {
    const listing = await waitForListingData();
    const summary = generateListingSummary(listing);
    const highlights = buildSummaryHighlights(listing);

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

    const faqItems = injectGeoMarkup({ listing, localInsights, summary });

    mountWidget(
      container,
      renderWidget({
        listing,
        summary,
        highlights,
        localInsights,
        demoMode,
        faqItems,
      })
    );
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

export { initWidget, readConfig };
