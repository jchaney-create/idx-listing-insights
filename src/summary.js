function formatCurrency(value) {
  if (value == null) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value) {
  if (value == null) return null;
  return new Intl.NumberFormat('en-US').format(value);
}

function truncate(text, maxLength = 220) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  const trimmed = (lastSpace > 80 ? slice.slice(0, lastSpace) : slice).trim();
  return `${trimmed}…`;
}

export function normalizeRemarks(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Build a short preview of MLS public remarks for collapsed display.
 */
export function buildRemarksPreview(text, maxLength = 280) {
  const cleaned = normalizeRemarks(text);
  if (cleaned.length <= maxLength) return cleaned;

  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length) {
    let result = '';
    for (const sentence of sentences) {
      const next = `${result}${sentence}`.trim();
      if (next.length > maxLength) break;
      result = `${next} `;
    }
    if (result.trim()) return result.trim();
  }

  return truncate(cleaned, maxLength);
}

/**
 * Summarize MLS public remarks for GEO schema and metadata.
 */
export function summarizeRemarks(text, maxLength = 450) {
  return buildRemarksPreview(text, maxLength);
}

/**
 * Build a readable listing summary from parsed DOM data.
 * Uses templated prose rather than an external AI API for the initial version.
 */
export function generateListingSummary(listing) {
  const parts = [];

  const priceText = listing.priceDisplay || formatCurrency(listing.price);
  const location = listing.fullAddress || [listing.city, listing.state].filter(Boolean).join(', ');

  if (priceText && location) {
    parts.push(`Listed at ${priceText} in ${location}.`);
  } else if (location) {
    parts.push(`Located at ${location}.`);
  }

  const stats = [];
  if (listing.bedrooms != null) stats.push(`${listing.bedrooms} bed${listing.bedrooms === 1 ? '' : 's'}`);
  if (listing.bathrooms != null) stats.push(`${listing.bathrooms} bath${listing.bathrooms === 1 ? '' : 's'}`);
  if (listing.sqft != null) stats.push(`${formatNumber(listing.sqft)} sq ft`);

  if (stats.length) {
    const typeLabel = [listing.propertyType, listing.propertySubType].filter(Boolean).join(' · ') || 'property';
    parts.push(`This ${typeLabel} offers ${stats.join(', ')}.`);
  }

  const context = [];
  if (listing.yearBuilt != null) context.push(`built in ${listing.yearBuilt}`);
  if (listing.acres != null) context.push(`${listing.acres} acres`);
  if (listing.county) context.push(`in ${listing.county} County`);
  if (context.length) {
    parts.push(`The estate sits on ${context.join(', ')}.`);
  }

  if (listing.schoolDistrict) {
    parts.push(`School district: ${listing.schoolDistrict}.`);
  }

  if (!parts.length) {
    return 'Listing details are loading or unavailable on this page.';
  }

  return parts.join(' ');
}

export function buildSummaryHighlights(listing) {
  const highlights = [];

  if (listing.price != null) {
    highlights.push({ label: 'Price', value: formatCurrency(listing.price) });
  }
  if (listing.bedrooms != null) {
    highlights.push({ label: 'Bedrooms', value: String(listing.bedrooms) });
  }
  if (listing.bathrooms != null) {
    highlights.push({ label: 'Bathrooms', value: String(listing.bathrooms) });
  }
  if (listing.sqft != null) {
    highlights.push({ label: 'Square Feet', value: formatNumber(listing.sqft) });
  }
  if (listing.propertyType) {
    highlights.push({ label: 'Type', value: listing.propertyType });
  }
  if (listing.acres != null) {
    highlights.push({ label: 'Acres', value: String(listing.acres) });
  }
  if (listing.yearBuilt != null) {
    highlights.push({ label: 'Year Built', value: String(listing.yearBuilt) });
  }
  if (listing.county) {
    highlights.push({ label: 'County', value: listing.county });
  }

  return highlights;
}
