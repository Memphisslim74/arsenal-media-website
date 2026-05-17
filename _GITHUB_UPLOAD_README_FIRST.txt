ARSENAL MEDIA GITHUB UPLOAD PACKAGE

YOU ARE AT THE GITHUB UPLOAD PAGE.

1. Unzip this package on your computer.
2. Open the unzipped folder.
3. Select EVERYTHING INSIDE the folder.
4. Drag those files and folders into the GitHub upload page.
5. Do NOT upload this ZIP file itself.
6. Do NOT upload the parent folder itself.
7. Commit the upload to the main branch.

The root of the GitHub repo should show index.html, assets, services, portfolio, blog, admin, content, package.json, _headers, and _redirects.

After this upload, use these Cloudflare Pages build settings:
Build command: npm install && npm run build
Build output directory: /
Root directory: /

The blog editor files are included, but /admin/ login will not work until the GitHub OAuth / Cloudflare Worker auth URL is added to admin/config.yml.
