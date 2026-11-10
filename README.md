# Nakupko — demo spletna trgovina

Nakupko je izmišljena slovenska spletna trgovina, narejena kot statična predstavitev
delovanja e-trgovine. Vse blagovne znamke, izdelki, cene, ocene in kontaktni podatki
so izmišljeni. Stran ne uporablja zunanjih pisav, slik, oglaševanja ali zunanjega
sledenja. Statistika obiska je lokalna in ostane v vašem brskalniku.

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

## Skrbništvo (pregled, izdelki, plačila)

Odprite `admin.html` (povezava je tudi v nogi strani) in se prijavite z geslom:

```
12345678
```

Skrbništvo ima tri zavihke:

- **Pregled** — nadzorna plošča z lokalno statistiko obiska (privzeti zavihek),
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
- **Odgovorna postavitev.** Prilagojena je namizju, tablicam in telefonom.
- **Dostopnost.** Uporabljeni so skip-link, fokusni obrisi, oznake obrazcev in `aria` atributi.

## Struktura

```
nakupko/
├─ index.html, category.html, search.html, product.html,
│  cart.html, checkout.html, wishlist.html, order.html, info.html, admin.html
├─ assets/
│  ├─ css/style.css        celoten oblikovni sistem in odzivna postavitev
│  ├─ img/favicon.svg      originalna ikona
│  └─ js/
│     ├─ data.js           kategorije, znamke, izdelki, akcije, kuponi
│     ├─ art.js            originalne SVG ilustracije in ikone
│     ├─ core.js           stanje, košarica, seznam želja, iskanje, lokalna statistika, Stripe
│     ├─ pages.js          krmilniki posameznih strani
│     └─ admin.js          demo prijava, nadzorna plošča, izdelki in Stripe nastavitve
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
