# Arsenal Media Technical SEO Implementation

Source request: `Pasted markdown.md` asked for eight technical SEO tasks: metadata, schema, alt text, internal linking, Cloudflare files, a service-page template, local footer copy, and validation guidance.

## What changed in this build

- Updated the homepage `<head>` with a shorter Texas-focused title, shorter meta description, robots, author, canonical, Open Graph, Twitter Card, image alt metadata, and four JSON-LD blocks.
- Added LocalBusiness, SoftwareApplication, FAQPage, and Organization schema to the homepage.
- Added a visible homepage FAQ section so the FAQPage schema matches real on-page content.
- Rebuilt `/services/custom-app-development/` as a complete service page template with hero, description, benefits, process, pricing indicators, related case studies, FAQ, CTA, Service schema, and FAQ schema.
- Added new service URLs `/services/contractor-crm-software/` and `/services/website-design/` while redirecting the old short service URLs.
- Updated key MFR alt text strings.
- Replaced `_headers` and `_redirects` with Cloudflare-ready versions.
- Updated the sitemap, footer local SEO copy, footer links, and `llms.txt` service URLs.
- Added a small JavaScript hash handler because Cloudflare cannot redirect URL fragments such as `#services` server-side.

## TASK 1 — Updated homepage head

```html
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1" name="viewport"/>
<title>Custom App Development & Software Texas | Arsenal Media</title>
<meta content="Need custom business apps or contractor software in Texas? Arsenal Media builds dashboards, CRMs and websites for DFW service teams. Start today." name="description"/>
<meta content="index, follow, max-image-preview:large" name="robots"/>
<meta content="Arsenal Media" name="author"/>
<link href="https://arsenalmediaco.com/" rel="canonical"/>
<meta content="Custom App Development & Software Texas | Arsenal Media" property="og:title"/>
<meta content="Need custom business apps or contractor software in Texas? Arsenal Media builds dashboards, CRMs and websites for DFW service teams. Start today." property="og:description"/>
<meta content="website" property="og:type"/>
<meta content="https://arsenalmediaco.com/" property="og:url"/>
<meta content="Arsenal Media" property="og:site_name"/>
<meta content="https://arsenalmediaco.com/assets/images/og/home.jpg" property="og:image"/>
<meta content="https://arsenalmediaco.com/assets/images/og/home.jpg" property="og:image:secure_url"/>
<meta content="1200" property="og:image:width"/>
<meta content="630" property="og:image:height"/>
<meta content="Arsenal Media custom business software and contractor CRM dashboard for Texas service businesses" property="og:image:alt"/>
<meta content="summary_large_image" name="twitter:card"/>
<meta content="Custom App Development & Software Texas | Arsenal Media" name="twitter:title"/>
<meta content="Need custom business apps or contractor software in Texas? Arsenal Media builds dashboards, CRMs and websites for DFW service teams. Start today." name="twitter:description"/>
<meta content="https://arsenalmediaco.com/assets/images/og/home.jpg" name="twitter:image"/>
<meta content="Arsenal Media custom business software and contractor CRM dashboard for Texas service businesses" name="twitter:image:alt"/>
<link href="./assets/css/style-v8.css?v=9" rel="stylesheet"/>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://arsenalmediaco.com/#localbusiness",
  "name": "Arsenal Media",
  "description": "Custom software development company in Waxahachie, Texas, building custom business apps, contractor CRM software, business websites, and SEO-ready service pages.",
  "url": "https://arsenalmediaco.com",
  "logo": "https://arsenalmediaco.com/assets/images/arsenal-logo-white.png",
  "image": "https://arsenalmediaco.com/assets/images/og/home.jpg",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Waxahachie",
    "addressRegion": "TX",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 32.3865,
    "longitude": -96.8483
  },
  "areaServed": [
    {
      "@type": "City",
      "name": "Waxahachie"
    },
    {
      "@type": "City",
      "name": "Dallas"
    },
    {
      "@type": "City",
      "name": "Fort Worth"
    },
    {
      "@type": "City",
      "name": "Plano"
    },
    {
      "@type": "City",
      "name": "Arlington"
    },
    {
      "@type": "City",
      "name": "Irving"
    },
    {
      "@type": "AdministrativeArea",
      "name": "Ellis County"
    },
    {
      "@type": "AdministrativeArea",
      "name": "Dallas County"
    },
    {
      "@type": "AdministrativeArea",
      "name": "Tarrant County"
    }
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Arsenal Media services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Custom app development"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Contractor CRM software"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Website design"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "SEO services"
        }
      }
    ]
  },
  "sameAs": [
    "https://www.facebook.com/arsenalmediaco",
    "https://www.instagram.com/arsenalmediaco/",
    "https://www.linkedin.com/company/arsenal-media-co"
  ]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://arsenalmediaco.com/mfr-command-center/#softwareapplication",
  "name": "MFR Roofing Command Center",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web-based",
  "url": "https://arsenalmediaco.com/mfr-command-center/",
  "description": "Custom roofing CRM with estimates, customer tracking, appointments, quote design, reporting, and Hail Commander storm intelligence.",
  "creator": {
    "@id": "https://arsenalmediaco.com/#organization"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free public demo with sample data"
  }
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://arsenalmediaco.com/#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What does Arsenal Media build?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Arsenal Media builds custom business apps, contractor CRM software, workflow dashboards, estimate tools, business websites, SEO pages, and brand creative for contractors and service businesses."
      }
    },
    {
      "@type": "Question",
      "name": "Do you only work with roofing contractors?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Roofing is one example because the MFR Roofing Command Center shows a full CRM and estimate workflow. The same approach fits curbing, landscaping, field operations, studio services, and other service businesses."
      }
    },
    {
      "@type": "Question",
      "name": "Can you build a working demo before a full app?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. A focused demo is often the best first step. It lets the owner see the workflow, screens, sample data, and user experience before moving toward a production build."
      }
    },
    {
      "@type": "Question",
      "name": "Do you build websites too?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Arsenal Media builds business websites, landing pages, service pages, SEO structure, social previews, and content that connects the website to the same services or apps being promoted."
      }
    },
    {
      "@type": "Question",
      "name": "Where is Arsenal Media located?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Arsenal Media is based in Waxahachie, Texas and serves service businesses across the Dallas-Fort Worth area and North Texas."
      }
    }
  ]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://arsenalmediaco.com/#organization",
  "name": "Arsenal Media",
  "url": "https://arsenalmediaco.com",
  "logo": "https://arsenalmediaco.com/assets/images/arsenal-logo-white.png",
  "sameAs": [
    "https://www.facebook.com/arsenalmediaco",
    "https://www.instagram.com/arsenalmediaco/",
    "https://www.linkedin.com/company/arsenal-media-co"
  ]
}
</script>
</head>
```

