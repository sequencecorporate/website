const RECIPIENT = "Kevin.Maguire@sequencecorporate.life";
const SENDER = "website@sequencecorporate.life";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}

function responsePage(title, message, status = 200) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Sequence Corporate</title><style>body{font-family:Arial,sans-serif;margin:0;color:#253342}main{max-width:720px;margin:10vh auto;padding:32px}h1{color:#173c69}a{color:#173c69}</style></head><body><main><h1>${title}</h1><p>${message}</p><p><a href="/contact.html">Back to Contact</a> &nbsp; <a href="/index.html">Home</a></p></main></body></html>`, {status, headers:{"content-type":"text/html; charset=UTF-8","cache-control":"no-store"}});
}

export async function onRequestPost(context) {
  try {
    const form = await context.request.formData();
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const company = String(form.get("company") || "").trim();
    const message = String(form.get("message") || "").trim();
    const honeypot = String(form.get("website") || "").trim();
    const token = String(form.get("cf-turnstile-response") || "");

    if (honeypot) return responsePage("Thanks", "Your message has been received.");
    if (!name || !email || !message || name.length > 100 || email.length > 200 || company.length > 150 || message.length > 5000) return responsePage("Please check the form", "Please complete your name, email address and message.", 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return responsePage("Please check the form", "Please enter a valid email address.", 400);
    if (!context.env.TURNSTILE_SECRET_KEY || !context.env.CF_ACCOUNT_ID || !context.env.CF_EMAIL_API_TOKEN) return responsePage("Contact form not yet configured", `Please email us at ${RECIPIENT}.`, 503);

    const verifyBody = new FormData();
    verifyBody.append("secret", context.env.TURNSTILE_SECRET_KEY);
    verifyBody.append("response", token);
    const ip = context.request.headers.get("CF-Connecting-IP");
    if (ip) verifyBody.append("remoteip", ip);
    const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {method:"POST", body:verifyBody});
    const verified = await verification.json();
    if (!verified.success) return responsePage("Please try again", "We could not verify the form submission. Please return to the form and try again.", 400);

    const subject = `Website enquiry from ${name}${company ? ` — ${company}` : ""}`;
    const text = `New Sequence Corporate website enquiry\n\nName: ${name}\nEmail: ${email}\nCompany: ${company || "Not provided"}\n\nMessage:\n${message}`;
    const html = `<h2>New Sequence Corporate website enquiry</h2><p><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Company:</strong> ${escapeHtml(company || "Not provided")}</p><p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g,"<br>")}</p>`;

    const send = await fetch(`https://api.cloudflare.com/client/v4/accounts/${context.env.CF_ACCOUNT_ID}/email/sending/send`, {
      method:"POST",
      headers:{"Authorization":`Bearer ${context.env.CF_EMAIL_API_TOKEN}`,"Content-Type":"application/json"},
      body:JSON.stringify({to:RECIPIENT, from:{address:SENDER,name:"Sequence Corporate website"}, replyTo:email, subject, text, html})
    });
    const result = await send.json();
    if (!send.ok || !result.success) {
      console.error("Email send failed", JSON.stringify(result));
      return responsePage("Something went wrong", `Your message could not be sent. Please email us at ${RECIPIENT}.`, 502);
    }
    return responsePage("Thanks — your message has been sent", "We’ll be in touch.");
  } catch (error) {
    console.error(error);
    return responsePage("Something went wrong", `Your message could not be sent. Please email us at ${RECIPIENT}.`, 500);
  }
}

export function onRequestGet() {
  return new Response("Method not allowed", {status:405, headers:{"allow":"POST"}});
}
