export interface GenericPresetItem {
  id: string;
  name: string;
  category: string;
  icon: string;
  defaultQty: number;
  tags: string[];
  description?: string;
  colorHint?: string;
  imageUrl?: string;
}

export const PRESET_COLOR_SWATCHES = [
  { label: "Bleu", value: "#3b82f6", hex: "#3b82f6" },
  { label: "Marine", value: "#1e3a8a", hex: "#1e3a8a" },
  { label: "Noir", value: "#1e293b", hex: "#1e293b" },
  { label: "Blanc", value: "#f8fafc", hex: "#f8fafc" },
  { label: "Gris", value: "#64748b", hex: "#64748b" },
  { label: "Rouge", value: "#ef4444", hex: "#ef4444" },
  { label: "Vert", value: "#10b981", hex: "#10b981" },
  { label: "Kaki", value: "#4d7c0f", hex: "#4d7c0f" },
  { label: "Jaune", value: "#f59e0b", hex: "#f59e0b" },
  { label: "Orange", value: "#f97316", hex: "#f97316" },
  { label: "Violet", value: "#8b5cf6", hex: "#8b5cf6" },
  { label: "Rose", value: "#ec4899", hex: "#ec4899" },
  { label: "Cyan", value: "#06b6d4", hex: "#06b6d4" },
  { label: "Marron", value: "#78350f", hex: "#78350f" }
];

export const GENERIC_PRESET_CATEGORIES = [
  "Tous",
  "Vêtements",
  "Chaussures & Accessoires",
  "Toilette & Hygiène",
  "Santé & Pharmacie",
  "Électronique & Câbles",
  "Matériel Régie & Technique",
  "Documents & Sécurité",
  "Voyage & Confort"
] as const;

