// ======================================================
//  Nebula – navigation, menu latéral et démarrage
//  Copyright (c) 2026 Raphaël. Tous droits réservés (voir LICENSE).
// ======================================================
// Ce fichier est le « chef d'orchestre » : il sait quelle vue est affichée
// (etat), garde la trace des vues précédentes (historique, pour « ← Retour »)
// et redessine la zone principale et le menu quand on change de vue.

// --- État de l'application -----------------------------
// vue   : "rituels" | "rituel" | "recettes" | "recette" | "inventaire" | "element" | "recherche"
// params: précisions sur la vue, ex. { categorieId: "cat_pierre" } ou { id: "obj_…" }
const etat = { vue: null, params: {} };
const historique = [];          // pile des vues précédentes (dernière en haut)
const HISTORIQUE_MAX = 50;
let numeroRendu = 0;            // sert à ignorer les rendus devenus obsolètes

// Chaque vue est dessinée par une fonction définie dans un autre fichier
const VUES = {
  rituels: "afficherRituels",          // fiches.js
  rituel: "afficherFicheRituel",       // fiches.js
  recettes: "afficherRecettes",        // fiches.js
  recette: "afficherFicheRecette",     // fiches.js
  inventaire: "afficherInventaire",    // elements.js
  element: "afficherFicheElement",     // elements.js
  recherche: "afficherRecherche",      // recherche.js
};

// Appelle une fonction d'un autre fichier si elle existe déjà.
// (Pratique pendant la construction : l'app tourne même s'il manque un fichier.)
function siDisponible(nomFonction, ...args) {
  if (typeof window[nomFonction] === "function") return window[nomFonction](...args);
  alert("Cette fonction arrive à la prochaine étape.");
}

const memeVue = (a, b) => a.vue === b.vue && JSON.stringify(a.params) === JSON.stringify(b.params);

// --- Navigation -----------------------------------------
// remplacer = true : on change la vue sans empiler l'ancienne
// (utile pour la recherche : chaque lettre tapée ne doit pas créer un « retour »).
function naviguer(vue, params = {}, { remplacer = false } = {}) {
  const nouvelle = { vue, params };
  if (etat.vue && !remplacer && !memeVue(etat, nouvelle)) {
    historique.push({ vue: etat.vue, params: etat.params });
    if (historique.length > HISTORIQUE_MAX) historique.shift();
  }
  etat.vue = vue;
  etat.params = params;

  // En quittant la recherche, on vide le champ
  if (vue !== "recherche") document.getElementById("recherche").value = "";

  return rendre();
}

function retour() {
  const precedente = historique.pop() ?? { vue: "rituels", params: {} };
  etat.vue = precedente.vue;
  etat.params = precedente.params;
  if (etat.vue !== "recherche") document.getElementById("recherche").value = "";
  return rendre();
}

// Redessine la vue courante.
// On dessine d'abord dans une zone « hors écran », puis on la met en place
// d'un coup : pas de clignotement. Si un autre rendu a été lancé entre-temps
// (on tape vite dans la recherche), celui-ci est abandonné.
async function rendre() {
  const numero = ++numeroRendu;
  const zone = creer("div", "vue-contenu");

  try {
    const nomFonction = VUES[etat.vue];
    if (typeof window[nomFonction] === "function") {
      await window[nomFonction](zone, etat.params);
    } else {
      zone.append(
        creer("h1", null, "En construction"),
        creer("p", "vide", `La vue « ${etat.vue} » arrive à la prochaine étape.`)
      );
    }
  } catch (erreur) {
    console.error(erreur);
    zone.replaceChildren(creer("p", "erreur", "Une erreur est survenue : " + erreur.message));
  }

  if (numero !== numeroRendu) return; // un rendu plus récent a pris le relais
  document.getElementById("vue").replaceChildren(zone);
  if (etat.vue !== "recherche") window.scrollTo(0, 0);
  await construireMenu();
}

// ======================================================
//  Menu latéral
// ======================================================
// Tous les groupes sont FERMÉS à l'ouverture de l'appli ; on retient ensuite
// ceux que l'utilisateur ouvre (tant que la page n'est pas rechargée).
const groupesOuverts = new Set();

// Ordre des groupes (Rituels, Mes recettes, Inventaire), mémorisé dans le navigateur.
// L'ordre des catégories, lui, est enregistré dans la base (champ "ordre").
const CLE_ORDRE_GROUPES = "nebula.menu.ordreGroupes";
const ORDRE_GROUPES_DEFAUT = ["rituels", "recettes", "inventaire"];

function lireOrdreGroupes() {
  try {
    const ordre = JSON.parse(localStorage.getItem(CLE_ORDRE_GROUPES));
    if (Array.isArray(ordre)) return ordre;
  } catch { /* valeur absente ou abîmée : ordre par défaut */ }
  return ORDRE_GROUPES_DEFAUT;
}

function enregistrerOrdreGroupes(cles) {
  try { localStorage.setItem(CLE_ORDRE_GROUPES, JSON.stringify(cles)); } catch { /* ignoré */ }
}

