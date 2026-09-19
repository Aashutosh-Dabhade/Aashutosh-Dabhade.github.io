/**
 * Static site generator for the portfolio.
 *
 *   node build.mjs           -> writes ./dist
 *   npm run dev              -> build + local preview server
 *
 * All content lives in data/content.json. Everything under static/ is copied
 * verbatim. Output is plain HTML/CSS/JS with relative links, so it works on any
 * static host (Cloudflare Pages, Netlify, GitHub Pages project sites, S3, ...).
 */

import { readFileSync, rmSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'dist');
const data = JSON.parse(readFileSync(join(ROOT, 'data', 'content.json'), 'utf8'));
const { site } = data;

/** The placeholder domain counts as "not set yet" — no canonical/OG/sitemap URLs. */
const SITE_URL =
  site.url && site.url !== 'https://example.com' ? site.url.replace(/\/$/, '') : '';

/* ------------------------------------------------------------------ utils */

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const attr = (s = '') => esc(s).replace(/'/g, '&#39;');

/** `rel` is the path prefix that gets a page back to the site root. */
const NAV = [
  ['Home', '#hero', 'index'],
  ['Expertise', '#expertise', 'index'],
  ['Case Studies', '#case-studies', 'index'],
  ['Experience', '#experience', 'index'],
  ['Gallery', 'gallery/', 'page'],
];

function navHref(target, kind, rel, onIndex) {
  if (kind === 'page') return rel + target;
  return onIndex ? target : `${rel}index.html${target}`;
}

/* ----------------------------------------------------------------- chrome */

function head({ title, description, rel, canonical, image, base }) {
  const ogImage = SITE_URL ? `${SITE_URL}/${image || site.photo}` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
${base ? `<base href="${attr(base)}">` : ''}
<script>document.documentElement.className+=' js';</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(description)}">
<meta name="author" content="${attr(site.name)}">
<meta name="theme-color" content="#000000">
${canonical && SITE_URL ? `<link rel="canonical" href="${attr(SITE_URL + canonical)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
${ogImage ? `<meta property="og:image" content="${attr(ogImage)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${rel}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.min.css">
<link rel="stylesheet" href="${rel}assets/css/styles.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>`;
}

function header(rel, onIndex) {
  const links = NAV.map(([label, target, kind]) =>
    `<a href="${navHref(target, kind, rel, onIndex)}">${esc(label)}</a>`).join('\n        ');
  const mobile = NAV.map(([label, target, kind]) =>
    `<a href="${navHref(target, kind, rel, onIndex)}">${esc(label)}</a>`).join('\n        ');
  const contactHref = onIndex ? '#contact' : `${rel}index.html#contact`;
  return `
<nav class="nav">
  <div class="shell">
    <div class="nav__inner">
      <a class="nav__brand" href="${rel}index.html" aria-label="${attr(site.name)} — home">${esc(site.initials)}</a>
      <div class="nav__links">
        ${links}
        <a class="btn btn--primary btn--sm" href="${contactHref}">Contact</a>
      </div>
      <button class="nav__toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">
        <i class="ri-menu-line"></i>
      </button>
    </div>
  </div>
  <div class="nav__mobile" id="mobile-menu">
    ${mobile}
    <a class="btn btn--primary" href="${contactHref}">Contact</a>
  </div>
</nav>`;
}

function footer(rel, onIndex) {
  const quick = NAV.map(([label, target, kind]) =>
    `<li><a href="${navHref(target, kind, rel, onIndex)}">${esc(label)}</a></li>`).join('\n        ');
  const contactHref = onIndex ? '#contact' : `${rel}index.html#contact`;
  return `
<footer class="footer">
  <div class="shell">
    <div class="footer__grid">
      <div>
        <div class="footer__brand">
          <span class="footer__mark">${esc(site.initials)}</span>
          <div>
            <h3>${esc(site.name)}</h3>
            <p>${esc(site.role)}</p>
          </div>
        </div>
        <p class="footer__about">${esc(data.copy.footerAbout)}</p>
        <div class="hero__socials">
          <a class="icon-btn" href="${attr(site.linkedin)}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="ri-linkedin-fill"></i></a>
          <a class="icon-btn" href="${attr(site.github)}" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="ri-github-fill"></i></a>
          <a class="icon-btn" href="mailto:${attr(site.email)}" aria-label="Email"><i class="ri-mail-line"></i></a>
        </div>
      </div>
      <div>
        <h4>Quick Links</h4>
        <ul>
        ${quick}
          <li><a href="${contactHref}">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4>Services</h4>
        <ul>
          ${data.services.map((s) => `<li><span>${esc(s)}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <p>&copy; <span data-year>${new Date().getFullYear()}</span> ${esc(site.name)}. All rights reserved.</p>
      <p><a href="mailto:${attr(site.email)}">${esc(site.email)}</a></p>
    </div>
  </div>
</footer>`;
}

const foot = (rel) => `
<script src="${rel}assets/js/main.js" defer></script>
</body>
</html>`;

/* -------------------------------------------------------------- home page */

function heroSection() {
  return `
<section class="hero" id="hero">
  <div class="shell">
    <div class="hero__grid">
      <div class="hero__copy">
        <div>
          <h1><span class="gradient-text--hero">${esc(site.role)}</span></h1>
          <h2>${esc(site.tagline)}</h2>
          <p class="hero__intro">${esc(site.intro)}</p>
          ${site.summaryExtra ? `<p class="hero__intro hero__intro--secondary">${esc(site.summaryExtra)}</p>` : ''}
        </div>
        <div class="hero__actions">
          <a class="btn btn--primary" href="${attr(site.resumeUrl)}" target="_blank" rel="noopener noreferrer">Download Resume</a>
          <a class="btn btn--ghost" href="#case-studies">View Case Studies</a>
        </div>
        <div class="hero__socials">
          <a class="icon-btn" href="${attr(site.linkedin)}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="ri-linkedin-fill"></i></a>
          <a class="icon-btn" href="${attr(site.github)}" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="ri-github-fill"></i></a>
        </div>
      </div>
      <div class="hero__portrait">
        <div class="hero__frame">
          <div>
            <picture>
              <source srcset="${attr(site.photoWebp)}" type="image/webp">
              <img src="${attr(site.photo)}" width="900" height="1055" alt="${attr(site.name)} — ${attr(site.role)}" fetchpriority="high">
            </picture>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function statsSection() {
  return `
<section class="section" aria-label="Key numbers">
  <div class="shell">
    <div class="stats">
      ${data.stats.map((s) => `
      <div class="card stat reveal">
        <div class="stat__num" data-count-to="${s.n}" data-suffix="${attr(s.suffix)}">${s.n.toLocaleString('en-US')}${esc(s.suffix)}</div>
        <div class="stat__label">${esc(s.label)}</div>
      </div>`).join('')}
    </div>
  </div>
</section>`;
}

function expertiseSection() {
  return `
<section class="section" id="expertise">
  <div class="shell shell--narrow">
    <div class="section-head reveal">
      <h2><span class="gradient-text">Core Expertise</span></h2>
      <p>${esc(data.copy.expertiseLead)}</p>
    </div>
    <div class="accordion">
      ${data.expertise.map((e, i) => `
      <div class="card accordion__item${i === 0 ? ' is-open' : ''} reveal">
        <button class="accordion__trigger" type="button" aria-expanded="${i === 0}" aria-controls="exp-${e.id}">
          <span class="accordion__label">
            <span class="accordion__num" aria-hidden="true">${e.id}</span>
            <span class="accordion__title">${esc(e.title)}</span>
          </span>
          <i class="ri-arrow-down-s-line accordion__chev" aria-hidden="true"></i>
        </button>
        <div class="accordion__panel" id="exp-${e.id}">
          <div>
            <div class="accordion__body">
              <p>${esc(e.description)}</p>
              <ul class="tags">
                ${e.technologies.map((t) => `<li class="tag">${esc(t)}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      </div>`).join('')}
    </div>
  </div>
</section>`;
}

function caseStudiesSection() {
  const cats = ['All', ...new Set(data.caseStudies.map((c) => c.category))];
  return `
<section class="section" id="case-studies">
  <div class="shell">
    <div class="section-head reveal">
      <h2><span class="gradient-text">Featured Case Studies</span></h2>
      <p>${esc(data.copy.caseStudiesLead)}</p>
    </div>
    <div class="filters" data-filter-group="case-study-grid" role="group" aria-label="Filter case studies">
      ${cats.map((c, i) => `<button class="filter${i === 0 ? ' is-active' : ''}" type="button" data-value="${attr(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`).join('\n      ')}
    </div>
    <div class="grid-cards" id="case-study-grid">
      ${data.caseStudies.map((c) => `
      <a class="card project reveal" data-category="${attr(c.category)}" href="case-study/${attr(c.id)}/">
        <div class="project__media">
          <img src="${attr(c.image)}" width="600" height="400" alt="${attr(c.title)}" loading="lazy" decoding="async">
          <div class="project__overlay"></div>
          <div class="project__meta">
            <span class="badge">${esc(c.category)}</span>
            <i class="ri-arrow-right-line" aria-hidden="true"></i>
          </div>
        </div>
        <div class="project__body">
          <h3>${esc(c.title)}</h3>
          <p>${esc(c.description)}</p>
          <ul class="tags">
            ${c.technologies.slice(0, 3).map((t) => `<li class="tag">${esc(t)}</li>`).join('')}
            ${c.technologies.length > 3 ? `<li class="tag tag--muted">+${c.technologies.length - 3} more</li>` : ''}
          </ul>
        </div>
      </a>`).join('')}
    </div>
  </div>
</section>`;
}

function experienceSection() {
  const work = data.experience.filter((e) => e.type !== 'education');
  const edu = data.experience.filter((e) => e.type === 'education');
  return `
<section class="section" id="experience">
  <div class="shell">
    <div class="section-head reveal">
      <h2><span class="gradient-text">Professional Journey</span></h2>
      <p>${esc(data.copy.experienceLead)}</p>
    </div>
    <div class="two-col">
      <div class="reveal">
        <h3 class="col-title"><i class="ri-briefcase-line" aria-hidden="true"></i>Professional Experience</h3>
        <div class="timeline">
          ${work.map((e) => `
          <div class="timeline__item">
            <div class="card timeline__card">
              <h4>${esc(e.title)}</h4>
              <p class="timeline__org">${esc(e.company)}</p>
              <span class="timeline__period">${esc(e.period)}</span>
              ${e.description ? `<p class="desc">${esc(e.description)}</p>` : ''}
              ${e.achievements && e.achievements.length ? `<ul class="bullets">${e.achievements.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
            </div>
          </div>`).join('')}
        </div>
      </div>
      <div class="reveal">
        <h3 class="col-title"><i class="ri-graduation-cap-line" aria-hidden="true"></i>Education</h3>
        <div class="timeline">
          ${edu.map((e) => `
          <div class="timeline__item">
            <div class="card timeline__card">
              <h4>${esc(e.title)}</h4>
              <p class="timeline__org">${esc(e.company)}</p>
              <span class="timeline__period">${esc(e.period)}</span>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function skillsSection() {
  const cats = ['All', ...new Set(data.skills.map((s) => s.category))];
  return `
<section class="section" id="skills">
  <div class="shell shell--narrow">
    <div class="section-head reveal">
      <h2><span class="gradient-text">Technical Skills</span></h2>
      <p>${esc(data.copy.skillsLead)}</p>
    </div>
    <div class="filters" data-filter-group="skill-grid" role="group" aria-label="Filter skills">
      ${cats.map((c, i) => `<button class="filter${i === 0 ? ' is-active' : ''}" type="button" data-value="${attr(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`).join('\n      ')}
    </div>
    <div class="skills" id="skill-grid">
      ${data.skills.map((s) => `
      <div class="card skill reveal" data-category="${attr(s.category)}">
        <div class="skill__top">
          <span class="skill__name"><i class="${attr(s.icon)}" aria-hidden="true"></i>${esc(s.name)}</span>
          <span class="skill__pct">${s.percentage}%</span>
        </div>
        <div class="meter" role="img" aria-label="${attr(s.name)}: ${s.percentage} percent">
          <div class="meter__fill" data-pct="${s.percentage}" style="width:${s.percentage}%"></div>
        </div>
      </div>`).join('')}
    </div>
    <div class="achievements">
      ${data.achievements.map((a) => `
      <div class="card achievement reveal">
        <i class="${attr(a.icon)}" aria-hidden="true"></i>
        <h4>${esc(a.title)}</h4>
        <ul>${a.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>
      </div>`).join('')}
    </div>
  </div>
</section>`;
}

function blogSection() {
  return `
<section class="section" id="insights">
  <div class="shell">
    <div class="section-head reveal">
      <h2><span class="gradient-text">XR Insights &amp; Blog</span></h2>
      <p>Sharing knowledge about Unity development, XR technologies, and industry trends</p>
    </div>
    <div class="grid-cards">
      ${data.blog.slice(0, 6).map((b) => `
      <article class="card project reveal">
        <div class="project__media">
          <img src="${attr(b.image)}" width="600" height="300" alt="${attr(b.title)}" loading="lazy" decoding="async">
        </div>
        <div class="post__body">
          <div class="post__meta">
            <span class="post__cat">${esc(b.category)}</span>
            <span class="post__read">${esc(b.readTime)}</span>
          </div>
          <h3>${esc(b.title)}</h3>
          <p>${esc(b.excerpt)}</p>
          <span class="post__more">Read More <i class="ri-arrow-right-line" aria-hidden="true"></i></span>
        </div>
      </article>`).join('')}
    </div>
  </div>
</section>`;
}

function contactSection() {
  const projectTypes = ['VR Training Solution', 'Metaverse Platform', 'Multiplayer Game', 'WebGL Application', 'AR Application', 'Enterprise Integration', 'Technical Consultation', 'Other'];
  const budgets = ['Under $25,000', '$25,000 - $50,000', '$50,000 - $100,000', '$100,000 - $250,000', '$250,000+', "Let's Discuss"];
  const timelines = ['ASAP', '1-3 months', '3-6 months', '6-12 months', '12+ months', 'Flexible'];
  const opt = (list) => list.map((v) => `<option value="${attr(v)}">${esc(v)}</option>`).join('');
  return `
<section class="section" id="contact">
  <div class="shell">
    <div class="section-head reveal">
      <h2><span class="gradient-text">Let's Build Immersive Experiences</span></h2>
      <p>${esc(data.copy.contactLead)}</p>
    </div>
    <div class="contact-grid">
      <div class="reveal">
        <h3 class="col-title">Get In Touch</h3>
        <p class="contact-lead">${esc(data.copy.contactBody)}</p>
        <div class="contact-list">
          <div class="contact-item">
            <span class="icon-btn"><i class="ri-mail-line" aria-hidden="true"></i></span>
            <div><span>Email</span><a href="mailto:${attr(site.email)}">${esc(site.email)}</a></div>
          </div>
          <div class="contact-item">
            <span class="icon-btn"><i class="ri-phone-line" aria-hidden="true"></i></span>
            <div><span>Mobile</span><a href="tel:${attr(site.phoneHref)}">${esc(site.phone)}</a></div>
          </div>
          <div class="contact-item">
            <span class="icon-btn"><i class="ri-linkedin-fill" aria-hidden="true"></i></span>
            <div><span>LinkedIn</span><a href="${attr(site.linkedin)}" target="_blank" rel="noopener noreferrer">${esc(site.linkedinLabel)}</a></div>
          </div>
          <div class="contact-item">
            <span class="icon-btn"><i class="ri-github-fill" aria-hidden="true"></i></span>
            <div><span>GitHub</span><a href="${attr(site.github)}" target="_blank" rel="noopener noreferrer">${esc(site.githubLabel)}</a></div>
          </div>
        </div>
        <h4 style="margin:2rem 0 1rem;color:#fff;">Specializing In:</h4>
        <ul class="tags">${data.specializing.map((s) => `<li class="tag">${esc(s)}</li>`).join('')}</ul>
      </div>

      <form class="card form reveal" id="contact-form"${site.formEndpoint ? ` action="${attr(site.formEndpoint)}" method="post"` : ''} data-mailto="${attr(site.email)}">
        <div class="field-row">
          <div class="field">
            <label for="name">Full Name *</label>
            <input id="name" name="name" type="text" required autocomplete="name" placeholder="Your name">
          </div>
          <div class="field">
            <label for="email">Email Address *</label>
            <input id="email" name="email" type="email" required autocomplete="email" placeholder="you@company.com">
          </div>
        </div>
        <div class="field">
          <label for="company">Company/Organization</label>
          <input id="company" name="company" type="text" autocomplete="organization" placeholder="Optional">
        </div>
        <div class="field-row">
          <div class="field">
            <label for="project-type">Project Type *</label>
            <select id="project-type" name="project_type" required>
              <option value="">Select project type</option>${opt(projectTypes)}
            </select>
          </div>
          <div class="field">
            <label for="budget">Budget Range</label>
            <select id="budget" name="budget">
              <option value="">Select budget range</option>${opt(budgets)}
            </select>
          </div>
        </div>
        <div class="field">
          <label for="timeline">Project Timeline</label>
          <select id="timeline" name="timeline">
            <option value="">Select timeline</option>${opt(timelines)}
          </select>
        </div>
        <div class="field">
          <label for="details">Project Details *</label>
          <textarea id="details" name="details" maxlength="500" required placeholder="Tell me about your project, goals and platforms."></textarea>
          <div class="counter">0/500 characters</div>
        </div>
        <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
        <button class="btn btn--primary" type="submit">Send Message</button>
        <p class="form-note" role="status" aria-live="polite"></p>
      </form>
    </div>
  </div>
</section>`;
}

function buildIndex() {
  return [
    head({
      title: site.title,
      description: site.description,
      rel: '',
      canonical: '/',
    }),
    header('', true),
    '<main id="main">',
    heroSection(),
    statsSection(),
    expertiseSection(),
    caseStudiesSection(),
    experienceSection(),
    skillsSection(),
    blogSection(),
    contactSection(),
    '</main>',
    footer('', true),
    structuredData(),
    foot(''),
  ].join('\n');
}

function structuredData() {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    jobTitle: site.role,
    description: site.description,
    email: `mailto:${site.email}`,
    telephone: site.phoneHref,
    sameAs: [site.linkedin, site.github],
    knowsAbout: data.specializing,
  };
  if (SITE_URL) json.url = SITE_URL;
  return `<script type="application/ld+json">${JSON.stringify(json)}</script>`;
}

/* ------------------------------------------------------- case study pages */

function buildCaseStudy(card) {
  const d = data.details[card.id];
  const rel = '../../';
  const parts = [
    head({
      title: `${card.title} — Case Study | ${site.name}`,
      description: d ? d.overview.slice(0, 180) : card.description,
      rel,
      canonical: `/case-study/${card.id}/`,
      image: card.image,
    }),
    header(rel, false),
    '<main id="main" class="page-top">',
    `<section class="shell">
      <a class="back-link" href="${rel}index.html#case-studies"><i class="ri-arrow-left-line" aria-hidden="true"></i> Back to Portfolio</a>
      <div class="cs-head">
        <span class="badge">${esc(card.category)}</span>
        <h1><span class="gradient-text--hero">${esc(card.title)}</span></h1>
        ${d ? `<p class="sub">${esc(d.subtitle)}</p>` : ''}
        <p class="overview">${esc(d ? d.overview : card.description)}</p>
      </div>`,
  ];

  if (d) {
    // Render only what the source material supports. An empty list drops its
    // whole block rather than leaving a heading that invites filler.
    const facts = [
      ['Role', d.role],
      ['Client', d.client],
      ['Duration', d.duration],
      ['Team Size', d.teamSize],
      ['Platforms', d.platforms],
      ['Scale', d.scale],
    ].filter(([, v]) => v);

    const blocks = [
      ['ri-building-line', 'Delivery Highlights', d.architecture],
      ['ri-alert-line', 'Key Challenges', d.challenges],
      ['ri-lightbulb-line', 'Innovative Solutions', d.solutions],
      ['ri-line-chart-line', 'Outcomes &amp; Impact', d.outcomes],
    ].filter(([, , list]) => list && list.length);

    if (facts.length) {
      parts.push(`
      <div class="facts">
        ${facts.map(([k, v]) => `<div class="card fact"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('\n        ')}
      </div>`);
    }

    if (d.images && d.images.length) {
      parts.push(`
      <div class="shots">
        ${d.images.map((img, i) => `<img src="${rel}${attr(img)}" width="800" height="500" alt="${attr(card.title)} — screenshot ${i + 1}" loading="lazy" decoding="async">`).join('\n        ')}
      </div>`);
    }

    const demos = videosFor(d);
    if (demos.length) {
      parts.push(`
      <div class="cs-demos">
        <h2 class="col-title"><i class="ri-play-circle-line" aria-hidden="true"></i>Project Demo</h2>
        <div class="grid-cards grid-cards--demos">
          ${demos.map((g) => videoCard(g, rel)).join('')}
        </div>
      </div>`);
    }

    parts.push(`
      <div class="card cs-block" style="margin-bottom:1.5rem;">
        <h3><i class="ri-stack-line" aria-hidden="true"></i>Technology Stack</h3>
        <ul class="tags">${d.techStack.map((t) => `<li class="tag">${esc(t)}</li>`).join('')}</ul>
      </div>`);

    if (blocks.length) {
      parts.push(`
      <div class="cs-blocks">
        ${blocks.map(([icon, heading, list]) => `<div class="card cs-block">
          <h3><i class="${icon}" aria-hidden="true"></i>${heading}</h3>
          <ul class="bullets${heading.startsWith('Outcomes') ? ' outcomes' : ''}">${list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        </div>`).join('\n        ')}
      </div>`);
    }
  } else {
    // No long-form write-up authored yet — show what the card knows.
    parts.push(`
      <div class="shots" style="margin-top:3rem;">
        <img src="${rel}${attr(card.image)}" width="600" height="400" alt="${attr(card.title)}" loading="lazy" decoding="async">
      </div>
      <div class="card cs-block">
        <h3><i class="ri-stack-line" aria-hidden="true"></i>Technology Stack</h3>
        <ul class="tags">${card.technologies.map((t) => `<li class="tag">${esc(t)}</li>`).join('')}</ul>
      </div>
      <p style="color:var(--gray-400);margin-top:2rem;">A detailed write-up for this project is in progress. <a href="${rel}index.html#contact" style="color:var(--cyan-300);">Get in touch</a> if you'd like to hear more about it.</p>`);
  }

  parts.push(`
      <div class="card cta-panel">
        <h2><span class="gradient-text">Ready to Build Your Next XR Experience?</span></h2>
        <p>Let's discuss how we can create innovative solutions for your business</p>
        <div class="row">
          <a class="btn btn--primary" href="${rel}index.html#contact">Start a Project</a>
          <a class="btn btn--ghost" href="${rel}index.html#case-studies">View More Projects</a>
        </div>
      </div>
    </section>`);

  // The lightbox only needs to exist when the page has something to play.
  parts.push('</main>');
  if (videosFor(d).length) parts.push(lightboxMarkup());
  parts.push(footer(rel, false), foot(rel));
  return parts.join('\n');
}

/* ------------------------------------------------------------ gallery page */

/* Shared between the gallery and the case study pages so a video is defined
   once, in data.gallery, and both places stay in step. */

const videoCard = (g, rel, { filterable = false } = {}) => `
      <button class="card video-card reveal" type="button"${filterable ? ` data-category="${attr(g.category)}"` : ''} data-video="${attr(g.videoUrl)}" data-title="${attr(g.title)}">
        <div class="video-card__media">
          <img src="${rel}${attr(g.thumbnail)}" width="640" height="360" alt="${attr(g.title)}" loading="lazy" decoding="async">
          <span class="video-card__play"><i class="ri-play-fill" aria-hidden="true"></i></span>
        </div>
        <div class="video-card__body">
          <h3>${esc(g.title)}</h3>
          <span class="post__cat">${esc(g.category)}</span>
        </div>
      </button>`;

const lightboxMarkup = () => `
<div class="lightbox" role="dialog" aria-modal="true" aria-label="Video player">
  <div class="lightbox__inner">
    <div class="lightbox__bar">
      <h3></h3>
      <button class="lightbox__close" type="button" aria-label="Close video"><i class="ri-close-line"></i></button>
    </div>
    <div class="lightbox__frame"></div>
    <p class="lightbox__fallback is-hidden">
      Video not playing? <a href="#" target="_blank" rel="noopener noreferrer">Open it directly<i class="ri-external-link-line" aria-hidden="true"></i></a>
    </p>
  </div>
</div>`;

/** Resolve a detail page's `videos` (gallery ids) to gallery entries. */
function videosFor(detail) {
  if (!detail || !detail.videos) return [];
  return detail.videos
    .map((id) => {
      const found = data.gallery.find((g) => g.id === id);
      if (!found) throw new Error(`details.videos references unknown gallery id: ${id}`);
      return found;
    });
}

function buildGallery() {
  const rel = '../';
  const cats = ['All', ...new Set(data.gallery.map((g) => g.category))];
  return [
    head({
      title: `Video Gallery — ${site.name}`,
      description: 'Recorded walkthroughs of XR experiences, metaverse platforms and enterprise Unity solutions.',
      rel,
      canonical: '/gallery/',
    }),
    header(rel, false),
    `<main id="main" class="page-top">
  <section class="shell">
    <a class="back-link" href="${rel}index.html"><i class="ri-arrow-left-line" aria-hidden="true"></i> Back to Home</a>
    <div class="section-head">
      <h2><span class="gradient-text">Video Gallery</span></h2>
      <p>Explore a portfolio of immersive XR experiences, metaverse platforms, and enterprise solutions</p>
    </div>
    <div class="filters" data-filter-group="gallery-grid" role="group" aria-label="Filter videos">
      ${cats.map((c, i) => `<button class="filter${i === 0 ? ' is-active' : ''}" type="button" data-value="${attr(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`).join('\n      ')}
    </div>
    <div class="grid-cards" id="gallery-grid">
      ${data.gallery.map((g) => videoCard(g, rel, { filterable: true })).join('')}
    </div>
  </section>
</main>
${lightboxMarkup()}`,
    footer(rel, false),
    foot(rel),
  ].join('\n');
}

/* ---------------------------------------------------------------- 404 page */

/* A 404 body is served AT the missing URL, not redirected to /404.html, so its
   relative links would resolve against whatever deep path the visitor hit. A
   <base> pins them. SITE_BASE is "/" at a domain root and "/<repo>/" for a
   GitHub Pages project site; the deploy workflow sets it. */
function build404() {
  return [
    head({
      title: `Page not found — ${site.name}`,
      description: 'That page does not exist.',
      rel: '',
      base: process.env.SITE_BASE || '/',
    }),
    header('', false),
    `<main id="main" class="page-top">
  <section class="shell" style="min-height:50vh;display:grid;place-items:center;text-align:center;">
    <div>
      <h1 style="font-size:clamp(2.5rem,6vw,4rem);margin:0 0 1rem;"><span class="gradient-text">404</span></h1>
      <p style="color:var(--gray-300);margin:0 0 2rem;">That page doesn't exist — it may have moved.</p>
      <a class="btn btn--primary" href="index.html">Back to Home</a>
    </div>
  </section>
</main>`,
    footer('', false),
    foot(''),
  ].join('\n');
}

/* ------------------------------------------------------------------ write */

function write(relPath, contents) {
  const full = join(OUT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents);
  return relPath;
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(ROOT, 'static'), OUT, { recursive: true });

const written = [];
written.push(write('index.html', buildIndex()));
written.push(write('gallery/index.html', buildGallery()));
written.push(write('404.html', build404()));
for (const card of data.caseStudies) {
  written.push(write(`case-study/${card.id}/index.html`, buildCaseStudy(card)));
}

// sitemap + robots (only meaningful once a real domain is set in content.json)
if (SITE_URL) {
  const base = SITE_URL;
  const urls = ['/', '/gallery/', ...data.caseStudies.map((c) => `/case-study/${c.id}/`)];
  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${base}${u}</loc></url>`)
      .join('\n')}\n</urlset>\n`
  );
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
} else {
  write('robots.txt', 'User-agent: *\nAllow: /\n');
}

console.log(`Built ${written.length} pages into dist/`);
written.forEach((p) => console.log('  ' + p));
