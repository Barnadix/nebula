// ======================================================
//  Nebula – Fiches à ingrédients : RITUELS et RECETTES
// ======================================================
// Un rituel et une recette ont la même structure :
//   nom, motsCles, <texte d'en-tête>, ingredients, etapes, notes, sources
// Seul le texte d'en-tête change : « Objectif » (rituel) / « Utilisation » (recette).
// Plutôt que d'écrire deux fois le même code, on écrit UN module, réglé par
// la table TYPES_FICHE (comme un bloc fonctionnel instancié deux fois
// avec des paramètres différents).
//
// Les ingrédients sont liés aux éléments de l'inventaire :
//   ingredients: [{ objetId: "obj_…", quantite: "1 bougie" }, …]
// Les fonctions bloc() et lienRetour() viennent de elements.js.

const TYPES_FICHE = {
  rituel: {
    magasin: "rituels",          // magasin IndexedDB
    prefixe: "rit",              // début des identifiants
    vueListe: "rituels",
    vueFiche: "rituel",
    surtitre: "Rituel",
    nouveau: "Nouveau rituel",
    modifier: "Modifier le rituel",
    champTexte: "objectif",      // nom du champ dans la base
    titreTexte: "Objectif",      // titre du bloc sur la fiche
    libelleForm: "Description / objectif",
    leNom: "le rituel",
    unNom: "Un rituel",
  },
  recette: {
    magasin: "recettes",
    prefixe: "rec",
    vueListe: "recettes",
    vueFiche: "recette",
    surtitre: "Recette",
    nouveau: "Nouvelle recette",
    modifier: "Modifier la recette",
    champTexte: "utilisation",
    titreTexte: "Utilisation",
    libelleForm: "Utilisation",
    leNom: "la recette",
    unNom: "Une recette",
  },
};

// Petit outil : tableau → Map (id → enregistrement) pour retrouver vite
const indexerParId = (liste) => new Map(liste.map((o) => [o.id, o]));

// ======================================================
//  Carte (réutilisée par la recherche)
// ======================================================
function carteFiche(fiche, type, objetsParId, terme = "") {
  const T = TYPES_FICHE[type];
  const carte = creer("button", "carte carte-rituel");
  carte.type = "button";
  carte.addEventListener("click", () => naviguer(T.vueFiche, { id: fiche.id }));

  carte.append(creer("span", "carte-titre", fiche.nom));
  if (fiche[T.champTexte]) carte.append(creer("p", "resume", fiche[T.champTexte]));

  let motsCles = fiche.motsCles ?? [];
  if (terme) {
    const t = normaliser(terme);
    const trouve = (m) => normaliser(m).includes(t);
    motsCles = [...motsCles.filter(trouve), ...motsCles.filter((m) => !trouve(m))];
  }
  if (motsCles.length) carte.append(dessinerTags(creer("div", "tags"), motsCles, { terme, classe: "mot-cle", max: 5 }));

  // Vignettes des ingrédients (les éléments supprimés sont ignorés)
  const ingredients = (fiche.ingredients ?? []).map((i) => objetsParId.get(i.objetId)).filter(Boolean);
  if (ingredients.length) {
    const mini = creer("div", "mini-ingredients");
    for (const objet of ingredients.slice(0, 6)) {
      const v = creer("span", "vignette");
      v.title = objet.nom;
      v.append(imageElement(objet));
      mini.append(v);
    }
    carte.append(mini);
  }
  return carte;
}

const carteRituel = (r, objetsParId, terme) => carteFiche(r, "rituel", objetsParId, terme);
const carteRecette = (r, objetsParId, terme) => carteFiche(r, "recette", objetsParId, terme);

// Grille de cartes triées A–Z (ou message si vide)
function grilleFiches(fiches, type, objetsParId, messageVide) {
  if (!fiches.length) return creer("p", "vide", messageVide);
  const grille = creer("div", "grille-cartes grille-rituels");
  grille.append(...fiches.map((f) => carteFiche(f, type, objetsParId)));
  return grille;
}

