# 26 — Turnstile Spam Protection for Resend Contact Forms

This update adds Cloudflare Turnstile human verification to every Arsenal Media contact form that uses `data-contact-form`.

## Files included

- `functions/api/contact.js`
- `assets/js/contact-forms.js`
- `assets/css/forms.css`
- `css/forms.css`

## What changed

- Adds a visible `Are you human?` check to every contact form automatically.
- Uses Cloudflare Turnstile instead of a traditional CAPTCHA.
- Verifies the Turnstile token server-side before sending anything through Resend.
- Blocks form submissions that do not pass verification.
- Keeps the existing honeypot spam field.
- Keeps the Resend internal notification email and styled customer auto-reply.

## Cloudflare variables to add

Go to:

Cloudflare → Workers & Pages → arsenal-media-website → Settings → Variables and Secrets

Add these to Production and Preview:

### TURNSTILE_SITE_KEY

Type: Text
Value: your public Turnstile site key

### TURNSTILE_SECRET_KEY

Type: Secret
Value: your private Turnstile secret key

Do not put the secret key in GitHub.

## How to create the Turnstile keys

1. In Cloudflare, go to Turnstile.
2. Click Add widget.
3. Widget name: Arsenal Media Contact Forms.
4. Hostnames:
   - arsenalmediaco.com
   - www.arsenalmediaco.com
   - arsenal-media-website.pages.dev
5. Widget mode: Managed.
6. Copy the Site key and Secret key.
7. Add them to the Cloudflare Pages project variables listed above.

## Test after deploying

Open:

https://arsenalmediaco.com/api/contact

You should see JSON showing:

- `TURNSTILE_SITE_KEY: true`
- `TURNSTILE_SECRET_KEY: true`

Then test a form on:

- https://arsenalmediaco.com/
- https://arsenalmediaco.com/contact/
- https://arsenalmediaco.com/services/
- https://arsenalmediaco.com/portfolio/

## Notes

If the human check does not appear, hard refresh the page.

Mac: Cmd + Shift + R
Windows: Ctrl + Shift + R

If the form says the human verification is not configured, check that both Turnstile variables were added to the correct Cloudflare Pages project and to the correct environment.
