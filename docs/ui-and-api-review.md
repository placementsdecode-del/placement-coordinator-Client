# UI and API review

The implementation follows `Placement Coordinator.md`, especially student management, sections, design tokens, and empty/loading/error states.

## Design changes

- Solid white headers and navigation replace translucent blurred surfaces. Cards use a small edge shadow instead of a wide haze. Supporting text and borders have stronger contrast.
- Page headings use a consistent hierarchy and divider. Students and Sections use short titles, clear actions, and persistent form labels.
- Forms, navigation, and loading feedback have accessible labels, focus indicators, and reduced-motion support. Student search distinguishes no matches from an empty directory.
- Mobile layouts stack controls and panels; section assignment remains accessible without horizontal scrolling.

## API structure

All frontend HTTP calls go through `src/services/api-client.ts`. Domain modules use `*.api.service.ts`: auth, users, organizations, organization registrations, sections, assessments, features, and roles. ESLint rejects direct `fetch` and endpoint imports in UI code. The shared client preserves caller headers, handles multipart and empty responses, and reports network, malformed response, and timeout errors.

## Loading coverage

Session restoration and lazy page modules use a shared page skeleton. Organization and platform pages show skeletons while their data loads, with retry on failure. Study-guide imports and registration features have loading states. Static/sample pages render immediately once their module has loaded; no artificial delay is added. Section creation, editing, assignment, and removal disable duplicate submissions and show pending feedback. Failed section/student creation preserves entered values.

## Section workflow

1. Open **Sections → New Section**. Enter name, code, department, batch, and academic year. Description and status are also editable.
2. Select a section and use **Assign an existing student**, or **Add Student** to create an account.
3. Open a student's details and change **Move to section** to reassign them. Section IDs determine membership, so duplicate names across departments are safe.
4. Choose **Unassigned — remove from section** to remove membership while retaining the account.
5. Use **Edit section** to update its details and status. Inactive sections cannot receive new assignments.
6. **Students → Unassigned** finds students without a section. **All students** is the default filter.

Removal uses `DELETE /api/sections/:sectionId/students/:studentId`. The server atomically matches the current section and organization; a stale removal returns 409. Creation and user edits validate section ownership. Coordinators can list students in their assigned sections, move students between their assigned sections, and remove membership; account creation and section editing remain admin actions.

## Verification

- Client TypeScript check and production bundle.
- ESLint: zero errors; four existing warnings (Fast Refresh exports and organization form effect dependencies).
- Server TypeScript check.
- `cd client && node tests/api-client.test.cjs`: six API-client checks.
- `cd server && node --import tsx tests/section-membership.test.ts`: nine controller checks using mocked model methods.
- Browser regression: `PLAYWRIGHT_MODULE=<installed-playwright-package> node client/tests/section-workflows.cjs`. Uses local Vite on port 5173 and mocked HTTP responses; checks session loading, assignment/move/removal, duplicate section names, editing, creation failures, filtering, admin navigation, retry, and mobile overflow.

## Limits

Browser checks use mocked APIs, and controller tests use mocked database methods. Live database persistence and deployed frontend/backend compatibility require an integrated environment; deploy the backend removal route together with the frontend change. Student preparation modules and several admin modules still use existing sample/local data; this change does not build every proposed backend module in the product guide. The existing generated changelog remains a large optional bundle and triggers Vite's chunk-size warning.
