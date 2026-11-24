// Cloudflare Worker for the Cubano Tires site.
// Static pages are served from ./dist (the ASSETS binding). The only route the
// Worker answers itself is POST /api/contact/, the Contact page form:
//   1. checks the Cloudflare Turnstile token with the TURNSTILE_SECRET Worker secret,
//   2. returns a short page that posts the message from the visitor's browser to FormSubmit,
//      which emails it to Global Config "Contact Form Email" and shows the thank you page.
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

  const fields = { _captcha: 'false', _next: thankYou };
  for (const key of FIELDS) {
    const value = form.get(key);
    if (typeof value === 'string' && value.trim()) fields[key] = value.trim().slice(0, 5000);
  }
  if (!fields.name || !fields.email) return errorPage(400, 'Please include your name and email.');
  fields._replyto = fields.email;

  // Hand the checked message to FormSubmit from the visitor's own browser.
  // A Worker can't post it itself: every Worker reaches FormSubmit from the same
  // shared Cloudflare address, which FormSubmit rate limits (HTTP 429).
  // The FormSubmit address only appears here, after the bot check has passed.
  return handoffPage(`https://formsubmit.co/${to.replace(/[^\w.@+-]/g, "")}`, fields);
}

function handoffPage(action, fields) {
  const inputs = Object.entries(fields)
    .map(([k, v]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(v)}">`)
    .join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Sending your message</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 64px auto; padding: 0 16px; color: #16181D; line-height: 1.6">
<form id="send" method="POST" action="${escapeHtml(action)}">${inputs}
<p style="font-size: 20px; font-weight: 700">Sending your message...</p>
<noscript><button type="submit" style="min-height: 48px; padding: 0 24px; border: 0; border-radius: 999px; background: #E11B22; color: #fff; font: inherit; font-weight: 800">Send message</button></noscript>
</form>
<script>document.getElementById('send').submit();</script></body></html>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
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
