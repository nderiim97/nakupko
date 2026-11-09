# Nakupko — demo spletna trgovina

Nakupko je izmišljena slovenska spletna trgovina, narejena kot statična predstavitev
delovanja e-trgovine. Vse blagovne znamke, izdelki, cene, ocene in kontaktni podatki
so izmišljeni. Stran ne uporablja zunanjih pisav, slik, oglaševanja ali sledenja.

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
| `admin.html` | Skrbništvo: prijava, dodajanje in urejanje izdelkov |
| `order.html` | Potrditev naročila |
| `info.html` | Dostava, vračila, plačilo, pogosta vprašanja, kontakt, pogoji |

## Demo kode za popust

- `NAKUP10` — 10 % popusta na vrednost izdelkov.
- `DOBRODOSLI` — 5 € popusta.

Kodo vnesite v košarici. Uporabi se takoj in jo lahko kadarkoli odstranite.

## Skrbništvo (dodajanje izdelkov)

Odprite `admin.html` (povezava je tudi v nogi strani) in se prijavite z geslom:

```
12345678
```

Po prijavi lahko:

- dodate izdelek v izbrano rubriko in določite ceno (ter neobvezno staro ceno),
- izberete blagovno znamko, barvo in ilustracijo (predogled se posodablja sproti),
- urejate in brišete svoje izdelke.

Novi izdelki se takoj prikažejo na domači strani, v izbrani rubriki, iskanju in na
strani izdelka. Shranjeni so v `localStorage` pod ključem `nakupko.custom-products.v1`,
zato jih vidi samo ta brskalnik in samo na tej napravi.

> **Varnost:** prijava je zgolj demo. Geslo je zapisano v javni datoteki
> `assets/js/admin.js`, podatki pa ostanejo v brskalniku. To ni prava zaščita in ni
> primerno za resnično trgovino.

## Posebnosti

- **Brez zunanjih virov.** Vse slike so originalne vektorske ilustracije v `assets/js/art.js`.
- **Brez korakov gradnje.** Dovolj je brskalnik; ni potreben Node, npm ali strežnik.
- **Brez pravih plačil.** Obrazec na blagajni ne pošilja podatkov in ne izvede plačila.
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
│     ├─ core.js           stanje, košarica, seznam želja, iskanje, skupna postavitev
│     ├─ pages.js          krmilniki posameznih strani
│     └─ admin.js          demo prijava in urejanje lastnih izdelkov
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

## Opomba

Projekt je namenjen prikazu in učenju. Za resnično trgovino bi bilo treba dodati
strežniško logiko, pravega ponudnika plačil, davčne podatke, upravljanje zalog in
skladnost z veljavno zakonodajo.
