# Arsenal Media Resend Contact Form 502 Fix

This package updates the Cloudflare Pages Function at `/api/contact` and improves the front-end form error handling.

## Files included

- `functions/api/contact.js`
- `assets/js/contact-forms.js`
- `contact.html`
- `contact/index.html`

## What changed

- Adds clearer server-side validation for required Cloudflare variables.
- Returns a more useful form error when Resend rejects the email.
- Logs Resend response details to Cloudflare Function logs.
- Keeps the styled submitter auto-reply email.
- Keeps the internal Arsenal Media lead notification email.
- Updates the contact page to load `/assets/js/contact-forms.js?v=23` so the browser does not use the cached older JS file.

## Cloudflare variables required

Set these in Cloudflare Pages → Settings → Variables and Secrets:

- `RESEND_API_KEY` — Secret
- `CONTACT_TO_EMAIL` — Text
- `RESEND_FROM_EMAIL` — Text

Optional:

- `CONTACT_REPLY_TO_EMAIL` — Text
- `SITE_URL` — Text, example: `https://arsenalmediaco.com`

## Important Resend check

`RESEND_FROM_EMAIL` must use a domain verified in Resend.

Example:

`Arsenal Media <hello@arsenalmediaco.com>`

Only works after `arsenalmediaco.com` is verified in Resend for sending.

## Upload instructions

Upload the contents of this unzipped folder to the root of your GitHub repo, commit to `main`, wait for Cloudflare to deploy, then test the form again.
