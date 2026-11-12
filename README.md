# Nakupko — demo spletna trgovina

Nakupko je izmišljena slovenska spletna trgovina, narejena kot statična predstavitev
delovanja e-trgovine. Vse blagovne znamke, izdelki, cene, ocene in kontaktni podatki
so izmišljeni. Stran ne uporablja zunanjih pisav, slik, oglaševanja ali zunanjega
sledenja. Statistika obiska je lokalna in ostane v vašem brskalniku.

## Dva načina delovanja

| Način | Kako se zažene | Podatki |
| --- | --- | --- |
| **Demo** | odprite `index.html` ali GitHub Pages | vse v brskalniku (`localStorage`) |
| **Prava trgovina** | FastAPI strežnik (`server/`) | baza, prave zaloge, naročila, Stripe, e-pošta |

Demo ostane uporaben brez strežnika. Za pravo trgovino zaženite:

```powershell
pip install -r server/requirements.txt
copy .env.example .env
python -m uvicorn server.main:app --reload --port 8000
```

Odprite <http://127.0.0.1:8000>. Strežnik samodejno uvozi katalog iz
`assets/js/data.js`, ustvari skrbnika iz `.env` in služi `/config.js`, ki
frontend preklopi v živi način. Podrobna navodila za Stripe, e-pošto, Postgres
in uvajanje so v [`server/README.md`](server/README.md).

V živem načinu velja:

- izdelki in zaloge se berejo iz baze, cene se ob naročilu preverijo na strežniku,
- naročila se shranijo v bazo, stranka prejme povezavo do svojega naročila,
- kartična plačila potekajo prek Stripe Checkout, potrditev pa prek webhooka,
- skrbništvo se prijavi z e-pošto in geslom ter uporablja podpisano sejo,
- e-poštna obvestila se pošljejo prek SMTP (brez SMTP se izpišejo v dnevnik),
- pravne strani (splošni pogoji, zasebnost, podatki o podjetju, odstop od pogodbe)
  se v živi trgovini prikažejo s podatki iz `STORE_*`, ob prvem obisku pa se
  prikaže obvestilo o nujnih piškotkih,
- vsak odgovor ima varnostne glave (CSP, `X-Frame-Options`, `Referrer-Policy` …),
  skrbniški odgovori pa `Cache-Control: no-store`,
- prijava, oddaja naročila in iskanje naročila so omejeni na število zahtevkov
  na IP, da preprečijo zlorabo,
- `/robots.txt` in `/sitemap.xml` se ustvarita iz baze in `PUBLIC_BASE_URL`,
  neobstoječe poti pa prikažejo stran `404.html`.

Celoten potek objave (Render, Stripe, SMTP, sprejemni testi) je v
[`DEPLOY.md`](DEPLOY.md).


## Kako odpreti

Najpreprosteje:

1. Odprite mapo `nakupko`.
2. Dvokliknite `index.html` — stran se odpre v privzetem brskalniku.

Vse strani so povezane relativno, zato delujejo tudi neposredno z diska (`file://`).
Košarica, seznam želja in zadnje naročilo se shranijo v `localStorage` brskalnika.
Če brskalnik lokalno shrambo blokira, demo še vedno deluje, le podatki se ne ohranijo
med osvežitvami.

### Neobvezen lokalni strežnik

Če želite stran odpreti prek `http://`, v mapi `nakupko` zaženite na primer:

```powershell
python -m http.server 8765
```

Nato obiščite <http://127.0.0.1:8765/index.html>.

## Strani

| Datoteka | Namen |
| --- | --- |
| `index.html` | Domača stran: hero, kategorije, izbrani izdelki, akcije, novosti |
| `category.html` | Katalog z filtri, razvrščanjem in nalaganjem več izdelkov |
| `search.html` | Iskanje po izdelkih, znamkah in kategorijah |
| `product.html?id=...` | Podrobnosti izdelka, različice barv, zavihki, podobni izdelki |
| `cart.html` | Košarica, količine, koda za popust in povzetek |
| `checkout.html` | Demo blagajna z obrazcem in povzetkom naročila |
| `wishlist.html` | Seznam želja |
| `admin.html` | Skrbništvo: pregled obiska, urejanje izdelkov in Stripe plačila |
| `order.html` | Potrditev naročila |
| `info.html` | Dostava, vračila, plačilo, pogosta vprašanja, kontakt, pogoji |

## Demo kode za popust

- `NAKUP10` — 10 % popusta na vrednost izdelkov.
- `DOBRODOSLI` — 5 € popusta.

