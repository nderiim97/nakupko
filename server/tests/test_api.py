"""API smoke tests for the real Nakupko store.

Run from the repository root:
    python -m pytest server/tests -q
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

import pytest

TMP_DIR = Path(tempfile.mkdtemp(prefix="nakupko-test-"))
os.environ["DATABASE_URL"] = "sqlite:///" + (TMP_DIR / "test.db").as_posix()
os.environ["ADMIN_EMAIL"] = "admin@test.local"
os.environ["ADMIN_PASSWORD"] = "12345678"
os.environ["PUBLIC_BASE_URL"] = "http://testserver"
os.environ["STRIPE_SECRET_KEY"] = ""
os.environ["STRIPE_WEBHOOK_SECRET"] = ""

from fastapi.testclient import TestClient  # noqa: E402

from server.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def product_id(client) -> str:
    data = client.get("/api/bootstrap").json()
    return data["products"][0]["id"]


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_database_url_uses_psycopg(monkeypatch):
    from server.config import _database_url

    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@host:5432/db")
    assert _database_url() == "postgresql+psycopg://u:p@host:5432/db"

    monkeypatch.setenv("DATABASE_URL", "postgres://u:p@host:5432/db")
    assert _database_url() == "postgresql+psycopg://u:p@host:5432/db"

    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://u:p@host/db")
    assert _database_url() == "postgresql+psycopg://u:p@host/db"


def test_bootstrap_catalog(client):
    data = client.get("/api/bootstrap").json()
    assert data["mode"] == "live"
    assert len(data["products"]) >= 20
    assert len(data["categories"]) == 8
    assert data["coupons"]["NAKUP10"]["value"] == 10
    assert data["settings"]["freeShippingThreshold"] == 50
    assert data["session"]["admin"] is None


def test_admin_login_rejects_wrong_password(client):
    response = client.post(
        "/api/admin/login",
        json={"email": "admin@test.local", "password": "wrong"},
    )
    assert response.status_code == 401


def test_admin_login_and_session(client):
    response = client.post(
        "/api/admin/login",
        json={"email": "admin@test.local", "password": "12345678"},
    )
    assert response.status_code == 200
    assert "nk_admin" in response.cookies
    session = client.get("/api/admin/session")
    assert session.status_code == 200
    assert session.json()["email"] == "admin@test.local"


def test_order_totals_and_public_lookup(client, product_id):
    response = client.post(
        "/api/orders",
        json={
            "items": [{"id": product_id, "qty": 1}],
            "customer": {
                "name": "Ana Testna",
                "email": "ana@example.com",
                "phone": "+386 31 234 567",
                "address": "Tržaška cesta 12",
                "postal": "1000",
                "city": "Ljubljana",
                "note": "",
            },
            "delivery": "standard",
            "payment": "cod",
            "coupon": "NAKUP10",
        },
    )
    assert response.status_code == 201, response.text
    data = response.json()
    order = data["order"]
    assert order["status"] == "new"
    assert order["paymentStatus"] == "unpaid"
    assert order["totals"]["subtotal"] == pytest.approx(429.9)
    assert order["totals"]["discount"] == pytest.approx(42.99)
    assert order["totals"]["shipping"] == 0
    assert order["totals"]["fee"] == pytest.approx(1.5)
    assert order["totals"]["total"] == pytest.approx(388.41)
    assert order["customer"]["name"] == "Ana Testna"

    lookup = client.get(
        f"/api/orders/{order['id']}",
        params={"token": data["accessToken"]},
    )
    assert lookup.status_code == 200
    assert lookup.json()["order"]["id"] == order["id"]

    denied = client.get(f"/api/orders/{order['id']}", params={"token": "nope"})
    assert denied.status_code == 404

    client.admin_order_id = order["id"]
    client.admin_order_total = order["totals"]["total"]


def test_admin_order_flow(client):
    orders = client.get("/api/admin/orders")
    assert orders.status_code == 200
    ids = [order["id"] for order in orders.json()["orders"]]
    assert client.admin_order_id in ids

    approved = client.patch(
        f"/api/admin/orders/{client.admin_order_id}",
        json={"status": "approved"},
    )
    assert approved.status_code == 200
    assert approved.json()["order"]["status"] == "approved"

    shipped = client.patch(
        f"/api/admin/orders/{client.admin_order_id}",
        json={"status": "shipped"},
    )
    assert shipped.status_code == 200
    assert shipped.json()["order"]["status"] == "shipped"


def test_order_rejects_unknown_product(client):
    response = client.post(
        "/api/orders",
        json={
            "items": [{"id": "missing", "qty": 1}],
            "customer": {
                "name": "Ana Testna",
                "email": "ana@example.com",
                "phone": "+386 31 234 567",
                "address": "Tržaška cesta 12",
                "postal": "1000",
                "city": "Ljubljana",
            },
            "delivery": "standard",
            "payment": "cod",
        },
    )
    assert response.status_code == 400


def test_order_rejects_bad_stock(client, product_id):
    response = client.post(
        "/api/orders",
        json={
            "items": [{"id": product_id, "qty": 50}],
            "customer": {
                "name": "Ana Testna",
                "email": "ana@example.com",
                "phone": "+386 31 234 567",
                "address": "Tržaška cesta 12",
                "postal": "1000",
                "city": "Ljubljana",
            },
            "delivery": "standard",
            "payment": "cod",
        },
    )
    assert response.status_code == 409


def test_stripe_order_without_key_fails_cleanly(client, product_id):
    response = client.post(
        "/api/orders",
        json={
            "items": [{"id": product_id, "qty": 1}],
            "customer": {
                "name": "Ana Testna",
                "email": "ana@example.com",
                "phone": "+386 31 234 567",
                "address": "Tržaška cesta 12",
                "postal": "1000",
                "city": "Ljubljana",
            },
            "delivery": "express",
            "payment": "card",
        },
    )
    assert response.status_code == 503


def test_admin_product_crud(client):
    payload = {
        "name": "Testni Izdelek",
        "brand": "Test",
        "category": "dom",
        "price": 19.9,
        "oldPrice": None,
        "art": "lamp",
        "palette": ["#ffffff", "#146b56", "#123c36"],
        "badge": "",
        "colors": [],
        "description": "Testni opis.",
        "features": ["Lastnost"],
        "specs": {"Barva": "bela"},
        "tags": [],
        "stockQty": 7,
        "active": True,
        "sku": "TEST-1",
    }
    created = client.post("/api/admin/products", json=payload)
    assert created.status_code == 201, created.text
    product = created.json()["product"]
    assert product["id"] == "testni-izdelek"
    assert product["stock"] is True

    payload["price"] = 24.9
    payload["stockQty"] = 0
    updated = client.put(f"/api/admin/products/{product['id']}", json=payload)
    assert updated.status_code == 200
    assert updated.json()["product"]["price"] == 24.9
    assert updated.json()["product"]["stock"] is False

    deleted = client.delete(f"/api/admin/products/{product['id']}")
    assert deleted.status_code == 200
    assert client.get(f"/api/products/{product['id']}").status_code == 404

    restored = client.post(f"/api/admin/products/{product['id']}/restore")
    assert restored.status_code == 200
    assert client.get(f"/api/products/{product['id']}").status_code == 200


def test_bank_transfer_order_and_mark_paid(client):
    catalog = client.get("/api/products").json()["products"]
    product = next(item for item in catalog if item["active"] and item["stockQty"] >= 3)
    before = product["stockQty"]

    response = client.post(
        "/api/orders",
        json={
            "items": [{"id": product["id"], "qty": 2}],
            "customer": {
                "name": "Boris Banka",
                "email": "boris@example.com",
                "phone": "+386 41 111 222",
                "address": "Prešernova cesta 1",
                "postal": "1000",
                "city": "Ljubljana",
                "note": "",
            },
            "delivery": "standard",
            "payment": "bank",
        },
    )
    assert response.status_code == 201, response.text
    order = response.json()["order"]
    assert order["status"] == "new"
    assert order["paymentStatus"] == "unpaid"
    assert order["payment"]["method"] == "bank"

    after_order = client.get(f"/api/products/{product['id']}").json()["product"]
    assert after_order["stockQty"] == before - 2

    paid = client.post(f"/api/admin/orders/{order['id']}/paid")
    assert paid.status_code == 200
    assert paid.json()["order"]["paymentStatus"] == "paid"
    assert paid.json()["order"]["status"] == "new"

    again = client.post(f"/api/admin/orders/{order['id']}/paid")
    assert again.status_code == 200
    assert again.json()["order"]["paymentStatus"] == "paid"

    after_paid = client.get(f"/api/products/{product['id']}").json()["product"]
    assert after_paid["stockQty"] == before - 2


def test_admin_endpoints_require_login(client):
    client.post("/api/admin/logout")
    assert client.get("/api/admin/orders").status_code == 401
    assert client.get("/api/admin/products").status_code == 401
