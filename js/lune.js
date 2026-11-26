// ======================================================
//  Nebula – la Lune du jour (en haut à droite, toujours visible)
// ======================================================
// 1. CALCUL : dates exactes des nouvelles et pleines lunes (méthode de
//    Jean Meeus, « Astronomical Algorithms », chap. 49 : précision de
//    quelques minutes), puis position dans le cycle.
// 2. DESSIN : une lune SVG dont la partie éclairée suit la phase.
// 3. PANNEAU : phase, prochaines dates, correspondances ésotériques et
//    éléments de l'inventaire qui y correspondent.
// Tout est calculé sur l'appareil : pas besoin d'Internet.

const MOIS_SYNODIQUE = 29.530588861; // durée moyenne d'un cycle (jours)
const JOUR_MS = 86400000;

// ======================================================
//  1. Calculs astronomiques
// ======================================================
const rad = (deg) => (deg * Math.PI) / 180;
const jourJulienVersDate = (jd) => new Date((jd - 2440587.5) * JOUR_MS);
const dateVersJourJulien = (date) => date.getTime() / JOUR_MS + 2440587.5;

// Instant d'une nouvelle lune (k entier) ou d'une pleine lune (k + 0,5).
// k = numéro de la lunaison depuis la nouvelle lune du 6 janvier 2000.
function instantPhase(k) {
  const T = k / 1236.85;
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;

  // Instant « moyen », puis corrections dues aux irrégularités de l'orbite
  let jde = 2451550.09766 + MOIS_SYNODIQUE * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;

  const E = 1 - 0.002516 * T - 0.0000074 * T2;                               // excentricité terrestre
  const M = rad(2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3);  // anomalie du Soleil
  const Mp = rad(201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4); // de la Lune
  const F = rad(160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4);
  const Om = rad(124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3);

  const pleine = Math.abs(k % 1) > 0.25;
  jde +=
    (pleine ? -0.40614 : -0.4072) * Math.sin(Mp) +
    (pleine ? 0.17302 : 0.17241) * E * Math.sin(M) +
    (pleine ? 0.01614 : 0.01608) * Math.sin(2 * Mp) +
    (pleine ? 0.01043 : 0.01039) * Math.sin(2 * F) +
    (pleine ? 0.00734 : 0.00739) * E * Math.sin(Mp - M) -
    (pleine ? 0.00515 : 0.00514) * E * Math.sin(Mp + M) +
    (pleine ? 0.00209 : 0.00208) * E * E * Math.sin(2 * M) -
    0.00111 * Math.sin(Mp - 2 * F) -
    0.00057 * Math.sin(Mp + 2 * F) +
    0.00056 * E * Math.sin(2 * Mp + M) -
    0.00042 * Math.sin(3 * Mp) +
    0.00042 * E * Math.sin(M + 2 * F) +
    0.00038 * E * Math.sin(M - 2 * F) -
    0.00024 * E * Math.sin(2 * Mp - M) -
    0.00017 * Math.sin(Om);

  // JDE est en « temps terrestre » : environ 69 s d'avance sur l'heure civile
  return jourJulienVersDate(jde - 69 / 86400);
}

// Tout ce qu'il faut savoir sur la Lune à une date donnée
function etatLune(date = new Date()) {
  // Lunaison en cours : dernière nouvelle lune ≤ date < suivante
  let k = Math.floor((dateVersJourJulien(date) - 2451550.09766) / MOIS_SYNODIQUE);
  while (instantPhase(k) > date) k--;
  while (instantPhase(k + 1) <= date) k++;

  const nouvelle = instantPhase(k);
  const nouvelleSuivante = instantPhase(k + 1);
  const pleine = instantPhase(k + 0.5);

  // fraction : 0 = nouvelle lune, 0,5 = pleine lune, → 1 = nouvelle lune suivante
  const fraction = (date - nouvelle) / (nouvelleSuivante - nouvelle);
  const age = (date - nouvelle) / JOUR_MS;
  const duree = (nouvelleSuivante - nouvelle) / JOUR_MS;

  return {
    date,
    fraction,
    age,
    illumination: (1 - Math.cos(2 * Math.PI * fraction)) / 2, // part du disque éclairée
    croissante: fraction < 0.5,
    phase: PHASES_LUNE[indicePhase(age, duree)],
    prochainePleine: pleine > date ? pleine : instantPhase(k + 1.5),
    prochaineNouvelle: nouvelleSuivante,
  };
}

