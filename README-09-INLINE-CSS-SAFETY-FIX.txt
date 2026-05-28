09 INLINE CSS SAFETY FIX

This patch fixes the current "HTML loads but styles do not" issue by adding an inline CSS fallback to the marketing pages and blog-generated pages.

Upload the CONTENTS of this folder to the GitHub repo root, not the ZIP itself.

It includes:
- Updated HTML pages with inline style-v8 fallback
- Updated blog generator that inlines style-v8 and blog.css into generated blog pages
- CSS files in /assets/css and /css
- Updated _headers with explicit CSS content-type rules

Cloudflare settings should stay:
Build command: npm run build
Build output directory: .
Root directory: /

After deployment, hard refresh the preview page.
