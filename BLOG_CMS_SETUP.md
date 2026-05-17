# Arsenal Media Blog CMS Notes

This site now has a free Git-based blog workflow.

## Blog content lives here

```text
content/blog/
```

Each blog post is a Markdown file with SEO fields at the top.

## Blog pages are generated here

```text
blog/
```

Cloudflare runs this during deployment:

```bash
npm install && npm run build
```

That command runs:

```bash
node scripts/build-blog.js
```

## Admin editor

The admin editor shell is here:

```text
admin/index.html
admin/config.yml
```

Before `/admin/` login will work, replace these placeholders in `admin/config.yml`:

```yaml
repo: YOUR-GITHUB-USERNAME/arsenal-media-website
base_url: YOUR-AUTH-WORKER-URL
```

The auth worker is the next package/setup step.
