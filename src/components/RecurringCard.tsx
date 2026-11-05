import React, { useState, useEffect, useRef } from "react";
import { RecurringTask } from "../types";
import { 
  Play, Pause, Pin, Check, Sun, Calendar as CalendarIcon, Pencil, Trash2 as Trash, ExternalLink, Clock, Copy
} from "lucide-react";
import { getHabitEmoji } from "./HabitCard";

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

interface RecurringCardProps {
  key?: React.Key;
  rt: RecurringTask;
  todayStr: string;
  borderClr?: string;
  expandedCardIds: Record<string, boolean>;
  setExpandedCardIds: (id: string, val: boolean) => void;
  onStartChrono?: (id: string) => void;
  onStopChrono?: (id: string) => void;
  onComplete: (id: string) => void;
  onPin: (id: string) => void;
  onToggleDayOf?: (id: string) => void;
  getElapsedSeconds?: (item: any, type: "recurring") => number;
  formatTimer?: (sec: number) => string;
  onSelectAction?: (id: string, action: "history" | "edit" | "delete") => void;
  onDuplicate?: (rt: RecurringTask) => void;
  onLogManualTime?: (recurringTaskId: string, durationMinutes: number, dateStr?: string) => void;
  expandedId?: string | null;
  activePanel?: "history" | "edit" | "delete" | null;
  children?: React.ReactNode;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  hideActionsByDefault?: boolean;
}

