import React, { useState, useEffect, useRef } from "react";
import { AppDatabase, Habit, RecurringTask, SleepWakeLog, Task } from "../../types";
import HabitCard from "../HabitCard";
import RecurringCard from "../RecurringCard";
import WakeUpHistoryManager from "../dashboard/WakeUpHistoryManager";
import BedTimeHistoryManager, { calculateBedDelta } from "../dashboard/BedTimeHistoryManager";
import { IconPicker } from "./IconPicker";
import { 
  Plus, 
  Flame, 
  ShieldAlert, 
  Award, 
  Star, 
  Trash2, 
  Check, 
  Clock, 
  Play, 
  Pause, 
  ExternalLink, 
  PlusCircle, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  Pencil, 
  Undo, 
  X, 
  Pin, 
  Sun, 
  Moon, 
  TrendingUp 
} from "lucide-react";

interface HabitsViewProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
  onDuplicate?: (item: Task | Habit | RecurringTask) => void;
}

// Couleurs Memphis disponibles
const BORDER_COLORS = [
  { id: "emerald", name: "Vert", borderClass: "border-[#2EC4B6]", textClass: "text-[#2EC4B6]", bgHex: "#2EC4B6" },
  { id: "yellow", name: "Jaune", borderClass: "border-[#FFD166]", textClass: "text-[#B7950B]", bgHex: "#FFD166" },
  { id: "orange", name: "Orange", borderClass: "border-[#FF7F3F]", textClass: "text-[#FF7F3F]", bgHex: "#FF7F3F" },
  { id: "rose", name: "Rouge", borderClass: "border-[#FF5E8E]", textClass: "text-[#FF5E8E]", bgHex: "#FF5E8E" },
  { id: "purple", name: "Violet Foncé", borderClass: "border-[#5E17EB]", textClass: "text-[#5E17EB]", bgHex: "#5E17EB" },
  { id: "black", name: "Noir", borderClass: "border-[#000000]", textClass: "text-[#000000]", bgHex: "#000000" },
  { id: "grey", name: "Gris", borderClass: "border-[#94A3B8]", textClass: "text-[#94A3B8]", bgHex: "#94A3B8" }
];

const BADGE_COLORS = [
  { id: "emerald", bgClass: "bg-[#E6F9F7]", textClass: "text-[#2EC4B6]", borderClass: "border-[#2EC4B6]" },
  { id: "yellow", bgClass: "bg-[#FFFBF0]", textClass: "text-[#B7950B]", borderClass: "border-[#FFD166]" },
  { id: "orange", bgClass: "bg-[#FFF0E6]", textClass: "text-[#FF7F3F]", borderClass: "border-[#FF7F3F]" },
  { id: "rose", bgClass: "bg-[#FFE6EC]", textClass: "text-[#FF5E8E]", borderClass: "border-[#FF5E8E]" },
  { id: "purple", bgClass: "bg-[#F3EAFE]", textClass: "text-[#5E17EB]", borderClass: "border-[#5E17EB]" },
  { id: "black", bgClass: "bg-black", textClass: "text-white", borderClass: "border-black" },
  { id: "grey", bgClass: "bg-[#F1F5F9]", textClass: "text-[#64748B]", borderClass: "border-[#CBD5E1]" }
];

