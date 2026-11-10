# Alan Del Angel - Portfolio

Static bilingual site (HTML, CSS and vanilla JavaScript, no frameworks). Open `index.html` in a browser to preview it locally.

## Structure

```
portafolio-alan/
  index.html                  Spanish home page (all sections)
  404.html                    Bilingual "page not found" page
  css/styles.css              Colors, fonts and layout for the whole site
  js/main.js                  Theme toggle, filters, copy buttons, typing effect, scroll animations, language memory
  js/chat.js                  Chat widget (loaded on every page)
  api/chat.py                 Chat backend: Vercel Python function, standard library only
  vercel.json                 Function timeout and security headers
  sitemap.xml, robots.txt     Search engine files for https://alandelangel.dev
  assets/img/og-es.png, og-en.png   Link preview images (1200 x 630)
  .env.example                Environment variables the chat needs (no real values)
  proyectos/                  Spanish case studies
    erp-freelance.html
    etl-power-bi.html
    diabetes.html
    plantilla-proyecto.html   Blank template for new Spanish case studies
  certificados/
    especialidad-ingles.html  Harmon Hall diploma (Spanish)
  en/                         English version of the site
    index.html
    projects/                 erp-web-app.html, etl-automation.html, diabetes-risk.html
    certificates/             english-specialization.html
  assets/
    img/                      Images; img/en/ holds the English versions of my own diagrams and charts
    docs/                     Supporting PDFs (see docs/README.txt)
    cv/                       CV in Spanish and English
```

Spanish page URLs (`proyectos/`, `certificados/`) are kept in Spanish on purpose: they are part of the Spanish site's content. Everything else (code, file names, comments) is in English.

## Languages

- Each Spanish page has an English counterpart under `en/`, linked with `hreflang` tags and the ES/EN button in the nav bar.
- The Spanish home page sends visitors whose browser is not set to Spanish to `en/index.html`. It only does this on the home page, never for search engines, and never after the visitor has picked a language with the ES/EN button (stored in `localStorage` as `lang`).

## Home page sections

1. Hero and key figures
2. Projects (with filters)
3. Education and certifications
4. Experience
5. Skills
6. How I work
7. Learning now (hidden)
8. Off the clock / AFK
9. Contact

Each section is marked in the HTML with a comment such as `<!-- 2. PROJECTS -->`.

## Common changes

**Colors:** edit the variables at the top of `css/styles.css` (`--forest`, `--lime`, etc.). There is one block for the light theme and one for the dark theme.

**Add a project card:** copy a full `<article class="project" ...>` block inside `<div class="projects">` and update the text in both `index.html` and `en/index.html`. `data-categories` decides which filters show it: `featured`, `fullstack` and `data`, separated by spaces.

**Add a filter:** add a button inside `<div class="filters">` with `data-filter="name"`, then add `name` to the `data-categories` of the matching cards.

**New case study:** duplicate `proyectos/plantilla-proyecto.html`, replace everything in [brackets], create its English counterpart under `en/projects/`, and link both pages to each other with `hreflang`.

## Chatbot

A small assistant that answers questions about Alan using only the site's information, and declines unrelated topics. The "Fun fact" button returns one of a few fixed personal facts without calling OpenAI.

How it stays cheap and safe:

- The OpenAI key lives only in Vercel's environment variables (`OPENAI_API_KEY`), never in the code.
- Requests are accepted only from the site's own origin (`ALLOWED_ORIGINS`).
- Rate limits: 12 messages per visitor every 10 minutes, 40 per day, and 400 per day in total. They use Upstash Redis when configured, with an in-memory fallback.
- Input limits: 500 characters per message, the last 8 turns of history, 8 KB per request.
- Small model (`gpt-5-nano` by default) with a cap on output tokens.
- The widget renders every reply as plain text, so nothing from the server can inject HTML.
- Set a monthly budget in the OpenAI dashboard as a final safety net.

To update what the assistant knows, edit `PROFILE` and `FUN_FACTS` in `api/chat.py`.

## Profile photo

Save a square photo (at least 800 x 800 px, face centered) as `assets/img/photo.jpg`. It replaces the "AD" initials in the hero diamond on both home pages automatically; delete the file to go back to the initials. The diamond crops the corners of the photo, so keep the face near the middle.

## Confidentiality

ERP screenshots and the sample PDF use mock data, published with the client's permission. The client's name, domain and source code are not public. Dashboard replicas use fictitious data.

## Resumen

Portafolio bilingüe (español e inglés) hecho con HTML, CSS y JavaScript sin frameworks. La versión en inglés vive en `en/`, la portada detecta el idioma del navegador e incluye un asistente con IA que responde preguntas sobre Alan.
