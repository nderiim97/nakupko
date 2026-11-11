"""Seed the database from the original demo catalog in assets/js/data.js."""

from __future__ import annotations

import json5
import re
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import BASE_DIR, settings
from .models import AdminUser, Category, Coupon, Product
from .security import hash_password

DATA_FILE = BASE_DIR / "assets" / "js" / "data.js"


def _extract(name: str, opener: str, closer: str) -> object:
    text = DATA_FILE.read_text(encoding="utf-8")
    match = re.search(
        rf"window\.NK\.{name}\s*=\s*(\{opener}.*?\n\{closer})",
        text,
        re.DOTALL,
    )
    if not match:
        raise RuntimeError(f"Ne najdem window.NK.{name} v {DATA_FILE}")
    return json5.loads(match.group(1))


def seed_database(db: Session, *, force: bool = False) -> dict[str, int]:
    categories = _extract("categories", "[", "]")
    products = _extract("products", "[", "]")
    coupons = _extract("coupons", "{", "}")

    created = {"categories": 0, "products": 0, "coupons": 0, "admins": 0}

    for index, category in enumerate(categories):
        if force or db.get(Category, category["slug"]) is None:
            row = db.get(Category, category["slug"]) or Category(slug=category["slug"])
            row.name = category["name"]
            row.icon = category.get("icon", "")
            row.tint = category.get("tint", "")
            row.blurb = category.get("blurb", "")
            row.sort = index
            db.add(row)
            created["categories"] += 1

    db.flush()

    for product in products:
        if not force and db.get(Product, product["id"]) is not None:
            continue
        row = db.get(Product, product["id"]) or Product(id=product["id"])
        row.name = product["name"]
        row.brand = product.get("brand", "")
        row.category_id = product.get("category")
        row.price = product.get("price", 0)
        row.old_price = product.get("oldPrice")
        row.rating = product.get("rating", 0)
        row.reviews = product.get("reviews", 0)
        row.art = product.get("art", "blocks")
        row.palette = product.get("palette", [])
        row.badge = product.get("badge", "")
        row.colors = product.get("colors", [])
        row.description = product.get("description", "")
        row.features = product.get("features", [])
        row.specs = product.get("specs", {})
        row.tags = product.get("tags", [])
        row.stock_qty = 25 if product.get("stock") else 0
        row.active = True
        row.sku = product.get("sku", "")
        row.added = product.get("added", 0)
        db.add(row)
        created["products"] += 1

    for code, info in coupons.items():
        if force or db.get(Coupon, code) is None:
            row = db.get(Coupon, code) or Coupon(code=code)
            row.type = info.get("type", "percent")
            row.value = info.get("value", 0)
            row.label = info.get("label", "")
            row.active = True
            db.add(row)
            created["coupons"] += 1

    admin = db.scalar(select(AdminUser).where(AdminUser.email == settings.admin_email))
    if admin is None:
        db.add(
            AdminUser(
                email=settings.admin_email,
                password_hash=hash_password(settings.admin_password),
            )
        )
        created["admins"] += 1

    db.commit()
    return created


def main() -> None:
    from .db import SessionLocal, init_db

    init_db()
    with SessionLocal() as db:
        result = seed_database(db)
    print("Seed finished:", json5.dumps(result))


if __name__ == "__main__":
    main()
