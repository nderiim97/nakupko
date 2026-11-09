/* Original SVG illustrations and line icons. No external images or fonts. */
(function () {
  let uid = 0;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function frame(label, palette, inner) {
    const bg = palette[0] || "#eef4f2";
    const accent = palette[1] || "#0f766e";
    const dark = palette[2] || "#123c36";
    const id = "nkg" + ++uid;
    return (
      '<svg class="art-svg" viewBox="0 0 400 300" role="img" aria-label="' +
      esc(label) +
      '" xmlns="http://www.w3.org/2000/svg">' +
      "<defs>" +
      '<linearGradient id="' +
      id +
      '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' +
      bg +
      '"/>' +
      '<stop offset="1" stop-color="' +
      accent +
      '" stop-opacity=".16"/>' +
      "</linearGradient>" +
      "</defs>" +
      '<rect width="400" height="300" fill="url(#' +
      id +
      ')"/>' +
      '<circle cx="330" cy="52" r="88" fill="' +
      accent +
      '" opacity=".13"/>' +
      '<circle cx="54" cy="258" r="58" fill="' +
      dark +
      '" opacity=".06"/>' +
      inner +
      "</svg>"
    );
  }

  function product(kind, palette, label) {
    const p = palette || ["#eef4f2", "#0f766e", "#123c36"];
    const bg = p[0];
    const a = p[1];
    const d = p[2];
    const white = "#ffffff";
    let inner = "";

    switch (kind) {
      case "washer":
        inner =
          '<rect x="126" y="44" width="148" height="212" rx="16" fill="' + white + '" stroke="' + d + '" stroke-opacity=".14" stroke-width="2"/>' +
          '<rect x="126" y="44" width="148" height="46" rx="16" fill="' + d + '" opacity=".07"/>' +
          '<rect x="144" y="62" width="48" height="8" rx="4" fill="' + a + '" opacity=".65"/>' +
          '<circle cx="252" cy="66" r="6" fill="' + a + '"/>' +
          '<rect x="238" y="58" width="26" height="16" rx="4" fill="' + d + '" opacity=".12"/>' +
          '<circle cx="200" cy="176" r="58" fill="' + bg + '" stroke="' + a + '" stroke-width="7"/>' +
          '<circle cx="200" cy="176" r="40" fill="' + a + '" opacity=".14"/>' +
          '<circle cx="200" cy="176" r="22" fill="' + a + '" opacity=".26"/>' +
          '<path d="M200 154 a22 22 0 0 1 0 44" fill="none" stroke="' + white + '" stroke-width="4" opacity=".7"/>' +
          '<rect x="140" y="246" width="120" height="6" rx="3" fill="' + d + '" opacity=".12"/>';
        break;

      case "fridge":
        inner =
          '<rect x="138" y="36" width="124" height="228" rx="14" fill="' + white + '" stroke="' + d + '" stroke-opacity=".14" stroke-width="2"/>' +
          '<line x1="138" y1="112" x2="262" y2="112" stroke="' + d + '" stroke-opacity=".18" stroke-width="3"/>' +
          '<rect x="152" y="62" width="6" height="32" rx="3" fill="' + a + '"/>' +
          '<rect x="152" y="130" width="6" height="56" rx="3" fill="' + a + '"/>' +
          '<circle cx="234" cy="86" r="4" fill="' + a + '" opacity=".55"/>' +
          '<rect x="150" y="210" width="100" height="4" rx="2" fill="' + d + '" opacity=".08"/>' +
          '<rect x="126" y="264" width="148" height="8" rx="4" fill="' + d + '" opacity=".12"/>';
        break;

      case "dishwasher":
        inner =
          '<rect x="82" y="82" width="236" height="154" rx="14" fill="' + white + '" stroke="' + d + '" stroke-opacity=".14" stroke-width="2"/>' +
          '<rect x="82" y="82" width="236" height="44" rx="14" fill="' + d + '" opacity=".07"/>' +
          '<rect x="104" y="99" width="58" height="8" rx="4" fill="' + a + '" opacity=".7"/>' +
          '<circle cx="286" cy="104" r="6" fill="' + a + '"/>' +
          '<circle cx="268" cy="104" r="6" fill="' + d + '" opacity=".2"/>' +
          '<rect x="104" y="142" width="192" height="70" rx="8" fill="' + bg + '" stroke="' + a + '" stroke-opacity=".35"/>' +
          '<line x1="104" y1="164" x2="296" y2="164" stroke="' + a + '" stroke-opacity=".35" stroke-width="3"/>' +
          '<line x1="104" y1="186" x2="296" y2="186" stroke="' + a + '" stroke-opacity=".35" stroke-width="3"/>' +
          '<rect x="104" y="150" width="52" height="6" rx="3" fill="' + a + '" opacity=".3"/>' +
          '<rect x="112" y="244" width="176" height="7" rx="3.5" fill="' + d + '" opacity=".12"/>';
        break;

      case "laptop":
        inner =
          '<rect x="108" y="48" width="184" height="126" rx="10" fill="' + d + '"/>' +
          '<rect x="118" y="58" width="164" height="106" rx="5" fill="' + bg + '"/>' +
          '<rect x="134" y="76" width="76" height="8" rx="4" fill="' + a + '" opacity=".65"/>' +
          '<rect x="134" y="94" width="118" height="6" rx="3" fill="' + d + '" opacity=".18"/>' +
          '<rect x="134" y="108" width="94" height="6" rx="3" fill="' + d + '" opacity=".12"/>' +
          '<rect x="134" y="128" width="56" height="18" rx="6" fill="' + a + '" opacity=".2"/>' +
          '<path d="M86 174 h228 l20 24 H66 Z" fill="' + white + '" stroke="' + d + '" stroke-opacity=".14" stroke-width="2"/>' +
          '<rect x="174" y="182" width="52" height="5" rx="2.5" fill="' + d + '" opacity=".2"/>';
        break;

      case "monitor":
        inner =
          '<rect x="88" y="44" width="224" height="140" rx="10" fill="' + d + '"/>' +
          '<rect x="98" y="54" width="204" height="120" rx="4" fill="' + bg + '"/>' +
          '<rect x="114" y="72" width="92" height="8" rx="4" fill="' + a + '" opacity=".6"/>' +
          '<rect x="114" y="90" width="132" height="6" rx="3" fill="' + d + '" opacity=".16"/>' +
          '<rect x="114" y="104" width="108" height="6" rx="3" fill="' + d + '" opacity=".12"/>' +
          '<rect x="114" y="128" width="62" height="20" rx="7" fill="' + a + '" opacity=".2"/>' +
          '<rect x="188" y="184" width="24" height="42" fill="' + d + '" opacity=".3"/>' +
          '<rect x="148" y="224" width="104" height="10" rx="5" fill="' + d + '" opacity=".24"/>';
        break;

      case "headphones":
        inner =
          '<path d="M118 170 v-34 a82 82 0 0 1 164 0 v34" fill="none" stroke="' + d + '" stroke-width="16" stroke-linecap="round"/>' +
          '<path d="M126 146 v-12 a74 74 0 0 1 148 0 v12" fill="none" stroke="' + a + '" stroke-width="5" opacity=".45"/>' +
          '<rect x="90" y="152" width="44" height="76" rx="20" fill="' + d + '"/>' +
          '<rect x="266" y="152" width="44" height="76" rx="20" fill="' + d + '"/>' +
          '<rect x="101" y="165" width="22" height="50" rx="10" fill="' + a + '" opacity=".5"/>' +
          '<rect x="277" y="165" width="22" height="50" rx="10" fill="' + a + '" opacity=".5"/>';
        break;

      case "tv":
        inner =
          '<rect x="56" y="52" width="288" height="164" rx="10" fill="' + d + '"/>' +
          '<rect x="66" y="62" width="268" height="144" rx="5" fill="' + bg + '"/>' +
          '<path d="M94 182 l52 -62 38 46 30 -36 62 52" fill="none" stroke="' + a + '" stroke-width="8" stroke-linejoin="round" opacity=".55"/>' +
          '<circle cx="302" cy="84" r="8" fill="' + a + '" opacity=".7"/>' +
          '<rect x="188" y="216" width="24" height="26" fill="' + d + '" opacity=".3"/>' +
          '<rect x="146" y="242" width="108" height="9" rx="4.5" fill="' + d + '" opacity=".24"/>';
        break;

      case "speaker":
        inner =
          '<rect x="146" y="42" width="108" height="216" rx="26" fill="' + d + '"/>' +
          '<circle cx="200" cy="102" r="31" fill="' + bg + '" opacity=".9"/>' +
          '<circle cx="200" cy="102" r="16" fill="' + a + '"/>' +
          '<circle cx="200" cy="178" r="39" fill="' + bg + '" opacity=".9"/>' +
          '<circle cx="200" cy="178" r="21" fill="' + a + '"/>' +
          '<circle cx="200" cy="232" r="4" fill="' + a + '"/>' +
          '<rect x="166" y="56" width="68" height="5" rx="2.5" fill="' + white + '" opacity=".25"/>';
        break;

      case "espresso":
        inner =
          '<rect x="116" y="62" width="168" height="144" rx="14" fill="' + d + '"/>' +
          '<rect x="130" y="76" width="140" height="38" rx="8" fill="' + bg + '" opacity=".18"/>' +
          '<rect x="144" y="92" width="50" height="8" rx="4" fill="' + a + '"/>' +
          '<rect x="168" y="142" width="64" height="28" rx="6" fill="' + bg + '" opacity=".9"/>' +
          '<path d="M232 148 h18 v22 a16 16 0 0 1 -16 16 h-2" fill="none" stroke="' + a + '" stroke-width="7"/>' +
          '<rect x="154" y="186" width="92" height="10" rx="5" fill="' + bg + '" opacity=".38"/>' +
          '<rect x="176" y="206" width="48" height="34" rx="5" fill="' + white + '" opacity=".92"/>' +
          '<path d="M180 220 h40" stroke="' + a + '" stroke-width="5" stroke-linecap="round"/>' +
          '<rect x="124" y="246" width="152" height="8" rx="4" fill="' + d + '" opacity=".24"/>';
        break;

      case "blender":
        inner =
          '<rect x="150" y="190" width="100" height="58" rx="12" fill="' + d + '"/>' +
          '<circle cx="200" cy="220" r="14" fill="' + bg + '" opacity=".8"/>' +
          '<circle cx="200" cy="220" r="6" fill="' + a + '"/>' +
          '<path d="M158 78 h84 l-8 108 h-68 Z" fill="' + white + '" opacity=".9" stroke="' + a + '" stroke-opacity=".35" stroke-width="2"/>' +
          '<rect x="152" y="66" width="96" height="18" rx="9" fill="' + d + '"/>' +
          '<path d="M242 102 h16 a12 12 0 0 1 0 24 h-12" fill="none" stroke="' + d + '" stroke-width="8"/>' +
          '<path d="M172 100 h56 M170 116 h60 M168 132 h62" stroke="' + a + '" stroke-width="5" opacity=".45"/>';
        break;

      case "kettle":
        inner =
          '<path d="M150 94 h84 v98 a18 18 0 0 1 -18 18 h-48 a18 18 0 0 1 -18 -18 Z" fill="' + white + '" stroke="' + d + '" stroke-opacity=".14" stroke-width="2"/>' +
          '<path d="M234 120 h14 a16 16 0 0 1 0 32 h-10" fill="none" stroke="' + d + '" stroke-width="10"/>' +
          '<path d="M150 118 l-26 26" stroke="' + d + '" stroke-width="10" stroke-linecap="round"/>' +
          '<rect x="166" y="78" width="52" height="18" rx="9" fill="' + d + '"/>' +
          '<rect x="136" y="210" width="112" height="12" rx="6" fill="' + d + '" opacity=".28"/>' +
          '<path d="M166 130 v54" stroke="' + a + '" stroke-width="8" opacity=".38"/>';
        break;

      case "lamp":
        inner =
          '<ellipse cx="200" cy="238" rx="64" ry="12" fill="' + d + '" opacity=".15"/>' +
          '<rect x="196" y="120" width="8" height="118" rx="4" fill="' + d + '"/>' +
          '<path d="M150 120 h100 l-18 -56 h-64 Z" fill="' + d + '"/>' +
          '<path d="M150 120 h100 l-10 -30 h-80 Z" fill="' + a + '" opacity=".5"/>' +
          '<circle cx="200" cy="146" r="46" fill="' + a + '" opacity=".12"/>' +
          '<circle cx="200" cy="146" r="24" fill="' + a + '" opacity=".16"/>';
        break;

      case "rug":
        inner =
          '<path d="M70 210 L148 94 h182 l-78 116 Z" fill="' + a + '" opacity=".28"/>' +
          '<path d="M90 210 L160 112 h154 l-70 98 Z" fill="' + white + '" opacity=".72"/>' +
          '<path d="M120 194 L172 130 h124 l-52 64 Z" fill="' + a + '" opacity=".25"/>' +
          '<path d="M70 210 h260" stroke="' + d + '" stroke-width="6" stroke-linecap="round"/>' +
          '<path d="M88 220 l-12 12 M112 220 l-12 12 M136 220 l-12 12 M160 220 l-12 12 M184 220 l-12 12 M208 220 l-12 12 M232 220 l-12 12 M256 220 l-12 12 M280 220 l-12 12 M304 220 l-12 12" stroke="' + d + '" stroke-width="4" stroke-linecap="round" opacity=".5"/>';
        break;

      case "organizer":
        inner =
          '<rect x="104" y="162" width="192" height="72" rx="8" fill="' + d + '" opacity=".16"/>' +
          '<rect x="116" y="112" width="76" height="54" rx="6" fill="' + white + '" stroke="' + d + '" stroke-opacity=".12" stroke-width="2"/>' +
          '<rect x="204" y="96" width="80" height="70" rx="6" fill="' + bg + '" stroke="' + a + '" stroke-opacity=".35" stroke-width="2"/>' +
          '<rect x="128" y="68" width="60" height="48" rx="6" fill="' + a + '" opacity=".32"/>' +
          '<path d="M130 138 h48 M218 128 h52" stroke="' + a + '" stroke-width="5" opacity=".45"/>' +
          '<path d="M116 198 h168" stroke="' + d + '" stroke-width="4" opacity=".18"/>';
        break;

      case "yoga":
        inner =
          '<g transform="rotate(-16 200 150)">' +
          '<rect x="116" y="112" width="168" height="76" rx="38" fill="' + a + '" opacity=".62"/>' +
          '<ellipse cx="284" cy="150" rx="18" ry="38" fill="' + bg + '"/>' +
          '<ellipse cx="284" cy="150" rx="9" ry="26" fill="' + a + '"/>' +
          '<ellipse cx="116" cy="150" rx="18" ry="38" fill="' + bg + '"/>' +
          '<ellipse cx="116" cy="150" rx="9" ry="26" fill="' + a + '"/>' +
          '<path d="M150 116 h100 M150 184 h100" stroke="' + d + '" stroke-width="4" opacity=".25"/>' +
          '<rect x="188" y="108" width="24" height="84" rx="6" fill="' + d + '" opacity=".22"/>' +
          "</g>";
        break;

      case "thermos":
        inner =
          '<rect x="164" y="82" width="72" height="164" rx="24" fill="' + d + '"/>' +
          '<rect x="172" y="98" width="56" height="90" rx="18" fill="' + a + '" opacity=".5"/>' +
          '<rect x="172" y="196" width="56" height="38" rx="14" fill="' + bg + '" opacity=".32"/>' +
          '<rect x="176" y="64" width="48" height="24" rx="8" fill="' + d + '"/>' +
          '<path d="M188 60 v-14 h24 v14" fill="none" stroke="' + d + '" stroke-width="6"/>' +
          '<circle cx="200" cy="122" r="14" fill="' + white + '" opacity=".45"/>';
        break;

      case "diffuser":
        inner =
          '<path d="M158 118 h84 v92 a24 24 0 0 1 -24 24 h-36 a24 24 0 0 1 -24 -24 Z" fill="' + white + '" stroke="' + d + '" stroke-opacity=".12" stroke-width="2"/>' +
          '<path d="M158 118 h84 v34 h-84 Z" fill="' + a + '" opacity=".22"/>' +
          '<rect x="184" y="90" width="32" height="30" rx="8" fill="' + d + '"/>' +
          '<path d="M200 86 c-14 -18 10 -24 -2 -42 M222 90 c12 -16 -8 -24 4 -38 M178 90 c-12 -16 8 -22 -4 -34" fill="none" stroke="' + a + '" stroke-width="5" stroke-linecap="round" opacity=".5"/>' +
          '<circle cx="200" cy="190" r="10" fill="' + a + '" opacity=".45"/>' +
          '<rect x="146" y="236" width="108" height="8" rx="4" fill="' + d + '" opacity=".18"/>';
        break;

      case "skincare":
        inner =
          '<rect x="112" y="156" width="52" height="78" rx="10" fill="' + white + '" stroke="' + d + '" stroke-opacity=".12" stroke-width="2"/>' +
          '<rect x="124" y="132" width="28" height="24" rx="6" fill="' + d + '"/>' +
          '<rect x="126" y="108" width="24" height="28" rx="6" fill="' + a + '" opacity=".5"/>' +
          '<rect x="178" y="126" width="60" height="108" rx="12" fill="' + a + '" opacity=".34"/>' +
          '<rect x="190" y="102" width="36" height="24" rx="6" fill="' + d + '"/>' +
          '<rect x="252" y="176" width="44" height="58" rx="10" fill="' + white + '" stroke="' + d + '" stroke-opacity=".12" stroke-width="2"/>' +
          '<rect x="264" y="154" width="20" height="22" rx="5" fill="' + d + '"/>' +
          '<path d="M120 182 h36 M188 156 h40 M260 196 h28" stroke="' + a + '" stroke-width="5" opacity=".45"/>';
        break;

      case "blocks":
        inner =
          '<rect x="112" y="172" width="60" height="60" rx="8" fill="' + a + '" opacity=".8"/>' +
          '<rect x="180" y="172" width="60" height="60" rx="8" fill="' + d + '" opacity=".62"/>' +
          '<rect x="248" y="172" width="60" height="60" rx="8" fill="' + a + '" opacity=".42"/>' +
          '<rect x="146" y="104" width="60" height="60" rx="8" fill="' + d + '" opacity=".38"/>' +
          '<rect x="214" y="104" width="60" height="60" rx="8" fill="' + a + '" opacity=".62"/>' +
          '<rect x="180" y="36" width="60" height="60" rx="8" fill="' + a + '" opacity=".9"/>' +
          '<circle cx="210" cy="66" r="9" fill="' + white + '" opacity=".55"/>' +
          '<circle cx="176" cy="202" r="9" fill="' + white + '" opacity=".55"/>' +
          '<path d="M244 130 l14 24 h-28 Z" fill="' + white + '" opacity=".55"/>';
        break;

      case "bear":
        inner =
          '<circle cx="152" cy="74" r="26" fill="' + a + '" opacity=".55"/>' +
          '<circle cx="248" cy="74" r="26" fill="' + a + '" opacity=".55"/>' +
          '<circle cx="152" cy="74" r="12" fill="' + bg + '" opacity=".7"/>' +
          '<circle cx="248" cy="74" r="12" fill="' + bg + '" opacity=".7"/>' +
          '<ellipse cx="200" cy="218" rx="66" ry="58" fill="' + a + '" opacity=".45"/>' +
          '<circle cx="200" cy="118" r="58" fill="' + a + '" opacity=".58"/>' +
          '<ellipse cx="200" cy="138" rx="34" ry="26" fill="' + white + '" opacity=".78"/>' +
          '<circle cx="182" cy="110" r="6" fill="' + d + '"/>' +
          '<circle cx="218" cy="110" r="6" fill="' + d + '"/>' +
          '<ellipse cx="200" cy="132" rx="10" ry="7" fill="' + d + '"/>' +
          '<path d="M200 139 v9 M190 152 q10 8 20 0" fill="none" stroke="' + d + '" stroke-width="4" stroke-linecap="round"/>' +
          '<ellipse cx="200" cy="238" rx="26" ry="18" fill="' + white + '" opacity=".28"/>';
        break;

      default:
        inner =
          '<rect x="120" y="80" width="160" height="140" rx="18" fill="' + white + '" opacity=".8"/>' +
          '<circle cx="200" cy="150" r="42" fill="' + a + '" opacity=".35"/>';
    }

    return frame(label || kind, p, inner);
  }

  const ICONS = {
    search:
      '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/>',
    cart:
      '<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.5L21 7H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>',
    heart:
      '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
    user:
      '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    menu:
      '<path d="M3 6h18M3 12h18M3 18h18"/>',
    close:
      '<path d="M6 6l12 12M18 6L6 18"/>',
    "chevron-down":
      '<path d="M6 9l6 6 6-6"/>',
    "chevron-left":
      '<path d="M15 18l-6-6 6-6"/>',
    "chevron-right":
      '<path d="M9 18l6-6-6-6"/>',
    star:
      '<path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9Z" fill="currentColor" stroke="none"/>',
    check:
      '<path d="M4 12.5l5 5L20 6.5"/>',
    truck:
      '<path d="M1 4h14v12H1z"/><path d="M15 8h4l3 4v4h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    shield:
      '<path d="M12 2l8 3v6c0 5-3.4 9.2-8 11-4.6-1.8-8-6-8-11V5Z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    return:
      '<path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7"/>',
    phone:
      '<path d="M5 3h4l2 5-2.5 1.5a13 13 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
    mail:
      '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M3 6l9 7 9-7"/>',
    pin:
      '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>',
    plus:
      '<path d="M12 5v14M5 12h14"/>',
    minus:
      '<path d="M5 12h14"/>',
    trash:
      '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
    filter:
      '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
    "arrow-right":
      '<path d="M4 12h16M14 6l6 6-6 6"/>',
    lock:
      '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    spark:
      '<path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8Z"/>',
    leaf:
      '<path d="M20 4C11 4 5 9 5 16c0 2 1 4 2 4 7 0 13-7 13-16Z"/><path d="M4 21c3-6 7-9 12-12"/>',
    washer:
      '<rect x="5" y="2.5" width="14" height="19" rx="2"/><circle cx="12" cy="14" r="4.5"/><path d="M8 6h2M15 6h1"/>',
    laptop:
      '<rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M2 19h20l-2-3H4Z"/>',
    tv:
      '<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    espresso:
      '<rect x="4" y="4" width="13" height="12" rx="2"/><path d="M17 7h2a2 2 0 0 1 0 4h-2M7 20h9M9 16v4M14 16v4"/>',
    lamp:
      '<path d="M8 3h8l3 9H5Z"/><path d="M12 12v7M8 21h8"/>',
    yoga:
      '<rect x="3" y="8" width="18" height="8" rx="4"/><circle cx="4" cy="12" r="2"/><circle cx="20" cy="12" r="2"/>',
    diffuser:
      '<path d="M8 9h8v10a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3Z"/><path d="M10 9V5h4v4M12 4c0-2 2-2 2-3"/>',
    blocks:
      '<rect x="3" y="13" width="7" height="7" rx="1"/><rect x="14" y="13" width="7" height="7" rx="1"/><rect x="8" y="4" width="7" height="7" rx="1"/>'
  };

  function icon(name, size) {
    const body = ICONS[name] || ICONS.spark;
    return (
      '<svg class="icon" width="' +
      (size || 24) +
      '" height="' +
      (size || 24) +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      body +
      "</svg>"
    );
  }

  window.NKArt = { product: product, icon: icon, escape: esc };
})();
