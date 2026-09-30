# BoiBari Backend

Bookstore REST API built with Express 5, MongoDB, and Mongoose.

## Run locally

1. Install Node.js 20 or newer and run `npm install`.
2. Copy `.env.example` to `.env` and set a private `JWT_SECRET` and `MONGODB_URI`.
3. Start MongoDB, then run `npm run dev`.

The API listens on port `5000` by default. Health check: `GET /health`.
See [docs/requirements.md](docs/requirements.md) for the MVP scope and routes.

All API routes are under `/api/v1`. Protected routes require
`Authorization: Bearer <token>`. Registration always creates a customer; create
or promote an admin account directly in a trusted database operation.

## Important environment variables

- `PORT`: HTTP port.
- `MONGODB_URI`: MongoDB connection string.
- `JWT_SECRET`: signing secret; required in production.
- `JWT_EXPIRES_IN`: token lifetime (default `7d`).
- `CLIENT_ORIGIN`: allowed browser origin, or `*` for any origin.
- `DELIVERY_FEE`: default delivery charge (default `60`).

Orders support COD and manual payment instructions only. No payment, OTP, SMS,
email, or courier provider is configured in this MVP.
