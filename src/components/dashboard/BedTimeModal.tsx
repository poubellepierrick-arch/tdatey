import React, { useState } from "react";
import { AppDatabase, SleepWakeLog } from "../../types";
import { Moon, Clock, Check, X, History } from "lucide-react";
import BedTimeHistoryManager, { calculateBedDelta, formatTime } from "./BedTimeHistoryManager";

interface BedTimeModalProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
  onClose: () => void;
}

export default function BedTimeModal({ db, updateDb, onClose }: BedTimeModalProps) {
  const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  const targetSleepTime = db.userProfile?.targetSleepTime || "23:00";
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");

  const getCurrentTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const [bedTime, setBedTime] = useState<string>(() => getCurrentTime());
  const [updateDefaultTarget, setUpdateDefaultTarget] = useState<boolean>(false);

  const getMinutesFromTime = (timeStr: string) => {
    const parts = timeStr.trim().split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const adjustMinutes = (deltaMin: number) => {
    let currentTotal = getMinutesFromTime(bedTime);
    currentTotal = (currentTotal + deltaMin + 1440) % 1440;
    const h = Math.floor(currentTotal / 60);
    const m = currentTotal % 60;
    setBedTime(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  const delta = calculateBedDelta(bedTime, targetSleepTime);

  const handleConfirm = () => {
    const formattedBed = formatTime(bedTime);
    const calculatedDelta = calculateBedDelta(formattedBed, targetSleepTime);

    const currentLogs = db.sleepWakeLogs || [];
    const existingIndex = currentLogs.findIndex((l) => l.date === todayStr);

    let updatedCoins = Number(db.userProfile?.coins || 0);
    let updatedLogs = [...currentLogs];

    if (existingIndex >= 0) {
      const prevPoints = currentLogs[existingIndex].bedTimeCoinsRewarded || 0;
      const diff = calculatedDelta - prevPoints;
      updatedCoins = Math.max(0, updatedCoins + diff);
      updatedLogs[existingIndex] = {
        ...updatedLogs[existingIndex],
        bedTime: formattedBed,
        sleepStartTime: formattedBed,
        bedTimeCoinsRewarded: calculatedDelta,
        bedTimeDelayMinutes: calculatedDelta,
        bedTimeNotes:
          calculatedDelta >= 0
            ? `Coucher à ${formattedBed} (+${calculatedDelta} min d'avance sur ${targetSleepTime})`
            : `Coucher à ${formattedBed} (${Math.abs(calculatedDelta)} min de retard sur ${targetSleepTime})`,
      };
    } else {
      updatedCoins = Math.max(0, updatedCoins + calculatedDelta);
      const newLog: SleepWakeLog = {
        id: `bed-${Date.now()}`,
        date: todayStr,
        sleepStartTime: formattedBed,
        sleepEndTime: db.userProfile?.targetWakeTime || "07:00",
        sleepLatencyMinutes: 10,
        nightWakingDurationMinutes: 0,
        remSleepEstimateMinutes: 90,
        deepSleepEstimateMinutes: 90,
        sleepDebtMinutes: 0,
        circadianScore: 100,
        sleepEfficiency: 95,
        wakeUpTime: db.userProfile?.targetWakeTime || "07:00",
        wakeUpDelayMinutes: 0,
        coinsRewarded: 0,
        bedTime: formattedBed,
        bedTimeCoinsRewarded: calculatedDelta,
        bedTimeDelayMinutes: calculatedDelta,
        bedTimeNotes:
          calculatedDelta >= 0
            ? `Coucher à ${formattedBed} (+${calculatedDelta} min d'avance sur ${targetSleepTime})`
            : `Coucher à ${formattedBed} (${Math.abs(calculatedDelta)} min de retard sur ${targetSleepTime})`,
      };
      updatedLogs = [newLog, ...updatedLogs];
    }

    const updatedProfile = {
      ...db.userProfile,
      coins: updatedCoins,
      lastBedConfirmedDate: todayStr,
      targetSleepTime: updateDefaultTarget ? formattedBed : targetSleepTime,
    };

    updateDb({
      ...db,
      userProfile: updatedProfile,
      sleepWakeLogs: updatedLogs,
    });

    onClose();
  };

  const handleDismiss = () => {
    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        lastBedConfirmedDate: todayStr,
      },
    });
    onClose();
  };

  return (
    <div
      id="bed-time-modal-backdrop"
      className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9999] overflow-y-auto p-2 sm:p-4"
      onClick={handleDismiss}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center py-2 sm:py-6">
        <div
          id="bed-time-modal-card"
          className="w-full max-w-md bg-white border-4 border-black p-4 sm:p-5 shadow-[6px_6px_0px_0px_#000] relative font-mono text-black"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌙</span>
              <h2 className="text-sm font-black uppercase tracking-tight">
                Gestion du Coucher
              </h2>
            </div>
            <button
              id="bed-time-modal-close-btn"
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
                  ? "bg-indigo-300 text-black shadow-[1px_0px_0px_#000]"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Ce soir
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 font-black uppercase border-t-2 border-l-2 border-r-2 border-black cursor-pointer transition-all flex items-center gap-1 ${
                activeTab === "history"
                  ? "bg-indigo-300 text-black shadow-[1px_0px_0px_#000]"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <History size={12} />
              <span>Historique & Passé</span>
            </button>
          </div>

          {activeTab === "history" ? (
            <div className="space-y-3">
              <BedTimeHistoryManager db={db} updateDb={updateDb} />
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
              <div className="bg-indigo-50 border-2 border-black p-3 mb-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 font-bold">Heure cible habituelle :</span>
                  <span className="font-black bg-white px-2 py-0.5 border border-black shadow-[1px_1px_0px_#000]">
                    {targetSleepTime}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 font-bold">Heure constatée :</span>
                  <div className="flex items-center gap-1">
                    <input
                      id="bed-time-input"
                      type="time"
                      value={bedTime}
                      onChange={(e) => setBedTime(e.target.value)}
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
                    onClick={() => setBedTime(getCurrentTime())}
                    className="px-2 py-0.5 bg-indigo-200 border border-black hover:bg-indigo-300 font-bold cursor-pointer"
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
                  id="update-target-bed-checkbox"
                  type="checkbox"
                  checked={updateDefaultTarget}
                  onChange={(e) => setUpdateDefaultTarget(e.target.checked)}
                  className="accent-black h-4 w-4 cursor-pointer"
                />
                <span className="text-gray-700 font-bold">
                  Définir aussi {bedTime} comme nouvelle heure cible habituelle
                </span>
              </label>

              {/* Boutons d'actions */}
              <div className="flex gap-2">
                <button
                  id="bed-time-modal-cancel-btn"
                  type="button"
                  onClick={handleDismiss}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-black border-2 border-black font-black text-xs uppercase cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  Plus tard
                </button>
                <button
                  id="bed-time-modal-confirm-btn"
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 py-2 bg-indigo-300 hover:bg-indigo-400 text-black border-2 border-black font-black text-xs uppercase cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-1.5"
                >
                  <Check size={14} className="stroke-[3]" />
                  Confirmer ({bedTime})
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
