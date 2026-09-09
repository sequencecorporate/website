# Sequence Corporate website — V8 launch candidate

Static Sequence Corporate website deployed to Cloudflare Workers with Static Assets.

## Contact form

The contact form posts to `/api/contact`, handled by `worker.js`.

Cloudflare environment/secrets required on the `website` Worker:

- `TURNSTILE_SECRET` — private Turnstile widget secret. Do not commit this value to GitHub.
- `CF_ACCOUNT_ID` — Cloudflare account ID used by Email Sending REST API.
- `CF_EMAIL_API_TOKEN` — API token with Email Sending: Edit permission. Do not commit this value to GitHub.

Public Turnstile site key embedded in `contact.html`:

`0x4AAAAAAEt1tBxW5BlvfXlB`

The server validates Turnstile success, the current deployment hostname, and action `contact` before sending an enquiry email.
