const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const root = process.cwd();
const postsDir = path.join(root, "content", "blog");
const blogDir = path.join(root, "blog");

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

function isoDate(value) {
  const d = new Date(value || Date.now());
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function absoluteUrl(pathname) {
  return `https://arsenalmediaco.com${pathname}`;
}

function layout({ title, description, canonical, ogImage, content, active = "blog", schema = "" }) {
  const safeTitle = escapeHtml(title || "Arsenal Media");
  const safeDescription = escapeHtml(description || "Arsenal Media builds custom apps, contractor software, websites, and SEO-ready digital systems.");
  const image = ogImage || "/social-preview.jpg";
  const nav = [
    ["/", "Home", "home"],
    ["/services/", "Services", "services"],
    ["/portfolio/", "Portfolio", "portfolio"],
    ["/blog/", "Blog", "blog"],
    ["/about.html", "About", "about"],
    ["/contact.html", "Contact", "contact"]
  ].map(([href, label, key]) => `<a class="${active === key ? "active" : ""}" href="${href}">${label}</a>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="author" content="Arsenal Media">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:site_name" content="Arsenal Media">
  <meta property="og:image" content="${escapeHtml(absoluteUrl(image))}">
  <meta property="og:image:alt" content="${safeTitle}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${escapeHtml(absoluteUrl(image))}">
  <link rel="stylesheet" href="/assets/css/style-v8.css?v=12">
  ${schema}
</head>
<body>
  <header class="siteHeader">
    <div class="container nav">
      <a class="brand" href="/" aria-label="Arsenal Media home">
        <img src="/assets/arsenal-command-logo.webp" alt="Arsenal Media logo">
      </a>
      <button class="navToggle" type="button" aria-label="Open menu" data-nav-toggle><span></span><span></span><span></span></button>
      <nav aria-label="Main navigation" class="navLinks" data-nav>${nav}<a class="navCta" href="/contact.html">Start a Project</a></nav>
    </div>
  </header>

  <main>
    ${content}
  </main>

  <footer class="siteFooter">
    <div class="container footerGrid">
      <div>
        <img src="/assets/arsenal-command-logo.webp" alt="Arsenal Media" class="footerLogo">
        <p>Arsenal Media builds custom apps, contractor CRMs, websites, and SEO-ready digital systems for service businesses in Waxahachie, Dallas-Fort Worth, and North Texas.</p>
      </div>
      <div>
        <h3>Explore</h3>
        <a href="/services/">Services</a>
        <a href="/portfolio/">Portfolio</a>
        <a href="/blog/">Blog</a>
        <a href="/contact.html">Contact</a>
      </div>
      <div>
        <h3>Social</h3>
        <a href="https://www.facebook.com/arsenalmediaco">Facebook</a>
        <a href="https://www.instagram.com/arsenalmediaco/">Instagram</a>
        <a href="https://www.linkedin.com/company/arsenal-media-co">LinkedIn</a>
      </div>
    </div>
  </footer>
  <script src="/assets/js/main.js"></script>
</body>
</html>`;
}

function readPosts() {
  ensureDir(postsDir);
  return fs.readdirSync(postsDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(postsDir, file), "utf8");
      const parsed = matter(raw);
      const slug = parsed.data.slug || file.replace(/\.md$/, "");
      return {
        ...parsed.data,
        slug,
        source: file,
        body: parsed.content,
        html: marked.parse(parsed.content)
      };
    })
    .filter((post) => post.draft !== true)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function buildPost(post) {
  const postDir = path.join(blogDir, post.slug);
  ensureDir(postDir);
  const canonical = absoluteUrl(`/blog/${post.slug}/`);
  const schema = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.seo_description || post.excerpt || "",
    "datePublished": isoDate(post.date),
    "dateModified": isoDate(post.updated || post.date),
    "author": { "@type": "Person", "name": post.author || "Steve Smith" },
    "publisher": {
      "@type": "Organization",
      "name": "Arsenal Media",
      "logo": { "@type": "ImageObject", "url": "https://arsenalmediaco.com/assets/arsenal-command-logo.webp" }
    },
    "image": post.featured_image ? absoluteUrl(post.featured_image) : "https://arsenalmediaco.com/social-preview.jpg",
    "mainEntityOfPage": canonical
  }, null, 2)}</script>`;

  const html = layout({
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || "",
    canonical,
    ogImage: post.featured_image,
    schema,
    content: `<section class="section blogArticleHero">
  <div class="container narrow">
    <p class="eyebrow">Arsenal Media Blog</p>
    <h1>${escapeHtml(post.title)}</h1>
    <p class="lead">${escapeHtml(post.excerpt || "")}</p>
    <p class="blogMeta">${escapeHtml(isoDate(post.date))} · ${escapeHtml(post.author || "Arsenal Media")}</p>
    ${post.featured_image ? `<img class="articleHeroImage" src="${escapeHtml(post.featured_image)}" alt="${escapeHtml(post.image_alt || post.title)}">` : ""}
  </div>
