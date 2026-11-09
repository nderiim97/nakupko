/* Nakupko demo catalog — original names, copy and prices.
   Everything is fictional and intended for local demonstration only. */
window.NK = window.NK || {};

window.NK.categories = [
  {
    slug: "bela-tehnika",
    name: "Bela tehnika",
    icon: "washer",
    tint: "#dff3ee",
    blurb: "Pralni in pomivalni stroji, hladilniki ter mikrovalovne pečice."
  },
  {
    slug: "racunalnistvo",
    name: "Računalništvo",
    icon: "laptop",
    tint: "#e6edff",
    blurb: "Prenosniki, monitorji in dodatki za delo ter prosti čas."
  },
  {
    slug: "tv-avdio",
    name: "TV, avdio in video",
    icon: "tv",
    tint: "#ffe9e2",
    blurb: "Televizorji, zvočniki in oprema za kino doma."
  },
  {
    slug: "mali-aparati",
    name: "Mali gospodinjski aparati",
    icon: "espresso",
    tint: "#fff1d6",
    blurb: "Espresso aparati, mešalniki in pripomočki za vsak dan."
  },
  {
    slug: "dom",
    name: "Vse za dom",
    icon: "lamp",
    tint: "#f0e8ff",
    blurb: "Svetila, preproge in pametne rešitve za urejen dom."
  },
  {
    slug: "sport",
    name: "Šport in prosti čas",
    icon: "yoga",
    tint: "#e3f7e8",
    blurb: "Podloge, termovke in oprema za aktiven dan."
  },
  {
    slug: "zdravje",
    name: "Zdravje in drogerija",
    icon: "diffuser",
    tint: "#ffe8f0",
    blurb: "Aroma difuzorji in nežna nega za vsak dan."
  },
  {
    slug: "igrace",
    name: "Igrače in otroci",
    icon: "blocks",
    tint: "#e8f4ff",
    blurb: "Lesene igrače in mehki prijatelji za male raziskovalce."
  }
];

window.NK.brands = [
  "Aria",
  "Nordika",
  "Lumen",
  "Forma",
  "Kavo",
  "Vita",
  "Pika",
  "Mimo",
  "Terra",
  "Nook",
  "Bela",
  "Studio"
];

