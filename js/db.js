// ======================================================
//  Nebula – base de données locale (IndexedDB)
// ======================================================
// IndexedDB est une base de données intégrée au navigateur.
// Elle est organisée en "magasins" (object stores), l'équivalent de tables :
//   - categories : Pierres, Huiles essentielles, Plantes, Couleurs…
//   - objets     : les fiches de la base de données
//   - rituels    : les fiches de rituels
//   - recettes   : les fiches de recettes (depuis la version 2)
// Chaque enregistrement est un objet JavaScript identifié par son "id".

const DB_NOM = "nebula";
const DB_VERSION = 2; // v1 : categories, objets, rituels · v2 : + recettes

let db = null; // la connexion à la base, remplie par ouvrirBase()

// Catégories créées automatiquement au tout premier lancement
const CATEGORIES_DEFAUT = [
  { id: "cat_pierre",  nom: "Pierres",             champs: [] },
  { id: "cat_huile",   nom: "Huiles essentielles", champs: ["precautions"] },
  { id: "cat_plante",  nom: "Plantes",             champs: [] },
  { id: "cat_couleur", nom: "Couleurs",            champs: [] },
];

// --- Ouverture de la base ------------------------------
// "onupgradeneeded" ne s'exécute que lorsque la base est créée
// ou que DB_VERSION augmente : c'est là qu'on crée les magasins.
// On ne crée que ceux qui manquent : une base v1 existante reçoit juste
// le magasin "recettes", sans toucher aux données déjà enregistrées.
// (Comme une mise à jour de programme automate qui ajoute un DB sans
// réinitialiser les autres.)
function ouvrirBase() {
  return new Promise((resolve, reject) => {
    const requete = indexedDB.open(DB_NOM, DB_VERSION);

    requete.onupgradeneeded = () => {
      const base = requete.result;
      const existe = (nom) => base.objectStoreNames.contains(nom);

      if (!existe("categories")) base.createObjectStore("categories", { keyPath: "id" });

      if (!existe("objets")) {
        const objets = base.createObjectStore("objets", { keyPath: "id" });
        objets.createIndex("categorieId", "categorieId");
        // multiEntry : chaque tag du tableau est indexé séparément
        objets.createIndex("tags", "tags", { multiEntry: true });
      }

      if (!existe("rituels")) base.createObjectStore("rituels", { keyPath: "id" });
      if (!existe("recettes")) base.createObjectStore("recettes", { keyPath: "id" });
    };

    // Un autre onglet garde l'ancienne version ouverte : la mise à jour attend
    requete.onblocked = () =>
      reject(new Error("fermez les autres onglets de Nebula, puis rechargez la page (Ctrl + F5)."));

    requete.onsuccess = () => {
      db = requete.result;
      // Si un autre onglet demande une version plus récente, on libère la base
      db.onversionchange = () => db.close();
      resolve(db);
    };
    requete.onerror = () => reject(requete.error);
  });
}

// --- Outil interne -------------------------------------
// IndexedDB fonctionne avec des "événements" ; on l'enveloppe dans
// une Promise pour pouvoir écrire simplement : await lireTout("objets")
function executer(magasin, mode, action) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(magasin, mode);
    const requete = action(transaction.objectStore(magasin));
    requete.onsuccess = () => resolve(requete.result);
    requete.onerror = () => reject(requete.error);
  });
}

// --- Fonctions utilisées par le reste de l'application -
function lireTout(magasin) {
  return executer(magasin, "readonly", (store) => store.getAll());
}

function lireUn(magasin, id) {
  return executer(magasin, "readonly", (store) => store.get(id));
}

// put = ajoute si l'id n'existe pas, sinon remplace (création ET modification)
function enregistrer(magasin, element) {
  return executer(magasin, "readwrite", (store) => store.put(element));
}

function supprimer(magasin, id) {
  return executer(magasin, "readwrite", (store) => store.delete(id));
}

// Génère un identifiant unique, ex. "obj_lq2k9x3f"
function genererId(prefixe) {
  return prefixe + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Au premier lancement, la base est vide : on y met les 4 catégories
async function initialiserCategories() {
  const existantes = await lireTout("categories");
  if (existantes.length === 0) {
    for (const categorie of CATEGORIES_DEFAUT) {
      await enregistrer("categories", categorie);
    }
  }
}
