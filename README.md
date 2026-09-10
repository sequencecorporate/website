# Sequence Corporate website – V10

V10 keeps the V9 site and contact form, but sends contact-form enquiries through Microsoft Graph using the existing Microsoft 365 tenant.

Cloudflare Worker runtime values required:

- `TURNSTILE_SECRET` – Secret
- `MS_TENANT_ID` – Secret or plain text variable
- `MS_CLIENT_ID` – Secret or plain text variable
- `MS_CLIENT_SECRET` – Secret
- `MS_SENDER_UPN` – Secret or plain text variable; use the Microsoft 365 mailbox that will send the message, e.g. `Kevin.Maguire@sequencecorporate.life`

The Entra application requires Microsoft Graph **Application** permission `Mail.Send` with admin consent. The Worker uses the OAuth 2.0 client-credentials flow and `POST /users/{MS_SENDER_UPN}/sendMail`.

For least privilege, restrict the application's Exchange Online scope to the intended sender mailbox using Exchange Online Application RBAC.

Do not put the Microsoft client secret or Turnstile secret in GitHub.