// 8 phases. Les 4 phases principales durent ±1 jour autour de leur instant.
function indicePhase(age, duree) {
  const proche = (cible) => Math.abs(age - cible) < 1;
  if (age < 1 || age > duree - 1) return 0;
  if (proche(duree / 4)) return 2;
  if (proche(duree / 2)) return 4;
  if (proche((3 * duree) / 4)) return 6;
  if (age < duree / 4) return 1;
  if (age < duree / 2) return 3;
  if (age < (3 * duree) / 4) return 5;
  return 7;
}

// ======================================================
//  Correspondances ésotériques (recherches web, reformulées)
// ======================================================
// Les THÈMES se recoupent bien d'une source à l'autre. Couleurs, pierres
// et plantes varient selon les traditions : ce sont des exemples courants.
// motsCles : servent à trouver les éléments de l'inventaire qui
// correspondent (comparaison avec leurs tags) et sont cliquables.
const PHASES_LUNE = [
  {
    nom: "Nouvelle lune",
    energie: "Le cycle recommence dans l'obscurité. Moment de faire le bilan, de se reposer, puis de poser ses intentions pour la lunaison qui vient.",
    motsCles: ["intention", "vœux", "renouveau", "méditation", "introspection"],
    couleurs: ["noir", "bleu nuit", "argent"],
    pierres: ["labradorite", "pierre de lune", "obsidienne"],
    plantes: [],
  },
  {
    nom: "Premier croissant",
    energie: "La lumière revient : l'élan se forme. Phase d'attraction, propice à lancer les projets et à nourrir ce que l'on veut voir grandir.",
    motsCles: ["attraction", "abondance", "prospérité", "chance", "croissance", "motivation"],
    couleurs: ["vert", "or", "jaune pâle"],
    pierres: ["citrine", "aventurine"],
    plantes: ["cannelle", "gingembre", "ortie"],
  },
  {
    nom: "Premier quartier",
    energie: "Moitié éclairée, moitié dans l'ombre : temps de l'action et des décisions. On surmonte les obstacles avec courage.",
    motsCles: ["courage", "force", "énergie", "motivation", "confiance en soi"],
    couleurs: ["rouge", "orange"],
    pierres: ["cornaline", "œil-de-tigre"],
    plantes: [],
  },
  {
    nom: "Gibbeuse croissante",
    energie: "La lune s'arrondit : on affine, on persévère et on prépare la récolte. Bon moment pour la concentration et le travail en profondeur.",
    motsCles: ["concentration", "clarté mentale", "réussite", "abondance", "persévérance"],
    couleurs: ["violet", "or", "bleu profond"],
    pierres: ["quartz clair", "améthyste", "fluorite"],
    plantes: ["sauge", "thym", "santal"],
  },
  {
    nom: "Pleine lune",
    energie: "Apogée du cycle : clarté, intuition et gratitude. On célèbre ce qui s'est accompli, on pratique la divination et l'on recharge ses pierres à la lumière lunaire.",
    motsCles: ["intuition", "divination", "gratitude", "spiritualité", "magie", "protection"],
    couleurs: ["blanc", "argent", "or"],
    pierres: ["pierre de lune", "sélénite", "quartz clair"],
    plantes: ["jasmin", "gardénia", "myrrhe"],
  },
  {
    nom: "Gibbeuse décroissante",
    energie: "La lumière commence à diminuer : temps du partage, de la gratitude et du bilan. On amorce le lâcher-prise.",
    motsCles: ["gratitude", "sagesse", "guérison émotionnelle", "purification", "lâcher-prise"],
    couleurs: ["tons terre", "bleu"],
    pierres: ["quartz fumé", "améthyste"],
    plantes: [],
  },
  {
    nom: "Dernier quartier",
    energie: "Phase de libération : on se détache de ce qui ne sert plus, on désencombre, on purifie et l'on bannit les influences indésirables.",
    motsCles: ["lâcher-prise", "bannissement", "purification", "énergies négatives", "protection"],
    couleurs: ["noir", "bleu", "violet"],
    pierres: ["obsidienne", "tourmaline noire", "quartz fumé"],
    plantes: [],
  },
  {
    nom: "Dernier croissant",
    energie: "Lune « balsamique » : repos, guérison et restauration avant le prochain cycle. On ralentit, on s'ancre et on se prépare en douceur.",
    motsCles: ["sommeil", "calme", "apaisement", "guérison", "ancrage", "repos"],
    couleurs: ["noir", "argent"],
    pierres: ["obsidienne", "tourmaline noire"],
    plantes: [],
  },
];

