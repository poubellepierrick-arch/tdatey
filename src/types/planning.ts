/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlanningType = 'routine' | 'ponctuelle';
export type PlanningStatus = 'backlog' | 'scheduled' | 'in-progress' | 'done';

export interface PlanningTask {
  id: string;
  title: string;
  type: PlanningType;
  status: PlanningStatus;
  estimatedDuration: number; // en minutes
  actualDuration: number; // en minutes
  scheduledTime?: string; // ex: "11:30"
  startTime?: string; // format ISO
  endTime?: string; // format ISO
  accumulatedTime: number; // en secondes
  isPaused: boolean;
  lastResumeTime?: string; // format ISO
}
