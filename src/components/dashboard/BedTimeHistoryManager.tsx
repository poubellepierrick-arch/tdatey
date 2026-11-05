import React, { useState } from "react";
import { AppDatabase, SleepWakeLog } from "../../types";
import { Plus, Trash2, Edit2, Check, X, Moon, TrendingUp, List } from "lucide-react";
import BedTimeChart from "./BedTimeChart";

interface BedTimeHistoryManagerProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
  defaultView?: "chart" | "list";
}

export const calculateBedDelta = (bedTime: string, targetTime: string): number => {
  const getMinutes = (t: string) => {
    const parts = t.trim().split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };
  const targetM = getMinutes(targetTime);
  const bedM = getMinutes(bedTime);
  let diff = targetM - bedM;
  if (diff > 720) diff -= 1440;
  if (diff < -720) diff += 1440;
  return diff; // Positif = avance, Négatif = retard
};

export const formatTime = (t: string): string => {
  const parts = t.trim().split(":");
  if (parts.length === 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return t.trim();
};

export default function BedTimeHistoryManager({
  db,
  updateDb,
  defaultView = "chart",
}: BedTimeHistoryManagerProps) {
  const targetSleepTime = db.userProfile?.targetSleepTime || "23:00";
  const allLogs = db.sleepWakeLogs || [];
  // Filtrer les entrées contenant des données de coucher
  const bedLogs = allLogs.filter((l) => Boolean(l.bedTime || l.sleepStartTime));

  const [viewMode, setViewMode] = useState<"chart" | "list">(defaultView);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState(() => {
    const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    return d.toISOString().split("T")[0];
  });
  const [newTime, setNewTime] = useState("23:00");
  const [newNotes, setNewNotes] = useState("");
  const [applyCoinsImpact, setApplyCoinsImpact] = useState(true);

  // État de modification d'une ligne
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // État de suppression inline (zéro popup)
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 1. Ajouter un coucher passé
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTime) return;

    const formattedTime = formatTime(newTime);
    const delta = calculateBedDelta(formattedTime, targetSleepTime);

    const existingIndex = allLogs.findIndex((l) => l.date === newDate);
    let updatedLogs = [...allLogs];
    let updatedCoins = Number(db.userProfile?.coins || 0);

    if (existingIndex >= 0) {
      const prevPoints = allLogs[existingIndex].bedTimeCoinsRewarded || 0;
      if (applyCoinsImpact) {
        const diff = delta - prevPoints;
        updatedCoins = Math.max(0, updatedCoins + diff);
      }
      updatedLogs[existingIndex] = {
        ...updatedLogs[existingIndex],
        bedTime: formattedTime,
        sleepStartTime: formattedTime,
        bedTimeCoinsRewarded: delta,
        bedTimeDelayMinutes: delta,
        bedTimeNotes:
          newNotes.trim() ||
          (delta >= 0
            ? `Coucher à ${formattedTime} (+${delta}m)`
            : `Coucher à ${formattedTime} (${delta}m)`),
      };
    } else {
      if (applyCoinsImpact) {
        updatedCoins = Math.max(0, updatedCoins + delta);
      }
      const newLog: SleepWakeLog = {
        id: `bed-${Date.now()}`,
        date: newDate,
        sleepStartTime: formattedTime,
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
        bedTime: formattedTime,
        bedTimeCoinsRewarded: delta,
        bedTimeDelayMinutes: delta,
        bedTimeNotes:
          newNotes.trim() ||
          (delta >= 0
            ? `Coucher à ${formattedTime} (+${delta}m)`
            : `Coucher à ${formattedTime} (${delta}m)`),
      };
      updatedLogs = [newLog, ...updatedLogs];
    }

    updatedLogs.sort((a, b) => b.date.localeCompare(a.date));

    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        coins: updatedCoins,
      },
      sleepWakeLogs: updatedLogs,
    });

    setNewNotes("");
    setShowAddForm(false);
  };

  // 2. Débuter la modification
  const handleStartEdit = (log: SleepWakeLog) => {
    setEditingId(log.id);
    setEditDate(log.date);
    setEditTime(log.bedTime || log.sleepStartTime || "23:00");
    setEditNotes(log.bedTimeNotes || "");
    setDeletingId(null);
  };

  // 3. Valider la modification
  const handleSaveEdit = (id: string) => {
    const targetLog = allLogs.find((l) => l.id === id);
    if (!targetLog) return;

    const formattedTime = formatTime(editTime);
    const newDelta = calculateBedDelta(formattedTime, targetSleepTime);
    const oldDelta = targetLog.bedTimeCoinsRewarded || 0;
    const diff = newDelta - oldDelta;

    let updatedCoins = Number(db.userProfile?.coins || 0);
    updatedCoins = Math.max(0, updatedCoins + diff);

    const updatedLogs = allLogs.map((l) => {
      if (l.id === id) {
        return {
          ...l,
          date: editDate,
          bedTime: formattedTime,
          sleepStartTime: formattedTime,
          bedTimeCoinsRewarded: newDelta,
          bedTimeDelayMinutes: newDelta,
          bedTimeNotes: editNotes.trim(),
        };
      }
      return l;
    });

    updatedLogs.sort((a, b) => b.date.localeCompare(a.date));

    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        coins: updatedCoins,
      },
      sleepWakeLogs: updatedLogs,
    });

    setEditingId(null);
  };

  // 4. Supprimer un coucher (inline confirmation)
  const handleConfirmDelete = (id: string) => {
    const targetLog = allLogs.find((l) => l.id === id);
    if (!targetLog) return;

    const coinsToRevert = targetLog.bedTimeCoinsRewarded || 0;
    let updatedCoins = Number(db.userProfile?.coins || 0);
    updatedCoins = Math.max(0, updatedCoins - coinsToRevert);

    // Si le log contient aussi un réveil confirmé, ne supprimer que les données de coucher
    let updatedLogs: SleepWakeLog[];
    if (targetLog.wakeUpTime && targetLog.wakeUpTime !== "07:00") {
      updatedLogs = allLogs.map((l) => {
        if (l.id === id) {
          const copy = { ...l };
          delete copy.bedTime;
          delete copy.bedTimeCoinsRewarded;
          delete copy.bedTimeDelayMinutes;
          delete copy.bedTimeNotes;
          return copy;
        }
        return l;
      });
    } else {
      updatedLogs = allLogs.filter((l) => l.id !== id);
    }

    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        coins: updatedCoins,
      },
      sleepWakeLogs: updatedLogs,
    });

    setDeletingId(null);
    if (editingId === id) setEditingId(null);
  };

  const deltaAdd = calculateBedDelta(formatTime(newTime), targetSleepTime);

  return (
    <div id="bed-time-history-manager" className="space-y-3 font-mono text-xs text-black">
      {/* Barre d'action supérieure */}
      <div className="flex flex-wrap justify-between items-center gap-2 bg-gray-100 border-2 border-black p-2.5 shadow-[2px_2px_0px_#000]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-black uppercase text-[11px]">
            <span>🌙</span>
            <span>Suivi des Couchers ({bedLogs.length})</span>
          </div>

          <div className="flex items-center border border-black overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("chart")}
              className={`px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer ${
                viewMode === "chart"
                  ? "bg-indigo-300 text-black shadow-[inset_1px_1px_0px_#000]"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <TrendingUp size={11} />
              <span>Graphique</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1 border-l border-black cursor-pointer ${
                viewMode === "list"
                  ? "bg-indigo-300 text-black shadow-[inset_1px_1px_0px_#000]"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <List size={11} />
              <span>Liste</span>
            </button>
          </div>
        </div>

        <button
          id="toggle-add-bed-log-btn"
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-300 hover:bg-indigo-400 border-2 border-black px-2.5 py-1 font-black text-[10px] uppercase shadow-[1px_1px_0px_#000] cursor-pointer flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5"
        >
          {showAddForm ? <X size={12} /> : <Plus size={12} />}
          <span>{showAddForm ? "Fermer" : "Ajouter un coucher"}</span>
        </button>
      </div>

      {/* Mode Graphique */}
      {viewMode === "chart" && (
        <div className="bg-[#FFFDF9] border-2 border-black p-3 shadow-[2px_2px_0px_#000]">
          <BedTimeChart logs={allLogs} targetSleepTime={targetSleepTime} />
        </div>
      )}

      {/* Formulaire d'ajout d'une date passée */}
      {showAddForm && (
        <form
          id="add-bed-log-form"
          onSubmit={handleAddLog}
          className="bg-indigo-50 border-2 border-black p-3 space-y-2.5 shadow-[3px_3px_0px_#000]"
        >
          <div className="font-black uppercase text-[10px] border-b border-black pb-1 flex justify-between items-center">
            <span>➕ Enregistrer un coucher passé</span>
            <span className="text-gray-600 font-bold">Cible : {targetSleepTime}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-[10px] uppercase text-gray-700 mb-0.5">
                Date
              </label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-white border-2 border-black px-2 py-1 font-bold text-xs shadow-[1px_1px_0px_#000] outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-[10px] uppercase text-gray-700 mb-0.5">
                Heure de coucher
              </label>
              <input
                type="time"
                required
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full bg-white border-2 border-black px-2 py-1 font-bold text-xs shadow-[1px_1px_0px_#000] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[10px] uppercase text-gray-700 mb-0.5">
              Note / Circonstances (optionnel)
            </label>
            <input
              type="text"
              placeholder="ex: Lecture au calme, sommeil rapide..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full bg-white border-2 border-black px-2 py-1 text-xs shadow-[1px_1px_0px_#000] outline-none"
            />
          </div>

          {/* Écart et impact pièces */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dashed border-black/30">
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <span>Écart :</span>
              <span
                className={`px-1.5 py-0.5 border border-black font-black ${
                  deltaAdd >= 0
                    ? "bg-emerald-200 text-emerald-950"
                    : "bg-rose-200 text-rose-950"
                }`}
              >
                {deltaAdd >= 0
                  ? `+${deltaAdd} min (+${deltaAdd} CS)`
                  : `${deltaAdd} min (${deltaAdd} CS)`}
              </span>
            </div>

            <label className="flex items-center gap-1.5 text-[10px] font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyCoinsImpact}
                onChange={(e) => setApplyCoinsImpact(e.target.checked)}
                className="accent-black cursor-pointer"
              />
              <span>Ajuster mon solde de CS</span>
            </label>
          </div>

          <div className="text-right pt-1">
            <button
              type="submit"
              className="bg-emerald-400 hover:bg-emerald-500 text-black border-2 border-black px-3 py-1.5 font-black text-xs uppercase shadow-[2px_2px_0px_#000] cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              Enregistrer le coucher
            </button>
          </div>
        </form>
      )}

      {/* Liste des couchers passés */}
      {viewMode === "list" && (
        bedLogs.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-black p-4 text-center text-gray-500 italic text-xs">
            Aucun coucher enregistré pour le moment.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {bedLogs.map((log) => {
              const isEditing = editingId === log.id;
              const isDeleting = deletingId === log.id;
              const timeDisplay = log.bedTime || log.sleepStartTime || "23:00";
              const rewarded = log.bedTimeCoinsRewarded ?? 0;
              const isPositive = rewarded >= 0;

              if (isEditing) {
                const editDelta = calculateBedDelta(formatTime(editTime), targetSleepTime);
                return (
                  <div
                    key={log.id}
                    className="bg-indigo-50 border-2 border-black p-2.5 space-y-2 shadow-[2px_2px_0px_#000]"
                  >
                    <div className="font-black text-[10px] uppercase text-black flex justify-between">
                      <span>✏️ Modifier le coucher</span>
                      <span className="text-gray-600">Cible : {targetSleepTime}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-gray-600">
                          Date
                        </label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full bg-white border border-black p-1 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-gray-600">
                          Heure de coucher
                        </label>
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="w-full bg-white border border-black p-1 text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-gray-600">
                        Note
                      </label>
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full bg-white border border-black p-1 text-xs"
                        placeholder="Commentaire..."
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-black/20 text-[10px]">
                      <span className="font-bold">
                        Nouvel écart :{" "}
                        <strong
                          className={editDelta >= 0 ? "text-emerald-700" : "text-rose-700"}
                        >
                          {editDelta >= 0 ? `+${editDelta} CS` : `${editDelta} CS`}
                        </strong>
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 bg-gray-200 border border-black font-bold uppercase cursor-pointer hover:bg-gray-300"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(log.id)}
                          className="px-2 py-1 bg-indigo-300 border border-black font-black uppercase cursor-pointer hover:bg-indigo-400 flex items-center gap-1"
                        >
                          <Check size={12} />
                          Sauvegarder
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={log.id}
                  className="bg-white border-2 border-black p-2 flex flex-col gap-1 shadow-[1px_1px_0px_#000] hover:bg-indigo-50/20 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black bg-black text-white px-1.5 py-0.5 text-[10px]">
                        {log.date}
                      </span>
                      <span className="font-extrabold text-xs">
                        Couché à <span className="underline decoration-2">{timeDisplay}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-black text-[10px] px-1.5 py-0.5 border border-black ${
                          isPositive
                            ? "bg-emerald-100 text-emerald-950"
                            : "bg-rose-100 text-rose-950"
                        }`}
                      >
                        {isPositive ? `+${rewarded}` : rewarded} CS
                      </span>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(log)}
                        className="w-6 h-6 bg-gray-100 hover:bg-gray-200 border border-black flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000]"
                        title="Modifier ce coucher"
                      >
                        <Edit2 size={11} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingId(isDeleting ? null : log.id)}
                        className="w-6 h-6 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-black flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000]"
                        title="Supprimer ce coucher"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {log.bedTimeNotes && (
                    <p className="text-[10px] text-gray-600 italic pl-1 border-l-2 border-gray-300">
                      {log.bedTimeNotes}
                    </p>
                  )}

                  {/* Confirmation de suppression INLINE */}
                  {isDeleting && (
                    <div className="mt-1 bg-rose-50 border-2 border-rose-600 p-2 text-[10px] flex items-center justify-between gap-2">
                      <span className="font-black text-rose-900">
                        Supprimer ce coucher du {log.date} ?
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-0.5 bg-white border border-black font-bold cursor-pointer hover:bg-gray-100"
                        >
                          Non
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(log.id)}
                          className="px-2 py-0.5 bg-rose-600 text-white font-black border border-black cursor-pointer hover:bg-rose-700"
                        >
                          Oui, supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
