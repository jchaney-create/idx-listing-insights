import './styles.css';
import { buildRemarksPreview, normalizeRemarks } from './summary.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderHighlights(highlights) {
  if (!highlights.length) return '';

  return `
    <div class="ili-highlights">
      ${highlights
        .map(
          (item) => `
            <div class="ili-highlight">
              <span class="ili-highlight-label">${escapeHtml(item.label)}</span>
              <span class="ili-highlight-value">${escapeHtml(item.value)}</span>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

function renderSchools(schools = []) {
  if (!schools.length) return '<p class="ili-muted">No school data available.</p>';

  return `
    <ul class="ili-list">
      ${schools
        .map(
          (school) => `
            <li>
              <strong>${escapeHtml(school.name)}</strong>
              <span>${[
                school.level,
                school.rating != null ? `Rating ${school.rating}/10` : null,
                school.distanceMiles != null ? `${school.distanceMiles} mi` : null,
                school.source === 'mls' ? 'MLS' : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'Details unavailable'}</span>
            </li>
          `
        )
        .join('')}
    </ul>
  `;
}

export function renderPoiList(points = []) {
  if (!points.length) return '<p class="ili-muted">No nearby places found.</p>';

  return `
    <ul class="ili-list">
      ${points
        .map(
          (place) => `
            <li>
              <strong>${escapeHtml(place.name)}</strong>
              <span>${escapeHtml(place.category || 'Place')}${
                place.distanceMiles != null ? ` · ${place.distanceMiles} mi` : ''
              }${place.source === 'google' ? ' · Google Places' : ''}</span>
            </li>
          `
        )
        .join('')}
    </ul>
  `;
}

function renderDemographics(demographics) {
  if (!demographics) return '<p class="ili-muted">Demographics unavailable.</p>';

  return `
    <dl class="ili-stats">
      ${
        demographics.population != null
          ? `<div><dt>Population</dt><dd>${escapeHtml(demographics.population.toLocaleString())}</dd></div>`
          : ''
      }
      ${
        demographics.medianAge != null
          ? `<div><dt>Median age</dt><dd>${escapeHtml(demographics.medianAge)}</dd></div>`
          : ''
      }
      ${
        demographics.medianHouseholdIncome != null
          ? `<div><dt>Median income</dt><dd>$${escapeHtml(demographics.medianHouseholdIncome.toLocaleString())}</dd></div>`
          : ''
      }
      ${
        demographics.ownerOccupiedPct != null
          ? `<div><dt>Owner occupied</dt><dd>${escapeHtml(demographics.ownerOccupiedPct)}%</dd></div>`
          : ''
      }
    </dl>
    ${demographics.summary ? `<p class="ili-note">${escapeHtml(demographics.summary)}</p>` : ''}
  `;
}

function renderWalkability(walkability) {
  if (!walkability) return '<p class="ili-muted">Walkability data unavailable.</p>';

  return `
    <div class="ili-score-grid">
      ${
        walkability.walkScore != null
          ? `<div class="ili-score"><span>${walkability.walkScore}</span><small>Walk</small></div>`
          : ''
      }
      ${
        walkability.transitScore != null
          ? `<div class="ili-score"><span>${walkability.transitScore}</span><small>Transit</small></div>`
          : ''
      }
      ${
        walkability.bikeScore != null
          ? `<div class="ili-score"><span>${walkability.bikeScore}</span><small>Bike</small></div>`
          : ''
      }
    </div>
    ${walkability.summary ? `<p class="ili-note">${escapeHtml(walkability.summary)}</p>` : ''}
  `;
}

function renderWeather(weather) {
  if (!weather) return '<p class="ili-muted">Weather data unavailable.</p>';

  return `
    <div class="ili-weather">
      ${
        weather.currentTempF != null
          ? `<div class="ili-weather-main">${weather.currentTempF}°F</div>`
          : ''
      }
      ${weather.condition ? `<div class="ili-weather-condition">${escapeHtml(weather.condition)}</div>` : ''}
      ${
        weather.avgHighF != null && weather.avgLowF != null
          ? `<div class="ili-muted">Typical range ${weather.avgLowF}°–${weather.avgHighF}°F</div>`
          : ''
      }
      ${weather.summary ? `<p class="ili-note">${escapeHtml(weather.summary)}</p>` : ''}
    </div>
  `;
}

function renderExpandableText(text, previewLength = 280) {
  const fullText = normalizeRemarks(text);
  if (!fullText) return '';

  const preview = buildRemarksPreview(fullText, previewLength);
  if (preview.length >= fullText.length) {
    return `<p>${escapeHtml(fullText)}</p>`;
  }

  return `
    <div class="ili-expandable" data-ili-expandable>
      <p class="ili-expandable-preview">${escapeHtml(preview)}</p>
      <p class="ili-expandable-full ili-is-hidden">${escapeHtml(fullText)}</p>
      <button
        type="button"
        class="ili-expandable-toggle"
        data-ili-expand-toggle
        aria-expanded="false"
      >See more</button>
    </div>
  `;
}

export function attachExpandableToggles(container) {
  container.querySelectorAll('[data-ili-expandable]').forEach((block) => {
    const toggle = block.querySelector('[data-ili-expand-toggle]');
    const preview = block.querySelector('.ili-expandable-preview');
    const full = block.querySelector('.ili-expandable-full');
    if (!toggle || !preview || !full) return;

    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        preview.classList.remove('ili-is-hidden');
        full.classList.add('ili-is-hidden');
        toggle.textContent = 'See more';
        toggle.setAttribute('aria-expanded', 'false');
        return;
      }

      preview.classList.add('ili-is-hidden');
      full.classList.remove('ili-is-hidden');
      toggle.textContent = 'See less';
      toggle.setAttribute('aria-expanded', 'true');
    });
  });
}

