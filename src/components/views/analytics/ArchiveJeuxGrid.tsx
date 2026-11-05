import React, { useState, useMemo } from "react";
import { ArchiveJeuxGridData } from "../../../lib/analyticsEngine";
import { Gamepad2, Search, Filter, Calendar, Award } from "lucide-react";

interface ArchiveJeuxGridProps {
  gridData: ArchiveJeuxGridData;
}

export const ArchiveJeuxGrid: React.FC<ArchiveJeuxGridProps> = ({ gridData }) => {
  const [dateSearch, setDateSearch] = useState("");
  const [selectedGameFilter, setSelectedGameFilter] = useState("all");
  const [displayCount, setDisplayCount] = useState(60);

  // Filtrage des lignes quotidiennes
  const filteredRows = useMemo(() => {
    let rows = gridData.dailyRows;

    if (dateSearch.trim()) {
      const q = dateSearch.trim().toLowerCase();
      rows = rows.filter((r) => r.date.toLowerCase().includes(q));
    }

    if (selectedGameFilter !== "all") {
      rows = rows.filter((r) => (r.gameMinutes[selectedGameFilter] || 0) > 0);
    }

    return rows;
  }, [gridData.dailyRows, dateSearch, selectedGameFilter]);

  const displayedRows = useMemo(() => {
    return displayCount === 0 ? filteredRows : filteredRows.slice(0, displayCount);
  }, [filteredRows, displayCount]);

  return (
    <div className="space-y-4 font-mono select-none">
      {/* 1. Bloc d'En-tête Statistique (Fidèle aux 9 lignes du Google Sheets d'origine) */}
      <div className="bg-purple-50 border-4 border-black p-4 shadow-[4px_4px_0px_#000] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <Gamepad2 className="text-purple-700 stroke-[2.5]" size={22} />
            <h3 className="font-black text-sm uppercase">
              Tableau de Bord & Quota de Jeux Vidéo (1h / jour)
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold">
            <span>Période : {gridData.startDate} au {gridData.endDate}</span>
            <span>({gridData.elapsedDays} jours • {gridData.yearsElapsed} ans)</span>
          </div>
        </div>

        {/* 4 Cartouches KPI Fidèles aux Formules */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-white border-2 border-black p-2.5 shadow-[1px_1px_0px_#000]">
            <span className="text-[10px] font-black uppercase text-gray-600 block">Quota Autorisé (1h/j)</span>
            <div className="text-lg font-black text-black mt-0.5">
              {gridData.authorizedHours}:00h
            </div>
            <span className="text-[9px] text-gray-500">1 heure par jour écoulé</span>
          </div>

          <div className="bg-white border-2 border-black p-2.5 shadow-[1px_1px_0px_#000]">
            <span className="text-[10px] font-black uppercase text-purple-900 block">Total Général Joué</span>
            <div className="text-lg font-black text-purple-950 mt-0.5">
              {gridData.totalPlayedHours}h
            </div>
            <span className="text-[9px] text-gray-500">Cumul de tous les jeux</span>
          </div>

          <div className={`border-2 border-black p-2.5 shadow-[1px_1px_0px_#000] ${
            gridData.isDeficit ? "bg-rose-100 text-rose-950" : "bg-emerald-100 text-emerald-950"
          }`}>
            <span className="text-[10px] font-black uppercase block">
              {gridData.isDeficit ? "Déficit / Dépassement" : "Heures Restantes"}
            </span>
            <div className="text-lg font-black mt-0.5">
              {gridData.remainingHours}h
            </div>
            <span className="text-[9px]">
              {gridData.isDeficit ? "Au-delà de la cible d'1h/j" : "Solde d'heures d'avance"}
            </span>
          </div>

          <div className="bg-white border-2 border-black p-2.5 shadow-[1px_1px_0px_#000]">
            <span className="text-[10px] font-black uppercase text-gray-600 block">Moyenne Globale / Jour</span>
            <div className="text-lg font-black text-black mt-0.5">
              {gridData.overallAvgHoursPerDay}h/j
            </div>
            <span className="text-[9px] text-gray-500">Cible : 1:00h/j</span>
          </div>
        </div>
      </div>

      {/* 2. Barre de Recherche et Filtres */}
      <div className="bg-white border-3 border-black p-3 shadow-[2px_2px_0px_#000] flex flex-col sm:flex-row gap-2 justify-between items-center">
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher une date (DD/MM/YYYY)..."
            value={dateSearch}
            onChange={(e) => setDateSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border-2 border-black text-xs font-bold bg-white focus:outline-none focus:bg-yellow-50"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Filter size={13} className="text-gray-600" />
            <select
              value={selectedGameFilter}
              onChange={(e) => setSelectedGameFilter(e.target.value)}
              className="px-2 py-1.5 border-2 border-black text-xs font-bold bg-white cursor-pointer"
            >
              <option value="all">Tous les jeux ({gridData.gamesList.length})</option>
              {gridData.gamesList.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <select
            value={displayCount}
            onChange={(e) => setDisplayCount(Number(e.target.value))}
            className="px-2 py-1.5 border-2 border-black text-xs font-bold bg-white cursor-pointer"
          >
            <option value={30}>30 dates</option>
            <option value={60}>60 dates</option>
            <option value={150}>150 dates</option>
            <option value={0}>Toutes ({filteredRows.length})</option>
          </select>
        </div>
      </div>

      {/* 3. Grille Tableur Interactive (Fidèle à la feuille 'archive jeux') */}
      <div className="bg-white border-3 border-black shadow-[3px_3px_0px_#000] overflow-hidden">
        <div className="overflow-x-auto max-h-[580px]">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="sticky top-0 bg-yellow-300 border-b-2 border-black z-10 text-[10px] font-black uppercase">
              {/* Ligne 1 : Totaux cumulés par jeu */}
              <tr className="bg-purple-100 border-b border-black">
                <th className="p-2 border-r border-black font-black">TOTAL JOUÉ</th>
                <th className="p-2 border-r border-black text-right font-black text-purple-950">
                  {gridData.totalPlayedHours}h
                </th>
                {gridData.gamesList.map((g) => (
                  <th key={g} className="p-2 border-r border-black text-right font-black text-purple-950 whitespace-nowrap min-w-[70px]">
                    {gridData.gameTotals[g] || "-"}
                  </th>
                ))}
              </tr>

              {/* Ligne 2 : Moyenne journalière par jeu */}
              <tr className="bg-purple-50 border-b-2 border-black">
                <th className="p-2 border-r border-black font-black">MOYENNE / JOUR</th>
                <th className="p-2 border-r border-black text-right font-bold text-gray-700">
                  {gridData.overallAvgHoursPerDay}h/j
                </th>
                {gridData.gamesList.map((g) => (
                  <th key={g} className="p-2 border-r border-black text-right font-bold text-gray-700 whitespace-nowrap min-w-[70px]">
                    {gridData.gameAverages[g] || "-"}
                  </th>
                ))}
              </tr>

              {/* Ligne 3 : Titres des colonnes */}
              <tr className="bg-yellow-300 border-b-2 border-black">
                <th className="p-2 border-r border-black min-w-[90px]">DATE</th>
                <th className="p-2 border-r border-black text-right min-w-[80px]">TOTAL JOUR</th>
                {gridData.gamesList.map((g) => (
                  <th key={g} className="p-2 border-r border-black text-right whitespace-nowrap min-w-[70px]">
                    🎮 {g}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-black/20">
              {displayedRows.map((row) => (
                <tr key={row.date} className="hover:bg-yellow-50 transition-colors">
                  <td className="p-2 border-r border-black/20 font-black">{row.date}</td>
                  <td className="p-2 border-r border-black/20 text-right font-black bg-purple-50/50">
                    {row.totalFormatted !== "-" ? (
                      <span className="font-bold text-purple-900">{row.totalFormatted}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  {gridData.gamesList.map((g) => {
                    const val = row.gameFormatted[g];
                    return (
                      <td key={g} className="p-2 border-r border-black/20 text-right">
                        {val ? (
                          <span className="font-black text-purple-950 bg-purple-100/70 px-1 py-0.2 border border-black/30">
                            {val}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
