# Package 21 — Resend Auto-Reply Email Update

Upload the contents of this folder to the root of the GitHub repo.

## Included

- `functions/api/contact.js`

## What changed

This update keeps the internal Arsenal Media lead notification email and adds a styled confirmation email to the person who submits the form.

The confirmation email includes sales-positioning language around:

- “Most businesses do not have a people problem. They have a visibility problem.”
- “The problem is not always effort. A lot of the time, it is visibility.”
- “We help businesses stop losing track of important things.”
- Customers in email, follow-ups in someone’s head, job updates in texts, and tasks in spreadsheets.

## Cloudflare variables

Required existing variables:

- `RESEND_API_KEY` — Secret
- `CONTACT_TO_EMAIL` — Text
- `RESEND_FROM_EMAIL` — Text, for example `Arsenal Media <hello@arsenalmediaco.com>`

Optional variables:

- `CONTACT_REPLY_TO_EMAIL` — Text, used as the reply-to on the confirmation email. Defaults to `CONTACT_TO_EMAIL`.
- `SITE_URL` — Text, defaults to `https://arsenalmediaco.com`.

## Testing

1. Upload the package to GitHub.
2. Let Cloudflare deploy.
3. Submit the contact form with a real email address you can check.
4. Confirm Arsenal Media receives the internal lead email.
5. Confirm the submitter receives the styled confirmation email.

## Important

The Resend API key should stay only in Cloudflare as a secret. Do not commit the API key to GitHub.
