const fs = require("fs");
const path = require("path");

const root = process.cwd();
const postsDir = path.join(root, "content", "blog");
const blogDir = path.join(root, "blog");

function readCss(relativePath) {
  try {
    return fs.readFileSync(path.join(root, relativePath), "utf8").replace(/<\/style>/gi, "<\\/style>");
  } catch (error) {
    return "";
  }
}

const inlineMainCss = readCss("assets/css/style-v8.css");
const inlineBlogCss = readCss("assets/css/blog.css");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseYamlValue(value) {
  const trimmed = String(value || "").trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontMatter(raw) {
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: raw };

  const yaml = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).trim();
  const data = {};
  let activeListKey = null;

  for (const line of yaml.split(/\r?\n/)) {
    if (!line.trim()) continue;

    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && activeListKey) {
      data[activeListKey].push(parseYamlValue(listMatch[1]));
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
    if (!keyMatch) continue;

    const key = keyMatch[1];
    const value = keyMatch[2];

    if (value === "") {
      data[key] = [];
      activeListKey = key;
    } else {
      data[key] = parseYamlValue(value);
      activeListKey = null;
    }
  }

  return { data, body };
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let list = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      html.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      html.push(`<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushParagraph();
      flushList();
      html.push(`<h2>${inlineMarkdown(trimmed.slice(2))}</h2>`);
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph();
      list.push(trimmed.slice(2));
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  return html.join("\n");
}

function siteHead({ title, description, canonical, type = "website", image = "/assets/images/og/home.jpg" }) {
  const fullImage = image.startsWith("http") ? image : `https://arsenalmediaco.com${image}`;
  return `<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1" name="viewport"/>
<title>${escapeHtml(title)}</title>
<meta content="${escapeHtml(description)}" name="description"/>
<meta content="index, follow, max-image-preview:large" name="robots"/>
<meta content="Arsenal Media" name="author"/>
<link href="${escapeHtml(canonical)}" rel="canonical"/>
<meta content="${escapeHtml(title)}" property="og:title"/>
<meta content="${escapeHtml(description)}" property="og:description"/>
<meta content="${type}" property="og:type"/>
<meta content="${escapeHtml(canonical)}" property="og:url"/>
<meta content="Arsenal Media" property="og:site_name"/>
<meta content="${escapeHtml(fullImage)}" property="og:image"/>
<meta content="summary_large_image" name="twitter:card"/>
<meta content="${escapeHtml(title)}" name="twitter:title"/>
<meta content="${escapeHtml(description)}" name="twitter:description"/>
<meta content="${escapeHtml(fullImage)}" name="twitter:image"/>
<link href="/assets/css/style-v8.css?v=14" rel="stylesheet"/>
<link href="/css/style-v8.css?v=14" rel="stylesheet"/>
<link href="/assets/css/blog.css?v=25" rel="stylesheet"/>
<link href="/css/blog.css?v=25" rel="stylesheet"/>
<link href="/assets/css/forms.css?v=25" rel="stylesheet"/>
<link href="/css/forms.css?v=25" rel="stylesheet"/>
${inlineMainCss ? `<style id="am-inline-style-v8">${inlineMainCss}</style>` : ""}
${inlineBlogCss ? `<style id="am-inline-blog-css">${inlineBlogCss}</style>` : ""}
</head>`;
}

function siteHeader(active = "blog") {
  return `<a class="skip" href="#main">Skip to content</a>
<header class="siteHeader">
  <div class="container nav">
    <a aria-label="Arsenal Media home" class="brand" href="/"><img alt="Arsenal Media" src="/assets/arsenal-command-logo.webp"/></a>
    <button aria-expanded="false" class="menuBtn" data-menu="">Menu</button>
    <nav aria-label="Main navigation" class="navLinks" data-nav="">
      <a class="${active === "home" ? "active" : ""}" href="/">Home</a>
      <a class="${active === "services" ? "active" : ""}" href="/services/">Services</a>
      <a class="${active === "portfolio" ? "active" : ""}" href="/portfolio/">Portfolio</a>
      <a class="${active === "blog" ? "active" : ""}" href="/blog/">Blog</a>
      <a class="" href="/about.html">About</a>
      <a class="" href="/contact.html">Contact</a>
      <a class="navCta" href="/contact.html">Start a Project</a>
    </nav>
  </div>
</header>`;
}

