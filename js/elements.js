// ======================================================
//  Nebula – Inventaire : liste, fiche et formulaire des éléments
// ======================================================
// Vocabulaire :
//   - à l'écran (front-end) : « Inventaire » qui contient des « Éléments »
//   - dans le code / la base (back-end) : magasin "objets", ids "obj_…"

// Noms affichés pour les champs propres à une catégorie
const LIBELLES_CHAMPS = {
  precautions: "Précautions",
};

// ======================================================
//  Carte d'un élément (réutilisée par la recherche)
// ======================================================
// terme : texte recherché → les tags correspondants sont surlignés et
// passent en premier (pour qu'on les voie même s'il y a beaucoup de tags).
function carteElement(element, categorie, terme = "") {
  const carte = creer("button", "carte");
  carte.type = "button";
  carte.addEventListener("click", () => naviguer("element", { id: element.id }));

  const vignette = creer("div", "vignette");
  vignette.append(imageElement(element));

  const corps = creer("div", "carte-corps");
  corps.append(
    creer("span", "carte-titre", element.nom),
    creer("span", "carte-cat", categorie?.nom ?? "Sans catégorie")
  );

  let tags = element.tags ?? [];
  if (terme) {
    const t = normaliser(terme);
    const trouve = (tag) => normaliser(tag).includes(t);
    tags = [...tags.filter(trouve), ...tags.filter((tag) => !trouve(tag))];
  }
  if (tags.length) corps.append(dessinerTags(creer("div", "tags"), tags, { terme, max: 4 }));

  carte.append(vignette, corps);
  return carte;
}

// Petite pastille de couleur + nom de catégorie (titres de section)
function titreCategorie(categorie, nombre) {
  const h2 = creer("h2", "section-titre");
  const pastille = creer("span", "pastille");
  pastille.style.background = teinteCategorie(categorie.id);
  h2.append(pastille, creer("span", null, categorie.nom), creer("span", "compteur", String(nombre)));
  return h2;
}

// ======================================================
//  Vue Inventaire (tout, ou une seule catégorie)
// ======================================================
// Sens du tri des éléments : "az" (par défaut à chaque ouverture de l'appli)
// ou "za". Un seul réglage pour toutes les pages d'éléments.
let triInventaire = "az";

function boutonTri() {
  const az = triInventaire === "az";
  const b = bouton(az ? "A → Z" : "Z → A", "btn-tri", () => {
    triInventaire = az ? "za" : "az";
    rendre();
  });
  b.prepend(icone("tri"));
  b.title = az ? "Trié de A à Z — cliquer pour trier de Z à A" : "Trié de Z à A — cliquer pour trier de A à Z";
  b.setAttribute("aria-label", b.title);
  return b;
}

async function afficherInventaire(zone, { categorieId } = {}) {
  const [categories, elements] = await Promise.all([lireTout("categories"), lireTout("objets")]);
  trierCategories(categories);
  elements.sort(parNom);
  if (triInventaire === "za") elements.reverse();

  const categorie = categorieId ? categories.find((c) => c.id === categorieId) : null;
  const visibles = categorie ? elements.filter((e) => e.categorieId === categorie.id) : elements;

  // --- En-tête ---
  const entete = creer("div", "entete-vue");
  const textes = creer("div");
  textes.append(
    creer("p", "surtitre", "Inventaire"),
    creer("h1", null, categorie ? categorie.nom : "Tous les éléments"),
    creer("p", "sous-titre", `${visibles.length} élément${visibles.length > 1 ? "s" : ""}`)
  );
  const btnAjouter = bouton("Ajouter un élément", "btn-principal", () =>
    ouvrirFormulaireElement(null, categorie?.id)
  );
  btnAjouter.prepend(icone("plus"));
  const actions = creer("div", "entete-actions");
  actions.append(boutonTri(), btnAjouter);
  entete.append(textes, actions);
  zone.append(entete);

  // --- Une seule catégorie : une grille ---
  if (categorie) {
    zone.append(grilleElements(visibles, categorie));
    return;
  }

  // --- Tout l'inventaire : une section par catégorie ---
  for (const c of categories) {
    const liste = elements.filter((e) => e.categorieId === c.id);
    zone.append(titreCategorie(c, liste.length), grilleElements(liste, c));
  }

  // Éléments dont la catégorie n'existe plus (sécurité)
  const orphelins = elements.filter((e) => !categories.some((c) => c.id === e.categorieId));
  if (orphelins.length) {
    zone.append(creer("h2", "section-titre", "Sans catégorie"), grilleElements(orphelins, null));
  }
}

