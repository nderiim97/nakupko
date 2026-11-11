# Nakupko — real store server

FastAPI + SQLAlchemy backend for the Nakupko storefront. It serves the same
static pages as the GitHub Pages demo, but in **live mode**: products and stock
come from the database, orders are stored on the server, the admin panel uses a
real signed session, and card payments run through Stripe Checkout.

```
Browser ── HTML/CSS/JS ──► FastAPI ──► SQLite (dev) / Postgres (prod)
                              │
                              ├── Stripe Checkout + webhook
                              └── SMTP order e-mails
```

## 1. Local setup

From the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r server/requirements.txt

copy .env.example .env
# edit .env, at minimum set SECRET_KEY and ADMIN_PASSWORD
```

The app reads `.env` automatically. Without `DATABASE_URL` it uses
`server/nakupko.db` (SQLite) and seeds the demo catalog on first start.

Start the server:

```powershell
python -m uvicorn server.main:app --reload --port 8000
```

Open <http://127.0.0.1:8000>. The server serves `/config.js` with
`window.NK_MODE = "live"`, which switches the storefront to the API.

Useful URLs:

| URL | Purpose |
| --- | --- |
| `/api/health` | Health + Stripe/e-mail status |
| `/api/bootstrap` | Catalog, settings and admin session |
| `/docs` | OpenAPI documentation |
| `/admin.html` | Admin panel (login required) |

## 2. Seed data

Seeding is automatic when the product table is empty. To run it manually:

```powershell
python -m server.seed
```

The seed imports categories, products and coupons from
`assets/js/data.js` and creates the admin user from `ADMIN_EMAIL` /
`ADMIN_PASSWORD` if it does not exist. Re-running the seed is safe: existing
rows are not overwritten unless you call `seed_database(db, force=True)`.

## 3. Admin panel

- Login with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.
- Sessions are signed HttpOnly cookies (`nk_admin`), valid for `SESSION_DAYS`
  (default 7). Passwords are hashed with scrypt.
- Product create/update/delete, stock quantities, order list, status changes
  (approve → ship → cancel) and manual “mark as paid” for bank transfers.
- Login attempts are throttled per IP (8 attempts / 10 minutes).

Change the default password before going live.

## 4. Stripe Checkout

1. Create a Stripe account and copy the **secret** key from
   <https://dashboard.stripe.com/apikeys>.
2. Put it in `.env`:

   ```env
   STRIPE_SECRET_KEY=sk_test_...
   PUBLIC_BASE_URL=http://127.0.0.1:8000
   ```

3. Install the Stripe CLI and forward webhooks locally:

   ```powershell
   stripe login
   stripe listen --forward-to http://127.0.0.1:8000/api/webhooks/stripe
   ```

   Copy the printed `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

4. In production add a webhook endpoint in the Stripe dashboard:

   ```
   https://YOUR-DOMAIN/api/webhooks/stripe
   ```

   Events: `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`,
   `checkout.session.expired`, `charge.refunded`.

Prices are always recalculated from the database on the server. The browser
never sends prices, and the Stripe secret key never reaches the browser.

Order lifecycle:

| Payment | On order creation | On payment |
| --- | --- | --- |
| Card / Stripe | `pending_payment`, stock untouched | webhook sets `paid`, decrements stock, sends e-mails |
| COD | `new`, stock decremented | admin can mark paid on delivery |
| Bank transfer | `new`, stock decremented | admin marks paid when the transfer arrives |

