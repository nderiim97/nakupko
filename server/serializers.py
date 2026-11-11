"""JSON serializers shared by the public and admin APIs."""

from __future__ import annotations

from .config import settings
from .models import Category, Order, Product
from .models import iso


def product_dict(product: Product) -> dict:
    return {
        "id": product.id,
        "name": product.name,
        "brand": product.brand,
        "category": product.category_id,
        "price": float(product.price or 0),
        "oldPrice": float(product.old_price) if product.old_price is not None else None,
        "rating": product.rating or 0,
        "reviews": product.reviews or 0,
        "art": product.art,
        "palette": product.palette or [],
        "badge": product.badge,
        "colors": product.colors or [],
        "description": product.description,
        "features": product.features or [],
        "specs": product.specs or {},
        "stock": (product.stock_qty or 0) > 0,
        "stockQty": product.stock_qty or 0,
        "tags": product.tags or [],
        "sku": product.sku,
        "added": product.added,
        "active": product.active,
        "createdAt": iso(product.created_at),
        "updatedAt": iso(product.updated_at),
    }


def category_dict(category: Category) -> dict:
    return {
        "slug": category.slug,
        "name": category.name,
        "icon": category.icon,
        "tint": category.tint,
        "blurb": category.blurb,
        "sort": category.sort,
    }


def order_dict(order: Order) -> dict:
    return {
        "id": order.id,
        "createdAt": iso(order.created_at),
        "status": order.status,
        "paymentStatus": order.payment_status,
        "demo": False,
        "customer": {
            "name": order.customer_name,
            "email": order.customer_email,
            "phone": order.customer_phone,
            "address": order.customer_address,
            "postal": order.customer_postal,
            "city": order.customer_city,
            "note": order.customer_note,
        },
        "items": [
            {
                "id": item.product_id,
                "name": item.name,
                "brand": item.brand,
                "qty": item.qty,
                "color": item.color,
                "price": float(item.unit_price or 0),
                "lineTotal": float(item.line_total or 0),
            }
            for item in order.items
        ],
        "delivery": {
            "method": order.delivery_method,
            "label": order.delivery_label,
            "price": float(order.delivery_price or 0),
        },
        "payment": {
            "method": order.payment_method,
            "label": order.payment_label,
            "fee": float(order.payment_fee or 0),
        },
        "totals": {
            "subtotal": float(order.subtotal or 0),
            "discount": float(order.discount or 0),
            "shipping": float(order.shipping or 0),
            "fee": float(order.fee or 0),
            "total": float(order.total or 0),
            "coupon": order.coupon,
        },
        "stripeSessionId": order.stripe_session_id,
        "paidAt": iso(order.paid_at),
        "approvedAt": iso(order.approved_at),
        "shippedAt": iso(order.shipped_at),
        "cancelledAt": iso(order.cancelled_at),
    }


def public_settings() -> dict:
    return {
        "storeName": settings.store_name,
        "storeEmail": settings.store_email,
        "storePhone": settings.store_phone,
        "storeAddress": settings.store_address,
        "storeVat": settings.store_vat,
        "storeIban": settings.store_iban,
        "freeShippingThreshold": settings.free_shipping_threshold,
        "standardShipping": settings.standard_shipping,
        "expressShipping": settings.express_shipping,
        "codFee": settings.cod_fee,
        "stripeEnabled": settings.stripe_enabled,
        "currency": settings.stripe_currency.upper(),
    }