function grilleElements(elements, categorie) {
  if (!elements.length) return creer("p", "vide", "Aucun élément dans cette catégorie pour l'instant.");
  const grille = creer("div", "grille-cartes");
  grille.append(...elements.map((e) => carteElement(e, categorie)));
  return grille;
}

// ======================================================
//  Fiche d'un élément
// ======================================================
function lienRetour() {
  const b = creer("button", "lien-retour");
  b.type = "button";
  b.append(icone("retour"), creer("span", null, "Retour"));
  b.addEventListener("click", retour);
  return b;
}

// Un bloc titré (Description, Notes…) ; contenu = texte ou élément HTML
function bloc(titre, contenu, classe = "") {
  const section = creer("section", `bloc ${classe}`);
  section.append(creer("h2", null, titre));
  section.append(typeof contenu === "string" ? creer("p", null, contenu) : contenu);
  return section;
}

// Fiches (magasin "rituels" ou "recettes") qui utilisent un élément donné
async function fichesUtilisant(magasin, idElement) {
  const fiches = await lireTout(magasin);
  return fiches.filter((f) => (f.ingredients ?? []).some((i) => i.objetId === idElement)).sort(parNom);
}

// Liste de boutons vers des rituels ou des recettes (bloc « Utilisé dans… »)
function listeLiens(fiches, libelle, vue, nomIcone) {
  const liste = creer("div", "liste-ingredients");
  for (const f of fiches) {
    const b = creer("button", "ingredient");
    b.type = "button";
    const texte = creer("span");
    texte.append(creer("strong", null, f.nom), creer("small", null, libelle));
    b.append(icone(nomIcone), texte);
    b.addEventListener("click", () => naviguer(vue, { id: f.id }));
    liste.append(b);
  }
  return liste;
}

async function afficherFicheElement(zone, { id }) {
  const element = await lireUn("objets", id);
  zone.append(lienRetour());

  if (!element) {
    zone.append(creer("p", "vide", "Cet élément n'existe plus (il a peut-être été supprimé)."));
    return;
  }

  const [categorie, rituels, recettes] = await Promise.all([
    lireUn("categories", element.categorieId),
    fichesUtilisant("rituels", element.id),
    fichesUtilisant("recettes", element.id),
  ]);

  const fiche = creer("article", "fiche");

  // --- Colonne gauche : grande image ---
  const image = creer("div", "grande-image");
  image.append(imageElement(element));

  // --- Colonne droite : informations ---
  const infos = creer("div");
  infos.append(creer("p", "surtitre", categorie?.nom ?? "Sans catégorie"), creer("h1", null, element.nom));
  if (element.tags?.length) infos.append(dessinerTags(creer("div", "tags"), element.tags, { cliquable: true }));

  const actions = creer("div", "fiche-actions");
  const btnModifier = bouton("Modifier", "", () => ouvrirFormulaireElement(element));
  btnModifier.prepend(icone("crayon"));
  actions.append(btnModifier, bouton("Supprimer", "btn-danger", () => supprimerElement(element)));
  infos.append(actions);

  if (element.description) infos.append(bloc("Description", element.description));

  // Champs propres à la catégorie (ex. Précautions pour les huiles)
  for (const champ of categorie?.champs ?? []) {
    if (!element[champ]) continue;
    const classe = champ === "precautions" ? "bloc-precautions" : "";
    infos.append(bloc(LIBELLES_CHAMPS[champ] ?? champ, element[champ], classe));
  }

  if (element.notes) infos.append(bloc("Notes personnelles", element.notes));

  if (rituels.length) infos.append(bloc("Utilisé dans les rituels", listeLiens(rituels, "Rituel", "rituel", "livre")));
  if (recettes.length) infos.append(bloc("Utilisé dans les recettes", listeLiens(recettes, "Recette", "recette", "mortier")));

  if (element.sources?.length) infos.append(bloc(`Sources (${element.sources.length})`, listeSources(element.sources)));

  fiche.append(image, infos);
  zone.append(fiche);
}

