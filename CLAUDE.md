# Habit Tracker – notes for Claude

A tiny static web app for tracking daily habits. It's a test bed for an AI
development flow, so keep changes small, clear and well tested.

## Commands

- `npm ci` – install dependencies
- `npm test` – run all tests (Vitest). Must pass before opening a PR.
- `npm run build` – production build into `dist/`. Must succeed before opening a PR.
- `npm run dev` – local dev server

## Structure

- `index.html` – page shell
- `src/habits.js` – pure logic (dates, streaks, storage). No DOM access here.
- `src/main.js` – UI: `mountApp(root, storage)` renders everything
- `src/style.css` – styles
- `src/*.test.js` – tests. UI tests use `// @vitest-environment jsdom`.

## Conventions

- Plain JavaScript (ES modules) and plain CSS. No frameworks.
- Don't add runtime dependencies. Ask in the ticket first if you think one is needed.
- Put logic in `src/habits.js` as pure functions and unit test it there.
  Keep `src/main.js` thin.
- Data lives in `localStorage` under the key `habit-tracker:v1`. If you change the
  shape of stored data, keep old data loading correctly and add a test for that.
- Never put user-entered text into `innerHTML`. Use `textContent`.
- Keep the UI usable with a keyboard and give form fields labels.
- Dates are local calendar days as `YYYY-MM-DD` strings. Use the helpers in `habits.js`.

## Definition of done

- Every acceptance criterion in the ticket is met and covered by a test.
- `npm test` and `npm run build` pass.
- The PR description explains what changed and links the ticket with `Closes #N`.

## Don't

- Don't edit anything in `.github/` unless the ticket explicitly asks for it.
- Don't skip, weaken or delete tests to make them pass.
- Don't make changes outside the ticket's scope. Mention follow-up ideas in the PR instead.