async function enregistrerOrdreCategories(ids) {
  const categories = await lireTout("categories");
  for (const c of categories) {
    const rang = ids.indexOf(c.id);
    if (rang >= 0 && c.ordre !== rang) await enregistrer("categories", { ...c, ordre: rang });
  }
}

// ------------------------------------------------------
//  Glisser-déposer (souris) + Alt ↑ / Alt ↓ (clavier)
// ------------------------------------------------------
// Rend « triables » les enfants de "conteneur" qui ont un data-cle.
// À la fin d'un déplacement, surOrdre(cles) reçoit le nouvel ordre.
// Chaque appel a sa propre variable "glisse" : on ne peut donc pas
// déposer une catégorie parmi les groupes, ni l'inverse.
function rendreTriable(conteneur, surOrdre) {
  const items = () => [...conteneur.children].filter((el) => el.dataset.cle);
  let glisse = null;

  const nettoyer = () =>
    items().forEach((el) => el.classList.remove("cible-avant", "cible-apres"));

  // refFocus : bouton à re-sélectionner après coup (déplacement au clavier),
  // car Chrome retire le focus d'un élément qu'on déplace dans la page.
  const terminer = async (refFocus = null) => {
    await surOrdre(items().map((el) => el.dataset.cle));
    // Les pages qui affichent les catégories en sections suivent le nouvel ordre
    const pageParCategories = (etat.vue === "inventaire" && !etat.params.categorieId) || etat.vue === "recherche";
    if (pageParCategories) await rendre(); // rendre() reconstruit aussi le menu
    else await construireMenu();
    if (refFocus) {
      [...document.querySelectorAll("#menu button[data-ref]")].find((b) => b.dataset.ref === refFocus)?.focus();
    }
  };

  for (const item of items()) {
    item.draggable = true;
    item.title = "Glisser pour changer l'ordre (ou Alt + ↑ / ↓)";

    item.addEventListener("dragstart", (e) => {
      e.stopPropagation(); // une catégorie qu'on glisse n'entraîne pas son groupe
      glisse = item;
      item.classList.add("glisse");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", item.dataset.cle);
    });

    item.addEventListener("dragend", (e) => {
      e.stopPropagation();
      item.classList.remove("glisse");
      glisse = null;
      nettoyer();
    });

    // Survol : on montre une ligne avant ou après la cible
    item.addEventListener("dragover", (e) => {
      if (!glisse || glisse === item) return;
      e.preventDefault(); // autorise le dépôt ici
      e.stopPropagation();
      const zone = item.getBoundingClientRect();
      const apres = e.clientY > zone.top + zone.height / 2;
      nettoyer();
      item.classList.add(apres ? "cible-apres" : "cible-avant");
    });

    item.addEventListener("drop", (e) => {
      if (!glisse || glisse === item) return;
      e.preventDefault();
      e.stopPropagation();
      const apres = item.classList.contains("cible-apres");
      item[apres ? "after" : "before"](glisse);
      nettoyer();
      terminer();
    });

    // Clavier : Alt + flèche haut / bas sur l'entrée qui a le focus
    item.addEventListener("keydown", (e) => {
      if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
      if (e.target.closest("[data-cle]") !== item) return; // ignore les sous-éléments triables
      e.preventDefault();
      e.stopPropagation();
      const liste = items();
      const i = liste.indexOf(item);
      const voisin = liste[e.key === "ArrowUp" ? i - 1 : i + 1];
      if (!voisin) return;
      const refFocus = document.activeElement?.dataset.ref;
      e.key === "ArrowUp" ? voisin.before(item) : voisin.after(item);
      terminer(refFocus);
    });
  }
}

// Une entrée du menu (bouton)
function itemMenu({ texte, action, actif = false, compteur = null, pastille = null, classe = "", nomIcone = null, cle = null }) {
  const b = creer("button", `sous-menu-item ${classe}`);
  b.type = "button";
  b.dataset.ref = cle ?? texte; // repère pour retrouver le focus après reconstruction
  if (actif) {
    b.classList.add("actif");
    b.setAttribute("aria-current", "page");
  }
  if (nomIcone) b.append(icone(nomIcone));
  if (pastille) {
    const p = creer("span", "pastille");
    p.style.background = pastille;
    b.append(p);
  }
  b.append(creer("span", null, texte));
  if (compteur !== null) b.append(creer("span", "compteur", String(compteur)));
  b.addEventListener("click", action);

  const li = creer("li");
  if (cle) {
    li.dataset.cle = cle; // entrée déplaçable
    b.append(poigneeMenu());
  }
  li.append(b);
  return li;
}

// Petite poignée « ⋮⋮ » qui apparaît au survol des entrées déplaçables
function poigneeMenu() {
  return svg(`<svg viewBox="0 0 24 24" class="poignee" aria-hidden="true">
    <circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/>
    <circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/>
    <circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>`);
}

