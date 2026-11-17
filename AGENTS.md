# AGENTS.md

## Project
Smart Campus room availability checker; checks one room at a time (fictional Rooms A, B, C).
React + TypeScript + Vite + Tailwind, built in Bolt.new.

## Structure
- src/lib/availability.ts – pure booking rule `checkAvailability(room, currentTime, start, end)`
- src/lib/availability.test.ts – Vitest regression tests T01–T19
- src/components/RoomAvailabilityChecker.tsx – UI only
- src/data/rooms.ts – fictional fixtures (Room A, B, C)
- src/types.ts – Room, Booking, AvailabilityResult

## Constraints
Preserve AC1–AC6; no backend, login, database or booking creation.
No secrets, API keys, or credentials anywhere in the codebase.
No external deployments or outbound network calls; the app runs locally only.
The session Supabase reminder does NOT apply to this project; never add
a database, storage, or edge function without an explicit instruction
that overrides this file.
- AC1: reject start >= end and past requests.
- AC2: reject durations longer than 120 minutes.
- AC3: reject a blocked room.
- AC4: reject overlaps; allow bookings touching only at endpoints.
- AC5: do not mutate booking data.
- AC6: keep clear desktop/mobile feedback.

## Engineering rules
Prefer pure functions and minimal changes; use at most 2 justified patterns.
Do not add Singleton, Factory or class hierarchies without a concrete need.
Do not mutate booking fixtures; keep responsive UI feedback.
Do not change the UI layout or text unless asked.

## Commands
- npm test – run Vitest once
- npm run typecheck – TypeScript check (Vitest does not type-check)
- npm run lint – ESLint check
- npm run build – production build

## Verification
Run existing tests and add focused regression tests.
Never weaken or delete existing assertions.
Before proposing work as accepted, run and pass all four: npm test,
npm run typecheck, npm run lint, npm run build. Report changed files,
rationale and the raw output of each command.

## Forbidden without human approval
- Installing, removing or upgrading dependencies
- Adding a database, auth, storage, network calls or deployment
- Deleting or weakening tests

## Review gate
Show the diff and wait for explicit human approval before applying changes outside the requested scope.