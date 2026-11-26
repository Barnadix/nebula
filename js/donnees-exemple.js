// ======================================================
//  Nebula – données d'exemple (importées une seule fois)
// ======================================================
// 5 éléments par catégorie + 2 rituels, rédigés à partir de recherches web
// (sources listées dans chaque fiche). Les textes sont reformulés.

const CLE_EXEMPLES = "nebula.exemples.v1";

const ELEMENTS_EXEMPLE = [
  // ---------- Pierres ----------
  {
    id: "obj_ex_amethyste", categorieId: "cat_pierre", nom: "Améthyste", teinte: "#b9a1d6",
    tags: ["calme", "apaisement", "sérénité", "sommeil", "spiritualité", "clarté mentale"],
    description: "Quartz violet considéré comme la pierre de l'apaisement. On lui prête le pouvoir de calmer les tensions et les angoisses, d'éclaircir l'esprit et de favoriser un sommeil paisible ; c'est aussi une pierre de spiritualité, souvent placée en géode dans la chambre.",
    sources: [
      "https://info.fr/pierre-qui-guerit-guide-complet-de-la-lithotherapie-et-ses-bienfaits/",
      "https://info.fr/pierre-qui-guerit-vertus-utilisation-et-guide-complet/",
      "https://www.tourmag.com/tags/lithoth%C3%A9rapie/",
      "https://www.croq-kilos.com/actus/quelles-sont-les-pierres-les-plus-puissantes-un-guide-simple-pour-sy-retrouver",
      "https://www.neozone.org/mobilite/decouvrez-la-lithotherapie-le-pouvoir-des-pierres/",
    ],
    notes: "",
  },
  {
    id: "obj_ex_quartz_rose", categorieId: "cat_pierre", nom: "Quartz rose", teinte: "#f2c4c0",
    tags: ["amour", "amour de soi", "guérison émotionnelle", "compassion", "tendresse", "douceur", "amitié"],
    description: "La pierre de l'amour par excellence. Elle est associée au cœur : elle aiderait à apaiser les peines, à développer l'amour de soi et des autres, la tendresse et l'amitié. Dans la légende, sa couleur viendrait du sang d'Aphrodite.",
    sources: [
      "https://info.fr/pierre-qui-guerit-guide-complet-de-la-lithotherapie-et-ses-bienfaits/",
      "https://www.journee-mondiale.com/top-15-pierres-essentielles-lithotherapie-1781.htm",
      "https://ajluxe.com/fr/blogs/jewelry-guide/crystals-for-love",
      "https://www.univers-tibet.com/en/collections/bougies/products/bougie-green-tree-amour-quartz-rose-rose-256-g",
      "https://www.natureetdecouvertes.com/livres-loisirs/loisirs-creatifs/kits-materiel-creatifs/kit-bougie-diy-lithotherapie-quartz-rose-14131270",
      "https://www.manor.ch/fr/p/mp-30d7298a-tproduct",
    ],
    notes: "",
  },
  {
    id: "obj_ex_citrine", categorieId: "cat_pierre", nom: "Citrine", teinte: "#ecd28f",
    tags: ["abondance", "prospérité", "confiance en soi", "motivation", "créativité", "réussite"],
    description: "Quartz jaune doré, surnommé la pierre de l'abondance. Elle stimulerait la confiance, la motivation et la créativité, et aiderait à faire des choix ; on l'utilise volontiers pour attirer la réussite.",
    sources: [
      "https://info.fr/pierre-qui-guerit-guide-complet-de-la-lithotherapie-et-ses-bienfaits/",
      "https://medium.com/all-about-reiki/lithotherapy-crystals-with-healing-power-84b40bafc582",
      "https://www.croq-kilos.com/actus/quelles-sont-les-pierres-les-plus-puissantes-un-guide-simple-pour-sy-retrouver",
    ],
    notes: "Tags croisés sur 3 sources seulement : à compléter.",
  },
  {
    id: "obj_ex_tourmaline_noire", categorieId: "cat_pierre", nom: "Tourmaline noire", teinte: "#55504b",
    tags: ["protection", "ancrage", "énergies négatives", "ondes"],
    description: "Réputée comme la pierre de protection la plus puissante : elle formerait un bouclier contre les influences et énergies négatives, et on la place souvent près des écrans contre les ondes. C'est aussi une pierre d'ancrage.",
    sources: [
      "https://info.fr/pierre-qui-guerit-guide-complet-de-la-lithotherapie-et-ses-bienfaits/",
      "https://www.journee-mondiale.com/top-15-pierres-essentielles-lithotherapie-1781.htm",
      "https://ajluxe.com/fr/blogs/jewelry-guide/crystals-for-protection",
      "https://www.croq-kilos.com/actus/quelles-sont-les-pierres-les-plus-puissantes-un-guide-simple-pour-sy-retrouver",
      "https://medium.com/all-about-reiki/lithotherapy-crystals-with-healing-power-84b40bafc582",
    ],
    notes: "",
  },
  {
    id: "obj_ex_labradorite", categorieId: "cat_pierre", nom: "Labradorite", teinte: "#9fb4bf",
    tags: ["protection", "intuition", "énergies négatives", "méditation", "magie", "équilibre émotionnel"],
    description: "Pierre aux reflets irisés bleu-vert, associée à la lune et à la magie. Elle protégerait des énergies « vampirisantes » (on la conseille aux personnes empathiques et aux soignants) et développerait l'intuition ; elle accompagne bien la méditation.",
    sources: [
      "https://www.croq-kilos.com/actus/les-bienfaits-de-la-labradorite-une-pierre-de-protection-et-dequilibre",
      "https://laboutiquedubracelet.fr/en-au/blogs/le-blog-du-bracelet/la-labradorite-la-pierre-de-protection-par-excellence-pour-votre-bracelet",
      "https://www.corsojewelry.com/en/blogs/semiprecious-stones/labradorita",
      "https://www.natureetdecouvertes.com/deco-maison/parfums-interieur/encens-accessoires/coeur-obsidienne-oeil-celeste-5-cm-92192640",
      "https://momentici.com/en/products/mens-bracelet-obsidian-and-labradorite-inner-eclipse-silver",
    ],
    notes: "",
  },

  // ---------- Huiles essentielles ----------
  {
    id: "obj_ex_he_lavande", categorieId: "cat_huile", nom: "Lavande vraie", teinte: "#c9b3d9",
    tags: ["calme", "apaisement", "sommeil", "paix", "purification"],
    description: "L'huile de la détente : son parfum favorise le calme, le repos et la paix intérieure. En rituel, on l'emploie pour apaiser l'atmosphère et purifier un lieu en douceur.",
    precautions: "Généralement bien tolérée. Diluer dans une huile végétale pour la peau. Ne pas diffuser pendant le sommeil (15 min maximum dans une chambre). Femme enceinte ou allaitante, jeune enfant : demander l'avis d'un professionnel de santé.",
    sources: [
      "https://www.compagnie-des-sens.fr/utilisateurs-huiles-essentielles-diffusion",
      "https://www.futura-sciences.com/sante/questions-reponses/beaute-huiles-essentielles-mode-emploi-2666/",
      "https://www.panaprium.com/fr/blogs/i/herbal-magic-for-beginners",
      "https://www.aroma-zone.com/huiles-essentielles.html",
    ],
    notes: "",
  },
  {
    id: "obj_ex_he_oliban", categorieId: "cat_huile", nom: "Encens oliban", teinte: "#e3c9a8",
    tags: ["spiritualité", "méditation", "purification", "calme", "sacré"],
    description: "Tirée de la résine de l'arbre à encens (Boswellia), elle fait partie des huiles dites « sacrées ». Très spirituelle, elle accompagne la méditation et la prière, calme les tensions, aide à lâcher la peur de l'avenir et purifie l'atmosphère.",
    precautions: "Ne pas appliquer pure sur la peau (diluer). Ne pas avaler. Ne pas diffuser en continu (10 min maximum par demi-heure). Déconseillée chez la femme enceinte ou allaitante et chez l'enfant de moins de 7 ans.",
    sources: [
      "https://www.aroma-zone.com/info/fiche-technique/huile-essentielle-encens-oliban-aroma-zone?page=library",
      "https://www.compagnie-des-sens.fr/oliban-visage/",
      "https://hal.univ-lorraine.fr/hal-03167576/document",
      "https://www.scento.com/fr/blog/fragrance-spiritual-cleansing-practices",
      "https://www.pharmashopi.com/huile-essentielle-encens-pxl-178_458_539.html",
    ],
    notes: "",
  },
  {
    id: "obj_ex_he_ylang", categorieId: "cat_huile", nom: "Ylang-ylang", teinte: "#f0dc9a",
    tags: ["amour", "sensualité", "passion", "joie", "apaisement"],
    description: "Surnommée la « fleur des fleurs », son parfum floral et voluptueux est réputé aphrodisiaque. Elle est associée à la joie, à l'amour et à la sensualité, tout en calmant la nervosité. Ses fleurs décoraient traditionnellement le lit des jeunes mariés en Indonésie.",
    precautions: "Toujours diluer pour la peau (risque d'irritation). Déconseillée chez la femme enceinte ou allaitante et chez l'enfant de moins de 7 ans. Personnes asthmatiques : demander un avis médical.",
    sources: [
      "https://www.aroma-zone.com/page/ylang-ylang-huile-sensorielle-therapeutique-avis-pharmacienne-aromatherapeute",
      "https://www.aroma-zone.com/page/bienfaits-de-lylang-ylang",
      "https://www.compagnie-des-sens.fr/ylang-ylang-excellent-aphrodisiaque/",
      "https://www.pharma-gdd.com/fr/guide-huiles-essentielles/huile-essentielle-d-ylang-ylang",
      "https://www.compagnie-des-sens.fr/shop/product/ylang-ylang-complete-huile-essentielle-bio-208",
    ],
    notes: "",
  },
  {
    id: "obj_ex_he_menthe", categorieId: "cat_huile", nom: "Menthe poivrée", teinte: "#a9d1b8",
    tags: ["énergie", "renouveau", "clarté mentale", "motivation", "concentration"],
    description: "Huile fraîche et tonique, associée au renouveau et à l'énergie. Elle revigore le corps et l'esprit, aide à la concentration et redonne de l'élan quand la motivation baisse.",
    precautions: "Interdite chez la femme enceinte ou allaitante, l'enfant de moins de 6 ans, les personnes épileptiques ou asthmatiques (sauf avis médical). Toujours diluer (10 % maximum sur une grande surface). Éviter le contact avec les yeux.",
    sources: [
      "https://www.aroma-zone.com/info/fiche-technique/huile-essentielle-menthe-poivree-bio-aroma-zone?page=library",
      "https://www.compagnie-des-sens.fr/menthe-poivree-dangers/",
      "https://www.compagnie-des-sens.fr/menthe-poivree-dosages/",
      "https://www.panaprium.com/fr/blogs/i/herbal-magic-for-beginners",
      "https://www.panaprium.com/fr/blogs/i/how-to-make-magical-teas-infusions-and-tinctures-at-home",
    ],
    notes: "",
  },
  {
    id: "obj_ex_he_eucalyptus", categorieId: "cat_huile", nom: "Eucalyptus radié", teinte: "#b8d4cc",
    tags: ["purification", "respiration", "renouveau", "clarté", "guérison"],
    description: "Huile de l'air et du souffle : elle dégage les voies respiratoires et assainit l'atmosphère. On la retrouve dans les mélanges de purification pour « libérer » un espace et y faire entrer de l'air neuf.",
    precautions: "Riche en 1,8-cinéole : contre-indiquée chez le jeune enfant. Femme enceinte (surtout les 3 premiers mois), personnes asthmatiques ou épileptiques : demander un avis médical. Diluer pour la peau.",
    sources: [
      "https://www.natureetdecouvertes.com/deco-maison/parfums-interieur/encens-accessoires/plantes-a-rituels-mix-purification-98660960",
      "https://www.atida.fr/pranarom-huile-essentielle-eucalyptus-menthole-10ml-853358.html",
      "https://dubocalalassiette.fr/blog/sirop-huile-essentielle/",
      "https://www.compagnie-des-sens.fr/utilisateurs-huiles-essentielles-diffusion",
    ],
    notes: "Usage ésotérique peu documenté : tags surtout tirés des usages de purification.",
  },

  // ---------- Plantes ----------
  {
    id: "obj_ex_romarin", categorieId: "cat_plante", nom: "Romarin", teinte: "#9fb8d6",
    tags: ["protection", "purification", "clarté mentale", "mémoire", "concentration"],
    description: "Plante de protection et de clarté, liée depuis longtemps au souvenir et à la mémoire. Séché, il s'utilise en fumigation pour purifier la maison ; frais, on le garde à la cuisine comme gardien du foyer.",
    sources: [
      "https://www.panaprium.com/fr/blogs/i/the-mystical-properties-of-common-household-herbs",
      "https://www.panaprium.com/fr/blogs/i/top-15-magical-herbs-for-everyday-spiritual-practices",
      "https://www.panaprium.com/fr/blogs/i/plant-magic-how-to-work-with-herbs-flowers-and-trees-spiritually",
      "https://grimoire-3sj.pages.dev/encyclopedia/herbal-correspondences-spellwork",
      "https://www.rituals.com/fr-ch/mag/home-and-lifestyle/comment-purifier-l-energie-de-votre-interieur-3KtnTmmHFkQoKq8dvJRRxq",
      "https://edito.seloger.com/node/18945",
    ],
    notes: "",
  },
  {
    id: "obj_ex_sauge_blanche", categorieId: "cat_plante", nom: "Sauge blanche", teinte: "#e6e2d6",
    tags: ["purification", "protection", "énergies négatives", "sagesse", "renouveau"],
    description: "Plante sacrée de nombreuses traditions (Salvia apiana), c'est la référence de la purification par la fumée : on la brûle en bâton pour chasser les énergies lourdes ou stagnantes d'un lieu. Elle est aussi associée à la sagesse.",
    sources: [
      "https://www.panaprium.com/fr/blogs/i/herbal-magic-for-beginners",
      "https://edito.seloger.com/node/18945",
      "https://info.fr/comment-bruler-de-la-sauge-guide-pratique/",
      "https://www.scento.com/fr/blog/fragrance-spiritual-cleansing-practices",
      "https://www.habitatpresto.com/mag/renovation/dressing-rangements/nettoyage-energetique-maison",
    ],
    notes: "Préférer une sauge issue d'une filière éthique ; romarin et lavande sont de bonnes alternatives locales.",
  },
  {
    id: "obj_ex_lavande", categorieId: "cat_plante", nom: "Lavande", teinte: "#b9a1d6",
    tags: ["calme", "paix", "sommeil", "guérison émotionnelle", "purification"],
    description: "Plante de la paix et du calme émotionnel. On l'utilise avant le repos ou dans les moments de stress, en sachet, en fumigation ou dans les rituels d'apaisement.",
    sources: [
      "https://www.panaprium.com/fr/blogs/i/herbal-magic-for-beginners",
      "https://www.panaprium.com/fr/blogs/i/top-15-magical-herbs-for-everyday-spiritual-practices",
      "https://www.panaprium.com/fr/blogs/i/plant-magic-how-to-work-with-herbs-flowers-and-trees-spiritually",
      "https://www.panaprium.com/fr/blogs/i/how-to-make-magical-teas-infusions-and-tinctures-at-home",
      "https://www.rituals.com/fr-ch/mag/home-and-lifestyle/comment-purifier-l-energie-de-votre-interieur-3KtnTmmHFkQoKq8dvJRRxq",
    ],
    notes: "",
  },
  {
    id: "obj_ex_rose", categorieId: "cat_plante", nom: "Rose", teinte: "#f2b8c0",
    tags: ["amour", "beauté", "tendresse", "guérison", "intuition", "divination"],
    description: "Fleur de Vénus et de l'élément Eau, symbole de l'amour sous toutes ses formes. Ses pétales sont utilisés dans les rituels d'amour et de beauté, mais aussi pour l'intuition et la divination.",
    sources: [
      "https://mysticryst.com/blogs/the-mystic-journal/herb-magic-correspondences-50-plants-and-their-properties",
      "https://grimoire-3sj.pages.dev/encyclopedia/herbal-correspondences-spellwork",
      "https://www.panaprium.com/fr/blogs/i/how-to-make-magical-teas-infusions-and-tinctures-at-home",
      "https://www.univers-tibet.com/en/collections/bougies/products/bougie-green-tree-amour-quartz-rose-rose-256-g",
      "https://www.mindbodygreen.com/articles/spiritual-rituals-for-love",
    ],
    notes: "",
  },
  {
    id: "obj_ex_laurier", categorieId: "cat_plante", nom: "Laurier", teinte: "#c8d99a",
    tags: ["vœux", "intention", "victoire", "protection", "purification"],
    description: "Feuille de la victoire et des vœux : on écrit une intention sur une feuille de laurier et on la garde près de soi (ou on la brûle). Elle est aussi associée à la protection spirituelle et, séchée, à la purification par la fumée.",
    sources: [
      "https://www.panaprium.com/fr/blogs/i/herbal-magic-for-beginners",
      "https://www.panaprium.com/fr/blogs/i/the-mystical-properties-of-common-household-herbs",
      "https://edito.seloger.com/node/18945",
      "https://grimoire-3sj.pages.dev/encyclopedia/herbal-correspondences-spellwork",
    ],
    notes: "",
  },

  // ---------- Couleurs (bougies) ----------
  {
    id: "obj_ex_blanc", categorieId: "cat_couleur", nom: "Blanc", teinte: "#f4ede0",
    tags: ["purification", "paix", "clarté", "protection", "spiritualité", "vérité"],
    description: "La couleur universelle : pureté, paix, vérité et protection. La bougie blanche convient à toute intention et peut remplacer n'importe quelle autre couleur en cas de doute.",
    sources: [
      "https://www.panaprium.com/fr/blogs/i/candle-magic-colors-meanings-guide",
      "https://www.panaprium.com/fr/blogs/i/what-is-candle-magic-and-how-to-practice-it",
      "https://www.synonyme-du-mot.com/les-articles/quelle-bougie-pour-quel-rituel",
      "https://www.synonyme-du-mot.com/les-articles/quelle-bougie-pour-la-protection",
      "https://www.aol.com/channel-candles-witchy-powers-130000711.html",
    ],
    notes: "",
  },
  {
    id: "obj_ex_rouge", categorieId: "cat_couleur", nom: "Rouge", teinte: "#e2a59c",
    tags: ["amour", "passion", "courage", "force", "énergie", "protection"],
    description: "Couleur du feu : passion, désir, vitalité et courage. La bougie rouge sert aux rituels d'amour passionné, de force et de motivation, et aussi à la protection.",
    sources: [
      "https://www.panaprium.com/fr/blogs/i/candle-magic-colors-meanings-guide",
      "https://www.synonyme-du-mot.com/les-articles/quelle-bougie-pour-quel-rituel",
      "https://www.yahoo.com/lifestyle/candle-magic-manifestation-healing-more-110000048.html",
      "https://spells8.com/?p=3070",
      "https://www.etsy.com/fr/listing/1657375529/bougie-neuvaine-dintention",
    ],
    notes: "",
  },
  {
    id: "obj_ex_rose_couleur", categorieId: "cat_couleur", nom: "Rose", teinte: "#f2c4c8",
    tags: ["amour", "amitié", "tendresse", "amour de soi", "compassion", "réconciliation"],
    description: "L'amour doux : tendresse, affection, amitié, amour de soi et réconciliation. Plus tendre que le rouge, la bougie rose convient aussi aux liens familiaux et aux nouvelles rencontres.",
    sources: [
      "https://www.synonyme-du-mot.com/les-articles/quelle-bougie-pour-les-rituels",
      "https://www.synonyme-du-mot.com/les-articles/quelle-bougie-pour-la-protection",
      "https://www.buzzwebzine.fr/symbolique-couleurs-signification-spirituelle/",
      "https://www.yahoo.com/lifestyle/pink-candle-magic-means-spells-163919215.html",
    ],
    notes: "",
  },
  {
    id: "obj_ex_vert", categorieId: "cat_couleur", nom: "Vert", teinte: "#b5cfa8",
    tags: ["prospérité", "abondance", "argent", "chance", "croissance", "guérison", "harmonie"],
    description: "Couleur de la nature et de la croissance : prospérité, argent, chance et projets durables. La bougie verte sert aussi aux rituels de guérison et d'harmonie.",
    sources: [
      "https://www.panaprium.com/fr/blogs/i/candle-magic-colors-meanings-guide",
      "https://www.buzzwebzine.fr/couleurs-bougies-magie-significations/",
      "https://www.synonyme-du-mot.com/les-articles/quelle-bougie-pour-la-protection",
      "https://www.synonyme-du-mot.com/les-articles/quelle-bougie-pour-les-rituels",
    ],
    notes: "",
  },
  {
    id: "obj_ex_noir", categorieId: "cat_couleur", nom: "Noir", teinte: "#4f4a46",
    tags: ["protection", "bannissement", "ancrage", "énergies négatives", "lâcher-prise", "transformation"],
    description: "Souvent mal comprise, la bougie noire n'est pas « négative » : elle absorbe et neutralise. On l'utilise pour la protection, le bannissement des énergies indésirables, l'ancrage et pour clore une situation ou se libérer d'une habitude.",
    sources: [
      "https://www.centreofexcellence.com/coloured-spell-candle-meanings/",
      "https://centreofexcellence.com/black-candle-meanings/",
      "https://www.synonyme-du-mot.com/les-articles/quelle-bougie-pour-quel-rituel",
      "https://spells8.com/?p=3070",
      "https://aeternum.fr/en/collections/pratiques-rituels/products/bougie-teintee-masse-noire",
    ],
    notes: "",
  },
];

