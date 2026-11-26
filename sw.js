// ======================================================
//  Nebula – service worker (fonctionnement hors ligne)
// ======================================================
// Un service worker est un petit programme que le navigateur garde en
// arrière-plan, entre l'app et le réseau. Il intercepte chaque demande
// de fichier (index.html, style.css, app.js…).
//
// Stratégie « réseau d'abord » :
//   - avec Internet : on prend la version la plus récente du fichier
//     et on en garde une copie dans le cache ;
//   - sans Internet : on sert la copie du cache → l'app marche hors ligne.
// Avantage : chaque mise à jour publiée est vue tout de suite, sans
// devoir changer de numéro de version à chaque modification.
//
// ⚠ Ne concerne que les fichiers de l'app (même origine). Les données
// restent dans IndexedDB ; les futurs échanges avec GitHub ne passent
// pas par ce cache.

const CACHE = "nebula-v1";

// Fichiers mis en cache dès l'installation (l'app complète)
const FICHIERS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/style.css",
  "js/db.js",
  "js/outils.js",
  "js/illustrations.js",
  "js/donnees-exemple.js",
  "js/elements.js",
  "js/fiches.js",
  "js/recherche.js",
  "js/lune.js",
  "js/sauvegarde.js",
  "js/app.js",
  "icones/icone.svg",
  "icones/icone-192.png",
  "icones/icone-512.png",
  "icones/icone-maskable-512.png",
];

// Installation : on remplit le cache
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FICHIERS)));
  self.skipWaiting(); // la nouvelle version prend la main sans attendre
});

// Activation : on supprime les anciens caches (autres numéros de version)
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((noms) => Promise.all(noms.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Chaque demande de fichier : réseau d'abord, cache en secours
self.addEventListener("fetch", (e) => {
  const requete = e.request;
  if (requete.method !== "GET" || new URL(requete.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(requete)
      .then((reponse) => {
        if (reponse.ok) {
          const copie = reponse.clone();
          caches.open(CACHE).then((cache) => cache.put(requete, copie));
        }
        return reponse;
      })
      .catch(() =>
        caches.match(requete, { ignoreSearch: true }).then((enCache) => enCache || caches.match("index.html"))
      )
  );
});