Kodo vnesite v košarici. Uporabi se takoj in jo lahko kadarkoli odstranite.

## Skrbništvo (pregled, naročila, izdelki, plačila)

Odprite `admin.html` (povezava je tudi v nogi strani) in se prijavite z geslom:

```
12345678
```

Skrbništvo ima štiri zavihke:

- **Pregled** — nadzorna plošča z lokalno statistiko obiska (privzeti zavihek),
- **Naročila** — pregled nakupov strank, podatki strank in odobritev pošiljanja,
- **Izdelki** — dodajanje, urejanje in odstranjevanje izdelkov,
- **Plačila** — povezava Stripe Payment Link za kartično plačilo.

### Pregled obiska

Plošča prikaže štiri ključne številke (ogledi strani, obiskovalci, kliki na izdelke,
naročila), graf prometa za zadnjih 7 dni, najbolj klikane izdelke, najbolj obiskane
strani, države obiskovalcev in zadnjo aktivnost.

- Dogodki se beležijo samodejno med brskanjem po trgovini: ogled strani, klik na izdelek,
  ogled izdelka, dodajanje v košarico, iskanje, začetek blagajne in naročilo.
- Vsi dogodki so shranjeni **samo v tem brskalniku** pod ključem `nakupko.analytics.v1`
  (največ 1200 dogodkov). Ni piškotkov, ni zahtevkov na strežnik in ni zunanjega sledenja.
- **Država je približna.** Izpeljana je iz jezika brskalnika in časovnega pasu, ne iz IP
  naslova, zato služi le kot demo prikaz.
- Gumba **Demo podatki** in **Vstavi demo podatke** dodata naključne vzorčne dogodke za
  preizkus plošče. Gumb **Počisti** odstrani vso lokalno statistiko.
- Statistika skrbniških strani se ne beleži, da pregled ne vpliva na številke.

### Naročila strank

V zavihku **Naročila** so prikazani vsi nakupi, opravljeni v tem brskalniku. Za vsako
naročilo vidite:

- številko naročila, datum in status (Novo, Odobreno, Poslano),
- podatke stranke: ime, e-pošto, telefon, naslov dostave in opombo,
- naročene izdelke s količinami, barvami in cenami,
- način dostave, način plačila in celoten znesek.

Potek odobritve:

1. Pri novem naročilu kliknite **Odobri pošiljko** — status se spremeni v **Odobreno**.
2. Ko je paket predan dostavi, kliknite **Označi kot poslano** — status se spremeni v
   **Poslano**.
3. Z gumbom **Razveljavi** lahko status vrnete na **Novo** (uporabno za demo).

Gumb **Demo naročilo** doda vzorčno naročilo z izmišljeno stranko, da si lahko ogledate
potek brez pravega nakupa. Demo naročila so označena z značko `demo`.

> **Demo omejitev:** odobritev je samo lokalna oznaka. Pravega e-poštnega obvestila ali
> povezave z dostavno službo ni, ker stran nima strežnika. Naročila so shranjena pod
> ključem `nakupko.orders.v1` (največ 20) in ostanejo samo v tem brskalniku.

### Urejanje izdelkov

V zavihku **Izdelki** lahko:

- dodate izdelek v izbrano rubriko in določite ceno (ter neobvezno staro ceno),
- izberete blagovno znamko, barvo in ilustracijo (predogled se posodablja sproti),
- urejate in trajno izbrišete svoje izdelke,
- odstranite katerikoli osnovni izdelek iz trgovine in ga pozneje vrnete,
- iščete po vseh izdelkih ter vidite, kateri so vaši in kateri osnovni.

### Stripe plačilo

V zavihku **Plačila** lahko povežete **Stripe Payment Link** brez strežnika:

1. Ustvarite Stripe račun in odprite razdelek **Payment Links**.
2. Ustvarite plačilno povezavo in kopirajte javni naslov, ki se začne z
   `https://buy.stripe.com/`.
3. Povezavo prilepite v polje, vklopite stikalo **Omogoči Stripe plačilo** in shranite.

Ko je povezava veljavna, se na blagajni prikaže dodatna možnost **Stripe**. Po oddaji
naročila se naročilo najprej shrani lokalno, nato pa vas stran preusmeri na Stripe;
povezavi se doda `client_reference_id` s številko naročila.

> **Nikoli ne vnašajte skrivnega ključa `sk_...`.** Skrbniški obrazec zavrne skrivne
> ključe in shrani le javni Payment Link (neobvezno tudi publishable key `pk_...`).
> Vse v brskalniku je javno vidno.

