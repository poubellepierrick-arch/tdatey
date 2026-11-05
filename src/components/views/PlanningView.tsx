/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { AppDatabase, Task, Preparation } from "../../types";
import { GOOGLE_COLORS } from "../../lib/googleCalendar";
import { useIcons } from "../../lib/IconContext";
import {
  Clock,
  Plus,
  Play,
  Trash2,
  CalendarDays,
  TrendingUp,
  Award,
  Calendar,
  Layers,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  SlidersHorizontal
} from "lucide-react";

interface PlanningViewProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase, localOnly?: boolean) => void;
  sharedEvents?: Task[];
}

const TIMELINE_PALETTE = [
  { name: "Par défaut", value: "" },
  { name: "Émeraude", value: "#d1fae5" }, 
  { name: "Menthe", value: "#e8f5e9" }, 
  { name: "Ambre", value: "#fef3c7" }, 
  { name: "Orange", value: "#ffedd5" }, 
  { name: "Rose", value: "#fce7f3" }, 
  { name: "Ciel", value: "#e0f2fe" }, 
  { name: "Indigo", value: "#e0e7ff" }, 
  { name: "Violet", value: "#f3e8ff" }, 
  { name: "Rouge", value: "#fee2e2" }, 
];

export default function PlanningView({ db, updateDb, sharedEvents = [] }: PlanningViewProps) {
  const [isMorningExpanded, setIsMorningExpanded] = useState<boolean>(false);
  const [isEveningExpanded, setIsEveningExpanded] = useState<boolean>(false);

  const startHour = isMorningExpanded ? 4 : 11;
  const endHour = isEveningExpanded ? 28 : 19;

  // Référence synchronisée en temps réel pour éviter les fermetures lexicales dépassées
  const dbRef = useRef(db);
  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  // Choisir une couleur pour la timeline
  const [colorPickerTaskId, setColorPickerTaskId] = useState<string | null>(null);

  // Sous-onglets actifs pour classifier le Backlog (colonne gauche/stock)
  const [subBacklogTab, setSubBacklogTab] = useState<"tasks" | "recurring" | "habits" | "preparations">("tasks");

  const { getIcon } = useIcons();

  // État d'expansion (accordéon) pour les mini-cartes du Backlog de planification
  const [expandedBacklogItemId, setExpandedBacklogItemId] = useState<string | null>(null);

  // États pour les différents types de tris du Backlog
  const [taskSort, setTaskSort] = useState<"score" | "urgency" | "importance" | "easiness" | "mentalLoad" | "alphabetical" | "createdAt">("score");
  const [habitSort, setHabitSort] = useState<"inactivity" | "streak" | "alphabetical" | "reward">("inactivity");
  const [recurringSort, setRecurringSort] = useState<"score" | "alphabetical" | "reward">("score");
  const [prepSort, setPrepSort] = useState<"duration" | "alphabetical">("duration");

  // Fonction utilitaire pour calculer le niveau d'inactivité (jours écoulés d'une habitude / tâche récurrente)
  const calculateInactivity = (item: any) => {
    if (!item.history || Object.keys(item.history).length === 0) {
      return { value: "Jamais", days: 9999, colorId: "grey" };
    }
    
    // Filtrer les valeurs positives ou exactes du dictionnaire d'historique
    const activeDates = Object.entries(item.history)
      .filter(([_, val]) => val === true || (typeof val === "number" && val > 0) || (typeof val === "string" && val !== "todo"))
      .map(([dateStr]) => new Date(dateStr));

    if (activeDates.length === 0) {
      return { value: "Jamais", days: 9999, colorId: "grey" };
    }

    const datesMs = activeDates.map(d => d.getTime());
    const maxMs = Math.max(...datesMs);
    const lastDate = new Date(maxMs);
    lastDate.setHours(0,0,0,0);

    const today = new Date();
    today.setHours(0,0,0,0);

    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { value: "Auj.", days: 0, colorId: "emerald" };
    }

    let colorId = "emerald";
    if (diffDays >= 10) colorId = "black";
    else if (diffDays >= 7) colorId = "purple";
    else if (diffDays >= 5) colorId = "rose";
    else if (diffDays >= 3) colorId = "orange";
    else if (diffDays >= 2) colorId = "yellow";

    return { value: `${diffDays} j.`, days: diffDays, colorId };
  };

  // Confirmation en ligne du vidage de l'agenda (sans window.confirm / popup)
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Statut de feedback en ligne pour l'enregistrement/chargement de la journée type
  const [templateStatus, setTemplateStatus] = useState<string | null>(null);

  // Consentement et activation des rappels
  const [isRappelsEnabled, setIsRappelsEnabled] = useState(true);

  // Confirmation de suppression en ligne (sans aucun window.confirm ou alert)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // États pour la création de routines
  const [showAddPrepForm, setShowAddPrepForm] = useState(false);
  const [newPrepTitle, setNewPrepTitle] = useState("");
  const [newPrepDesc, setNewPrepDesc] = useState("");
  const [newPrepDuration, setNewPrepDuration] = useState<number>(15);
  const [newPrepColor, setNewPrepColor] = useState<string>("");
  const [newPrepIcon, setNewPrepIcon] = useState("🧘");
  const [deletePrepConfirmId, setDeletePrepConfirmId] = useState<string | null>(null);

  // États d'édition en ligne pour tâches et routines
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDuration, setEditDuration] = useState<number>(15);
  const [editIcon, setEditIcon] = useState("");
  const [editColor, setEditColor] = useState("");

  const saveEditingItem = (isPrep: boolean) => {
    if (!editTitle.trim()) return;
    if (isPrep) {
      const updatedPreps = (db.preparations || []).map(p => {
        if (p.id === editingItemId) {
          return {
            ...p,
            title: editTitle.trim(),
            description: editDesc.trim(),
            durationMinutes: Number(editDuration) || 15,
            icon: editIcon.trim(),
            color: editColor
          };
        }
        return p;
      });
      updateDb({ ...db, preparations: updatedPreps });
    } else {
      const updatedTasks = db.tasks.map(t => {
        if (t.id === editingItemId) {
          return {
            ...t,
            title: editTitle.trim(),
            description: editDesc.trim(),
            durationMinutes: Number(editDuration) || 15,
            icon: editIcon.trim(),
            color: editColor
          };
        }
        return t;
      });
      updateDb({ ...db, tasks: updatedTasks });
    }
    setEditingItemId(null);
    setTemplateStatus("Enregistré ✓");
    setTimeout(() => setTemplateStatus(null), 3000);
  };

  const handleAddPreparation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrepTitle.trim()) return;

    const newPrep: Preparation = {
      id: `prep-${Date.now()}`,
      title: newPrepTitle.trim(),
      description: newPrepDesc.trim(),
      type: "pre",
      durationMinutes: Number(newPrepDuration) || 15,
      color: newPrepColor,
      icon: newPrepIcon
    };

    updateDb({
      ...db,
      preparations: [newPrep, ...(db.preparations || [])]
    });

    setNewPrepTitle("");
    setNewPrepDesc("");
    setNewPrepDuration(15);
    setNewPrepColor("");
    setNewPrepIcon("🧘");
    setShowAddPrepForm(false);
    setTemplateStatus("Routine créée ! ✓");
    setTimeout(() => setTemplateStatus(null), 3000);
  };

  // Heure courante réactualisée chaque minute pour la barre néoréaliste
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Référence du conteneur vertical
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Zoom sur la timeline réactif à la molette sur l'axe des ordonnées (heures)
  const [hourHeight, setHourHeight] = useState<number>(85);
  const zoomZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = zoomZoneRef.current;
    if (!el) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? -1 : 1;

      const container = timelineContainerRef.current;
      if (!container) {
        setHourHeight((prev) => Math.max(45, Math.min(250, prev + direction * 5)));
        return;
      }

      const rect = container.getBoundingClientRect();
      const mouseYVisible = e.clientY - rect.top;
      const mouseAbsoluteY = mouseYVisible + container.scrollTop;

      setHourHeight((prev) => {
        const next = Math.max(45, Math.min(250, prev + direction * 5));
        if (next === prev) return prev;

        const ratio = next / prev;
        const newAbsoluteY = mouseAbsoluteY * ratio;
        const newScrollTop = newAbsoluteY - mouseYVisible;

        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = newScrollTop;
          }
        });

        return next;
      });
    };

    el.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheelNative);
    };
  }, [startHour]);

  // Chargement et persistance des réglages de zoom et plages horaires
  const [loadedSettings, setLoadedSettings] = useState<boolean>(false);

  const persistTimelineSettings = (height: number, morning: boolean, evening: boolean) => {
    const currentDb = dbRef.current;
    const rawMemories = currentDb.aiMemories || [];
    const filtered = rawMemories.filter(m => 
      m.key !== "timeline_zoom_level" && 
      m.key !== "timeline_morning_expanded" && 
      m.key !== "timeline_evening_expanded"
    );

    const updated = [
      ...filtered,
      {
        id: `mem-zoom-${Date.now()}`,
        key: "timeline_zoom_level",
        value: height.toString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `mem-morning-${Date.now() + 1}`,
        key: "timeline_morning_expanded",
        value: morning ? "true" : "false",
        updatedAt: new Date().toISOString()
      },
      {
        id: `mem-evening-${Date.now() + 2}`,
        key: "timeline_evening_expanded",
        value: evening ? "true" : "false",
        updatedAt: new Date().toISOString()
      }
    ];

    updateDb({
      ...currentDb,
      aiMemories: updated
    });
  };

  useEffect(() => {
    if (loadedSettings) return;
    if (db.aiMemories && db.aiMemories.length > 0) {
      const memZoom = db.aiMemories.find(m => m.key === "timeline_zoom_level")?.value;
      const memMorning = db.aiMemories.find(m => m.key === "timeline_morning_expanded")?.value;
      const memEvening = db.aiMemories.find(m => m.key === "timeline_evening_expanded")?.value;

      if (memZoom) {
        const h = parseInt(memZoom, 10);
        if (!isNaN(h) && h >= 45 && h <= 250) {
          setHourHeight(h);
        }
      }
      if (memMorning === "true") {
        setIsMorningExpanded(true);
      }
      if (memEvening === "true") {
        setIsEveningExpanded(true);
      }
      setLoadedSettings(true);
    } else if (db.aiMemories) {
      setLoadedSettings(true);
    }
  }, [db.aiMemories, loadedSettings]);

  useEffect(() => {
    if (!loadedSettings) return;
    const timer = setTimeout(() => {
      const memZoom = db.aiMemories?.find(m => m.key === "timeline_zoom_level")?.value;
      const memMorning = db.aiMemories?.find(m => m.key === "timeline_morning_expanded")?.value;
      const memEvening = db.aiMemories?.find(m => m.key === "timeline_evening_expanded")?.value;

      const needsUpdate = memZoom !== hourHeight.toString() ||
                          memMorning !== (isMorningExpanded ? "true" : "false") ||
                          memEvening !== (isEveningExpanded ? "true" : "false");

      if (needsUpdate) {
        persistTimelineSettings(hourHeight, isMorningExpanded, isEveningExpanded);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [hourHeight, isMorningExpanded, isEveningExpanded, loadedSettings]);

  // Gérer l'état local du glisser-déposer visuel : coordonnées de la ligne de preview temporaire
  const [dragOverTop, setDragOverTop] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<{
    id: string;
    title: string;
    durationMinutes: number;
    color?: string;
    type?: "routine" | "ponctuelle" | "event";
  } | null>(null);

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverTop(null);
  };

  // Redimensionnement à la volée des tâches par le haut ou le bas (Extensibilité par glisser)
  const [hoveredHandle, setHoveredHandle] = useState<boolean>(false);
  const [resizeState, setResizeState] = useState<{
    taskId: string;
    direction: "top" | "bottom";
    startY: number;
    originalScheduledTime: string;
    originalDuration: number;
  } | null>(null);

  // Déplacement direct et fluide à la volée des tâches sur la timeline (Imbrication en temps réel)
  const [timelineMoveState, setTimelineMoveState] = useState<{
    taskId: string;
    startY: number;
    originalScheduledTime: string;
    originalStartMinutes: number;
  } | null>(null);

  // Gestion du cycle de redimensionnement de la timeline par drag
  useEffect(() => {
    if (!resizeState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizeState.startY;
      const deltaMinutes = Math.round((deltaY / hourHeight) * 60);
      const roundedDeltaMinutes = Math.round(deltaMinutes / 5) * 5; // Précision fignolée à 5 minutes près !

      const currentDb = dbRef.current;

      if (resizeState.direction === "bottom") {
        const newDuration = Math.max(10, Math.min(240, resizeState.originalDuration + roundedDeltaMinutes));
        
        const updatedTasks = currentDb.tasks.map((t) => {
          if (t.id === resizeState.taskId) {
            return {
              ...t,
              durationMinutes: newDuration
            };
          }
          return t;
        });
        
        dbRef.current = { ...currentDb, tasks: updatedTasks };
        updateDb(dbRef.current, true);
      } else if (resizeState.direction === "top") {
        const [h, m] = resizeState.originalScheduledTime.split(":").map(Number);
        let adjustedH = h;
        if (h < startHour) adjustedH = h + 24;
        const originalStartMinutes = adjustedH * 60 + m;
        const newStartMinutes = originalStartMinutes + roundedDeltaMinutes;
        const newDuration = resizeState.originalDuration - roundedDeltaMinutes;

        const minBound = startHour * 60;
        const maxBound = endHour * 60;

        if (newDuration >= 10 && newStartMinutes >= minBound && newStartMinutes < maxBound) {
          const finalH = Math.floor(newStartMinutes / 60) % 24;
          const finalM = newStartMinutes % 60;
          const newScheduledTimeStr = `${finalH.toString().padStart(2, "0")}:${finalM.toString().padStart(2, "0")}`;

          const updatedTasks = currentDb.tasks.map((t) => {
            if (t.id === resizeState.taskId) {
              return {
                ...t,
                scheduledTime: newScheduledTimeStr,
                durationMinutes: newDuration
              };
            }
            return t;
          });
          
          dbRef.current = { ...currentDb, tasks: updatedTasks };
          updateDb(dbRef.current, true);
        }
      }
    };

    const handleMouseUp = () => {
      setResizeState(null);
      updateDb(dbRef.current); // Enregistrement consolidé sur le cloud en fin de geste
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizeState, updateDb, hourHeight]);

  // Gestion du déplacement direct clinique à la volée sur la timeline
  useEffect(() => {
    if (!timelineMoveState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - timelineMoveState.startY;
      const deltaMinutes = Math.round((deltaY / hourHeight) * 60);
      const roundedDeltaMinutes = Math.round(deltaMinutes / 5) * 5; // précision chirurgicale à 5 minutes près !

      const currentDb = dbRef.current;
      const newStartMinutes = timelineMoveState.originalStartMinutes + roundedDeltaMinutes;
      const minBound = startHour * 60; // 11h
      const maxBound = (endHour * 60) - 5; // 19h - 5m

      const clampedMinutes = Math.max(minBound, Math.min(maxBound, newStartMinutes));
      
      const finalH = Math.floor(clampedMinutes / 60);
      const finalM = clampedMinutes % 60;
      const newScheduledTimeStr = `${finalH.toString().padStart(2, "0")}:${finalM.toString().padStart(2, "0")}`;

      const updatedTasks = currentDb.tasks.map((t) => {
        if (t.id === timelineMoveState.taskId) {
          return {
            ...t,
            scheduledTime: newScheduledTimeStr
          };
        }
        return t;
      });
      
      dbRef.current = { ...currentDb, tasks: updatedTasks };
      updateDb(dbRef.current, true);
    };

    const handleMouseUp = () => {
      setTimelineMoveState(null);
      updateDb(dbRef.current); // Enregistrement consolidé sur le cloud en fin de geste
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [timelineMoveState, updateDb, hourHeight]);

  // Mettre à jour l'heure toutes les minutes d'après les directives du cahier des charges
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Demande d'autorisation de notifications au chargement
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Suivi des notifications émises durant la minute courante
  const notifiedTasksRef = useRef<Record<string, string>>({});

  // Calculer en direct les alertes de planification en ligne
  const clinicalAlerts = React.useMemo(() => {
    if (!isRappelsEnabled) return [];

    const alerts: Array<{ task: Task; minutesLeft: number }> = [];
    const nowHours = currentTime.getHours();
    const nowMinutes = currentTime.getMinutes();
    const nowAbsoluteMinutes = nowHours * 60 + nowMinutes;

    db.tasks.forEach((t) => {
      if (!t.isCompleted && t.planningStatus === "scheduled" && t.scheduledTime) {
        const [th, tm] = t.scheduledTime.split(":").map(Number);
        const startAbsoluteMinutes = th * 60 + tm;
        const diff = startAbsoluteMinutes - nowAbsoluteMinutes;

        // Rappel si commence bientôt (dans les 10 min) ou est commencée de moins de 15 min
        if (diff >= -15 && diff <= 10) {
          alerts.push({
            task: t,
            minutesLeft: diff
          });
        }
      }
    });
    return alerts;
  }, [db.tasks, currentTime, isRappelsEnabled]);

  // Vérification de notification 5 minutes avant le début
  useEffect(() => {
    const checkScheduleForNotifications = () => {
      if (!isRappelsEnabled) return;
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      const fiveMinutesLater = new Date(Date.now() + 5 * 60 * 1000);
      const targetHours = fiveMinutesLater.getHours().toString().padStart(2, "0");
      const targetMinutes = fiveMinutesLater.getMinutes().toString().padStart(2, "0");
      const targetTimeString = `${targetHours}:${targetMinutes}`;

      const currentMinuteKey = new Date().toISOString().substring(0, 16);

      db.tasks.forEach((t) => {
        if (
          !t.isCompleted &&
          t.planningStatus === "scheduled" &&
          t.scheduledTime === targetTimeString &&
          notifiedTasksRef.current[t.id] !== currentMinuteKey
        ) {
          notifiedTasksRef.current[t.id] = currentMinuteKey;

          new Notification("Planification - Rappel d'échéance", {
            body: `La tâche "${t.title}" commence dans 5 minutes (à ${t.scheduledTime}). Durée estimée : ${t.durationMinutes} min.`,
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23059669' width='48' height='48'><circle cx='12' cy='12' r='10'/></svg>"
          });
        }
      });
    };

    checkScheduleForNotifications();
    const interval = setInterval(checkScheduleForNotifications, 12000); // Exécution régulière
    return () => clearInterval(interval);
  }, [db.tasks]);

  // Défilement automatique vers l'heure actuelle au chargement si possible
  useEffect(() => {
    const performAutoScroll = () => {
      if (!timelineContainerRef.current) return;
      
      const currentHours = currentTime.getHours();
      let adjustedH = currentHours;
      if (currentHours < startHour) adjustedH = currentHours + 24;

      const currentMinutes = currentTime.getMinutes();
      const currentTotalMin = adjustedH * 60 + currentMinutes;
      const startMin = startHour * 60;
      const endMin = endHour * 60;

      if (currentTotalMin >= startMin && currentTotalMin <= endMin) {
        const offsetMin = currentTotalMin - startMin;
        const targetY = (offsetMin / 60) * hourHeight;
        
        timelineContainerRef.current.scrollTo({
          top: targetY - 100,
          behavior: "smooth"
        });
      }
    };

    const targetTimer = setTimeout(performAutoScroll, 350);
    return () => clearTimeout(targetTimer);
  }, [loadedSettings]);

  // Définition de la grille de hauteur
  const totalHours = endHour - startHour; // 8 heures de 11:00 à 19:00

  const isTaskDone = (t: Task) => Boolean(t.isCompleted || t.status === "done" || t.planningStatus === "done");

  // Récupérer et classer les tâches principales pour notre écran de planification
  const activeTasks = db.tasks.filter((t) => !t.isArchived && !isTaskDone(t));
  const doneTasks = db.tasks.filter((t) => !t.isArchived && isTaskDone(t));

  // Tâches non terminées restées au Backlog (sans heure programmée ou étiquetées backlog) - exclut les routines et les éléments réservés au planning
  const backlogTasks = activeTasks.filter(
    (t) => (!t.scheduledTime || t.planningStatus === "backlog" || !t.planningStatus) && t.type !== "routine" && !t.isPlanningOnly
  );

  // Moteur de tri réactif multidimensionnel pour le Backlog de tâches
  const sortedBacklogTasks = React.useMemo(() => {
    const list = [...backlogTasks];
    list.sort((a, b) => {
      if (taskSort === "score") {
        const scoreA = (a.importance ?? 5) + (a.urgency ?? 5) + (a.easiness ?? 5) - (a.mentalLoad ?? 5);
        const scoreB = (b.importance ?? 5) + (b.urgency ?? 5) + (b.easiness ?? 5) - (b.mentalLoad ?? 5);
        return scoreB - scoreA;
      }
      if (taskSort === "urgency") {
        return (b.urgency ?? 5) - (a.urgency ?? 5);
      }
      if (taskSort === "importance") {
        return (b.importance ?? 5) - (a.importance ?? 5);
      }
      if (taskSort === "easiness") {
        return (b.easiness ?? 5) - (a.easiness ?? 5);
      }
      if (taskSort === "mentalLoad") {
        return (b.mentalLoad ?? 5) - (a.mentalLoad ?? 5);
      }
      if (taskSort === "alphabetical") {
        return a.title.localeCompare(b.title);
      }
      if (taskSort === "createdAt") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
    return list;
  }, [backlogTasks, taskSort]);

  // Moteur de tri réactif pour le Stock d'habitudes d'observance
  const sortedHabits = React.useMemo(() => {
    const list = [...(db.habits || [])];
    list.sort((a, b) => {
      if (habitSort === "streak") {
        return (b.streak || 0) - (a.streak || 0);
      }
      if (habitSort === "inactivity") {
        const inactA = calculateInactivity(a);
        const inactB = calculateInactivity(b);
        return inactB.days - inactA.days; // Du plus inactif au plus actif
      }
      if (habitSort === "alphabetical") {
        return a.title.localeCompare(b.title);
      }
      if (habitSort === "reward") {
        return (b.rewardValue || 0) - (a.rewardValue || 0);
      }
      return 0;
    });
    return list;
  }, [db.habits, habitSort]);

  // Moteur de tri réactif pour le Stock de tâches récurrentes
  const sortedRecurringTasks = React.useMemo(() => {
    const list = [...(db.recurringTasks || [])];
    list.sort((a, b) => {
      if (recurringSort === "score") {
        const scoreA = (a.baseImportance ?? 5) + (a.baseUrgency ?? 5);
        const scoreB = (b.baseImportance ?? 5) + (b.baseUrgency ?? 5);
        return scoreB - scoreA;
      }
      if (recurringSort === "alphabetical") {
        return a.title.localeCompare(b.title);
      }
      if (recurringSort === "reward") {
        return (b.rewardValue || 0) - (a.rewardValue || 0);
      }
      return 0;
    });
    return list;
  }, [db.recurringTasks, recurringSort]);

  // Moteur de tri réactif pour le Stock de rituels et préparations
  const sortedPreparations = React.useMemo(() => {
    const list = [...(db.preparations || [])];
    list.sort((a, b) => {
      if (prepSort === "duration") {
        return (b.durationMinutes || 0) - (a.durationMinutes || 0);
      }
      if (prepSort === "alphabetical") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
    return list;
  }, [db.preparations, prepSort]);

  // Événements d'agenda partagés cochés pour aujourd'hui
  const activeSharedToday = React.useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return (sharedEvents || []).filter((e) => e.dueDate === todayStr);
  }, [sharedEvents]);

  // Tâches planifiées ou en cours programmées aujourd'hui (incluant les agendas partagés, et l'aperçu du glisser-déposer en temps réel !)
  const scheduledTasks = React.useMemo(() => {
    let baseList = [
      ...activeTasks.filter(
        (t) => t.scheduledTime && (t.planningStatus === "scheduled" || t.planningStatus === "in-progress")
      ),
      ...activeSharedToday.filter(e => e.scheduledTime)
    ];

    if (draggedItem && dragOverTop !== null) {
      // Calculer l'heure virtuelle HH:MM à la position de survol du curseur
      const ratio = dragOverTop / (totalHours * hourHeight);
      const mins = ratio * (totalHours * 60);
      const finalM = startHour * 60 + mins;
      const h = Math.floor(finalM / 60) % 24;
      const m = Math.floor(finalM % 60);
      const virtualScheduledTime = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

      // Si l'élément glissé provient déjà de la liste planifiée, on met à jour son heure virtuelle
      const existsIdx = baseList.findIndex(t => t.id === draggedItem.id);
      if (existsIdx > -1) {
        const updatedList = [...baseList];
        updatedList[existsIdx] = {
          ...updatedList[existsIdx],
          scheduledTime: virtualScheduledTime,
          isDraggingPreview: true
        };
        return updatedList;
      } else {
        // Sinon, c'est une nouvelle routine ou habitude glissée depuis le backlog : on l'injecte temporairement
        const virtualTask: Task = {
          id: draggedItem.id,
          title: draggedItem.title,
          description: "Ajustement de l'alignement en cours...",
          createdAt: new Date().toISOString(),
          isCompleted: false,
          importance: 5,
          urgency: 5,
          easiness: 5,
          mentalLoad: 5,
          score: 10,
          isStarred: false,
          durationMinutes: draggedItem.durationMinutes,
          timeSpentSeconds: 0,
          rewardValue: 0,
          chronoRewardValue: 1,
          dependencies: [],
          scheduledTime: virtualScheduledTime,
          type: draggedItem.type || "routine",
          planningStatus: "scheduled",
          accumulatedTime: 0,
          isPaused: false,
          color: draggedItem.color || "",
          isDraggingPreview: true
        };
        return [...baseList, virtualTask];
      }
    }

    return baseList;
  }, [activeTasks, activeSharedToday, draggedItem, dragOverTop, totalHours, hourHeight, startHour]);

  // Calculer dynamiquement les positions horizontales en cas de superposition (côte-à-côte)
  const scheduledPositions = React.useMemo(() => {
    const list = [...scheduledTasks];
    const positions: Record<string, { left: string; width: string }> = {};
    if (list.length === 0) return positions;

    // Trier temporellement par heure de début
    list.sort((a, b) => {
      const [ah, am] = (a.scheduledTime || "00:00").split(":").map(Number);
      const [bh, bm] = (b.scheduledTime || "00:00").split(":").map(Number);
      const startA = ah * 60 + am;
      const startB = bh * 60 + bm;
      if (startA !== startB) return startA - startB;
      return (a.durationMinutes || 0) - (b.durationMinutes || 0);
    });

    // Partitionnement en colonnes indépendantes
    const columns: Array<Array<{ start: number; end: number; id: string }>> = [];

    list.forEach((t) => {
      const [sh, sm] = (t.scheduledTime || "11:00").split(":").map(Number);
      const start = sh * 60 + sm;
      const end = start + (t.durationMinutes || 30);

      let colIdx = 0;
      while (colIdx < columns.length) {
        const col = columns[colIdx];
        const overlaps = col.some((item) => start < item.end && end > item.start);
        if (!overlaps) break;
        colIdx++;
      }

      if (colIdx === columns.length) {
        columns.push([]);
      }
      columns[colIdx].push({ start, end, id: t.id });
    });

    // Détermination de la composante connexe d'overlaps pour regrouper sainement les colonnes
    const groups: Array<{ taskIds: Set<string>; maxCols: number; colsAssigned: Record<string, number> }> = [];

    list.forEach((t) => {
      const [sh, sm] = (t.scheduledTime || "11:00").split(":").map(Number);
      const start = sh * 60 + sm;
      const end = start + (t.durationMinutes || 30);

      let assignedCol = 0;
      for (let i = 0; i < columns.length; i++) {
        if (columns[i].some((item) => item.id === t.id)) {
          assignedCol = i;
          break;
        }
      }

      let targetGroup = groups.find((g) => {
        return Array.from(g.taskIds).some((existingId) => {
          const existingT = list.find((x) => x.id === existingId);
          if (!existingT) return false;
          const [eh, em] = (existingT.scheduledTime || "11:00").split(":").map(Number);
          const eStart = eh * 60 + em;
          const eEnd = eStart + (existingT.durationMinutes || 30);
          return start < eEnd && end > eStart;
        });
      });

      if (!targetGroup) {
        targetGroup = {
          taskIds: new Set<string>(),
          maxCols: 0,
          colsAssigned: {}
        };
        groups.push(targetGroup);
      }

      targetGroup.taskIds.add(t.id);
      targetGroup.colsAssigned[t.id] = assignedCol;
      targetGroup.maxCols = Math.max(targetGroup.maxCols, assignedCol + 1);
    });

    // Fusion connective transitoire des groupes pour de parfaites largeurs unifiées de blocs
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
          const overlap = Array.from(groups[i].taskIds).some((id1) => {
            const t1 = list.find((x) => x.id === id1)!;
            const [h1, m1] = (t1.scheduledTime || "11:00").split(":").map(Number);
            const s1 = h1 * 60 + m1;
            const e1 = s1 + (t1.durationMinutes || 30);

            return Array.from(groups[j].taskIds).some((id2) => {
              const t2 = list.find((x) => x.id === id2)!;
              const [h2, m2] = (t2.scheduledTime || "11:00").split(":").map(Number);
              const s2 = h2 * 60 + m2;
              const e2 = s2 + (t2.durationMinutes || 30);
              return s1 < e2 && s2 < e1;
            });
          });

          if (overlap) {
            groups[j].taskIds.forEach((id) => groups[i].taskIds.add(id));
            Object.assign(groups[i].colsAssigned, groups[j].colsAssigned);
            groups[i].maxCols = Math.max(groups[i].maxCols, groups[j].maxCols);
            groups.splice(j, 1);
            changed = true;
            break;
          }
        }
        if (changed) break;
      }
    }

    // Répartition de la largeur de grille
    groups.forEach((g) => {
      const totalCols = g.maxCols;
      g.taskIds.forEach((id) => {
        const col = g.colsAssigned[id];
        const widthPercent = 100 / totalCols;
        const leftPercent = col * widthPercent;
        positions[id] = {
          left: `calc(${leftPercent}% + 4px)`,
          width: `calc(${widthPercent}% - 8px)`
        };
      });
    });

    return positions;
  }, [scheduledTasks]);



  // Convertir l'heure au format Y correspondant au pixel près
  const parsePositionAndHeight = (task: Task) => {
    if (!task.scheduledTime) return { top: 0, height: 0, isValid: false };

    const [h, m] = task.scheduledTime.split(":").map(Number);
    const taskMinutes = h * 60 + m;
    const gridStartMinutes = startHour * 60; // 660
    const gridEndMinutes = endHour * 60; // 1140

    const isValid = taskMinutes >= gridStartMinutes && taskMinutes < gridEndMinutes;

    const offsetMinutes = taskMinutes - gridStartMinutes;
    const top = (offsetMinutes / 60) * hourHeight;
    const height = ((task.durationMinutes || 30) / 60) * hourHeight;

    return { top, height, isValid };
  };

  // Calculer l'exacte position de la ligne de temps réelle virtuelle
  const getCurrentTimelineY = () => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    const totalMinutes = h * 60 + m;
    const startMinutes = startHour * 60;
    const endMinutes = endHour * 60;

    if (totalMinutes < startMinutes || totalMinutes >= endMinutes) {
      return { active: false, top: 0 };
    }

    const diff = totalMinutes - startMinutes;
    const top = (diff / 60) * hourHeight;
    return { active: true, top };
  };

  const lineState = getCurrentTimelineY();

  // Démarrer instantanément le chrono d'une tâche
  const handleStartTaskTimer = (id: string) => {
    const nowISO = new Date().toISOString();
    const updatedTasks = db.tasks.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          planningStatus: "in-progress" as const,
          startTime: t.startTime || nowISO,
          lastResumeTime: nowISO,
          isPaused: false
        };
      } else if (t.planningStatus === "in-progress") {
        // Option de pause automatique des autres chronos
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

    updateDb({
      ...db,
      tasks: updatedTasks
    });
  };

  // Détacher / Désordonner une tâche (retrait de la planification horaire vers backlog)
  const handleRemoveTaskSchedule = (id: string) => {
    const target = db.tasks.find((t) => t.id === id);
    if (!target) return;

    if (target.type === "routine" || target.isPlanningOnly || id.startsWith("habit-planned-") || id.startsWith("recurring-planned-") || id.startsWith("prep-planned-")) {
      // Supprimer l'occurrence planifiée de la routine pour ne pas encombrer la base
      const updatedTasks = db.tasks.filter((t) => t.id !== id);
      updateDb({ ...db, tasks: updatedTasks });
    } else {
      const updatedTasks = db.tasks.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            scheduledTime: undefined,
            planningStatus: "backlog" as const,
            isPaused: false,
            lastResumeTime: undefined
          };
        }
        return t;
      });
      updateDb({ ...db, tasks: updatedTasks });
    }
  };

  // Vider l'agenda de manière sécurisée (Déprogrammer toutes les tâches de la timeline sans les supprimer de la base)
  const handleClearAll = () => {
    const clearedTasks = db.tasks
      .filter((t) => !(t.type === "routine" || t.isPlanningOnly || t.id.startsWith("habit-planned-") || t.id.startsWith("recurring-planned-") || t.id.startsWith("prep-planned-")))
      .map((t) => ({
        ...t,
        scheduledTime: undefined,
        planningStatus: "backlog" as const,
        isPaused: false,
        lastResumeTime: undefined
      }));
    updateDb({
      ...db,
      tasks: clearedTasks
    });
    setShowClearConfirm(false);
    setTemplateStatus("Agenda vidé. Vos tâches ponctuelles ont rejoint le stock ! ✓");
    setTimeout(() => setTemplateStatus(null), 5000);
  };

  // Enregistrer le déroulé planifié en cours comme Journée Type personnalisée
  const handleSaveCurrentAsTemplate = () => {
    const scheduledToSave = db.tasks
      .filter((t) => t.scheduledTime)
      .map((t) => ({
        title: t.title,
        description: t.description,
        durationMinutes: t.durationMinutes || 30,
        type: t.type || "ponctuelle",
        scheduledTime: t.scheduledTime,
        importance: t.importance,
        urgency: t.urgency,
        mentalLoad: t.mentalLoad,
        easiness: t.easiness
      }));

    if (scheduledToSave.length === 0) {
      setTemplateStatus("Votre planning est vide ! Impossible d'en faire une journée type. ✓");
      setTimeout(() => setTemplateStatus(null), 5000);
      return;
    }

    const updatedMemories = (db.aiMemories || []).filter((m) => m.key !== "custom_day_template");
    updatedMemories.push({
      id: `mem-template-${Date.now()}`,
      key: "custom_day_template",
      value: JSON.stringify(scheduledToSave),
      updatedAt: new Date().toISOString()
    });

    updateDb({
      ...db,
      aiMemories: updatedMemories
    });

    setTemplateStatus("Journée type personnalisée enregistrée avec succès ✓");
    setTimeout(() => setTemplateStatus(null), 5000);
  };

  // Charger la journée type (personnalisée si existante, démo par défaut sinon)
  const handleLoadCustomTemplate = () => {
    const templateMemory = (db.aiMemories || []).find((m) => m.key === "custom_day_template");
    
    if (!templateMemory) {
      // Pas de journée type personnalisée : on charge la démo par défaut de manière intelligente
      handleLoadDemo();
      return;
    }

    try {
      const savedTasks = JSON.parse(templateMemory.value) as Array<{
        title: string;
        description: string;
        durationMinutes: number;
        type: "routine" | "ponctuelle";
        scheduledTime: string;
        importance?: number;
        urgency?: number;
        mentalLoad?: number;
        easiness?: number;
      }>;

      const generatedTasks: Task[] = savedTasks.map((st, idx) => ({
        id: `tpl-t-${Date.now()}-${idx}`,
        title: st.title,
        description: st.description || "",
        createdAt: new Date().toISOString(),
        isCompleted: false,
        importance: st.importance ?? 6,
        urgency: st.urgency ?? 5,
        easiness: st.easiness ?? 6,
        mentalLoad: st.mentalLoad ?? 4,
        score: (st.importance ?? 6) + (st.urgency ?? 5) + (st.easiness ?? 6) - (st.mentalLoad ?? 4),
        isStarred: false,
        durationMinutes: st.durationMinutes || 30,
        timeSpentSeconds: 0,
        rewardValue: Math.max(15, st.durationMinutes || 30),
        chronoRewardValue: 1,
        dependencies: [],
        scheduledTime: st.scheduledTime,
        type: st.type,
        planningStatus: "scheduled",
        accumulatedTime: 0,
        isPaused: false
      }));

      // Fusionner pour éviter de perdre d'autres tâches en cours
      const withoutOldTemplates = db.tasks.filter((t) => !t.id.startsWith("tpl-") && !t.id.startsWith("demo-"));
      
      updateDb({
        ...db,
        tasks: [...withoutOldTemplates, ...generatedTasks]
      });
      
      setTemplateStatus("Votre Journée Type personnalisée a été configurée ! ✓");
      setTimeout(() => setTemplateStatus(null), 5000);
    } catch (e) {
      console.error("Échec du décodage de la journée type", e);
      setTemplateStatus("Erreur d'analyse de la journée type sauvegardée.");
      setTimeout(() => setTemplateStatus(null), 5000);
    }
  };

  // Chargement d'un ensemble de tâches types de travail de démonstration par défaut
  const handleLoadDemo = () => {
    const demoSet: Task[] = [
      {
        id: "demo-t1",
        title: "Revue de code & Daily Standup",
        description: "Rituel de synchronisation matinale et alignement de sprint de développement.",
        createdAt: new Date().toISOString(),
        isCompleted: false,
        importance: 8,
        urgency: 7,
        easiness: 7,
        mentalLoad: 4,
        score: 22,
        isStarred: true,
        durationMinutes: 30,
        timeSpentSeconds: 0,
        rewardValue: 25,
        chronoRewardValue: 1,
        dependencies: [],
        scheduledTime: "11:00",
        type: "routine",
        planningStatus: "scheduled",
        accumulatedTime: 0,
        isPaused: false
      },
      {
        id: "demo-t2",
        title: "Penser l'architecture système",
        description: "Formaliser les couches logicielles, découplement de l'état asynchrone et persistance de la base de données.",
        createdAt: new Date().toISOString(),
        isCompleted: false,
        importance: 9,
        urgency: 6,
        easiness: 3,
        mentalLoad: 8,
        score: 26,
        isStarred: false,
        durationMinutes: 120,
        timeSpentSeconds: 0,
        rewardValue: 60,
        chronoRewardValue: 1.5,
        dependencies: ["demo-t1"],
        scheduledTime: "11:30",
        type: "ponctuelle",
        planningStatus: "scheduled",
        accumulatedTime: 0,
        isPaused: false
      },
      {
        id: "demo-t3",
        title: "Correction de bug critique & Refactoring",
        description: "Remédier aux fuites mémoire identifiées sur le cycle du scheduler et optimiser les re-rendus.",
        createdAt: new Date().toISOString(),
        isCompleted: false,
        importance: 10,
        urgency: 9,
        easiness: 5,
        mentalLoad: 6,
        score: 29,
        isStarred: true,
        durationMinutes: 60,
        timeSpentSeconds: 0,
        rewardValue: 50,
        chronoRewardValue: 1,
        dependencies: [],
        scheduledTime: "14:00",
        type: "ponctuelle",
        planningStatus: "scheduled",
        accumulatedTime: 0,
        isPaused: false
      },
      {
        id: "demo-t4",
        title: "Briefing d'équipe & Reporting hebdomadaire",
        description: "Revue des indicateurs clés de performance et planification des charges à venir.",
        createdAt: new Date().toISOString(),
        isCompleted: false,
        importance: 7,
        urgency: 8,
        easiness: 6,
        mentalLoad: 5,
        score: 21,
        isStarred: false,
        durationMinutes: 45,
        timeSpentSeconds: 0,
        rewardValue: 30,
        chronoRewardValue: 1,
        dependencies: [],
        scheduledTime: "16:00",
        type: "routine",
        planningStatus: "scheduled",
        accumulatedTime: 0,
        isPaused: false
      },
      {
        id: "demo-t5",
        title: "Suivi du bien-être & Hydratation",
        description: "Faire le point hebdomadaire sur l'état de forme, de sommeil et niveau d'énergie.",
        createdAt: new Date().toISOString(),
        isCompleted: false,
        importance: 8,
        urgency: 5,
        easiness: 8,
        mentalLoad: 2,
        score: 16,
        isStarred: false,
        durationMinutes: 15,
        timeSpentSeconds: 0,
        rewardValue: 15,
        chronoRewardValue: 1,
        dependencies: [],
        scheduledTime: "18:30",
        type: "routine",
        planningStatus: "scheduled",
        accumulatedTime: 0,
        isPaused: false
      }
    ];

    // Fusionner intelligemment avec les tâches existantes pour ne rien perdre
    updateDb({
      ...db,
      tasks: [...db.tasks.filter((t) => !t.id.startsWith("demo-")), ...demoSet]
    });
    setTemplateStatus("Journée type de démonstration chargée ! ✓");
    setTimeout(() => setTemplateStatus(null), 5000);
  };

  // ==========================================
  // LOGIQUE ET COMPORTEMENT DU DRAG & DROP MULTI-RESOURCES AMÉLIORÉ
  // ==========================================
  
  const handleDragStartTask = (e: React.DragEvent, taskId: string, type: "task" | "habit" | "recurring" | "preparation" = "task") => {
    e.dataTransfer.setData("item-id", taskId);
    e.dataTransfer.setData("item-type", type);
    // Assurer la rétrocompatibilité
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";

    let itemInfo: any = null;
    if (type === "task") {
      const found = db.tasks.find(t => t.id === taskId);
      if (found) {
        itemInfo = {
          id: found.id,
          title: found.title,
          durationMinutes: found.durationMinutes || 30,
          color: found.color || "",
          type: found.type || "ponctuelle"
        };
      }
    } else if (type === "habit") {
      const habit = db.habits.find(h => h.id === taskId);
      if (habit) {
        itemInfo = {
          id: `habit-planned-temp-${taskId}`,
          title: `🌿 ${habit.title}`,
          durationMinutes: habit.type === "chrono" ? (habit.targetValue || 20) : 20,
          color: habit.color || "",
          type: "routine"
        };
      }
    } else if (type === "recurring") {
      const rec = db.recurringTasks.find(r => r.id === taskId);
      if (rec) {
        itemInfo = {
          id: `recurring-planned-temp-${taskId}`,
          title: `🔁 ${rec.title}`,
          durationMinutes: 45,
          color: "",
          type: "routine"
        };
      }
    } else if (type === "preparation") {
      const prep = db.preparations.find(p => p.id === taskId);
      if (prep) {
        itemInfo = {
          id: `prep-planned-temp-${taskId}`,
          title: `🧘 ${prep.title}`,
          durationMinutes: prep.durationMinutes || 15,
          color: prep.color || "",
          type: "routine"
        };
      }
    }

    if (itemInfo) {
      setDraggedItem(itemInfo);
    }
  };

  const handleDragOverTimeline = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;

    // Clamper y pour rester confiné aux pixels de la timeline
    const clampedY = Math.max(0, Math.min(totalHours * hourHeight, y));

    // Arrondir visuellement à la graduation de 5 minutes la plus proche (5 minutes = 1/12 d'heure)
    const fiveMinPixels = hourHeight / 12; // ex: 85/12 = 7.083px
    const roundedY = Math.round(clampedY / fiveMinPixels) * fiveMinPixels;

    setDragOverTop(roundedY);
  };

  const handleDragLeaveTimeline = (e: React.DragEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX >= rect.right ||
      e.clientY < rect.top ||
      e.clientY >= rect.bottom
    ) {
      setDragOverTop(null);
      setDraggedItem(null);
    }
  };

  const handleDropTimeline = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverTop(null);
    setDraggedItem(null);

    const dragId = e.dataTransfer.getData("item-id") || e.dataTransfer.getData("text/plain");
    const dragType = (e.dataTransfer.getData("item-type") || "task") as "task" | "habit" | "recurring" | "preparation";

    if (!dragId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;

    const clampedY = Math.max(0, Math.min(totalHours * hourHeight, y));
    const ratio = clampedY / (totalHours * hourHeight);
    
    // Convertir en total minutes depuis le début de la timeline (11h00 = 660m)
    const totalMinutesElapsed = ratio * (totalHours * 60);
    // Arrondir à la graduation de 5 minutes la plus proche
    const roundedMinutes = Math.round(totalMinutesElapsed / 5) * 5;
    
    const targetAbsoluteMinutes = startHour * 60 + roundedMinutes;
    // Clamper pour ne pas dépasser la grille
    const finalMinutes = Math.max(startHour * 60, Math.min((endHour * 60) - 5, targetAbsoluteMinutes));

    const hr = Math.floor(finalMinutes / 60);
    const mn = finalMinutes % 60;
    const timeString = `${hr.toString().padStart(2, "0")}:${mn.toString().padStart(2, "0")}`;

    if (dragType === "task") {
      // Cas classique d'une tâche déjà de type "Task"
      const updatedTasks = db.tasks.map((t) => {
        if (t.id === dragId) {
          return {
            ...t,
            scheduledTime: timeString,
            planningStatus: "scheduled" as const,
            isCompleted: false // Réinitialiser l'état complété par sécurité
          };
        }
        return t;
      });
      updateDb({
        ...db,
        tasks: updatedTasks
      });
    } else if (dragType === "habit") {
      const habit = db.habits.find((h) => h.id === dragId);
      if (!habit) return;

      const newTask: Task = {
        id: `habit-planned-${Date.now()}`,
        title: `🌿 ${habit.title}`,
        description: `Routine d'Habitude Clinique : ${habit.description || "Préservation comportementale"}`,
        createdAt: new Date().toISOString(),
        isCompleted: false,
        importance: 7,
        urgency: 4,
        easiness: 8,
        mentalLoad: 1,
        score: 18,
        isStarred: false,
        durationMinutes: habit.type === "chrono" ? (habit.targetValue || 20) : 20,
        timeSpentSeconds: 0,
        rewardValue: habit.rewardValue || 15,
        chronoRewardValue: 1,
        dependencies: [],
        scheduledTime: timeString,
        type: "routine",
        isPlanningOnly: true,
        planningStatus: "scheduled" as const,
        accumulatedTime: 0,
        isPaused: false
      };

      updateDb({
        ...db,
        tasks: [...db.tasks, newTask]
      });
    } else if (dragType === "recurring") {
      const rec = db.recurringTasks.find((r) => r.id === dragId);
      if (!rec) return;

      const newTask: Task = {
        id: `recurring-planned-${Date.now()}`,
        title: `🔁 ${rec.title}`,
        description: `Tâche récurrente planifiée : ${rec.description || "Mise en place programmée"}`,
        createdAt: new Date().toISOString(),
        isCompleted: false,
        importance: rec.baseImportance || 8,
        urgency: rec.baseUrgency || 7,
        easiness: 6,
        mentalLoad: 4,
        score: (rec.baseImportance || 8) + (rec.baseUrgency || 7) - 4,
        isStarred: false,
        durationMinutes: 45,
        timeSpentSeconds: 0,
        rewardValue: 30,
        chronoRewardValue: 1,
        dependencies: [],
        scheduledTime: timeString,
        type: "routine",
        isPlanningOnly: true,
        planningStatus: "scheduled" as const,
        accumulatedTime: 0,
        isPaused: false
      };

      updateDb({
        ...db,
        tasks: [...db.tasks, newTask]
      });
    } else if (dragType === "preparation") {
      const prep = db.preparations.find((p) => p.id === dragId);
      if (!prep) return;

      const newTask: Task = {
        id: `prep-planned-${Date.now()}`,
        title: `🧘 ${prep.title}`,
        description: `Rituel de préparation personnelle : ${prep.description || "Focus & Respiration"}`,
        createdAt: new Date().toISOString(),
        isCompleted: false,
        importance: 6,
        urgency: 5,
        easiness: 9,
        mentalLoad: 1,
        score: 19,
        isStarred: false,
        durationMinutes: prep.durationMinutes || 15,
        timeSpentSeconds: 0,
        rewardValue: 15,
        chronoRewardValue: 1,
        dependencies: [],
        scheduledTime: timeString,
        type: "routine",
        isPlanningOnly: true,
        planningStatus: "scheduled" as const,
        accumulatedTime: 0,
        isPaused: false,
        color: prep.color || ""
      };

      updateDb({
        ...db,
        tasks: [...db.tasks, newTask]
      });
    }
  };

  // ==========================================
  // CALCULS COMPLETS DE STATISTIQUES REELLES VS ESTIMATION
  // ==========================================

  const performanceStats = React.useMemo(() => {
    const historicalTasks = doneTasks.filter((t) => t.timeSpentSeconds > 0);
    const groups: Record<string, { title: string; count: number; totalEst: number; totalReal: number }> = {};

    historicalTasks.forEach((t) => {
      const normalized = t.title.trim();
      if (!groups[normalized]) {
        groups[normalized] = {
          title: t.title,
          count: 0,
          totalEst: 0,
          totalReal: 0
        };
      }
      groups[normalized].count += 1;
      groups[normalized].totalEst += t.durationMinutes || 30;
      groups[normalized].totalReal += Math.round(t.timeSpentSeconds / 60);
    });

    return Object.values(groups).map((g) => {
      const avgEst = Math.round(g.totalEst / g.count);
      const avgReal = Math.round(g.totalReal / g.count);
      const difference = avgReal - avgEst;
      return {
        title: g.title,
        count: g.count,
        avgEst,
        avgReal,
        difference
      };
    });
  }, [doneTasks]);

  // Permettre manuel de demander l'autorisation de notifs
  const handleRequestNotify = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then((status) => {
        if (status === "granted") {
          new Notification("Notifications validées", {
            body: "Début d'activité planifiée monitorée."
          });
        }
      });
    }
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col text-emerald-950 font-sans relative select-none">
      
      {/* BLOCK DE CONFIRMATIONS ET D'ALERTES D'OBSERVANCE CLINIQUE TEMPS-RÉEL */}
      {clinicalAlerts.length > 0 && (
        <div className="shrink-0 mb-2 bg-amber-50 border-4 border-amber-500 p-2.5 rounded shadow-[3px_3px_0px_0px_rgba(245,158,11,1)]">
          <h4 className="font-black text-amber-800 text-xs uppercase tracking-wide flex items-center gap-1">
            🚨 Rappel d'Observance Immédiate
          </h4>
          <div className="mt-1.5 space-y-1.5">
            {clinicalAlerts.map((alert) => (
              <div key={alert.task.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 bg-white/75 p-1.5 border border-amber-300">
                <div>
                  <span className="font-bold">{alert.task.title}</span> commence à <span className="font-bold">{alert.task.scheduledTime}</span> (dans {alert.minutesLeft} minutes)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStartTaskTimer(alert.task.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2 py-0.5 uppercase rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Play size={10} fill="currentColor" /> Démarrer la tâche
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISPOSITION SANS MARGE (1/3 GAUCHE, 2/3 DROITE EN PERMANENCE) */}
      <div className="grid grid-cols-3 gap-3 items-stretch flex-1 min-h-0 h-full">
        
        {/* =======================================
            COLONNE GAUCHE (1/3 de la largeur) : STOCK DES TACHES (BACKLOG)
           ======================================= */}
        <div className="col-span-1 h-full min-h-0 flex flex-col">
          <div className="bg-white border-2 border-emerald-600 p-2.5 rounded shadow-[3px_3px_0px_0px_rgba(5,150,105,1)] h-full flex flex-col min-h-0">

            {/* BARRE D'ONGLETS DU STOCK MEMPHIS / SÉLECTION MULTI-RESOURCES */}
            <div className="flex border-b-2 border-slate-200 mb-2 text-[10px] font-semibold tracking-tight shrink-0">
              <button
                type="button"
                onClick={() => setSubBacklogTab("tasks")}
                className={`flex-1 py-1 text-center border-b-2 transition-all cursor-pointer ${
                  subBacklogTab === "tasks" ? "border-emerald-600 text-emerald-700 font-black" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                📝 Tâches ({backlogTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setSubBacklogTab("recurring")}
                className={`flex-1 py-1 text-center border-b-2 transition-all cursor-pointer ${
                  subBacklogTab === "recurring" ? "border-emerald-600 text-emerald-700 font-black" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                🔁 Réc. ({db.recurringTasks?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setSubBacklogTab("habits")}
                className={`flex-1 py-1 text-center border-b-2 transition-all cursor-pointer ${
                  subBacklogTab === "habits" ? "border-emerald-600 text-emerald-700 font-black" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                🌿 Habit. ({db.habits?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setSubBacklogTab("preparations")}
                className={`flex-1 py-1 text-center border-b-2 transition-all cursor-pointer ${
                  subBacklogTab === "preparations" ? "border-emerald-600 text-emerald-700 font-black" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                🧘 Routines ({db.preparations?.length || 0})
              </button>
            </div>

            {/* Listes des tâches glissables des tâches globales avec tri réactif */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              
              {/* SÉLECTEUR DE TRI MULTIDIMENSIONNEL (STYLE MEMPHIS ET CONDENSÉ) */}
              <div className="bg-slate-50 border-2 border-emerald-600 p-1.5 rounded-none flex items-center justify-between gap-2 text-xs font-mono shrink-0 mb-2">
                <span className="font-bold flex items-center gap-1.5 text-emerald-950 shrink-0 select-none">
                  <SlidersHorizontal size={12} />
                  Tri :
                </span>
                
                {subBacklogTab === "tasks" && (
                  <select
                    value={taskSort}
                    onChange={(e) => setTaskSort(e.target.value as any)}
                    className="bg-white border-2 border-emerald-600 px-1 py-0.5 rounded-none font-bold text-emerald-900 cursor-pointer outline-none text-[11px]"
                  >
                    <option value="score">🔥 Score de Priorité</option>
                    <option value="urgency">⚡ Urgence Max</option>
                    <option value="importance">🌟 Importance Max</option>
                    <option value="easiness">✨ Facilité Max</option>
                    <option value="mentalLoad">🧠 Charge Mentale</option>
                    <option value="alphabetical">🔤 Nom (A-Z)</option>
                    <option value="createdAt">📅 Récents</option>
                  </select>
                )}

                {subBacklogTab === "recurring" && (
                  <select
                    value={recurringSort}
                    onChange={(e) => setRecurringSort(e.target.value as any)}
                    className="bg-white border-2 border-emerald-600 px-1 py-0.5 rounded-none font-bold text-emerald-900 cursor-pointer outline-none text-[11px]"
                  >
                    <option value="score">🎯 Score d'Importance</option>
                    <option value="alphabetical">🔤 Nom (A-Z)</option>
                    <option value="reward">🪙 Récompense Max</option>
                  </select>
                )}

                {subBacklogTab === "habits" && (
                  <select
                    value={habitSort}
                    onChange={(e) => setHabitSort(e.target.value as any)}
                    className="bg-white border-2 border-emerald-600 px-1 py-0.5 rounded-none font-bold text-emerald-900 cursor-pointer outline-none text-[11px]"
                  >
                    <option value="inactivity">⏳ Inactivité Écoulée</option>
                    <option value="streak">🔥 Série (Streak)</option>
                    <option value="alphabetical">🔤 Nom (A-Z)</option>
                    <option value="reward">🪙 Pièces (Coins)</option>
                  </select>
                )}

                {subBacklogTab === "preparations" && (
                  <select
                    value={prepSort}
                    onChange={(e) => setPrepSort(e.target.value as any)}
                    className="bg-white border-2 border-emerald-600 px-1 py-0.5 rounded-none font-bold text-emerald-900 cursor-pointer outline-none text-[11px]"
                  >
                    <option value="duration">⏱️ Durée de Session</option>
                    <option value="alphabetical">🔤 Nom (A-Z)</option>
                  </select>
                )}
              </div>

              <div className="flex justify-between items-center shrink-0 mb-1.5">
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-wide">
                  {subBacklogTab === "tasks" && "Stock de tâches"}
                  {subBacklogTab === "recurring" && "Stock de récurrentes"}
                  {subBacklogTab === "habits" && "Base d'habitudes"}
                  {subBacklogTab === "preparations" && "Routines"}
                </h4>
                <span className="text-[9px] font-bold text-slate-400">Glisser ou cliquer</span>
              </div>

              {/* CONTENU SELON L'ONGLET CLASSE SÉCURISÉ */}
              {subBacklogTab === "tasks" && (
                sortedBacklogTasks.length === 0 ? (
                  <div className="bg-rose-50/30 p-4 text-center rounded-none text-xs text-emerald-600/70 border-2 border-dashed border-emerald-250 font-mono">
                    Le backlog est vide. Ajoutez de nouvelles tâches !
                  </div>
                ) : (
                  <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                    {sortedBacklogTasks.map((t) => {
                      const isExpanded = expandedBacklogItemId === t.id;
                      const scoreValue = (t.importance ?? 5) + (t.urgency ?? 5) + (t.easiness ?? 5) - (t.mentalLoad ?? 5);
                      
                      return (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => handleDragStartTask(e, t.id, "task")}
                          onDragEnd={handleDragEnd}
                          onClick={() => setExpandedBacklogItemId(isExpanded ? null : t.id)}
                          style={{ boxShadow: "2px 2px 0px 0px #059669" }}
                          className={`border-2 border-emerald-600 p-2.5 rounded-none text-xs text-emerald-950 cursor-grab active:cursor-grabbing hover:scale-[1.01] transition-all bg-white flex flex-col justify-between`}
                        >
                          {/* LIGNE EN-TÊTE COMPACTE */}
                          <div className="flex items-center justify-between gap-1.5 w-full">
                            <div className="flex items-center gap-1.5 min-w-0 select-none">
                              <span className="shrink-0 p-0.5 bg-emerald-50 border border-emerald-300 leading-none flex items-center justify-center text-sm">
                                {t.icon && typeof t.icon === "string" ? t.icon : t.type === "routine" ? "♻️" : (t.type === "event" ? "📅" : "⚡")}
                              </span>
                              <p className="font-mono text-[11px] font-black leading-none uppercase truncate" title={t.title}>
                                {t.title}
                              </p>
                            </div>

                            {/* Badge Priorité ou Temps */}
                            <div className="flex items-center gap-1 shrink-0 select-none">
                              <span className="font-mono text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-400 px-1 py-0.2" title="Durée estimée">
                                ⏱️ {t.durationMinutes}m
                              </span>
                              <span className="font-mono text-[9px] font-black bg-rose-150 text-pink-700 border border-pink-400 px-1 py-0.2" title="Score de priorité cumulé">
                                ⭐ {scoreValue}
                              </span>
                            </div>
                          </div>

                          {/* ACCORDÉON PROGRESSIF AU CLIC */}
                          {isExpanded && (
                            <div 
                              className="mt-2.5 pt-2 border-t border-dashed border-emerald-250 space-y-2 select-text"
                              onClick={(e) => e.stopPropagation()} // Évite de refermer l'accordéon au clic sur les contrôles
                            >
                              {editingItemId === t.id ? (
                                <div className="space-y-2 text-xs font-mono">
                                  <div className="font-extrabold text-[9px] text-emerald-800 uppercase">Modifier la Tâche</div>
                                  <div>
                                    <input
                                      type="text"
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      className="w-full bg-white border border-emerald-400 p-1 text-[11px] font-bold text-emerald-950 outline-none"
                                      placeholder="Titre"
                                    />
                                  </div>
                                  <div>
                                    <textarea
                                      value={editDesc}
                                      onChange={(e) => setEditDesc(e.target.value)}
                                      className="w-full bg-white border border-emerald-400 p-1 text-[11px] h-10 resize-none font-bold text-emerald-950 outline-none"
                                      placeholder="Description"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[9px] font-extrabold text-emerald-850 uppercase block mb-0.5">Durée (Min)</label>
                                      <input
                                        type="number"
                                        value={editDuration}
                                        onChange={(e) => setEditDuration(Number(e.target.value) || 0)}
                                        className="w-full bg-white border border-emerald-400 p-1 text-[11px] font-bold text-emerald-950 outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-extrabold text-emerald-850 uppercase block mb-0.5">Icône (Emoji)</label>
                                      <div className="flex gap-1">
                                        <input
                                          type="text"
                                          maxLength={3}
                                          value={editIcon}
                                          onChange={(e) => setEditIcon(e.target.value)}
                                          className="w-10 bg-white border border-emerald-400 p-1 text-[11px] font-bold text-center outline-none text-emerald-950"
                                        />
                                        <div className="flex gap-0.5 overflow-x-auto py-0.5 max-w-[80px]">
                                          {["📝", "🧘", "♻️", "⚡", "📅", "🔥", "🏋️", "💡", "🧠", "🌱"].map(em => (
                                            <button
                                              key={em}
                                              type="button"
                                              onClick={() => setEditIcon(em)}
                                              className={`text-[10px] p-0.5 border cursor-pointer hover:bg-emerald-100 ${editIcon === em ? 'border-emerald-600 bg-white' : 'border-zinc-250 bg-white/50'}`}
                                            >
                                              {em}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-[9px] font-extrabold text-emerald-850 block mb-0.5">Couleur (directe stock & timeline) :</div>
                                    <div className="flex flex-wrap gap-1">
                                      {TIMELINE_PALETTE.map((bg) => (
                                        <button
                                          key={bg.value}
                                          type="button"
                                          onClick={() => setEditColor(bg.value)}
                                          className={`w-3 h-3 rounded-full border border-black/30 cursor-pointer hover:scale-110 active:scale-95 transition-transform ${
                                            editColor === bg.value ? "ring-2 ring-emerald-600 scale-115" : ""
                                          }`}
                                          style={{ backgroundColor: bg.value || "#ffffff" }}
                                          title={bg.name}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-1 border-t border-slate-100 pt-1.5 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingItemId(null)}
                                      className="px-2 py-0.5 border border-slate-350 bg-white text-slate-800 font-bold hover:bg-slate-50 cursor-pointer text-[10px]"
                                    >
                                      Annuler
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => saveEditingItem(false)}
                                      className="px-2 py-0.5 bg-emerald-600 text-white font-black hover:bg-emerald-700 cursor-pointer text-[10px]"
                                    >
                                      Ok
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {t.description && (
                                    <p className="text-[10px] text-slate-500 italic leading-relaxed whitespace-pre-wrap max-h-16 overflow-y-auto">
                                      {t.description}
                                    </p>
                                  )}

                                  {/* Palette de couleur pour la timeline */}
                                  <div className="flex items-center gap-1.5 text-[9px] font-mono border-t border-dashed border-emerald-100/50 pt-2 pb-1">
                                    <span className="font-bold text-emerald-800">Couleur :</span>
                                    <div className="flex flex-wrap items-center gap-1">
                                      {TIMELINE_PALETTE.map((bg) => (
                                        <button
                                          key={bg.value}
                                          type="button"
                                          onClick={() => {
                                            const updatedTasks = db.tasks.map(item => {
                                              if (item.id === t.id) {
                                                return { ...item, color: bg.value };
                                              }
                                              return item;
                                            });
                                            updateDb({ ...db, tasks: updatedTasks });
                                          }}
                                          className={`w-3.5 h-3.5 rounded-full border border-black/30 cursor-pointer hover:scale-110 active:scale-95 transition-transform ${
                                            (t.color || "") === bg.value ? "ring-2 ring-emerald-600 scale-115" : ""
                                          }`}
                                          style={{ backgroundColor: bg.value || "#ffffff" }}
                                          title={bg.name}
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-emerald-100/50 pt-2 bg-slate-50 -mx-2 px-2 py-1.5">
                                    {/* Planifier Heure Manuellement */}
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                      <span className="font-bold text-emerald-800">Planifier :</span>
                                      <input
                                        type="time"
                                        className="bg-white border-2 border-emerald-400 text-[10px] p-0.5 rounded-none w-16"
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            const updatedTasks = db.tasks.map(item => {
                                              if (item.id === t.id) {
                                                return {
                                                  ...item,
                                                  scheduledTime: e.target.value,
                                                  planningStatus: "scheduled" as const
                                                };
                                              }
                                              return item;
                                            });
                                            updateDb({ ...db, tasks: updatedTasks });
                                            setExpandedBacklogItemId(null);
                                          }
                                        }}
                                      />
                                    </div>

                                    {/* Actions directes */}
                                    <div className="flex items-center gap-1 font-mono">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingItemId(t.id);
                                          setEditTitle(t.title);
                                          setEditDesc(t.description || "");
                                          setEditDuration(t.durationMinutes || 15);
                                          setEditIcon(t.icon && typeof t.icon === "string" ? t.icon : "");
                                          setEditColor(t.color || "");
                                        }}
                                        className="px-1.5 py-0.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-none cursor-pointer"
                                        title="Modifier cette tâche"
                                      >
                                        ✏️ Modifier
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleStartTaskTimer(t.id)}
                                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wider rounded-none flex items-center gap-0.5 cursor-pointer shadow-[1px_1px_0px_#000]"
                                      >
                                        <Play size={8} fill="currentColor" /> Play
                                      </button>

                                      {/* Bouton de Suppression en ligne */}
                                      {deleteConfirmId === t.id ? (
                                        <div className="flex items-center gap-1 bg-white p-0.5 border border-red-500 rounded z-20">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedTasks = db.tasks.map((x) => x.id === t.id ? { ...x, isArchived: true, archivedAt: new Date().toISOString() } : x);
                                              updateDb({ ...db, tasks: updatedTasks });
                                              setDeleteConfirmId(null);
                                            }}
                                            className="text-[9px] bg-sky-400 hover:bg-sky-500 text-black font-black px-1.5 py-0.5 rounded cursor-pointer"
                                            title="Archiver"
                                          >
                                            Archiver
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedTasks = db.tasks.filter((x) => x.id !== t.id);
                                              updateDb({ ...db, tasks: updatedTasks });
                                              setDeleteConfirmId(null);
                                            }}
                                            className="text-[9px] bg-red-600 hover:bg-red-700 text-white font-black px-1.5 py-0.5 rounded cursor-pointer"
                                            title="Supprimer définitivement"
                                          >
                                            Supprimer
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setDeleteConfirmId(null)}
                                            className="text-[9px] bg-slate-100 hover:bg-slate-200 font-black px-1.5 py-0.5 rounded cursor-pointer"
                                          >
                                            X
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setDeleteConfirmId(t.id)}
                                          className="text-rose-500 hover:text-rose-700 border border-rose-300 hover:bg-rose-50 p-1 rounded-none cursor-pointer flex items-center justify-center"
                                          title="Supprimer la tâche de la base"
                                        >
                                          <Trash2 size={10} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {subBacklogTab === "recurring" && (
                (!db.recurringTasks || db.recurringTasks.length === 0) ? (
                  <div className="bg-rose-50/30 p-4 text-center rounded-none text-xs text-emerald-600/70 border-2 border-dashed border-emerald-250 font-mono">
                    Aucune tâche récurrente configurée. Créez-en une dans l'onglet dédié !
                  </div>
                ) : (
                  <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                    {sortedRecurringTasks.map((r) => {
                      const isExpanded = expandedBacklogItemId === r.id;
                      const inactivity = calculateInactivity(r);
                      
                      return (
                        <div
                          key={r.id}
                          draggable
                          onDragStart={(e) => handleDragStartTask(e, r.id, "recurring")}
                          onDragEnd={handleDragEnd}
                          onClick={() => setExpandedBacklogItemId(isExpanded ? null : r.id)}
                          style={{ boxShadow: `2px 2px 0px ${r.color || "#059669"}` }}
                          className={`border-2 border-emerald-600 p-2.5 rounded-none text-xs text-emerald-950 cursor-grab active:cursor-grabbing hover:scale-[1.01] transition-all bg-white flex flex-col justify-between`}
                        >
                          {/* LIGNE EN-TÊTE COMPACTE */}
                          <div className="flex items-center justify-between gap-1.5 w-full">
                            <div className="flex items-center gap-1.5 min-w-0 select-none">
                              <span className="shrink-0 p-0.5 bg-emerald-50 border border-emerald-300 leading-none flex items-center justify-center">
                                🔁
                              </span>
                              <p className="font-mono text-[11px] font-black leading-none uppercase truncate" title={r.title}>
                                {r.title}
                              </p>
                              {inactivity.value !== "Jamais" && (
                                <span className={`text-[8px] font-black font-mono px-1 py-0.2 border shrink-0 ${
                                  inactivity.colorId === "emerald" ? "bg-emerald-100 text-emerald-700 border-emerald-400" :
                                  inactivity.colorId === "yellow" ? "bg-amber-50 text-amber-600 border-amber-300" :
                                  inactivity.colorId === "orange" ? "bg-orange-50 text-orange-600 border-orange-400" :
                                  inactivity.colorId === "rose" ? "bg-rose-50 text-rose-600 border-rose-400" :
                                  inactivity.colorId === "purple" ? "bg-purple-50 text-purple-600 border-purple-400" : "bg-slate-100 text-slate-500 border-slate-300"
                                }`}>
                                  {inactivity.value}
                                </span>
                              )}
                            </div>

                            {/* Score ou récompense */}
                            <div className="flex items-center gap-1 shrink-0 select-none font-mono text-[9px] font-bold">
                              <span className="bg-sky-50 text-sky-700 border border-sky-400 px-1">
                                🎯 {r.baseImportance ?? 7}
                              </span>
                              <span className="bg-amber-50 text-amber-700 border border-amber-400 px-1">
                                🪙 {r.rewardValue || 10}
                              </span>
                            </div>
                          </div>

                          {/* ACCORDÉON PROGRESSIF AU CLIC */}
                          {isExpanded && (
                            <div 
                              className="mt-2.5 pt-2 border-t border-dashed border-emerald-200 space-y-2 select-none font-mono"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="text-[10px] text-slate-500 font-mono">
                                <span className="font-bold">Fréquence :</span> {r.interval === "daily" ? "Quotidien" : r.interval === "weekly" ? "Hebdomadaire" : "Mensuel"}
                              </p>

                              {r.description && (
                                <p className="text-[10px] text-slate-500 italic leading-relaxed whitespace-pre-wrap max-h-16 overflow-y-auto">
                                  {r.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-emerald-100/50 pt-2 bg-slate-50 -mx-2 px-2 py-1.5">
                                {/* Planifier l'apparition en tâche de la timeline */}
                                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                  <span className="font-bold text-emerald-800">Planifier :</span>
                                  <input
                                    type="time"
                                    className="bg-white border-2 border-emerald-400 text-[10px] p-0.5 rounded-none w-16"
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        const newTask: Task = {
                                          id: `recurring-planned-${Date.now()}`,
                                          title: `🔁 ${r.title}`,
                                          description: `Planification récurrente : ${r.description || ""}`,
                                          createdAt: new Date().toISOString(),
                                          isCompleted: false,
                                          importance: r.baseImportance || 7,
                                          urgency: r.baseUrgency || 6,
                                          easiness: 6,
                                          mentalLoad: 3,
                                          score: (r.baseImportance || 7) + (r.baseUrgency || 6) - 3,
                                          isStarred: false,
                                          durationMinutes: 45,
                                          timeSpentSeconds: 0,
                                          rewardValue: 30,
                                          chronoRewardValue: 1,
                                          dependencies: [],
                                          scheduledTime: e.target.value,
                                          type: "routine",
                                          planningStatus: "scheduled" as const,
                                          accumulatedTime: 0,
                                          isPaused: false
                                        };
                                        updateDb({ ...db, tasks: [...db.tasks, newTask] });
                                        setTemplateStatus("Routine déclinée en tâche planifiée ! ✓");
                                        setTimeout(() => setTemplateStatus(null), 4000);
                                        setExpandedBacklogItemId(null);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {subBacklogTab === "habits" && (
                (!db.habits || db.habits.length === 0) ? (
                  <div className="bg-rose-50/30 p-4 text-center rounded-none text-xs text-emerald-600/70 border-2 border-dashed border-emerald-250 font-mono">
                    Aucune habitude configurée.
                  </div>
                ) : (
                  <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                    {sortedHabits.map((h) => {
                      const isExpanded = expandedBacklogItemId === h.id;
                      const inactivity = calculateInactivity(h);
                      
                      return (
                        <div
                          key={h.id}
                          draggable
                          onDragStart={(e) => handleDragStartTask(e, h.id, "habit")}
                          onDragEnd={handleDragEnd}
                          onClick={() => setExpandedBacklogItemId(isExpanded ? null : h.id)}
                          style={{ boxShadow: `2px 2px 0px ${h.color || "#059669"}` }}
                          className={`border-2 border-emerald-600 p-2.5 rounded-none text-xs text-emerald-950 cursor-grab active:cursor-grabbing hover:scale-[1.01] transition-all bg-white flex flex-col justify-between`}
                        >
                          {/* LIGNE EN-TÊTE COMPACTE */}
                          <div className="flex items-center justify-between gap-1.5 w-full">
                            <div className="flex items-center gap-1.5 min-w-0 select-none">
                              <span className="shrink-0 p-0.5 bg-emerald-50 border border-emerald-300 leading-none flex items-center justify-center">
                                🌿
                              </span>
                              <p className="font-mono text-[11px] font-black leading-none uppercase truncate" title={h.title}>
                                {h.title}
                              </p>
                              <span className={`text-[8px] font-black font-mono px-1 py-0.2 border shrink-0 ${
                                inactivity.colorId === "emerald" ? "bg-emerald-100 text-emerald-700 border-emerald-400" :
                                inactivity.colorId === "yellow" ? "bg-amber-50 text-amber-600 border-amber-300" :
                                inactivity.colorId === "orange" ? "bg-orange-50 text-orange-600 border-orange-400" :
                                inactivity.colorId === "rose" ? "bg-rose-50 text-rose-600 border-rose-400" :
                                inactivity.colorId === "purple" ? "bg-purple-50 text-purple-600 border-purple-400" : "bg-slate-100 text-slate-500 border-slate-300"
                              }`}>
                                {inactivity.value}
                              </span>
                            </div>

                            {/* Streak ou Coins */}
                            <div className="flex items-center gap-1 shrink-0 select-none font-mono text-[9px] font-bold">
                              <span className="bg-orange-50 text-orange-600 border border-orange-400 px-1">
                                🔥 {h.streak || 0}
                              </span>
                              <span className="bg-amber-50 text-amber-700 border border-amber-400 px-1">
                                🪙 {h.rewardValue || 15}
                              </span>
                            </div>
                          </div>

                          {/* ACCORDÉON PROGRESSIF AU CLIC */}
                          {isExpanded && (
                            <div 
                              className="mt-2.5 pt-2 border-t border-dashed border-emerald-200 space-y-2 select-none font-mono"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {h.description && (
                                <p className="text-[10px] text-slate-500 italic leading-relaxed whitespace-pre-wrap max-h-16 overflow-y-auto">
                                  {h.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-emerald-100/50 pt-2 bg-slate-50 -mx-2 px-2 py-1.5">
                                {/* Planifier l'habitude sur la timeline */}
                                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                  <span className="font-bold text-emerald-800">Planifier :</span>
                                  <input
                                    type="time"
                                    className="bg-white border-2 border-emerald-400 text-[10px] p-0.5 rounded-none w-16"
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        const newTask: Task = {
                                          id: `habit-planned-${Date.now()}`,
                                          title: `🌿 ${h.title}`,
                                          description: `Routine d'Habitude Personnelle : ${h.description || ""}`,
                                          createdAt: new Date().toISOString(),
                                          isCompleted: false,
                                          importance: 7,
                                          urgency: 4,
                                          easiness: 8,
                                          mentalLoad: 1,
                                          score: 18,
                                          isStarred: false,
                                          durationMinutes: h.type === "chrono" ? (h.targetValue || 20) : 20,
                                          timeSpentSeconds: 0,
                                          rewardValue: h.rewardValue || 15,
                                          chronoRewardValue: 1,
                                          dependencies: [],
                                          scheduledTime: e.target.value,
                                          type: "routine",
                                          planningStatus: "scheduled" as const,
                                          accumulatedTime: 0,
                                          isPaused: false
                                        };
                                        updateDb({ ...db, tasks: [...db.tasks, newTask] });
                                        setTemplateStatus("Habitude déclinée en tâche planifiée ! ✓");
                                        setTimeout(() => setTemplateStatus(null), 4500);
                                        setExpandedBacklogItemId(null);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {subBacklogTab === "preparations" && (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  {/* Formulaire de création de Routine */}
                  <div className="shrink-0 mb-1.5">
                  {showAddPrepForm ? (
                    <form onSubmit={handleAddPreparation} className="bg-emerald-50/50 border-2 border-emerald-600 p-2.5 space-y-2 text-xs font-mono">
                      <div className="font-extrabold text-[10px] text-emerald-950 uppercase">Nouvelle Routine</div>
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Nom de la routine"
                          value={newPrepTitle}
                          onChange={(e) => setNewPrepTitle(e.target.value)}
                          className="w-full bg-white border border-emerald-400 p-1 text-[11px] font-bold text-emerald-950 placeholder:text-slate-400 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="number"
                            min={1}
                            required
                            placeholder="Durée (min)"
                            value={newPrepDuration || ""}
                            onChange={(e) => setNewPrepDuration(Number(e.target.value))}
                            className="w-full bg-white border border-emerald-400 p-1 text-[11px] font-bold text-emerald-950 outline-none"
                          />
                        </div>
                        <div className="flex items-center text-[10px] text-slate-500 font-bold">
                          minutes
                        </div>
                      </div>
                      <div>
                        <textarea
                          placeholder="Description optionnelle"
                          value={newPrepDesc}
                          onChange={(e) => setNewPrepDesc(e.target.value)}
                          className="w-full bg-white border border-emerald-400 p-1 text-[11px] h-10 resize-none font-bold text-emerald-950 placeholder:text-slate-400 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-extrabold text-emerald-800">Couleur (directe stock & timeline) :</div>
                        <div className="flex flex-wrap gap-1">
                          {TIMELINE_PALETTE.map((bg) => (
                            <button
                              key={bg.value}
                              type="button"
                              onClick={() => setNewPrepColor(bg.value)}
                              className={`w-3.5 h-3.5 rounded-full border border-black/30 cursor-pointer hover:scale-110 active:scale-95 transition-transform ${
                                newPrepColor === bg.value ? "ring-2 ring-emerald-600 scale-115" : ""
                              }`}
                              style={{ backgroundColor: bg.value || "#ffffff" }}
                              title={bg.name}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddPrepForm(false);
                            setNewPrepTitle("");
                            setNewPrepDesc("");
                            setNewPrepDuration(15);
                          }}
                          className="px-2 py-0.5 border border-slate-300 bg-white text-slate-650 cursor-pointer text-[10px] font-semibold"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="px-2 py-0.5 bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer text-[10px] font-black"
                        >
                          Ajouter
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowAddPrepForm(true)}
                      className="w-full py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-2 border-dashed border-emerald-600 text-[10px] font-black uppercase transition-all tracking-widest text-center cursor-pointer"
                    >
                      ➕ Créer une Routine
                    </button>
                  )}
                  </div>

                  {(!db.preparations || db.preparations.length === 0) ? (
                    <div className="bg-rose-50/30 p-4 text-center rounded-none text-xs text-emerald-600/70 border-2 border-dashed border-emerald-250 font-mono">
                      Aucune routine disponible.
                    </div>
                  ) : (
                    <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                      {sortedPreparations.map((p) => {
                        const isExpanded = expandedBacklogItemId === p.id;
                        
                        return (
                          <div
                            key={p.id}
                            draggable
                            onDragStart={(e) => handleDragStartTask(e, p.id, "preparation")}
                            onDragEnd={handleDragEnd}
                            onClick={() => setExpandedBacklogItemId(isExpanded ? null : p.id)}
                            style={{ boxShadow: "2px 2px 0px 0px #059669", backgroundColor: p.color || "#ffffff" }}
                            className={`border-2 border-emerald-600 p-2.5 rounded-none text-xs text-emerald-950 cursor-grab active:cursor-grabbing hover:scale-[1.01] transition-all flex flex-col justify-between`}
                          >
                            {/* LIGNE EN-TÊTE COMPACTE */}
                            <div className="flex items-center justify-between gap-1.5 w-full">
                              <div className="flex items-center gap-1.5 min-w-0 select-none">
                                <span className="shrink-0 p-0.5 bg-emerald-50 border border-emerald-300 leading-none flex items-center justify-center text-sm">
                                  {p.icon || "🧘"}
                                </span>
                                <p className="font-mono text-[11px] font-black leading-none uppercase truncate" title={p.title}>
                                  {p.title}
                                </p>
                              </div>

                              {/* Durée */}
                              <div className="flex items-center gap-1 shrink-0 select-none font-mono text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-400 px-1">
                                ⏱️ {p.durationMinutes || 15} min
                              </div>
                            </div>

                            {/* ACCORDÉON PROGRESSIF AU CLIC */}
                            {isExpanded && (
                              <div 
                                className="mt-2.5 pt-2 border-t border-dashed border-emerald-200 space-y-2 select-text"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {editingItemId === p.id ? (
                                  <div className="space-y-2 text-xs font-mono">
                                    <div className="font-extrabold text-[9px] text-emerald-800 uppercase">Modifier la Routine</div>
                                    <div>
                                      <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full bg-white border border-emerald-400 p-1 text-[11px] font-bold text-emerald-950 outline-none"
                                        placeholder="Titre de la routine"
                                      />
                                    </div>
                                    <div>
                                      <textarea
                                        value={editDesc}
                                        onChange={(e) => setEditDesc(e.target.value)}
                                        className="w-full bg-white border border-emerald-400 p-1 text-[11px] h-10 resize-none font-bold text-emerald-950 outline-none"
                                        placeholder="Description de la routine"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-[9px] font-extrabold text-emerald-850 uppercase block mb-0.5">Durée (Min)</label>
                                        <input
                                          type="number"
                                          value={editDuration}
                                          onChange={(e) => setEditDuration(Number(e.target.value) || 0)}
                                          className="w-full bg-white border border-emerald-400 p-1 text-[11px] font-bold text-emerald-950 outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[9px] font-extrabold text-emerald-850 uppercase block mb-0.5">Icône (Emoji)</label>
                                        <div className="flex gap-1">
                                          <input
                                            type="text"
                                            maxLength={3}
                                            value={editIcon}
                                            onChange={(e) => setEditIcon(e.target.value)}
                                            className="w-10 bg-white border border-emerald-400 p-1 text-[11px] font-bold text-center outline-none text-emerald-950"
                                          />
                                          <div className="flex gap-0.5 overflow-x-auto py-0.5 max-w-[80px]">
                                            {["📝", "🧘", "♻️", "⚡", "📅", "🔥", "🏋️", "💡", "🧠", "🌱"].map(em => (
                                              <button
                                                key={em}
                                                type="button"
                                                onClick={() => setEditIcon(em)}
                                                className={`text-[10px] p-0.5 border cursor-pointer hover:bg-emerald-100 ${editIcon === em ? 'border-emerald-600 bg-white' : 'border-zinc-250 bg-white/50'}`}
                                              >
                                                {em}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-[9px] font-extrabold text-emerald-850 block mb-0.5">Couleur (directe stock & timeline) :</div>
                                      <div className="flex flex-wrap gap-1">
                                        {TIMELINE_PALETTE.map((bg) => (
                                          <button
                                            key={bg.value}
                                            type="button"
                                            onClick={() => setEditColor(bg.value)}
                                            className={`w-3 h-3 rounded-full border border-black/30 cursor-pointer hover:scale-110 active:scale-95 transition-transform ${
                                              editColor === bg.value ? "ring-2 ring-emerald-600 scale-115" : ""
                                            }`}
                                            style={{ backgroundColor: bg.value || "#ffffff" }}
                                            title={bg.name}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex justify-end gap-1 border-t border-slate-100 pt-1.5 mt-1">
                                      <button
                                        type="button"
                                        onClick={() => setEditingItemId(null)}
                                        className="px-2 py-0.5 border border-slate-350 bg-white text-slate-800 font-bold hover:bg-slate-50 cursor-pointer text-[10px]"
                                      >
                                        Annuler
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => saveEditingItem(true)}
                                        className="px-2 py-0.5 bg-emerald-600 text-white font-black hover:bg-emerald-700 cursor-pointer text-[10px]"
                                      >
                                        Ok
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {p.description && (
                                      <p className="text-[10px] text-slate-500 italic leading-relaxed whitespace-pre-wrap max-h-16 overflow-y-auto font-mono">
                                        {p.description}
                                      </p>
                                    )}

                                    {/* Palette de couleur pour la routine */}
                                    <div className="flex items-center gap-1.5 text-[9px] font-mono border-t border-dashed border-emerald-100/50 pt-2 pb-1">
                                      <span className="font-bold text-emerald-800">Couleur :</span>
                                      <div className="flex flex-wrap items-center gap-1">
                                        {TIMELINE_PALETTE.map((bg) => (
                                          <button
                                            key={bg.value}
                                            type="button"
                                            onClick={() => {
                                              const updatedPreps = (db.preparations || []).map(item => {
                                                if (item.id === p.id) {
                                                  return { ...item, color: bg.value };
                                                }
                                                return item;
                                              });
                                              updateDb({ ...db, preparations: updatedPreps });
                                            }}
                                            className={`w-3.5 h-3.5 rounded-full border border-black/30 cursor-pointer hover:scale-110 active:scale-95 transition-transform ${
                                              (p.color || "") === bg.value ? "ring-2 ring-emerald-600 scale-115" : ""
                                            }`}
                                            style={{ backgroundColor: bg.value || "#ffffff" }}
                                            title={bg.name}
                                          />
                                        ))}
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-1 border-t border-emerald-100/50 pt-2 bg-slate-50 -mx-2 px-2 py-1.5 font-mono">
                                      {/* Planifier la routine sur la timeline */}
                                      <div className="flex items-center gap-1 text-[10px]">
                                        <span className="font-bold text-emerald-800 font-mono">Planifier :</span>
                                        <input
                                          type="time"
                                          className="bg-white border-2 border-emerald-400 text-[10px] p-0.5 rounded-none w-16"
                                          onChange={(e) => {
                                            if (e.target.value) {
                                              const newTask: Task = {
                                                id: `prep-planned-${Date.now()}`,
                                                title: p.title,
                                                description: p.description || "",
                                                createdAt: new Date().toISOString(),
                                                isCompleted: false,
                                                importance: 6,
                                                urgency: 5,
                                                easiness: 9,
                                                mentalLoad: 1,
                                                score: 19,
                                                isStarred: false,
                                                color: p.color || "", // On propage la couleur ici
                                                icon: p.icon || "🧘", // On propage l'icône ici
                                                durationMinutes: p.durationMinutes || 15,
                                                timeSpentSeconds: 0,
                                                rewardValue: 15,
                                                chronoRewardValue: 1,
                                                dependencies: [],
                                                scheduledTime: e.target.value,
                                                type: "routine",
                                                planningStatus: "scheduled" as const,
                                                accumulatedTime: 0,
                                                isPaused: false
                                              };
                                              updateDb({ ...db, tasks: [...db.tasks, newTask] });
                                              setTemplateStatus("Routine déclinée en tâche planifiée ! ✓");
                                              setTimeout(() => setTemplateStatus(null), 4000);
                                              setExpandedBacklogItemId(null);
                                            }
                                          }}
                                        />
                                      </div>

                                      {/* Bouton de Suppression de la Routine */}
                                      <div className="flex items-center gap-1 text-[10px]">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingItemId(p.id);
                                            setEditTitle(p.title);
                                            setEditDesc(p.description || "");
                                            setEditDuration(p.durationMinutes || 15);
                                            setEditIcon(p.icon || "🧘");
                                            setEditColor(p.color || "");
                                          }}
                                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[9px] border border-amber-300 px-1.5 py-0.5 cursor-pointer rounded-none uppercase flex items-center justify-center font-mono leading-none"
                                          title="Modifier cette routine"
                                        >
                                          ✏️ Modifier
                                        </button>

                                        {deletePrepConfirmId === p.id ? (
                                          <div className="flex items-center gap-1 bg-red-50 p-1 border border-red-350 z-20">
                                            <span className="font-black text-red-700 text-[8px] uppercase">Suppr ?</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updatedPreps = (db.preparations || []).filter(item => item.id !== p.id);
                                                updateDb({ ...db, preparations: updatedPreps });
                                                setDeletePrepConfirmId(null);
                                                setTemplateStatus("Routine supprimée ✓");
                                                setTimeout(() => setTemplateStatus(null), 3500);
                                              }}
                                              className="bg-red-600 hover:bg-red-700 text-white font-black px-1.5 py-0.5 rounded-none text-[8px] cursor-pointer border-none"
                                            >
                                              Oui
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setDeletePrepConfirmId(null)}
                                              className="bg-white hover:bg-gray-100 text-slate-800 font-bold px-1.5 py-0.5 rounded-none text-[8px] border border-slate-350 cursor-pointer"
                                            >
                                              Non
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => setDeletePrepConfirmId(p.id)}
                                            className="text-red-650 hover:text-white hover:bg-red-600 text-[9px] font-black border border-red-350 px-1.5 py-0.5 cursor-pointer rounded-none bg-white font-mono"
                                          >
                                            Supprimer
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BARRES D'ACTIONS RAPIDES ET CONFIGURATION DÉPLACÉES EN BAS DE L'ONGLET */}
            <div className="mt-5 pt-4 border-t-2 border-emerald-150 flex flex-col gap-1.5 font-mono text-[10px]">
              <button
                onClick={() => setIsRappelsEnabled(!isRappelsEnabled)}
                className={`py-1 border border-emerald-600 text-[9px] font-extrabold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isRappelsEnabled ? "bg-emerald-100 text-emerald-850" : "bg-rose-100 text-rose-850"
                }`}
                title="Recevoir un rappel synchrone d'observance"
              >
                <Bell size={11} fill={isRappelsEnabled ? "currentColor" : "none"} />
                {isRappelsEnabled ? "Rappels : Actifs" : "Rappels : Coupés"}
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={handleSaveCurrentAsTemplate}
                  className="py-1 bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-400 text-[9px] font-black rounded flex items-center justify-center gap-0.5 transition-colors cursor-pointer"
                  title="Sauvegarder l'organisation actuelle comme journée type"
                >
                  💾 Enregistrer
                </button>

                <button
                  onClick={handleLoadCustomTemplate}
                  className="py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-400 text-[9px] font-black rounded flex items-center justify-center gap-0.5 transition-colors cursor-pointer"
                  title="Charger votre planning mémorisé ou la démo"
                >
                  💻 Charger {(db.aiMemories || []).some(m => m.key === "custom_day_template") ? "★" : ""}
                </button>
              </div>

              {showClearConfirm ? (
                <div className="flex items-center justify-center gap-1.5 bg-rose-100 p-1 border border-rose-500 rounded text-[9px]">
                  <span className="font-bold text-rose-800 uppercase">Vider?</span>
                  <button
                    onClick={handleClearAll}
                    className="bg-rose-600 text-white font-extrabold py-0.5 px-2 text-[8px] rounded cursor-pointer"
                  >
                    Oui
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="bg-white hover:bg-gray-100 text-gray-700 font-extrabold py-0.5 px-2 text-[8px] rounded border border-gray-300 cursor-pointer"
                  >
                    Non
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-400 text-[9px] font-extrabold rounded flex items-center justify-center cursor-pointer transition-colors"
                  title="Déprogrammer l'intégralité de la timeline"
                >
                  Vider l'Agenda
                </button>
              )}

              {templateStatus && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[9px] font-bold py-0.5 text-center rounded animate-pulse">
                  {templateStatus}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =======================================
            COLONNE DROITE (2/3 de la largeur) : GRAPHE HORAIRE
           ======================================= */}
        <div className="col-span-2 h-full min-h-0 flex flex-col">
          
          {/* RENDU TIMELINE */}
          <div className="bg-white border-2 border-emerald-600 p-2.5 rounded shadow-[3px_3px_0px_0px_rgba(5,150,105,1)] h-full flex flex-col min-h-0">
              <div className="flex flex-wrap justify-between items-center border-b border-emerald-100 pb-1.5 mb-2 gap-2 shrink-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-serif font-black text-sm text-emerald-800 uppercase flex items-center gap-1.5">
                    🕒 CADENCE ({isMorningExpanded ? "04H00" : "11H00"} - {isEveningExpanded ? "04H00" : "19H00"})
                  </span>
                  
                  {/* Boutons d'extension de plage horaire */}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsMorningExpanded(!isMorningExpanded)}
                      style={{ boxShadow: isMorningExpanded ? "none" : "1.5px 1.5px 0px 0px rgba(5,150,105,1)" }}
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold border-2 transition-all cursor-pointer ${
                        isMorningExpanded 
                          ? "bg-emerald-600 text-white border-emerald-700 translate-x-[0.5px] translate-y-[0.5px]" 
                          : "bg-white text-emerald-800 border-emerald-600 hover:bg-emerald-50"
                      }`}
                      title={isMorningExpanded ? "Masquer la plage du matin" : "Développer la plage du matin (04h00-11h00)"}
                    >
                      ☀️ Matin
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEveningExpanded(!isEveningExpanded)}
                      style={{ boxShadow: isEveningExpanded ? "none" : "1.5px 1.5px 0px 0px rgba(5,150,105,1)" }}
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold border-2 transition-all cursor-pointer ${
                        isEveningExpanded 
                          ? "bg-emerald-600 text-white border-emerald-700 translate-x-[0.5px] translate-y-[0.5px]" 
                          : "bg-white text-emerald-800 border-emerald-600 hover:bg-emerald-50"
                      }`}
                      title={isEveningExpanded ? "Masquer la plage du soir" : "Développer la plage du soir (19h00-04h00)"}
                    >
                      🌙 Soir
                    </button>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 border-2 border-emerald-600 px-2.5 py-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  {currentTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {/* CONTENEUR DE DÉFILEMENT LOCAL DE LA TIMELINE */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative pr-1">
                {/* TIMELINE DROPPABLE AVEC POSITION DYNAMIQUE PRECISE */}
                <div 
                  ref={timelineContainerRef}
                  onDragOver={handleDragOverTimeline}
                  onDragLeave={handleDragLeaveTimeline}
                  onDrop={handleDropTimeline}
                  className="relative border-l-4 border-emerald-600 ml-16 select-none bg-emerald-50/10 min-h-[500px]" 
                  style={{ height: `${totalHours * hourHeight}px` }}
                >
                
                {/* ZONE DE ZOOM INTERACTIVE SUR LES HEURES (ORDONNÉES À GAUCHE) */}
                <div
                  ref={zoomZoneRef}
                  className="absolute -left-16 top-0 bottom-0 w-16 cursor-ns-resize group/zoom flex flex-col items-center justify-start z-20"
                  title="Faites défiler la molette de souris ici pour zoomer ou dézoomer la timeline !"
                >
                  <div className="absolute top-2 pointer-events-none bg-emerald-600 border border-emerald-500 text-white font-mono text-[8px] px-1.5 py-0.5 rounded-none opacity-0 group-hover/zoom:opacity-100 transition-opacity whitespace-nowrap shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                    🔍 MOLETTE = ZOOM
                  </div>
                </div>

                {/* LIGNES ET LABELS HORAIRES */}
                {Array.from({ length: totalHours + 1 }, (_, i) => {
                  const hourLabelVal = startHour + i;
                  const topOffsetY = i * hourHeight;
                  return (
                    <div
                      key={hourLabelVal}
                      className="absolute left-0 right-0 border-b border-dashed border-emerald-200/50 flex items-center"
                      style={{ top: `${topOffsetY}px`, height: "1px" }}
                    >
                      {/* Label vertical externe gauche */}
                      <span className="absolute -left-16 font-mono font-black text-[11px] text-emerald-800 w-12 text-right">
                        {(hourLabelVal % 24).toString().padStart(2, "0")}:00
                      </span>
                    </div>
                  );
                })}

                {/* VISU : LIGNE VIRTUELLE DU GUIDE DE PREVIEW AU GLISSAGE (Drag & Drop fignolé !) */}
                {dragOverTop !== null && (
                  <div
                    className="absolute left-0 right-0 h-[2px] bg-emerald-400 border-t border-dashed border-white pointer-events-none z-10 animate-pulse"
                    style={{ top: `${dragOverTop}px` }}
                  >
                    <span className="absolute left-4 -top-5 bg-emerald-600 text-white font-mono text-[9px] px-1 py-0.2 rounded border border-emerald-500 shadow">
                      Insérer ici (à{" "}
                      {(() => {
                        const ratio = dragOverTop / (totalHours * hourHeight);
                        const mins = ratio * (totalHours * 60);
                        const finalM = startHour * 60 + mins;
                        const h = Math.floor(finalM / 60);
                        const m = Math.floor(finalM % 60);
                        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                      })()}
                      )
                    </span>
                  </div>
                )}

                {/* LES BLOCS REPRESENTATIFS DES TACHES PROGRAMMÉES */}
                {scheduledTasks.map((t) => {
                  const { top, height, isValid } = parsePositionAndHeight(t);
                  if (!isValid) return null;

                  const isShared = !!t.isSharedEvent;
                  // Couleur de fond par défaut ou selon Google colorId et couleur personnalisée
                  let eventBgColor = t.color || (t.type === "routine" ? "#fef3c7" : (t.type === "event" ? "#ffedd5" : "#fce7f3"));
                  if (isShared) {
                    const googleCol = GOOGLE_COLORS.find(c => c.id === t.googleColorId);
                    eventBgColor = googleCol ? googleCol.hex : "#f3e8ff"; // Fallback violet clair pour partagé
                  } else if (t.googleColorId) {
                    const googleCol = GOOGLE_COLORS.find(c => c.id === t.googleColorId);
                    if (googleCol) eventBgColor = googleCol.hex;
                  }

                  const [sh, sm] = (t.scheduledTime || "11:00").split(":").map(Number);
                  const totalStartMinutes = sh * 60 + sm;
                  const totalEndMinutes = totalStartMinutes + (t.durationMinutes || 30);
                  const eh = Math.floor(totalEndMinutes / 60) % 24;
                  const em = totalEndMinutes % 60;
                  const endTimeStr = `${eh.toString().padStart(2, "0")}:${em.toString().padStart(2, "0")}`;

                  const isDraggingPreview = !!t.isDraggingPreview;
                  const isCurrentlyMoving = !isShared && timelineMoveState?.taskId === t.id;
                  const isCurrentlyResizing = !isShared && resizeState?.taskId === t.id;

                  return (
                    <div
                      key={t.id}
                      draggable={false}
                      onMouseDown={(e) => {
                        if (isShared || hoveredHandle || resizeState || isDraggingPreview) return;
                        // Ne pas interférer avec le sélecteur de couleur ou les boutons interactifs
                        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('textarea')) {
                          return;
                        }
                        const [h, m] = (t.scheduledTime || "11:00").split(":").map(Number);
                        setTimelineMoveState({
                          taskId: t.id,
                          startY: e.clientY,
                          originalScheduledTime: t.scheduledTime || "11:00",
                          originalStartMinutes: h * 60 + m
                        });
                      }}
                      className={`absolute border-2 p-2 flex flex-col justify-center rounded-none group tracking-wide leading-tight ${
                        isDraggingPreview
                          ? "border-dashed border-emerald-500 bg-emerald-50/50 opacity-60 z-40 shadow-none scale-[0.99]"
                          : isCurrentlyMoving || isCurrentlyResizing
                            ? "border-emerald-600 shadow-[3px_3px_0px_0px_rgba(5,150,105,1)] z-35 scale-[1.01] ring-2 ring-emerald-500/50"
                            : isShared 
                              ? "border-purple-600 bg-purple-50 shadow-[2px_2px_0px_0px_rgba(168,85,247,1)] hover:shadow-[3px_3px_0px_0px_rgba(168,85,247,1)] cursor-default" 
                              : "border-emerald-600 shadow-[2px_2px_0px_0px_rgba(5,150,105,1)] hover:shadow-[3px_3px_0px_0px_rgba(5,150,105,1)]"
                      } ${
                        !isShared && !isDraggingPreview 
                          ? isCurrentlyMoving || isCurrentlyResizing ? "cursor-grabbing" : "cursor-grab" 
                          : "cursor-default"
                      }`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: scheduledPositions[t.id]?.left || "4px",
                        width: scheduledPositions[t.id]?.width || "calc(100% - 8px)",
                        backgroundColor: eventBgColor
                      }}
                    >
                      {/* COLOR PICKER OVERLAY IN-LINE */}
                      {!isShared && colorPickerTaskId === t.id && (
                        <div 
                          className="absolute inset-0 bg-white/95 border border-emerald-600 flex items-center justify-between px-2 py-1 z-30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1 overflow-x-auto select-none py-1">
                            {TIMELINE_PALETTE.map((bg) => (
                              <button
                                key={bg.value}
                                type="button"
                                onClick={() => {
                                  const updatedTasks = db.tasks.map(item => {
                                    if (item.id === t.id) {
                                      return { ...item, color: bg.value };
                                    }
                                    return item;
                                  });
                                  updateDb({ ...db, tasks: updatedTasks });
                                  setColorPickerTaskId(null);
                                }}
                                className={`w-3.5 h-3.5 rounded-full border border-black/30 cursor-pointer hover:scale-110 active:scale-95 transition-transform shrink-0 ${
                                  (t.color || "") === bg.value ? "ring-2 ring-emerald-600" : ""
                                }`}
                                style={{ backgroundColor: bg.value || "#ffffff" }}
                                title={bg.name}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setColorPickerTaskId(null)}
                            className="text-[9px] font-bold text-slate-550 hover:text-black font-mono border border-slate-350 px-1 py-0.5 bg-white cursor-pointer select-none"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* Handle Supérieur de Redimensionnement - désactivé pour partagé */}
                      {!isShared && (
                        <div
                          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize bg-black/5 hover:bg-black/20 z-10 flex items-center justify-center transition-colors"
                          title="Étirer l'heure de début de la tâche (par tranche de 5 min)"
                          onMouseEnter={() => setHoveredHandle(true)}
                          onMouseLeave={() => setHoveredHandle(false)}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setResizeState({
                              taskId: t.id,
                              direction: "top",
                              startY: e.clientY,
                              originalScheduledTime: t.scheduledTime || "11:00",
                              originalDuration: t.durationMinutes || 30
                            });
                          }}
                        >
                          <div className="w-8 h-[1px] bg-black/30 rounded"></div>
                        </div>
                      )}

                      {/* CONTENU DE LA TÂCHE (CADRANT) */}
                      <div className="flex justify-between items-center h-full min-w-0 select-none px-1 overflow-hidden">
                        <div className="flex items-center gap-1.5 min-w-0 leading-tight">
                          <span className="shrink-0 leading-none text-sm select-none">
                            {t.icon && typeof t.icon === "string" ? t.icon : t.type === "routine" ? "♻️" : (t.type === "event" ? "📅" : "⚡")}
                          </span>
                          <div className="flex flex-col justify-center min-w-0">
                            <h5 className="font-mono font-bold text-[11px] md:text-xs truncate text-emerald-950 uppercase leading-none">
                              {t.title}
                            </h5>
                            {height >= 38 && (
                              <div className="flex items-center gap-1.5 font-mono text-[9px] text-emerald-850 font-bold mt-0.5">
                                <span>{t.scheduledTime} - {endTimeStr}</span>
                                <span className="opacity-50">|</span>
                                <span>{t.durationMinutes}m</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions à la volée */}
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          {isShared ? (
                            <span className="font-mono text-[9px] font-black text-purple-700 bg-purple-100 border border-purple-400 px-1 py-0.2">
                              Partagé
                            </span>
                          ) : (
                            <>
                              {t.planningStatus === "scheduled" && height >= 35 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartTaskTimer(t.id);
                                  }}
                                  className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-wider rounded-none cursor-pointer flex items-center gap-0.5 shadow-[1px_1px_0px_#000]"
                                  title="Lancer le chronomètre actif"
                                >
                                  <Play size={8} fill="currentColor" /> Play
                                </button>
                              )}

                              {t.planningStatus === "in-progress" && (
                                <span className="bg-red-500 text-white font-mono text-[8px] px-1 py-0.5 rounded-none font-black animate-pulse leading-none">
                                  CHRONO
                                </span>
                              )}

                              {height >= 35 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setColorPickerTaskId(colorPickerTaskId === t.id ? null : t.id);
                                  }}
                                  className="bg-white hover:bg-cyan-50 text-[10px] text-cyan-600 font-bold border border-cyan-300 px-1.5 py-0.5 rounded-none cursor-pointer"
                                  title="Attribuer une couleur"
                                >
                                  🎨
                                </button>
                              )}

                              {height >= 35 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveTaskSchedule(t.id);
                                  }}
                                  className="bg-white hover:bg-rose-50 text-[10px] text-rose-600 font-bold border border-rose-300 px-1.5 py-0.5 rounded-none cursor-pointer"
                                  title="Renvoyer au Panier/Stock"
                                >
                                  Délier
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* BULLE D'INFORMATIONS COMPLÈTES AU SURVOL (TOOLTIP) */}
                      <div className="absolute left-1/2 bottom-full -translate-x-1/2 bg-slate-900 text-white text-xs p-2.5 rounded-none border-2 border-black z-30 shadow-[3px_3px_0px_#000] pointer-events-none opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 flex flex-col gap-1 w-60 select-none font-mono mb-2">
                        <div className="font-extrabold uppercase text-[10px] text-emerald-400 border-b border-dashed border-emerald-500/30 pb-1 mb-0.5">
                          ✨ INFO TIMELINE
                        </div>
                        <div className="font-bold truncate text-[11px] uppercase text-slate-100 flex items-center gap-1">
                          <span className="shrink-0">{t.icon && typeof t.icon === "string" ? t.icon : t.type === "routine" ? "♻️" : (t.type === "event" ? "📅" : "⚡")}</span>
                          <span className="truncate">{t.title}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] mt-0.5 text-slate-300">
                          <div>⏱️ Début :</div>
                          <div className="font-black text-right text-white">{t.scheduledTime}</div>
                          <div>🔔 Fin :</div>
                          <div className="font-black text-right text-white">{endTimeStr}</div>
                          <div>⏳ Durée :</div>
                          <div className="font-black text-right text-white">{t.durationMinutes} min</div>
                        </div>
                        {t.description && (
                          <div className="text-[9px] text-slate-400 italic border-t border-slate-700/50 pt-1.5 mt-1">
                            {t.description}
                          </div>
                        )}
                      </div>

                      {/* Handle Inférieur de Redimensionnement - désactivé pour partagé */}
                      {!isShared && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-black/5 hover:bg-black/20 z-10 flex items-center justify-center transition-colors"
                          title="Étirer la durée de la tâche (par tranche de 5 min)"
                          onMouseEnter={() => setHoveredHandle(true)}
                          onMouseLeave={() => setHoveredHandle(false)}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setResizeState({
                              taskId: t.id,
                              direction: "bottom",
                              startY: e.clientY,
                              originalScheduledTime: t.scheduledTime || "11:00",
                              originalDuration: t.durationMinutes || 30
                            });
                          }}
                        >
                          <div className="w-8 h-[1px] bg-black/30 rounded"></div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* HORLOGE NÉON : LIGNE VERT-LIME CHRONOLOGIQUE TEMPS REEL */}
                {lineState.active && (
                  <div
                    className="absolute left-0 right-0 h-[3px] bg-lime-400 z-10 flex items-center pointer-events-none shadow-[0px_0px_10px_#84cc16]"
                    style={{ top: `${lineState.top}px` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-lime-500 border-2 border-white -ml-1"></div>
                    <span className="bg-lime-500 text-white text-[9px] font-mono font-black ml-1.5 px-1 py-0.2 border border-lime-600 rounded">
                      En direct
                    </span>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
