"""Nakupko store API and static site server.

Run locally:
    python -m uvicorn server.main:app --reload --port 8000
"""

from __future__ import annotations

import logging
import re
import secrets
import unicodedata
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    HTTPException,
    Request,
    Response,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import email_service, stripe_service
from .config import BASE_DIR, settings
from .db import SessionLocal, get_db, init_db
from .models import Category, Coupon, Order, OrderItem, Product, utcnow
from .schemas import LoginIn, OrderIn, OrderStatusIn, ProductIn
from .security import (
    COOKIE_NAME,
    SESSION_MAX_AGE,
    clear_login_attempts,
    create_session_token,
    current_admin,
    login_allowed,
    register_failed_login,
    require_admin,
    verify_password,
)
from .seed import seed_database
from .serializers import category_dict, order_dict, product_dict, public_settings

log = logging.getLogger("nakupko")
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

PAGES = {
    "index",
    "category",
    "search",
    "product",
    "cart",
    "checkout",
    "wishlist",
    "order",
    "info",
    "admin",
}

DELIVERY_LABELS = {
    "standard": "Standardna dostava",
    "express": "Hitra dostava",
    "pickup": "Osebni prevzem",
}
PAYMENT_LABELS = {
    "card": "Kartica (Stripe)",
    "stripe": "Stripe",
    "cod": "Plačilo po povzetju",
    "bank": "Bančno nakazilo",
}
ORDER_STATUSES = {"new", "approved", "shipped", "cancelled"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(Product)) == 0:
            log.info("Prazen katalog — uvozim demo izdelke.")
            seed_database(db)
    yield


app = FastAPI(title="Nakupko API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------ utilities
def _same_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if not origin:
        return
    from urllib.parse import urlparse

    host = request.headers.get("host", "")
    allowed = {value.rstrip("/") for value in settings.allowed_origins}
    netloc = urlparse(origin).netloc
    if origin.rstrip("/") in allowed or (host and netloc == host):
        return
    raise HTTPException(status_code=403, detail="Zahteva iz neznanega izvora.")


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=SESSION_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=settings.public_base_url.startswith("https://"),
        path="/",
    )


def _order_id() -> str:
    now = datetime.now(timezone.utc)
    return "NK-{}{}{}-{}".format(
        now.year,
        f"{now.month:02d}",
        f"{now.day:02d}",
        f"{secrets.randbelow(9000) + 1000}",
    )


def _slugify(value: str) -> str:
    text = unicodedata.normalize("NFKD", value)
    text = text.encode("ascii", "ignore").decode("ascii").lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:80] or "izdelek"


def _money(value: float) -> float:
    return float(Decimal(str(value)).quantize(Decimal("0.01")))


def _send_order_email(order_id: str, kind: str) -> None:
    with SessionLocal() as db:
        order = db.get(Order, order_id)
        if order is None:
            return
        try:
            if kind == "received":
                email_service.send_order_received(order)
            elif kind == "paid":
                email_service.send_order_paid(order)
            elif kind == "shipped":
                email_service.send_order_shipped(order)
        except Exception:  # pragma: no cover
            log.exception("E-pošte za naročilo %s ni bilo mogoče poslati.", order_id)


# --------------------------------------------------------------- public pages
@app.get("/config.js", include_in_schema=False)
def config_js() -> PlainTextResponse:
    import json

    payload = json.dumps(public_settings(), ensure_ascii=False)
    body = (
        'window.NK_MODE = "live";\n'
        'window.NK_API = "/api";\n'
        f"window.NK_STORE = {payload};\n"
    )
    return PlainTextResponse(body, media_type="application/javascript")


@app.get("/api/health")
def health() -> dict:
    return {
        "ok": True,
        "stripe": settings.stripe_enabled,
        "email": settings.email_enabled,
        "environment": settings.environment,
    }


@app.get("/api/bootstrap")
def bootstrap(
    db: Session = Depends(get_db),
    admin=Depends(current_admin),
) -> dict:
    products = db.scalars(
        select(Product).where(Product.active.is_(True)).order_by(Product.added)
    ).all()
    categories = db.scalars(select(Category).order_by(Category.sort)).all()
    coupons = db.scalars(select(Coupon).where(Coupon.active.is_(True))).all()
    brands = sorted({product.brand for product in products if product.brand})
    return {
        "mode": "live",
        "products": [product_dict(product) for product in products],
        "categories": [category_dict(category) for category in categories],
        "brands": brands,
        "coupons": {
            coupon.code: {
                "type": coupon.type,
                "value": float(coupon.value),
                "label": coupon.label,
            }
            for coupon in coupons
        },
        "settings": public_settings(),
        "session": {"admin": admin.email if admin else None},
    }


