// ======================================================
//  Nebula – petits outils partagés par tous les fichiers
// ======================================================

// creer("h3", "titre", "Pierres") → <h3 class="titre">Pierres</h3>
// On utilise textContent (jamais innerHTML) pour le texte saisi :
// il est affiché tel quel, jamais interprété comme du code.
function creer(balise, classe, texte) {
  const el = document.createElement(balise);
  if (classe) el.className = classe;
  if (texte !== undefined && texte !== null) el.textContent = texte;
  return el;
}

// Crée un bouton avec son action au clic
function bouton(texte, classe, action) {
  const b = creer("button", "btn " + (classe || ""), texte);
  b.type = "button";
  if (action) b.addEventListener("click", action);
  return b;
}

// Transforme un texte SVG écrit PAR NOUS (illustrations, icônes) en élément.
// ⚠ Ne jamais y passer du texte saisi par l'utilisateur.
function svg(code) {
  const modele = document.createElement("template");
  modele.innerHTML = code.trim();
  return modele.content.firstElementChild;
}

// Tri alphabétique « à la française » (é, è, ç… bien placés)
const parNom = (a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" });

// Catégories dans l'ordre choisi par l'utilisateur (glisser-déposer du menu).
// Champ "ordre" : 0, 1, 2… ; une catégorie sans ordre va à la fin, par nom.
function trierCategories(categories) {
  const rang = (c) => (Number.isInteger(c.ordre) ? c.ordre : Infinity);
  return categories.sort((a, b) => rang(a) - rang(b) || parNom(a, b));
}

// "Énergie " → "energie" : sert à comparer sans tenir compte des accents ni majuscules
function normaliser(texte) {
  return (texte ?? "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// "Amour, protection,  amour" → ["amour", "protection"]
function lireTags(texte) {
  const tags = texte.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  return [...new Set(tags)];
}

// Une valeur par ligne, lignes vides ignorées
function lireLignes(texte) {
  return texte.split("\n").map((l) => l.trim()).filter(Boolean);
}

// Dessine des pastilles de tags. Les tags qui contiennent "terme" sont surlignés.
// Si "cliquable" est vrai, un clic sur un tag lance une recherche sur ce tag.
function dessinerTags(conteneur, tags, { terme = "", classe = "", cliquable = false, max = 0 } = {}) {
  const t = normaliser(terme);
  const liste = max ? tags.slice(0, max) : tags;
  conteneur.replaceChildren(
    ...liste.map((tag) => {
      const el = creer(cliquable ? "button" : "span", `tag ${classe}`, tag);
      if (t && normaliser(tag).includes(t)) el.classList.add("trouve");
      if (cliquable) {
        el.type = "button";
        el.title = `Rechercher « ${tag} »`;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          lancerRecherche(tag);
        });
      }
      return el;
    })
  );
  if (max && tags.length > max) conteneur.append(creer("span", `tag ${classe}`, `+${tags.length - max}`));
  return conteneur;
}

// Affiche une liste de sources ; les adresses web deviennent des liens
function listeSources(sources) {
  const ul = creer("ul", "liste-sources");
  for (const source of sources) {
    const li = creer("li");
    if (/^https?:\/\//i.test(source)) {
      const a = creer("a", null, source.replace(/^https?:\/\/(www\.)?/i, ""));
      a.href = source;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      li.append(a);
    } else {
      li.textContent = source;
    }
    ul.append(li);
  }
  return ul;
}

// --- Petites icônes (traits fins, couleur du texte) ---
const ICONES = {
  livre: '<path d="M4 5.5c3-1.2 6-1 8 .8v13c-2-1.8-5-2-8-.8zM20 5.5c-3-1.2-6-1-8 .8v13c2-1.8 5-2 8-.8z"/>',
  bocal: '<path d="M8 3h8M9 3v3c-2.5 1-4 3-4 6v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6c0-3-1.5-5-4-6V3"/><path d="M5 13h14"/>',
  tri: '<path d="M7 4v16M4 17l3 3 3-3"/><path d="M14 6h6M14 12h4M14 18h2"/>',
  mortier: '<path d="M3 11h18a9 7 0 0 1-18 0z"/><path d="M13 11l6-7"/><path d="M8 20h8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  retour: '<path d="M15 18l-6-6 6-6"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  crayon: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  croix: '<path d="M6 6l12 12M18 6L6 18"/>',
};
function icone(nom) {
  return svg(`<svg viewBox="0 0 24 24" class="icone" aria-hidden="true">${ICONES[nom]}</svg>`);
}

// Redimensionne une photo choisie par l'utilisateur (max 640 px) et la
// convertit en texte "data:image/jpeg…" que l'on peut ranger dans la base.
function redimensionnerImage(fichier, max = 640) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible"));
    };
    img.src = url;
  });
}
