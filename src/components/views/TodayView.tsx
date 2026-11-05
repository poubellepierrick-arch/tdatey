import React, { useState, useEffect } from "react";
import { Task, Habit, AppDatabase, RecurringTask, SleepWakeLog } from "../../types";
import { 
  Play, Pause, Square, Star, CheckCircle, Trash2, ShieldAlert, Award, Coffee, FileText, 
  Check, Plus, Minus, AlertCircle, RefreshCw, Pin, Calendar, Mic, Paperclip, 
  Volume2, AlertTriangle, Clock, ArrowUpRight, CheckSquare, X, Sparkles, Smile, Edit2, Sun, Copy
} from "lucide-react";
import { calculateTaskScore } from "../../lib/state";
import TaskInlineEditor from "./TaskInlineEditor";
import HabitCard, { getHabitEmoji } from "../HabitCard";
import RecurringCard from "../RecurringCard";
import { getEventColorClasses } from "../../lib/googleCalendar";

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

interface ResponsiveTaskCardProps {
  key?: React.Key;
  t: Task;
  borderClr: string;
  editingTaskId: string | null;
  taskDeletingId: string | null;
  expandedCardIds: Record<string, boolean>;
  setExpandedCardIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setEditingTaskId: (id: string | null) => void;
  setTaskDeletingId: (id: string | null) => void;
  toggleTaskCompletion: (id: string) => void;
  deleteTaskInline: (id: string) => void;
  archiveTaskInline?: (id: string) => void;
  handleStartChrono: (id: string) => void;
  handleStopChrono: (id: string) => void;
  toggleStarTask: (id: string) => void;
  toggleDayOfTask: (id: string) => void;
  handleImportSharedEvent: (t: Task) => void;
  handleSaveTask: (updatedTask: Task) => void;
  getEventColorClasses: (t: Task) => string;
  formatTimer: (sec: number) => string;
  getTaskElapsedSeconds: (t: Task) => number;
  allTasks?: Task[];
  onAddSubtaskInline?: (parentTaskId: string, title: string) => void;
  hideActionsByDefault?: boolean;
  onDuplicate?: (t: Task) => void;
  onLogTime?: (taskId: string, durationMinutes: number, dateStr?: string) => void;
}

