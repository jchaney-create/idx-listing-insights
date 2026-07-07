const MAPS_SCRIPT_ID = 'idx-listing-insights-google-maps';
const POI_TYPES = [
  { type: 'school', label: 'School' },
  { type: 'park', label: 'Park' },
  { type: 'restaurant', label: 'Dining' },
  { type: 'supermarket', label: 'Grocery' },
  { type: 'hospital', label: 'Medical' },
];

let mapsLoaderPromise = null;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (mapsLoaderPromise) return mapsLoaderPromise;

  mapsLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(MAPS_SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps));
      existing.addEventListener('error', reject);
      return;
    }

    const params = new URLSearchParams({
      key: apiKey,
      libraries: 'places',
      callback: 'idxListingInsightsMapsReady',
    });

    window.idxListingInsightsMapsReady = () => {
      resolve(window.google.maps);
    };

    const script = document.createElement('script');
    script.id = MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return mapsLoaderPromise;
}

async function resolveMapCenter(listing, apiKey) {
  if (listing.coordinates?.lat != null && listing.coordinates?.lng != null) {
    return {
      lat: listing.coordinates.lat,
      lng: listing.coordinates.lng,
    };
  }

  const address = listing.fullAddress;
  if (!address) return null;

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', apiKey);

  const response = await fetch(url);
  if (!response.ok) throw new Error('Geocoding request failed');

  const data = await response.json();
  const location = data.results?.[0]?.geometry?.location;
  if (!location) return null;

  return { lat: location.lat, lng: location.lng };
}

function formatPlaceCategory(types = []) {
  const match = POI_TYPES.find(({ type }) => types.includes(type));
  if (match) return match.label;
  return types[0]?.replaceAll('_', ' ') || 'Place';
}

function nearbySearch(map, maps, center, type) {
  return new Promise((resolve) => {
    const service = new maps.places.PlacesService(map);
    service.nearbySearch(
      {
        location: center,
        radius: 4000,
        type,
      },
      (results, status) => {
        if (status !== maps.places.PlacesServiceStatus.OK || !results?.length) {
          resolve([]);
          return;
        }

        resolve(
          results.slice(0, 3).map((place) => ({
            name: place.name,
            category: formatPlaceCategory(place.types),
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng(),
            placeId: place.place_id,
            source: 'google',
          }))
        );
      }
    );
  });
}

async function fetchNearbyPlaces(map, maps, center) {
  const groups = await Promise.all(POI_TYPES.map(({ type }) => nearbySearch(map, maps, center, type)));
  const seen = new Set();
  const places = [];

  for (const group of groups) {
    for (const place of group) {
      const key = place.placeId || `${place.name}-${place.lat}-${place.lng}`;
      if (seen.has(key)) continue;
      seen.add(key);
      places.push(place);
    }
  }

  return places.slice(0, 12);
}

function renderMapFallback(container, message) {
  container.innerHTML = `<p class="ili-muted">${message}</p>`;
}

export async function initListingMap(container, listing, config = {}) {
  const apiKey = config.googleMapsKey;
  if (!apiKey || !container) return null;

  container.innerHTML = '<p class="ili-muted">Loading map…</p>';

  try {
    const maps = await loadGoogleMaps(apiKey);
    const center = await resolveMapCenter(listing, apiKey);

    if (!center) {
      renderMapFallback(container, 'Unable to locate this property on the map.');
      return null;
    }

    container.innerHTML = '';

    const map = new maps.Map(container, {
      center,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    new maps.Marker({
      map,
      position: center,
      title: listing.fullAddress || listing.address || 'Listing',
      zIndex: 999,
    });

    const places = await fetchNearbyPlaces(map, maps, center);

    places.forEach((place) => {
      if (place.lat == null || place.lng == null) return;

      const marker = new maps.Marker({
        map,
        position: { lat: place.lat, lng: place.lng },
        title: place.name,
      });

      const info = new maps.InfoWindow({
        content: `<strong>${place.name}</strong><br>${place.category}`,
      });

      marker.addListener('click', () => info.open({ map, anchor: marker }));
    });

    return places;
  } catch (error) {
    console.warn('[idx-listing-insights] Map failed to load:', error);
    renderMapFallback(container, 'Map unavailable. Check your Google Maps API key.');
    return null;
  }
}

export function isMapEnabled(config) {
  return Boolean(config.googleMapsKey) && config.mapEnabled !== false;
}
