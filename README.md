# Flatten Revolved Curve

A tiny browser prototype for turning vase-like revolved profiles into flattened papercraft-style templates.

The project samples a cubic Bezier side profile, imagines it revolved around a vertical axis, and maps the resulting surface into repeated 2D template sections that can be exported as SVG.

## Run

Open `index.html` in a browser.

The current profile, section count, and sampling settings are hard-coded in `setup.js`. When the page loads, it draws a canvas preview and adds a "Download SVG" link for the flattened template.

## Files

- `index.html` loads the canvas and module script.
- `setup.js` contains the drawing, sampling, and SVG export logic.
- `helpers.js` contains the Bezier and geometry helpers.

## Status

This is an early prototype. Useful next steps include separate closed paths for each panel, glue tabs, printable scale controls, and UI controls for editing the vase profile.