@app.get("/api/products")
def list_products(
    db: Session = Depends(get_db),
    category: str | None = None,
    q: str | None = None,
    limit: int = 200,
) -> dict:
    query = select(Product).where(Product.active.is_(True))
    if category:
        query = query.where(Product.category_id == category)
    if q:
        like = f"%{q.strip()}%"
        query = query.where(Product.name.ilike(like) | Product.brand.ilike(like))
    products = db.scalars(
        query.order_by(Product.added).limit(max(1, min(limit, 500)))
    ).all()
    return {"products": [product_dict(product) for product in products]}


@app.get("/api/products/{product_id}")
def get_product(product_id: str, db: Session = Depends(get_db)) -> dict:
    product = db.get(Product, product_id)
    if product is None or not product.active:
        raise HTTPException(status_code=404, detail="Izdelek ni najden.")
    return {"product": product_dict(product)}


@app.get("/api/settings")
def get_settings() -> dict:
    return public_settings()


# ------------------------------------------------------------------- orders
@app.post("/api/orders", status_code=201)
def create_order(
    payload: OrderIn,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
) -> dict:
    products = {
        product.id: product
        for product in db.scalars(
            select(Product).where(Product.id.in_([item.id for item in payload.items]))
        ).all()
    }

    items: list[OrderItem] = []
    subtotal = 0.0
    for line in payload.items:
        product = products.get(line.id)
        if product is None or not product.active:
            raise HTTPException(
                status_code=400,
                detail=f"Izdelek {line.id} ni več na voljo.",
            )
        if product.stock_qty < line.qty:
            raise HTTPException(
                status_code=409,
                detail=f"Za izdelek {product.name} ni dovolj zaloge.",
            )
        unit = float(product.price)
        total = _money(unit * line.qty)
        subtotal = _money(subtotal + total)
        items.append(
            OrderItem(
                product_id=product.id,
                name=product.name,
                brand=product.brand,
                qty=line.qty,
                color=line.color,
                unit_price=unit,
                line_total=total,
            )
        )

    coupon = None
    code = payload.coupon.strip().upper()
    if code:
        coupon = db.get(Coupon, code)
        if coupon is None or not coupon.active:
            raise HTTPException(status_code=400, detail="Koda za popust ni veljavna.")

    discount = 0.0
    if coupon is not None:
        if coupon.type == "percent":
            discount = _money(subtotal * float(coupon.value) / 100)
        else:
            discount = _money(min(float(coupon.value), subtotal))

    if payload.delivery == "express":
        shipping = settings.express_shipping
    elif payload.delivery == "pickup":
        shipping = 0.0
    else:
        shipping = (
            0.0
            if subtotal >= settings.free_shipping_threshold or subtotal == 0
            else settings.standard_shipping
        )
    shipping = _money(shipping)

    fee = _money(settings.cod_fee if payload.payment == "cod" else 0)
    total = _money(max(0.0, subtotal - discount + shipping + fee))

    online_payment = payload.payment in {"card", "stripe"}
    order = Order(
        id=_order_id(),
        access_token=secrets.token_urlsafe(24),
        status="pending_payment" if online_payment else "new",
        payment_status="unpaid",
        customer_name=payload.customer.name,
        customer_email=payload.customer.email,
        customer_phone=payload.customer.phone,
        customer_address=payload.customer.address,
        customer_postal=payload.customer.postal,
        customer_city=payload.customer.city,
        customer_note=payload.customer.note,
        delivery_method=payload.delivery,
        delivery_label=DELIVERY_LABELS[payload.delivery],
        delivery_price=shipping,
        payment_method=payload.payment,
        payment_label=PAYMENT_LABELS[payload.payment],
        payment_fee=fee,
        subtotal=subtotal,
        discount=discount,
        shipping=shipping,
        fee=fee,
        total=total,
        coupon=code if coupon else "",
        items=items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    checkout_url = None
    if online_payment:
        try:
            checkout_url, session_id = stripe_service.create_checkout_session(order)
            order.stripe_session_id = session_id
            db.commit()
        except stripe_service.StripeNotConfigured as exc:
            order.status = "cancelled"
            order.cancelled_at = utcnow()
            db.commit()
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except Exception as exc:  # pragma: no cover - upstream failure
            order.status = "cancelled"
            order.cancelled_at = utcnow()
            db.commit()
            log.exception("Stripe seja ni ustvarjena.")
            raise HTTPException(
                status_code=502,
                detail="Plačila trenutno ni mogoče začeti. Poskusite znova.",
            ) from exc
    else:
        if payload.payment in {"cod", "bank"}:
            for line in payload.items:
                product = products[line.id]
                product.stock_qty = max(0, product.stock_qty - line.qty)
            db.commit()
        background.add_task(_send_order_email, order.id, "received")

    return {
        "order": order_dict(order),
        "accessToken": order.access_token,
        "checkoutUrl": checkout_url,
    }


@app.get("/api/orders/{order_id}")
def get_order(order_id: str, token: str = "", db: Session = Depends(get_db)) -> dict:
    order = db.get(Order, order_id)
    if (
        order is None
        or not token
        or not secrets.compare_digest(token, order.access_token)
    ):
        raise HTTPException(status_code=404, detail="Naročilo ni najdeno.")
    return {"order": order_dict(order)}


@app.post("/api/orders/{order_id}/stripe")
def retry_stripe(order_id: str, token: str = "", db: Session = Depends(get_db)) -> dict:
    order = db.get(Order, order_id)
    if (
        order is None
        or not token
        or not secrets.compare_digest(token, order.access_token)
    ):
        raise HTTPException(status_code=404, detail="Naročilo ni najdeno.")
    if order.payment_status == "paid":
        raise HTTPException(status_code=409, detail="Naročilo je že plačano.")
    if order.status == "cancelled":
        raise HTTPException(status_code=409, detail="Naročilo je preklicano.")
    try:
        url, session_id = stripe_service.create_checkout_session(order)
        order.stripe_session_id = session_id
        db.commit()
    except stripe_service.StripeNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"checkoutUrl": url}