</section>
<section class="section blogArticleBody">
  <div class="container narrow prose">
    ${post.html}
    <div class="articleCta">
      <h2>Need a better system for your business?</h2>
      <p>Arsenal Media builds custom apps, contractor CRMs, websites, and SEO-ready pages for service businesses that have outgrown scattered tools.</p>
      <a class="btn primary" href="/contact.html">Talk through your project</a>
    </div>
  </div>
</section>`
  });
  fs.writeFileSync(path.join(postDir, "index.html"), html);
}

function buildIndex(posts) {
  const cards = posts.map((post) => `<article class="blogCard">
  ${post.featured_image ? `<a href="/blog/${escapeHtml(post.slug)}/"><img src="${escapeHtml(post.featured_image)}" alt="${escapeHtml(post.image_alt || post.title)}"></a>` : ""}
  <p class="eyebrow">${escapeHtml(isoDate(post.date))}</p>
  <h2><a href="/blog/${escapeHtml(post.slug)}/">${escapeHtml(post.title)}</a></h2>
  <p>${escapeHtml(post.excerpt || post.seo_description || "")}</p>
  <a class="textLink" href="/blog/${escapeHtml(post.slug)}/">Read the article</a>
</article>`).join("\n");

  const schema = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Arsenal Media Blog",
    "url": "https://arsenalmediaco.com/blog/",
    "publisher": { "@type": "Organization", "name": "Arsenal Media", "url": "https://arsenalmediaco.com" }
  }, null, 2)}</script>`;

  const html = layout({
    title: "Blog | Arsenal Media",
    description: "Practical articles about custom apps, contractor software, websites, SEO, and business systems from Arsenal Media.",
    canonical: absoluteUrl("/blog/"),
    active: "blog",
    schema,
    content: `<section class="section blogHero">
  <div class="container">
    <p class="eyebrow">Arsenal Media Blog</p>
    <h1>Practical notes on apps, websites, SEO, and better business systems.</h1>
    <p class="lead">Ideas for contractors and service businesses that want cleaner tools, better websites, and less day-to-day chaos.</p>
  </div>
</section>
<section class="section">
  <div class="container blogGrid">
    ${cards || "<p>No posts published yet.</p>"}
  </div>
</section>`
  });
  fs.writeFileSync(path.join(blogDir, "index.html"), html);
}

function buildRss(posts) {
  const items = posts.map((post) => `<item>
  <title><![CDATA[${post.title || "Untitled"}]]></title>
  <link>${absoluteUrl(`/blog/${post.slug}/`)}</link>
  <guid>${absoluteUrl(`/blog/${post.slug}/`)}</guid>
  <pubDate>${new Date(post.date || Date.now()).toUTCString()}</pubDate>
  <description><![CDATA[${post.excerpt || post.seo_description || ""}]]></description>
</item>`).join("\n");
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Arsenal Media Blog</title>
  <link>https://arsenalmediaco.com/blog/</link>
  <description>Articles about custom apps, websites, SEO, and business systems.</description>
  ${items}
</channel>
</rss>`;
  fs.writeFileSync(path.join(root, "rss.xml"), rss);
}

function updateSitemap(posts) {
  const sitemapPath = path.join(root, "sitemap.xml");
  const blogUrls = [`  <url><loc>https://arsenalmediaco.com/blog/</loc></url>`, ...posts.map(post => `  <url><loc>https://arsenalmediaco.com/blog/${post.slug}/</loc></url>`)].join("\n");
  if (!fs.existsSync(sitemapPath)) {
    fs.writeFileSync(sitemapPath, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${blogUrls}\n</urlset>\n`);
    return;
  }
  let xml = fs.readFileSync(sitemapPath, "utf8");
  xml = xml.replace(/\s*<url><loc>https:\/\/arsenalmediaco\.com\/blog\/?<\/loc><\/url>/g, "");
  xml = xml.replace(/\s*<url><loc>https:\/\/arsenalmediaco\.com\/blog\/[^<]+\/<\/loc><\/url>/g, "");
  xml = xml.replace(/\s*<\/urlset>\s*$/, `\n${blogUrls}\n</urlset>\n`);
  fs.writeFileSync(sitemapPath, xml);
}

ensureDir(blogDir);
const posts = readPosts();
posts.forEach(buildPost);
buildIndex(posts);
buildRss(posts);
updateSitemap(posts);
console.log(`Built ${posts.length} blog post(s).`);
