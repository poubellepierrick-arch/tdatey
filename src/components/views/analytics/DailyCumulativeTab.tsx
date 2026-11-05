import React, { useState, useMemo } from "react";
import { DayTimeSummary } from "../../../lib/googleSheets";
import { CumulativeAreaChart } from "./AnalyticsCharts";
import { Search, ArrowUpDown, Calendar, Clock, Layers } from "lucide-react";

interface DailyCumulativeTabProps {
  dailySummaries: DayTimeSummary[];
}

export const DailyCumulativeTab: React.FC<DailyCumulativeTabProps> = ({ dailySummaries }) => {
  const [searchDate, setSearchDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [limit, setLimit] = useState<number>(50);

  // Filtrage et tri des résumés journaliers
  const filteredAndSortedDays = useMemo(() => {
    let list = [...dailySummaries];
    if (searchDate.trim()) {
      const q = searchDate.trim().toLowerCase();
      list = list.filter((d) => d.date.toLowerCase().includes(q));
    }
    if (sortOrder === "desc") {
      list.sort((a, b) => b.date.localeCompare(a.date));
    } else {
      list.sort((a, b) => a.date.localeCompare(b.date));
    }
    return list;
  }, [dailySummaries, searchDate, sortOrder]);

  const displayList = useMemo(() => {
    return limit === 0 ? filteredAndSortedDays : filteredAndSortedDays.slice(0, limit);
  }, [filteredAndSortedDays, limit]);

  // Données chronologiques pour le graphique
  const chartData = useMemo(() => {
    return [...dailySummaries].sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({
      date: d.date,
      cumulativeWorkHours: d.cumulativeWorkHours,
      cumulativeLeisureHours: d.cumulativeLeisureHours ?? 0,
      cumulativeNetHours: d.cumulativeNetHours ?? Number((d.cumulativeWorkHours - (d.cumulativeLeisureHours ?? 0)).toFixed(2)),
    }));
  }, [dailySummaries]);

  const latestDay = dailySummaries[dailySummaries.length - 1];

  return (
    <div className="space-y-4 font-mono select-none">
      {/* KPI Cartouches du Cumul */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-indigo-50 border-3 border-black p-3 shadow-[2px_2px_0px_#000]">
          <span className="text-[10px] font-black uppercase text-indigo-900 block">Cumul Travail Total</span>
          <div className="text-xl font-black text-indigo-950 mt-1">
            {latestDay?.cumulativeWorkHours || 0}h
          </div>
          <span className="text-[10px] text-gray-600 block mt-0.5">
            {latestDay?.cumulativeWorkMinutes || 0} minutes
          </span>
        </div>

        <div className="bg-purple-50 border-3 border-black p-3 shadow-[2px_2px_0px_#000]">
          <span className="text-[10px] font-black uppercase text-purple-900 block">Cumul Loisirs Total</span>
          <div className="text-xl font-black text-purple-950 mt-1">
            {latestDay?.cumulativeLeisureHours || 0}h
          </div>
          <span className="text-[10px] text-gray-600 block mt-0.5">
            {latestDay?.cumulativeLeisureMinutes || 0} minutes
          </span>
        </div>

        <div className="bg-yellow-50 border-3 border-black p-3 shadow-[2px_2px_0px_#000]">
          <span className="text-[10px] font-black uppercase text-yellow-900 block">Solde Net Cumulé</span>
          <div className={`text-xl font-black mt-1 ${(latestDay?.cumulativeNetHours || 0) >= 0 ? "text-emerald-900" : "text-rose-700"}`}>
            {(latestDay?.cumulativeNetHours || 0) >= 0 ? `+${latestDay?.cumulativeNetHours || 0}h` : `${latestDay?.cumulativeNetHours || 0}h`}
          </div>
          <span className="text-[10px] text-gray-600 block mt-0.5">
            Balance au fil de l'eau
          </span>
        </div>

        <div className="bg-emerald-50 border-3 border-black p-3 shadow-[2px_2px_0px_#000]">
          <span className="text-[10px] font-black uppercase text-emerald-900 block">Historique Suivi</span>
          <div className="text-xl font-black text-emerald-950 mt-1">
            {dailySummaries.length} jours
          </div>
          <span className="text-[10px] text-gray-600 block mt-0.5">
            Équivalent Feuille 2 Google Sheets
          </span>
        </div>
      </div>

      {/* Graphique de Cumul SVG */}
      <CumulativeAreaChart data={chartData} height={240} />

      {/* Barre de contrôles et filtres */}
      <div className="bg-white border-3 border-black p-3 shadow-[2px_2px_0px_#000] flex flex-col sm:flex-row gap-2 justify-between items-center">
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher par date (ex: 2026-09)..."
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border-2 border-black text-xs font-bold bg-white focus:outline-none focus:bg-yellow-50"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="px-2.5 py-1.5 border-2 border-black text-xs font-black uppercase bg-gray-100 hover:bg-gray-200 flex items-center gap-1 cursor-pointer"
          >
            <ArrowUpDown size={13} />
            <span>{sortOrder === "desc" ? "Plus récents d'abord" : "Chronologique"}</span>
          </button>

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-2 py-1.5 border-2 border-black text-xs font-black uppercase bg-white cursor-pointer"
          >
            <option value={30}>30 derniers jours</option>
            <option value={60}>60 derniers jours</option>
            <option value={100}>100 derniers jours</option>
            <option value={0}>Tous ({dailySummaries.length})</option>
          </select>
        </div>
      </div>

      {/* Tableau Chronologique Exhaustif (Fidèle à l'Onglet 2 Google Sheets) */}
      <div className="overflow-x-auto border-3 border-black shadow-[3px_3px_0px_#000] bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-yellow-300 border-b-2 border-black uppercase text-[10px] font-black">
              <th className="p-2.5 border-r border-black">Date</th>
              <th className="p-2.5 border-r border-black text-right">Travail (min)</th>
              <th className="p-2.5 border-r border-black text-right">Travail (h)</th>
              <th className="p-2.5 border-r border-black text-right">Loisirs (min)</th>
              <th className="p-2.5 border-r border-black text-right">Loisirs (h)</th>
              <th className="p-2.5 border-r border-black text-right">Balance Jour (h)</th>
              <th className="p-2.5 border-r border-black text-right">Cumul Travail (h)</th>
              <th className="p-2.5 border-r border-black text-right">Cumul Loisir (h)</th>
              <th className="p-2.5 border-r border-black text-right">Cumul Net (h)</th>
              <th className="p-2.5 text-right">Sessions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/20">
            {displayList.map((d) => (
              <tr key={d.date} className="hover:bg-yellow-50 transition-colors">
                <td className="p-2 border-r border-black/30 font-black">{d.date}</td>
                <td className="p-2 border-r border-black/30 text-right text-gray-600">{d.workMinutes}</td>
                <td className="p-2 border-r border-black/30 text-right font-black text-indigo-900">{d.workHours}h</td>
                <td className="p-2 border-r border-black/30 text-right text-gray-600">{d.leisureMinutes}</td>
                <td className="p-2 border-r border-black/30 text-right font-black text-purple-900">{d.leisureHours}h</td>
                <td className="p-2 border-r border-black/30 text-right font-black">
                  <span className={`px-1 py-0.2 border border-black ${d.netHours >= 0 ? "bg-yellow-200" : "bg-rose-100 text-rose-900"}`}>
                    {d.netHours >= 0 ? `+${d.netHours}h` : `${d.netHours}h`}
                  </span>
                </td>
                <td className="p-2 border-r border-black/30 text-right font-bold text-indigo-950">{d.cumulativeWorkHours}h</td>
                <td className="p-2 border-r border-black/30 text-right font-bold text-purple-950">{d.cumulativeLeisureHours || 0}h</td>
                <td className="p-2 border-r border-black/30 text-right font-black">
                  <span className={`px-1 py-0.2 border border-black ${(d.cumulativeNetHours ?? 0) >= 0 ? "bg-emerald-100 text-emerald-950" : "bg-rose-100 text-rose-950"}`}>
                    {(d.cumulativeNetHours ?? 0) >= 0 ? `+${d.cumulativeNetHours}h` : `${d.cumulativeNetHours}h`}
                  </span>
                </td>
                <td className="p-2 text-right font-bold">{d.itemsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
