const SITE_ORIGIN = 'https://arsenalmediaco.com';

const SOCIAL_PREVIEWS = [
  {
    match: (path) => path === '/' || path === '/index.html',
    title: 'Custom Business Dashboard Development | Arsenal Media',
    description: 'Custom command center dashboards, internal business applications, employee operations dashboards, contractor CRM software, websites, and SEO built around real business workflow.',
    image: '/assets/images/og/home.jpg',
    alt: 'Arsenal Media custom business dashboard and command center preview'
  },
  {
    match: (path) => path.startsWith('/portfolio/operations-training-command-center'),
    title: 'Employee Operations Dashboard & Training Command Center | Arsenal Media',
    description: 'See Arsenal Staff Commander, a white-label employee operations dashboard for approvals, payroll visibility, reports, and training progress.',
    image: '/assets/images/og/portfolio.jpg',
    alt: 'Arsenal Staff Commander employee operations dashboard preview'
  },
  {
    match: (path) => path.startsWith('/demos/operations-command-center'),
    title: 'Arsenal Staff Commander Demo | Arsenal Media',
    description: 'A white-label employee operations command center demo for staff records, approvals, payroll visibility, training, reports, and connected learning.',
    image: '/assets/images/og/portfolio.jpg',
    alt: 'Arsenal Staff Commander demo preview'
  },
  {
    match: (path) => path.startsWith('/portfolio'),
    title: 'Business Command Center Portfolio | Arsenal Media',
    description: 'See custom dashboards, employee operations systems, contractor CRM software, workflow tracking apps, and website projects from Arsenal Media.',
    image: '/assets/images/og/portfolio.jpg',
    alt: 'Arsenal Media portfolio of command center dashboards and website projects'
  },
  {
    match: (path) => path.startsWith('/services'),
    title: 'Custom Dashboards, Websites, and SEO Services | Arsenal Media',
    description: 'Custom dashboard development, internal web applications, contractor CRM software, business websites, and SEO services for service businesses.',
    image: '/assets/images/og/services.jpg',
    alt: 'Arsenal Media services preview for dashboards, websites, and SEO'
  },
  {
    match: (path) => path.startsWith('/about'),
    title: 'About Arsenal Media | Custom Business Dashboards and Websites',
    description: 'Arsenal Media helps businesses stop losing track of customers, tasks, jobs, staff operations, approvals, training, and follow-ups.',
    image: '/assets/images/og/about.jpg',
    alt: 'About Arsenal Media social preview'
  },
  {
    match: (path) => path.startsWith('/contact') || path === '/contact.html',
    title: 'Request a Workflow Review | Arsenal Media',
    description: 'Tell Arsenal Media where your business is losing track of customers, tasks, jobs, approvals, training, or follow-ups.',
    image: '/assets/images/og/contact.jpg',
    alt: 'Contact Arsenal Media social preview'
  },
  {
    match: (path) => path.startsWith('/blog'),
    title: 'Business Dashboard and Workflow Articles | Arsenal Media',
    description: 'Articles about custom business dashboards, contractor CRM software, internal web applications, workflow visibility, websites, and SEO.',
    image: '/assets/images/og/home.jpg',
    alt: 'Arsenal Media blog social preview'
  },
  {
    match: () => true,
    title: 'Arsenal Media | Custom Business Dashboards, Websites, and SEO',
    description: 'Custom business command centers, internal web applications, contractor CRM software, websites, SEO, and workflow visibility systems.',
    image: '/assets/images/og/home.jpg',
    alt: 'Arsenal Media social preview'
  }
];

class RemoveElementHandler {
  element(element) {
    element.remove();
  }
}

class SocialPreviewHandler {
  constructor(preview, url) {
    this.preview = preview;
    this.url = url;
  }

  element(element) {
    const imageUrl = `${SITE_ORIGIN}${this.preview.image}`;
    const tags = `
<meta property="og:title" content="${escapeAttr(this.preview.title)}">
<meta property="og:description" content="${escapeAttr(this.preview.description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${escapeAttr(this.url)}">
<meta property="og:site_name" content="Arsenal Media">
<meta property="og:image" content="${escapeAttr(imageUrl)}">
<meta property="og:image:secure_url" content="${escapeAttr(imageUrl)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeAttr(this.preview.alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttr(this.preview.title)}">
<meta name="twitter:description" content="${escapeAttr(this.preview.description)}">
<meta name="twitter:image" content="${escapeAttr(imageUrl)}">
<meta name="twitter:image:alt" content="${escapeAttr(this.preview.alt)}">
`;
    element.append(tags, { html: true });
  }
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getPreview(pathname) {
  const normalizedPath = pathname.endsWith('/') ? pathname : pathname;
  return SOCIAL_PREVIEWS.find((preview) => preview.match(normalizedPath));
}

function shouldRewrite(request, response) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return false;
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('text/html');
}

export async function onRequest(context) {
  const response = await context.next();
  if (!shouldRewrite(context.request, response)) return response;

  const url = new URL(context.request.url);
  const preview = getPreview(url.pathname);
  const canonicalUrl = `${SITE_ORIGIN}${url.pathname}`;
  const remover = new RemoveElementHandler();

  return new HTMLRewriter()
    .on('meta[property="og:title"]', remover)
    .on('meta[property="og:description"]', remover)
    .on('meta[property="og:type"]', remover)
    .on('meta[property="og:url"]', remover)
    .on('meta[property="og:site_name"]', remover)
    .on('meta[property="og:image"]', remover)
    .on('meta[property="og:image:secure_url"]', remover)
    .on('meta[property="og:image:type"]', remover)
    .on('meta[property="og:image:width"]', remover)
    .on('meta[property="og:image:height"]', remover)
    .on('meta[property="og:image:alt"]', remover)
    .on('meta[name="twitter:card"]', remover)
    .on('meta[name="twitter:title"]', remover)
    .on('meta[name="twitter:description"]', remover)
    .on('meta[name="twitter:image"]', remover)
    .on('meta[name="twitter:image:alt"]', remover)
    .on('head', new SocialPreviewHandler(preview, canonicalUrl))
    .transform(response);
}
