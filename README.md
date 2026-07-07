# IDX Listing Insights

Embeddable widget for **IDX Broker** global subheaders that:

- Parses listing details from the IDX DOM on property pages
- Generates a readable listing summary
- Shows local area insights: walkability, weather, schools, demographics, and nearby places

## Quick start

```bash
npm install
npm run dev
```

Open the Vite dev URL and load `/demo/index.html` to preview the widget against a simulated IDX details page.

Run the optional API server in another terminal:

```bash
cp .env.example .env
npm run server
```

## Embed in IDX Broker

In **Design → Website → Sub-Headers → Global**, switch to HTML mode and paste:

```html
<div id="idx-listing-insights"></div>
<link rel="stylesheet" href="https://YOUR-CDN/dist/idx-listing-insights.css" />
<script
  src="https://YOUR-CDN/dist/idx-listing-insights.iife.js"
  data-container-id="idx-listing-insights"
  data-api-base="https://YOUR-API.example.com"
  data-only-details-pages="true"
></script>
```

### Recommended: Category subheader for Details pages

Instead of the global subheader, use **Categories → Details** so the widget only appears on listing pages.

### Script options

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-container-id` | `idx-listing-insights` | DOM mount point |
| `data-api-base` | `http://localhost:8787` | Local insights API base URL |
| `data-demo-mode` | `false` | Use built-in demo local data |
| `data-only-details-pages` | `true` | Hide widget on non-details IDX pages |

## Build for production

```bash
npm run build
```

Outputs:

- `dist/idx-listing-insights.iife.js`
- `dist/idx-listing-insights.css`

Host these on your CDN or website and reference them from the IDX subheader.

See **[docs/DEPLOY-CDN.md](docs/DEPLOY-CDN.md)** for step-by-step CDN setup (GitHub Pages, Cloudflare Pages, Netlify, or your own site).

## How listing data is parsed

The widget reads common IDX DOM patterns:

- `#IDX-detailsField-{field}` with `.IDX-fieldData`
- Hidden form inputs like `listingID`, `address`, `cityName`, `state`, `zipcode`
- URL patterns such as `/idx/details/`

Templates vary, so inspect your details page with browser dev tools and extend `src/parser.js` if your template uses different selectors.

## Local data APIs

The companion server (`server/index.js`) proxies third-party APIs and keeps keys off the client.

Currently supported:

- **Geocoding** via OpenStreetMap Nominatim (no key)
- **Weather** via OpenWeatherMap (`OPENWEATHER_API_KEY`)
- **Walk/Transit/Bike scores** via Walk Score (`WALKSCORE_API_KEY`)

Placeholder responses are returned for schools, demographics, and POI until you wire additional providers (GreatSchools, Google Places, Census, etc.).

## Project structure

```text
src/
  parser.js      # IDX DOM extraction
  summary.js     # Listing summary generation
  local-info.js  # Local insights fetch layer
  widget.js      # UI rendering
  styles.css     # Widget styles
server/
  index.js       # Optional API proxy
demo/
  index.html     # Local IDX page simulator
```

## Next steps

1. Deploy `dist/` assets to a CDN
2. Deploy the API server (Railway, Fly.io, Render, etc.)
3. Add API keys to `.env`
4. Paste the embed snippet into your IDX Details subheader
5. Extend `server/index.js` with schools, demographics, and POI providers
