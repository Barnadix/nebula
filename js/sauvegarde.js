// ======================================================
//  Nebula – sauvegarde, installation et hors ligne
// ======================================================
// - Exporter : toute la base → un fichier nebula-AAAA-MM-JJ.json
// - Importer : remplace la base de cet appareil par celle d'un fichier
// - Stockage persistant : demande au navigateur de ne jamais effacer la base
// - Service worker (sw.js) : l'app fonctionne sans Internet
// - Bouton « Installer l'app » : icône sur le bureau / l'écran d'accueil
//
// Le même format de fichier sert à la synchronisation GitHub (synchro.js).
//
// Format 1 : magasins + ordre des groupes.
// Format 2 : + suppressions (pierres tombales) + date de l'ordre des groupes.

const FORMAT_SAUVEGARDE = 2;
const MAGASINS_SAUVEGARDES = ["categories", "objets", "rituels", "recettes"];
const CLE_DERNIER_EXPORT = "nebula.dernierExport";

// --- Construire le contenu complet de la base ---------
async function exporterDonnees() {
  const magasins = {};
  for (const nom of MAGASINS_SAUVEGARDES) magasins[nom] = await lireTout(nom);
  return {
    application: "Nebula",
    format: FORMAT_SAUVEGARDE,
    exporteLe: new Date().toISOString(),
    magasins,
    suppressions: await lireTout("suppressions"),
    reglages: { ordreGroupes: lireOrdreGroupes(), ordreGroupesModifieLe: lireDateOrdreGroupes() },
  };
}

// --- Exporter : téléchargement d'un fichier .json -----
async function telechargerSauvegarde() {
  const donnees = await exporterDonnees();
  const texte = JSON.stringify(donnees, null, 2);
  const jour = donnees.exporteLe.slice(0, 10); // AAAA-MM-JJ

  // Blob = fichier créé en mémoire ; un lien <a download> le fait télécharger
  const url = URL.createObjectURL(new Blob([texte], { type: "application/json" }));
  const lien = creer("a");
  lien.href = url;
  lien.download = `nebula-${jour}.json`;
  document.body.append(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  try { localStorage.setItem(CLE_DERNIER_EXPORT, donnees.exporteLe); } catch { /* ignoré */ }
  afficherEtatStockage();
}

// --- Contrôle d'un fichier avant import ---------------
// Renvoie un message d'erreur, ou null si le fichier est valide.
function verifierSauvegarde(donnees) {
  if (!donnees || donnees.application !== "Nebula" || typeof donnees.magasins !== "object") {
    return "Ce fichier n'est pas une sauvegarde de Nebula.";
  }
  if (donnees.format > FORMAT_SAUVEGARDE) {
    return "Cette sauvegarde vient d'une version plus récente de Nebula : mettez l'app à jour.";
  }
  for (const nom of MAGASINS_SAUVEGARDES) {
    const liste = donnees.magasins[nom] ?? [];
    if (!Array.isArray(liste) || liste.some((x) => !x || typeof x.id !== "string")) {
      return `Fichier abîmé (partie « ${nom} »).`;
    }
  }
  const suppressions = donnees.suppressions ?? [];
  if (!Array.isArray(suppressions) || suppressions.some((s) => !s || typeof s.cle !== "string")) {
    return "Fichier abîmé (partie « suppressions »).";
  }
  return null;
}

// --- Remplacer toute la base, en UNE transaction ------
// Tout ou rien : si une écriture échoue, rien n'est modifié
// (comme une recette de production validée d'un bloc).
function remplacerBase(donnees) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([...MAGASINS_SAUVEGARDES, "suppressions"], "readwrite");
    for (const nom of MAGASINS_SAUVEGARDES) {
      const store = transaction.objectStore(nom);
      store.clear();
      for (const enregistrement of donnees.magasins[nom] ?? []) store.put(enregistrement);
    }
    const suppressions = transaction.objectStore("suppressions");
    suppressions.clear();
    for (const s of donnees.suppressions ?? []) suppressions.put(s);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error("Import annulé"));
  });
}

