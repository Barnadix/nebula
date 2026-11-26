// ======================================================
//  Nebula – synchronisation automatique via GitHub
// ======================================================
// La base de chaque appareil (PC, tablette) est copiée dans UN fichier
// "nebula.json" d'un dépôt GitHub PRIVÉ. À chaque synchronisation :
//   1. on lit le fichier sur GitHub (avec son « sha » = son numéro de version) ;
//   2. on le FUSIONNE avec la base locale, fiche par fiche : la version la plus
//      récente (modifieLe) gagne ; une suppression plus récente l'emporte ;
//   3. on applique le résultat à la base locale ;
//   4. on écrit le résultat sur GitHub en donnant le sha lu en 1.
//      Si un autre appareil a écrit entre-temps, GitHub REFUSE (le sha ne
//      correspond plus) → on recommence à l'étape 1. Rien n'est jamais écrasé
//      sans avoir été fusionné. (Comme un verrouillage optimiste en base de données.)
//
// La clé d'accès est saisie par l'utilisateur et gardée sur l'appareil
// (localStorage). Elle n'est jamais écrite dans le code ni dans GitHub.

const CLE_CONFIG_SYNCHRO = "nebula.synchro";
const FICHIER_SYNCHRO = "nebula.json";
const API_GITHUB = "https://api.github.com";
const DELAI_APRES_MODIFICATION = 4000;      // ms : regroupe plusieurs modifications rapides
const INTERVALLE_SYNCHRO = 5 * 60 * 1000;   // ms : vérification régulière quand l'app est affichée

let synchroEnCours = false;
let synchroRedemandee = false;
let minuterieSynchro = null;
let derniereSynchro = 0;

// ======================================================
//  Configuration (propriétaire, dépôt, clé)
// ======================================================
function lireConfigSynchro() {
  try {
    const c = JSON.parse(localStorage.getItem(CLE_CONFIG_SYNCHRO));
    return c?.cle && c?.proprietaire && c?.depot ? c : null;
  } catch {
    return null;
  }
}
const synchroConfiguree = () => lireConfigSynchro() !== null;

// ======================================================
//  Appels à l'API GitHub
// ======================================================
class ErreurSynchro extends Error {}

async function appelGitHub(config, chemin, { methode = "GET", accept = "application/vnd.github+json", corps } = {}) {
  let reponse;
  try {
    reponse = await fetch(API_GITHUB + chemin, {
      method: methode,
      cache: "no-store",
      headers: {
        Authorization: "Bearer " + config.cle,
        Accept: accept,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(corps ? { "Content-Type": "application/json" } : {}),
      },
      body: corps ? JSON.stringify(corps) : undefined,
    });
  } catch {
    throw new ErreurSynchro("GitHub injoignable (pas d'Internet ?)");
  }
  if (reponse.status === 401) throw new ErreurSynchro("clé d'accès refusée ou expirée");
  return reponse;
}

const cheminFichier = (c) =>
  `/repos/${encodeURIComponent(c.proprietaire)}/${encodeURIComponent(c.depot)}/contents/${FICHIER_SYNCHRO}`;

// Vérifie la configuration : le dépôt existe, la clé y a accès, et il est PRIVÉ
async function verifierConfigSynchro(config) {
  const r = await appelGitHub(config, `/repos/${encodeURIComponent(config.proprietaire)}/${encodeURIComponent(config.depot)}`);
  if (r.status === 404) throw new ErreurSynchro("dépôt introuvable, ou la clé n'y a pas accès");
  if (!r.ok) throw new ErreurSynchro(`réponse inattendue de GitHub (${r.status})`);
  const depot = await r.json();
  if (!depot.private) {
    throw new ErreurSynchro("ce dépôt est PUBLIC : tes données seraient visibles par tout le monde. Rends-le privé (Settings → Danger Zone → Change visibility).");
  }
  if (depot.permissions && !depot.permissions.push) {
    throw new ErreurSynchro("la clé ne permet pas d'écrire (Contents : Read and write)");
  }
}

