/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A. Productivité & Temps

export interface IconData {
  type: 'emoji' | 'svg';
  content: string;
}

export type AppIconName = string;

export type AppIcons = Record<AppIconName, IconData>;

export interface TimeLogEntry {
  id: string;
  duration: number; // en minutes
  date: string; // YYYY-MM-DD
}

export interface Task {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  completedAt?: string;
  isCompleted: boolean;
  importance: number; // 0-10
  urgency: number; // 0-10
  easiness: number; // 0-10 (Facilité)
  mentalLoad: number; // 0-10 (Charge mentale)
  score: number; // Calculé : combinaison des 4 critères ci-dessus
  isStarred: boolean; // Tâche épinglée
  dueDate?: string; // Format ISO ou YYYY-MM-DD
  isHardDeadline?: boolean; // Échéance absolue (hard) ou flexible (soft)
  durationMinutes: number; // Durée estimée en minutes
  timeSpentSeconds: number; // Temps réel passé via le chronomètre
  rewardValue: number; // Gains de pièces à la complétion
  chronoRewardValue: number; // Gains de pièces par minute passée à travailler
  parentTaskId?: string; // Id de la tâche parente d'un lien parent-enfant
  parentId?: string; // Compatibilité pour lien parent-enfant dans l'ancienne vue
  dependencies: string[]; // Liste des IDs de tâches dont elle dépend
  isGoogleCalendarSynced?: boolean;
  googleEventId?: string;
  isGoogleTasksSynced?: boolean;
  preparationIds?: string[]; // IDs des routines de préparation/rituels associées
  scheduledTime?: string; // ex: "11:30" pour la planification
  type?: "routine" | "ponctuelle" | "event"; // type de tâche pour la planification
  isPlanningOnly?: boolean; // Tâche/routine réservée exclusivement au module de planification (non visible dans les autres vues)
  recurrence?: "daily" | "weekly" | "monthly" | "none"; // récurrence pour les événements
  planningStatus?: "backlog" | "scheduled" | "in-progress" | "done"; // statut de la tâche sous l'angle de la planification
  startTime?: string; // format ISO pour le chronomètre de planification
  endTime?: string; // format ISO pour le chronomètre de planification
  accumulatedTime?: number; // en secondes pour le chronomètre de planification
  isPaused?: boolean;
  lastResumeTime?: string; // format ISO pour le chronomètre de planification
  
  // Nouveaux attributs pour l'intégration de todoancien
  status?: "todo" | "doing" | "reported" | "done"; // KanBan et projets
  icon?: string | IconData; // Icône personnalisée
  tags?: string[]; // Tags / thèmes de projets
  deadline?: string; // Échéance
  timeLog?: TimeLogEntry[]; // Historique de log manuel
  color?: string; // Couleur personnalisée de carte
  estimatedDuration?: number; // Durée estimée
  workHistory?: { [date: string]: number }; // Historique des secondes de travail par date
  sortOrder?: number; // Ordre de réorganisation par Drag and Drop
  isDayOf?: boolean; // Ajouter au Jour de du tableau de bord
  
  // Attributs additionnels pour l'intégration calendrier et synchronisation riche
  isAllDay?: boolean;
  googleColorId?: string;
  isSharedEvent?: boolean;
  sharedCalendarName?: string;
  sharedCalendarId?: string;
  isDraggingPreview?: boolean;
  isArchived?: boolean;
  archivedAt?: string;
}

export interface RecurringTask {
  id: string;
  title: string;
  description: string;
  icon?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  escalationRulesActive: boolean; // Escalade automatique si retard
  escalationRate: number; // Multiplicateur de priorité par jour de retard accumulé
  baseImportance: number;
  baseUrgency: number;
  lastGeneratedAt?: string;
  nextDueDate: string;
  
  // Custom properties for rewards, thresholds and activity tracking
  rewardValue?: number;
  greenThreshold?: number;
  yellowThreshold?: number;
  orangeThreshold?: number;
  redThreshold?: number;
  purpleThreshold?: number;
  history?: { [date: string]: number };
  isStarred?: boolean;
  isPaused?: boolean;
  lastResumeTime?: string;
  accumulatedTime?: number;
  workHistory?: { [date: string]: number };
  chronoRewardValue?: number;
  sortOrder?: number; // Ordre de réorganisation par Drag and Drop
  isDayOf?: boolean; // Ajouter au Jour de du tableau de bord
  targetDays?: number[]; // Jours ciblés (1=Lun, 2=Mar, 3=Mer, 4=Jeu, 5=Ven, 6=Sam, 7=Dim)
  isArchived?: boolean;
  archivedAt?: string;
}

export interface Preparation {
  id: string;
  title: string;
  description: string;
  type: 'pre' | 'post'; // Routine avant ou après la tâche
  durationMinutes: number;
  targetTaskId?: string; // Rattaché optionnellement à une tâche cible
  anchorTime?: string; // Ancre horaire stricte ou moment de la journée (ex: "matin", "18:00")
  color?: string; // Couleur de la routine
  icon?: string; // Icône personnalisée de la routine
}