# -------------------------------------------------------------------- admin
@app.post("/api/admin/login")
def admin_login(
    payload: LoginIn,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> dict:
    _same_origin(request)
    ip = request.client.host if request.client else "unknown"
    if not login_allowed(ip):
        raise HTTPException(
            status_code=429,
            detail="Preveč poskusov prijave. Poskusite znova čez nekaj minut.",
        )
    from .models import AdminUser

    admin = db.scalar(
        select(AdminUser).where(AdminUser.email == payload.email.strip().lower())
    )
    if admin is None or not verify_password(payload.password, admin.password_hash):
        register_failed_login(ip)
        raise HTTPException(status_code=401, detail="Napačna e-pošta ali geslo.")
    clear_login_attempts(ip)
    _set_session_cookie(response, create_session_token(admin.email))
    return {"ok": True, "email": admin.email}


@app.post("/api/admin/logout")
def admin_logout(response: Response) -> dict:
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"ok": True}


@app.get("/api/admin/session")
def admin_session(admin=Depends(require_admin)) -> dict:
    return {"email": admin.email}


@app.get("/api/admin/products")
def admin_products(db: Session = Depends(get_db), admin=Depends(require_admin)) -> dict:
    products = db.scalars(select(Product).order_by(Product.added.desc())).all()
    return {"products": [product_dict(product) for product in products]}


def _apply_product(db: Session, product: Product, payload: ProductIn) -> None:
    if db.get(Category, payload.category) is None:
        raise HTTPException(status_code=400, detail="Neznana kategorija.")
    product.name = payload.name.strip()
    product.brand = payload.brand.strip()
    product.category_id = payload.category
    product.price = payload.price
    product.old_price = payload.oldPrice
    product.art = payload.art or "blocks"
    product.palette = payload.palette
    product.badge = payload.badge
    product.colors = payload.colors
    product.description = payload.description
    product.features = payload.features
    product.specs = payload.specs
    product.tags = payload.tags
    product.stock_qty = payload.stockQty
    product.active = payload.active
    product.sku = payload.sku
    if (
        payload.oldPrice
        and payload.oldPrice > payload.price
        and "sale" not in product.tags
    ):
        product.tags = list(product.tags or []) + ["sale"]


@app.post("/api/admin/products", status_code=201)
def admin_create_product(
    payload: ProductIn,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
) -> dict:
    _same_origin(request)
    base = _slugify(payload.name)
    product_id = base
    while db.get(Product, product_id) is not None:
        product_id = f"{base}-{secrets.token_hex(2)}"
    product = Product(id=product_id, added=9999)
    _apply_product(db, product, payload)
    db.add(product)
    db.commit()
    db.refresh(product)
    return {"product": product_dict(product)}


@app.put("/api/admin/products/{product_id}")
def admin_update_product(
    product_id: str,
    payload: ProductIn,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
) -> dict:
    _same_origin(request)
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Izdelek ni najden.")
    _apply_product(db, product, payload)
    db.commit()
    db.refresh(product)
    return {"product": product_dict(product)}


@app.delete("/api/admin/products/{product_id}")
def admin_delete_product(
    product_id: str,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
) -> dict:
    _same_origin(request)
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Izdelek ni najden.")
    product.active = False
    db.commit()
    return {"ok": True}