export const GENERIC_PRESETS: GenericPresetItem[] = [
  // --- VÊTEMENTS ---
  {
    id: "preset_tshirt",
    name: "T-shirt",
    category: "Vêtements",
    icon: "👕",
    defaultQty: 2,
    tags: ["Indispensable", "Été"],
    description: "T-shirt en coton classique",
    colorHint: "#3b82f6"
  },
  {
    id: "preset_chemise",
    name: "Chemise / Chemisette",
    category: "Vêtements",
    icon: "👔",
    defaultQty: 1,
    tags: ["Prestige"],
    description: "Chemise habillée ou décontractée",
    colorHint: "#0ea5e9"
  },
  {
    id: "preset_jean",
    name: "Jean / Pantalon denim",
    category: "Vêtements",
    icon: "👖",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "Pantalon jean résistant",
    colorHint: "#1d4ed8"
  },
  {
    id: "preset_jogging",
    name: "Pantalon confortable / Jogging",
    category: "Vêtements",
    icon: "👖",
    defaultQty: 1,
    tags: [],
    description: "Pour les trajets ou le repos",
    colorHint: "#64748b"
  },
  {
    id: "preset_short",
    name: "Short / Bermuda",
    category: "Vêtements",
    icon: "🩳",
    defaultQty: 1,
    tags: ["Été"],
    description: "Short léger en toile",
    colorHint: "#fbbf24"
  },
  {
    id: "preset_calecon",
    name: "Sous-vêtements / Boxers",
    category: "Vêtements",
    icon: "🩲",
    defaultQty: 3,
    tags: ["Indispensable"],
    description: "Sous-vêtements quotidiens",
    colorHint: "#93c5fd"
  },
  {
    id: "preset_chaussettes",
    name: "Paires de chaussettes",
    category: "Vêtements",
    icon: "🧦",
    defaultQty: 3,
    tags: ["Indispensable"],
    description: "Chaussettes confortables",
    colorHint: "#cbd5e1"
  },
  {
    id: "preset_pull",
    name: "Pull / Sweat chaud",
    category: "Vêtements",
    icon: "🧥",
    defaultQty: 1,
    tags: ["Hiver"],
    description: "Sweat-shirt ou tricot chaud",
    colorHint: "#a855f7"
  },
  {
    id: "preset_veste",
    name: "Veste imperméable / Manteau",
    category: "Vêtements",
    icon: "🧥",
    defaultQty: 1,
    tags: ["Hiver", "Indispensable"],
    description: "Coupe-vent ou doudoune",
    colorHint: "#475569"
  },
  {
    id: "preset_pyjama",
    name: "Pyjama / Tenue de nuit",
    category: "Vêtements",
    icon: "👕",
    defaultQty: 1,
    tags: [],
    description: "Vêtements de nuit légers",
    colorHint: "#e2e8f0"
  },
  {
    id: "preset_maillot_bain",
    name: "Maillot de bain",
    category: "Vêtements",
    icon: "🩱",
    defaultQty: 1,
    tags: ["Été"],
    description: "Short de bain ou maillot",
    colorHint: "#06b6d4"
  },

  // --- CHAUSSURES & ACCESSOIRES ---
  {
    id: "preset_baskets",
    name: "Baskets de marche / Sneakers",
    category: "Chaussures & Accessoires",
    icon: "👟",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "Chaussures de marche confortables",
    colorHint: "#22c55e"
  },
  {
    id: "preset_chaussures_ville",
    name: "Chaussures de ville / Habillées",
    category: "Chaussures & Accessoires",
    icon: "👞",
    defaultQty: 1,
    tags: ["Prestige"],
    description: "Chaussures élégantes",
    colorHint: "#78350f"
  },
  {
    id: "preset_tongs",
    name: "Tongs / Sandales / Claquettes",
    category: "Chaussures & Accessoires",
    icon: "🩴",
    defaultQty: 1,
    tags: ["Été"],
    description: "Pour la plage ou la douche",
    colorHint: "#f97316"
  },
  {
    id: "preset_casquette",
    name: "Casquette / Chapeau",
    category: "Chaussures & Accessoires",
    icon: "🧢",
    defaultQty: 1,
    tags: ["Été"],
    description: "Protection solaire de tête",
    colorHint: "#ef4444"
  },
  {
    id: "preset_bonnet",
    name: "Bonnet chaud & Écharpe",
    category: "Chaussures & Accessoires",
    icon: "🧣",
    defaultQty: 1,
    tags: ["Hiver"],
    description: "Protection contre le grand froid",
    colorHint: "#dc2626"
  },
  {
    id: "preset_lunettes_soleil",
    name: "Lunettes de soleil + étui",
    category: "Chaussures & Accessoires",
    icon: "🕶️",
    defaultQty: 1,
    tags: ["Fragile", "Été", "Indispensable"],
    description: "Protection UV avec étui rigide",
    colorHint: "#0f172a"
  },
  {
    id: "preset_ceinture",
    name: "Ceinture",
    category: "Chaussures & Accessoires",
    icon: "👔",
    defaultQty: 1,
    tags: [],
    description: "Ceinture en cuir ou tissu",
    colorHint: "#451a03"
  },
  {
    id: "preset_parapluie",
    name: "Parapluie pliant compact",
    category: "Chaussures & Accessoires",
    icon: "🌂",
    defaultQty: 1,
    tags: [],
    description: "Parapluie de poche résistant au vent",
    colorHint: "#334155"
  },

  // --- TOILETTE & HYGIÈNE ---
  {
    id: "preset_brosse_dents",
    name: "Brosse à dents & Dentifrice",
    category: "Toilette & Hygiène",
    icon: "🪥",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "Brosse avec étui de voyage et tube",
    colorHint: "#38bdf8"
  },
  {
    id: "preset_gel_douche",
    name: "Gel douche / Savon solide",
    category: "Toilette & Hygiène",
    icon: "🧼",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "Savon corporel flacon de voyage",
    colorHint: "#10b981"
  },
  {
    id: "preset_shampoing",
    name: "Shampoing format voyage",
    category: "Toilette & Hygiène",
    icon: "🧴",
    defaultQty: 1,
    tags: [],
    description: "Flacon < 100ml pour avion",
    colorHint: "#14b8a6"
  },
  {
    id: "preset_deodorant",
    name: "Déodorant (stick / bille)",
    category: "Toilette & Hygiène",
    icon: "🧴",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "Déodorant sans gaz pressurisé",
    colorHint: "#8b5cf6"
  },
  {
    id: "preset_creme_solaire",
    name: "Crème solaire haute protection",
    category: "Toilette & Hygiène",
    icon: "🧴",
    defaultQty: 1,
    tags: ["Été"],
    description: "Protection indice 50+",
    colorHint: "#f59e0b"
  },
  {
    id: "preset_rasoir",
    name: "Rasoir & Mousse de voyage",
    category: "Toilette & Hygiène",
    icon: "🪒",
    defaultQty: 1,
    tags: [],
    description: "Rasoir manuel ou tondeuse compacte",
    colorHint: "#64748b"
  },
  {
    id: "preset_serviette",
    name: "Serviette microfibre séchage rapide",
    category: "Toilette & Hygiène",
    icon: "🧖",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "Compacte et très légère",
    colorHint: "#0284c7"
  },
  {
    id: "preset_peigne",
    name: "Peigne / Brosse à cheveux",
    category: "Toilette & Hygiène",
    icon: "🪮",
    defaultQty: 1,
    tags: [],
    description: "Brosse compacte de voyage",
    colorHint: "#d97706"
  },
  {
    id: "preset_cotons_mouchoirs",
    name: "Mouchoirs & Cotons-tiges",
    category: "Toilette & Hygiène",
    icon: "🧻",
    defaultQty: 2,
    tags: [],
    description: "Paquets individuels de poche",
    colorHint: "#f1f5f9"
  },

  // --- SANTÉ & PHARMACIE ---
  {
    id: "preset_doliprane",
    name: "Paracétamol / Doliprane",
    category: "Santé & Pharmacie",
    icon: "💊",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "Boîte de comprimés 1000mg",
    colorHint: "#f43f5e"
  },
  {
    id: "preset_pansements",
    name: "Pansements & Antiseptique",
    category: "Santé & Pharmacie",
    icon: "🩹",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "Trousse premiers soins pour ampoules et coupures",
    colorHint: "#fb7185"
  },
  {
    id: "preset_antimoustique",
    name: "Spray anti-moustiques",
    category: "Santé & Pharmacie",
    icon: "🦟",
    defaultQty: 1,
    tags: ["Été"],
    description: "Répulsif zones tempérées/tropicales",
    colorHint: "#84cc16"
  },
  {
    id: "preset_medicaments_perso",
    name: "Traitements quotidiens + Ordonnance",
    category: "Santé & Pharmacie",
    icon: "💊",
    defaultQty: 1,
    tags: ["Indispensable", "Fragile"],
    description: "Pilulier avec copie d'ordonnance",
    colorHint: "#e11d48"
  },

  // --- ÉLECTRONIQUE & CÂBLES ---
  {
    id: "preset_chargeur_smartphone",
    name: "Chargeur smartphone & Câble USB-C",
    category: "Électronique & Câbles",
    icon: "🔌",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "Bloc charge rapide + câble 1.5m",
    colorHint: "#3b82f6"
  },
  {
    id: "preset_batterie_externe",
    name: "Batterie externe (Powerbank 10-20k mAh)",
    category: "Électronique & Câbles",
    icon: "🔋",
    defaultQty: 1,
    tags: ["Indispensable", "Lourd"],
    description: "Recharge nomade conforme cabine avion",
    colorHint: "#10b981"
  },
  {
    id: "preset_ecouteurs",
    name: "Écouteurs / Casque audio",
    category: "Électronique & Câbles",
    icon: "🎧",
    defaultQty: 1,
    tags: ["Indispensable", "Fragile"],
    description: "Pour musique, trajets et appels",
    colorHint: "#6366f1"
  },
  {
    id: "preset_laptop",
    name: "Ordinateur portable + Chargeur",
    category: "Électronique & Câbles",
    icon: "💻",
    defaultQty: 1,
    tags: ["Fragile", "Lourd", "Prestige"],
    description: "PC / Mac dans sa housse renforcée",
    colorHint: "#475569"
  },
  {
    id: "preset_adaptateur_monde",
    name: "Adaptateur prises universel",
    category: "Électronique & Câbles",
    icon: "🔌",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "Prises US, UK, EU, Asie",
    colorHint: "#eab308"
  },
  {
    id: "preset_multiprise",
    name: "Multiprise compacte",
    category: "Électronique & Câbles",
    icon: "🔌",
    defaultQty: 1,
    tags: [],
    description: "3 prises pour hôtel / régie",
    colorHint: "#64748b"
  },

  // --- MATÉRIEL RÉGIE & TECHNIQUE ---
  {
    id: "preset_gaffer",
    name: "Rouleau de Gaffer noir / adhésif régie",
    category: "Matériel Régie & Technique",
    icon: "🛠️",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "Adhésif toilé pour câbles et fixations",
    colorHint: "#0f172a"
  },
  {
    id: "preset_lampe_frontale",
    name: "Lampe frontale / Torche LED",
    category: "Matériel Régie & Technique",
    icon: "🔦",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "Éclairage main libre pour plateau",
    colorHint: "#f59e0b"
  },
  {
    id: "preset_pince_multifonction",
    name: "Pince multifonction / Outil couteau",
    category: "Matériel Régie & Technique",
    icon: "🛠️",
    defaultQty: 1,
    tags: ["Lourd"],
    description: "Attention : bagage soute obligatoire en avion",
    colorHint: "#94a3b8"
  },
  {
    id: "preset_cartes_sd",
    name: "Cartes mémoires SD + Étui rigide",
    category: "Matériel Régie & Technique",
    icon: "💾",
    defaultQty: 2,
    tags: ["Fragile", "Indispensable"],
    description: "Cartes UHS-II haute vitesse",
    colorHint: "#dc2626"
  },
  {
    id: "preset_micro_hf",
    name: "Kit Micro cravate HF sans fil",
    category: "Matériel Régie & Technique",
    icon: "🎤",
    defaultQty: 1,
    tags: ["Fragile", "Prestige"],
    description: "Émetteur, récepteur et bonnettes antivent",
    colorHint: "#8b5cf6"
  },
  {
    id: "preset_camera_photo",
    name: "Boîtier photo / caméra + Batteries",
    category: "Matériel Régie & Technique",
    icon: "📷",
    defaultQty: 1,
    tags: ["Fragile", "Prestige", "Lourd"],
    description: "Avec bouchons d'objectifs et dragonne",
    colorHint: "#1e293b"
  },

  // --- DOCUMENTS & SÉCURITÉ ---
  {
    id: "preset_passeport",
    name: "Passeport / CNI + Photocopie",
    category: "Documents & Sécurité",
    icon: "🛂",
    defaultQty: 1,
    tags: ["Indispensable", "Fragile"],
    description: "Pièce d'identité valide",
    colorHint: "#1e3a8a"
  },
  {
    id: "preset_permis",
    name: "Permis de conduire",
    category: "Documents & Sécurité",
    icon: "🪪",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "Pour location ou conduite véhicule",
    colorHint: "#ca8a04"
  },
  {
    id: "preset_moyens_paiement",
    name: "Cartes bancaires & Espèces secours",
    category: "Documents & Sécurité",
    icon: "💳",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "CB principale + CB secours + cash",
    colorHint: "#059669"
  },
  {
    id: "preset_billets_reservation",
    name: "Billets transport & Réservations imprimées",
    category: "Documents & Sécurité",
    icon: "🎫",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "Train, avion, hôtel",
    colorHint: "#7c3aed"
  },
  {
    id: "preset_cles",
    name: "Clés de maison / Voiture",
    category: "Documents & Sécurité",
    icon: "🔑",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "Trousseau de clés sécurisé",
    colorHint: "#d97706"
  },
  {
    id: "preset_cadenas",
    name: "Cadenas TSA à code",
    category: "Documents & Sécurité",
    icon: "🔒",
    defaultQty: 1,
    tags: [],
    description: "Pour sécuriser les fermetures éclair",
    colorHint: "#475569"
  },

  // --- VOYAGE & CONFORT ---
  {
    id: "preset_gourde",
    name: "Gourde réutilisable isotherme",
    category: "Voyage & Confort",
    icon: "💧",
    defaultQty: 1,
    tags: ["Indispensable"],
    description: "À vider avant le contrôle sécurité aéroport",
    colorHint: "#0284c7"
  },
  {
    id: "preset_coussin_cou",
    name: "Coussin de voyage ergonomique",
    category: "Voyage & Confort",
    icon: "🛋️",
    defaultQty: 1,
    tags: [],
    description: "Mousse à mémoire de forme pour avion / train",
    colorHint: "#4f46e5"
  },
  {
    id: "preset_masque_quies",
    name: "Masque occultant & Bouchons d'oreilles",
    category: "Voyage & Confort",
    icon: "😴",
    defaultQty: 1,
    tags: [],
    description: "Isolation sonore et visuelle pour dormir",
    colorHint: "#312e81"
  },
  {
    id: "preset_sac_linge",
    name: "Sac à linge sale respirant",
    category: "Voyage & Confort",
    icon: "🧺",
    defaultQty: 1,
    tags: [],
    description: "Pour séparer les vêtements usagés",
    colorHint: "#94a3b8"
  },
  {
    id: "preset_encas",
    name: "Barres énergétiques / Fruits secs",
    category: "Voyage & Confort",
    icon: "🍫",
    defaultQty: 2,
    tags: [],
    description: "En-cas de secours pour les retards",
    colorHint: "#b45309"
  },
  {
    id: "preset_carnet_stylo",
    name: "Carnet de notes & Stylo",
    category: "Voyage & Confort",
    icon: "📝",
    defaultQty: 1,
    tags: [],
    description: "Pour notes de régie, contacts ou douane",
    colorHint: "#1e293b"
  }
];
