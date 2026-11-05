import React from "react";

interface SuitcaseItemIllustrationProps {
  item?: {
    name?: string;
    category?: string;
    icon?: string;
    imageUrl?: string;
    colorHint?: string;
  };
  presetId?: string;
  className?: string;
}

export const SuitcaseItemIllustration: React.FC<SuitcaseItemIllustrationProps> = ({
  item,
  presetId,
  className = "w-full h-full"
}) => {
  // 1. Si une photo / URL d'image est fournie, on affiche la photo
  if (item?.imageUrl) {
    return (
      <div className={`relative overflow-hidden w-full h-full flex items-center justify-center bg-gray-100 ${className}`}>
        <img
          src={item.imageUrl}
          alt={item.name || "Affaire de valise"}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Si l'image ne charge pas, on affiche un fallback
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  // 2. Détermination de l'illustration SVG correspondante selon l'id de préfabriqué ou le nom de l'objet
  const nameLower = (item?.name || "").toLowerCase().trim();
  const id = presetId || "";
  const itemColor = item?.colorHint;

  // Helper pour rendre les SVG vectoriels nets et colorés style Memphis
  const renderSvg = () => {
    // --- VÊTEMENTS ---
    if (id === "preset_tshirt" || id === "preset_tshirt_bleu" || id === "preset_tshirt_blanc" || id === "preset_tshirt_noir" || nameLower.includes("tshirt") || nameLower.includes("t-shirt") || nameLower.includes("tee-shirt")) {
      const shirtFill = itemColor || "#2563eb";
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* T-shirt avec couleur dynamique */}
          <path d="M30 20 L42 27 C46 30 54 30 58 27 L70 20 L88 34 L76 48 L70 42 L70 82 L30 82 L30 42 L24 48 L12 34 Z" fill={shirtFill} />
          {/* Col */}
          <path d="M42 20 C42 28 58 28 58 20" fill="rgba(0,0,0,0.15)" stroke="black" strokeWidth="2" />
          {/* Manches & ourlets */}
          <line x1="76" y1="48" x2="70" y2="42" stroke="rgba(0,0,0,0.25)" strokeWidth="2" />
          <line x1="24" y1="48" x2="30" y2="42" stroke="rgba(0,0,0,0.25)" strokeWidth="2" />
          <line x1="30" y1="78" x2="70" y2="78" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" strokeDasharray="2 2" />
          {/* Ombre / pli */}
          <path d="M34 45 L34 75" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
        </svg>
      );
    }

    if (id === "preset_chemise" || nameLower.includes("chemise")) {
      const shirtColor = itemColor || "#e0f2fe";
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Corps de la chemise */}
          <path d="M32 20 L40 24 L50 20 L60 24 L68 20 L86 36 L74 48 L68 42 L68 84 L32 84 L32 42 L26 48 L14 36 Z" fill={shirtColor} />
          {/* Col chemise */}
          <polygon points="40,24 50,34 32,24" fill="rgba(0,0,0,0.12)" stroke="black" strokeWidth="2" />
          <polygon points="60,24 50,34 68,24" fill="rgba(0,0,0,0.12)" stroke="black" strokeWidth="2" />
          {/* Boutons verticaux */}
          <line x1="50" y1="34" x2="50" y2="84" stroke="black" strokeWidth="2" />
          <circle cx="50" cy="42" r="1.5" fill="black" />
          <circle cx="50" cy="54" r="1.5" fill="black" />
          <circle cx="50" cy="66" r="1.5" fill="black" />
          <circle cx="50" cy="78" r="1.5" fill="black" />
          {/* Poche poitrine */}
          <rect x="54" y="44" width="8" height="10" fill="rgba(0,0,0,0.12)" stroke="black" strokeWidth="1.5" />
        </svg>
      );
    }

    if (id === "preset_jean" || nameLower.includes("jean") || nameLower.includes("denim")) {
      const jeanColor = itemColor || "#1d4ed8";
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Jean Denim */}
          <path d="M28 18 L72 18 L68 86 L52 86 L50 42 L48 86 L32 86 Z" fill={jeanColor} />
          {/* Ceinture & passants */}
          <line x1="28" y1="26" x2="72" y2="26" stroke="#ca8a04" strokeWidth="1.5" strokeDasharray="3 1" />
          <rect x="36" y="18" width="4" height="8" fill="rgba(0,0,0,0.2)" stroke="black" strokeWidth="1.5" />
          <rect x="60" y="18" width="4" height="8" fill="rgba(0,0,0,0.2)" stroke="black" strokeWidth="1.5" />
          <circle cx="50" cy="22" r="2" fill="#eab308" stroke="black" strokeWidth="1" />
          {/* Poches avant & rivets */}
          <path d="M30 26 C36 26 40 32 38 38" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="38" cy="38" r="1.2" fill="#ca8a04" />
          <path d="M70 26 C64 26 60 32 62 38" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="62" cy="38" r="1.2" fill="#ca8a04" />
          {/* Braguette */}
          <path d="M50 26 L50 38 C46 38 46 32 46 32" stroke="#ca8a04" strokeWidth="1.5" />
        </svg>
      );
    }

    if (id === "preset_jogging" || nameLower.includes("jogging") || nameLower.includes("pantalon")) {
      const jogColor = itemColor || "#64748b";
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M30 18 L70 18 L67 84 L53 84 L50 44 L47 84 L33 84 Z" fill={jogColor} />
          {/* Cordon de serrage */}
          <path d="M47 24 C47 28 44 32 42 32" stroke="white" strokeWidth="2" />
          <path d="M53 24 C53 28 56 32 58 32" stroke="white" strokeWidth="2" />
          {/* Revers cheville */}
          <rect x="33" y="80" width="14" height="5" fill="rgba(0,0,0,0.2)" stroke="black" strokeWidth="1.5" />
          <rect x="53" y="80" width="14" height="5" fill="rgba(0,0,0,0.2)" stroke="black" strokeWidth="1.5" />
        </svg>
      );
    }

    if (id === "preset_short" || nameLower.includes("short") || nameLower.includes("bermuda")) {
      const shortColor = itemColor || "#fbbf24";
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M28 24 L72 24 L69 66 L52 66 L50 42 L48 66 L31 66 Z" fill={shortColor} />
          <line x1="28" y1="32" x2="72" y2="32" stroke="black" strokeWidth="1.5" strokeDasharray="3 1" />
          <circle cx="50" cy="28" r="2" fill="black" />
          {/* Poches cargos */}
          <rect x="30" y="44" width="8" height="12" fill="rgba(0,0,0,0.15)" stroke="black" strokeWidth="1.5" />
          <rect x="62" y="44" width="8" height="12" fill="rgba(0,0,0,0.15)" stroke="black" strokeWidth="1.5" />
        </svg>
      );
    }

    if (id === "preset_calecon" || nameLower.includes("boxer") || nameLower.includes("calecon") || nameLower.includes("caleçon") || nameLower.includes("sous-vêtement")) {
      const boxerColor = itemColor || "#93c5fd";
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M26 30 L74 30 L70 68 L53 68 L50 48 L47 68 L30 68 Z" fill={boxerColor} />
          <rect x="26" y="30" width="48" height="8" fill="rgba(0,0,0,0.3)" stroke="black" strokeWidth="2" />
          <line x1="50" y1="38" x2="50" y2="48" stroke="black" strokeWidth="1.5" />
        </svg>
      );
    }

    if (id === "preset_chaussettes" || nameLower.includes("chaussette")) {
      const sockColor = itemColor || "#cbd5e1";
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Chaussette 1 */}
          <path d="M30 20 L44 20 L44 54 C44 62 48 68 56 68 L64 68 C70 68 72 74 68 78 C64 82 52 82 42 76 C32 70 30 60 30 50 Z" fill={sockColor} />
          <path d="M30 20 L44 20 L44 26 L30 26 Z" fill="rgba(0,0,0,0.15)" stroke="black" strokeWidth="1.5" />
          <path d="M60 68 C68 68 72 74 68 78 C64 82 58 80 58 74 Z" fill="rgba(0,0,0,0.15)" />
          {/* Chaussette 2 */}
          <path d="M46 22 L60 22 L60 52 C60 60 64 64 72 64 L78 64 C84 64 86 70 82 74 C78 78 68 78 58 72 C50 66 46 56 46 48 Z" fill={sockColor} opacity="0.85" />
        </svg>
      );
    }

    if (id === "preset_pull" || nameLower.includes("pull") || nameLower.includes("sweat")) {
      const pullColor = itemColor || "#a855f7";
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M28 24 L40 28 C46 30 54 30 60 28 L72 24 L90 48 L78 56 L70 46 L70 84 L30 84 L30 46 L22 56 L10 48 Z" fill={pullColor} />
          <path d="M40 28 C40 34 60 34 60 28" fill="rgba(0,0,0,0.2)" stroke="black" strokeWidth="2" />
          {/* Revers poignets et bas */}
          <rect x="30" y="80" width="40" height="5" fill="rgba(0,0,0,0.2)" stroke="black" strokeWidth="1.5" />
          <line x1="12" y1="46" x2="20" y2="54" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
          <line x1="88" y1="46" x2="80" y2="54" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
        </svg>
      );
    }

    if (id === "preset_veste" || nameLower.includes("veste") || nameLower.includes("manteau") || nameLower.includes("k-way")) {
      const vestColor = itemColor || "#334155";
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M26 22 L38 24 L50 20 L62 24 L74 22 L92 48 L80 58 L72 46 L72 86 L28 86 L28 46 L20 58 L8 48 Z" fill={vestColor} />
          {/* Capuche / col montant */}
          <path d="M38 24 C38 14 62 14 62 24" fill="rgba(0,0,0,0.2)" stroke="black" strokeWidth="2" />
          {/* Zip fermeture éclair jaune */}
          <line x1="50" y1="20" x2="50" y2="86" stroke="#facc15" strokeWidth="2.5" />
          <rect x="48" y="36" width="4" height="6" fill="#ca8a04" stroke="black" strokeWidth="1" />
          {/* Poches zippées */}
          <line x1="34" y1="60" x2="44" y2="64" stroke="#facc15" strokeWidth="2" />
          <line x1="66" y1="60" x2="56" y2="64" stroke="#facc15" strokeWidth="2" />
        </svg>
      );
    }

    // --- CHAUSSURES & ACCESS ---
    if (id === "preset_baskets" || nameLower.includes("basket") || nameLower.includes("sneaker")) {
      const shoeColor = itemColor || "#22c55e";
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Sneaker de profil */}
          <path d="M14 62 C14 50 24 44 34 44 L50 44 L66 52 L84 56 C88 58 88 68 84 72 L16 72 C12 72 14 66 14 62 Z" fill={shoeColor} />
          {/* Semelle épaisse blanche */}
          <rect x="12" y="70" width="76" height="10" rx="3" fill="#ffffff" stroke="black" strokeWidth="2.5" />
          <line x1="12" y1="75" x2="88" y2="75" stroke="#e5e7eb" strokeWidth="1" />
          {/* Lacets */}
          <path d="M46 44 L54 50" stroke="white" strokeWidth="2" />
          <path d="M52 46 L60 52" stroke="white" strokeWidth="2" />
          <path d="M58 48 L66 54" stroke="white" strokeWidth="2" />
          {/* Virgule / détail stylisé */}
          <path d="M30 58 Q46 64 64 58" stroke="#ffffff" strokeWidth="3" />
        </svg>
      );
    }

    if (id === "preset_chaussures_ville" || nameLower.includes("chaussure")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 64 C16 52 24 46 36 46 L54 48 L74 54 L86 60 C88 64 86 70 82 72 L18 72 C14 72 16 68 16 64 Z" fill="#78350f" />
          {/* Talon et semelle cuir */}
          <rect x="16" y="72" width="20" height="7" fill="#451a03" stroke="black" strokeWidth="2" />
          <rect x="36" y="72" width="48" height="4" fill="#451a03" stroke="black" strokeWidth="2" />
          {/* Lacets fins */}
          <line x1="48" y1="48" x2="52" y2="52" stroke="#d97706" strokeWidth="1.5" />
          <line x1="52" y1="50" x2="56" y2="54" stroke="#d97706" strokeWidth="1.5" />
        </svg>
      );
    }

    if (id === "preset_tongs" || nameLower.includes("tong") || nameLower.includes("claquette") || nameLower.includes("sandale")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Semelle tong vue du dessus */}
          <path d="M32 20 C42 16 52 18 56 26 C60 36 58 50 56 64 C54 76 50 84 40 84 C30 84 26 76 26 64 C26 50 24 34 26 24 C28 20 30 20 32 20 Z" fill="#f97316" />
          {/* Lanières en Y */}
          <path d="M42 34 L32 50" stroke="#000000" strokeWidth="3" />
          <path d="M42 34 L54 50" stroke="#000000" strokeWidth="3" />
          <circle cx="42" cy="34" r="3" fill="#000000" />
          {/* Deuxième tong en fond */}
          <path d="M60 26 C68 22 76 24 80 32 C82 42 80 54 78 66 C76 76 72 82 64 82 C58 82 54 76 54 66" stroke="black" strokeWidth="2" fill="#fdba74" />
        </svg>
      );
    }

    if (id === "preset_casquette" || nameLower.includes("casquette")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Dôme de la casquette */}
          <path d="M24 60 C24 38 42 28 62 30 C72 32 78 42 78 60 Z" fill="#ef4444" />
          {/* Visière incurvée */}
          <path d="M14 62 C26 60 56 60 78 60 C88 60 92 68 84 70 C60 74 24 72 14 62 Z" fill="#dc2626" />
          {/* Bouton du sommet */}
          <circle cx="52" cy="30" r="3" fill="#991b1b" stroke="black" strokeWidth="1.5" />
          {/* Lignes de panneaux */}
          <path d="M52 30 Q52 46 50 60" stroke="#b91c1c" strokeWidth="1.5" />
        </svg>
      );
    }

    if (id === "preset_lunettes_soleil" || nameLower.includes("lunette")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Verre gauche */}
          <path d="M18 38 L42 38 C44 48 42 62 30 62 C18 62 16 48 18 38 Z" fill="#0f172a" />
          {/* Verre droit */}
          <path d="M58 38 L82 38 C84 48 82 62 70 62 C58 62 56 48 58 38 Z" fill="#0f172a" />
          {/* Pont et branches */}
          <line x1="42" y1="42" x2="58" y2="42" stroke="#eab308" strokeWidth="3" />
          <line x1="12" y1="36" x2="18" y2="38" stroke="#eab308" strokeWidth="3" />
          <line x1="82" y1="38" x2="88" y2="36" stroke="#eab308" strokeWidth="3" />
          {/* Reflet sur les verres */}
          <line x1="24" y1="44" x2="34" y2="56" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <line x1="64" y1="44" x2="74" y2="56" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }

    // --- TOILETTE & HYGIÈNE ---
    if (id === "preset_brosse_dents" || nameLower.includes("dent") || nameLower.includes("brosse")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Manche brosse à dents ergonomique */}
          <path d="M18 82 C22 86 28 82 32 76 L70 32 C74 26 76 22 72 18 C68 14 64 16 58 20 L20 62 C14 68 14 78 18 82 Z" fill="#38bdf8" />
          {/* Poils de brosse */}
          <rect x="64" y="12" width="16" height="12" rx="2" fill="#ffffff" stroke="black" strokeWidth="2" transform="rotate(-45 64 12)" />
          {/* Bandeau grip */}
          <path d="M26 72 C28 70 32 72 34 76" stroke="#0284c7" strokeWidth="3" />
          {/* Tube de dentifrice en bas */}
          <polygon points="46,60 58,54 74,78 62,84" fill="#10b981" stroke="black" strokeWidth="2" />
          <rect x="74" y="74" width="8" height="6" fill="#ffffff" stroke="black" strokeWidth="1.5" transform="rotate(35 74 74)" />
        </svg>
      );
    }

    if (id === "preset_gel_douche" || id === "preset_shampoing" || nameLower.includes("douche") || nameLower.includes("savon") || nameLower.includes("shampoing")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Bouteille flacon */}
          <rect x="32" y="32" width="36" height="52" rx="8" fill="#10b981" />
          {/* Bouchon doseur */}
          <rect x="42" y="20" width="16" height="12" rx="2" fill="#ffffff" stroke="black" strokeWidth="2" />
          <line x1="44" y1="24" x2="56" y2="24" stroke="black" strokeWidth="1.5" />
          {/* Étiquette */}
          <rect x="38" y="44" width="24" height="24" rx="3" fill="#ffffff" stroke="black" strokeWidth="1.5" />
          {/* Bulle / goutte */}
          <circle cx="50" cy="56" r="5" fill="#34d399" stroke="black" strokeWidth="1" />
        </svg>
      );
    }

    if (id === "preset_creme_solaire" || nameLower.includes("creme") || nameLower.includes("solaire")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Tube crème jaune vif */}
          <polygon points="34,22 66,22 60,72 40,72" fill="#facc15" stroke="black" strokeWidth="2.5" />
          {/* Bouchon en bas */}
          <rect x="38" y="72" width="24" height="12" rx="2" fill="#f97316" stroke="black" strokeWidth="2" />
          {/* Soleil dessiné sur le tube */}
          <circle cx="50" cy="44" r="8" fill="#f97316" stroke="black" strokeWidth="1.5" />
          <text x="50" y="62" textAnchor="middle" fill="black" fontSize="8" fontWeight="bold" fontFamily="monospace">50+</text>
        </svg>
      );
    }

    // --- SANTÉ & PHARMACIE ---
    if (id === "preset_doliprane" || nameLower.includes("doliprane") || nameLower.includes("paracetamol") || nameLower.includes("médicament") || nameLower.includes("pilule")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Plaquette de gélules */}
          <rect x="22" y="24" width="56" height="52" rx="4" fill="#e2e8f0" />
          {/* Gélule 1 rouge/blanche */}
          <rect x="28" y="32" width="18" height="10" rx="5" fill="#ef4444" stroke="black" strokeWidth="1.5" />
          <path d="M37 32 L41 32 C43.7 32 46 34.2 46 37 C46 39.8 43.7 42 41 42 L37 42 Z" fill="#ffffff" stroke="black" strokeWidth="1.5" />
          {/* Gélule 2 */}
          <rect x="54" y="32" width="18" height="10" rx="5" fill="#ef4444" stroke="black" strokeWidth="1.5" />
          <path d="M63 32 L67 32 C69.7 32 72 34.2 72 37 C72 39.8 69.7 42 67 42 L63 42 Z" fill="#ffffff" stroke="black" strokeWidth="1.5" />
          {/* Gélule 3 */}
          <rect x="28" y="52" width="18" height="10" rx="5" fill="#ef4444" stroke="black" strokeWidth="1.5" />
          <path d="M37 52 L41 52 C43.7 52 46 54.2 46 57 C46 59.8 43.7 62 41 62 L37 62 Z" fill="#ffffff" stroke="black" strokeWidth="1.5" />
          {/* Gélule 4 */}
          <rect x="54" y="52" width="18" height="10" rx="5" fill="#ef4444" stroke="black" strokeWidth="1.5" />
          <path d="M63 52 L67 52 C69.7 52 72 54.2 72 57 C72 59.8 69.7 62 67 62 L63 62 Z" fill="#ffffff" stroke="black" strokeWidth="1.5" />
        </svg>
      );
    }

    // --- ÉLECTRONIQUE & CÂBLES ---
    if (id === "preset_chargeur_smartphone" || nameLower.includes("chargeur") || nameLower.includes("cable") || nameLower.includes("câble") || nameLower.includes("usb")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Bloc chargeur mural */}
          <rect x="20" y="30" width="34" height="34" rx="4" fill="#ffffff" />
          {/* Broches prise murale */}
          <rect x="12" y="36" width="8" height="4" fill="#94a3b8" stroke="black" strokeWidth="1.5" />
          <rect x="12" y="52" width="8" height="4" fill="#94a3b8" stroke="black" strokeWidth="1.5" />
          {/* Port USB-C */}
          <rect x="46" y="44" width="8" height="6" rx="2" fill="#0f172a" />
          {/* Câble spiralé blanc */}
          <path d="M54 47 C66 47 62 70 74 70 C84 70 82 36 78 30" stroke="#3b82f6" strokeWidth="3" fill="none" />
          {/* Connecteur USB-C métallique */}
          <rect x="74" y="20" width="8" height="14" rx="2" fill="#cbd5e1" stroke="black" strokeWidth="2" />
          <line x1="78" y1="20" x2="78" y2="24" stroke="black" strokeWidth="1" />
        </svg>
      );
    }

    if (id === "preset_batterie_externe" || nameLower.includes("batterie") || nameLower.includes("powerbank")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Boîtier Powerbank */}
          <rect x="24" y="24" width="52" height="56" rx="6" fill="#1e293b" />
          {/* Ports USB en haut */}
          <rect x="32" y="20" width="12" height="6" fill="#0f172a" stroke="black" strokeWidth="1.5" />
          <rect x="56" y="20" width="12" height="6" fill="#0f172a" stroke="black" strokeWidth="1.5" />
          {/* 4 LED de charge vertes */}
          <circle cx="36" cy="40" r="2" fill="#22c55e" />
          <circle cx="44" cy="40" r="2" fill="#22c55e" />
          <circle cx="52" cy="40" r="2" fill="#22c55e" />
          <circle cx="60" cy="40" r="2" fill="#22c55e" />
          {/* Symbole éclair */}
          <polygon points="52,50 44,62 49,62 47,72 56,58 51,58" fill="#eab308" stroke="black" strokeWidth="1.5" />
        </svg>
      );
    }

    if (id === "preset_ecouteurs" || nameLower.includes("ecouteur") || nameLower.includes("écouteur") || nameLower.includes("casque")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Arceau de casque */}
          <path d="M24 54 C24 32 36 20 50 20 C64 20 76 32 76 54" stroke="#4f46e5" strokeWidth="4" fill="none" />
          {/* Coussinet gauche */}
          <rect x="18" y="50" width="12" height="24" rx="6" fill="#1e1b4b" stroke="black" strokeWidth="2" />
          {/* Coussinet droit */}
          <rect x="70" y="50" width="12" height="24" rx="6" fill="#1e1b4b" stroke="black" strokeWidth="2" />
        </svg>
      );
    }

    if (id === "preset_laptop" || nameLower.includes("ordinateur") || nameLower.includes("laptop") || nameLower.includes("pc") || nameLower.includes("mac")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Écran ouvert */}
          <rect x="22" y="24" width="56" height="40" rx="3" fill="#0f172a" />
          <rect x="26" y="28" width="48" height="32" fill="#38bdf8" stroke="black" strokeWidth="1.5" />
          {/* Base / clavier */}
          <polygon points="12,74 88,74 80,64 20,64" fill="#cbd5e1" stroke="black" strokeWidth="2" />
          {/* Trackpad */}
          <rect x="42" y="67" width="16" height="5" rx="1" fill="#94a3b8" stroke="black" strokeWidth="1" />
        </svg>
      );
    }

    // --- MATÉRIEL RÉGIE & TECHNIQUE ---
    if (id === "preset_gaffer" || nameLower.includes("gaffer") || nameLower.includes("adhesif") || nameLower.includes("adhésif")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Rouleau de gaffer cylindrique */}
          <ellipse cx="50" cy="40" rx="32" ry="18" fill="#18181b" />
          <ellipse cx="50" cy="40" rx="16" ry="9" fill="#e4e4e7" stroke="black" strokeWidth="2" />
          {/* Hauteur du rouleau */}
          <path d="M18 40 L18 64 C18 74 32 82 50 82 C68 82 82 74 82 64 L82 40" fill="#27272a" stroke="black" strokeWidth="2.5" />
          {/* Bande décollée */}
          <path d="M82 58 L92 68 L88 74" stroke="#eab308" strokeWidth="3" />
        </svg>
      );
    }

    if (id === "preset_lampe_frontale" || nameLower.includes("frontale") || nameLower.includes("torche") || nameLower.includes("lampe")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Bandeau élastique */}
          <ellipse cx="50" cy="50" rx="38" ry="16" fill="none" stroke="#dc2626" strokeWidth="6" />
          {/* Bloc lampe LED frontal */}
          <rect x="36" y="36" width="28" height="24" rx="4" fill="#1e293b" stroke="black" strokeWidth="2.5" />
          {/* Lentille brillante */}
          <circle cx="50" cy="48" r="8" fill="#facc15" stroke="black" strokeWidth="2" />
          <circle cx="50" cy="48" r="4" fill="#ffffff" />
        </svg>
      );
    }

    if (id === "preset_cartes_sd" || nameLower.includes("sd") || nameLower.includes("carte memoire") || nameLower.includes("mémoire")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Carte SD */}
          <polygon points="28,24 62,24 72,34 72,78 28,78" fill="#18181b" stroke="black" strokeWidth="2.5" />
          {/* Connecteurs or */}
          <line x1="34" y1="28" x2="34" y2="38" stroke="#facc15" strokeWidth="2" />
          <line x1="40" y1="28" x2="40" y2="38" stroke="#facc15" strokeWidth="2" />
          <line x1="46" y1="28" x2="46" y2="38" stroke="#facc15" strokeWidth="2" />
          <line x1="52" y1="28" x2="52" y2="38" stroke="#facc15" strokeWidth="2" />
          <line x1="58" y1="28" x2="58" y2="38" stroke="#facc15" strokeWidth="2" />
          {/* Étiquette rouge / capacité */}
          <rect x="34" y="46" width="32" height="24" rx="2" fill="#dc2626" stroke="black" strokeWidth="1.5" />
          <text x="50" y="62" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="monospace">128GB</text>
        </svg>
      );
    }

    if (id === "preset_camera_photo" || nameLower.includes("camera") || nameLower.includes("caméra") || nameLower.includes("photo") || nameLower.includes("boitier")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Boîtier caméra */}
          <rect x="20" y="32" width="60" height="46" rx="6" fill="#18181b" />
          {/* Viseur / flash */}
          <rect x="38" y="24" width="24" height="10" rx="2" fill="#27272a" stroke="black" strokeWidth="2" />
          <circle cx="70" cy="28" r="3" fill="#dc2626" stroke="black" strokeWidth="1.5" />
          {/* Objectif reflex */}
          <circle cx="50" cy="55" r="16" fill="#38bdf8" stroke="black" strokeWidth="3" />
          <circle cx="50" cy="55" r="10" fill="#0f172a" stroke="white" strokeWidth="1.5" />
          <circle cx="47" cy="52" r="3" fill="#ffffff" />
        </svg>
      );
    }

    // --- DOCUMENTS & SÉCURITÉ ---
    if (id === "preset_passeport" || nameLower.includes("passeport") || nameLower.includes("cni") || nameLower.includes("identite") || nameLower.includes("identité")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Livret passeport bleu marine */}
          <rect x="26" y="18" width="48" height="66" rx="4" fill="#1e3a8a" />
          {/* Emblème / Armoiries dorées */}
          <circle cx="50" cy="46" r="12" fill="none" stroke="#facc15" strokeWidth="2" />
          <polygon points="50,38 54,46 50,54 46,46" fill="#facc15" />
          {/* Textes dorés */}
          <line x1="36" y1="28" x2="64" y2="28" stroke="#facc15" strokeWidth="2.5" />
          <line x1="40" y1="33" x2="60" y2="33" stroke="#facc15" strokeWidth="1.5" />
          {/* Symbole biométrique en bas */}
          <rect x="44" y="66" width="12" height="8" rx="2" fill="none" stroke="#facc15" strokeWidth="1.5" />
          <line x1="44" y1="70" x2="56" y2="70" stroke="#facc15" strokeWidth="1.5" />
        </svg>
      );
    }

    if (id === "preset_moyens_paiement" || nameLower.includes("carte bancaire") || nameLower.includes("cb") || nameLower.includes("paiement")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Carte bancaire */}
          <rect x="18" y="28" width="64" height="44" rx="5" fill="#047857" />
          {/* Puce EMV dorée */}
          <rect x="28" y="42" width="12" height="10" rx="2" fill="#facc15" stroke="black" strokeWidth="1.5" />
          <line x1="34" y1="42" x2="34" y2="52" stroke="#ca8a04" strokeWidth="1" />
          {/* Cercles Mastercard / Visa */}
          <circle cx="64" cy="56" r="7" fill="#ef4444" opacity="0.9" />
          <circle cx="72" cy="56" r="7" fill="#eab308" opacity="0.9" />
          {/* Lignes gaufrées de carte */}
          <line x1="28" y1="62" x2="54" y2="62" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 2" />
        </svg>
      );
    }

    if (id === "preset_cles" || nameLower.includes("cle") || nameLower.includes("clé")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Anneau porte-clés */}
          <circle cx="40" cy="38" r="16" fill="none" stroke="#ca8a04" strokeWidth="4" />
          {/* Clé dorée */}
          <path d="M48 46 L76 74 L70 80 L66 76 L62 80 L56 74 Z" fill="#eab308" stroke="black" strokeWidth="2" />
          <circle cx="36" cy="34" r="5" fill="none" stroke="black" strokeWidth="2" />
        </svg>
      );
    }

    if (id === "preset_cadenas" || nameLower.includes("cadenas")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Anse métallique */}
          <path d="M34 46 L34 32 C34 22 66 22 66 32 L66 46" stroke="#94a3b8" strokeWidth="5" fill="none" />
          {/* Corps de cadenas en laiton */}
          <rect x="26" y="44" width="48" height="38" rx="4" fill="#eab308" stroke="black" strokeWidth="2.5" />
          {/* Molettes à code */}
          <rect x="36" y="54" width="8" height="16" rx="2" fill="#18181b" stroke="black" strokeWidth="1" />
          <rect x="46" y="54" width="8" height="16" rx="2" fill="#18181b" stroke="black" strokeWidth="1" />
          <rect x="56" y="54" width="8" height="16" rx="2" fill="#18181b" stroke="black" strokeWidth="1" />
        </svg>
      );
    }

    if (id === "preset_gourde" || nameLower.includes("gourde") || nameLower.includes("bouteille")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Corps de la gourde inox */}
          <rect x="34" y="32" width="32" height="54" rx="8" fill="#0284c7" />
          {/* Bouchon avec anse */}
          <rect x="42" y="24" width="16" height="10" rx="2" fill="#0f172a" stroke="black" strokeWidth="2" />
          <path d="M46 24 C46 16 54 16 54 24" stroke="#0f172a" strokeWidth="3" fill="none" />
          {/* Reflet acier */}
          <line x1="40" y1="36" x2="40" y2="80" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }

    // --- FALLBACK PAR DÉFAUT SELON ÉMOJI OU VALISE ---
    return (
      <div className="w-full h-full flex flex-col items-center justify-center select-none">
        <span className="text-3xl filter drop-shadow-[2px_2px_0px_#000]">
          {item?.icon || "🎒"}
        </span>
      </div>
    );
  };

  return (
    <div className={`w-full h-full flex items-center justify-center p-1 relative ${className}`}>
      {renderSvg()}
    </div>
  );
};
