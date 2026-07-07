function getApiBase(config) {
  if (config.apiBase) return config.apiBase.replace(/\/$/, '');
  return null;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
}

/**
 * Fetch local area insights from the companion API server.
 * The server proxies third-party APIs and keeps API keys off the client.
 */
export async function fetchLocalInsights(listing, config = {}) {
  const apiBase = getApiBase(config);
  if (!apiBase) {
    throw new Error('No API base configured');
  }
  const params = new URLSearchParams();

  if (listing.coordinates?.lat != null && listing.coordinates?.lng != null) {
    params.set('lat', String(listing.coordinates.lat));
    params.set('lng', String(listing.coordinates.lng));
  }

  if (listing.fullAddress) params.set('address', listing.fullAddress);
  if (listing.city) params.set('city', listing.city);
  if (listing.state) params.set('state', listing.state);
  if (listing.zipcode) params.set('zip', listing.zipcode);

  const url = `${apiBase}/api/local-insights?${params.toString()}`;
  return fetchJson(url);
}

function schoolsFromListing(listing) {
  if (listing.schools?.length) {
    return listing.schools.map((school) => ({
      name: school.name,
      level: school.level,
      rating: school.rating ?? null,
      distanceMiles: school.distanceMiles ?? null,
      source: school.source || 'mls',
    }));
  }

  const city = listing.city || 'Nearby';
  return [
    { name: `${city} Elementary`, rating: 8, distanceMiles: 0.6, source: 'demo' },
    { name: `${city} Middle School`, rating: 7, distanceMiles: 1.2, source: 'demo' },
    { name: `${city} High School`, rating: 8, distanceMiles: 2.1, source: 'demo' },
  ];
}

export function getDemoLocalInsights(listing) {
  const city = listing.city || 'this area';
  const schools = schoolsFromListing(listing);
  const hasMlsSchools = schools.some((school) => school.source === 'mls');

  return {
    source: hasMlsSchools ? 'mls+demo' : 'demo',
    location: listing.fullAddress || city,
    walkability: {
      walkScore: 72,
      transitScore: 58,
      bikeScore: 64,
      summary: `Generally walkable neighborhood in ${city} with errands reachable on foot.`,
    },
    weather: {
      currentTempF: 68,
      condition: 'Partly cloudy',
      avgHighF: 78,
      avgLowF: 55,
      summary: 'Mild climate with comfortable year-round temperatures.',
    },
    schools,
    demographics: {
      population: 28400,
      medianAge: 38,
      medianHouseholdIncome: 92500,
      ownerOccupiedPct: 64,
      summary: `Stable residential community around ${city}.`,
    },
    pointsOfInterest: [
      { name: 'Neighborhood Park', category: 'Park', distanceMiles: 0.4 },
      { name: 'Local Market', category: 'Grocery', distanceMiles: 0.8 },
      { name: 'Community Center', category: 'Recreation', distanceMiles: 1.1 },
      { name: 'Coffee Shop', category: 'Dining', distanceMiles: 0.5 },
    ],
  };
}
