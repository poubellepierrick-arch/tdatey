import React, { useState } from "react";
import { AppDatabase, Task, Habit, Preparation } from "../../types";
import { 
  Sparkles, X, Check, Loader2, Calendar, Target, ShieldAlert, Zap, Layers 
} from "lucide-react";

interface SmartAddViewProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
  onClose: () => void;
  // Callback optionnel pour les toasts de recompense
  triggerToast?: (amount: number, message: string) => void;
}

export default function SmartAddView({ db, updateDb, onClose, triggerToast }: SmartAddViewProps) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buffer de validation inline
  const [parsedResults, setParsedResults] = useState<{
    tasks: Task[];
    habits: Habit[];
    preparations: Preparation[];
    isLocalFallback?: boolean;
  } | null>(null);

  const handleSmartAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setParsedResults(null);

    try {
      const response = await fetch("/api/gemini/smart-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText.trim() })
      });

      if (!response.ok) {
        throw new Error("Le serveur d'intelligence linguistique a renvoyé une erreur.");
      }

      const data = await response.json();

      // Transposer les objets d'extraction brute en objets typés formels de l'application
      const tasks: Task[] = (data.tasks || []).map((t: any, idx: number) => ({
        id: `task-smart-${Date.now()}-${idx}`,
        title: t.title || "Tâche extraite",
        description: t.description || "",
        createdAt: new Date().toISOString(),
        isCompleted: false,
        importance: Number(t.importance ?? 5),
        urgency: Number(t.urgency ?? 5),
        easiness: Number(t.easiness ?? 5),
        mentalLoad: Number(t.mentalLoad ?? 5),
        score: Math.round(Number(t.importance ?? 5) * 1.5 + Number(t.urgency ?? 5) * 1.5 + Number(t.mentalLoad ?? 5) - Number(t.easiness ?? 5)),
        isStarred: !!t.isStarred,
        dueDate: t.dueDate || undefined,
        durationMinutes: Number(t.durationMinutes ?? 30),
        timeSpentSeconds: 0,
        rewardValue: (Number(t.importance ?? 5) + Number(t.urgency ?? 5)) * 2,
        chronoRewardValue: 1,
        dependencies: [],
        preparationIds: [],
        status: "todo",
        tags: Array.isArray(t.tags) ? t.tags : []
      }));

      const habits: Habit[] = (data.habits || []).map((h: any, idx: number) => ({
        id: `habit-smart-${Date.now()}-${idx}`,
        title: h.title || "Habitude extraite",
        description: h.description || "",
        type: h.type || "binary",
        currentValue: 0,
        targetValue: Number(h.targetValue ?? 1),
        unit: h.unit || "fois",
        streak: 0,
        bestStreak: 0,
        jokerDaysLeft: 3,
        daysThresholdAlert: 2,
        history: {},
        rewardValue: Number(h.rewardValue ?? 10),
        isNeglected: false
      }));

      const preparations: Preparation[] = (data.preparations || []).map((p: any, idx: number) => ({
        id: `prep-smart-${Date.now()}-${idx}`,
        title: p.title || "Rituel extrait",
        description: p.description || "",
        type: p.type === "post" ? "post" : "pre",
        durationMinutes: Number(p.durationMinutes ?? 15)
      }));

      setParsedResults({
        tasks,
        habits,
        preparations,
        isLocalFallback: !!data.isLocalFallback
      });

    } catch (err: any) {
      console.error(err);
      setError("Échec de l'analyse. Nous allons utiliser une extraction locale d'urgence.");
    } finally {
      setIsLoading(false);
    }
  };

  // Injecter tous les éléments extraits validés dans la base
  const handleApproveAll = () => {
    if (!parsedResults) return;

    let nextTasks = [...db.tasks];
    if (parsedResults.tasks.length > 0) {
      nextTasks = [...parsedResults.tasks, ...nextTasks];
    }

    let nextHabits = [...db.habits];
    if (parsedResults.habits.length > 0) {
      nextHabits = [...parsedResults.habits, ...nextHabits];
    }

    let nextPreps = [...(db.preparations || [])];
    if (parsedResults.preparations.length > 0) {
      nextPreps = [...parsedResults.preparations, ...nextPreps];
    }

    updateDb({
      ...db,
      tasks: nextTasks,
      habits: nextHabits,
      preparations: nextPreps
    });

    const totalCount = parsedResults.tasks.length + parsedResults.habits.length + parsedResults.preparations.length;
    if (triggerToast) {
      triggerToast(0, `NLP : ${totalCount} éléments insérés avec succès ! 🚀`);
    }

    setParsedResults(null);
    setInputText("");
    onClose();
  };

  // Retirer un élément individuel du buffer avant injection finale
  const handleRemoveTaskFromBuffer = (idx: number) => {
    if (!parsedResults) return;
    const nextTasks = parsedResults.tasks.filter((_, i) => i !== idx);
    setParsedResults({ ...parsedResults, tasks: nextTasks });
  };

  const handleRemoveHabitFromBuffer = (idx: number) => {
    if (!parsedResults) return;
    const nextHabits = parsedResults.habits.filter((_, i) => i !== idx);
    setParsedResults({ ...parsedResults, habits: nextHabits });
  };

  const handleRemovePrepFromBuffer = (idx: number) => {
    if (!parsedResults) return;
    const nextPreps = parsedResults.preparations.filter((_, i) => i !== idx);
    setParsedResults({ ...parsedResults, preparations: nextPreps });
  };

  return (
    <div className="border-4 border-black bg-white p-4 sm:p-5 shadow-[5px_5px_0px_0px_#000] space-y-4 font-mono text-xs text-black animate-fade-in">
      <div className="flex justify-between items-center border-b-2 border-black pb-2 text-purple-950">
        <h3 className="font-mono font-black uppercase text-sm flex items-center gap-1.5">
          <Sparkles className="text-indigo-600 animate-pulse" size={17} />
          Ajout Intelligent Universel (IA NLP)
        </h3>
        <button
          onClick={onClose}
          className="p-1 border border-black hover:bg-gray-100 cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      <p className="font-sans font-bold text-gray-700 leading-normal">
        Saisissez un texte décrivant des tâches, dates, priorités, routines ou habitudes en langage naturel. tod° extrait et structure tout à la volée.
        <span className="block italic text-gray-500 mt-0.5">Exemple : "Préparer rapport urgence 9 importance 8 pour demain. courir 20 min chaque jour."</span>
      </p>

      {error && (
        <div className="bg-amber-55 border-2 border-black p-3 text-amber-950 font-bold flex items-center gap-2">
          <ShieldAlert size={16} />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSmartAnalyze} className="space-y-3">
        <textarea
          required
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Décrivez vos tâches, habitudes ou routines ici de manière informelle..."
          className="w-full border-2 border-black p-3 bg-gray-50 text-xs font-bold leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-black"
        />

        <div className="text-right">
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="bg-black hover:bg-purple-300 hover:text-black text-white font-mono font-black px-4 py-2 border-2 border-black uppercase text-[10px] shadow-[2px_2px_0px_0px_#000] disabled:bg-gray-200 cursor-pointer inline-flex items-center gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={12} />
                Traitement IA...
              </>
            ) : (
              <>
                <Sparkles size={12} />
                Lancer l'Analyse NLP
              </>
            )}
          </button>
        </div>
      </form>

      {/* RÉSULTATS D'EXTRACTION DE L'IA EN ATTENTE D'INJECTION */}
      {parsedResults && (
        <div className="mt-4 bg-[#fffdf5] border-2 border-black p-4 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-black pb-1.5">
            <h4 className="font-black text-xs text-black uppercase flex items-center gap-1">
              👁️ ÉLÉMENTS PRÊTS POUR L'INJECTION ({parsedResults.tasks.length + parsedResults.habits.length + parsedResults.preparations.length})
            </h4>
            {parsedResults.isLocalFallback && (
              <span className="bg-amber-200 font-bold border border-black px-1.5 py-0.5 text-[9px] text-amber-950">
                Mode Hors-Connexion Actif
              </span>
            )}
          </div>

          <p className="font-semibold text-gray-600">Revoir et modifier la liste ci-dessous avant d'injecter dans votre espace de travail :</p>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {/* Tâches extraites */}
            {parsedResults.tasks.length > 0 && (
              <div className="space-y-1.5">
                <p className="font-black text-purple-900 underline uppercase text-[10px] flex items-center gap-1">
                  <Zap size={10} /> Tâches / Échéances détectées :
                </p>
                {parsedResults.tasks.map((task, idx) => (
                  <div key={idx} className="bg-white border border-black p-2 flex justify-between items-center gap-4">
                    <div>
                      <p className="font-bold text-black">{task.title}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-[9px] font-semibold text-gray-500">
                        <span className="bg-yellow-100 border px-1">Imp: {task.importance}</span>
                        <span className="bg-red-100 border px-1">Urg: {task.urgency}</span>
                        <span className="bg-purple-100 border px-1">Durée: {task.durationMinutes} min</span>
                        {task.dueDate && <span className="bg-sky-100 border px-1 flex items-center gap-0.5"><Calendar size={9} /> {task.dueDate}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveTaskFromBuffer(idx)}
                      className="text-red-500 border border-black p-0.5 hover:bg-red-50 cursor-pointer"
                      title="Exclure"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Habitudes extraites */}
            {parsedResults.habits.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="font-black text-emerald-900 underline uppercase text-[10px] flex items-center gap-1">
                  <Target size={10} /> Habitudes quotidiennes détectées :
                </p>
                {parsedResults.habits.map((habit, idx) => (
                  <div key={idx} className="bg-white border border-black p-2 flex justify-between items-center gap-4">
                    <div>
                      <p className="font-bold text-black">{habit.title}</p>
                      <p className="text-[9px] font-semibold text-emerald-600 mt-0.5">🌿 Objectif : {habit.targetValue} {habit.unit} / jour</p>
                    </div>
                    <button
                      onClick={() => handleRemoveHabitFromBuffer(idx)}
                      className="text-red-500 border border-black p-0.5 hover:bg-red-50 cursor-pointer"
                      title="Exclure"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Préparations extraites */}
            {parsedResults.preparations.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="font-black text-blue-900 underline uppercase text-[10px] flex items-center gap-1">
                  <Layers size={10} /> Routines :
                </p>
                {parsedResults.preparations.map((p, idx) => (
                  <div key={idx} className="bg-white border border-black p-2 flex justify-between items-center gap-4">
                    <div>
                      <p className="font-bold text-black">{p.title}</p>
                      <p className="text-[9px] font-semibold text-blue-600 mt-0.5">⏱️ Routine {p.type === "post" ? "après" : "avant"} l'activité ({p.durationMinutes} min)</p>
                    </div>
                    <button
                      onClick={() => handleRemovePrepFromBuffer(idx)}
                      className="text-red-500 border border-black p-0.5 hover:bg-red-50 cursor-pointer"
                      title="Exclure"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2.5 pt-1.5">
            <button
              onClick={handleApproveAll}
              disabled={parsedResults.tasks.length === 0 && parsedResults.habits.length === 0 && parsedResults.preparations.length === 0}
              className="flex-1 bg-green-400 hover:bg-green-500 border-2 border-black py-2.5 text-black font-black uppercase text-xs shadow-[3px_3px_0px_0px_#000] cursor-pointer"
            >
              ✓ Confirmer & Injecter les éléments ({parsedResults.tasks.length + parsedResults.habits.length + parsedResults.preparations.length})
            </button>
            <button
              onClick={() => {
                setParsedResults(null);
                setInputText("");
              }}
              className="bg-white hover:bg-gray-100 border-2 border-black py-2.5 px-3 text-black font-bold uppercase text-[10px] cursor-pointer"
            >
              Vider tout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
