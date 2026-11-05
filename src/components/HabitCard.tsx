import React, { useState, useEffect, useRef } from "react";
import { Habit, AppDatabase } from "../types";
import { 
  Play, Pause, Pin, Clock, Check, Calendar, Edit2, Trash2, ShieldAlert, Sun, Copy
} from "lucide-react";

// Couleurs Memphis disponibles (harmonisé)
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

export const getHabitEmoji = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes("sport") || t.includes("muscu") || t.includes("gym") || t.includes("mouvement") || t.includes("courir") || t.includes("marche") || t.includes("rep") || t.includes("tractions")) return "🏋️";
  if (t.includes("ménage") || t.includes("ranger") || t.includes("nettoy") || t.includes("poubelle") || t.includes("vaisselle") || t.includes("balayer")) return "🧹";
  if (t.includes("eau") || t.includes("boire") || t.includes("verre") || t.includes("hydrat")) return "💧";
  if (t.includes("lire") || t.includes("livre") || t.includes("lecture")) return "📚";
  if (t.includes("méditer") || t.includes("zen") || t.includes("calme") || t.includes("respir")) return "🧘";
  if (t.includes("code") || t.includes("travail") || t.includes("dev") || t.includes("projet") || t.includes("pole") || t.includes("pôle") || t.includes("emploi") || t.includes("ursaff") || t.includes("urssaf")) return "💻";
  if (t.includes("sommeil") || t.includes("dormir") || t.includes("lit") || t.includes("coucher") || t.includes("médicament") || t.includes("pilule") || t.includes("traitement") || t.includes("qviviq")) return "🌙";
  if (t.includes("ami") || t.includes("famille") || t.includes("contacter") || t.includes("voir") || t.includes("aimer") || t.includes("contacter")) return "❤️";
  if (t.includes("répondre") || t.includes("mail") || t.includes("téléphone") || t.includes("sms") || t.includes("admin")) return "📱";
  if (t.includes("divers") || t.includes("impro")) return "🎭";
  if (t.includes("feed") || t.includes("drive") || t.includes("voit") || t.includes("conduire")) return "🚗";
  if (t.includes("cheveux") || t.includes("coiffeur") || t.includes("coupe")) return "💇";
  if (t.includes("barbe") || t.includes("raser")) return "🦁";
  if (t.includes("corps") || t.includes("douche") || t.includes("poil") || t.includes("hygiène")) return "🧼";
  if (t.includes("facture") || t.includes("paye") || t.includes("argent") || t.includes("banque")) return "💵";
  return "⚡";
};

interface HabitCardProps {
  key?: string;
  h: Habit;
  db: AppDatabase;
  todayStr: string;
  onNavigate: (view: string) => void;
  onToggleValue: (habitId: string) => void;
  onAdjustValue: (habitId: string, amount: number) => void;
  onStartChrono: (habitId: string) => void;
  onStopChrono: (habitId: string) => void;
  onToggleStar: (habitId: string) => void;
  onToggleDayOf?: (habitId: string) => void;
  onHistoryClick?: (habitId: string) => void;
  onEditClick?: (habitId: string) => void;
  onDeleteClick?: (habitId: string) => void;
  onDuplicate?: (habit: Habit) => void;
  onLogManualTime?: (habitId: string, durationMinutes: number, dateStr?: string) => void;
  children?: React.ReactNode;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  hideActionsByDefault?: boolean;
}

