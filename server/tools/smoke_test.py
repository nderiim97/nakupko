#!/usr/bin/env python3
"""Read-only smoke test for a running Nakupko store.

Usage (from the repository root):

    python server/tools/smoke_test.py https://nakupko.onrender.com
    python server/tools/smoke_test.py                     # localhost:8000

Optional checks:

    SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... python server/tools/smoke_test.py URL
    python server/tools/smoke_test.py URL --order         # creates a real COD order

The script only reads data by default. ``--order`` intentionally creates one
order (and decrements stock), so use it on a test environment or clean it up in
the admin panel afterwards.
"""

from __future__ import annotations

import argparse
import os
import sys

import httpx

PASS = "PASS"
FAIL = "FAIL"
WARN = "WARN"


class Report:
    def __init__(self) -> None:
        self.failures = 0
        self.warnings = 0

    def ok(self, name: str, detail: str = "") -> None:
        print(f"  {PASS}  {name}" + (f" - {detail}" if detail else ""))

    def fail(self, name: str, detail: str = "") -> None:
        self.failures += 1
        print(f"  {FAIL}  {name}" + (f" - {detail}" if detail else ""))

    def warn(self, name: str, detail: str = "") -> None:
        self.warnings += 1
        print(f"  {WARN}  {name}" + (f" - {detail}" if detail else ""))

    def expect(self, name: str, condition: bool, detail: str = "") -> bool:
        if condition:
            self.ok(name)
        else:
            self.fail(name, detail)
        return condition


def check_headers(report: Report, response: httpx.Response) -> None:
    headers = response.headers
    report.expect(
        "security headers",
        headers.get("x-content-type-options") == "nosniff"
        and headers.get("x-frame-options") == "DENY"
        and "content-security-policy" in headers,
        "missing X-Content-Type-Options, X-Frame-Options or CSP",
    )


