import React, { useState, useMemo, useEffect, useRef } from "react";
import { AppDatabase, SuitcaseItem, SuitcaseList, SuitcaseListItem, SuitcaseTemplate } from "../../types";
import { SuitcasePresetsTab } from "./suitcase/SuitcasePresetsTab";
import { SuitcaseItemIllustration } from "./suitcase/SuitcaseItemIllustration";
import { PRESET_COLOR_SWATCHES } from "./suitcase/suitcasePresets";
import { 
  Briefcase, Search, Plus, Minus, Trash2, Check, Filter, ArrowUpDown, 
  Tag, Backpack, FolderOpen, ClipboardCheck, Copy, RotateCcw, Bookmark, 
  CheckCheck, Layers, X, Sparkles, CheckSquare, Eye, Camera, Upload, Image as ImageIcon,
  Palette
} from "lucide-react";

interface SuitcaseViewProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
}

const CATEGORIES = [
  "Vêtements",
  "Électronique",
  "Matériel Régie",
  "Hygiène",
  "Documents",
  "Autre"
];

const ITEM_TAGS = [
  "Indispensable",
  "Fragile",
  "Hiver",
  "Été",
  "Prestige",
  "Lourd"
];

const PACKING_EMOJIS = [
  "👕", "👖", "🧥", "🧦", "👟", "🧢", "🎒", "🎬", "📷", "🎤", 
  "🔌", "💻", "📱", "🔦", "🛠️", "💾", "🎧", "🧼", "🪥", "🧴", 
  "💊", "🩹", "📄", "🎫", "🔑", "📛", "🖊️", "📦", "💧", "☕",
  "🗺️", "🛏️", "🕶️", "🧣", "🌂", "🍎", "🧺", "🧻", "🚿", "🧸"
];

// Fonction intelligente d'icône automatique
export const getAutoIcon = (name: string, category: string): string => {
  const normalized = name.toLowerCase();
  
  if (normalized.includes("chargeur") || normalized.includes("câble") || normalized.includes("cable") || normalized.includes("prise") || normalized.includes("usb")) return "🔌";
  if (normalized.includes("caméra") || normalized.includes("camera") || normalized.includes("photo") || normalized.includes("gopro") || normalized.includes("video")) return "📷";
  if (normalized.includes("micro") || normalized.includes("son") || normalized.includes("hf") || normalized.includes("audio") || normalized.includes("xlr")) return "🎤";
  if (normalized.includes("pantalon") || normalized.includes("jean") || normalized.includes("short")) return "👖";
  if (normalized.includes("chaussette")) return "🧦";
  if (normalized.includes("veste") || normalized.includes("manteau") || normalized.includes("kway") || normalized.includes("blouson") || normalized.includes("pull")) return "🧥";
  if (normalized.includes("tshirt") || normalized.includes("t-shirt") || normalized.includes("chemise") || normalized.includes("maillot") || normalized.includes("vetement") || normalized.includes("vêtement")) return "👕";
  if (normalized.includes("chaussure") || normalized.includes("basket") || normalized.includes("botte") || normalized.includes("soulier")) return "👟";
  if (normalized.includes("shampoing") || normalized.includes("gel douche") || normalized.includes("savon") || normalized.includes("creme") || normalized.includes("crème")) return "🧴";
  if (normalized.includes("brosse à dents") || normalized.includes("brosse a dents") || normalized.includes("dentifrice") || normalized.includes("dent")) return "🪥";
  if (normalized.includes("serviette") || normalized.includes("gant") || normalized.includes("eponge") || normalized.includes("éponge")) return "🧼";
  if (normalized.includes("passeport") || normalized.includes("carte d'identité") || normalized.includes("cni") || normalized.includes("permis") || normalized.includes("papiers") || normalized.includes("ticket") || normalized.includes("billet")) return "🎫";
  if (normalized.includes("badge") || normalized.includes("accréd") || normalized.includes("pass")) return "📛";
  if (normalized.includes("stylo") || normalized.includes("crayon") || normalized.includes("bloc") || normalized.includes("carnet") || normalized.includes("papier") || normalized.includes("feuille")) return "📝";
  if (normalized.includes("médicament") || normalized.includes("doliprane") || normalized.includes("cachet") || normalized.includes("aspirine")) return "💊";
  if (normalized.includes("ordinateur") || normalized.includes("ordi") || normalized.includes("pc") || normalized.includes("mac") || normalized.includes("laptop")) return "💻";
  if (normalized.includes("téléphone") || normalized.includes("tel") || normalized.includes("iphone") || normalized.includes("smartphone")) return "📱";
  if (normalized.includes("lampe") || normalized.includes("frontale") || normalized.includes("projecteur") || normalized.includes("torche") || normalized.includes("eclairage")) return "🔦";
  if (normalized.includes("scotche") || normalized.includes("gaffer") || normalized.includes("pince") || normalized.includes("outil") || normalized.includes("cle") || normalized.includes("tournevis")) return "🛠️";
  if (normalized.includes("gourde") || normalized.includes("bouteille") || normalized.includes("eau") || normalized.includes("boisson")) return "💧";
  if (normalized.includes("casquette") || normalized.includes("bonnet") || normalized.includes("chapeau") || normalized.includes("beret")) return "🧠";
  if (normalized.includes("clé") || normalized.includes("clef")) return "🔑";

  switch (category) {
    case "Vêtements": return "👕";
    case "Électronique": return "🔌";
    case "Matériel Régie": return "🎬";
    case "Hygiène": return "🧼";
    case "Documents": return "📄";
    default: return "📦";
  }
};

