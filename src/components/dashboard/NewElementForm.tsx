import React, { useState, useEffect } from "react";
import { Task, Habit, RecurringTask, AppDatabase } from "../../types";
import { Plus, X, ListPlus, Sparkles, Smile, ShieldAlert, Award, Calendar, HelpCircle, Check, Info, Loader2 } from "lucide-react";
import { calculateTaskScore } from "../../lib/state";
import { IconPicker } from "../views/IconPicker";
import { ensureCalendarAccessToken, createGoogleCalendarEvent } from "../../lib/googleCalendar";
import { getCalendarAccessToken } from "../../lib/firebase";

interface NewElementFormProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
  onClose?: () => void;
  initialParentTaskId?: string;
  initialElement?: Task | Habit | RecurringTask | null;
}

// Fonction de détection du type d'élément initial pour pré-remplissage
function detectInitialElementType(item?: Task | Habit | RecurringTask | null): "task" | "habit" | "recurring" {
  if (!item) return "task";
  if ("frequency" in item && ("escalationRulesActive" in item || "baseImportance" in item)) {
    return "recurring";
  }
  const anyItem = item as any;
  if ("targetValue" in item || "streak" in item || anyItem.type === "binary" || anyItem.type === "quantitative" || anyItem.type === "chrono" || anyItem.type === "counter") {
    return "habit";
  }
  return "task";
}

// Liste populaire d'émojis utiles comme suggestions
const POPULAR_EMOJIS = [
  "🎯", "⚡", "🏋️", "💻", "🌙", "💊", "🧹", "❤️", "👥", "📚", "💶", "🎭", "📧", "📏", "📞", "🎨", "🦁", "🦔", "🧺", "🥗", "⏰"
];

// Dictionnaire de clés de détection sémantique pour l'émoji automatique
const SEMANTIC_EMOJIS: { keywords: string[]; emoji: string }[] = [
  { keywords: ["sport", "muscu", "haltère", "gym", "physique", "poids", "courir", "foot", "jogging", "entraînement"], emoji: "🏋️" },
  { keywords: ["code", "dev", "tech", "travail", "ordi", "pc", "bureau", "application", "site", "typescript", "informatique"], emoji: "💻" },
  { keywords: ["sommeil", "dormir", "nuit", "coucher", "lit", "insomnie", "sieste", "repos"], emoji: "🌙" },
  { keywords: ["santé", "médicament", "ritaline", "quazim", "médecin", "psy", "pharmacie", "pilule", "docteur", "soin"], emoji: "💊" },
  { keywords: ["ménage", "ranger", "nettoyer", "aspirateur", "laver", "vaisselle", "poubelle", "lessive", "propreté"], emoji: "🧹" },
  { keywords: ["ami", "social", "famille", "amour", "olympe", "rencontre", "sortir", "fête", "partager", "suzy"], emoji: "❤️" },
  { keywords: ["contact", "sms", "email", "mail", "message", "écrire", "répondre", "whatsapp", "téléphone", "appeler"], emoji: "📧" },
  { keywords: ["facture", "argent", "budget", "achat", "payer", "banque", "ursaff", "caf", "impôt", "déclaration", "compte"], emoji: "💶" },
  { keywords: ["impro", "théâtre", "jeu", "JDR", "spectacle", "scène", "drame", "comédie", "acteur", "scénario"], emoji: "🎭" },
  { keywords: ["mesurer", "plan", "travaux", "DP2", "façade", "devis", "fenêtre", "rénover"], emoji: "📏" },
  { keywords: ["lire", "livre", "étudier", "apprendre", "cours", "devoirs", "recherche", "mémoire", "analyser"], emoji: "📚" },
  { keywords: ["manger", "cuisine", "repas", "nourriture", "salad", "compost", "boire", "café", "thé"], emoji: "🥗" }
];

