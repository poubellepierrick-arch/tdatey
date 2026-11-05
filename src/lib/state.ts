import { AppDatabase, Task, Habit, TrackedActivity, Medication, MedicationLog, HealthSuspicion, UserProfile, Reward, AISettings, AIMemory, ProactiveSuggestion, PsyCard, RecurringTask, Preparation, SuitcaseItem, SuitcaseList } from "../types";

export const DEFAULT_REWARDS: Reward[] = [
  {
    id: "rew-1",
    title: "Session Jeu Vidéo (1h)",
    description: "Pause détente 60 minutes.",
    costCoins: 60,
    isPurchased: false,
    purchaseHistory: [],
    type: "redeemable",
    icon: "🎮"
  },
  {
    id: "rew-2",
    title: "Pause Café & Cookie",
    description: "Moment gourmand.",
    costCoins: 30,
    isPurchased: false,
    purchaseHistory: [],
    type: "redeemable",
    icon: "☕"
  },
  {
    id: "rew-3",
    title: "Grasse Matinée",
    description: "Sommeil sans réveil.",
    costCoins: 100,
    isPurchased: false,
    purchaseHistory: [],
    type: "redeemable",
    icon: "🛌"
  },
  {
    id: "rew-4",
    title: "Vidéo / Série (min)",
    description: "2 CS par minute.",
    costCoins: 2,
    isPurchased: false,
    purchaseHistory: [],
    type: "leisure",
    icon: "📺",
    isGame: false
  },
  {
    id: "rew-5",
    title: "Lecture / BD (min)",
    description: "1 CS par minute.",
    costCoins: 1,
    isPurchased: false,
    purchaseHistory: [],
    type: "leisure",
    icon: "📚",
    isGame: false
  }
];

// État de base par défaut pour nourrir l'application immédiatement
export const DEFAULT_DATABASE_STATE: AppDatabase = {
  tasks: [],
  recurringTasks: [],
  preparations: [],
  habits: [],
  trackedActivities: [],
  medications: [],
  medicationLogs: [],
  healthSuspicions: [],
  userProfile: {
    coins: 0,
    debt: 0,
    targetSleepTime: "23:00",
    targetWakeTime: "07:00",
    wakeUpRewardSettings: {
      targetHour: 7,
      targetMinute: 0,
      baseReward: 30
    },
    rewardCalculationRatio: 1.0,
    wakeUpPaliers: [
      { id: "palier-1", time: "07:00", points: 200 },
      { id: "palier-2", time: "08:00", points: 150 },
      { id: "palier-3", time: "09:00", points: 100 },
      { id: "palier-4", time: "10:00", points: 50 }
    ]
  },
  rewards: DEFAULT_REWARDS,
  aiSettings: {
    personality: "Conseiller de vie et de bien-être, bienveillant mais rigoureux.",
    behaviorRules: []
  },
  aiMemories: [],
  proactiveSuggestions: [],
  psyCards: [],
  journalLogs: [],
  dailyPlannings: [],
  sleepWakeLogs: [],
  appIcons: {},
  suitcaseItems: [],
  suitcaseLists: []
};

// Fonctions de calcul dynamique du score d'une tâche
export function calculateTaskScore(task: { importance: number; urgency: number; easiness: number; mentalLoad: number }): number {
  // Score = Importance * 1.5 + Urgence * 1.5 + Charge Mentale - Facilité
  // Plus d'importance, plus d'urgence, plus de charge mentale et MOINS de facilité = Score plus élevé (Priorité absolue)
  return Math.round(task.importance * 1.5 + task.urgency * 1.5 + task.mentalLoad - task.easiness);
}