// Lit nebula.json → { donnees, sha }. Fichier absent → { donnees: null, sha: null }.
// 1) les métadonnées donnent le sha ; 2) le contenu est lu PAR CE sha (API « blobs »),
// ce qui garantit que contenu et sha correspondent, même pour un gros fichier (photos).
async function lireDistant(config) {
  const meta = await appelGitHub(config, cheminFichier(config));
  if (meta.status === 404) return { donnees: null, sha: null };
  if (!meta.ok) throw new ErreurSynchro(`lecture impossible (${meta.status})`);
  const { sha } = await meta.json();

  const blob = await appelGitHub(
    config,
    `/repos/${encodeURIComponent(config.proprietaire)}/${encodeURIComponent(config.depot)}/git/blobs/${sha}`,
    { accept: "application/vnd.github.raw+json" }
  );
  if (!blob.ok) throw new ErreurSynchro(`lecture du contenu impossible (${blob.status})`);
  let donnees;
  try {
    donnees = JSON.parse(await blob.text());
  } catch {
    throw new ErreurSynchro("le fichier nebula.json sur GitHub est illisible");
  }
  const erreur = verifierSauvegarde(donnees);
  if (erreur) throw new ErreurSynchro("fichier GitHub refusé : " + erreur);
  return { donnees, sha };
}

// Texte → base64 (format exigé par GitHub), accents compris
function versBase64(texte) {
  const octets = new TextEncoder().encode(texte);
  let binaire = "";
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(binaire);
}

// Écrit nebula.json. Renvoie false si GitHub refuse pour conflit (sha périmé).
async function ecrireDistant(config, donnees, sha) {
  const appareil = /Android/i.test(navigator.userAgent) ? "tablette" : "PC";
  const r = await appelGitHub(config, cheminFichier(config), {
    methode: "PUT",
    corps: {
      message: `Synchronisation depuis ${appareil} – ${new Date().toLocaleString("fr-FR")}`,
      content: versBase64(JSON.stringify(donnees)),
      ...(sha ? { sha } : {}),
    },
  });
  if (r.status === 409 || r.status === 422) return false; // quelqu'un a écrit entre-temps
  if (!r.ok) throw new ErreurSynchro(`écriture impossible (${r.status})`);
  return true;
}

// ======================================================
//  Fusion (fonction « pure » : ne touche ni à la base ni au réseau)
// ======================================================
const dateFiche = (f) => Number(f?.modifieLe) || 0;

function fusionnerDonnees(local, distant) {
  // Pierres tombales : on garde la plus récente pour chaque fiche
  const suppressions = new Map();
  for (const s of [...(local.suppressions ?? []), ...(distant?.suppressions ?? [])]) {
    const deja = suppressions.get(s.cle);
    if (!deja || s.supprimeLe > deja.supprimeLe) suppressions.set(s.cle, s);
  }

  const magasins = {};
  for (const nom of MAGASINS_SAUVEGARDES) {
    // On part de la version GitHub, puis chaque fiche locale STRICTEMENT plus
    // récente la remplace (à égalité, GitHub gagne : c'est la version partagée).
    const parId = new Map();
    for (const f of distant?.magasins?.[nom] ?? []) parId.set(f.id, f);
    for (const f of local.magasins[nom] ?? []) {
      const autre = parId.get(f.id);
      if (!autre || dateFiche(f) > dateFiche(autre)) parId.set(f.id, f);
    }

    magasins[nom] = [];
    for (const [id, fiche] of parId) {
      const tombe = suppressions.get(`${nom}:${id}`);
      if (tombe && tombe.supprimeLe >= dateFiche(fiche)) continue; // supprimée après sa dernière modification
      if (tombe) suppressions.delete(`${nom}:${id}`);              // modifiée APRÈS la suppression : elle revit
      magasins[nom].push(fiche);
    }
    magasins[nom].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  // Réglage « ordre des groupes du menu » : le plus récent gagne
  const rl = local.reglages ?? {}, rd = distant?.reglages ?? {};
  const reglages = (Number(rd.ordreGroupesModifieLe) || 0) > (Number(rl.ordreGroupesModifieLe) || 0) ? rd : rl;

  return {
    application: "Nebula",
    format: FORMAT_SAUVEGARDE,
    exporteLe: new Date().toISOString(),
    magasins,
    suppressions: [...suppressions.values()].sort((a, b) => (a.cle < b.cle ? -1 : 1)),
    reglages: { ordreGroupes: reglages.ordreGroupes, ordreGroupesModifieLe: Number(reglages.ordreGroupesModifieLe) || 0 },
  };
}

// « Empreinte » comparable de deux jeux de données (sans la date d'export)
function empreinte(d) {
  if (!d) return "";
  const trier = (l, cle) => [...(l ?? [])].sort((a, b) => (a[cle] < b[cle] ? -1 : a[cle] > b[cle] ? 1 : 0));
  const magasins = {};
  for (const nom of MAGASINS_SAUVEGARDES) magasins[nom] = trier(d.magasins?.[nom], "id");
  return JSON.stringify({
    magasins,
    suppressions: trier(d.suppressions, "cle"),
    ordre: d.reglages?.ordreGroupes ?? null,
    ordreDate: Number(d.reglages?.ordreGroupesModifieLe) || 0,
  });
}

// ======================================================
//  Appliquer la fusion à la base locale (une transaction)
// ======================================================
// On n'écrase PAS une fiche locale modifiée pendant la synchronisation :
// dans la transaction, on relit la base et on n'écrit que ce qui est plus récent.
// Renvoie true si la base locale a changé (→ il faut redessiner l'écran).
function appliquerFusion(fusion) {
  return new Promise((resolve, reject) => {
    const noms = [...MAGASINS_SAUVEGARDES, "suppressions"];
    const transaction = db.transaction(noms, "readwrite");
    let change = false;
    const tombes = new Map(fusion.suppressions.map((s) => [s.cle, s]));

    for (const nom of MAGASINS_SAUVEGARDES) {
      const store = transaction.objectStore(nom);
      const requete = store.getAll();
      requete.onsuccess = () => {
        const actuels = new Map(requete.result.map((f) => [f.id, f]));
        const voulus = new Map(fusion.magasins[nom].map((f) => [f.id, f]));

        for (const [id, fiche] of voulus) {
          const actuelle = actuels.get(id);
          const differente = !actuelle || JSON.stringify(actuelle) !== JSON.stringify(fiche);
          if (differente && dateFiche(actuelle) <= dateFiche(fiche)) {
            store.put(fiche);
            change = true;
          }
        }
        for (const [id, actuelle] of actuels) {
          if (voulus.has(id)) continue;
          const tombe = tombes.get(`${nom}:${id}`);
          // Supprimée ailleurs (et pas modifiée ici depuis) → on supprime.
          // Sinon c'est une fiche créée pendant la synchro : on la garde (prochaine synchro).
          if (tombe && tombe.supprimeLe >= dateFiche(actuelle)) {
            store.delete(id);
            change = true;
          }
        }
      };
    }
    const storeTombes = transaction.objectStore("suppressions");
    for (const s of fusion.suppressions) storeTombes.put(s);

    transaction.oncomplete = () => resolve(change);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error("synchronisation annulée"));
  });
}

