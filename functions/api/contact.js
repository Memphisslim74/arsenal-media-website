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

function buildHtmlEmail(fields) {
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
        <h1 style="margin:8px 0 0;font-size:26px;line-height:1.2;">Arsenal Media contact form</h1>
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

function buildTextEmail(fields) {
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

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.RESEND_FROM_EMAIL) {
    return jsonResponse({
      ok: false,
      message: 'The form is almost ready, but email settings are missing. Please contact Arsenal Media directly.'
    }, 500);
  }

  const subjectParts = [fields.project_type, fields.company || fields.name].filter(Boolean);
  const payload = {
    from: env.RESEND_FROM_EMAIL,
    to: [env.CONTACT_TO_EMAIL],
    reply_to: fields.email,
    subject: `New Arsenal Media inquiry: ${subjectParts.join(' - ')}`,
    html: buildHtmlEmail(fields),
    text: buildTextEmail(fields)
  };

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
    console.error('Resend error:', detail);
    return jsonResponse({
      ok: false,
      message: 'The form did not send. Please try again or email Arsenal Media directly.'
    }, 502);
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
