import React, { useState } from "react";
import { AppDatabase, SleepWakeLog } from "../../types";
import { Sun, Clock, Check, X, ArrowUpRight, CheckCircle2, History, PlusCircle } from "lucide-react";
import WakeUpHistoryManager from "./WakeUpHistoryManager";

interface WakeUpModalProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
  onClose: () => void;
}

export default function WakeUpModal({ db, updateDb, onClose }: WakeUpModalProps) {
  const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  const targetWakeTime = db.userProfile?.targetWakeTime || "07:00";
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");

  // Obtenir l'heure actuelle au format HH:MM
  const getCurrentTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const [wakeTime, setWakeTime] = useState<string>(() => getCurrentTime());
  const [updateDefaultTarget, setUpdateDefaultTarget] = useState<boolean>(false);

  const getMinutesFromTime = (timeStr: string) => {
    const parts = timeStr.trim().split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const calculateWakeDelta = (wake: string, target: string) => {
    const targetM = getMinutesFromTime(target);
    const wakeM = getMinutesFromTime(wake);
    return targetM - wakeM; // Positif = avance, Négatif = retard
  };

  const formatTime = (t: string) => {
    const parts = t.trim().split(":");
    if (parts.length === 2) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    }
    return t.trim();
  };

  const adjustMinutes = (deltaMin: number) => {
    let currentTotal = getMinutesFromTime(wakeTime);
    currentTotal = (currentTotal + deltaMin + 1440) % 1440;
    const h = Math.floor(currentTotal / 60);
    const m = currentTotal % 60;
    setWakeTime(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  const delta = calculateWakeDelta(wakeTime, targetWakeTime);

  const handleConfirm = () => {
    const formattedWake = formatTime(wakeTime);
    const calculatedDelta = calculateWakeDelta(formattedWake, targetWakeTime);

    const currentLogs = db.sleepWakeLogs || [];
    const existingIndex = currentLogs.findIndex((l) => l.date === todayStr);

    let updatedCoins = Number(db.userProfile?.coins || 0);
    let updatedLogs = [...currentLogs];

    if (existingIndex >= 0) {
      const prevPoints = currentLogs[existingIndex].coinsRewarded || 0;
      const diff = calculatedDelta - prevPoints;
      updatedCoins = Math.max(0, updatedCoins + diff);
      updatedLogs[existingIndex] = {
        ...updatedLogs[existingIndex],
        wakeUpTime: formattedWake,
        sleepEndTime: formattedWake,
        coinsRewarded: calculatedDelta,
        wakeUpDelayMinutes: -calculatedDelta,
        notes:
          calculatedDelta >= 0
            ? `Réveil à ${formattedWake} (+${calculatedDelta} min d'avance sur ${targetWakeTime})`
            : `Réveil à ${formattedWake} (${Math.abs(calculatedDelta)} min de retard sur ${targetWakeTime})`,
      };
    } else {
      updatedCoins = Math.max(0, updatedCoins + calculatedDelta);
      const newLog: SleepWakeLog = {
        id: `wake-${Date.now()}`,
        date: todayStr,
        sleepStartTime: db.userProfile?.targetSleepTime || "23:00",
        sleepEndTime: formattedWake,
        sleepLatencyMinutes: 10,
        nightWakingDurationMinutes: 0,
        remSleepEstimateMinutes: 90,
        deepSleepEstimateMinutes: 90,
        sleepDebtMinutes: 0,
        circadianScore: 100,
        sleepEfficiency: 95,
        wakeUpTime: formattedWake,
        wakeUpDelayMinutes: -calculatedDelta,
        coinsRewarded: calculatedDelta,
        notes:
          calculatedDelta >= 0
            ? `Réveil à ${formattedWake} (+${calculatedDelta} min d'avance sur ${targetWakeTime})`
            : `Réveil à ${formattedWake} (${Math.abs(calculatedDelta)} min de retard sur ${targetWakeTime})`,
      };
      updatedLogs = [newLog, ...updatedLogs];
    }

    const updatedProfile = {
      ...db.userProfile,
      coins: updatedCoins,
      lastWakeConfirmedDate: todayStr,
      targetWakeTime: updateDefaultTarget ? formattedWake : targetWakeTime,
    };

    updateDb({
      ...db,
      userProfile: updatedProfile,
      sleepWakeLogs: updatedLogs,
    });

    onClose();
  };

  const handleDismiss = () => {
    // Marquer la date pour ne plus ré-ouvrir automatiquement aujourd'hui
    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        lastWakeConfirmedDate: todayStr,
      },
    });
    onClose();
  };

  return (
    <div
      id="wake-up-modal-backdrop"
      className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9999] overflow-y-auto p-2 sm:p-4"
      onClick={handleDismiss}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center py-2 sm:py-6">
        <div
          id="wake-up-modal-card"
          className="w-full max-w-md bg-white border-4 border-black p-4 sm:p-5 shadow-[6px_6px_0px_0px_#000] relative font-mono text-black"
          onClick={(e) => e.stopPropagation()}
        >
        {/* En-tête */}
        <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌅</span>
            <h2 className="text-sm font-black uppercase tracking-tight">
              Gestion du Réveil Matinal
            </h2>
          </div>
          <button
            id="wake-up-modal-close-btn"
            onClick={handleDismiss}
            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 border-2 border-black flex items-center justify-center font-black text-xs cursor-pointer shadow-[1px_1px_0px_#000]"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Barre d'onglets interne */}
        <div className="flex border-b-2 border-black mb-3 gap-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className={`px-3 py-1.5 font-black uppercase border-t-2 border-l-2 border-r-2 border-black cursor-pointer transition-all ${
              activeTab === "today"
                ? "bg-yellow-300 text-black shadow-[1px_0px_0px_#000]"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Aujourd'hui
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 font-black uppercase border-t-2 border-l-2 border-r-2 border-black cursor-pointer transition-all flex items-center gap-1 ${
              activeTab === "history"
                ? "bg-yellow-300 text-black shadow-[1px_0px_0px_#000]"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <History size={12} />
            <span>Historique & Passé</span>
          </button>
        </div>

        {activeTab === "history" ? (
          <div className="space-y-3">
            <WakeUpHistoryManager db={db} updateDb={updateDb} />
            <div className="pt-2 border-t-2 border-black text-right">
              <button
                type="button"
                onClick={handleDismiss}
                className="py-1.5 px-4 bg-gray-200 hover:bg-gray-300 text-black border-2 border-black font-black text-xs uppercase cursor-pointer shadow-[2px_2px_0px_#000]"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Cible vs Réel */}
            <div className="bg-yellow-50 border-2 border-black p-3 mb-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 font-bold">Heure cible habituelle :</span>
                <span className="font-black bg-white px-2 py-0.5 border border-black shadow-[1px_1px_0px_#000]">
                  {targetWakeTime}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 font-bold">Heure constatée aujourd'hui :</span>
                <div className="flex items-center gap-1">
                  <input
                    id="wake-time-input"
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="bg-white border-2 border-black px-2 py-0.5 font-black text-sm text-center shadow-[1px_1px_0px_#000] outline-none"
                  />
                </div>
              </div>

              {/* Raccourcis rapides d'ajustement */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-dashed border-black/20 text-[10px]">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => adjustMinutes(-15)}
                    className="px-1.5 py-0.5 bg-white border border-black hover:bg-gray-100 font-bold cursor-pointer"
                  >
                    -15m
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustMinutes(-5)}
                    className="px-1.5 py-0.5 bg-white border border-black hover:bg-gray-100 font-bold cursor-pointer"
                  >
                    -5m
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustMinutes(+5)}
                    className="px-1.5 py-0.5 bg-white border border-black hover:bg-gray-100 font-bold cursor-pointer"
                  >
                    +5m
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustMinutes(+15)}
                    className="px-1.5 py-0.5 bg-white border border-black hover:bg-gray-100 font-bold cursor-pointer"
                  >
                    +15m
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setWakeTime(getCurrentTime())}
                  className="px-2 py-0.5 bg-yellow-200 border border-black hover:bg-yellow-300 font-bold cursor-pointer"
                >
                  Maintenant ({getCurrentTime()})
                </button>
              </div>
            </div>

            {/* Évaluation / Bilan du delta */}
            <div className="mb-4">
              {delta > 0 ? (
                <div className="bg-emerald-100 text-emerald-950 border-2 border-black p-2.5 text-xs font-bold flex items-center justify-between shadow-[2px_2px_0px_#000]">
                  <span>Avance de +{delta} minutes</span>
                  <span className="font-black bg-emerald-300 px-2 py-0.5 border border-black">
                    +{delta} CS
                  </span>
                </div>
              ) : delta < 0 ? (
                <div className="bg-amber-100 text-amber-950 border-2 border-black p-2.5 text-xs font-bold flex items-center justify-between shadow-[2px_2px_0px_#000]">
                  <span>Retard de {Math.abs(delta)} minutes</span>
                  <span className="font-black bg-amber-300 px-2 py-0.5 border border-black">
                    {delta} CS
                  </span>
                </div>
              ) : (
                <div className="bg-gray-100 text-black border-2 border-black p-2.5 text-xs font-bold flex items-center justify-between shadow-[2px_2px_0px_#000]">
                  <span>Exactement à l'heure cible</span>
                  <span className="font-black bg-white px-2 py-0.5 border border-black">
                    0 CS
                  </span>
                </div>
              )}
            </div>

            {/* Option pour mettre à jour l'heure cible par défaut */}
            <label className="flex items-center gap-2 mb-5 cursor-pointer text-xs select-none">
              <input
                id="update-target-wake-checkbox"
                type="checkbox"
                checked={updateDefaultTarget}
                onChange={(e) => setUpdateDefaultTarget(e.target.checked)}
                className="accent-black h-4 w-4 cursor-pointer"
              />
              <span className="text-gray-700 font-bold">
                Définir aussi {wakeTime} comme nouvelle heure cible habituelle
              </span>
            </label>

            {/* Boutons d'actions */}
            <div className="flex gap-2">
              <button
                id="wake-up-modal-cancel-btn"
                type="button"
                onClick={handleDismiss}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-black border-2 border-black font-black text-xs uppercase cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Plus tard
              </button>
              <button
                id="wake-up-modal-confirm-btn"
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black font-black text-xs uppercase cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-1.5"
              >
                <Check size={14} className="stroke-[3]" />
                Confirmer ({wakeTime})
              </button>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