async function importerFichier(fichier) {
  let donnees;
  try {
    donnees = JSON.parse(await fichier.text());
  } catch {
    alert("Ce fichier n'est pas lisible (JSON invalide).");
    return;
  }
  const erreur = verifierSauvegarde(donnees);
  if (erreur) {
    alert(erreur);
    return;
  }

  const m = donnees.magasins;
  const date = donnees.exporteLe ? new Date(donnees.exporteLe).toLocaleString("fr-FR") : "date inconnue";
  const ok = confirm(
    `Importer la sauvegarde du ${date} ?\n\n` +
    `• ${(m.objets ?? []).length} éléments · ${(m.rituels ?? []).length} rituels · ` +
    `${(m.recettes ?? []).length} recettes · ${(m.categories ?? []).length} catégories\n\n` +
    "⚠ Toutes les données actuelles de cet appareil seront REMPLACÉES.\n" +
    "Conseil : cliquez d'abord sur « Exporter » pour garder une copie." +
    (synchroConfiguree() ? "\n\nSynchronisation active : les fiches plus récentes sur GitHub seront ensuite conservées." : "")
  );
  if (!ok) return;

  try {
    await remplacerBase(donnees);
  } catch (e) {
    alert("L'import a échoué, aucune donnée n'a été modifiée.\n" + e.message);
    return;
  }
  if (Array.isArray(donnees.reglages?.ordreGroupes)) {
    enregistrerOrdreGroupes(donnees.reglages.ordreGroupes, Number(donnees.reglages.ordreGroupesModifieLe) || 0);
  }
  try { localStorage.setItem(CLE_EXEMPLES, "importé"); } catch { /* les exemples ne seront pas réimportés */ }
  signalerModification(); // la synchro (si active) fusionne avec GitHub

  historique.length = 0;
  await naviguer("rituels");
  alert("Import terminé.");
}

// --- État du stockage (bas du menu) -------------------
async function afficherEtatStockage() {
  const zone = document.getElementById("etat-stockage");
  if (!zone) return;
  const protege = (await navigator.storage?.persisted?.()) ?? false;
  let texte = protege ? "Données protégées sur cet appareil" : "Données enregistrées sur cet appareil";

  let dernier = null;
  try { dernier = localStorage.getItem(CLE_DERNIER_EXPORT); } catch { /* ignoré */ }
  if (dernier) {
    const jours = Math.floor((Date.now() - new Date(dernier)) / 86400000);
    texte += " · export " + (jours === 0 ? "aujourd'hui" : jours === 1 ? "hier" : `il y a ${jours} jours`);
  }
  zone.textContent = texte;
}

// --- Installation de l'app (Chrome / Edge / Android) ---
// Chrome annonce qu'une installation est possible avec l'événement
// "beforeinstallprompt" : on le garde de côté et on montre notre bouton.
let demandeInstallation = null;
const btnInstaller = document.getElementById("btn-installer");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  demandeInstallation = e;
  btnInstaller.hidden = false;
});
btnInstaller.addEventListener("click", async () => {
  if (!demandeInstallation) return;
  demandeInstallation.prompt();
  await demandeInstallation.userChoice;
  demandeInstallation = null;
  btnInstaller.hidden = true;
});
window.addEventListener("appinstalled", () => (btnInstaller.hidden = true));

// --- Boutons Exporter / Importer -----------------------
const inputImport = document.getElementById("input-import");
document.getElementById("btn-exporter").addEventListener("click", telechargerSauvegarde);
document.getElementById("btn-importer").addEventListener("click", () => inputImport.click());
inputImport.addEventListener("change", async () => {
  const fichier = inputImport.files[0];
  inputImport.value = ""; // permet de réimporter le même fichier plus tard
  if (fichier) await importerFichier(fichier);
});

// --- Au démarrage : hors ligne + stockage persistant ---
// (appelé par app.js une fois la base ouverte)
async function preparerAppHorsLigne() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch((e) => console.warn("Service worker non installé :", e));
  }
  try { await navigator.storage?.persist?.(); } catch { /* non disponible */ }
  afficherEtatStockage();
}
