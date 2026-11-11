"""Request schemas with server-side validation."""

from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class CartItemIn(BaseModel):
    id: str = Field(min_length=1, max_length=120)
    qty: int = Field(default=1, ge=1, le=50)
    color: str = Field(default="", max_length=60)


class CustomerIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    email: str = Field(min_length=5, max_length=200)
    phone: str = Field(min_length=5, max_length=60)
    address: str = Field(min_length=3, max_length=240)
    postal: str = Field(min_length=3, max_length=20)
    city: str = Field(min_length=2, max_length=120)
    note: str = Field(default="", max_length=1000)

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        value = value.strip()
        if not EMAIL_RE.match(value):
            raise ValueError("Vnesite veljaven e-poštni naslov.")
        return value.lower()

    @field_validator("name", "address", "city", "phone", "postal")
    @classmethod
    def strip_values(cls, value: str) -> str:
        return value.strip()


class OrderIn(BaseModel):
    items: list[CartItemIn] = Field(min_length=1, max_length=50)
    customer: CustomerIn
    delivery: Literal["standard", "express", "pickup"] = "standard"
    payment: Literal["card", "cod", "stripe", "bank"] = "card"
    coupon: str = Field(default="", max_length=40)


class LoginIn(BaseModel):
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=1, max_length=200)


class ProductIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    brand: str = Field(default="", max_length=80)
    category: str = Field(min_length=1, max_length=64)
    price: float = Field(gt=0, le=100000)
    oldPrice: float | None = Field(default=None, ge=0, le=100000)
    art: str = Field(default="blocks", max_length=40)
    palette: list[str] = Field(default_factory=list, max_length=6)
    badge: str = Field(default="", max_length=40)
    colors: list[dict] = Field(default_factory=list, max_length=12)
    description: str = Field(default="", max_length=4000)
    features: list[str] = Field(default_factory=list, max_length=30)
    specs: dict[str, str] = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list, max_length=20)
    stockQty: int = Field(default=0, ge=0, le=100000)
    active: bool = True
    sku: str = Field(default="", max_length=40)


class OrderStatusIn(BaseModel):
    status: Literal["new", "approved", "shipped", "cancelled"]
