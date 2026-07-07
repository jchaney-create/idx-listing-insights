# Deploy built assets to a CDN

The widget ships as two static files in `dist/`:

- `idx-listing-insights.iife.js`
- `idx-listing-insights.css`

IDX only needs public HTTPS URLs for those files. You do **not** commit `dist/` to git — CI builds it on deploy.

---

## Option A: GitHub Pages (free, recommended)

### 1. Push the repo to GitHub

```bash
cd ~/Projects/idx-listing-insights
git add .
git commit -m "Initial widget scaffold"
gh repo create idx-listing-insights --public --source=. --push
```

Use a private repo if you prefer; GitHub Pages works on private repos too (with a paid or free GitHub plan that includes Pages).

### 2. Enable GitHub Pages

In GitHub: **Settings → Pages → Build and deployment**

- Source: **GitHub Actions**

The included workflow (`.github/workflows/deploy-pages.yml`) runs `npm run build` and publishes `dist/` on every push to `main`.

### 3. Get your CDN URLs

After the first successful deploy, your assets will be at:

```text
https://YOUR-GITHUB-USERNAME.github.io/idx-listing-insights/idx-listing-insights.iife.js
https://YOUR-GITHUB-USERNAME.github.io/idx-listing-insights/idx-listing-insights.css
```

GitHub Pages is backed by a global CDN automatically.

### 4. Paste into IDX

```html
<div id="idx-listing-insights"></div>
<link
  rel="stylesheet"
  href="https://YOUR-GITHUB-USERNAME.github.io/idx-listing-insights/idx-listing-insights.css"
/>
<script
  src="https://YOUR-GITHUB-USERNAME.github.io/idx-listing-insights/idx-listing-insights.iife.js"
  data-container-id="idx-listing-insights"
  data-demo-mode="true"
  data-only-details-pages="true"
></script>
```

Remove `data-demo-mode="true"` once your API server is live.

---

## Option B: Cloudflare Pages (free, custom domain)

Good if you want `https://widgets.yourdomain.com/...`.

1. Push the repo to GitHub (same as above).
2. In [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the repo and set:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 22
4. Deploy. Cloudflare gives you a URL like `https://idx-listing-insights.pages.dev`.
5. Optional: add a custom domain under **Custom domains**.

Asset URLs:

```text
https://idx-listing-insights.pages.dev/idx-listing-insights.iife.js
https://idx-listing-insights.pages.dev/idx-listing-insights.css
```

---

## Option C: Netlify (free, drag-and-drop for quick tests)

Build locally, then upload:

```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

Or connect the GitHub repo in Netlify with build command `npm run build` and publish directory `dist`.

---

## Option D: Your existing website

If you already host a site (WordPress, S3, etc.), upload the two files from `dist/` to any public path:

```bash
npm run build
# upload dist/idx-listing-insights.* to your host
```

Example if your site is `https://homesite.co`:

```text
https://homesite.co/widgets/idx-listing-insights.iife.js
https://homesite.co/widgets/idx-listing-insights.css
```

---

## Updating after changes

1. Edit the widget code.
2. Commit and push to `main` (or redeploy on Cloudflare/Netlify).
3. CI rebuilds `dist/` and publishes new files.

**Cache tip:** when you ship an update, bump the query string in IDX so browsers fetch the new version:

```html
<script src="https://.../idx-listing-insights.iife.js?v=0.1.1"></script>
```

---

## API server (separate from CDN)

The static CDN hosts only the widget JS/CSS. Live weather and walk scores need the Node API in `server/` deployed separately (Render, Railway, Fly.io, etc.). Set `data-api-base` to that URL.

For demo/testing, keep `data-demo-mode="true"` and skip the API entirely.

---

## Checklist

- [ ] `npm run build` succeeds locally
- [ ] Repo on GitHub (or other host connected to CI)
- [ ] Pages/Cloudflare/Netlify deploy green
- [ ] Open JS URL in browser — file downloads/displays (not 404)
- [ ] Paste embed snippet into IDX **Details** subheader
- [ ] View a listing page — widget appears above IDX content
