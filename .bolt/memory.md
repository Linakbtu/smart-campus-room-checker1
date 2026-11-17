# Project memory

## Product intent & audience

- Smart Campus room availability checker; checks one room at a time across three fictional rooms (A, B, C).
- Availability checking only — no booking creation, login, or backend.
- Audience: campus users needing quick room status on desktop or mobile.

## Brand personality & voice

- Clear, direct, professional feedback for accept/reject outcomes.
- Concise messaging suitable for both desktop and mobile surfaces.

## Visual design & UX direction

- Stack: Vite + React (JSX), Tailwind CSS, Lucide React icons, React hooks.
- Path alias `@/` → `src/` for project module imports.
- Responsive feedback required on both desktop and mobile (AC6).
- Refer to `.bolt/prompt` for global design and aesthetic instructions.

## Decisions, constraints & rationale

- No backend, login, database, storage, or booking creation.
- No secrets, API keys, or credentials anywhere in the codebase.
- No external deployments or outbound network calls; app runs locally only.
- Supabase session reminder does NOT apply; never add DB/storage/edge functions.
- Booking validation rules (AC1–AC6):
  - AC1: reject start >= end and past requests.
  - AC2: reject durations longer than 120 minutes.
  - AC3: reject a blocked room.
  - AC4: reject overlaps; allow bookings touching only at endpoints.
  - AC5: do not mutate booking data.
  - AC6: keep clear desktop/mobile feedback.
- Commands: `npm test` (Vitest), `npm run typecheck` (TS check), `npm run lint` (ESLint), `npm run build`.
- Verification: all four checks must pass before proposing acceptance; report raw output of each.
- Forbidden without human approval: dependency install/remove/upgrade, adding DB/auth/storage/network/deployment, deleting or weakening tests.
- Review gate: show diff and wait for explicit approval before out-of-scope changes.
- `AGENTS.md` is the project spec file; changes there require explicit user direction.

## Open questions & assumptions

- Room availability data assumed fictional/static/in-memory (no data source specified yet).
- Exact UI layout, color palette, and component structure not yet defined beyond Tailwind + Lucide baseline.