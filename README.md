# Leondraw

Leondraw is a lightweight, mobile-friendly web app that lets you load or capture a reference photo and build perspective guides directly on top of it. Because it is a static site you can deploy it straight to GitHub Pages—no servers or build steps required unless you opt into the included GitHub Actions workflow that builds and publishes the site for you.

## Live site

Every push to `main` automatically rebuilds and deploys the latest static files through `.github/workflows/deploy.yml`. The live deployment for this repository is available at:

- https://dunkFordyce.github.io/leondraw/

If you fork the project, replace `dunkFordyce` with your own GitHub username to load your fork's hosted instance.

## Pushing changes to your GitHub repo

This workspace is not linked to your GitHub repository, so you still need to push the commits yourself before you will see them
on https://github.com/dunkFordyce/leondraw. You can either download the updated files and upload them manually, or connect this
repo to your remote and push directly:

```bash
git remote add origin git@github.com:dunkFordyce/leondraw.git   # run once
git add .
git commit -m "Describe your change"
git push origin main
```

Once the push completes, GitHub Pages will redeploy automatically via the workflow below.

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

### Automatic deployment (recommended)

The repo ships with `.github/workflows/deploy.yml`, a workflow that publishes the static assets to the `github-pages` environment via the official `actions/deploy-pages` action.

1. Push your changes to `main` (or dispatch the workflow manually from the Actions tab).
2. The workflow copies `index.html`, `styles.css`, `app.js`, and the README into a `dist/` folder and uploads it as the Pages artifact.
3. GitHub automatically deploys the artifact to GitHub Pages—no manual branch management required.

### Manual deployment

1. Commit `index.html`, `styles.css`, and `app.js` to your repository's default branch.
2. Enable GitHub Pages on that branch (Settings → Pages → Build and deployment → Deploy from a branch).
3. Your drawing helper will be available at `https://<username>.github.io/<repo>/`.