function renderFaqAnswer(item) {
  if (item.expandable && item.fullAnswer) {
    return renderExpandableText(item.fullAnswer);
  }
  return `<p>${escapeHtml(item.answer)}</p>`;
}

function renderFaq(faqItems = []) {
  if (!faqItems.length) return '';

  return `
    <section class="ili-faq" aria-labelledby="ili-faq-heading">
      <h3 id="ili-faq-heading">Property &amp; neighborhood FAQ</h3>
      <dl class="ili-faq-list">
        ${faqItems
          .map(
            (item) => `
              <div class="ili-faq-item">
                <dt>${escapeHtml(item.question)}</dt>
                <dd>${renderFaqAnswer(item)}</dd>
              </div>
            `
          )
          .join('')}
      </dl>
    </section>
  `;
}

function renderContactCta(contactAction) {
  if (!contactAction) return '';

  const href =
    contactAction.type === 'link' && contactAction.href
      ? escapeHtml(contactAction.href)
      : '#contact';

  return `
    <div class="ili-cta">
      <p>Interested in this property?</p>
      <a
        class="ili-cta-button"
        data-ili-contact-cta
        href="${href}"
      >${escapeHtml(contactAction.label)}</a>
    </div>
  `;
}

export function renderWidget({
  listing,
  summary,
  remarksSummary = '',
  highlights,
  localInsights,
  demoMode,
  faqItems = [],
  contactAction = null,
  showMap = false,
}) {
  const title = listing.fullAddress || 'Listing Insights';

  return `
    <article class="ili-widget" itemscope itemtype="https://schema.org/RealEstateListing" aria-label="Listing insights">
      <header class="ili-header">
        <div>
          <p class="ili-eyebrow">Property overview</p>
          <h2 class="ili-title" itemprop="name">${escapeHtml(title)}</h2>
          ${
            listing.fullAddress
              ? `<address class="ili-address" itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
                  <span itemprop="streetAddress">${escapeHtml(listing.address || '')}</span>,
                  <span itemprop="addressLocality">${escapeHtml(listing.city || '')}</span>,
                  <span itemprop="addressRegion">${escapeHtml(listing.state || '')}</span>
                  <span itemprop="postalCode">${escapeHtml(listing.zipcode || '')}</span>
                </address>`
              : ''
          }
        </div>
        ${demoMode ? '<span class="ili-badge">Demo data</span>' : ''}
      </header>

      <div class="ili-summary-card">
        <h3>Listing summary</h3>
        <p itemprop="description">${escapeHtml(summary)}</p>
        ${
          remarksSummary
            ? `<div class="ili-remarks">
                <h4>About this property</h4>
                ${renderExpandableText(remarksSummary, 220)}
              </div>`
            : ''
        }
        ${renderHighlights(highlights)}
      </div>

      <div class="ili-grid">
        <section class="ili-card" aria-labelledby="ili-walk-heading">
          <h3 id="ili-walk-heading">Walkability</h3>
          ${renderWalkability(localInsights.walkability)}
        </section>

        <section class="ili-card" aria-labelledby="ili-weather-heading">
          <h3 id="ili-weather-heading">Weather</h3>
          ${renderWeather(localInsights.weather)}
        </section>

        <section class="ili-card" aria-labelledby="ili-schools-heading">
          <h3 id="ili-schools-heading">Schools nearby</h3>
          ${renderSchools(localInsights.schools)}
        </section>

        <section class="ili-card" aria-labelledby="ili-neighborhood-heading">
          <h3 id="ili-neighborhood-heading">Neighborhood</h3>
          ${renderDemographics(localInsights.demographics)}
        </section>

        <section class="ili-card ili-card-wide" aria-labelledby="ili-poi-heading">
          <h3 id="ili-poi-heading">Nearby places</h3>
          ${renderPoiList(localInsights.pointsOfInterest)}
        </section>
      </div>

      ${
        showMap
          ? `<section class="ili-card ili-card-wide ili-map-section" aria-labelledby="ili-map-heading">
              <h3 id="ili-map-heading">Map &amp; nearby points of interest</h3>
              <div id="ili-map" class="ili-map" role="region" aria-label="Property map"></div>
            </section>`
          : ''
      }

      ${renderFaq(faqItems)}
      ${renderContactCta(contactAction)}
    </article>
  `;
}

export function renderLoading(container) {
  container.innerHTML = `
    <section class="ili-widget ili-loading" aria-live="polite">
      <p>Loading listing insights…</p>
    </section>
  `;
}

export function renderError(container, message) {
  container.innerHTML = `
    <section class="ili-widget ili-error" role="alert">
      <p>${escapeHtml(message)}</p>
    </section>
  `;
}

export function mountWidget(container, html) {
  container.innerHTML = html;
}