export default function HabitsView({ db, updateDb, onDuplicate }: HabitsViewProps) {
  const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];

  // States pour l'extension et les sous-panneaux d'édition/historique
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"history" | "edit" | "delete" | null>(null);

  // Drag and Drop State pour la réorganisation des habitudes
  const [draggedHabitIndex, setDraggedHabitIndex] = useState<number | null>(null);

  // Mois/Année pour le calendrier d'historique
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());

  // Formulaire de saisie d'un log manuel
  const [manualDate, setManualDate] = useState<string>(todayStr);
  const [manualValue, setManualValue] = useState<number>(1);
  const [manualDone, setManualDone] = useState<boolean>(true);

  // Notification de récompense en direct
  const [rewardNotification, setRewardNotification] = useState<{ message: string; coinsGained: number } | null>(null);

  const triggerRewardNotification = (message: string, coins: number) => {
    setRewardNotification({ message, coinsGained: coins });
    setTimeout(() => {
      setRewardNotification(null);
    }, 4500);
  };

  // Formulaire d'édition directe d'un élément
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIcon, setEditIcon] = useState<string>("⚡");
  const [isEditIconPickerOpen, setIsEditIconPickerOpen] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState(1);
  const [editUnit, setEditUnit] = useState("");

  // Seuils d'inactivité éditables par tâche
  const [editGreenThreshold, setEditGreenThreshold] = useState<number>(4);
  const [editYellowThreshold, setEditYellowThreshold] = useState<number>(7);
  const [editOrangeThreshold, setEditOrangeThreshold] = useState<number>(10);
  const [editRedThreshold, setEditRedThreshold] = useState<number>(15);
  const [editPurpleThreshold, setEditPurpleThreshold] = useState<number>(20);
  const [editReward, setEditReward] = useState<number>(10);
  const [editChronoReward, setEditChronoReward] = useState<number>(1);
  const [editTargetDays, setEditTargetDays] = useState<number[]>([]);

  // Ticker pour l'actualisation en direct du chronomètre
  const [ticker, setTicker] = useState(0);

  // Synchronisation du minuteur unifié pour les Habitudes et Tâches Récurrentes
  const hasActiveTimer = 
    (db.habits || []).some((h) => !h.isPaused && h.lastResumeTime) ||
    (db.recurringTasks || []).some((rt) => !rt.isPaused && rt.lastResumeTime);

  useEffect(() => {
    if (!hasActiveTimer) return;
    const interval = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasActiveTimer]);

  const getElapsedSeconds = (item: any, type: "habit" | "recurring") => {
    let secs = item.accumulatedTime || 0;
    if (!item.isPaused && item.lastResumeTime) {
      secs += Math.round((Date.now() - new Date(item.lastResumeTime).getTime()) / 1000);
    }
    return Math.max(0, secs);
  };

  // LOGIQUE DRAG & DROP POUR LES HABITUDES
  const activeHabits = (db.habits || []).filter(h => !h.isArchived);
  const sortedHabits = [...activeHabits].sort((a, b) => {
    const orderA = a.sortOrder !== undefined ? a.sortOrder : (db.habits || []).indexOf(a);
    const orderB = b.sortOrder !== undefined ? b.sortOrder : (db.habits || []).indexOf(b);
    return orderA - orderB;
  });

  const handleHabitDragStart = (e: React.DragEvent, index: number) => {
    setDraggedHabitIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleHabitDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleHabitDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedHabitIndex === null || draggedHabitIndex === targetIndex) return;

    const reorderedHabits = [...sortedHabits];
    const [draggedItem] = reorderedHabits.splice(draggedHabitIndex, 1);
    reorderedHabits.splice(targetIndex, 0, draggedItem);

    const updatedHabits = [...db.habits];
    reorderedHabits.forEach((item, index) => {
      const idx = updatedHabits.findIndex(h => h.id === item.id);
      if (idx !== -1) {
        updatedHabits[idx] = { ...updatedHabits[idx], sortOrder: index };
      }
    });

    updateDb({
      ...db,
      habits: updatedHabits
    });

    setDraggedHabitIndex(null);
  };

  const handleHabitDragEnd = () => {
    setDraggedHabitIndex(null);
  };

  // LOGIQUE DRAG & DROP POUR LES TÂCHES RÉCURRENTES
  const [draggedRecurringIndex, setDraggedRecurringIndex] = useState<number | null>(null);

  const activeRecurring = (db.recurringTasks || []).filter(rt => !rt.isArchived);
  const sortedRecurring = [...activeRecurring].sort((a, b) => {
    const orderA = a.sortOrder !== undefined ? a.sortOrder : (db.recurringTasks || []).indexOf(a);
    const orderB = b.sortOrder !== undefined ? b.sortOrder : (db.recurringTasks || []).indexOf(b);
    return orderA - orderB;
  });

  const handleRecurringDragStart = (e: React.DragEvent, index: number) => {
    setDraggedRecurringIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleRecurringDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRecurringDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedRecurringIndex === null || draggedRecurringIndex === targetIndex) return;

    const reorderedRecurring = [...sortedRecurring];
    const [draggedItem] = reorderedRecurring.splice(draggedRecurringIndex, 1);
    reorderedRecurring.splice(targetIndex, 0, draggedItem);

    const updatedRecurring = [...(db.recurringTasks || [])];
    reorderedRecurring.forEach((item, index) => {
      const idx = updatedRecurring.findIndex(rt => rt.id === item.id);
      if (idx !== -1) {
        updatedRecurring[idx] = { ...updatedRecurring[idx], sortOrder: index };
      }
    });

    updateDb({
      ...db,
      recurringTasks: updatedRecurring
    });

    setDraggedRecurringIndex(null);
  };

  const handleRecurringDragEnd = () => {
    setDraggedRecurringIndex(null);
  };

  const handleStartUnifiedChrono = (id: string, type: "habit" | "recurring") => {
    const nowISO = new Date().toISOString();

    // 1. Pause les tâches normales
    const updatedTasks = db.tasks.map((t) => {
      if (t.planningStatus === "in-progress" && !t.isPaused) {
        const extraSec = t.lastResumeTime ? Math.round((Date.now() - new Date(t.lastResumeTime).getTime()) / 1000) : 0;
        return {
          ...t,
          isPaused: true,
          accumulatedTime: (t.accumulatedTime || 0) + extraSec,
          lastResumeTime: undefined
        };
      }
      return t;
    });

    // 2. Pause les habitudes
    const updatedHabits = db.habits.map((h) => {
      if (type === "habit" && h.id === id) {
        return {
          ...h,
          lastResumeTime: nowISO,
          isPaused: false
        };
      } else if (!h.isPaused && h.lastResumeTime) {
        const extraSec = Math.round((Date.now() - new Date(h.lastResumeTime).getTime()) / 1000);
        return {
          ...h,
          isPaused: true,
          accumulatedTime: (h.accumulatedTime || 0) + extraSec,
          lastResumeTime: undefined
        };
      }
      return h;
    });

    // 3. Pause les tâches récurrentes
    const updatedRecurring = (db.recurringTasks || []).map((rt) => {
      if (type === "recurring" && rt.id === id) {
        return {
          ...rt,
          lastResumeTime: nowISO,
          isPaused: false
        };
      } else if (!rt.isPaused && rt.lastResumeTime) {
        const extraSec = Math.round((Date.now() - new Date(rt.lastResumeTime).getTime()) / 1000);
        return {
          ...rt,
          isPaused: true,
          accumulatedTime: (rt.accumulatedTime || 0) + extraSec,
          lastResumeTime: undefined
        };
      }
      return rt;
    });

    const updatedProfile = {
      ...db.userProfile,
      activeChrono: { id, type }
    };

    updateDb({
      ...db,
      tasks: updatedTasks,
      habits: updatedHabits,
      recurringTasks: updatedRecurring,
      userProfile: updatedProfile
    });
  };

  const handleStopUnifiedChrono = (id: string, type: "habit" | "recurring") => {
    const now = Date.now();
    let updatedProfile = {
      ...db.userProfile,
      activeChrono: { id, type }
    };

    if (type === "habit") {
      const targetHabit = db.habits.find((h) => h.id === id);
      if (!targetHabit) return;

      const extraSec = targetHabit.lastResumeTime
        ? Math.round((now - new Date(targetHabit.lastResumeTime).getTime()) / 1000)
        : 0;
      const totalSec = (targetHabit.accumulatedTime || 0) + extraSec;

      let extraMinutes = Math.floor(totalSec / 60);
      let nextValue = targetHabit.currentValue;
      let accumulatedTimeLeftover = totalSec;

      if (targetHabit.type === "chrono" && extraMinutes > 0) {
        nextValue = Math.min(targetHabit.targetValue, targetHabit.currentValue + extraMinutes);
        accumulatedTimeLeftover = totalSec % 60;
      }

      const reachedTarget = nextValue >= targetHabit.targetValue;
      let streak = targetHabit.streak;
      if (reachedTarget && targetHabit.currentValue < targetHabit.targetValue) {
        streak += 1;
        updatedProfile.coins += targetHabit.rewardValue;
      }

      // Récompense par minute passée indépendamment de la récompense finale
      const minutesWorked = Math.floor(extraSec / 60);
      if (minutesWorked > 0) {
        const extraCoins = Math.max(1, minutesWorked * (targetHabit.chronoRewardValue || 1));
        updatedProfile.coins += extraCoins;
      }

      const updatedHabits = db.habits.map((h) => {
        if (h.id === id) {
          return {
            ...h,
            currentValue: nextValue,
            accumulatedTime: accumulatedTimeLeftover,
            isPaused: true,
            lastResumeTime: undefined,
            streak,
            lastCompletedDate: reachedTarget ? todayStr : h.lastCompletedDate,
            history: { ...h.history, [todayStr]: nextValue },
            workHistory: {
              ...(h.workHistory || {}),
              [todayStr]: (h.workHistory?.[todayStr] || 0) + extraSec
            }
          };
        }
        return h;
      });

      updateDb({
        ...db,
        habits: updatedHabits,
        userProfile: updatedProfile
      });

    } else if (type === "recurring") {
      const targetRt = db.recurringTasks?.find((rt) => rt.id === id);
      if (!targetRt) return;

      const extraSec = targetRt.lastResumeTime
        ? Math.round((now - new Date(targetRt.lastResumeTime).getTime()) / 1000)
        : 0;
      const totalSec = (targetRt.accumulatedTime || 0) + extraSec;

      const minutesWorked = Math.floor(extraSec / 60);
      if (minutesWorked > 0) {
        const extraCoins = Math.max(1, minutesWorked * (targetRt.chronoRewardValue || 1));
        updatedProfile.coins += extraCoins;
      }

      const updatedRecurring = (db.recurringTasks || []).map((rt) => {
        if (rt.id === id) {
          return {
            ...rt,
            accumulatedTime: totalSec,
            isPaused: true,
            lastResumeTime: undefined,
            workHistory: {
              ...(rt.workHistory || {}),
              [todayStr]: (rt.workHistory?.[todayStr] || 0) + extraSec
            }
          };
        }
        return rt;
      });

      updateDb({
        ...db,
        recurringTasks: updatedRecurring,
        userProfile: updatedProfile
      });
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Formulaire d'ajout d'habitude
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState<string>("🎯");
  const [isNewIconPickerOpen, setIsNewIconPickerOpen] = useState<boolean>(false);
  const [newType, setNewType] = useState<"binary" | "quantitative" | "chrono" | "counter">("binary");
  const [newTarget, setNewTarget] = useState(1);
  const [newUnit, setNewUnit] = useState("fois");
  const [newReward, setNewReward] = useState(10);
  const [jokers, setJokers] = useState(3);
  const [threshold, setThreshold] = useState(2);
  
  // Seuils complémentaires d'inactivité pour la création
  const [newGreenThreshold, setNewGreenThreshold] = useState<number>(4);
  const [newYellowThreshold, setNewYellowThreshold] = useState<number>(7);
  const [newOrangeThreshold, setNewOrangeThreshold] = useState<number>(10);
  const [newRedThreshold, setNewRedThreshold] = useState<number>(15);
  const [newPurpleThreshold, setNewPurpleThreshold] = useState<number>(20);

  // Réveil matinal (calcul à la minute)
  const [showHistory, setShowHistory] = useState(false);

  // Coucher du soir (calcul à la minute)
  const [showBedHistory, setShowBedHistory] = useState(false);

  // Horloge & Validation de réveil et coucher
  const getCurrentTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const [simulatedTime, setSimulatedTime] = useState<string>(() => getCurrentTime());
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  const [simulatedBedTime, setSimulatedBedTime] = useState<string>(() => getCurrentTime());
  const [bedSimulationResult, setBedSimulationResult] = useState<string | null>(null);



  // Ajout d'une nouvelle habitude
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      icon: newIcon || getEmojiForTitle(newTitle),
      type: newType,
      currentValue: 0,
      targetValue: newTarget,
      unit: newType === "chrono" ? "minutes" : (newUnit || "fois"),
      streak: 0,
      bestStreak: 0,
      jokerDaysLeft: jokers,
      daysThresholdAlert: threshold,
      history: {},
      rewardValue: newReward,
      isNeglected: false,
      greenThreshold: newGreenThreshold,
      yellowThreshold: newYellowThreshold,
      orangeThreshold: newOrangeThreshold,
      redThreshold: newRedThreshold,
      purpleThreshold: newPurpleThreshold
    };

    updateDb({
      ...db,
      habits: [...db.habits, newHabit]
    });

    setNewTitle("");
    setNewDesc("");
    setNewIcon("🎯");
    setIsNewIconPickerOpen(false);
    setNewTarget(1);
    setNewGreenThreshold(4);
    setNewYellowThreshold(7);
    setNewOrangeThreshold(10);
    setNewRedThreshold(15);
    setNewPurpleThreshold(20);
    setNewReward(10);
    setShowAddHabit(false);
  };

  // Actions de modification de la valeur d'une habitude
  const adjustHabitValue = (habitId: string, amount: number) => {
    const updatedHabits = db.habits.map((h) => {
      if (h.id === habitId) {
        const nextValue = Math.max(0, h.currentValue + amount);
        const reachedTarget = nextValue >= h.targetValue;
        
        const historyCopy = { ...h.history };
        historyCopy[todayStr] = nextValue;

        let streak = h.streak;
        if (reachedTarget && h.currentValue < h.targetValue) {
          streak += 1;
        }

        return {
          ...h,
          currentValue: nextValue,
          streak,
          lastCompletedDate: reachedTarget ? todayStr : h.lastCompletedDate,
          history: historyCopy
        };
      }
      return h;
    });

    const targetH = db.habits.find((h) => h.id === habitId);
    let updatedProfile = { ...db.userProfile };
    if (targetH) {
      const nextValue = Math.max(0, targetH.currentValue + amount);
      if (amount > 0 && targetH.currentValue < targetH.targetValue && nextValue >= targetH.targetValue) {
        updatedProfile.coins += targetH.rewardValue;
        triggerRewardNotification(`Habitude "${targetH.title}" complétée !`, targetH.rewardValue);
      } else if (amount < 0 && targetH.currentValue >= targetH.targetValue && nextValue < targetH.targetValue) {
        updatedProfile.coins = Math.max(0, updatedProfile.coins - targetH.rewardValue);
      }
    }

    updateDb({
      ...db,
      habits: updatedHabits,
      userProfile: updatedProfile
    });
  };

  // Validation d'une habitude ou routine
  const toggleHabitComplete = (habitId: string) => {
    const targetH = db.habits.find((h) => h.id === habitId);
    if (!targetH) return;

    const isCurrentlyDone = targetH.currentValue >= targetH.targetValue;
    const nextValue = isCurrentlyDone ? 0 : targetH.targetValue;
    const reachedTarget = nextValue >= targetH.targetValue;

    const updatedHabits = db.habits.map((h) => {
      if (h.id === habitId) {
        const historyCopy = { ...h.history };
        historyCopy[todayStr] = nextValue;

        return {
          ...h,
          currentValue: nextValue,
          streak: reachedTarget ? h.streak + 1 : Math.max(0, h.streak - 1),
          lastCompletedDate: reachedTarget ? todayStr : undefined,
          history: historyCopy
        };
      }
      return h;
    });

    let updatedProfile = { ...db.userProfile };
    if (reachedTarget && !isCurrentlyDone) {
      updatedProfile.coins += targetH.rewardValue;
      triggerRewardNotification(`Habitude "${targetH.title}" complétée !`, targetH.rewardValue);
    } else if (!reachedTarget && isCurrentlyDone) {
      updatedProfile.coins = Math.max(0, updatedProfile.coins - targetH.rewardValue);
    }

    updateDb({
      ...db,
      habits: updatedHabits,
      userProfile: updatedProfile
    });
  };

  // Validation d'une tâche récurrente
  const toggleRecurringComplete = (rtId: string) => {
    const targetRt = db.recurringTasks.find((rt) => rt.id === rtId);
    if (!targetRt) return;

    const historyObj = (targetRt as any).history || {};
    const isCurrentlyDone = historyObj[todayStr] > 0;
    const nextVal = isCurrentlyDone ? 0 : 1;
    
    const updatedRecurring = db.recurringTasks.map((rt) => {
      if (rt.id === rtId) {
        return {
          ...rt,
          history: {
            ...(rt as any).history,
            [todayStr]: nextVal
          },
          lastCompletedDate: nextVal > 0 ? todayStr : undefined
        };
      }
      return rt;
    });

    let updatedProfile = { ...db.userProfile };
    const reward = targetRt.rewardValue !== undefined ? targetRt.rewardValue : 15;
    if (nextVal > 0 && !isCurrentlyDone) {
      updatedProfile.coins += reward; // Petit bonus récurrente
      triggerRewardNotification(`Maintenance "${targetRt.title}" complétée !`, reward);
    } else if (nextVal === 0 && isCurrentlyDone) {
      updatedProfile.coins = Math.max(0, updatedProfile.coins - reward);
    }

    updateDb({
      ...db,
      recurringTasks: updatedRecurring,
      userProfile: updatedProfile
    });
  };

  // Épinglage
  const toggleHabitPin = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const updatedHabits = db.habits.map((h) => {
      if (h.id === id) {
        return { ...h, isStarred: !(h as any).isStarred };
      }
      return h;
    });
    updateDb({
      ...db,
      habits: updatedHabits
    });
  };

  const toggleHabitDayOf = (id: string) => {
    const updatedHabits = db.habits.map((h) => {
      if (h.id === id) {
        return { ...h, isDayOf: !h.isDayOf };
      }
      return h;
    });
    updateDb({
      ...db,
      habits: updatedHabits
    });
  };

  const toggleRecurringPin = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const updatedRecurring = db.recurringTasks.map((rt) => {
      if (rt.id === id) {
        return { ...rt, isStarred: !(rt as any).isStarred };
      }
      return rt;
    });
    updateDb({
      ...db,
      recurringTasks: updatedRecurring
    });
  };

  const toggleRecurringDayOf = (id: string) => {
    const updatedRecurring = db.recurringTasks.map((rt) => {
      if (rt.id === id) {
        return { ...rt, isDayOf: !rt.isDayOf };
      }
      return rt;
    });
    updateDb({
      ...db,
      recurringTasks: updatedRecurring
    });
  };

  // Suppression & Archivage
  const deleteHabit = (id: string) => {
    updateDb({
      ...db,
      habits: db.habits.filter((h) => h.id !== id),
    });
    setExpandedId(null);
    setActivePanel(null);
  };

  const archiveHabit = (id: string) => {
    updateDb({
      ...db,
      habits: db.habits.map((h) => h.id === id ? { ...h, isArchived: true, archivedAt: new Date().toISOString() } : h),
    });
    setExpandedId(null);
    setActivePanel(null);
  };

  const deleteRecurring = (id: string) => {
    updateDb({
      ...db,
      recurringTasks: db.recurringTasks.filter((rt) => rt.id !== id),
    });
    setExpandedId(null);
    setActivePanel(null);
  };

  const archiveRecurring = (id: string) => {
    updateDb({
      ...db,
      recurringTasks: db.recurringTasks.map((rt) => rt.id === id ? { ...rt, isArchived: true, archivedAt: new Date().toISOString() } : rt),
    });
    setExpandedId(null);
    setActivePanel(null);
  };

  // Sélectionner un élément pour modification ou historique
  const selectItemForAction = (id: string, panel: "history" | "edit" | "delete") => {
    if (expandedId === id && activePanel === panel) {
      setExpandedId(null);
      setActivePanel(null);
    } else {
      setExpandedId(id);
      setActivePanel(panel);

      // Charger les valeurs actuelles pour l'édition
      const isHabit = db.habits.find((h) => h.id === id);
      const isRecurring = db.recurringTasks.find((rt) => rt.id === id);

      if (isHabit) {
        setEditTitle(isHabit.title);
        setEditDesc(isHabit.description || "");
        setEditIcon(isHabit.icon || getEmojiForTitle(isHabit.title));
        setIsEditIconPickerOpen(false);
        setEditTarget(isHabit.targetValue);
        setEditUnit(isHabit.unit || "");
        setEditGreenThreshold(isHabit.greenThreshold !== undefined ? isHabit.greenThreshold : 4);
        setEditYellowThreshold(isHabit.yellowThreshold !== undefined ? isHabit.yellowThreshold : 7);
        setEditOrangeThreshold(isHabit.orangeThreshold !== undefined ? isHabit.orangeThreshold : 10);
        setEditRedThreshold(isHabit.redThreshold !== undefined ? isHabit.redThreshold : 15);
        setEditPurpleThreshold(isHabit.purpleThreshold !== undefined ? isHabit.purpleThreshold : 20);
        setEditReward(isHabit.rewardValue);
        setEditChronoReward(isHabit.chronoRewardValue !== undefined ? isHabit.chronoRewardValue : 1);
        setEditTargetDays(isHabit.targetDays || []);
      } else if (isRecurring) {
        setEditTitle(isRecurring.title);
        setEditDesc(isRecurring.description || "");
        setEditIcon(isRecurring.icon || getEmojiForTitle(isRecurring.title));
        setIsEditIconPickerOpen(false);
        setEditTarget(1);
        setEditUnit("fois");
        setEditGreenThreshold(isRecurring.greenThreshold !== undefined ? isRecurring.greenThreshold : 4);
        setEditYellowThreshold(isRecurring.yellowThreshold !== undefined ? isRecurring.yellowThreshold : 7);
        setEditOrangeThreshold(isRecurring.orangeThreshold !== undefined ? isRecurring.orangeThreshold : 10);
        setEditRedThreshold(isRecurring.redThreshold !== undefined ? isRecurring.redThreshold : 15);
        setEditPurpleThreshold(isRecurring.purpleThreshold !== undefined ? isRecurring.purpleThreshold : 20);
        setEditReward(isRecurring.rewardValue !== undefined ? isRecurring.rewardValue : 15);
        setEditChronoReward(isRecurring.chronoRewardValue !== undefined ? isRecurring.chronoRewardValue : 1);
        setEditTargetDays(isRecurring.targetDays || []);
      }
    }
  };

  // Enregistrer les modifications
  const handleSaveEdit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const isHabit = db.habits.findIndex((h) => h.id === id);

    if (isHabit !== -1) {
      const updatedHabits = [...db.habits];
      updatedHabits[isHabit] = {
        ...updatedHabits[isHabit],
        title: editTitle.trim(),
        description: editDesc.trim(),
        icon: editIcon,
        targetValue: editTarget,
        unit: editUnit,
        greenThreshold: editGreenThreshold,
        yellowThreshold: editYellowThreshold,
        orangeThreshold: editOrangeThreshold,
        redThreshold: editRedThreshold,
        purpleThreshold: editPurpleThreshold,
        rewardValue: editReward,
        chronoRewardValue: editChronoReward,
        targetDays: editTargetDays.length > 0 ? editTargetDays : undefined
      };

      updateDb({
        ...db,
        habits: updatedHabits
      });
    } else {
      const isRecurring = db.recurringTasks.findIndex((rt) => rt.id === id);
      if (isRecurring !== -1) {
        const updatedRecurring = [...db.recurringTasks];
        updatedRecurring[isRecurring] = {
          ...updatedRecurring[isRecurring],
          title: editTitle.trim(),
          description: editDesc.trim(),
          icon: editIcon,
          greenThreshold: editGreenThreshold,
          yellowThreshold: editYellowThreshold,
          orangeThreshold: editOrangeThreshold,
          redThreshold: editRedThreshold,
          purpleThreshold: editPurpleThreshold,
          rewardValue: editReward,
          chronoRewardValue: editChronoReward,
          targetDays: editTargetDays.length > 0 ? editTargetDays : undefined
        };

        updateDb({
          ...db,
          recurringTasks: updatedRecurring
        });
      }
    }

    // Fermeture avec animation
    setActivePanel(null);
    setExpandedId(null);
  };

  // Calcul du calendrier
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Lundi = 0, Dimanche = 6
  };

  const changeMonth = (direction: number) => {
    let nextMonth = calendarMonth + direction;
    let nextYear = calendarYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setCalendarMonth(nextMonth);
    setCalendarYear(nextYear);
  };

  // Toggle état du calendrier pour un jour donné
  const toggleCalendarDateStatus = (id: string, dateStr: string) => {
    const isHabit = db.habits.findIndex((h) => h.id === id);
    if (isHabit !== -1) {
      const habit = db.habits[isHabit];
      const historyCopy = { ...habit.history };
      const wasCompleted = (historyCopy[dateStr] || 0) >= habit.targetValue;
      const reward = habit.rewardValue || 10;
      const updatedProfile = { ...db.userProfile };
      
      let nextValue = 0;
      if (wasCompleted) {
        historyCopy[dateStr] = 0;
        updatedProfile.coins = Math.max(0, updatedProfile.coins - reward);
      } else {
        nextValue = habit.targetValue;
        historyCopy[dateStr] = habit.targetValue;
        updatedProfile.coins += reward;
      }

      let currentValue = habit.currentValue;
      let streak = habit.streak;
      if (dateStr === todayStr) {
        currentValue = nextValue;
        if (!wasCompleted) {
          streak += 1;
        } else {
          streak = Math.max(0, streak - 1);
        }
      }

      const updatedHabits = [...db.habits];
      updatedHabits[isHabit] = {
        ...habit,
        history: historyCopy,
        currentValue,
        streak,
        lastCompletedDate: wasCompleted ? undefined : dateStr
      };

      updateDb({
        ...db,
        habits: updatedHabits,
        userProfile: updatedProfile
      });
    } else {
      const isRt = db.recurringTasks.findIndex((rt) => rt.id === id);
      if (isRt !== -1) {
        const rt = db.recurringTasks[isRt];
        const historyCopy = { ...((rt as any).history || {}) };
        const wasCompleted = (historyCopy[dateStr] || 0) > 0;
        const reward = rt.rewardValue !== undefined ? rt.rewardValue : 15;
        const updatedProfile = { ...db.userProfile };

        if (wasCompleted) {
          historyCopy[dateStr] = 0;
          updatedProfile.coins = Math.max(0, updatedProfile.coins - reward);
        } else {
          historyCopy[dateStr] = 1;
          updatedProfile.coins += reward;
        }

        const updatedRecurring = [...db.recurringTasks];
        updatedRecurring[isRt] = {
          ...rt,
          history: historyCopy,
          lastCompletedDate: wasCompleted ? undefined : dateStr
        } as any;

        updateDb({
          ...db,
          recurringTasks: updatedRecurring,
          userProfile: updatedProfile
        });
      }
    }
  };

  // Ajouter un log manuel
  const handleAddManualLog = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!manualDate) return;

    const isHabit = db.habits.findIndex((h) => h.id === id);
    if (isHabit !== -1) {
      const habit = db.habits[isHabit];
      const historyCopy = { ...habit.history };
      const previousValue = historyCopy[manualDate] || 0;
      const wasDone = previousValue >= habit.targetValue;
      const nowDone = manualDone;
      const reward = habit.rewardValue || 10;

      historyCopy[manualDate] = manualDone ? habit.targetValue : Number(manualValue || 0);

      const updatedProfile = { ...db.userProfile };
      if (nowDone && !wasDone) {
        updatedProfile.coins += reward;
      } else if (!nowDone && wasDone) {
        updatedProfile.coins = Math.max(0, updatedProfile.coins - reward);
      }

      let currentValue = habit.currentValue;
      let streak = habit.streak;
      if (manualDate === todayStr) {
        currentValue = manualDone ? habit.targetValue : Number(manualValue || 0);
        if (nowDone && !wasDone) {
          streak += 1;
        } else if (!nowDone && wasDone) {
          streak = Math.max(0, streak - 1);
        }
      }

      const updatedHabits = [...db.habits];
      updatedHabits[isHabit] = {
        ...habit,
        history: historyCopy,
        currentValue,
        streak,
        lastCompletedDate: manualDone ? manualDate : habit.lastCompletedDate
      };

      updateDb({
        ...db,
        habits: updatedHabits,
        userProfile: updatedProfile
      });
    } else {
      const isRt = db.recurringTasks.findIndex((rt) => rt.id === id);
      if (isRt !== -1) {
        const rt = db.recurringTasks[isRt];
        const historyCopy = { ...((rt as any).history || {}) };
        const previousVal = historyCopy[manualDate] || 0;
        const wasDone = previousVal > 0;
        const nowDone = manualDone;
        const reward = rt.rewardValue !== undefined ? rt.rewardValue : 15;

        historyCopy[manualDate] = manualDone ? 1 : 0;

        const updatedProfile = { ...db.userProfile };
        if (nowDone && !wasDone) {
          updatedProfile.coins += reward;
        } else if (!nowDone && wasDone) {
          updatedProfile.coins = Math.max(0, updatedProfile.coins - reward);
        }

        const updatedRecurring = [...db.recurringTasks];
        updatedRecurring[isRt] = {
          ...rt,
          history: historyCopy,
          lastCompletedDate: manualDone ? manualDate : (rt as any).lastCompletedDate
        } as any;

        updateDb({
          ...db,
          recurringTasks: updatedRecurring,
          userProfile: updatedProfile
        });
      }
    }

    // Feedback
    setManualValue(1);
    setManualDone(true);
  };

  // Calculer l'inactivité passée ("depuis quand")
  const getInactivityDays = (item: any): { value: string; days: number | null } => {
    // Si l'historique a des éléments, on récupère le plus récent
    const history = item.history || {};
    const dates = Object.keys(history).filter((d) => history[d] > 0);

    let mostRecentDate = item.lastCompletedDate;
    if (dates.length > 0) {
      dates.sort((a, b) => b.localeCompare(a));
      mostRecentDate = dates[0];
    }

    if (!mostRecentDate) {
      return { value: "Jamais", days: null };
    }

    // Date actuelle dynamique
    const today = new Date();
    const lastDate = new Date(mostRecentDate);
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { value: "Aujourd'hui", days: 0 };
    }
    if (diffDays === 1) {
      return { value: "Hier", days: 1 };
    }
    return { value: `${diffDays}j`, days: diffDays };
  };

  // Obtenir la couleur dynamique d'inactivité sous forme d'ID de couleur
  const getDynamicColorId = (item: any): string => {
    const inactivity = getInactivityDays(item);
    const days = inactivity.days; // number or null

    if (days === null) {
      // Jamais complété : gris par défaut quand rien n'est configuré
      return "grey";
    }

    // Récupérer les seuils configurés sur l'élément (ou valeurs par défaut)
    const tGreen = item.greenThreshold !== undefined ? item.greenThreshold : 4;
    const tYellow = item.yellowThreshold !== undefined ? item.yellowThreshold : 7;
    const tOrange = item.orangeThreshold !== undefined ? item.orangeThreshold : 10;
    const tRed = item.redThreshold !== undefined ? item.redThreshold : 15;
    const tPurple = item.purpleThreshold !== undefined ? item.purpleThreshold : 20;

    if (days < tGreen) {
      return "emerald"; // vert
    } else if (days < tYellow) {
      return "yellow"; // jaune
    } else if (days < tOrange) {
      return "orange"; // orange
    } else if (days < tRed) {
      return "rose"; // rouge
    } else if (days < tPurple) {
      return "purple"; // violet foncé
    } else {
      return "black"; // noir
    }
  };

  // Récupérer couleur liseré & badge (harmonisé sur la même couleur d'inactivité)
  const fetchCardBorderClass = (item: any, fallbackId: string) => {
    const colorId = getDynamicColorId(item);
    const found = BORDER_COLORS.find((b) => b.id === colorId);
    return found ? found.borderClass : "border-rose-400";
  };

  const fetchBadgeClass = (item: any, fallbackId: string) => {
    const colorId = getDynamicColorId(item);
    const found = BADGE_COLORS.find((b) => b.id === colorId);
    return found ? `${found.bgClass} ${found.textClass} ${found.borderClass}` : "bg-rose-50 text-rose-600 border-rose-300";
  };

  // Lever Matinal : Calcul à la minute
  const formatTime = (t: string) => {
    const parts = t.trim().split(":");
    if (parts.length === 2) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    }
    return t.trim();
  };

  const getMinutesFromTime = (timeStr: string) => {
    const parts = timeStr.trim().split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const calculateWakeDelta = (wakeTime: string, targetTime: string) => {
    const targetM = getMinutesFromTime(targetTime);
    const wakeM = getMinutesFromTime(wakeTime);
    return targetM - wakeM; // Positif = avance (+CS), Négatif = retard (-CS)
  };

  // Calcul & validation du réveil matinal
  const handleValidateWakeUp = () => {
    if (!simulatedTime) return;

    const formattedWakeTime = formatTime(simulatedTime);
    const targetWakeTime = db.userProfile?.targetWakeTime || "07:00";
    const delta = calculateWakeDelta(formattedWakeTime, targetWakeTime);

    const currentLogs = db.sleepWakeLogs || [];
    const existingIndex = currentLogs.findIndex((l) => l.date === todayStr);

    let updatedCoins = Number(db.userProfile?.coins || 0);
    let updatedLogs = [...currentLogs];

    if (existingIndex >= 0) {
      const prevPoints = currentLogs[existingIndex].coinsRewarded || 0;
      const diff = delta - prevPoints;
      updatedCoins = Math.max(0, updatedCoins + diff);
      updatedLogs[existingIndex] = {
        ...updatedLogs[existingIndex],
        wakeUpTime: formattedWakeTime,
        sleepEndTime: formattedWakeTime,
        coinsRewarded: delta,
        wakeUpDelayMinutes: -delta,
        notes: delta >= 0
          ? `Réveil à ${formattedWakeTime} (+${delta} min d'avance sur ${targetWakeTime})`
          : `Réveil à ${formattedWakeTime} (${Math.abs(delta)} min de retard sur ${targetWakeTime})`
      };
      setSimulationResult(
        `🔄 Réveil actualisé à ${formattedWakeTime} (Cible ${targetWakeTime} : ${delta >= 0 ? `+${delta}` : delta} CS). Ajustement : ${diff >= 0 ? `+${diff}` : diff} CS !`
      );
    } else {
      updatedCoins = Math.max(0, updatedCoins + delta);
      const newLog: SleepWakeLog = {
        id: `wake-${Date.now()}`,
        date: todayStr,
        sleepStartTime: db.userProfile?.targetSleepTime || "23:00",
        sleepEndTime: formattedWakeTime,
        sleepLatencyMinutes: 10,
        nightWakingDurationMinutes: 0,
        remSleepEstimateMinutes: 90,
        deepSleepEstimateMinutes: 90,
        sleepDebtMinutes: 0,
        circadianScore: 100,
        sleepEfficiency: 95,
        wakeUpTime: formattedWakeTime,
        wakeUpDelayMinutes: -delta,
        coinsRewarded: delta,
        notes: delta >= 0
          ? `Réveil à ${formattedWakeTime} (+${delta} min d'avance sur ${targetWakeTime})`
          : `Réveil à ${formattedWakeTime} (${Math.abs(delta)} min de retard sur ${targetWakeTime})`
      };
      updatedLogs = [newLog, ...updatedLogs];
      setSimulationResult(
        `🎉 Réveil validé à ${formattedWakeTime} ! ${delta >= 0 ? `+${delta} min d'avance : +${delta} CS crédités` : `${Math.abs(delta)} min de retard : ${delta} CS déduits`} !`
      );
    }

    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        coins: updatedCoins
      },
      sleepWakeLogs: updatedLogs
    });

    setTimeout(() => {
      setSimulationResult(null);
    }, 6000);
  };

  // Calcul & validation du coucher du soir
  const handleValidateBedTime = () => {
    if (!simulatedBedTime) return;

    const formattedBedTime = formatTime(simulatedBedTime);
    const targetSleepTime = db.userProfile?.targetSleepTime || "23:00";
    const delta = calculateBedDelta(formattedBedTime, targetSleepTime);

    const currentLogs = db.sleepWakeLogs || [];
    const existingIndex = currentLogs.findIndex((l) => l.date === todayStr);

    let updatedCoins = Number(db.userProfile?.coins || 0);
    let updatedLogs = [...currentLogs];

    if (existingIndex >= 0) {
      const prevPoints = currentLogs[existingIndex].bedTimeCoinsRewarded || 0;
      const diff = delta - prevPoints;
      updatedCoins = Math.max(0, updatedCoins + diff);
      updatedLogs[existingIndex] = {
        ...updatedLogs[existingIndex],
        bedTime: formattedBedTime,
        sleepStartTime: formattedBedTime,
        bedTimeCoinsRewarded: delta,
        bedTimeDelayMinutes: delta,
        bedTimeNotes: delta >= 0
          ? `Coucher à ${formattedBedTime} (+${delta} min d'avance sur ${targetSleepTime})`
          : `Coucher à ${formattedBedTime} (${Math.abs(delta)} min de retard sur ${targetSleepTime})`
      };
      setBedSimulationResult(
        `🔄 Coucher actualisé à ${formattedBedTime} (Cible ${targetSleepTime} : ${delta >= 0 ? `+${delta}` : delta} CS). Ajustement : ${diff >= 0 ? `+${diff}` : diff} CS !`
      );
    } else {
      updatedCoins = Math.max(0, updatedCoins + delta);
      const newLog: SleepWakeLog = {
        id: `bed-${Date.now()}`,
        date: todayStr,
        sleepStartTime: formattedBedTime,
        sleepEndTime: db.userProfile?.targetWakeTime || "07:00",
        sleepLatencyMinutes: 10,
        nightWakingDurationMinutes: 0,
        remSleepEstimateMinutes: 90,
        deepSleepEstimateMinutes: 90,
        sleepDebtMinutes: 0,
        circadianScore: 100,
        sleepEfficiency: 95,
        wakeUpTime: db.userProfile?.targetWakeTime || "07:00",
        wakeUpDelayMinutes: 0,
        coinsRewarded: 0,
        bedTime: formattedBedTime,
        bedTimeCoinsRewarded: delta,
        bedTimeDelayMinutes: delta,
        bedTimeNotes: delta >= 0
          ? `Coucher à ${formattedBedTime} (+${delta} min d'avance sur ${targetSleepTime})`
          : `Coucher à ${formattedBedTime} (${Math.abs(delta)} min de retard sur ${targetSleepTime})`
      };
      updatedLogs = [newLog, ...updatedLogs];
      setBedSimulationResult(
        `🎉 Coucher validé à ${formattedBedTime} ! ${delta >= 0 ? `+${delta} min d'avance : +${delta} CS crédités` : `${Math.abs(delta)} min de retard : ${delta} CS déduits`} !`
      );
    }

    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        coins: updatedCoins,
        lastBedConfirmedDate: todayStr
      },
      sleepWakeLogs: updatedLogs
    });

    setTimeout(() => {
      setBedSimulationResult(null);
    }, 6000);
  };

  // Émojis sémantiques pour titres connus
  const getEmojiForTitle = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("sport") || lower.includes("rep")) return "🏋️";
    if (lower.includes("ménage") || lower.includes("ranger") || lower.includes("nettoy") || lower.includes("poubelle")) return "♻️";
    if (lower.includes("ami") || lower.includes("voir")) return "❤️";
    if (lower.includes("qviviq") || lower.includes("sommeil") || lower.includes("dormir")) return "🌙";
    if (lower.includes("répondre") || lower.includes("admin")) return "📱";
    if (lower.includes("divers")) return "🪁";
    if (lower.includes("impro")) return "🎭";
    if (lower.includes("drive") || lower.includes("voit")) return "🚗";
    if (lower.includes("cheveux") || lower.includes("coiffeur")) return "💇";
    if (lower.includes("barbe")) return "🦁";
    if (lower.includes("corps") || lower.includes("poil")) return "🐻";
    if (lower.includes("facture") || lower.includes("paye")) return "💵";
    if (lower.includes("pole") || lower.includes("pôle") || lower.includes("emploi")) return "💻";
    if (lower.includes("ursaff") || lower.includes("urssaf")) return "📈";
    return "⚡";
  };

  const handleLogHabitTime = (habitId: string, durationMinutes: number, dateStr?: string) => {
    const dStr = dateStr || todayStr;
    const extraSec = durationMinutes * 60;
    const targetHabit = db.habits.find((h) => h.id === habitId);
    if (!targetHabit) return;

    const updatedProfile = { ...db.userProfile };
    const rewardRate = targetHabit.chronoRewardValue || 1;
    if (durationMinutes > 0) {
      const extraCoins = Math.max(1, durationMinutes * rewardRate);
      updatedProfile.coins = (updatedProfile.coins || 0) + extraCoins;
    } else if (durationMinutes < 0) {
      const lostCoins = Math.abs(durationMinutes) * rewardRate;
      updatedProfile.coins = Math.max(0, (updatedProfile.coins || 0) - lostCoins);
    }

    let nextValue = targetHabit.currentValue;
    if (targetHabit.type === "chrono" && dStr === todayStr) {
      nextValue = Math.max(0, Math.min(targetHabit.targetValue, targetHabit.currentValue + durationMinutes));
    }

    const reachedTarget = nextValue >= targetHabit.targetValue;
    let streak = targetHabit.streak;
    if (durationMinutes > 0 && reachedTarget && targetHabit.currentValue < targetHabit.targetValue) {
      streak += 1;
      updatedProfile.coins += targetHabit.rewardValue;
    }

    const currentWorkSec = targetHabit.workHistory?.[dStr] || 0;
    const newWorkSec = Math.max(0, currentWorkSec + extraSec);
    const currentHistVal = targetHabit.history?.[dStr] || 0;
    const newHistVal = targetHabit.type === "chrono" ? Math.max(0, currentHistVal + durationMinutes) : currentHistVal;

    const updatedHabits = db.habits.map((h) => {
      if (h.id === habitId) {
        return {
          ...h,
          currentValue: dStr === todayStr ? nextValue : h.currentValue,
          streak: dStr === todayStr ? streak : h.streak,
          lastCompletedDate: (reachedTarget && dStr === todayStr) ? todayStr : h.lastCompletedDate,
          history: { ...h.history, [dStr]: newHistVal },
          workHistory: {
            ...(h.workHistory || {}),
            [dStr]: newWorkSec
          }
        };
      }
      return h;
    });

    updateDb({
      ...db,
      habits: updatedHabits,
      userProfile: updatedProfile
    });
  };

  const handleLogRecurringTaskTime = (recurringTaskId: string, durationMinutes: number, dateStr?: string) => {
    const dStr = dateStr || todayStr;
    const extraSec = durationMinutes * 60;
    const targetRt = db.recurringTasks?.find((rt) => rt.id === recurringTaskId);
    if (!targetRt) return;

    const updatedProfile = { ...db.userProfile };
    const rewardRate = targetRt.chronoRewardValue || 1;
    if (durationMinutes > 0) {
      const extraCoins = Math.max(1, durationMinutes * rewardRate);
      updatedProfile.coins = (updatedProfile.coins || 0) + extraCoins;
    } else if (durationMinutes < 0) {
      const lostCoins = Math.abs(durationMinutes) * rewardRate;
      updatedProfile.coins = Math.max(0, (updatedProfile.coins || 0) - lostCoins);
    }

    const currentWorkSec = targetRt.workHistory?.[dStr] || 0;
    const newWorkSec = Math.max(0, currentWorkSec + extraSec);

    const updatedRecurring = (db.recurringTasks || []).map((rt) => {
      if (rt.id === recurringTaskId) {
        return {
          ...rt,
          accumulatedTime: Math.max(0, (rt.accumulatedTime || 0) + extraSec),
          workHistory: {
            ...(rt.workHistory || {}),
            [dStr]: newWorkSec
          }
        };
      }
      return rt;
    });

    updateDb({
      ...db,
      recurringTasks: updatedRecurring,
      userProfile: updatedProfile
    });
  };

  return (
    <div className="bg-[#FAF7F2] text-slate-800 p-6 rounded-none min-h-screen font-sans space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-black pb-4 gap-4 bg-white p-6 border-2 border-black shadow-[4px_4px_0px_#000000]">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 font-sans">
            🎨 Habitudes & Tâches récurrentes
          </h1>
          <p className="text-xs text-gray-700 mt-1 font-mono font-bold">
            Gérez vos habitudes, tâches récurrentes & calendrier d'inactivité.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <span className="bg-yellow-300 text-black text-[11px] font-black px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] font-mono flex items-center gap-1 select-none">
              🪙 {db.userProfile?.coins || 0} COINS
            </span>
            <span className="bg-rose-500 text-white text-[11px] font-black px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] font-mono flex items-center gap-1 select-none">
              🛑 {db.userProfile?.debt || 0} CS DT
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowAddHabit(!showAddHabit)}
          className="bg-[#2E2E2E] text-white hover:bg-black px-5 py-3 text-xs font-black rounded-none border-2 border-black shadow-[3px_3px_0px_#000000] flex items-center gap-2 cursor-pointer transition-all active:translate-y-0.5 active:shadow-[1px_1px_0px_#000000]"
        >
          {showAddHabit ? <Pause size={14} /> : <Plus size={14} />}
          {showAddHabit ? "MASQUER FORMULAIRE" : "CRÉER NOUVELLE HABITUDE"}
        </button>
      </div>

      {/* BANNER NOTIFICATION RÉCOMPENSE EN LIGNE (ZERO POPUP) */}
      {rewardNotification && (
        <div className="bg-[#24B27F] text-white border-3 border-black p-4 font-bold flex items-center justify-between shadow-[5px_5px_0px_#000000] animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <span className="uppercase text-xs tracking-wide">Système de Récompense : {rewardNotification.message}</span>
          </div>
          <div className="bg-yellow-300 text-black px-3 py-1 border-2 border-black font-mono font-black text-xs shrink-0 flex items-center gap-1">
            🏆 +{rewardNotification.coinsGained} COINS complexes !
          </div>
        </div>
      )}

      {/* FORMULAIRE INLINE AJOUT MEMPHIS */}
      {showAddHabit && (
        <form 
          onSubmit={handleAddHabit} 
          className="bg-[#FFFDF9] border-3 border-black p-6 rounded-none font-sans text-xs space-y-4 shadow-[6px_6px_0px_#000000]"
        >
          <div className="font-black text-sm text-slate-900 border-b-2 border-dashed border-black pb-2 uppercase tracking-wide flex items-center gap-1.5">
            <PlusCircle size={16} className="text-indigo-600" />
            CRÉATION DE NOUVELLE HABITUDE
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-black uppercase tracking-wide text-gray-700">TITRE & ICÔNE</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewIconPickerOpen(!isNewIconPickerOpen)}
                  className="h-10 w-12 border-2 border-black bg-yellow-200 text-xl font-bold flex items-center justify-center hover:bg-yellow-300 cursor-pointer shadow-[2px_2px_0px_#000] shrink-0"
                  title="Choisir une icône"
                >
                  {newIcon}
                </button>
                <input
                  type="text"
                  required
                  placeholder="ex: Faire du sport, Prendre médicaments, Administratif..."
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (newIcon === "🎯") {
                      const detected = getEmojiForTitle(e.target.value);
                      if (detected !== "⚡") setNewIcon(detected);
                    }
                  }}
                  className="flex-1 bg-white border-2 border-black rounded-none p-2.5 font-bold focus:ring-0 focus:outline-none focus:bg-yellow-50/30 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-black uppercase tracking-wide text-gray-700">DESCRIPTION DÉTAILLÉE</label>
              <input
                type="text"
                placeholder="ex: Session ou rituel quotidien..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-white border-2 border-black rounded-none p-2.5 font-bold focus:ring-0 focus:outline-none focus:bg-yellow-50/30 text-xs"
              />
            </div>
          </div>

          {isNewIconPickerOpen && (
            <div className="my-2">
              <IconPicker
                inline={true}
                onSelect={(ic) => {
                  setNewIcon(ic);
                  setIsNewIconPickerOpen(false);
                }}
                onClose={() => setIsNewIconPickerOpen(false)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-gray-700">TYPE DE SUIVI</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full bg-white border-2 border-black rounded-none p-2 focus:outline-none text-xs font-black font-mono"
              >
                <option value="binary">Binaire (Oui / Non)</option>
                <option value="quantitative">Quantitative / Volume</option>
                <option value="chrono">Chrono (Minutes)</option>
                <option value="counter">Compteur</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-gray-700">CIBLE QUOTIDIENNE</label>
              <input
                type="number"
                min={1}
                value={newTarget}
                onChange={(e) => setNewTarget(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border-2 border-black rounded-none p-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-gray-700">UNITÉ (ex: fois, min)</label>
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="w-full bg-white border-2 border-black rounded-none p-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-gray-700">RÉCOMPENSE (coins)</label>
              <input
                type="number"
                min={1}
                value={newReward}
                onChange={(e) => setNewReward(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border-2 border-black rounded-none p-2 text-xs font-bold"
              />
            </div>
          </div>

          {/* SEUILS D'INACTIVITÉ CONFIGURABLES ET EVOLUTION DES COULEURS */}
          <div className="bg-amber-50/50 p-4 border-2 border-black rounded-none space-y-3">
            <span className="font-mono font-black text-[11px] uppercase tracking-wider text-amber-950 flex items-center gap-1">
              ⚙️ Seuils de progression d'inactivité (Évolution automatique des couleurs)
            </span>
            <p className="text-[10px] text-gray-700 italic">
              Personnalisez les paliers d'inactivité qui colorieront automatiquement le liseré de la carte et le badge d'inactivité (Vert, Jaune, Orange, Rouge, Violet foncé, puis Noir au-delà ; Gris par défaut si jamais complété).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-1">
                  🟢 Vert (&lt; j)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newGreenThreshold}
                  onChange={(e) => setNewGreenThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border-2 border-black p-2 font-bold font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-yellow-700 flex items-center gap-1">
                  🟡 Jaune (&lt; j)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newYellowThreshold}
                  onChange={(e) => setNewYellowThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border-2 border-black p-2 font-bold font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-orange-600 flex items-center gap-1">
                  🟠 Orange (&lt; j)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newOrangeThreshold}
                  onChange={(e) => setNewOrangeThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border-2 border-black p-2 font-bold font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-rose-600 flex items-center gap-1">
                  🔴 Rouge (&lt; j)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newRedThreshold}
                  onChange={(e) => setNewRedThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border-2 border-black p-2 font-bold font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-purple-700 flex items-center gap-1">
                  🟣 Violet (&lt; j)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newPurpleThreshold}
                  onChange={(e) => setNewPurpleThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border-2 border-black p-2 font-bold font-mono text-xs"
                />
              </div>
            </div>
            <div className="text-[9.5px] font-semibold text-slate-500 font-mono flex items-center gap-1 flex-wrap">
              <span>Aperçu de la frise :</span>
              <span className="bg-[#E6F9F7] text-[#2EC4B6] border border-black px-1.5 py-0.5">Fait depuis &lt; {newGreenThreshold}j (Vert)</span>
              <span>➡️</span>
              <span className="bg-[#FFFBF0] text-[#B7950B] border border-black px-1.5 py-0.5">&lt; {newYellowThreshold}j (Jaune)</span>
              <span>➡️</span>
              <span className="bg-[#FFF0E6] text-[#FF7F3F] border border-black px-1.5 py-0.5">&lt; {newOrangeThreshold}j (Orange)</span>
              <span>➡️</span>
              <span className="bg-[#FFE6EC] text-[#FF5E8E] border border-black px-1.5 py-0.5">&lt; {newRedThreshold}j (Rouge)</span>
              <span>➡️</span>
              <span className="bg-[#F3EAFE] text-[#5E17EB] border border-black px-1.5 py-0.5">&lt; {newPurpleThreshold}j (Violet)</span>
              <span>➡️</span>
              <span className="bg-black text-white px-1.5 py-0.5">Noir au-delà</span>
            </div>
          </div>

          <div className="text-right pt-3">
            <button
              type="submit"
              className="bg-[#24B27F] text-white hover:bg-[#1E9E6F] px-6 py-3 border-2 border-black shadow-[4px_4px_0px_#000000] font-black text-xs uppercase cursor-pointer transition-all active:translate-y-0.5 active:shadow-[1px_1px_0px_#000000]"
            >
              CRÉER L'HABITUDE MAINTENANT
            </button>
          </div>
        </form>
      )}

      {/* SECTION 1 : LES HABITUDES */}
      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <span>🌿</span> Vos Habitudes & Routines Actives
        </h2>

        {sortedHabits.length === 0 ? (
          <div className="bg-white border-3 border-black p-8 text-center text-gray-700 font-bold shadow-[4px_4px_0px_#000000] max-w-lg mx-auto">
            Aucune habitude active trouvée. Raccordez votre premier rituel !
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedHabits.map((h, idx) => {
              const hasChrono = h.type === "chrono";
              const isQuantitative = h.type === "quantitative" || h.type === "counter" || h.targetValue > 1;
              const isCounter = h.type === "quantitative" || h.type === "counter";
              
              const isStarred = !!(h as any).isStarred;
              const emojiMarker = h.icon || getEmojiForTitle(h.title);

              // Calcul inactivité
              const inactivity = getInactivityDays(h);
              const cardBorderClass = fetchCardBorderClass(h, "rose");
              const badgeClass = fetchBadgeClass(h, "rose");

              const totalSec = getElapsedSeconds(h, "habit");
              const liveCurrentValue = hasChrono
                ? h.currentValue + Math.floor(totalSec / 60)
                : h.currentValue;
              const isCompletedOnChrono = liveCurrentValue >= h.targetValue;
              const progressPercent = h.targetValue > 0 ? Math.min(100, Math.round((liveCurrentValue / h.targetValue) * 100)) : 0;
              const isTimerActive = !h.isPaused && h.lastResumeTime;

              return (
                <HabitCard
                  key={h.id}
                  h={h}
                  db={db}
                  todayStr={todayStr}
                  onNavigate={() => {}}
                  onToggleValue={toggleHabitComplete}
                  onAdjustValue={adjustHabitValue}
                  onStartChrono={(id) => handleStartUnifiedChrono(id, "habit")}
                  onStopChrono={(id) => handleStopUnifiedChrono(id, "habit")}
                  onToggleStar={(id) => toggleHabitPin(id)}
                  onToggleDayOf={toggleHabitDayOf}
                  onHistoryClick={(id) => selectItemForAction(id, "history")}
                  onEditClick={(id) => selectItemForAction(id, "edit")}
                  onDeleteClick={(id) => selectItemForAction(id, "delete")}
                  onDuplicate={onDuplicate}
                  onLogManualTime={handleLogHabitTime}
                  draggable
                  onDragStart={(e) => handleHabitDragStart(e, idx)}
                  onDragOver={handleHabitDragOver}
                  onDrop={(e) => handleHabitDrop(e, idx)}
                  onDragEnd={handleHabitDragEnd}
                >
                  <div className="hidden">
                  {/* Badge de négligence */}
                  {h.isNeglected && (
                    <span className="absolute -top-3.5 left-4 bg-red-600 text-white font-mono font-black text-[9px] px-2 py-0.5 rounded-none border-2 border-black flex items-center gap-1 z-10 animate-bounce shadow-[2px_2px_0px_#000000]">
                      <ShieldAlert size={10} /> HABITUDE NÉGLIGÉE
                    </span>
                  )}

                  {/* Ligne haute : titre, badges, pin de favoris */}
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Émoji icône */}
                        <span className="text-lg bg-orange-100 p-1 border border-black">{emojiMarker}</span>
                        
                        {/* Titre */}
                        <h3 className="font-black text-sm text-slate-900 leading-tight block truncate max-w-[130px]" title={h.title}>{h.title}</h3>
                        
                        {/* Badge de jours d'inactivité avec couleur personnalisée */}
                        <div className={`text-[10px] font-black px-1.5 py-0.5 border border-black shadow-[1.5px_1.5px_0px_#000000] font-mono ${badgeClass}`}>
                          {inactivity.value}
                        </div>
                      </div>

                      {/* Épingle */}
                      <button
                        onClick={(e) => toggleHabitPin(h.id, e)}
                        className={`p-1 transition-all cursor-pointer ${
                          isStarred ? "text-red-500 hover:scale-110" : "text-gray-300 hover:text-red-400"
                        }`}
                        title={isStarred ? "Désépingler de l'accueil" : "Épingler à l'accueil"}
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                        </svg>
                      </button>
                    </div>

                    {/* Description */}
                    {h.description && (
                      <p className="text-[11px] text-gray-650 mt-2 font-medium leading-tight line-clamp-2">
                        {h.description}
                      </p>
                    )}
                  </div>

                  {/* PROGRESSION COHÉRENTE ET CHRONOMETRE EN DIRECT */}
                  <div>
                    {h.targetValue > 1 && (
                      <div className="space-y-1 my-2">
                        <div className="flex justify-between items-center text-[10px] font-black font-mono">
                          <span className="truncate">
                            {hasChrono ? "⏰ " : "📊 "} 
                            {liveCurrentValue} / {h.targetValue} {hasChrono ? "min" : (h.unit || "fois")}
                          </span>
                          <span className="text-indigo-600 font-extrabold shrink-0">{progressPercent}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isQuantitative && (
                            <button
                              onClick={() => adjustHabitValue(h.id, -1)}
                              className="bg-white hover:bg-gray-100 border-2 border-black w-5 h-5 font-black flex items-center justify-center cursor-pointer text-xs shrink-0 font-mono"
                              title="Décrémenter"
                            >
                              -
                            </button>
                          )}
                          
                          <div className="flex-1 border-2 border-black h-3 bg-gray-100 rounded-none overflow-hidden relative shadow-[1px_1px_0px_#000000]">
                            <div 
                              className="bg-indigo-300 h-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>

                          {isQuantitative && (
                            <button
                              onClick={() => adjustHabitValue(h.id, 1)}
                              className="bg-white hover:bg-gray-100 border-2 border-black w-5 h-5 font-black flex items-center justify-center cursor-pointer text-xs shrink-0 font-mono"
                              title="Incrémenter"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {hasChrono && (
                      <div className="my-2 p-1.5 bg-yellow-50/50 border border-black flex items-center justify-between text-xs font-black font-mono">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className={isTimerActive ? "animate-spin text-red-500" : ""} />
                          <span className={isTimerActive ? "text-red-500 font-extrabold animate-pulse" : ""}>
                            {formatTimer(totalSec)}
                          </span>
                        </span>
                        <span className="text-gray-500 text-[10px]">Cible : {h.targetValue} min</span>
                      </div>
                    )}

                  </div>

                  {/* BOUTONS D'ACTIONS CLAIREMENT VISIBLES ET INTERACTIFS */}
                  <div className="bg-slate-50 border-2 border-black p-2 mt-2 rounded-none flex items-center justify-between gap-1.5 shadow-[2px_2px_0px_#000000]">
                    {/* 1. Bouton Play / Completion express */}
                    <button
                      onClick={() => {
                        if (hasChrono) {
                          if (isTimerActive) {
                            handleStopUnifiedChrono(h.id, "habit");
                          } else {
                            handleStartUnifiedChrono(h.id, "habit");
                          }
                        } else {
                          toggleHabitComplete(h.id);
                        }
                      }}
                      className={`px-2.5 py-1.5 text-[10px] font-black uppercase text-white flex items-center gap-1 border border-black transition-all cursor-pointer ${
                        hasChrono 
                          ? (isTimerActive ? "bg-amber-500 hover:bg-amber-600 animate-pulse" : "bg-indigo-600 hover:bg-indigo-700")
                          : (isCompletedOnChrono ? "bg-[#24B27F]" : "bg-emerald-500 hover:bg-emerald-600")
                      }`}
                      title="Activer ou compléter en direct"
                    >
                      {hasChrono ? (
                        isTimerActive ? <Pause size={10} /> : <Play size={10} />
                      ) : (
                        <Play size={10} />
                      )}
                      <span>{hasChrono ? (isTimerActive ? "STOP" : "Lancer") : "LANCER"}</span>
                    </button>

                    <div className="flex gap-1">
                      {/* Checkbox direct */}
                      <button
                        onClick={() => toggleHabitComplete(h.id)}
                        className={`w-7 h-7 border border-black flex items-center justify-center cursor-pointer transition-colors ${
                          isCompletedOnChrono ? "bg-[#24B27F] text-white" : "bg-white hover:bg-slate-100"
                        }`}
                        title="Marquer comme complété / non complété"
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>

                      {/* 2. Historique / Calendrier */}
                      <button
                        onClick={() => selectItemForAction(h.id, "history")}
                        className={`w-7 h-7 border border-black flex items-center justify-center cursor-pointer transition-colors ${
                          expandedId === h.id && activePanel === "history" ? "bg-yellow-300 text-black font-black" : "bg-white hover:bg-amber-50"
                        }`}
                        title="Afficher/Modifier Historique"
                      >
                        <CalendarIcon size={13} />
                      </button>

                      {/* 3. Modifier */}
                      <button
                        onClick={() => selectItemForAction(h.id, "edit")}
                        className={`w-7 h-7 border border-black flex items-center justify-center cursor-pointer transition-colors ${
                          expandedId === h.id && activePanel === "edit" ? "bg-sky-300 text-black font-black" : "bg-white hover:bg-blue-50"
                        }`}
                        title="Modifier l'Habitude"
                      >
                        <Pencil size={12} />
                      </button>

                      {/* 4. Supprimer */}
                      <button
                        onClick={() => selectItemForAction(h.id, "delete")}
                        className={`w-7 h-7 border border-black flex items-center justify-center cursor-pointer transition-colors ${
                          expandedId === h.id && activePanel === "delete" ? "bg-red-400 text-white font-black" : "bg-white hover:bg-red-50 text-red-600"
                        }`}
                        title="Retirer cette habitude"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Ligne basse : Streak et Budget */}
                  <div className="border-t-2 border-black pt-2 flex justify-between items-center text-[10px] font-black font-mono">
                    <span className="flex items-center gap-0.5 text-orange-600 bg-orange-100 px-1 border border-black shadow-[1px_1px_0px_#000000]">
                      <Flame size={10} /> {h.streak || 0} jours
                    </span>
                    <span className="text-emerald-700 bg-emerald-100 px-1 border border-black shadow-[1px_1px_0px_#000000]">
                      +{h.rewardValue} coins
                    </span>
                  </div>
                  </div>

                  {/* SOUS-PANNEAUX INTERACTIFS EXPANDS DANS LA CARTE */}
                  {expandedId === h.id && (
                    <div className="mt-4 pt-3 border-t-2 border-dashed border-black bg-[#FFFCF6] p-3 border-2 border-black shadow-[3px_3px_0px_#000000] z-20">
                      
                      {/* PANNEAU DE SUPPRESSION / ARCHIVAGE (GARANTIE ZÉRO POPUP) */}
                      {activePanel === "delete" && (
                        <div className="space-y-2 text-xs">
                          <p className="font-black text-slate-900 uppercase">Supprimer ou archiver ?</p>
                          <p className="font-bold text-slate-700">Voulez-vous archiver cette habitude dans l'onglet Archives ou la supprimer définitivement ?</p>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => archiveHabit(h.id)}
                              className="bg-sky-400 hover:bg-sky-500 text-black font-black px-3 py-1.5 border border-black cursor-pointer shadow-[2px_2px_0px_#000]"
                            >
                              Archiver
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteHabit(h.id)}
                              className="bg-red-600 hover:bg-red-700 text-white font-black px-3 py-1.5 border border-black cursor-pointer shadow-[2px_2px_0px_#000]"
                            >
                              Supprimer
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedId(null);
                                setActivePanel(null);
                              }}
                              className="bg-gray-200 hover:bg-gray-300 text-black font-bold px-3 py-1.5 border border-black cursor-pointer shadow-[2px_2px_0px_#000]"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PANNEAU DE CONFIGURATION / MODIFICATION */}
                      {activePanel === "edit" && (
                        <form onSubmit={(e) => handleSaveEdit(e, h.id)} className="space-y-3 text-xs">
                          <div className="flex justify-between items-center border-b border-black pb-1">
                            <span className="font-black uppercase text-slate-800">Modifier les réglages</span>
                            <button 
                              type="button" 
                              onClick={() => { setExpandedId(null); setActivePanel(null); }}
                              className="text-gray-500 hover:text-black font-bold"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block font-black uppercase text-[10px]">Titre & Icône</label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setIsEditIconPickerOpen(!isEditIconPickerOpen)}
                                className="h-8 w-10 border-2 border-black bg-yellow-200 text-lg flex items-center justify-center hover:bg-yellow-300 font-bold shadow-[2px_2px_0px_#000] cursor-pointer shrink-0"
                                title="Modifier l'icône"
                              >
                                {editIcon}
                              </button>
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="flex-1 bg-white border border-black p-1.5 font-bold text-xs"
                                required
                              />
                            </div>
                          </div>

                          {isEditIconPickerOpen && (
                            <div className="my-2">
                              <IconPicker
                                inline={true}
                                onSelect={(ic) => {
                                  setEditIcon(ic);
                                  setIsEditIconPickerOpen(false);
                                }}
                                onClose={() => setIsEditIconPickerOpen(false)}
                              />
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <label className="block font-black uppercase text-[10px]">Description</label>
                            <input
                              type="text"
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              className="w-full bg-white border border-black p-1.5 font-bold text-xs"
                            />
                          </div>

                          {/* Jours ciblés */}
                          <div className="space-y-1">
                            <label className="block font-black uppercase text-[10px] text-slate-800">
                              📅 Jours ciblés (Optionnel)
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
                                const isSel = editTargetDays.includes(d.id);
                                return (
                                  <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => {
                                      if (isSel) {
                                        setEditTargetDays(editTargetDays.filter((x) => x !== d.id));
                                      } else {
                                        setEditTargetDays([...editTargetDays, d.id].sort());
                                      }
                                    }}
                                    className={`px-2 py-0.5 border border-black text-[10px] font-mono font-black transition-all cursor-pointer ${
                                      isSel
                                        ? "bg-black text-white shadow-[1px_1px_0px_#000]"
                                        : "bg-white text-black hover:bg-slate-100"
                                    }`}
                                  >
                                    {d.label}
                                  </button>
                                );
                              })}
                              {editTargetDays.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setEditTargetDays([])}
                                  className="text-[9px] text-gray-500 hover:text-black hover:underline ml-1 cursor-pointer font-bold"
                                >
                                  Tous les jours
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block font-black uppercase text-[10px]">Valeur cible</label>
                              <input
                                type="number"
                                min={1}
                                value={editTarget}
                                onChange={(e) => setEditTarget(Number(e.target.value))}
                                className="w-full bg-white border border-black p-1.5 font-bold text-xs"
                              />
                            </div>
                            <div>
                              <label className="block font-black uppercase text-[10px]">Unité</label>
                              <input
                                type="text"
                                value={editUnit}
                                onChange={(e) => setEditUnit(e.target.value)}
                                className="w-full bg-white border border-black p-1.5 font-bold text-xs"
                              />
                            </div>
                          </div>

                          {/* Configuration de la récompense et des seuils */}
                          <div className="space-y-2 border-t border-dashed border-black pt-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="block font-black uppercase text-[10px] text-yellow-600">🏅 Complétion (COINS)</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editReward}
                                  onChange={(e) => setEditReward(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full bg-white border border-black p-1.5 font-bold text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block font-black uppercase text-[10px] text-indigo-600">⏱️ Par minute (COINS)</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={editChronoReward}
                                  onChange={(e) => setEditChronoReward(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-full bg-white border border-black p-1.5 font-bold text-xs"
                                />
                              </div>
                            </div>

                            <span className="block font-mono font-black text-[9px] uppercase text-gray-700 pt-1">
                              ⚙️ Seuils de progression d'inactivité
                            </span>
                            
                            <div className="grid grid-cols-5 gap-1">
                              <div>
                                <label className="block text-[8px] font-black uppercase text-emerald-700">🟢 Vert</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editGreenThreshold}
                                  onChange={(e) => setEditGreenThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full bg-white border border-black p-1 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black uppercase text-[#B7950B]">🟡 Jaune</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editYellowThreshold}
                                  onChange={(e) => setEditYellowThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full bg-white border border-black p-1 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black uppercase text-orange-600">🟠 Orange</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editOrangeThreshold}
                                  onChange={(e) => setEditOrangeThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full bg-white border border-black p-1 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black uppercase text-rose-600">🔴 Rouge</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editRedThreshold}
                                  onChange={(e) => setEditRedThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full bg-white border border-black p-1 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black uppercase text-[#5E17EB]">🟣 Violet</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editPurpleThreshold}
                                  onChange={(e) => setEditPurpleThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full bg-white border border-black p-1 font-bold text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="text-right pt-2">
                            <button
                              type="submit"
                              className="bg-black text-white hover:bg-gray-800 px-3 py-1.5 border border-black font-black uppercase text-[10px]"
                            >
                              ENREGISTRER
                            </button>
                          </div>
                        </form>
                      )}

                      {/* PANNEAU CALENDRIER D'HISTORIQUE & LOGS MANUELS (SYMETRIE CAPTURE) */}
                      {activePanel === "history" && (
                        <div className="space-y-4 text-xs font-sans">
                          {/* En-tête calendrier */}
                          <div className="flex justify-between items-center">
                            <span className="font-black text-[11px] uppercase tracking-wider text-indigo-700">Calendrier des complétions</span>
                            <div className="flex items-center gap-1 font-mono text-xs font-black">
                              <button 
                                type="button" 
                                onClick={() => changeMonth(-1)}
                                className="w-5 h-5 bg-white border border-black flex items-center justify-center hover:bg-slate-100"
                              >
                                <ChevronLeft size={12} />
                              </button>
                              <span className="px-1 bg-yellow-100 border border-black">
                                {new Date(calendarYear, calendarMonth).toLocaleString("fr-FR", { month: "long", year: "numeric" }).toUpperCase()}
                              </span>
                              <button 
                                type="button" 
                                onClick={() => changeMonth(1)}
                                className="w-5 h-5 bg-white border border-black flex items-center justify-center hover:bg-slate-100"
                              >
                                <ChevronRight size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Grille Jours */}
                          <div className="grid grid-cols-7 gap-1 text-center font-mono font-bold text-[10px] bg-white p-2 border border-black shadow-[1.5px_1.5px_0px_#000000]">
                            {["L", "M", "M", "J", "V", "S", "D"].map((n, i) => (
                              <div key={`${n}-${i}`} className="text-gray-500 font-extrabold">{n}</div>
                            ))}
                            
                            {/* Remplissage de padding */}
                            {Array.from({ length: getFirstDayOfMonth(calendarMonth, calendarYear) }).map((_, i) => (
                              <div key={`empty-${i}`} className="p-1 text-gray-200"></div>
                            ))}

                            {/* Les jours du mois */}
                            {Array.from({ length: getDaysInMonth(calendarMonth, calendarYear) }).map((_, i) => {
                              const dayNum = i + 1;
                              const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                              const isToday = dateStr === todayStr;
                              
                              const val = h.history[dateStr] || 0;
                              const done = val >= h.targetValue;
                              const workSecs = h.workHistory?.[dateStr] || (h.type === "chrono" ? val * 60 : 0);
                              const workMins = Math.round(workSecs / 60);

                              return (
                                <button
                                  key={`day-${dayNum}`}
                                  type="button"
                                  onClick={() => toggleCalendarDateStatus(h.id, dateStr)}
                                  className={`p-1 font-bold rounded-full relative flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/50 ${
                                    isToday ? "border border-blue-600 font-black" : ""
                                  } ${
                                    done ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-800 font-extrabold" : "text-slate-800"
                                  }`}
                                  title={`${dateStr} : ${val} validé ${workMins > 0 ? `(${workMins} min)` : ""}`}
                                >
                                  <span>{dayNum}</span>
                                  {workMins > 0 && (
                                    <span className="text-[7px] font-mono leading-none text-indigo-700 font-extrabold">
                                      {workMins >= 60 ? `${(workMins / 60).toFixed(1)}h` : `${workMins}m`}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Log manuel sous-jacent */}
                          <form onSubmit={(e) => handleAddManualLog(e, h.id)} className="bg-slate-100 p-2.5 border border-black space-y-2">
                            <p className="font-extrabold text-[10px] text-gray-700 uppercase">Enregistrer des complétions manuellement</p>
                            
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <label className="block text-gray-600 font-black uppercase text-[9px] mb-0.5">Date</label>
                                <input
                                  type="date"
                                  value={manualDate}
                                  onChange={(e) => setManualDate(e.target.value)}
                                  className="w-full bg-white border border-black p-1 text-xs"
                                />
                              </div>
                              {isCounter && (
                                <div>
                                  <label className="block text-gray-600 font-black uppercase text-[9px] mb-0.5">Valeur</label>
                                  <input
                                    type="number"
                                    value={manualValue}
                                    onChange={(e) => setManualValue(Number(e.target.value))}
                                    className="w-full bg-white border border-black p-1 text-xs"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[10px]">
                              <label className="flex items-center gap-1 cursor-pointer font-bold select-none text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={manualDone}
                                  onChange={(e) => setManualDone(e.target.checked)}
                                  className="border-black cursor-pointer"
                                />
                                Marquer comme accomplie
                              </label>

                              <button
                                type="submit"
                                className="bg-indigo-600 text-white font-black text-[10px] px-2.5 py-1 border border-black cursor-pointer inline-flex items-center gap-1 hover:bg-indigo-700"
                              >
                                <Plus size={10} /> ENREGISTRER
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </HabitCard>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2 : TÂCHES RÉCURRENTES */}
      <div className="border-t-4 border-black pt-6 space-y-4">
        <h2 className="text-xl font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <span>🔄</span> Tâches récurrentes
        </h2>

        {sortedRecurring.length === 0 ? (
          <div className="bg-white border-3 border-black p-8 text-center text-gray-700 font-bold shadow-[4px_4px_0px_#000000] max-w-lg mx-auto">
            Aucune tâche récurrente trouvée. Ajoutez-en via la boîte de création de Nouvel Élément globale !
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedRecurring.map((rt, idx) => {
              const isStarred = !!(rt as any).isStarred;
              const emojiMarker = rt.icon || getEmojiForTitle(rt.title);
              const cleanTitle = rt.title.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();
              
              const historyObj = (rt as any).history || {};
              const isCompletedToday = historyObj[todayStr] > 0;

              // Calcul inactivité
              const inactivity = getInactivityDays(rt);
              const cardBorderClass = fetchCardBorderClass(rt, "orange");
              const badgeClass = fetchBadgeClass(rt, "orange");

              const colorId = getDynamicColorId(rt);
              const foundC = BORDER_COLORS.find(b => b.id === colorId);
              const shadowColorHex = foundC ? foundC.bgHex : "#000000";

              const isUrssaf = cleanTitle.toLowerCase().includes("ursaff") || cleanTitle.toLowerCase().includes("urssaf");

              // Intervalle
              let freqLabel = "Tous les jours";
              if (rt.frequency === "weekly") freqLabel = "Tous les 7 jour(s)";
              if (rt.frequency === "monthly") freqLabel = "Tous les 1 mois";
              if (cleanTitle.toLowerCase().includes("cheveux") || cleanTitle.toLowerCase().includes("barbe") || cleanTitle.toLowerCase().includes("poubelle")) {
                freqLabel = "Tous les 2 semaine(s)";
              }
              if (cleanTitle.toLowerCase().includes("caf") || isUrssaf) {
                freqLabel = "Tous les 3 mois";
              }

              return (
                <RecurringCard
                  key={rt.id}
                  rt={rt}
                  todayStr={todayStr}
                  borderClr={cardBorderClass}
                  expandedCardIds={{ [rt.id]: expandedId === rt.id }}
                  setExpandedCardIds={(id, val) => {
                    if (val) {
                      setExpandedId(id);
                      setActivePanel(null);
                    } else {
                      setExpandedId(null);
                      setActivePanel(null);
                    }
                  }}
                  onComplete={toggleRecurringComplete}
                  onPin={(id) => toggleRecurringPin(id)}
                  onToggleDayOf={toggleRecurringDayOf}
                  onSelectAction={selectItemForAction}
                  onDuplicate={onDuplicate}
                  onLogManualTime={handleLogRecurringTaskTime}
                  expandedId={expandedId}
                  activePanel={activePanel}
                  draggable
                  onDragStart={(e) => handleRecurringDragStart(e, idx)}
                  onDragOver={handleRecurringDragOver}
                  onDrop={(e) => handleRecurringDrop(e, idx)}
                  onDragEnd={handleRecurringDragEnd}
                >
                  {/* DETAILS EXPANDÉS DANS LA COMPOSANTE DE RÉCURRENCE */}
                  {expandedId === rt.id && (
                    <div className="mt-4 pt-3 border-t-2 border-dashed border-black bg-[#FFFCF6] p-3 border-2 border-black shadow-[3px_3px_0px_#000000] z-20">
                      
                      {/* SUPPRESSION DE TACHE RÉCURRENTES (ZERO POPUP) */}
                      {activePanel === "delete" && (
                        <div className="space-y-2 text-xs">
                          <p className="font-black text-slate-900 uppercase">Supprimer ou archiver ?</p>
                          <p className="font-bold text-slate-700">Voulez-vous archiver cette tâche récurrente dans l'onglet Archives ou la supprimer définitivement ?</p>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => archiveRecurring(rt.id)}
                              className="bg-sky-400 hover:bg-sky-500 text-black font-black px-3 py-1.5 border border-black cursor-pointer shadow-[2px_2px_0px_#000]"
                            >
                              Archiver
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteRecurring(rt.id)}
                              className="bg-red-600 hover:bg-red-700 text-white font-black px-3 py-1.5 border border-black cursor-pointer shadow-[2px_2px_0px_#000]"
                            >
                              Supprimer
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedId(null);
                                setActivePanel(null);
                              }}
                              className="bg-gray-200 hover:bg-gray-300 text-black font-bold px-3 py-1.5 border border-black cursor-pointer shadow-[2px_2px_0px_#000]"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}

                      {/* MODIFICATION DE TACHE RECURRENTE */}
                      {activePanel === "edit" && (
                        <form onSubmit={(e) => handleSaveEdit(e, rt.id)} className="space-y-3 text-xs">
                          <div className="flex justify-between items-center border-b border-black pb-1">
                            <span className="font-black uppercase text-slate-800">Paramétrer la tâche</span>
                            <button 
                              type="button" 
                              onClick={() => { setExpandedId(null); setActivePanel(null); }}
                              className="text-gray-500 hover:text-black font-bold"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block font-black uppercase text-[10px]">Nom de la tâche & Icône</label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setIsEditIconPickerOpen(!isEditIconPickerOpen)}
                                className="h-8 w-10 border-2 border-black bg-yellow-200 text-lg flex items-center justify-center hover:bg-yellow-300 font-bold shadow-[2px_2px_0px_#000] cursor-pointer shrink-0"
                                title="Modifier l'icône"
                              >
                                {editIcon}
                              </button>
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="flex-1 bg-white border border-black p-1.5 font-bold"
                                required
                              />
                            </div>
                          </div>

                          {isEditIconPickerOpen && (
                            <div className="my-2">
                              <IconPicker
                                inline={true}
                                onSelect={(ic) => {
                                  setEditIcon(ic);
                                  setIsEditIconPickerOpen(false);
                                }}
                                onClose={() => setIsEditIconPickerOpen(false)}
                              />
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <label className="block font-black uppercase text-[10px]">Description ou URL</label>
                            <input
                              type="text"
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              className="w-full bg-white border border-black p-1.5 font-bold"
                            />
                          </div>

                          {/* Jours ciblés pour récurrence */}
                          <div className="space-y-1">
                            <label className="block font-black uppercase text-[10px] text-slate-800">
                              📅 Jours ciblés (Optionnel)
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
                                const isSel = editTargetDays.includes(d.id);
                                return (
                                  <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => {
                                      if (isSel) {
                                        setEditTargetDays(editTargetDays.filter((x) => x !== d.id));
                                      } else {
                                        setEditTargetDays([...editTargetDays, d.id].sort());
                                      }
                                    }}
                                    className={`px-2 py-0.5 border border-black text-[10px] font-mono font-black transition-all cursor-pointer ${
                                      isSel
                                        ? "bg-black text-white shadow-[1px_1px_0px_#000]"
                                        : "bg-white text-black hover:bg-slate-100"
                                    }`}
                                  >
                                    {d.label}
                                  </button>
                                );
                              })}
                              {editTargetDays.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setEditTargetDays([])}
                                  className="text-[9px] text-gray-500 hover:text-black hover:underline ml-1 cursor-pointer font-bold"
                                >
                                  Tous les jours
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Configuration de la récompense et des seuils */}
                          <div className="space-y-2 border-t border-dashed border-black pt-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="block font-black uppercase text-[10px] text-yellow-600">🏅 Complétion (COINS)</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editReward}
                                  onChange={(e) => setEditReward(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full bg-white border border-black p-1.5 font-bold text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block font-black uppercase text-[10px] text-indigo-600">⏱️ Par minute (COINS)</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={editChronoReward}
                                  onChange={(e) => setEditChronoReward(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-full bg-white border border-black p-1.5 font-bold text-xs"
                                />
                              </div>
                            </div>

                            <span className="block font-mono font-black text-[9px] uppercase text-gray-700 pt-1">
                              ⚙️ Seuils de progression d'inactivité
                            </span>
                            
                            <div className="grid grid-cols-5 gap-1">
                              <div>
                                <label className="block text-[8px] font-black uppercase text-emerald-700">🟢 Vert</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editGreenThreshold}
                                  onChange={(e) => setEditGreenThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full bg-white border border-black p-1 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black uppercase text-[#B7950B]">🟡 Jaune</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editYellowThreshold}
                                  onChange={(e) => setEditYellowThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full bg-white border border-black p-1 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black uppercase text-orange-600">🟠 Orange</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editOrangeThreshold}
                                  onChange={(e) => setEditOrangeThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full bg-white border border-black p-1 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black uppercase text-rose-600">🔴 Rouge</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editRedThreshold}
                                  onChange={(e) => setEditRedThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full bg-white border border-black p-1 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black uppercase text-[#5E17EB]">🟣 Violet</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editPurpleThreshold}
                                  onChange={(e) => setEditPurpleThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full bg-white border border-black p-1 font-bold text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="text-right pt-2">
                            <button
                              type="submit"
                              className="bg-black text-white hover:bg-gray-800 px-3 py-1.5 border border-black font-black uppercase text-[10px]"
                            >
                              ENREGISTRER
                            </button>
                          </div>
                        </form>
                      )}

                      {/* CALENDRIER D'HISTORIQUE DES VALIDATIONS */}
                      {activePanel === "history" && (
                        <div className="space-y-4 text-xs font-sans">
                          <div className="flex justify-between items-center">
                            <span className="font-black text-[11px] uppercase tracking-wider text-indigo-700">Historique des complétions</span>
                            <div className="flex items-center gap-1 font-mono text-xs font-black">
                              <button 
                                type="button" 
                                onClick={() => changeMonth(-1)}
                                className="w-5 h-5 bg-white border border-black flex items-center justify-center hover:bg-slate-100"
                              >
                                <ChevronLeft size={12} />
                              </button>
                              <span className="px-1 bg-yellow-105 border border-black">
                                {new Date(calendarYear, calendarMonth).toLocaleString("fr-FR", { month: "long", year: "numeric" }).toUpperCase()}
                              </span>
                              <button 
                                type="button" 
                                onClick={() => changeMonth(1)}
                                className="w-5 h-5 bg-white border border-black flex items-center justify-center hover:bg-slate-100"
                              >
                                <ChevronRight size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Grille */}
                          <div className="grid grid-cols-7 gap-1 text-center font-mono font-bold text-[10px] bg-white p-2 border border-black">
                            {["L", "M", "M", "J", "V", "S", "D"].map((n, i) => (
                              <div key={`${n}-${i}`} className="text-gray-500 font-extrabold">{n}</div>
                            ))}
                            
                            {Array.from({ length: getFirstDayOfMonth(calendarMonth, calendarYear) }).map((_, i) => (
                              <div key={`empty-${i}`} className="p-1 text-gray-200"></div>
                            ))}

                            {Array.from({ length: getDaysInMonth(calendarMonth, calendarYear) }).map((_, i) => {
                              const dayNum = i + 1;
                              const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                              const isToday = dateStr === todayStr;
                              
                              const val = historyObj[dateStr] || 0;
                              const done = val > 0;
                              const workSecs = rt.workHistory?.[dateStr] || 0;
                              const workMins = Math.round(workSecs / 60);

                              return (
                                <button
                                  key={`day-${dayNum}`}
                                  type="button"
                                  onClick={() => toggleCalendarDateStatus(rt.id, dateStr)}
                                  className={`p-1 font-bold rounded-full relative flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/50 ${
                                    isToday ? "border border-blue-600 font-black" : ""
                                  } ${
                                    done ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-800 font-extrabold" : "text-slate-800"
                                  }`}
                                  title={`${dateStr} : ${done ? "Validé" : "Non validé"} ${workMins > 0 ? `(${workMins} min)` : ""}`}
                                >
                                  <span>{dayNum}</span>
                                  {workMins > 0 && (
                                    <span className="text-[7px] font-mono leading-none text-indigo-700 font-extrabold">
                                      {workMins >= 60 ? `${(workMins / 60).toFixed(1)}h` : `${workMins}m`}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Consigner manuellement */}
                          <form onSubmit={(e) => handleAddManualLog(e, rt.id)} className="bg-slate-100 p-2.5 border border-black space-y-2">
                            <p className="font-extrabold text-[10px] text-gray-700 uppercase">Complétion de la tâche par date</p>
                            
                            <div className="grid grid-cols-1 gap-2 text-[10px]">
                              <div>
                                <label className="block text-gray-600 font-black uppercase text-[9px] mb-0.5">Date</label>
                                <input
                                  type="date"
                                  value={manualDate}
                                  onChange={(e) => setManualDate(e.target.value)}
                                  className="w-full bg-white border border-black p-1 text-xs"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] pt-1">
                              <label className="flex items-center gap-1 cursor-pointer font-bold select-none text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={manualDone}
                                  onChange={(e) => setManualDone(e.target.checked)}
                                  className="border-black cursor-pointer"
                                />
                                Consigner comme effectuée
                              </label>

                              <button
                                type="submit"
                                className="bg-indigo-600 text-white font-black text-[10px] px-2.5 py-1 border border-black cursor-pointer inline-flex items-center gap-1 hover:bg-indigo-700"
                              >
                                <Plus size={10} /> CONSIGNER
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </RecurringCard>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3 : LEVER MATINAL */}
      <div className="bg-white border-3 border-black p-6 rounded-none shadow-[5px_5px_0px_#000000] space-y-4">
        <div className="flex justify-between items-center border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌅</span>
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
              Récompense de Lever Matinal
            </h2>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 border border-black inline-flex items-center gap-1 font-bold cursor-pointer transition-colors"
          >
            <TrendingUp size={12} />
            {showHistory ? "MASQUER LE SUIVI" : "GRAPHIQUE & HISTORIQUE"}
          </button>
        </div>

        <p className="text-xs text-gray-700 font-bold leading-relaxed">
          Réglez votre heure cible de réveil. Chaque minute d'avance vous fait gagner +1 CS. Chaque minute de retard vous fait perdre -1 CS.
        </p>

        {/* HISTORIQUE FLUIDE & GESTION CRUD DES RÉVEILS */}
        {showHistory && (
          <div className="bg-[#FFFDF6] p-4 rounded-none border-2 border-black text-xs space-y-2 shadow-[2px_2px_0px_#000000]">
            <WakeUpHistoryManager db={db} updateDb={updateDb} />
          </div>
        )}

        {/* RÉGLAGE DE L'HEURE CIBLE */}
        <div className="bg-[#FFFDF9] p-4 rounded-none border-2 border-black space-y-2 shadow-[3px_3px_0px_#000000]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wide">
                ⏰ Heure de réveil cible
              </label>
              <p className="text-[11px] text-gray-600 font-bold">
                Référence pour le calcul des gains (+1 CS/min) ou déductions (-1 CS/min).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="time"
                value={db.userProfile?.targetWakeTime || "07:00"}
                onChange={(e) => {
                  const val = e.target.value;
                  updateDb({
                    ...db,
                    userProfile: {
                      ...db.userProfile,
                      targetWakeTime: val
                    }
                  });
                }}
                className="bg-white border-2 border-black p-2 font-mono text-sm font-black text-slate-900 focus:outline-none w-32 text-center shadow-[2px_2px_0px_#000000]"
              />
            </div>
          </div>
        </div>

        {/* VALIDATION DE LEVER DU JOUR */}
        <div className="bg-[#FFFDF9] p-4 rounded-none border-2 border-black space-y-3 shadow-[3px_3px_0px_#000000]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800 uppercase tracking-wider">
              <Info size={14} className="text-teal-600" />
              <span>Enregistrer / Valider mon lever du jour</span>
            </div>
            {(() => {
              const todayLog = (db.sleepWakeLogs || []).find((l) => l.date === todayStr);
              if (!todayLog) {
                return (
                  <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 border border-amber-400">
                    ⏳ Non validé aujourd'hui
                  </span>
                );
              }
              const isPositive = (todayLog.coinsRewarded || 0) >= 0;
              return (
                <span className={`text-[10px] font-black px-2 py-0.5 border ${isPositive ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : 'bg-rose-100 text-rose-800 border-rose-400'}`}>
                  ✅ Validé aujourd'hui : {todayLog.wakeUpTime} ({isPositive ? `+${todayLog.coinsRewarded}` : todayLog.coinsRewarded} CS)
                </span>
              );
            })()}
          </div>

          {/* Estimation en temps réel */}
          {(() => {
            const targetTime = db.userProfile?.targetWakeTime || "07:00";
            const delta = calculateWakeDelta(formatTime(simulatedTime), targetTime);
            return (
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-gray-700 font-bold">Écart estimé :</span>
                {delta > 0 ? (
                  <span className="font-black bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5">
                    +{delta} min d'avance → +{delta} CS
                  </span>
                ) : delta < 0 ? (
                  <span className="font-black bg-rose-100 text-rose-900 border border-rose-400 px-2 py-0.5">
                    {Math.abs(delta)} min de retard → {delta} CS
                  </span>
                ) : (
                  <span className="font-black bg-gray-100 text-slate-900 border border-black px-2 py-0.5">
                    0 min d'écart → 0 CS
                  </span>
                )}
              </div>
            );
          })()}

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-2 flex-1 w-full">
              <input
                type="time"
                value={simulatedTime}
                onChange={(e) => setSimulatedTime(e.target.value)}
                className="flex-1 bg-white border-2 border-black p-2 font-mono text-xs font-bold focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSimulatedTime(getCurrentTime())}
                className="bg-gray-100 hover:bg-gray-200 text-black font-bold px-2.5 py-2 text-[10px] uppercase border-2 border-black cursor-pointer whitespace-nowrap"
                title="Utiliser l'heure actuelle"
              >
                🕒 Maintenant
              </button>
            </div>

            <button
              type="button"
              onClick={handleValidateWakeUp}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-4 py-2.5 text-xs uppercase border-2 border-black cursor-pointer transition-all shadow-[2px_2px_0px_#000000] w-full sm:w-auto whitespace-nowrap"
            >
              Valider mon Réveil
            </button>
          </div>

          {simulationResult && (
            <div className="bg-[#EFFFFA] text-emerald-900 border-2 border-emerald-500 p-3 text-xs leading-relaxed font-bold mt-2 shadow-[2px_2px_0px_#000000]">
              {simulationResult}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4 : COUCHER DU SOIR */}
      <div className="bg-white border-3 border-black p-6 rounded-none shadow-[5px_5px_0px_#000000] space-y-4">
        <div className="flex justify-between items-center border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌙</span>
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
              Récompense de Coucher du Soir
            </h2>
          </div>
          <button
            onClick={() => setShowBedHistory(!showBedHistory)}
            className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 border border-black inline-flex items-center gap-1 font-bold cursor-pointer transition-colors"
          >
            <TrendingUp size={12} />
            {showBedHistory ? "MASQUER LE SUIVI" : "GRAPHIQUE & HISTORIQUE"}
          </button>
        </div>

        <p className="text-xs text-gray-700 font-bold leading-relaxed">
          Réglez votre heure cible de coucher. Chaque minute d'avance vous fait gagner +1 CS. Chaque minute de retard vous fait perdre -1 CS.
        </p>

        {/* HISTORIQUE FLUIDE & GESTION CRUD DES COUCHERS */}
        {showBedHistory && (
          <div className="bg-[#FFFDF6] p-4 rounded-none border-2 border-black text-xs space-y-2 shadow-[2px_2px_0px_#000000]">
            <BedTimeHistoryManager db={db} updateDb={updateDb} />
          </div>
        )}

        {/* RÉGLAGE DE L'HEURE CIBLE */}
        <div className="bg-[#FFFDF9] p-4 rounded-none border-2 border-black space-y-2 shadow-[3px_3px_0px_#000000]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wide">
                ⏰ Heure de coucher cible
              </label>
              <p className="text-[11px] text-gray-600 font-bold">
                Référence pour le calcul des gains (+1 CS/min) ou déductions (-1 CS/min).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="time"
                value={db.userProfile?.targetSleepTime || "23:00"}
                onChange={(e) => {
                  const val = e.target.value;
                  updateDb({
                    ...db,
                    userProfile: {
                      ...db.userProfile,
                      targetSleepTime: val
                    }
                  });
                }}
                className="bg-white border-2 border-black p-2 font-mono text-sm font-black text-slate-900 focus:outline-none w-32 text-center shadow-[2px_2px_0px_#000000]"
              />
            </div>
          </div>
        </div>

        {/* VALIDATION DE COUCHER DU JOUR */}
        <div className="bg-[#FFFDF9] p-4 rounded-none border-2 border-black space-y-3 shadow-[3px_3px_0px_#000000]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800 uppercase tracking-wider">
              <Info size={14} className="text-indigo-600" />
              <span>Enregistrer / Valider mon coucher du jour</span>
            </div>
            {(() => {
              const todayLog = (db.sleepWakeLogs || []).find((l) => l.date === todayStr && l.bedTime);
              if (!todayLog) {
                return (
                  <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 border border-indigo-400">
                    ⏳ Non validé ce soir
                  </span>
                );
              }
              const rewarded = todayLog.bedTimeCoinsRewarded ?? 0;
              const isPositive = rewarded >= 0;
              return (
                <span className={`text-[10px] font-black px-2 py-0.5 border ${isPositive ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : 'bg-rose-100 text-rose-800 border-rose-400'}`}>
                  ✅ Validé ce soir : {todayLog.bedTime} ({isPositive ? `+${rewarded}` : rewarded} CS)
                </span>
              );
            })()}
          </div>

          {/* Estimation en temps réel */}
          {(() => {
            const targetTime = db.userProfile?.targetSleepTime || "23:00";
            const delta = calculateBedDelta(formatTime(simulatedBedTime), targetTime);
            return (
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-gray-700 font-bold">Écart estimé :</span>
                {delta > 0 ? (
                  <span className="font-black bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5">
                    +{delta} min d'avance → +{delta} CS
                  </span>
                ) : delta < 0 ? (
                  <span className="font-black bg-rose-100 text-rose-900 border border-rose-400 px-2 py-0.5">
                    {Math.abs(delta)} min de retard → {delta} CS
                  </span>
                ) : (
                  <span className="font-black bg-gray-100 text-slate-900 border border-black px-2 py-0.5">
                    0 min d'écart → 0 CS
                  </span>
                )}
              </div>
            );
          })()}

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-2 flex-1 w-full">
              <input
                type="time"
                value={simulatedBedTime}
                onChange={(e) => setSimulatedBedTime(e.target.value)}
                className="flex-1 bg-white border-2 border-black p-2 font-mono text-xs font-bold focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSimulatedBedTime(getCurrentTime())}
                className="bg-gray-100 hover:bg-gray-200 text-black font-bold px-2.5 py-2 text-[10px] uppercase border-2 border-black cursor-pointer whitespace-nowrap"
                title="Utiliser l'heure actuelle"
              >
                🕒 Maintenant
              </button>
            </div>

            <button
              type="button"
              onClick={handleValidateBedTime}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2.5 text-xs uppercase border-2 border-black cursor-pointer transition-all shadow-[2px_2px_0px_#000000] w-full sm:w-auto whitespace-nowrap"
            >
              Valider mon Coucher
            </button>
          </div>

          {bedSimulationResult && (
            <div className="bg-[#EEF2FF] text-indigo-900 border-2 border-indigo-500 p-3 text-xs leading-relaxed font-bold mt-2 shadow-[2px_2px_0px_#000000]">
              {bedSimulationResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