def run(base_url: str, args: argparse.Namespace) -> Report:
    report = Report()
    with httpx.Client(
        base_url=base_url.rstrip("/"),
        timeout=20,
        follow_redirects=False,
        headers={"User-Agent": "nakupko-smoke/1.0"},
    ) as client:
        print(f"Nakupko smoke test -> {base_url}")

        print("\n[1] Health and configuration")
        health = client.get("/api/health")
        report.expect("GET /api/health returns 200", health.status_code == 200)
        if health.status_code == 200:
            data = health.json()
            report.expect("health.ok is true", data.get("ok") is True)
            report.expect(
                "environment reported", bool(data.get("environment")), str(data)
            )
            if not data.get("stripe"):
                report.warn("Stripe is not configured", "STRIPE_SECRET_KEY is empty")
            if not data.get("email"):
                report.warn("SMTP is not configured", "emails will only be logged")

        config = client.get("/config.js")
        report.expect("GET /config.js returns 200", config.status_code == 200)
        if config.status_code == 200:
            report.expect(
                "storefront runs in live mode",
                'NK_MODE = "live"' in config.text,
                config.text[:120],
            )
            report.expect('config.js exposes "/api"', '"/api"' in config.text)

        print("\n[2] Catalog API")
        bootstrap = client.get("/api/bootstrap")
        report.expect("GET /api/bootstrap returns 200", bootstrap.status_code == 200)
        products: list[dict] = []
        if bootstrap.status_code == 200:
            payload = bootstrap.json()
            products = payload.get("products", [])
            report.expect("catalog is not empty", len(products) > 0, "0 products")
            report.expect(
                "categories are present",
                len(payload.get("categories", [])) > 0,
                "0 categories",
            )
            report.expect(
                "public settings are present",
                bool(payload.get("settings", {}).get("storeName")),
            )
            report.expect(
                "no admin session for anonymous visitor",
                payload.get("session", {}).get("admin") is None,
            )

        if products:
            product = client.get(f"/api/products/{products[0]['id']}")
            report.expect(
                "GET /api/products/{id} returns 200", product.status_code == 200
            )

        missing = client.get("/api/products/this-does-not-exist")
        report.expect(
            "unknown product returns 404 JSON",
            missing.status_code == 404
            and missing.headers.get("content-type", "").startswith("application/json"),
        )

        print("\n[3] Pages")
        home = client.get("/")
        report.expect("GET / returns 200", home.status_code == 200)
        if home.status_code == 200:
            report.expect("home page markup", 'id="main"' in home.text)
            check_headers(report, home)

        catalog_page = client.get("/category.html")
        report.expect("GET /category.html returns 200", catalog_page.status_code == 200)

        info_page = client.get("/info.html")
        report.expect("GET /info.html returns 200", info_page.status_code == 200)

        assets = client.get("/assets/css/style.css")
        report.expect("static assets are served", assets.status_code == 200)

        not_found = client.get(
            "/this-page-does-not-exist.html",
            headers={"Accept": "text/html"},
        )
        report.expect("unknown page returns 404", not_found.status_code == 404)
        if not_found.status_code == 404:
            report.expect(
                "unknown page shows the branded 404",
                "Napaka 404" in not_found.text,
            )

        print("\n[4] SEO files")
        robots = client.get("/robots.txt")
        report.expect("GET /robots.txt returns 200", robots.status_code == 200)
        if robots.status_code == 200:
            report.expect("robots.txt links the sitemap", "Sitemap:" in robots.text)
            report.expect("robots.txt blocks the admin", "/admin.html" in robots.text)

        sitemap = client.get("/sitemap.xml")
        report.expect("GET /sitemap.xml returns 200", sitemap.status_code == 200)
        if sitemap.status_code == 200:
            report.expect(
                "sitemap.xml is XML", sitemap.text.lstrip().startswith("<?xml")
            )
            report.expect(
                "sitemap contains product URLs", "/product.html?id=" in sitemap.text
            )

        print("\n[5] Admin")
        email = args.admin_email or os.getenv("SMOKE_ADMIN_EMAIL", "")
        password = args.admin_password or os.getenv("SMOKE_ADMIN_PASSWORD", "")
        if not email or not password:
            report.warn(
                "admin login skipped",
                "set SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD to test it",
            )
        else:
            login = client.post(
                "/api/admin/login",
                json={"email": email, "password": password},
            )
            report.expect(
                "admin login succeeds",
                login.status_code == 200,
                f"HTTP {login.status_code}: {login.text[:160]}",
            )
            if login.status_code == 200:
                session = client.get("/api/admin/session")
                report.expect(
                    "admin session is valid",
                    session.status_code == 200 and session.json().get("email") == email,
                )
                report.expect(
                    "admin responses are not cached",
                    session.headers.get("cache-control") == "no-store",
                )
                client.post("/api/admin/logout")
                report.expect(
                    "logout ends the session",
                    client.get("/api/admin/session").status_code == 401,
                )

        print("\n[6] Orders")
        if args.order:
            if not products:
                report.fail("order test", "catalog is empty")
            else:
                product = next(
                    (item for item in products if item.get("stockQty", 0) >= 1),
                    None,
                )
                if product is None:
                    report.fail("order test", "no product in stock")
                else:
                    order = client.post(
                        "/api/orders",
                        json={
                            "items": [{"id": product["id"], "qty": 1}],
                            "customer": {
                                "name": "Smoke Test",
                                "email": "smoke-test@example.com",
                                "phone": "+386 31 000 000",
                                "address": "Testna ulica 1",
                                "postal": "1000",
                                "city": "Ljubljana",
                                "note": "smoke test",
                            },
                            "delivery": "standard",
                            "payment": "cod",
                        },
                    )
                    report.expect(
                        "COD order is created",
                        order.status_code == 201,
                        f"HTTP {order.status_code}: {order.text[:160]}",
                    )
                    if order.status_code == 201:
                        data = order.json()
                        report.expect(
                            "order total is calculated",
                            data["order"]["totals"]["total"] > 0,
                        )
                        lookup = client.get(
                            f"/api/orders/{data['order']['id']}",
                            params={"token": data["accessToken"]},
                        )
                        report.expect(
                            "order lookup with token works",
                            lookup.status_code == 200,
                        )
                        report.warn(
                            "created a real order",
                            f"{data['order']['id']} - remove it in the admin panel",
                        )
        else:
            denied = client.get("/api/orders/NK-00000000-0000", params={"token": "x"})
            report.expect(
                "order lookup without a valid token returns 404",
                denied.status_code == 404,
            )
            report.warn("order creation skipped", "use --order to test checkout")

    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke test a running Nakupko store")
    parser.add_argument(
        "base_url",
        nargs="?",
        default=os.getenv("SMOKE_BASE_URL", "http://127.0.0.1:8000"),
        help="store URL (default: http://127.0.0.1:8000)",
    )
    parser.add_argument(
        "--admin-email", default="", help="admin e-mail for the login check"
    )
    parser.add_argument(
        "--admin-password", default="", help="admin password for the login check"
    )
    parser.add_argument(
        "--order",
        action="store_true",
        help="create one real COD order to test checkout end to end",
    )
    args = parser.parse_args()

    try:
        report = run(args.base_url, args)
    except httpx.HTTPError as exc:
        print(f"\n{FAIL}  cannot reach {args.base_url}: {exc}")
        return 2

    print("\n" + "-" * 52)
    if report.failures:
        print(
            f"Result: {report.failures} check(s) failed, {report.warnings} warning(s)."
        )
        return 1
    print(f"Result: all checks passed ({report.warnings} warning(s)).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
