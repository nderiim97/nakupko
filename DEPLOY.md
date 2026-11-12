# Objava prave trgovine — korak za korakom

Ta dokument je operativni seznam za objavo žive trgovine. Koda je pripravljena;
spodnji koraki potrebujejo tvoje račune (Render, Stripe, SMTP) in trajajo
približno 45–60 minut.

- Repozitorij: `nderiim97/nakupko`
- Veja s pravo trgovino: `real-shop`
- Demo na GitHub Pages ostane na veji `main` in se ne spreminja

---

## 0. Pred začetkom

Pripravi:

- [ ] GitHub dostop do repozitorija `nderiim97/nakupko`
- [ ] Render račun (<https://render.com>)
- [ ] Stripe račun (najprej testni način)
- [ ] SMTP dostop (Resend, Brevo, Mailgun ali Gmail z app geslom)
- [ ] Podatke podjetja: naziv, naslov, davčna številka, e-pošta, telefon, IBAN
- [ ] Močno geslo za skrbnika (15+ znakov, shranjeno v upravitelju gesel)

Preveri, da je veja `real-shop` pushana:

```powershell
git log --oneline -3
git status --short
```

---

## 1. Render Blueprint

1. Odpri <https://dashboard.render.com/blueprints>.
2. **New Blueprint Instance** → izberi repozitorij `nderiim97/nakupko`.
3. Kot vejo izberi **`real-shop`** (ne `main`, da demo na Pages ostane nedotaknjen).
4. Render prebere `render.yaml` in prikaže storitev `nakupko` + bazo `nakupko-db`.
5. Vnesi vrednosti, označene s `sync: false` (tabela spodaj).
6. Klikni **Apply** in počakaj, da se prvi deploy konča (2–4 minute).

### Spremenljivke okolja

| Spremenljivka | Vrednost | Opomba |
| --- | --- | --- |
| `PUBLIC_BASE_URL` | `https://nakupko.onrender.com` | Brez `/` na koncu; kasneje zamenjaj z domeno |
| `ALLOWED_ORIGINS` | `https://nakupko.onrender.com` | Enaka vrednost kot zgoraj |
| `ADMIN_EMAIL` | tvoj e-poštni naslov | Prijava v skrbništvo |
| `ADMIN_PASSWORD` | močno geslo | Shrani v upravitelja gesel |
| `STORE_EMAIL` | `narocila@tvoja-domena.si` | Prikazano strankam in v e-pošti |
| `STORE_PHONE` | `+386 ...` | |
| `STORE_ADDRESS` | `Ulica 1, 1000 Ljubljana` | |
| `STORE_VAT` | `SI12345678` | |
| `STORE_IBAN` | `SI56 ...` | Obvezno za bančno nakazilo |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Najprej testni ključ |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Dodaš v koraku 3 |
| `SMTP_HOST` | npr. `smtp.resend.com` | Prazno = e-pošta samo v dnevnik |
| `SMTP_USER` | npr. `resend` | |
| `SMTP_PASSWORD` | SMTP geslo / API ključ | |
| `STORE_NAME` | `Nakupko` | Že nastavljeno v blueprintu |

`SECRET_KEY`, `DATABASE_URL` in `APP_ENV=production` Render nastavi sam.
`TRUST_PROXY` ni potreben — v produkciji je privzeto vklopljen, da se omejevanje
zahtevkov uporablja pravi IP obiskovalca iz glave `X-Forwarded-For`.

> **Render plan:** `render.yaml` uporablja `plan: starter` (plačljivo).
> Brezplačni Postgres poteče po 30 dneh. Za resnično trgovino uporabi starter
> ali zunanji Postgres (Neon, Supabase) in nastavi `DATABASE_URL` ročno.

### Preveri deploy

```powershell
curl https://nakupko.onrender.com/api/health
```

Pričakovan odgovor:

```json
{"ok":true,"stripe":false,"email":false,"environment":"production"}
```

`stripe`/`email` sta `false`, dokler ne vneseš ključev — to je pričakovano.
Odpri še `https://nakupko.onrender.com` in preveri, da se prikažejo izdelki iz
baze (ne demo podatki iz brskalnika).

### Prvi zagon

- [ ] Odpri `/admin.html` in se prijavi z `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- [ ] Zamenjaj geslo skrbnika (Render → Environment → `ADMIN_PASSWORD` → redeploy,
      nato v bazi posodobi uporabnika ali počisti `admin_users` in se prijavi znova)
- [ ] Preveri, da je v meniju vidna povezava na pravne strani
- [ ] Preveri, da se ob prvem obisku prikaže obvestilo o piškotkih

---

## 2. Stripe — testni način

1. Odpri <https://dashboard.stripe.com/test/apikeys>.
2. Kopiraj **Secret key** (`sk_test_...`) → Render → `STRIPE_SECRET_KEY` → redeploy.
3. Počakaj na deploy in preveri `/api/health` → `"stripe": true`.

### Webhook

1. Stripe → **Developers → Webhooks → Add endpoint**.
2. URL: `https://nakupko.onrender.com/api/webhooks/stripe`.
3. Dogodki:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.expired`
   - `charge.refunded`
4. Kopiraj **Signing secret** (`whsec_...`) → Render → `STRIPE_WEBHOOK_SECRET`.
5. Redeploy in v Stripe odpri webhook → **Send test event** (npr.
   `checkout.session.completed`). V Render logih mora biti odgovor `200`.

### Testno plačilo

1. Dodaj izdelek v košarico → blagajna → plačilo s kartico.
2. Uporabi testno kartico `4242 4242 4242 4242`, datum v prihodnosti, CVC poljuben.
3. Po vrnitvi na stran naročila preveri:
   - [ ] status naročila je “Plačano”
   - [ ] zaloga izdelka se je zmanjšala za kupljeno količino
   - [ ] prejet je bil e-mail “Plačilo potrjeno”
   - [ ] naročilo je vidno v `/admin.html` → Naročila
4. Preizkusi tudi neuspešno plačilo (kartica `4000 0000 0000 0002`) in zaprtje
   Stripe strani — naročilo mora ostati `pending_payment` oziroma preiti v
   `cancelled`, zaloga pa se ne sme spremeniti.

> Preklop na prava plačila: zamenjaj `sk_test_` z `sk_live_`, ustvari nov webhook
> v live načinu in zamenjaj `whsec_`. Nikoli ne vpisuj skrivnega ključa v
> datoteke v repozitoriju.

---

## 3. E-pošta (SMTP)

Primeri:

| Ponudnik | Host | Port | Uporabnik |
| --- | --- | --- | --- |
| Resend | `smtp.resend.com` | `587` | `resend` (geslo = API ključ) |
| Brevo | `smtp-relay.brevo.com` | `587` | tvoj login |
| Mailgun | `smtp.mailgun.org` | `587` | postmaster@... |
| Gmail | `smtp.gmail.com` | `587` | tvoj Gmail + app geslo |

Nastavi `SMTP_HOST`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASSWORD`,
`SMTP_TLS=true`, `STORE_EMAIL`. Po deployu `/api/health` pokaže `"email": true`.

Pošlji testno naročilo (COD) in preveri:

- [ ] e-mail “Naročilo prejeto” z vsemi postavkami in zneskom
- [ ] pri bančnem nakazilu e-mail vsebuje IBAN in sklic
- [ ] e-mail “Naročilo poslano” ob spremembi statusa v skrbništvu

Preveri tudi mapo z neželeno pošto in SPF/DKIM nastavitve domene pri ponudniku.

---

## 4. Sprejemni test po objavi

Zaženi pripravljeni smoke test (samo bere podatke):

```powershell
python server/tools/smoke_test.py https://nakupko.onrender.com `
  --admin-email tvoj@email.si --admin-password "tvoje-geslo"
```

Pričakovano: `Result: all checks passed`. Opozorili sta lahko le manjkajoči
Stripe/SMTP (če ju še nisi nastavil).

Nato ročno preveri:

- [ ] **COD:** oddaj naročilo → admin vidi naročilo → “Označi kot plačano” →
      stranka prejme e-mail; zaloga se zmanjša ob naročilu (ne še enkrat ob plačilu)
- [ ] **Bančno nakazilo:** naročilo vsebuje IBAN; admin označi plačano; zaloga
      ostane enaka kot ob naročilu
- [ ] **Kartica:** testna kartica → webhook → plačano + zaloga + e-mail
- [ ] **Neveljavna koda popusta** vrne jasno napako
- [ ] **Premajhna zaloga** vrne 409 in ne ustvari naročila
- [ ] **Pravne strani** prikazujejo prave podatke podjetja (ne demo)
- [ ] **Piškotki:** obvestilo se pokaže enkrat in se ne vrne po osvežitvi
- [ ] **Mobilni prikaz:** domača stran, katalog, blagajna, skrbništvo
- [ ] **404:** obisk neobstoječe strani pokaže urejeno stran “Napaka 404”
- [ ] **SEO:** `/robots.txt` in `/sitemap.xml` se odpreta in vsebujeta pravo domeno

> Smoke test z zastavico `--order` ustvari pravo naročilo (COD) in zmanjša zalogo.
> Uporabi ga le na testnem okolju ali naročilo po testu prekliči v skrbništvu.

---

## 5. Varnost in vzdrževanje

- [ ] `SECRET_KEY` je generiran (Render `generateValue: true`) in se ne ponastavlja
- [ ] Geslo skrbnika je močno in ni enako demo geslu `12345678`
- [ ] `.env` ni v gitu (`git check-ignore .env`)
- [ ] Vklopljeni backupi baze (Render → Database → Backups)
- [ ] Mesečno preverjanje posodobitev: `pip list --outdated` in posodobitev
      `server/requirements.txt` po testih
- [ ] Stripe e-poštna obvestila o spornih plačilih (chargeback) so vklopljena
- [ ] Dostop do Render računa ima 2FA
- [ ] Ob menjavi domene posodobi `PUBLIC_BASE_URL`, `ALLOWED_ORIGINS`, webhook URL
      in `sitemap.xml` (statična različica za Pages)

Omejevanje zahtevkov (vgrajeno):

- prijava skrbnika: 8 poskusov / 10 minut na IP
- oddaja naročila: 15 / 10 minut na IP
- iskanje naročila: 60 / 10 minut na IP
- ponovni poskus plačila: 10 / 10 minut na IP

---

## 6. Lastna domena (kasneje)

1. V Render → Settings → Custom Domains dodaj domeno in sledi DNS navodilom.
2. Počakaj na izdajo TLS certifikata.
3. Posodobi:
   - `PUBLIC_BASE_URL=https://www.tvoja-domena.si`
   - `ALLOWED_ORIGINS=https://www.tvoja-domena.si`
4. V Stripe ustvari nov webhook z novo domeno in zamenjaj `STRIPE_WEBHOOK_SECRET`.
5. Preveri `https://www.tvoja-domena.si/api/health` in pošlji testno naročilo.

---

## 7. Kaj je kje

| Datoteka | Namen |
| --- | --- |
| `render.yaml` | Render blueprint (web + Postgres) |
| `.env.example` | vse spremenljivke za lokalni razvoj |
| `server/README.md` | arhitektura, API, Stripe/SMTP podrobnosti |
| `server/tools/smoke_test.py` | smoke test žive trgovine |
| `robots.txt`, `sitemap.xml` | statična različica za GitHub Pages demo |
| `404.html` | stran za neobstoječe poti |

---

## 8. Pogoste težave

| Simptom | Vzrok | Rešitev |
| --- | --- | --- |
| `/api/health` vrne 502/503 | deploy še teče ali baza ni dostopna | počakaj, preveri Render log |
| `stripe: false` | `STRIPE_SECRET_KEY` ni nastavljen | vnesi ključ in redeploy |
| `503 Plačila trenutno ni mogoče začeti` | manjka Stripe ključ | nastavi `STRIPE_SECRET_KEY` |
| Webhook vrne 400 | napačen `STRIPE_WEBHOOK_SECRET` ali drug dogodek | kopiraj signing secret znova |
| Webhook vrne 503 | manjka webhook secret | nastavi `STRIPE_WEBHOOK_SECRET` |
| E-pošta ne pride | napačni SMTP podatki / spam | preveri Render log, SPF/DKIM, mapo spam |
| Prijava skrbnika ne dela | napačno geslo ali zaklep po poskusih | počakaj 10 minut; geslo nastavi v Render |
| Piškotek se ne shrani | `PUBLIC_BASE_URL` ni HTTPS | nastavi pravo `https://` vrednost |
| `psycopg` napaka | star `postgres://` URL | koda ga normalizira; preveri `DATABASE_URL` |
| Baza je prazna | prvi zagon še ni končal | počakaj na “Application startup complete” |

---

## 9. Veja `main` (demo) ostane nedotaknjena

- GitHub Pages: <https://nderiim97.github.io/nakupko/> — demo brez strežnika.
- Render: prava trgovina iz veje `real-shop`.
- Ko bo prava trgovina stabilna, lahko vejo `real-shop` združiš v `main`, vendar
  takrat GitHub Pages ne bo več prikazoval dema (ali demo premakni na ločeno
  vejo `gh-pages`). Priporočena pot: obdrži `main` kot demo in `real-shop` kot
  produkcijsko vejo, dokler demo ni več potreben.