// B. Habitudes & Comportement

export interface Habit {
  id: string;
  title: string;
  description: string;
  icon?: string;
  type: 'binary' | 'quantitative' | 'chrono' | 'counter';
  currentValue: number;
  targetValue: number;
  unit?: string; // ex: "verres", "minutes", "fois"
  streak: number; // Série actuelle
  bestStreak: number; // Série historique maximale
  jokerDaysLeft: number; // Jours joker utilisables
  daysThresholdAlert: number; // Seuil d'inactivité en jours menant à une alerte visuelle
  lastCompletedDate?: string; // Format YYYY-MM-DD
  history: { [date: string]: number }; // Historique des valeurs complétées par date
  rewardValue: number; // Portefeuille de gain de pièces attribué à son accomplissement
  isNeglected: boolean; // Calculé dynamiquement selon la dernière complétion vs le seuil d'alerte
  
  // Custom thresholds and settings
  greenThreshold?: number;
  yellowThreshold?: number;
  orangeThreshold?: number;
  redThreshold?: number;
  purpleThreshold?: number;
  isStarred?: boolean;
  isPaused?: boolean;
  lastResumeTime?: string;
  accumulatedTime?: number;
  workHistory?: { [date: string]: number };
  chronoRewardValue?: number;
  color?: string;
  sortOrder?: number; // Ordre de réorganisation par Drag and Drop
  isDayOf?: boolean; // Ajouter au Jour de du tableau de bord
  targetDays?: number[]; // Jours ciblés (1=Lun, 2=Mar, 3=Mer, 4=Jeu, 5=Ven, 6=Sam, 7=Dim)
  isArchived?: boolean;
  archivedAt?: string;
}

// C. Santé Somatique, Psychiatrie & Pharmacie

export interface TrackedActivity {
  id: string;
  type: 'sleep' | 'sport' | 'work' | 'meal' | 'custom';
  title: string;
  startTime: string; // ISO
  endTime?: string; // ISO
  notes?: string;
  value?: number; // ex: Qualité du sommeil (1-10), Intensité du sport (1-10)
}

export interface Medication {
  id: string;
  name: string;
  dosage: string; // ex: "1 comprimé", "5ml"
  frequencyDescription: string; // ex: "Matin et soir"
  stock: number; // Stock physique actuel
  lowStockThreshold: number; // Seuil de stock bas pour llerte de renouvellement
  refillDoctorTrigger: boolean; // Besoin d'émettre un rappel de renouvellement d'ordonnance chez le médecin
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  takenAt: string; // ISO
  doseTaken: string;
}

export interface HealthSuspicion {
  id: string;
  pathologyName: string;
  confidenceScore: number; // Score d'affinité/confiance évolutif (0-100)
  status: 'active' | 'under_investigation' | 'ruled_out';
  symptomsFound: string[];
  explanation: string;
  historyPoints: { date: string; confidenceScore: number }[]; // Historique pour le graphique
}

// D. Gamification & Profil

export interface UserProfile {
  coins: number; // Devise virtuelle gagnée
  debt: number; // Dette accumulée lors de loisirs à la minute
  targetSleepTime: string; // ex: "23:00"
  targetWakeTime: string; // ex: "07:00"
  wakeUpRewardSettings: {
    targetHour: number;
    targetMinute: number;
    baseReward: number; // Récompense pour s'être levé tôt
  };
  rewardCalculationRatio?: number; // Multiplicateur de calcul automatique de gains (ex: 1.0)
  themeStyle?: string; // Style ou thème principal de l'app ("memphis", "cosmic", "brutalist")
  layoutSpacing?: string; // Espacement de la page ("compact", "cozy", "spacious")
  cardBorderWidth?: number; // Épaisseur des bordures (ex: 4px)
  cardShadowOpacity?: number; // Opacité de l'ombrage (0% à 100%)
  wakeUpPaliers?: { id: string; time: string; points: number }[];
  activeChrono?: { id: string; type: "task" | "habit" | "recurring" };
  projectOrder?: string[];
  lastWakeConfirmedDate?: string;
  lastBedConfirmedDate?: string;
  targetRewardId?: string; // ID de la récompense visée comme objectif dans la boutique
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  costCoins: number; // Coût d'achat ou d'activation forfaitaire
  minutesPriceCoins?: number; // Si c'est un loisir payé à la minute
  isPurchased: boolean;
  purchaseHistory: { date: string; cost: number }[];
  type?: 'redeemable' | 'leisure'; // Type de récompense : 'redeemable' (Achat unique) ou 'leisure' (Loisir payé par minute)
  icon?: string | IconData; // Icône personnalisée
  timeLog?: { id: string; date: string; duration: number }[]; // Logs de temps passés sur un loisir
  isAIGenerated?: boolean; // Pour compatibilité de génération
  isGame?: boolean; // Indique si ce loisir chronométré est un jeu vidéo (inclus dans l'onglet 'archive jeux' Google Sheets)
}