// ======================================================
//  La synchronisation complète
// ======================================================
async function synchroniser() {
  const config = lireConfigSynchro();
  if (!config) return afficherEtatSynchro();
  if (!navigator.onLine) return afficherEtatSynchro("attente", "Hors ligne · synchro au retour du réseau");
  if (synchroEnCours) {
    synchroRedemandee = true; // une modification pendant la synchro : on refera un tour
    return;
  }

  synchroEnCours = true;
  clearTimeout(minuterieSynchro);
  minuterieSynchro = null;
  afficherEtatSynchro("encours", "Synchronisation…");

  try {
    let reussi = false;
    for (let essai = 1; essai <= 3 && !reussi; essai++) {
      const distant = await lireDistant(config);
      const local = await exporterDonnees();
      const fusion = fusionnerDonnees(local, distant.donnees);

      const localAChange = await appliquerFusion(fusion);
      if (fusion.reglages.ordreGroupesModifieLe > lireDateOrdreGroupes() && Array.isArray(fusion.reglages.ordreGroupes)) {
        enregistrerOrdreGroupes(fusion.reglages.ordreGroupes, fusion.reglages.ordreGroupesModifieLe);
      }

      reussi = empreinte(fusion) === empreinte(distant.donnees) || (await ecrireDistant(config, fusion, distant.sha));
      if (localAChange) await rendre(); // affiche ce qui vient de l'autre appareil
    }
    if (!reussi) throw new ErreurSynchro("trop de conflits, nouvel essai plus tard");

    derniereSynchro = Date.now();
    afficherEtatSynchro("ok", "Synchronisé à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
  } catch (e) {
    console.warn("Synchronisation :", e);
    afficherEtatSynchro("erreur", "Synchro impossible : " + (e instanceof ErreurSynchro ? e.message : e.message || "erreur inconnue"));
  } finally {
    synchroEnCours = false;
    if (synchroRedemandee) {
      synchroRedemandee = false;
      programmerSynchro(500);
    }
  }
}

function programmerSynchro(delai = DELAI_APRES_MODIFICATION) {
  if (!synchroConfiguree()) return;
  clearTimeout(minuterieSynchro);
  minuterieSynchro = setTimeout(() => {
    minuterieSynchro = null; // plus rien en attente
    synchroniser();
  }, delai);
}

// Appelée par db.js après chaque enregistrement / suppression
function surModificationBase() {
  if (!synchroConfiguree()) return;
  if (synchroEnCours) synchroRedemandee = true;
  else {
    afficherEtatSynchro("attente", "Modifications en attente de synchro…");
    programmerSynchro();
  }
}

// ======================================================
//  Affichage de l'état (bas du menu)
// ======================================================
function afficherEtatSynchro(type = null, texte = null) {
  const zone = document.getElementById("etat-synchro");
  if (!zone) return;
  if (!synchroConfiguree()) {
    type = "off";
    texte = "Synchronisation non configurée";
  }
  zone.className = "etat-synchro " + (type ?? "");
  zone.textContent = texte ?? "";
}

// ======================================================
//  Fenêtre « Synchronisation »
// ======================================================
const dlgSynchro = document.getElementById("dialogue-synchro");
const formSynchro = document.getElementById("form-synchro");
const champsSynchro = formSynchro.elements;
const zoneMessageSynchro = document.getElementById("message-synchro");

function ouvrirFenetreSynchro() {
  const config = lireConfigSynchro();
  // Propriétaire proposé d'après l'adresse (barnadix.github.io → barnadix)
  const pseudoAdresse = location.hostname.endsWith(".github.io") ? location.hostname.split(".")[0] : "";
  champsSynchro.proprietaire.value = config?.proprietaire ?? pseudoAdresse;
  champsSynchro.depot.value = config?.depot ?? "nebula-donnees";
  champsSynchro.cle.value = "";
  champsSynchro.cle.placeholder = config ? "•••••• (clé enregistrée — laisser vide pour la garder)" : "github_pat_…";
  document.getElementById("btn-deconnecter-synchro").hidden = !config;
  zoneMessageSynchro.textContent = "";
  zoneMessageSynchro.className = "message-synchro";
  dlgSynchro.showModal();
}

formSynchro.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ancienne = lireConfigSynchro();
  const config = {
    proprietaire: champsSynchro.proprietaire.value.trim(),
    depot: champsSynchro.depot.value.trim(),
    cle: champsSynchro.cle.value.trim() || ancienne?.cle || "",
  };
  if (!config.proprietaire || !config.depot || !config.cle) {
    zoneMessageSynchro.textContent = "Les trois champs sont nécessaires.";
    zoneMessageSynchro.className = "message-synchro erreur";
    return;
  }

  zoneMessageSynchro.textContent = "Vérification auprès de GitHub…";
  zoneMessageSynchro.className = "message-synchro";
  try {
    await verifierConfigSynchro(config);
  } catch (erreur) {
    zoneMessageSynchro.textContent = "✗ " + erreur.message;
    zoneMessageSynchro.className = "message-synchro erreur";
    return;
  }

  try { localStorage.setItem(CLE_CONFIG_SYNCHRO, JSON.stringify(config)); } catch { /* ignoré */ }
  dlgSynchro.close();
  await synchroniser();
});

