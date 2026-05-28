const fs = require("fs");
const path = require("path");

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

function parseYamlValue(value) {
  const trimmed = String(value || "").trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
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
  const lines = yaml.split(/\r?\n/);
  let activeListKey = null;

  for (const line of lines) {
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
      html.push(`<h1>${inlineMarkdown(trimmed.slice(2))}</h1>`);
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

function pageShell({ title, description, canonical, content }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:site_name" content="Arsenal Media">
  <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
  <header class="site-header">
    <div class="nav-shell">
      <a class="brand" href="/" aria-label="Arsenal Media Home">
        <span class="brand-mark">AM</span>
        <span>Arsenal Media</span>
      </a>
      <nav class="nav-links" aria-label="Main navigation">
        <a href="/services/">Services</a>
        <a href="/portfolio/">Portfolio</a>
        <a href="/blog/">Blog</a>
        <a href="/#contact">Contact</a>
      </nav>
    </div>
  </header>
  <main>
    ${content}
  </main>
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <p class="eyebrow">Arsenal Media</p>
        <p>Custom apps, contractor CRM software, websites, and SEO for service businesses in Waxahachie and across DFW.</p>
      </div>
      <p><a href="/">Home</a> · <a href="/services/">Services</a> · <a href="/portfolio/">Portfolio</a></p>
    </div>
  </footer>
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

  const postHtml = pageShell({
    title,
    description,
    canonical,
    content: `
<section class="section blog-article">
  <div class="container narrow">
    <p class="eyebrow">Arsenal Media Blog</p>
    <h1>${escapeHtml(post.title || title)}</h1>
    <p class="muted">${escapeHtml(post.date || "")} · ${escapeHtml(post.author || "Arsenal Media")}</p>
    ${post.featured_image ? `<img src="${escapeHtml(post.featured_image)}" alt="${escapeHtml(post.image_alt || post.title || title)}" class="article-hero">` : ""}
    <article class="prose">
      ${post.html}
    </article>
    <p><a href="/blog/">Back to blog</a></p>
  </div>
</section>`
  });

  fs.writeFileSync(path.join(postDir, "index.html"), postHtml);
}

const cards = posts
  .map((post) => {
    const slug = post.slug || post.source.replace(/\.md$/, "");
    return `
<article class="blog-card">
  ${post.featured_image ? `<img src="${escapeHtml(post.featured_image)}" alt="${escapeHtml(post.image_alt || post.title || "Blog post image")}">` : ""}
  <p class="eyebrow">${escapeHtml(post.date || "")}</p>
  <h2><a href="/blog/${escapeHtml(slug)}/">${escapeHtml(post.title || "Untitled Post")}</a></h2>
  <p>${escapeHtml(post.excerpt || post.seo_description || "")}</p>
</article>`;
  })
  .join("\n");

const indexHtml = pageShell({
  title: "Blog | Arsenal Media",
  description: "Articles about custom apps, contractor software, websites, SEO, and business systems from Arsenal Media.",
  canonical: "https://arsenalmediaco.com/blog/",
  content: `
<section class="section blog-hero">
  <div class="container">
    <p class="eyebrow">Arsenal Media Blog</p>
    <h1>Practical notes on apps, websites, SEO, and business systems.</h1>
    <p class="lead">Ideas for contractors and service businesses that want better tools, cleaner websites, and less chaos in the day-to-day.</p>
  </div>
</section>

<section class="section">
  <div class="container blog-grid">
    ${cards || "<p>No posts published yet.</p>"}
  </div>
</section>`
});

fs.writeFileSync(path.join(blogDir, "index.html"), indexHtml);
console.log(`Built ${posts.length} blog post(s).`);
