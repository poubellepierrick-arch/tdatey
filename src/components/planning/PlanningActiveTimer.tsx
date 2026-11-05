/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { AppDatabase } from "../../types";
import { Play, Pause, Square, Hourglass } from "lucide-react";

interface PlanningActiveTimerProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
}

export default function PlanningActiveTimer({ db, updateDb }: PlanningActiveTimerProps) {
  // Trouver l'élément de chronomètre unifié actif ou ouvert
  const activeChronoInfo = db.userProfile?.activeChrono;
  
  let activeItem: {
    id: string;
    title: string;
    type: "task" | "habit" | "recurring";
    isPaused: boolean;
    lastResumeTime?: string;
    accumulatedTime?: number;
    durationMinutes?: number;
    rewardValue?: number;
    chronoRewardValue?: number;
    description?: string;
  } | null = null;

  if (activeChronoInfo) {
    const { id, type } = activeChronoInfo;
    if (type === "task") {
      const t = db.tasks.find((x) => x.id === id);
      if (t) {
        activeItem = {
          id: t.id,
          title: t.title,
          type: "task",
          isPaused: !!t.isPaused,
          lastResumeTime: t.lastResumeTime,
          accumulatedTime: t.accumulatedTime,
          durationMinutes: t.durationMinutes,
          rewardValue: t.rewardValue,
          chronoRewardValue: t.chronoRewardValue,
          description: t.description
        };
      }
    } else if (type === "habit") {
      const h = db.habits.find((x) => x.id === id);
      if (h) {
        activeItem = {
          id: h.id,
          title: h.title,
          type: "habit",
          isPaused: !!h.isPaused,
          lastResumeTime: h.lastResumeTime,
          accumulatedTime: h.accumulatedTime,
          durationMinutes: h.targetValue,
          rewardValue: h.rewardValue,
          chronoRewardValue: h.chronoRewardValue !== undefined ? h.chronoRewardValue : 1,
          description: h.description
        };
      }
    } else if (type === "recurring") {
      const rt = (db.recurringTasks || []).find((x) => x.id === id);
      if (rt) {
        activeItem = {
          id: rt.id,
          title: rt.title,
          type: "recurring",
          isPaused: !!rt.isPaused,
          lastResumeTime: rt.lastResumeTime,
          accumulatedTime: rt.accumulatedTime,
          durationMinutes: 30,
          rewardValue: rt.rewardValue !== undefined ? rt.rewardValue : 15,
          chronoRewardValue: rt.chronoRewardValue !== undefined ? rt.chronoRewardValue : 1,
          description: rt.description
        };
      }
    }
  }

  // Rétrocompatibilité : Recherche de tâche en cours de planification
  if (!activeItem) {
    const oldActiveTask = db.tasks.find((t) => t.planningStatus === "in-progress");
    if (oldActiveTask) {
      activeItem = {
        id: oldActiveTask.id,
        title: oldActiveTask.title,
        type: "task",
        isPaused: !!oldActiveTask.isPaused,
        lastResumeTime: oldActiveTask.lastResumeTime,
        accumulatedTime: oldActiveTask.accumulatedTime,
        durationMinutes: oldActiveTask.durationMinutes,
        rewardValue: oldActiveTask.rewardValue,
        chronoRewardValue: oldActiveTask.chronoRewardValue,
        description: oldActiveTask.description
      };
    }
  }
  
  // Forcer le re-rendu chaque seconde pour animer le minuteur en direct
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    if (!activeItem || activeItem.isPaused) return;

    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeItem?.id, activeItem?.isPaused]);

  if (!activeItem) return null;

  // Calcul du temps écoulé total combiné (les secondes passées cumulées + les secondes de la session courante)
  let elapsedSeconds = activeItem.accumulatedTime || 0;
  if (!activeItem.isPaused && activeItem.lastResumeTime) {
    const startObj = new Date(activeItem.lastResumeTime);
    elapsedSeconds += Math.round((Date.now() - startObj.getTime()) / 1000);
  }

  elapsedSeconds = Math.max(0, elapsedSeconds);

  // Formater les secondes sous format HH:MM:SS
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Actions du chronomètre
  const handlePause = () => {
    const nowISO = new Date().toISOString();
    const now = Date.now();
    const extraSeconds = activeItem.lastResumeTime
      ? Math.round((now - new Date(activeItem.lastResumeTime).getTime()) / 1000)
      : 0;

    const totalSeconds = (activeItem.accumulatedTime || 0) + extraSeconds;
    const minutesWorked = Math.floor(extraSeconds / 60);

    let updatedTasks = [...db.tasks];
    let updatedHabits = [...db.habits];
    let updatedRecurring = [...(db.recurringTasks || [])];
    let updatedProfile = { ...db.userProfile };

    const todayStr = new Date().toISOString().split("T")[0];

    // Mettre à jour activeChrono d'identification de pause
    updatedProfile.activeChrono = {
      id: activeItem.id,
      type: activeItem.type
    };

    if (minutesWorked > 0) {
      const rewardRate = activeItem.chronoRewardValue !== undefined ? activeItem.chronoRewardValue : 1;
      const extraCoins = Math.max(1, minutesWorked * rewardRate);
      updatedProfile.coins = (updatedProfile.coins || 0) + extraCoins;
    }

    if (activeItem.type === "task") {
      updatedTasks = db.tasks.map((t) => {
        if (t.id === activeItem.id) {
          return {
            ...t,
            isPaused: true,
            accumulatedTime: totalSeconds,
            lastResumeTime: undefined,
            workHistory: {
              ...(t.workHistory || {}),
              [todayStr]: (t.workHistory?.[todayStr] || 0) + extraSeconds
            }
          };
        }
        return t;
      });
    } else if (activeItem.type === "habit") {
      updatedHabits = db.habits.map((h) => {
        if (h.id === activeItem.id) {
          return {
            ...h,
            isPaused: true,
            accumulatedTime: totalSeconds,
            lastResumeTime: undefined,
            workHistory: {
              ...(h.workHistory || {}),
              [todayStr]: (h.workHistory?.[todayStr] || 0) + extraSeconds
            }
          };
        }
        return h;
      });
    } else if (activeItem.type === "recurring") {
      updatedRecurring = (db.recurringTasks || []).map((rt) => {
        if (rt.id === activeItem.id) {
          return {
            ...rt,
            isPaused: true,
            accumulatedTime: totalSeconds,
            lastResumeTime: undefined,
            workHistory: {
              ...(rt.workHistory || {}),
              [todayStr]: (rt.workHistory?.[todayStr] || 0) + extraSeconds
            }
          };
        }
        return rt;
      });
    }

    updateDb({
      ...db,
      tasks: updatedTasks,
      habits: updatedHabits,
      recurringTasks: updatedRecurring,
      userProfile: updatedProfile
    });
  };

  const handleResume = () => {
    const nowISO = new Date().toISOString();
    let updatedTasks = [...db.tasks];
    let updatedHabits = [...db.habits];
    let updatedRecurring = [...(db.recurringTasks || [])];
    let updatedProfile = { ...db.userProfile };

    // S'assurer qu'activeChrono est synchrone
    updatedProfile.activeChrono = {
      id: activeItem.id,
      type: activeItem.type
    };

    updatedTasks = updatedTasks.map((t) => {
      if (activeItem.type === "task" && t.id === activeItem.id) {
        return {
          ...t,
          isPaused: false,
          lastResumeTime: nowISO
        };
      }
      if (t.planningStatus === "in-progress" && !t.isPaused) {
        const extra = t.lastResumeTime ? Math.round((Date.now() - new Date(t.lastResumeTime).getTime()) / 1000) : 0;
        return {
          ...t,
          isPaused: true,
          accumulatedTime: (t.accumulatedTime || 0) + extra,
          lastResumeTime: undefined
        };
      }
      return t;
    });

    updatedHabits = updatedHabits.map((h) => {
      if (activeItem.type === "habit" && h.id === activeItem.id) {
        return {
          ...h,
          isPaused: false,
          lastResumeTime: nowISO
        };
      }
      if (!h.isPaused && h.lastResumeTime) {
        const extra = Math.round((Date.now() - new Date(h.lastResumeTime).getTime()) / 1000);
        return {
          ...h,
          isPaused: true,
          accumulatedTime: (h.accumulatedTime || 0) + extra,
          lastResumeTime: undefined
        };
      }
      return h;
    });

    updatedRecurring = updatedRecurring.map((rt) => {
      if (activeItem.type === "recurring" && rt.id === activeItem.id) {
        return {
          ...rt,
          isPaused: false,
          lastResumeTime: nowISO
        };
      }
      if (!rt.isPaused && rt.lastResumeTime) {
        const extra = Math.round((Date.now() - new Date(rt.lastResumeTime).getTime()) / 1000);
        return {
          ...rt,
          isPaused: true,
          accumulatedTime: (rt.accumulatedTime || 0) + extra,
          lastResumeTime: undefined
        };
      }
      return rt;
    });

    updateDb({
      ...db,
      tasks: updatedTasks,
      habits: updatedHabits,
      recurringTasks: updatedRecurring,
      userProfile: updatedProfile
    });
  };

  const handleStop = () => {
    const now = Date.now();
    const extraSeconds = !activeItem.isPaused && activeItem.lastResumeTime
      ? Math.round((now - new Date(activeItem.lastResumeTime).getTime()) / 1000)
      : 0;

    const totalSeconds = (activeItem.accumulatedTime || 0) + extraSeconds;
    const minutesWorked = Math.floor(extraSeconds / 60);

    let updatedTasks = [...db.tasks];
    let updatedHabits = [...db.habits];
    let updatedRecurring = [...(db.recurringTasks || [])];
    let updatedProfile = { ...db.userProfile };

    // Retrait total du chrono actif
    if (updatedProfile.activeChrono) {
      delete updatedProfile.activeChrono;
    }

    if (minutesWorked > 0) {
      const rewardRate = activeItem.chronoRewardValue !== undefined ? activeItem.chronoRewardValue : 1;
      const extraCoins = Math.max(1, minutesWorked * rewardRate);
      updatedProfile.coins = (updatedProfile.coins || 0) + extraCoins;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    if (activeItem.type === "task") {
      updatedTasks = db.tasks.map((t) => {
        if (t.id === activeItem.id) {
          return {
            ...t,
            planningStatus: t.scheduledTime ? "scheduled" as const : "backlog" as const,
            accumulatedTime: 0,
            timeSpentSeconds: (t.timeSpentSeconds || 0) + totalSeconds,
            isPaused: true,
            lastResumeTime: undefined,
            workHistory: {
              ...(t.workHistory || {}),
              [todayStr]: (t.workHistory?.[todayStr] || 0) + extraSeconds
            }
          };
        }
        return t;
      });
    } else if (activeItem.type === "habit") {
      updatedHabits = db.habits.map((h) => {
        if (h.id === activeItem.id) {
          let nextValue = h.currentValue;
          let extraMinutes = Math.floor(totalSeconds / 60);
          if (h.type === "chrono" && extraMinutes > 0) {
            nextValue = Math.min(h.targetValue, h.currentValue + extraMinutes);
          }

          const reachedTarget = nextValue >= h.targetValue;
          let streak = h.streak;
          if (reachedTarget && h.currentValue < h.targetValue) {
            streak += 1;
            updatedProfile.coins = (updatedProfile.coins || 0) + h.rewardValue;
          }

          return {
            ...h,
            currentValue: nextValue,
            accumulatedTime: 0,
            isPaused: true,
            lastResumeTime: undefined,
            streak,
            lastCompletedDate: reachedTarget ? todayStr : h.lastCompletedDate,
            history: { ...h.history, [todayStr]: nextValue },
            workHistory: {
              ...(h.workHistory || {}),
              [todayStr]: (h.workHistory?.[todayStr] || 0) + extraSeconds
            }
          };
        }
        return h;
      });
    } else if (activeItem.type === "recurring") {
      updatedRecurring = (db.recurringTasks || []).map((rt) => {
        if (rt.id === activeItem.id) {
          return {
            ...rt,
            accumulatedTime: 0,
            isPaused: true,
            lastResumeTime: undefined,
            workHistory: {
              ...(rt.workHistory || {}),
              [todayStr]: (rt.workHistory?.[todayStr] || 0) + extraSeconds
            }
          };
        }
        return rt;
      });
    }

    updateDb({
      ...db,
      tasks: updatedTasks,
      habits: updatedHabits,
      recurringTasks: updatedRecurring,
      userProfile: updatedProfile
    });
  };

  const handleValidate = () => {
    const now = Date.now();
    const extraSeconds = !activeItem.isPaused && activeItem.lastResumeTime
      ? Math.round((now - new Date(activeItem.lastResumeTime).getTime()) / 1000)
      : 0;

    const totalSeconds = (activeItem.accumulatedTime || 0) + extraSeconds;
    const minutesWorked = Math.max(0, Math.floor(totalSeconds / 60));

    let updatedTasks = [...db.tasks];
    let updatedHabits = [...db.habits];
    let updatedRecurring = [...(db.recurringTasks || [])];
    let updatedProfile = { ...db.userProfile };

    // Stop and remove active index
    if (updatedProfile.activeChrono) {
      delete updatedProfile.activeChrono;
    }

    const baseReward = activeItem.rewardValue || (activeItem.type === "task" ? 15 : activeItem.type === "habit" ? 10 : 15);
    const chronoRewardRate = activeItem.chronoRewardValue !== undefined ? activeItem.chronoRewardValue : 1;
    const chronoCoins = minutesWorked * chronoRewardRate;

    const todayStr = new Date().toISOString().split("T")[0];

    if (activeItem.type === "task") {
      updatedTasks = db.tasks.map((t) => {
        if (t.id === activeItem.id) {
          return {
            ...t,
            isCompleted: true,
            completedAt: new Date().toISOString(),
            planningStatus: "done" as const,
            accumulatedTime: 0,
            timeSpentSeconds: (t.timeSpentSeconds || 0) + totalSeconds,
            isPaused: true,
            lastResumeTime: undefined,
            workHistory: {
              ...(t.workHistory || {}),
              [todayStr]: (t.workHistory?.[todayStr] || 0) + extraSeconds
            }
          };
        }
        return t;
      });

      updatedProfile.coins = (updatedProfile.coins || 0) + baseReward + chronoCoins;

    } else if (activeItem.type === "habit") {
      updatedHabits = db.habits.map((h) => {
        if (h.id === activeItem.id) {
          let nextValue = h.type === "chrono" ? Math.min(h.targetValue, h.currentValue + Math.max(1, minutesWorked)) : h.targetValue;
          
          let streak = h.streak;
          const achievedCompNow = h.currentValue < h.targetValue && nextValue >= h.targetValue;
          if (achievedCompNow) {
            streak += 1;
          }

          return {
            ...h,
            currentValue: nextValue,
            accumulatedTime: 0,
            isPaused: true,
            lastResumeTime: undefined,
            streak,
            lastCompletedDate: todayStr,
            history: { ...h.history, [todayStr]: nextValue },
            workHistory: {
              ...(h.workHistory || {}),
              [todayStr]: (h.workHistory?.[todayStr] || 0) + extraSeconds
            }
          };
        }
        return h;
      });

      updatedProfile.coins = (updatedProfile.coins || 0) + baseReward + chronoCoins;

    } else if (activeItem.type === "recurring") {
      updatedRecurring = (db.recurringTasks || []).map((rt) => {
        if (rt.id === activeItem.id) {
          const historyCopy = { ...(rt.history || {}) };
          historyCopy[todayStr] = 1;

          return {
            ...rt,
            accumulatedTime: 0,
            isPaused: true,
            lastResumeTime: undefined,
            history: historyCopy,
            workHistory: {
              ...(rt.workHistory || {}),
              [todayStr]: (rt.workHistory?.[todayStr] || 0) + extraSeconds
            }
          };
        }
        return rt;
      });

      updatedProfile.coins = (updatedProfile.coins || 0) + baseReward + chronoCoins;
    }

    updateDb({
      ...db,
      tasks: updatedTasks,
      habits: updatedHabits,
      recurringTasks: updatedRecurring,
      userProfile: updatedProfile
    });
  };

  const typeLabels = {
    task: "TÂCHE",
    habit: "HABITUDE",
    recurring: "RITUEL"
  };

  return (
    <div id="chrono-overlay-container" className="fixed bottom-16 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 animate-slide-up">
      <div className="border-4 border-black bg-emerald-600 text-white p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <Hourglass className="animate-spin text-amber-200" size={14} />
          <span className="font-mono text-[9px] font-black tracking-widest uppercase bg-emerald-800 px-1.5 py-0.5 rounded border border-emerald-500">
            {typeLabels[activeItem.type]} CHRONO
          </span>
          {activeItem.isPaused && (
            <span className="text-[9px] bg-amber-400 text-black px-1.5 font-bold uppercase rounded">
              PAUSE
            </span>
          )}
        </div>

        <div className="space-y-0.5">
          <h4 className="font-mono font-black text-sm tracking-tight truncate text-white">
            {activeItem.title}
          </h4>
          {activeItem.durationMinutes !== undefined && (
            <p className="font-mono text-[10px] text-emerald-200 font-bold">
              Objectif: {activeItem.durationMinutes}m
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-emerald-500 pt-3 mt-1">
          <div className="font-mono font-black text-2xl tracking-wider text-amber-200">
            {formatTime(elapsedSeconds)}
          </div>

          <div className="flex gap-1.5">
            {activeItem.isPaused ? (
              <button
                id="chrono-btn-resume"
                onClick={handleResume}
                className="bg-amber-400 hover:bg-amber-300 text-black border-2 border-black p-2 rounded shadow-[2px_2px_0px_0px_#000] cursor-pointer flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                title="Reprendre"
              >
                <Play size={10} fill="currentColor" />
              </button>
            ) : (
              <button
                id="chrono-btn-pause"
                onClick={handlePause}
                className="bg-amber-400 hover:bg-amber-300 text-black border-2 border-black p-2 rounded shadow-[2px_2px_0px_0px_#000] cursor-pointer flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                title="Pause"
              >
                <Pause size={10} fill="currentColor" />
              </button>
            )}

            <button
              id="chrono-btn-stop"
              onClick={handleStop}
              className="bg-slate-300 hover:bg-slate-200 text-black border-2 border-black px-2 py-1 rounded shadow-[2px_2px_0px_0px_#000] cursor-pointer font-mono text-[10px] font-bold uppercase flex items-center gap-1 transition-transform hover:scale-105 active:scale-95"
              title="Arrêter"
            >
              <Square size={8} fill="currentColor" /> Fermer
            </button>

            <button
              id="chrono-btn-validate"
              onClick={handleValidate}
              className="bg-pink-300 hover:bg-pink-200 text-black border-2 border-black px-2 py-1 rounded shadow-[2px_2px_0px_0px_#000] cursor-pointer font-mono text-[10px] font-black uppercase flex items-center gap-1 transition-transform hover:scale-105 active:scale-95"
              title="Compléter"
            >
              ✓ Fait
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
