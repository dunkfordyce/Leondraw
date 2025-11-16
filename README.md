# Leondraw

Leondraw is a camera-first, mobile-friendly drawing aide that runs entirely on GitHub Pages. Fill the viewport with a live photo you capture in-app, then toggle up to three draggable perspective grids to guide your sketching.

## Live site

Every push to `main` automatically rebuilds and deploys the latest static files through `.github/workflows/deploy.yml`. The live deployment for this repository is available at:

- https://dunkFordyce.github.io/leondraw/

If you fork the project, replace `dunkFordyce` with your own GitHub username to load your fork's hosted instance.

## Pushing changes to your GitHub repo

This workspace is not linked to your GitHub repository, so you still need to push the commits yourself before you will see them on https://github.com/dunkFordyce/leondraw. You can either download the updated files and upload them manually, or connect this repo to your remote and push directly:

```bash
git remote add origin git@github.com:dunkFordyce/leondraw.git   # run once
git add .
git commit -m "Describe your change"
git push origin main
```

Once the push completes, GitHub Pages will redeploy automatically via the workflow below.

## Features

- 📷 **Camera capture only** – Tap *Take photo* to open your device camera, snap a shot, and the app fills the entire screen with that frame. No uploads, no storage.
- 🌀 **Three independent perspective grids** – Enable, edit, or delete each grid from the floating corner menu. Every grid has its own color, density, spacing, opacity, and line thickness controls.
- 🎯 **Drag-friendly vanishing points** – Each grid exposes a handle you can drag with a finger (or mouse) to reposition its vanishing point live over the reference image.
- ⚙️ **Settings dialog** – Configure names and parameters for each grid in a dedicated modal so you can quickly dial in the guide that matches your drawing.
- 🛡️ **Privacy-friendly** – Everything renders client-side on canvases; once you close the tab the captured photo and grids disappear.

## Local development

1. Serve the project from the repo root (any static file server works). For example:

   ```bash
   npx serve .
   ```

2. Open `http://localhost:3000` (or the port from your server) in a modern browser. Mobile Safari/Chrome are supported. You must allow camera access to test the capture workflow.

## Deploying to GitHub Pages

### Automatic deployment (recommended)

The repo ships with `.github/workflows/deploy.yml`, a workflow that publishes the static assets to the `github-pages` environment via the official `actions/deploy-pages` action.

1. Push your changes to `main` (or dispatch the workflow manually from the Actions tab).
2. The workflow copies `index.html`, `styles.css`, `app.js`, and the README into a `dist/` folder and uploads it as the Pages artifact.
3. GitHub automatically deploys the artifact to GitHub Pages—no manual branch management required.

### Manual deployment

1. Commit `index.html`, `styles.css`, and `app.js` to your repository's default branch.
2. Enable GitHub Pages on that branch (Settings → Pages → Build and deployment → Deploy from a branch).
3. Your drawing helper will be available at `https://<username>.github.io/<repo>/`.
