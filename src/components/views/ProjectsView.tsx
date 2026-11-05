import React, { useState, useMemo, useEffect } from 'react';
import type { Task, AppDatabase } from '../../types';
import { TaskCard } from './TaskCard';
import { Network, Plus, Trash, HelpCircle, Check, Link2, Eye, EyeOff, ChevronUp, ChevronDown, FolderOpen } from 'lucide-react';

interface ProjectsViewProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
  tasks?: Task[];
  updateTask?: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onDeleteTask?: (taskId: string) => void;
  onStartFocus?: (taskId: string) => void;
  onAnalyzeSubTasks?: (task: Task) => void;
  onStartChat?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  expandedItemId?: string | null;
  onExpandItem?: (itemId: string) => void;
  activeTimer?: { taskId: string; startTime: number } | null;
  stoppedTimer?: { taskId: string; duration: number } | null;
  onStartTimer?: (taskId: string) => void;
  onStopTimer?: () => void;
  onValidateTimer?: () => void;
  onCancelValidation?: () => void;
  onDeleteTimeLogEntry?: (taskId: string, logId: string) => void;
  onAddSubtask?: (parentTask: Task) => void;
  onAddSubtaskInline?: (parentTaskId: string, title: string) => void;
  onDuplicate?: (task: Task) => void;
}

interface TreeTaskNode {
  task: Task;
  children: TreeTaskNode[];
}

// Vérifie si une tâche est bloquée par un prérequis inaccompli
const isTaskBlocked = (task: Task, allTasksMap: Map<string, Task>): boolean => {
  if (!task.dependencies || task.dependencies.length === 0) return false;
  return task.dependencies.some(depId => {
    const depTask = allTasksMap.get(depId);
    return depTask && !depTask.isCompleted && depTask.status !== 'done' && depTask.planningStatus !== 'done';
  });
};

