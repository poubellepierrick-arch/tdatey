import React, { useState, useMemo } from "react";
import { AppDatabase, AIAuditResult, AIAppModification } from "../../types";
import { 
  Sparkles, AlertTriangle, Lightbulb, Sliders, Check, RefreshCw, Send, ShieldAlert, ArrowRight, X, Cpu, CheckCircle2
} from "lucide-react";
import { computeCompleteAnalytics } from "../../lib/analyticsEngine";

interface AdvisorViewProps {
  db: AppDatabase;
  updateDb: (fn: (prev: AppDatabase) => AppDatabase) => void;
  onNavigate?: (view: string) => void;
}

export const AdvisorView: React.FC<AdvisorViewProps> = ({ db, updateDb, onNavigate }) => {
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [confirmingModId, setConfirmingModId] = useState<string | null>(null);
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  // Chat interactif
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; source?: string }>>([]);

  // Calcul du résumé des données en temps réel
  const fullStats = useMemo(() => {
    const tasks = db.tasks || [];
    const activeTasks = tasks.filter(t => !t.isCompleted && !t.isArchived);
    const completedTasks = tasks.filter(t => t.isCompleted && !t.isArchived);
    const starredTasks = activeTasks.filter(t => t.isStarred);
    
    const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const overdueTasks = activeTasks.filter(t => {
      const due = t.dueDate || t.deadline;
      return due && due < todayStr;
    });

    const habits = db.habits || [];
    const neglectedHabits = habits.filter(h => {
      if (h.isArchived) return false;
      if (!h.lastCompletedDate) return true;
      const diffDays = Math.floor((new Date(todayStr).getTime() - new Date(h.lastCompletedDate).getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= (h.daysThresholdAlert || 2);
    });

    const healthyHabits = habits.filter(h => !h.isArchived && h.streak > 0);

    const recurring = db.recurringTasks || [];
    const analytics = computeCompleteAnalytics(db);
    const gamingStats = analytics.gaming;
    const timeData = analytics.baseData;

    const sleepLogs = db.sleepWakeLogs || [];
    const recentSleepLogs = sleepLogs.slice(-7);
    const avgSleepDebt = recentSleepLogs.length > 0
      ? recentSleepLogs.reduce((acc, l) => acc + (l.sleepDebtMinutes || 0), 0) / recentSleepLogs.length
      : 0;
    const avgWakeDelay = recentSleepLogs.length > 0
      ? recentSleepLogs.reduce((acc, l) => acc + (l.wakeUpDelayMinutes || 0), 0) / recentSleepLogs.length
      : 0;

    return {
      summaryStats: {
        totalTasks: tasks.length,
        activeTasks: activeTasks.length,
        completedTasks: completedTasks.length,
        overdueTasksCount: overdueTasks.length,
        starredTasksCount: starredTasks.length,
        avgScore: activeTasks.length > 0 ? Math.round(activeTasks.reduce((acc, t) => acc + (t.score || 0), 0) / activeTasks.length) : 0,
        totalWorkHours: timeData.totalWorkHours,
        totalLeisureHours: timeData.totalLeisureHours,
        gamingHours: gamingStats.totalPlayedHours,
        gamingDeficitHours: gamingStats.isDeficit ? Math.abs(gamingStats.remainingHours) : 0,
        activeHabitsCount: habits.filter(h => !h.isArchived).length,
        neglectedHabitsCount: neglectedHabits.length,
        recurringTasksCount: recurring.filter(r => !r.isArchived).length,
        sleepLogsCount: sleepLogs.length,
        avgSleepDebtMinutes: Math.round(avgSleepDebt),
        avgWakeDelayMinutes: Math.round(avgWakeDelay),
        coins: db.userProfile?.coins || 0,
        debt: db.userProfile?.debt || 0,
        targetWakeTime: db.userProfile?.targetWakeTime || "07:00",
        themeStyle: db.userProfile?.themeStyle || "memphis",
        layoutSpacing: db.userProfile?.layoutSpacing || "cozy",
        cardBorderWidth: db.userProfile?.cardBorderWidth ?? 4,
        rewardCalculationRatio: db.userProfile?.rewardCalculationRatio ?? 1.0
      },
      overdueTasks: overdueTasks.slice(0, 8).map(t => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate || t.deadline,
        score: t.score,
        importance: t.importance,
        urgency: t.urgency
      })),
      topPriorityTasks: activeTasks.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5).map(t => ({
        id: t.id,
        title: t.title,
        score: t.score,
        importance: t.importance,
        urgency: t.urgency,
        mentalLoad: t.mentalLoad,
        easiness: t.easiness,
        durationMinutes: t.durationMinutes
      })),
      neglectedHabits: neglectedHabits.slice(0, 6).map(h => {
        const diffDays = h.lastCompletedDate 
          ? Math.floor((new Date(todayStr).getTime() - new Date(h.lastCompletedDate).getTime()) / (1000 * 60 * 60 * 24))
          : 99;
        return {
          id: h.id,
          title: h.title,
          daysInactive: diffDays,
          streak: h.streak,
          type: h.type,
          targetValue: h.targetValue,
          unit: h.unit
        };
      }),
      healthyHabits: healthyHabits.slice(0, 6).map(h => ({
        id: h.id,
        title: h.title,
        streak: h.streak,
        bestStreak: h.bestStreak
      })),
      recentSleepWake: recentSleepLogs.map(l => ({
        date: l.date,
        sleepDebtMinutes: l.sleepDebtMinutes,
        wakeUpDelayMinutes: l.wakeUpDelayMinutes,
        bedTimeDelayMinutes: l.bedTimeDelayMinutes,
        circadianScore: l.circadianScore
      })),
      settings: {
        themeStyle: db.userProfile?.themeStyle || "memphis",
        layoutSpacing: db.userProfile?.layoutSpacing || "cozy",
        targetWakeTime: db.userProfile?.targetWakeTime || "07:00",
        targetSleepTime: db.userProfile?.targetSleepTime || "23:00",
        rewardCalculationRatio: db.userProfile?.rewardCalculationRatio ?? 1.0
      }
    };
  }, [db]);

  // Déclenchement de l'audit complet via Gemini 3.8
  const handleRunAudit = async () => {
    setLoadingAudit(true);
    setAuditError(null);
    try {
      const res = await fetch("/api/gemini/advisor-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullStats)
      });
      if (!res.ok) {
        throw new Error(`Erreur serveur (${res.status})`);
      }
      const data: AIAuditResult = await res.json();
      
      // Sauvegarde dans Firestore pour persistance sans LocalStorage
      updateDb(prev => ({
        ...prev,
        aiAudit: data
      }));
    } catch (err: any) {
      setAuditError(err.message || "Échec de l'analyse");
    } finally {
      setLoadingAudit(false);
    }
  };

  // Application en ligne d'une proposition de modification
  const handleApplyModification = (mod: AIAppModification) => {
    const p = mod.payload || {};
    let feedbackMsg = "Modification appliquée avec succès.";

    updateDb(prev => {
      const next = { ...prev };
      const nextProfile = { ...(next.userProfile || { coins: 0, debt: 0, targetSleepTime: "23:00", targetWakeTime: "07:00", wakeUpRewardSettings: { targetHour: 7, targetMinute: 0, baseReward: 10 } }) };

      if (mod.actionType === "set_layout_spacing" && p.layoutSpacing) {
        nextProfile.layoutSpacing = p.layoutSpacing;
        feedbackMsg = `Espacement défini sur : ${p.layoutSpacing}`;
      } else if (mod.actionType === "set_theme_style" && p.themeStyle) {
        nextProfile.themeStyle = p.themeStyle;
        feedbackMsg = `Thème d'affichage défini sur : ${p.themeStyle}`;
      } else if (mod.actionType === "set_target_wake_time" && p.targetWakeTime) {
        nextProfile.targetWakeTime = p.targetWakeTime;
        feedbackMsg = `Cible de réveil ajustée à : ${p.targetWakeTime}`;
      } else if (mod.actionType === "set_reward_ratio" && p.rewardCalculationRatio) {
        nextProfile.rewardCalculationRatio = Number(p.rewardCalculationRatio);
        feedbackMsg = `Ratio de récompenses ajusté à : ${p.rewardCalculationRatio}x`;
      } else if (mod.actionType === "create_habit") {
        const newHabit = {
          id: `habit-${Date.now()}`,
          title: p.habitTitle || "Habitude conseillée",
          description: mod.reason || "Recommandée par le conseiller IA",
          type: (p.habitType as any) || "binary",
          currentValue: 0,
          targetValue: p.habitTarget || 1,
          unit: p.habitUnit || "fois",
          streak: 0,
          bestStreak: 0,
          jokerDaysLeft: 2,
          daysThresholdAlert: 2,
          history: {},
          rewardValue: p.rewardValue || 15,
          isNeglected: false
        };
        next.habits = [newHabit, ...(next.habits || [])];
        feedbackMsg = `Habitude créée : ${newHabit.title}`;
      } else if (mod.actionType === "create_task") {
        const imp = p.taskImportance ?? 7;
        const urg = p.taskUrgency ?? 6;
        const eas = 6;
        const load = 4;
        const score = (imp * 1.5) + (urg * 1.2) + (eas * 0.5) - (load * 0.5);
        const newTask = {
          id: `task-${Date.now()}`,
          title: p.taskTitle || "Tâche conseillée",
          description: mod.reason || "Recommandée par le conseiller IA",
          createdAt: new Date().toISOString(),
          isCompleted: false,
          importance: imp,
          urgency: urg,
          easiness: eas,
          mentalLoad: load,
          score: Math.round(score * 10) / 10,
          isStarred: true,
          durationMinutes: p.taskDurationMinutes || 30,
          timeSpentSeconds: 0,
          rewardValue: 20,
          chronoRewardValue: 1,
          dependencies: []
        };
        next.tasks = [newTask, ...(next.tasks || [])];
        feedbackMsg = `Tâche prioritaire créée : ${newTask.title}`;
      } else if (mod.actionType === "archive_completed_tasks") {
        const nowIso = new Date().toISOString();
        let count = 0;
        next.tasks = (next.tasks || []).map(t => {
          if (t.isCompleted && !t.isArchived) {
            count++;
            return { ...t, isArchived: true, archivedAt: nowIso };
          }
          return t;
        });
        feedbackMsg = `${count} tâche(s) complétée(s) archivée(s).`;
      } else if (mod.actionType === "adjust_habit_threshold" && p.habitId && p.threshold) {
        next.habits = (next.habits || []).map(h => {
          if (h.id === p.habitId) {
            return { ...h, daysThresholdAlert: p.threshold };
          }
          return h;
        });
        feedbackMsg = `Seuil d'alerte ajusté à ${p.threshold} jours.`;
      }

      next.userProfile = nextProfile;

      // Marquer comme appliqué dans l'audit actuel
      if (next.aiAudit?.appModifications) {
        next.aiAudit = {
          ...next.aiAudit,
          appModifications: next.aiAudit.appModifications.map(m =>
            m.id === mod.id ? { ...m, applied: true } : m
          )
        };
      }

      return next;
    });

    setConfirmingModId(null);
    setAppliedFeedback(feedbackMsg);
    setTimeout(() => setAppliedFeedback(null), 4000);
  };

  // Envoi d'un message au chat de consultation
  const handleSendChatMessage = async (presetText?: string) => {
    const text = presetText || chatInput;
    if (!text.trim() || chatLoading) return;

    const newMsg = { sender: "user" as const, text };
    setChatMessages(prev => [...prev, newMsg]);
    if (!presetText) setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/gemini/advisor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          fullContext: fullStats
        })
      });
      const data = await res.json();
      setChatMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: data.reply || "Aucune réponse.",
          source: data.source
        }
      ]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: "Service temporairement indisponible. Priorisez vos tâches en retard et vos habitudes clés.",
          source: "algorithmic"
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const currentAudit = db.aiAudit;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* BANDEAU EN-TÊTE CONSEILLER IA */}
      <div className="bg-white border-4 border-black p-4 sm:p-5 shadow-[4px_4px_0px_0px_#000]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-400 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                <Sparkles size={18} className="text-black" />
              </span>
              <h1 className="font-mono font-black text-sm sm:text-base uppercase tracking-tight">
                Conseiller IA • Gemini 3.8
              </h1>
              {currentAudit && (
                <span className="border-2 border-black bg-purple-100 text-[9px] font-black uppercase px-2 py-0.5 shadow-[1px_1px_0px_0px_#000]">
                  {currentAudit.modelUsed || "Gemini 3.8 Flash"}
                </span>
              )}
            </div>
            <p className="font-mono text-[11px] text-gray-600 leading-snug">
              Audit holistique de vos données : tâches, habitudes, sommeil, rythme et suggestions directes d'adaptation.
            </p>
          </div>

          <button
            onClick={handleRunAudit}
            disabled={loadingAudit}
            className="w-full sm:w-auto border-2 border-black bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-200 text-black px-4 py-2 font-mono font-black text-xs uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <RefreshCw size={14} className={loadingAudit ? "animate-spin" : ""} />
            <span>{loadingAudit ? "ANALYSE EN COURS..." : "LANCER L'AUDIT COMPLET"}</span>
          </button>
        </div>

        {/* FEEDBACK INLINE MODIFICATION APPLIQUÉE */}
        {appliedFeedback && (
          <div className="mt-3 border-2 border-black bg-emerald-300 text-emerald-950 p-2 font-mono font-black text-[11px] flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
            <CheckCircle2 size={14} />
            <span>{appliedFeedback}</span>
          </div>
        )}

        {auditError && (
          <div className="mt-3 border-2 border-black bg-rose-300 text-black p-2 font-mono font-black text-[11px] flex items-center justify-between shadow-[2px_2px_0px_0px_#000]">
            <span>⚠️ {auditError}</span>
            <button onClick={() => setAuditError(null)} className="cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* SYNTHÈSE / BILAN CONDENSÉ */}
      {currentAudit && (
        <div className="bg-amber-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-mono font-black text-[10px] uppercase tracking-wider text-gray-700">
              SYNTHÈSE DU CONSEILLER
            </span>
            <span className="font-mono text-[9px] text-gray-500">
              {new Date(currentAudit.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p className="font-mono font-black text-xs sm:text-sm text-black leading-snug">
            {currentAudit.summary}
          </p>
        </div>
      )}

      {/* GRILLE : CONSEILS & MISES EN GARDE */}
      {currentAudit && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* COLONNE GAUCHE : CONSEILS D'ACTION */}
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2">
              <Lightbulb size={16} className="text-black" />
              <h2 className="font-mono font-black text-xs uppercase">
                Conseils & Aides Concrètes
              </h2>
            </div>

            <div className="space-y-2.5">
              {currentAudit.helpAndAdvice.map(adv => (
                <div key={adv.id} className="border-2 border-black bg-[#faf8f4] p-3 shadow-[2px_2px_0px_0px_#000] space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-black text-xs text-black">
                      {adv.title}
                    </span>
                    <span className="border border-black bg-yellow-200 text-[8px] font-mono font-black uppercase px-1.5 py-0.5">
                      {adv.category}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-gray-800 leading-normal">
                    {adv.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* COLONNE DROITE : MISES EN GARDE */}
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2">
              <ShieldAlert size={16} className="text-black" />
              <h2 className="font-mono font-black text-xs uppercase">
                Mises en Garde & Alertes
              </h2>
            </div>

            <div className="space-y-2.5">
              {currentAudit.warnings.map(warn => (
                <div 
                  key={warn.id} 
                  className={`border-2 border-black p-3 shadow-[2px_2px_0px_0px_#000] space-y-1 ${
                    warn.level === "high" ? "bg-rose-100" :
                    warn.level === "medium" ? "bg-amber-100" : "bg-sky-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={13} className="text-black flex-shrink-0" />
                      <span className="font-mono font-black text-xs text-black">
                        {warn.title}
                      </span>
                    </div>
                    <span className={`border border-black text-[8px] font-mono font-black uppercase px-1.5 py-0.5 ${
                      warn.level === "high" ? "bg-rose-400 text-white" :
                      warn.level === "medium" ? "bg-amber-400 text-black" : "bg-sky-400 text-black"
                    }`}>
                      {warn.level === "high" ? "Critique" : warn.level === "medium" ? "Vigilance" : "Info"}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-gray-800 leading-normal">
                    {warn.detail}
                  </p>
                  {warn.actionPrompt && (
                    <div className="pt-1 text-[10px] font-mono font-black text-black flex items-center gap-1">
                      <ArrowRight size={11} />
                      <span>{warn.actionPrompt}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION MAJEURE : PROPOSITIONS DE MODIFICATION DE L'APPLICATION */}
      {currentAudit && (
        <div className="bg-white border-4 border-black p-4 sm:p-5 shadow-[4px_4px_0px_0px_#000] space-y-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-black" />
              <h2 className="font-mono font-black text-xs sm:text-sm uppercase">
                Ajustements Proposés de l'Application
              </h2>
            </div>
            <span className="text-[9px] font-mono font-black uppercase text-gray-500">
              Actionnable en 1 clic
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {currentAudit.appModifications.map(mod => {
              const isConfirming = confirmingModId === mod.id;
              const isApplied = !!mod.applied;

              return (
                <div 
                  key={mod.id}
                  className={`border-2 border-black p-3.5 shadow-[2px_2px_0px_0px_#000] flex flex-col justify-between gap-3 ${
                    isApplied ? "bg-emerald-50 border-emerald-900" : "bg-purple-50"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-mono font-black text-xs text-black">
                        {mod.title}
                      </h3>
                      {isApplied && (
                        <span className="border border-black bg-emerald-300 text-[8px] font-mono font-black uppercase px-1.5 py-0.5 whitespace-nowrap">
                          Appliqué ✓
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[10.5px] text-gray-700 leading-normal">
                      {mod.reason}
                    </p>
                  </div>

                  {/* CONTRÔLE D'APPLICATION EN LIGNE (ZÉRO POPUP) */}
                  {!isApplied ? (
                    <div>
                      {!isConfirming ? (
                        <button
                          onClick={() => setConfirmingModId(mod.id)}
                          className="w-full border-2 border-black bg-purple-300 hover:bg-purple-400 text-black py-1.5 px-3 font-mono font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>Appliquer cet ajustement</span>
                          <ArrowRight size={11} />
                        </button>
                      ) : (
                        <div className="border-2 border-black bg-yellow-200 p-2 space-y-1.5 shadow-[2px_2px_0px_0px_#000]">
                          <span className="font-mono font-black text-[9.5px] uppercase block text-center">
                            Confirmer la modification ?
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApplyModification(mod)}
                              className="flex-1 border-2 border-black bg-black text-white py-1 font-mono font-black text-[9.5px] uppercase cursor-pointer hover:bg-gray-800"
                            >
                              Oui, appliquer
                            </button>
                            <button
                              onClick={() => setConfirmingModId(null)}
                              className="flex-1 border-2 border-black bg-white text-black py-1 font-mono font-black text-[9.5px] uppercase cursor-pointer hover:bg-gray-100"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="font-mono text-[9px] text-emerald-800 font-black flex items-center gap-1">
                      <Check size={11} />
                      <span>Paramètre actif dans l'application</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DIALOGUE INTERACTIF AVEC GEMINI 3.8 */}
      <div className="bg-white border-4 border-black p-4 sm:p-5 shadow-[4px_4px_0px_0px_#000] space-y-3">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-black" />
            <h2 className="font-mono font-black text-xs sm:text-sm uppercase">
              Interroger le Conseiller IA (Gemini 3.8)
            </h2>
          </div>
          <span className="text-[9px] font-mono font-black uppercase text-gray-500">
            Contexte global synchronisé
          </span>
        </div>

        {/* QUESTIONS RAPIDES */}
        <div className="flex flex-wrap gap-1.5">
          {[
            "Que faire en priorité aujourd'hui ?",
            "Comment optimiser mon sommeil et mon réveil ?",
            "Mes habitudes sont-elles équilibrées ?"
          ].map(q => (
            <button
              key={q}
              onClick={() => handleSendChatMessage(q)}
              disabled={chatLoading}
              className="border border-black bg-gray-100 hover:bg-yellow-200 text-black px-2.5 py-1 font-mono text-[9.5px] font-black cursor-pointer shadow-[1px_1px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
            >
              {q}
            </button>
          ))}
        </div>

        {/* HISTORIQUE DE DISCUSSION */}
        {chatMessages.length > 0 && (
          <div className="border-2 border-black bg-[#faf8f4] p-3 space-y-2.5 max-h-80 overflow-y-auto no-scrollbar shadow-[2px_2px_0px_0px_#000]">
            {chatMessages.map((m, idx) => (
              <div 
                key={idx} 
                className={`p-2.5 border-2 border-black font-mono text-[11px] leading-relaxed shadow-[2px_2px_0px_0px_#000] ${
                  m.sender === "user" 
                    ? "bg-yellow-200 text-black ml-4" 
                    : "bg-white text-black mr-4"
                }`}
              >
                <div className="flex items-center justify-between text-[8px] font-black uppercase text-gray-600 mb-1">
                  <span>{m.sender === "user" ? "Vous" : "Conseiller IA (Gemini 3.8)"}</span>
                  {m.source && <span>[{m.source}]</span>}
                </div>
                <p className="whitespace-pre-line">{m.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* CHAMP DE SAISIE */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendChatMessage();
              }
            }}
            placeholder="Posez une question sur votre rythme, vos tâches ou votre organisation..."
            className="flex-1 border-2 border-black p-2 font-mono text-xs focus:bg-yellow-50 outline-none shadow-[2px_2px_0px_0px_#000]"
          />
          <button
            onClick={() => handleSendChatMessage()}
            disabled={!chatInput.trim() || chatLoading}
            className="border-2 border-black bg-purple-400 hover:bg-purple-500 disabled:bg-gray-200 text-black px-4 py-2 font-mono font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Send size={13} className={chatLoading ? "animate-pulse" : ""} />
            <span>{chatLoading ? "..." : "ENVOYER"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvisorView;