function ResponsiveTaskCard({
  t,
  borderClr,
  editingTaskId,
  taskDeletingId,
  expandedCardIds,
  setExpandedCardIds,
  setEditingTaskId,
  setTaskDeletingId,
  toggleTaskCompletion,
  deleteTaskInline,
  archiveTaskInline,
  handleStartChrono,
  handleStopChrono,
  toggleStarTask,
  toggleDayOfTask,
  handleImportSharedEvent,
  handleSaveTask,
  getEventColorClasses,
  formatTimer,
  getTaskElapsedSeconds,
  allTasks = [],
  onAddSubtaskInline,
  hideActionsByDefault = false,
  onDuplicate,
  onLogTime
}: ResponsiveTaskCardProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState("");
  const [manualDuration, setManualDuration] = useState<string>("");
  const [manualDate, setManualDate] = useState<string>(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]);

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

  const isExpanded = !!expandedCardIds[t.id];
  const isTimerActive = t.planningStatus === "in-progress" && !t.isPaused;
  const isWide = width >= 340;
  const showDetailsAndActions = hideActionsByDefault ? isExpanded : (isWide || isExpanded);
  const isEvent = t.type === "event";
  const isShared = !!t.isSharedEvent;
  const colorClasses = isEvent ? getEventColorClasses(t) : "";
  const isCompleted = t.isCompleted || t.planningStatus === "done" || t.status === "done";
  const isConfirmingDelete = taskDeletingId === t.id;

  const { subtasks, completedSubtasks } = React.useMemo(() => {
    const sub = allTasks.filter(st => st.parentId === t.id || st.parentTaskId === t.id);
    const completed = sub.filter(st => st.status === 'done' || st.isCompleted);
    return { subtasks: sub, completedSubtasks: completed };
  }, [allTasks, t.id]);

  return (
    <div 
      ref={containerRef}
      className={`border-2 p-2 relative shadow-[2px_2px_0px_#000] border-black rounded-none group min-h-[44px] flex flex-col ${
        isEvent && colorClasses ? colorClasses : `bg-white ${borderClr}`
      }`}
    >
      {editingTaskId === t.id ? (
        <div className="w-full">
          <TaskInlineEditor 
            task={t} 
            onSave={handleSaveTask} 
            onCancel={() => setEditingTaskId(null)} 
            allTasks={allTasks}
          />
        </div>
      ) : (
        <>
          <div className={`flex ${isWide && !hideActionsByDefault ? 'flex-row items-center justify-between gap-2 w-full' : 'flex-col gap-1.5'}`}>
            {/* LIGNE 1 : Icône + Titre */}
            <div 
              className={`flex items-center gap-2 overflow-hidden flex-grow min-w-0 relative group cursor-pointer ${isWide && !hideActionsByDefault ? '' : 'w-full'}`}
              onClick={() => setExpandedCardIds(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
            >
            <span className="text-sm shrink-0 select-none">
              {t.icon ? (
                typeof t.icon === "string" ? t.icon : t.icon.content
              ) : (
                isEvent ? "📅" : "📁"
              )}
            </span>
            <p 
              className={`font-mono text-[11px] font-black leading-none uppercase truncate ${
                isCompleted ? "line-through text-slate-400" : "text-black"
			  }`}
              title={t.title}
            >
              {t.title}
              {subtasks.length > 0 && (
                <span className="ml-2 px-1 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded text-[9px] font-mono leading-none border border-black/20">
                  {completedSubtasks.length}/{subtasks.length}
                </span>
              )}
            </p>

            {!isEvent && !isShared && !hideActionsByDefault && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDayOfTask(t.id);
                }}
                className={`ml-auto shrink-0 w-5 h-5 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] p-0.5 ${
                  t.isDayOf ? "bg-yellow-300" : "bg-white hover:bg-yellow-50"
                }`}
                title={t.isDayOf ? "Retirer du Jour de" : "Ajouter au Jour de"}
              >
                <Sun size={8} className={t.isDayOf ? "text-amber-500 fill-amber-500" : "text-black"} />
              </button>
            )}

            {/* Hover details en néo-brutaliste jaune */}
            <div 
              className="absolute left-0 bottom-full mb-2 w-64 bg-[#FFF9E6] dark:bg-slate-900 text-[#111] dark:text-slate-150 border-2 border-black dark:border-slate-700 p-2.5 rounded-none shadow-[3px_3px_0px_#000] z-50 pointer-events-none hidden group-hover:block text-[10px] font-mono leading-relaxed text-left"
              style={{ contentVisibility: 'auto' }}
            >
              <div className="border-b-2 border-black dark:border-slate-700 pb-1 mb-1 font-black uppercase text-[10px] flex justify-between items-center bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white px-1 shadow-[1px_1px_0px_#000]">
                <span>
                  {isShared ? "📥 PARTAGÉ" : isEvent ? "📅 ÉVÉNEMENT" : t.type === "routine" ? "🔄 ROUTINE" : "📁 TÂCHE BENTO"}
                </span>
                <span>+{t.rewardValue || 15} coins</span>
              </div>

              {t.description && (
                <p className="italic text-gray-700 dark:text-slate-300 mb-1.5 whitespace-pre-wrap max-h-16 overflow-y-auto">
                  {t.description}
                </p>
              )}

              {!isEvent && (
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 my-1 border-t border-b border-dashed border-black/20 py-1 text-[9px]">
                  <div><span className="font-bold text-red-500">🔥 IMPORT :</span> {t.importance ?? 5}/10</div>
                  <div><span className="font-bold text-sky-500">⚡ URGENT :</span> {t.urgency ?? 5}/10</div>
                  <div><span className="font-bold text-violet-500">🧠 CHARGE :</span> {t.mentalLoad ?? 5}/10</div>
                  <div><span className="font-bold text-emerald-500">✨ FACILITÉ:</span> {t.easiness ?? 5}/10</div>
                </div>
              )}

              <div className="space-y-0.5 mt-1 text-[9px] text-gray-800 dark:text-slate-300 font-mono">
                {t.dueDate && (
                  <div>
                    <span className="font-black">📅 ÉCHÉANCE :</span> {new Date(t.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                )}
                {t.scheduledTime && (
                  <div>
                    <span className="font-black">⏰ PLANIF :</span> {t.scheduledTime}
                  </div>
                )}
                {!isEvent && (
                  <div>
                    <span className="font-black">⏱️ TRAVAILLÉ :</span> {formatTimer(getTaskElapsedSeconds(t))} / {t.durationMinutes || 30}m
                  </div>
                )}
                {t.recurrence && t.recurrence !== "none" ? (
                  <div>
                    <span className="font-black">🔄 RÉCURRENCE :</span> {t.recurrence === "daily" ? "Quotidien" : t.recurrence === "weekly" ? "Hebdo" : "Mensuel"}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* LIGNE 3 (Milieu) : Scores/Détails */}
          <div 
            className={`${showDetailsAndActions ? 'flex' : 'hidden'} flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-gray-500 dark:text-slate-400 font-mono ${isWide ? 'flex-grow justify-center px-1 border-l border-r border-dashed border-black/15' : 'mt-0.5'}`}
            onClick={(e) => { e.stopPropagation(); }}
          >
            {!isEvent && (
              <>
                <div title="Importance"><span className="font-bold text-red-500">🔥</span> {t.importance ?? 5}</div>
                <div title="Urgence"><span className="font-bold text-sky-500">⚡</span> {t.urgency ?? 5}</div>
                <div title="Charge Mentale"><span className="font-bold text-violet-500">🧠</span> {t.mentalLoad ?? 5}</div>
                <div title="Facilité"><span className="font-bold text-emerald-500">✨</span> {t.easiness ?? 5}</div>
              </>
            )}
            {t.dueDate && (
              <div className="font-mono bg-blue-50/50 dark:bg-blue-900/20 px-1 border border-blue-200 dark:border-blue-800 text-[8px] rounded">
                📅 {new Date(t.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>
            )}
            {t.scheduledTime && (
              <div className="font-mono bg-amber-50/50 dark:bg-amber-900/20 px-1 border border-amber-200 dark:border-amber-800 text-[8px] rounded">
                ⏰ {t.scheduledTime}
              </div>
            )}
            {!isEvent && (
              <div className="flex items-center gap-1.5 font-bold">
                <span>⏱️ {formatTimer(getTaskElapsedSeconds(t))}/{t.durationMinutes || 30}m</span>
                <span className="text-indigo-500">🎯 {calculateTaskScore(t)}</span>
                <span className="text-amber-500">🪙 {t.rewardValue || 15}</span>
              </div>
            )}
          </div>

          {/* LIGNE 2 (Droite) : Boutons d'actions */}
          <div 
            className={`${showDetailsAndActions ? 'flex' : 'hidden'} items-center gap-1 shrink-0 ${isWide ? '' : 'justify-end border-t border-dashed border-black/10 pt-1 mt-0.5 w-full sm:w-auto'}`} 
            onClick={(e) => { e.stopPropagation(); }}
          >
            {isConfirmingDelete ? (
              <div className="flex items-center gap-1">
                {archiveTaskInline && (
                  <button 
                    onClick={() => archiveTaskInline(t.id)}
                    className="bg-sky-400 hover:bg-sky-500 border border-black px-1.5 py-0.5 text-[8px] font-mono font-bold text-black uppercase shadow-[1px_1px_0px_#000] cursor-pointer"
                    title="Archiver"
                  >
                    Archiver
                  </button>
                )}
                <button 
                  onClick={() => deleteTaskInline(t.id)}
                  className="bg-red-500 hover:bg-red-650 border border-black px-1.5 py-0.5 text-[8px] font-mono font-bold text-white uppercase shadow-[1px_1px_0px_#000] cursor-pointer"
                  title="Supprimer définitivement"
                >
                  Supprimer
                </button>
                <button 
                  onClick={() => setTaskDeletingId(null)}
                  className="bg-gray-100 hover:bg-gray-200 border border-black text-[8px] px-1 py-0.5 font-mono text-black uppercase cursor-pointer"
                >
                  X
                </button>
              </div>
            ) : (
              <>
                {!isEvent && !isShared && !isCompleted && (
                  isTimerActive ? (
                    <button
                      onClick={() => handleStopChrono(t.id)}
                      className="w-5 h-5 bg-amber-400 hover:bg-amber-500 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000]"
                      title="Pause"
                    >
                      <Pause size={8} className="fill-black text-black" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartChrono(t.id)}
                      className="w-5 h-5 bg-indigo-500 hover:bg-indigo-600 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000]"
                      title="Démarrer"
                    >
                      <Play size={8} className="fill-white text-white ml-0.5" />
                    </button>
                  )
                )}

                {!isShared && (
                  <button
                    onClick={() => toggleTaskCompletion(t.id)}
                    className={`w-5 h-5 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] ${
                      isCompleted ? "bg-green-400 hover:bg-green-500" : "bg-gray-100 hover:bg-emerald-300"
                    }`}
                    title={isCompleted ? "Rétablir" : "Valider"}
                  >
                    <Check size={8} className="text-black font-extrabold" />
                  </button>
                )}

                {!isShared && onDuplicate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(t);
                    }}
                    className="w-5 h-5 bg-white hover:bg-yellow-100 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] text-black p-0.5"
                    title="Dupliquer"
                  >
                    <Copy size={8} />
                  </button>
                )}

                {!isShared && (
                  <button
                    onClick={() => setEditingTaskId(t.id)}
                    className="w-5 h-5 bg-white hover:bg-gray-100 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] text-black p-0.5"
                    title="Modifier"
                  >
                    <Edit2 size={8} />
                  </button>
                )}

                {!isShared && (
                  <button
                    onClick={() => setTaskDeletingId(t.id)}
                    className="w-5 h-5 bg-white hover:bg-red-100 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] text-red-500 p-0.5"
                    title="Supprimer"
                  >
                    <Trash2 size={8} />
                  </button>
                )}

                {!isShared && (
                  <button
                    onClick={() => toggleStarTask(t.id)}
                    className="w-5 h-5 bg-white hover:bg-red-50 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] p-0.5"
                    title={t.isStarred ? "Désépingler" : "Épingler"}
                  >
                    <Pin size={8} className={t.isStarred ? "text-red-500 fill-red-500" : "text-black"} />
                  </button>
                )}

                {!isShared && (
                  <button
                    onClick={() => toggleDayOfTask(t.id)}
                    className={`w-5 h-5 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] p-0.5 ${
                      t.isDayOf ? "bg-yellow-300" : "bg-white hover:bg-yellow-50"
                    }`}
                    title={t.isDayOf ? "Retirer du Jour de" : "Ajouter au Jour de"}
                  >
                    <Sun size={8} className={t.isDayOf ? "text-amber-500 fill-amber-500" : "text-black"} />
                  </button>
                )}

                {!isShared && onAddSubtaskInline && (
                  <button
                    onClick={() => {
                      if (!isExpanded) {
                        setExpandedCardIds((prev) => ({ ...prev, [t.id]: true }));
                      }
                      setIsAddingSub(!isAddingSub);
                    }}
                    className={`w-5 h-5 bg-white hover:bg-indigo-50 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] p-0.5 ${isAddingSub ? 'bg-indigo-100' : ''}`}
                    title="Ajouter sous-tâche"
                  >
                    <Plus size={8} className="text-black" />
                  </button>
                )}

                {isShared && (
                  <button
                    onClick={() => handleImportSharedEvent(t)}
                    className="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white font-mono font-black text-[9px] border border-black cursor-pointer shadow-[1px_1px_0px_#000]"
                  >
                    📥 IMPORTER
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* SECTION D'EXPANSION SOUS-TÂCHES & DESCRIPTION */}
          {isExpanded && (
            <div className="mt-2.5 pt-2.5 border-t border-dashed border-black/25 w-full" onClick={(e) => e.stopPropagation()}>
              {t.description && (
                <p className="text-[10px] text-gray-600 dark:text-slate-300 italic mb-2.5 whitespace-pre-wrap">{t.description}</p>
              )}
              {subtasks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-gray-500 dark:text-slate-400 mb-1">Sous-tâches :</p>
                  <div className="space-y-1 h-auto">
                    {subtasks.map(st => {
                      const isSubCompleted = st.status === 'done' || st.isCompleted;
                      return (
                        <label 
                          key={st.id} 
                          className="flex items-center gap-2 p-1.5 border border-black/10 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-mono cursor-pointer select-none"
                        >
                          <input 
                            type="checkbox"
                            checked={isSubCompleted}
                            onChange={() => {
                              toggleTaskCompletion(st.id);
                            }}
                            className="accent-black h-3.5 w-3.5 cursor-pointer shrink-0"
                          />
                          <span className={`truncate flex-grow ${isSubCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-gray-850 dark:text-slate-200'}`}>
                            {st.title}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Formulaire ajout rapide sous-tâche */}
              {onAddSubtaskInline && isAddingSub && (
                <div className="mt-2.5 pt-2 border-t border-dashed border-black/15">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newSubTitle.trim()) {
                        onAddSubtaskInline(t.id, newSubTitle.trim());
                        setNewSubTitle("");
                        setIsAddingSub(false);
                      }
                    }}
                    className="flex gap-1 items-center w-full"
                  >
                    <input
                      type="text"
                      value={newSubTitle}
                      onChange={(e) => setNewSubTitle(e.target.value)}
                      placeholder="Sous-tâche..."
                      className="flex-grow border border-black dark:border-slate-700 p-1 text-[10px] font-mono bg-white dark:bg-slate-900 text-black dark:text-white outline-none h-6"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!newSubTitle.trim()}
                      className="bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 border border-black dark:border-slate-700 px-2.5 py-0.5 text-[9px] font-black uppercase h-6 cursor-pointer"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingSub(false);
                        setNewSubTitle("");
                      }}
                      className="border border-black dark:border-slate-700 bg-white dark:bg-slate-900 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-850 px-2 py-0.5 text-[9px] font-black uppercase h-6 cursor-pointer"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              )}

              {/* Historique du temps passé */}
              {((t.timeLog && t.timeLog.length > 0) || (t.workHistory && Object.keys(t.workHistory).length > 0) || (t.timeSpentSeconds || 0) > 0) && (
                <div className="mt-2.5 pt-2 border-t border-dashed border-black/15 text-[10px] font-mono" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-1 text-slate-800 dark:text-slate-200 font-bold">
                    <span className="flex items-center gap-1">
                      <Clock size={10} className="text-indigo-600" />
                      <span>HISTORIQUE DES TEMPS PASSED</span>
                    </span>
                    <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 px-1 py-0.2 border border-black">
                      Total: {Math.floor(((t.timeSpentSeconds || t.accumulatedTime || 0)) / 60)} min ({(((t.timeSpentSeconds || t.accumulatedTime || 0) / 3600)).toFixed(1)}h)
                    </span>
                  </div>

                  {/* Logs détaillés */}
                  {t.timeLog && t.timeLog.length > 0 ? (
                    <div className="max-h-24 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-900 p-1.5 border border-black/20">
                      {[...t.timeLog].reverse().map((log) => (
                        <div key={log.id} className="flex justify-between items-center text-[9px] border-b border-black/10 dark:border-slate-800 pb-0.5">
                          <span className="font-bold text-gray-700 dark:text-slate-300">{log.date}</span>
                          <span className="font-black text-indigo-700 dark:text-indigo-400">+{log.duration} min</span>
                        </div>
                      ))}
                    </div>
                  ) : t.workHistory && Object.keys(t.workHistory).length > 0 ? (
                    <div className="max-h-24 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-900 p-1.5 border border-black/20">
                      {Object.entries(t.workHistory).map(([d, sec]) => (
                        <div key={d} className="flex justify-between items-center text-[9px] border-b border-black/10 dark:border-slate-800 pb-0.5">
                          <span className="font-bold text-gray-700 dark:text-slate-300">{d}</span>
                          <span className="font-black text-indigo-700 dark:text-indigo-400">+{Math.round(sec / 60)} min</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Formulaire de saisie manuelle du temps */}
              {onLogTime && (
                <div className="mt-2.5 pt-2 border-t border-dashed border-black/15" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 text-[9px] font-mono font-bold mb-1 text-slate-700 dark:text-slate-300">
                    <Clock size={10} />
                    <span>SAISIE MANUELLE DU TEMPS</span>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const mins = parseInt(manualDuration, 10);
                      if (mins > 0) {
                        onLogTime(t.id, mins, manualDate);
                        setManualDuration("");
                      }
                    }}
                    className="flex items-center gap-1.5 flex-wrap"
                  >
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
                        onClick={() => onLogTime(t.id, -5, manualDate)}
                        className="text-[8px] font-mono font-bold bg-rose-100 hover:bg-rose-200 border border-black px-1 py-0.2 shadow-[1px_1px_0px_#000] cursor-pointer text-black"
                      >
                        -5m
                      </button>
                      {[5, 15, 30, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => onLogTime(t.id, mins, manualDate)}
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
        </>
      )}
    </div>
  );
}

interface TodayViewProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
  onNavigate: (view: string) => void;
  sharedEvents?: Task[];
  onDuplicate?: (item: Task | Habit | RecurringTask) => void;
}

export default function TodayView({ db, updateDb, onNavigate, sharedEvents = [], onDuplicate }: TodayViewProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});
  const [ticker, setTicker] = useState(0);
  const [activeTab, setActiveTab] = useState<"todo" | "completed">("todo");

  // Importation en ligne d'un événement depuis un agenda partagé
  const handleImportSharedEvent = (ev: Task) => {
    try {
      const startDateTime = ev.startTime || new Date(`${ev.dueDate}T${ev.scheduledTime || "10:00"}:00`).toISOString();
      const endDateTime = ev.endTime || new Date(new Date(startDateTime).getTime() + (ev.durationMinutes || 30) * 60 * 1000).toISOString();
      
      const newEvent: Task = {
        id: `event-${Date.now()}`,
        title: ev.title,
        description: ev.description || `Importé de l'agenda partagé « ${ev.sharedCalendarName} »`,
        createdAt: new Date().toISOString(),
        isCompleted: false,
        importance: 0,
        urgency: 0,
        mentalLoad: 0,
        easiness: 0,
        score: 0,
        isStarred: false,
        dueDate: ev.dueDate,
        scheduledTime: ev.scheduledTime,
        durationMinutes: ev.durationMinutes || 30,
        timeSpentSeconds: 0,
        rewardValue: 15,
        chronoRewardValue: 0,
        preparationIds: [],
        dependencies: [],
        type: "event",
        planningStatus: "scheduled",
        startTime: startDateTime,
        endTime: endDateTime,
        isGoogleCalendarSynced: false,
        recurrence: ev.recurrence || "none",
        googleColorId: ev.googleColorId,
        isAllDay: ev.isAllDay
      };

      updateDb({
        ...db,
        tasks: [newEvent, ...db.tasks]
      });
    } catch (err) {
      console.error("Erreur lors de l'importation de l'événement partagé:", err);
    }
  };

  const handleAddSubtaskInline = (parentTaskId: string, title: string) => {
    const parentTask = db.tasks.find(tk => tk.id === parentTaskId);
    const newSubtask: Task = {
      id: "task_" + Math.random().toString(36).substring(2, 11),
      title: title.trim(),
      description: "",
      parentTaskId: parentTaskId,
      parentId: parentTaskId,
      status: "todo",
      planningStatus: "backlog",
      isCompleted: false,
      importance: 5,
      urgency: 5,
      mentalLoad: 5,
      easiness: 5,
      score: 15,
      isStarred: false,
      durationMinutes: 30,
      dependencies: [],
      timeSpentSeconds: 0,
      rewardValue: 15,
      chronoRewardValue: 2,
      type: "ponctuelle",
      createdAt: new Date().toISOString(),
      tags: parentTask && parentTask.tags ? [...parentTask.tags] : [],
    };
    updateDb({
      ...db,
      tasks: [...db.tasks, newSubtask]
    });
  };
  
  // Pour la création rapide de tâche directement dans la vue Aujourd'hui (confort d'intégration)
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskImportance, setNewTaskImportance] = useState(5);
  const [newTaskUrgency, setNewTaskUrgency] = useState(5);
  const [newTaskMental, setNewTaskMental] = useState(5);
  const [newTaskEasiness, setNewTaskEasiness] = useState(5);
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // Épinglage d'élément existant State
  const [selectedElementToPin, setSelectedElementToPin] = useState<string>("");
  const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];

  // Drag and Drop States pour la réorganisation des épinglés et des habitudes
  const [draggedPinnedIndex, setDraggedPinnedIndex] = useState<number | null>(null);
  const [draggedHabitIndex, setDraggedHabitIndex] = useState<number | null>(null);

  // Suggestions Counter
  const [suggestionCount, setSuggestionCount] = useState(3);

  // Synchronisation du minuteur unifié (Tasks, Habits, RecurringTasks)
  const hasActiveTimer = 
    db.tasks.some((t) => t.planningStatus === "in-progress" && !t.isPaused) ||
    db.habits.some((h) => !h.isPaused && h.lastResumeTime) ||
    db.recurringTasks?.some((rt) => !rt.isPaused && rt.lastResumeTime);

  useEffect(() => {
    if (!hasActiveTimer) return;
    const interval = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasActiveTimer]);

  const getTaskElapsedSeconds = (t: Task) => {
    let secs = t.accumulatedTime || 0;
    if (t.planningStatus === "in-progress" && !t.isPaused && t.lastResumeTime) {
      secs += Math.round((Date.now() - new Date(t.lastResumeTime).getTime()) / 1000);
    }
    return Math.max(0, secs);
  };

  const getElapsedSeconds = (item: any, type: "task" | "habit" | "recurring") => {
    if (type === "task") {
      return getTaskElapsedSeconds(item);
    }
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

  const handleLogTaskTime = (taskId: string, durationMinutes: number, dateStr?: string) => {
    const dStr = dateStr || todayStr;
    const extraSec = durationMinutes * 60;
    const targetTask = db.tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const updatedTasks = db.tasks.map((t) => {
      if (t.id === taskId) {
        const timeLogs = t.timeLog || [];
        const newLogEntry = { id: `log-${Date.now()}`, date: dStr, duration: durationMinutes };
        const currentWorkSec = t.workHistory?.[dStr] || 0;
        const newWorkSec = Math.max(0, currentWorkSec + extraSec);
        return {
          ...t,
          timeSpentSeconds: Math.max(0, (t.timeSpentSeconds || 0) + extraSec),
          accumulatedTime: Math.max(0, (t.accumulatedTime || 0) + extraSec),
          timeLog: [...timeLogs, newLogEntry],
          workHistory: {
            ...(t.workHistory || {}),
            [dStr]: newWorkSec
          }
        };
      }
      return t;
    });

    const updatedProfile = { ...db.userProfile };
    const rewardRate = targetTask.chronoRewardValue || 1;
    if (durationMinutes > 0) {
      const extraCoins = Math.max(1, durationMinutes * rewardRate);
      updatedProfile.coins = (updatedProfile.coins || 0) + extraCoins;
    } else if (durationMinutes < 0) {
      const lostCoins = Math.abs(durationMinutes) * rewardRate;
      updatedProfile.coins = Math.max(0, (updatedProfile.coins || 0) - lostCoins);
    }

    updateDb({
      ...db,
      tasks: updatedTasks,
      userProfile: updatedProfile
    });
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

  const renderRecurringCard = (rt: RecurringTask, borderClr: string = "border-black", hideActionsByDefault: boolean = false) => {
    return (
      <RecurringCard
        key={rt.id}
        rt={rt}
        todayStr={todayStr}
        borderClr={borderClr}
        expandedCardIds={expandedCardIds}
        setExpandedCardIds={(id, val) => setExpandedCardIds(prev => ({ ...prev, [id]: val }))}
        onStartChrono={(id) => handleStartUnifiedChrono(id, "recurring")}
        onStopChrono={(id) => handleStopUnifiedChrono(id, "recurring")}
        onComplete={toggleRecurringComplete}
        onPin={toggleRecurringPin}
        onToggleDayOf={toggleDayOfRecurring}
        onLogManualTime={handleLogRecurringTaskTime}
        onDuplicate={onDuplicate}
        getElapsedSeconds={getElapsedSeconds}
        formatTimer={formatTimer}
        hideActionsByDefault={hideActionsByDefault}
      />
    );
  };

  const renderTaskCard = (t: Task, borderClr: string = "border-black", hideActionsByDefault: boolean = false) => {
    return (
      <ResponsiveTaskCard
        key={t.id}
        t={t}
        borderClr={borderClr}
        editingTaskId={editingTaskId}
        taskDeletingId={taskDeletingId}
        expandedCardIds={expandedCardIds}
        setExpandedCardIds={setExpandedCardIds}
        setEditingTaskId={setEditingTaskId}
        setTaskDeletingId={setTaskDeletingId}
        toggleTaskCompletion={toggleTaskCompletion}
        deleteTaskInline={deleteTaskInline}
        archiveTaskInline={archiveTaskInline}
        handleStartChrono={handleStartChrono}
        handleStopChrono={handleStopChrono}
        toggleStarTask={toggleStarTask}
        toggleDayOfTask={toggleDayOfTask}
        handleImportSharedEvent={handleImportSharedEvent}
        handleSaveTask={handleSaveTask}
        getEventColorClasses={getEventColorClasses}
        formatTimer={formatTimer}
        getTaskElapsedSeconds={getTaskElapsedSeconds}
        allTasks={db.tasks}
        onAddSubtaskInline={handleAddSubtaskInline}
        hideActionsByDefault={hideActionsByDefault}
        onDuplicate={onDuplicate}
        onLogTime={handleLogTaskTime}
      />
    );
  };

  // Fonction utilitaire centralisée pour vérifier si une tâche est complétée
  const isTaskDone = (t: Task): boolean => {
    return Boolean(t.isCompleted || t.status === "done" || t.planningStatus === "done");
  };

  // Récupérer les tâches non complétées et complétées de l'application (exclut les routines de planification)
  const pendingTasks = db.tasks.filter((t) => !t.isArchived && !isTaskDone(t) && t.type !== "routine" && !t.isPlanningOnly);
  const completedTasks = db.tasks.filter((t) => !t.isArchived && isTaskDone(t) && t.type !== "routine" && !t.isPlanningOnly);

  const completedTodayTasks = db.tasks.filter((t) => {
    return !t.isArchived && isTaskDone(t) && t.type !== "routine" && !t.isPlanningOnly && t.completedAt && t.completedAt.split("T")[0] === todayStr;
  });

  // Tâches non complétées mais travaillées aujourd'hui (workHistory > 0 ou chrono actif)
  const workedTasksToday = db.tasks.filter((t) => {
    if (t.isArchived || t.type === "routine" || t.isPlanningOnly) return false;
    if (isTaskDone(t) && t.completedAt && t.completedAt.split("T")[0] === todayStr) return false;
    const workSec = (t.workHistory?.[todayStr] || 0) + (t.lastResumeTime && !t.isPaused ? Math.round((Date.now() - new Date(t.lastResumeTime).getTime()) / 1000) : 0);
    return workSec >= 60;
  });

  // Habitudes travaillées aujourd'hui
  const workedHabitsToday = db.habits.filter((h) => {
    if (h.isArchived) return false;
    const workSec = (h.workHistory?.[todayStr] || 0) + (h.lastResumeTime && !h.isPaused ? Math.round((Date.now() - new Date(h.lastResumeTime).getTime()) / 1000) : 0);
    const hasHistoryToday = h.history?.[todayStr] > 0;
    return workSec >= 60 || hasHistoryToday;
  });

  // Tâches récurrentes travaillées aujourd'hui
  const workedRecurringToday = (db.recurringTasks || []).filter((rt) => {
    if (rt.isArchived) return false;
    const workSec = (rt.workHistory?.[todayStr] || 0) + (rt.lastResumeTime && !rt.isPaused ? Math.round((Date.now() - new Date(rt.lastResumeTime).getTime()) / 1000) : 0);
    const isCompletedToday = rt.history?.[todayStr] > 0;
    return workSec >= 60 || isCompletedToday;
  });

  // Achats et temps de loisir sur les items de la boutique effectués aujourd'hui
  const rewardItemsToday: Array<{
    id: string;
    title: string;
    itemType: "reward";
    isCompleted: boolean;
    minutes: number;
    completedAt?: string;
    coinsDelta: number;
    raw: any;
  }> = [];

  (db.rewards || []).forEach((r) => {
    const rewardIcon = typeof r.icon === "string" && r.icon.trim() ? r.icon : (r.type === "leisure" ? "📺" : "🎁");

    // 1. Achats forfaitaires effectués aujourd'hui
    if (r.purchaseHistory && Array.isArray(r.purchaseHistory)) {
      r.purchaseHistory.forEach((p, idx) => {
        if (p.date && p.date.split("T")[0] === todayStr) {
          const cost = p.cost !== undefined ? p.cost : (r.costCoins || 0);
          rewardItemsToday.push({
            id: `reward-buy-${r.id}-${idx}-${p.date}`,
            title: `${rewardIcon} ${r.title}`,
            itemType: "reward",
            isCompleted: true,
            completedAt: p.date,
            minutes: 0,
            coinsDelta: -Math.abs(cost),
            raw: r
          });
        }
      });
    }

    // 2. Temps passé sur les loisirs aujourd'hui
    if (r.timeLog && Array.isArray(r.timeLog)) {
      let durationToday = 0;
      let lastDate = "";
      r.timeLog.forEach((log) => {
        if (log.date && log.date.split("T")[0] === todayStr) {
          durationToday += log.duration || 0;
          if (log.date) lastDate = log.date;
        }
      });
      if (durationToday > 0) {
        const costPerMin = r.costCoins !== undefined ? r.costCoins : 1;
        const totalCost = durationToday * costPerMin;
        rewardItemsToday.push({
          id: `reward-time-${r.id}`,
          title: `${rewardIcon} ${r.title}`,
          itemType: "reward",
          isCompleted: true,
          completedAt: lastDate || todayStr,
          minutes: durationToday,
          coinsDelta: -Math.abs(totalCost),
          raw: r
        });
      }
    }
  });

  // Items unifiés pour l'affichage aujourd'hui avec gains et dépenses en CS
  const completedOrWorkedItems = [
    ...completedTodayTasks.map((t) => {
      const workSec = (t.workHistory?.[todayStr] || 0);
      const minutes = Math.floor(workSec / 60);
      const completionGain = t.rewardValue !== undefined ? t.rewardValue : 15;
      const chronoGain = minutes * (t.chronoRewardValue || 1);
      const coinsDelta = completionGain + chronoGain;
      return {
        id: t.id,
        title: t.title,
        itemType: "task" as const,
        isCompleted: true,
        minutes,
        completedAt: t.completedAt,
        coinsDelta,
        raw: t
      };
    }),
    ...workedTasksToday.map((t) => {
      const workSec = (t.workHistory?.[todayStr] || 0) + (t.lastResumeTime && !t.isPaused ? Math.round((Date.now() - new Date(t.lastResumeTime).getTime()) / 1000) : 0);
      const minutes = Math.floor(workSec / 60);
      const coinsDelta = minutes * (t.chronoRewardValue || 1);
      return {
        id: t.id,
        title: t.title,
        itemType: "task" as const,
        isCompleted: false,
        minutes,
        coinsDelta,
        raw: t
      };
    }),
    ...workedHabitsToday.map((h) => {
      const workSec = (h.workHistory?.[todayStr] || 0) + (h.lastResumeTime && !h.isPaused ? Math.round((Date.now() - new Date(h.lastResumeTime).getTime()) / 1000) : 0);
      let minutes = Math.floor(workSec / 60);
      if (minutes === 0 && h.type === "chrono" && h.history?.[todayStr]) {
        minutes = h.history[todayStr];
      }
      const isCompleted = h.currentValue >= h.targetValue || (h.history?.[todayStr] || 0) >= h.targetValue;
      const completionGain = isCompleted ? (h.rewardValue !== undefined ? h.rewardValue : 10) : 0;
      const chronoGain = minutes * (h.chronoRewardValue || 1);
      const coinsDelta = completionGain + (minutes > 0 ? chronoGain : 0);
      return {
        id: h.id,
        title: h.title,
        itemType: "habit" as const,
        isCompleted,
        minutes,
        coinsDelta,
        raw: h
      };
    }),
    ...workedRecurringToday.map((rt) => {
      const workSec = (rt.workHistory?.[todayStr] || 0) + (rt.lastResumeTime && !rt.isPaused ? Math.round((Date.now() - new Date(rt.lastResumeTime).getTime()) / 1000) : 0);
      const minutes = Math.floor(workSec / 60);
      const isCompleted = (rt.history?.[todayStr] || 0) > 0;
      const completionGain = isCompleted ? (rt.rewardValue !== undefined ? rt.rewardValue : 10) : 0;
      const chronoGain = minutes * (rt.chronoRewardValue || 1);
      const coinsDelta = completionGain + chronoGain;
      return {
        id: rt.id,
        title: rt.title,
        itemType: "recurring" as const,
        isCompleted,
        minutes,
        coinsDelta,
        raw: rt
      };
    }),
    ...rewardItemsToday,
    ...(db.sleepWakeLogs || []).filter((l) => l.date === todayStr && l.wakeUpTime).map((l) => ({
      id: l.id,
      title: `🌅 Réveil matinal (${l.wakeUpTime})`,
      itemType: "wake" as const,
      isCompleted: true,
      minutes: 0,
      coinsDelta: l.coinsRewarded || 0,
      raw: l
    })),
    ...(db.sleepWakeLogs || []).filter((l) => l.date === todayStr && l.bedTime).map((l) => ({
      id: `bed-${l.id}`,
      title: `🌙 Coucher (${l.bedTime})`,
      itemType: "wake" as const,
      isCompleted: true,
      minutes: 0,
      coinsDelta: l.bedTimeCoinsRewarded || 0,
      raw: l
    }))
  ];

  // Tâches en retard (due date dans le passé)
  const overdueTasks = pendingTasks.filter((t) => {
    if (!t.dueDate) return false;
    return t.dueDate < todayStr;
  });

  // Tâches planifiées aujourd'hui (incluant les événements récurrents ou ponctuels des agendas généraux + du calendrier partagé)
  const scheduledTodayTasks = [
    ...pendingTasks.filter((t) => {
      if (t.type === "event") {
        if (t.dueDate === todayStr) return true;
        if (t.recurrence && t.recurrence !== 'none') {
          const todayDate = new Date(todayStr);
          const referenceDate = new Date(t.dueDate || t.createdAt);
          if (t.recurrence === 'daily') return true;
          if (t.recurrence === 'weekly') return todayDate.getDay() === referenceDate.getDay();
          if (t.recurrence === 'monthly') return todayDate.getDate() === referenceDate.getDate();
        }
        if (t.scheduledTime && (!t.dueDate || t.dueDate === todayStr)) return true;
        return false;
      }
      return !!t.scheduledTime || t.dueDate === todayStr;
    }),
    ...(sharedEvents || []).filter(e => e.dueDate === todayStr)
  ];

  // 5 dernières tâches ajoutées (excluant les événements d'agenda, les routines et les tâches validées)
  const lastAddedTasks = [...db.tasks]
    .filter((t) => !t.isArchived && !isTaskDone(t) && t.type !== "event" && t.type !== "routine" && !t.isPlanningOnly)
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  // Les événements n'entrent pas dans le classement des champions et uniquement les tâches non terminées
  const rankingPendingTasks = pendingTasks.filter((t) => t.type !== "event" && !isTaskDone(t));

  // Trouver les 5 tâches championnes par critère
  const maxCumulativeTask = rankingPendingTasks.length > 0
    ? rankingPendingTasks.reduce((prev, current) => {
        const scorePrev = calculateTaskScore(prev);
        const scoreCurr = calculateTaskScore(current);
        return scoreCurr > scorePrev ? current : prev;
      })
    : null;

  const maxUrgencyTask = rankingPendingTasks.length > 0
    ? rankingPendingTasks.reduce((prev, current) => {
        return (current.urgency || 0) > (prev.urgency || 0) ? current : prev;
      })
    : null;

  const maxImportanceTask = rankingPendingTasks.length > 0
    ? rankingPendingTasks.reduce((prev, current) => {
        return (current.importance || 0) > (prev.importance || 0) ? current : prev;
      })
    : null;

  const maxMentalTask = rankingPendingTasks.length > 0
    ? rankingPendingTasks.reduce((prev, current) => { 
        return (current.mentalLoad || 0) > (prev.mentalLoad || 0) ? current : prev;
      })
    : null;

  const maxEasinessTask = rankingPendingTasks.length > 0
    ? rankingPendingTasks.reduce((prev, current) => {
        return (current.easiness || 0) > (prev.easiness || 0) ? current : prev;
      })
    : null;

  // Tâche ou habitude épinglée (Starred)
  const starredTasks = pendingTasks.filter((t) => !t.isArchived && t.isStarred && !isTaskDone(t));
  const starredHabits = db.habits.filter((h) => !h.isArchived && (h as any).isStarred);
  const starredRecurring = db.recurringTasks?.filter((rt) => !rt.isArchived && (rt as any).isStarred) || [];

  const pinnedElements = [
    ...starredTasks.map(t => ({ ...t, elType: "task" as const })),
    ...starredHabits.map(h => ({ ...h, elType: "habit" as const })),
    ...starredRecurring.map(rt => ({ ...rt, elType: "recurring" as const }))
  ];

  const sortedPinnedElements = [...pinnedElements].sort((a, b) => {
    const orderA = a.sortOrder !== undefined ? a.sortOrder : pinnedElements.indexOf(a);
    const orderB = b.sortOrder !== undefined ? b.sortOrder : pinnedElements.indexOf(b);
    return orderA - orderB;
  });

  const sortedHabits = db.habits.filter(h => !h.isArchived).sort((a, b) => {
    const orderA = a.sortOrder !== undefined ? a.sortOrder : db.habits.indexOf(a);
    const orderB = b.sortOrder !== undefined ? b.sortOrder : db.habits.indexOf(b);
    return orderA - orderB;
  });

  // Éléments du "Jour de"
  const dayOfTasks = db.tasks.filter((t) => !t.isArchived && t.isDayOf && !isTaskDone(t) && t.type !== "routine" && !t.isPlanningOnly);
  const dayOfHabits = db.habits.filter((h) => !h.isArchived && h.isDayOf);
  const dayOfRecurring = (db.recurringTasks || []).filter((rt) => !rt.isArchived && rt.isDayOf);
  const dayOfElements = [
    ...dayOfTasks.map((t) => ({ ...t, elType: "task" as const })),
    ...dayOfHabits.map((h) => ({ ...h, elType: "habit" as const })),
    ...dayOfRecurring.map((rt) => ({ ...rt, elType: "recurring" as const }))
  ];

  // LOGIQUE DRAG & DROP POUR ÉPINGLÉS & HABITUDES
  const handlePinnedDragStart = (e: React.DragEvent, index: number) => {
    setDraggedPinnedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handlePinnedDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePinnedDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedPinnedIndex === null || draggedPinnedIndex === targetIndex) return;

    const reorderedPinned = [...sortedPinnedElements];
    const [draggedItem] = reorderedPinned.splice(draggedPinnedIndex, 1);
    reorderedPinned.splice(targetIndex, 0, draggedItem);

    const updatedTasks = [...db.tasks];
    const updatedHabits = [...db.habits];
    const updatedRecurring = [...(db.recurringTasks || [])];

    reorderedPinned.forEach((item, index) => {
      if (item.elType === "task") {
        const idx = updatedTasks.findIndex(t => t.id === item.id);
        if (idx !== -1) {
          updatedTasks[idx] = { ...updatedTasks[idx], sortOrder: index };
        }
      } else if (item.elType === "habit") {
        const idx = updatedHabits.findIndex(h => h.id === item.id);
        if (idx !== -1) {
          updatedHabits[idx] = { ...updatedHabits[idx], sortOrder: index };
        }
      } else if (item.elType === "recurring") {
        const idx = updatedRecurring.findIndex(rt => rt.id === item.id);
        if (idx !== -1) {
          updatedRecurring[idx] = { ...updatedRecurring[idx], sortOrder: index };
        }
      }
    });

    updateDb({
      ...db,
      tasks: updatedTasks,
      habits: updatedHabits,
      recurringTasks: updatedRecurring
    });

    setDraggedPinnedIndex(null);
  };

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

  // Épingler un élément existant (tâche, habitude ou tâche récurrente)
  const handlePinExistingElement = () => {
    if (!selectedElementToPin) return;
    const [type, id] = selectedElementToPin.split("::");
    if (type === "task") {
      const updatedTasks = db.tasks.map((t) => {
        if (t.id === id) {
          return { ...t, isStarred: true };
        }
        return t;
      });
      updateDb({ ...db, tasks: updatedTasks });
    } else if (type === "habit") {
      const updatedHabits = db.habits.map((h) => {
        if (h.id === id) {
          return { ...h, isStarred: true };
        }
        return h;
      });
      updateDb({ ...db, habits: updatedHabits });
    } else if (type === "recurring") {
      const updatedRecurring = db.recurringTasks.map((rt) => {
        if (rt.id === id) {
          return { ...rt, isStarred: true };
        }
        return rt;
      });
      updateDb({ ...db, recurringTasks: updatedRecurring });
    }
    setSelectedElementToPin("");
  };

  // Basculer l'état étoile (pin) pour une tâche
  const toggleStarTask = (taskId: string) => {
    const updatedTasks = db.tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, isStarred: !t.isStarred };
      }
      return t;
    });
    updateDb({ ...db, tasks: updatedTasks });
  };

  const toggleDayOfTask = (taskId: string) => {
    const updatedTasks = db.tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, isDayOf: !t.isDayOf };
      }
      return t;
    });
    updateDb({ ...db, tasks: updatedTasks });
  };

  // Basculer l'état étoile (pin) pour une habitude
  const toggleStarHabit = (habitId: string) => {
    const updatedHabits = db.habits.map((h) => {
      if (h.id === habitId) {
        return { ...h, isStarred: !(h as any).isStarred };
      }
      return h;
    });
    updateDb({ ...db, habits: updatedHabits });
  };

  const toggleDayOfHabit = (habitId: string) => {
    const updatedHabits = db.habits.map((h) => {
      if (h.id === habitId) {
        return { ...h, isDayOf: !h.isDayOf };
      }
      return h;
    });
    updateDb({ ...db, habits: updatedHabits });
  };

  const toggleDayOfRecurring = (rtId: string) => {
    const updatedRecurring = (db.recurringTasks || []).map((rt) => {
      if (rt.id === rtId) {
        return { ...rt, isDayOf: !rt.isDayOf };
      }
      return rt;
    });
    updateDb({ ...db, recurringTasks: updatedRecurring });
  };

  // Complétion de tâche unifiée
  const toggleTaskCompletion = (taskId: string) => {
    const target = db.tasks.find((t) => t.id === taskId);
    if (!target) return;

    let isTimerActive = target.planningStatus === "in-progress" && !target.isPaused;
    let extraSec = 0;
    if (isTimerActive && target.lastResumeTime) {
      extraSec = Math.round((Date.now() - new Date(target.lastResumeTime).getTime()) / 1000);
    }

    const wasCompleted = isTaskDone(target);
    const nextCompleted = !wasCompleted;

    const updatedTasks = db.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          isCompleted: nextCompleted,
          status: nextCompleted ? ("done" as const) : ("todo" as const),
          completedAt: nextCompleted ? (t.completedAt || new Date().toISOString()) : undefined,
          planningStatus: nextCompleted ? ("done" as const) : (t.scheduledTime ? ("scheduled" as const) : ("backlog" as const)),
          isPaused: nextCompleted ? true : t.isPaused,
          lastResumeTime: nextCompleted ? undefined : t.lastResumeTime,
          timeSpentSeconds: (t.timeSpentSeconds || 0) + extraSec
        };
      }
      // Si on valide la tâche mère, valider aussi automatiquement les sous-tâches
      if (nextCompleted && (t.parentId === taskId || t.parentTaskId === taskId)) {
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
      return t;
    });

    let updatedProfile = { ...db.userProfile };
    if (nextCompleted) {
      const minutesWorked = Math.floor(extraSec / 60);
      const extraCoins = Math.max(1, minutesWorked * (target.chronoRewardValue || 1));
      updatedProfile.coins += (target.rewardValue || 15) + (minutesWorked > 0 ? extraCoins : 0);
    } else {
      updatedProfile.coins = Math.max(0, updatedProfile.coins - (target.rewardValue || 15));
    }

    updateDb({
      ...db,
      tasks: updatedTasks,
      userProfile: updatedProfile,
    });
  };

  // Sauvegarde après modification en ligne
  const handleSaveTask = (updatedTask: Task) => {
    const updatedTasks = db.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    updateDb({
      ...db,
      tasks: updatedTasks
    });
    setEditingTaskId(null);
  };

  // Lancer le chronomètre unifié (Tâches, Habitudes, ou Tâches Récurrentes)
  const handleStartUnifiedChrono = (id: string, type: "task" | "habit" | "recurring") => {
    const nowISO = new Date().toISOString();
    
    // 1. Pause les tâches normales
    const updatedTasks = db.tasks.map((t) => {
      if (type === "task" && t.id === id) {
        return {
          ...t,
          planningStatus: "in-progress" as const,
          startTime: t.startTime || nowISO,
          lastResumeTime: nowISO,
          isPaused: false
        };
      } else if (t.planningStatus === "in-progress" && !t.isPaused) {
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

  // Suspendre le chronomètre unifié
  const handleStopUnifiedChrono = (id: string, type: "task" | "habit" | "recurring") => {
    const now = Date.now();
    let updatedProfile = {
      ...db.userProfile,
      activeChrono: { id, type }
    };
    
    if (type === "task") {
      const targetTask = db.tasks.find((t) => t.id === id);
      if (!targetTask) return;
      const extraSec = targetTask.lastResumeTime
        ? Math.round((now - new Date(targetTask.lastResumeTime).getTime()) / 1000)
        : 0;
      const totalSec = (targetTask.accumulatedTime || 0) + extraSec;

      const updatedTasks = db.tasks.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            planningStatus: t.scheduledTime ? "scheduled" as const : "backlog" as const,
            accumulatedTime: totalSec,
            timeSpentSeconds: (t.timeSpentSeconds || 0) + extraSec,
            isPaused: true,
            lastResumeTime: undefined,
            workHistory: {
              ...(t.workHistory || {}),
              [todayStr]: (t.workHistory?.[todayStr] || 0) + extraSec
            }
          };
        }
        return t;
      });

      const minutesWorked = Math.floor(extraSec / 60);
      if (minutesWorked > 0) {
        const extraCoins = Math.max(1, minutesWorked * (targetTask.chronoRewardValue || 1));
        updatedProfile.coins += extraCoins;
      }

      updateDb({
        ...db,
        tasks: updatedTasks,
        userProfile: updatedProfile
      });

    } else if (type === "habit") {
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

  // Rétrocompatibilité avec les listes existantes
  const handleStartChrono = (taskId: string) => {
    handleStartUnifiedChrono(taskId, "task");
  };

  const handleStopChrono = (taskId: string) => {
    handleStopUnifiedChrono(taskId, "task");
  };

  // Complétion pour une tâche récurrente autonome
  const toggleRecurringComplete = (rtId: string) => {
    const updatedRecurring = (db.recurringTasks || []).map((rt) => {
      if (rt.id === rtId) {
        const historyCopy = { ...(rt.history || {}) };
        const isCurrentlyDone = historyCopy[todayStr] > 0;
        historyCopy[todayStr] = isCurrentlyDone ? 0 : 1;
        
        return {
          ...rt,
          history: historyCopy
        };
      }
      return rt;
    });

    const target = db.recurringTasks?.find((rt) => rt.id === rtId);
    let updatedProfile = { ...db.userProfile };
    if (target) {
      const historyCopy = target.history || {};
      const isCurrentlyDone = historyCopy[todayStr] > 0;
      if (!isCurrentlyDone) {
        updatedProfile.coins += (target.rewardValue || 10);
      } else {
        updatedProfile.coins = Math.max(0, updatedProfile.coins - (target.rewardValue || 10));
      }
    }

    updateDb({
      ...db,
      recurringTasks: updatedRecurring,
      userProfile: updatedProfile
    });
  };

  // Basculer l'état étoile (pin) pour une tâche récurrente
  const toggleRecurringPin = (rtId: string) => {
    const updatedRecurring = (db.recurringTasks || []).map((rt) => {
      if (rt.id === rtId) {
        return { ...rt, isStarred: !(rt as any).isStarred };
      }
      return rt;
    });
    updateDb({ ...db, recurringTasks: updatedRecurring });
  };

  // Création rapide d'une tâche
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const calculatedScore = calculateTaskScore({
      importance: newTaskImportance,
      urgency: newTaskUrgency,
      mentalLoad: newTaskMental,
      easiness: newTaskEasiness,
    });

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      description: "",
      createdAt: new Date().toISOString(),
      isCompleted: false,
      importance: newTaskImportance,
      urgency: newTaskUrgency,
      easiness: newTaskEasiness,
      mentalLoad: newTaskMental,
      score: calculatedScore,
      isStarred: true,
      durationMinutes: 30,
      timeSpentSeconds: 0,
      rewardValue: Math.round(calculatedScore * 1.5),
      chronoRewardValue: 1,
      dependencies: [],
      preparationIds: [],
      dueDate: newTaskDueDate || undefined,
    };

    updateDb({
      ...db,
      tasks: [newTask, ...db.tasks],
    });

    setNewTaskTitle("");
    setNewTaskDueDate("");
    setShowQuickAdd(false);
  };

  // Complétion d'habitude binaire/rapide
  const toggleHabitValue = (habitId: string) => {
    const targetH = db.habits.find((h) => h.id === habitId);
    if (!targetH) return;

    const isCurrentlyDone = targetH.currentValue >= targetH.targetValue;
    let nextValue = 0;
    
    if (targetH.type === "quantitative" || targetH.type === "counter") {
      nextValue = isCurrentlyDone ? 0 : targetH.currentValue + 1;
    } else {
      nextValue = isCurrentlyDone ? 0 : targetH.targetValue;
    }

    const reachedTargetNow = nextValue >= targetH.targetValue;

    const updatedHabits = db.habits.map((h) => {
      if (h.id === habitId) {
        let streak = h.streak;
        if (reachedTargetNow && h.currentValue < h.targetValue) {
          streak += 1;
        } else if (h.currentValue >= h.targetValue && nextValue < h.targetValue) {
          streak = Math.max(0, streak - 1);
        }

        const historyCopy = { ...h.history };
        historyCopy[todayStr] = nextValue;

        return {
          ...h,
          currentValue: nextValue,
          streak,
          lastCompletedDate: reachedTargetNow ? todayStr : h.lastCompletedDate,
          history: historyCopy,
        };
      }
      return h;
    });

    let updatedProfile = { ...db.userProfile };
    if (reachedTargetNow && !isCurrentlyDone) {
      updatedProfile.coins += targetH.rewardValue;
    } else if (!reachedTargetNow && isCurrentlyDone) {
      updatedProfile.coins = Math.max(0, updatedProfile.coins - targetH.rewardValue);
    }

    updateDb({
      ...db,
      habits: updatedHabits,
      userProfile: updatedProfile,
    });
  };

  // Incrémenter et décrémenter pour habit ou quantitative-counter
  const handleHabitPlus = (habitId: string) => {
    const updatedHabits = db.habits.map((h) => {
      if (h.id === habitId) {
        const nextValue = Math.min(h.targetValue, h.currentValue + 1);
        const reachedTargetNow = nextValue >= h.targetValue;
        
        let streak = h.streak;
        if (reachedTargetNow && h.currentValue < h.targetValue) {
          streak += 1;
        }

        const historyCopy = { ...h.history };
        historyCopy[todayStr] = nextValue;

        return {
          ...h,
          currentValue: nextValue,
          streak,
          lastCompletedDate: reachedTargetNow ? todayStr : h.lastCompletedDate,
          history: historyCopy,
        };
      }
      return h;
    });

    const targetH = db.habits.find((h) => h.id === habitId);
    let updatedProfile = { ...db.userProfile };
    if (targetH && targetH.currentValue < targetH.targetValue && (targetH.currentValue + 1) >= targetH.targetValue) {
      updatedProfile.coins += targetH.rewardValue;
    }

    updateDb({
      ...db,
      habits: updatedHabits,
      userProfile: updatedProfile,
    });
  };

  const handleHabitMinus = (habitId: string) => {
    const updatedHabits = db.habits.map((h) => {
      if (h.id === habitId) {
        const nextValue = Math.max(0, h.currentValue - 1);
        const historyCopy = { ...h.history };
        historyCopy[todayStr] = nextValue;

        let streak = h.streak;
        if (h.currentValue >= h.targetValue && nextValue < h.targetValue) {
          streak = Math.max(0, streak - 1);
        }

        return {
          ...h,
          currentValue: nextValue,
          streak,
          history: historyCopy,
        };
      }
      return h;
    });

    const targetH = db.habits.find((h) => h.id === habitId);
    let updatedProfile = { ...db.userProfile };
    if (targetH && targetH.currentValue >= targetH.targetValue && (targetH.currentValue - 1) < targetH.targetValue) {
      updatedProfile.coins = Math.max(0, updatedProfile.coins - targetH.rewardValue);
    }

    updateDb({
      ...db,
      habits: updatedHabits,
      userProfile: updatedProfile,
    });
  };

  // Supprimer une tâche inline
  const [taskDeletingId, setTaskDeletingId] = useState<string | null>(null);
  const deleteTaskInline = (id: string) => {
    updateDb({
      ...db,
      tasks: db.tasks.filter((t) => t.id !== id),
    });
    setTaskDeletingId(null);
  };

  const archiveTaskInline = (id: string) => {
    updateDb({
      ...db,
      tasks: db.tasks.map((t) => t.id === id ? { ...t, isArchived: true, archivedAt: new Date().toISOString() } : t),
    });
    setTaskDeletingId(null);
  };

  // Formatter l'heure d'une tâche
  const formatTaskTime = (task: Task) => {
    if (task.scheduledTime) return task.scheduledTime;
    if (task.dueDate) {
      try {
        const d = new Date(task.dueDate);
        if (!isNaN(d.getTime()) && task.dueDate.includes("T")) {
          return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        }
      } catch (e) {}
    }
    return "02:00"; // default mockup timing from snapshot
  };

  // Générateur de suggestions heuristiques d'IA de secours
  const generateFreshSuggestions = () => {
    const newSuggestions = [
      {
        id: `sug-${Date.now()}-1`,
        type: "group_tasks" as const,
        title: "Regrouper les micro-tâches de la matinée",
        description: "Enchaîner 3 tâches de faible charge mentale permet de préserver de l'énergie somatique pour cet après-midi.",
        isApplied: false,
        isIgnored: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: `sug-${Date.now()}-2`,
        type: "suggest_habit" as const,
        title: "Prendre une marche cognitive",
        description: "Votre tension clinique est sous-optimale de 15%. Prenez 10 minutes d'exposition solaire.",
        isApplied: false,
        isIgnored: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: `sug-${Date.now()}-3`,
        type: "adjust_schedule" as const,
        title: "Décaler la tâche lourde à 11h00",
        description: "Votre courbe d'attention montre un pic d'efficacité à cette heure. Optimisez votre planning Bento.",
        isApplied: false,
        isIgnored: false,
        createdAt: new Date().toISOString(),
      }
    ].slice(0, suggestionCount);

    updateDb({
      ...db,
      proactiveSuggestions: newSuggestions,
    });
  };

  const handleApplySuggestion = (id: string) => {
    const updated = db.proactiveSuggestions.map((item) =>
      item.id === id ? { ...item, isApplied: true } : item
    );
    updateDb({ ...db, proactiveSuggestions: updated });
  };

  const handleIgnoreSuggestion = (id: string) => {
    const updated = db.proactiveSuggestions.map((item) =>
      item.id === id ? { ...item, isIgnored: true } : item
    );
    updateDb({ ...db, proactiveSuggestions: updated });
  };



  // Cycles de coloration Memphis pour les habitudes
  const getHabitCardColorClass = (index: number) => {
    const colors = [
      "border-[#FFA500] hover:shadow-[4px_4px_0px_0px_#FFA500]", // Orange
      "border-[#FF6B6B] hover:shadow-[4px_4px_0px_0px_#FF6B6B]", // Red/Pink
      "border-[#38BDF8] hover:shadow-[4px_4px_0px_0px_#38BDF8]", // Sky Blue
      "border-[#4ADE80] hover:shadow-[4px_4px_0px_0px_#4ADE80]"  // Green
    ];
    return colors[index % colors.length];
  };

  // Liste réactive de suggestions d'aujourd'hui
  const activeSuggestions = db.proactiveSuggestions?.filter((s) => !s.isApplied && !s.isIgnored) || [];

  return (
    <div className="space-y-6">
      {/* Header compact et épuré */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-yellow-50 border-2 border-black p-2 px-3 rounded-none shadow-[2px_2px_0px_0px_#000] gap-2">
        <div>
          <h1 className="text-sm font-black font-mono tracking-tight text-black flex items-center gap-1.5">
            ☀️ TABLEAU DE BORD
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {(() => {
            const todayWake = (db.sleepWakeLogs || []).find((l) => l.date === todayStr);
            if (todayWake) {
              const isPositive = (todayWake.coinsRewarded || 0) >= 0;
              return (
                <div className={`border-2 border-black px-2 py-1 text-[10px] font-black tracking-tight shadow-[1px_1px_0px_0px_#000] ${isPositive ? 'bg-emerald-100 text-emerald-950' : 'bg-rose-100 text-rose-950'}`}>
                  🌅 {todayWake.wakeUpTime} ({isPositive ? `+${todayWake.coinsRewarded}` : todayWake.coinsRewarded} CS)
                </div>
              );
            }
            return null;
          })()}
          <div className="bg-yellow-400 text-black border-2 border-black px-2.5 py-1 font-mono font-black text-xs flex items-center gap-1.5 shadow-[1px_1px_0px_0px_#000]">
            💰 {db.userProfile.coins} <span className="text-[10px]">Coins</span>
          </div>
          {db.userProfile.debt > 0 && (
            <div className="bg-red-400 text-white border-2 border-black px-2.5 py-1 font-mono font-black text-xs flex items-center gap-1.5 shadow-[1px_1px_0px_0px_#000]">
              🚨 {db.userProfile.debt} <span className="text-[10px]">Dette</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        
        {/* ACCOMPLIES AUJOURD'HUI */}
        {(() => {
          const totalGainsToday = completedOrWorkedItems.reduce((sum, item) => sum + (item.coinsDelta > 0 ? item.coinsDelta : 0), 0);
          const totalExpensesToday = completedOrWorkedItems.reduce((sum, item) => sum + (item.coinsDelta < 0 ? Math.abs(item.coinsDelta) : 0), 0);

          return (
            <div className="space-y-1 bg-emerald-50 border-2 border-black p-2 rounded-none shadow-[2px_2px_0px_0px_#4ADE80]">
              <div className="flex justify-between items-center">
                <h3 className="text-[11px] font-black font-mono text-green-950 flex items-center gap-1 uppercase">
                  <span>🏆</span> Accomplies aujourd'hui ({completedOrWorkedItems.length})
                </h3>
                {(totalGainsToday > 0 || totalExpensesToday > 0) && (
                  <div className="flex items-center gap-1 text-[10px] font-mono font-black">
                    {totalGainsToday > 0 && (
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 px-1.5 py-0.5 shadow-[1px_1px_0px_#000]">
                        +{totalGainsToday} CS
                      </span>
                    )}
                    {totalExpensesToday > 0 && (
                      <span className="bg-rose-100 text-rose-900 border border-rose-400 px-1.5 py-0.5 shadow-[1px_1px_0px_#000]">
                        -{totalExpensesToday} CS
                      </span>
                    )}
                  </div>
                )}
              </div>

              {completedOrWorkedItems.length === 0 ? (
                <div className="border border-dashed border-emerald-300 bg-white p-2 text-center text-xs text-gray-500 font-mono">
                  Aucun élément accompli ou travaillé aujourd'hui. 💪
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {completedOrWorkedItems.map((item) => {
                    const isTask = item.itemType === "task";
                    const isHabit = item.itemType === "habit";
                    const isRecurring = item.itemType === "recurring";
                    const isReward = item.itemType === "reward";
                    const isWake = item.itemType === "wake";
                    
                    const handleToggle = () => {
                      if (isTask) {
                        toggleTaskCompletion(item.id);
                      } else if (isHabit) {
                        toggleHabitValue(item.id);
                      } else if (isRecurring) {
                        toggleRecurringComplete(item.id);
                      }
                    };

                    if (isWake) {
                      const wakeLog = item.raw as SleepWakeLog;
                      const isPositive = (item.coinsDelta ?? wakeLog.coinsRewarded ?? 0) >= 0;
                      return (
                        <div key={`wake-${item.id}`} className="border border-black bg-amber-50 p-1 flex justify-between items-center shadow-[1px_1px_0px_#000]">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="text-xs">🌅</span>
                            <span className="font-bold text-[11px] truncate text-slate-800">
                              Réveil à {wakeLog.wakeUpTime}
                            </span>
                          </div>
                          <span className={`text-[10px] font-black font-mono px-1.5 py-0.5 border shadow-[1px_1px_0px_#000] shrink-0 ${
                            isPositive 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-400' 
                              : 'bg-rose-100 text-rose-800 border-rose-400'
                          }`}>
                            {isPositive ? `+${item.coinsDelta}` : item.coinsDelta} CS
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={`${item.itemType}-${item.id}`} className="border border-black bg-white p-1 flex justify-between items-center shadow-[1px_1px_0px_#000] relative">
                        {isTask && editingTaskId === item.id ? (
                          <div className="w-full z-10">
                            <TaskInlineEditor 
                              task={item.raw as Task} 
                              onSave={handleSaveTask} 
                              onCancel={() => setEditingTaskId(null)} 
                              allTasks={db.tasks}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1 overflow-hidden flex-1 mr-1">
                              {/* Checkbox */}
                              <button
                                onClick={handleToggle}
                                disabled={isReward}
                                className={`w-4 h-4 border border-black flex items-center justify-center text-black transition-colors shrink-0 ${
                                  isReward
                                    ? "bg-amber-400 cursor-default"
                                    : item.isCompleted
                                    ? "bg-[#24B27F] hover:bg-emerald-600 cursor-pointer"
                                    : "bg-white hover:bg-gray-100 cursor-pointer"
                                }`}
                                title={isReward ? "Achat / Loisir Boutique" : item.isCompleted ? "Rétablir" : "Compléter"}
                              >
                                {item.isCompleted && <Check size={10} className="text-white font-bold" />}
                              </button>
                              
                              <span className={`text-[11px] font-semibold leading-none truncate ${
                                item.isCompleted ? (isReward ? "text-gray-700" : "text-gray-400 line-through") : "text-gray-900"
                              }`}>
                                <span className="text-[10px] text-gray-500 font-mono mr-1">
                                  [{isTask ? "T" : isHabit ? "H" : isRecurring ? "R" : "B"}]
                                </span>
                                {item.title}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Badge de secondes travaillées converties en minutes */}
                              {item.minutes > 0 && (
                                <span className="text-[8px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded-sm" title="Temps passé aujourd'hui">
                                  ⏱️ {item.minutes}m
                                </span>
                              )}

                              {item.isCompleted && (item as any).completedAt && (
                                <span className="text-[8px] font-bold text-green-800 bg-green-100 border border-green-300 px-1 py-0.2 rounded-sm" title="Accompli / Effectué à">
                                  ✓ {(item as any).completedAt.includes("T") ? new Date((item as any).completedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "Aujourd'hui"}
                                </span>
                              )}

                              {/* Badge Gain / Dépense en CS bien visible */}
                              {typeof item.coinsDelta === "number" && (
                                <span 
                                  className={`text-[10px] font-black font-mono px-1.5 py-0.5 border shadow-[1px_1px_0px_#000] shrink-0 ${
                                    item.coinsDelta > 0 
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-400' 
                                      : item.coinsDelta < 0 
                                      ? 'bg-rose-100 text-rose-800 border-rose-400' 
                                      : 'bg-gray-100 text-gray-700 border-gray-300'
                                  }`}
                                  title={item.coinsDelta >= 0 ? "Gain en Cs" : "Dépense en Cs"}
                                >
                                  {item.coinsDelta > 0 ? `+${item.coinsDelta}` : item.coinsDelta} CS
                                </span>
                              )}
                              
                              {/* Edit button (Task only) */}
                              {isTask && (
                                <button
                                  onClick={() => setEditingTaskId(item.id)}
                                  className="text-gray-500 hover:text-black p-0.5 cursor-pointer ml-0.5"
                                  title="Modifier"
                                >
                                  <Edit2 size={10} />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* SECTION JOUR DE */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black font-mono text-black flex items-center gap-1 uppercase">
              <span className="text-yellow-500 text-lg">☀️</span> Jour de
            </h3>
          </div>

          {dayOfElements.length === 0 ? (
            <div className="border border-dashed border-gray-400 p-4 text-center font-mono text-xs text-gray-500 bg-white shadow-sm">
              Jour de rien
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {dayOfElements.map((item) => {
                if (item.elType === "habit") {
                  return (
                    <HabitCard
                      key={item.id}
                      h={item as Habit}
                      db={db}
                      todayStr={todayStr}
                      onNavigate={onNavigate}
                      onToggleValue={toggleHabitValue}
                      onAdjustValue={(id, amt) => {
                        if (amt > 0) {
                          handleHabitPlus(id);
                        } else {
                          handleHabitMinus(id);
                        }
                      }}
                      onStartChrono={(id) => handleStartUnifiedChrono(id, "habit")}
                      onStopChrono={(id) => handleStopUnifiedChrono(id, "habit")}
                      onToggleStar={toggleStarHabit}
                      onToggleDayOf={toggleDayOfHabit}
                      onLogManualTime={handleLogHabitTime}
                      onDuplicate={onDuplicate}
                      hideActionsByDefault={true}
                    />
                  );
                } else if (item.elType === "recurring") {
                  return renderRecurringCard(item as RecurringTask, "border-black", true);
                } else {
                  return renderTaskCard(item as Task, "border-yellow-400 border-2 select-none", true);
                }
              })}
            </div>
          )}
        </div>

        {/* 1. SECTION ÉPINGLÉS */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black font-mono text-black flex items-center gap-1">
              <span className="text-red-500 text-lg">📌</span> Épinglés
            </h3>
            
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="bg-[#E4E2FA] hover:bg-[#D5D2F5] border border-black px-2.5 py-1 rounded-full text-black font-mono font-black flex items-center gap-1.5 shadow-[1px_1px_0px_0px_#000] text-[10px] cursor-pointer transition-transform hover:-translate-y-0.5"
            >
              <Plus size={12} /> Ajouter
            </button>
          </div>

          {/* Quick Add Form intégré */}
          {showQuickAdd && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setShowQuickAdd(false)}
            >
              <form 
                onSubmit={handleQuickAdd} 
                className="w-full max-w-xl bg-yellow-50 border-4 border-black p-5 font-mono text-xs space-y-4 shadow-[6px_6px_0px_0px_#000] rotate-[-0.3deg] relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="font-extrabold flex items-center justify-between border-b-2 border-black pb-2 mb-2">
                  <span className="flex items-center gap-1 text-black font-black uppercase"><Plus size={14} className="text-orange-500" /> NOUVEAU CONTENU RAPIDE</span>
                  <button 
                    type="button"
                    onClick={() => setShowQuickAdd(false)}
                    className="border-2 border-black bg-white hover:bg-gray-100 text-black px-2 py-0.5 text-[9px] uppercase font-black cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Titre de la tâche..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full border-2 border-black p-2 bg-white"
                  required
                />
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold">IMPORTANCE (1-10)</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={newTaskImportance}
                      onChange={(e) => setNewTaskImportance(parseInt(e.target.value) || 5)}
                      className="w-full border border-black p-1 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold">URGENCE (1-10)</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={newTaskUrgency}
                      onChange={(e) => setNewTaskUrgency(parseInt(e.target.value) || 5)}
                      className="w-full border border-black p-1 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold">CHARGE MENTALE (1-10)</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={newTaskMental}
                      onChange={(e) => setNewTaskMental(parseInt(e.target.value) || 5)}
                      className="w-full border border-black p-1 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold">FACILITÉ (1-10)</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={newTaskEasiness}
                      onChange={(e) => setNewTaskEasiness(parseInt(e.target.value) || 5)}
                      className="w-full border border-black p-1 bg-white font-bold"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[9px] font-bold">DATE ÉCHÉANCE</label>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full border border-black p-1 bg-white font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="text-right pt-2">
                  <button
                    type="submit"
                    className="bg-black text-white px-4 py-2 font-black border-2 border-black hover:bg-yellow-400 hover:text-black cursor-pointer shadow-[2px_2px_0px_0px_#000]"
                  >
                    AJOUTER & ÉPINGLER
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Cartes Épinglés horizontales */}
          {sortedPinnedElements.length === 0 ? (
            <div className="border border-dashed border-gray-400 p-4 text-center font-mono text-xs text-gray-500 bg-white shadow-sm">
              📌 Épinglez des tâches ou habitudes dans les listes ci-dessous pour les afficher ici d'un coup d'œil.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sortedPinnedElements.map((item, index) => {
                const elementCard = (() => {
                  if (item.elType === "habit") {
                    return (
                      <HabitCard
                        h={item as Habit}
                        db={db}
                        todayStr={todayStr}
                        onNavigate={onNavigate}
                        onToggleValue={toggleHabitValue}
                        onAdjustValue={(id, amt) => {
                          if (amt > 0) {
                            handleHabitPlus(id);
                          } else {
                            handleHabitMinus(id);
                          }
                        }}
                        onStartChrono={(id) => handleStartUnifiedChrono(id, "habit")}
                        onStopChrono={(id) => handleStopUnifiedChrono(id, "habit")}
                        onToggleStar={toggleStarHabit}
                        onToggleDayOf={toggleDayOfHabit}
                        onLogManualTime={handleLogHabitTime}
                        onDuplicate={onDuplicate}
                        hideActionsByDefault={true}
                      />
                    );
                  } else if (item.elType === "recurring") {
                    return renderRecurringCard(item as RecurringTask, "border-black", true);
                  } else {
                    return renderTaskCard(item as Task, "border-red-400 border-2 select-none", true);
                  }
                })();

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handlePinnedDragStart(e, index)}
                    onDragOver={handlePinnedDragOver}
                    onDrop={(e) => handlePinnedDrop(e, index)}
                    className="cursor-grab active:cursor-grabbing hover:bg-slate-100/50 transition-all duration-200 hover:scale-[1.01]"
                  >
                    {elementCard}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. CINQ PILIERS DE PRIORITÉS MAXIMALES */}
        <div className="space-y-3">
          <h3 className="text-lg font-black font-mono text-black flex items-center gap-1.5">
            <span className="text-red-500 text-xl">🚨</span> Piliers prioritaires (Focus Max)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            
            {/* Pilier 1 : Score Cumulé */}
            <div className="border-4 border-[#FFA500] bg-[#FAF3EC] p-3 rounded-none flex flex-col justify-between shadow-[4px_4px_0px_0px_#FFA500] font-mono">
              <div>
                <span className="block text-[9px] font-black tracking-wider text-orange-700 bg-orange-100 border border-orange-300 px-1.5 py-0.5 rounded-none w-max uppercase mb-2">
                  🏆 Score Cumulé Max
                </span>
                {maxCumulativeTask ? (
                  <div className="mt-1">
                    {renderTaskCard(maxCumulativeTask, "border-black")}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Aucune tâche active</p>
                )}
              </div>
            </div>

            {/* Pilier 2 : Urgence */}
            <div className="border-4 border-[#FF6B6B] bg-red-50/50 p-3 rounded-none flex flex-col justify-between shadow-[4px_4px_0px_0px_#FF6B6B] font-mono">
              <div>
                <span className="block text-[9px] font-black tracking-wider text-red-700 bg-red-100 border border-red-300 px-1.5 py-0.5 rounded-none w-max uppercase mb-2">
                  🚒 Urgence Max
                </span>
                {maxUrgencyTask ? (
                  <div className="mt-1">
                    {renderTaskCard(maxUrgencyTask, "border-black")}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Aucune tâche active</p>
                )}
              </div>
            </div>

            {/* Pilier 3 : Importance */}
            <div className="border-4 border-[#38BDF8] bg-sky-50/50 p-3 rounded-none flex flex-col justify-between shadow-[4px_4px_0px_0px_#38BDF8] font-mono">
              <div>
                <span className="block text-[9px] font-black tracking-wider text-sky-700 bg-sky-100 border border-sky-300 px-1.5 py-0.5 rounded-none w-max uppercase mb-2">
                  ⚡ Importance Max
                </span>
                {maxImportanceTask ? (
                  <div className="mt-1">
                    {renderTaskCard(maxImportanceTask, "border-black")}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Aucune tâche active</p>
                )}
              </div>
            </div>

            {/* Pilier 4 : Charge Mentale */}
            <div className="border-4 border-[#A855F7] bg-purple-50/50 p-3 rounded-none flex flex-col justify-between shadow-[4px_4px_0px_0px_#A855F7] font-mono">
              <div>
                <span className="block text-[9px] font-black tracking-wider text-purple-700 bg-purple-100 border border-purple-300 px-1.5 py-0.5 rounded-none w-max uppercase mb-2">
                  🧠 Charge Mentale Max
                </span>
                {maxMentalTask ? (
                  <div className="mt-1">
                    {renderTaskCard(maxMentalTask, "border-black")}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Aucune tâche active</p>
                )}
              </div>
            </div>

            {/* Pilier 5 : Facilité */}
            <div className="border-4 border-[#4ADE80] bg-green-50/50 p-3 rounded-none flex flex-col justify-between shadow-[4px_4px_0px_0px_#4ADE80] font-mono">
              <div>
                <span className="block text-[9px] font-black tracking-wider text-green-700 bg-green-100 border border-green-300 px-1.5 py-0.5 rounded-none w-max uppercase mb-2">
                  🟢 Facilité Max
                </span>
                {maxEasinessTask ? (
                  <div className="mt-1">
                    {renderTaskCard(maxEasinessTask, "border-black")}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Aucune tâche active</p>
                )}
              </div>
            </div>

          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* En Retard */}
          <div className="space-y-3 font-mono">
            <h3 className="text-md font-black text-black flex items-center gap-1.5">
              <span className="text-orange-500">⚠️</span> En Retard
            </h3>
            
            <div>
              {overdueTasks.length === 0 ? (
                <div className="border border-dashed border-gray-400 bg-white p-2 text-center text-xs text-gray-500">
                  🎉 Bravo, aucun retard clinique accumulé aujourd'hui !
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {overdueTasks.map((t) => renderTaskCard(t, "border-orange-500"))}
                </div>
              )}
            </div>
          </div>

          {/* Planifié Aujourd'hui & Dernières tâches ajoutées */}
          <div className="space-y-6">
            {/* Planifié Aujourd'hui */}
            <div className="space-y-3 font-mono">
              <h3 className="text-md font-black text-black flex items-center gap-1.5">
                <span className="text-pink-500">🌸</span> Planifié Aujourd'hui
              </h3>
              
              <div>
                {scheduledTodayTasks.length === 0 ? (
                  <div className="border border-dashed border-gray-400 bg-white p-2 text-center text-xs text-gray-500">
                    📅 Aucun événement ou tâche calé spécifiquement à cet horaire.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {scheduledTodayTasks.map((t) => renderTaskCard(t, "border-pink-500"))}
                  </div>
                )}
              </div>
            </div>

            {/* 5 dernières tâches ajoutées */}
            <div className="space-y-3 font-mono">
              <h3 className="text-md font-black text-black flex items-center gap-1.5">
                <span className="text-indigo-500">🆕</span> 5 Dernières tâches ajoutées
              </h3>
              
              <div>
                {lastAddedTasks.length === 0 ? (
                  <div className="border border-dashed border-gray-400 bg-white p-2 text-center text-xs text-gray-500">
                    Aucune tâche n'a été ajoutée.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lastAddedTasks.map((t) => renderTaskCard(t, "border-indigo-500", true))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 7. SUGGESTIONS PROACTIVES */}
        <div className="border-4 border-black bg-white p-4 rounded-none shadow-[4px_4px_0px_0px_#000]">
          
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black font-mono text-black flex items-center gap-1.5">
              <span className="text-pink-500">✨</span> Suggestions
            </h3>
            
            <div className="flex items-center gap-2 font-mono">
              <div className="flex items-center bg-white border-2 border-black p-0.5">
                <input
                  type="number"
                  value={suggestionCount}
                  onChange={(e) => setSuggestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-8 text-center font-black text-xs outline-none bg-transparent"
                />
                <div className="flex flex-col border-l border-black pl-0.5 pr-0.5">
                  <button
                    onClick={() => setSuggestionCount(prev => prev + 1)}
                    className="text-[6px] font-black hover:bg-gray-100 px-0.5 cursor-pointer leading-none"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => setSuggestionCount(prev => Math.max(1, prev - 1))}
                    className="text-[6px] font-black hover:bg-gray-100 px-0.5 cursor-pointer leading-none"
                  >
                    ▼
                  </button>
                </div>
              </div>
              <button
                onClick={generateFreshSuggestions}
                className="bg-sky-100 hover:bg-sky-200 border-2 border-black p-1.5 cursor-pointer"
                title="Générer de nouvelles suggestions"
              >
                <RefreshCw size={13} className="text-black" />
              </button>
            </div>
          </div>

          <div className="font-mono">
            {activeSuggestions.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500">
                Aucune suggestion pour le moment. Cliquez sur le bouton de rafraîchissement pour en générer !
              </div>
            ) : (
              <div className="space-y-3">
                {activeSuggestions.map((s) => (
                  <div key={s.id} className="border-2 border-black bg-[#E8F1F5] p-3 text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                      <p className="font-extrabold underline">{s.title}</p>
                      <p className="text-gray-700 mt-1">{s.description}</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end md:justify-start">
                      <button
                        onClick={() => handleApplySuggestion(s.id)}
                        className="bg-green-400 hover:bg-green-500 text-black border-2 border-black px-3 py-1 font-black text-[10px] shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                      >
                        Appliquer
                      </button>
                      <button
                        onClick={() => handleIgnoreSuggestion(s.id)}
                        className="bg-gray-300 hover:bg-gray-400 text-black border-2 border-black px-3 py-1 font-black text-[10px] shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                      >
                        Ignorer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