// --- Supprimer (depuis la fiche ou le formulaire) ------
async function supprimerElement(element) {
  const [rituels, recettes] = await Promise.all([
    fichesUtilisant("rituels", element.id),
    fichesUtilisant("recettes", element.id),
  ]);
  const utilisations = [
    ...rituels.map((r) => "• Rituel : " + r.nom),
    ...recettes.map((r) => "• Recette : " + r.nom),
  ];
  let message = `Supprimer définitivement « ${element.nom} » ?`;
  if (utilisations.length) {
    message +=
      `\n\nAttention : cet élément est utilisé dans ${utilisations.length} fiche(s) :\n` +
      utilisations.join("\n") +
      "\nIl y apparaîtra comme « élément supprimé ».";
  }
  if (!confirm(message)) return false;

  await supprimer("objets", element.id);

  // On retire la fiche supprimée de l'historique pour que « Retour » n'y mène plus
  for (let i = historique.length - 1; i >= 0; i--) {
    if (historique[i].vue === "element" && historique[i].params.id === element.id) historique.splice(i, 1);
  }
  if (etat.vue === "element" && etat.params.id === element.id) await retour();
  else await rendre();
  return true;
}

// ======================================================
//  Formulaire Ajouter / Modifier
// ======================================================
const dlgElement = document.getElementById("dialogue-element");
const formElement = document.getElementById("form-element");
const champsElement = formElement.elements; // accès par name : champsElement.nom, .tags…
const zoneChampsSpecifiques = document.getElementById("champs-specifiques");
const zoneErreurElement = document.getElementById("erreur-element");
const btnSupprimerElement = document.getElementById("btn-supprimer-element");
const apercuPhoto = document.getElementById("apercu-photo");
const inputPhoto = document.getElementById("input-photo");
const btnRetirerPhoto = document.getElementById("btn-retirer-photo");

let elementEnCours = null;      // null = création, sinon l'élément modifié
let categoriesFormulaire = [];  // catégories chargées à l'ouverture
let photoEnCours = null;        // "data:image/jpeg…" ou null

// Ouvre la fenêtre. element = null → nouvel élément.
// categorieIdParDefaut / nomParDefaut : pré-remplissage (menu, recherche…)
async function ouvrirFormulaireElement(element = null, categorieIdParDefaut = null, nomParDefaut = "") {
  elementEnCours = element;
  photoEnCours = element?.image ?? null;
  categoriesFormulaire = trierCategories(await lireTout("categories"));

  champsElement.categorieId.replaceChildren(
    ...categoriesFormulaire.map((c) => {
      const option = creer("option", null, c.nom);
      option.value = c.id;
      return option;
    })
  );

  document.getElementById("titre-dialogue").textContent = element ? "Modifier l'élément" : "Nouvel élément";
  champsElement.nom.value = element?.nom ?? nomParDefaut;
  champsElement.categorieId.value = element?.categorieId ?? categorieIdParDefaut ?? categoriesFormulaire[0]?.id;
  champsElement.tags.value = (element?.tags ?? []).join(", ");
  champsElement.description.value = element?.description ?? "";
  champsElement.sources.value = (element?.sources ?? []).join("\n");
  champsElement.notes.value = element?.notes ?? "";
  inputPhoto.value = "";

  afficherChampsSpecifiques(element ?? {});
  dessinerTags(document.getElementById("apercu-tags"), lireTags(champsElement.tags.value));
  afficherApercuPhoto();
  btnSupprimerElement.hidden = !element; // pas de « Supprimer » pour un nouvel élément
  zoneErreurElement.textContent = "";

  dlgElement.showModal();
  champsElement.nom.focus();
}

