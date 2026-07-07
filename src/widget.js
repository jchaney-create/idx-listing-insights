import './styles.css';

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

function renderPoi(points = []) {
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
              }</span>
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
                <dd>${escapeHtml(item.answer)}</dd>
              </div>
            `
          )
          .join('')}
      </dl>
    </section>
  `;
}

export function renderWidget({ listing, summary, highlights, localInsights, demoMode, faqItems = [] }) {
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
          ${renderPoi(localInsights.pointsOfInterest)}
        </section>
      </div>

      ${renderFaq(faqItems)}
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