> **Omejitev dema:** stran je statična, zato Payment Link uporablja vnaprej določen
> znesek. Vrednost košarice se ne prenese samodejno; za dinamične zneske bi potrebovali
> strežnik in Stripe API.

Odstranjeni osnovni izdelki se shranijo pod ključem `nakupko.hidden-products.v1`,
novi izdelki pa pod `nakupko.custom-products.v1`. Nastavitve Stripe so pod
`nakupko.stripe.v1`. Vse ostane samo v `localStorage` tega brskalnika, zato spremembe
vidite le na tej napravi.

> **Varnost:** prijava je zgolj demo. Geslo je zapisano v javni datoteki
> `assets/js/admin.js`, podatki pa ostanejo v brskalniku. To ni prava zaščita in ni
> primerno za resnično trgovino.

## Posebnosti

- **Brez zunanjih virov.** Vse slike so originalne vektorske ilustracije v `assets/js/art.js`.
- **Brez korakov gradnje.** Dovolj je brskalnik; ni potreben Node, npm ali strežnik.
- **Plačila so demo.** Brez povezave Stripe se plačilo ne izvede. Z veljavnim Payment
  Linkom se obiskovalec preusmeri na pravo Stripe stran, a z vnaprej določenim zneskom.
- **Lokalna statistika.** Obisk se meri samo v brskalniku, brez piškotkov in brez pošiljanja
  podatkov. Primerna je za demo, ne za pravo analitiko.
- **Naročila so lokalna.** Nakupi se shranijo v istem brskalniku, kjer je bil nakup opravljen,
  zato jih v skrbništvu vidite le na tej napravi. Odobritev pošiljke je demo oznaka brez
  pravega obvestila stranki.
- **Odgovorna postavitev.** Prilagojena je namizju, tablicam in telefonom.
- **Dostopnost.** Uporabljeni so skip-link, fokusni obrisi, oznake obrazcev in `aria` atributi.

## Struktura

```
nakupko/
├─ index.html, category.html, search.html, product.html,
│  cart.html, checkout.html, wishlist.html, order.html, info.html, admin.html
├─ 404.html                urejena stran za neobstoječe poti (tudi na Pages)
├─ robots.txt, sitemap.xml statična različica za demo na GitHub Pages
├─ config.js               demo način za Pages; strežnik vrne svoj /config.js
├─ assets/
│  ├─ css/style.css        celoten oblikovni sistem in odzivna postavitev
│  ├─ img/favicon.svg      originalna ikona
│  └─ js/
│     ├─ data.js           kategorije, znamke, izdelki, akcije, kuponi
│     ├─ art.js            originalne SVG ilustracije in ikone
│     ├─ core.js           stanje, košarica, seznam želja, iskanje, lokalna statistika, Stripe
│     ├─ pages.js          krmilniki posameznih strani
│     └─ admin.js          demo prijava, nadzorna plošča, naročila, izdelki in Stripe
├─ server/                 FastAPI strežnik, baza, Stripe, e-pošta, testi
├─ DEPLOY.md               objava na Render, Stripe in SMTP korak za korakom
├─ render.yaml             Render blueprint (web + Postgres)
└─ README.md
```

## Ponastavitev demo podatkov

V brskalniku počistite podatke spletnega mesta ali v konzoli za razvijalce odstranite
ključe, ki se začnejo z `nakupko.`:

```js
Object.keys(localStorage)
  .filter((key) => key.startsWith("nakupko."))
  .forEach((key) => localStorage.removeItem(key));
```

### Ključi v `localStorage`

| Ključ | Vsebina |
| --- | --- |
| `nakupko.cart.v1` | košarica |
| `nakupko.wishlist.v1` | seznam želja |
| `nakupko.coupon.v1` | aktivna koda za popust |
| `nakupko.recent.v1` | nedavno ogledani izdelki |
| `nakupko.orders.v1` | shranjena naročila |
| `nakupko.last-order.v1` | zadnje naročilo |
| `nakupko.custom-products.v1` | vaši dodani izdelki |
| `nakupko.hidden-products.v1` | odstranjeni osnovni izdelki |
| `nakupko.analytics.v1` | lokalni dogodki obiska (največ 1200) |
| `nakupko.analytics.visitor.v1` | anonimni ID obiskovalca v tem brskalniku |
| `nakupko.stripe.v1` | Stripe nastavitve (Payment Link, neobvezno publishable key) |

## Opomba

Projekt je namenjen prikazu in učenju. Za resnično trgovino bi bilo treba dodati
strežniško logiko, pravega ponudnika plačil, davčne podatke, upravljanje zalog in
skladnost z veljavno zakonodajo.