window.NK.products = [
  {
    id: "pralni-stroj-aria-wash-8",
    name: "Pralni stroj Aria Wash 8 kg",
    brand: "Aria",
    category: "bela-tehnika",
    price: 429.9,
    oldPrice: 529.9,
    rating: 4.8,
    reviews: 214,
    art: "washer",
    palette: ["#e8f6f1", "#0f766e", "#123c36"],
    badge: "Akcija",
    colors: [
      { name: "Bela", hex: "#f5f3ee" },
      { name: "Grafitna", hex: "#4b5563" }
    ],
    description:
      "Tiha in varčna pralnica za vsakodnevno uporabo. Programi se prilagajajo vrsti tkanine, para pa poskrbi, da so oblačila mehka in manj zmečkana.",
    features: [
      "14 programov, vključno s hitrim 15-minutnim pranjem",
      "Para za manj gub in lažje likanje",
      "Zakasnjen začetek do 24 ur",
      "Zaščita pred iztekanjem vode"
    ],
    specs: {
      "Energijski razred": "A",
      "Kapaciteta": "8 kg",
      "Hitrost ožemanja": "1400 vrt/min",
      "Dimenzije": "60 × 85 × 55 cm",
      "Glasnost": "52 dB",
      "Garancija": "5 let"
    },
    stock: true,
    tags: ["sale", "featured"],
    sku: "NK-1001",
    added: 1
  },
  {
    id: "hladilnik-nordika-cool-320",
    name: "Hladilnik Nordika Cool 320 l",
    brand: "Nordika",
    category: "bela-tehnika",
    price: 649,
    oldPrice: 749,
    rating: 4.7,
    reviews: 96,
    art: "fridge",
    palette: ["#eef3f7", "#3b6ea8", "#1f3b5c"],
    badge: "Akcija",
    colors: [
      { name: "Bela", hex: "#f5f3ee" },
      { name: "Inox", hex: "#9aa4ad" }
    ],
    description:
      "Prostoren hladilnik z ločenim zamrzovalnikom in pametnim nadzorom vlažnosti. Predali so zasnovani tako, da ostanejo živila sveža dlje.",
    features: [
      "No Frost – brez nabiranja ledu",
      "Predal FreshZone za sadje in zelenjavo",
      "LED osvetlitev in elektronski nadzor",
      "Obrnljiva vrata"
    ],
    specs: {
      "Skupna prostornina": "320 l",
      "Hladilni del": "230 l",
      "Zamrzovalni del": "90 l",
      "Energijski razred": "E",
      "Dimenzije": "60 × 186 × 65 cm",
      "Garancija": "3 leta"
    },
    stock: true,
    tags: ["sale", "featured"],
    sku: "NK-1002",
    added: 2
  },
  {
    id: "pomivalni-stroj-forma-clean-13",
    name: "Pomivalni stroj Forma Clean 13 pogrinjkov",
    brand: "Forma",
    category: "bela-tehnika",
    price: 499,
    rating: 4.6,
    reviews: 87,
    art: "dishwasher",
    palette: ["#eaf4f6", "#277c8c", "#164c57"],
    badge: "Priporočeno",
    colors: [{ name: "Bela", hex: "#f5f3ee" }],
    description:
      "Pomivalni stroj s tretjo košaro za pribor in programom za občutljive kozarce. Sušenje s toploto poskrbi za bleščeče posodo brez madežev.",
    features: [
      "13 pogrinjkov v enem ciklu",
      "Tretja košara za pribor",
      "Program Eco 50 °C",
      "Polovično polnjenje"
    ],
    specs: {
      "Kapaciteta": "13 pogrinjkov",
      "Energijski razred": "C",
      "Poraba vode": "9,5 l/cikel",
      "Glasnost": "44 dB",
      "Dimenzije": "60 × 85 × 60 cm",
      "Garancija": "2 leti"
    },
    stock: true,
    tags: ["featured"],
    sku: "NK-1003",
    added: 3
  },
  {
    id: "prenosnik-lumen-air-14",
    name: "Prenosnik Lumen Air 14",
    brand: "Lumen",
    category: "racunalnistvo",
    price: 899,
    oldPrice: 1049,
    rating: 4.8,
    reviews: 143,
    art: "laptop",
    palette: ["#e8edff", "#4f5bd5", "#252a66"],
    badge: "Akcija",
    colors: [
      { name: "Srebrna", hex: "#c9ced6" },
      { name: "Temna", hex: "#343a40" }
    ],
    description:
      "Lahek prenosnik z ostrih 14-palčnim zaslonom in celodnevnim delovanjem baterije. Primeren za delo, študij in vsakodnevno multitasking.",
    features: [
      "14-palčni zaslon Full HD IPS",
      "16 GB pomnilnika in 512 GB SSD",
      "Baterija do 12 ur",
      "Tiho hlajenje in hitro polnjenje"
    ],
    specs: {
      "Procesor": "8-jedrni Lumen M2",
      "Pomnilnik": "16 GB",
      "Shramba": "512 GB NVMe SSD",
      "Zaslon": "14\" Full HD IPS",
      "Teža": "1,35 kg",
      "Garancija": "2 leti"
    },
    stock: true,
    tags: ["sale", "featured", "new"],
    sku: "NK-2001",
    added: 4
  },
  {
    id: "monitor-lumen-view-27",
    name: "Monitor Lumen View 27\" QHD",
    brand: "Lumen",
    category: "racunalnistvo",
    price: 329,
    rating: 4.7,
    reviews: 76,
    art: "monitor",
    palette: ["#e9efff", "#3f6ad8", "#1d3470"],
    badge: "Priporočeno",
    colors: [{ name: "Črna", hex: "#22262b" }],
    description:
      "Oster QHD zaslon z ozkimi robovi in nastavljivim stojalom. 75 Hz osveževanje in nizka zakasnitev sta dobra izbira za delo in prosti čas.",
    features: [
      "27-palčni QHD zaslon",
      "75 Hz osveževanje",
      "HDMI, DisplayPort in USB-C",
      "Nastavljiva višina in nagib"
    ],
    specs: {
      "Diagonala": "27\"",
      "Ločljivost": "2560 × 1440",
      "Osveževanje": "75 Hz",
      "Povezave": "HDMI, DP, USB-C",
      "Garancija": "3 leta"
    },
    stock: true,
    tags: ["featured"],
    sku: "NK-2002",
    added: 5
  },
  {
    id: "slusalke-pika-wave",
    name: "Brezžične slušalke Pika Wave",
    brand: "Pika",
    category: "racunalnistvo",
    price: 89.9,
    oldPrice: 119.9,
    rating: 4.5,
    reviews: 302,
    art: "headphones",
    palette: ["#f0e9ff", "#7c4dff", "#3b1f7a"],
    badge: "Akcija",
    colors: [
      { name: "Mint", hex: "#9fe3d2" },
      { name: "Črna", hex: "#2c2f33" },
      { name: "Pesek", hex: "#e8d5bf" }
    ],
    description:
      "Mehke blazinice in čist zvok za glasbo, klice in igre. Aktivno dušenje hrupa poskrbi, da vas okolica ne moti.",
    features: [
      "Aktivno dušenje hrupa",
      "Do 30 ur delovanja s polnilno torbico",
      "Bluetooth 5.3 in večtočkovna povezava",
      "Vgrajen mikrofon za klice"
    ],
    specs: {
      "Tip": "Naglave slušalke",
      "Baterija": "30 h",
      "Povezava": "Bluetooth 5.3",
      "Teža": "245 g",
      "Garancija": "2 leti"
    },
    stock: true,
    tags: ["sale", "new"],
    sku: "NK-2003",
    added: 6
  },
  {
    id: "televizor-lumen-vision-55",
    name: "Televizor Lumen Vision 55\" 4K",
    brand: "Lumen",
    category: "tv-avdio",
    price: 549,
    oldPrice: 649,
    rating: 4.6,
    reviews: 118,
    art: "tv",
    palette: ["#e9f1f6", "#2d7ea1", "#123b4e"],
    badge: "Akcija",
    colors: [{ name: "Črna", hex: "#202327" }],
    description:
      "Slikovno bogat 4K televizor z gladkim gibanjem in podporo za HDR. Pametni vmesnik združuje aplikacije, kanale in pretakanje na enem mestu.",
    features: [
      "4K UHD z HDR10+",
      "55-palčni zaslon z ozkim robom",
      "Pametni vmesnik in glasovno iskanje",
      "Trije HDMI vhodi in Wi-Fi 6"
    ],
    specs: {
      "Diagonala": "55\"",
      "Ločljivost": "3840 × 2160",
      "HDR": "HDR10+",
      "Osveževanje": "60 Hz",
      "Garancija": "2 leti"
    },
    stock: true,
    tags: ["sale", "featured"],
    sku: "NK-3001",
    added: 7
  },
  {
    id: "zvocnik-mimo-room",
    name: "Zvočnik Mimo Room",
    brand: "Mimo",
    category: "tv-avdio",
    price: 129,
    rating: 4.4,
    reviews: 64,
    art: "speaker",
    palette: ["#fff0e6", "#d97706", "#7c3d0a"],
    badge: "Novo",
    colors: [
      { name: "Pesek", hex: "#e6d3bd" },
      { name: "Grafit", hex: "#4a4f55" }
    ],
    description:
      "Sobni zvočnik z polnim zvokom in preprostim upravljanjem. Povežite ga s telefonom ali računalnikom ter uživajte v glasbi brez zapletov.",
    features: [
      "360-stopinjski zvok",
      "Bluetooth in 3,5 mm vhod",
      "Do 16 ur delovanja",
      "Vgrajen mikrofon za klice"
    ],
    specs: {
      "Moč": "2 × 15 W",
      "Baterija": "16 h",
      "Povezave": "Bluetooth, AUX",
      "Teža": "1,1 kg",
      "Garancija": "2 leti"
    },
    stock: true,
    tags: ["new"],
    sku: "NK-3002",
    added: 8
  },
  {
    id: "espresso-kavo-press",
    name: "Espresso aparat Kavo Press",
    brand: "Kavo",
    category: "mali-aparati",
    price: 279,
    oldPrice: 349,
    rating: 4.9,
    reviews: 188,
    art: "espresso",
    palette: ["#fff1e2", "#b45309", "#6b2f06"],
    badge: "Akcija",
    colors: [
      { name: "Kremna", hex: "#efe3d1" },
      { name: "Črna", hex: "#2b2b2b" }
    ],
    description:
      "Kompakten espresso aparat z ročno ročico in močno paro za kremasto mleko. Doma pripravite kavo, ki je po okusu blizu vašemu najljubšemu lokalu.",
    features: [
      "15 barov tlaka",
      "Ročna ročica za eno ali dve kavi",
      "Para za penjenje mleka",
      "Odstranljiv rezervoar za vodo"
    ],
    specs: {
      "Tlak": "15 barov",
      "Rezervoar": "1,2 l",
      "Moč": "1350 W",
      "Dimenzije": "30 × 32 × 28 cm",
      "Garancija": "2 leti"
    },
    stock: true,
    tags: ["sale", "featured"],
    sku: "NK-4001",
    added: 9
  },
  {
    id: "mesalnik-vita-mix",
    name: "Mešalnik Vita Mix 1,5 l",
    brand: "Vita",
    category: "mali-aparati",
    price: 119,
    rating: 4.5,
    reviews: 91,
    art: "blender",
    palette: ["#eafaf0", "#15803d", "#0b4a24"],
    badge: "Priporočeno",
    colors: [{ name: "Bela", hex: "#f5f3ee" }],
    description:
      "Zmogljiv mešalnik za smutije, juhe in testo. Šest rezil in več hitrosti poskrbi za gladko teksturo brez grudic.",
    features: [
      "1000 W motor",
      "Stranska posoda 1,5 l",
      "6 hitrosti in pulz",
      "Enostavno čiščenje"
    ],
    specs: {
      "Moč": "1000 W",
      "Prostornina": "1,5 l",
      "Hitrosti": "6 + pulz",
      "Material": "Tritan",
      "Garancija": "2 leti"
    },
    stock: true,
    tags: ["featured"],
    sku: "NK-4002",
    added: 10
  },
  {
    id: "kuhalnik-vita-rapid",
    name: "Kuhalnik vode Vita Rapid",
    brand: "Vita",
    category: "mali-aparati",
    price: 49.9,
    rating: 4.6,
    reviews: 205,
    art: "kettle",
    palette: ["#eef8ff", "#0284c7", "#0b4a6f"],
    badge: "Novo",
    colors: [
      { name: "Bela", hex: "#f5f3ee" },
      { name: "Mint", hex: "#a7e0d0" }
    ],
    description:
      "Hitro vretje in natančen nadzor temperature za čaj, kavo in instant jedi. Brezžična podstavka omogoča preprosto serviranje.",
    features: [
      "1,7 l prostornine",
      "Nadzor temperature v 5 stopnjah",
      "Dvojna zaščita pred vretjem brez vode",
      "Brezžična podstavek"
    ],
    specs: {
      "Prostornina": "1,7 l",
      "Moč": "2200 W",
      "Material": "Nerjaveče jeklo",
      "Garancija": "2 leti"
    },
    stock: true,
    tags: ["new"],
    sku: "NK-4003",
    added: 11
  },
  {
    id: "svetilka-lumen-arc",
    name: "Namizna svetilka Lumen Arc",
    brand: "Lumen",
    category: "dom",
    price: 79,
    rating: 4.7,
    reviews: 58,
    art: "lamp",
    palette: ["#fff8e6", "#eab308", "#7c5a05"],
    badge: "Novo",
    colors: [
      { name: "Pesek", hex: "#e8d8c3" },
      { name: "Črna", hex: "#2f3237" }
    ],
    description:
      "Mehka, usmerjena svetloba za delovno mizo ali nočno omarico. Svetlost in barvna temperatura se prilagajata času dneva.",
    features: [
      "Nastavljiva svetlost in barvna temperatura",
      "USB-C polnjenje",
      "Spomin zadnje nastavitve",
      "Kovinsko ohišje"
    ],
    specs: {
      "Moč": "8 W",
      "Barvna temperatura": "2700–6500 K",
      "Višina": "42 cm",
      "Garancija": "2 leti"
    },
    stock: true,
    tags: ["new", "featured"],
    sku: "NK-5001",
    added: 12
  },
  {
    id: "preproga-terra-soft",
    name: "Preproga Terra Soft 160 × 230 cm",
    brand: "Terra",
    category: "dom",
    price: 149,
    oldPrice: 189,
    rating: 4.4,
    reviews: 37,
    art: "rug",
    palette: ["#f7efe7", "#b45309", "#6b2f06"],
    badge: "Akcija",
    colors: [
      { name: "Pesek", hex: "#e5d2bc" },
      { name: "Terakota", hex: "#c97b5a" }
    ],
    description:
      "Mehka preproga z mirnim vzorcem, ki poveže dnevno sobo. Gosta vlakna so prijetna na dotik in enostavna za čiščenje.",
    features: [
      "160 × 230 cm",
      "Mehka, gosta vlakna",
      "Proti drsenju",
      "Primerna za tla z ogrevanjem"
    ],
    specs: {
      "Dimenzije": "160 × 230 cm",
      "Material": "100 % poliester",
      "Debelina": "12 mm",
      "Nega": "Ročno čiščenje",
      "Garancija": "1 leto"
    },
    stock: true,
    tags: ["sale"],
    sku: "NK-5002",
    added: 13
  },
  {
    id: "organizator-nook-stack",
    name: "Organizator Nook Stack",
    brand: "Nook",
    category: "dom",
    price: 39.9,
    rating: 4.3,
    reviews: 44,
    art: "organizer",
    palette: ["#f2f0ff", "#6366f1", "#2f2f7a"],
    badge: "Novo",
    colors: [
      { name: "Naravni les", hex: "#d9b98f" },
      { name: "Bela", hex: "#f5f3ee" }
    ],
    description:
      "Modularne škatle za urejanje predalov, polic in delovne mize. Sestavite jih po svoje in pospravite vse drobnarije na eno mesto.",
    features: [
      "Set treh škatel",
      "Zložljiva zasnova",
      "Mehko dno brez prask",
      "Primerno za predale in police"
    ],
    specs: {
      "Material": "Bambus in tekstil",
      "Velikost": "30 × 20 × 12 cm",
      "Set": "3 kosi",
      "Garancija": "1 leto"
    },
    stock: true,
    tags: ["new"],
    sku: "NK-5003",
    added: 14
  },
  {
    id: "joga-podloga-terra-flow",
    name: "Joga podloga Terra Flow",
    brand: "Terra",
    category: "sport",
    price: 59.9,
    rating: 4.8,
    reviews: 122,
    art: "yoga",
    palette: ["#e9f9ee", "#16a34a", "#0a4a22"],
    badge: "Priporočeno",
    colors: [
      { name: "Mint", hex: "#9fe3d2" },
      { name: "Lila", hex: "#c4b5fd" },
      { name: "Siva", hex: "#9ca3af" }
    ],
    description:
      "Podloga z oprijemljivo površino in mehko podlago za sklepe. Lahka je za prenašanje in ostane na mestu tudi med zahtevnejšimi položaji.",
    features: [
      "6 mm debeline",
      "Protizdrsna površina",
      "Trakovi za prenašanje",
      "Brez vonja po gumi"
    ],
    specs: {
      "Dimenzije": "183 × 61 cm",
      "Debelina": "6 mm",
      "Material": "TPE",
      "Teža": "1,1 kg",
      "Garancija": "1 leto"
    },
    stock: true,
    tags: ["featured"],
    sku: "NK-6001",
    added: 15
  },
  {
    id: "termovka-mimo-trail",
    name: "Termovka Mimo Trail 750 ml",
    brand: "Mimo",
    category: "sport",
    price: 34.9,
    rating: 4.6,
    reviews: 83,
    art: "thermos",
    palette: ["#e8f7ff", "#0891b2", "#0a4a5e"],
    badge: "Novo",
    colors: [
      { name: "Mint", hex: "#9fe3d2" },
      { name: "Pesek", hex: "#e8d5bf" },
      { name: "Črna", hex: "#2c2f33" }
    ],
    description:
      "Dvostenska termovka ohrani pijačo hladno ali toplo več ur. Tesnilo je zanesljivo tudi v nahrbtniku, odpiranje pa je enostavno z eno roko.",
    features: [
      "Ohrani temperaturo do 12 ur",
      "Nerjaveče jeklo",
      "Tesnjen pokrov",
      "Primerna za pomivalni stroj"
    ],
    specs: {
      "Prostornina": "750 ml",
      "Material": "Nerjaveče jeklo",
      "Teža": "340 g",
      "Garancija": "2 leti"
    },
    stock: true,
    tags: ["new"],
    sku: "NK-6002",
    added: 16
  },
  {
    id: "difuzor-vita-calm",
    name: "Aroma difuzor Vita Calm",
    brand: "Vita",
    category: "zdravje",
    price: 44.9,
    oldPrice: 54.9,
    rating: 4.5,
    reviews: 69,
    art: "diffuser",
    palette: ["#fff0f6", "#db2777", "#7a1745"],
    badge: "Akcija",
    colors: [
      { name: "Bela", hex: "#f5f3ee" },
      { name: "Roza", hex: "#f3c6d8" }
    ],
    description:
      "Tih difuzor z mehko svetlobo in časovnikom. Idealen za večerno sprostitev ali osvežitev prostora med delom.",
    features: [
      "Ultrazvočno razprševanje",
      "7 barv mehke svetlobe",
      "Časovnik 1/3/6 ur",
      "Samodejni izklop"
    ],
    specs: {
      "Prostornina": "300 ml",
      "Pokritost": "do 30 m²",
      "Glasnost": "< 30 dB",
      "Garancija": "2 leti"
    },
    stock: true,
    tags: ["sale"],
    sku: "NK-7001",
    added: 17
  },
  {
    id: "nega-vita-ritual",
    name: "Set za nego kože Vita Ritual",
    brand: "Vita",
    category: "zdravje",
    price: 69,
    rating: 4.7,
    reviews: 51,
    art: "skincare",
    palette: ["#fff4ec", "#ea580c", "#7c2d12"],
    badge: "Priporočeno",
    colors: [{ name: "Set", hex: "#f1d6c6" }],
    description:
      "Preprost ritual za vsak dan: nežno čiščenje, vlaženje in zaščita. Set vsebuje tri izdelke z blagimi, koži prijaznimi sestavinami.",
    features: [
      "Čistilna pena 150 ml",
      "Vlažilna krema 50 ml",
      "Nočna maska 30 ml",
      "Brez parfuma"
    ],
    specs: {
      "Tip kože": "Vse vrste",
      "Vsebina": "3 izdelki",
      "Področje": "Obraz",
      "Garancija": "24 mesecev"
    },
    stock: true,
    tags: ["featured"],
    sku: "NK-7002",
    added: 18
  },
  {
    id: "kocke-pika-wood",
    name: "Lesene kocke Pika Wood",
    brand: "Pika",
    category: "igrace",
    price: 29.9,
    rating: 4.9,
    reviews: 74,
    art: "blocks",
    palette: ["#fff7e8", "#d97706", "#7c3d0a"],
    badge: "Novo",
    colors: [{ name: "Naravni les", hex: "#d9b98f" }],
    description:
      "Barvne lesene kocke za prve gradnje in učenje oblik. Gladki robovi in trdna izdelava so prijazni do malih rok.",
    features: [
      "24 kock v setu",
      "Certificiran les",
      "Vodoodporna barva",
      "Primerno za otroke od 2. leta"
    ],
    specs: {
      "Kosi": "24",
      "Material": "Bukov les",
      "Starost": "2+",
      "Velikost kocke": "4 cm",
      "Garancija": "1 leto"
    },
    stock: true,
    tags: ["new", "featured"],
    sku: "NK-8001",
    added: 19
  },
  {
    id: "medvedek-nook-hugo",
    name: "Plišasti medvedek Nook Hugo",
    brand: "Nook",
    category: "igrace",
    price: 24.9,
    rating: 4.8,
    reviews: 112,
    art: "bear",
    palette: ["#fff4e8", "#b45309", "#6b2f06"],
    badge: "Novo",
    colors: [
      { name: "Karamela", hex: "#c99a6b" },
      { name: "Siva", hex: "#a8a29e" }
    ],
    description:
      "Mehek medvedek za objeme in igro. Tkanina je prijetna na dotik, šivi pa so narejeni tako, da zdržijo vsakodnevno druženje.",
    features: [
      "Mehka, pralna tkanina",
      "Varen za otroke od 0. leta",
      "Višina 32 cm",
      "Ročno šivani detajli"
    ],
    specs: {
      "Višina": "32 cm",
      "Material": "Poliester",
      "Starost": "0+",
      "Nega": "Pranje na 30 °C",
      "Garancija": "1 leto"
    },
    stock: true,
    tags: ["new"],
    sku: "NK-8002",
    added: 20
  }
];

