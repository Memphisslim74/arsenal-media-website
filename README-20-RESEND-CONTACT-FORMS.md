# Arsenal Media Resend Contact Form Update

This package connects the Arsenal Media contact form to a Cloudflare Pages Function at `/api/contact`, which sends email through Resend.

## Files included

- `functions/api/contact.js` — Cloudflare Pages Function that validates submissions and calls the Resend Email API.
- `contact.html` — updated contact/workflow review form with a few extra qualification fields.
- `contact/index.html` — same contact page for `/contact/` if you use the clean URL.
- `assets/js/contact-forms.js` — client-side form submit handler.
- `assets/css/forms.css` — small form/status styling additions.
- `css/forms.css` — duplicate fallback path.

## Cloudflare variables/secrets to add

Go to Cloudflare Pages → arsenal-media-website → Settings → Variables and Secrets.

Add these for Production and Preview:

1. `RESEND_API_KEY`
   - Type: Secret
   - Value: your Resend API key

2. `CONTACT_TO_EMAIL`
   - Type: Text
   - Value: the email address that should receive form submissions

3. `RESEND_FROM_EMAIL`
   - Type: Text
   - Example: `Arsenal Media <hello@arsenalmediaco.com>`
   - This sender must be allowed/verified in Resend.

## Deploy

Upload the contents of this package to the root of the GitHub repo and commit to `main`.

Cloudflare should deploy automatically.

## Test

After deployment, open:

https://arsenalmediaco.com/contact.html

Submit a test inquiry. If it succeeds, you should see the confirmation message and receive the email at `CONTACT_TO_EMAIL`.

## Security note

Do not put the Resend API key in GitHub or in any HTML/JS file. It must stay in Cloudflare as a Secret.