export interface RewardNotificationData {
  id: string;
  type: 'coins_gain' | 'streak_bonus' | 'level_up' | 'debt_repayment';
  amount: number;
  message: string;
}

// E. Intelligence Artificielle & Mémoire

export interface AISettings {
  personality: string; // ex: "Calme, bienveillant mais ferme"
  behaviorRules: string[]; // Règles de comportement de l'assistant
}

export interface AIMemory {
  id: string;
  key: string;
  value: string;
  updatedAt: string; // ISO
}

export interface ProactiveSuggestion {
  id: string;
  type: 'group_tasks' | 'adjust_schedule' | 'suggest_habit' | 'other';
  title: string;
  description: string;
  isApplied: boolean;
  isIgnored: boolean;
  createdAt: string; // ISO
}

export interface PsyCard {
  id: string;
  title: string;
  content: string; // Bilan psycho-cognitif ou piste d'introspection
  moodScore: number; // Score d'humeur associé (1-10) s'il y a lieu
  createdAt: string; // ISO
}

export interface AIAppModification {
  id: string;
  title: string;
  reason: string;
  actionType: 'set_theme_style' | 'set_layout_spacing' | 'set_target_wake_time' | 'set_reward_ratio' | 'create_habit' | 'create_task' | 'create_recurring' | 'archive_completed_tasks' | 'adjust_habit_threshold';
  payload: any;
  applied?: boolean;
}

export interface AIAuditResult {
  timestamp: string;
  modelUsed: string;
  source: 'gemini' | 'algorithmic';
  summary: string;
  helpAndAdvice: {
    id: string;
    title: string;
    detail: string;
    category: 'priorite' | 'rythme' | 'organisation' | 'bien_etre';
  }[];
  warnings: {
    id: string;
    level: 'high' | 'medium' | 'low';
    title: string;
    detail: string;
    actionPrompt?: string;
  }[];
  appModifications: AIAppModification[];
}

// Structure de données globale de l'écosystème tod°
export interface DailyPlanning {
  id: string;
  itemId: string;
  itemType: "task" | "habit" | "preparation" | "break";
  lane: number;
  startMinutes: number;
  endMinutes: number;
  label?: string;
  date?: string;
}

export interface SleepWakeLog {
  id: string;
  date: string;
  sleepStartTime: string;
  sleepEndTime: string;
  sleepLatencyMinutes: number;
  nightWakingDurationMinutes: number;
  remSleepEstimateMinutes: number;
  deepSleepEstimateMinutes: number;
  sleepDebtMinutes: number;
  circadianScore: number;
  sleepEfficiency: number;
  wakeUpTime: string;
  wakeUpDelayMinutes: number;
  coinsRewarded: number;
  notes?: string;
  bedTime?: string;
  bedTimeDelayMinutes?: number;
  bedTimeCoinsRewarded?: number;
  bedTimeNotes?: string;
}

export interface AppDatabase {
  lastWriteId?: string;
  tasks: Task[];
  recurringTasks: RecurringTask[];
  preparations: Preparation[];
  habits: Habit[];
  trackedActivities: TrackedActivity[];
  medications: Medication[];
  medicationLogs: MedicationLog[];
  healthSuspicions: HealthSuspicion[];
  userProfile: UserProfile;
  rewards: Reward[];
  aiSettings: AISettings;
  aiMemories: AIMemory[];
  proactiveSuggestions: ProactiveSuggestion[];
  psyCards: PsyCard[];
  journalLogs: { id: string; date: string; content: string }[]; // Journal d'Introspection
  dailyPlannings?: DailyPlanning[];
  sleepWakeLogs?: SleepWakeLog[];
  appIcons?: AppIcons;
  suitcaseItems?: SuitcaseItem[];
  suitcaseLists?: SuitcaseList[];
  suitcaseTemplates?: SuitcaseTemplate[];
  aiAudit?: AIAuditResult;
}

export interface SuitcaseItem {
  id: string;
  name: string;
  category: string; // ex: Vêtements, Électronique, Matériel Régie, Hygiène, Documents, Autre
  description?: string;
  tags?: string[]; // ex: Indispensable, Fragile, Hiver, etc.
  quantityOwned?: number;
  icon?: string;
  imageUrl?: string; // Photo ou URL de l'objet
  colorHint?: string; // Teinte/couleur personnalisée (ex: #2563eb)
}

export interface SuitcaseListItem {
  itemId: string;
  quantityNeeded: number;
  isPacked: boolean;
}

export interface SuitcaseList {
  id: string;
  name: string;
  type: 'perso' | 'regie' | 'autre';
  description?: string;
  items: SuitcaseListItem[];
  createdAt: string; // ISO
}

export interface SuitcaseTemplate {
  id: string;
  name: string;
  type: 'perso' | 'regie' | 'autre';
  description?: string;
  items: { itemId: string; quantityNeeded: number }[];
  createdAt: string; // ISO
}

export interface LocalUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