@app.post("/api/admin/products/{product_id}/restore")
def admin_restore_product(
    product_id: str,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
) -> dict:
    _same_origin(request)
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Izdelek ni najden.")
    product.active = True
    db.commit()
    return {"ok": True}


@app.get("/api/admin/orders")
def admin_orders(db: Session = Depends(get_db), admin=Depends(require_admin)) -> dict:
    orders = db.scalars(
        select(Order).order_by(Order.created_at.desc()).limit(200)
    ).all()
    return {"orders": [order_dict(order) for order in orders]}


@app.patch("/api/admin/orders/{order_id}")
def admin_update_order(
    order_id: str,
    payload: OrderStatusIn,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
) -> dict:
    _same_origin(request)
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Naročilo ni najdeno.")
    if payload.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail="Neznan status naročila.")
    if (
        payload.status == "shipped"
        and order.payment_status != "paid"
        and order.payment_method != "cod"
    ):
        raise HTTPException(
            status_code=409,
            detail="Naročila brez plačila ni mogoče označiti kot poslano.",
        )
    order.status = payload.status
    now = utcnow()
    if payload.status == "approved":
        order.approved_at = now
    elif payload.status == "shipped":
        order.shipped_at = now
        background.add_task(_send_order_email, order.id, "shipped")
    elif payload.status == "cancelled":
        order.cancelled_at = now
    db.commit()
    db.refresh(order)
    return {"order": order_dict(order)}


@app.post("/api/admin/orders/{order_id}/paid")
def admin_mark_paid(
    order_id: str,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
) -> dict:
    """Mark a bank-transfer (or manual) order as paid."""
    _same_origin(request)
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Naročilo ni najdeno.")
    if order.payment_status == "paid":
        return {"order": order_dict(order)}
    order.payment_status = "paid"
    order.paid_at = utcnow()
    if order.status == "pending_payment":
        order.status = "new"
    if order.payment_method in {"card", "stripe"}:
        for item in order.items:
            product = db.get(Product, item.product_id)
            if product is not None:
                product.stock_qty = max(0, product.stock_qty - item.qty)
    db.commit()
    db.refresh(order)
    background.add_task(_send_order_email, order.id, "paid")
    return {"order": order_dict(order)}


# ------------------------------------------------------------------ webhook
@app.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request, background: BackgroundTasks) -> JSONResponse:
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    try:
        event = stripe_service.verify_webhook(payload, signature)
    except stripe_service.StripeNotConfigured as exc:
        return JSONResponse({"error": str(exc)}, status_code=503)
    except ValueError as exc:
        return JSONResponse({"error": str(exc)}, status_code=400)

    event_type = event.get("type", "")
    obj = event.get("data", {}).get("object", {})
    order_id = (obj.get("metadata") or {}).get("order_id") or obj.get(
        "client_reference_id"
    )

    with SessionLocal() as db:
        order = db.get(Order, order_id) if order_id else None
        if order is None:
            return JSONResponse({"received": True, "ignored": "order"})

        if event_type in {
            "checkout.session.completed",
            "checkout.session.async_payment_succeeded",
        }:
            paid = obj.get("payment_status") in {"paid", "no_payment_required"}
            if event_type.endswith("async_payment_succeeded"):
                paid = True
            if paid and order.payment_status != "paid":
                order.payment_status = "paid"
                order.paid_at = utcnow()
                if order.status == "pending_payment":
                    order.status = "new"
                order.stripe_session_id = obj.get("id") or order.stripe_session_id
                order.stripe_payment_intent = (
                    obj.get("payment_intent") or order.stripe_payment_intent
                )
                for item in order.items:
                    product = db.get(Product, item.product_id)
                    if product is not None:
                        product.stock_qty = max(0, product.stock_qty - item.qty)
                db.commit()
                background.add_task(_send_order_email, order.id, "paid")
                background.add_task(_send_order_email, order.id, "received")
        elif event_type == "checkout.session.expired":
            if order.payment_status != "paid" and order.status == "pending_payment":
                order.status = "cancelled"
                order.cancelled_at = utcnow()
                db.commit()
        elif event_type == "charge.refunded":
            order.payment_status = "refunded"
            db.commit()

    return JSONResponse({"received": True})


# -------------------------------------------------------------- static files
app.mount("/assets", StaticFiles(directory=BASE_DIR / "assets"), name="assets")


@app.get("/", include_in_schema=False)
def index_page() -> FileResponse:
    return FileResponse(BASE_DIR / "index.html")


@app.get("/{page}.html", include_in_schema=False)
def static_page(page: str) -> FileResponse:
    if page not in PAGES:
        raise HTTPException(status_code=404, detail="Stran ni najdena.")
    return FileResponse(BASE_DIR / f"{page}.html")
