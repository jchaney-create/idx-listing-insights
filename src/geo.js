/**
 * GEO (Generative Engine Optimization) helpers.
 * Injects structured data and FAQ content that AI/search systems can cite.
 */

import { summarizeRemarks, normalizeRemarks, buildRemarksPreview } from './summary.js';

function cleanObject(obj) {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (value == null || value === '') return undefined;
      return value;
    })
  );
}

export function buildFaqItems(listing, localInsights, summary, remarksSummary) {
  const location = listing.fullAddress || [listing.city, listing.state].filter(Boolean).join(', ');
  const items = [];

  if (location) {
    items.push({
      question: `Where is ${listing.address || 'this property'} located?`,
      answer: `${listing.address || 'This property'} is located at ${location}${
        listing.county ? ` in ${listing.county} County` : ''
      }.`,
    });
  }

  if (listing.price != null) {
    items.push({
      question: `What is the listing price for ${listing.address || location || 'this property'}?`,
      answer: `This property is listed at $${listing.price.toLocaleString()} (Listing ID: ${listing.listingId || 'N/A'}).`,
    });
  }

  if (listing.bedrooms != null || listing.bathrooms != null || listing.sqft != null) {
    const parts = [];
    if (listing.bedrooms != null) parts.push(`${listing.bedrooms} bedrooms`);
    if (listing.bathrooms != null) parts.push(`${listing.bathrooms} bathrooms`);
    if (listing.sqft != null) parts.push(`${listing.sqft.toLocaleString()} square feet`);
    items.push({
      question: `How many bedrooms and bathrooms does this home have?`,
      answer: `This ${listing.propertyType || 'property'} has ${parts.join(', ')}.`,
    });
  }

  if (listing.schoolDistrict || localInsights.schools?.length) {
    const schoolNames = (localInsights.schools || [])
      .map((s) => `${s.name}${s.level ? ` (${s.level})` : ''}`)
      .join('; ');
    items.push({
      question: `What schools serve ${listing.address || location || 'this area'}?`,
      answer: listing.schoolDistrict
        ? `${listing.address || 'This property'} is in the ${listing.schoolDistrict} school district. Assigned schools include: ${schoolNames || 'see listing for details'}.`
        : `Nearby schools include: ${schoolNames}.`,
    });
  }

  if (localInsights.walkability?.walkScore != null) {
    items.push({
      question: `How walkable is ${listing.city || 'this neighborhood'}?`,
      answer: `This location has a Walk Score of ${localInsights.walkability.walkScore}${
        localInsights.walkability.transitScore != null
          ? `, Transit Score of ${localInsights.walkability.transitScore}`
          : ''
      }${
        localInsights.walkability.bikeScore != null
          ? `, and Bike Score of ${localInsights.walkability.bikeScore}`
          : ''
      }. ${localInsights.walkability.summary || ''}`.trim(),
    });
  }

  if (localInsights.weather?.summary || localInsights.weather?.condition) {
    items.push({
      question: `What is the climate like in ${listing.city || listing.state || 'this area'}?`,
      answer:
        localInsights.weather.summary ||
        `Current conditions: ${localInsights.weather.condition || 'N/A'}${
          localInsights.weather.currentTempF != null ? `, ${localInsights.weather.currentTempF}°F` : ''
        }.`,
    });
  }

  if (localInsights.demographics?.summary || localInsights.demographics?.population != null) {
    items.push({
      question: `What is the neighborhood like around ${listing.city || location || 'this property'}?`,
      answer:
        localInsights.demographics.summary ||
        `The area has a population of ${localInsights.demographics.population?.toLocaleString() ?? 'N/A'}${
          localInsights.demographics.medianHouseholdIncome
            ? ` with a median household income of $${localInsights.demographics.medianHouseholdIncome.toLocaleString()}`
            : ''
        }.`,
    });
  }

  const fullRemarks = normalizeRemarks(listing.description);
  if (fullRemarks) {
    items.push({
      question: `What should I know about this listing?`,
      answer: buildRemarksPreview(fullRemarks),
      fullAnswer: fullRemarks,
      expandable: true,
    });
  }

  return items;
}

export function buildListingJsonLd(listing, summary) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.fullAddress || listing.address || 'Property listing',
    description: summary || listing.description || undefined,
    url: listing.pageUrl || window.location.href,
    datePosted: new Date().toISOString().split('T')[0],
  };

  if (listing.listingId) {
    schema.identifier = listing.listingId;
  }

  if (listing.price != null) {
    schema.offers = {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'USD',
    };
  }

  if (listing.address || listing.city) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: listing.address || undefined,
      addressLocality: listing.city || undefined,
      addressRegion: listing.state || undefined,
      postalCode: listing.zipcode || undefined,
      addressCountry: 'US',
    };
  }

  if (listing.coordinates?.lat != null && listing.coordinates?.lng != null) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: listing.coordinates.lat,
      longitude: listing.coordinates.lng,
    };
  }

  const residence = {
    '@type': listing.propertySubType?.includes('Detached')
      ? 'SingleFamilyResidence'
      : 'Accommodation',
    name: listing.fullAddress || listing.address,
    numberOfBedrooms: listing.bedrooms ?? undefined,
    numberOfBathroomsTotal: listing.bathrooms ?? undefined,
    floorSize: listing.sqft
      ? { '@type': 'QuantitativeValue', value: listing.sqft, unitCode: 'FTK' }
      : undefined,
    yearBuilt: listing.yearBuilt ?? undefined,
  };

  schema.mainEntity = cleanObject(residence);

  return cleanObject(schema);
}

export function buildFaqJsonLd(faqItems) {
  if (!faqItems.length) return null;

  return cleanObject({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.fullAnswer || item.answer,
      },
    })),
  });
}

export function buildPlaceJsonLd(listing, localInsights) {
  if (!listing.city && !listing.fullAddress) return null;

  const schools = (localInsights.schools || []).map((school) => ({
    '@type': 'School',
    name: school.name,
  }));

  return cleanObject({
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: listing.city ? `${listing.city}, ${listing.state || ''}`.trim() : listing.fullAddress,
    address: listing.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: listing.address,
          addressLocality: listing.city,
          addressRegion: listing.state,
          postalCode: listing.zipcode,
          addressCountry: 'US',
        }
      : undefined,
    geo:
      listing.coordinates?.lat != null
        ? {
            '@type': 'GeoCoordinates',
            latitude: listing.coordinates.lat,
            longitude: listing.coordinates.lng,
          }
        : undefined,
    containsPlace: schools.length ? schools : undefined,
    description: localInsights.demographics?.summary || undefined,
  });
}

function injectJsonLd(id, data) {
  if (!data) return;

  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function injectGeoMarkup({ listing, localInsights, summary, remarksSummary }) {
  const faqItems = buildFaqItems(listing, localInsights, summary, remarksSummary);

  injectJsonLd('idx-listing-insights-listing-schema', buildListingJsonLd(listing, summary));
  injectJsonLd('idx-listing-insights-faq-schema', buildFaqJsonLd(faqItems));
  injectJsonLd('idx-listing-insights-place-schema', buildPlaceJsonLd(listing, localInsights));

  return faqItems;
}
