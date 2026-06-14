# NxtBiz Implementation Phases

This project is implemented from `spec.md`. Business rules that affect behavior should be added to the spec or mirrored in `server/src/spec/businessRules.js`.

## Phase 1: Foundation and Authentication

- Create `client/` and `server/` structure.
- Configure NxtBiz package metadata and env examples.
- Add Express security middleware, health route, MongoDB connection, Socket.IO bootstrap.
- Add User model, auth routes, JWT access tokens, refresh token rotation, HTTP-only cookies, protected route middleware, user management basics.
- Add Vite React app, auth pages, protected console layout, dark mode toggle, route map, dashboard shell.

## Phase 2: Core CRM Records

- Add Customer, CRMActivity, Memory, Notification APIs.
- Build customer table, customer create/update flows, and customer 360 page.
- Add CRM notes/activity timeline and memory search.

## Phase 3: Email Intelligence and Agents

- Add Email, Agent, AgentExecution models.
- Implement sentiment, intent, urgency, confidence, auto-response, and recommendations.
- Implement orchestration order, execution records, notifications, and `agent_completed` event.
- Add BullMQ queue with synchronous fallback when Redis is unavailable.

## Phase 4: Operational Modules

- Add meetings, invoices, tickets, and reports APIs.
- Generate invoice/report PDFs with PDFKit under `server/storage/pdfs`.
- Build tables, forms, statuses, downloads, empty states, and error states.

## Phase 5: Workflows and Realtime

- Add workflow builder and execution behavior.
- Emit and consume Socket.IO events for cache invalidation and toasts.
- Add notification read states and unread counts.

## Phase 6: Verification and Branding Pass

- Replace any remaining OpsPilot references with NxtBiz.
- Run server/client builds.
- Verify health, auth, protected route rejection, dashboard, email processing, orchestration, PDF URLs, workflow logs, and Socket.IO refresh behavior.
