Frontend Architecture Notes

- Location: `frontend/voicetherapy`
- Framework: Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui.
- Routing model: App Router via `app/` with `app/page.tsx` for `/` and `app/session/page.tsx` for `/session`.
- Entry points:
  - Layout: `frontend/voicetherapy/app/layout.tsx`
  - Global CSS: `frontend/voicetherapy/app/globals.css`
- v0/shadcn integration:
  - v0 components live in `frontend/voicetherapy/components` and `frontend/voicetherapy/components/ui`.
  - Main session UI: `frontend/voicetherapy/app/session/page.tsx`
  - Landing UI: `frontend/voicetherapy/app/page.tsx` + `frontend/voicetherapy/components/landing-hero.tsx`
  - State management is local React state (no global store).
- Animations: CSS keyframes in `frontend/voicetherapy/app/globals.css`; no GSAP/Framer dependencies.
- Scripts: `npm run dev`, `npm run lint`, `npm run build` from `frontend/voicetherapy`.
