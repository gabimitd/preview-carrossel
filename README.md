# Preview Carrossel — Instagram

Static web app to preview how a carousel post will look on Instagram. Upload a wide image (or several individual images), the app auto-splits the slides, and you preview the result inside an Instagram frame (mobile/desktop, light/dark) with editable avatar, @, caption, likes, comments, etc. Export as PNG (preview) or ZIP (slides).

Multi-user without login — each browser stores its own profiles, drafts, and theme.

## Dev

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest
npm run build    # produces dist/
```

## Deploy

Vercel auto-detects the Vite project. `vercel --prod` from the repo root, or push to a branch wired to a Vercel project.

## Architecture

- Vite + TypeScript (vanilla, no framework)
- Reactive store in `src/state.ts`
- All image processing in the browser via Canvas API
- Persistence via `localStorage`
- Spec: `docs/superpowers/specs/2026-05-09-preview-carrossel-instagram-design.md`
- Plan: `docs/superpowers/plans/2026-05-09-preview-carrossel.md`
