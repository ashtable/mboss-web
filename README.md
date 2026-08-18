# mboss-web

The public mBoss site — the Next.js App Router app behind `mboss.dev`. It
serves the waitlist landing page, the subscriber's manage page, the admin
console, and the handful of route handlers that proxy to the private API.
It is the only publicly routable service in the cloud stack.

## Clone

Two submodules are nested here and consumed as TypeScript source, so a
plain clone is not enough:

```
git clone --recurse-submodules https://github.com/ashtable/mboss-web
# or, in an existing clone:
git submodule update --init --recursive
```

- `mboss-zod` — the wire schemas shared with the API.
- `mboss-core` — the email render layer, at the `@mboss/core/email` subpath
  only. The admin console previews a broadcast with the same code the
  worker sends it with.

## Run

```
npm ci
npm run dev          # http://localhost:3000
```

Copy `.env.example` to `.env.local` first, or bring the whole stack up with
`docker compose up` from the superproject, which supplies the environment
itself.

## Scripts

| Script           | What it does                                 |
| ---------------- | -------------------------------------------- |
| `npm run dev`    | Development server on port 3000              |
| `npm run build`  | Production build                             |
| `npm start`      | Serve a production build                     |
| `npm test`       | Hermetic unit tests — no network, no browser |
| `npm run lint`   | `tsc --noEmit`, ESLint, and a Prettier check |
| `npm run format` | Rewrite with Prettier                        |

Both `dev` and `build` run on webpack rather than Turbopack: the nested
submodules import their own siblings with a `.js` extension, which webpack
can resolve to the `.ts` file and Turbopack cannot. `next.config.ts` says
so at the setting that does it.

The browser-driven suite is not here. It lives in `mboss-e2e-tests` and
runs against the superproject's compose stack, because what it proves —
that the design tokens resolve, that the copy is on the page, that a
signup reaches Postgres — needs the whole stack up.
