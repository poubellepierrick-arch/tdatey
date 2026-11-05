import React, { useState, useMemo, useRef } from "react";
import { AppDatabase, SuitcaseItem, SuitcaseList, SuitcaseListItem } from "../../../types";
import { 
  GENERIC_PRESETS, 
  GENERIC_PRESET_CATEGORIES, 
  GenericPresetItem,
  PRESET_COLOR_SWATCHES
} from "./suitcasePresets";
import { SuitcaseItemIllustration } from "./SuitcaseItemIllustration";
import { 
  Search, Plus, Check, Edit3, Sparkles, Filter, 
  Layers, CheckSquare, Square, Camera, Image as ImageIcon,
  X, Upload, Palette
} from "lucide-react";

interface SuitcasePresetsTabProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
  activeListId?: string;
  onNavigateToInventory?: () => void;
}

export const SuitcasePresetsTab: React.FC<SuitcasePresetsTabProps> = ({
  db,
  updateDb,
  activeListId,
  onNavigateToInventory
}) => {
  const existingItems = db.suitcaseItems || [];
  const lists = db.suitcaseLists || [];
  const activeList = lists.find(l => l.id === activeListId);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<string>>(new Set());
  
  // États de personnalisation inline
  const [customizingPresetId, setCustomizingPresetId] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [customIcon, setCustomIcon] = useState("");
  const [customQty, setCustomQty] = useState(1);
  const [customColorHint, setCustomColorHint] = useState("#3b82f6");
  const [customDesc, setCustomDesc] = useState("");
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [customImageUrl, setCustomImageUrl] = useState<string | undefined>(undefined);

  // Upload photo rapide
  const [photoUploadPresetId, setPhotoUploadPresetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Dictionnaire de photos personnalisées locales pour les préfabriqués (id -> imageUrl)
  const [presetPhotos, setPresetPhotos] = useState<Record<string, string>>({});

  // Feedback visuel temporaire
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  // Filtrage des modèles préfabriqués
  const filteredPresets = useMemo(() => {
    return GENERIC_PRESETS.filter((preset) => {
      const matchesCategory = 
        selectedCategory === "Tous" || 
        preset.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        selectedCategory.toLowerCase().includes(preset.category.toLowerCase());
      
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = 
        !q ||
        preset.name.toLowerCase().includes(q) ||
        preset.category.toLowerCase().includes(q) ||
        (preset.description && preset.description.toLowerCase().includes(q)) ||
        preset.tags.some(t => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Vérifier si un objet est déjà présent dans l'inventaire personnel
  const isAlreadyInInventory = (preset: GenericPresetItem) => {
    return existingItems.some(
      item => item.name.trim().toLowerCase() === preset.name.trim().toLowerCase()
    );
  };

  // Démarrer la personnalisation d'un objet
  const startCustomizing = (preset: GenericPresetItem) => {
    setCustomizingPresetId(preset.id);
    setCustomName(preset.name);
    setCustomCategory(preset.category === "Matériel Régie & Technique" ? "Matériel Régie" : preset.category);
    setCustomIcon(preset.icon);
    setCustomQty(preset.defaultQty || 1);
    setCustomColorHint(preset.colorHint || "#3b82f6");
    setCustomDesc(preset.description || "");
    setCustomTags([...preset.tags]);
    setCustomImageUrl(presetPhotos[preset.id] || preset.imageUrl);
  };

  // Gestion du téléversement de photo
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetPresetId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Lecture du fichier en Base64
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        if (targetPresetId) {
          setPresetPhotos(prev => ({ ...prev, [targetPresetId]: result }));
          showFeedback(`Photo associée avec succès !`);
        } else {
          setCustomImageUrl(result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Ajouter un objet simple à l'inventaire
  const handleAddSingleItem = (preset: GenericPresetItem, addToList: boolean = false) => {
    const photo = presetPhotos[preset.id] || preset.imageUrl;
    const newItem: SuitcaseItem = {
      id: "item_" + Math.random().toString(36).substring(2, 11),
      name: preset.name,
      category: preset.category === "Matériel Régie & Technique" ? "Matériel Régie" : preset.category,
      description: preset.description,
      tags: preset.tags.length > 0 ? preset.tags : undefined,
      quantityOwned: preset.defaultQty || 1,
      icon: preset.icon,
      colorHint: preset.colorHint,
      imageUrl: photo
    };

    let updatedLists = lists;
    if (addToList && activeList) {
      const newListItem: SuitcaseListItem = {
        itemId: newItem.id,
        quantityNeeded: 1,
        isPacked: false
      };
      updatedLists = lists.map(l => l.id === activeList.id ? { ...l, items: [...l.items, newListItem] } : l);
    }

    updateDb({
      ...db,
      suitcaseItems: [...existingItems, newItem],
      suitcaseLists: updatedLists
    });

    showFeedback(`"${preset.name}" ajouté à vos affaires ${addToList && activeList ? `et à ${activeList.name}` : ""} !`);
  };

  // Sauvegarder l'objet personnalisé (mise à jour directe et garantie dans la base)
  const handleSaveCustomItem = (addToList: boolean = false) => {
    const trimmedName = customName.trim();
    if (!trimmedName) return;

    // Vérifier si un objet du même nom existe déjà dans l'inventaire
    const existingIndex = existingItems.findIndex(
      it => it.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    let updatedItems: SuitcaseItem[];
    let targetItemId: string;

    if (existingIndex >= 0) {
      targetItemId = existingItems[existingIndex].id;
      const updated: SuitcaseItem = {
        ...existingItems[existingIndex],
        name: trimmedName,
        category: customCategory || existingItems[existingIndex].category,
        description: customDesc.trim() || undefined,
        tags: customTags.length > 0 ? customTags : undefined,
        quantityOwned: customQty > 0 ? customQty : 1,
        icon: customIcon.trim() || existingItems[existingIndex].icon || "📦",
        colorHint: customColorHint,
        imageUrl: customImageUrl
      };
      updatedItems = [...existingItems];
      updatedItems[existingIndex] = updated;
    } else {
      targetItemId = "item_" + Math.random().toString(36).substring(2, 11);
      const newItem: SuitcaseItem = {
        id: targetItemId,
        name: trimmedName,
        category: customCategory || "Autre",
        description: customDesc.trim() || undefined,
        tags: customTags.length > 0 ? customTags : undefined,
        quantityOwned: customQty > 0 ? customQty : 1,
        icon: customIcon.trim() || "📦",
        colorHint: customColorHint,
        imageUrl: customImageUrl
      };
      updatedItems = [...existingItems, newItem];
    }

    let updatedLists = lists;
    if (addToList && activeList) {
      const alreadyInList = activeList.items.some(li => li.itemId === targetItemId);
      if (!alreadyInList) {
        const newListItem: SuitcaseListItem = {
          itemId: targetItemId,
          quantityNeeded: 1,
          isPacked: false
        };
        updatedLists = lists.map(l => l.id === activeList.id ? { ...l, items: [...l.items, newListItem] } : l);
      }
    }

    updateDb({
      ...db,
      suitcaseItems: updatedItems,
      suitcaseLists: updatedLists
    });

    setCustomizingPresetId(null);
    showFeedback(`"${trimmedName}" enregistré avec succès !`);
  };

  // Gestion de la sélection multiple
  const toggleSelectPreset = (id: string) => {
    setSelectedPresetIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedPresetIds(new Set(filteredPresets.map(p => p.id)));
  };

  const clearSelection = () => {
    setSelectedPresetIds(new Set());
  };

  // Ajouter tous les objets sélectionnés en lot
  const handleAddSelectedBatch = (addToList: boolean = false) => {
    const toAdd = GENERIC_PRESETS.filter(p => selectedPresetIds.has(p.id));
    if (toAdd.length === 0) return;

    const newItems: SuitcaseItem[] = toAdd.map(preset => ({
      id: "item_" + Math.random().toString(36).substring(2, 11),
      name: preset.name,
      category: preset.category === "Matériel Régie & Technique" ? "Matériel Régie" : preset.category,
      description: preset.description,
      tags: preset.tags.length > 0 ? preset.tags : undefined,
      quantityOwned: preset.defaultQty || 1,
      icon: preset.icon,
      colorHint: preset.colorHint,
      imageUrl: presetPhotos[preset.id] || preset.imageUrl
    }));

    let updatedLists = lists;
    if (addToList && activeList) {
      const newListItems: SuitcaseListItem[] = newItems.map(it => ({
        itemId: it.id,
        quantityNeeded: 1,
        isPacked: false
      }));
      updatedLists = lists.map(l => l.id === activeList.id ? { ...l, items: [...l.items, ...newListItems] } : l);
    }

    updateDb({
      ...db,
      suitcaseItems: [...existingItems, ...newItems],
      suitcaseLists: updatedLists
    });

    setSelectedPresetIds(new Set());
    showFeedback(`${newItems.length} objets génériques ajoutés à votre inventaire avec succès !`);
  };

  return (
    <div className="space-y-4">
      {/* INPUT FICHIER CACHÉ POUR PHOTO RAPIDE */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (photoUploadPresetId) {
            handlePhotoFileUpload(e, photoUploadPresetId);
            setPhotoUploadPresetId(null);
          }
        }}
      />

      {/* BANNIÈRE DE PRESENTATION / FEEDBACK */}
      {feedbackMessage && (
        <div className="bg-emerald-400 text-black border-3 border-black p-2.5 font-mono font-black text-xs shadow-[3px_3px_0px_#000] flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="font-mono text-xs font-bold hover:underline cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* HEADER DE RECHERCHE ET DE FILTRES */}
      <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="font-mono font-black text-sm uppercase text-black">
                Catalogue d'Objets Génériques Préfabriqués
              </h2>
              <span className="font-mono text-[10px] font-bold bg-amber-200 border border-black px-1.5 py-0.5">
                {GENERIC_PRESETS.length} modèles
              </span>
            </div>
            <p className="font-mono text-[11px] text-gray-600 mt-0.5">
              Tuiles avec visuel 1/3 (illustrations SVG fidèles ou photos personnalisées). Sélectionnez ou modifiez les affaires à importer.
            </p>
          </div>

          {/* BARRE DE RECHERCHE */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher (ex: tshirt bleu, chargeur...)"
              className="w-full pl-8 pr-3 py-1.5 border-2 border-black font-mono text-xs focus:outline-none focus:bg-amber-50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black font-mono text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* CATÉGORIES EN PILULES */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t-2 border-gray-100">
          {GENERIC_PRESET_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-[11px] font-mono font-black uppercase border-2 border-black cursor-pointer transition-all ${
                  isSelected
                    ? "bg-black text-white shadow-[1.5px_1.5px_0px_#000]"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ACTIONS DE SÉLECTION GROUPÉE */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-dashed border-gray-300">
          <div className="flex items-center gap-2">
            <button
              onClick={selectAllFiltered}
              className="text-[10.5px] font-mono font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-black" />
              Tout sélectionner ({filteredPresets.length})
            </button>
            {selectedPresetIds.size > 0 && (
              <button
                onClick={clearSelection}
                className="text-[10.5px] font-mono font-bold text-gray-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                Désélectionner ({selectedPresetIds.size})
              </button>
            )}
          </div>

          {selectedPresetIds.size > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleAddSelectedBatch(false)}
                className="border-2 border-black bg-emerald-400 hover:bg-emerald-500 text-black px-3 py-1 font-mono font-black text-xs uppercase cursor-pointer shadow-[2px_2px_0px_#000] flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                Ajouter la sélection ({selectedPresetIds.size}) à mes affaires
              </button>
              {activeList && (
                <button
                  onClick={() => handleAddSelectedBatch(true)}
                  className="border-2 border-black bg-sky-300 hover:bg-sky-400 text-black px-3 py-1 font-mono font-black text-xs uppercase cursor-pointer shadow-[2px_2px_0px_#000] flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  + Ajouter aussi dans « {activeList.name} »
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* GRILLE DES OBJETS PRÉFABRIQUÉS : TUILES AVEC 1/3 VISUEL */}
      {filteredPresets.length === 0 ? (
        <div className="border-4 border-black border-dashed bg-white p-12 text-center text-gray-400 font-mono text-xs shadow-[3px_3px_0px_#000]">
          Aucun objet préfabriqué ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPresets.map((preset) => {
            const isSelected = selectedPresetIds.has(preset.id);
            const alreadyExists = isAlreadyInInventory(preset);
            const isCustomizing = customizingPresetId === preset.id;
            const currentPhoto = presetPhotos[preset.id] || preset.imageUrl;

            return (
              <div
                key={preset.id}
                className={`border-3 border-black bg-white transition-all flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? "bg-amber-50 border-black shadow-[4px_4px_0px_#000]"
                    : alreadyExists
                    ? "bg-emerald-50/40 border-gray-400 shadow-[2px_2px_0px_#000]"
                    : "shadow-[3px_3px_0px_#000] hover:border-black"
                }`}
              >
                {/* TUILE COMPOSÉE : 1/3 IMAGE À GAUCHE | 2/3 DÉTAILS À DROITE */}
                <div className="flex flex-row min-h-[135px]">
                  
                  {/* ZONE 1/3 VISUEL (PHOTO OU ILLUSTRATION SVG SUR-MESURE) */}
                  <div className="w-1/3 min-w-[100px] max-w-[130px] bg-gray-50 border-r-2 border-black flex flex-col items-center justify-center p-2 relative shrink-0">
                    <div className="w-full h-24 flex items-center justify-center">
                      <SuitcaseItemIllustration
                        item={{
                          name: isCustomizing ? customName : preset.name,
                          category: isCustomizing ? customCategory : preset.category,
                          icon: isCustomizing ? customIcon : preset.icon,
                          imageUrl: isCustomizing ? (customImageUrl || currentPhoto) : currentPhoto,
                          colorHint: isCustomizing ? customColorHint : preset.colorHint
                        }}
                        presetId={preset.id}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* BOUTON RAPIDE CHANGER/AJOUTER PHOTO */}
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUploadPresetId(preset.id);
                        fileInputRef.current?.click();
                      }}
                      className="mt-1 px-1.5 py-0.5 bg-white hover:bg-yellow-200 border border-black text-[8px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-[1px_1px_0px_#000]"
                      title="Remplacer par une photo réelle"
                    >
                      <Camera className="w-2.5 h-2.5" />
                      {currentPhoto ? "Photo ✓" : "+ Photo"}
                    </button>
                  </div>

                  {/* ZONE 2/3 CONTENU & INFORMATIONS */}
                  <div className="w-2/3 p-2.5 flex flex-col justify-between flex-1">
                    <div>
                      {/* EN-TÊTE : SÉLECTION & TITRE */}
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <div className="flex items-start gap-1.5 flex-1 truncate">
                          <button
                            onClick={() => toggleSelectPreset(preset.id)}
                            className={`w-4 h-4 border-2 border-black flex items-center justify-center cursor-pointer transition-colors shrink-0 mt-0.5 ${
                              isSelected ? "bg-black text-white" : "bg-white hover:bg-gray-100"
                            }`}
                            title="Sélectionner pour ajout groupé"
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>

                          <div className="truncate">
                            <h3 className="font-mono font-black text-xs text-black leading-tight truncate" title={preset.name}>
                              {preset.name}
                            </h3>
                            <span className="font-mono text-[9px] text-gray-500 uppercase block truncate">
                              {preset.category}
                            </span>
                          </div>
                        </div>

                        {alreadyExists && (
                          <span className="bg-emerald-200 border border-black text-[8.5px] font-mono font-black px-1 py-0.2 text-emerald-950 shrink-0">
                            ✓ Possédé
                          </span>
                        )}
                      </div>

                      {/* DESCRIPTION / NOTE */}
                      {preset.description && (
                        <p className="font-mono text-[10px] text-gray-600 mb-1.5 line-clamp-2 leading-tight">
                          {preset.description}
                        </p>
                      )}

                      {/* TAGS ET QUANTITÉ RECOMMANDÉE */}
                      <div className="flex flex-wrap gap-1 mb-1">
                        {preset.tags.map(t => (
                          <span key={t} className="text-[8.5px] font-mono bg-gray-100 border border-black px-1 text-gray-700">
                            #{t}
                          </span>
                        ))}
                        <span className="text-[8.5px] font-mono bg-yellow-100 border border-black px-1 text-black font-bold">
                          Qté: {preset.defaultQty}
                        </span>
                      </div>
                    </div>

                    {/* BOUTONS D'ACTION SUR LA CARTE */}
                    {!isCustomizing && (
                      <div className="flex items-center gap-1 pt-1.5 border-t border-dashed border-gray-300 mt-1">
                        <button
                          onClick={() => handleAddSingleItem(preset, false)}
                          className="flex-1 py-1 px-1.5 border-2 border-black bg-emerald-300 hover:bg-emerald-400 font-mono font-black text-[9.5px] uppercase cursor-pointer flex items-center justify-center gap-0.5 transition-colors shadow-[1px_1px_0px_#000]"
                          title="Ajouter directement à mon inventaire"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                          Ajouter
                        </button>

                        <button
                          onClick={() => startCustomizing(preset)}
                          className="py-1 px-1.5 border-2 border-black bg-gray-100 hover:bg-yellow-200 font-mono font-black text-[9.5px] uppercase cursor-pointer flex items-center gap-0.5 transition-colors shadow-[1px_1px_0px_#000]"
                          title="Modifier le nom, couleur ou quantité avant d'ajouter"
                        >
                          <Edit3 className="w-3 h-3" />
                          Modif
                        </button>

                        {activeList && (
                          <button
                            onClick={() => handleAddSingleItem(preset, true)}
                            className="py-1 px-1.5 border-2 border-black bg-sky-200 hover:bg-sky-300 font-mono font-black text-[9.5px] uppercase cursor-pointer flex items-center gap-0.5 transition-colors shadow-[1px_1px_0px_#000]"
                            title={`Ajouter directement à ${activeList.name}`}
                          >
                            + Valise
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* FORMULAIRE DE PERSONNALISATION INLINE DÉPLIABLE */}
                {isCustomizing && (
                  <div className="p-3 bg-yellow-50 border-t-3 border-black space-y-2.5 animate-fadeIn font-mono text-xs">
                    <div className="font-black text-[10px] uppercase text-black flex justify-between items-center pb-1 border-b border-black/10">
                      <span className="flex items-center gap-1">
                        <Palette className="w-3.5 h-3.5 text-amber-600" />
                        Personnaliser l'objet :
                      </span>
                      <button onClick={() => setCustomizingPresetId(null)} className="text-gray-500 hover:text-black font-bold">✕</button>
                    </div>

                    {/* NOM */}
                    <div>
                      <label className="text-[9px] font-bold uppercase text-gray-600 block">Nom :</label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full border-2 border-black px-1.5 py-0.5 bg-white text-xs font-bold"
                      />
                    </div>

                    {/* SÉLECTEUR DE COULEUR EN LIGNE (NUANCIER + INPUT COLOR) */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-gray-600 block">Couleur du vêtement / objet :</label>
                      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border-2 border-black">
                        {PRESET_COLOR_SWATCHES.map((swatch) => (
                          <button
                            key={swatch.hex}
                            type="button"
                            onClick={() => setCustomColorHint(swatch.hex)}
                            className={`w-5 h-5 border border-black cursor-pointer transition-transform relative ${
                              customColorHint.toLowerCase() === swatch.hex.toLowerCase()
                                ? "scale-110 ring-2 ring-black z-10"
                                : "hover:scale-105"
                            }`}
                            style={{ backgroundColor: swatch.hex }}
                            title={swatch.label}
                          />
                        ))}

                        {/* Sélecteur libre de couleur */}
                        <div className="flex items-center gap-1 pl-1 border-l border-gray-300">
                          <input
                            type="color"
                            value={customColorHint}
                            onChange={(e) => setCustomColorHint(e.target.value)}
                            className="w-5 h-5 border border-black p-0 cursor-pointer"
                            title="Choisir une couleur personnalisée"
                          />
                          <span className="text-[8.5px] font-mono text-gray-500 uppercase">{customColorHint}</span>
                        </div>
                      </div>
                    </div>

                    {/* QUANTITÉ & ÉMOJI */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold uppercase text-gray-600 block">Icône / Émoji :</label>
                        <input
                          type="text"
                          value={customIcon}
                          onChange={(e) => setCustomIcon(e.target.value)}
                          className="w-full border-2 border-black px-1.5 py-0.5 bg-white text-xs text-center font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase text-gray-600 block">Quantité :</label>
                        <div className="flex items-stretch border-2 border-black bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setCustomQty(q => Math.max(1, q - 1))}
                            className="px-2 bg-gray-100 hover:bg-gray-200 border-r border-black font-bold text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={customQty}
                            onChange={(e) => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-1 py-0.5 bg-white text-xs text-center font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setCustomQty(q => q + 1)}
                            className="px-2 bg-gray-100 hover:bg-gray-200 border-l border-black font-bold text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* PHOTO PERSONNALISÉE DANS L'ÉDITEUR */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-gray-600 block">Photo de l'objet (fichier ou URL) :</label>
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={customImageUrl || ""}
                          onChange={(e) => setCustomImageUrl(e.target.value)}
                          placeholder="https://... ou téléverser ci-contre"
                          className="flex-1 border-2 border-black px-1.5 py-0.5 bg-white text-[10px]"
                        />
                        <label className="px-2 py-0.5 bg-white border-2 border-black text-[10px] font-bold cursor-pointer hover:bg-gray-100 flex items-center gap-1 shadow-[1px_1px_0px_#000]">
                          <Upload className="w-3 h-3" />
                          Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoFileUpload(e)}
                          />
                        </label>
                        {customImageUrl && (
                          <button
                            type="button"
                            onClick={() => setCustomImageUrl(undefined)}
                            className="px-1.5 py-0.5 bg-red-100 border border-black text-red-700 text-[10px] hover:bg-red-200 cursor-pointer"
                            title="Supprimer la photo"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* DESCRIPTION / NOTE */}
                    <div>
                      <label className="text-[9px] font-bold uppercase text-gray-600 block">Description / Note :</label>
                      <input
                        type="text"
                        value={customDesc}
                        onChange={(e) => setCustomDesc(e.target.value)}
                        className="w-full border-2 border-black px-1.5 py-0.5 bg-white text-[10.5px]"
                        placeholder="ex: col V, taille M, couleur spécifique..."
                      />
                    </div>

                    {/* ACTIONS D'ENREGISTREMENT */}
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveCustomItem(false)}
                        className="flex-1 bg-black text-white font-mono font-black text-[10.5px] uppercase py-1.5 border-2 border-black hover:bg-gray-800 cursor-pointer shadow-[2px_2px_0px_#000]"
                      >
                        Enregistrer
                      </button>
                      {activeList && (
                        <button
                          type="button"
                          onClick={() => handleSaveCustomItem(true)}
                          className="flex-1 bg-sky-300 text-black font-mono font-black text-[10.5px] uppercase py-1.5 border-2 border-black hover:bg-sky-400 cursor-pointer shadow-[2px_2px_0px_#000]"
                        >
                          + Dans liste
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