const RITUELS_EXEMPLE = [
  {
    id: "rit_ex_amour_de_soi",
    nom: "Rituel d'amour de soi à la bougie rose",
    motsCles: ["amour", "amour de soi", "tendresse", "douceur", "attraction"],
    objectif: "Ouvrir son cœur à l'amour, en commençant par l'amour de soi, en réunissant trois correspondances classiques de l'amour : la bougie rose, le quartz rose et la rose.",
    ingredients: [
      { objetId: "obj_ex_rose_couleur", quantite: "1 bougie" },
      { objetId: "obj_ex_quartz_rose", quantite: "1 pierre" },
      { objetId: "obj_ex_rose", quantite: "1 poignée de pétales" },
      { objetId: "obj_ex_he_ylang", quantite: "2 gouttes dans 1 c. à café d'huile végétale (facultatif)" },
    ],
    etapes: [
      "Choisir un moment calme, ranger et aérer la pièce, puis s'installer confortablement.",
      "Sur un papier, écrire au présent une intention d'amour, par exemple « Je m'accorde douceur et bienveillance ».",
      "Si souhaité, oindre la bougie avec l'huile d'ylang-ylang diluée, de la base vers la mèche.",
      "Disposer les pétales de rose en cercle autour de la bougie et glisser le papier plié dessous.",
      "Allumer la bougie, tenir le quartz rose contre le cœur et lire l'intention à voix haute en visualisant une lumière rose qui vous enveloppe.",
      "Rester quelques minutes en méditation, puis éteindre la bougie avec un éteignoir, ou la laisser se consumer sous surveillance.",
      "Garder le quartz rose sur soi ou près du lit dans les jours qui suivent.",
    ],
    notes: "Ne jamais laisser une bougie allumée sans surveillance. Ylang-ylang : voir les précautions de sa fiche.",
    sources: [
      "https://www.yahoo.com/lifestyle/pink-candle-magic-means-spells-163919215.html",
      "https://www.mindbodygreen.com/0-29341/a-highvibe-ritual-to-help-you-attract-the-love-you-deserve.html",
      "https://www.univers-tibet.com/en/collections/bougies/products/bougie-green-tree-amour-quartz-rose-rose-256-g",
    ],
  },
  {
    id: "rit_ex_purification_maison",
    nom: "Purification de la maison aux plantes",
    motsCles: ["purification", "protection", "maison", "énergies négatives", "renouveau"],
    objectif: "Nettoyer énergétiquement son logement en fumigeant sauge blanche, romarin et laurier, de la porte d'entrée jusqu'à la dernière pièce, puis sceller avec une bougie blanche.",
    ingredients: [
      { objetId: "obj_ex_sauge_blanche", quantite: "1 bâton" },
      { objetId: "obj_ex_romarin", quantite: "quelques branches séchées" },
      { objetId: "obj_ex_laurier", quantite: "3 feuilles séchées" },
      { objetId: "obj_ex_blanc", quantite: "1 bougie" },
    ],
    etapes: [
      "Faire le ménage et désencombrer : la purification énergétique commence par un espace propre.",
      "Ouvrir les fenêtres pour que la fumée et les énergies stagnantes puissent sortir.",
      "Formuler son intention, par exemple « Je libère cette maison de tout ce qui ne lui appartient pas ».",
      "Allumer la sauge et les herbes dans un récipient résistant à la chaleur, puis souffler doucement la flamme pour ne garder que la fumée.",
      "Commencer par la porte d'entrée, puis parcourir chaque pièce en insistant sur les coins, les portes et les fenêtres.",
      "Déposer un petit bol de gros sel dans les pièces qui semblent lourdes ; le jeter après quelques jours (pas dans l'évier).",
      "Éteindre les herbes dans le récipient, allumer la bougie blanche au centre de la maison et remercier.",
    ],
    notes: "Bien aérer. Éviter la fumigation en présence de jeunes enfants, d'animaux ou de personnes asthmatiques. Ne jamais laisser les herbes ou la bougie sans surveillance.",
    sources: [
      "https://info.fr/comment-bruler-de-la-sauge-guide-pratique/",
      "https://edito.seloger.com/node/18945",
      "https://www.habitatpresto.com/mag/renovation/dressing-rangements/nettoyage-energetique-maison",
      "https://www.mesdepanneurs.fr/blog/nettoyage-energetique-maison",
      "https://www.rituals.com/fr-ch/mag/home-and-lifestyle/comment-purifier-l-energie-de-votre-interieur-3KtnTmmHFkQoKq8dvJRRxq",
    ],
  },
];

