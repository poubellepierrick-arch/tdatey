import React, { useState } from "react";
import { Task } from "../../types";
import { calculateTaskScore } from "../../lib/state";
import { Check, X, Info, Loader2 } from "lucide-react";
import { IconPicker } from "./IconPicker";
import { 
  ensureCalendarAccessToken, 
  createGoogleCalendarEvent, 
  updateGoogleCalendarEvent, 
  deleteGoogleCalendarEvent 
} from "../../lib/googleCalendar";
import { getCalendarAccessToken } from "../../lib/firebase";

interface TaskInlineEditorProps {
  task: Task;
  onSave: (updatedTask: Task) => void;
  onCancel: () => void;
  allTasks?: Task[];
}

const POPULAR_EMOJIS = [
  "🎯", "⚡", "🏋️", "💻", "🌙", "💊", "🧹", "❤️", "👥", "📚", "💶", "🎭", "📧", "📏", "📞", "🎨", "🦁", "🧺", "🥗", "⏰"
];

export default function TaskInlineEditor({ task, onSave, onCancel, allTasks = [] }: TaskInlineEditorProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [icon, setIcon] = useState<string>(() => {
    if (!task.icon) return "🎯";
    if (typeof task.icon === "string") return task.icon;
    return task.icon.content;
  });
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // Score & priorities
  const [importance, setImportance] = useState(task.importance !== undefined ? task.importance : 5);
  const [urgency, setUrgency] = useState(task.urgency !== undefined ? task.urgency : 5);
  const [mental, setMental] = useState(task.mentalLoad !== undefined ? task.mentalLoad : 5);
  const [easiness, setEasiness] = useState(task.easiness !== undefined ? task.easiness : 5);

  // Planning & Deadlines
  const [duration, setDuration] = useState(task.durationMinutes !== undefined ? task.durationMinutes : 30);
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [isHardDeadline, setIsHardDeadline] = useState(!!task.isHardDeadline);
  const [scheduledTime, setScheduledTime] = useState(task.scheduledTime || "");

  // Project parent relationship
  const [parentTaskId, setParentTaskId] = useState(task.parentTaskId || task.parentId || "");
  const [tagsInput, setTagsInput] = useState(task.tags ? task.tags.join(", ") : "");
  const [taskDependencies, setTaskDependencies] = useState<string[]>(task.dependencies || []);

  const existingTags = React.useMemo(() => {
    const s = new Set<string>();
    allTasks.forEach(t => t.tags?.forEach(tag => {
      if (tag && tag.trim()) s.add(tag.trim());
    }));
    return Array.from(s);
  }, [allTasks]);

  // Rewards & Gamification
  const [isRewardAuto, setIsRewardAuto] = useState(true);
  const [manualRewardValue, setManualRewardValue] = useState(task.rewardValue || 20);
  const [chronoRewardValue, setChronoRewardValue] = useState(task.chronoRewardValue !== undefined ? task.chronoRewardValue : 1);
  const [timeSpentMin, setTimeSpentMin] = useState<number>(Math.round((task.timeSpentSeconds || task.accumulatedTime || 0) / 60));

  // Google Calendar
  const [isCalendarLinked, setIsCalendarLinked] = useState(!!task.googleEventId || !!task.isGoogleCalendarSynced);
  const [googleEventId, setGoogleEventId] = useState<string | undefined>(task.googleEventId);
  const [syncWithCalendarOnSave, setSyncWithCalendarOnSave] = useState(true);
  const [addToCalendarOnSave, setAddToCalendarOnSave] = useState(false);
  const [isConfirmingUnlink, setIsConfirmingUnlink] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);

  // Exclude current task from list of potential parents to prevent cycles
  const availableParents = allTasks.filter(t => t.id !== task.id && !t.isCompleted);

  const handleUnlinkCalendar = async () => {
    if (!googleEventId) {
      setIsCalendarLinked(false);
      setIsConfirmingUnlink(false);
      return;
    }
    setIsCalendarLoading(true);
    try {
      const token = getCalendarAccessToken();
      if (token) {
        await deleteGoogleCalendarEvent(token, googleEventId);
      }
    } catch (e) {
      console.warn("Erreur suppression événement Google Calendar :", e);
    } finally {
      setIsCalendarLinked(false);
      setGoogleEventId(undefined);
      setIsConfirmingUnlink(false);
      setIsCalendarLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsCalendarLoading(true);
    let finalGoogleEventId = googleEventId;
    let finalIsSynced = isCalendarLinked;

    try {
      if (isCalendarLinked && googleEventId && syncWithCalendarOnSave) {
        const token = await ensureCalendarAccessToken();
        if (token) {
          await updateGoogleCalendarEvent(token, googleEventId, {
            title: title.trim(),
            description: description.trim(),
            dueDate: dueDate || undefined,
            scheduledTime: scheduledTime || undefined,
            durationMinutes: Number(duration)
          });
        }
      } else if (!isCalendarLinked && addToCalendarOnSave) {
        const token = await ensureCalendarAccessToken();
        if (token) {
          const res = await createGoogleCalendarEvent(token, {
            title: title.trim(),
            description: description.trim(),
            dueDate: dueDate || undefined,
            scheduledTime: scheduledTime || undefined,
            durationMinutes: Number(duration)
          });
          if (res && res.id) {
            finalGoogleEventId = res.id;
            finalIsSynced = true;
          }
        }
      }
    } catch (err) {
      console.warn("Erreur synchronisation agenda :", err);
    } finally {
      setIsCalendarLoading(false);
    }

    const newScore = calculateTaskScore({
      importance,
      urgency,
      mentalLoad: mental,
      easiness,
    });

    const calculatedReward = Math.max(1, Math.round(newScore * 1.5));
    const finalReward = isRewardAuto ? calculatedReward : manualRewardValue;
    const newTimeSpentSec = Math.max(0, Number(timeSpentMin) * 60);

    const updated: Task = {
      ...task,
      title: title.trim(),
      description: description.trim(),
      icon: icon,
      importance,
      urgency,
      mentalLoad: mental,
      easiness: easiness,
      score: newScore,
      durationMinutes: Number(duration),
      timeSpentSeconds: newTimeSpentSec,
      accumulatedTime: newTimeSpentSec,
      dueDate: dueDate || undefined,
      isHardDeadline: isHardDeadline,
      scheduledTime: scheduledTime || undefined,
      parentTaskId: parentTaskId || undefined,
      parentId: parentTaskId || undefined, // Dual-compatibility
      rewardValue: finalReward,
      chronoRewardValue: Number(chronoRewardValue),
      tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean),
      dependencies: taskDependencies,
      isGoogleCalendarSynced: finalIsSynced,
      googleEventId: finalGoogleEventId
    };

    onSave(updated);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="p-3 border-2 border-slate-900 bg-amber-50/95 font-mono text-xs text-black space-y-3 shadow-[4px_4px_0px_#000]"
    >
      <div className="font-extrabold text-[11px] uppercase tracking-wider pb-1 border-b border-black flex justify-between items-center text-slate-900">
        <span>Modifier la tâche</span>
        <button 
          type="button" 
          onClick={onCancel}
          className="text-rose-600 hover:text-rose-800 font-bold"
          title="Annuler"
        >
          [Annuler]
        </button>
      </div>

      <div className="space-y-2.5">
        
        {/* Titre et Icône */}
        <div className="flex gap-2">
          <div className="relative">
            <label className="block text-[8px] font-black text-gray-700 uppercase mb-0.5">Icône</label>
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className="h-8 w-10 border-2 border-black bg-white text-base flex items-center justify-center hover:bg-yellow-200 cursor-pointer shadow-[1px_1px_0px_#000]"
              title="Modifier l'icône"
            >
              {icon}
            </button>
          </div>
          
          <div className="flex-1">
            <label className="block text-[8px] font-black text-gray-700 uppercase mb-0.5">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-8 border border-black p-1 bg-white font-bold"
              required
            />
          </div>
        </div>

        {isEmojiPickerOpen && (
          <div className="my-2">
            <IconPicker
              inline={true}
              onSelect={(e) => {
                setIcon(e);
                setIsEmojiPickerOpen(false);
              }}
              onClose={() => setIsEmojiPickerOpen(false)}
            />
          </div>
        )}

        {/* Description / Notes */}
        <div>
          <label className="block text-[8px] font-black text-gray-700 uppercase mb-0.5">Description / notes</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes complémentaires..."
            className="w-full min-h-[44px] max-h-24 border border-black p-1 bg-white text-[11px]"
          />
        </div>

        {/* Priorités / Critères */}
        <div className="border border-black/20 p-1.5 bg-white/50 rounded-none space-y-1.5">
          <span className="block text-[8px] font-black uppercase text-gray-500">Matrice de priorisation (0-10)</span>
          <div className="grid grid-cols-4 gap-1">
            <div>
              <label className="block text-[7px] font-black text-gray-700 text-center uppercase" title="Importance">Imp</label>
              <input
                type="number"
                min={0}
                max={10}
                value={importance}
                onChange={(e) => setImportance(Math.max(0, Math.min(10, parseInt(e.target.value) || 5)))}
                className="w-full border border-black p-0.5 bg-white font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-[7px] font-black text-gray-700 text-center uppercase" title="Urgence">Urg</label>
              <input
                type="number"
                min={0}
                max={10}
                value={urgency}
                onChange={(e) => setUrgency(Math.max(0, Math.min(10, parseInt(e.target.value) || 5)))}
                className="w-full border border-black p-0.5 bg-white font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-[7px] font-black text-gray-700 text-center uppercase" title="Charge Mentale">Mnt</label>
              <input
                type="number"
                min={0}
                max={10}
                value={mental}
                onChange={(e) => setMental(Math.max(0, Math.min(10, parseInt(e.target.value) || 5)))}
                className="w-full border border-black p-0.5 bg-white font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-[7px] font-black text-gray-700 text-center uppercase" title="Facilité">Fac</label>
              <input
                type="number"
                min={0}
                max={10}
                value={easiness}
                onChange={(e) => setEasiness(Math.max(0, Math.min(10, parseInt(e.target.value) || 5)))}
                className="w-full border border-black p-0.5 bg-white font-bold text-center"
              />
            </div>
          </div>
        </div>

        {/* Planification & Dates */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[8px] font-black text-gray-700 uppercase mb-0.5">Date planifiée</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-7 border border-black p-1 bg-white text-[10px]"
            />
          </div>
          <div>
            <label className="block text-[8px] font-black text-gray-700 uppercase mb-0.5">Heure planifiée</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full h-7 border border-black p-1 bg-white text-[10px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[8px] font-black text-gray-700 uppercase mb-0.5">Limite (Deadline)</label>
            <select
              value={isHardDeadline ? "hard" : "soft"}
              onChange={(e) => setIsHardDeadline(e.target.value === "hard")}
              className="w-full h-7 border border-black p-1 bg-white text-[10px]"
            >
              <option value="soft">Flexible (Soft)</option>
              <option value="hard">Absolue (Hard)</option>
            </select>
          </div>
          <div>
            <label className="block text-[8px] font-black text-gray-700 uppercase mb-0.5">Durée estimée (min)</label>
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
              className="w-full h-7 border border-black p-1 bg-white text-[10px] font-bold text-black"
            />
          </div>
          <div>
            <label className="block text-[8px] font-black text-emerald-700 uppercase mb-0.5">Temps passé (min)</label>
            <input
              type="number"
              min={0}
              value={timeSpentMin}
              onChange={(e) => setTimeSpentMin(parseInt(e.target.value) || 0)}
              className="w-full h-7 border border-black p-1 bg-emerald-50 text-[10px] font-bold text-black"
            />
          </div>
        </div>

        {/* Google Agenda */}
        {isCalendarLinked ? (
          <div className="border border-indigo-400 bg-indigo-50/70 p-1.5 flex flex-col gap-1 text-[9.5px]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-900 flex items-center gap-1">
                📅 Lié à Google Agenda
              </span>
              <label className="flex items-center gap-1 font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncWithCalendarOnSave}
                  onChange={(e) => setSyncWithCalendarOnSave(e.target.checked)}
                  className="accent-black h-3 w-3"
                />
                Mettre à jour
              </label>
            </div>
            <div className="flex items-center justify-between pt-0.5 border-t border-indigo-200">
              {isConfirmingUnlink ? (
                <div className="flex items-center gap-1.5 w-full justify-between">
                  <span className="text-[8px] text-red-600 font-bold">Retirer de Google Agenda ?</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={handleUnlinkCalendar}
                      className="px-1.5 py-0.5 bg-red-600 text-white font-bold text-[8px] border border-black"
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingUnlink(false)}
                      className="px-1.5 py-0.5 bg-white text-black font-bold text-[8px] border border-black"
                    >
                      Non
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingUnlink(true)}
                  className="text-red-600 hover:text-red-800 text-[8px] font-bold underline"
                >
                  Délier de Google Agenda
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-black/20 bg-white/60 p-1.5 flex items-center justify-between text-[9.5px]">
            <label className="flex items-center gap-1.5 font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={addToCalendarOnSave}
                onChange={(e) => setAddToCalendarOnSave(e.target.checked)}
                className="accent-black h-3.5 w-3.5"
              />
              <span>📅 Ajouter à Google Agenda</span>
            </label>
            {addToCalendarOnSave && (
              <span className="text-[8px] text-gray-500 font-mono">
                {getCalendarAccessToken() ? "✓ Connecté" : "Connexion demandée"}
              </span>
            )}
          </div>
        )}

        {/* Parent / Projet */}
        {availableParents.length > 0 && (
          <div>
            <label className="block text-[8px] font-black text-gray-700 uppercase mb-0.5">Projet Parent</label>
            <select
              value={parentTaskId}
              onChange={(e) => setParentTaskId(e.target.value)}
              className="w-full h-7 border border-black p-1 bg-white"
            >
              <option value="">Aucun parent (Tâche principale)</option>
              {availableParents.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Dépendances / Tâches préalables */}
        {allTasks.filter(t => t.id !== task.id && !t.isCompleted && t.status !== 'done' && t.planningStatus !== 'done').length > 0 && (
          <div>
            <label className="block text-[8px] font-black text-gray-700 uppercase mb-0.5">Préréquis requis (Doit être fait avant)</label>
            <div className="border border-black p-1 bg-white max-h-24 overflow-y-auto space-y-0.5">
              {allTasks.filter(t => t.id !== task.id && !t.isCompleted && t.status !== 'done' && t.planningStatus !== 'done').map(t => {
                const isChecked = taskDependencies.includes(t.id);
                return (
                  <label key={t.id} className="flex items-start gap-1 text-[9.5px] select-none cursor-pointer p-0.5 hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setTaskDependencies(prev => prev.filter(id => id !== t.id));
                        } else {
                          setTaskDependencies(prev => [...prev, t.id]);
                        }
                      }}
                      className="accent-black mt-0.5 h-3.5 w-3.5 cursor-pointer shrink-0"
                    />
                    <span className="truncate">{t.title}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags / Projets */}
        <div>
          <label className="block text-[8px] font-black text-gray-700 uppercase mb-0.5">Tags / Projets (séparés par des virgules)</label>
          <input
            type="text"
            placeholder="ex: Perso, Travail, Rénovations..."
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full h-7 border border-black p-1 bg-white text-[10px]"
          />
          {existingTags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1 items-center">
              <span className="text-[7.5px] font-bold text-gray-500 uppercase">Tags/Projets existants:</span>
              {existingTags.map(tag => {
                const tagParts = tagsInput.split(',').map(s => s.trim().toLowerCase());
                const isSelected = tagParts.includes(tag.toLowerCase());
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const parts = tagsInput.split(',').map(s => s.trim()).filter(Boolean);
                      const index = parts.findIndex(p => p.toLowerCase() === tag.toLowerCase());
                      if (index >= 0) {
                        parts.splice(index, 1);
                      } else {
                        parts.push(tag);
                      }
                      setTagsInput(parts.join(', '));
                    }}
                    className={`px-1 py-0.5 border border-black text-[8px] font-mono font-bold transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-black text-white' 
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Gamification / Récompenses */}
        <div className="border border-black/20 p-1.5 bg-white/50 rounded-none space-y-1.5 font-mono text-[10px]">
          <div className="flex justify-between items-center">
            <span className="block text-[8px] font-black uppercase text-gray-500">Gamification (CS)</span>
            <label className="flex items-center gap-0.5 text-[9px] font-bold uppercase select-none cursor-pointer">
              <input
                type="checkbox"
                checked={isRewardAuto}
                onChange={(e) => setIsRewardAuto(e.target.checked)}
                className="accent-black h-3 w-3"
              />
              Calcul Auto
            </label>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[7px] font-black text-gray-700 uppercase">Complétion</label>
              {isRewardAuto ? (
                <div className="h-6 border border-black bg-gray-100 flex items-center px-1 text-[9px] font-bold text-gray-700">
                  +{Math.max(1, Math.round(calculateTaskScore({ importance, urgency, mentalLoad: mental, easiness }) * 1.5))} CS
                </div>
              ) : (
                <input
                  type="number"
                  min={1}
                  value={manualRewardValue}
                  onChange={(e) => setManualRewardValue(parseInt(e.target.value) || 20)}
                  className="w-full h-6 border border-black px-1.5 bg-white"
                />
              )}
            </div>
            
            <div>
              <label className="block text-[7px] font-black text-gray-700 uppercase">Gain par min</label>
              <input
                type="number"
                min={0}
                value={chronoRewardValue}
                onChange={(e) => setChronoRewardValue(parseInt(e.target.value) || 0)}
                className="w-full h-6 border border-black px-1.5 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-1.5 pt-1 border-t border-black/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 border border-black bg-white hover:bg-gray-100 font-bold"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isCalendarLoading}
            className="px-3 py-1 border-2 border-black bg-yellow-400 font-black flex items-center gap-1 hover:bg-yellow-500 disabled:opacity-50 shadow-[1px_1px_0px_#000]"
          >
            {isCalendarLoading ? <Loader2 size={12} className="animate-spin" /> : "✓"} Enregistrer
          </button>
        </div>

      </div>
    </form>
  );
}
