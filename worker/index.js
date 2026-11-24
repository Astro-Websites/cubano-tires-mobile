// Cloudflare Worker for the Cubano Tires site.
// Static pages are served from ./dist (the ASSETS binding). The only route the
// Worker answers itself is POST /api/contact/, the Contact page form:
//   1. checks the Cloudflare Turnstile token with the TURNSTILE_SECRET Worker secret,
//   2. emails the message through Bliss Drive's own mail server (mail.blissdrive.net)
//      to Global Config "Contact Form Email",
//   3. redirects the visitor to the thank you page.
// Worker secrets (Cloudflare dashboard > Workers & Pages > cubano-tires-staging >
// Settings > Variables and Secrets; never commit them):
//   TURNSTILE_SECRET  Turnstile secret key
//   SMTP_USER         full address of the sending mailbox on blissdrive.net
//   SMTP_PASS         that mailbox's password
// Optional plain variables: SMTP_HOST (default mail.blissdrive.net), SMTP_PORT (default 465).
import { WorkerMailer } from 'worker-mailer';
import config from '../src/content/global/config.json';

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

  const field = (key, max = 200) => String(form.get(key) || '').replace(/\r/g, '').trim().slice(0, max);
  const msg = {
    name: field('name').replace(/\n/g, ' '),
    email: field('email'),
    phone: field('phone', 60).replace(/\n/g, ' '),
    message: field('message', 5000),
    subject: field('_subject').replace(/\n/g, ' ') || 'New message from the website contact form',
  };
  if (!msg.name || !/^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/.test(msg.email)) {
    return errorPage(400, 'Please include your name and a valid email.');
  }

  const to = String(config.formEmail || config.email || '').trim();
  if (!to || !env.SMTP_USER || !env.SMTP_PASS) {
    console.log('Contact form email is not set up: missing', !to ? 'formEmail' : 'SMTP_USER/SMTP_PASS');
    return errorPage(500, 'Your message did not go through.');
  }

  try {
    await sendMail(env, to, msg, url.host);
  } catch (err) {
    console.log('Contact form email failed', String(err && err.message ? err.message : err).slice(0, 300));
    return errorPage(502, 'Your message did not go through.');
  }

  return Response.redirect(thankYou, 303);
}

async function sendMail(env, to, msg, site) {
  const port = Number(env.SMTP_PORT || 465);
  const mailer = await WorkerMailer.connect({
    host: env.SMTP_HOST || 'mail.blissdrive.net',
    port,
    secure: port === 465,
    startTls: true,
    credentials: { username: env.SMTP_USER, password: env.SMTP_PASS },
    authType: ['plain', 'login'],
    name: site,
    socketTimeoutMs: 15000,
    responseTimeoutMs: 15000,
  });
  const rows = [
    ['Name', msg.name],
    ['Email', msg.email],
    ['Phone', msg.phone],
    ['Message', msg.message],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v || '-'}`).join('\n') + `\n\nSent from the contact form on ${site}`;
  const html =
    '<table cellpadding="8" style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 15px">' +
    rows
      .map(
        ([k, v]) =>
          `<tr><th align="left" valign="top" style="border: 1px solid #ddd; background: #f5f5f5">${k}</th><td style="border: 1px solid #ddd; white-space: pre-wrap">${escapeHtml(v || '-')}</td></tr>`,
      )
      .join('') +
    `</table><p style="font-family: Arial, sans-serif; font-size: 13px; color: #666">Sent from the contact form on ${escapeHtml(site)}</p>`;
  try {
    await mailer.send({
      from: { name: `${config.siteName || 'Website'} website`, email: env.SMTP_USER },
      to: { email: to },
      reply: { name: msg.name, email: msg.email },
      subject: msg.subject,
      text,
      html,
    });
  } finally {
    try {
      await mailer.close();
    } catch {}
  }
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