### Why this helps

- The title leads with the core service and includes Texas while staying under 60 characters.
- The description is under 160 characters, mentions custom business apps, contractor software, Texas, DFW, and includes a simple call to action.
- `robots` allows indexing and larger image previews.
- Canonical reduces duplicate URL confusion.
- Open Graph and Twitter metadata improve link previews when the site is shared.
- `og:image:alt` and `twitter:image:alt` give social platforms and assistive tech better image context.
- JSON-LD gives search engines structured information about the business, software demo, organization, and FAQ.

Expected impact: **High** for better snippets, previews, and entity clarity.

Testing: open the deployed homepage, view source, and confirm the title, description, canonical, OG, Twitter, and JSON-LD blocks are present.

## TASK 2 — Schema markup

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://arsenalmediaco.com/#localbusiness",
  "name": "Arsenal Media",
  "description": "Custom software development company in Waxahachie, Texas, building custom business apps, contractor CRM software, business websites, and SEO-ready service pages.",
  "url": "https://arsenalmediaco.com",
  "logo": "https://arsenalmediaco.com/assets/images/arsenal-logo-white.png",
  "image": "https://arsenalmediaco.com/assets/images/og/home.jpg",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Waxahachie",
    "addressRegion": "TX",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 32.3865,
    "longitude": -96.8483
  },
  "areaServed": [
    {
      "@type": "City",
      "name": "Waxahachie"
    },
    {
      "@type": "City",
      "name": "Dallas"
    },
    {
      "@type": "City",
      "name": "Fort Worth"
    },
    {
      "@type": "City",
      "name": "Plano"
    },
    {
      "@type": "City",
      "name": "Arlington"
    },
    {
      "@type": "City",
      "name": "Irving"
    },
    {
      "@type": "AdministrativeArea",
      "name": "Ellis County"
    },
    {
      "@type": "AdministrativeArea",
      "name": "Dallas County"
    },
    {
      "@type": "AdministrativeArea",
      "name": "Tarrant County"
    }
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Arsenal Media services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Custom app development"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Contractor CRM software"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Website design"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "SEO services"
        }
      }
    ]
  },
  "sameAs": [
    "https://www.facebook.com/arsenalmediaco",
    "https://www.instagram.com/arsenalmediaco/",
    "https://www.linkedin.com/company/arsenal-media-co"
  ]
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://arsenalmediaco.com/mfr-command-center/#softwareapplication",
  "name": "MFR Roofing Command Center",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web-based",
  "url": "https://arsenalmediaco.com/mfr-command-center/",
  "description": "Custom roofing CRM with estimates, customer tracking, appointments, quote design, reporting, and Hail Commander storm intelligence.",
  "creator": {
    "@id": "https://arsenalmediaco.com/#organization"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free public demo with sample data"
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://arsenalmediaco.com/#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What does Arsenal Media build?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Arsenal Media builds custom business apps, contractor CRM software, workflow dashboards, estimate tools, business websites, SEO pages, and brand creative for contractors and service businesses."
      }
    },
    {
      "@type": "Question",
      "name": "Do you only work with roofing contractors?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Roofing is one example because the MFR Roofing Command Center shows a full CRM and estimate workflow. The same approach fits curbing, landscaping, field operations, studio services, and other service businesses."
      }
    },
    {
      "@type": "Question",
      "name": "Can you build a working demo before a full app?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. A focused demo is often the best first step. It lets the owner see the workflow, screens, sample data, and user experience before moving toward a production build."
      }
    },
    {
      "@type": "Question",
      "name": "Do you build websites too?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Arsenal Media builds business websites, landing pages, service pages, SEO structure, social previews, and content that connects the website to the same services or apps being promoted."
      }
    },
    {
      "@type": "Question",
      "name": "Where is Arsenal Media located?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Arsenal Media is based in Waxahachie, Texas and serves service businesses across the Dallas-Fort Worth area and North Texas."
      }
    }
  ]
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://arsenalmediaco.com/#organization",
  "name": "Arsenal Media",
  "url": "https://arsenalmediaco.com",
  "logo": "https://arsenalmediaco.com/assets/images/arsenal-logo-white.png",
  "sameAs": [
    "https://www.facebook.com/arsenalmediaco",
    "https://www.instagram.com/arsenalmediaco/",
    "https://www.linkedin.com/company/arsenal-media-co"
  ]
}
</script>
```

### Notes

- Phone was not inserted because a real public phone number was not provided. This avoids publishing placeholder or invalid schema data.
- Waxahachie coordinates are approximate and used only for local business context.
- FAQ schema now matches visible homepage FAQ content.

Expected impact: **High** for local/entity clarity and rich-result eligibility where Google supports it.

Testing: run the homepage through Google Rich Results Test and Schema.org validator.

## TASK 3 — Optimized image alt text

1. `Custom business software dashboard with contractor CRM and workflow automation`
2. `Contractor CRM software sales pipeline business dashboard with workflow automation`
3. `Estimate automation contractor software quote builder and pricing tool`
4. `Customer portal project tracking software and client management system`
5. `Storm intelligence hail tracking weather data for roofing software`

Expected impact: **Medium** for accessibility, image context, and page relevance.

Testing: inspect the MFR case study and homepage image tags to confirm the updated alt strings are present and under 125 characters.

## TASK 4 — Internal linking opportunities

| Section | Link to | Anchor text | Placement/context |
|---|---|---|---|
| Hero service pills | `/services/custom-app-development/` | custom app development | Use near the hero so visitors can jump straight to app work. |
| Hero service pills | `/services/contractor-crm-software/` | contractor CRM software | Use beside custom apps for roofing and service business visitors. |
| Hero service pills | `/services/website-design/` | business website design | Use for visitors who need a website before or alongside an app. |
| Hero service pills | `/services/seo-services/` | local SEO services | Use for the search/AI discovery service page. |
| Services Overview card | `/services/custom-app-development/` | custom app development for contractors | Context: We build custom app development for contractors who need dashboards, estimates, and customer tracking. |
| Services Overview card | `/services/contractor-crm-software/` | contractor CRM software for service teams | Context: Contractor CRM software for service teams can keep leads, estimates, and jobs in one place. |
| Services Overview card | `/services/website-design/` | website design for local service businesses | Context: Website design for local service businesses should make services, proof, and calls to action easy to find. |
| Services Overview card | `/services/seo-services/` | SEO services for contractors | Context: SEO services for contractors help service pages and local search signals line up. |
| Featured MFR section | `/services/contractor-crm-software/` | roofing CRM and estimate workflows | Context: The MFR demo shows roofing CRM and estimate workflows in a working app. |
| Featured MFR section | `/services/custom-app-development/` | custom business software dashboard | Context: A custom business software dashboard can combine sales, projects, reporting, and admin tools. |
| CurbFlow section | `/services/custom-app-development/` | custom app development for field operations | Context: CurbFlow shows custom app development for field operations and crew handoff. |
| Process section | `/services/website-design/` | website and app experience | Context: The website and app experience should point visitors and teams to the same clear workflow. |
| Final CTA | `/services/seo-services/` | SEO-ready service page structure | Context: Start with SEO-ready service page structure when the site needs stronger organic visibility. |
| Footer local SEO text | `/services/contractor-crm-software/` | contractor CRM software | Context: Natural footer text links contractor CRM software to the DFW service area. |
| Footer local SEO text | `/services/custom-app-development/` | custom business apps | Context: Natural footer text links custom business apps to Waxahachie and North Texas. |


Expected impact: **High** once service pages gain impressions because the homepage, case studies, and footer pass clear topical signals to the service pages.

Testing: crawl the site with a link checker and verify each service page is reachable from the homepage and footer.

## TASK 5 — Cloudflare Pages configuration

### `_headers`

```txt
/*
  X-Robots-Tag: index, follow
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Cache-Control: public, max-age=3600, must-revalidate

/*.html
  Content-Type: text/html; charset=utf-8
  Cache-Control: public, max-age=3600, must-revalidate

/services/*.html
  Content-Type: text/html; charset=utf-8
  Cache-Control: public, max-age=3600, must-revalidate

/portfolio/*.html
  Content-Type: text/html; charset=utf-8
  Cache-Control: public, max-age=3600, must-revalidate

/assets/css/*
  Content-Type: text/css; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/assets/js/*
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/assets/images/*
  Cache-Control: public, max-age=31536000, immutable

/screenshots/*
  Cache-Control: public, max-age=31536000, immutable

/social-designs/*
  Cache-Control: public, max-age=31536000, immutable

/*.png
  Cache-Control: public, max-age=31536000, immutable

/*.jpg
  Cache-Control: public, max-age=31536000, immutable

/*.webp
  Cache-Control: public, max-age=31536000, immutable

/robots.txt
  Content-Type: text/plain; charset=utf-8
  Cache-Control: public, max-age=3600

/sitemap.xml
  Content-Type: application/xml; charset=utf-8
  Cache-Control: public, max-age=3600

/llms.txt
  Content-Type: text/plain; charset=utf-8
  Cache-Control: public, max-age=3600

```

### `_redirects`

```txt
# Canonical root and directory routes
/index.html / 301
/services /services/ 301
/portfolio /portfolio/ 301
/contact/ /contact.html 301

# Old service routes
/apps /services/custom-app-development/ 301
/apps/ /services/custom-app-development/ 301
/custom-app-development /services/custom-app-development/ 301
/custom-app-development/ /services/custom-app-development/ 301
/contractor-crm /services/contractor-crm-software/ 301
/contractor-crm/ /services/contractor-crm-software/ 301
/services/contractor-crm-software/ /services/contractor-crm-software/ 301
/services/contractor-crm /services/contractor-crm-software/ 301
/websites /services/website-design/ 301
/websites/ /services/website-design/ 301
/services/website-design/ /services/website-design/ 301
/services/websites /services/website-design/ 301
/seo-services /services/seo-services/ 301
/seo-services/ /services/seo-services/ 301

# Old app and portfolio routes
/apps/mfr-command-center /portfolio/mfr-roofing/ 301
/apps/mfr-command-center/ /portfolio/mfr-roofing/ 301
/apps/mfr-command-center-demo /mfr-command-center/ 301
/work /portfolio/ 301
/work/ /portfolio/ 301
/demos /demos/ 301
/decorative-curbing-landscape /portfolio/decorative-curbing-landscape/ 301
/decorative-curbing-landscape/ /portfolio/decorative-curbing-landscape/ 301
/security-dashboard /portfolio/security-dashboard/ 301
/security-demo /security-operations-platform-demo.html 301
/portfolio/studio /portfolio/studio-facility/ 301
/portfolio/video /portfolio/video-confessional/ 301

# Clean case study routes
/portfolio/mfr-roofing /portfolio/mfr-roofing/ 200
/portfolio/curbflow /portfolio/curbflow/ 200
/portfolio/security-dashboard /portfolio/security-dashboard/ 200
/portfolio/studio-facility /portfolio/studio-facility/ 200
/portfolio/video-confessional /portfolio/video-confessional/ 200
/portfolio/decorative-curbing-landscape /portfolio/decorative-curbing-landscape/ 200
/services/custom-app-development /services/custom-app-development/ 200
/services/contractor-crm-software /services/contractor-crm-software/ 200
/services/website-design /services/website-design/ 200
/services/seo-services /services/seo-services/ 200

# Hash redirects like /index.html#services cannot be handled by Cloudflare _redirects because browsers do not send fragments to the server.
# assets/js/main.js handles legacy home hash links for services, portfolio/work, and contact on the client.

```

### Why this helps

- Security headers reduce basic browser risks without blocking the current inline app demos.
- HSTS tells browsers to prefer HTTPS.
- Asset caching improves repeat-load speed.
- HTML, robots, sitemap, and llms files have explicit content types.
- Old service routes and app routes point to the stronger current pages.
- Hash links are handled in `assets/js/main.js` because URL fragments are never sent to Cloudflare.

Expected impact: **Medium** for technical health, crawl cleanliness, and performance.

Testing: deploy to Cloudflare Pages, then check response headers with DevTools Network or `curl -I`.

## TASK 6 — Service page template

Implemented directly at:

```txt
/services/custom-app-development/
```

The page includes:

- H1 with service and Texas location.
- Three intro paragraphs.
- Benefits section with four cards.
- Process section with three steps.
- Pricing indicator section without fixed public pricing.
- Three related case studies.
- Four-question FAQ.
- CTA section.
- Service schema and FAQ schema.

Expected impact: **High** because service-specific pages are much easier to rank than a single general homepage.

Testing: visit `/services/custom-app-development/`, check heading hierarchy with a browser extension, and validate the Service/FAQ schema.

## TASK 7 — Local SEO footer addition

```html
<footer class="footer">
  <div class="container footerGrid">
    <div>
      <div class="footerBrand"><img src="./assets/images/arsenal-logo-white.png" alt="Arsenal Media logo"></div>
      <p>Arsenal Media builds custom business apps, contractor CRM software, business websites, SEO pages, and brand creative for service businesses in Waxahachie and across the Dallas-Fort Worth Metroplex.</p>
      <p class="footerSmall">From Dallas, Fort Worth, Plano, Arlington, Irving, Richardson, Frisco, and McKinney to teams in Ellis County, Dallas County, Tarrant County, and Collin County, we help North Texas contractors turn messy workflows into cleaner systems.</p>
      <p class="footerSmall"><a href="./contact.html">Need a practical app or website in the DFW area? Start a project.</a></p>
    </div>
  </div>
</footer>
```

Expected impact: **Medium** for local relevance and footer crawl paths.

Testing: check desktop and mobile footer spacing, then verify the city/county text appears naturally and does not repeat excessively.

## TASK 8 — Structured data validation

### Google test URLs

- Rich Results Test: https://search.google.com/test/rich-results
- Schema Markup Validator: https://validator.schema.org/
- Google Search Console URL Inspection: use the property for `https://arsenalmediaco.com/`, inspect each deployed URL, then request indexing after verifying the live page.

### Validation checklist

- LocalBusiness: name, URL, logo, area served, address locality, price range, and service catalog appear correctly.
- SoftwareApplication: app name, category, operating system, URL, description, and offer are present.
- FAQPage: questions and answers match visible page content.
- Organization: name, URL, logo, and sameAs profiles are correct.
- Service schema: service name, provider, area served, description, and offer range are valid.

### Common errors to watch for

- FAQ schema that does not match visible page text.
- Placeholder phone numbers in LocalBusiness schema.
- Broken image URLs in Open Graph or schema logo fields.
- Duplicate canonical URLs after adding redirects.
- Redirect loops from old service paths.
- Content Security Policy that blocks inline scripts in the app demos.

### Google Search Console steps

1. Deploy the updated ZIP to Cloudflare Pages.
2. Open Google Search Console for the Arsenal Media property.
3. Use URL Inspection for `/`, `/services/custom-app-development/`, `/services/contractor-crm-software/`, `/services/website-design/`, `/services/seo-services/`, and `/portfolio/mfr-roofing/`.
4. Click **Test Live URL**.
5. Confirm the page is indexable.
6. Request indexing for the updated pages.
7. Submit or re-submit `https://arsenalmediaco.com/sitemap.xml`.

