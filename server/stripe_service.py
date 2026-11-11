"""Stripe Checkout integration (server-side only).

The secret key never reaches the browser. Cart prices are recalculated from the
database before a session is created, so a tampered client cannot change the
amount.
"""

from __future__ import annotations

import stripe

from .config import settings
from .models import Order


class StripeNotConfigured(RuntimeError):
    pass


def _client() -> None:
    if not settings.stripe_enabled:
        raise StripeNotConfigured("Stripe ni povezan. Nastavite STRIPE_SECRET_KEY.")
    stripe.api_key = settings.stripe_secret_key


def _cents(value: float) -> int:
    return max(0, int(round(float(value) * 100)))


def create_checkout_session(order: Order) -> tuple[str, str]:
    """Create a Stripe Checkout session and return (url, session_id)."""
    _client()

    line_items: list[dict] = []
    for item in order.items:
        line_items.append(
            {
                "quantity": item.qty,
                "price_data": {
                    "currency": settings.stripe_currency,
                    "unit_amount": _cents(item.unit_price),
                    "product_data": {
                        "name": item.name + (f" · {item.color}" if item.color else ""),
                        "metadata": {"product_id": item.product_id},
                    },
                },
            }
        )

    if float(order.shipping or 0) > 0:
        line_items.append(
            {
                "quantity": 1,
                "price_data": {
                    "currency": settings.stripe_currency,
                    "unit_amount": _cents(order.shipping),
                    "product_data": {"name": order.delivery_label or "Dostava"},
                },
            }
        )

    if float(order.fee or 0) > 0:
        line_items.append(
            {
                "quantity": 1,
                "price_data": {
                    "currency": settings.stripe_currency,
                    "unit_amount": _cents(order.fee),
                    "product_data": {"name": "Doplačilo za plačilo"},
                },
            }
        )

    discounts: list[dict] = []
    if float(order.discount or 0) > 0:
        coupon = stripe.Coupon.create(
            amount_off=_cents(order.discount),
            currency=settings.stripe_currency,
            duration="once",
            name=order.coupon or "Popust",
            metadata={"order_id": order.id},
        )
        discounts.append({"coupon": coupon.id})

    success_url = (
        settings.public_base_url
        + "/order.html?id="
        + order.id
        + "&token="
        + order.access_token
        + "&paid=1&session_id={CHECKOUT_SESSION_ID}"
    )
    cancel_url = settings.public_base_url + "/checkout.html?cancelled=1"

    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=line_items,
        discounts=discounts or None,
        customer_email=order.customer_email,
        client_reference_id=order.id,
        metadata={"order_id": order.id},
        payment_method_types=["card"],
        billing_address_collection="auto",
        success_url=success_url,
        cancel_url=cancel_url,
    )
    return session.url, session.id


def verify_webhook(payload: bytes, signature: str) -> dict:
    if not settings.stripe_webhook_secret:
        raise StripeNotConfigured("STRIPE_WEBHOOK_SECRET ni nastavljen.")
    try:
        return stripe.Webhook.construct_event(
            payload, signature, settings.stripe_webhook_secret
        )
    except (ValueError, stripe.SignatureVerificationError) as exc:
        raise ValueError("Neveljavna Stripe podpisana zahteva.") from exc
