# Package 28 - Turnstile Force Load Fix

This update fixes the case where the backend requires Cloudflare Turnstile, but the visible widget does not appear on the form.

What changed:
- Replaces `assets/js/contact-forms.js` with a more aggressive v28 loader.
- Updates HTML files to reference `/assets/js/contact-forms.js?v=28` and `/assets/css/forms.css?v=28` so browsers stop using older cached versions.
- Inserts the visible “Are you human?” block directly before each submit button.
- Loads Cloudflare Turnstile dynamically and renders it explicitly.
- Keeps the server-side Turnstile verification in `functions/api/contact.js`.
- Adds no-cache headers for the contact JS/CSS and `/api/contact`.

Upload the contents of this ZIP to the GitHub repo root and commit.
After Cloudflare deploys, hard refresh the page.

Test:
- https://arsenalmediaco.com/api/contact?config=turnstile
- https://arsenalmediaco.com/contact/

In DevTools, you should see a console message like:
`Arsenal Media contact forms v28 Turnstile rendered for form ...`
