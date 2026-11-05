import React, { useState, useMemo } from "react";
import { AppDatabase } from "../../types";
import { computeCompleteAnalytics, CompleteAnalyticsData } from "../../lib/analyticsEngine";
import GoogleSheetsExportButton from "../dashboard/GoogleSheetsExportButton";
import { PeriodTrendsSection } from "./analytics/PeriodTrendsSection";
import { DailyCumulativeTab } from "./analytics/DailyCumulativeTab";
import { ArchiveJeuxGrid } from "./analytics/ArchiveJeuxGrid";
import { PeriodBarChart, BreakdownChart } from "./analytics/AnalyticsCharts";
import { 
  BarChart3, Calendar, Clock, TrendingUp, Sparkles, Gamepad2, Tag, 
  Search, Briefcase, Tv, Scale, Check, Layers
} from "lucide-react";

interface AnalyticsViewProps {
  db: AppDatabase;
  updateDb?: (newDb: AppDatabase) => void;
}

type AnalyticsTab = "overview" | "periods" | "cumulative" | "items_tags" | "gaming" | "logs";

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ db }) => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState<string>("all");

  // Analyse IA
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDiagnostic, setAiDiagnostic] = useState<{
    diagnosticRythme: string;
    diagnosticLoisirsJeux: string;
    recommandations: string[];
    source?: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Calculs algorithmiques complets mémorisés
  const analytics: CompleteAnalyticsData = useMemo(() => {
    return computeCompleteAnalytics(db);
  }, [db]);

  const { baseData, weeks, months, daysOfWeek, gaming, algorithmicInsights, periodTrends, archiveJeuxGrid } = analytics;

  // Déclenchement de l'analyse IA
  const handleTriggerAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const payload = {
        summary: {
          totalWorkHours: baseData.totalWorkHours,
          totalWorkMinutes: baseData.totalWorkMinutes,
          totalLeisureHours: baseData.totalLeisureHours,
          netHours: baseData.netHours,
          avgWorkHoursPerDay: baseData.avgWorkHoursPerDay,
          uniqueDaysCount: baseData.uniqueDaysCount,
          totalLogsCount: baseData.allLogs.length,
        },
        recentWeeks: weeks.slice(0, 6).map((w) => ({
          label: w.label,
          workHours: w.workHours,
          leisureHours: w.leisureHours,
          deltaPct: w.workDeltaPctVsPrev,
        })),
        recentMonths: months.slice(0, 4).map((m) => ({
          label: m.label,
          workHours: m.workHours,
          leisureHours: m.leisureHours,
          deltaPct: m.workDeltaPctVsPrev,
        })),
        gamingStats: {
          authorizedHours: gaming.authorizedHours,
          totalPlayedHours: gaming.totalPlayedHours,
          remainingHours: gaming.remainingHours,
          dailyAvgHours: gaming.dailyAvgHours,
        },
      };

      const res = await fetch("/api/analytics/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Erreur serveur (${res.status})`);
      }

      const data = await res.json();
      setAiDiagnostic(data);
    } catch (err: any) {
      console.warn("Échec requête analyse IA, bascule sur diagnostic algorithmique local :", err);
      // Diagnostic algorithmique local de secours immédiat
      const avgWork = baseData.avgWorkHoursPerDay;
      const isDeficit = gaming.isDeficit;
      setAiDiagnostic({
        source: "algorithmic",
        diagnosticRythme: avgWork >= 4
          ? `Rythme de travail soutenu (${avgWork}h/j sur ${baseData.uniqueDaysCount} jours actifs). Excellente consistance globale.`
          : `Rythme de travail modéré (${avgWork}h/j). Équilibre stable avec capacité d'accélération sur les jours pivots.`,
        diagnosticLoisirsJeux: isDeficit
          ? `Déficit de ${Math.abs(gaming.remainingHours)}h sur le quota de jeux vidéo (cible 1h/j).`
          : `Quota d'1h/j respecté avec une réserve positive de +${gaming.remainingHours}h disponible.`,
        recommandations: [
          "Maintenir des blocs de travail focalisés de 45 à 90 minutes.",
          isDeficit ? "Stabiliser le temps de jeu quotidien sous la barre d'1h." : "Conserver la régularité actuelle de vos sessions."
        ]
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Filtrage des logs pour l'onglet Journal
  const filteredLogs = useMemo(() => {
    return baseData.allLogs.filter((log) => {
      if (logTypeFilter !== "all" && log.itemType !== logTypeFilter) {
        return false;
      }
      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase();
        const matchTitle = log.itemTitle.toLowerCase().includes(q);
        const matchTag = log.tags.some((t) => t.toLowerCase().includes(q));
        const matchDate = log.date.includes(q);
        return matchTitle || matchTag || matchDate;
      }
      return true;
    });
  }, [baseData.allLogs, logTypeFilter, logSearchQuery]);

  // Données pour graphiques de synthèse
  const overviewBarItems = useMemo(() => {
    return weeks.slice(0, 8).map((w) => ({
      key: w.key,
      label: w.label,
      workHours: w.workHours,
      leisureHours: w.leisureHours,
      gamingHours: w.gamingHours,
      netHours: w.netHours,
      deltaPct: w.workDeltaPctVsPrev,
    }));
  }, [weeks]);

  const typeBreakdownItems = useMemo(() => {
    return baseData.typeSummaries.map((ts) => ({
      label: ts.typeLabel,
      hours: ts.totalHours,
      percentage: ts.percentageOfTotal,
    }));
  }, [baseData.typeSummaries]);

  const tagBreakdownItems = useMemo(() => {
    return baseData.tagSummaries.slice(0, 6).map((tag) => ({
      label: `#${tag.tag}`,
      hours: tag.totalHours,
      percentage: tag.percentageOfTotal,
    }));
  }, [baseData.tagSummaries]);

  return (
    <div className="font-mono text-black space-y-5 max-w-6xl mx-auto pb-12 select-none">
      {/* En-tête principal & Export */}
      <div className="bg-white border-4 border-black p-4 sm:p-5 shadow-[5px_5px_0px_#000] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="text-indigo-600 stroke-[2.5]" size={24} />
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              Analyses & Données Intégrées
            </h1>
          </div>
          <p className="text-xs text-gray-600 font-bold mt-0.5">
            Équivalent complet du classeur Google Sheets • Moteur algorithmique temps réel
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleTriggerAiAnalysis}
            disabled={isAiLoading}
            className={`border-2 border-black py-1.5 px-3 text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000] transition-colors ${
              isAiLoading
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-purple-300 hover:bg-purple-400 text-black"
            }`}
          >
            <Sparkles size={14} className={isAiLoading ? "animate-spin" : ""} />
            <span>{isAiLoading ? "Analyse en cours..." : "Analyse IA"}</span>
          </button>
          <GoogleSheetsExportButton db={db} variant="compact" />
        </div>
      </div>

      {/* Barre de navigation des 6 sous-onglets analytiques */}
      <div className="flex flex-wrap gap-1.5 bg-gray-100 border-2 border-black p-1.5 shadow-[2px_2px_0px_#000]">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex-1 min-w-[120px] py-2 px-2 text-xs font-black uppercase border-2 border-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
            activeTab === "overview"
              ? "bg-yellow-300 text-black shadow-[2px_2px_0px_#000]"
              : "bg-white hover:bg-yellow-50 text-gray-700"
          }`}
        >
          <TrendingUp size={14} />
          <span>Synthèse</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("periods")}
          className={`flex-1 min-w-[120px] py-2 px-2 text-xs font-black uppercase border-2 border-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
            activeTab === "periods"
              ? "bg-indigo-600 text-white shadow-[2px_2px_0px_#000]"
              : "bg-white hover:bg-indigo-50 text-gray-700"
          }`}
        >
          <Calendar size={14} />
          <span>Semaines & Mois</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cumulative")}
          className={`flex-1 min-w-[120px] py-2 px-2 text-xs font-black uppercase border-2 border-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
            activeTab === "cumulative"
              ? "bg-emerald-400 text-black shadow-[2px_2px_0px_#000]"
              : "bg-white hover:bg-emerald-50 text-gray-700"
          }`}
        >
          <Layers size={14} />
          <span>Logs & Cumul ({baseData.dailySummaries.length}j)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("items_tags")}
          className={`flex-1 min-w-[120px] py-2 px-2 text-xs font-black uppercase border-2 border-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
            activeTab === "items_tags"
              ? "bg-sky-300 text-black shadow-[2px_2px_0px_#000]"
              : "bg-white hover:bg-sky-50 text-gray-700"
          }`}
        >
          <Tag size={14} />
          <span>Tâches & Tags</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gaming")}
          className={`flex-1 min-w-[120px] py-2 px-2 text-xs font-black uppercase border-2 border-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
            activeTab === "gaming"
              ? "bg-purple-400 text-black shadow-[2px_2px_0px_#000]"
              : "bg-white hover:bg-purple-50 text-gray-700"
          }`}
        >
          <Gamepad2 size={14} />
          <span>Archive Jeux ({gaming.totalPlayedHours}h)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`flex-1 min-w-[120px] py-2 px-2 text-xs font-black uppercase border-2 border-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
            activeTab === "logs"
              ? "bg-black text-white shadow-[2px_2px_0px_#000]"
              : "bg-white hover:bg-gray-100 text-gray-700"
          }`}
        >
          <Clock size={14} />
          <span>Journal ({baseData.allLogs.length})</span>
        </button>
      </div>

      {/* Encart Diagnostic IA (si généré ou en erreur) */}
      {aiDiagnostic && (
        <div className="bg-purple-50 border-4 border-black p-4 shadow-[4px_4px_0px_#000] space-y-2 relative">
          <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-700" size={16} />
              <span className="text-xs font-black uppercase text-purple-950">
                Diagnostic Analytique {aiDiagnostic.source === "gemini" ? "IA (Gemini)" : "Algorithmique Intégré"}
              </span>
            </div>
            <button
              onClick={() => setAiDiagnostic(null)}
              className="text-[10px] font-black uppercase text-gray-500 hover:text-black hover:underline cursor-pointer"
            >
              Fermer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="bg-white border-2 border-black p-2.5 space-y-1">
              <span className="text-[10px] font-black uppercase text-indigo-900 block">
                Rythme & Régularité
              </span>
              <p className="text-gray-800 leading-snug">{aiDiagnostic.diagnosticRythme}</p>
            </div>

            <div className="bg-white border-2 border-black p-2.5 space-y-1">
              <span className="text-[10px] font-black uppercase text-purple-900 block">
                Équilibre Loisirs & Jeux
              </span>
              <p className="text-gray-800 leading-snug">{aiDiagnostic.diagnosticLoisirsJeux}</p>
            </div>
          </div>

          {aiDiagnostic.recommandations && aiDiagnostic.recommandations.length > 0 && (
            <div className="bg-white border-2 border-black p-2.5 text-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-900 block">
                Recommandations d'Action
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-gray-800">
                {aiDiagnostic.recommandations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {aiError && (
        <div className="bg-rose-100 border-2 border-black p-2.5 text-xs text-rose-900 font-bold flex items-center justify-between">
          <span>{aiError}</span>
          <button onClick={() => setAiError(null)} className="underline cursor-pointer">Fermer</button>
        </div>
      )}

      {/* CONTENU SELON L'ONGLET SÉLECTIONNÉ */}

      {/* 1. SYNTHÈSE & TENDANCES GLOBALES */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Cartouches KPI globaux */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-indigo-50 border-3 border-black p-3 shadow-[2px_2px_0px_#000]">
              <div className="flex items-center justify-between text-indigo-800">
                <span className="text-[10px] font-black uppercase">Travail Total</span>
                <Briefcase size={14} />
              </div>
              <div className="text-lg sm:text-xl font-black text-indigo-950 mt-1">
                {baseData.totalWorkHours}h
              </div>
              <span className="text-[10px] text-gray-600 block mt-0.5">
                {baseData.totalWorkMinutes} min
              </span>
            </div>

            <div className="bg-purple-50 border-3 border-black p-3 shadow-[2px_2px_0px_#000]">
              <div className="flex items-center justify-between text-purple-800">
                <span className="text-[10px] font-black uppercase">Loisirs Totaux</span>
                <Tv size={14} />
              </div>
              <div className="text-lg sm:text-xl font-black text-purple-950 mt-1">
                {baseData.totalLeisureHours}h
              </div>
              <span className="text-[10px] text-gray-600 block mt-0.5">
                {baseData.totalLeisureMinutes} min
              </span>
            </div>

            <div className="bg-yellow-50 border-3 border-black p-3 shadow-[2px_2px_0px_#000]">
              <div className="flex items-center justify-between text-yellow-800">
                <span className="text-[10px] font-black uppercase">Balance Nette</span>
                <Scale size={14} />
              </div>
              <div className={`text-lg sm:text-xl font-black mt-1 ${baseData.netHours >= 0 ? "text-emerald-900" : "text-rose-700"}`}>
                {baseData.netHours >= 0 ? `+${baseData.netHours}h` : `${baseData.netHours}h`}
              </div>
              <span className="text-[10px] text-gray-600 block mt-0.5">
                Ratio {algorithmicInsights.workLeisureRatio}x
              </span>
            </div>

            <div className="bg-emerald-50 border-3 border-black p-3 shadow-[2px_2px_0px_#000]">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-[10px] font-black uppercase">Moyenne / Jour</span>
                <TrendingUp size={14} />
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-950 mt-1">
                {baseData.avgWorkHoursPerDay}h/j
              </div>
              <span className="text-[10px] text-gray-600 block mt-0.5">
                {baseData.uniqueDaysCount} jours actifs
              </span>
            </div>
          </div>

          {/* Points saillants algorithmiques intégrés */}
          <div className="bg-white border-3 border-black p-4 shadow-[3px_3px_0px_#000] space-y-2">
            <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
              <span className="text-xs font-black uppercase flex items-center gap-1.5">
                <span>⚡</span> Analyse Algorithmique du Rythme & Consistance
              </span>
              <span className="bg-yellow-300 border border-black px-2 py-0.5 text-[10px] font-black uppercase">
                Consistance : {algorithmicInsights.consistencyScorePct}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              {algorithmicInsights.highlights.map((h, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-gray-50 border border-black p-2">
                  <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-gray-800 leading-snug">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Graphique des semaines récentes */}
          <PeriodBarChart
            items={overviewBarItems}
            title="Volume des 8 Semaines Récentes (Travail vs Loisirs)"
            maxItems={8}
          />

          {/* Répartitions visuelles en grille */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BreakdownChart title="Répartition par Type d'Activité" items={typeBreakdownItems} />
            <BreakdownChart title="Répartition par Tag (Top 6)" items={tagBreakdownItems} />
          </div>

          {/* Graphique de distribution par jour de la semaine */}
          <div className="bg-white border-3 border-black p-4 shadow-[3px_3px_0px_#000] space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
              <span className="text-xs font-black uppercase">
                Distribution Hebdomadaire (Temps moyen travaillé par jour)
              </span>
              <span className="text-[10px] font-bold text-gray-600">
                Jour pivot : {algorithmicInsights.peakDayName}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {daysOfWeek.map((day) => {
                const maxAvg = Math.max(...daysOfWeek.map((d) => d.avgWorkMinutes), 1);
                const barHeightPct = Math.round((day.avgWorkMinutes / maxAvg) * 100);
                const isPeak = day.dayName === algorithmicInsights.peakDayName;

                return (
                  <div
                    key={day.dayIndex}
                    className={`border-2 border-black p-2 flex flex-col justify-between items-center text-center ${
                      isPeak ? "bg-yellow-100 shadow-[2px_2px_0px_#000]" : "bg-white"
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase text-gray-700">
                      {day.dayName.slice(0, 3)}
                    </span>

                    <div className="w-full h-24 flex items-end justify-center my-2">
                      <div
                        style={{ height: `${Math.max(6, barHeightPct)}%` }}
                        className={`w-full max-w-[28px] border-2 border-black transition-all ${
                          isPeak ? "bg-yellow-400" : "bg-indigo-400"
                        }`}
                        title={`${day.dayName} : ${day.avgWorkHours}h en moyenne (${day.occurrences} jours)`}
                      />
                    </div>

                    <div className="text-[10px] font-black">
                      {day.avgWorkHours}h
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. SEMAINES & MOIS (Analyses de tendances & résumés de périodes) */}
      {activeTab === "periods" && (
        <PeriodTrendsSection
          weeks={weeks}
          months={months}
          periodTrends={periodTrends}
        />
      )}

      {/* 3. LOGS QUOTIDIENS & CUMUL (Exact équivalent Feuille 2 Google Sheets) */}
      {activeTab === "cumulative" && (
        <DailyCumulativeTab dailySummaries={baseData.dailySummaries} />
      )}

      {/* 4. TÂCHES & TAGS (Exact équivalent Feuille 3 Google Sheets) */}
      {activeTab === "items_tags" && (
        <div className="space-y-5">
          {/* Répartitions Type & Tag */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BreakdownChart title="Répartition par Type" items={typeBreakdownItems} />
            <BreakdownChart title="Répartition par Tag" items={tagBreakdownItems} />
          </div>

          {/* Tableau Par Tâche (réplique feuille 'Par Tâche') */}
          <div className="bg-white border-3 border-black shadow-[3px_3px_0px_#000] overflow-hidden">
            <div className="p-3 bg-gray-100 border-b-2 border-black flex items-center justify-between">
              <span className="text-xs font-black uppercase">
                Temps par Tâche & Élément ({baseData.itemSummaries.length})
              </span>
              <span className="text-[10px] text-gray-600 font-bold">Trié par temps total décroissant</span>
            </div>

            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-yellow-300 border-b-2 border-black text-[10px] font-black uppercase">
                  <tr>
                    <th className="p-2 border-r border-black">Titre</th>
                    <th className="p-2 border-r border-black">Type</th>
                    <th className="p-2 border-r border-black">Tags</th>
                    <th className="p-2 border-r border-black text-right">Total (h)</th>
                    <th className="p-2 border-r border-black text-right">Jours Actifs</th>
                    <th className="p-2 border-r border-black text-right">Moy/Jour (h)</th>
                    <th className="p-2 text-right">% Travail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/20">
                  {baseData.itemSummaries.map((it) => (
                    <tr key={`${it.typeLabel}-${it.title}`} className="hover:bg-yellow-50 transition-colors">
                      <td className="p-2 border-r border-black/20 font-black">{it.title}</td>
                      <td className="p-2 border-r border-black/20">
                        <span className="text-[10px] px-1 py-0.2 bg-gray-100 border border-black font-bold">
                          {it.typeLabel}
                        </span>
                      </td>
                      <td className="p-2 border-r border-black/20 text-[10px] text-gray-600">
                        {it.tags.join(", ") || "-"}
                      </td>
                      <td className="p-2 border-r border-black/20 text-right font-black text-indigo-900">
                        {it.totalHours}h
                      </td>
                      <td className="p-2 border-r border-black/20 text-right">{it.activeDaysCount}j</td>
                      <td className="p-2 border-r border-black/20 text-right font-bold">
                        {it.avgHoursPerActiveDay}h
                      </td>
                      <td className="p-2 text-right font-black text-emerald-900">
                        {it.percentageOfTotalWork}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. ARCHIVE JEUX VIDÉO (Exact équivalent Feuille 5 Google Sheets) */}
      {activeTab === "gaming" && (
        <ArchiveJeuxGrid gridData={archiveJeuxGrid} />
      )}

      {/* 6. JOURNAL EXHAUSTIF (Exact équivalent Feuille 4 Google Sheets) */}
      {activeTab === "logs" && (
        <div className="space-y-3">
          {/* Barre de filtres et recherche */}
          <div className="bg-white border-3 border-black p-3 shadow-[2px_2px_0px_#000] flex flex-col sm:flex-row gap-2 justify-between items-center">
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher par titre, tag ou date..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border-2 border-black text-xs font-bold bg-white focus:outline-none focus:bg-yellow-50"
              />
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <span className="text-[10px] font-black uppercase text-gray-500">Filtrer :</span>
              {["all", "task", "habit", "reward"].map((typeKey) => (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setLogTypeFilter(typeKey)}
                  className={`px-2 py-1 text-[10px] font-black uppercase border border-black cursor-pointer ${
                    logTypeFilter === typeKey ? "bg-yellow-300 text-black shadow-[1px_1px_0px_#000]" : "bg-white text-gray-700"
                  }`}
                >
                  {typeKey === "all" ? "Tous" : typeKey === "task" ? "Tâches" : typeKey === "habit" ? "Habitudes" : "Loisirs"}
                </button>
              ))}
            </div>
          </div>

          {/* Tableau exhaustif */}
          <div className="bg-white border-3 border-black shadow-[3px_3px_0px_#000] overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-yellow-300 border-b-2 border-black text-[10px] font-black uppercase">
                  <tr>
                    <th className="p-2 border-r border-black">Date</th>
                    <th className="p-2 border-r border-black">Titre</th>
                    <th className="p-2 border-r border-black">Type</th>
                    <th className="p-2 border-r border-black">Tags</th>
                    <th className="p-2 border-r border-black text-right">Durée (min)</th>
                    <th className="p-2 border-r border-black text-right">Durée (h)</th>
                    <th className="p-2 text-right">Variation CS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/20">
                  {filteredLogs.map((log, idx) => (
                    <tr key={`${log.date}-${log.itemId}-${idx}`} className="hover:bg-yellow-50 transition-colors">
                      <td className="p-2 border-r border-black/20 font-bold font-mono">{log.date}</td>
                      <td className="p-2 border-r border-black/20 font-black">{log.itemTitle}</td>
                      <td className="p-2 border-r border-black/20">
                        <span className={`text-[9px] px-1 py-0.2 border border-black font-black uppercase ${
                          log.itemTypeLabel === "Tâche"
                            ? "bg-blue-100 text-blue-900"
                            : log.itemTypeLabel === "Habitude"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-purple-100 text-purple-900"
                        }`}>
                          {log.itemTypeLabel}
                        </span>
                      </td>
                      <td className="p-2 border-r border-black/20 text-[10px] text-gray-600">
                        {log.tags.join(", ") || "-"}
                      </td>
                      <td className="p-2 border-r border-black/20 text-right font-mono">{log.minutes} min</td>
                      <td className="p-2 border-r border-black/20 text-right font-black text-indigo-950 font-mono">
                        {log.hours}h
                      </td>
                      <td className="p-2 text-right font-black">
                        <span className={log.coinsDelta && log.coinsDelta > 0 ? "text-emerald-700" : log.coinsDelta && log.coinsDelta < 0 ? "text-rose-700" : "text-gray-500"}>
                          {log.coinsDelta && log.coinsDelta > 0 ? `+${log.coinsDelta}` : log.coinsDelta || 0} CS
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
