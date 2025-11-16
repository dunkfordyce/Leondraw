# Leondraw

Leondraw is a lightweight, mobile-friendly web app that lets you load or capture a reference photo and build perspective guides directly on top of it. Because it is a static site you can deploy it straight to GitHub Pages—no servers or build steps required.

## Features

- 📷 **Photo capture / upload** – Works with any image stored on your device or taken on the spot via the camera.
- 📐 **Guide tools** – Drop single guide lines, auto-build perspective grids from a vanishing point, or erase individual guides.
- 🎨 **Custom styling** – Pick colors, adjust line width, grid density, and the number of depth rings to match the drawing you want to create.
- 🧽 **Non-destructive** – Nothing is ever uploaded. Clear or undo guides without touching the underlying photo.

## Local development

1. Serve the project from the repo root (any static file server works). For example:

   ```bash
   npx serve .
   ```

2. Open `http://localhost:3000` (or the port from your server) in a modern browser. Mobile Safari/Chrome are supported.

## Deploying to GitHub Pages

1. Commit `index.html`, `styles.css`, and `app.js` to your repository's default branch.
2. Enable GitHub Pages on that branch (Settings → Pages → Build and deployment → Deploy from a branch).
3. Your drawing helper will be available at `https://<username>.github.io/<repo>/`.
