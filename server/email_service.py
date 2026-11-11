"""Transactional e-mail helpers.

When SMTP is not configured every message is printed to the server log. That
keeps local development usable while production can switch on real delivery
with SMTP_HOST / SMTP_USER / SMTP_PASSWORD.
"""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from .config import settings
from .models import Order
from .serializers import order_dict

log = logging.getLogger("nakupko.email")


def money(value: float) -> str:
    return f"{value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") + " €"


def _item_rows(order: Order) -> str:
    rows = []
    for item in order.items:
        rows.append(
            "<tr>"
            f"<td style='padding:6px 0'>{item.name}"
            f"{' · ' + item.color if item.color else ''}</td>"
            f"<td style='padding:6px 0;text-align:center'>{item.qty}</td>"
            f"<td style='padding:6px 0;text-align:right'>{money(float(item.line_total))}</td>"
            "</tr>"
        )
    return "".join(rows)


def _summary(order: Order) -> str:
    data = order_dict(order)
    totals = data["totals"]
    discount = (
        f"<tr><td>Popust</td><td style='text-align:right'>−{money(totals['discount'])}</td></tr>"
        if totals["discount"]
        else ""
    )
    return (
        "<table style='width:100%;border-collapse:collapse;font-size:14px'>"
        f"{_item_rows(order)}"
        "</table>"
        "<table style='width:100%;border-collapse:collapse;font-size:14px;margin-top:12px'>"
        f"<tr><td>Vmesni seštevek</td><td style='text-align:right'>{money(totals['subtotal'])}</td></tr>"
        f"{discount}"
        f"<tr><td>Dostava</td><td style='text-align:right'>"
        f"{money(totals['shipping']) if totals['shipping'] else 'Brezplačno'}</td></tr>"
        f"<tr><td><strong>Skupaj</strong></td><td style='text-align:right'><strong>{money(totals['total'])}</strong></td></tr>"
        "</table>"
    )


def _send(to: str, subject: str, text: str, html: str) -> None:
    message = EmailMessage()
    message["From"] = f"{settings.store_name} <{settings.store_email}>"
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text)
    message.add_alternative(html, subtype="html")

    if not settings.email_enabled:
        log.warning(
            "SMTP ni nastavljen — e-pošte niso poslane. Prejemnik=%s Zadeva=%s",
            to,
            subject,
        )
        log.info("Vsebina e-pošte:\n%s", text)
        return

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            smtp.ehlo()
            if settings.smtp_tls:
                smtp.starttls()
                smtp.ehlo()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
    except Exception:  # pragma: no cover - network failure should not break orders
        log.exception("Pošiljanje e-pošte ni uspelo (%s)", to)


def send_order_received(order: Order) -> None:
    data = order_dict(order)
    customer = data["customer"]
    subject = f"Naročilo {order.id} je prejeto"
    bank_text = ""
    bank_html = ""
    if order.payment_method == "bank":
        if settings.store_iban:
            bank_text = (
                f"\nZa plačilo nakažite {money(data['totals']['total'])} na IBAN "
                f"{settings.store_iban}, sklic {order.id}.\n"
            )
            bank_html = (
                f"<p>Za plačilo nakažite <strong>{money(data['totals']['total'])}</strong> "
                f"na IBAN <strong>{settings.store_iban}</strong>, "
                f"sklic <strong>{order.id}</strong>.</p>"
            )
        else:
            bank_text = (
                "\nPodatke za bančno nakazilo prejmete od naše ekipe v ločenem "
                "sporočilu.\n"
            )
            bank_html = (
                "<p>Podatke za bančno nakazilo prejmete od naše ekipe v ločenem "
                "sporočilu.</p>"
            )
    text = (
        f"Pozdravljeni, {customer['name']}!\n\n"
        f"Vaše naročilo {order.id} je prejeto. Skupaj: {money(data['totals']['total'])}.\n"
        f"{bank_text}\n"
        "Ko bo naročilo odobreno in poslano, vas obvestimo po e-pošti.\n\n"
        f"{settings.store_name}\n{settings.store_address}\n{settings.store_email}\n"
    )
    html = (
        f"<p>Pozdravljeni, <strong>{customer['name']}</strong>!</p>"
        f"<p>Vaše naročilo <strong>{order.id}</strong> je prejeto. "
        f"Skupaj: <strong>{money(data['totals']['total'])}</strong>.</p>"
        f"{bank_html}"
        f"{_summary(order)}"
        "<p>Ko bo naročilo odobreno in poslano, vas obvestimo po e-pošti.</p>"
        f"<p style='color:#5b6560'>{settings.store_name}<br>{settings.store_address}<br>"
        f"{settings.store_email}</p>"
    )
    _send(customer["email"], subject, text, html)

    admin_text = (
        f"Novo naročilo {order.id}\n"
        f"Stranka: {customer['name']} <{customer['email']}>\n"
        f"Telefon: {customer['phone']}\n"
        f"Naslov: {customer['address']}, {customer['postal']} {customer['city']}\n"
        f"Skupaj: {money(data['totals']['total'])}\n"
        f"Plačilo: {data['payment']['label']} ({order.payment_status})\n"
    )
    _send(
        settings.store_email,
        f"Novo naročilo {order.id}",
        admin_text,
        "<pre style='font-family:monospace'>" + admin_text + "</pre>",
    )


def send_order_paid(order: Order) -> None:
    data = order_dict(order)
    customer = data["customer"]
    subject = f"Plačilo za naročilo {order.id} je potrjeno"
    text = (
        f"Pozdravljeni, {customer['name']}!\n\n"
        f"Plačilo za naročilo {order.id} je uspešno prejeto. "
        f"Znesek: {money(data['totals']['total'])}.\n\n"
        "Naročilo bomo pripravili in poslali v najkrajšem času.\n"
    )
    html = (
        f"<p>Pozdravljeni, <strong>{customer['name']}</strong>!</p>"
        f"<p>Plačilo za naročilo <strong>{order.id}</strong> je uspešno prejeto. "
        f"Znesek: <strong>{money(data['totals']['total'])}</strong>.</p>"
        "<p>Naročilo bomo pripravili in poslali v najkrajšem času.</p>"
    )
    _send(customer["email"], subject, text, html)


def send_order_shipped(order: Order) -> None:
    data = order_dict(order)
    customer = data["customer"]
    subject = f"Naročilo {order.id} je poslano"
    text = (
        f"Pozdravljeni, {customer['name']}!\n\n"
        f"Vaše naročilo {order.id} je bilo poslano na naslov "
        f"{customer['address']}, {customer['postal']} {customer['city']}.\n\n"
        f"{settings.store_name}\n"
    )
    html = (
        f"<p>Pozdravljeni, <strong>{customer['name']}</strong>!</p>"
        f"<p>Vaše naročilo <strong>{order.id}</strong> je bilo poslano na naslov "
        f"{customer['address']}, {customer['postal']} {customer['city']}.</p>"
        f"<p>{settings.store_name}</p>"
    )
    _send(customer["email"], subject, text, html)
