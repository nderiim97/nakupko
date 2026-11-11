"""Runtime configuration for the Nakupko store server.

Every value can be supplied through environment variables so the same code
runs locally (SQLite) and in production (Postgres, Stripe, SMTP).
"""

from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(__file__).resolve().parent

try:  # Load .env for local development; production uses real env vars.
    from dotenv import load_dotenv

    load_dotenv(BASE_DIR / ".env")
except ImportError:  # pragma: no cover - optional dependency
    pass


def _bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    app_name: str = "Nakupko"
    environment: str = os.getenv("APP_ENV", "development")

    # Security -------------------------------------------------------------
    secret_key: str = os.getenv("SECRET_KEY", "dev-only-change-me")
    session_days: int = int(os.getenv("SESSION_DAYS", "7"))

    # Database -------------------------------------------------------------
    database_url: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///" + (DATA_DIR / "nakupko.db").as_posix(),
    )

    # Admin bootstrap ------------------------------------------------------
    admin_email: str = os.getenv("ADMIN_EMAIL", "admin@nakupko.local")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "12345678")

    # Public URLs ----------------------------------------------------------
    public_base_url: str = os.getenv("PUBLIC_BASE_URL", "http://127.0.0.1:8000").rstrip(
        "/"
    )
    allowed_origins: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://127.0.0.1:8000,http://localhost:8000",
        ).split(",")
        if origin.strip()
    ]

    # Stripe ---------------------------------------------------------------
    stripe_secret_key: str = os.getenv("STRIPE_SECRET_KEY", "")
    stripe_webhook_secret: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    stripe_currency: str = os.getenv("STRIPE_CURRENCY", "eur")

    # Store / email --------------------------------------------------------
    store_name: str = os.getenv("STORE_NAME", "Nakupko")
    store_email: str = os.getenv("STORE_EMAIL", "narocila@nakupko.local")
    store_phone: str = os.getenv("STORE_PHONE", "+386 1 000 00 00")
    store_address: str = os.getenv("STORE_ADDRESS", "Tržaška cesta 1, 1000 Ljubljana")
    store_vat: str = os.getenv("STORE_VAT", "SI00000000")
    store_iban: str = os.getenv("STORE_IBAN", "")

    smtp_host: str = os.getenv("SMTP_HOST", "")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str = os.getenv("SMTP_USER", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    smtp_tls: bool = _bool(os.getenv("SMTP_TLS"), True)

    # Shipping -------------------------------------------------------------
    free_shipping_threshold: float = float(os.getenv("FREE_SHIPPING_THRESHOLD", "50"))
    standard_shipping: float = float(os.getenv("STANDARD_SHIPPING", "3.99"))
    express_shipping: float = float(os.getenv("EXPRESS_SHIPPING", "6.99"))
    cod_fee: float = float(os.getenv("COD_FEE", "1.50"))

    @property
    def stripe_enabled(self) -> bool:
        return bool(self.stripe_secret_key)

    @property
    def email_enabled(self) -> bool:
        return bool(self.smtp_host)


settings = Settings()
