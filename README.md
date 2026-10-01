# Portfolio site

Source code of the personal portfolio of Lennard Capece. It is a static React single-page app with
client-side routing: a scroll-driven "dive" hero (a fixed canvas that scrubs through a sequence of
pre-rendered WebP frames as you scroll), a descent through four featured projects, a services list
and a contact section on the home page, plus a Work page with six case studies, an About page and a
Privacy page. Each case-study tile on the Work page has a coded canvas animation driven by that case
study's figures, with a short ambient video clip underneath.

Live site: https://lennard-capece.vercel.app

## Built with Claude Code

Claude Code is the author's daily driver for building software, and this site was built that way.

The case-study copy on the Work page is the author's own account of his projects. The code behind
those projects (backends, scrapers, pipelines) is not in this repository, only the write-ups.

## Stack

- React 19 and React Router 7
- Vite 8 and Tailwind CSS 4 (via `@tailwindcss/vite`)
- motion (`motion/react`) for scroll-linked and entrance animation, GSAP for the magnetic buttons,
  Lenis for smooth scrolling
- Plain 2D canvas for the dive hero, the bubbles overlay and the Work-tile animations
- Oxlint for linting
- Hosting target: Vercel (static output, see [Deploying](#deploying))

There is no backend, no database, no test suite and no environment variables. The site makes no
network requests of its own beyond loading its own files, sets no cookies and runs no analytics.
Fonts are self-hosted in `public/fonts`.

## Quick start

Requires Node 20.19+ or 22.12+ (the engine range declared by Vite 8 in `package-lock.json`).

```bash
npm install
npm run dev       # start the Vite dev server (it prints the local URL)
npm run build     # production build into dist/
npm run preview   # serve the production build locally
npm run lint      # run Oxlint
```

No `.env` file is needed, so there is no `.env.example`. `.gitignore` still excludes `.env*` files
in case you add one.

## Project structure

```
index.html              entry HTML: title, description, font preloads
vite.config.js          Vite config: React plugin and Tailwind plugin
.oxlintrc.json          Oxlint rules
src/
  main.jsx              React root and BrowserRouter
  App.jsx               routes (/, /work, /about, /privacy), Lenis smooth scroll, footer
  index.css             Tailwind import, colour tokens, self-hosted @font-face rules
  pages/
    Home.jsx            composes the dive, hero, stations, services and contact sections
    Work.jsx            the six case studies (WORK_ITEMS), bento grid, case-study modal
    About.jsx
    Privacy.jsx
    PageHeader.jsx
  components/
    ScrollScrubSpine.jsx  fixed canvas that scrubs 181 WebP frames from public/dive
    BubblesOverlay.jsx    ambient bubbles canvas over the dive
    HeroOasis.jsx         hero copy over the dive
    Stations.jsx          four featured projects revealed as you descend
    Services.jsx
    RippleContact.jsx     contact section (mailto form, booking and profile links)
    Nav.jsx               header, profile links
    TileAnimations.jsx    one canvas animation per case study
    TileVideo.jsx         looping ambient clip behind a Work tile
    MagneticButton.jsx, TiltCard.jsx, ScrambleText.jsx
  lib/
    useReduced.js         reduced-motion hook
public/
  dive/                 181 WebP frames for the hero scrub
  tile-video/           ambient clips for the Work tiles (webm, mp4 and poster per clip)
  stations/             images for the home-page stations
  fonts/                self-hosted woff2 files
  vercel.json           single-page-app rewrite and security headers (including a CSP limited
                        to the site's own origin)
```

Files not listed above are unused leftovers (see [Known rough edges](#known-rough-edges)), apart
from `public/robots.txt` and `public/sitemap.xml`, which are served but out of date.

## Deploying

The build output is plain static files. Routes such as `/work` need a rewrite to `index.html`;
`public/vercel.json` provides that for Vercel. Because it lives in `public/`, `vite build` copies it
to the root of `dist/`, so it takes effect when you deploy the `dist/` folder. If you deploy from
the project root instead, move `vercel.json` there.

## What was deliberately left out of this public version

This repository contains only the front-end source and static assets of the site. Left out on
purpose, for privacy, security and client confidentiality:

- **Keys and credentials:** no API keys, tokens, OAuth data, cookies or `.env` files. The site
  needs none.
- **Client details:** the measurement-app case study is anonymised ("a health-tech client").
  The client's name, code and data are not in this repository.
- **Project code and data:** the case studies describe other projects (a Cloudflare Worker proxy,
  a trading signal engine, a saved-posts sync, a lead scraper). None of their code, datasets or
  third-party business records are included, only the write-ups on the Work page.
- **Private identifiers:** no private email address, phone numbers, street addresses, account or
  tax numbers, spreadsheet, calendar or Notion IDs, cloud account or project IDs, private server
  addresses or local file paths.
- **Working-folder leftovers:** no git history, `node_modules`, build output, or local tooling
  configuration from the original working folder.

What does remain, because it is already public on the live site: the author's name, the public
business contact address and booking link used in the contact section and the Privacy page, links
to the author's public freelance profiles, and the URL of the live ARVO demo.

## Using this as a template

The copy, case studies and contact details in `src/` describe the author and his work. If you fork
this, replace them with your own:

- `src/components/Nav.jsx`: profile links
- `src/components/RippleContact.jsx` and `src/pages/Privacy.jsx`: contact address and booking link
- `src/pages/Work.jsx` and `src/components/Stations.jsx`: case studies and stations
- `src/pages/About.jsx`, `src/components/HeroOasis.jsx` and `index.html`: name, location, description
- `public/robots.txt` and `public/sitemap.xml`: see below

`src/pages/Privacy.jsx` is a first-person privacy policy written for the author's own site, so it
will not be accurate for yours without a rewrite.

The ambient clips in `public/tile-video` for the case-study tiles were generated with Higgsfield from
each project's key art, except the ARVO clip, which is the reveal from the live ARVO site (as stated
in the Work page copy).

## Known rough edges

- `public/robots.txt` and `public/sitemap.xml` are leftovers from the ARVO demo site: they point at
  that site, not at this site's routes (`/`, `/work`, `/about`, `/privacy`).
- `src/components/Hud.jsx`, `Marquee.jsx`, `OrbHub.jsx`, `LightWorld.jsx` and `ChromeRibbon.jsx` are
  not imported by any page. `OrbHub.jsx` and `LightWorld.jsx` also import `../lang.jsx`, which is
  not in this repository, so they would not compile if used.
- The `three` dependency, `src/lib/sunsetEnv.js`, `public/tiles/`, `public/draco/` and
  `public/sculpture.glb` are only used by that unused code. `public/hero/`, `public/about-visual.*`, `public/og.jpg`,
  `public/icons.svg`, `public/favicon.svg` and `src/assets/` are not referenced by `index.html` or
  `src/` either. All of these can be deleted.
- `npm run build` prints a Vite chunk-size warning for the main bundle.

## Licence

The code is released under the [MIT License](LICENSE).

The font files in `public/fonts` are third-party (Satoshi and Cabinet Grotesk from Fontshare,
Archivo and Instrument Serif from Google Fonts). They are not covered by the MIT licence and keep
their own licence terms; check them before reusing or redistributing.

Portfolio: https://lennard-capece.vercel.app
