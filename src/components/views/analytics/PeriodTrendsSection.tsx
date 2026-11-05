import React, { useState, useMemo } from "react";
import { WeekPeriodSummary, MonthPeriodSummary, PeriodTrendAnalysis } from "../../../lib/analyticsEngine";
import { PeriodBarChart, Sparkline } from "./AnalyticsCharts";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Calendar, Flame, Target } from "lucide-react";

interface PeriodTrendsSectionProps {
  weeks: WeekPeriodSummary[];
  months: MonthPeriodSummary[];
  periodTrends: PeriodTrendAnalysis;
}

export const PeriodTrendsSection: React.FC<PeriodTrendsSectionProps> = ({
  weeks,
  months,
  periodTrends,
}) => {
  const [granularity, setGranularity] = useState<"weeks" | "months">("weeks");
  const [filterQuery, setFilterQuery] = useState("");

  const currentPeriods = granularity === "weeks" ? weeks : months;

  const filteredPeriods = useMemo(() => {
    if (!filterQuery.trim()) return currentPeriods;
    const q = filterQuery.toLowerCase();
    return currentPeriods.filter((p) => p.label.toLowerCase().includes(q) || p.key.includes(q));
  }, [currentPeriods, filterQuery]);

  // Données de graphique formatées
  const chartItems = useMemo(() => {
    return currentPeriods.map((p) => ({
      key: p.key,
      label: p.label,
      workHours: p.workHours,
      leisureHours: p.leisureHours,
      gamingHours: p.gamingHours,
      netHours: p.netHours,
      deltaPct: p.workDeltaPctVsPrev,
    }));
  }, [currentPeriods]);

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Sélecteur de granularité & Filtre */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-2 bg-gray-50 p-2.5 border-2 shadow-[2px_2px_0px_#000]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black uppercase text-gray-700">Période :</span>
          <button
            type="button"
            onClick={() => setGranularity("weeks")}
            className={`px-3 py-1 text-xs font-black uppercase border-2 border-black cursor-pointer transition-all ${
              granularity === "weeks" ? "bg-indigo-600 text-white shadow-[1px_1px_0px_#000]" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Semaines ({weeks.length})
          </button>
          <button
            type="button"
            onClick={() => setGranularity("months")}
            className={`px-3 py-1 text-xs font-black uppercase border-2 border-black cursor-pointer transition-all ${
              granularity === "months" ? "bg-indigo-600 text-white shadow-[1px_1px_0px_#000]" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Mois ({months.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filtrer la période..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="px-2.5 py-1 text-xs font-bold border-2 border-black bg-white focus:outline-none focus:bg-yellow-50 w-44"
          />
        </div>
      </div>

      {/* Cartouche d'analyse algorithmique des tendances */}
      <div className="bg-yellow-50 border-3 border-black p-4 shadow-[3px_3px_0px_#000] space-y-3">
        <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
          <span className="text-xs font-black uppercase flex items-center gap-1.5">
            <TrendingUp size={16} className="text-indigo-700" />
            Analyse Algorithmique des Tendances
          </span>
          <span className="bg-yellow-300 border border-black px-2 py-0.5 text-[10px] font-black uppercase">
            Moyenne mobile 4 sem. : {periodTrends.fourWeekMovingAverageHours}h/sem
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* Tendance hebdo */}
          <div className="bg-white border-2 border-black p-2.5 space-y-1">
            <span className="text-[10px] font-black uppercase text-gray-600 block">Tendance Hebdo</span>
            <div className="flex items-center gap-1.5 font-black text-sm">
              {periodTrends.weeklyEffortSlope === "rising" ? (
                <>
                  <ArrowUpRight size={16} className="text-emerald-600" />
                  <span className="text-emerald-900">En hausse (+{periodTrends.weeklyEffortPctChange}%)</span>
                </>
              ) : periodTrends.weeklyEffortSlope === "declining" ? (
                <>
                  <ArrowDownRight size={16} className="text-rose-600" />
                  <span className="text-rose-900">En baisse ({periodTrends.weeklyEffortPctChange}%)</span>
                </>
              ) : (
                <>
                  <Minus size={16} className="text-gray-600" />
                  <span className="text-gray-900">Stable ({periodTrends.weeklyEffortPctChange}%)</span>
                </>
              )}
            </div>
            <span className="text-[9px] text-gray-500 block">Comparaison 4 sem. glissantes</span>
          </div>

          {/* Tendance mensuelle */}
          <div className="bg-white border-2 border-black p-2.5 space-y-1">
            <span className="text-[10px] font-black uppercase text-gray-600 block">Tendance Mensuelle</span>
            <div className="flex items-center gap-1.5 font-black text-sm">
              {periodTrends.monthlyEffortSlope === "rising" ? (
                <>
                  <ArrowUpRight size={16} className="text-emerald-600" />
                  <span className="text-emerald-900">En hausse (+{periodTrends.monthlyEffortPctChange}%)</span>
                </>
              ) : periodTrends.monthlyEffortSlope === "declining" ? (
                <>
                  <ArrowDownRight size={16} className="text-rose-600" />
                  <span className="text-rose-900">En baisse ({periodTrends.monthlyEffortPctChange}%)</span>
                </>
              ) : (
                <>
                  <Minus size={16} className="text-gray-600" />
                  <span className="text-gray-900">Stable ({periodTrends.monthlyEffortPctChange}%)</span>
                </>
              )}
            </div>
            <span className="text-[9px] text-gray-500 block">Trimestre glissant</span>
          </div>

          {/* Série de semaines actives */}
          <div className="bg-white border-2 border-black p-2.5 space-y-1">
            <span className="text-[10px] font-black uppercase text-gray-600 block">Régularité Série</span>
            <div className="flex items-center gap-1.5 font-black text-sm text-amber-900">
              <Flame size={16} className="text-amber-500 fill-amber-500" />
              <span>{periodTrends.streakActiveWeeks} sem. consécutives</span>
            </div>
            <span className="text-[9px] text-gray-500 block">Activité ininterrompue</span>
          </div>

          {/* Projection Mois en Cours */}
          <div className="bg-white border-2 border-black p-2.5 space-y-1">
            <span className="text-[10px] font-black uppercase text-gray-600 block">Projection Mois</span>
            <div className="flex items-center gap-1.5 font-black text-sm text-indigo-900">
              <Target size={16} className="text-indigo-600" />
              <span>~{periodTrends.currentMonthProjectedWorkHours}h estimées</span>
            </div>
            <span className="text-[9px] text-gray-500 block">Au rythme actuel</span>
          </div>
        </div>
      </div>

      {/* Graphique de Volume Périodique */}
      <PeriodBarChart
        items={chartItems}
        title={`Volume par ${granularity === "weeks" ? "Semaine" : "Mois"} (Travail vs Loisirs)`}
        maxItems={granularity === "weeks" ? 12 : 8}
      />

      {/* Grille des Résumés de Périodes (Cartes condensées) */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase block text-gray-700">
          Résumés Détaillés ({filteredPeriods.length} {granularity === "weeks" ? "semaines" : "mois"})
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredPeriods.map((p) => {
            const isPositiveNet = p.netHours >= 0;
            return (
              <div
                key={p.key}
                className="bg-white border-3 border-black p-3 shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] transition-all space-y-2"
              >
                {/* En-tête de la carte période */}
                <div className="flex items-center justify-between border-b border-black/20 pb-1.5">
                  <div className="font-black text-xs uppercase flex items-center gap-1.5">
                    <Calendar size={13} className="text-indigo-600" />
                    <span>{p.label}</span>
                  </div>
                  {p.workDeltaPctVsPrev !== undefined && (
                    <span
                      className={`text-[9px] px-1 py-0.2 border border-black font-black ${
                        p.workDeltaPctVsPrev >= 0 ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"
                      }`}
                    >
                      {p.workDeltaPctVsPrev >= 0 ? `+${p.workDeltaPctVsPrev}%` : `${p.workDeltaPctVsPrev}%`}
                    </span>
                  )}
                </div>

                {/* Métriques clés */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="bg-indigo-50 border border-black p-1.5">
                    <span className="text-[9px] text-indigo-900 font-bold block uppercase">Travail</span>
                    <span className="font-black text-indigo-950 text-sm">{p.workHours}h</span>
                  </div>
                  <div className="bg-purple-50 border border-black p-1.5">
                    <span className="text-[9px] text-purple-900 font-bold block uppercase">Loisirs</span>
                    <span className="font-black text-purple-950 text-sm">{p.leisureHours}h</span>
                  </div>
                  <div className={`border border-black p-1.5 ${isPositiveNet ? "bg-yellow-100" : "bg-rose-100"}`}>
                    <span className="text-[9px] font-bold block uppercase text-gray-700">Solde Net</span>
                    <span className={`font-black text-sm ${isPositiveNet ? "text-emerald-900" : "text-rose-900"}`}>
                      {isPositiveNet ? `+${p.netHours}h` : `${p.netHours}h`}
                    </span>
                  </div>
                </div>

                {/* Détails secondaires */}
                <div className="flex items-center justify-between text-[10px] text-gray-600 font-bold pt-1 border-t border-black/10">
                  <span>{p.activeDaysCount} jours actifs</span>
                  <span>Moy : {p.avgWorkHoursPerActiveDay}h/j</span>
                  {p.gamingHours > 0 && <span className="text-purple-700">Jeux : {p.gamingHours}h</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tableau Exhaustif de Comparaison */}
      <div className="overflow-x-auto border-3 border-black shadow-[3px_3px_0px_#000] bg-white mt-4">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="bg-yellow-300 border-b-2 border-black uppercase text-[10px] font-black">
              <th className="p-2.5 border-r border-black">Période</th>
              <th className="p-2.5 border-r border-black text-right">Travail</th>
              <th className="p-2.5 border-r border-black text-right">Loisirs</th>
              <th className="p-2.5 border-r border-black text-right">Jeux</th>
              <th className="p-2.5 border-r border-black text-right">Balance Nette</th>
              <th className="p-2.5 border-r border-black text-right">Jours Actifs</th>
              <th className="p-2.5 border-r border-black text-right">Moyenne/Jour</th>
              <th className="p-2.5 text-right">Évolution %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/20">
            {filteredPeriods.map((p) => (
              <tr key={p.key} className="hover:bg-yellow-50 transition-colors">
                <td className="p-2.5 border-r border-black/30 font-black">{p.label}</td>
                <td className="p-2.5 border-r border-black/30 text-right font-black text-indigo-900">{p.workHours}h</td>
                <td className="p-2.5 border-r border-black/30 text-right font-black text-purple-900">{p.leisureHours}h</td>
                <td className="p-2.5 border-r border-black/30 text-right font-black text-purple-700">
                  {p.gamingHours > 0 ? `${p.gamingHours}h` : "-"}
                </td>
                <td className="p-2.5 border-r border-black/30 text-right font-black">
                  <span className={`px-1.5 py-0.5 border border-black ${p.netHours >= 0 ? "bg-yellow-200" : "bg-rose-100 text-rose-900"}`}>
                    {p.netHours >= 0 ? `+${p.netHours}h` : `${p.netHours}h`}
                  </span>
                </td>
                <td className="p-2.5 border-r border-black/30 text-right">{p.activeDaysCount}j</td>
                <td className="p-2.5 border-r border-black/30 text-right font-bold">{p.avgWorkHoursPerActiveDay}h/j</td>
                <td className="p-2.5 text-right font-black">
                  {p.workDeltaPctVsPrev !== undefined ? (
                    <span
                      className={`px-1 py-0.2 border border-black text-[10px] ${
                        p.workDeltaPctVsPrev >= 0 ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"
                      }`}
                    >
                      {p.workDeltaPctVsPrev >= 0 ? `+${p.workDeltaPctVsPrev}%` : `${p.workDeltaPctVsPrev}%`}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
