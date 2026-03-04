# Blind Marketplace

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Internet Identity authentication (login/logout)
- Pseudonym generation on first login (e.g., Writer_8821) linked to ICP Principal
- Order creation: Title, Description, Budget fields; auto-generated Order ID (ORD-XXX)
- Dashboard listing all orders with Order ID and Title only (no user identifiers)
- "Create New Order" button opening a modal form
- Motoko canister storing Users (Principal + Pseudonym) and Orders (ID, Title, Description, Budget, Status)
- Anonymous-first UI: no real names displayed anywhere

### Modify
- Nothing (new project)

### Remove
- Nothing (new project)

## Implementation Plan
1. Motoko canister with:
   - `User` record: principal, pseudonym
   - `Order` record: orderId, title, description, budget, status, createdAt
   - Functions: `registerUser`, `getUser`, `createOrder`, `getOrders`
   - Pseudonym generation logic server-side (adjective + role + number)
   - `getOrders` returns orders without exposing caller principals

2. React frontend with:
   - Login page: Internet Identity connect button, redirects to dashboard on success
   - Dashboard page: order list (Order ID + Title only), "Create New Order" CTA
   - Create Order modal: Title, Description, Budget inputs, submit calls canister
   - Auth state management via ICP agent + identity
   - No names, no principal IDs shown in any UI surface
