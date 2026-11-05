import React, { useState, useEffect } from "react";
import { AppDatabase, Reward } from "../../types";
import { DEFAULT_REWARDS } from "../../lib/state";
import { isRewardGame } from "../../lib/legacyGamingData";
import { Trophy, Trash2, Play, Square, Edit, Plus, X, Coins, Clock, Check, AlertCircle, RotateCcw, Target } from "lucide-react";
import { IconPicker } from "./IconPicker";

interface RewardsViewProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
  activeTimer: { type: "task" | "habit" | "preparation" | "leisure"; id: string; startTime: number } | null;
  onStartTimer: (type: "leisure", id: string) => void;
  onStopTimer: () => void;
}

export default function RewardsView({ db, updateDb, activeTimer, onStartTimer, onStopTimer }: RewardsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [costCoins, setCostCoins] = useState(30);
  const [type, setType] = useState<"redeemable" | "leisure">("redeemable");
  const [icon, setIcon] = useState("🎁");
  const [isGame, setIsGame] = useState(false);

  // Remboursement
  const [repayAmount, setRepayAmount] = useState<string>("");
  const [repayMessage, setRepayMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Saisie manuelle de temps & logs
  const getTodayStr = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
  const [manualMinutesMap, setManualMinutesMap] = useState<Record<string, string>>({});
  const [manualDateMap, setManualDateMap] = useState<Record<string, string>>({});
  const [showManualInputRewardId, setShowManualInputRewardId] = useState<string | null>(null);
  const [showLogsRewardId, setShowLogsRewardId] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<{ rewardId: string; logId: string; durationStr: string; dateStr: string } | null>(null);

  // Notifications inline
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);

  // Chrono local
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const isLeisureTimerActive = activeTimer?.type === "leisure";

  const coins = db.userProfile?.coins || 0;
  const debt = db.userProfile?.debt || 0;

  // Restauration manuelle des éléments par défaut
  const handleRestoreDefaults = () => {
    updateDb({ ...db, rewards: DEFAULT_REWARDS });
    showNotice("Récompenses par défaut restaurées.");
  };

  // Timer tick
  useEffect(() => {
    let interval: any;
    if (isLeisureTimerActive && activeTimer) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeTimer.startTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isLeisureTimerActive, activeTimer]);

  const showNotice = (msg: string) => {
    setInlineNotice(msg);
    setTimeout(() => setInlineNotice(null), 4000);
  };

  // Form submit
  const handleSubmitReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const rewardsList = db.rewards || [];
    let updatedRewards: Reward[];

    if (editingRewardId) {
      updatedRewards = rewardsList.map(r => r.id === editingRewardId ? {
        ...r,
        title: title.trim(),
        description: description.trim(),
        costCoins: Math.max(1, Number(costCoins)),
        type,
        icon: icon.trim() || "🎁",
        isGame: type === "leisure" ? isGame : false
      } : r);
      setEditingRewardId(null);
    } else {
      const newReward: Reward = {
        id: `rew-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        costCoins: Math.max(1, Number(costCoins)),
        isPurchased: false,
        purchaseHistory: [],
        type,
        icon: icon.trim() || "🎁",
        isGame: type === "leisure" ? isGame : false
      };
      updatedRewards = [newReward, ...rewardsList];
    }

    updateDb({ ...db, rewards: updatedRewards });

    setTitle("");
    setDescription("");
    setCostCoins(30);
    setType("redeemable");
    setIcon("🎁");
    setIsGame(false);
    setShowAddForm(false);
    showNotice(editingRewardId ? "Récompense modifiée." : "Récompense ajoutée.");
  };

  const handleStartEdit = (reward: Reward) => {
    setEditingRewardId(reward.id);
    setTitle(reward.title);
    setDescription(reward.description || "");
    setCostCoins(reward.costCoins);
    setType(reward.type || "redeemable");
    setIcon(typeof reward.icon === "string" ? reward.icon : "🎁");
    setIsGame(isRewardGame(reward));
    setShowAddForm(true);
    setTimeout(() => {
      document.getElementById("reward-form-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleToggleIsGame = (reward: Reward) => {
    const currentStatus = isRewardGame(reward);
    const nextVal = !currentStatus;
    const updatedRewards = (db.rewards || []).map(r =>
      r.id === reward.id ? { ...r, isGame: nextVal } : r
    );
    if (editingRewardId === reward.id) {
      setIsGame(nextVal);
    }
    updateDb({ ...db, rewards: updatedRewards });
    showNotice(nextVal ? `Badge "${reward.title}" : 🎮 Jeu (inclus dans stats jeux).` : `Badge "${reward.title}" : 📺 Autre (exclu des stats jeux).`);
  };

  const handleDeleteReward = (rewardId: string) => {
    if (confirmDeleteId !== rewardId) {
      setConfirmDeleteId(rewardId);
      return;
    }
    const updatedRewards = (db.rewards || []).filter(r => r.id !== rewardId);
    updateDb({ ...db, rewards: updatedRewards });
    setConfirmDeleteId(null);
    showNotice("Récompense supprimée.");
  };

  const handleBuyReward = (reward: Reward) => {
    if (coins < reward.costCoins) return;

    const newCoins = coins - reward.costCoins;
    const now = new Date().toISOString();

    const updatedRewards = (db.rewards || []).map(r => {
      if (r.id === reward.id) {
        return {
          ...r,
          isPurchased: true,
          purchaseHistory: [...(r.purchaseHistory || []), { date: now, cost: reward.costCoins }]
        };
      }
      return r;
    });

    updateDb({
      ...db,
      userProfile: { ...db.userProfile, coins: newCoins },
      rewards: updatedRewards
    });

    showNotice(`Acheté : ${reward.title} (-${reward.costCoins} CS)`);
  };

  const handleSetTargetReward = (rewardId: string | null) => {
    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        targetRewardId: rewardId || undefined
      }
    });

    if (rewardId) {
      const target = (db.rewards || []).find(r => r.id === rewardId);
      showNotice(`Objectif cible défini : "${target?.title || 'Récompense'}"`);
    } else {
      showNotice("Objectif cible retiré.");
    }
  };

  const handleRepayDebt = (e: React.FormEvent) => {
    e.preventDefault();
    setRepayMessage(null);

    const amount = parseInt(repayAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setRepayMessage({ text: "Montant invalide.", isError: true });
      return;
    }
    if (amount > coins) {
      setRepayMessage({ text: `Solde insuffisant (${coins} CS).`, isError: true });
      return;
    }
    if (amount > debt) {
      setRepayMessage({ text: `Dette maximale : ${debt} CS.`, isError: true });
      return;
    }

    const newCoins = coins - amount;
    const newDebt = debt - amount;

    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        coins: newCoins,
        debt: newDebt
      }
    });

    setRepayAmount("");
    setRepayMessage({ text: `Dette réglée (-${amount} CS).`, isError: false });
    setTimeout(() => setRepayMessage(null), 3000);
  };

  const handleStartLeisure = (rewardId: string) => {
    if (isLeisureTimerActive) return;
    onStartTimer("leisure", rewardId);
    showNotice("Chrono loisir démarré.");
  };

  const handleStopLeisure = (reward: Reward) => {
    if (!isLeisureTimerActive || activeTimer?.id !== reward.id) return;

    const elapsedSecondsTotal = Math.floor((Date.now() - activeTimer.startTime) / 1000);
    const minutesUsed = Math.max(1, Math.round(elapsedSecondsTotal / 60));
    const totalCost = minutesUsed * reward.costCoins;

    let newCoins = coins;
    let newDebt = debt;

    if (coins >= totalCost) {
      newCoins = coins - totalCost;
    } else {
      const remainingCost = totalCost - coins;
      newCoins = 0;
      newDebt = debt + remainingCost;
    }

    const now = new Date().toISOString();
    const updatedRewards = (db.rewards || []).map(r => {
      if (r.id === reward.id) {
        return {
          ...r,
          timeLog: [...(r.timeLog || []), { id: `log-${Date.now()}`, date: now.split("T")[0], duration: minutesUsed }]
        };
      }
      return r;
    });

    onStopTimer();

    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        coins: newCoins,
        debt: newDebt
      },
      rewards: updatedRewards
    });

    showNotice(`Session terminée : ${minutesUsed} min (${totalCost} CS).`);
  };

  // Saisie manuelle directe de temps sur un loisir (pour aujourd'hui ou un autre jour)
  const handleAddManualTime = (reward: Reward, minutesToAdd: number, targetDate?: string) => {
    if (isNaN(minutesToAdd) || minutesToAdd === 0) return;

    const totalCost = Math.round(minutesToAdd * reward.costCoins);
    let newCoins = coins;
    let newDebt = debt;

    if (minutesToAdd > 0) {
      if (coins >= totalCost) {
        newCoins = coins - totalCost;
      } else {
        const remainingCost = totalCost - coins;
        newCoins = 0;
        newDebt = debt + remainingCost;
      }
    } else {
      const refundAmount = Math.abs(totalCost);
      if (debt > 0) {
        const repay = Math.min(debt, refundAmount);
        newDebt = debt - repay;
        const remainder = refundAmount - repay;
        newCoins = coins + remainder;
      } else {
        newCoins = coins + refundAmount;
      }
    }

    const selectedDate = targetDate && targetDate.trim() ? targetDate.trim() : getTodayStr();
    const updatedRewards = (db.rewards || []).map((r) => {
      if (r.id === reward.id) {
        return {
          ...r,
          timeLog: [
            ...(r.timeLog || []),
            { id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, date: selectedDate, duration: minutesToAdd }
          ]
        };
      }
      return r;
    });

    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        coins: newCoins,
        debt: newDebt
      },
      rewards: updatedRewards
    });

    setShowManualInputRewardId(null);
    setManualMinutesMap((prev) => ({ ...prev, [reward.id]: "" }));
    if (minutesToAdd > 0) {
      showNotice(`Saisie enregistrée (${selectedDate}) : +${minutesToAdd} min (-${totalCost} CS).`);
    } else {
      showNotice(`Saisie enregistrée (${selectedDate}) : ${minutesToAdd} min (+${Math.abs(totalCost)} CS remboursés).`);
    }
  };

  // Modification d'une session de loisir existante (durée et date)
  const handleUpdateLogEntry = (reward: Reward, logId: string, newDuration: number, newDate?: string) => {
    if (isNaN(newDuration) || newDuration < 0) return;

    const existingLog = (reward.timeLog || []).find((l) => l.id === logId);
    if (!existingLog) return;

    const oldDuration = existingLog.duration || 0;
    const deltaMinutes = newDuration - oldDuration;
    const costDelta = Math.round(deltaMinutes * reward.costCoins);

    let newCoins = coins;
    let newDebt = debt;

    if (costDelta > 0) {
      if (coins >= costDelta) {
        newCoins = coins - costDelta;
      } else {
        const remainingCost = costDelta - coins;
        newCoins = 0;
        newDebt = debt + remainingCost;
      }
    } else if (costDelta < 0) {
      const refundAmount = Math.abs(costDelta);
      if (debt > 0) {
        const repay = Math.min(debt, refundAmount);
        newDebt = debt - repay;
        const remainder = refundAmount - repay;
        newCoins = coins + remainder;
      } else {
        newCoins = coins + refundAmount;
      }
    }

    const finalDate = newDate && newDate.trim() ? newDate.trim() : existingLog.date;

    const updatedRewards = (db.rewards || []).map((r) => {
      if (r.id === reward.id) {
        const newLogs = (r.timeLog || [])
          .map((l) => (l.id === logId ? { ...l, duration: newDuration, date: finalDate } : l))
          .filter((l) => l.duration > 0);
        return { ...r, timeLog: newLogs };
      }
      return r;
    });

    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        coins: newCoins,
        debt: newDebt
      },
      rewards: updatedRewards
    });

    setEditingLog(null);
    showNotice(`Session modifiée (${finalDate}, ${newDuration} min).`);
  };

  // Suppression d'un log de session de loisir
  const handleDeleteLogEntry = (reward: Reward, logId: string) => {
    const existingLog = (reward.timeLog || []).find((l) => l.id === logId);
    if (!existingLog) return;

    const refundAmount = Math.round((existingLog.duration || 0) * reward.costCoins);

    let newCoins = coins;
    let newDebt = debt;

    if (refundAmount > 0) {
      if (debt > 0) {
        const repay = Math.min(debt, refundAmount);
        newDebt = debt - repay;
        const remainder = refundAmount - repay;
        newCoins = coins + remainder;
      } else {
        newCoins = coins + refundAmount;
      }
    }

    const updatedRewards = (db.rewards || []).map((r) => {
      if (r.id === reward.id) {
        return {
          ...r,
          timeLog: (r.timeLog || []).filter((l) => l.id !== logId)
        };
      }
      return r;
    });

    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        coins: newCoins,
        debt: newDebt
      },
      rewards: updatedRewards
    });

    showNotice("Session supprimée.");
  };

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, "0");
    const s = (totalSecs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const redeemableList = (db.rewards || []).filter(r => r.type === "redeemable" || !r.type);
  const leisureList = (db.rewards || []).filter(r => r.type === "leisure");
  const targetReward = (db.rewards || []).find(r => r.id === db.userProfile?.targetRewardId);

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* En-tête minimaliste */}
      <div className="border-4 border-black bg-yellow-300 p-3 shadow-[4px_4px_0px_0px_#000] flex justify-between items-center">
        <div>
          <h2 className="font-black text-sm uppercase text-black">🪙 BOUTIQUE DES RÉCOMPENSES</h2>
          <p className="text-[10px] text-black font-bold">Échangez vos CS gagnez en travaillant.</p>
        </div>
        <div className="flex gap-2">
          {(db.rewards || []).length === 0 && (
            <button
              onClick={handleRestoreDefaults}
              className="bg-white text-black hover:bg-gray-100 border-2 border-black px-2.5 py-1 font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer flex items-center gap-1"
            >
              <RotateCcw size={12} /> Restaurer Défauts
            </button>
          )}
          <button
            onClick={() => {
              setEditingRewardId(null);
              setTitle("");
              setDescription("");
              setCostCoins(30);
              setType("redeemable");
              setIcon("🎁");
              setShowAddForm(!showAddForm);
            }}
            className="bg-black text-white hover:bg-gray-800 border-2 border-black px-2.5 py-1 font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer"
          >
            {showAddForm ? "❌ Fermer" : "➕ Créer"}
          </button>
        </div>
      </div>

      {inlineNotice && (
        <div className="border-2 border-black bg-emerald-300 p-2 font-black text-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5">
          <Check size={14} />
          <span>{inlineNotice}</span>
        </div>
      )}

      {/* Grid Portefeuille & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Carte Solde */}
        <div className="border-4 border-black bg-white p-3 shadow-[4px_4px_0px_0px_#000] space-y-2">
          <div className="flex justify-between items-center border-b-2 border-black pb-1.5">
            <span className="font-black uppercase">Solde</span>
            <Coins size={16} className="text-yellow-500" />
          </div>
          <p className="text-2xl font-black text-yellow-600">{coins} CS</p>
        </div>

        {/* Carte Dette & Remboursement */}
        <div className="border-4 border-black bg-white p-3 shadow-[4px_4px_0px_0px_#000] space-y-2 md:col-span-2">
          <div className="flex justify-between items-center border-b-2 border-black pb-1.5">
            <span className="font-black uppercase">Dette Loisir</span>
            <span className={`font-black ${debt > 0 ? "text-red-600" : "text-gray-400"}`}>{debt} CS</span>
          </div>

          {debt > 0 ? (
            <form onSubmit={handleRepayDebt} className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                max={Math.min(coins, debt)}
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder="Montant CS"
                className="border-2 border-black p-1 text-xs font-bold w-28 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-black text-white hover:bg-green-400 hover:text-black border-2 border-black px-3 py-1 font-black uppercase shadow-[1px_1px_0px_0px_#000] cursor-pointer"
              >
                Rembourser
              </button>
              {repayMessage && (
                <span className={`text-[10px] font-bold ${repayMessage.isError ? "text-red-600" : "text-green-600"}`}>
                  {repayMessage.text}
                </span>
              )}
            </form>
          ) : (
            <p className="text-[10px] text-gray-500 font-bold">Aucune dette en cours.</p>
          )}
        </div>
      </div>

      {/* OBJECTIF / RÉCOMPENSE CIBLE */}
      {targetReward && (
        <div className="border-4 border-black bg-amber-50 p-3.5 shadow-[4px_4px_0px_0px_#000] space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-600 stroke-[2.5]" />
              <div>
                <span className="font-black text-xs uppercase tracking-tight text-black flex items-center gap-1.5">
                  <span>Objectif Cible :</span>
                  <span>{typeof targetReward.icon === "string" ? targetReward.icon : "🎁"}</span>
                  <span>{targetReward.title}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {coins >= targetReward.costCoins && targetReward.type !== "leisure" && (
                <button
                  onClick={() => handleBuyReward(targetReward)}
                  className="border-2 border-black bg-emerald-400 hover:bg-emerald-500 px-2.5 py-1 font-mono font-black text-[10px] uppercase cursor-pointer shadow-[1px_1px_0px_#000]"
                >
                  Débloquer maintenant
                </button>
              )}
              <button
                onClick={() => handleSetTargetReward(null)}
                className="border border-black bg-white hover:bg-gray-100 px-2 py-0.5 font-mono text-[9px] font-bold uppercase cursor-pointer"
              >
                Retirer la cible
              </button>
            </div>
          </div>

          {/* Jauge textuelle sobre */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px] font-mono font-black text-black">
              <span>« {coins}/{targetReward.costCoins} CS atteints »</span>
              <span className={coins >= targetReward.costCoins ? "text-emerald-700" : "text-amber-800"}>
                {Math.min(100, Math.round((coins / targetReward.costCoins) * 100))}%
              </span>
            </div>
            <div className="w-full bg-white border-2 border-black h-3.5 overflow-hidden">
              <div
                className={`h-full border-r border-black transition-all duration-300 ${
                  coins >= targetReward.costCoins ? "bg-emerald-400" : "bg-amber-400"
                }`}
                style={{ width: `${Math.min(100, Math.round((coins / targetReward.costCoins) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de création / édition inline */}
      {showAddForm && (
        <div id="reward-form-container" className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] space-y-4 scroll-mt-4">
          <div className="flex justify-between items-center border-b-2 border-black pb-2">
            <h3 className="font-black uppercase text-sm">
              {editingRewardId ? "✏️ Modifier la Récompense" : "🚀 Nouvelle Récompense"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingRewardId(null);
              }}
              className="p-1 hover:bg-black hover:text-white border border-black transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <form onSubmit={handleSubmitReward} className="space-y-4">
            {/* Ligne : Icône + Titre */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Illustration / Icône</label>
                <button
                  type="button"
                  onClick={() => setIsIconPickerOpen(true)}
                  className="h-10 w-12 border-2 border-black bg-yellow-100 text-xl font-bold flex items-center justify-center hover:bg-yellow-200 cursor-pointer shadow-[2px_2px_0px_0px_#000]"
                  title="Choisir une icône"
                >
                  {icon || "🎁"}
                </button>
              </div>

              <div className="flex-1">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Titre de la récompense *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Soirée cinéma, Jeux vidéo, Pause café..."
                  className="w-full h-10 border-2 border-black px-3 py-1 font-bold bg-white shadow-[2px_2px_0px_0px_#000] focus:outline-none"
                />
              </div>
            </div>

            {/* Type de Récompense (Onglets Memphis) */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Type de récompense</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("redeemable")}
                  className={`py-2 px-2 text-center font-black border-2 border-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-transform ${
                    type === "redeemable" ? "bg-yellow-400 text-black shadow-none translate-x-0.5 translate-y-0.5" : "bg-yellow-50 hover:bg-yellow-100"
                  }`}
                >
                  🎁 Achat Forfaitaire
                </button>
                <button
                  type="button"
                  onClick={() => setType("leisure")}
                  className={`py-2 px-2 text-center font-black border-2 border-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-transform ${
                    type === "leisure" ? "bg-sky-400 text-black shadow-none translate-x-0.5 translate-y-0.5" : "bg-sky-50 hover:bg-sky-100"
                  }`}
                >
                  📺 Loisir Chronométré
                </button>
              </div>
            </div>

            {/* Badge & Statut Jeu Vidéo (si Loisir Chronométré) */}
            {type === "leisure" && (
              <div className="border-2 border-black bg-purple-50 p-3 shadow-[2px_2px_0px_0px_#000] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="block text-[10px] font-black text-gray-800 uppercase tracking-wider">
                      Badge & Catégorie
                    </label>
                    <p className="text-[10px] text-gray-600 font-bold">
                      {isGame
                        ? "Badge actif : 🎮 Jeu (inclus dans l'onglet 'archive jeux')"
                        : "Badge actif : 📺 Autre (exclu des statistiques de jeux)"}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 border border-black text-xs font-black uppercase shadow-[1px_1px_0px_#000] ${
                    isGame ? "bg-purple-300 text-black" : "bg-gray-100 text-gray-600"
                  }`}>
                    {isGame ? "🎮 Jeu" : "📺 Autre"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsGame(true)}
                    className={`py-2 px-2 font-black text-xs uppercase border-2 border-black cursor-pointer flex items-center justify-center gap-1.5 transition-transform ${
                      isGame
                        ? "bg-purple-400 text-black shadow-none translate-x-0.5 translate-y-0.5"
                        : "bg-white hover:bg-purple-100 text-gray-700 shadow-[2px_2px_0px_#000]"
                    }`}
                  >
                    <span>🎮</span> Badge "Jeu"
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGame(false)}
                    className={`py-2 px-2 font-black text-xs uppercase border-2 border-black cursor-pointer flex items-center justify-center gap-1.5 transition-transform ${
                      !isGame
                        ? "bg-gray-300 text-black shadow-none translate-x-0.5 translate-y-0.5"
                        : "bg-white hover:bg-gray-100 text-gray-700 shadow-[2px_2px_0px_#000]"
                    }`}
                  >
                    <span>📺</span> Badge "Autre"
                  </button>
                </div>
              </div>
            )}

            {/* Coût et Description */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
                  {type === "redeemable" ? "Coût fixe (CS) *" : "Coût par minute (CS/min) *"}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={costCoins}
                  onChange={(e) => setCostCoins(Number(e.target.value))}
                  className="w-full h-9 border-2 border-black px-2 font-black bg-white shadow-[2px_2px_0px_0px_#000] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Description (optionnelle)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Indications ou notes complémentaires..."
                  className="w-full h-9 border-2 border-black px-2 bg-white text-xs shadow-[2px_2px_0px_0px_#000] focus:outline-none"
                />
              </div>
            </div>

            {/* Boutons d'Action */}
            <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingRewardId(null);
                }}
                className="bg-white hover:bg-gray-100 text-black border-2 border-black font-black uppercase text-xs px-4 py-2 cursor-pointer shadow-[2px_2px_0px_0px_#000]"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-black text-white hover:bg-yellow-400 hover:text-black border-2 border-black font-black uppercase text-xs px-5 py-2 cursor-pointer shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                {editingRewardId ? "Enregistrer" : "Créer la Récompense"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pop-up Sélecteur d'icônes complet */}
      {isIconPickerOpen && (
        <IconPicker
          onSelect={(selectedIcon) => {
            setIcon(selectedIcon);
            setIsIconPickerOpen(false);
          }}
          onClose={() => setIsIconPickerOpen(false)}
        />
      )}

      {/* Section 1 : Loisirs Chronométrés */}
      <div className="border-4 border-black bg-white p-3 shadow-[4px_4px_0px_0px_#000] space-y-3">
        <h3 className="font-black border-b-2 border-black pb-1 uppercase flex justify-between items-center">
          <span>📺 Loisirs Chronométrés</span>
          <span className="text-[10px] text-gray-500 font-normal">Facturé par minute</span>
        </h3>

        {leisureList.length === 0 ? (
          <p className="text-gray-400 italic py-2">Aucun loisir disponible.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {leisureList.map((reward) => {
              const isCurrentActive = isLeisureTimerActive && activeTimer?.id === reward.id;
              const totalMinutes = (reward.timeLog || []).reduce((sum, l) => sum + (l.duration || 0), 0);
              const logsCount = (reward.timeLog || []).length;
              const isManualOpen = showManualInputRewardId === reward.id;
              const isLogsOpen = showLogsRewardId === reward.id;

              return (
                <div
                  key={reward.id}
                  className={`border-2 border-black p-2.5 bg-white space-y-2.5 shadow-[2px_2px_0px_0px_#000] flex flex-col justify-between ${
                    isCurrentActive ? "bg-amber-100 border-amber-500" : ""
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-xl">{typeof reward.icon === "string" ? reward.icon : "📺"}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleIsGame(reward)}
                          className={`border border-black px-1.5 py-0.5 text-[9px] font-black uppercase cursor-pointer shadow-[1px_1px_0px_0px_#000] flex items-center gap-0.5 transition-colors ${
                            isRewardGame(reward)
                              ? "bg-purple-300 hover:bg-purple-400 text-black"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-500"
                          }`}
                          title={isRewardGame(reward) ? "Badge : Jeu vidéo (inclus dans stats jeux) - Cliquer pour changer" : "Badge : Autre loisir (exclu des stats jeux) - Cliquer pour changer"}
                        >
                          {isRewardGame(reward) ? "🎮 Jeu" : "📺 Autre"}
                        </button>
                        <span className="bg-sky-100 border border-black px-1 text-[10px] font-bold">
                          {reward.costCoins} CS/min
                        </span>
                        {totalMinutes > 0 && (
                          <span className="bg-amber-100 border border-black px-1 text-[10px] font-bold text-amber-900">
                            ⏱️ {totalMinutes} min
                          </span>
                        )}
                      </div>
                    </div>
                    <h4 className="font-black text-black leading-tight">{reward.title}</h4>
                    {reward.description && <p className="text-gray-600 text-[10px]">{reward.description}</p>}
                  </div>

                  {/* Boutons d'action pour le temps */}
                  <div className="pt-2 border-t border-dashed border-gray-300 space-y-2">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      {isCurrentActive ? (
                        <div className="flex items-center gap-2">
                          <span className="font-black text-amber-700 animate-pulse">
                            ⏱️ {formatTime(elapsedSeconds)}
                          </span>
                          <button
                            onClick={() => handleStopLeisure(reward)}
                            className="bg-red-500 text-white border border-black px-2 py-0.5 font-black uppercase text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Square size={10} /> STOP
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={isLeisureTimerActive}
                          onClick={() => handleStartLeisure(reward.id)}
                          className="bg-green-400 hover:bg-green-500 disabled:opacity-40 text-black border border-black px-2 py-0.5 font-black uppercase text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Play size={10} /> Lancer
                        </button>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setShowManualInputRewardId(isManualOpen ? null : reward.id);
                            setShowLogsRewardId(null);
                          }}
                          className={`border border-black px-1.5 py-0.5 font-black text-[10px] uppercase cursor-pointer ${
                            isManualOpen ? "bg-black text-white" : "bg-yellow-200 hover:bg-yellow-300 text-black shadow-[1px_1px_0px_0px_#000]"
                          }`}
                        >
                          + Saisie
                        </button>

                        <button
                          onClick={() => {
                            setShowLogsRewardId(isLogsOpen ? null : reward.id);
                            setShowManualInputRewardId(null);
                          }}
                          className={`border border-black px-1.5 py-0.5 font-black text-[10px] uppercase cursor-pointer ${
                            isLogsOpen ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200 text-black shadow-[1px_1px_0px_0px_#000]"
                          }`}
                        >
                          Logs ({logsCount})
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetTargetReward(db.userProfile?.targetRewardId === reward.id ? null : reward.id)}
                          className={`p-1 border border-black cursor-pointer transition-colors ${
                            db.userProfile?.targetRewardId === reward.id
                              ? "bg-amber-400 text-black shadow-[1px_1px_0px_#000]"
                              : "bg-gray-100 hover:bg-amber-100 text-gray-700"
                          }`}
                          title={db.userProfile?.targetRewardId === reward.id ? "Retirer de la cible" : "Définir comme objectif visé"}
                        >
                          <Target size={12} />
                        </button>

                        <button
                          onClick={() => handleStartEdit(reward)}
                          className="p-1 border border-black bg-gray-100 hover:bg-gray-200"
                          title="Modifier"
                        >
                          <Edit size={10} />
                        </button>
                        <button
                          onClick={() => handleDeleteReward(reward.id)}
                          className={`p-1 border border-black ${
                            confirmDeleteId === reward.id ? "bg-red-600 text-white font-bold" : "bg-red-100 text-red-600 hover:bg-red-200"
                          }`}
                          title="Supprimer"
                        >
                          {confirmDeleteId === reward.id ? "Confirmer ?" : <Trash2 size={10} />}
                        </button>
                      </div>
                    </div>

                    {/* Zone Saisie Manuelle Inline */}
                    {isManualOpen && (
                      <div className="bg-yellow-50 border-2 border-black p-2 space-y-2 mt-1 shadow-[2px_2px_0px_0px_#000]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-gray-700 mb-0.5">📅 Date :</label>
                            <input
                              type="date"
                              value={manualDateMap[reward.id] || getTodayStr()}
                              onChange={(e) => setManualDateMap({ ...manualDateMap, [reward.id]: e.target.value })}
                              className="border-2 border-black p-1 font-black bg-white text-xs w-full focus:outline-none shadow-[1px_1px_0px_0px_#000]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-gray-700 mb-0.5">⏱️ Durée (min) :</label>
                            <input
                              type="number"
                              min="1"
                              placeholder="Ex: 15"
                              value={manualMinutesMap[reward.id] || ""}
                              onChange={(e) => setManualMinutesMap({ ...manualMinutesMap, [reward.id]: e.target.value })}
                              className="border-2 border-black p-1 font-black bg-white text-xs w-full focus:outline-none shadow-[1px_1px_0px_0px_#000]"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-between items-center gap-2 pt-1 border-t border-black/10">
                          <span className="text-[10px] font-bold text-gray-700">
                            Coût : <span className="font-black text-black">{Math.round(Number(manualMinutesMap[reward.id] || 0) * reward.costCoins)} CS</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAddManualTime(reward, -5, manualDateMap[reward.id] || getTodayStr())}
                              className="text-[8px] font-mono font-bold bg-rose-100 hover:bg-rose-200 border border-black px-1.5 py-0.5 shadow-[1px_1px_0px_#000] cursor-pointer text-black"
                            >
                              -5m
                            </button>
                            {[5, 15, 30, 60].map((mins) => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => handleAddManualTime(reward, mins, manualDateMap[reward.id] || getTodayStr())}
                                className="text-[8px] font-mono font-bold bg-amber-100 hover:bg-amber-200 border border-black px-1.5 py-0.5 shadow-[1px_1px_0px_#000] cursor-pointer text-black"
                              >
                                +{mins}m
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1.5 ml-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setShowManualInputRewardId(null);
                              }}
                              className="bg-white hover:bg-gray-100 text-black border-2 border-black font-black text-[10px] px-2 py-1 uppercase shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddManualTime(reward, Number(manualMinutesMap[reward.id]), manualDateMap[reward.id] || getTodayStr())}
                              className="bg-black text-white hover:bg-yellow-400 hover:text-black border-2 border-black font-black text-[10px] px-3 py-1 uppercase shadow-[1px_1px_0px_0px_#000] cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                            >
                              Valider Saisie
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Zone Historique des Logs Inline */}
                    {isLogsOpen && (
                      <div className="bg-gray-50 border-2 border-black p-2 space-y-1.5 mt-1 max-h-56 overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-black/20 pb-1">
                          <span className="font-black text-[10px] uppercase text-gray-700">Historique des sessions</span>
                          <span className="text-[9px] text-gray-500 font-bold">{logsCount} entrée(s)</span>
                        </div>

                        {logsCount === 0 ? (
                          <p className="italic text-gray-400 text-[10px] py-1">Aucune session enregistrée.</p>
                        ) : (
                          (reward.timeLog || []).map((log) => {
                            const isEditing = editingLog?.rewardId === reward.id && editingLog?.logId === log.id;

                            return (
                              <div key={log.id} className="flex justify-between items-center bg-white border border-black p-1.5 text-[11px] gap-1 shadow-[1px_1px_0px_0px_#000]">
                                <div className="flex flex-1 items-center gap-1.5 flex-wrap">
                                  {isEditing ? (
                                    <>
                                      <input
                                        type="date"
                                        value={editingLog.dateStr}
                                        onChange={(e) => setEditingLog({ ...editingLog, dateStr: e.target.value })}
                                        className="border border-black px-1 py-0.5 font-bold text-[10px] bg-white focus:outline-none"
                                      />
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          min="1"
                                          value={editingLog.durationStr}
                                          onChange={(e) => setEditingLog({ ...editingLog, durationStr: e.target.value })}
                                          className="w-14 border border-black px-1 py-0.5 font-bold text-[10px] bg-white focus:outline-none"
                                        />
                                        <span className="text-[10px] font-bold">min</span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-bold text-[10px] text-gray-700 bg-gray-100 border border-black/20 px-1 py-0.5">
                                        📅 {log.date}
                                      </span>
                                      <span className="bg-sky-100 border border-black/30 px-1.5 py-0.5 font-black text-[10px]">
                                        ⏱️ {log.duration} min
                                      </span>
                                      <span className="text-[9px] text-gray-500 font-bold">
                                        ({Math.round((log.duration || 0) * reward.costCoins)} CS)
                                      </span>
                                    </>
                                  )}
                                </div>

                                <div className="flex gap-1 shrink-0">
                                  {isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateLogEntry(reward, log.id, Number(editingLog.durationStr), editingLog.dateStr)}
                                        className="bg-green-400 hover:bg-green-500 border border-black px-2 py-0.5 font-black text-[9px] uppercase cursor-pointer"
                                      >
                                        OK
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingLog(null)}
                                        className="bg-gray-200 hover:bg-gray-300 border border-black px-1.5 py-0.5 font-black text-[9px] cursor-pointer"
                                      >
                                        X
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setEditingLog({ rewardId: reward.id, logId: log.id, durationStr: String(log.duration), dateStr: log.date || getTodayStr() })}
                                        className="p-1 border border-black bg-gray-100 hover:bg-gray-200 cursor-pointer"
                                        title="Modifier la session"
                                      >
                                        <Edit size={10} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteLogEntry(reward, log.id)}
                                        className="p-1 border border-black bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer"
                                        title="Supprimer la session"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2 : Achats Forfaitaires */}
      <div className="border-4 border-black bg-white p-3 shadow-[4px_4px_0px_0px_#000] space-y-3">
        <h3 className="font-black border-b-2 border-black pb-1 uppercase flex justify-between items-center">
          <span>🎁 Achats Forfaitaires</span>
          <span className="text-[10px] text-gray-500 font-normal">Achat ponctuel</span>
        </h3>

        {redeemableList.length === 0 ? (
          <p className="text-gray-400 italic py-2">Aucune récompense forfaitaire.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {redeemableList.map((reward) => {
              const canAfford = coins >= reward.costCoins;

              return (
                <div
                  key={reward.id}
                  className="border-2 border-black p-2.5 bg-white space-y-2 shadow-[2px_2px_0px_0px_#000] flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-xl">{typeof reward.icon === "string" ? reward.icon : "🎁"}</span>
                      <span className="bg-yellow-100 border border-black px-1 text-[10px] font-bold">
                        {reward.costCoins} CS
                      </span>
                    </div>
                    <h4 className="font-black text-black leading-tight">{reward.title}</h4>
                    {reward.description && <p className="text-gray-600 text-[10px]">{reward.description}</p>}
                  </div>

                  <div className="pt-2 border-t border-dashed border-gray-300 flex items-center justify-between gap-1">
                    <button
                      disabled={!canAfford}
                      onClick={() => handleBuyReward(reward)}
                      className={`flex-1 border border-black py-1 px-2 font-black uppercase text-[10px] flex items-center justify-center gap-1 cursor-pointer ${
                        canAfford
                          ? "bg-yellow-400 hover:bg-yellow-500 text-black shadow-[1px_1px_0px_0px_#000]"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <Coins size={10} /> Acheter
                    </button>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleSetTargetReward(db.userProfile?.targetRewardId === reward.id ? null : reward.id)}
                        className={`p-1 border border-black cursor-pointer transition-colors ${
                          db.userProfile?.targetRewardId === reward.id
                            ? "bg-amber-400 text-black shadow-[1px_1px_0px_#000]"
                            : "bg-gray-100 hover:bg-amber-100 text-gray-700"
                        }`}
                        title={db.userProfile?.targetRewardId === reward.id ? "Retirer de la cible" : "Définir comme achat visé"}
                      >
                        <Target size={12} />
                      </button>
                      <button
                        onClick={() => handleStartEdit(reward)}
                        className="p-1 border border-black bg-gray-100 hover:bg-gray-200"
                        title="Modifier"
                      >
                        <Edit size={10} />
                      </button>
                      <button
                        onClick={() => handleDeleteReward(reward.id)}
                        className={`p-1 border border-black ${
                          confirmDeleteId === reward.id ? "bg-red-600 text-white font-bold" : "bg-red-100 text-red-600 hover:bg-red-200"
                        }`}
                        title="Supprimer"
                      >
                        {confirmDeleteId === reward.id ? "Confirmer ?" : <Trash2 size={10} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
