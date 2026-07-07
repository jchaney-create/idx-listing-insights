# IDX Staging Embed

Use this snippet in **Design → Website → Sub-Headers → Categories → Details** for the AI redesign template on `homesite.idxstaging.com`.

```html
<div id="idx-listing-insights"></div>
<link rel="stylesheet" href="https://YOUR-CDN/dist/idx-listing-insights.css" />
<script
  src="https://YOUR-CDN/dist/idx-listing-insights.iife.js"
  data-container-id="idx-listing-insights"
  data-api-base="https://YOUR-API.example.com"
  data-only-details-pages="true"
  data-demo-mode="true"
></script>
```

Remove `data-demo-mode="true"` once your API server is deployed.

## What the widget reads on this template

The staging site uses the IDX AI redesign layout. The parser reads:

| Data | DOM source |
|------|------------|
| Address | `#IDX-detailsAddressStreet`, `#IDX-detailsAddressRegion` |
| Listing ID / idxID | `#IDX-saveProperty` data attributes, URL, hidden form fields |
| Price | `.IDX-field-listingPrice .IDX-text`, `window.mortgageCalc.mortPrice` |
| Beds / baths / sqft | `.IDX-field-bedrooms`, `.IDX-field-totalBaths`, `.IDX-field-sqFt` |
| Description | `#IDX-detailsDescription .IDX-clamp__target` |
| Schools | `#IDX-field-elementarySchool`, `#IDX-field-middleOrJuniorSchool`, `#IDX-field-highSchool` |
| County / acres / year | `.IDX-field-countyName`, `.IDX-field-acres`, `.IDX-field-yearBuilt` |
| Fallback | `meta[name="keywords"]`, contact form hidden inputs |

## Test listing

https://homesite.idxstaging.com/idx/details/listing/b004/VAFQ159458

Example listing: 7500 Ironwood Lane, Warrenton, VA 20186 (VAFQ159458)
