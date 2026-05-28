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
<link href="/assets/css/blog.css?v=14" rel="stylesheet"/>
<link href="/css/blog.css?v=14" rel="stylesheet"/>
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
      <p>Arsenal Media builds custom business apps, contractor CRM software, business websites, SEO pages, and brand creative for service businesses in Waxahachie and across the Dallas-Fort Worth Metroplex.</p>
      <p class="footerSmall">From Dallas, Fort Worth, Plano, Arlington, Irving, Richardson, Frisco, and McKinney to teams in Ellis County, Dallas County, Tarrant County, and Collin County, we help North Texas contractors turn messy workflows into cleaner systems.</p>
      <p class="footerSmall"><a href="/contact.html">Need a practical app or website in the DFW area? Start a project.</a></p>
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
<script src="/assets/js/main.js"></script>`;
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
</section>`
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

<section class="section white">
  <div class="container blogGrid">
    ${cards || "<p>No posts published yet.</p>"}
  </div>
</section>`
});

fs.writeFileSync(path.join(blogDir, "index.html"), indexHtml);
console.log(`Built ${posts.length} blog post(s).`);
