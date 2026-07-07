/**
 * Detect whether the current page is an IDX Broker listing details page.
 */
export function isDetailsPage() {
  if (/\/idx\/details\//i.test(window.location.pathname)) return true;
  if (/details\.php/i.test(window.location.pathname)) return true;
  if (document.querySelector('#IDX-main.IDX-page-listing, #IDX-main.IDX-category-details')) {
    return true;
  }
  if (document.querySelector('#IDX-detailsHeader, #IDX-detailsWrapper, [id^="IDX-detailsField-"]')) {
    return true;
  }
  return false;
}

function readFieldData(container) {
  if (!container) return '';
  const dataEl =
    container.querySelector('.IDX-fieldData') ||
    container.querySelector('.IDX-text') ||
    container;
  return dataEl.textContent?.trim().replace(/\s+/g, ' ') ?? '';
}

function readByDetailsField(fieldName) {
  const legacyEl = document.getElementById(`IDX-detailsField-${fieldName}`);
  if (legacyEl) return readFieldData(legacyEl);

  const modernEl =
    document.querySelector(`.IDX-field-${fieldName} .IDX-text`) ||
    document.querySelector(`#IDX-field-${fieldName} .IDX-text`);
  return readFieldData(modernEl);
}

function readHiddenInput(name) {
  const input = document.querySelector(`input[type="hidden"][name="${name}"]`);
  return input?.value?.trim() ?? '';
}

function readMetaOrScriptListingMeta() {
  const scripts = document.querySelectorAll('script:not([src])');
  for (const script of scripts) {
    const text = script.textContent ?? '';
    const match = text.match(/\{"page"\s*:\s*"listing"[\s\S]*?\}/);
    if (!match) continue;
    try {
      return JSON.parse(match[0]);
    } catch {
      // continue
    }
  }
  return null;
}

function readSavePropertyMeta() {
  const saveBtn = document.querySelector('#IDX-saveProperty[data-listingid]');
  if (!saveBtn) return null;

  return {
    listingID: saveBtn.dataset.listingid || '',
    idxID: saveBtn.dataset.idxid || '',
  };
}

function readAddressFromHeader() {
  const streetEl = document.querySelector('#IDX-detailsAddressStreet');
  const regionEl = document.querySelector('#IDX-detailsAddressRegion');

  if (streetEl || regionEl) {
    const street = streetEl
      ? Array.from(streetEl.querySelectorAll('span'))
          .map((span) => span.textContent?.trim())
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
      : '';

    let city = '';
    let state = '';
    let zipcode = '';

    if (regionEl) {
      const spans = Array.from(regionEl.querySelectorAll(':scope > span'))
        .map((span) => span.textContent?.trim())
        .filter(Boolean);

      if (spans.length >= 1) city = spans[0].replace(/,\s*$/, '');
      if (spans.length >= 2) state = spans[1];
      if (spans.length >= 3) zipcode = spans[2];
    }

    return { street, city, state, zipcode };
  }

  return readLegacyAddressFromDom();
}

function readLegacyAddressFromDom() {
  const number = document.querySelector('.IDX-detailsAddressNumber')?.textContent?.trim() ?? '';
  const name = document.querySelector('.IDX-detailsAddressName')?.textContent?.trim() ?? '';
  const unit = document.querySelector('.IDX-detailsAddressUnitNumber')?.textContent?.trim() ?? '';
  const city =
    document.querySelector('.IDX-detailsAddressCity')?.textContent?.trim().replace(/,\s*$/, '') ?? '';
  const stateAbrv = document.querySelector('.IDX-detailsAddressStateAbrv')?.textContent?.trim() ?? '';
  const stateFull = document.querySelector('.IDX-detailsAddressState')?.textContent?.trim() ?? '';
  const zipcode = document.querySelector('.IDX-detailsAddressZipcode')?.textContent?.trim() ?? '';

  let street = [number, name].filter(Boolean).join(' ').replace(/\s+/g, ' ');
  if (unit && street && !street.includes(unit)) {
    street = `${street} ${unit}`.trim();
  }

  return {
    street,
    city,
    state: stateAbrv || stateFull,
    zipcode,
  };
}

function readMetaKeywords() {
  const content = document.querySelector('meta[name="keywords"]')?.getAttribute('content');
  if (!content) return null;

  const parts = content.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length < 6) return null;

  return {
    listingId: parts[0] || '',
    address: parts[1] || '',
    city: parts[2] || '',
    stateName: parts[3] || '',
    state: parts[4] || '',
    zipcode: parts[5] || '',
    county: parts[6] || '',
    priceDisplay: parts[7] || '',
    propertyType: parts[8] || '',
    propertySubType: parts[9] || '',
  };
}