// Affiche les champs propres à la catégorie choisie (ex. Précautions)
function afficherChampsSpecifiques(valeurs) {
  const categorie = categoriesFormulaire.find((c) => c.id === champsElement.categorieId.value);
  zoneChampsSpecifiques.replaceChildren();

  for (const champ of categorie?.champs ?? []) {
    const label = creer("label", null, LIBELLES_CHAMPS[champ] ?? champ);
    const zone = creer("textarea");
    zone.name = champ;
    zone.rows = 3;
    zone.value = valeurs[champ] ?? "";
    label.append(zone);
    zoneChampsSpecifiques.append(label);
  }
}

function lireChampsSpecifiques() {
  const valeurs = {};
  zoneChampsSpecifiques.querySelectorAll("textarea").forEach((z) => (valeurs[z.name] = z.value.trim()));
  return valeurs;
}

// Aperçu : la photo si choisie, sinon l'illustration de la catégorie
function afficherApercuPhoto() {
  apercuPhoto.replaceChildren(
    imageElement({
      nom: champsElement.nom.value,
      categorieId: champsElement.categorieId.value,
      teinte: elementEnCours?.teinte,
      image: photoEnCours,
    })
  );
  btnRetirerPhoto.hidden = !photoEnCours;
}

// Changement de catégorie → champs spécifiques et illustration mis à jour
champsElement.categorieId.addEventListener("change", () => {
  afficherChampsSpecifiques({ ...(elementEnCours ?? {}), ...lireChampsSpecifiques() });
  afficherApercuPhoto();
});

champsElement.tags.addEventListener("input", () => {
  dessinerTags(document.getElementById("apercu-tags"), lireTags(champsElement.tags.value));
});

// --- Photo ---------------------------------------------
inputPhoto.addEventListener("change", async () => {
  const fichier = inputPhoto.files[0];
  if (!fichier) return;
  try {
    photoEnCours = await redimensionnerImage(fichier);
    zoneErreurElement.textContent = "";
  } catch {
    zoneErreurElement.textContent = "Cette image n'a pas pu être lue. Essayez un fichier JPG ou PNG.";
  }
  afficherApercuPhoto();
});

btnRetirerPhoto.addEventListener("click", () => {
  photoEnCours = null;
  inputPhoto.value = "";
  afficherApercuPhoto();
});

// --- Enregistrer --------------------------------------
formElement.addEventListener("submit", async (e) => {
  e.preventDefault(); // empêche le rechargement de la page

  const nom = champsElement.nom.value.trim();
  const categorieId = champsElement.categorieId.value;

  if (!nom) {
    zoneErreurElement.textContent = "Le nom est obligatoire.";
    champsElement.nom.focus();
    return;
  }

  // Pas deux éléments du même nom dans la même catégorie
  const tous = await lireTout("objets");
  const doublon = tous.some(
    (o) => o.id !== elementEnCours?.id && o.categorieId === categorieId && normaliser(o.nom) === normaliser(nom)
  );
  if (doublon) {
    zoneErreurElement.textContent = `« ${nom} » existe déjà dans cette catégorie.`;
    return;
  }

  const element = {
    ...(elementEnCours ?? {}),            // garde les autres champs existants (teinte…)
    id: elementEnCours?.id ?? genererId("obj"),
    categorieId,
    nom,
    tags: lireTags(champsElement.tags.value),
    description: champsElement.description.value.trim(),
    sources: lireLignes(champsElement.sources.value),
    notes: champsElement.notes.value.trim(),
    ...lireChampsSpecifiques(),           // ex. { precautions: "…" }
  };
  if (photoEnCours) element.image = photoEnCours;
  else delete element.image;

  try {
    await enregistrer("objets", element);
  } catch (erreur) {
    zoneErreurElement.textContent = "Enregistrement impossible : " + erreur.message;
    return;
  }

  dlgElement.close();
  // Nouvel élément → on ouvre sa fiche ; modification → on rafraîchit la vue
  if (elementEnCours) await rendre();
  else await naviguer("element", { id: element.id });
});

// --- Supprimer / Annuler -------------------------------
btnSupprimerElement.addEventListener("click", async () => {
  if (!elementEnCours) return;
  if (await supprimerElement(elementEnCours)) dlgElement.close();
});

document.getElementById("btn-annuler-element").addEventListener("click", () => dlgElement.close());