## 5. E-mail

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_TLS` and
`STORE_EMAIL`. With no SMTP host the messages are written to the server log
instead of being sent, which keeps local development simple.

E-mails sent: order received, payment confirmed, order shipped.

For Gmail use an app password, for most providers port 587 with STARTTLS.

## 6. Environment variables

| Variable | Default | Notes |
| --- | --- | --- |
| `APP_ENV` | `development` | Free-form label |
| `SECRET_KEY` | `dev-only-change-me` | **Required in production**; signs admin cookies |
| `SESSION_DAYS` | `7` | Admin session lifetime |
| `DATABASE_URL` | `sqlite:///server/nakupko.db` | Use `postgresql+psycopg://...` in production |
| `ADMIN_EMAIL` | `admin@nakupko.local` | Bootstrap admin |
| `ADMIN_PASSWORD` | `12345678` | **Change in production** |
| `PUBLIC_BASE_URL` | `http://127.0.0.1:8000` | Used for Stripe return URLs and secure cookies |
| `ALLOWED_ORIGINS` | localhost | Comma-separated CORS / origin-check list |
| `STRIPE_SECRET_KEY` | empty | Enables card payments |
| `STRIPE_WEBHOOK_SECRET` | empty | Required for webhook verification |
| `STRIPE_CURRENCY` | `eur` | ISO currency |
| `STORE_NAME`, `STORE_EMAIL`, `STORE_PHONE`, `STORE_ADDRESS`, `STORE_VAT` | demo values | Shown on the site and in e-mails |
| `STORE_IBAN` | empty | Bank account for bank-transfer orders |
| `SMTP_*` | empty | Empty host = log only |
| `FREE_SHIPPING_THRESHOLD` | `50` | EUR |
| `STANDARD_SHIPPING` | `3.99` | EUR |
| `EXPRESS_SHIPPING` | `6.99` | EUR |
| `COD_FEE` | `1.50` | EUR |

## 7. Deployment (Render)

The repository includes `render.yaml`:

1. Push to GitHub.
2. Render → **New** → **Blueprint** → select the repository.
3. Fill in `PUBLIC_BASE_URL` (for example `https://nakupko.onrender.com`),
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`, Stripe keys, SMTP values.
4. Deploy. The blueprint provisions a Postgres database and runs
   `uvicorn server.main:app` with a health check on `/api/health`.

Any host that runs Python works too:

```bash
pip install -r server/requirements.txt
uvicorn server.main:app --host 0.0.0.0 --port $PORT
```

A `Procfile` is included for Heroku-style platforms.

### Production checklist

- [ ] Strong `SECRET_KEY` and `ADMIN_PASSWORD`
- [ ] `PUBLIC_BASE_URL` and `ALLOWED_ORIGINS` use the real HTTPS domain
- [ ] Postgres `DATABASE_URL` (not the SQLite file)
- [ ] Stripe live keys + webhook endpoint configured
- [ ] SMTP credentials tested with a real order
- [ ] Real company details in `STORE_*` and on the legal pages
- [ ] Backups enabled for the database
- [ ] HTTPS enforced by the host

## 8. Tests

```powershell
python -m pytest server/tests -q
```

The suite uses a temporary SQLite database and covers the catalog, admin login,
order totals, stock validation, the admin order flow and product CRUD.

## 9. Database notes

- SQLite is fine for development and a small single-instance shop.
- Postgres is recommended for production: managed backups, concurrent writes
  and no filesystem persistence issues.
- Tables are created automatically on startup (`Base.metadata.create_all`).
  For schema changes over time, add Alembic migrations.

## 10. API summary

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | – | Status |
| `GET` | `/api/bootstrap` | optional | Catalog + settings + session |
| `GET` | `/api/products` | – | Product list (`category`, `q`) |
| `GET` | `/api/products/{id}` | – | Single product |
| `POST` | `/api/orders` | – | Create order, returns access token |
| `GET` | `/api/orders/{id}?token=` | token | Customer order lookup |
| `POST` | `/api/orders/{id}/stripe?token=` | token | Retry payment |
| `POST` | `/api/admin/login` | – | Admin login (cookie) |
| `POST` | `/api/admin/logout` | – | Clear session |
| `GET` | `/api/admin/session` | admin | Current admin |
| `GET/POST` | `/api/admin/products` | admin | List / create |
| `PUT/DELETE` | `/api/admin/products/{id}` | admin | Update / soft delete |
| `POST` | `/api/admin/products/{id}/restore` | admin | Restore |
| `GET` | `/api/admin/orders` | admin | Order list |
| `PATCH` | `/api/admin/orders/{id}` | admin | Change status |
| `POST` | `/api/admin/orders/{id}/paid` | admin | Mark as paid |
| `POST` | `/api/webhooks/stripe` | signature | Stripe webhook |
