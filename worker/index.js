// Cloudflare Worker for the Cubano Tires site.
// Static pages are served from ./dist (the ASSETS binding). The only route the
// Worker answers itself is POST /api/contact/, the Contact page form:
//   1. checks the Cloudflare Turnstile token with the TURNSTILE_SECRET Worker secret,
//   2. forwards the message to FormSubmit, which emails it to Global Config "Contact Form Email",
//   3. redirects the visitor to the thank you page.
// Set the secret with: wrangler secret put TURNSTILE_SECRET (never commit it).
import config from '../src/content/global/config.json';

const FIELDS = ['name', 'email', 'phone', 'message', '_subject', '_template'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.replace(/\/+$/, '') === '/api/contact') return handleContact(request, env, url);
    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request, env, url) {
  if (request.method !== 'POST') return Response.redirect(new URL('/contact/', url).href, 303);

  let form;
  try {
    form = await request.formData();
  } catch {
    return errorPage(400, 'We could not read that message.');
  }

  const thankYou = safeNext(form.get('_next'), url) || new URL('/thank-you/', url).href;

  // Hidden honeypot field: people never fill it, bots often do. Pretend it worked.
  if (String(form.get('_honey') || '').trim()) return Response.redirect(thankYou, 303);

  if (env.TURNSTILE_SECRET) {
    const token = String(form.get('cf-turnstile-response') || '');
    const ok = token && (await verifyTurnstile(token, env.TURNSTILE_SECRET, request.headers.get('CF-Connecting-IP')));
    if (!ok) return Response.redirect(new URL('/contact/?check=failed#message', url).href, 303);
  }

  const to = String(config.formEmail || config.email || '').trim();
  if (!to) return errorPage(500, 'The contact form is not set up yet.');

  const payload = {};
  for (const key of FIELDS) {
    const value = form.get(key);
    if (typeof value === 'string' && value.trim()) payload[key] = value.trim().slice(0, 5000);
  }
  if (!payload.name || !payload.email) return errorPage(400, 'Please include your name and email.');
  payload._captcha = 'false';
  if (payload.email) payload._replyto = payload.email;

  const page = new URL('/contact/', url).href;
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: url.origin, Referer: page },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || String(data.success) !== 'true') {
      console.log('FormSubmit refused the message', res.status, JSON.stringify(data).slice(0, 300));
      return errorPage(502, 'Your message did not go through.');
    }
  } catch (err) {
    console.log('FormSubmit request failed', String(err));
    return errorPage(502, 'Your message did not go through.');
  }

  return Response.redirect(thankYou, 303);
}

async function verifyTurnstile(token, secret, ip) {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = await res.json();
    if (!data.success) console.log('Turnstile check failed', JSON.stringify(data['error-codes'] || []));
    return data.success === true;
  } catch (err) {
    console.log('Turnstile check could not run', String(err));
    return false;
  }
}

// Only allow redirects back to this same site.
function safeNext(value, url) {
  if (typeof value !== 'string' || !value) return '';
  try {
    const next = new URL(value, url);
    return next.origin === url.origin ? next.href : '';
  } catch {
    return '';
  }
}

function errorPage(status, message) {
  const phone = escapeHtml(config.phoneDisplay || '');
  const digits = escapeHtml(config.phoneDigits || '');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Message not sent</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 64px auto; padding: 0 16px; color: #16181D; line-height: 1.6">
<h1 style="font-size: 28px">${escapeHtml(message)}</h1>
<p>Please go back and try again, or call or text us at <a href="tel:${digits}">${phone}</a>.</p>
<p><a href="/contact/">Back to the Contact page</a></p></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' } });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
