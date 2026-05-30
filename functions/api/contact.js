function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalize(value = '') {
  return String(value || '').trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getFirstName(name = '') {
  const first = normalize(name).split(/\s+/)[0];
  return first || 'there';
}

async function readSubmission(request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return await request.json();
  }

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const output = {};
    for (const [key, value] of formData.entries()) {
      output[key] = typeof value === 'string' ? value : value.name;
    }
    return output;
  }

  return {};
}

function emailButton(url, label) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:22px 0 0;">
      <tr>
        <td style="border-radius:999px;background:#c8102e;">
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 20px;border-radius:999px;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:.01em;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

function buildInternalHtmlEmail(fields) {
  const rows = [
    ['Name', fields.name],
    ['Email', fields.email],
    ['Phone', fields.phone],
    ['Company / Organization', fields.company],
    ['Website', fields.website],
    ['Location', fields.location],
    ['Project Type', fields.project_type],
    ['Main Challenge', fields.challenge],
    ['Current Tracking Method', fields.current_system],
    ['Timeline', fields.timeline],
    ['Source Page', fields.source_page]
  ]
    .filter(([, value]) => normalize(value))
    .map(([label, value]) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;width:190px;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:15px;line-height:1.5;">${escapeHtml(value).replaceAll('\n', '<br>')}</td>
      </tr>`)
    .join('');

  return `
  <div style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="max-width:720px;margin:0 auto;padding:28px 16px;">
      <div style="background:#0d0f14;color:#ffffff;border-radius:18px 18px 0 0;padding:24px 28px;">
        <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#f04438;font-weight:800;">New website inquiry</div>
        <h1 style="margin:8px 0 0;font-size:26px;line-height:1.2;color:#ffffff;">Arsenal Media contact form</h1>
      </div>
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 18px 18px;padding:0;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <div style="padding:22px 24px;">
          <div style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px;">Message</div>
          <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:16px;color:#111827;font-size:15px;line-height:1.65;">${escapeHtml(fields.message).replaceAll('\n', '<br>')}</div>
        </div>
      </div>
    </div>
  </div>`;
}

function buildInternalTextEmail(fields) {
  return [
    'New Arsenal Media website inquiry',
    '',
    `Name: ${fields.name}`,
    `Email: ${fields.email}`,
    fields.phone ? `Phone: ${fields.phone}` : '',
    fields.company ? `Company / Organization: ${fields.company}` : '',
    fields.website ? `Website: ${fields.website}` : '',
    fields.location ? `Location: ${fields.location}` : '',
    fields.project_type ? `Project Type: ${fields.project_type}` : '',
    fields.challenge ? `Main Challenge: ${fields.challenge}` : '',
    fields.current_system ? `Current Tracking Method: ${fields.current_system}` : '',
    fields.timeline ? `Timeline: ${fields.timeline}` : '',
    fields.source_page ? `Source Page: ${fields.source_page}` : '',
    '',
    'Message:',
    fields.message
  ].filter(Boolean).join('\n');
}

function buildCustomerHtmlEmail(fields, env) {
  const firstName = getFirstName(fields.name);
  const siteUrl = normalize(env.SITE_URL) || 'https://arsenalmediaco.com';
  const reviewUrl = `${siteUrl.replace(/\/$/, '')}/contact.html`;
  const projectType = normalize(fields.project_type) || 'your request';
  const challenge = normalize(fields.challenge) || 'the workflow issue you shared';
  const currentSystem = normalize(fields.current_system) || 'your current process';

  return `
  <div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#15171d;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Your team is not slow. Your information may just be scattered. Arsenal Media received your workflow review request.
    </div>
    <div style="max-width:680px;margin:0 auto;padding:30px 16px;">
      <div style="background:#0d0f14;border-radius:24px 24px 0 0;padding:30px 28px;color:#ffffff;border-bottom:5px solid #c8102e;">
        <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#ff5a5f;font-weight:900;margin-bottom:12px;">Arsenal Media</div>
        <h1 style="margin:0;font-size:30px;line-height:1.12;letter-spacing:-.03em;color:#ffffff;">Your request made it through.</h1>
        <p style="margin:14px 0 0;color:#d5d9e2;font-size:16px;line-height:1.65;">Thanks, ${escapeHtml(firstName)}. I’ll review what you sent and look for the places where time, follow-ups, and visibility may be getting lost.</p>
      </div>

      <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 24px 24px;overflow:hidden;">
        <div style="padding:28px;">
          <div style="background:#fff5f5;border:1px solid #ffd4d4;border-radius:18px;padding:18px 20px;margin-bottom:24px;">
            <p style="margin:0;color:#111827;font-size:18px;line-height:1.55;font-weight:850;">Most businesses do not have a people problem. They have a visibility problem.</p>
            <p style="margin:8px 0 0;color:#4b5563;font-size:15px;line-height:1.65;">Customers end up in email. Follow-ups live in someone’s head. Job updates hide in texts. Tasks sit in spreadsheets. Eventually, the owner becomes the dashboard.</p>
          </div>

          <p style="margin:0 0 18px;color:#222733;font-size:16px;line-height:1.72;">I received your request about <strong>${escapeHtml(projectType)}</strong>. You mentioned <strong>${escapeHtml(challenge)}</strong>, and your current setup looks like <strong>${escapeHtml(currentSystem)}</strong>.</p>

          <p style="margin:0 0 20px;color:#222733;font-size:16px;line-height:1.72;">That is exactly the kind of thing a workflow review is meant to uncover. The goal is not to throw more software at the problem. The goal is to figure out where the process is scattered, where the next step gets missed, and what your team needs to see in one place.</p>

          <div style="border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;margin:24px 0;background:#fafafa;">
            <div style="padding:14px 18px;background:#111827;color:#ffffff;font-weight:900;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">What I’ll be looking for</div>
            <div style="padding:18px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0;color:#c8102e;font-weight:900;width:26px;vertical-align:top;">•</td>
                  <td style="padding:8px 0;color:#283040;font-size:15px;line-height:1.55;">Where customer requests, jobs, tasks, or follow-ups are being tracked today</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#c8102e;font-weight:900;width:26px;vertical-align:top;">•</td>
                  <td style="padding:8px 0;color:#283040;font-size:15px;line-height:1.55;">Where information is spread across email, texts, spreadsheets, or disconnected tools</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#c8102e;font-weight:900;width:26px;vertical-align:top;">•</td>
                  <td style="padding:8px 0;color:#283040;font-size:15px;line-height:1.55;">What your team needs to see quickly: open, assigned, overdue, waiting, and completed</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#c8102e;font-weight:900;width:26px;vertical-align:top;">•</td>
                  <td style="padding:8px 0;color:#283040;font-size:15px;line-height:1.55;">Whether a simple business command center could help your team respond faster</td>
                </tr>
              </table>
            </div>
          </div>

          <p style="margin:0;color:#222733;font-size:16px;line-height:1.72;"><strong>The problem is not always effort. A lot of the time, it is visibility.</strong> Once everyone can see what is open, who owns it, and what needs to happen next, the business usually starts to feel lighter.</p>

          ${emailButton(reviewUrl, 'Visit Arsenal Media')}
        </div>

        <div style="background:#0d0f14;color:#ffffff;padding:24px 28px;">
          <p style="margin:0;color:#f5f5f5;font-size:16px;line-height:1.65;font-weight:800;">We help businesses stop losing track of important things.</p>
          <p style="margin:8px 0 0;color:#cbd5e1;font-size:14px;line-height:1.7;">Custom command center dashboards, contractor CRM tools, workflow tracking systems, business websites, and SEO support built around the way your team actually works.</p>
          <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">Arsenal Media · Fort Collins, Colorado · Serving Northern Colorado and service-based businesses anywhere</p>
        </div>
      </div>
    </div>
  </div>`;
}

function buildCustomerTextEmail(fields) {
  const firstName = getFirstName(fields.name);
  return [
    `Thanks, ${firstName}. Your request made it through.`,
    '',
    'Most businesses do not have a people problem. They have a visibility problem.',
    '',
    'Customers end up in email. Follow-ups live in someone’s head. Job updates hide in texts. Tasks sit in spreadsheets. Eventually, the owner becomes the dashboard.',
    '',
    `I received your request about: ${fields.project_type || 'your request'}`,
    fields.challenge ? `Main issue: ${fields.challenge}` : '',
    fields.current_system ? `Current setup: ${fields.current_system}` : '',
    '',
    'I’ll review what you sent and look for where time, follow-ups, and visibility may be getting lost.',
    '',
    'The problem is not always effort. A lot of the time, it is visibility.',
    '',
    'Arsenal Media helps businesses stop losing track of important things with custom command center dashboards, contractor CRM tools, workflow tracking systems, business websites, and SEO support.',
    '',
    'https://arsenalmediaco.com'
  ].filter(Boolean).join('\n');
}

function publicResendErrorMessage(detail = '') {
  const text = String(detail || '').toLowerCase();

  if (text.includes('domain') && (text.includes('verified') || text.includes('not found') || text.includes('not registered'))) {
    return 'The form reached the server, but Resend rejected the sender address. Check that RESEND_FROM_EMAIL uses a verified Resend domain.';
  }

  if (text.includes('api key') || text.includes('unauthorized') || text.includes('invalid api')) {
    return 'The form reached the server, but the Resend API key was rejected. Check the RESEND_API_KEY secret in Cloudflare.';
  }

  if (text.includes('from')) {
    return 'The form reached the server, but the sender email is not accepted by Resend. Check RESEND_FROM_EMAIL in Cloudflare.';
  }

  if (text.includes('to') || text.includes('recipient')) {
    return 'The form reached the server, but the recipient email was not accepted. Check CONTACT_TO_EMAIL in Cloudflare.';
  }

  return 'The form reached the server, but the email service rejected it. Check the Resend domain, sender email, and Cloudflare variables.';
}

function validateEmailConfig(env) {
  const missing = [];
  if (!env.RESEND_API_KEY) missing.push('RESEND_API_KEY');
  if (!env.CONTACT_TO_EMAIL) missing.push('CONTACT_TO_EMAIL');
  if (!env.RESEND_FROM_EMAIL) missing.push('RESEND_FROM_EMAIL');
  return missing;
}

async function sendResendEmail(env, payload) {
  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!resendResponse.ok) {
    const detail = await resendResponse.text();
    const error = new Error(detail || 'Resend email failed');
    error.status = resendResponse.status;
    error.publicMessage = publicResendErrorMessage(detail);
    error.detail = detail;
    throw error;
  }

  return resendResponse.json();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let submission;
  try {
    submission = await readSubmission(request);
  } catch (error) {
    return jsonResponse({ ok: false, message: 'The form could not be read. Please try again.' }, 400);
  }

  // Honeypot field. Real users should never fill this in.
  if (normalize(submission.website_url || submission.company_url_hidden || submission._gotcha)) {
    return jsonResponse({ ok: true, message: 'Thanks. Your request has been sent.' });
  }

  const fields = {
    name: normalize(submission.name),
    email: normalize(submission.email).toLowerCase(),
    phone: normalize(submission.phone),
    company: normalize(submission.company),
    website: normalize(submission.website),
    location: normalize(submission.location),
    project_type: normalize(submission.project_type),
    challenge: normalize(submission.challenge),
    current_system: normalize(submission.current_system),
    timeline: normalize(submission.timeline),
    message: normalize(submission.message),
    source_page: normalize(submission.source_page || request.headers.get('referer') || 'Website contact form')
  };

  const errors = [];
  if (!fields.name) errors.push('Please enter your name.');
  if (!fields.email || !isValidEmail(fields.email)) errors.push('Please enter a valid email address.');
  if (!fields.project_type) errors.push('Please choose the type of help you need.');
  if (!fields.message || fields.message.length < 12) errors.push('Please add a little more detail about what you need help with.');

  if (errors.length) {
    return jsonResponse({ ok: false, message: errors[0], errors }, 400);
  }

  const missingConfig = validateEmailConfig(env);
  if (missingConfig.length) {
    console.error('Missing contact form environment variables:', missingConfig.join(', '));
    return jsonResponse({
      ok: false,
      message: `The form is almost ready, but email settings are missing: ${missingConfig.join(', ')}.`
    }, 500);
  }

  const subjectParts = [fields.project_type, fields.company || fields.name].filter(Boolean);
  const internalPayload = {
    from: env.RESEND_FROM_EMAIL,
    to: [env.CONTACT_TO_EMAIL],
    reply_to: fields.email,
    subject: `New Arsenal Media inquiry: ${subjectParts.join(' - ')}`,
    html: buildInternalHtmlEmail(fields),
    text: buildInternalTextEmail(fields)
  };

  try {
    await sendResendEmail(env, internalPayload);
  } catch (error) {
    console.error('Resend internal notification error:', error.status || '', error.message);
    if (error.detail) console.error('Resend detail:', error.detail);
    return jsonResponse({
      ok: false,
      message: error.publicMessage || 'The form did not send because the email service rejected it. Please try again shortly.'
    }, 502);
  }

  const customerPayload = {
    from: env.RESEND_FROM_EMAIL,
    to: [fields.email],
    reply_to: env.CONTACT_REPLY_TO_EMAIL || env.CONTACT_TO_EMAIL,
    subject: 'Your Arsenal Media workflow review request made it through',
    html: buildCustomerHtmlEmail(fields, env),
    text: buildCustomerTextEmail(fields)
  };

  try {
    await sendResendEmail(env, customerPayload);
  } catch (error) {
    // Do not fail the form if the internal lead email succeeded but the confirmation email had an issue.
    console.error('Resend customer confirmation error:', error.message);
  }

  return jsonResponse({
    ok: true,
    message: 'Thanks. Your request was sent. I will review the details and follow up soon.'
  });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') {
    return onRequestPost(context);
  }

  return jsonResponse({ ok: false, message: 'Method not allowed.' }, 405);
}