function siteFooter() {
  return `<div class="mobileCta"><a class="btn primary" href="/contact.html">Start a Project</a></div>
<footer class="footer">
  <div class="container footerGrid">
    <div>
      <div class="footerBrand"><img alt="Arsenal Media logo" src="/assets/arsenal-command-logo.webp"/></div>
      <p>Arsenal Media builds custom business apps, contractor CRM software, business websites, SEO pages, and brand creative for service businesses in Fort Collins and across the Northern Colorado Front Range.</p>
      <p class="footerSmall">From Fort Collins, Loveland, Windsor, Greeley, Longmont, Boulder, and Denver to teams in Larimer County, Weld County, Boulder County, and the surrounding Front Range counties, we help Northern Colorado contractors turn messy workflows into cleaner systems.</p>
      <p class="footerSmall"><a href="/contact.html">Need a practical app or website in the Northern Colorado? Start a project.</a></p>
    </div>
    <div class="footerLinks">
      <a href="/services/">Services</a>
      <a href="/services/custom-app-development/">Custom App Development</a>
      <a href="/services/contractor-crm-software/">Contractor CRM Software</a>
      <a href="/services/website-design/">Website Design</a>
      <a href="/services/seo-services/">SEO Services</a>
      <a href="/portfolio/">Portfolio</a>
      <a href="/portfolio/mfr-roofing/">MFR Roofing App</a>
      <a href="/portfolio/decorative-curbing-landscape/">Decorative Curbing</a>
      <a href="/contact.html">Contact</a>
    </div>
  </div>
  <div class="container subfooter">© 2026 Arsenal Media Co. Custom apps, websites, SEO, and brand creative for service businesses.</div>
</footer>
<script src="/assets/js/main.js"></script>
<script src="/assets/js/contact-forms.js?v=25"></script>`;
}


function blogCompactForm(pageLabel, n) {
  return `
<!-- AM FORM SLOT: QUICK-${n} -->
<section class="section white inlineLeadSection" aria-labelledby="blog-quick-form-${n}">
  <div class="container inlineLeadWrap">
    <div class="inlineLeadCopy">
      <span class="eyebrow">Quick workflow check</span>
      <h2 id="blog-quick-form-${n}">Where is the work getting hard to track?</h2>
      <p>Most businesses do not have a people problem. They have a visibility problem. Send the quick version and I’ll look for where customers, tasks, jobs, or follow-ups are getting scattered.</p>
    </div>
    <form class="contactBox amLeadForm amLeadFormCompact" action="/api/contact" method="post" data-contact-form>
      <div class="formGrid miniFormGrid">
        <div class="field"><label>Name</label><input name="name" placeholder="Your name" autocomplete="name" required></div>
        <div class="field"><label>Email</label><input name="email" type="email" placeholder="you@example.com" autocomplete="email" required></div>
        <div class="field"><label>Company</label><input name="company" placeholder="Business name" autocomplete="organization"></div>
        <div class="field"><label>What do you need help with?</label><select name="project_type" required><option value="">Choose the closest fit</option><option>Workflow review / business command center</option><option>Custom web application or dashboard</option><option>Contractor CRM or customer tracking system</option><option>Work order, request, or task tracking</option><option>Business website or landing page</option><option>SEO and content strategy</option><option>Not sure yet</option></select></div>
        <div class="field full"><label>What is falling through the cracks?</label><textarea name="message" placeholder="Example: follow-ups live in texts, jobs are hard to track, or I need better visibility across the team." required></textarea></div>
        <input type="hidden" name="source_page" value="${escapeHtml(pageLabel)} — blog quick workflow form">
        <div class="hpField" aria-hidden="true"><label>Leave this field empty</label><input name="website_url" tabindex="-1" autocomplete="off"></div>
        <button class="btn primary" type="submit">Send Quick Review</button>
        <p class="formStatus" data-form-message role="status" aria-live="polite"></p>
      </div>
    </form>
  </div>
</section>
<!-- /AM FORM SLOT: QUICK-${n} -->`;
}

