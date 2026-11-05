import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Task, Habit, TimeLogEntry, IconData, Preparation } from '../../types';
import { ItemActions } from './ItemActions';
import { useIcons } from '../../lib/IconContext';
import { Edit2, Play, Pause, Trash2, Pin, Check, Plus, Sun, Copy } from 'lucide-react';
import TaskInlineEditor from './TaskInlineEditor';

import { calculateTaskScore } from '../../lib/state';

export type RankingMetric = 'total' | 'reward' | 'importance' | 'urgency' | 'mentalLoad' | 'easiness';

export interface TaskCardProps {
  task: Task;
  allTasks: Task[];
  onUpdate: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onAnalyzeSubTasks?: (item: Task | Habit) => void;
  onStartChat?: (item: Task | Habit) => void;
  onEdit?: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onArchive?: (taskId: string) => void;
  onDuplicate?: (task: Task) => void;
  onAddSubtask?: (parentTask: Task) => void;
  isExpanded: boolean;
  onExpand: () => void;
  highlightedMetrics?: RankingMetric[];
  depth?: number;
  parentTask?: Task | null;
  activeTimer: { taskId: string; startTime: number } | null;
  onStartTimer: (taskId: string) => void;
  onStopTimer: () => void;
  onDeleteTimeLog: (taskId: string, logId: string) => void;
  onLogTime?: (taskId: string, duration: number, date: string) => void;
  isCompact?: boolean;
  descriptionOnExpand?: boolean;
  scoreDisplayMode?: 'coloredText' | 'coloredBg';
  preparations?: Preparation[];
  completedPreparationsToday?: string[];
  areSubtasksCollapsed?: boolean;
  onToggleSubtasks?: () => void;
  onAddSubtaskInline?: (parentTaskId: string, title: string) => void;
}

export const parseScore = (score: any): number => {
    if (score === undefined || score === null) return 5;
    if (typeof score === 'number') return Math.round(score);
    if (typeof score === 'string') {
        const lowerCaseScore = score.toLowerCase();
        if (lowerCaseScore === 'high') return 8;
        if (lowerCaseScore === 'medium') return 5;
        if (lowerCaseScore === 'low') return 2;
        const parsed = parseInt(score, 10);
        return isNaN(parsed) ? 5 : parsed;
    }
    return 5;
};

export const getTotalScore = (task: Task): number => {
    if ((task.type as string) === 'appointment') return 0;
    const importance = parseScore(task.importance);
    const urgency = parseScore(task.urgency);
    const mentalLoad = parseScore(task.mentalLoad);
    const easiness = parseScore(task.easiness);
    return calculateTaskScore({ importance, urgency, mentalLoad, easiness });
};

const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

const ManualLogForm: React.FC<{ onLog: (date: string, duration: number) => void }> = ({ onLog }) => {
    const { getIcon } = useIcons();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [duration, setDuration] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const durationNum = parseInt(duration, 10);
        if (date && durationNum > 0) {
            onLog(date, durationNum);
            setDuration('');
        }
    };

    return (
        <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="manual-log-form mt-2 p-2 border-2 border-black bg-yellow-50 dark:bg-slate-800 shadow-[2px_2px_0px_#000] rounded-none space-y-1.5 font-mono text-xs">
            <h4 className="text-[10px] font-black uppercase text-gray-700 dark:text-slate-300">Enregistrer du temps</h4>
            <div className="flex items-end gap-1.5">
                <div className="flex-grow min-w-0">
                    <label htmlFor="log-date" className="text-[9px] block font-bold text-gray-600 dark:text-gray-400">Date</label>
                    <input id="log-date" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-1 text-[11px] font-mono border-2 border-black bg-white dark:bg-slate-900 rounded-none"/>
                </div>
                 <div className="flex-grow min-w-0">
                    <label htmlFor="log-duration" className="text-[9px] block font-bold text-gray-600 dark:text-gray-400">Durée (min)</label>
                    <input id="log-duration" type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="30" min="1" className="w-full p-1 text-[11px] font-mono border-2 border-black bg-white dark:bg-slate-900 rounded-none"/>
                </div>
                <button type="submit" className="px-2.5 py-1 text-[10px] font-black uppercase text-black bg-emerald-400 hover:bg-emerald-500 border-2 border-black shadow-[1px_1px_0px_#000] cursor-pointer disabled:opacity-50" disabled={!date || !duration}>
                    +
                </button>
            </div>
            <div className="flex items-center gap-1 justify-end pt-0.5">
                <button
                    type="button"
                    onClick={() => { if (date) onLog(date, -5); }}
                    className="text-[9px] font-mono font-bold bg-rose-100 hover:bg-rose-200 border border-black px-1.5 py-0.5 shadow-[1px_1px_0px_#000] cursor-pointer text-black"
                >
                    -5m
                </button>
                {[5, 15, 30, 60].map((mins) => (
                    <button
                        key={mins}
                        type="button"
                        onClick={() => { if (date) onLog(date, mins); }}
                        className="text-[9px] font-mono font-bold bg-amber-100 hover:bg-amber-200 border border-black px-1.5 py-0.5 shadow-[1px_1px_0px_#000] cursor-pointer text-black"
                    >
                        +{mins}m
                    </button>
                ))}
            </div>
        </form>
    );
};

