/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlanningTask, PlanningType, PlanningStatus } from '../types/planning';

interface PlanningStore {
  tasks: PlanningTask[];
  addTask: (title: string, type: PlanningType, estimatedDuration: number, scheduledTime?: string) => void;
  updateTaskTime: (id: string, scheduledTime?: string) => void;
  deleteTask: (id: string) => void;
  startTask: (id: string) => void;
  pauseTask: (id: string) => void;
  resumeTask: (id: string) => void;
  stopTask: (id: string) => void;
  loadDemoMode: () => void;
  resetAll: () => void;
}

export const usePlanningStore = create<PlanningStore>()(
  persist(
    (set) => ({
      tasks: [
        {
          id: 'demo-init-1',
          title: 'Planifier ma première routine fleurie',
          type: 'routine',
          status: 'backlog',
          estimatedDuration: 15,
          actualDuration: 0,
          accumulatedTime: 0,
          isPaused: false
        },
        {
          id: 'demo-init-2',
          title: 'Arrosage des fleurs du jardin',
          type: 'ponctuelle',
          status: 'scheduled',
          estimatedDuration: 10,
          actualDuration: 0,
          scheduledTime: '11:15',
          accumulatedTime: 0,
          isPaused: false
        }
      ],

      addTask: (title, type, estimatedDuration, scheduledTime) => {
        set((state) => {
          const hasTime = !!scheduledTime && scheduledTime.trim() !== '';
          const newTask: PlanningTask = {
            id: `plan-task-${Date.now()}`,
            title,
            type,
            status: hasTime ? 'scheduled' : 'backlog',
            estimatedDuration,
            actualDuration: 0,
            scheduledTime: hasTime ? scheduledTime : undefined,
            accumulatedTime: 0,
            isPaused: false
          };
          return { tasks: [...state.tasks, newTask] };
        });
      },

      updateTaskTime: (id, scheduledTime) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === id) {
              const hasTime = !!scheduledTime && scheduledTime.trim() !== '';
              return {
                ...t,
                scheduledTime: hasTime ? scheduledTime : undefined,
                status: t.status === 'done' ? 'done' : hasTime ? 'scheduled' : 'backlog'
              };
            }
            return t;
          })
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id)
        }));
      },

      startTask: (id) => {
        set((state) => {
          const nowISO = new Date().toISOString();
          return {
            tasks: state.tasks.map((t) => {
              if (t.id === id) {
                return {
                  ...t,
                  status: 'in-progress' as PlanningStatus,
                  startTime: t.startTime || nowISO,
                  lastResumeTime: nowISO,
                  isPaused: false
                };
              } else if (t.status === 'in-progress') {
                // Mettre en pause les autres tâches
                const acc = t.accumulatedTime + (t.lastResumeTime ? Math.round((Date.now() - new Date(t.lastResumeTime).getTime()) / 1000) : 0);
                return {
                  ...t,
                  status: 'in-progress' as PlanningStatus,
                  isPaused: true,
                  accumulatedTime: acc,
                  lastResumeTime: undefined
                };
              }
              return t;
            })
          };
        });
      },

      pauseTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === id && t.status === 'in-progress' && !t.isPaused) {
              const extraSeconds = t.lastResumeTime ? Math.round((Date.now() - new Date(t.lastResumeTime).getTime()) / 1000) : 0;
              return {
                ...t,
                isPaused: true,
                accumulatedTime: t.accumulatedTime + extraSeconds,
                lastResumeTime: undefined
              };
            }
            return t;
          })
        }));
      },

      resumeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === id && t.status === 'in-progress' && t.isPaused) {
              return {
                ...t,
                isPaused: false,
                lastResumeTime: new Date().toISOString()
              };
            }
            return t;
          })
        }));
      },

      stopTask: (id) => {
        set((state) => {
          const nowISO = new Date().toISOString();
          return {
            tasks: state.tasks.map((t) => {
              if (t.id === id) {
                const extraSeconds = (!t.isPaused && t.lastResumeTime) ? Math.round((Date.now() - new Date(t.lastResumeTime).getTime()) / 1000) : 0;
                const totalSeconds = t.accumulatedTime + extraSeconds;
                const actualMinutes = Math.max(1, Math.round(totalSeconds / 60));
                
                return {
                  ...t,
                  status: 'done' as PlanningStatus,
                  actualDuration: actualMinutes,
                  endTime: nowISO,
                  isPaused: false,
                  lastResumeTime: undefined
                };
              }
              return t;
            })
          };
        });
      },

      loadDemoMode: () => {
        set(() => {
          const baseTasks: PlanningTask[] = [
            {
              id: 'demo-1',
              title: 'Préparer la pâte à cookies',
              type: 'routine',
              status: 'scheduled',
              estimatedDuration: 45,
              actualDuration: 0,
              scheduledTime: '11:00',
              accumulatedTime: 0,
              isPaused: false
            },
            {
              id: 'demo-2',
              title: 'Cuisson fournée 1',
              type: 'ponctuelle',
              status: 'scheduled',
              estimatedDuration: 20,
              actualDuration: 0,
              scheduledTime: '12:00',
              accumulatedTime: 0,
              isPaused: false
            },
            {
              id: 'demo-3',
              title: 'Réassort vitrine',
              type: 'ponctuelle',
              status: 'scheduled',
              estimatedDuration: 15,
              actualDuration: 0,
              scheduledTime: '14:00',
              accumulatedTime: 0,
              isPaused: false
            },
            {
              id: 'demo-4',
              title: 'Nettoyage machine espresso',
              type: 'routine',
              status: 'scheduled',
              estimatedDuration: 15,
              actualDuration: 0,
              scheduledTime: '18:30',
              accumulatedTime: 0,
              isPaused: false
            },
            {
              id: 'demo-5',
              title: 'Faire la caisse',
              type: 'routine',
              status: 'scheduled',
              estimatedDuration: 20,
              actualDuration: 0,
              scheduledTime: '18:45',
              accumulatedTime: 0,
              isPaused: false
            }
          ];
          return { tasks: baseTasks };
        });
      },

      resetAll: () => {
        set(() => ({ tasks: [] }));
      }
    }),
    {
      name: 'tod-planning-store', // Clé de stockage persistante dans le navigateur
    }
  )
);