// Persistance LocalStorage limitée exclusivement aux jetons de connexion
// Les données d'usage applicatives ne sont pas stockées en local mais uniquement sur Firebase (Firestore)
export function loadDatabase(): AppDatabase {
  try {
    const serialized = localStorage.getItem("somatique_db");
    if (serialized) {
      const parsed = JSON.parse(serialized);
      // Récupération unique puis nettoyage immédiat du localStorage pour respecter la directive de non-stockage local
      localStorage.removeItem("somatique_db");
      return {
        ...DEFAULT_DATABASE_STATE,
        ...parsed,
        userProfile: {
          ...DEFAULT_DATABASE_STATE.userProfile,
          ...(parsed.userProfile || {})
        },
        aiSettings: {
          ...DEFAULT_DATABASE_STATE.aiSettings,
          ...(parsed.aiSettings || {})
        }
      };
    }
  } catch (err) {
    console.error("Erreur de chargement LocalStorage de l'application :", err);
  }
  return DEFAULT_DATABASE_STATE;
}

export function saveDatabase(db: AppDatabase): void {
  // Désactivé conformément aux directives de protection : pas de données applicatives dans le localStorage
}

// --- ALGORITHME DE FUSION INTELLIGENTE ET HISTORIQUE ---

export function normalizeTitle(title: string): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "") // Enlever les émojis
    .replace(/[^a-z0-9]/g, "") // Garder uniquement alphanumérique
    .trim();
}