export default function RecurringCard({
  rt,
  todayStr,
  borderClr = "border-black",
  expandedCardIds,
  setExpandedCardIds,
  onStartChrono,
  onStopChrono,
  onComplete,
  onPin,
  onToggleDayOf,
  getElapsedSeconds,
  formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  },
  onSelectAction,
  onDuplicate,
  onLogManualTime,
  expandedId,
  activePanel,
  children,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  hideActionsByDefault = false
}: RecurringCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);
  const [manualDuration, setManualDuration] = useState<string>("");
  const [manualDate, setManualDate] = useState<string>(todayStr || new Date().toISOString().split("T")[0]);

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const mins = parseInt(manualDuration, 10);
    if (mins > 0 && onLogManualTime) {
      onLogManualTime(rt.id, mins, manualDate);
      setManualDuration("");
    }
  };

  const handleQuickLog = (mins: number) => {
    if (onLogManualTime) {
      onLogManualTime(rt.id, mins, manualDate);
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

  const getInactivityDays = (item: any): { value: string; days: number | null } => {
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

  const getDynamicColorId = (item: any): string => {
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

  const getDynamicColorHex = (item: any): string => {
    const colorId = getDynamicColorId(item);
    const found = BORDER_COLORS.find((b) => b.id === colorId);
    return found ? found.bgHex : "#000000";
  };

  const getDynamicBadgeClass = (item: any): string => {
    const colorId = getDynamicColorId(item);
    const found = BADGE_COLORS.find((b) => b.id === colorId);
    return found ? `${found.bgClass} ${found.textClass} ${found.borderClass}` : "bg-rose-50 text-rose-600 border-rose-300";
  };

  const isTimerActive = !rt.isPaused && rt.lastResumeTime;
  const historyObj = rt.history || {};
  const isCompletedToday = historyObj[todayStr] > 0;
  const isExpanded = !!expandedCardIds[rt.id];
  const isWide = width >= 340;
  const showDetailsAndActions = hideActionsByDefault ? isExpanded : true;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) {
      return;
    }
    setExpandedCardIds(rt.id, !isExpanded);
  };

  const cleanTitle = rt.title.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();
  const isUrssaf = cleanTitle.toLowerCase().includes("ursaff") || cleanTitle.toLowerCase().includes("urssaf");

  // Calcul intervalle de fréquence de manière harmonisée
  let freqLabel = "Tous les jours";
  if (rt.frequency === "weekly") freqLabel = "Tous les 7 jour(s)";
  if (rt.frequency === "monthly") freqLabel = "Tous les 1 mois";
  if (cleanTitle.toLowerCase().includes("cheveux") || cleanTitle.toLowerCase().includes("barbe") || cleanTitle.toLowerCase().includes("poubelle")) {
    freqLabel = "Tous les 2 semaine(s)";
  }
  if (cleanTitle.toLowerCase().includes("caf") || isUrssaf) {
    freqLabel = "Tous les 3 mois";
  }

  // Temps écoulé pour le chrono
  const elapsedSec = getElapsedSeconds ? getElapsedSeconds(rt, "recurring") : 0;

  const colorId = getDynamicColorId(rt);
  const foundB = BORDER_COLORS.find((b) => b.id === colorId);
  const dynamicBorderClass = foundB ? foundB.borderClass : "border-black";
  const finalBorderClr = borderClr === "border-black" ? dynamicBorderClass : borderClr;

  return (
    <div 
      ref={containerRef}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{ boxShadow: `2px 2px 0px ${getDynamicColorHex(rt)}` }}
      onClick={handleCardClick}
      className={`border-2 p-2 relative bg-white ${finalBorderClr} rounded-none group min-h-[44px] flex flex-col ${
        draggable ? "cursor-grab active:cursor-grabbing hover:bg-slate-50/50" : "cursor-pointer"
      } transition-all`}
    >
      <div className={`flex ${isWide ? 'flex-row items-center justify-between gap-2 w-full' : 'flex-col gap-1.5'}`}>
        {/* LIGNE 1 : Icône + Titre */}
        <div className={`flex items-center gap-2 overflow-hidden flex-grow min-w-0 relative group ${isWide ? '' : 'w-full'}`}>
          <span className="text-sm shrink-0 select-none bg-teal-100 p-0.5 border border-black leading-none flex items-center justify-center min-w-[20px] min-h-[20px]">
            {rt.icon || getHabitEmoji(rt.title)}
          </span>
          <p className={`font-mono text-[11px] font-black leading-none uppercase truncate ${isCompletedToday ? 'line-through text-slate-400 dark:text-slate-500' : 'text-black'}`} title={rt.title}>
            {rt.title}
          </p>

          <span className={`text-[8px] font-black font-mono shrink-0 px-1 py-0.2 border border-black ${getDynamicBadgeClass(rt)}`}>
            {getInactivityDays(rt).value}
          </span>

          {rt.targetDays && rt.targetDays.length > 0 && (
            <span 
              className={`text-[8px] font-black font-mono shrink-0 px-1 py-0.2 border border-black ${
                rt.targetDays.includes(new Date().getDay() === 0 ? 7 : new Date().getDay()) 
                  ? "bg-sky-100 text-sky-800 border-sky-900" 
                  : "bg-gray-100 text-gray-600"
              }`}
              title={`Jours ciblés : ${rt.targetDays.map(d => ["", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][d]).join(", ")}`}
            >
              📅 {rt.targetDays.map(d => ["", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][d]).join(", ")}
            </span>
          )}

          <div 
            className="absolute left-0 bottom-full mb-2 w-64 bg-[#FFF9E6] dark:bg-slate-900 text-[#111] dark:text-slate-150 border-2 border-black dark:border-slate-700 p-2.5 rounded-none shadow-[3px_3px_0px_#000] z-50 pointer-events-none hidden group-hover:block text-[10px] font-mono leading-relaxed text-left"
            style={{ contentVisibility: 'auto' }}
          >
            <div className="border-b-2 border-black dark:border-slate-700 pb-1 mb-1 font-black uppercase text-[10px] flex justify-between items-center bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white px-1 shadow-[1px_1px_0px_#000]">
              <span>🔄 TÂCHE RÉCURRENTE</span>
              <span>+{rt.rewardValue || 10} coins</span>
            </div>
            {rt.description && (
              <p className="italic text-gray-700 dark:text-slate-300 mb-1.5 whitespace-pre-wrap max-h-16 overflow-y-auto">
                {rt.description}
              </p>
            )}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 my-1 border-t border-b border-dashed border-black/20 py-1 text-[9px]">
              <div><span className="font-bold text-rose-500">🔥 IMPORT :</span> {rt.baseImportance ?? 5}/10</div>
              <div><span className="font-bold text-sky-500">⚡ URGENT :</span> {rt.baseUrgency ?? 5}/10</div>
            </div>
            <div className="space-y-0.5 mt-1 text-[9px] text-gray-800 dark:text-slate-300 font-mono">
              <div>
                <span className="font-black">⏰ FRÉQUENCE :</span> {freqLabel}
              </div>
              <div>
                <span className="font-black">📅 PROCHAINE DATE :</span> {rt.nextDueDate}
              </div>
              {(isTimerActive || elapsedSec > 0) && (
                <div>
                  <span className="font-black">⏱️ TEMPS ACCUMULÉ :</span> {formatTimer(elapsedSec)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LIGNE 3 (Milieu) : Scores */}
        {showDetailsAndActions && (
          isExpanded ? (
            <div 
              className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-gray-500 dark:text-slate-400 font-mono ${isWide ? 'flex-grow justify-center px-2 border-l border-r border-dashed border-black/15' : 'mt-0.5'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {isUrssaf ? (
                <a
                  href="https://www.autoentrepreneur.urssaf.fr/services/espace-personnel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-teal-600 hover:underline inline-flex items-center gap-0.5 break-all font-mono font-bold"
                >
                  Espace URSSAF <ExternalLink size={8} />
                </a>
              ) : (
                <>
                  <div><span className="font-bold text-rose-500">🔥 IMP:</span> {rt.baseImportance ?? 5}/10</div>
                  <div><span className="font-bold text-sky-500">⚡ URG:</span> {rt.baseUrgency ?? 5}/10</div>
                  <div><span className="font-bold">⏰ FRÉQ:</span> {freqLabel === "Tous les jours" ? "Quot." : freqLabel}</div>
                </>
              )}
              <div className="flex items-center gap-1.5 font-bold ml-1">
                <span>⏱️ {formatTimer(elapsedSec)}</span>
                <span className="text-indigo-500">🎯 {rt.baseImportance !== undefined ? Math.round((rt.baseImportance * 1.5 + (rt.baseUrgency ?? 5) * 1.5)) : 10}</span>
                <span className="text-amber-500">🪙 {rt.rewardValue || 10}</span>
              </div>
            </div>
          ) : (
            (isTimerActive || elapsedSec > 0) && (
              <div 
                className={`flex items-center text-[9px] text-gray-500 dark:text-slate-400 font-mono font-bold ${isWide ? 'flex-grow justify-center px-2 border-l border-r border-dashed border-black/15' : 'mt-0.5'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <span>⏱️ {formatTimer(elapsedSec)}</span>
              </div>
            )
          )
        )}

        {/* LIGNE 2 (Droite) : Boutons */}
        {showDetailsAndActions && (
          <div 
            className="flex items-center gap-1 shrink-0 justify-end"
            onClick={(e) => e.stopPropagation()}
          >
          {/* BP CHRONO */}
          {(onStartChrono && onStopChrono) && (
            isTimerActive ? (
              <button
                onClick={() => onStopChrono(rt.id)}
                className="w-5 h-5 bg-amber-400 hover:bg-amber-500 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000]"
                title="Pause"
              >
                <Pause size={8} className="fill-black text-black" />
              </button>
            ) : (
              <button
                onClick={() => onStartChrono(rt.id)}
                className="w-5 h-5 bg-indigo-500 hover:bg-indigo-600 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000]"
                title="Démarrer le chrono"
              >
                <Play size={8} className="fill-white text-white ml-0.5" />
              </button>
            )
          )}

          {/* VALIDER COMPLÉTION */}
          <button
            onClick={() => onComplete(rt.id)}
            className={`w-5 h-5 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] ${isCompletedToday ? 'bg-green-400 hover:bg-green-500' : 'bg-gray-100 hover:bg-emerald-300'}`}
            title="Valider"
          >
            <Check size={8} className="text-black font-extrabold" strokeWidth={3} />
          </button>

          {/* AJOUTER / RETIRER DU JOUR DE */}
          {onToggleDayOf && (
            <button
              onClick={() => onToggleDayOf(rt.id)}
              className={`w-5 h-5 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] p-0.5 ${
                rt.isDayOf ? "bg-yellow-300" : "bg-white hover:bg-yellow-50"
              }`}
              title={rt.isDayOf ? "Retirer du Jour de" : "Ajouter au Jour de"}
            >
              <Sun size={8} className={rt.isDayOf ? "text-amber-500 fill-amber-500" : "text-black"} />
            </button>
          )}

          {/* SÉTI DU MÊME MODE EXPANSION */}
          {isExpanded && (
            <>
              {/* ÉPINGLER / DÉSÉPINGLER */}
              <button
                onClick={() => onPin(rt.id)}
                className="w-5 h-5 bg-white hover:bg-red-50 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] p-0.5"
                title={rt.isStarred ? "Désépingler" : "Épingler"}
              >
                <Pin size={8} className={rt.isStarred ? "text-red-500 fill-red-500" : "text-black"} />
              </button>

              {/* OUTILS MANAGER SI DISPO */}
              {onSelectAction && (
                <>
                  <button
                    onClick={() => onSelectAction(rt.id, "history")}
                    className={`w-5 h-5 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] text-black ${
                      expandedId === rt.id && activePanel === "history" ? "bg-yellow-300 font-bold" : "bg-white hover:bg-amber-50"
                    }`}
                    title="Calendrier historique"
                  >
                    <CalendarIcon size={8} />
                  </button>

                  {onDuplicate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(rt);
                      }}
                      className="w-5 h-5 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] text-black bg-white hover:bg-yellow-100"
                      title="Dupliquer"
                    >
                      <Copy size={8} />
                    </button>
                  )}

                  <button
                    onClick={() => onSelectAction(rt.id, "edit")}
                    className={`w-5 h-5 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] text-black ${
                      expandedId === rt.id && activePanel === "edit" ? "bg-sky-300 font-bold" : "bg-white hover:bg-blue-50"
                    }`}
                    title="Modifier"
                  >
                    <Pencil size={8} />
                  </button>

                  <button
                    onClick={() => onSelectAction(rt.id, "delete")}
                    className={`w-5 h-5 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] text-black ${
                      expandedId === rt.id && activePanel === "delete" ? "bg-red-400 text-white font-bold" : "bg-white hover:bg-red-50 text-red-600"
                    }`}
                    title="Supprimer"
                  >
                    <Trash size={8} />
                  </button>
                </>
              )}
            </>
          )}
        </div>
        )}
      </div>

      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-dashed border-black/20 text-[10px] font-mono space-y-2" onClick={(e) => e.stopPropagation()}>
          {((rt.accumulatedTime || 0) > 0 || (rt.workHistory && Object.keys(rt.workHistory).length > 0)) && (
            <div>
              <div className="flex justify-between items-center mb-1 font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1">
                  <Clock size={10} className="text-indigo-600" />
                  <span>HISTORIQUE DES TEMPS TRAVAILLÉS</span>
                </span>
                <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 px-1 py-0.2 border border-black">
                  Total: {Math.floor((rt.accumulatedTime || 0) / 60)} min ({((rt.accumulatedTime || 0) / 3600).toFixed(1)}h)
                </span>
              </div>
              {rt.workHistory && Object.keys(rt.workHistory).length > 0 && (
                <div className="max-h-20 overflow-y-auto space-y-0.5 bg-slate-50 dark:bg-slate-900 p-1 border border-black/20">
                  {Object.entries(rt.workHistory).map(([d, sec]) => (
                    <div key={d} className="flex justify-between items-center text-[9px] border-b border-black/10 dark:border-slate-800 pb-0.5">
                      <span className="font-bold text-gray-700 dark:text-slate-300">{d}</span>
                      <span className="font-black text-indigo-700 dark:text-indigo-400">+{Math.round(sec / 60)} min ({((sec || 0) / 3600).toFixed(1)}h)</span>
                    </div>
                  ))}
                </div>
              )}
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

      {isExpanded && children && (
        <div className="mt-2 text-left" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
}