const SOURCES_LUNE = [
  "https://www.pagangrimoire.com/moon-phases-witchcraft-timing-spells/",
  "https://blog.mountainroseherbs.com/herbs-for-the-moon-cycles",
  "https://mumblesandthings.squarespace.com/blog/2017/9/18/crystals-for-moon-energy",
  "https://www.nylon.com/life/moon-phase-rituals-magic-manifestation",
  "https://www.panaprium.com/fr/blogs/i/how-to-work-with-the-moon-in-your-daily-routine",
  "https://www.pleine-lune.org/phases-de-la-lune",
  "https://www.yahoo.com/lifestyle/harness-magical-power-moon-phase-120000846.html",
  "https://www.seawitchbotanicals.com/blogs/swb/lunar-rituals-guide",
];

// ======================================================
//  2. Dessin de la Lune
// ======================================================
let numeroDessinLune = 0; // identifiants SVG uniques (plusieurs lunes à l'écran)

// Partie éclairée : un demi-disque + un arc d'ellipse (le « terminateur »).
// Hémisphère nord : la lune croissante est éclairée à droite.
function cheminEclaire(fraction, c, r) {
  const rx = r * Math.abs(Math.cos(2 * Math.PI * fraction)); // largeur du terminateur
  const haut = `${c} ${c - r}`, bas = `${c} ${c + r}`;
  if (fraction < 0.5) {
    const sens = fraction < 0.25 ? 0 : 1; // croissant : terminateur bombé à droite
    return `M${haut} A${r} ${r} 0 0 1 ${bas} A${rx} ${r} 0 0 ${sens} ${haut}Z`;
  }
  const sens = fraction < 0.75 ? 0 : 1;
  return `M${haut} A${r} ${r} 0 0 0 ${bas} A${rx} ${r} 0 0 ${sens} ${haut}Z`;
}

function dessinLune(etat, classe = "") {
  const id = "lune" + ++numeroDessinLune;
  const c = 50, r = 40;
  const ill = etat.illumination;

  let eclaire = "";
  if (ill > 0.995) eclaire = `<circle cx="${c}" cy="${c}" r="${r}"/>`;
  else if (ill > 0.005) eclaire = `<path d="${cheminEclaire(etat.fraction, c, r)}"/>`;

  // Uniquement des nombres calculés par nous : aucun texte saisi → svg() sans risque
  return svg(`<svg viewBox="0 0 100 100" class="dessin-lune ${classe}" aria-hidden="true">
    <defs>
      <radialGradient id="${id}-halo"><stop offset=".55" stop-color="#efe5d3" stop-opacity=".35"/><stop offset="1" stop-color="#efe5d3" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-lum" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#f6efe2"/><stop offset="1" stop-color="#dccbaa"/></radialGradient>
      <clipPath id="${id}-clip">${eclaire}</clipPath>
    </defs>
    <circle cx="${c}" cy="${c}" r="50" fill="url(#${id}-halo)" opacity="${(0.25 + ill * 0.75).toFixed(2)}"/>
    <circle cx="${c}" cy="${c}" r="${r}" fill="#2a231d" stroke="#efe5d3" stroke-opacity=".22" stroke-width="1.2"/>
    <g fill="url(#${id}-lum)">${eclaire}</g>
    <g clip-path="url(#${id}-clip)" fill="#c9b796" opacity=".55">
      <circle cx="38" cy="38" r="7"/><circle cx="62" cy="58" r="9"/><circle cx="44" cy="66" r="4.5"/>
      <circle cx="66" cy="32" r="3.5"/><circle cx="30" cy="56" r="3"/>
    </g>
  </svg>`);
}