/* --- COMPOSANT COMMANT DE LIAISON DE DÉPENDANCES --- */
const DependencyLinker: React.FC<{
  tasks: Task[];
  onUpdate: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => void;
}> = ({ tasks, onUpdate }) => {
  const [prereqId, setPrereqId] = useState("");
  const [blockedId, setBlockedId] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const uncompletedTasks = useMemo(() => {
    return tasks.filter(t => !t.isCompleted && t.status !== 'done' && t.planningStatus !== 'done');
  }, [tasks]);

  const handleLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prereqId || !blockedId) return;
    if (prereqId === blockedId) {
      setSuccessMsg("Erreur: Une tâche ne peut dépendre d'elle-même.");
      setTimeout(() => setSuccessMsg(""), 3500);
      return;
    }

    const blockedTask = tasks.find(t => t.id === blockedId);
    if (blockedTask) {
      const existingDeps = blockedTask.dependencies || [];
      if (existingDeps.includes(prereqId)) {
        setSuccessMsg("Liaison existante.");
        setTimeout(() => setSuccessMsg(""), 2000);
        return;
      }

      onUpdate(blockedId, {
        dependencies: [...existingDeps, prereqId]
      });

      setSuccessMsg("Liaison établie.");
      setPrereqId("");
      setBlockedId("");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  return (
    <div className="bg-amber-50/20 dark:bg-slate-900/30 border-2 border-black p-4 shadow-[4px_4px_0px_#000] rounded-none mb-6 font-mono text-xs">
      <div className="font-black text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1 text-slate-800 dark:text-slate-300">
        <Link2 size={13} /> Ordonner les actions (A faire avant B)
      </div>
      <form onSubmit={handleLink} className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 min-w-0 w-full">
          <label className="block text-[8px] font-black uppercase text-gray-500 mb-0.5">Tâche préalable (A)</label>
          <select
            value={prereqId}
            onChange={(e) => setPrereqId(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 text-[11px] border-2 border-black p-1.5 h-8 font-mono cursor-pointer shrink-0"
          >
            <option value="">Sélectionner la tâche...</option>
            {uncompletedTasks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        <div className="text-center font-bold text-slate-500 dark:text-slate-400 self-center py-1 sm:pt-2">
          ➔ précède ➔
        </div>

        <div className="flex-1 min-w-0 w-full">
          <label className="block text-[8px] font-black uppercase text-gray-500 mb-0.5">Tâche bloquée (B)</label>
          <select
            value={blockedId}
            onChange={(e) => setBlockedId(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 text-[11px] border-2 border-black p-1.5 h-8 font-mono cursor-pointer shrink-0"
          >
            <option value="">Sélectionner la tâche...</option>
            {uncompletedTasks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!prereqId || !blockedId}
          className={`h-8 px-4 font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer ${
            (!prereqId || !blockedId) 
              ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed shadow-none" 
              : "bg-black text-white hover:bg-slate-800"
          }`}
        >
          Lier
        </button>
      </form>
      {successMsg && (
        <div className="mt-2 text-[9.5px] font-bold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-black p-1 px-2.5 shadow-[1px_1px_0px_#000] w-fit">
          {successMsg}
        </div>
      )}
    </div>
  );
};

/* --- NOEUD RÉCURSIF DE L'ARBRE DE DÉPENDANCE --- */
const DependencyTreeNode: React.FC<{
  node: TreeTaskNode;
  allTasks: Task[];
  allTasksMap: Map<string, Task>;
  depth: number;
  expandedItemId: string | null;
  onExpandItem: (itemId: string) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onDeleteTask: (taskId: string) => void;
  activeTimer: { taskId: string; startTime: number } | null;
  onStartTimer: (taskId: string) => void;
  onStopTimer: () => void;
  onDeleteTimeLogEntry: (taskId: string, logId: string) => void;
  onAddSubtask?: (parentTask: Task) => void;
  onAddSubtaskInline?: (parentTaskId: string, title: string) => void;
  onDuplicate?: (task: Task) => void;
}> = ({ 
  node, 
  allTasks, 
  allTasksMap, 
  depth, 
  expandedItemId, 
  onExpandItem, 
  updateTask, 
  onDeleteTask, 
  activeTimer, 
  onStartTimer, 
  onStopTimer, 
  onDeleteTimeLogEntry,
  onAddSubtask,
  onAddSubtaskInline,
  onDuplicate
}) => {
  const { task, children } = node;
  const isBlocked = isTaskBlocked(task, allTasksMap);
  const isCompleted = task.isCompleted || task.status === 'done' || task.planningStatus === 'done';
  const activePrereqs = (task.dependencies || []).map(depId => allTasksMap.get(depId)).filter(Boolean) as Task[];

  return (
    <div className="relative flex flex-col my-3 text-left">
      <div className="flex items-start gap-2.5 relative">
        {/* Ligne pointillée décorative d'arborescence (depth > 0) */}
        {depth > 0 && (
          <div className="absolute left-[-22px] top-[-20px] bottom-5 w-4 border-l-2 border-b-2 border-dashed border-slate-300 dark:border-slate-700 rounded-bl" />
        )}
        
        <div className="flex-grow min-w-0">
          <div className="flex flex-wrap gap-2 items-center mb-1 font-mono text-[9px]">
            {isCompleted ? (
              <span className="px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900 font-bold uppercase tracking-wider">
                ✅ Accomplie
              </span>
            ) : isBlocked ? (
              <span className="px-1.5 py-0.2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-900 font-bold uppercase tracking-wider">
                🔒 Bloquée (Préréquis en attente)
              </span>
            ) : (
              <span className="px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-900 font-bold uppercase tracking-wider">
                ⚡ Prête
              </span>
            )}

            {/* Liste en ligne des prérequis actifs avec possibilité de délier instantanément */}
            {activePrereqs.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-slate-500 font-bold">PRÉREQUIS :</span>
                {activePrereqs.map(p => (
                  <span 
                    key={p.id} 
                    className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 p-0.5 px-1.5 border border-black dark:border-slate-700 text-[8px] flex items-center gap-1 font-mono"
                  >
                    #{p.title}
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedDeps = (task.dependencies || []).filter(id => id !== p.id);
                        updateTask(task.id, { dependencies: updatedDeps });
                      }}
                      className="text-rose-600 hover:text-rose-800 font-black cursor-pointer text-[10px] leading-none"
                      title="Supprimer la liaison"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <TaskCard
            task={task}
            allTasks={allTasks}
            onUpdate={updateTask}
            onDelete={onDeleteTask}
            isExpanded={expandedItemId === task.id}
            onExpand={() => onExpandItem(task.id)}
            activeTimer={activeTimer}
            onStartTimer={onStartTimer}
            onStopTimer={onStopTimer}
            onDeleteTimeLog={onDeleteTimeLogEntry}
            onAddSubtask={onAddSubtask}
            onAddSubtaskInline={onAddSubtaskInline}
            onDuplicate={onDuplicate}
          />
        </div>
      </div>

      {children.length > 0 && (
        <div className="pl-6 ml-3.5 border-l-2 border-dashed border-slate-200 dark:border-slate-800 space-y-1">
          {children.map(child => (
            <DependencyTreeNode
              key={child.task.id}
              node={child}
              allTasks={allTasks}
              allTasksMap={allTasksMap}
              depth={depth + 1}
              expandedItemId={expandedItemId}
              onExpandItem={onExpandItem}
              updateTask={updateTask}
              onDeleteTask={onDeleteTask}
              activeTimer={activeTimer}
              onStartTimer={onStartTimer}
              onStopTimer={onStopTimer}
              onDeleteTimeLogEntry={onDeleteTimeLogEntry}
              onAddSubtask={onAddSubtask}
              onAddSubtaskInline={onAddSubtaskInline}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
};


/* --- VUE PROJETS PRINCIPALE (ARBRE DE DÉPENDANCE) --- */

const ProjectSection: React.FC<{
  tag: string;
  index: number;
  totalTags: number;
  tasks: Task[];
  allTasksMap: Map<string, Task>;
  hideCompleted: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onDeleteTask: (taskId: string) => void;
  expandedItemId: string | null;
  onExpandItem: (itemId: string) => void;
  activeTimer: { taskId: string; startTime: number } | null;
  onStartTimer: (taskId: string) => void;
  onStopTimer: () => void;
  onDeleteTimeLogEntry: (taskId: string, logId: string) => void;
  onAddSubtask?: (parentTask: Task) => void;
  onAddSubtaskInline?: (parentTaskId: string, title: string) => void;
  onDuplicate?: (task: Task) => void;
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
}> = ({
  tag,
  index,
  totalTags,
  tasks,
  allTasksMap,
  hideCompleted,
  collapsed,
  onToggleCollapse,
  onMoveUp,
  onMoveDown,
  updateTask,
  onDeleteTask,
  expandedItemId,
  onExpandItem,
  activeTimer,
  onStartTimer,
  onStopTimer,
  onDeleteTimeLogEntry,
  onAddSubtask,
  onAddSubtaskInline,
  onDuplicate,
  db,
  updateDb
}) => {
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const [isConfirmingReopen, setIsConfirmingReopen] = useState(false);

  const projectTasks = useMemo(() => {
    return tasks.filter(task => task.tags?.includes(tag));
  }, [tasks, tag]);

  const handleCloseProject = () => {
    let coinsGained = 0;
    const updatedTasks = db.tasks.map(t => {
      const isTaskInProject = t.tags?.includes(tag);
      const isTaskCompleted = t.isCompleted || t.status === 'done' || t.planningStatus === 'done';
      if (isTaskInProject && !isTaskCompleted) {
        coinsGained += t.rewardValue || 15;
        return {
          ...t,
          isCompleted: true,
          status: 'done' as const,
          planningStatus: 'done' as const,
          completedAt: new Date().toISOString(),
          isPaused: true,
          lastResumeTime: undefined
        };
      }
      return t;
    });

    updateDb({
      ...db,
      tasks: updatedTasks,
      userProfile: {
        ...db.userProfile,
        coins: (db.userProfile?.coins || 0) + coinsGained
      }
    });
    setIsConfirmingClose(false);
  };

  const handleReopenProject = () => {
    const updatedTasks = db.tasks.map(t => {
      const isTaskInProject = t.tags?.includes(tag);
      if (isTaskInProject) {
        return {
          ...t,
          isCompleted: false,
          status: 'todo' as const,
          planningStatus: 'todo' as const,
          completedAt: undefined
        };
      }
      return t;
    });

    updateDb({
      ...db,
      tasks: updatedTasks
    });
    setIsConfirmingReopen(false);
  };

  const dependencyTrees = useMemo(() => {
    if (projectTasks.length === 0) return [];

    const projectTaskMap = new Map<string, Task>();
    projectTasks.forEach(t => projectTaskMap.set(t.id, t));

    const roots: Task[] = [];
    const dependencyChildren = new Map<string, string[]>();

    projectTasks.forEach(task => {
      if (hideCompleted && (task.isCompleted || task.status === 'done' || task.planningStatus === 'done')) {
        return;
      }

      const activeDeps = (task.dependencies || []).filter(depId => {
        const depTask = allTasksMap.get(depId);
        return depTask && !depTask.isCompleted && depTask.status !== 'done' && depTask.planningStatus !== 'done';
      });

      if (activeDeps.length === 0) {
        roots.push(task);
      } else {
        activeDeps.forEach(depId => {
          if (!dependencyChildren.has(depId)) {
            dependencyChildren.set(depId, []);
          }
          dependencyChildren.get(depId)!.push(task.id);
        });
      }
    });

    const visited = new Set<string>();

    const buildNode = (task: Task): TreeTaskNode => {
      visited.add(task.id);
      const childIds = dependencyChildren.get(task.id) || [];
      const children: TreeTaskNode[] = [];

      childIds.forEach(childId => {
        if (!visited.has(childId)) {
          const childTask = projectTaskMap.get(childId);
          if (childTask) {
            children.push(buildNode(childTask));
          }
        }
      });

      return { task, children };
    };

    const treeNodes: TreeTaskNode[] = [];
    roots.forEach(r => {
      if (!visited.has(r.id)) {
        treeNodes.push(buildNode(r));
      }
    });

    projectTasks.forEach(task => {
      if (hideCompleted && (task.isCompleted || task.status === 'done' || task.planningStatus === 'done')) {
        return;
      }
      if (!visited.has(task.id)) {
        treeNodes.push(buildNode(task));
      }
    });

    return treeNodes;
  }, [projectTasks, allTasksMap, hideCompleted]);

  const visibleCount = projectTasks.filter(t => !t.isCompleted && t.status !== 'done' && t.planningStatus !== 'done').length;

  if (hideCompleted && visibleCount === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border-4 border-black shadow-[4px_4px_0px_#000] p-4 flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex justify-between items-center bg-gray-100 dark:bg-slate-800 p-3 border-2 border-black">
        <div 
          onClick={onToggleCollapse} 
          className="flex items-center gap-2 cursor-pointer select-none font-bold text-[12px] text-slate-800 dark:text-slate-100"
        >
          <FolderOpen size={16} className="text-amber-500" />
          <span className="uppercase">{tag}</span>
          <span className="text-[9px] text-gray-400 font-semibold">
            ({visibleCount} active(s) / {projectTasks.length} total)
          </span>
          {visibleCount === 0 && projectTasks.length > 0 && (
            <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900 text-[8px] font-black uppercase tracking-wider">
              ✅ Clôturé
            </span>
          )}
        </div>

        {/* Boutons de commandes d'ordre et collapse */}
        <div className="flex gap-1.5 items-center">
          {visibleCount > 0 ? (
            isConfirmingClose ? (
              <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950/40 p-1 border-2 border-black">
                <span className="text-[8px] font-black uppercase text-amber-700 dark:text-amber-300">Tout valider ?</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleCloseProject(); }}
                  className="px-1.5 py-0.5 text-[8px] font-black uppercase border border-black bg-emerald-400 text-black cursor-pointer shadow-[1px_1px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  Oui
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsConfirmingClose(false); }}
                  className="px-1.5 py-0.5 text-[8px] font-black uppercase border border-black bg-white text-black cursor-pointer shadow-[1px_1px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  Non
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsConfirmingClose(true); }}
                className="px-2 py-1 text-[9px] font-black uppercase border-2 border-black bg-yellow-400 text-black shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                Clôturer
              </button>
            )
          ) : (
            projectTasks.length > 0 && (
              isConfirmingReopen ? (
                <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950/40 p-1 border-2 border-black">
                  <span className="text-[8px] font-black uppercase text-amber-700 dark:text-amber-300">Réouvrir ?</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleReopenProject(); }}
                    className="px-1.5 py-0.5 text-[8px] font-black uppercase border border-black bg-emerald-400 text-black cursor-pointer shadow-[1px_1px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsConfirmingReopen(false); }}
                    className="px-1.5 py-0.5 text-[8px] font-black uppercase border border-black bg-white text-black cursor-pointer shadow-[1px_1px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    Non
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsConfirmingReopen(true); }}
                  className="px-2 py-1 text-[9px] font-black uppercase border-2 border-black bg-emerald-400 text-black shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  Réouvrir
                </button>
              )
            )
          )}
          <button
            type="button"
            title="Monter"
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={index === 0}
            className={`p-1.5 border-2 border-black text-black dark:text-white font-black shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer ${
              index === 0 ? "bg-gray-150 text-gray-400 cursor-not-allowed shadow-none border-gray-300" : "bg-white hover:bg-gray-100"
            }`}
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            title="Descendre"
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={index === totalTags - 1}
            className={`p-1.5 border-2 border-black text-black dark:text-white font-black shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer ${
              index === totalTags - 1 ? "bg-gray-150 text-gray-400 cursor-not-allowed shadow-none border-gray-300" : "bg-white hover:bg-gray-100"
            }`}
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
            className="px-2 py-1 text-[9px] font-black uppercase border-2 border-black bg-white dark:bg-slate-900 text-black dark:text-white shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            {collapsed ? "Déployer" : "Replier"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-4">
          {/* Linker spécifique du projet */}
          <DependencyLinker tasks={projectTasks} onUpdate={updateTask} />

          {/* Rendu de l'arbre */}
          <div className="bg-slate-50 dark:bg-slate-900/40 border-2 border-black p-4 shadow-[3px_3px_0px_#000] min-h-[155px]">
            {dependencyTrees.length > 0 ? (
              <div className="space-y-4">
                {dependencyTrees.map(treeNode => (
                  <DependencyTreeNode
                    key={treeNode.task.id}
                    node={treeNode}
                    allTasks={tasks} // On transmet la globalité pour la résolution de liens
                    allTasksMap={allTasksMap}
                    depth={0}
                    expandedItemId={expandedItemId}
                    onExpandItem={onExpandItem}
                    updateTask={updateTask}
                    onDeleteTask={onDeleteTask}
                    activeTimer={activeTimer}
                    onStartTimer={onStartTimer}
                    onStopTimer={onStopTimer}
                    onDeleteTimeLogEntry={onDeleteTimeLogEntry}
                    onAddSubtask={onAddSubtask}
                    onAddSubtaskInline={onAddSubtaskInline}
                    onDuplicate={onDuplicate}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                {hideCompleted ? "Toutes les tâches de l'arbre sont terminées." : "Aucune tâche disponible pour ce tag."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ProjectsView: React.FC<ProjectsViewProps> = (props) => {
  const { 
    db,
    updateDb,
    tasks: propTasks, 
    updateTask: propUpdateTask, 
    onDeleteTask: propOnDeleteTask, 
    onStartFocus, 
    onAnalyzeSubTasks, 
    onStartChat, 
    onEditTask, 
    expandedItemId: propExpandedItemId, 
    onExpandItem: propOnExpandItem, 
    activeTimer: propActiveTimer, 
    onStartTimer: propOnStartTimer, 
    onStopTimer: propOnStopTimer, 
    onDeleteTimeLogEntry: propOnDeleteTimeLogEntry, 
    onAddSubtask,
    onAddSubtaskInline: propOnAddSubtaskInline,
    onDuplicate
  } = props;

  const [localExpandedItemId, setLocalExpandedItemId] = useState<string | null>(null);
  const expandedItemId = propExpandedItemId !== undefined ? propExpandedItemId : localExpandedItemId;
  const onExpandItem = propOnExpandItem || ((id: string) => setLocalExpandedItemId(prev => prev === id ? null : id));

  const tasks = propTasks || useMemo(() => db.tasks.filter(t => t.type !== "routine" && !t.isPlanningOnly), [db.tasks]);

  const updateTask = propUpdateTask || ((taskId: string, updates: Partial<Omit<Task, 'id'>>) => {
    const updated = db.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    updateDb({ ...db, tasks: updated });
  });

  const onDeleteTask = propOnDeleteTask || ((taskId: string) => {
    const updated = db.tasks.filter(t => t.id !== taskId);
    updateDb({ ...db, tasks: updated });
  });

  const runningTask = db.tasks.find(t => t.planningStatus === "in-progress" && !t.isPaused);
  const activeTimer = propActiveTimer !== undefined ? propActiveTimer : (runningTask && runningTask.lastResumeTime ? {
    taskId: runningTask.id,
    startTime: new Date(runningTask.lastResumeTime).getTime() - (runningTask.accumulatedTime || 0) * 1000
  } : null);

  const onStartTimer = propOnStartTimer || ((taskId: string) => {
    const nowISO = new Date().toISOString();
    const updatedTasks = db.tasks.map((t) => {
      if (t.id === taskId) {
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
    const updatedProfile = {
      ...db.userProfile,
      activeChrono: { id: taskId, type: "task" as const }
    };
    updateDb({ ...db, tasks: updatedTasks, userProfile: updatedProfile });
  });

  const onStopTimer = propOnStopTimer || (() => {
    const running = db.tasks.find(t => t.planningStatus === "in-progress" && !t.isPaused);
    if (running && running.lastResumeTime) {
      const now = Date.now();
      const extraSec = Math.round((now - new Date(running.lastResumeTime).getTime()) / 1000);
      const totalSec = (running.accumulatedTime || 0) + extraSec;

      const updatedTasks = db.tasks.map((t) => {
        if (t.id === running.id) {
          return {
            ...t,
            planningStatus: t.scheduledTime ? "scheduled" as const : "backlog" as const,
            accumulatedTime: totalSec,
            timeSpentSeconds: (t.timeSpentSeconds || 0) + extraSec,
            isPaused: true,
            lastResumeTime: undefined
          };
        }
        return t;
      });
      
      const updatedProfile = { ...db.userProfile };
      if (updatedProfile.activeChrono) {
        delete updatedProfile.activeChrono;
      }
      updateDb({ ...db, tasks: updatedTasks, userProfile: updatedProfile });
    }
  });

  const onDeleteTimeLogEntry = propOnDeleteTimeLogEntry || ((taskId: string, logId: string) => {
    const updatedTasks = db.tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, timeLog: (t.timeLog || []).filter(log => log.id !== logId) };
      }
      return t;
    });
    updateDb({ ...db, tasks: updatedTasks });
  });

  const onAddSubtaskInline = propOnAddSubtaskInline || ((parentTaskId: string, title: string) => {
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
    updateDb({ ...db, tasks: [...db.tasks, newSubtask] });
  });
  const [hideCompleted, setHideCompleted] = useState(false);
  const [collapsedTags, setCollapsedTags] = useState<Record<string, boolean>>({});

  // Tous les tags uniques triés par ordre alphabétique
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    tasks.forEach(task => {
      task.tags?.forEach(tag => {
        if (tag && tag.trim()) tagsSet.add(tag.trim());
      });
    });
    return Array.from(tagsSet).sort();
  }, [tasks]);

  // Tri à plat persistant
  const orderedTags = useMemo(() => {
    const order = db.userProfile?.projectOrder || [];
    const validOrdered = order.filter(tag => allTags.includes(tag));
    const missing = allTags.filter(tag => !validOrdered.includes(tag));
    return [...validOrdered, ...missing];
  }, [allTags, db.userProfile?.projectOrder]);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedTags];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        projectOrder: newOrder
      }
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === orderedTags.length - 1) return;
    const newOrder = [...orderedTags];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        projectOrder: newOrder
      }
    });
  };

  const toggleCollapse = (tag: string) => {
    setCollapsedTags(prev => ({
      ...prev,
      [tag]: !prev[tag]
    }));
  };

  const allTasksMap = useMemo(() => {
    const m = new Map<string, Task>();
    tasks.forEach(t => m.set(t.id, t));
    return m;
  }, [tasks]);

  if (orderedTags.length === 0) {
    return (
      <div className="mt-8 font-mono select-none">
        <div className="flex items-center gap-1.5 mb-6 border-b-2 border-black pb-4">
          <Network size={20} className="text-black dark:text-white" />
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest">
            Projets & Dépendances
          </h1>
        </div>
        <div className="text-center py-16 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border-2 border-black shadow-[4px_4px_0px_#000]">
          <p className="font-black text-[11px] uppercase tracking-wider">Aucun projet trouvé</p>
          <p className="text-[10px] uppercase mt-2">Créez des tâches avec des "Tags" à l'étape d'avant pour structurer vos projets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest flex items-center gap-1.5">
            <Network size={20} className="text-black dark:text-white" /> Projets & Dépendances
          </h1>
          <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">
            Visualisation complète et ordonancement manuel de tous vos projets.
          </p>
        </div>

        {/* Options globales d'affichage */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setHideCompleted(prev => !prev)}
            className="px-3 py-1.5 border-2 border-black font-black text-[10px] uppercase bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1 cursor-pointer"
          >
            {hideCompleted ? <Eye size={12} /> : <EyeOff size={12} />}
            {hideCompleted ? "Montrer accomplies" : "Masquer accomplies"}
          </button>
        </div>
      </div>

      {/* Rendu séquentiel de TOUS les projets dans l'ordre défini */}
      <div className="space-y-6">
        {orderedTags.map((tag, idx) => (
          <ProjectSection
            key={tag}
            tag={tag}
            index={idx}
            totalTags={orderedTags.length}
            tasks={tasks}
            allTasksMap={allTasksMap}
            hideCompleted={hideCompleted}
            collapsed={!!collapsedTags[tag]}
            onToggleCollapse={() => toggleCollapse(tag)}
            onMoveUp={() => handleMoveUp(idx)}
            onMoveDown={() => handleMoveDown(idx)}
            updateTask={updateTask}
            onDeleteTask={onDeleteTask}
            expandedItemId={expandedItemId}
            onExpandItem={onExpandItem}
            activeTimer={activeTimer}
            onStartTimer={onStartTimer}
            onStopTimer={onStopTimer}
            onDeleteTimeLogEntry={onDeleteTimeLogEntry}
            onAddSubtask={onAddSubtask}
            onAddSubtaskInline={onAddSubtaskInline}
            onDuplicate={onDuplicate}
            db={db}
            updateDb={updateDb}
          />
        ))}
      </div>
    </div>
  );
};