export function mergeDatabases(localDb: AppDatabase, remoteDb: AppDatabase): AppDatabase {
  // Initialiser la base fusionnée avec les valeurs par défaut pour la sécurité
  const merged: AppDatabase = { ...DEFAULT_DATABASE_STATE };

  // 1. Profil utilisateur : On prend le plus avantageux ou le plus récent
  const localProfile: Partial<UserProfile> = localDb.userProfile || {};
  const remoteProfile: Partial<UserProfile> = remoteDb.userProfile || {};
  const localCoins = localProfile.coins || 0;
  const remoteCoins = remoteProfile.coins || 0;
  merged.userProfile = {
    coins: Math.max(localCoins, remoteCoins),
    debt: Math.max(localProfile.debt || 0, remoteProfile.debt || 0),
    targetSleepTime: localProfile.targetSleepTime || remoteProfile.targetSleepTime || "23:00",
    targetWakeTime: localProfile.targetWakeTime || remoteProfile.targetWakeTime || "07:00",
    wakeUpRewardSettings: localProfile.wakeUpRewardSettings || remoteProfile.wakeUpRewardSettings || {
      targetHour: 7,
      targetMinute: 0,
      baseReward: 30
    },
    rewardCalculationRatio: localProfile.rewardCalculationRatio ?? remoteProfile.rewardCalculationRatio ?? 1.0,
    themeStyle: localProfile.themeStyle || remoteProfile.themeStyle || "memphis",
    layoutSpacing: localProfile.layoutSpacing || remoteProfile.layoutSpacing || "cozy",
    cardBorderWidth: localProfile.cardBorderWidth ?? remoteProfile.cardBorderWidth ?? 4,
    cardShadowOpacity: localProfile.cardShadowOpacity ?? remoteProfile.cardShadowOpacity ?? 100,
    wakeUpPaliers: (localProfile.wakeUpPaliers && localProfile.wakeUpPaliers.length > 0)
      ? localProfile.wakeUpPaliers
      : (remoteProfile.wakeUpPaliers && remoteProfile.wakeUpPaliers.length > 0 ? remoteProfile.wakeUpPaliers : DEFAULT_DATABASE_STATE.userProfile.wakeUpPaliers),
    activeChrono: localProfile.activeChrono || remoteProfile.activeChrono,
    projectOrder: localProfile.projectOrder || remoteProfile.projectOrder,
    lastWakeConfirmedDate: localProfile.lastWakeConfirmedDate || remoteProfile.lastWakeConfirmedDate
  };

  // 2. Fusion des tâches par ID unique
  const tasksMap = new Map<string, Task>();
  // Ajouter les tâches distantes d'abord
  (remoteDb.tasks || []).forEach(t => tasksMap.set(t.id, t));
  // Fusionner les tâches locales en cas de collision intelligente
  (localDb.tasks || []).forEach(localTask => {
    const remoteTask = tasksMap.get(localTask.id);
    if (remoteTask) {
      // Priorité à la tâche complétée ou contenant le plus de temps accumulé
      const chooseLocal = localTask.isCompleted || localTask.timeSpentSeconds > remoteTask.timeSpentSeconds;
      tasksMap.set(localTask.id, chooseLocal ? localTask : remoteTask);
    } else {
      tasksMap.set(localTask.id, localTask);
    }
  });
  merged.tasks = Array.from(tasksMap.values());

  // 3. Tâches récurrentes : fusionner par ID et par titre normalisé
  const recTasksMap = new Map<string, RecurringTask>();
  const normalizedRecTitles = new Map<string, string>(); // titre_normalisé -> ID

  const registerRecurring = (rt: RecurringTask) => {
    const normTitle = normalizeTitle(rt.title);
    const existingIdByTitle = normalizedRecTitles.get(normTitle);
    
    if (existingIdByTitle) {
      const existing = recTasksMap.get(existingIdByTitle)!;
      const mergedHistory = { ...(existing.history || {}), ...(rt.history || {}) };
      recTasksMap.set(existingIdByTitle, {
        ...existing,
        ...rt,
        id: existingIdByTitle, // conserver l'ID d'origine
        history: mergedHistory,
        completionHistory: Array.from(new Set([...((existing as any).completionHistory || []), ...((rt as any).completionHistory || [])]))
      } as any);
    } else {
      recTasksMap.set(rt.id, rt);
      normalizedRecTitles.set(normTitle, rt.id);
    }
  };

  (remoteDb.recurringTasks || []).forEach(registerRecurring);
  (localDb.recurringTasks || []).forEach(registerRecurring);
  merged.recurringTasks = Array.from(recTasksMap.values());

  // 4. Routines de Préparation
  const prepMap = new Map<string, Preparation>();
  (remoteDb.preparations || []).forEach(p => prepMap.set(p.id, p));
  (localDb.preparations || []).forEach(p => prepMap.set(p.id, p));
  merged.preparations = Array.from(prepMap.values());

  // 5. Habitudes personnelles : fusionner par ID et par titre normalisé sans doublon
  const habitsMap = new Map<string, Habit>();
  const normalizedHabits = new Map<string, string>(); // titre_normalisé -> ID

  const registerHabit = (h: Habit) => {
    const normTitle = normalizeTitle(h.title);
    const existingIdByTitle = normalizedHabits.get(normTitle);

    if (existingIdByTitle) {
      const existing = habitsMap.get(existingIdByTitle)!;
      const mergedHistory = { ...(existing.history || {}), ...(h.history || {}) };
      
      habitsMap.set(existingIdByTitle, {
        ...existing,
        ...h,
        id: existingIdByTitle, // conserve l'ID d'origine
        currentValue: Math.max(existing.currentValue, h.currentValue),
        streak: Math.max(existing.streak, h.streak),
        bestStreak: Math.max(existing.bestStreak, h.bestStreak),
        history: mergedHistory,
        jokerDaysLeft: Math.min(existing.jokerDaysLeft, h.jokerDaysLeft),
        lastCompletedDate: existing.lastCompletedDate || h.lastCompletedDate,
      });
    } else {
      habitsMap.set(h.id, h);
      normalizedHabits.set(normTitle, h.id);
    }
  };

  (remoteDb.habits || []).forEach(registerHabit);
  (localDb.habits || []).forEach(registerHabit);
  merged.habits = Array.from(habitsMap.values());

  // 6. Activités Somatiques Journalisées (union sans collision si les IDs sont temporels)
  const actMap = new Map<string, TrackedActivity>();
  (remoteDb.trackedActivities || []).forEach(a => actMap.set(a.id, a));
  (localDb.trackedActivities || []).forEach(a => actMap.set(a.id, a));
  merged.trackedActivities = Array.from(actMap.values());

  // 7. Médicaments en stock (union par nom/id, conservation du stock le plus bas / plus récent)
  const medMap = new Map<string, Medication>();
  (remoteDb.medications || []).forEach(m => medMap.set(m.id, m));
  (localDb.medications || []).forEach(localM => {
    const remoteM = medMap.get(localM.id);
    if (remoteM) {
      medMap.set(localM.id, {
        ...localM,
        stock: Math.min(localM.stock, remoteM.stock), // Conserver par précaution le stock de sécurité résiduel le plus bas
      });
    } else {
      medMap.set(localM.id, localM);
    }
  });
  merged.medications = Array.from(medMap.values());

  // 8. Logs d'observance médicament
  const medLogsMap = new Map<string, MedicationLog>();
  (remoteDb.medicationLogs || []).forEach(l => medLogsMap.set(l.id, l));
  (localDb.medicationLogs || []).forEach(l => medLogsMap.set(l.id, l));
  merged.medicationLogs = Array.from(medLogsMap.values());

  // 9. Suspicions Cliniques IA
  const suspMap = new Map<string, HealthSuspicion>();
  (remoteDb.healthSuspicions || []).forEach(s => suspMap.set(s.id, s));
  (localDb.healthSuspicions || []).forEach(localS => {
    const remoteS = suspMap.get(localS.id);
    if (remoteS) {
      // Combiner les points d'historique du score de confiance
      const localHist = localS.historyPoints || [];
      const remoteHist = remoteS.historyPoints || [];
      const dates = new Set<string>();
      const combinedHist: { date: string; confidenceScore: number }[] = [];
      [...localHist, ...remoteHist].forEach(pt => {
        if (!dates.has(pt.date)) {
          dates.add(pt.date);
          combinedHist.push(pt);
        }
      });
      suspMap.set(localS.id, {
        ...localS,
        confidenceScore: Math.round((localS.confidenceScore + remoteS.confidenceScore) / 2),
        historyPoints: combinedHist.sort((a,b) => a.date.localeCompare(b.date))
      });
    } else {
      suspMap.set(localS.id, localS);
    }
  });
  merged.healthSuspicions = Array.from(suspMap.values());

  // 10. Catalogue Boutique Récompenses
  const rewMap = new Map<string, Reward>();
  (remoteDb.rewards || []).forEach(r => rewMap.set(r.id, r));
  (localDb.rewards || []).forEach(localR => {
    const remoteR = rewMap.get(localR.id);
    if (remoteR) {
      rewMap.set(localR.id, {
        ...localR,
        isPurchased: localR.isPurchased || remoteR.isPurchased,
        purchaseHistory: [...(localR.purchaseHistory || []), ...(remoteR.purchaseHistory || [])].filter(
          (val, idx, self) => self.findIndex(t => t.date === val.date) === idx
        )
      });
    } else {
      rewMap.set(localR.id, localR);
    }
  });
  merged.rewards = Array.from(rewMap.values());

  // 11. Paramétrages de l'IA (Personality)
  merged.aiSettings = {
    personality: localDb.aiSettings?.personality || remoteDb.aiSettings?.personality || merged.aiSettings?.personality,
    behaviorRules: Array.from(new Set([
      ...(localDb.aiSettings?.behaviorRules || []),
      ...(remoteDb.aiSettings?.behaviorRules || [])
    ]))
  };

  // 12. Mémoires IA
  const memMap = new Map<string, AIMemory>();
  (remoteDb.aiMemories || []).forEach(m => memMap.set(m.id, m));
  (localDb.aiMemories || []).forEach(m => memMap.set(m.id, m));
  merged.aiMemories = Array.from(memMap.values());

  // 13. Suggestions Proactives
  const sugMap = new Map<string, ProactiveSuggestion>();
  (remoteDb.proactiveSuggestions || []).forEach(s => sugMap.set(s.id, s));
  (localDb.proactiveSuggestions || []).forEach(s => sugMap.set(s.id, s));
  merged.proactiveSuggestions = Array.from(sugMap.values());

  // 14. Cartes Psychiatrie / Bilans cognitifs Psy
  const psyMap = new Map<string, PsyCard>();
  (remoteDb.psyCards || []).forEach(p => psyMap.set(p.id, p));
  (localDb.psyCards || []).forEach(p => psyMap.set(p.id, p));
  merged.psyCards = Array.from(psyMap.values());

  // 15. Journal d'introspection
  const journalMap = new Map<string, { id: string; date: string; content: string }>();
  (remoteDb.journalLogs || []).forEach(j => journalMap.set(j.id, j));
  (localDb.journalLogs || []).forEach(j => journalMap.set(j.id, j));
  merged.journalLogs = Array.from(journalMap.values());

  // 16. Icônes personnalisées
  merged.appIcons = {
    ...(remoteDb.appIcons || {}),
    ...(localDb.appIcons || {})
  };

  // 17. Valise - Inventaire d'objets
  const itemsMap = new Map<string, SuitcaseItem>();
  (remoteDb.suitcaseItems || []).forEach(item => itemsMap.set(item.id, item));
  (localDb.suitcaseItems || []).forEach(item => itemsMap.set(item.id, item));
  merged.suitcaseItems = Array.from(itemsMap.values());

  // 18. Valise - Listes de bagages / régie
  const listsMap = new Map<string, SuitcaseList>();
  (remoteDb.suitcaseLists || []).forEach(list => listsMap.set(list.id, list));
  (localDb.suitcaseLists || []).forEach(list => listsMap.set(list.id, list));
  merged.suitcaseLists = Array.from(listsMap.values());

  // 19. Sommeil & Réveils Matinals (SleepWakeLogs)
  const sleepWakeMap = new Map<string, any>();
  (remoteDb.sleepWakeLogs || []).forEach(l => sleepWakeMap.set(l.id, l));
  (localDb.sleepWakeLogs || []).forEach(l => sleepWakeMap.set(l.id, l));
  merged.sleepWakeLogs = Array.from(sleepWakeMap.values()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return merged;
}

// Convertisseur intelligent et robuste de sauvegarde pour l'import JSON
export function convertBackupToAppDatabase(parsed: any): AppDatabase {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("La sauvegarde n'est pas un objet JSON valide.");
  }

  // A. Conversion des tâches
  const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
  const tasks = rawTasks.map((t: any): Task => {
    const isCompleted = t.isCompleted !== undefined ? !!t.isCompleted : (t.status === "done" || t.status === "completed");
    const importance = Number(t.importance ?? 5);
    const urgency = Number(t.urgency ?? 5);
    const easiness = Number(t.easiness ?? 5);
    const mentalLoad = Number(t.mentalLoad ?? 5);
    const score = t.score !== undefined ? Number(t.score) : Math.round(importance * 1.5 + urgency * 1.5 + mentalLoad - easiness);

    return {
      id: String(t.id || Math.random().toString()),
      title: String(t.title || "Sans titre"),
      description: String(t.description || ""),
      createdAt: String(t.createdAt || new Date().toISOString()),
      completedAt: t.completedAt ? String(t.completedAt) : undefined,
      isCompleted,
      importance,
      urgency,
      easiness,
      mentalLoad,
      score,
      isStarred: !t.isRecurring && !!(t.isStarred ?? t.isPinned ?? false),
      dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
      durationMinutes: Number(t.durationMinutes ?? t.estimatedDuration ?? 30),
      timeSpentSeconds: Number(t.timeSpentSeconds ?? (t.timeSpent ? t.timeSpent * 60 : 0)),
      rewardValue: Number(t.rewardValue ?? 15),
      chronoRewardValue: Number(t.chronoRewardValue ?? t.taskChronoRewardValue ?? 1),
      preparationIds: Array.isArray(t.preparationIds) ? t.preparationIds : [],
      type: t.type === "event" ? "event" : (t.type === "routine" ? "routine" : (t.type === "ponctuelle" || t.type === "appointment" ? "ponctuelle" : "ponctuelle")),
      recurrence: t.recurrence || "none",
      planningStatus: t.planningStatus || (isCompleted ? "done" : "backlog")
    };
  });

  // B. Conversion des habitudes
  const rawHabits = Array.isArray(parsed.habits) ? parsed.habits : [];
  const habits = rawHabits.map((h: any): Habit => {
    return {
      id: String(h.id || Math.random().toString()),
      title: String(h.title || h.name || "Habitude"),
      description: String(h.description || ""),
      type: h.type || "binary",
      currentValue: Number(h.currentValue ?? 0),
      targetValue: Number(h.targetValue ?? h.goal ?? 1),
      unit: h.unit || undefined,
      streak: Number(h.streak ?? h.currentStreak ?? 0),
      bestStreak: Number(h.bestStreak ?? 0),
      jokerDaysLeft: Number(h.jokerDaysLeft ?? h.jokerDaysAvailable ?? 0),
      daysThresholdAlert: Number(h.daysThresholdAlert ?? 3),
      lastCompletedDate: h.lastCompletedDate || (h.lastCompleted ? h.lastCompleted.split("T")[0] : undefined),
      history: h.history || {},
      rewardValue: Number(h.rewardValue ?? 10),
      isNeglected: !!h.isNeglected
    };
  });

  // C. Routines de Préparation
  const rawPreventions = Array.isArray(parsed.preparations) ? parsed.preparations : [];
  const preparations = rawPreventions.map((p: any): Preparation => {
    return {
      id: String(p.id || Math.random().toString()),
      title: String(p.title || "Routine"),
      description: String(p.description || ""),
      type: p.type === "post" ? "post" : "pre",
      durationMinutes: Number(p.durationMinutes ?? p.defaultDuration ?? 15),
      targetTaskId: p.targetTaskId ? String(p.targetTaskId) : undefined,
      anchorTime: p.anchorTime ? String(p.anchorTime) : undefined
    };
  });

  // D. Activités d'historique (Tracked activities)
  const rawActivities = Array.isArray(parsed.trackedActivities) ? parsed.trackedActivities : [];
  const trackedActivities = rawActivities.map((a: any): TrackedActivity => {
    return {
      id: String(a.id || Math.random().toString()),
      type: a.type || "custom",
      title: String(a.title || a.name || "Activité"),
      startTime: String(a.startTime || (a.activityDate ? a.activityDate + "T00:00:00Z" : new Date().toISOString())),
      endTime: a.endTime ? String(a.endTime) : undefined,
      notes: a.notes || undefined,
      value: a.value !== undefined ? Number(a.value) : undefined
    };
  });

  // E. Profil Utilisateur
  const rawProfile = parsed.userProfile || {};
  const userProfile = {
    coins: Number(rawProfile.coins ?? 140),
    debt: Number(rawProfile.debt ?? 0),
    targetSleepTime: String(rawProfile.targetSleepTime || rawProfile.bedTimeGoal || "23:00"),
    targetWakeTime: String(rawProfile.targetWakeTime || rawProfile.wakeUpGoal || "07:00"),
    wakeUpRewardSettings: rawProfile.wakeUpRewardSettings || {
      targetHour: 7,
      targetMinute: 0,
      baseReward: 30
    },
    rewardCalculationRatio: Number(rawProfile.rewardCalculationRatio ?? 1.0),
    themeStyle: rawProfile.themeStyle || "memphis",
    layoutSpacing: rawProfile.layoutSpacing || "cozy",
    cardBorderWidth: rawProfile.cardBorderWidth !== undefined ? Number(rawProfile.cardBorderWidth) : 4,
    cardShadowOpacity: rawProfile.cardShadowOpacity !== undefined ? Number(rawProfile.cardShadowOpacity) : 100,
    wakeUpPaliers: Array.isArray(rawProfile.wakeUpPaliers) && rawProfile.wakeUpPaliers.length > 0 ? rawProfile.wakeUpPaliers : DEFAULT_DATABASE_STATE.userProfile.wakeUpPaliers,
    activeChrono: rawProfile.activeChrono,
    projectOrder: Array.isArray(rawProfile.projectOrder) ? rawProfile.projectOrder : undefined,
    lastWakeConfirmedDate: rawProfile.lastWakeConfirmedDate ? String(rawProfile.lastWakeConfirmedDate) : undefined
  };

  // F. Médicaments
  const rawMeds = Array.isArray(parsed.medications) ? parsed.medications : [];
  const medications = rawMeds.map((m: any): Medication => {
    return {
      id: String(m.id || Math.random().toString()),
      name: String(m.name || "Médicament"),
      dosage: String(m.dosage || "1 comprimé"),
      frequencyDescription: String(m.frequencyDescription || "Quotidien"),
      stock: Number(m.stock ?? m.currentStock ?? 30),
      lowStockThreshold: Number(m.lowStockThreshold ?? 5),
      refillDoctorTrigger: !!m.refillDoctorTrigger
    };
  });

  // G. Logs Observance Médicament
  const rawMedLogs = Array.isArray(parsed.medicationLogs) ? parsed.medicationLogs : [];
  const medicationLogs = rawMedLogs.map((l: any): MedicationLog => {
    return {
      id: String(l.id || Math.random().toString()),
      medicationId: String(l.medicationId || ""),
      takenAt: String(l.takenAt || new Date().toISOString()),
      doseTaken: String(l.doseTaken || "1")
    };
  });

  // H. Tâches Récurrentes
  const rawRecurring = Array.isArray(parsed.recurringTasks) ? parsed.recurringTasks : [];
  const recurringTasks = rawRecurring.map((r: any): RecurringTask => {
    const history: { [date: string]: number } = {};
    if (r.history && typeof r.history === "object") {
      Object.keys(r.history).forEach(k => {
        history[k] = Number(r.history[k] ?? 1);
      });
    }
    if (Array.isArray(r.completionHistory)) {
      r.completionHistory.forEach((dateStr: string) => {
        if (dateStr) {
          const formattedDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
          history[formattedDate] = 1;
        }
      });
    }

    return {
      id: String(r.id || Math.random().toString()),
      title: String(r.title || "Tâche récurrente"),
      description: String(r.description || ""),
      frequency: r.recurrenceRule?.frequency === "daily" ? "daily" : (r.recurrenceRule?.frequency === "weekly" ? "weekly" : "monthly"),
      escalationRulesActive: !!r.escalationRulesActive,
      escalationRate: Number(r.escalationRate ?? 1.0),
      baseImportance: Number(r.baseImportance ?? r.taskImportance ?? 5),
      baseUrgency: Number(r.baseUrgency ?? r.taskUrgency ?? 5),
      nextDueDate: r.nextDueDate || (r.nextDueDateTime ? r.nextDueDateTime.split("T")[0] : new Date().toISOString().split("T")[0]),
      history,
      completionHistory: Array.isArray(r.completionHistory) ? r.completionHistory : [],
      greenThreshold: r.greenThreshold !== undefined ? Number(r.greenThreshold) : undefined,
      yellowThreshold: r.yellowThreshold !== undefined ? Number(r.yellowThreshold) : undefined,
      orangeThreshold: r.orangeThreshold !== undefined ? Number(r.orangeThreshold) : undefined,
      redThreshold: r.redThreshold !== undefined ? Number(r.redThreshold) : undefined,
      purpleThreshold: r.purpleThreshold !== undefined ? Number(r.purpleThreshold) : undefined,
      rewardValue: r.rewardValue !== undefined ? Number(r.rewardValue) : undefined,
      isStarred: !!(r.isStarred ?? false)
    } as any;
  });

  // I. Catalogue Boutiques Récompenses
  const rawRewards = Array.isArray(parsed.rewards) ? parsed.rewards : [];
  const rewards = rawRewards.map((r: any): Reward => {
    return {
      id: String(r.id || Math.random().toString()),
      title: String(r.title || "Récompense"),
      description: String(r.description || ""),
      costCoins: Number(r.costCoins ?? r.cost ?? 50),
      minutesPriceCoins: r.minutesPriceCoins !== undefined ? Number(r.minutesPriceCoins) : undefined,
      isPurchased: !!r.isPurchased,
      purchaseHistory: Array.isArray(r.purchaseHistory) ? r.purchaseHistory : []
    };
  });

  // J. Paramétrage IA et mémoires
  const rawAISettings = parsed.aiSettings || {};
  const aiSettings = {
    personality: String(rawAISettings.personality || rawAISettings.rules || "Thérapeute ACT expert. Encourageant mais ferme."),
    behaviorRules: Array.isArray(rawAISettings.behaviorRules) ? rawAISettings.behaviorRules : []
  };

  const rawAIMemories = Array.isArray(parsed.aiMemories) ? parsed.aiMemories : (Array.isArray(rawAISettings.memory) ? rawAISettings.memory : []);
  const aiMemories = rawAIMemories.map((m: any): AIMemory => {
    return {
      id: String(m.id || Math.random().toString()),
      key: String(m.key || "Mémoire"),
      value: String(m.value || ""),
      updatedAt: String(m.updatedAt || new Date().toISOString())
    };
  });

  // K. Suggestions Proactives
  const rawSuggestions = Array.isArray(parsed.proactiveSuggestions) ? parsed.proactiveSuggestions : [];
  const proactiveSuggestions = rawSuggestions.map((s: any): ProactiveSuggestion => {
    return {
      id: String(s.id || Math.random().toString()),
      type: s.type || "other",
      title: String(s.title || "Suggestion"),
      description: String(s.description || ""),
      isApplied: !!s.isApplied,
      isIgnored: !!s.isIgnored,
      createdAt: String(s.createdAt || new Date().toISOString())
    };
  });

  // L. Journal d'Intropection
  const rawJournal = Array.isArray(parsed.journalLogs) ? parsed.journalLogs : (Array.isArray(parsed.journalEntries) ? parsed.journalEntries : []);
  const journalLogs = rawJournal.map((j: any): { id: string; date: string; content: string } => {
    return {
      id: String(j.id || Math.random().toString()),
      date: String(j.date || (j.createdAt ? j.createdAt.split("T")[0] : new Date().toISOString().split("T")[0])),
      content: String(j.content || j.text || "")
    };
  });

  const dailyPlannings = Array.isArray(parsed.dailyPlannings) ? parsed.dailyPlannings : [];

  return {
    tasks,
    recurringTasks,
    preparations,
    habits,
    trackedActivities,
    medications,
    medicationLogs,
    healthSuspicions: [], // EXCLU CLINIQUE
    userProfile,
    rewards,
    aiSettings,
    aiMemories,
    proactiveSuggestions,
    psyCards: [], // EXCLU CLINIQUE
    journalLogs,
    dailyPlannings,
    sleepWakeLogs: Array.isArray(parsed.sleepWakeLogs) ? parsed.sleepWakeLogs : [],
    suitcaseItems: Array.isArray(parsed.suitcaseItems) ? parsed.suitcaseItems : [],
    suitcaseLists: Array.isArray(parsed.suitcaseLists) ? parsed.suitcaseLists : []
  };
}