export default function SuitcaseView({ db, updateDb }: SuitcaseViewProps) {
  const items: SuitcaseItem[] = db.suitcaseItems || [];
  const lists: SuitcaseList[] = db.suitcaseLists || [];

  const [activeTab, setActiveTab] = useState<"inventory" | "lists" | "presets">("lists");
  
  // États de l'onglet Inventaire
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes");
  const [selectedTag, setSelectedTag] = useState<string>("Tous");
  const [sortBy, setSortBy] = useState<"name" | "category" | "quantity">("name");

  // Formulaire Nouvel Objet
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState(CATEGORIES[0]);
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemColorHint, setNewItemColorHint] = useState("#3b82f6");
  const [newItemTags, setNewItemTags] = useState<string[]>([]);
  const [newItemIcon, setNewItemIcon] = useState("");
  const [isIconCustomized, setIsIconCustomized] = useState(false);
  const [newItemImageUrl, setNewItemImageUrl] = useState<string>("");
  const [itemFormError, setItemFormError] = useState("");

  // Upload photo inventaire
  const [photoUploadItemId, setPhotoUploadItemId] = useState<string | null>(null);
  const inventoryFileInputRef = useRef<HTMLInputElement | null>(null);

  // Confirmer suppressions / Édition d'icône & couleur en ligne
  const [confirmDeleteItemId, setConfirmDeleteItemId] = useState<string | null>(null);
  const [confirmDeleteListId, setConfirmDeleteListId] = useState<string | null>(null);
  const [editingIconItemId, setEditingIconItemId] = useState<string | null>(null);
  const [editingColorItemId, setEditingColorItemId] = useState<string | null>(null);

  // États des Modèles Réutilisables & Mode Vérification
  const templates: SuitcaseTemplate[] = db.suitcaseTemplates || [];
  const [isVerificationMode, setIsVerificationMode] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState<"all" | "unpacked" | "packed">("all");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState("");
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<string | null>(null);

  // États de l'onglet Listes
  const [selectedListId, setSelectedListId] = useState<string>(lists[0]?.id || "");
  const [newListName, setNewListName] = useState("");
  const [newListType, setNewListType] = useState<"perso" | "regie" | "autre">("perso");
  const [newListDesc, setNewListDesc] = useState("");
  const [listFormError, setListFormError] = useState("");
  const [listSearchQuery, setListSearchQuery] = useState("");

  const activeList = useMemo(() => lists.find(l => l.id === selectedListId), [lists, selectedListId]);

  // Synchronisation automatique de l'icône formulaire si non personnalisée à la main
  useEffect(() => {
    if (!isIconCustomized) {
      setNewItemIcon(getAutoIcon(newItemName, newItemCategory));
    }
  }, [newItemName, newItemCategory, isIconCustomized]);

  // Téléversement d'une photo réelle pour un objet d'inventaire
  const handleItemPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, targetItemId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        if (targetItemId) {
          handleUpdateItemPhoto(targetItemId, result);
        } else {
          setNewItemImageUrl(result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateItemPhoto = (itemId: string, photoUrl: string | undefined) => {
    const updated = items.map(it => it.id === itemId ? { ...it, imageUrl: photoUrl } : it);
    updateDb({
      ...db,
      suitcaseItems: updated
    });
  };

  // Ajouter un objet dans l'inventaire
  const handleAddInventoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    setItemFormError("");
    const trimmedName = newItemName.trim();
    if (!trimmedName) {
      setItemFormError("Nom requis");
      return;
    }

    const finalIcon = newItemIcon || getAutoIcon(trimmedName, newItemCategory);

    const newItem: SuitcaseItem = {
      id: "item_" + Math.random().toString(36).substring(2, 11),
      name: trimmedName,
      category: newItemCategory,
      description: newItemDesc.trim() || undefined,
      tags: newItemTags.length > 0 ? newItemTags : undefined,
      quantityOwned: newItemQty > 0 ? newItemQty : 1,
      icon: finalIcon,
      colorHint: newItemColorHint,
      imageUrl: newItemImageUrl.trim() || undefined
    };

    updateDb({
      ...db,
      suitcaseItems: [...items, newItem]
    });

    // Reset formulaire
    setNewItemName("");
    setNewItemDesc("");
    setNewItemQty(1);
    setNewItemTags([]);
    setNewItemImageUrl("");
    setNewItemColorHint("#3b82f6");
    setIsIconCustomized(false);
  };

  const handleDeleteInventoryItem = (itemId: string) => {
    const updatedItems = items.filter(i => i.id !== itemId);
    const updatedLists = lists.map(lst => ({
      ...lst,
      items: lst.items.filter(li => li.itemId !== itemId)
    }));

    updateDb({
      ...db,
      suitcaseItems: updatedItems,
      suitcaseLists: updatedLists
    });
    setConfirmDeleteItemId(null);
  };

  const handleUpdateItemQty = (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    const updatedItems = items.map(i => i.id === itemId ? { ...i, quantityOwned: newQty } : i);
    updateDb({
      ...db,
      suitcaseItems: updatedItems
    });
  };

  const handleUpdateItemIcon = (itemId: string, newIcon: string) => {
    const updatedItems = items.map(i => i.id === itemId ? { ...i, icon: newIcon } : i);
    updateDb({
      ...db,
      suitcaseItems: updatedItems
    });
  };

  const handleUpdateItemColor = (itemId: string, newColor: string) => {
    const updatedItems = items.map(i => i.id === itemId ? { ...i, colorHint: newColor } : i);
    updateDb({
      ...db,
      suitcaseItems: updatedItems
    });
  };

  // Créer une nouvelle Liste
  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    setListFormError("");
    const trimmedName = newListName.trim();
    if (!trimmedName) {
      setListFormError("Nom requis");
      return;
    }

    const newList: SuitcaseList = {
      id: "list_" + Math.random().toString(36).substring(2, 11),
      name: trimmedName,
      type: newListType,
      description: newListDesc.trim() || undefined,
      items: [],
      createdAt: new Date().toISOString()
    };

    const nextLists = [...lists, newList];
    updateDb({
      ...db,
      suitcaseLists: nextLists
    });

    setSelectedListId(newList.id);
    setNewListName("");
    setNewListDesc("");
  };

  const handleDeleteList = (listId: string) => {
    const updatedLists = lists.filter(l => l.id !== listId);
    updateDb({
      ...db,
      suitcaseLists: updatedLists
    });
    
    setConfirmDeleteListId(null);
    if (selectedListId === listId) {
      setSelectedListId(updatedLists[0]?.id || "");
    }
  };

  // Gérer la composition de la liste active
  const handleAddItemToList = (itemId: string) => {
    if (!activeList) return;
    if (activeList.items.some(li => li.itemId === itemId)) return;

    const newListItem: SuitcaseListItem = {
      itemId,
      quantityNeeded: 1,
      isPacked: false
    };

    const updatedLists = lists.map(lst => {
      if (lst.id === activeList.id) {
        return {
          ...lst,
          items: [...lst.items, newListItem]
        };
      }
      return lst;
    });

    updateDb({
      ...db,
      suitcaseLists: updatedLists
    });
  };

  const handleRemoveItemFromList = (itemId: string) => {
    if (!activeList) return;

    const updatedLists = lists.map(lst => {
      if (lst.id === activeList.id) {
        return {
          ...lst,
          items: lst.items.filter(li => li.itemId !== itemId)
        };
      }
      return lst;
    });

    updateDb({
      ...db,
      suitcaseLists: updatedLists
    });
  };

  const handleUpdateListQtyNeeded = (itemId: string, newQty: number) => {
    if (!activeList || newQty < 1) return;

    const updatedLists = lists.map(lst => {
      if (lst.id === activeList.id) {
        return {
          ...lst,
          items: lst.items.map(li => li.itemId === itemId ? { ...li, quantityNeeded: newQty } : li)
        };
      }
      return lst;
    });

    updateDb({
      ...db,
      suitcaseLists: updatedLists
    });
  };

  const handleTogglePacked = (itemId: string) => {
    if (!activeList) return;

    const updatedLists = lists.map(lst => {
      if (lst.id === activeList.id) {
        return {
          ...lst,
          items: lst.items.map(li => li.itemId === itemId ? { ...li, isPacked: !li.isPacked } : li)
        };
      }
      return lst;
    });

    updateDb({
      ...db,
      suitcaseLists: updatedLists
    });
  };

  const handleResetListPacked = () => {
    if (!activeList) return;

    const updatedLists = lists.map(lst => {
      if (lst.id === activeList.id) {
        return {
          ...lst,
          items: lst.items.map(li => ({ ...li, isPacked: false }))
        };
      }
      return lst;
    });

    updateDb({
      ...db,
      suitcaseLists: updatedLists
    });
  };

  const handlePackAll = () => {
    if (!activeList) return;

    const updatedLists = lists.map(lst => {
      if (lst.id === activeList.id) {
        return {
          ...lst,
          items: lst.items.map(li => ({ ...li, isPacked: true }))
        };
      }
      return lst;
    });

    updateDb({
      ...db,
      suitcaseLists: updatedLists
    });
  };

  const handleSaveAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeList || activeList.items.length === 0) return;
    const name = templateNameInput.trim() || activeList.name;

    const newTemplate: SuitcaseTemplate = {
      id: "tpl_" + Math.random().toString(36).substring(2, 11),
      name,
      type: activeList.type,
      description: activeList.description,
      items: activeList.items.map(li => ({ itemId: li.itemId, quantityNeeded: li.quantityNeeded })),
      createdAt: new Date().toISOString()
    };

    updateDb({
      ...db,
      suitcaseTemplates: [...templates, newTemplate]
    });

    setTemplateNameInput("");
    setShowTemplateModal(false);
    setTemplateNotice(`Modèle "${name}" enregistré (${newTemplate.items.length} objets).`);
    setTimeout(() => setTemplateNotice(null), 3500);
  };

  const handleApplyTemplate = (template: SuitcaseTemplate, targetListId?: string) => {
    const listIdToUpdate = targetListId || selectedListId;
    if (!listIdToUpdate) return;

    const newItems: SuitcaseListItem[] = template.items.map(ti => ({
      itemId: ti.itemId,
      quantityNeeded: ti.quantityNeeded,
      isPacked: false
    }));

    const updatedLists = lists.map(lst => {
      if (lst.id === listIdToUpdate) {
        return {
          ...lst,
          items: newItems
        };
      }
      return lst;
    });

    updateDb({
      ...db,
      suitcaseLists: updatedLists
    });

    setTemplateNotice(`Modèle "${template.name}" appliqué à la liste.`);
    setTimeout(() => setTemplateNotice(null), 3500);
  };

  const handleCreateListFromTemplate = (template: SuitcaseTemplate) => {
    const newList: SuitcaseList = {
      id: "list_" + Math.random().toString(36).substring(2, 11),
      name: `${template.name}`,
      type: template.type || "perso",
      description: template.description,
      items: template.items.map(ti => ({
        itemId: ti.itemId,
        quantityNeeded: ti.quantityNeeded,
        isPacked: false
      })),
      createdAt: new Date().toISOString()
    };

    updateDb({
      ...db,
      suitcaseLists: [...lists, newList]
    });

    setSelectedListId(newList.id);
    setTemplateNotice(`Nouvelle liste créée depuis le modèle "${template.name}".`);
    setTimeout(() => setTemplateNotice(null), 3500);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    updateDb({
      ...db,
      suitcaseTemplates: updatedTemplates
    });
    setConfirmDeleteTemplateId(null);
  };

  const toggleTagInForm = (tag: string) => {
    if (newItemTags.includes(tag)) {
      setNewItemTags(newItemTags.filter(t => t !== tag));
    } else {
      setNewItemTags([...newItemTags, tag]);
    }
  };

  // Filtrer & Trier l'inventaire général
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== "Toutes") {
      result = result.filter(item => item.category === selectedCategory);
    }

    if (selectedTag !== "Tous") {
      result = result.filter(item => item.tags?.includes(selectedTag));
    }

    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "category") {
        return a.category.localeCompare(b.category);
      } else if (sortBy === "quantity") {
        return (b.quantityOwned || 1) - (a.quantityOwned || 1);
      }
      return 0;
    });

    return result;
  }, [items, searchQuery, selectedCategory, selectedTag, sortBy]);

  const itemsAvailableForActiveList = useMemo(() => {
    if (!activeList) return [];
    const activeItemIds = new Set(activeList.items.map(li => li.itemId));
    
    let result = items.filter(item => !activeItemIds.has(item.id));
    
    if (listSearchQuery.trim()) {
      const query = listSearchQuery.toLowerCase();
      result = result.filter(item => item.name.toLowerCase().includes(query));
    }
    
    return result;
  }, [items, activeList, listSearchQuery]);

  const listCompletionStats = useMemo(() => {
    if (!activeList || activeList.items.length === 0) return { packedCount: 0, totalCount: 0, percent: 0 };
    const totalCount = activeList.items.length;
    const packedCount = activeList.items.filter(li => li.isPacked).length;
    const percent = Math.round((packedCount / totalCount) * 100);
    return { packedCount, totalCount, percent };
  }, [activeList]);

  return (
    <div className="w-full space-y-4">
      {/* HEADER DE L'ONGLET */}
      <div className="border-4 border-black bg-yellow-300 p-4 shadow-[4px_4px_0px_0px_#000]">
        <div className="flex items-center gap-3">
          <Briefcase className="w-7 h-7 text-black stroke-[2.5]" />
          <div>
            <h1 className="font-mono font-black text-lg uppercase tracking-tight text-black">
              Modulor Valise & Régie
            </h1>
            <p className="font-mono text-[10.5px] text-gray-800 leading-none mt-1">
              Inventaire intelligent avec icônes de repérage et paquetage réactif sans surcharge.
            </p>
          </div>
        </div>
      </div>

      {/* SELECTEUR D'ONGLET INTERNE */}
      <div className="flex border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000] overflow-hidden">
        <button
          onClick={() => setActiveTab("lists")}
          className={`flex-1 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-center border-r-2 border-black last:border-r-0 cursor-pointer transition-colors ${
            activeTab === "lists" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          🧳 Listes actives ({lists.length})
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex-1 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-center border-r-2 border-black last:border-r-0 cursor-pointer transition-colors ${
            activeTab === "inventory" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          📦 Catalogue Inventaire ({items.length})
        </button>
        <button
          onClick={() => setActiveTab("presets")}
          className={`flex-1 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-center cursor-pointer transition-colors ${
            activeTab === "presets" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          ✨ Objets Préfabriqués
        </button>
      </div>

      {/* CONTENU : MONDES LISTES */}
      {activeTab === "lists" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* COLONNE GAUCHE */}
          <div className="lg:col-span-4 space-y-4">
            
            <div className="border-4 border-black bg-white p-3.5 shadow-[3px_3px_0px_0px_#000]">
              <h2 className="font-mono font-black text-xs uppercase mb-2 leading-none flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-sky-500" />
                Choisir une liste
              </h2>
              
              {lists.length === 0 ? (
                <div className="text-gray-400 font-mono text-[11px] py-4 text-center border-2 border-dashed border-gray-300">
                  Aucune liste créée
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {lists.map((lst) => {
                    const isSelected = lst.id === selectedListId;
                    const itemsCount = lst.items?.length || 0;
                    const packedCount = lst.items?.filter(li => li.isPacked).length || 0;
                    
                    return (
                      <div key={lst.id} className="flex gap-1.5 items-stretch">
                        <button
                          onClick={() => {
                            setSelectedListId(lst.id);
                            setConfirmDeleteListId(null);
                          }}
                          className={`flex-1 text-left px-2.5 py-1.5 border-2 border-black font-mono font-bold text-xs flex justify-between items-center transition-colors cursor-pointer ${
                            isSelected ? "bg-sky-200 text-black shadow-[1px_1px_0px_0px_#000]" : "bg-gray-50 text-black hover:bg-gray-100"
                          }`}
                        >
                          <span className="truncate flex items-center gap-1.5 max-w-[70%]">
                            {lst.type === "perso" ? "🎒" : lst.type === "regie" ? "🎬" : "📦"}
                            <span className="truncate">{lst.name}</span>
                          </span>
                          <span className="text-[10px] font-mono bg-white border border-black px-1.5 py-0.5 rounded-none flex items-center shrink-0">
                            {packedCount}/{itemsCount} ok
                          </span>
                        </button>
                        
                        {confirmDeleteListId === lst.id ? (
                          <button
                            onClick={() => handleDeleteList(lst.id)}
                            className="bg-red-500 text-white border-2 border-black px-2 text-[9px] font-black uppercase cursor-pointer hover:bg-red-600 animate-pulse"
                          >
                            OK?
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteListId(lst.id)}
                            className="bg-gray-100 hover:bg-red-100 text-gray-700 border-2 border-black px-2 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MODÈLES TYPES RÉUTILISABLES */}
            <div className="border-4 border-black bg-white p-3.5 shadow-[3px_3px_0px_0px_#000]">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-mono font-black text-xs uppercase leading-none flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-purple-600" />
                  Modèles ({templates.length})
                </h2>
                {activeList && activeList.items.length > 0 && (
                  <button
                    onClick={() => {
                      setShowTemplateModal(!showTemplateModal);
                      setTemplateNameInput(activeList.name);
                    }}
                    className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 border border-black bg-yellow-300 hover:bg-yellow-400 cursor-pointer"
                  >
                    + Sauvegarder
                  </button>
                )}
              </div>

              {/* Formulaire inline de sauvegarde de modèle */}
              {showTemplateModal && activeList && (
                <form onSubmit={handleSaveAsTemplate} className="mb-2.5 p-2 bg-yellow-50 border-2 border-black space-y-1.5">
                  <div className="text-[10px] font-mono font-black uppercase">Nommer le modèle :</div>
                  <input
                    type="text"
                    value={templateNameInput}
                    onChange={(e) => setTemplateNameInput(e.target.value)}
                    placeholder="ex : Tournage régie, Week-end 2 jours"
                    className="w-full border border-black px-2 py-1 font-mono text-xs bg-white"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      type="submit"
                      className="flex-1 py-1 bg-black text-white font-mono font-black text-[10px] uppercase border border-black cursor-pointer hover:bg-gray-800"
                    >
                      Enregistrer ({activeList.items.length} objets)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTemplateModal(false)}
                      className="px-2 py-1 bg-gray-200 font-mono font-bold text-[10px] border border-black cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </form>
              )}

              {/* Liste des modèles */}
              {templates.length === 0 ? (
                <div className="space-y-2">
                  <div className="text-gray-400 font-mono text-[11px] py-3 text-center border-2 border-dashed border-gray-300">
                    Aucun modèle sauvegardé
                  </div>
                  <button
                    onClick={() => {
                      const sampleRegieItems = items.filter(i => i.category === "Vidéo & Son" || i.category === "Énergie & Câbles").slice(0, 5);
                      const samplePersoItems = items.filter(i => i.category === "Vêtements" || i.category === "Hygiène").slice(0, 4);

                      const defaultTemplates: SuitcaseTemplate[] = [
                        {
                          id: "tpl_regie_sample",
                          name: "Tournage régie",
                          type: "regie",
                          description: "Kit régie & matériel technique de base",
                          items: (sampleRegieItems.length > 0 ? sampleRegieItems : items.slice(0, 4)).map(it => ({ itemId: it.id, quantityNeeded: 1 })),
                          createdAt: new Date().toISOString()
                        },
                        {
                          id: "tpl_weekend_sample",
                          name: "Week-end 2 jours",
                          type: "perso",
                          description: "Nécessaire essentiel pour court séjour",
                          items: (samplePersoItems.length > 0 ? samplePersoItems : items.slice(0, 3)).map(it => ({ itemId: it.id, quantityNeeded: 2 })),
                          createdAt: new Date().toISOString()
                        }
                      ];

                      updateDb({
                        ...db,
                        suitcaseTemplates: defaultTemplates
                      });
                      setTemplateNotice("Modèles types créés !");
                      setTimeout(() => setTemplateNotice(null), 3000);
                    }}
                    className="w-full py-1 text-[10px] font-mono font-black uppercase border border-black bg-purple-100 hover:bg-purple-200 cursor-pointer"
                  >
                    ✨ Charger modèles types
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {templates.map(tpl => (
                    <div key={tpl.id} className="border-2 border-black p-1.5 bg-gray-50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-xs text-black truncate flex items-center gap-1">
                          <span>{tpl.type === "regie" ? "🎬" : tpl.type === "perso" ? "🎒" : "📦"}</span>
                          <span className="truncate">{tpl.name}</span>
                        </span>
                        <span className="text-[9px] font-mono bg-white border border-black px-1">
                          {tpl.items.length} obj.
                        </span>
                      </div>
                      
                      <div className="flex gap-1 pt-0.5">
                        {activeList && (
                          <button
                            onClick={() => handleApplyTemplate(tpl)}
                            title="Remplacer le contenu de la liste active"
                            className="flex-1 py-0.5 text-[9px] font-mono font-black uppercase bg-white hover:bg-sky-100 border border-black cursor-pointer"
                          >
                            Appliquer
                          </button>
                        )}
                        <button
                          onClick={() => handleCreateListFromTemplate(tpl)}
                          title="Créer une nouvelle liste à partir de ce modèle"
                          className="flex-1 py-0.5 text-[9px] font-mono font-black uppercase bg-white hover:bg-emerald-100 border border-black cursor-pointer"
                        >
                          + Créer liste
                        </button>

                        {confirmDeleteTemplateId === tpl.id ? (
                          <button
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="px-1 py-0.5 text-[9px] font-mono font-black uppercase bg-red-500 text-white border border-black cursor-pointer animate-pulse"
                          >
                            OK?
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteTemplateId(tpl.id)}
                            className="px-1 py-0.5 text-[9px] font-mono text-gray-600 hover:bg-red-50 border border-black cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-4 border-black bg-white p-3.5 shadow-[3px_3px_0px_0px_#000]">
              <h2 className="font-mono font-black text-xs uppercase mb-2 leading-none flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-500" />
                Créer une liste
              </h2>
              
              <form onSubmit={handleCreateList} className="space-y-2.5">
                <div>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Nom (ex : Tournage Clip, Bagages Hiver)"
                    className="w-full border-2 border-black px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:bg-yellow-50 bg-gray-50"
                  />
                </div>
                
                <div className="grid grid-cols-3 border-2 border-black overflow-hidden font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => setNewListType("perso")}
                    className={`py-1 font-black uppercase text-center border-r border-black cursor-pointer ${
                      newListType === "perso" ? "bg-yellow-300 text-black" : "bg-white text-gray-500"
                    }`}
                  >
                    🎒 Perso
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewListType("regie")}
                    className={`py-1 font-black uppercase text-center border-r border-black last:border-r-0 cursor-pointer ${
                      newListType === "regie" ? "bg-[#e0b0ff] text-black" : "bg-white text-gray-500"
                    }`}
                  >
                    🎬 Régie
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewListType("autre")}
                    className={`py-1 font-black uppercase text-center last:border-r-0 cursor-pointer ${
                      newListType === "autre" ? "bg-sky-200 text-black" : "bg-white text-gray-500"
                    }`}
                  >
                    📦 Autre
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    value={newListDesc}
                    onChange={(e) => setNewListDesc(e.target.value)}
                    placeholder="Description (optionnel)"
                    className="w-full border-2 border-black px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:bg-yellow-50 bg-gray-50"
                  />
                </div>

                {listFormError && (
                  <div className="text-red-600 font-mono text-[10px] font-black uppercase">
                    ⚠️ {listFormError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-1.5 border-2 border-black bg-black hover:bg-gray-800 text-white font-mono font-black text-xs uppercase cursor-pointer transition-colors shadow-[1px_1px_0px_0px_#000]"
                >
                  Valider
                </button>
              </form>
            </div>
            
          </div>

          {/* COLONNE DROITE */}
          <div className="lg:col-span-8 space-y-4">
            {templateNotice && (
              <div className="bg-emerald-400 text-black border-2 border-black p-2 font-mono font-black text-xs shadow-[2px_2px_0px_#000] flex items-center justify-between">
                <span>{templateNotice}</span>
                <button onClick={() => setTemplateNotice(null)} className="font-bold text-xs hover:underline cursor-pointer">✕</button>
              </div>
            )}

            {activeList ? (
              isVerificationMode ? (
                /* VUE ÉPURÉE MODE VÉRIFICATION */
                <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] space-y-4">
                  {/* EN-TÊTE MODE VÉRIFICATION */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3 bg-amber-50 p-3 -m-4 mb-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {activeList.type === "perso" ? "🎒" : activeList.type === "regie" ? "🎬" : "📦"}
                        </span>
                        <h3 className="font-mono font-black text-base uppercase text-black leading-tight">
                          {activeList.name}
                        </h3>
                        <span className="bg-black text-white text-[9px] font-mono font-black uppercase px-2 py-0.5 border border-black">
                          Mode Vérification
                        </span>
                      </div>
                      <p className="font-mono text-xs font-black text-emerald-800 mt-1">
                        👉 {listCompletionStats.packedCount}/{listCompletionStats.totalCount} emballés ({listCompletionStats.percent}%)
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handlePackAll}
                        className="border-2 border-black bg-emerald-200 hover:bg-emerald-300 px-2.5 py-1 font-mono font-black text-[10px] uppercase cursor-pointer transition-colors shadow-[1px_1px_0px_#000]"
                      >
                        Tout emballer
                      </button>
                      <button
                        onClick={handleResetListPacked}
                        className="border-2 border-black bg-gray-100 hover:bg-gray-200 px-2.5 py-1 font-mono font-black text-[10px] uppercase cursor-pointer transition-colors shadow-[1px_1px_0px_#000]"
                      >
                        Réinitialiser
                      </button>
                      <button
                        onClick={() => setIsVerificationMode(false)}
                        className="border-2 border-black bg-black text-white hover:bg-gray-800 px-3 py-1 font-mono font-black text-[10px] uppercase cursor-pointer transition-colors shadow-[1px_1px_0px_#000]"
                      >
                        ✕ Quitter
                      </button>
                    </div>
                  </div>

                  {/* BARRE DE PROGRESSION VISUELLE */}
                  <div className="w-full bg-gray-200 border-2 border-black h-4 overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full border-r-2 border-black transition-all duration-200" 
                      style={{ width: `${listCompletionStats.percent}%` }}
                    />
                  </div>

                  {/* FILTRES RAPIDES */}
                  <div className="flex gap-1.5 border-b-2 border-gray-200 pb-2">
                    <button
                      onClick={() => setVerificationFilter("all")}
                      className={`px-3 py-1 text-xs font-mono font-black uppercase border-2 border-black cursor-pointer transition-all ${
                        verificationFilter === "all" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
                      }`}
                    >
                      Tous ({listCompletionStats.totalCount})
                    </button>
                    <button
                      onClick={() => setVerificationFilter("unpacked")}
                      className={`px-3 py-1 text-xs font-mono font-black uppercase border-2 border-black cursor-pointer transition-all ${
                        verificationFilter === "unpacked" ? "bg-amber-400 text-black shadow-[1.5px_1.5px_0px_#000]" : "bg-white text-black hover:bg-gray-100"
                      }`}
                    >
                      À emballer ({listCompletionStats.totalCount - listCompletionStats.packedCount})
                    </button>
                    <button
                      onClick={() => setVerificationFilter("packed")}
                      className={`px-3 py-1 text-xs font-mono font-black uppercase border-2 border-black cursor-pointer transition-all ${
                        verificationFilter === "packed" ? "bg-emerald-400 text-black shadow-[1.5px_1.5px_0px_#000]" : "bg-white text-black hover:bg-gray-100"
                      }`}
                    >
                      Emballés ({listCompletionStats.packedCount})
                    </button>
                  </div>

                  {/* LISTE DES ITEMS EN MODE VÉRIFICATION */}
                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {activeList.items
                      .filter(li => {
                        if (verificationFilter === "unpacked") return !li.isPacked;
                        if (verificationFilter === "packed") return li.isPacked;
                        return true;
                      })
                      .map((listItem) => {
                        const itemCatalog = items.find(i => i.id === listItem.itemId);
                        if (!itemCatalog) return null;

                        return (
                          <div
                            key={listItem.itemId}
                            onClick={() => handleTogglePacked(listItem.itemId)}
                            className={`border-3 border-black p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all select-none shadow-[2px_2px_0px_#000] ${
                              listItem.isPacked
                                ? "bg-emerald-100/70 border-emerald-700 opacity-75"
                                : "bg-white hover:bg-yellow-50"
                            }`}
                          >
                            <div className="flex items-center gap-3 truncate">
                              <div className={`w-6 h-6 border-2 border-black flex items-center justify-center shrink-0 ${
                                listItem.isPacked ? "bg-emerald-500 text-white" : "bg-white"
                              }`}>
                                {listItem.isPacked ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                              </div>

                              <div className="w-10 h-10 bg-gray-100 border border-black shrink-0 overflow-hidden flex items-center justify-center">
                                <SuitcaseItemIllustration
                                  item={itemCatalog}
                                  className="w-full h-full object-contain"
                                />
                              </div>

                              <div className="truncate">
                                <span className={`font-mono font-black text-sm block truncate ${
                                  listItem.isPacked ? "line-through text-gray-500" : "text-black"
                                }`}>
                                  {itemCatalog.name}
                                </span>
                                <span className="font-mono text-[10px] text-gray-500 uppercase">
                                  {itemCatalog.category}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono font-black text-xs px-2 py-1 bg-white border border-black">
                                ×{listItem.quantityNeeded}
                              </span>
                              <span className={`font-mono font-bold text-[10px] uppercase px-2 py-1 border border-black ${
                                listItem.isPacked ? "bg-emerald-300 text-black" : "bg-amber-100 text-black"
                              }`}>
                                {listItem.isPacked ? "Emballé" : "À prendre"}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                    {listCompletionStats.packedCount === listCompletionStats.totalCount && listCompletionStats.totalCount > 0 && (
                      <div className="p-4 bg-emerald-100 border-3 border-black text-center font-mono font-black text-sm text-emerald-950">
                        🎉 Tout est emballé ! Valise prête au départ.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* VUE STANDARD ÉDITION DE LISTE */
                <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] space-y-4">
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-dashed border-black pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {activeList.type === "perso" ? "🎒" : activeList.type === "regie" ? "🎬" : "📦"}
                        </span>
                        <h3 className="font-mono font-black text-sm uppercase text-black leading-tight flex items-center gap-1.5">
                          {activeList.name}
                        </h3>
                        <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 border border-black ${
                          activeList.type === "perso" ? "bg-yellow-300" : activeList.type === "regie" ? "bg-[#e0b0ff]" : "bg-sky-200"
                        }`}>
                          {activeList.type === "perso" ? "Bagages" : activeList.type === "regie" ? "Régie" : "Autre"}
                        </span>
                      </div>
                      {activeList.description && (
                        <p className="font-mono text-[11px] text-gray-500 mt-0.5">
                          {activeList.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {activeList.items.length > 0 && (
                        <>
                          <button
                            onClick={() => setIsVerificationMode(true)}
                            className="border-2 border-black bg-emerald-300 hover:bg-emerald-400 px-2.5 py-1 font-mono font-black text-[10px] uppercase cursor-pointer flex items-center gap-1 shrink-0 transition-colors shadow-[1px_1px_0px_#000]"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            Mode Vérif ({listCompletionStats.packedCount}/{listCompletionStats.totalCount})
                          </button>
                          <button
                            onClick={handleResetListPacked}
                            className="border-2 border-black bg-gray-100 hover:bg-gray-200 px-2 py-1 font-mono font-black text-[9.5px] uppercase cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Réinit.
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {activeList.items.length > 0 && (
                    <div className="bg-gray-50 border-2 border-black p-2.5 flex items-center justify-between gap-4">
                      <div className="w-full">
                        <div className="flex justify-between items-center font-mono text-[10.5px] font-bold text-black mb-1">
                          <span>Statut des bagages</span>
                          <span className="font-black text-emerald-800">{listCompletionStats.packedCount} / {listCompletionStats.totalCount} ({listCompletionStats.percent}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 border border-black h-3 overflow-hidden rounded-none">
                          <div 
                            className="bg-emerald-400 h-full border-r border-black transition-all duration-300" 
                            style={{ width: `${listCompletionStats.percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                <div className="space-y-2">
                  <h4 className="font-mono font-black text-xs uppercase text-gray-500 tracking-wider">
                    Objets dans la valise ({activeList.items.length})
                  </h4>
                  
                  {activeList.items.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 p-8 text-center text-gray-400 font-mono text-xs">
                      Cette valise est vide. Utilisez le catalogue ci-dessous pour ajouter des objets.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                      {activeList.items.map((listItem) => {
                        const itemCatalog = items.find(i => i.id === listItem.itemId);
                        
                        if (!itemCatalog) {
                          return (
                            <div key={listItem.itemId} className="border border-red-200 p-2 font-mono text-[10.5px] text-red-500 bg-red-50 flex justify-between items-center">
                              <span>Objet supprimé du catalogue</span>
                              <button 
                                onClick={() => handleRemoveItemFromList(listItem.itemId)} 
                                className="font-black hover:underline text-xs"
                              >
                                Retirer
                              </button>
                            </div>
                          );
                        }

                        const currentIcon = itemCatalog.icon || getAutoIcon(itemCatalog.name, itemCatalog.category);

                        return (
                          <div 
                            key={listItem.itemId} 
                            className={`border-2 border-black p-2 flex items-center justify-between gap-2 transition-all ${
                              listItem.isPacked 
                                ? "bg-emerald-50 border-emerald-500 opacity-65" 
                                : "bg-white border-black"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate max-w-[60%]">
                              <button
                                onClick={() => handleTogglePacked(listItem.itemId)}
                                className={`w-5 h-5 border-2 border-black rounded-none flex items-center justify-center cursor-pointer transition-colors ${
                                  listItem.isPacked ? "bg-emerald-400" : "bg-white hover:bg-emerald-50"
                                }`}
                              >
                                {listItem.isPacked && <Check className="w-4 h-4 text-black stroke-[3]" />}
                              </button>

                              <div className="w-8 h-8 bg-gray-50 border border-black p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
                                <SuitcaseItemIllustration
                                  item={itemCatalog}
                                  className="w-full h-full object-contain"
                                />
                              </div>

                              <div className="truncate">
                                <span className={`font-mono font-black text-xs leading-none block truncate ${listItem.isPacked ? "line-through text-gray-400" : "text-black"}`}>
                                  {itemCatalog.name}
                                </span>
                                <span className="font-mono text-[9px] text-gray-400 uppercase block truncate mt-0.5">
                                  {itemCatalog.category}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center border-2 border-black bg-white overflow-hidden shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateListQtyNeeded(listItem.itemId, listItem.quantityNeeded - 1)}
                                  className="px-1.5 py-0.5 border-r border-black hover:bg-gray-100 cursor-pointer text-xs"
                                >
                                  -
                                </button>
                                <span className="px-2 font-mono font-bold text-xs select-none min-w-[12px] text-center">
                                  {listItem.quantityNeeded}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateListQtyNeeded(listItem.itemId, listItem.quantityNeeded + 1)}
                                  className="px-1.5 py-0.5 border-l border-black hover:bg-gray-100 cursor-pointer text-xs"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                onClick={() => handleRemoveItemFromList(listItem.itemId)}
                                className="bg-gray-50 hover:bg-red-100 text-gray-500 hover:text-red-700 border-2 border-black p-1 transition-colors cursor-pointer animate-fadeIn"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* MODULE AUTOMATIQUE D'AIDE AUX REMPLISSAGES */}
                <div className="border-t-2 border-black pt-4 mt-2 space-y-2.5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-mono font-black text-xs uppercase text-black flex items-center gap-1.5">
                        <Backpack className="w-4 h-4 text-emerald-500" />
                        Remplissage rapide
                      </h4>
                      <p className="font-mono text-[10px] text-gray-500">
                        Intégrez instantanément des objets du catalogue en un seul clic :
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={listSearchQuery}
                        onChange={(e) => setListSearchQuery(e.target.value)}
                        placeholder="Rechercher..."
                        className="border-2 border-black pl-7 pr-2.5 py-0.5 font-mono text-[10.5px] focus:outline-none bg-gray-50 max-w-[140px]"
                      />
                    </div>
                  </div>

                  {itemsAvailableForActiveList.length === 0 ? (
                    <div className="bg-yellow-50 border-2 border-dashed border-yellow-300 p-2 text-center font-mono text-[10px] text-yellow-800">
                      {items.length === 0 
                        ? 'Créez d\'abord des objets dans l\'onglet "Catalogue" pour commencer' 
                        : "Tous les objets disponibles ont été insérés."}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto p-1 bg-gray-50 border border-gray-200">
                      {itemsAvailableForActiveList.map((item) => {
                        const icon = item.icon || getAutoIcon(item.name, item.category);
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleAddItemToList(item.id)}
                            className="px-2 py-1 font-mono text-[11px] font-bold border-2 border-black bg-white hover:bg-yellow-100 cursor-pointer transition-colors flex items-center gap-1.5 max-w-[190px]"
                          >
                            <span>{icon}</span>
                            <span className="truncate">{item.name}</span>
                            <span className="text-[9px] text-gray-400 font-bold bg-gray-100 border border-gray-300 px-1 font-mono">
                              +
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )
          ) : (
            <div className="border-4 border-black border-dashed bg-white p-12 text-center text-gray-400 font-mono text-sm shadow-[4px_4px_0px_0px_#000]">
              Sélectionnez ou créez une liste de bagages dans la colonne de gauche.
            </div>
          )}
          </div>

        </div>
      )}

      {/* CONTENU : MONDE INVENTAIRE GENERALE */}
      {activeTab === "inventory" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* COLONNE GAUCHE : FORMULAIRE */}
          <div className="lg:col-span-4 space-y-4">
            <div className="border-4 border-black bg-white p-3.5 shadow-[3px_3px_0px_0px_#000] space-y-3">
              <h2 className="font-mono font-black text-xs uppercase text-black leading-none flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-500" />
                Déposer un nouvel objet
              </h2>

              <form onSubmit={handleAddInventoryItem} className="space-y-3">
                {/* APERÇU VISUEL ET PHOTO */}
                <div className="border-2 border-black bg-gray-50 p-2.5 space-y-2">
                  <span className="block font-mono text-[9px] font-black uppercase text-gray-700 leading-none">
                    Représentation visuelle (1/3 Photo ou Illustration SVG)
                  </span>

                  <div className="flex gap-2 items-center">
                    {/* Bloc 1/3 Image */}
                    <div className="w-16 h-16 border-2 border-black bg-white shrink-0 overflow-hidden relative flex items-center justify-center shadow-[1.5px_1.5px_0px_#000]">
                      <SuitcaseItemIllustration
                        item={{
                          id: "preview",
                          name: newItemName || "Objet",
                          category: newItemCategory,
                          icon: newItemIcon || getAutoIcon(newItemName, newItemCategory),
                          imageUrl: newItemImageUrl || undefined
                        }}
                        className="w-full h-full object-contain"
                      />
                      {newItemImageUrl && (
                        <button
                          type="button"
                          onClick={() => setNewItemImageUrl("")}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white w-4 h-4 text-[9px] font-black flex items-center justify-center border border-black cursor-pointer hover:bg-red-600"
                          title="Supprimer la photo"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <label className="border border-black bg-white hover:bg-yellow-100 px-2 py-1 font-mono text-[9.5px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-[1px_1px_0px_#000]">
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        <span>Téléverser photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleItemPhotoUpload(e)}
                        />
                      </label>

                      <input
                        type="url"
                        value={newItemImageUrl}
                        onChange={(e) => setNewItemImageUrl(e.target.value)}
                        placeholder="Ou coller une URL d'image..."
                        className="w-full border border-black px-1.5 py-0.5 font-mono text-[9.5px] bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-bold text-gray-500 uppercase mb-1 leading-none">
                    Nom de l'objet *
                  </label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => {
                      setNewItemName(e.target.value);
                    }}
                    placeholder="ex: Chargeur USB-C, Veste K-way, Câble XLR"
                    className="w-full border-2 border-black px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:bg-yellow-50 bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-bold text-gray-500 uppercase mb-1 leading-none">
                    Catégorie *
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => {
                      setNewItemCategory(e.target.value);
                    }}
                    className="w-full border-2 border-black px-2 py-1.5 font-mono text-xs focus:outline-none focus:bg-yellow-50 bg-gray-50 cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* SECTION AUTO-ICÔNES INTÉGRÉES ET ÉDITABLES */}
                <div className="space-y-1 bg-yellow-50 p-2 border-2 border-black">
                  <span className="block font-mono text-[9px] font-black uppercase text-gray-700 leading-none mb-1">
                    Émoji de secours ({isIconCustomized ? "Personnalisé ✍️" : "Détection auto 🤖"})
                  </span>
                  
                  <div className="flex gap-2 items-center">
                    <div className="w-9 h-9 border-2 border-black flex items-center justify-center text-lg bg-white select-none font-bold shrink-0 shadow-[1px_1px_0px_0px_#000]">
                      {newItemIcon}
                    </div>

                    <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                      <div className="flex flex-wrap gap-1 max-h-[45px] overflow-y-auto bg-white p-1 border border-black">
                        {PACKING_EMOJIS.map(emo => (
                          <button
                            key={emo}
                            type="button"
                            onClick={() => {
                              setNewItemIcon(emo);
                              setIsIconCustomized(true);
                            }}
                            className={`p-0.5 hover:bg-yellow-100 text-sm cursor-pointer transition-colors ${
                              newItemIcon === emo ? "bg-amber-200 border border-amber-500" : ""
                            }`}
                          >
                            {emo}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-bold text-gray-500 uppercase mb-1 leading-none">
                    Description rapide
                  </label>
                  <input
                    type="text"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="Modèle, marque, etc (optionnel)"
                    className="w-full border-2 border-black px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:bg-yellow-50 bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-bold text-gray-500 uppercase mb-1 leading-none">
                    Critères (Tags)
                  </label>
                  <div className="flex flex-wrap gap-1 p-1 bg-gray-50 border-2 border-black">
                    {ITEM_TAGS.map(tag => {
                      const selected = newItemTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTagInForm(tag)}
                          className={`px-1.5 py-0.5 font-mono text-[9px] font-black uppercase border cursor-pointer transition-colors ${
                            selected 
                              ? "bg-black text-white border-black" 
                              : "bg-white text-gray-500 border-gray-300 hover:border-black"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* COULEUR (NUANCIER ET PERSONNALISÉ) */}
                <div>
                  <label className="block font-mono text-[10px] font-bold text-gray-500 uppercase mb-1 leading-none">
                    Couleur visuelle
                  </label>
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-black">
                    {PRESET_COLOR_SWATCHES.slice(0, 8).map(sw => (
                      <button
                        key={sw.hex}
                        type="button"
                        onClick={() => setNewItemColorHint(sw.hex)}
                        className={`w-4 h-4 border border-black cursor-pointer ${
                          newItemColorHint.toLowerCase() === sw.hex.toLowerCase() ? "ring-2 ring-black scale-110" : ""
                        }`}
                        style={{ backgroundColor: sw.hex }}
                        title={sw.label}
                      />
                    ))}
                    <input
                      type="color"
                      value={newItemColorHint}
                      onChange={(e) => setNewItemColorHint(e.target.value)}
                      className="w-4 h-4 border border-black p-0 cursor-pointer"
                      title="Couleur personnalisée"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-bold text-gray-500 uppercase mb-1 leading-none">
                    Nombre possédé
                  </label>
                  <div className="flex items-center border-2 border-black bg-gray-50 w-24 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setNewItemQty(Math.max(1, newItemQty - 1))}
                      className="px-2 py-0.5 border-r border-black hover:bg-gray-200 cursor-pointer font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="flex-1 font-mono font-bold text-xs text-center select-none">
                      {newItemQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewItemQty(newItemQty + 1)}
                      className="px-2 py-0.5 border-l border-black hover:bg-gray-200 cursor-pointer font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {itemFormError && (
                  <div className="text-red-600 font-mono text-[10px] font-black uppercase">
                    ⚠️ {itemFormError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-1.5 border-2 border-black bg-emerald-400 hover:bg-emerald-500 text-black font-mono font-black text-xs uppercase cursor-pointer transition-colors shadow-[1px_1px_0px_0px_#000]"
                >
                  Enregistrer l'objet
                </button>
              </form>
            </div>
          </div>

          {/* COLONNE DROITE : AFFICHAGE CATALOGUE */}
          <div className="lg:col-span-8 space-y-4">
            <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] space-y-4">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50 border-2 border-black p-3.5">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Chercher par nom..."
                    className="w-full border-2 border-black pl-8.5 pr-2.5 py-1 font-mono text-xs focus:outline-none bg-white font-medium"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border-2 border-black px-1.5 py-0.5 bg-white cursor-pointer font-bold font-mono text-[10px]"
                  >
                    <option value="Toutes">Tout voir</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="border-2 border-black px-1.5 py-0.5 bg-white cursor-pointer font-bold font-mono text-[10px]"
                  >
                    <option value="Tous">Tous critères</option>
                    {ITEM_TAGS.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border-2 border-black px-1.5 py-0.5 bg-white cursor-pointer font-bold font-mono text-[10px]"
                  >
                    <option value="name">Denomination</option>
                    <option value="category">Type</option>
                    <option value="quantity">Quantité</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-mono font-black text-xs uppercase text-gray-500 tracking-wider">
                  Votre catalogue d'objets ({filteredAndSortedItems.length})
                </h3>

                {filteredAndSortedItems.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 p-8 text-center text-gray-400 font-mono text-xs">
                    Aucun objet trouvé.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {filteredAndSortedItems.map((item) => {
                      const itemIcon = item.icon || getAutoIcon(item.name, item.category);
                      
                      return (
                        <div key={item.id} className="flex border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] overflow-hidden min-h-[96px]">
                          
                          {/* 1/3 TIERS GAUCHE : REPRÉSENTATION VISUELLE (Photo ou Illustration SVG) */}
                          <div className="w-1/3 bg-gray-50 border-r-2 border-black relative group flex items-center justify-center p-1 shrink-0 overflow-hidden">
                            <SuitcaseItemIllustration
                              item={item}
                              className="w-full h-full object-contain"
                            />

                            {/* Badge type visuel */}
                            <span className="absolute top-1 left-1 bg-black/75 text-white font-mono text-[7.5px] px-1 py-0.2 uppercase select-none pointer-events-none">
                              {item.imageUrl ? "Photo" : "SVG"}
                            </span>

                            {/* Overlay de gestion de la photo */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity p-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setPhotoUploadItemId(item.id);
                                  inventoryFileInputRef.current?.click();
                                }}
                                className="w-full py-0.5 bg-white hover:bg-yellow-300 text-black font-mono text-[8px] font-black uppercase border border-black cursor-pointer shadow-[1px_1px_0px_#000]"
                                title="Téléverser une vraie photo"
                              >
                                {item.imageUrl ? "Changer" : "+ Photo"}
                              </button>

                              {item.imageUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemPhoto(item.id, undefined)}
                                  className="w-full py-0.5 bg-red-500 hover:bg-red-600 text-white font-mono text-[8px] font-black uppercase border border-black cursor-pointer"
                                  title="Revenir à l'illustration SVG"
                                >
                                  Effacer
                                </button>
                              )}
                            </div>
                          </div>

                          {/* 2/3 TIERS DROITE : INFOS, QUANTITÉ, TAGS ET ACTIONS */}
                          <div className="w-2/3 p-2 flex flex-col justify-between gap-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0 flex-1">
                                <span className="font-mono font-black text-xs text-black block truncate" title={item.name}>
                                  {item.name}
                                </span>
                                <span className="font-mono text-[9px] text-gray-500 uppercase block truncate">
                                  {item.category}
                                </span>
                              </div>

                              {/* Bouton de suppression avec confirmation inline */}
                              {confirmDeleteItemId === item.id ? (
                                <button
                                  onClick={() => handleDeleteInventoryItem(item.id)}
                                  className="bg-red-500 text-white border border-black px-1.5 py-0.5 text-[8.5px] font-black uppercase cursor-pointer hover:bg-red-600 animate-pulse rounded-none shrink-0"
                                >
                                  Oui?
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setConfirmDeleteItemId(item.id);
                                    setTimeout(() => setConfirmDeleteItemId(null), 3500);
                                  }}
                                  className="bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-700 border border-black p-1 transition-colors cursor-pointer rounded-none shrink-0"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* TAGS OU DESCRIPTION */}
                            {(item.tags || item.description) && (
                              <div className="space-y-0.5 overflow-hidden">
                                {item.tags && (
                                  <div className="flex flex-wrap gap-0.5">
                                    {item.tags.map(t => (
                                      <span key={t} className="font-mono text-[8px] bg-yellow-100 text-yellow-900 border border-black px-1 uppercase shrink-0">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {item.description && (
                                  <p className="font-mono text-[9.5px] text-gray-400 italic leading-tight truncate">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* BARRE INFÉRIEURE : QUANTITÉ & ÉDITION ÉMOJI */}
                            <div className="flex items-center justify-between gap-1 pt-1 border-t border-dashed border-gray-200">
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[8.5px] text-gray-400 uppercase">Qte:</span>
                                <div className="flex items-center border border-black bg-gray-50 overflow-hidden shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemQty(item.id, (item.quantityOwned || 1) - 1)}
                                    className="px-1 py-0.2 border-r border-black hover:bg-gray-200 cursor-pointer text-[9px] font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="px-1 font-mono font-black text-[9.5px] text-center min-w-[12px]">
                                    {item.quantityOwned || 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemQty(item.id, (item.quantityOwned || 1) + 1)}
                                    className="px-1 py-0.2 border-l border-black hover:bg-gray-200 cursor-pointer text-[9px] font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Bouton changement de couleur SVG */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingColorItemId(editingColorItemId === item.id ? null : item.id);
                                    if (editingIconItemId === item.id) setEditingIconItemId(null);
                                  }}
                                  className="flex items-center gap-0.5 cursor-pointer"
                                  title="Changer couleur"
                                >
                                  <span 
                                    className="w-3 h-3 border border-black inline-block rounded-none shadow-[1px_1px_0px_#000]"
                                    style={{ backgroundColor: item.colorHint || "#3b82f6" }}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingIconItemId(editingIconItemId === item.id ? null : item.id);
                                    if (editingColorItemId === item.id) setEditingColorItemId(null);
                                  }}
                                  className="font-mono text-[8.5px] text-gray-500 hover:text-black flex items-center gap-0.5 cursor-pointer"
                                  title="Modifier émoji"
                                >
                                  <span>{itemIcon}</span>
                                  <span>✍️</span>
                                </button>
                              </div>
                            </div>

                            {/* MODULE D'EDITION DE COULEUR EN LIGNE */}
                            {editingColorItemId === item.id && (
                              <div className="border border-dashed border-black bg-amber-50 p-1 mt-1 space-y-1 rounded-none">
                                <div className="flex justify-between items-center">
                                  <span className="font-mono text-[8px] font-black uppercase text-gray-600">Couleur de l'objet :</span>
                                  <button 
                                    onClick={() => setEditingColorItemId(null)}
                                    className="font-mono text-[8px] font-black text-red-600"
                                  >
                                    [fermer]
                                  </button>
                                </div>
                                <div className="flex flex-wrap items-center gap-1 bg-white p-1 border border-black">
                                  {PRESET_COLOR_SWATCHES.map(sw => (
                                    <button
                                      key={sw.hex}
                                      type="button"
                                      onClick={() => {
                                        handleUpdateItemColor(item.id, sw.hex);
                                        setEditingColorItemId(null);
                                      }}
                                      className={`w-4 h-4 border border-black cursor-pointer hover:scale-110 ${
                                        item.colorHint?.toLowerCase() === sw.hex.toLowerCase() ? "ring-2 ring-black" : ""
                                      }`}
                                      style={{ backgroundColor: sw.hex }}
                                      title={sw.label}
                                    />
                                  ))}
                                  <input
                                    type="color"
                                    value={item.colorHint || "#3b82f6"}
                                    onChange={(e) => handleUpdateItemColor(item.id, e.target.value)}
                                    className="w-4 h-4 border border-black p-0 cursor-pointer"
                                    title="Couleur personnalisée"
                                  />
                                </div>
                              </div>
                            )}

                            {/* MODULE D'EDITION D'ICÔNE EN LIGNE (INLINE CHOOSER) */}
                            {editingIconItemId === item.id && (
                              <div className="border border-dashed border-black bg-yellow-50 p-1 mt-1 space-y-1 rounded-none">
                                <div className="flex justify-between items-center">
                                  <span className="font-mono text-[8px] font-black uppercase text-gray-600">Émoji secours :</span>
                                  <button 
                                    onClick={() => setEditingIconItemId(null)}
                                    className="font-mono text-[8px] font-black text-red-600"
                                  >
                                    [fermer]
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1 max-h-[50px] overflow-y-auto bg-white p-0.5 border border-black">
                                  {PACKING_EMOJIS.map(emo => (
                                    <button
                                      key={emo}
                                      onClick={() => {
                                        handleUpdateItemIcon(item.id, emo);
                                        setEditingIconItemId(null);
                                      }}
                                      className="text-xs p-0.5 hover:bg-yellow-100 cursor-pointer transition-colors"
                                    >
                                      {emo}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      )}

      {/* CONTENU : MONDE OBJETS PRÉFABRIQUÉS GÉNÉRIQUES */}
      {activeTab === "presets" && (
        <SuitcasePresetsTab
          db={db}
          updateDb={updateDb}
          activeListId={selectedListId}
          onNavigateToInventory={() => setActiveTab("inventory")}
        />
      )}

      {/* CHAMP DE FICHIER INVISIBLE POUR TÉLÉVERSEMENT DE PHOTO SUR UN ITEM DU CATALOGUE */}
      <input
        type="file"
        ref={inventoryFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (photoUploadItemId) {
            handleItemPhotoUpload(e, photoUploadItemId);
            setPhotoUploadItemId(null);
          }
        }}
      />

    </div>
  );
}