// Un groupe dépliable : titre (avec chevron) + sous-menu
function groupeMenu(cle, titre, nomIcone, items) {
  const groupe = creer("div", "menu-groupe");
  groupe.dataset.cle = cle; // groupe déplaçable
  const ouvert = groupesOuverts.has(cle);
  if (ouvert) groupe.classList.add("ouvert");

  const entete = creer("button", "menu-titre");
  entete.type = "button";
  entete.dataset.ref = "groupe:" + cle;
  entete.setAttribute("aria-expanded", String(ouvert));
  const chevron = icone("chevron");
  chevron.classList.add("chevron");
  entete.append(icone(nomIcone), creer("span", null, titre), poigneeMenu(), chevron);
  entete.addEventListener("click", () => {
    const estOuvert = groupe.classList.toggle("ouvert");
    estOuvert ? groupesOuverts.add(cle) : groupesOuverts.delete(cle);
    entete.setAttribute("aria-expanded", String(estOuvert));
  });

  const sousMenu = creer("div", "sous-menu");
  const ul = creer("ul");
  ul.append(...items);
  sousMenu.append(ul);

  groupe.append(entete, sousMenu);
  return groupe;
}

// Évite de reconstruire le menu deux fois en même temps (clic rapide + rendu)
let numeroMenu = 0;

// Reconstruit tout le menu à partir de la base (compteurs toujours à jour)
async function construireMenu() {
  const numero = ++numeroMenu;
  const [categories, objets, rituels, recettes] = await Promise.all([
    lireTout("categories"),
    lireTout("objets"),
    lireTout("rituels"),
    lireTout("recettes"),
  ]);
  if (numero !== numeroMenu) return; // une reconstruction plus récente est en cours
  trierCategories(categories);
  const categorieActive = etat.vue === "inventaire" ? etat.params.categorieId : undefined;

  const groupes = {
    rituels: groupeMenu("rituels", "Rituels", "livre", [
      itemMenu({
        texte: "Tous les rituels",
        compteur: rituels.length,
        actif: etat.vue === "rituels",
        action: () => naviguer("rituels"),
      }),
      itemMenu({
        texte: "Nouveau rituel",
        nomIcone: "plus",
        classe: "action",
        action: () => siDisponible("ouvrirFormulaireRituel", null),
      }),
    ]),
    recettes: groupeMenu("recettes", "Mes recettes", "mortier", [
      itemMenu({
        texte: "Toutes les recettes",
        compteur: recettes.length,
        actif: etat.vue === "recettes",
        action: () => naviguer("recettes"),
      }),
      itemMenu({
        texte: "Nouvelle recette",
        nomIcone: "plus",
        classe: "action",
        action: () => siDisponible("ouvrirFormulaireRecette", null),
      }),
    ]),
    inventaire: groupeMenu("inventaire", "Inventaire", "bocal", [
      itemMenu({
        texte: "Tous les éléments",
        compteur: objets.length,
        actif: etat.vue === "inventaire" && !categorieActive,
        action: () => naviguer("inventaire"),
      }),
      ...categories.map((c) =>
        itemMenu({
          texte: c.nom,
          pastille: teinteCategorie(c.id),
          compteur: objets.filter((o) => o.categorieId === c.id).length,
          actif: categorieActive === c.id,
          action: () => naviguer("inventaire", { categorieId: c.id }),
          cle: c.id, // → déplaçable
        })
      ),
      itemMenu({
        texte: "Ajouter un élément",
        nomIcone: "plus",
        classe: "action",
        action: () => siDisponible("ouvrirFormulaireElement", null, categorieActive),
      }),
    ]),
  };

  // Groupes dans l'ordre mémorisé (un groupe inconnu de l'ordre va à la fin)
  const ordre = lireOrdreGroupes();
  const cles = Object.keys(groupes).sort((a, b) => {
    const ia = ordre.indexOf(a), ib = ordre.indexOf(b);
    return (ia < 0 ? Infinity : ia) - (ib < 0 ? Infinity : ib);
  });

  const menu = document.getElementById("menu");
  // Si le focus clavier était dans le menu, on le rendra au même bouton après
  // reconstruction (sinon il serait perdu, car les boutons sont recréés).
  const refFocus = menu.contains(document.activeElement) ? document.activeElement.dataset.ref : null;

  menu.replaceChildren(...cles.map((cle) => groupes[cle]));

  if (refFocus) {
    [...menu.querySelectorAll("button[data-ref]")].find((b) => b.dataset.ref === refFocus)?.focus();
  }

  // Glisser-déposer : les groupes entre eux, et les catégories entre elles
  rendreTriable(menu, enregistrerOrdreGroupes);
  rendreTriable(groupes.inventaire.querySelector(".sous-menu ul"), enregistrerOrdreCategories);
}

// ======================================================
//  Démarrage
// ======================================================
async function demarrer() {
  try {
    await ouvrirBase();
    await initialiserCategories();
    await importerExemples();
  } catch (erreur) {
    console.error(erreur);
    document.getElementById("vue").replaceChildren(
      creer("p", "erreur", "Impossible d'ouvrir la base de données : " + erreur.message)
    );
    return;
  }

  // Le logo ramène à l'accueil et efface l'historique
  document.getElementById("logo").addEventListener("click", () => {
    historique.length = 0;
    naviguer("rituels");
  });

  await naviguer("rituels");
  preparerAppHorsLigne(); // sauvegarde.js : service worker + stockage persistant
}

demarrer();