export const TaskCard: React.FC<TaskCardProps> = (props) => {
    const {
        task, allTasks, onUpdate, onAnalyzeSubTasks, onStartChat, onEdit, onDelete, onArchive, onDuplicate, onAddSubtask,
        isExpanded, onExpand, highlightedMetrics = [], depth = 0, parentTask,
        activeTimer, onStartTimer, onStopTimer, onDeleteTimeLog, onLogTime,
        isCompact = false, descriptionOnExpand = false, scoreDisplayMode = 'coloredBg',
        preparations = [], completedPreparationsToday = [],
        areSubtasksCollapsed = false, onToggleSubtasks, onAddSubtaskInline
    } = props;
    const { getIcon } = useIcons();
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isCardInlineExpanded, setIsCardInlineExpanded] = useState(false);
    const [isEditingInline, setIsEditingInline] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isAddingSub, setIsAddingSub] = useState(false);
    const [newSubTitle, setNewSubTitle] = useState("");
    const isActive = activeTimer?.taskId === task.id;

    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState<number>(0);

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

    useEffect(() => {
        let interval: number;
        if (isActive) {
            const update = () => {
                const seconds = Math.floor((Date.now() - activeTimer.startTime) / 1000);
                setElapsedTime(seconds);
            };
            update();
            interval = window.setInterval(update, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [isActive, activeTimer]);

    const isWide = width >= 340;
    const showDetailsAndActions = isWide || isExpanded || isCardInlineExpanded;
    
    const { subtasks, completedSubtasks } = useMemo(() => {
        const subtasks = allTasks.filter(st => st.parentId === task.id);
        const completedSubtasks = subtasks.filter(st => st.status === 'done');
        return { subtasks, completedSubtasks };
    }, [allTasks, task.id]);

    const { completedPreparationsCount, totalPreparations } = useMemo(() => {
        if (!task.preparationIds || task.preparationIds.length === 0) {
            return { completedPreparationsCount: 0, totalPreparations: 0 };
        }
        const completedCount = task.preparationIds.filter(id => completedPreparationsToday.includes(id)).length;
        return { completedPreparationsCount: completedCount, totalPreparations: task.preparationIds.length };
    }, [task.preparationIds, completedPreparationsToday]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        const wasDone = task.status === 'done' || task.isCompleted || task.planningStatus === 'done';
        const nextDone = !wasDone;
        onUpdate(task.id, {
            status: nextDone ? 'done' : 'todo',
            isCompleted: nextDone,
            planningStatus: nextDone ? 'done' : (task.scheduledTime ? 'scheduled' : 'backlog'),
            completedAt: nextDone ? new Date().toISOString() : undefined
        });
    };
    
    const handleTimerToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isActive) {
            onStopTimer();
        } else {
            onStartTimer(task.id);
        }
    };
    
    const totalTimeSpent = (task.timeLog?.reduce((sum, entry) => sum + entry.duration, 0) || 0);

    const scores = {
        total: getTotalScore(task),
        importance: parseScore(task.importance),
        urgency: parseScore(task.urgency),
        mentalLoad: parseScore(task.mentalLoad),
        easiness: parseScore(task.easiness),
        reward: task.rewardValue || 0
    };

    const isChampion = highlightedMetrics.length > 0;
    const borderClass = isChampion ? 'border-amber-400 dark:border-amber-500' : task.color ? '' : 'border-sage dark:border-slate-700';
    const borderStyle = task.color ? { borderColor: task.color } : {};

    const handleCardClick = (e: React.MouseEvent) => {
        // Empêche la fermeture si on clique dans le formulaire de saisie manuelle.
        if ((e.target as HTMLElement).closest('.manual-log-form')) {
            return;
        }
        onExpand();
    }

    const taskDeadline = task.dueDate || task.deadline;
    const deadlineDiff = useMemo(() => {
        if (task.status === 'done' || !taskDeadline) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const deadlineDate = new Date(taskDeadline);
        deadlineDate.setHours(0, 0, 0, 0);

        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }, [taskDeadline, task.status]);
    
    if (isEditingInline) {
        return (
            <div
                className={`bg-white dark:bg-slate-800 border-2 border-black relative shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded-none p-3 ${depth > 0 ? 'ml-4' : ''} max-w-full`}
                style={borderStyle}
            >
                <TaskInlineEditor
                    task={task}
                    onSave={(updated) => {
                        onUpdate(task.id, updated);
                        setIsEditingInline(false);
                    }}
                    onCancel={() => setIsEditingInline(false)}
                    allTasks={allTasks}
                />
            </div>
        );
    }

    const isCompleted = task.status === 'done' || task.isCompleted || task.planningStatus === 'done';

    return (
        <div
            ref={containerRef}
            className={`bg-white dark:bg-slate-800 border-2 border-black relative shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded-none ${depth > 0 ? 'ml-4' : ''} max-w-full flex flex-col group min-h-[44px]`}
            style={borderStyle}
            onClick={handleCardClick}
        >
            <div className="px-3 py-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 min-h-[44px] relative cursor-pointer">
                {/* Left side: Icon + Title bundled together in a hover details group */}
                <div 
                    className="flex items-center gap-2 overflow-hidden flex-grow relative group cursor-pointer sm:cursor-help order-1 sm:order-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsCardInlineExpanded(!isCardInlineExpanded);
                    }}
                >
                    <span className="text-sm shrink-0 select-none">
                        {task.icon ? (
                            typeof task.icon === 'string' ? (
                                <span className="text-xl">{task.icon}</span>
                            ) : (
                                <span className="w-5 h-5 block" dangerouslySetInnerHTML={{ __html: task.icon.content }} />
                            )
                        ) : (
                            task.type === "event" ? "📅" : "📁"
                        )}
                    </span>
                    
                    <div className="flex flex-col min-w-0 flex-grow">
                        <p className={`font-mono text-[11px] font-black leading-none uppercase truncate ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-gray-800 dark:text-slate-200'}`} title={task.title}>
                            {task.title}
                        </p>
                        {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                                {task.tags.map(tag => (
                                    <span 
                                        key={tag}
                                        className="px-1 py-0.1 bg-indigo-50 dark:bg-indigo-950/40 text-[7px] font-mono font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-250 dark:border-indigo-900 uppercase tracking-wide rounded-snug"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {subtasks.length > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onToggleSubtasks) onToggleSubtasks();
                            }}
                            className="ml-2 px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/65 text-indigo-700 dark:text-indigo-300 rounded border-2 border-slate-900 dark:border-indigo-800 text-[9px] font-mono font-black flex items-center gap-1 cursor-pointer shadow-[1px_1px_0px_#000]"
                            title={areSubtasksCollapsed ? "Déplier les sous-tâches" : "Plier les sous-tâches"}
                        >
                            <span>{areSubtasksCollapsed ? "▶" : "▼"}</span>
                            <span>{completedSubtasks.length}/{subtasks.length}</span>
                        </button>
                    )}

                    {/* Neo-brutalist custom hover tooltip showing all extra details in conformity with instructions */}
                    <div 
                        className="absolute left-0 bottom-full mb-2 w-64 bg-[#FFF9E6] dark:bg-slate-900 text-[#111] dark:text-slate-100 border-2 border-black dark:border-slate-700 p-2.5 rounded-none shadow-[3px_3px_0px_#000] z-50 pointer-events-none hidden group-hover:block text-[10px] font-mono leading-relaxed"
                        style={{ contentVisibility: 'auto' }}
                    >
                        <div className="border-b-2 border-black dark:border-slate-700 pb-1 mb-1 font-black uppercase text-[10px] flex justify-between items-center bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white px-1 shadow-[1px_1px_0px_#000]">
                            <span>
                                {task.type === "event" ? "📅 ÉVÉNEMENT" : task.type === "routine" ? "🔄 ROUTINE" : "📁 TÂCHE BENTO"}
                            </span>
                            <span>+{task.rewardValue || 15} coins</span>
                        </div>

                        {task.description && (
                            <p className="italic text-gray-700 dark:text-slate-300 mb-1.5 whitespace-pre-wrap max-h-16 overflow-y-auto">
                                {task.description}
                            </p>
                        )}

                        {task.type !== "event" && (
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 my-1 border-t border-b border-dashed border-black/20 py-1 text-[9px]">
                                <div><span className="font-bold text-rose-500">🔥 IMPORT :</span> {task.importance ?? 5}/10</div>
                                <div><span className="font-bold text-sky-500">⚡ URGENT :</span> {task.urgency ?? 5}/10</div>
                                <div><span className="font-bold text-violet-500">🧠 CHARGE :</span> {task.mentalLoad ?? 5}/10</div>
                                <div><span className="font-bold text-emerald-500">✨ FACILITÉ:</span> {task.easiness ?? 5}/10</div>
                                <div className="col-span-2 font-black border-t border-black/10 pt-1 mt-0.5 text-center text-indigo-600 dark:text-indigo-400">
                                    Score Cumulé : {getTotalScore(task)}
                                </div>
                            </div>
                        )}

                        <div className="space-y-0.5 mt-1 text-[9px] text-gray-800 dark:text-slate-300">
                            {taskDeadline && (
                                <div>
                                    <span className="font-black">📅 ÉCHÉANCE :</span> {new Date(taskDeadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                    {deadlineDiff !== null && (
                                        <span className={`font-bold ml-1 ${deadlineDiff >= 0 ? "text-green-650" : "text-red-650"}`}>
                                            ({deadlineDiff >= 0 ? `+${deadlineDiff}` : deadlineDiff}j)
                                        </span>
                                    )}
                                </div>
                            )}
                            {task.scheduledTime && (
                                <div>
                                    <span className="font-black">⏰ PLANIF. :</span> {task.scheduledTime}
                                </div>
                            )}
                            {task.type !== "event" && (
                                <div>
                                    <span className="font-black">⏱️ TRAVAILLÉ :</span> {totalTimeSpent}m {task.estimatedDuration ? `/ ${task.estimatedDuration}m` : ""}
                                </div>
                            )}
                            {subtasks.length > 0 && (
                                <div>
                                    <span className="font-black">✅ SOUS-TÂCHES :</span> {completedSubtasks.length} / {subtasks.length}
                                </div>
                            )}
                            {totalPreparations > 0 && (
                                <div>
                                    <span className="font-black">🏁 PREPS :</span> {completedPreparationsCount} / {totalPreparations}
                                </div>
                            )}
                            {task.recurrence && task.recurrence !== "none" ? (
                                <div>
                                    <span className="font-black">🔄 RÉCURRENCE :</span> {task.recurrence === "daily" ? "Quotidien" : task.recurrence === "weekly" ? "Hebdo" : "Mensuel"}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Right side op buttons: line below on mobile (order-2) when expanded, inline on desktop */}
                <div 
                    className={`${showDetailsAndActions ? 'flex' : 'hidden'} items-center gap-1 shrink-0 order-2 sm:order-3 mt-1 sm:mt-0`} 
                    onClick={(e) => e.stopPropagation()}
                >
                    {isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                            {onArchive && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onArchive(task.id); setIsConfirmingDelete(false); }}
                                    className="bg-sky-400 hover:bg-sky-500 border border-black px-1.5 py-0.5 text-[8px] font-mono font-bold text-black uppercase shadow-[1px_1px_0px_#000] cursor-pointer"
                                    title="Archiver"
                                >
                                    Archiver
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onDelete(task.id); setIsConfirmingDelete(false); }}
                                className="bg-red-500 hover:bg-red-600 border border-black px-1.5 py-0.5 text-[8px] font-mono font-bold text-white uppercase shadow-[1px_1px_0px_#000] cursor-pointer animate-pulse"
                                title="Supprimer définitivement"
                            >
                                Supprimer
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(false); }}
                                className="bg-gray-100 hover:bg-gray-200 border border-black text-[8px] px-1 py-0.5 font-mono text-black uppercase cursor-pointer"
                            >
                                X
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* PLAY/PAUSE Button for Chrono */}
                            {task.status !== 'done' && (
                                <button
                                    onClick={handleTimerToggle}
                                    className={`w-5 h-5 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] shrink-0 ${isActive ? 'bg-rose-500 border-rose-600 animate-pulse text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                                    title={isActive ? "Pause" : "Démarrer"}
                                >
                                    {isActive ? <Pause size={8} className="fill-white text-white" /> : <Play size={8} className="fill-white text-white ml-0.5" />}
                                </button>
                            )}

                            {/* VALIDER Completion Button */}
                            <button
                                onClick={handleToggle}
                                className={`w-5 h-5 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] shrink-0 ${isCompleted ? 'bg-green-400 hover:bg-green-500' : 'bg-gray-100 hover:bg-emerald-300'}`}
                                title={isCompleted ? "Rétablir" : "Valider"}
                            >
                                <Check size={8} className="text-black font-extrabold" />
                            </button>

                            {/* DUPLIQUER Duplicate Button */}
                            {onDuplicate && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDuplicate(task); }}
                                    className="w-5 h-5 bg-white hover:bg-yellow-100 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] shrink-0 text-black p-0.5"
                                    title="Dupliquer"
                                >
                                    <Copy size={8} />
                                </button>
                            )}

                            {/* MODIFIER Edit Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEditingInline(true); }}
                                className="w-5 h-5 bg-white hover:bg-gray-100 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] shrink-0 text-black p-0.5"
                                title="Modifier"
                            >
                                <Edit2 size={8} />
                            </button>

                            {/* SUPPRIMER Delete Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(true); }}
                                className="w-5 h-5 bg-white hover:bg-red-100 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] shrink-0 text-red-500 p-0.5"
                                title="Supprimer"
                            >
                                <Trash2 size={8} />
                            </button>

                            {/* ÉPINGLER Pin Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onUpdate(task.id, { isStarred: !task.isStarred }); }}
                                className="w-5 h-5 bg-white hover:bg-red-50 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] shrink-0 p-0.5"
                                title={task.isStarred ? "Désépingler" : "Épingler"}
                            >
                                <Pin size={8} className={task.isStarred ? "text-red-500 fill-red-500" : "text-black"} />
                            </button>

                            {/* AJOUTER AU JOUR DE (Sun) Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onUpdate(task.id, { isDayOf: !task.isDayOf }); }}
                                className={`w-5 h-5 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] shrink-0 p-0.5 ${task.isDayOf ? 'bg-yellow-300' : 'bg-white hover:bg-yellow-50'}`}
                                title={task.isDayOf ? "Retirer du Jour de" : "Ajouter au Jour de"}
                            >
                                <Sun size={8} className={task.isDayOf ? "text-amber-500 fill-amber-500" : "text-black"} />
                            </button>

                            {/* AJOUTER SOUS-TÂCHE + Button */}
                            {onAddSubtaskInline && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isExpanded) onExpand();
                                        setIsAddingSub(!isAddingSub);
                                    }}
                                    className={`w-5 h-5 bg-white hover:bg-indigo-50 border border-black rounded-full flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] shrink-0 p-0.5 ${isAddingSub ? 'bg-indigo-100' : ''}`}
                                    title="Ajouter sous-tâche"
                                >
                                    <Plus size={8} className="text-black" />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Scores/details block: line below buttons on mobile (order-3) when expanded, inline on desktop */}
                <div 
                    className={`${showDetailsAndActions ? 'flex' : 'hidden'} flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-gray-500 dark:text-slate-400 order-3 sm:order-2 mt-1 sm:mt-0 font-mono`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {task.type !== "event" && (
                        <>
                            <div><span className="font-bold text-rose-500">🔥 IMPORT :</span> {scores.importance}/10</div>
                            <div><span className="font-bold text-sky-500">⚡ URGENT :</span> {scores.urgency}/10</div>
                            <div><span className="font-bold text-violet-500">🧠 CHARGE :</span> {scores.mentalLoad}/10</div>
                            <div><span className="font-bold text-emerald-500">✨ FACILITÉ:</span> {scores.easiness}/10</div>
                        </>
                    )}
                    {task.deadline && (
                        <div>
                            <span className="font-bold">📅 ÉCHÉANCE :</span> {new Date(task.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </div>
                    )}
                    {task.scheduledTime && (
                        <div>
                            <span className="font-bold">⏰ PLANIF :</span> {task.scheduledTime}
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="px-3 pb-3 space-y-3">
                     {/* Liste des sous-tâches à cocher */}
                    {subtasks.length > 0 && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                            <p className="text-[9px] font-black uppercase text-gray-500 dark:text-slate-400">Sous-tâches :</p>
                            <div className="space-y-1 h-auto">
                                {subtasks.map(st => {
                                    const isSubCompleted = st.status === 'done' || st.isCompleted;
                                    return (
                                        <label 
                                            key={st.id} 
                                            onClick={(e) => e.stopPropagation()} 
                                            className="flex items-center gap-2 p-1 border border-black/10 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-mono cursor-pointer select-none"
                                        >
                                            <input 
                                                type="checkbox"
                                                checked={isSubCompleted}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    onUpdate(st.id, { status: isSubCompleted ? 'todo' : 'done' });
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

                    {/* Formulaire d'Ajout de sous-tâche en ligne (Alerte / Confirmation en ligne 100% sans popup) */}
                    {onAddSubtaskInline && isAddingSub && (
                        <div className="pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-705" onClick={(e) => e.stopPropagation()}>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (newSubTitle.trim()) {
                                        onAddSubtaskInline(task.id, newSubTitle.trim());
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
                                    id="cancel-subtask"
                                >
                                    ✕
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                         <div className="flex items-center gap-1">
                            <button onClick={handleTimerToggle} disabled={!!activeTimer && !isActive} className={`w-9 h-9 flex items-center justify-center rounded-full text-white ${isActive ? 'bg-rose-500' : 'bg-green-500'} disabled:opacity-50`}>
                                {isActive ? getIcon('stop', { className: "text-lg" }) : getIcon('play', { className: "text-lg" })}
                            </button>
                            {isActive && <span className="text-sm font-mono text-rose-500 animate-pulse">{formatTime(elapsedTime)}</span>}
                         </div>
                        <div className="flex items-center gap-1">
                            <ItemActions
                                item={task}
                                onEdit={() => setIsEditingInline(true)}
                                onAnalyze={onAnalyzeSubTasks}
                                onStartChat={onStartChat}
                                onDelete={onDelete}
                                onArchive={onArchive}
                                onDuplicate={onDuplicate}
                            />
                             {onAddSubtask && (
                                <button onClick={(e) => { e.stopPropagation(); onAddSubtask(task); }} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Ajouter une sous-tâche">
                                    {getIcon('plus', { className: "w-5 h-5" })}
                                </button>
                             )}
                        </div>
                    </div>
                     {task.timeLog && task.timeLog.length > 0 && (
                        <div>
                             <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">Historique du temps</h4>
                             <ul className="space-y-1 text-sm text-gray-700 dark:text-slate-300 max-h-32 overflow-y-auto">
                                {[...task.timeLog].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                                    <li key={log.id} className="flex justify-between items-center p-1 hover:bg-sage/50 dark:hover:bg-slate-700/50 rounded-md">
                                        <span>
                                            {new Date(log.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}:
                                            <span className="font-semibold ml-2">{log.duration} min</span>
                                        </span>
                                        <button onClick={() => onDeleteTimeLog(task.id, log.id)} className="p-1 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/50" title="Supprimer l'entrée">
                                            {getIcon('trash', { className: "text-sm" })}
                                        </button>
                                    </li>
                                ))}
                             </ul>
                        </div>
                    )}
                    {onLogTime && <ManualLogForm onLog={(date, duration) => onLogTime(task.id, duration, date)} />}
                </div>
            )}
        </div>
    );
};