function blogReviewForm(pageLabel, n) {
  return `
<!-- AM FORM SLOT: REVIEW-${n} -->
<section class="section dark bottomLeadSection" aria-labelledby="blog-review-form-${n}">
  <div class="container bottomLeadGrid">
    <div class="bottomLeadCopy">
      <span class="eyebrow">Request a Workflow Review</span>
      <h2 id="blog-review-form-${n}">Ready to stop losing track of important things?</h2>
      <p>Tell me how your business currently tracks customers, tasks, requests, jobs, and follow-ups. I’ll review the workflow and point you toward the simplest next step.</p>
      <ul class="leadBullets"><li>Find where follow-ups are being missed.</li><li>See what should live in one command center.</li><li>Decide whether you need an app, CRM, website, SEO plan, or smaller first step.</li></ul>
    </div>
    <form class="contactBox amLeadForm amLeadFormDark" action="/api/contact" method="post" data-contact-form>
      <div class="formHeader compactHeader"><h3>Start with a few details</h3><p>No hard sales pitch. Just a practical review of where the system is scattered.</p></div>
      <div class="formGrid reviewFormGrid">
        <div class="field"><label>Name</label><input name="name" placeholder="Your name" autocomplete="name" required></div>
        <div class="field"><label>Email</label><input name="email" type="email" placeholder="you@example.com" autocomplete="email" required></div>
        <div class="field"><label>Company</label><input name="company" placeholder="Business name" autocomplete="organization"></div>
        <div class="field"><label>Phone <span>(optional)</span></label><input name="phone" type="tel" placeholder="Best number" autocomplete="tel"></div>
        <div class="field"><label>Location</label><input name="location" placeholder="Fort Collins, Loveland, Denver, etc." autocomplete="address-level2"></div>
        <div class="field"><label>Timeline</label><select name="timeline"><option value="">Choose one</option><option>As soon as possible</option><option>Within 30 days</option><option>1–3 months</option><option>Planning ahead</option></select></div>
        <div class="field wide"><label>What kind of help do you need?</label><select name="project_type" required><option value="">Choose the closest fit</option><option>Workflow review / business command center</option><option>Custom web application or dashboard</option><option>Contractor CRM or customer tracking system</option><option>Work order, request, or task tracking</option><option>Business website or landing page</option><option>SEO and content strategy</option><option>Not sure yet</option></select></div>
        <div class="field wide"><label>Biggest issue right now</label><select name="challenge"><option value="">Choose one if it fits</option><option>We are missing customer follow-ups</option><option>Jobs, requests, or tasks are hard to track</option><option>Too much is spread across texts, emails, and spreadsheets</option><option>The owner or manager is constantly chasing updates</option><option>Our website is not explaining or selling clearly</option><option>We need better local SEO and lead flow</option><option>Other / not sure yet</option></select></div>
        <div class="field full"><label>What are you using now?</label><input name="current_system" placeholder="Spreadsheets, email, texts, Jobber, HubSpot, Monday, whiteboard, etc."></div>
        <div class="field full"><label>What are you trying to improve?</label><textarea name="message" placeholder="A few sentences is enough. Tell me what is hard to track, where follow-ups get missed, or what you want the website/app to do better." required></textarea></div>
        <input type="hidden" name="source_page" value="${escapeHtml(pageLabel)} — blog workflow review form">
        <div class="hpField" aria-hidden="true"><label>Leave this field empty</label><input name="website_url" tabindex="-1" autocomplete="off"></div>
        <button class="btn primary" type="submit">Request Workflow Review</button>
        <p class="formStatus" data-form-message role="status" aria-live="polite"></p>
      </div>
    </form>
  </div>
</section>
<!-- /AM FORM SLOT: REVIEW-${n} -->`;
}

function pageShell({ title, description, canonical, type, image, content, jsonLd = "" }) {
  const head = siteHead({ title, description, canonical, type, image }).replace("</head>", `${jsonLd}\n</head>`);
  return `<!DOCTYPE html>
<html lang="en">
${head}
<body>
${siteHeader("blog")}
<main id="main">
${content}
</main>
${siteFooter()}
</body>
</html>`;
}

ensureDir(postsDir);
ensureDir(blogDir);

const files = fs.readdirSync(postsDir).filter((file) => file.endsWith(".md"));

