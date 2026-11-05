import React, { useState } from "react";
import { AppDatabase, Task } from "../../types";
import { calculateTaskScore } from "../../lib/state";
import { ArrowUpDown, Flame, AlertCircle, ShieldEllipsis, Smile, Award } from "lucide-react";
import { TaskCard } from "./TaskCard";

interface RankingViewProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
  onDuplicate?: (task: Task) => void;
}

type SortCriteria = "score" | "importance" | "urgency" | "mentalLoad" | "easiness";

export default function RankingView({ db, updateDb, onDuplicate }: RankingViewProps) {
  const [currentSort, setCurrentSort] = useState<SortCriteria>("score");
  const [currentFilter, setCurrentFilter] = useState<"all" | "pending" | "completed">("pending");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const isTaskDone = (t: Task) => Boolean(t.isCompleted || t.status === "done" || t.planningStatus === "done");

  // Filtrer les tâches
  const filteredTasks = db.tasks.filter((t) => {
    if (t.isArchived) return false;
    // Les événements d'agenda purs (event) et les routines de planning n'entrent pas dans le classement des tâches
    if (t.type === "event" || t.type === "routine" || t.isPlanningOnly) return false;

    if (currentFilter === "pending") return !isTaskDone(t);
    if (currentFilter === "completed") return isTaskDone(t);
    return true;
  });

  // Trier les tâches selon le critère choisi
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (currentSort === "score") {
      return calculateTaskScore(b) - calculateTaskScore(a);
    }
    return b[currentSort] - a[currentSort];
  });

  // Formule de tri dynamique
  const getLabelAndColor = (criteria: SortCriteria) => {
    switch (criteria) {
      case "score":
        return { label: "CUMULÉ TOTAL (Score)", color: "bg-red-300" };
      case "importance":
        return { label: "IMPORTANCE ABSOLUE", color: "bg-yellow-300" };
      case "urgency":
        return { label: "URGENCE TEMPORELLE", color: "bg-orange-300" };
      case "mentalLoad":
        return { label: "CHARGE MENTALE", color: "bg-purple-300" };
      case "easiness":
        return { label: "FACILITÉ / SIMPLICITÉ", color: "bg-green-300" };
    }
  };

  // Handlers pour TaskCard
  const handleUpdateTask = (taskId: string, updates: Partial<Omit<Task, 'id'>>) => {
    const updated = db.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    updateDb({ ...db, tasks: updated });
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = db.tasks.filter(t => t.id !== taskId);
    updateDb({ ...db, tasks: updated });
  };

  const handleArchiveTask = (taskId: string) => {
    const updated = db.tasks.map(t => t.id === taskId ? { ...t, isArchived: true, archivedAt: new Date().toISOString() } : t);
    updateDb({ ...db, tasks: updated });
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
    updateDb({ ...db, tasks: [...db.tasks, newSubtask] });
  };

  // Timer actif unifié
  const runningTask = db.tasks.find(t => t.planningStatus === "in-progress" && !t.isPaused);
  const activeTimer = runningTask && runningTask.lastResumeTime ? {
    taskId: runningTask.id,
    startTime: new Date(runningTask.lastResumeTime).getTime() - (runningTask.accumulatedTime || 0) * 1000
  } : null;

  const handleStartTimer = (taskId: string) => {
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
  };

  const handleStopTimer = () => {
    const running = db.tasks.find(t => t.planningStatus === "in-progress" && !t.isPaused);
    if (running && running.lastResumeTime) {
      const now = Date.now();
      const extraSec = Math.round((now - new Date(running.lastResumeTime).getTime()) / 1000);
      const totalSec = (running.accumulatedTime || 0) + extraSec;
      const durationMin = Math.max(1, Math.round(totalSec / 60));

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

      const entryId = Math.random().toString(36).substring(2, 9);
      const newLog = { id: entryId, duration: durationMin, date: new Date().toISOString().split("T")[0] };
      const coinGain = Math.round(durationMin * (running.chronoRewardValue || 2));
      const updatedCoins = (db.userProfile?.coins || 0) + coinGain;
      const finalTasks = updatedTasks.map(t => t.id === running.id ? { ...t, timeLog: [...(t.timeLog || []), newLog] } : t);

      updateDb({
        ...db,
        userProfile: { ...updatedProfile, coins: updatedCoins },
        tasks: finalTasks
      });
    }
  };

  const handleDeleteTimeLogEntry = (taskId: string, logId: string) => {
    const updatedTasks = db.tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, timeLog: (t.timeLog || []).filter(log => log.id !== logId) };
      }
      return t;
    });
    updateDb({ ...db, tasks: updatedTasks });
  };

  const handleLogTime = (taskId: string, duration: number, date: string) => {
    const task = db.tasks.find(t => t.id === taskId);
    if (task) {
      const entryId = Math.random().toString(36).substring(2, 9);
      const newLog = { id: entryId, duration, date };
      const rewardRate = task.chronoRewardValue || 2;
      const coinDelta = duration > 0 ? Math.round(duration * rewardRate) : -Math.round(Math.abs(duration) * rewardRate);
      const updatedCoins = Math.max(0, (db.userProfile?.coins || 0) + coinDelta);
      const extraSec = duration * 60;
      const currentWorkSec = task.workHistory?.[date] || 0;
      const newWorkSec = Math.max(0, currentWorkSec + extraSec);
      const updatedTasks = db.tasks.map(t => t.id === taskId ? {
        ...t,
        timeSpentSeconds: Math.max(0, (t.timeSpentSeconds || 0) + extraSec),
        accumulatedTime: Math.max(0, (t.accumulatedTime || 0) + extraSec),
        timeLog: [...(t.timeLog || []), newLog],
        workHistory: {
          ...(t.workHistory || {}),
          [date]: newWorkSec
        }
      } : t);
      updateDb({
        ...db,
        userProfile: { ...db.userProfile, coins: updatedCoins },
        tasks: updatedTasks
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Explication Memphis Matrix */}
      <div className="bg-purple-100 border-4 border-black p-4 rounded-none shadow-[4px_4px_0px_0px_#000]">
        <h2 className="text-2xl font-black font-mono tracking-tight text-black flex items-center gap-2">
          🏆 MATRICE D'ORDONNANCEMENT ET CLASSEMENT DES AMBITIONS
        </h2>
        <p className="text-sm font-semibold font-mono text-gray-700 mt-1">
          tod° classe et priorise vos tâches grâce au croisement de 4 critères opérationnels : l'Urgence, l'Importance, la Charge Mentale nécessaire et la Facilité d'exécution.
        </p>
      </div>

      {/* Boutons de filtrage et de critères */}
      <div className="border-4 border-black bg-white p-4 rounded-none shadow-[4px_4px_0px_0px_#000]">
        
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b-2 border-black pb-4 mb-4 font-mono">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">Filtrage des tâches</span>
            <div className="flex gap-2">
              {(["pending", "completed", "all"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setCurrentFilter(filter)}
                  className={`border-2 border-black px-3 py-1 font-black text-xs uppercase cursor-pointer shadow-[1px_1px_0px_0px_#000] ${
                    currentFilter === filter ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {filter === "pending" ? "A faire (en attente)" : filter === "completed" ? "Faites (réussies)" : "Toutes"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">Trier d'abord par</span>
            <div className="flex flex-wrap gap-2">
              {(["score", "importance", "urgency", "mentalLoad", "easiness"] as const).map((criteria) => (
                <button
                  key={criteria}
                  onClick={() => setCurrentSort(criteria)}
                  className={`border-2 border-black px-2.5 py-1 font-black text-xs uppercase cursor-pointer shadow-[1px_1px_0px_0px_#000] ${
                    currentSort === criteria
                      ? getLabelAndColor(criteria).color + " text-black scale-105"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {criteria === "score" ? "Cumulé (Score)" : criteria}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Classement des tâches Style Memphis Grid */}
        <div className="space-y-4 font-mono text-xs">
          <div className="bg-yellow-400 border-2 border-black p-2 font-black uppercase text-black text-xs flex justify-between">
            <span>Tâches ordonnées d'après le critère : {getLabelAndColor(currentSort).label}</span>
            <span>Priorité Décroissante</span>
          </div>

          {sortedTasks.length === 0 ? (
            <p className="text-center py-12 text-gray-500 font-bold">
              Aucune tâche ne correspond aux critères sélectionnés.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map((t, index) => {
                const isChampion = index === 0;

                return (
                  <div key={t.id} className="relative flex items-start gap-3 w-full">
                    {/* Numéro du rang et Badge Champion */}
                    <div className="flex flex-col items-center justify-start pt-2 shrink-0 select-none">
                      <div className="bg-black text-white text-xs font-black w-7 h-7 flex items-center justify-center border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        #{index + 1}
                      </div>
                      {isChampion && (
                        <span className="mt-1 bg-yellow-400 text-black border-2 border-black text-[8px] font-black px-1 uppercase tracking-tighter">
                          🏆 Top
                        </span>
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <TaskCard
                        task={t}
                        allTasks={db.tasks}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteTask}
                        onArchive={handleArchiveTask}
                        isExpanded={expandedTaskId === t.id}
                        onExpand={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)}
                        activeTimer={activeTimer}
                        onStartTimer={handleStartTimer}
                        onStopTimer={handleStopTimer}
                        onDeleteTimeLog={handleDeleteTimeLogEntry}
                        onLogTime={handleLogTime}
                        onDuplicate={onDuplicate}
                        onAddSubtaskInline={handleAddSubtaskInline}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
