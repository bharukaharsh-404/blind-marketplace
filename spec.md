# Blind Marketplace

## Current State

Phase 1 & 2 are complete with:
- Internet Identity login + pseudonym generation (Motoko canister + frontend hooks)
- Role selection screen (Lister / Writer), stored in LocalStorage
- Order creation (title, description, budget) with mock escrow flow, stored in LocalStorage
- Order acceptance by Writers (status: open → in_progress), stored in LocalStorage
- Polling-based chat (5s interval) per Order ID with keyword filtering (WhatsApp, Phone, Email, Cash, Direct), stored in LocalStorage
- File upload per order (5MB limit, 24h expiry, base64 in LocalStorage)
- Admin panel at /admin — Order ID mapping table + flagged messages tab, uses data from LocalStorage
- Motoko canister handles: user registration, pseudonym generation, order creation/query, access control
- Frontend lib/storage.ts is the single source of truth for all runtime data (LocalStorage)
- Types defined in types/marketplace.ts: Order, UserProfile, Message, UploadedFile

## Requested Changes (Diff)

### Add
- **Stripe Connect integration (Test Mode)**: Replace mock escrow confirmation with a real Stripe PaymentIntent flow. On order creation, initiate a Stripe payment (held/uncaptured). On "Release Funds", capture and split payment (85% writer, 15% platform). Use placeholder Test Mode keys with comments on where to swap real keys.
- **Supabase client setup**: Add `@supabase/supabase-js` to frontend. Create `src/lib/supabase.ts` with placeholder `SUPABASE_URL` and `SUPABASE_ANON_KEY` constants and SQL schema comments for the tables needed.
- **Persistent Orders** via Motoko canister: Already partially there (canister has createOrder, getOrders). Extend canister to also store writer assignment, escrow status, and order status updates so Orders persist across devices, not just LocalStorage.
- **Persistent Messages** via Supabase: Replace localStorage message read/write with Supabase `messages` table queries. Chat polling (3s interval when open) reads from Supabase.
- **Persistent Files** via Supabase Storage: Replace base64-in-localStorage file storage with Supabase Storage bucket uploads. Files still expire after 24h (tracked via `expires_at` column).
- **Read receipts**: Track `read_at` timestamp on messages; show a checkmark indicator in chat UI.
- **Message deletion**: Senders can delete their own messages (soft delete via `deleted_at` column).
- **Dispute Resolution**: Lister can open dispute on in_progress orders. Order status: open → in_progress → disputed / completed. Admin panel gains a Disputes tab showing disputed orders with a "Release to Writer" and "Refund to Lister" action button.
- **Supabase Row Level Security**: Add SQL comments in supabase.ts explaining the RLS policies to enable.
- **Rate limiting**: Add a simple in-memory rate limiter hook (`useRateLimit`) that throttles API calls (max 10 chat sends per minute per user).
- **Input validation**: Sanitize all user inputs (strip HTML tags, max length enforcement) before saving/sending.
- **Enhanced Admin Panel**: Add Disputes tab, add "Release Funds" and "Refund" action buttons per disputed order. Wire to releaseEscrow / refundOrder functions.

### Modify
- `lib/storage.ts`: Keep all function signatures identical but upgrade implementations — Orders read/write from Motoko canister (via backend.ts calls), Messages read/write from Supabase, Files read/write from Supabase Storage. LocalStorage used only for UserProfile and UserRole (device-local auth state).
- `types/marketplace.ts`: Add `disputeReason?: string`, `isDisputed?: boolean`, `stripePaymentIntentId?: string` to Order. Add `readAt?: number`, `deletedAt?: number` to Message. Add `supabaseStorageUrl?: string` to UploadedFile.
- `OrderDetailPage.tsx`: Add "Open Dispute" button for Listers on in_progress orders. Add read receipt checkmark on own messages. Add delete button on own messages. Change polling interval to 3s.
- `AdminPage.tsx`: Add Disputes tab with disputed orders list and release/refund action buttons.
- `main.mo`: Add `acceptOrder`, `updateOrderStatus`, `openDispute`, `adminReleaseEscrow` functions. Add `writerPrincipalId` to order storage map. Keep all existing query functions.
- `CreateOrderModal.tsx`: After order creation, show Stripe payment step with placeholder payment form (Test Mode card input UI).

### Remove
- Nothing removed — all Phase 1 & 2 UI/UX remains identical.

## Implementation Plan

1. **Update Motoko canister** — add `acceptOrder`, `updateOrderStatus`, `openDispute`, `adminReleaseEscrow` functions; extend order storage to include writer principal, escrow status, dispute fields.
2. **Add Stripe component** — select stripe Caffeine component, wire placeholder Stripe publishable key, build StripePaymentStep component shown after order form submission.
3. **Add Supabase client** — install `@supabase/supabase-js`, create `lib/supabase.ts` with placeholder keys, SQL schema comments, typed query helpers for messages and files.
4. **Upgrade lib/storage.ts** — replace message and file LocalStorage logic with Supabase async calls; replace order CRUD with canister calls; keep UserProfile/UserRole in LocalStorage.
5. **Update OrderDetailPage** — 3s chat polling, read receipts, message delete button, "Open Dispute" button for Listers.
6. **Update AdminPage** — add Disputes tab, release/refund action buttons.
7. **Update CreateOrderModal** — add StripePaymentStep after form submission.
8. **Update types/marketplace.ts** — extend interfaces with new fields.
