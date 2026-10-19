# Java Backend Tracker

A responsive, no-login learning tracker built with plain HTML, CSS and JavaScript. Includes the timestamped Java/backend roadmap, completion percentage, search/filter, daily journal, and JSON backup import/export.

## Run locally
Open `index.html` in a browser. For best results, use VS Code Live Server.

## Deploy to GitHub Pages
1. Create a GitHub repository, e.g. `java-backend-tracker`.
2. Upload all files/folders in this project (keep `assets/roadmap.js` in the `assets` folder).
3. Open **Settings → Pages**.
4. Under Build and deployment, select **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
5. Wait for GitHub Pages to publish the site. Pin the repository on your GitHub profile and add the published Pages URL to your profile README.

## Persistence: read this before publishing
- Progress auto-saves to `localStorage` in the browser/device where you tick topics or add journal entries. Refreshing the page will not reset it.
- `localStorage` is **not** shared between visitors, browsers, devices, or private/incognito sessions. Clearing browser site data can erase it.
- Use **Export backup** regularly to download a JSON snapshot; **Import backup** restores it in the same browser.
- A public GitHub Pages site cannot securely write your progress back to the repository using frontend-only JavaScript. Do not put a GitHub personal access token in `app.js` or any public frontend file.
- Therefore visitors can view the site, but their view will not automatically show your personal progress unless you publish an updated public progress file or connect a backend/authenticated service. A truly shared, always-synced progress feed requires a backend or a secure GitHub Actions workflow.

## Customize
- Edit your display name, title and GitHub profile link in `index.html`.
- Edit the roadmap topics and timestamps in `assets/roadmap.js`.
- No login, password, database, framework, or build step is required.
