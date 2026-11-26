// ======================================================
//  Nebula – illustrations originales (dessinées en SVG)
// ======================================================
// Chaque catégorie a son dessin : cristaux (pierres), fiole (huiles),
// brin de plante (plantes), bougie (couleurs). Le dessin est teinté
// avec la couleur « teinte » de l'élément. Une photo choisie par
// l'utilisateur remplace l'illustration.

const TEINTES_DEFAUT = {
  cat_pierre: "#c9b3d9",
  cat_huile: "#e3c9a8",
  cat_plante: "#c9b3d9",
  cat_couleur: "#f3e6cf",
};

// --- Calculs de couleurs ------------------------------
function teinteValide(t) {
  return /^#[0-9a-f]{6}$/i.test(t || "") ? t : null;
}
function versRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function versHex(rgb) {
  return "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
function melanger(h1, h2, p) {
  const a = versRgb(h1), b = versRgb(h2);
  return versHex(a.map((v, i) => v + (b[i] - v) * p));
}
const eclaircir = (h, p) => melanger(h, "#ffffff", p);
const assombrir = (h, p) => melanger(h, "#000000", p);
function luminosite(h) {
  const [r, g, b] = versRgb(h);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
// Contour lisible : plus clair pour les teintes sombres, plus foncé sinon
const contour = (t) => (luminosite(t) < 0.35 ? eclaircir(t, 0.45) : assombrir(t, 0.32));

// --- Les dessins (dans un carré de 120 × 120) ---------
function prisme(x, base, l, h, pointe, t) {
  const gauche = `${x - l},${base} ${x - l},${base - h} ${x},${base - h - pointe} ${x},${base}`;
  const droite = `${x},${base} ${x},${base - h - pointe} ${x + l},${base - h} ${x + l},${base}`;
  return `<polygon points="${gauche}" fill="${eclaircir(t, 0.3)}"/>
          <polygon points="${droite}" fill="${t}"/>
          <path d="M${x - l * 0.55} ${base - h * 0.85} L${x - l * 0.55} ${base - 6}" stroke="#ffffff" stroke-opacity=".45" stroke-width="2"/>`;
}

function dessinCristaux(t) {
  return `<ellipse cx="60" cy="99" rx="40" ry="6" fill="#000" opacity=".18"/>
    <g stroke="${contour(t)}" stroke-width="1.6" stroke-linejoin="round">
      ${prisme(60, 98, 14, 46, 18, t)}
      ${prisme(37, 99, 10, 24, 12, eclaircir(t, 0.1))}
      ${prisme(83, 99, 11, 30, 13, assombrir(t, 0.06))}
    </g>`;
}

function dessinFiole(t) {
  const c = contour(t);
  return `<ellipse cx="60" cy="102" rx="30" ry="5" fill="#000" opacity=".18"/>
    <g stroke="${c}" stroke-width="1.6" stroke-linejoin="round">
      <rect x="50" y="16" width="20" height="20" rx="9" fill="${assombrir(t, 0.25)}"/>
      <rect x="52" y="34" width="16" height="16" fill="#efe5d3" fill-opacity=".35"/>
      <path d="M40 58 Q40 50 50 50 H70 Q80 50 80 58 V92 Q80 101 70 101 H50 Q40 101 40 92 Z" fill="#efe5d3" fill-opacity=".22"/>
      <path d="M40 72 H80 V92 Q80 101 70 101 H50 Q40 101 40 92 Z" fill="${t}"/>
    </g>
    <rect x="47" y="78" width="26" height="12" rx="2" fill="#efe5d3" opacity=".55"/>
    <path d="M46 58 V90" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>
    <path d="M96 58 q7 10 0 13 q-7 -3 0 -13z" fill="${t}" stroke="${c}" stroke-width="1.2"/>`;
}

function dessinBrin(t) {
  const f = "#a9c79b", fc = "#7f9f72";
  const feuille = (x, y, a) =>
    `<ellipse cx="0" cy="0" rx="14" ry="5.5" fill="${f}" stroke="${fc}" stroke-width="1.2" transform="translate(${x} ${y}) rotate(${a})"/>`;
  const bouton = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${t}" stroke="${contour(t)}" stroke-width="1"/>`;
  return `<ellipse cx="60" cy="104" rx="26" ry="4" fill="#000" opacity=".15"/>
    <path d="M60 104 C57 82 63 58 60 24" stroke="${fc}" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${feuille(48, 88, -30)}${feuille(72, 80, 30)}${feuille(47, 66, -38)}${feuille(73, 56, 36)}${feuille(50, 44, -45)}
    ${bouton(60, 22, 5)}${bouton(54, 29, 4.2)}${bouton(66, 30, 4.2)}${bouton(57, 36, 3.6)}${bouton(64, 38, 3.4)}`;
}

function dessinBougie(t) {
  const c = contour(t);
  return `<circle cx="60" cy="28" r="20" fill="#f6dfa8" opacity=".16"/>
    <ellipse cx="60" cy="102" rx="30" ry="5" fill="#c4b59c" opacity=".5"/>
    <path d="M60 12 C67 22 67 31 60 38 C53 31 53 22 60 12Z" fill="#f3c98b"/>
    <path d="M60 22 C63 27 63 31 60 35 C57 31 57 27 60 22Z" fill="#fbe7bd"/>
    <path d="M60 38 V45" stroke="#2f2822" stroke-width="2"/>
    <g stroke="${c}" stroke-width="1.6" stroke-linejoin="round">
      <rect x="44" y="45" width="32" height="56" rx="4" fill="${t}"/>
      <path d="M44 50 Q44 45 49 45 H71 Q76 45 76 50 Q72 54 70 50 Q68 62 65 52 Q60 49 55 50 Q51 58 48 50 Q46 52 44 50Z" fill="${eclaircir(t, 0.28)}"/>
    </g>
    <path d="M50 58 V94" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>`;
}

function dessinGenerique(t) {
  return `<path d="M70 26a30 30 0 1 0 22 48A26 26 0 0 1 70 26z" fill="${t}" stroke="${contour(t)}" stroke-width="1.6"/>`;
}

const ETINCELLES = `<g fill="#efe5d3" opacity=".65">
  <path d="M22 26l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z"/>
  <circle cx="98" cy="22" r="1.8"/><circle cx="104" cy="44" r="1.2"/><circle cx="16" cy="58" r="1.2"/>
</g>`;

function codeDessin(categorieId, t) {
  switch (categorieId) {
    case "cat_pierre": return dessinCristaux(t);
    case "cat_huile": return dessinFiole(t);
    case "cat_plante": return dessinBrin(t);
    case "cat_couleur": return dessinBougie(t);
    default: return dessinGenerique(t);
  }
}

// Illustration d'une catégorie ou d'un élément sans photo
function illustration(categorieId, teinte) {
  const t = teinteValide(teinte) || TEINTES_DEFAUT[categorieId] || "#e3c9a8";
  return svg(`<svg viewBox="0 0 120 120" class="illu" aria-hidden="true">
    <circle cx="60" cy="60" r="58" fill="${eclaircir(t, 0.4)}" opacity=".14"/>
    ${codeDessin(categorieId, t)}${ETINCELLES}</svg>`);
}

// Image d'un élément : sa photo s'il en a une, sinon l'illustration
function imageElement(element) {
  if (typeof element?.image === "string" && element.image.startsWith("data:image/")) {
    const img = creer("img");
    img.src = element.image;
    img.alt = element.nom;
    img.loading = "lazy";
    return img;
  }
  return illustration(element?.categorieId, element?.teinte);
}

// Couleur représentative d'une catégorie (pastilles du menu)
function teinteCategorie(categorieId) {
  return { cat_pierre: "#c9b3d9", cat_huile: "#e3c9a8", cat_plante: "#b5cfa8", cat_couleur: "#e8a7a0" }[categorieId] || "#c4b59c";
}

// --- Grande illustration de la bannière d'accueil -----
function illustrationBanniere() {
  const g = (x, y, s, code, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r} 60 60) scale(${s})">${code}</g>`;
  return svg(`<svg viewBox="0 0 640 240" preserveAspectRatio="xMaxYMid slice" class="banniere-art" aria-hidden="true">
    <defs>
      <linearGradient id="fondu" x1="0" x2="1">
        <stop offset="0" stop-color="#3f352c" stop-opacity="1"/>
        <stop offset=".35" stop-color="#3f352c" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="M560 30a42 42 0 1 0 30 70A36 36 0 0 1 560 30z" fill="#e3c9a8" opacity=".85"/>
    <g fill="#efe5d3" opacity=".7">
      <circle cx="420" cy="40" r="2"/><circle cx="470" cy="22" r="1.4"/><circle cx="610" cy="140" r="1.6"/>
      <circle cx="350" cy="70" r="1.2"/><circle cx="500" cy="90" r="1.3"/>
      <path d="M520 46l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
    </g>
    ${g(250, 70, 1.35, dessinBrin("#c9b3d9"), -12)}
    ${g(330, 92, 1.25, dessinCristaux("#c9b3d9"))}
    ${g(420, 70, 1.45, dessinBougie("#f2c4c0"))}
    ${g(500, 100, 1.15, dessinCristaux("#f2c4c0"))}
    ${g(555, 88, 1.3, dessinBrin("#efe5d3"), 14)}
    <rect width="640" height="240" fill="url(#fondu)"/>
  </svg>`);
}
