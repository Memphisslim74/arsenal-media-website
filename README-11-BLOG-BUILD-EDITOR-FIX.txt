PACKAGE 11 - BLOG BUILD + EDITOR FIX

Upload the CONTENTS of this folder to the root of the GitHub repo.

This package intentionally does NOT include package.json or package-lock.json.
Do not add them back right now.

Cloudflare Pages build settings after upload:
Build command: node scripts/build-blog.js
Build output directory: .
Root directory: /

Before deploying, delete these files from the repo if they exist:
- package.json
- package-lock.json

Why:
The blog builder is a zero-dependency Node script. It does not use npm packages.
This prevents Cloudflare from hanging on npm install.

After deploy succeeds, test:
/blog/
/blog/better-contractor-website/
/blog/why-contractors-outgrow-spreadsheets/
/admin/

CMS login:
The admin/config.yml is set to the GitHub repo Memphisslim74/arsenal-media-website.
Sveltia CMS can use GitHub token login for one-person editing.
