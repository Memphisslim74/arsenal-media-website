# V11 Inner Page Styles Fix

Fixed the issue where inner pages loaded without styling because asset paths had been converted to protocol-relative URLs like `//assets/css/style-v8.css`.

## Updates made

- Replaced protocol-relative local links with root-relative links across all HTML pages.
  - Before: `//assets/css/style-v8.css`
  - After: `/assets/css/style-v8.css`
- Replaced broken local image/script paths like `//assets/...` with `/assets/...`.
- Confirmed `/portfolio/` and `/services/` index pages now use valid stylesheet paths.
- Added clean folder-based routes for these case studies:
  - `/portfolio/curbflow/`
  - `/portfolio/security-dashboard/`
  - `/portfolio/studio-facility/`
  - `/portfolio/video-confessional/`
- Kept clean folder routes for:
  - `/portfolio/mfr-roofing/`
  - `/portfolio/decorative-curbing-landscape/`
  - `/services/custom-app-development/`
  - `/services/contractor-crm-software/`
  - `/services/website-design/`
  - `/services/seo-services/`
- Updated internal links to prefer clean URLs.
- Updated `_redirects` without self-redirect loops.
- Updated `sitemap.xml` to include clean portfolio URLs.
- Ran a local link validation pass against HTML links, scripts, images, stylesheets, and redirect targets.

## Why it broke

A bad path normalization step changed root-relative links from `/assets/...` to `//assets/...`. Browsers treat `//assets/...` as a protocol-relative external domain, not as a local site folder. That prevented CSS and images from loading on inner pages.