export default function NewElementForm({ db, updateDb, onClose, initialParentTaskId, initialElement }: NewElementFormProps) {
  const initialType = detectInitialElementType(initialElement);
  const [elementType, setElementType] = useState<"task" | "habit" | "recurring">(initialType);

  // 1. Champs Communs
  const [title, setTitle] = useState(initialElement ? initialElement.title : "");
  const [description, setDescription] = useState(initialElement ? initialElement.description || "" : "");
  const [icon, setIcon] = useState(() => {
    if (initialElement) {
      if (typeof initialElement.icon === "string" && initialElement.icon) return initialElement.icon;
      if (initialElement.icon && typeof initialElement.icon === "object" && "content" in initialElement.icon) return (initialElement.icon as any).content;
    }
    return initialType === "task" ? "🎯" : initialType === "habit" ? "⚡" : "🔄";
  });
  const [hasManuallySelectedEmoji, setHasManuallySelectedEmoji] = useState(Boolean(initialElement));
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // Gamification
  const [isRewardAuto, setIsRewardAuto] = useState(!initialElement);
  const [manualRewardValue, setManualRewardValue] = useState<number>(initialElement?.rewardValue ?? 20);
  const [chronoRewardValue, setChronoRewardValue] = useState<number>(initialElement?.chronoRewardValue ?? 1);

  // 2. Variables d'édition - Tâche (Task)
  const taskInit = initialElement && initialType === "task" ? (initialElement as Task) : null;
  const [importance, setImportance] = useState<number>(taskInit?.importance ?? 5);
  const [urgency, setUrgency] = useState<number>(taskInit?.urgency ?? 5);
  const [mentalLoad, setMentalLoad] = useState<number>(taskInit?.mentalLoad ?? 5);
  const [easiness, setEasiness] = useState<number>(taskInit?.easiness ?? 5);
  
  // Planification tâche
  const [dueDate, setDueDate] = useState<string>(taskInit?.dueDate ?? "");
  const [hasPlageHoraire, setHasPlageHoraire] = useState(Boolean(taskInit?.scheduledTime));
  const [startTimeStr, setStartTimeStr] = useState(taskInit?.scheduledTime ?? "10:00");
  const [endTimeStr, setEndTimeStr] = useState(() => {
    if (taskInit?.scheduledTime && taskInit?.durationMinutes) {
      const [sh, sm] = taskInit.scheduledTime.split(":").map(Number);
      const totalMin = sh * 60 + sm + taskInit.durationMinutes;
      const eh = Math.floor((totalMin % (24 * 60)) / 60).toString().padStart(2, "0");
      const em = (totalMin % 60).toString().padStart(2, "0");
      return `${eh}:${em}`;
    }
    return "11:00";
  });
  const [isHardDeadline, setIsHardDeadline] = useState(Boolean(taskInit?.isHardDeadline));
  const [durationMinutes, setDurationMinutes] = useState<number>(taskInit?.durationMinutes ?? 30);
  const [parentTaskId, setParentTaskId] = useState<string>(
    taskInit?.parentTaskId || taskInit?.parentId || initialParentTaskId || ""
  );
  const [tagsInput, setTagsInput] = useState<string>(taskInit?.tags ? taskInit.tags.join(", ") : "");
  const [addToGoogleCalendar, setAddToGoogleCalendar] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [calendarSyncStatus, setCalendarSyncStatus] = useState<string | null>(null);

  const existingTags = React.useMemo(() => {
    const s = new Set<string>();
    db.tasks?.forEach((t) => {
      t.tags?.forEach((tag) => {
        if (tag && tag.trim()) s.add(tag.trim());
      });
    });
    return Array.from(s);
  }, [db.tasks]);

  // 3. Variables d'édition - Habitude (Habit)
  const habitInit = initialElement && initialType === "habit" ? (initialElement as Habit) : null;
  const [habitType, setHabitType] = useState<"binary" | "quantitative" | "chrono" | "counter">(
    habitInit?.type ?? "binary"
  );
  const [targetValue, setTargetValue] = useState<number>(habitInit?.targetValue ?? 1);
  const [unit, setUnit] = useState(habitInit?.unit ?? "");
  const [habitFrequency, setHabitFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [habitInterval, setHabitInterval] = useState<number>(1);
  const [suggestedMoments, setSuggestedMoments] = useState<string>("");
  const [daysThresholdAlert, setDaysThresholdAlert] = useState<number>(habitInit?.daysThresholdAlert ?? 3);
  const [daysThresholdDanger, setDaysThresholdDanger] = useState<number>(7);
  const [jokerDaysLeft, setJokerDaysLeft] = useState<number>(habitInit?.jokerDaysLeft ?? 3);
  const [targetDays, setTargetDays] = useState<number[]>(() => {
    if (initialElement && ('targetDays' in initialElement) && Array.isArray((initialElement as any).targetDays)) {
      return (initialElement as any).targetDays;
    }
    return [];
  });

  // 4. Variables d'édition - Récurrent (RecurringTask)
  const recurringInit = initialElement && initialType === "recurring" ? (initialElement as RecurringTask) : null;
  const [recurrenceFreq, setRecurrenceFreq] = useState<"daily" | "weekly" | "monthly">(
    recurringInit?.frequency ?? "weekly"
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(1);
  const [baseImportance, setBaseImportance] = useState<number>(recurringInit?.baseImportance ?? 5);
  const [baseUrgency, setBaseUrgency] = useState<number>(recurringInit?.baseUrgency ?? 5);

  // Auto-élection d'émoji intelligente selon le titre saisi (NLP basique)
  useEffect(() => {
    if (hasManuallySelectedEmoji || !title.trim()) return;

    const lowerTitle = title.toLowerCase();
    let foundEmoji = false;

    for (const mapping of SEMANTIC_EMOJIS) {
      const match = mapping.keywords.some((keyword) => lowerTitle.includes(keyword));
      if (match) {
        setIcon(mapping.emoji);
        foundEmoji = true;
        break;
      }
    }

    if (!foundEmoji) {
      // Émoji par défaut selon le type s'il n'y a pas de match sémantique
      if (elementType === "task") setIcon("🎯");
      else if (elementType === "habit") setIcon("⚡");
      else if (elementType === "recurring") setIcon("🔄");
    }
  }, [title, elementType, hasManuallySelectedEmoji]);

  // Si on change de type, on réinitialise l'émoji par défaut si non manuel
  useEffect(() => {
    if (!hasManuallySelectedEmoji) {
      if (elementType === "task") setIcon("🎯");
      else if (elementType === "habit") setIcon("⚡");
      else if (elementType === "recurring") setIcon("🔄");
    }
  }, [elementType, hasManuallySelectedEmoji]);

  // Reculer le pick d'un d'émoji
  const selectEmoji = (emoji: string) => {
    setIcon(emoji);
    setHasManuallySelectedEmoji(true);
    setIsEmojiPickerOpen(false);
  };

  // Calcul du score empirique automatique pour la Tâche
  const scoreCalcule = calculateTaskScore({
    importance,
    urgency,
    mentalLoad,
    easiness,
  });

  // Calcul automatique de la récompense avec prise en compte du coefficient
  const ratio = db.userProfile.rewardCalculationRatio ?? 1.0;
  const rewardCalcule = Math.max(1, Math.round(scoreCalcule * 1.5 * ratio));
  const finalRewardToSave = isRewardAuto ? rewardCalcule : manualRewardValue;

  // Soumission finale du formulaire unifié
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dbCopy = { ...db };

    if (elementType === "task") {
      // 1. CREATION D'UNE TÂCHE UNIQUE
      const computedScore = calculateTaskScore({ importance, urgency, mentalLoad, easiness });
      
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString(),
        isCompleted: false,
        importance,
        urgency,
        mentalLoad,
        easiness,
        score: computedScore,
        isStarred: false,
        dueDate: dueDate || undefined,
        isHardDeadline: isHardDeadline,
        durationMinutes,
        timeSpentSeconds: 0,
        rewardValue: isRewardAuto ? Math.max(1, Math.round(computedScore * 1.5 * ratio)) : manualRewardValue,
        chronoRewardValue,
        parentTaskId: parentTaskId || undefined,
        parentId: parentTaskId || undefined,
        dependencies: [],
        preparationIds: [],
        type: "ponctuelle",
        planningStatus: "backlog",
        icon: icon || "🎯",
        tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean)
      };

      // Si synchronisation avec Google Calendar demandée
      if (addToGoogleCalendar) {
        setIsCalendarLoading(true);
        setCalendarSyncStatus("Synchronisation avec Google Agenda...");
        try {
          const calToken = await ensureCalendarAccessToken();
          if (calToken) {
            const eventRes = await createGoogleCalendarEvent(calToken, {
              title: newTask.title,
              description: newTask.description,
              dueDate: newTask.dueDate,
              scheduledTime: hasPlageHoraire ? startTimeStr : undefined,
              durationMinutes: newTask.durationMinutes
            });
            if (eventRes && eventRes.id) {
              newTask.isGoogleCalendarSynced = true;
              newTask.googleEventId = eventRes.id;
            }
          }
        } catch (calErr) {
          console.warn("Échec de synchronisation Google Agenda :", calErr);
        } finally {
          setIsCalendarLoading(false);
        }
      }

      // Si plage horaire définie, l'injecter aussi dans les briques d'ordonnancement de planification
      if (hasPlageHoraire && dueDate) {
        const [sh, sm] = startTimeStr.split(":").map(Number);
        const [eh, em] = endTimeStr.split(":").map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        
        // Initialiser la dailyPlannings array si manquante
        if (!dbCopy.dailyPlannings) dbCopy.dailyPlannings = [];
        
        dbCopy.dailyPlannings.push({
          id: `planning-${Date.now()}`,
          itemId: newTask.id,
          itemType: "task",
          lane: 0,
          startMinutes: startMin,
          endMinutes: endMin,
          date: dueDate,
          label: newTask.title
        });

        newTask.scheduledTime = startTimeStr;
        newTask.planningStatus = "scheduled";
      }

      dbCopy.tasks = [newTask, ...dbCopy.tasks];

    } else if (elementType === "habit") {
      // 2. CREATION D'UNE HABITUDE SAINE
      const calculatedReward = isRewardAuto ? Math.round((15 + targetValue * 2) * ratio) : manualRewardValue;

      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        icon: icon || "🎯",
        type: habitType,
        currentValue: 0,
        targetValue,
        unit: habitType === "chrono" ? "minutes" : (unit || "fois"),
        streak: 0,
        bestStreak: 0,
        jokerDaysLeft,
        daysThresholdAlert,
        lastCompletedDate: undefined,
        history: {},
        rewardValue: calculatedReward,
        chronoRewardValue,
        targetDays: targetDays.length > 0 ? targetDays : undefined,
        isNeglected: false
      };

      dbCopy.habits = [newHabit, ...dbCopy.habits];

    } else if (elementType === "recurring") {
      // 3. CREATION D'UN MODELE DE TACHE RECURRENT
      const calculatedReward = manualRewardValue || 15;

      const newRecurring: RecurringTask = {
        id: `recurring-${Date.now()}`,
        title: title.trim(),
        icon: icon || "🔄",
        description: description.trim(),
        frequency: recurrenceFreq,
        escalationRulesActive: true,
        escalationRate: 1.1,
        baseImportance,
        baseUrgency,
        rewardValue: calculatedReward,
        chronoRewardValue: chronoRewardValue !== undefined ? chronoRewardValue : 1,
        targetDays: targetDays.length > 0 ? targetDays : undefined,
        nextDueDate: new Date().toISOString().split("T")[0] // due now pour generation
      };
      
      dbCopy.recurringTasks = [newRecurring, ...dbCopy.recurringTasks];
    }

    // Répercuter dans la base persistée et fermer
    updateDb(dbCopy);
    if (onClose) onClose();

    // Reset formulaire
    setTagsInput("");
    setTitle("");
    setDescription("");
    setIcon("🎯");
    setHasManuallySelectedEmoji(false);
  };

  const formTopRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // S'assurer que le haut du formulaire est immédiatement visible à l'ouverture sur mobile
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ block: "start", behavior: "auto" });
    }
  }, []);

  return (
    <div ref={formTopRef} className="border-4 border-black bg-white p-3.5 sm:p-6 rounded-none shadow-[6px_6px_0px_0px_#000] relative font-mono text-black">
      
      {/* Bouton de Fermeture */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1 text-black hover:bg-black hover:text-white border-2 border-black rounded-none transition-colors cursor-pointer z-10"
          title="Fermer"
        >
          <X size={16} />
        </button>
      )}

      {/* Titre style Memphis sobre */}
      <div className="flex items-center gap-2 border-b-2 sm:border-b-4 border-black pb-2 sm:pb-3 mb-3 sm:mb-4">
        <ListPlus className="text-yellow-500" size={20} />
        <h2 className="text-sm sm:text-lg font-black uppercase tracking-tight">
          {initialElement ? "DUPLIQUER" : "NOUVEL ÉLÉMENT"}
        </h2>
      </div>

      {/* Selecteur d'onglet Memphis : Type de l'élément */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        <button
          type="button"
          onClick={() => setElementType("task")}
          className={`py-1.5 sm:py-2 px-1 text-center font-black border-2 border-black text-[11px] sm:text-xs uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-transform ${
            elementType === "task" ? "bg-red-400 text-black shadow-none translate-x-0.5 translate-y-0.5" : "bg-red-50 hover:bg-red-100"
          }`}
        >
          🎯 Tâche
        </button>
        <button
          type="button"
          onClick={() => setElementType("habit")}
          className={`py-1.5 sm:py-2 px-1 text-center font-black border-2 border-black text-[11px] sm:text-xs uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-transform ${
            elementType === "habit" ? "bg-green-400 text-black shadow-none translate-x-0.5 translate-y-0.5" : "bg-green-50 hover:bg-green-100"
          }`}
        >
          ⚡ Habitude
        </button>
        <button
          type="button"
          onClick={() => setElementType("recurring")}
          className={`py-1.5 sm:py-2 px-1 text-center font-black border-2 border-black text-[11px] sm:text-xs uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-transform ${
            elementType === "recurring" ? "bg-sky-400 text-black shadow-none translate-x-0.5 translate-y-0.5" : "bg-sky-50 hover:bg-sky-100"
          }`}
        >
          🔄 Récurrence
        </button>
      </div>

      {/* Formulaire Principal */}
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        
        {/* LIGNE UNIFIÉE : TITRE, ICONE ET AUTO-NLP */}
        <div className="flex flex-row gap-2 sm:gap-3 items-start">
          
          {/* Sélecteur d'icône */}
          <div className="shrink-0">
            <label className="block text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Icône</label>
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className="h-10 w-11 sm:w-12 border-2 border-black bg-yellow-100 text-lg sm:text-xl font-bold flex items-center justify-center hover:bg-yellow-200 cursor-pointer shadow-[2px_2px_0px_0px_#000]"
              title="Choisir une icône"
            >
              {icon}
            </button>
          </div>

          {/* Saisie obligatoire du Titre */}
          <div className="flex-1 min-w-0">
            <label className="block text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Titre *</label>
            <div className="relative">
              <input
                id="new-element-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre..."
                className="w-full h-10 border-2 border-black px-2.5 sm:px-3 py-1 font-semibold text-xs sm:text-sm bg-white shadow-[2px_2px_0px_0px_#000]"
                required
                autoFocus
              />
              {!hasManuallySelectedEmoji && title.trim() && (
                <span className="hidden sm:inline-block absolute right-2.5 top-2 text-[9px] sm:text-[10px] bg-sky-200 border border-black px-1 py-0.5 text-sky-900 font-bold">
                  Auto : {icon}
                </span>
              )}
            </div>
          </div>
        </div>

        {isEmojiPickerOpen && (
          <div className="my-2">
            <IconPicker
              inline={true}
              onSelect={(selected) => selectEmoji(selected)}
              onClose={() => setIsEmojiPickerOpen(false)}
            />
          </div>
        )}

        {/* LIGNE DESCRIPTION OPTIONNELLE */}
        <div>
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Description ou notes optionnelles</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détaillez vos intentions, remarques ou indications pratiques ici..."
            className="w-full min-h-[50px] border-2 border-black p-2 bg-white text-xs shadow-[2px_2px_0px_0px_#000]"
          />
        </div>

        {/* SECTION 2 : FORMULAIRE DYNAMIQUE SELON LE TYPE */}
        
        {/* CAS : TÂCHE PONCTUELLE */}
        {elementType === "task" && (
          <div className="border-2 border-black p-3 bg-red-50 space-y-4 shadow-[2px_2px_0px_0px_#000]">
            <p className="font-mono font-black text-xs text-red-900 border-b border-red-200 pb-1 uppercase">
              ⚙️ Paramètres et Priorisation de la Tâche
            </p>

            {/* Matrice Score Critères */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-gray-600">IMPORTANCE : {importance}/10</label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={importance}
                  onChange={(e) => setImportance(parseInt(e.target.value))}
                  className="w-full accent-black cursor-pointer h-1 bg-gray-200"
                />
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-gray-600">URGENCE : {urgency}/10</label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={urgency}
                  onChange={(e) => setUrgency(parseInt(e.target.value))}
                  className="w-full accent-black cursor-pointer h-1 bg-gray-200"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-600">CHARGE MENTALE : {mentalLoad}/10</label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={mentalLoad}
                  onChange={(e) => setMentalLoad(parseInt(e.target.value))}
                  className="w-full accent-black cursor-pointer h-1 bg-gray-200"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-600">FACILITÉ D'EFFORT : {easiness}/10</label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={easiness}
                  onChange={(e) => setEasiness(parseInt(e.target.value))}
                  className="w-full accent-black cursor-pointer h-1 bg-gray-200"
                />
              </div>
            </div>

            {/* Calendrier, Échéance & Horaire */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-dashed border-red-200">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Date planifiée</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border-2 border-black p-1 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Échéance (Deadline)</label>
                <div className="flex gap-2 items-center">
                  <select
                    value={isHardDeadline ? "hard" : "soft"}
                    onChange={(e) => setIsHardDeadline(e.target.value === "hard")}
                    className="flex-1 border-2 border-black p-1 bg-white text-xs"
                  >
                    <option value="soft">Flexible (Soft)</option>
                    <option value="hard">Absolue (Hard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Durée Estimée (min)</label>
                <input
                  type="number"
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                  className="w-full border-2 border-black p-1 bg-white text-xs font-bold"
                />
              </div>
            </div>

            {/* Plage Horaire Plannifiée */}
            {dueDate && (
              <div className="border border-red-300 p-2 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-1.5 font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasPlageHoraire}
                    onChange={(e) => setHasPlageHoraire(e.target.checked)}
                    className="accent-black h-4 w-4"
                  />
                  Bloquer un créneau horaire dans l'agenda quotidien
                </label>

                {hasPlageHoraire && (
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>De</span>
                    <input
                      type="time"
                      value={startTimeStr}
                      onChange={(e) => setStartTimeStr(e.target.value)}
                      className="border border-black p-0.5 bg-yellow-50 text-center"
                    />
                    <span>à</span>
                    <input
                      type="time"
                      value={endTimeStr}
                      onChange={(e) => setEndTimeStr(e.target.value)}
                      className="border border-black p-0.5 bg-yellow-50 text-center"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Option Synchronisation Google Agenda */}
            <div className="border border-red-300 p-2 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
              <label className="flex items-center gap-1.5 font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addToGoogleCalendar}
                  onChange={(e) => setAddToGoogleCalendar(e.target.checked)}
                  className="accent-black h-4 w-4"
                />
                <span>📅 Ajouter à Google Agenda</span>
              </label>
              {addToGoogleCalendar && (
                <span className="text-[10px] text-gray-500 font-mono">
                  {getCalendarAccessToken() ? "✓ Compte connecté" : "Connexion demandée à l'enregistrement"}
                </span>
              )}
            </div>

            {/* Arborescence Parent / Enfant */}
            <div className="pt-2 border-t border-dashed border-red-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Rattacher à une tâche parente (Projet)</label>
                <select
                  value={parentTaskId}
                  onChange={(e) => setParentTaskId(e.target.value)}
                  className="w-full border-2 border-black p-1 bg-white text-xs"
                >
                  <option value="">Aucune (Tâche racine principale)</option>
                  {db.tasks.filter(t => !t.isCompleted).map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center text-[10px] text-gray-500 leading-snug pt-4 font-semibold">
                <Info size={14} className="text-sky-600 inline mr-1 flex-shrink-0" />
                La sous-tâche permet de structurer vos grands chantiers en grappes de tâches unitaires.
              </div>
            </div>

            {/* Tags / Projets */}
            <div className="pt-2 border-t border-dashed border-red-200 text-xs">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
                Tags / Projets (séparés par des virgules)
              </label>
              <input
                type="text"
                placeholder="ex: Perso, Travail, Rénovations..."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full border-2 border-black p-1 bg-white text-xs shadow-[2px_2px_0px_0px_#000]"
              />
              {existingTags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Tags existants :</span>
                  {existingTags.map(tag => {
                    const tagParts = tagsInput.split(',').map(s => s.trim().toLowerCase());
                    const isSelected = tagParts.includes(tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const parts = tagsInput.split(',').map(s => s.trim()).filter(Boolean);
                          const index = parts.findIndex(p => p.toLowerCase() === tag.toLowerCase());
                          if (index >= 0) {
                            parts.splice(index, 1);
                          } else {
                            parts.push(tag);
                          }
                          setTagsInput(parts.join(', '));
                        }}
                        className={`px-1.5 py-0.5 border border-black text-[9px] font-mono font-bold transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-black text-white' 
                            : 'bg-white text-black hover:bg-gray-100'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CAS : HABITUDE SAINE */}
        {elementType === "habit" && (
          <div className="border-2 border-black p-3 bg-green-50 space-y-4 shadow-[2px_2px_0px_0px_#000]">
            <p className="font-mono font-black text-xs text-green-900 border-b border-green-200 pb-1 uppercase">
              🌿 Paramètres de Suivi de votre Habitude
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Type de suivi de l'habitude saine */}
              <div className="sm:col-span-4">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Type de mesure</label>
                <select
                  value={habitType}
                  onChange={(e) => setHabitType(e.target.value as any)}
                  className="w-full border-2 border-black p-1 bg-white text-xs font-bold"
                >
                  <option value="binary">Oui/Non (Binaire)</option>
                  <option value="quantitative">Quantitatif (Objectif)</option>
                  <option value="chrono">Chronométré (Minutes)</option>
                  <option value="counter">Incrémental libre</option>
                </select>
              </div>

              {/* Saisie de l'objectif si nécessaire */}
              {(habitType === "quantitative" || habitType === "chrono") && (
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
                    {habitType === "chrono" ? "Objectif Minutes" : "Valeur Cible"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={targetValue}
                    onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
                    className="w-full border-2 border-black p-1 bg-white text-xs font-bold"
                  />
                </div>
              )}

              {/* Saisie de l'unité si nécessaire */}
              {habitType === "quantitative" && (
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Unité</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="ex: Verres, pages, pas"
                    className="w-full border-2 border-black p-1 bg-white text-xs font-bold"
                  />
                </div>
              )}
            </div>

            {/* Fréquences temporelles, rappels et jours Jokers */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-dashed border-green-200 text-xs">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Fréquence</label>
                <select
                  value={habitFrequency}
                  onChange={(e) => setHabitFrequency(e.target.value as any)}
                  className="w-full border-2 border-black p-1 bg-white text-xs"
                >
                  <option value="daily">Chaque jour (Daily)</option>
                  <option value="weekly">Chaque semaine (Weekly)</option>
                  <option value="monthly">Chaque mois (Monthly)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Intervalle</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold">Tous les</span>
                  <input
                    type="number"
                    min={1}
                    value={habitInterval}
                    onChange={(e) => setHabitInterval(parseInt(e.target.value) || 1)}
                    className="w-12 border-2 border-black p-1 bg-white text-xs text-center font-bold"
                  />
                  <span className="text-[10px] font-bold">cycles</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Conseil horaire</label>
                <input
                  type="text"
                  value={suggestedMoments}
                  onChange={(e) => setSuggestedMoments(e.target.value)}
                  placeholder="ex: Matin, 08:30"
                  className="w-full border-2 border-black p-1 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Jours Jokers Initiaux</label>
                <input
                  type="number"
                  min={0}
                  value={jokerDaysLeft}
                  onChange={(e) => setJokerDaysLeft(parseInt(e.target.value) || 0)}
                  className="w-full border-2 border-black p-1 bg-white text-xs font-bold"
                />
              </div>
            </div>

            {/* Jours ciblés de la semaine */}
            <div className="pt-2 border-t border-dashed border-green-200">
              <label className="block text-[10px] font-black text-green-900 uppercase tracking-wider mb-1">
                📅 Jours ciblés d'exécution (Optionnel)
              </label>
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { id: 1, label: "Lun" },
                  { id: 2, label: "Mar" },
                  { id: 3, label: "Mer" },
                  { id: 4, label: "Jeu" },
                  { id: 5, label: "Ven" },
                  { id: 6, label: "Sam" },
                  { id: 7, label: "Dim" }
                ].map((d) => {
                  const isSelected = targetDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setTargetDays(targetDays.filter((day) => day !== d.id));
                        } else {
                          setTargetDays([...targetDays, d.id].sort());
                        }
                      }}
                      className={`px-2.5 py-1 border-2 border-black text-xs font-mono font-black transition-all cursor-pointer ${
                        isSelected
                          ? "bg-black text-white shadow-[1px_1px_0px_#000]"
                          : "bg-white text-black hover:bg-green-100"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
                {targetDays.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTargetDays([])}
                    className="text-[10px] text-green-800 hover:text-black hover:underline ml-1.5 cursor-pointer font-bold"
                  >
                    Effacer (Tous les jours)
                  </button>
                )}
              </div>
            </div>

            {/* Seuils de tolérance et inactivité (Sécurité d'abandon) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-dashed border-green-200 text-xs">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">🚨 Seuil d'Alerte d'Inactivité (jours)</label>
                <input
                  type="number"
                  min={1}
                  value={daysThresholdAlert}
                  onChange={(e) => setDaysThresholdAlert(parseInt(e.target.value) || 3)}
                  className="w-full border-2 border-black p-1 bg-white text-xs font-bold text-amber-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">💀 Seuil d'Abandon / Danger (jours)</label>
                <input
                  type="number"
                  min={1}
                  value={daysThresholdDanger}
                  onChange={(e) => setDaysThresholdDanger(parseInt(e.target.value) || 7)}
                  className="w-full border-2 border-black p-1 bg-white text-xs font-bold text-red-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* CAS : RÉCURRENT - GENERATEUR DE TÂCHES */}
        {elementType === "recurring" && (
          <div className="border-2 border-black p-3 bg-sky-50 space-y-4 shadow-[2px_2px_0px_0px_#000]">
            <p className="font-mono font-black text-xs text-sky-900 border-b border-sky-200 pb-1 uppercase">
              🔄 Règle de Récurrence et Priorités du Modèle (Template)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Fréquence de répétition</label>
                <select
                  value={recurrenceFreq}
                  onChange={(e) => setRecurrenceFreq(e.target.value as any)}
                  className="w-full border-2 border-black p-1 bg-white text-xs font-bold"
                >
                  <option value="daily">Chaque jour (Daily)</option>
                  <option value="weekly">Chaque semaine (Weekly)</option>
                  <option value="monthly">Chaque mois (Monthly)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Intervalle (X cycle)</label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold">Tous les</span>
                  <input
                    type="number"
                    min={1}
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                    className="w-12 border-2 border-black p-1 bg-white text-xs text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Importance de base</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={baseImportance}
                  onChange={(e) => setBaseImportance(parseInt(e.target.value) || 5)}
                  className="w-full border-2 border-black p-1 bg-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Urgence de base</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={baseUrgency}
                  onChange={(e) => setBaseUrgency(parseInt(e.target.value) || 5)}
                  className="w-full border-2 border-black p-1 bg-white text-xs font-bold"
                />
              </div>
            </div>

            {/* Jours ciblés de la semaine pour récurrence */}
            <div className="pt-2 border-t border-dashed border-sky-200">
              <label className="block text-[10px] font-black text-sky-900 uppercase tracking-wider mb-1">
                📅 Jours ciblés d'exécution (Optionnel)
              </label>
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { id: 1, label: "Lun" },
                  { id: 2, label: "Mar" },
                  { id: 3, label: "Mer" },
                  { id: 4, label: "Jeu" },
                  { id: 5, label: "Ven" },
                  { id: 6, label: "Sam" },
                  { id: 7, label: "Dim" }
                ].map((d) => {
                  const isSelected = targetDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setTargetDays(targetDays.filter((day) => day !== d.id));
                        } else {
                          setTargetDays([...targetDays, d.id].sort());
                        }
                      }}
                      className={`px-2.5 py-1 border-2 border-black text-xs font-mono font-black transition-all cursor-pointer ${
                        isSelected
                          ? "bg-black text-white shadow-[1px_1px_0px_#000]"
                          : "bg-white text-black hover:bg-sky-100"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
                {targetDays.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTargetDays([])}
                    className="text-[10px] text-sky-800 hover:text-black hover:underline ml-1.5 cursor-pointer font-bold"
                  >
                    Effacer (Tous les jours)
                  </button>
                )}
              </div>
            </div>

            <div className="text-[10px] text-gray-600 leading-snug p-2 bg-white border border-sky-200">
              <Info size={14} className="text-sky-500 inline mr-1 flex-shrink-0" />
              <span className="font-bold">Indicateur d'Automatisation :</span> Ce modèle parent ne rentre pas directement dans vos tâches quotidiennes, mais clone et injecte une tâche fille propre toutes les occurrences à l'ouverture de l'application. Vos scores de priorisation sont préservés pour la fille unitaire.
            </div>
          </div>
        )}

        {/* RECOMPENSE / MATRICE DE COINS UNIFIÉE */}
        <div className="border-2 border-black p-3 bg-yellow-50 space-y-3.5 shadow-[2px_2px_0px_0px_#000]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-yellow-200 pb-1.5 gap-2">
            <span className="font-sans font-black text-[11px] text-amber-950 uppercase tracking-wider flex items-center gap-1">
              🪙 Paramétrage de la Gamification (Pièces CS)
            </span>
            {elementType === "task" && (
              <label className="flex items-center gap-1 text-xs font-semibold select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRewardAuto}
                  onChange={(e) => setIsRewardAuto(e.target.checked)}
                  className="accent-black"
                />
                Score et gain automatique
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            {/* Gain Forfaitaire de Complétion */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Récompense forfaitaire de complétion (CS)</label>
              {isRewardAuto && elementType === "task" ? (
                <div className="h-9 border border-black bg-gray-100 flex items-center px-2 text-xs font-black text-gray-800">
                  ⚡ Calculé : <span className="underline ml-1">+{rewardCalcule} CS</span> (Score: {scoreCalcule})
                </div>
              ) : (
                <input
                  type="number"
                  min={1}
                  value={manualRewardValue}
                  onChange={(e) => setManualRewardValue(parseInt(e.target.value) || 1)}
                  className="w-full h-9 border-2 border-black px-2 bg-white font-black"
                />
              )}
            </div>

            {/* Gain Chronométré */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Gain par minute travaillée (CS/min)</label>
              <input
                type="number"
                min={0}
                value={chronoRewardValue}
                onChange={(e) => setChronoRewardValue(parseInt(e.target.value) || 0)}
                className="w-full h-9 border-2 border-black px-2 bg-white font-black"
              />
            </div>
          </div>
        </div>

        {/* BOUTON DE SOUMISSION */}
        <div className="flex gap-2 justify-end pt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-gray-100 text-black border-2 border-black font-black uppercase text-xs px-4 py-2 cursor-pointer shadow-[2px_2px_0px_0px_#000]"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={isCalendarLoading}
            className="bg-black text-white hover:bg-yellow-400 hover:text-black disabled:opacity-50 border-2 border-black font-black uppercase text-xs px-5 py-2.5 cursor-pointer shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5"
          >
            {isCalendarLoading && <Loader2 size={14} className="animate-spin" />}
            <span>{initialElement ? "Dupliquer" : "Créer"} l'élément : {elementType === "task" ? "Tâche" : elementType === "habit" ? "Habitude" : elementType === "recurring" ? "Récurrence" : "Événement"}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
