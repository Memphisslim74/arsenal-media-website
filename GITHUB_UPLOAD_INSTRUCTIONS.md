# Arsenal Media GitHub Upload Instructions

## Package 01: Full Site Root

Use this package if your GitHub repo is empty or you want the safest upload.

1. Download the ZIP.
2. Unzip it.
3. Open the unzipped folder.
4. Select everything inside it.
5. Drag the selected files/folders into the GitHub upload page.
6. Commit to the `main` branch.

Do not upload the ZIP itself. GitHub will not unzip it for the website.

## What should be visible in the repo root

You should see files and folders like:

```text
index.html
assets/
services/
portfolio/
blog/
admin/
content/
uploads/
scripts/
package.json
_headers
_redirects
sitemap.xml
robots.txt
```

## Cloudflare Pages build settings

After the GitHub upload, connect the repo to Cloudflare Pages with:

```text
Build command: npm install && npm run build
Build output directory: /
Root directory: /
```

## Blog editor note

The `/admin/` editor shell is included. The login will not work until the free GitHub OAuth / Cloudflare Worker auth piece is configured and the placeholders in `admin/config.yml` are replaced.
