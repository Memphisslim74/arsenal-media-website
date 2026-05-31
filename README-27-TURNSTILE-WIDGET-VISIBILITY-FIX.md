# 27 Turnstile Widget Visibility Fix

This patch fixes the issue where the contact form required the “Are you human?” check but the Cloudflare Turnstile widget did not appear.

## Files included

- `assets/js/contact-forms.js`
- `assets/css/forms.css`
- `css/forms.css`
- `functions/api/contact.js`
- `_headers`

## What changed

- The contact form script now waits for DOMContentLoaded before scanning forms.
- It inserts a visible “Are you human?” block before the submit area.
- It shows “Loading human verification...” while Turnstile loads.
- If Turnstile is blocked or misconfigured, it shows a visible error in the form instead of silently failing.
- It keeps a MutationObserver running so forms added later are protected too.
- It adds no-cache headers for the contact form JS/CSS so the browser is less likely to keep the old script.

## After upload

1. Upload the contents of this folder to the GitHub repo root.
2. Let Cloudflare deploy.
3. Hard refresh the contact page.
4. Test `/api/contact?config=turnstile` and make sure it returns a `siteKey`.
5. Submit a form.
