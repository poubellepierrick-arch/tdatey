import React, { useState, useMemo } from "react";
import { AppDatabase } from "../../types";
import { computeDayAccomplishments, AccomplishedItem } from "../views/DailyAccomplishmentsHistory";
import { Coins, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Scale, Layers } from "lucide-react";

export type Granularity = "day" | "week" | "month" | "year";
export type DisplayMode = "bars" | "net_line" | "cumulative";

interface CoinsHistoryChartProps {
  db: AppDatabase;
  defaultPeriod?: string;
}

interface AggregatedUnit {
  key: string;
  shortLabel: string;
  fullLabel: string;
  dateStart: string;
  dateEnd: string;
  gains: number;
  expenses: number;
  net: number;
  cumulative: number;
  itemsCount: number;
  daysCount: number;
  items: AccomplishedItem[];
}

function getWeekInfo(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const monStr = monday.toISOString().split("T")[0];
  const sunStr = sunday.toISOString().split("T")[0];

  const target = new Date(monday.valueOf());
  const dayNr = (monday.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);

  const monParts = monStr.split("-");
  const sunParts = sunStr.split("-");

  return {
    key: `W-${monStr}`,
    shortLabel: `S${weekNum}`,
    fullLabel: `Semaine ${weekNum} (${monParts[2]}/${monParts[1]} au ${sunParts[2]}/${sunParts[1]}/${sunParts[0]})`,
    dateStart: monStr,
    dateEnd: sunStr,
  };
}