// ======================================================
//  3. Bouton (en haut à droite) et panneau
// ======================================================
const btnLune = document.getElementById("btn-lune");
const panneauLune = document.getElementById("panneau-lune");
let dateAffichee = null; // jour exploré dans le panneau (‹ / ›)

const formatJour = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const formatInstant = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const pourcent = (x) => Math.round(x * 100) + " %";

// Bouton : la lune d'aujourd'hui (mise à jour régulière)
function mettreAJourBoutonLune() {
  const lune = etatLune();
  btnLune.replaceChildren(dessinLune(lune));
  btnLune.title = `${lune.phase.nom} · ${pourcent(lune.illumination)} éclairée — cliquer pour les correspondances`;
  btnLune.setAttribute("aria-label", btnLune.title);
}

function ligneCorrespondance(titre, valeurs) {
  if (!valeurs.length) return null;
  const ligne = creer("div", "corresp");
  ligne.append(creer("dt", null, titre), creer("dd", null, valeurs.join(", ")));
  return ligne;
}

// Éléments de l'inventaire dont un tag correspond aux mots-clés de la phase
async function elementsPourPhase(phase) {
  const cles = phase.motsCles.map(normaliser);
  const objets = await lireTout("objets");
  return objets
    .map((o) => ({ o, score: (o.tags ?? []).filter((t) => cles.some((k) => normaliser(t).includes(k))).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || parNom(a.o, b.o))
    .map((x) => x.o);
}

let numeroPanneau = 0; // ignore un remplissage devenu obsolète (clics rapides sur ‹ ›)

async function remplirPanneauLune() {
  const numero = ++numeroPanneau;
  const lune = etatLune(dateAffichee);
  const p = lune.phase;
  const estAujourdhui = new Date().toDateString() === dateAffichee.toDateString();

  // --- En-tête : grande lune + phase ---
  const entete = creer("div", "lune-entete");
  const infos = creer("div");
  infos.append(
    creer("p", "surtitre", estAujourdhui ? "Lune du jour" : "Lune du " + dateAffichee.toLocaleDateString("fr-FR")),
    creer("h2", null, p.nom),
    creer("p", "lune-date", formatJour.format(dateAffichee)),
    creer("p", "lune-chiffres",
      `${pourcent(lune.illumination)} éclairée · lune ${lune.croissante ? "croissante" : "décroissante"} · ${lune.age.toFixed(1).replace(".", ",")} jours`)
  );
  const fermer = creer("button", "btn-icone lune-fermer");
  fermer.type = "button";
  fermer.title = "Fermer";
  fermer.append(icone("croix"));
  fermer.addEventListener("click", fermerPanneauLune);
  entete.append(dessinLune(lune, "grande"), infos, fermer);

  // --- Navigation dans le cycle ---
  const nav = creer("div", "lune-nav");
  const decaler = (jours) => () => {
    dateAffichee = new Date(dateAffichee.getTime() + jours * JOUR_MS);
    remplirPanneauLune();
  };
  const precedent = bouton("", "btn-discret", decaler(-1));
  precedent.append(icone("retour"), creer("span", null, "Veille"));
  const suivant = bouton("", "btn-discret", decaler(1));
  suivant.append(creer("span", null, "Lendemain"), icone("chevron"));
  const aujourdhui = bouton("Aujourd'hui", "btn-discret", () => {
    dateAffichee = new Date();
    remplirPanneauLune();
  });
  aujourdhui.disabled = estAujourdhui;
  nav.append(precedent, aujourdhui, suivant);

  // --- Prochaines dates ---
  const dates = creer("div", "lune-dates");
  for (const [titre, instant] of [["Prochaine pleine lune", lune.prochainePleine], ["Prochaine nouvelle lune", lune.prochaineNouvelle]]) {
    const d = creer("div");
    d.append(creer("small", null, titre), creer("strong", null, formatInstant.format(instant)));
    dates.append(d);
  }

  // --- Énergie et mots-clés (cliquables → recherche) ---
  const energie = creer("section", "lune-section");
  energie.append(
    creer("h3", null, "Énergie de la phase"),
    creer("p", null, p.energie),
    dessinerTags(creer("div", "tags"), p.motsCles, { classe: "mot-cle", cliquable: true })
  );

  // --- Correspondances ---
  const corresp = creer("section", "lune-section");
  const dl = creer("dl", "lune-corresp");
  dl.append(
    ...[ligneCorrespondance("Couleurs", p.couleurs), ligneCorrespondance("Pierres", p.pierres), ligneCorrespondance("Plantes", p.plantes)]
      .filter(Boolean)
  );
  corresp.append(creer("h3", null, "Correspondances"), dl);

  // --- Dans l'inventaire ---
  const inventaire = creer("section", "lune-section");
  inventaire.append(creer("h3", null, "Dans votre inventaire"));
  const elements = await elementsPourPhase(p);
  if (numero !== numeroPanneau) return; // un autre jour a été demandé entre-temps
  if (elements.length) {
    const liste = creer("div", "lune-elements");
    for (const el of elements.slice(0, 8)) {
      const b = creer("button", "lune-element");
      b.type = "button";
      const v = creer("span", "vignette");
      v.append(imageElement(el));
      b.append(v, creer("span", null, el.nom));
      b.title = "Ouvrir la fiche";
      b.addEventListener("click", () => {
        fermerPanneauLune();
        naviguer("element", { id: el.id });
      });
      liste.append(b);
    }
    inventaire.append(liste);
  } else {
    inventaire.append(creer("p", "vide", "Aucun élément ne correspond encore à cette phase."));
  }

  // --- Sources ---
  const sources = creer("details", "lune-sources");
  sources.append(
    creer("summary", null, `Sources (${SOURCES_LUNE.length}) · les correspondances varient selon les traditions`),
    listeSources(SOURCES_LUNE)
  );

  panneauLune.replaceChildren(entete, nav, dates, energie, corresp, inventaire, sources);
}

// --- Ouvrir / fermer ---------------------------------
function ouvrirPanneauLune() {
  dateAffichee = new Date();
  panneauLune.hidden = false;
  btnLune.setAttribute("aria-expanded", "true");
  remplirPanneauLune().then(() => panneauLune.querySelector(".lune-fermer")?.focus());
}

function fermerPanneauLune() {
  if (panneauLune.hidden) return;
  panneauLune.hidden = true;
  btnLune.setAttribute("aria-expanded", "false");
}

btnLune.addEventListener("click", () => (panneauLune.hidden ? ouvrirPanneauLune() : fermerPanneauLune()));

// Clic en dehors du panneau, ou touche Échap → fermeture.
// composedPath() = chemin du clic mémorisé au moment du clic : fiable même si
// le bouton cliqué a disparu entre-temps (le panneau se redessine à chaque jour).
document.addEventListener("click", (e) => {
  const chemin = e.composedPath();
  if (!panneauLune.hidden && !chemin.includes(panneauLune) && !chemin.includes(btnLune)) fermerPanneauLune();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !panneauLune.hidden) {
    fermerPanneauLune();
    btnLune.focus();
  }
});
// Un mot-clé cliqué lance une recherche : on referme le panneau.
// « true » = phase de capture : on voit le clic AVANT le bouton du tag,
// qui, lui, arrête la propagation (stopPropagation dans dessinerTags).
panneauLune.addEventListener("click", (e) => {
  if (e.target.closest("button.tag")) fermerPanneauLune();
}, true);

// La lune suit le cycle : mise à jour au démarrage puis toutes les 30 minutes
mettreAJourBoutonLune();
setInterval(mettreAJourBoutonLune, 30 * 60 * 1000);
