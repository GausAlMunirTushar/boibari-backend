# BoiBari Backend Requirements

## 1. Purpose

Provide the REST API for a Bangladesh-focused online bookstore: browse books, manage customer accounts and carts, place and track orders, and administer the catalog and sales. This is a new project patterned after the local `stylehut-backend` Express/Mongoose structure, adapted to bookselling.

> The public `boibari.com` site could not be inspected in this environment. The requirements below describe a practical bookstore MVP, not a claim that every feature matches the live site.

## 2. Technology

- Node.js with ES modules and Express 5
- MongoDB with Mongoose
- JWT authentication and bcryptjs password hashing
- dotenv for environment configuration; CORS and JSON request support
- REST endpoints under `/api/v1`

## 3. Roles

- Guest: browse and search the public catalog.
- Customer: register/sign in, manage a profile and addresses, manage a cart, place and view own orders, and write reviews for purchased books.
- Admin: manage catalog taxonomy and books, inventory, customer orders, and moderate reviews.

## 4. Functional requirements

### 4.1 Authentication and profile

- Register with name, email, phone, and password; reject duplicate email/phone and store only a password hash.
- Sign in and receive a signed JWT; expose the authenticated customer's safe profile.
- Support profile updates and saved delivery addresses, including recipient, phone, street, area, city/district, postal code, and country (Bangladesh by default).
- Protect customer/admin operations with authentication and role checks. Never accept a role from public registration input.

### 4.2 Book catalog

- Store title, slug, ISBN (optional), description, authors, publisher, category, language, edition, publication date, cover image URL, list price, sale price, stock quantity, and active/featured flags.
- Support public book listing, book detail, keyword search, category/author/publisher filters, price range, availability, sorting, and bounded pagination.
- Expose public category and author/publisher browse data.
- Restrict create/update/delete and inventory changes to admins. Validate inputs and prevent invalid prices or negative stock.

### 4.3 Cart

- Authenticated customers can add a book, change quantity, remove an item, view the cart, and clear it.
- Enforce positive quantities and current stock limits. Calculate displayed totals from server-side book prices; clients cannot set trusted prices.

### 4.4 Orders and delivery

- Authenticated customers can place orders from cart items with a delivery address, contact phone, and payment method.
- MVP payment methods: cash on delivery and manual/bank/mobile-payment instructions, represented as unpaid until verified. A payment provider integration is out of scope until credentials/provider are selected.
- Calculate item prices, discount, delivery fee, and grand total on the server. Save immutable item/title/price snapshots on each order.
- Decrease stock safely when placing an order; reject unavailable/insufficient stock. Clear the cart only after successful order creation.
- Customers can view their order history/details and cancel eligible orders. Admins can view/filter orders and move them through pending, confirmed, processing, shipped, delivered, or cancelled states.
- Capture delivery contact/address and optional courier/tracking reference. Restore inventory exactly once when an eligible order is cancelled.

### 4.5 Reviews

- Customers can rate and review books; enforce one review per customer per book and require a delivered/purchased order before submission.
- Public users can read approved reviews and ratings. Admins can approve/hide reviews.

### 4.6 API behavior

- `GET /health` reports service health.
- Use consistent JSON responses with `success`, `message`, and `data`; include pagination metadata for lists.
- Return suitable HTTP status codes for validation, authentication, authorization, missing records, and conflicts.
- Validate MongoDB IDs and request values; do not leak stack traces, password hashes, JWT secrets, or internal errors in production responses.

## 5. Initial API surface

- `/api/v1/auth`: register, login, current user
- `/api/v1/users/me`: profile and saved addresses
- `/api/v1/books`, `/api/v1/books/:id`: browse/detail; admin CRUD
- `/api/v1/categories`: browse; admin CRUD
- `/api/v1/cart`: read, add/update/remove items, clear
- `/api/v1/orders`: place, list own, read own, cancel; admin list/status updates
- `/api/v1/books/:id/reviews`, `/api/v1/reviews`: customer submit, public approved list, admin moderation

## 6. Non-functional requirements

- Keep secrets and MongoDB connection strings in environment variables; provide `.env.example` without secrets.
- Use clear separation of models, controllers, routes, middleware, config, and utilities, following the sibling StyleHut project's conventions.
- Apply request validation, bounded list limits, safe database queries, and role-based authorization.
- Include setup/run instructions and document required environment variables and API behavior.

## 7. Out of scope for the MVP

- Frontend implementation, real payment gateway callbacks/refunds, OTP/SMS/email delivery, courier API integration, multi-vendor seller portal, and production deployment.
- These can be added after the specific provider, workflow, and credentials are decided.

## 8. Acceptance criteria

- A fresh checkout can install dependencies, configure MongoDB/JWT environment variables, and start the API.
- Public catalog endpoints support searchable/paginated book discovery.
- Customers can register/login, manage a cart, place COD orders, and read/cancel their own eligible orders.
- Server-computed totals and stock checks cannot be overridden by request body values; admin endpoints reject non-admin users.
- Reviews and administrative catalog/order workflows follow the rules above.