window.NK.promos = [
  {
    eyebrow: "Jesen 2026",
    title: "Toplina, ki se začne doma.",
    text: "Mehka svetloba, naravni materiali in mirni odtenki za dneve, ko ostanete doma.",
    cta: "Razišči dom",
    href: "category.html?cat=dom",
    art: "lamp",
    palette: ["#e6f6ef", "#0f766e", "#123c36"],
    tone: "mint"
  },
  {
    eyebrow: "Tehnologija za vsak dan",
    title: "Sledite svojemu tempu.",
    text: "Prenosniki, monitorji in avdio oprema z do 20 % popusta v jesenski izbiri.",
    cta: "Poglej računalništvo",
    href: "category.html?cat=racunalnistvo",
    art: "laptop",
    palette: ["#e9edff", "#4f5bd5", "#252a66"],
    tone: "blue"
  },
  {
    eyebrow: "Mali aparati, velika razlika",
    title: "Dober dan se začne z kavo.",
    text: "Espresso aparati, mešalniki in kuhalniki za majhne vsakodnevne užitke.",
    cta: "Odkrij male aparate",
    href: "category.html?cat=mali-aparati",
    art: "espresso",
    palette: ["#fff0e1", "#b45309", "#6b2f06"],
    tone: "amber"
  }
];

window.NK.coupons = {
  NAKUP10: { type: "percent", value: 10, label: "10 % popusta" },
  DOBRODOSLI: { type: "fixed", value: 5, label: "5 € popusta" }
};