// ======================================================
//  Listes
// ======================================================
// Accueil : bannière + tous les rituels
async function afficherRituels(zone) {
  const [rituels, objets] = await Promise.all([lireTout("rituels"), lireTout("objets")]);
  rituels.sort(parNom);

  const banniere = creer("section", "banniere");
  const texte = creer("div", "banniere-texte");
  const btnNouveau = bouton("Nouveau rituel", "btn-principal", () => ouvrirFormulaireRituel(null));
  btnNouveau.prepend(icone("plus"));
  texte.append(
    creer("p", "surtitre", "Grimoire personnel"),
    creer("h1", null, "Rituels"),
    creer("p", null, "Vos rituels, leurs ingrédients liés à l'inventaire et leurs étapes, toujours à portée de main."),
    btnNouveau
  );
  banniere.append(illustrationBanniere(), texte);

  const titre = creer("h2", "section-titre", "Tous les rituels");
  titre.append(creer("span", "compteur", String(rituels.length)));

  zone.append(
    banniere,
    titre,
    grilleFiches(rituels, "rituel", indexerParId(objets), "Aucun rituel pour l'instant. Créez le premier avec « Nouveau rituel ».")
  );
}

// Mes recettes : en-tête simple + toutes les recettes
async function afficherRecettes(zone) {
  const [recettes, objets] = await Promise.all([lireTout("recettes"), lireTout("objets")]);
  recettes.sort(parNom);

  const entete = creer("div", "entete-vue");
  const textes = creer("div");
  textes.append(
    creer("p", "surtitre", "Mes recettes"),
    creer("h1", null, "Toutes les recettes"),
    creer("p", "sous-titre", `${recettes.length} recette${recettes.length > 1 ? "s" : ""}`)
  );
  const btnNouvelle = bouton("Nouvelle recette", "btn-principal", () => ouvrirFormulaireRecette(null));
  btnNouvelle.prepend(icone("plus"));
  entete.append(textes, btnNouvelle);

  zone.append(
    entete,
    grilleFiches(recettes, "recette", indexerParId(objets),
      "Aucune recette pour l'instant. Créez la première avec « Nouvelle recette » (huile de massage, eau de lune, sachet…).")
  );
}

// ======================================================
//  Fiche (rituel ou recette)
// ======================================================
async function afficherFiche(type, zone, { id }) {
  const T = TYPES_FICHE[type];
  const fiche = await lireUn(T.magasin, id);
  zone.append(lienRetour());

  if (!fiche) {
    zone.append(creer("p", "vide", `${T.unNom} introuvable (peut-être supprimé).`));
    return;
  }

  const [objets, categories] = await Promise.all([lireTout("objets"), lireTout("categories")]);
  const objetsParId = indexerParId(objets);
  const categoriesParId = indexerParId(categories);

  const article = creer("article", "fiche-rituel");
  article.append(creer("p", "surtitre", T.surtitre), creer("h1", null, fiche.nom));
  if (fiche.motsCles?.length) {
    article.append(dessinerTags(creer("div", "tags"), fiche.motsCles, { classe: "mot-cle", cliquable: true }));
  }

  const actions = creer("div", "fiche-actions");
  const btnModifier = bouton("Modifier", "", () => ouvrirFormulaireFiche(type, fiche));
  btnModifier.prepend(icone("crayon"));
  actions.append(btnModifier, bouton("Supprimer", "btn-danger", () => supprimerFiche(type, fiche)));
  article.append(actions);

  if (fiche[T.champTexte]) article.append(bloc(T.titreTexte, fiche[T.champTexte]));

  // --- Ingrédients : chaque ligne ouvre la fiche de l'élément ---
  if (fiche.ingredients?.length) {
    const liste = creer("div", "liste-ingredients");
    for (const ing of fiche.ingredients) {
      const objet = objetsParId.get(ing.objetId);
      const b = creer("button", "ingredient");
      b.type = "button";
      const vignette = creer("span", "vignette");
      const texte = creer("span");

      if (objet) {
        vignette.append(imageElement(objet));
        const details = [ing.quantite, categoriesParId.get(objet.categorieId)?.nom].filter(Boolean).join(" · ");
        texte.append(creer("strong", null, objet.nom), creer("small", null, details));
        b.addEventListener("click", () => naviguer("element", { id: objet.id }));
      } else {
        b.classList.add("manquant");
        b.disabled = true;
        vignette.append(illustration(null));
        texte.append(creer("strong", null, "Élément supprimé"), creer("small", null, ing.quantite || ""));
      }
      b.append(vignette, texte);
      liste.append(b);
    }
    article.append(bloc(`Ingrédients (${fiche.ingredients.length})`, liste));
  }

  if (fiche.etapes?.length) {
    const ol = creer("ol", "etapes");
    ol.append(...fiche.etapes.map((e) => creer("li", null, e)));
    article.append(bloc("Étapes", ol));
  }

  if (fiche.notes) article.append(bloc("Notes", fiche.notes));
  if (fiche.sources?.length) article.append(bloc(`Sources (${fiche.sources.length})`, listeSources(fiche.sources)));

  zone.append(article);
}

