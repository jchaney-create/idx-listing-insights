# GEO (Generative Engine Optimization)

How to make the listing insights widget more discoverable by AI search engines (ChatGPT, Perplexity, Google AI Overviews) and traditional search.

## What the widget now does for GEO

On each listing details page, the widget injects:

1. **JSON-LD structured data** into `<head>`:
   - `RealEstateListing` — price, address, beds/baths, description
   - `FAQPage` — question/answer pairs about the property and neighborhood
   - `Place` — location context and assigned schools

2. **Visible FAQ section** — plain-language Q&A that mirrors the schema (schools, walkability, climate, neighborhood).

3. **Semantic HTML** — `<article>`, `<address>`, microdata attributes, labeled sections.

View on a live listing page:

- **Page source** → search for `idx-listing-insights-listing-schema`
- **Rich Results Test** → https://search.google.com/test/rich-results

## What still limits GEO impact

| Limitation | Why it matters |
|------------|----------------|
| JS-rendered content | Some AI crawlers don't execute JavaScript or deprioritize client-rendered text |
| IDX subheader is static | Same embed HTML on all details pages; per-listing content only appears after JS runs |
| No server-side HTML | Best GEO = listing-specific HTML in the initial response |

Google generally **does** render JavaScript, so JSON-LD injection and FAQ content can help there. Other AI systems vary.

## Recommended next steps (highest impact first)

### 1. Server-rendered GEO bundle (best)

Add an API endpoint that returns listing-specific HTML + JSON-LD from the listing ID/address. Options:

- Deploy `server/` and add `GET /api/geo-html?address=...`
- Use an edge worker in front of IDX pages (if you control the wrapper domain)
- Pre-render at build time for featured listings

AI systems and crawlers that skip JS will then see real content in the HTML response.

### 2. Extend IDX dynamic SEO

IDX already supports dynamic title/meta on details pages. Ensure your wrapper `<head>` includes empty schema tags or placeholders that your widget (or server) fills — or add static Organization/WebSite schema in the global wrapper.

### 3. Richer, factual FAQ content

Expand FAQ generation with:

- Commute times to major employers/landmarks
- Property tax and HOA (from MLS fields)
- Flood zone, zoning (when available in DOM)
- "Who is this home good for?" style answers

### 4. Unique copy per listing

Avoid identical template phrasing across thousands of listings. Pull more from MLS remarks and vary sentence structure so AI systems treat each page as distinct.

### 5. Monitor and iterate

- Google Search Console → performance on details URLs
- Test pages in Perplexity / ChatGPT browse: "Tell me about 7500 Ironwood Lane Warrenton VA"
- Track whether your URLs get cited after schema + FAQ rollout

## Redeploy after GEO changes

```bash
npm run build
# push to gh-pages (see docs/DEPLOY-CDN.md)
```

Bump the cache-buster in your IDX embed:

```html
<script src=".../idx-listing-insights.iife.js?v=0.2.0"></script>
```
