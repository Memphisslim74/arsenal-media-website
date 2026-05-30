# Package 24 — Contact API 502 Safety Fix

Upload the contents of this folder to the root of the GitHub repo.

Files included:

- `functions/api/contact.js`
- `assets/js/contact-forms.js`

## What this fixes

The previous contact function returned HTTP `502` when Resend rejected the email request. Cloudflare can display its generic 502 Bad Gateway page for that, which hides the useful Resend error from the form.

This update:

- Stops returning `502` from the function.
- Returns JSON errors instead, so the page can show a readable message.
- Adds a `GET /api/contact` health check.
- Adds an outer try/catch so unexpected Function errors return JSON instead of a generic Cloudflare page whenever possible.
- Improves the front-end form script so it gives a useful error if Cloudflare still returns HTML.

## After upload

1. Let Cloudflare deploy.
2. Visit:

   `https://arsenalmediaco.com/api/contact`

3. You should see JSON like:

```json
{
  "ok": true,
  "endpoint": "/api/contact",
  "config": {
    "RESEND_API_KEY": true,
    "CONTACT_TO_EMAIL": true,
    "RESEND_FROM_EMAIL": true
  }
}
```

If any required value is `false`, add it in Cloudflare Pages → Settings → Variables and Secrets.

Required variables:

- `RESEND_API_KEY` — Secret
- `CONTACT_TO_EMAIL` — Text
- `RESEND_FROM_EMAIL` — Text

Recommended:

- `CONTACT_REPLY_TO_EMAIL` — Text
- `SITE_URL` — Text, usually `https://arsenalmediaco.com`

## Important Resend note

`RESEND_FROM_EMAIL` must use a sender/domain that is allowed by Resend. If you want to send from `hello@arsenalmediaco.com`, verify `arsenalmediaco.com` inside Resend and add the required DNS records.
