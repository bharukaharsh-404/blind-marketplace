# Blind Marketplace — Phase 2

## Current State
Phase 1 is complete and deployed. The app has:
- Internet Identity login with pseudonym generation (stored in LocalStorage)
- Order creation via modal (Title, Description, Budget)
- Dashboard showing all orders by Order ID only
- Orders stored in LocalStorage with statuses: open, in_progress, completed
- No role distinction (all users treated the same)
- No chat, payments, file upload, or order acceptance
- Motoko backend has: registerUser, createOrder, getOrders, getMyOrders, getOrderById, getMyPseudonym
- Authorization component installed

## Requested Changes (Diff)

### Add
1. **Role Selection Screen** — After Internet Identity login, if user has no role stored, show onboarding screen to choose "Lister" or "Writer". Store role in LocalStorage alongside pseudonym.
2. **Order Acceptance Flow** — Writers see "Accept Order" button on open orders they did not create. Listers cannot accept any order. On accept: order status changes to "in_progress", writerPseudonym is stored on the order. Canister backend: `acceptOrder(orderId)` function.
3. **Mock Escrow Payment** — When a Lister creates an order, show a mock "Pay to Escrow" step showing amount held. When Lister approves completed work, show "Release Funds" button. Platform takes 15% commission shown in UI. All payment state is stored in LocalStorage — no real Stripe.
4. **Order Detail Page** — Clicking an order opens a full detail view. Shows Order ID, title, description, budget, status, escrow status. Contains the chat panel and file upload panel.
5. **Polling-Based Chat** — Per order chat stored in LocalStorage. Messages polled every 5 seconds. Chat header shows "Order #ORD-XXX" only — no user names. Messages filtered for blocked keywords: "WhatsApp", "Phone", "Email", "Cash", "Direct". Flagged messages are stored with `isFlagged: true` and shown with a warning instead of content.
6. **File Upload** — Writers can upload files up to 5MB. Files stored in LocalStorage as base64 with a `expiresAt` timestamp (createdAt + 24h). After 24h, download button is disabled. Only Lister can download files for their order.
7. **Admin Panel** — Hidden route `/admin` accessible only to users whose principalId matches a hardcoded ADMIN_PRINCIPAL constant. Shows a table of all orders with: Order ID, Lister Pseudonym, Writer Pseudonym, status, flagged message count.
8. **Motoko backend additions**: `acceptOrder`, `releaseEscrow`, `sendMessage`, `getMessages`, `uploadFile`, `getFiles`.
9. **Order type extension**: add `writerPseudonym`, `escrowStatus` (held | released | none), `escrowAmount`.
10. **Message type**: orderId, senderPseudonym, content, timestamp, isFlagged.
11. **File type**: orderId, uploaderPseudonym, fileName, fileSize, fileData (base64), createdAt, expiresAt.

### Modify
1. **Order type** in `marketplace.ts` — add `writerPseudonym?: string`, `escrowStatus: "none" | "held" | "released"`, `listerPrincipalId: string`.
2. **UserProfile type** — add `role: "lister" | "writer"`.
3. **LoginPage** — after login success, check if role exists; if not, route to role selection instead of dashboard.
4. **App.tsx routes** — add "role_selection", "order_detail", "admin" routes.
5. **DashboardPage** — differentiate view for Listers vs Writers. Listers see only their own orders + create button. Writers see all open orders they haven't created (marketplace view). Add tab toggle: "My Orders" | "Marketplace" for Writers. Add click handler on OrderCard to navigate to order detail.
6. **OrderCard** — add Accept button for Writers on open orders. Add "View Chat" link. Update to show escrow status badge.
7. **storage.ts** — add functions for: role get/set, messages CRUD, files CRUD, acceptOrder, releaseEscrow.
8. **CreateOrderModal** — after order creation, show mock "Pay Escrow" confirmation step before closing.

### Remove
- Nothing from Phase 1 is removed. All Phase 1 functionality is preserved and extended.

## Implementation Plan
1. Extend `marketplace.ts` types for role, escrow, messages, files.
2. Extend `storage.ts` with new CRUD helpers for messages, files, order acceptance, escrow.
3. Update Motoko canister: add `acceptOrder`, `sendMessage`, `getMessages`, `uploadFile`, `getFiles`, `releaseEscrow` functions with proper anonymity enforcement.
4. Update `App.tsx` to handle new routes: role_selection, order_detail, admin.
5. Create `RoleSelectionPage` — two large cards (Lister / Writer) with descriptions. On select, save role to LocalStorage, route to dashboard.
6. Update `LoginPage` to check for role after login and redirect accordingly.
7. Update `DashboardPage` to show role-aware views. Writers get a Marketplace tab. OrderCard gets an Accept button for eligible orders.
8. Create `OrderDetailPage` — shows order info, escrow panel, chat panel, file panel.
9. Create `ChatPanel` component — message list, input, 5s polling, keyword filter, flagged message display.
10. Create `FileUploadPanel` component — upload UI, file list with expiry countdown, download gating.
11. Create `EscrowPanel` component — shows mock payment status, Release Funds button for Lister.
12. Create `AdminPage` — hardcoded principal check, order/user mapping table, flagged messages list.
13. Update `CreateOrderModal` — add mock escrow payment step after order form submission.
14. Update `OrderCard` — add Accept button, click-to-detail navigation, escrow status badge.