// Fonctions appelées par app.js (table VUES).
// ⚠ Écrites avec « function » (et pas « const ») : app.js les retrouve
// par leur nom via window["afficherFicheRituel"], ce qui ne marche
// qu'avec des fonctions déclarées ainsi.
function afficherFicheRituel(zone, params) { return afficherFiche("rituel", zone, params); }
function afficherFicheRecette(zone, params) { return afficherFiche("recette", zone, params); }

async function supprimerFiche(type, fiche) {
  const T = TYPES_FICHE[type];
  if (!confirm(`Supprimer définitivement ${T.leNom} « ${fiche.nom} » ?`)) return false;
  await supprimer(T.magasin, fiche.id);

  // La fiche supprimée ne doit plus être accessible par « Retour »
  for (let i = historique.length - 1; i >= 0; i--) {
    if (historique[i].vue === T.vueFiche && historique[i].params.id === fiche.id) historique.splice(i, 1);
  }
  if (etat.vue === T.vueFiche && etat.params.id === fiche.id) await retour();
  else await rendre();
  return true;
}

// ======================================================
//  Formulaire commun (fenêtre #dialogue-rituel)
// ======================================================
const dlgFiche = document.getElementById("dialogue-rituel");
const formFiche = document.getElementById("form-rituel");
const champsFiche = formFiche.elements;
const zoneIngredients = document.getElementById("liste-ingredients");
const zoneErreurFiche = document.getElementById("erreur-rituel");
const btnSupprimerFiche = document.getElementById("btn-supprimer-rituel");

let typeEnCours = "rituel";  // "rituel" ou "recette"
let ficheEnCours = null;     // null = création
let categoriesFiche = [];    // chargées à l'ouverture, pour les listes déroulantes
let objetsFiche = [];

// Ajoute une ligne « ingrédient » : liste déroulante + quantité + bouton ×
function ajouterLigneIngredient(ingredient = { objetId: "", quantite: "" }) {
  const ligne = creer("div", "ligne-ingredient");

  const select = creer("select");
  select.setAttribute("aria-label", "Élément de l'inventaire");
  const vide = creer("option", null, "— Choisir un élément —");
  vide.value = "";
  select.append(vide);

  // Un groupe (optgroup) par catégorie, éléments triés A–Z
  for (const c of categoriesFiche) {
    const elements = objetsFiche.filter((o) => o.categorieId === c.id);
    if (!elements.length) continue;
    const groupe = creer("optgroup");
    groupe.label = c.nom;
    for (const o of elements) {
      const option = creer("option", null, o.nom);
      option.value = o.id;
      groupe.append(option);
    }
    select.append(groupe);
  }
  // Ingrédient dont l'élément a été supprimé : on le garde visible
  if (ingredient.objetId && !objetsFiche.some((o) => o.id === ingredient.objetId)) {
    const option = creer("option", null, "(élément supprimé)");
    option.value = ingredient.objetId;
    select.append(option);
  }
  select.value = ingredient.objetId;

  const quantite = creer("input");
  quantite.placeholder = "Quantité (ex. 1 bougie)";
  quantite.autocomplete = "off";
  quantite.value = ingredient.quantite ?? "";

  const btnRetirer = creer("button", "btn-icone");
  btnRetirer.type = "button";
  btnRetirer.title = "Retirer cet ingrédient";
  btnRetirer.append(icone("croix"));
  btnRetirer.addEventListener("click", () => ligne.remove());

  ligne.append(select, quantite, btnRetirer);
  zoneIngredients.append(ligne);
  return select;
}

function lireIngredients() {
  return [...zoneIngredients.querySelectorAll(".ligne-ingredient")]
    .map((ligne) => ({
      objetId: ligne.querySelector("select").value,
      quantite: ligne.querySelector("input").value.trim(),
    }))
    .filter((i) => i.objetId); // lignes sans élément choisi ignorées
}

