// ======================================================
//  Nebula – recherche globale (depuis n'importe où)
// ======================================================
// Chercher « amour » trouve :
//   - les éléments dont le NOM ou un TAG contient « amour » ;
//   - les rituels dont le NOM, l'OBJECTIF ou un MOT-CLÉ contient « amour ».
// La comparaison ignore accents et majuscules : « energie » trouve « Énergie ».

const champRecherche = document.getElementById("recherche");
const DELAI_RECHERCHE = 150; // ms
let minuterieRecherche = null;

// Lance (ou met à jour) la vue « recherche ».
// Si on est déjà dans la recherche, on remplace la vue au lieu d'empiler
// une entrée d'historique à chaque lettre tapée.
function lancerRecherche(terme) {
  terme = (terme ?? "").trim();
  if (!terme) return;
  champRecherche.value = terme;
  return naviguer("recherche", { terme }, { remplacer: etat.vue === "recherche" });
}

// Ferme la recherche : retour à la vue d'avant
function fermerRecherche() {
  champRecherche.value = "";
  if (etat.vue === "recherche") retour();
}

// --- Saisie : temporisation (debounce) ------------------
// On attend 150 ms sans nouvelle frappe avant de chercher : taper « amour »
// lance une seule recherche au lieu de cinq. C'est comme une temporisation
// d'enclenchement sur une entrée qui rebondit.
champRecherche.addEventListener("input", () => {
  clearTimeout(minuterieRecherche);
  minuterieRecherche = setTimeout(() => {
    const terme = champRecherche.value.trim();
    if (terme) lancerRecherche(terme);
    else if (etat.vue === "recherche") retour();
  }, DELAI_RECHERCHE);
});

// --- Raccourcis clavier --------------------------------
champRecherche.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    clearTimeout(minuterieRecherche);
    fermerRecherche();
  }
});

document.addEventListener("keydown", (e) => {
  if (document.querySelector("dialog[open]")) return; // pas pendant un formulaire
  const dansUnChamp = e.target.closest?.("input, textarea, select, [contenteditable]");
  const ctrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
  if (ctrlK || (e.key === "/" && !dansUnChamp)) {
    e.preventDefault();
    champRecherche.focus();
    champRecherche.select();
  }
});

// ======================================================
//  Vue « résultats de recherche »
// ======================================================
async function afficherRecherche(zone, { terme }) {
  const t = normaliser(terme);
  const [rituels, recettes, objets, categories] = await Promise.all([
    lireTout("rituels"),
    lireTout("recettes"),
    lireTout("objets"),
    lireTout("categories"),
  ]);
  trierCategories(categories);
  const objetsParId = indexerParId(objets);
  const contient = (texte) => normaliser(texte).includes(t);

  const rituelsTrouves = rituels
    .filter((r) => contient(r.nom) || contient(r.objectif) || (r.motsCles ?? []).some(contient))
    .sort(parNom);
  const recettesTrouvees = recettes
    .filter((r) => contient(r.nom) || contient(r.utilisation) || (r.motsCles ?? []).some(contient))
    .sort(parNom);
  const elementsTrouves = objets
    .filter((o) => contient(o.nom) || (o.tags ?? []).some(contient))
    .sort(parNom);
  const total = rituelsTrouves.length + recettesTrouvees.length + elementsTrouves.length;

  // --- En-tête ---
  const entete = creer("div", "entete-vue");
  const textes = creer("div");
  textes.append(
    creer("p", "surtitre", "Recherche"),
    creer("h1", null, `« ${terme} »`),
    creer("p", "sous-titre", total ? `${total} résultat${total > 1 ? "s" : ""}` : "Aucun résultat")
  );
  entete.append(textes);
  zone.append(entete);

  // --- Aucun résultat : proposer de créer ---
  if (!total) {
    const vide = creer("div", "etat-vide");
    const illu = creer("div", "illu-vide");
    illu.append(illustration(null));
    const boutons = creer("div", "boutons");
    const btnRituel = bouton("Créer un rituel", "btn-principal", () => ouvrirFormulaireRituel(null, terme));
    btnRituel.prepend(icone("plus"));
    const btnRecette = bouton("Créer une recette", "", () => ouvrirFormulaireRecette(null, terme));
    btnRecette.prepend(icone("plus"));
    const btnElement = bouton("Créer un élément", "", () => ouvrirFormulaireElement(null, null, terme));
    btnElement.prepend(icone("plus"));
    boutons.append(btnRituel, btnRecette, btnElement);
    vide.append(
      illu,
      creer("h2", null, `Rien ne correspond à « ${terme} »`),
      creer("p", null, "Vérifiez l'orthographe, essayez un mot plus court, ou créez une nouvelle fiche avec ce nom."),
      boutons
    );
    zone.append(vide);
    return;
  }

  // --- Rituels ---
  if (rituelsTrouves.length) {
    const titre = creer("h2", "section-titre", "Rituels");
    titre.append(creer("span", "compteur", String(rituelsTrouves.length)));
    const grille = creer("div", "grille-cartes grille-rituels");
    grille.append(...rituelsTrouves.map((r) => carteRituel(r, objetsParId, terme)));
    zone.append(titre, grille);
  }

  // --- Recettes ---
  if (recettesTrouvees.length) {
    const titre = creer("h2", "section-titre", "Recettes");
    titre.append(creer("span", "compteur", String(recettesTrouvees.length)));
    const grille = creer("div", "grille-cartes grille-rituels");
    grille.append(...recettesTrouvees.map((r) => carteRecette(r, objetsParId, terme)));
    zone.append(titre, grille);
  }

  // --- Éléments, groupés par catégorie ---
  for (const c of categories) {
    const liste = elementsTrouves.filter((o) => o.categorieId === c.id);
    if (!liste.length) continue;
    const grille = creer("div", "grille-cartes");
    grille.append(...liste.map((o) => carteElement(o, c, terme)));
    zone.append(titreCategorie(c, liste.length), grille);
  }
}
