# Changelog

All notable changes to this project are documented in this file.

## [0.1.3] - Changelog

Added this CHANGELOG.md, reconstructed from commit history. No code changes.

## [0.1.2] - Order & payment flow

- **Database:** `orders`/`order_items` tables with status/payment_status
  constraints, seller_id denormalized onto order_items for fast seller
  queries, and `updated_at` triggers.
- **Checkout (`POST /api/orders`):** row-locks each cart product
  (`FOR UPDATE`), checks and decrements stock, snapshots unit price, runs
  payment through a provider-agnostic `paymentService`, and clears the cart —
  all inside one transaction that rolls back if payment fails.
- **Payments:** `paymentService.js` ships in mock mode (`PAYMENT_MOCK_MODE`)
  so checkout works end-to-end without a live gateway.
- **Order management:** buyer order history and seller endpoints to move
  items through pending → processing → shipped → delivered.
- **Frontend:** checkout modal, buyer order-history drawer, seller "Orders"
  tab with a live status dropdown; new `ProductDetailView` (quantity stepper,
  live stock status, seller attribution, related products).

## [İlk sürüm] - Initial marketplace

Versiyon numarası verilmeden commit'lendi (`abe88b1`).

- Full-stack e-commerce marketplace: Node.js/Express REST API on PostgreSQL,
  React (Vite) SPA frontend.
- Product catalog (54 seeded products, 6 categories), category filtering,
  PostgreSQL full-text search (GIN index + ILIKE fallback), 6 sort modes.
- JWT authentication with customer/seller roles; seller-owned product CRUD
  enforced via a `requireRole` middleware.
- Cart and favorites scoped per-user via JWT; row-level stock locking
  (`SELECT ... FOR UPDATE`) prevents overselling.
- Centralized request validation (`express-validator`), Helmet + CORS
  allow-list, `/health` endpoint.