// fiche = null → création ; nomParDefaut : pré-remplissage (recherche)
async function ouvrirFormulaireFiche(type, fiche = null, nomParDefaut = "") {
  const T = TYPES_FICHE[type];
  typeEnCours = type;
  ficheEnCours = fiche;
  [categoriesFiche, objetsFiche] = await Promise.all([lireTout("categories"), lireTout("objets")]);
  trierCategories(categoriesFiche);
  objetsFiche.sort(parNom);

  document.getElementById("titre-dialogue-rituel").textContent = fiche ? T.modifier : T.nouveau;
  document.getElementById("libelle-texte-fiche").textContent = T.libelleForm;
  champsFiche.nom.value = fiche?.nom ?? nomParDefaut;
  champsFiche.motsCles.value = (fiche?.motsCles ?? []).join(", ");
  champsFiche.texte.value = fiche?.[T.champTexte] ?? "";
  champsFiche.etapes.value = (fiche?.etapes ?? []).join("\n");
  champsFiche.notes.value = fiche?.notes ?? "";
  champsFiche.sources.value = (fiche?.sources ?? []).join("\n");

  zoneIngredients.replaceChildren();
  const ingredients = fiche?.ingredients?.length ? fiche.ingredients : [undefined];
  ingredients.forEach((i) => ajouterLigneIngredient(i));

  dessinerTags(document.getElementById("apercu-mots-cles"), lireTags(champsFiche.motsCles.value), { classe: "mot-cle" });
  btnSupprimerFiche.hidden = !fiche;
  zoneErreurFiche.textContent = "";

  dlgFiche.showModal();
  dlgFiche.scrollTop = 0;
  champsFiche.nom.focus();
}

function ouvrirFormulaireRituel(rituel = null, nom = "") { return ouvrirFormulaireFiche("rituel", rituel, nom); }
function ouvrirFormulaireRecette(recette = null, nom = "") { return ouvrirFormulaireFiche("recette", recette, nom); }

champsFiche.motsCles.addEventListener("input", () => {
  dessinerTags(document.getElementById("apercu-mots-cles"), lireTags(champsFiche.motsCles.value), { classe: "mot-cle" });
});

document.getElementById("btn-ajouter-ingredient").addEventListener("click", () => {
  ajouterLigneIngredient().focus();
});

// --- Enregistrer --------------------------------------
formFiche.addEventListener("submit", async (e) => {
  e.preventDefault();
  const T = TYPES_FICHE[typeEnCours];
  const nom = champsFiche.nom.value.trim();

  if (!nom) {
    zoneErreurFiche.textContent = "Le nom est obligatoire.";
    champsFiche.nom.focus();
    return;
  }

  const toutes = await lireTout(T.magasin);
  if (toutes.some((f) => f.id !== ficheEnCours?.id && normaliser(f.nom) === normaliser(nom))) {
    zoneErreurFiche.textContent = `${T.unNom} « ${nom} » existe déjà.`;
    return;
  }

  const fiche = {
    ...(ficheEnCours ?? {}),
    id: ficheEnCours?.id ?? genererId(T.prefixe),
    nom,
    motsCles: lireTags(champsFiche.motsCles.value),
    [T.champTexte]: champsFiche.texte.value.trim(),   // "objectif" ou "utilisation"
    ingredients: lireIngredients(),
    etapes: lireLignes(champsFiche.etapes.value),
    notes: champsFiche.notes.value.trim(),
    sources: lireLignes(champsFiche.sources.value),
  };

  try {
    await enregistrer(T.magasin, fiche);
  } catch (erreur) {
    zoneErreurFiche.textContent = "Enregistrement impossible : " + erreur.message;
    return;
  }

  dlgFiche.close();
  if (ficheEnCours) await rendre();
  else await naviguer(T.vueFiche, { id: fiche.id });
});

// --- Supprimer / Annuler -------------------------------
btnSupprimerFiche.addEventListener("click", async () => {
  if (!ficheEnCours) return;
  if (await supprimerFiche(typeEnCours, ficheEnCours)) dlgFiche.close();
});

document.getElementById("btn-annuler-rituel").addEventListener("click", () => dlgFiche.close());
