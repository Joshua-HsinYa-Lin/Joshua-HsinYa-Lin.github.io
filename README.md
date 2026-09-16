# Interactive portfolio

Live at [joshua-hsinya-lin.github.io](https://joshua-hsinya-lin.github.io). Static
site, no build step, no dependencies. Every interactive is plain JavaScript on a
canvas, and every curve is computed from the physics on the page.

## Layout

    index.html            home page, renders cards from the manifest
    about/index.html      the written version: every entry with its figures
    shared/site.css       design tokens and components
    shared/site.js        canvas, animation loop, plotter, controls, seven segment digit
    projects/manifest.js  the registry: one entry per project, in display order
    projects/<slug>/      one folder per project, self contained
        index.html        the page, with its own script inline
        *.png *.jpg       its images

## Adding a project

1. Create `projects/<slug>/index.html`. Copy any existing project page as the
   template; it shows the section structure and how the shared helpers are used.
2. Put the images in the same folder.
3. Add one entry to `projects/manifest.js` with a slug, title, hook, dates, tags
   and a small `preview` function for the home page card.

Nothing else changes. A project marked `status` in the manifest shows that label
on its card, which is how upcoming work is listed honestly.

## Rules the pages follow

Numbers come from measured work or from a formula the page itself computes. A
control the reader moves is a model; a number quoted beside it is a measurement,
and the page says which is which. Where a real measurement would improve a page
and has not been supplied, the page carries a marked hook rather than a made up
value.

Two projects have boundaries. Taiwan Space Agency work is shown at the level
already public: photographs, the blurred poster, and the numbers on the resume.
Purdue SoCET work is shown at architecture level, nothing about process, tool
configuration or PDK.