function getMonthInfo(dateStr: string) {
  const [year, month] = dateStr.split("-");
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  const shortMonthNames = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
  ];
  const mIndex = parseInt(month, 10) - 1;
  const monthName = monthNames[mIndex] || month;
  const shortMonth = shortMonthNames[mIndex] || month;
  const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();

  return {
    key: `M-${year}-${month}`,
    shortLabel: `${shortMonth} ${year.slice(2)}`,
    fullLabel: `${monthName} ${year}`,
    dateStart: `${year}-${month}-01`,
    dateEnd: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function getYearInfo(dateStr: string) {
  const year = dateStr.split("-")[0];
  return {
    key: `Y-${year}`,
    shortLabel: year,
    fullLabel: `Année ${year}`,
    dateStart: `${year}-01-01`,
    dateEnd: `${year}-12-31`,
  };
}

export default function CoinsHistoryChart({ db, defaultPeriod = "14d" }: CoinsHistoryChartProps) {
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [periodPreset, setPeriodPreset] = useState<string>(defaultPeriod);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("bars");
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const todayStr = useMemo(() => {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
  }, []);

  // 1. Extraire l'ensemble exhaustif des dates avec activité financière CS
  const rawDailyData = useMemo(() => {
    const datesSet = new Set<string>();
    datesSet.add(todayStr);

    (db.tasks || []).forEach((t) => {
      if (t.completedAt) datesSet.add(t.completedAt.split("T")[0]);
      if (t.workHistory) Object.keys(t.workHistory).forEach((d) => datesSet.add(d));
      if (t.timeLog) t.timeLog.forEach((log) => log.date && datesSet.add(log.date.split("T")[0]));
    });

    (db.habits || []).forEach((h) => {
      if (h.history) Object.keys(h.history).forEach((d) => datesSet.add(d));
      if (h.workHistory) Object.keys(h.workHistory).forEach((d) => datesSet.add(d));
      if (h.lastCompletedDate) datesSet.add(h.lastCompletedDate);
    });

    (db.recurringTasks || []).forEach((rt) => {
      if (rt.history) Object.keys(rt.history).forEach((d) => datesSet.add(d));
      if (rt.workHistory) Object.keys(rt.workHistory).forEach((d) => datesSet.add(d));
    });

    (db.rewards || []).forEach((r) => {
      if (r.purchaseHistory) r.purchaseHistory.forEach((p) => p.date && datesSet.add(p.date.split("T")[0]));
      if (r.timeLog) r.timeLog.forEach((log) => log.date && datesSet.add(log.date.split("T")[0]));
    });

    (db.sleepWakeLogs || []).forEach((l) => {
      if (l.date) datesSet.add(l.date);
    });

    const sortedDates = Array.from(datesSet).sort((a, b) => a.localeCompare(b));

    // Si on a moins de 7 dates, combler les jours pour la continuité visuelle
    let fullDates = [...sortedDates];
    if (sortedDates.length > 0) {
      const minDate = new Date(sortedDates[0]);
      const maxDate = new Date(todayStr);
      const diffDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24));
      
      if (diffDays >= 1 && diffDays <= 60) {
        const fullList: string[] = [];
        const cur = new Date(minDate);
        while (cur <= maxDate) {
          fullList.push(cur.toISOString().split("T")[0]);
          cur.setDate(cur.getDate() + 1);
        }
        fullDates = fullList;
      }
    }

    return fullDates.map((dateStr) => {
      const items = computeDayAccomplishments(db, dateStr);
      let gains = 0;
      let expenses = 0;

      items.forEach((item) => {
        if (item.coinsDelta > 0) {
          gains += item.coinsDelta;
        } else if (item.coinsDelta < 0) {
          expenses += Math.abs(item.coinsDelta);
        }
      });

      const net = gains - expenses;
      const parts = dateStr.split("-");
      const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;

      return {
        date: dateStr,
        formattedDate: formatted,
        gains,
        expenses,
        net,
        items,
      };
    });
  }, [db, todayStr]);

  // 2. Agréger selon la granularité sélectionnée (Jours, Semaines, Mois, Ans)
  const aggregatedUnits = useMemo<AggregatedUnit[]>(() => {
    if (rawDailyData.length === 0) return [];

    if (granularity === "day") {
      let runningCumulative = 0;
      return rawDailyData.map((d) => {
        runningCumulative += d.net;
        const [y, m, day] = d.date.split("-");
        return {
          key: d.date,
          shortLabel: d.formattedDate,
          fullLabel: `${day}/${m}/${y}`,
          dateStart: d.date,
          dateEnd: d.date,
          gains: d.gains,
          expenses: d.expenses,
          net: d.net,
          cumulative: runningCumulative,
          itemsCount: d.items.length,
          daysCount: 1,
          items: d.items,
        };
      });
    }

    // Regroupement par semaine, mois ou an
    const map = new Map<string, {
      key: string;
      shortLabel: string;
      fullLabel: string;
      dateStart: string;
      dateEnd: string;
      gains: number;
      expenses: number;
      net: number;
      itemsCount: number;
      daysCount: number;
      items: AccomplishedItem[];
    }>();

    rawDailyData.forEach((d) => {
      let info: { key: string; shortLabel: string; fullLabel: string; dateStart: string; dateEnd: string };
      if (granularity === "week") {
        info = getWeekInfo(d.date);
      } else if (granularity === "month") {
        info = getMonthInfo(d.date);
      } else {
        info = getYearInfo(d.date);
      }

      const existing = map.get(info.key);
      if (!existing) {
        map.set(info.key, {
          key: info.key,
          shortLabel: info.shortLabel,
          fullLabel: info.fullLabel,
          dateStart: info.dateStart,
          dateEnd: info.dateEnd,
          gains: d.gains,
          expenses: d.expenses,
          net: d.net,
          itemsCount: d.items.length,
          daysCount: 1,
          items: [...d.items],
        });
      } else {
        existing.gains += d.gains;
        existing.expenses += d.expenses;
        existing.net += d.net;
        existing.itemsCount += d.items.length;
        existing.daysCount += 1;
        existing.items.push(...d.items);
      }
    });

    // Trier par dateStart chronologiquement et calculer le cumulatif
    const sorted = Array.from(map.values()).sort((a, b) => a.dateStart.localeCompare(b.dateStart));
    let runningCum = 0;

    return sorted.map((u) => {
      runningCum += u.net;
      return {
        ...u,
        cumulative: runningCum,
      };
    });
  }, [rawDailyData, granularity]);

  // 3. Filtrer selon la plage de temps
  const filteredUnits = useMemo(() => {
    if (aggregatedUnits.length === 0) return [];
    if (periodPreset === "all") return aggregatedUnits;

    let count = 14;
    if (granularity === "day") {
      count = periodPreset === "7d" ? 7 : periodPreset === "14d" ? 14 : periodPreset === "30d" ? 30 : aggregatedUnits.length;
    } else if (granularity === "week") {
      count = periodPreset === "4w" ? 4 : periodPreset === "8w" ? 8 : periodPreset === "16w" ? 16 : aggregatedUnits.length;
    } else if (granularity === "month") {
      count = periodPreset === "3m" ? 3 : periodPreset === "6m" ? 6 : periodPreset === "12m" ? 12 : aggregatedUnits.length;
    } else {
      count = aggregatedUnits.length;
    }

    return aggregatedUnits.slice(-count);
  }, [aggregatedUnits, granularity, periodPreset]);

  // 4. Statistiques globales
  const stats = useMemo(() => {
    let totalGains = 0;
    let totalExpenses = 0;
    let maxGains = 0;
    let maxExpenses = 0;
    let maxAbsNet = 0;

    filteredUnits.forEach((u) => {
      totalGains += u.gains;
      totalExpenses += u.expenses;
      if (u.gains > maxGains) maxGains = u.gains;
      if (u.expenses > maxExpenses) maxExpenses = u.expenses;
      if (Math.abs(u.net) > maxAbsNet) maxAbsNet = Math.abs(u.net);
    });

    const netBalance = totalGains - totalExpenses;
    const avgPerUnit = filteredUnits.length > 0 ? Math.round(netBalance / filteredUnits.length) : 0;

    const unitSuffix =
      granularity === "day"
        ? "CS/j"
        : granularity === "week"
        ? "CS/sem"
        : granularity === "month"
        ? "CS/mois"
        : "CS/an";

    return {
      totalGains,
      totalExpenses,
      netBalance,
      avgPerUnit,
      unitSuffix,
      maxGains,
      maxExpenses,
      maxAbsNet,
      count: filteredUnits.length,
    };
  }, [filteredUnits, granularity]);

  // 5. Dimensions SVG
  const svgWidth = 640;
  const svgHeight = 230;
  const padding = { top: 25, right: 30, bottom: 40, left: 55 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  // 6. Bornes axe Y
  const { yMin, yMax, zeroY, yTicks } = useMemo(() => {
    if (filteredUnits.length === 0) {
      return { yMin: 0, yMax: 50, zeroY: padding.top + graphHeight, yTicks: [0, 25, 50] };
    }

    let min = 0;
    let max = 0;

    if (displayMode === "cumulative") {
      const cumValues = filteredUnits.map((d) => d.cumulative);
      min = Math.min(0, ...cumValues);
      max = Math.max(10, ...cumValues);
    } else {
      const maxVal = Math.max(stats.maxGains, stats.maxExpenses, stats.maxAbsNet, 20);
      max = Math.ceil(maxVal / 10) * 10;
      min = -max;
    }

    const ticksCount = 5;
    const step = (max - min) / (ticksCount - 1);
    const ticks: number[] = [];
    for (let i = 0; i < ticksCount; i++) {
      ticks.push(Math.round(min + i * step));
    }

    const range = max - min || 1;
    const zRatio = (0 - min) / range;
    const zY = padding.top + (1 - zRatio) * graphHeight;

    return { yMin: min, yMax: max, zeroY: zY, yTicks: ticks };
  }, [filteredUnits, displayMode, stats, graphHeight]);

  const getY = (val: number): number => {
    if (yMax === yMin) return padding.top + graphHeight / 2;
    const ratio = (val - yMin) / (yMax - yMin);
    return padding.top + (1 - ratio) * graphHeight;
  };

  const getX = (index: number, total: number): number => {
    if (total <= 1) return padding.left + graphWidth / 2;
    return padding.left + (index / (total - 1)) * graphWidth;
  };

  const barWidth = useMemo(() => {
    if (filteredUnits.length === 0) return 10;
    const available = graphWidth / filteredUnits.length;
    return Math.max(4, Math.min(22, available * 0.38));
  }, [filteredUnits.length, graphWidth]);

  // Ligne de balance nette
  const netPoints = useMemo(() => {
    return filteredUnits.map((d, idx) => {
      const x = getX(idx, filteredUnits.length);
      const y = getY(d.net);
      return { x, y, data: d };
    });
  }, [filteredUnits, yMin, yMax]);

  const netLinePath = useMemo(() => {
    if (netPoints.length === 0) return "";
    return netPoints.reduce((acc, pt, idx) => {
      return `${acc} ${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`;
    }, "");
  }, [netPoints]);

  // Courbe cumulée
  const cumPoints = useMemo(() => {
    return filteredUnits.map((d, idx) => {
      const x = getX(idx, filteredUnits.length);
      const y = getY(d.cumulative);
      return { x, y, data: d };
    });
  }, [filteredUnits, yMin, yMax]);

  const cumLinePath = useMemo(() => {
    if (cumPoints.length === 0) return "";
    return cumPoints.reduce((acc, pt, idx) => {
      return `${acc} ${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`;
    }, "");
  }, [cumPoints]);

  const hoveredUnit = useMemo(() => {
    if (!hoveredKey) return null;
    return filteredUnits.find((u) => u.key === hoveredKey) || null;
  }, [hoveredKey, filteredUnits]);

  // Handler pour changer de granularité et réajuster la période
  const handleGranularityChange = (g: Granularity) => {
    setGranularity(g);
    setHoveredKey(null);
    if (g === "day") setPeriodPreset("14d");
    else if (g === "week") setPeriodPreset("8w");
    else if (g === "month") setPeriodPreset("6m");
    else setPeriodPreset("all");
  };

  return (
    <div id="coins-history-chart" className="space-y-3 font-mono text-xs text-black">
      {/* Barre supérieure : Granularité, Modes et Périodes */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2.5">
        <div className="flex items-center gap-1.5 font-black uppercase text-[11px]">
          <Coins size={14} className="text-yellow-600" />
          <span>Flux de Coins ({granularity === "day" ? "Par Jour" : granularity === "week" ? "Par Semaine" : granularity === "month" ? "Par Mois" : "Par An"})</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sélecteur de granularité : Jours / Semaines / Mois / Ans */}
          <div className="flex items-center border-2 border-black overflow-hidden shadow-[1px_1px_0px_#000]">
            <button
              type="button"
              onClick={() => handleGranularityChange("day")}
              className={`px-2 py-0.5 text-[10px] font-black uppercase cursor-pointer ${
                granularity === "day"
                  ? "bg-yellow-300 text-black shadow-[inset_1px_1px_0px_#000]"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Jours
            </button>
            <button
              type="button"
              onClick={() => handleGranularityChange("week")}
              className={`px-2 py-0.5 text-[10px] font-black uppercase border-l border-black cursor-pointer ${
                granularity === "week"
                  ? "bg-yellow-300 text-black shadow-[inset_1px_1px_0px_#000]"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Semaines
            </button>
            <button
              type="button"
              onClick={() => handleGranularityChange("month")}
              className={`px-2 py-0.5 text-[10px] font-black uppercase border-l border-black cursor-pointer ${
                granularity === "month"
                  ? "bg-yellow-300 text-black shadow-[inset_1px_1px_0px_#000]"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Mois
            </button>
            <button
              type="button"
              onClick={() => handleGranularityChange("year")}
              className={`px-2 py-0.5 text-[10px] font-black uppercase border-l border-black cursor-pointer ${
                granularity === "year"
                  ? "bg-yellow-300 text-black shadow-[inset_1px_1px_0px_#000]"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Ans
            </button>
          </div>

          {/* Mode d'affichage graphique */}
          <div className="flex items-center border border-black overflow-hidden">
            <button
              type="button"
              onClick={() => setDisplayMode("bars")}
              className={`px-1.5 py-0.5 text-[9.5px] font-black uppercase cursor-pointer ${
                displayMode === "bars"
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Barres
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode("net_line")}
              className={`px-1.5 py-0.5 text-[9.5px] font-black uppercase border-l border-black cursor-pointer ${
                displayMode === "net_line"
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Ligne
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode("cumulative")}
              className={`px-1.5 py-0.5 text-[9.5px] font-black uppercase border-l border-black cursor-pointer ${
                displayMode === "cumulative"
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Cumul
            </button>
          </div>

          {/* Filtres de plage adaptés à la granularité */}
          <div className="flex items-center gap-1">
            {granularity === "day" && (
              <>
                <button
                  type="button"
                  onClick={() => setPeriodPreset("7d")}
                  className={`px-1.5 py-0.5 border border-black text-[9.5px] font-black uppercase cursor-pointer ${
                    periodPreset === "7d" ? "bg-yellow-300 text-black shadow-[1px_1px_0px_#000]" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  7j
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodPreset("14d")}
                  className={`px-1.5 py-0.5 border border-black text-[9.5px] font-black uppercase cursor-pointer ${
                    periodPreset === "14d" ? "bg-yellow-300 text-black shadow-[1px_1px_0px_#000]" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  14j
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodPreset("30d")}
                  className={`px-1.5 py-0.5 border border-black text-[9.5px] font-black uppercase cursor-pointer ${
                    periodPreset === "30d" ? "bg-yellow-300 text-black shadow-[1px_1px_0px_#000]" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  30j
                </button>
              </>
            )}

            {granularity === "week" && (
              <>
                <button
                  type="button"
                  onClick={() => setPeriodPreset("4w")}
                  className={`px-1.5 py-0.5 border border-black text-[9.5px] font-black uppercase cursor-pointer ${
                    periodPreset === "4w" ? "bg-yellow-300 text-black shadow-[1px_1px_0px_#000]" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  4 sem
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodPreset("8w")}
                  className={`px-1.5 py-0.5 border border-black text-[9.5px] font-black uppercase cursor-pointer ${
                    periodPreset === "8w" ? "bg-yellow-300 text-black shadow-[1px_1px_0px_#000]" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  8 sem
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodPreset("16w")}
                  className={`px-1.5 py-0.5 border border-black text-[9.5px] font-black uppercase cursor-pointer ${
                    periodPreset === "16w" ? "bg-yellow-300 text-black shadow-[1px_1px_0px_#000]" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  16 sem
                </button>
              </>
            )}

            {granularity === "month" && (
              <>
                <button
                  type="button"
                  onClick={() => setPeriodPreset("3m")}
                  className={`px-1.5 py-0.5 border border-black text-[9.5px] font-black uppercase cursor-pointer ${
                    periodPreset === "3m" ? "bg-yellow-300 text-black shadow-[1px_1px_0px_#000]" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  3 mois
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodPreset("6m")}
                  className={`px-1.5 py-0.5 border border-black text-[9.5px] font-black uppercase cursor-pointer ${
                    periodPreset === "6m" ? "bg-yellow-300 text-black shadow-[1px_1px_0px_#000]" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  6 mois
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodPreset("12m")}
                  className={`px-1.5 py-0.5 border border-black text-[9.5px] font-black uppercase cursor-pointer ${
                    periodPreset === "12m" ? "bg-yellow-300 text-black shadow-[1px_1px_0px_#000]" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  12 mois
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setPeriodPreset("all")}
              className={`px-1.5 py-0.5 border border-black text-[9.5px] font-black uppercase cursor-pointer ${
                periodPreset === "all" ? "bg-yellow-300 text-black shadow-[1px_1px_0px_#000]" : "bg-white hover:bg-gray-100"
              }`}
            >
              Tout
            </button>
          </div>
        </div>
      </div>

      {/* Cartouches de statistiques condensées */}
      {filteredUnits.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-emerald-50 border-2 border-black p-1.5 shadow-[1px_1px_0px_#000]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-emerald-800">Total Gagné</span>
              <ArrowUpRight size={12} className="text-emerald-700" />
            </div>
            <span className="text-xs font-black text-emerald-900">+{stats.totalGains} CS</span>
          </div>

          <div className="bg-rose-50 border-2 border-black p-1.5 shadow-[1px_1px_0px_#000]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-rose-800">Total Dépensé</span>
              <ArrowDownRight size={12} className="text-rose-700" />
            </div>
            <span className="text-xs font-black text-rose-900">-{stats.totalExpenses} CS</span>
          </div>

          <div className="bg-yellow-50 border-2 border-black p-1.5 shadow-[1px_1px_0px_#000]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-yellow-900">Balance Nette</span>
              <Scale size={12} className="text-yellow-800" />
            </div>
            <span className={`text-xs font-black ${stats.netBalance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {stats.netBalance >= 0 ? `+${stats.netBalance}` : stats.netBalance} CS
            </span>
          </div>

          <div className="bg-white border-2 border-black p-1.5 shadow-[1px_1px_0px_#000]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-gray-500">Moyenne / Période</span>
              <TrendingUp size={12} className="text-gray-600" />
            </div>
            <span className={`text-xs font-black ${stats.avgPerUnit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {stats.avgPerUnit >= 0 ? `+${stats.avgPerUnit}` : stats.avgPerUnit} {stats.unitSuffix}
            </span>
          </div>
        </div>
      )}

      {/* Rendu Graphique SVG */}
      {filteredUnits.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-black p-6 text-center text-gray-500 italic text-xs">
          Aucun flux de CS enregistré pour cette période.
        </div>
      ) : (
        <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_#000] relative">
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto select-none overflow-visible"
              style={{ minWidth: "380px" }}
            >
              {/* Lignes de grille horizontales Y */}
              {yTicks.map((val) => {
                const y = getY(val);
                const isZero = val === 0;
                return (
                  <g key={`ytick-${val}`}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={svgWidth - padding.right}
                      y2={y}
                      stroke={isZero ? "#000000" : "#e5e7eb"}
                      strokeWidth={isZero ? 1.5 : 1}
                      strokeDasharray={isZero ? undefined : "3,3"}
                    />
                    <text
                      x={padding.left - 6}
                      y={y + 3.5}
                      textAnchor="end"
                      className={`text-[9px] font-mono ${isZero ? "font-black fill-black" : "fill-gray-500"}`}
                    >
                      {val > 0 ? `+${val}` : val}
                    </text>
                  </g>
                );
              })}

              {/* Lignes verticales & Étiquettes X */}
              {filteredUnits.map((u, idx) => {
                const x = getX(idx, filteredUnits.length);
                const showLabel =
                  filteredUnits.length <= 14 ||
                  idx % Math.ceil(filteredUnits.length / 10) === 0 ||
                  idx === filteredUnits.length - 1;

                return (
                  <g key={`xtick-${u.key}`}>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + graphHeight}
                      stroke="#f3f4f6"
                      strokeWidth={1}
                    />
                    {showLabel && (
                      <text
                        x={x}
                        y={padding.top + graphHeight + 14}
                        textAnchor="middle"
                        className="text-[8.5px] font-mono fill-gray-700 font-bold"
                      >
                        {u.shortLabel}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Mode "bars" : Barres de gains (vertes) et de dépenses (rouges) */}
              {displayMode === "bars" &&
                filteredUnits.map((u, idx) => {
                  const x = getX(idx, filteredUnits.length);
                  const isHovered = hoveredKey === u.key;

                  const gainsY = getY(u.gains);
                  const gainsHeight = Math.max(0, zeroY - gainsY);

                  const expensesY = getY(-u.expenses);
                  const expensesHeight = Math.max(0, expensesY - zeroY);

                  return (
                    <g
                      key={`bar-${u.key}`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredKey(u.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      onClick={() => setHoveredKey(isHovered ? null : u.key)}
                    >
                      <rect
                        x={x - barWidth}
                        y={padding.top}
                        width={barWidth * 2}
                        height={graphHeight}
                        fill="transparent"
                      />

                      {/* Barre Gain */}
                      {u.gains > 0 && (
                        <rect
                          x={x - barWidth - 1}
                          y={gainsY}
                          width={barWidth}
                          height={gainsHeight}
                          fill="#10b981"
                          stroke="#000000"
                          strokeWidth={1}
                          opacity={isHovered ? 1 : 0.85}
                        />
                      )}

                      {/* Barre Dépense */}
                      {u.expenses > 0 && (
                        <rect
                          x={x + 1}
                          y={zeroY}
                          width={barWidth}
                          height={expensesHeight}
                          fill="#f43f5e"
                          stroke="#000000"
                          strokeWidth={1}
                          opacity={isHovered ? 1 : 0.85}
                        />
                      )}
                    </g>
                  );
                })}

              {/* Mode "bars" ou "net_line" : Tracé de la balance nette */}
              {(displayMode === "bars" || displayMode === "net_line") && (
                <>
                  {netLinePath && (
                    <path
                      d={netLinePath}
                      fill="none"
                      stroke="#000000"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {netPoints.map((pt) => {
                    const isHovered = hoveredKey === pt.data.key;
                    const fillColor = pt.data.net >= 0 ? "#eab308" : "#000000";
                    return (
                      <g
                        key={`net-pt-${pt.data.key}`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredKey(pt.data.key)}
                        onMouseLeave={() => setHoveredKey(null)}
                        onClick={() => setHoveredKey(isHovered ? null : pt.data.key)}
                      >
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 5.5 : 3.5}
                          fill={fillColor}
                          stroke="#000000"
                          strokeWidth={1.5}
                        />
                      </g>
                    );
                  })}
                </>
              )}

              {/* Mode "cumulative" */}
              {displayMode === "cumulative" && (
                <>
                  {cumLinePath && (
                    <path
                      d={cumLinePath}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {cumPoints.map((pt) => {
                    const isHovered = hoveredKey === pt.data.key;
                    return (
                      <g
                        key={`cum-pt-${pt.data.key}`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredKey(pt.data.key)}
                        onMouseLeave={() => setHoveredKey(null)}
                        onClick={() => setHoveredKey(isHovered ? null : pt.data.key)}
                      >
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6 : 4}
                          fill="#3b82f6"
                          stroke="#000000"
                          strokeWidth={1.5}
                        />
                      </g>
                    );
                  })}
                </>
              )}
            </svg>
          </div>

          {/* Légende */}
          <div className="flex items-center justify-center gap-4 pt-1.5 border-t border-gray-200 text-[9.5px] font-mono">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 border border-black inline-block"></span>
              <span>Gains (+CS)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-rose-500 border border-black inline-block"></span>
              <span>Dépenses (-CS)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 border border-black inline-block"></span>
              <span>Balance Nette</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-blue-500 inline-block"></span>
              <span>Cumulatif</span>
            </div>
          </div>

          {/* Fiche d'information du point sélectionné / survolé */}
          {hoveredUnit ? (
            <div className="mt-2 bg-yellow-50 border-2 border-black p-2 text-[10px] space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-black bg-black text-white px-1.5 py-0.5">
                  {hoveredUnit.fullLabel}
                </span>

                <div className="flex items-center gap-1.5 font-bold flex-wrap">
                  <span className="text-emerald-800 bg-emerald-100 border border-emerald-400 px-1 py-0.2">
                    +{hoveredUnit.gains} CS gagnés
                  </span>
                  <span className="text-rose-800 bg-rose-100 border border-rose-400 px-1 py-0.2">
                    -{hoveredUnit.expenses} CS dépensés
                  </span>
                  <span
                    className={`font-black px-1.5 py-0.2 border border-black ${
                      hoveredUnit.net >= 0 ? "bg-yellow-300 text-black" : "bg-black text-white"
                    }`}
                  >
                    Balance : {hoveredUnit.net >= 0 ? `+${hoveredUnit.net}` : hoveredUnit.net} CS
                  </span>
                  <span className="bg-blue-100 text-blue-900 border border-blue-400 px-1 py-0.2 font-black">
                    Cumul : {hoveredUnit.cumulative} CS
                  </span>
                </div>
              </div>

              {/* Détails des éléments */}
              {hoveredUnit.items && hoveredUnit.items.length > 0 ? (
                <div className="pt-1 border-t border-black/20 space-y-1 max-h-36 overflow-y-auto pr-1">
                  {hoveredUnit.items.map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="flex items-center justify-between bg-white border border-black px-1.5 py-0.5 text-[9px]"
                    >
                      <span className="truncate pr-2">{item.title}</span>
                      <span
                        className={`font-black shrink-0 ${
                          item.coinsDelta > 0
                            ? "text-emerald-700"
                            : item.coinsDelta < 0
                            ? "text-rose-700"
                            : "text-gray-600"
                        }`}
                      >
                        {item.coinsDelta > 0 ? `+${item.coinsDelta}` : item.coinsDelta} CS
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[9px] text-gray-500 italic">
                  Aucun mouvement de pièces individuel pour cette période.
                </div>
              )}
            </div>
          ) : (
            <div className="mt-1 text-[9px] text-gray-500 italic text-center">
              Survolez ou touchez un point pour afficher le détail consolidé des flux de CS.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
