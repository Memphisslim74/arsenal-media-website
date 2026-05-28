Upload the contents of this ZIP to the GitHub repo root.

It replaces scripts/build-blog.js, adds assets/css/blog.css, and updates the two sample blog markdown files so they use real existing images.

After committing to main, Cloudflare should rebuild automatically. The build command should remain:
npm run build

Expected result:
- /blog/ uses the same Arsenal Media header/footer styling as the rest of the site
- Blog cards are styled
- Blog featured images load
- Individual blog posts are styled