function readMortgagePrice() {
  const price = window.mortgageCalc?.mortPrice;
  if (price == null || price === '') return null;
  const num = Number(String(price).replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : null;
}

function parseNumber(value) {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseCoordinates() {
  const mapEl =
    document.querySelector('[data-latitude][data-longitude]') ||
    document.querySelector('#IDX-map') ||
    document.querySelector('.IDX-map');

  if (mapEl?.dataset?.latitude && mapEl?.dataset?.longitude) {
    return {
      lat: Number(mapEl.dataset.latitude),
      lng: Number(mapEl.dataset.longitude),
    };
  }

  const latInput = document.querySelector('input[name="latitude"], input[name="lat"]');
  const lngInput = document.querySelector('input[name="longitude"], input[name="lng"]');
  if (latInput?.value && lngInput?.value) {
    return { lat: Number(latInput.value), lng: Number(lngInput.value) };
  }

  return null;
}

function readDescription() {
  const candidates = [
    '#IDX-detailsDescription .IDX-clamp__target',
    '#IDX-detailsDescription',
    '#IDX-description',
    '#IDX-description .IDX-clamp__target',
    '#IDX-detailsField-remarks',
    '#IDX-detailsField-publicRemarks',
    '.IDX-detailsDescription',
    '.IDX-remarks',
  ];

  for (const selector of candidates) {
    const el = document.querySelector(selector);
    const text = el?.textContent?.trim().replace(/\s+/g, ' ');
    if (text) return text;
  }

  const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
  return ogDescription?.trim() ?? '';
}

function readFieldWithAliases(...fieldNames) {
  for (const fieldName of fieldNames) {
    const value = readByDetailsField(fieldName);
    if (value) return value;
  }
  return '';
}

function readSchoolsFromDom() {
  const schoolFields = [
    { keys: ['elementarySchool'], label: 'Elementary' },
    { keys: ['middleOrJuniorSchool', 'middleSchool'], label: 'Middle School' },
    { keys: ['highSchool'], label: 'High School' },
  ];

  const schools = schoolFields
    .map(({ keys, label }) => {
      const name = readFieldWithAliases(...keys);
      if (!name) return null;
      return { name, level: label, source: 'mls' };
    })
    .filter(Boolean);

  const district = readFieldWithAliases('schoolDistrictName', 'schoolDistrict');
  return { schools, district };
}

function readListingIdFromUrl() {
  const match = window.location.pathname.match(/\/idx\/details\/listing\/([^/]+)\/([^/?#]+)/i);
  if (!match) return { idxId: '', listingId: '' };
  return { idxId: match[1], listingId: match[2] };
}

/**
 * Parse listing data from the IDX details page DOM.
 * Supports legacy templates and the modern AI redesign layout used on idxstaging.
 */
export function parseListingFromDom() {
  const scriptMeta = readMetaOrScriptListingMeta();
  const saveMeta = readSavePropertyMeta();
  const headerAddress = readAddressFromHeader();
  const metaKeywords = readMetaKeywords();
  const urlMeta = readListingIdFromUrl();
  const schoolInfo = readSchoolsFromDom();

  const address =
    readHiddenInput('address') ||
    headerAddress.street ||
    readByDetailsField('address') ||
    readByDetailsField('fullAddress') ||
    metaKeywords?.address ||
    '';

  const city =
    readHiddenInput('cityName') ||
    headerAddress.city ||
    readByDetailsField('cityName') ||
    readByDetailsField('city') ||
    metaKeywords?.city ||
    '';

  const state =
    readHiddenInput('stateAbrv') ||
    headerAddress.state ||
    readHiddenInput('state') ||
    readByDetailsField('state') ||
    readByDetailsField('stateAbrv') ||
    metaKeywords?.state ||
    '';

  const zipcode =
    readHiddenInput('zipcode') ||
    headerAddress.zipcode ||
    readByDetailsField('zipcode') ||
    readByDetailsField('zip') ||
    metaKeywords?.zipcode ||
    '';

  const priceRaw =
    readHiddenInput('listingPrice') ||
    readByDetailsField('listingPrice') ||
    readByDetailsField('price') ||
    metaKeywords?.priceDisplay ||
    document.querySelector('.IDX-detailsPrice, .IDX-price')?.textContent?.trim() ||
    '';

  const mortgagePrice = readMortgagePrice();

  const bedrooms =
    parseNumber(readByDetailsField('bedrooms')) ??
    parseNumber(readByDetailsField('beds')) ??
    parseNumber(readHiddenInput('bedrooms'));

  const bathrooms =
    parseNumber(readByDetailsField('totalBaths')) ??
    parseNumber(readByDetailsField('bathrooms')) ??
    parseNumber(readHiddenInput('totalBaths'));

  const sqft =
    parseNumber(readByDetailsField('sqFt')) ??
    parseNumber(readByDetailsField('squareFeet')) ??
    parseNumber(readHiddenInput('sqFt'));

  const acres = parseNumber(readByDetailsField('acres'));
  const yearBuilt = parseNumber(readByDetailsField('yearBuilt'));
  const county = readByDetailsField('countyName') || metaKeywords?.county || '';

  const propertyType =
    readByDetailsField('propType') ||
    readByDetailsField('propertyType') ||
    readHiddenInput('idxPropType') ||
    metaKeywords?.propertyType ||
    '';

  const propertySubType =
    readByDetailsField('propSubType') ||
    metaKeywords?.propertySubType ||
    '';

  const listingId =
    readHiddenInput('listingID') ||
    saveMeta?.listingID ||
    readByDetailsField('listingID') ||
    urlMeta.listingId ||
    scriptMeta?.listingID ||
    metaKeywords?.listingId ||
    '';

  const idxId =
    readHiddenInput('idxID') ||
    saveMeta?.idxID ||
    urlMeta.idxId ||
    scriptMeta?.idxID ||
    '';

  const coordinates = parseCoordinates();
  const description = readDescription();
  const fullAddress = [address, city, state, zipcode].filter(Boolean).join(', ');

  return {
    listingId,
    idxId,
    origin: window.location.origin,
    pageUrl: window.location.href,
    address,
    city,
    state,
    zipcode,
    county,
    fullAddress,
    price: mortgagePrice ?? parseNumber(priceRaw),
    priceDisplay: priceRaw || (mortgagePrice != null ? `$${mortgagePrice.toLocaleString()}` : null),
    bedrooms,
    bathrooms,
    sqft,
    acres,
    yearBuilt,
    propertyType,
    propertySubType,
    description,
    coordinates,
    schools: schoolInfo.schools,
    schoolDistrict: schoolInfo.district,
  };
}

/**
 * Wait for IDX details content to finish loading (some templates populate async).
 */
export function waitForListingData({ timeoutMs = 15000, intervalMs = 250 } = {}) {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    const check = () => {
      const listing = parseListingFromDom();
      const hasCoreData = Boolean(
        listing.fullAddress || listing.listingId || listing.price || listing.description
      );

      if (hasCoreData) {
        resolve(listing);
        return;
      }

      if (Date.now() - started >= timeoutMs) {
        reject(new Error('Timed out waiting for IDX listing data'));
        return;
      }

      setTimeout(check, intervalMs);
    };

    check();
  });
}