document.getElementById("btn-deconnecter-synchro").addEventListener("click", () => {
  if (!confirm("Arrêter la synchronisation sur cet appareil ?\nLa clé d'accès sera effacée de cet appareil. Tes données restent ici et sur GitHub.")) return;
  try { localStorage.removeItem(CLE_CONFIG_SYNCHRO); } catch { /* ignoré */ }
  dlgSynchro.close();
  afficherEtatSynchro();
});
document.getElementById("btn-annuler-synchro").addEventListener("click", () => dlgSynchro.close());
document.getElementById("btn-synchro").addEventListener("click", ouvrirFenetreSynchro);
document.getElementById("etat-synchro").addEventListener("click", () => {
  if (synchroConfiguree()) synchroniser();
  else ouvrirFenetreSynchro();
});

// ======================================================
//  Déclencheurs automatiques
// ======================================================
window.addEventListener("online", () => programmerSynchro(500));
window.addEventListener("offline", () => afficherEtatSynchro("attente", "Hors ligne · synchro au retour du réseau"));
document.addEventListener("visibilitychange", () => {
  if (!synchroConfiguree()) return;
  if (document.visibilityState === "hidden") {
    if (minuterieSynchro) synchroniser();               // on quitte l'app : on envoie tout de suite
  } else if (Date.now() - derniereSynchro > 30000) {
    programmerSynchro(300);                              // retour dans l'app : on récupère les nouveautés
  }
});
setInterval(() => {
  if (document.visibilityState === "visible") programmerSynchro(0);
}, INTERVALLE_SYNCHRO);

// Appelée par app.js au démarrage (base ouverte)
function demarrerSynchro() {
  afficherEtatSynchro();
  if (synchroConfiguree()) synchroniser();
}
