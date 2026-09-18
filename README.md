# Interactive portfolio

Live at [joshua-hsinya-lin.github.io](https://joshua-hsinya-lin.github.io). Static
site, no build step, no dependencies. Every interactive is plain JavaScript on a
canvas.

## Layout

    index.html            home page: hero, scannable facts, project cards
    about/index.html      the written version: every entry with its figures
    404.html              styled not-found page
    resume.pdf            the current resume, linked from the hero and the header
    robots.txt            allows crawling, points at the sitemap
    sitemap.xml           home, about, and every project page
    shared/site.css       design tokens and components
    shared/site.js        canvas, animation loop, plotter, accessible controls
    projects/manifest.js  one entry per project: slug, title, preview function
    projects/index.html   redirect, so a typed folder URL never shows a listing
    projects/<slug>/      one folder per project, self contained
        index.html        the page, with its own script inline
        *.png *.jpg       its images
    scripts/check_site.mjs   links, manifest sync, sitemap, ids, alt text, meta
    scripts/check_a11y.mjs   contrast, accessible names, focus and motion rules

## The three categories, and why they are labeled

Every page says which of these it is showing, on the page, near the thing itself.
Nothing illustrative or modeled is ever written as though it were measured.

**Measured.** A bench reading, a lab result, an instrument capture, or a count
taken from a real artifact. The 727 ms to 263 ms latency cut, the 9.5% error
against LTspice, the 2.092 RMSE, the harness tally.

**Simulation.** Physics or logic computed live on the page from the real design:
the boost converter running from its own circuit equations, the FPGA emulator
running the control logic ported from the SystemVerilog, the Friis cascade.

**Illustrative.** Typical or generic values chosen so the behavior is visible.
The TASA interactives use generic inertias and gains, not TASA's. The Lunabotics
pack uses typical lithium ion thresholds, not the programmed ones. These are
labeled, and a marked hook says what real data would replace them.

Numbers quoted in prose come from the fact bank in the Resume Sandbox repository.
No number on this site is invented to fill a gap.

## Running the checks

    node scripts/check_site.mjs
    node scripts/check_a11y.mjs

The first walks every page: every local link and asset resolves to a file that
exists and is not a directory, every manifest slug has both a page and a card,
the sitemap matches, ids are unique, images have alt text, canvases are labeled
or marked decorative, and the head carries a title, description and canonical.

The second is a static accessibility linter: contrast ratios for every color
token pair against WCAG AA, controls with no accessible name, click handlers on
elements that cannot take focus, and the presence of focus and reduced motion
rules. It is a floor, not a full audit. For the full thing, serve the site and
run axe against it:

    python -m http.server 8000
    npx @axe-core/cli http://localhost:8000/index.html

## Adding a project

1. Create `projects/<slug>/index.html`. Copy an existing project page; it shows
   the section structure, the head metadata, and how the shared helpers are used.
2. Put the images in the same folder.
3. Add a card to `index.html` with `data-slug="<slug>"`. The cards are real HTML
   so the site works with JavaScript disabled.
4. Add one entry to `projects/manifest.js` with the slug and a small `preview`
   function for the card's canvas.
5. Add the page to `sitemap.xml`.
6. Run both check scripts.

A project marked `status` in the manifest shows that label on its card. Work that
does not exist yet lives in the separate "Starting this semester" section rather
than beside finished projects.

## Accessibility and motion

Every interactive control is reachable and operable from the keyboard; nothing
essential is hover-only or drag-only. Where a canvas takes a drag, the same
variable has a slider or buttons beside it. Charts distinguish series by dash
pattern and marker as well as color, and live values appear as text next to the
canvas rather than only inside it.

Animation respects `prefers-reduced-motion`. Under that setting every loop draws
a single static frame, and a button appears in the header to start motion for
anyone who wants it.

## Boundaries

Taiwan Space Agency work is shown at the level already public: photographs, the
blurred poster, and the figures on the resume. Every simulation on that page is
generic physics.

Purdue SoCET work is shown at architecture level. Nothing about process, tool
configuration or PDK.
