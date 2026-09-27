const RECIPIENT = "Kevin.Maguire@sequencecorporate.life";
const TURNSTILE_ACTION = "contact";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[c]);
}

function responsePage(title, message, status = 200) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | Sequence Corporate</title><style>body{font-family:Arial,sans-serif;margin:0;color:#253342}main{max-width:720px;margin:10vh auto;padding:32px}h1{color:#173c69}a{color:#173c69}</style></head><body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><p><a href="/contact.html">Back to Contact</a> &nbsp; <a href="/index.html">Home</a></p></main></body></html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=UTF-8",
        "cache-control": "no-store",
      },
    },
  );
}

async function handleContact(request, env) {
  try {
    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const company = String(form.get("company") || "").trim();
    const message = String(form.get("message") || "").trim();
    const honeypot = String(form.get("website") || "").trim();
    const token = String(form.get("cf-turnstile-response") || "").trim();

    // Quietly accept obvious bot submissions so the endpoint reveals nothing useful.
    if (honeypot) {
      return responsePage("Thanks", "Your message has been received.");
    }

    if (
      !name ||
      !email ||
      !message ||
      name.length > 100 ||
      email.length > 200 ||
      company.length > 150 ||
      message.length > 5000
    ) {
      return responsePage(
        "Please check the form",
        "Please complete your name, email address and message.",
        400,
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return responsePage(
        "Please check the form",
        "Please enter a valid email address.",
        400,
      );
    }

    if (!token) {
      return responsePage(
        "Please try again",
        "We could not verify the form submission. Please return to the form and try again.",
        400,
      );
    }

    if (
      !env.TURNSTILE_SECRET ||
      !env.MS_TENANT_ID ||
      !env.MS_CLIENT_ID ||
      !env.MS_CLIENT_SECRET ||
      !env.MS_SENDER_UPN
    ) {
      console.error("Contact form environment is incomplete");
      return responsePage(
        "Contact form not yet configured",
        "The contact form is not available yet. Please try again later.",
        503,
      );
    }

    const verifyBody = new FormData();
    verifyBody.append("secret", env.TURNSTILE_SECRET);
    verifyBody.append("response", token);
    const ip = request.headers.get("CF-Connecting-IP");
    if (ip) verifyBody.append("remoteip", ip);

    const verification = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: verifyBody },
    );
    const verified = await verification.json();
    const requestHostname = new URL(request.url).hostname;

    // A valid token must have been issued on this deployment and for this form.
    if (
      !verified.success ||
      verified.hostname !== requestHostname ||
      verified.action !== TURNSTILE_ACTION
    ) {
      console.error("Turnstile verification failed", {
        success: Boolean(verified.success),
        hostname: verified.hostname,
        action: verified.action,
        errorCodes: verified["error-codes"] || [],
      });
      return responsePage(
        "Please try again",
        "We could not verify the form submission. Please return to the form and try again.",
        400,
      );
    }

    const subject = `Website enquiry from ${name}${company ? ` — ${company}` : ""}`;
    const text = `New Sequence Corporate website enquiry\n\nName: ${name}\nEmail: ${email}\nCompany: ${company || "Not provided"}\n\nMessage:\n${message}`;
    const html = `<h2>New Sequence Corporate website enquiry</h2><p><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Company:</strong> ${escapeHtml(company || "Not provided")}</p><p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`;

    try {
      const tokenBody = new URLSearchParams({
        client_id: env.MS_CLIENT_ID,
        client_secret: env.MS_CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      });

      const tokenResponse = await fetch(
        `https://login.microsoftonline.com/${encodeURIComponent(env.MS_TENANT_ID)}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: tokenBody,
        },
      );

      if (!tokenResponse.ok) {
        const tokenError = await tokenResponse.text();
        console.error("Microsoft token request failed", tokenResponse.status, tokenError);
        throw new Error("Unable to authenticate email service");
      }

      const tokenJson = await tokenResponse.json();
      const accessToken = tokenJson.access_token;
      if (!accessToken) throw new Error("Microsoft token response contained no access token");

      const graphResponse = await fetch(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.MS_SENDER_UPN)}/sendMail`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            message: {
              subject,
              body: { contentType: "HTML", content: html },
              toRecipients: [
                { emailAddress: { address: RECIPIENT } },
              ],
              replyTo: [
                { emailAddress: { address: email, name } },
              ],
            },
            saveToSentItems: true,
          }),
        },
      );

      if (!graphResponse.ok) {
        const graphError = await graphResponse.text();
        console.error("Microsoft Graph sendMail failed", graphResponse.status, graphError);
        throw new Error("Unable to send email");
      }
    } catch (error) {
      console.error("Email send failed", {
        message: error?.message,
      });
      return responsePage(
        "Something went wrong",
        "Your message could not be sent. Please try again later.",
        502,
      );
    }

    return responsePage("Thanks — your message has been sent", "We’ll be in touch.");
  } catch (error) {
    console.error("Contact form error", error);
    return responsePage(
      "Something went wrong",
      "Your message could not be sent. Please try again later.",
      500,
    );
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { Allow: "POST" },
        });
      }
      return handleContact(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
