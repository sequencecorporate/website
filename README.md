# Sequence Corporate V5

Static site for Cloudflare Pages, with a Cloudflare Pages Function contact form.

## Contact form

Route: `POST /api/contact` from `functions/api/contact.js`.
Destination: `Kevin.Maguire@sequencecorporate.life`.
Sender used by the website: `website@sequencecorporate.life`.

Before launch:
1. In Cloudflare Turnstile create a Managed widget for the production domain and copy its public site key into `contact.html`, replacing `YOUR_TURNSTILE_SITE_KEY`.
2. Add the Turnstile secret to the Pages project as the secret/environment variable `TURNSTILE_SECRET_KEY`.
3. In Cloudflare Email Service, configure Email Sending / the required verified destination and sender domain.
4. Create an API token with Email Sending permission and add it to the Pages project as secret `CF_EMAIL_API_TOKEN`.
5. Add the Cloudflare account ID as `CF_ACCOUNT_ID`.
6. Redeploy the Pages project after adding variables.
7. Submit a real test enquiry and confirm it arrives at Kevin.Maguire@sequencecorporate.life and that Reply works to the visitor's address.

Do not commit secret keys or API tokens to GitHub.


V7 additions
------------
- Added privacy.html with a concise sole-trader privacy notice.
- Added a Privacy link to the footer on every page.
- Added an at-point-of-collection privacy link beneath the contact form.
- The contact form remains wired for Cloudflare Pages Functions + Turnstile and still requires account-side keys/secrets before it can send.