export default function HabitCard({
  h,
  db,
  todayStr,
  onNavigate,
  onToggleValue,
  onAdjustValue,
  onStartChrono,
  onStopChrono,
  onToggleStar,
  onToggleDayOf,
  onHistoryClick,
  onEditClick,
  onDeleteClick,
  onDuplicate,
  onLogManualTime,
  children,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  hideActionsByDefault = false
}: HabitCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [ticker, setTicker] = useState(0);
  const [manualDuration, setManualDuration] = useState<string>("");
  const [manualDate, setManualDate] = useState<string>(todayStr || new Date().toISOString().split("T")[0]);

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const mins = parseInt(manualDuration, 10);
    if (mins > 0 && onLogManualTime) {
      onLogManualTime(h.id, mins, manualDate);
      setManualDuration("");
    }
  };

  const handleQuickLog = (mins: number) => {
    if (onLogManualTime) {
      onLogManualTime(h.id, mins, manualDate);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Force actualisation locale si chrono actif pour affichage en live
  useEffect(() => {
    const isTimerActive = !h.isPaused && h.lastResumeTime;
    if (isTimerActive) {
      const interval = setInterval(() => {
        setTicker((p) => p + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [h.isPaused, h.lastResumeTime]);

  const getInactivityDays = (item: Habit): { value: string; days: number | null } => {
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

    const today = new Date(todayStr);
    const lastDate = new Date(mostRecentDate);
    
    // Reset heures pour éviter les approximations temporelles
    today.setHours(0,0,0,0);
    lastDate.setHours(0,0,0,0);

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

  const getDynamicColorId = (item: Habit): string => {
    const inactivity = getInactivityDays(item);
    const days = inactivity.days;

    if (days === null) {
      return "grey";
    }

    const tGreen = item.greenThreshold !== undefined ? item.greenThreshold : 4;
    const tYellow = item.yellowThreshold !== undefined ? item.yellowThreshold : 7;
    const tOrange = item.orangeThreshold !== undefined ? item.orangeThreshold : 10;
    const tRed = item.redThreshold !== undefined ? item.redThreshold : 15;
    const tPurple = item.purpleThreshold !== undefined ? item.purpleThreshold : 20;

    if (days < tGreen) {
      return "emerald";
    } else if (days < tYellow) {
      return "yellow";
    } else if (days < tOrange) {
      return "orange";
    } else if (days < tRed) {
      return "rose";
    } else if (days < tPurple) {
      return "purple";
    } else {
      return "black";
    }
  };

  const fetchCardBorderClass = (item: Habit) => {
    const colorId = getDynamicColorId(item);
    const found = BORDER_COLORS.find((b) => b.id === colorId);
    return found ? found.borderClass : "border-rose-400";
  };

  const fetchBadgeClass = (item: Habit) => {
    const colorId = getDynamicColorId(item);
    const found = BADGE_COLORS.find((b) => b.id === colorId);
    return found ? `${found.bgClass} ${found.textClass} ${found.borderClass}` : "bg-rose-50 text-rose-600 border-rose-300";
  };

  const getElapsedSeconds = (item: Habit) => {
    let secs = item.accumulatedTime || 0;
    if (!item.isPaused && item.lastResumeTime) {
      secs += Math.round((Date.now() - new Date(item.lastResumeTime).getTime()) / 1000);
    }
    return Math.max(0, secs);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getDynamicColorHex = (item: Habit): string => {
    const colorId = getDynamicColorId(item);
    const found = BORDER_COLORS.find((b) => b.id === colorId);
    return found ? found.bgHex : "#000000";
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) {
      return;
    }
    setIsExpanded(prev => !prev);
  };

  const isTimerActive = !h.isPaused && h.lastResumeTime;
  const hasChrono = h.type === "chrono";
  const isQuantitative = h.type === "quantitative" || h.type === "counter" || h.targetValue > 1;
  const isStarred = !!h.isStarred;

  const inactivity = getInactivityDays(h);
  const cardBorderClass = fetchCardBorderClass(h);
  const badgeClass = fetchBadgeClass(h);

  const totalSec = getElapsedSeconds(h);
  const liveCurrentValue = hasChrono
    ? h.currentValue + Math.floor(totalSec / 60)
    : h.currentValue;
  const isCompletedNow = liveCurrentValue >= h.targetValue;

  const isWide = width >= 330;
  const showDetailsAndActions = hideActionsByDefault ? isExpanded : true;

  return (
    <div 
      ref={containerRef}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={handleCardClick}
      style={{ boxShadow: `2px 2px 0px ${getDynamicColorHex(h)}` }}
      className={`border-2 p-2 relative bg-white ${cardBorderClass} rounded-none group min-h-[44px] flex flex-col ${
        isCompletedNow ? "bg-[#FBFCFA]" : ""
      } ${draggable ? "cursor-grab active:cursor-grabbing hover:bg-slate-50/50" : "cursor-pointer"}`}
    >
      <div className={`flex ${isWide ? 'flex-row items-center justify-between gap-2 w-full' : 'flex-col gap-1.5'}`}>
        {/* LIGNE 1 : Icône + Titre */}
        <div 
          className={`flex items-center gap-2 overflow-hidden flex-grow min-w-0 relative group ${isWide ? '' : 'w-full'}`}
        >
          <span className="text-sm shrink-0 select-none bg-orange-100 p-0.5 border border-black leading-none flex items-center justify-center min-w-[22px] min-h-[22px]">
            {h.icon || getHabitEmoji(h.title)}
          </span>
          <p 
            className={`font-mono text-[11px] font-black leading-none uppercase truncate ${
              isCompletedNow ? "line-through text-slate-400" : "text-black"
            }`}
            title={h.title}
          >
            {h.title}
          </p>

          <span className={`text-[8px] font-black font-mono shrink-0 px-1 py-0.2 border border-black ${badgeClass}`}>
            {inactivity.value}
          </span>

          {h.targetDays && h.targetDays.length > 0 && (
            <span 
              className={`text-[8px] font-black font-mono shrink-0 px-1 py-0.2 border border-black ${
                h.targetDays.includes(new Date().getDay() === 0 ? 7 : new Date().getDay()) 
                  ? "bg-emerald-100 text-emerald-800 border-emerald-900" 
                  : "bg-gray-100 text-gray-600"
              }`}
              title={`Jours ciblés : ${h.targetDays.map(d => ["", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][d]).join(", ")}`}
            >
              📅 {h.targetDays.map(d => ["", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][d]).join(", ")}
            </span>
          )}

          {/* Hover details en néo-brutaliste jaune */}
          <div 
            className="absolute left-0 bottom-full mb-2 w-64 bg-[#FFF9E6] dark:bg-slate-900 text-[#111] dark:text-slate-150 border-2 border-black dark:border-slate-700 p-2.5 rounded-none shadow-[3px_3px_0px_#000] z-50 pointer-events-none hidden group-hover:block text-[10px] font-mono leading-relaxed text-left"
            style={{ contentVisibility: 'auto' }}
          >
            <div className="border-b-2 border-black dark:border-slate-700 pb-1 mb-1 font-black uppercase text-[10px] flex justify-between items-center bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white px-1 shadow-[1px_1px_0px_#000]">
              <span>🌿 HABITUDE</span>
              <span>+{h.rewardValue} coins</span>
            </div>
            {h.description && (
              <p className="italic text-gray-700 dark:text-slate-300 mb-1.5 whitespace-pre-wrap max-h-16 overflow-y-auto">
                {h.description}
              </p>
            )}
            <div className="space-y-0.5 mt-1 text-[9px] text-gray-800 dark:text-slate-300 font-mono">
              <div><span className="font-black">🔥 SÉRIE ACTUELLE :</span> {h.streak}j</div>
              <div><span className="font-black">🏆 MEILLEURE SÉRIE :</span> {h.bestStreak}j</div>
              <div><span className="font-black">🎯 CIBLE :</span> {h.targetValue} {h.unit || "fois"}</div>
              {hasChrono && (
                <div><span className="font-black">⏰ TEMPS TRAVAILLÉ :</span> {formatTimer(totalSec)}</div>
              )}
            </div>
          </div>
        </div>

        {/* LIGNE 3 (Milieu) : Scores/Détails */}
        <div 
          className={`${showDetailsAndActions ? 'flex' : 'hidden'} flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-gray-500 dark:text-slate-400 font-mono ${isWide ? 'flex-grow justify-center px-1 border-l border-r border-dashed border-black/15' : 'mt-0.5'}`}
          onClick={(e) => { e.stopPropagation(); }}
        >
          {isQuantitative && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAdjustValue(h.id, -1)}
                className="bg-white hover:bg-gray-100 border border-black w-4 h-4 font-black flex items-center justify-center cursor-pointer text-[10px]"
                title="Décrémenter"
              >
                -
              </button>
              <span className="font-bold text-slate-700">{liveCurrentValue}/{h.targetValue}</span>
              <button
                onClick={() => onAdjustValue(h.id, 1)}
                className="bg-white hover:bg-gray-100 border border-black w-4 h-4 font-black flex items-center justify-center cursor-pointer text-[10px]"
                title="Incrémenter"
              >
                +
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {hasChrono && (
              <span>⏱️ {formatTimer(totalSec)}</span>
            )}
            {isExpanded && (
              <>
                <span className="font-bold text-indigo-500">🔥 {h.streak}j</span>
                <span className="font-bold text-amber-500">🪙 {h.rewardValue}</span>
              </>
            )}
          </div>
        </div>

        {/* LIGNE 2 (Droite) : Boutons d'actions */}
        <div 
          className={`${showDetailsAndActions ? 'flex' : 'hidden'} items-center gap-1 shrink-0 ${isWide ? '' : 'justify-end border-t border-dashed border-black/10 pt-1 mt-0.5 w-full sm:w-auto'}`} 
          onClick={(e) => { e.stopPropagation(); }}
        >
          {isTimerActive ? (
            <button
              onClick={() => onStopChrono(h.id)}
              className="w-5 h-5 bg-amber-400 hover:bg-amber-500 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000]"
              title="Pause"
            >
              <Pause size={8} className="fill-black text-black" />
            </button>
          ) : (
            <button
              onClick={() => onStartChrono(h.id)}
              className="w-5 h-5 bg-indigo-500 hover:bg-indigo-600 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000]"
              title="Démarrer"
            >
              <Play size={8} className="fill-white text-white ml-0.5" />
            </button>
          )}

          <button
            onClick={() => onToggleValue(h.id)}
            className={`w-5 h-5 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] ${
              isCompletedNow ? "bg-green-400 hover:bg-green-500" : "bg-gray-100 hover:bg-emerald-300"
            }`}
            title="Valider"
          >
            <Check size={8} className="text-black font-extrabold" />
          </button>

          {onToggleDayOf && (
            <button
              onClick={() => onToggleDayOf(h.id)}
              className={`w-5 h-5 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] p-0.5 ${
                h.isDayOf ? "bg-yellow-300" : "bg-white hover:bg-yellow-50"
              }`}
              title={h.isDayOf ? "Retirer du Jour de" : "Ajouter au Jour de"}
            >
              <Sun size={8} className={h.isDayOf ? "text-amber-500 fill-amber-500" : "text-black"} />
            </button>
          )}

          {isExpanded && (
            <>
              <button
                onClick={() => {
                  if (onHistoryClick) {
                    onHistoryClick(h.id);
                  } else {
                    onNavigate("habits");
                    setTimeout(() => {
                      const el = document.getElementById(`panel-history-${h.id}`);
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }
                }}
                className="w-5 h-5 bg-white hover:bg-amber-50 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] text-black p-0.5"
                title="Historique"
              >
                <Calendar size={8} />
              </button>

              {onDuplicate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(h);
                  }}
                  className="w-5 h-5 bg-white hover:bg-yellow-100 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] text-black p-0.5"
                  title="Dupliquer"
                >
                  <Copy size={8} />
                </button>
              )}

              <button
                onClick={() => {
                  if (onEditClick) {
                    onEditClick(h.id);
                  } else {
                    onNavigate("habits");
                    setTimeout(() => {
                      const el = document.getElementById(`panel-edit-${h.id}`);
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }
                }}
                className="w-5 h-5 bg-white hover:bg-blue-50 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] text-black p-0.5"
                title="Modifier"
              >
                <Edit2 size={8} />
              </button>

              <button
                onClick={() => {
                  if (onDeleteClick) {
                    onDeleteClick(h.id);
                  } else {
                    onNavigate("habits");
                    setTimeout(() => {
                      const el = document.getElementById(`panel-delete-${h.id}`);
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }
                }}
                className="w-5 h-5 bg-white hover:bg-red-50 text-red-650 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] p-0.5"
                title="Supprimer"
              >
                <Trash2 size={8} />
              </button>

              <button
                onClick={() => onToggleStar(h.id)}
                className="w-5 h-5 bg-white hover:bg-red-50 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] p-0.5"
                title={isStarred ? "Désépingler" : "Épingler"}
              >
                <Pin size={8} className={isStarred ? "text-red-500 fill-red-500" : "text-black"} />
              </button>
            </>
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-dashed border-black/20 text-[10px] font-mono space-y-2" onClick={(e) => e.stopPropagation()}>
          {h.workHistory && Object.keys(h.workHistory).length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1 font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1">
                  <Clock size={10} className="text-indigo-600" />
                  <span>HISTORIQUE DES TEMPS D'HABITUDE</span>
                </span>
                <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 px-1 py-0.2 border border-black">
                  Total: {Math.floor(Object.values(h.workHistory).reduce((a, b) => a + b, 0) / 60)} min ({((Object.values(h.workHistory).reduce((a, b) => a + b, 0) / 3600)).toFixed(1)}h)
                </span>
              </div>
              <div className="max-h-20 overflow-y-auto space-y-0.5 bg-slate-50 dark:bg-slate-900 p-1 border border-black/20">
                {Object.entries(h.workHistory).map(([d, sec]) => (
                  <div key={d} className="flex justify-between items-center text-[9px] border-b border-black/10 dark:border-slate-800 pb-0.5">
                    <span className="font-bold text-gray-700 dark:text-slate-300">{d}</span>
                    <span className="font-black text-indigo-700 dark:text-indigo-400">+{Math.round(sec / 60)} min ({((sec || 0) / 3600).toFixed(1)}h)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {onLogManualTime && (
            <div>
              <div className="flex items-center gap-1 text-[9px] font-mono font-bold mb-1 text-slate-700 dark:text-slate-300">
                <Clock size={10} />
                <span>SAISIE MANUELLE DU TEMPS</span>
              </div>
              <form onSubmit={handleManualSubmit} className="flex items-center gap-1.5 flex-wrap">
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="text-[9px] font-mono border border-black p-0.5 rounded-none bg-white text-black"
                />
                <input
                  type="number"
                  value={manualDuration}
                  onChange={(e) => setManualDuration(e.target.value)}
                  placeholder="Min (ex: 15)"
                  min="1"
                  className="w-16 text-[9px] font-mono border border-black p-0.5 rounded-none bg-white text-black"
                />
                <button
                  type="submit"
                  disabled={!manualDuration || Number(manualDuration) <= 0}
                  className="text-[9px] font-mono font-bold bg-indigo-500 hover:bg-indigo-600 text-white border border-black px-1.5 py-0.5 shadow-[1px_1px_0px_#000] cursor-pointer disabled:opacity-50"
                >
                  + Saisir
                </button>
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleQuickLog(-5)}
                    className="text-[8px] font-mono font-bold bg-rose-100 hover:bg-rose-200 border border-black px-1 py-0.2 shadow-[1px_1px_0px_#000] cursor-pointer text-black"
                  >
                    -5m
                  </button>
                  {[5, 15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleQuickLog(mins)}
                      className="text-[8px] font-mono font-bold bg-amber-100 hover:bg-amber-200 border border-black px-1 py-0.2 shadow-[1px_1px_0px_#000] cursor-pointer text-black"
                    >
                      +{mins}m
                    </button>
                  ))}
                </div>
              </form>
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