// Propagation automatique de la complétion de la tâche mère vers toutes ses sous-tâches
export function propagateCompleteness(tasks: Task[], userProfileCoins: number): { tasks: Task[], coinsGained: number } {
  const isCompleted = (t: Task) => t.isCompleted === true || t.status === "done" || t.planningStatus === "done";
  
  let list = tasks.map(t => ({ ...t }));
  let changed = true;
  let totalCoinsGained = 0;
  let safetyCounter = 0;
  
  while (changed && safetyCounter < tasks.length + 5) {
    changed = false;
    safetyCounter++;
    
    // 1. Identifier tous les IDs des tâches complétées
    const completedIds = new Set<string>();
    for (const t of list) {
      if (isCompleted(t)) {
        completedIds.add(t.id);
      }
    }
    
    // 2. Valider automatiquement les sous-tâches non complétées dont le parent est complété
    list = list.map(t => {
      const parentId = t.parentId || t.parentTaskId;
      if (parentId && completedIds.has(parentId)) {
        const alreadyCompleted = isCompleted(t);
        if (!alreadyCompleted) {
          changed = true;
          totalCoinsGained += (t.rewardValue || 15);
          return {
            ...t,
            isCompleted: true,
            status: "done" as const,
            planningStatus: "done" as const,
            completedAt: t.completedAt || new Date().toISOString(),
            isPaused: true,
            lastResumeTime: undefined
          };
        }
      }
      return t;
    });
  }
  
  return { tasks: list, coinsGained: totalCoinsGained };
}