// Importe les exemples une seule fois.
// - Un élément qui existe déjà (même nom, même catégorie) n'est pas dupliqué :
//   on complète seulement ses champs vides, et les rituels pointent vers lui.
async function importerExemples() {
  try {
    if (localStorage.getItem(CLE_EXEMPLES)) return;
  } catch { /* stockage indisponible : on continue */ }

  const existants = await lireTout("objets");
  const correspondance = {};

  for (const exemple of ELEMENTS_EXEMPLE) {
    const deja = existants.find(
      (o) => o.categorieId === exemple.categorieId && normaliser(o.nom) === normaliser(exemple.nom)
    );
    if (deja) {
      const complete = { ...deja };
      for (const [cle, valeur] of Object.entries(exemple)) {
        const vide = complete[cle] === undefined || complete[cle] === "" ||
          (Array.isArray(complete[cle]) && complete[cle].length === 0);
        if (cle !== "id" && vide) complete[cle] = valeur;
      }
      await enregistrer("objets", complete, { dater: false });
      correspondance[exemple.id] = deja.id;
    } else {
      // dater: false → l'exemple compte comme « très ancien » : sur un nouvel
      // appareil, il ne remplacera jamais une fiche modifiée sur un autre.
      await enregistrer("objets", exemple, { dater: false });
      correspondance[exemple.id] = exemple.id;
    }
  }

  const rituelsExistants = await lireTout("rituels");
  for (const rituel of RITUELS_EXEMPLE) {
    if (rituelsExistants.some((r) => normaliser(r.nom) === normaliser(rituel.nom))) continue;
    await enregistrer("rituels", {
      ...rituel,
      ingredients: rituel.ingredients.map((i) => ({ ...i, objetId: correspondance[i.objetId] ?? i.objetId })),
    }, { dater: false });
  }

  try { localStorage.setItem(CLE_EXEMPLES, new Date().toISOString()); } catch { /* ignoré */ }
}
