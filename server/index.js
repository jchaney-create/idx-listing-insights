import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json());

async function geocodeAddress({ address, city, state, zip }) {
  const query = [address, city, state, zip].filter(Boolean).join(', ');
  if (!query) return null;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'idx-listing-insights/0.1.0',
      Accept: 'application/json',
    },
  });

  if (!response.ok) return null;
  const results = await response.json();
  if (!results.length) return null;

  return {
    lat: Number(results[0].lat),
    lng: Number(results[0].lon),
    displayName: results[0].display_name,
  };
}

async function fetchWeather({ lat, lng }) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || lat == null || lng == null) {
    return {
      currentTempF: null,
      condition: 'Unavailable',
      avgHighF: null,
      avgLowF: null,
      summary: 'Configure OPENWEATHER_API_KEY for live weather.',
    };
  }

  const currentUrl = new URL('https://api.openweathermap.org/data/2.5/weather');
  currentUrl.searchParams.set('lat', String(lat));
  currentUrl.searchParams.set('lon', String(lng));
  currentUrl.searchParams.set('appid', apiKey);
  currentUrl.searchParams.set('units', 'imperial');

  const response = await fetch(currentUrl);
  if (!response.ok) throw new Error('Weather API request failed');

  const data = await response.json();
  return {
    currentTempF: Math.round(data.main?.temp ?? 0),
    condition: data.weather?.[0]?.description ?? 'Unknown',
    avgHighF: Math.round(data.main?.temp_max ?? data.main?.temp ?? 0),
    avgLowF: Math.round(data.main?.temp_min ?? data.main?.temp ?? 0),
    summary: `Current conditions near the listing: ${data.weather?.[0]?.description ?? 'n/a'}.`,
  };
}

async function fetchWalkScore({ lat, lng, address }) {
  const apiKey = process.env.WALKSCORE_API_KEY;
  if (!apiKey || lat == null || lng == null) {
    return {
      walkScore: null,
      transitScore: null,
      bikeScore: null,
      summary: 'Configure WALKSCORE_API_KEY for live walk/transit/bike scores.',
    };
  }

  const url = new URL('https://api.walkscore.com/score');
  url.searchParams.set('format', 'json');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('address', address || `${lat},${lng}`);
  url.searchParams.set('transit', '1');
  url.searchParams.set('bike', '1');
  url.searchParams.set('wsapikey', apiKey);

  const response = await fetch(url);
  if (!response.ok) throw new Error('Walk Score API request failed');

  const data = await response.json();
  return {
    walkScore: data.walkscore ?? null,
    transitScore: data.transit?.score ?? null,
    bikeScore: data.bike?.score ?? null,
    summary: data.description || 'Walk Score data loaded for this location.',
  };
}

function buildFallbackSchools(city = 'Nearby') {
  return [
    { name: `${city} Elementary`, rating: null, distanceMiles: null, source: 'placeholder' },
    { name: `${city} Middle School`, rating: null, distanceMiles: null, source: 'placeholder' },
    { name: `${city} High School`, rating: null, distanceMiles: null, source: 'placeholder' },
  ];
}

function buildFallbackDemographics(city = 'this area') {
  return {
    population: null,
    medianAge: null,
    medianHouseholdIncome: null,
    ownerOccupiedPct: null,
    summary: `Connect a Census or demographics provider to populate stats for ${city}.`,
  };
}

function buildFallbackPoi() {
  return [
    { name: 'Configure Google Places or similar', category: 'Setup required', distanceMiles: null },
  ];
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/local-insights', async (req, res) => {
  try {
    const address = req.query.address?.toString() ?? '';
    const city = req.query.city?.toString() ?? '';
    const state = req.query.state?.toString() ?? '';
    const zip = req.query.zip?.toString() ?? '';

    let lat = req.query.lat ? Number(req.query.lat) : null;
    let lng = req.query.lng ? Number(req.query.lng) : null;

    if ((lat == null || lng == null) && (address || city || zip)) {
      const geocoded = await geocodeAddress({ address, city, state, zip });
      if (geocoded) {
        lat = geocoded.lat;
        lng = geocoded.lng;
      }
    }

    const [weather, walkability] = await Promise.all([
      fetchWeather({ lat, lng }),
      fetchWalkScore({ lat, lng, address: address || `${city}, ${state} ${zip}`.trim() }),
    ]);

    res.json({
      source: 'server',
      location: address || `${city}, ${state} ${zip}`.trim(),
      coordinates: lat != null && lng != null ? { lat, lng } : null,
      walkability,
      weather,
      schools: buildFallbackSchools(city || 'Nearby'),
      demographics: buildFallbackDemographics(city || 'this area'),
      pointsOfInterest: buildFallbackPoi(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to load local insights' });
  }
});

app.listen(PORT, () => {
  console.log(`idx-listing-insights API listening on http://localhost:${PORT}`);
});