const posts = files
  .map((file) => {
    const fullPath = path.join(postsDir, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    const parsed = parseFrontMatter(raw);
    return {
      ...parsed.data,
      body: parsed.body,
      html: markdownToHtml(parsed.body),
      source: file
    };
  })
  .filter((post) => post.draft !== true)
  .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

for (const post of posts) {
  const slug = post.slug || post.source.replace(/\.md$/, "");
  const postDir = path.join(blogDir, slug);
  ensureDir(postDir);

  const title = post.seo_title || post.title || "Arsenal Media Blog";
  const description = post.seo_description || post.excerpt || "Practical notes from Arsenal Media.";
  const canonical = `https://arsenalmediaco.com/blog/${slug}/`;
  const image = post.featured_image || "/assets/images/og/home.jpg";
  const author = post.author || "Arsenal Media";
  const displayDate = post.date || "";

  const jsonLd = `
<script type="application/ld+json">
${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title || title,
    "description": description,
    "image": image.startsWith("http") ? image : `https://arsenalmediaco.com${image}`,
    "author": { "@type": "Person", "name": author },
    "publisher": { "@type": "Organization", "name": "Arsenal Media", "logo": { "@type": "ImageObject", "url": "https://arsenalmediaco.com/assets/arsenal-command-logo.webp" } },
    "datePublished": displayDate,
    "dateModified": displayDate,
    "mainEntityOfPage": canonical
  }, null, 2)}
</script>`;

  const postHtml = pageShell({
    title,
    description,
    canonical,
    type: "article",
    image,
    jsonLd,
    content: `
<section class="pageHero blogArticleHero">
  <div class="container">
    <div class="breadcrumb"><a href="/">Home</a> / <a href="/blog/">Blog</a></div>
    <span class="kicker">Arsenal Media Blog</span>
    <h1>${escapeHtml(post.title || title)}</h1>
    <p class="lede">${escapeHtml(post.excerpt || description)}</p>
    <p class="blogMeta">${escapeHtml(displayDate)} · ${escapeHtml(author)}</p>
  </div>
</section>

${blogCompactForm(post.title || title, 1)}
<section class="section white">
  <div class="container blogArticleLayout">
    <article class="blogPostPanel">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(post.image_alt || post.title || title)}" class="articleHeroImage" loading="eager"/>` : ""}
      <div class="prose">
        ${post.html}
      </div>
      <div class="blogPostActions">
        <a class="btn secondary" href="/blog/">Back to Blog</a>
        <a class="btn primary" href="/contact.html">Talk About a Project</a>
      </div>
    </article>
    <aside class="blogAside">
      <div class="asideCard">
        <h3>Need a better system?</h3>
        <p>Arsenal Media builds practical apps, contractor CRM tools, service business websites, and SEO pages for teams that need cleaner workflows.</p>
        <a class="btn primary" href="/contact.html">Start a Project</a>
      </div>
    </aside>
  </div>
</section>
${blogReviewForm(post.title || title, 2)}`
  });

  fs.writeFileSync(path.join(postDir, "index.html"), postHtml);
}

const cards = posts
  .map((post) => {
    const slug = post.slug || post.source.replace(/\.md$/, "");
    const image = post.featured_image || "/assets/images/og/home.jpg";
    return `
<article class="blogCard card">
  <a href="/blog/${escapeHtml(slug)}/" class="blogCardImageLink">
    <img src="${escapeHtml(image)}" alt="${escapeHtml(post.image_alt || post.title || "Arsenal Media blog post image")}" loading="lazy"/>
  </a>
  <div class="body">
    <p class="eyebrow">${escapeHtml(post.date || "")}</p>
    <h2><a href="/blog/${escapeHtml(slug)}/">${escapeHtml(post.title || "Untitled Post")}</a></h2>
    <p>${escapeHtml(post.excerpt || post.seo_description || "")}</p>
    <a class="btn secondary" href="/blog/${escapeHtml(slug)}/">Read Article</a>
  </div>
</article>`;
  })
  .join("\n");

const indexHtml = pageShell({
  title: "Blog | Arsenal Media",
  description: "Articles about custom apps, contractor software, websites, SEO, and business systems from Arsenal Media.",
  canonical: "https://arsenalmediaco.com/blog/",
  type: "website",
  image: "/assets/images/og/home.jpg",
  content: `
<section class="pageHero blogIndexHero">
  <div class="container">
    <div class="breadcrumb"><a href="/">Home</a> / Blog</div>
    <span class="kicker">Arsenal Media Blog</span>
    <h1>Practical notes on apps, websites, SEO, and business systems.</h1>
    <p class="lede">Ideas for contractors and service businesses that want better tools, cleaner websites, and less chaos in the day-to-day.</p>
  </div>
</section>

${blogCompactForm("Blog index", 1)}
<section class="section white">
  <div class="container blogGrid">
    ${cards || "<p>No posts published yet.</p>"}
  </div>
</section>
${blogReviewForm("Blog index", 2)}`
});

fs.writeFileSync(path.join(blogDir, "index.html"), indexHtml);
console.log(`Built ${posts.length} blog post(s).`);
