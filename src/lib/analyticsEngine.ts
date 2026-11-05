import { AppDatabase } from "../types";
import { extractAllTimeData, ExtractedTimeData, TimeLogRecord, ItemTimeSummary, TypeTimeSummary, TagTimeSummary } from "./googleSheets";
import { LEGACY_GAMES, LEGACY_LOGS, parseDurationToMinutes, isRewardGame, isoToFrenchDate, formatShortHoursMinutes, frenchDateToDate } from "./legacyGamingData";

export interface WeekPeriodSummary {
  key: string;
  year: number;
  weekNumber: number;
  label: string;
  startDate: string;
  endDate: string;
  workMinutes: number;
  workHours: number;
  leisureMinutes: number;
  leisureHours: number;
  gamingMinutes: number;
  gamingHours: number;
  netMinutes: number;
  netHours: number;
  activeDaysCount: number;
  avgWorkHoursPerActiveDay: number;
  workDeltaPctVsPrev?: number;
}

export interface MonthPeriodSummary {
  key: string;
  year: number;
  monthNumber: number;
  label: string;
  startDate: string;
  endDate: string;
  workMinutes: number;
  workHours: number;
  leisureMinutes: number;
  leisureHours: number;
  gamingMinutes: number;
  gamingHours: number;
  netMinutes: number;
  netHours: number;
  activeDaysCount: number;
  avgWorkHoursPerActiveDay: number;
  workDeltaPctVsPrev?: number;
}

export interface DayOfWeekStat {
  dayIndex: number; // 0 = Lundi, 6 = Dimanche
  dayName: string;
  totalWorkMinutes: number;
  totalWorkHours: number;
  occurrences: number;
  avgWorkMinutes: number;
  avgWorkHours: number;
}

export interface GamingQuotaAnalysis {
  startDateStr: string;
  currentDateStr: string;
  elapsedDays: number;
  yearsElapsed: number;
  authorizedHours: number;
  authorizedMinutes: number;
  totalPlayedMinutes: number;
  totalPlayedHours: number;
  remainingMinutes: number;
  remainingHours: number;
  dailyAvgMinutes: number;
  dailyAvgHours: number;
  isDeficit: boolean;
  gameTotals: Array<{
    gameName: string;
    totalMinutes: number;
    totalHours: number;
    dailyAvgHours: number;
    percentage: number;
  }>;
  recentSessions: Array<{
    date: string;
    gameName: string;
    minutes: number;
    hours: number;
  }>;
}

export interface AlgorithmicInsights {
  peakDayName: string;
  peakDayAvgHours: number;
  consistencyScorePct: number;
  bestWeekLabel: string;
  bestWeekHours: number;
  workLeisureRatio: number;
  gamingQuotaAdherencePct: number;
  highlights: string[];
}

export interface PeriodTrendAnalysis {
  weeklyEffortSlope: "rising" | "stable" | "declining";
  weeklyEffortPctChange: number;
  monthlyEffortSlope: "rising" | "stable" | "declining";
  monthlyEffortPctChange: number;
  averageWeeklyWorkHours: number;
  averageWeeklyLeisureHours: number;
  averageMonthlyWorkHours: number;
  currentMonthProjectedWorkHours: number;
  streakActiveWeeks: number;
  fourWeekMovingAverageHours: number;
}

export interface ArchiveJeuxDailyRow {
  date: string;
  totalFormatted: string;
  totalMinutes: number;
  gameMinutes: Record<string, number>;
  gameFormatted: Record<string, string>;
}

export interface ArchiveJeuxGridData {
  startDate: string;
  endDate: string;
  elapsedDays: number;
  authorizedHours: number;
  yearsElapsed: string;
  totalPlayedHours: number;
  remainingHours: number;
  isDeficit: boolean;
  overallAvgHoursPerDay: number;
  gamesList: string[];
  gameAverages: Record<string, string>;
  gameTotals: Record<string, string>;
  dailyRows: ArchiveJeuxDailyRow[];
}

export interface CompleteAnalyticsData {
  baseData: ExtractedTimeData;
  weeks: WeekPeriodSummary[];
  months: MonthPeriodSummary[];
  daysOfWeek: DayOfWeekStat[];
  gaming: GamingQuotaAnalysis;
  algorithmicInsights: AlgorithmicInsights;
  periodTrends: PeriodTrendAnalysis;
  archiveJeuxGrid: ArchiveJeuxGridData;
}

// Calcule la semaine ISO (Lundi au Dimanche)
function getIsoWeek(dateStr: string) {
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
  const year = monday.getFullYear();

  return {
    year,
    weekNum,
    key: `${year}-W${String(weekNum).padStart(2, "0")}`,
    label: `S${weekNum} (${monStr.slice(5).replace("-", "/")} au ${sunStr.slice(5).replace("-", "/")})`,
    startDate: monStr,
    endDate: sunStr,
  };
}

/**
 * Moteur algorithmique principal analysant l'intégralité des flux temporels.
 */
export function computeCompleteAnalytics(db: AppDatabase): CompleteAnalyticsData {
  const baseData = extractAllTimeData(db);

  // 1. Extraction et calcul des sessions de jeux (anciennes + nouvelles)
  const gamesMap = new Map<string, number>();
  LEGACY_GAMES.forEach((g) => gamesMap.set(g, 0));

  let legacyTotalM = 0;
  const gamingLogs: Array<{ date: string; gameName: string; minutes: number }> = [];

  Object.entries(LEGACY_LOGS).forEach(([frenchDate, dayLog]) => {
    const parts = frenchDate.split("/");
    const isoD = `${parts[2]}-${parts[1]}-${parts[0]}`;
    Object.entries(dayLog).forEach(([gName, durStr]) => {
      const mins = parseDurationToMinutes(durStr);
      if (mins > 0) {
        legacyTotalM += mins;
        gamesMap.set(gName, (gamesMap.get(gName) || 0) + mins);
        gamingLogs.push({ date: isoD, gameName: gName, minutes: mins });
      }
    });
  });

  // Nouveaux jeux enregistrés dans l'application
  (db.rewards || []).forEach((r) => {
    if (isRewardGame(r) && r.timeLog && Array.isArray(r.timeLog)) {
      const cleanTitle = (r.title || "").replace(/^[^\w\s]+/, "").trim() || "Jeu";
      r.timeLog.forEach((log) => {
        if (log.duration && log.duration > 0 && log.date) {
          const isoD = log.date.split("T")[0];
          gamesMap.set(cleanTitle, (gamesMap.get(cleanTitle) || 0) + log.duration);
          gamingLogs.push({ date: isoD, gameName: cleanTitle, minutes: log.duration });
        }
      });
    }
  });

  (db.tasks || []).forEach((t) => {
    const isGamingTask = (t.tags || []).some((tag) => /jeu|gaming|game/i.test(tag));
    if (isGamingTask && t.workHistory) {
      const cleanTitle = (t.title || "").trim() || "Jeu";
      Object.entries(t.workHistory).forEach(([isoD, sec]) => {
        const mins = Math.floor(sec / 60);
        if (mins > 0) {
          gamesMap.set(cleanTitle, (gamesMap.get(cleanTitle) || 0) + mins);
          gamingLogs.push({ date: isoD, gameName: cleanTitle, minutes: mins });
        }
      });
    }
  });

  gamingLogs.sort((a, b) => b.date.localeCompare(a.date));

  // Date de référence 22/03/2022
  const startDate = new Date(2022, 2, 22);
  const now = new Date();
  const msPerDay = 1000 * 3600 * 24;
  const elapsedDays = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / msPerDay));
  const authorizedMinutes = elapsedDays * 60;
  const authorizedHours = elapsedDays;
  const totalPlayedMinutes = Array.from(gamesMap.values()).reduce((sum, v) => sum + v, 0);
  const totalPlayedHours = Number((totalPlayedMinutes / 60).toFixed(2));
  const remainingMinutes = authorizedMinutes - totalPlayedMinutes;
  const remainingHours = Number((remainingMinutes / 60).toFixed(2));
  const dailyAvgMinutes = elapsedDays > 0 ? Math.round(totalPlayedMinutes / elapsedDays) : 0;
  const dailyAvgHours = Number((dailyAvgMinutes / 60).toFixed(2));

  const gameTotals = Array.from(gamesMap.entries())
    .map(([gameName, totalMinutes]) => ({
      gameName,
      totalMinutes,
      totalHours: Number((totalMinutes / 60).toFixed(2)),
      dailyAvgHours: Number((totalMinutes / 60 / elapsedDays).toFixed(4)),
      percentage: totalPlayedMinutes > 0 ? Number(((totalMinutes / totalPlayedMinutes) * 100).toFixed(1)) : 0,
    }))
    .filter((g) => g.totalMinutes > 0)
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  const gamingQuota: GamingQuotaAnalysis = {
    startDateStr: "22/03/2022",
    currentDateStr: isoToFrenchDate(now.toISOString().split("T")[0]),
    elapsedDays,
    yearsElapsed: Number((elapsedDays / 365).toFixed(2)),
    authorizedHours,
    authorizedMinutes,
    totalPlayedMinutes,
    totalPlayedHours,
    remainingMinutes,
    remainingHours,
    dailyAvgMinutes,
    dailyAvgHours,
    isDeficit: remainingMinutes < 0,
    gameTotals,
    recentSessions: gamingLogs.slice(0, 50).map((l) => ({
      date: l.date,
      gameName: l.gameName,
      minutes: l.minutes,
      hours: Number((l.minutes / 60).toFixed(2)),
    })),
  };

  // 2. Découpage & Analyses par Semaine
  const weeksMap = new Map<string, {
    key: string;
    year: number;
    weekNumber: number;
    label: string;
    startDate: string;
    endDate: string;
    workMinutes: number;
    leisureMinutes: number;
    gamingMinutes: number;
    daysSet: Set<string>;
  }>();

  baseData.allLogs.forEach((log) => {
    const week = getIsoWeek(log.date);
    const entry = weeksMap.get(week.key) || {
      ...week,
      weekNumber: week.weekNum,
      workMinutes: 0,
      leisureMinutes: 0,
      gamingMinutes: 0,
      daysSet: new Set<string>(),
    };

    if (log.itemTypeLabel === "Récompense") {
      entry.leisureMinutes += log.minutes;
    } else {
      entry.workMinutes += log.minutes;
    }
    entry.daysSet.add(log.date);
    weeksMap.set(week.key, entry);
  });

  // Associer les sessions de jeux aux semaines
  gamingLogs.forEach((log) => {
    const week = getIsoWeek(log.date);
    const entry = weeksMap.get(week.key);
    if (entry) {
      entry.gamingMinutes += log.minutes;
    }
  });

  const sortedWeeks = Array.from(weeksMap.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((w, idx, arr) => {
      const netM = w.workMinutes - w.leisureMinutes;
      const activeDays = w.daysSet.size;
      const avgM = activeDays > 0 ? Math.round(w.workMinutes / activeDays) : 0;
      let deltaPct: number | undefined = undefined;
      if (idx > 0) {
        const prev = arr[idx - 1];
        if (prev.workMinutes > 0) {
          deltaPct = Number((((w.workMinutes - prev.workMinutes) / prev.workMinutes) * 100).toFixed(1));
        }
      }

      return {
        key: w.key,
        year: w.year,
        weekNumber: w.weekNumber,
        label: w.label,
        startDate: w.startDate,
        endDate: w.endDate,
        workMinutes: w.workMinutes,
        workHours: Number((w.workMinutes / 60).toFixed(2)),
        leisureMinutes: w.leisureMinutes,
        leisureHours: Number((w.leisureMinutes / 60).toFixed(2)),
        gamingMinutes: w.gamingMinutes,
        gamingHours: Number((w.gamingMinutes / 60).toFixed(2)),
        netMinutes: netM,
        netHours: Number((netM / 60).toFixed(2)),
        activeDaysCount: activeDays,
        avgWorkHoursPerActiveDay: Number((avgM / 60).toFixed(2)),
        workDeltaPctVsPrev: deltaPct,
      };
    });

  // 3. Découpage & Analyses par Mois
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const monthsMap = new Map<string, {
    key: string;
    year: number;
    monthNumber: number;
    label: string;
    startDate: string;
    endDate: string;
    workMinutes: number;
    leisureMinutes: number;
    gamingMinutes: number;
    daysSet: Set<string>;
  }>();

  baseData.allLogs.forEach((log) => {
    const parts = log.date.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const lastDay = new Date(year, month, 0).getDate();

    const entry = monthsMap.get(key) || {
      key,
      year,
      monthNumber: month,
      label: `${monthNames[month - 1]} ${year}`,
      startDate: `${key}-01`,
      endDate: `${key}-${String(lastDay).padStart(2, "0")}`,
      workMinutes: 0,
      leisureMinutes: 0,
      gamingMinutes: 0,
      daysSet: new Set<string>(),
    };

    if (log.itemTypeLabel === "Récompense") {
      entry.leisureMinutes += log.minutes;
    } else {
      entry.workMinutes += log.minutes;
    }
    entry.daysSet.add(log.date);
    monthsMap.set(key, entry);
  });

  gamingLogs.forEach((log) => {
    const parts = log.date.split("-");
    const key = `${parts[0]}-${parts[1]}`;
    const entry = monthsMap.get(key);
    if (entry) {
      entry.gamingMinutes += log.minutes;
    }
  });

  const sortedMonths = Array.from(monthsMap.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((m, idx, arr) => {
      const netM = m.workMinutes - m.leisureMinutes;
      const activeDays = m.daysSet.size;
      const avgM = activeDays > 0 ? Math.round(m.workMinutes / activeDays) : 0;
      let deltaPct: number | undefined = undefined;
      if (idx > 0) {
        const prev = arr[idx - 1];
        if (prev.workMinutes > 0) {
          deltaPct = Number((((m.workMinutes - prev.workMinutes) / prev.workMinutes) * 100).toFixed(1));
        }
      }

      return {
        key: m.key,
        year: m.year,
        monthNumber: m.monthNumber,
        label: m.label,
        startDate: m.startDate,
        endDate: m.endDate,
        workMinutes: m.workMinutes,
        workHours: Number((m.workMinutes / 60).toFixed(2)),
        leisureMinutes: m.leisureMinutes,
        leisureHours: Number((m.leisureMinutes / 60).toFixed(2)),
        gamingMinutes: m.gamingMinutes,
        gamingHours: Number((m.gamingMinutes / 60).toFixed(2)),
        netMinutes: netM,
        netHours: Number((netM / 60).toFixed(2)),
        activeDaysCount: activeDays,
        avgWorkHoursPerActiveDay: Number((avgM / 60).toFixed(2)),
        workDeltaPctVsPrev: deltaPct,
      };
    });

  // 4. Distribution par Jour de la Semaine (Lundi à Dimanche)
  const dayLabels = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const daysOfWeekStats: DayOfWeekStat[] = dayLabels.map((name, idx) => ({
    dayIndex: idx,
    dayName: name,
    totalWorkMinutes: 0,
    totalWorkHours: 0,
    occurrences: 0,
    avgWorkMinutes: 0,
    avgWorkHours: 0,
  }));

  baseData.dailySummaries.forEach((d) => {
    const dateObj = new Date(d.date + "T00:00:00");
    const jsDay = dateObj.getDay(); // 0 = Dimanche, 1 = Lundi
    const frenchIndex = (jsDay + 6) % 7; // 0 = Lundi, 6 = Dimanche
    daysOfWeekStats[frenchIndex].totalWorkMinutes += d.workMinutes;
    daysOfWeekStats[frenchIndex].occurrences += 1;
  });

  daysOfWeekStats.forEach((stat) => {
    stat.totalWorkHours = Number((stat.totalWorkMinutes / 60).toFixed(2));
    stat.avgWorkMinutes = stat.occurrences > 0 ? Math.round(stat.totalWorkMinutes / stat.occurrences) : 0;
    stat.avgWorkHours = Number((stat.avgWorkMinutes / 60).toFixed(2));
  });

  // 5. Analyses Algorithmiques & Calculs de Régularité
  let peakDay = daysOfWeekStats[0];
  daysOfWeekStats.forEach((st) => {
    if (st.avgWorkMinutes > peakDay.avgWorkMinutes) {
      peakDay = st;
    }
  });

  // Score de régularité (écart-type relatif)
  let consistencyScore = 80;
  if (baseData.dailySummaries.length > 3) {
    const dailyMins = baseData.dailySummaries.map((d) => d.workMinutes);
    const avg = baseData.avgWorkMinutesPerDay;
    const variance = dailyMins.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / dailyMins.length;
    const stdDev = Math.sqrt(variance);
    const cv = avg > 0 ? stdDev / avg : 1;
    // Plus le coefficient de variation est faible, plus la consistance est haute
    consistencyScore = Math.max(30, Math.min(98, Math.round(100 - cv * 35)));
  }

  // Meilleure semaine
  let bestWeek = sortedWeeks[0];
  sortedWeeks.forEach((w) => {
    if (!bestWeek || w.workMinutes > bestWeek.workMinutes) {
      bestWeek = w;
    }
  });

  const highlights: string[] = [];
  if (bestWeek) {
    highlights.push(`Semaine record : ${bestWeek.label.split(" ")[0]} avec ${bestWeek.workHours}h de travail.`);
  }
  highlights.push(`Jour pivot : ${peakDay.dayName} est votre journée la plus productive (${peakDay.avgWorkHours}h en moyenne).`);
  highlights.push(`Consistance journalière : indice de ${consistencyScore}% de régularité sur les jours actifs.`);
  if (gamingQuota.isDeficit) {
    highlights.push(`Quota jeux vidéo : déficit de ${Math.abs(gamingQuota.remainingHours)}h par rapport à l'objectif d'1h/jour.`);
  } else {
    highlights.push(`Quota jeux vidéo : réserve positive de +${gamingQuota.remainingHours}h disponible.`);
  }

  const workLeisureRatio = baseData.totalLeisureMinutes > 0
    ? Number((baseData.totalWorkMinutes / baseData.totalLeisureMinutes).toFixed(2))
    : baseData.totalWorkMinutes > 0 ? 99 : 1;

  const gamingQuotaAdherencePct = gamingQuota.authorizedHours > 0
    ? Math.max(0, Math.min(100, Math.round(((gamingQuota.authorizedHours - Math.max(0, -gamingQuota.remainingHours)) / gamingQuota.authorizedHours) * 100)))
    : 100;

  // 6. Analyses des Tendances de Périodes (Semaines & Mois)
  const chronoWeeks = [...sortedWeeks]; // Ordre chronologique ancien -> récent
  const recent4Weeks = chronoWeeks.slice(-4);
  const prev4Weeks = chronoWeeks.slice(-8, -4);
  const recent4WorkSum = recent4Weeks.reduce((acc, w) => acc + w.workHours, 0);
  const prev4WorkSum = prev4Weeks.reduce((acc, w) => acc + w.workHours, 0);
  const weeklyEffortPctChange = prev4WorkSum > 0 ? Number((((recent4WorkSum - prev4WorkSum) / prev4WorkSum) * 100).toFixed(1)) : 0;
  const weeklyEffortSlope: "rising" | "stable" | "declining" = weeklyEffortPctChange > 5 ? "rising" : weeklyEffortPctChange < -5 ? "declining" : "stable";

  const chronoMonths = [...sortedMonths];
  const recent3Months = chronoMonths.slice(-3);
  const prev3Months = chronoMonths.slice(-6, -3);
  const recent3MonthWork = recent3Months.reduce((acc, m) => acc + m.workHours, 0);
  const prev3MonthWork = prev3Months.reduce((acc, m) => acc + m.workHours, 0);
  const monthlyEffortPctChange = prev3MonthWork > 0 ? Number((((recent3MonthWork - prev3MonthWork) / prev3MonthWork) * 100).toFixed(1)) : 0;
  const monthlyEffortSlope: "rising" | "stable" | "declining" = monthlyEffortPctChange > 5 ? "rising" : monthlyEffortPctChange < -5 ? "declining" : "stable";

  const totalWeeksCount = chronoWeeks.length || 1;
  const averageWeeklyWorkHours = Number((chronoWeeks.reduce((acc, w) => acc + w.workHours, 0) / totalWeeksCount).toFixed(2));
  const averageWeeklyLeisureHours = Number((chronoWeeks.reduce((acc, w) => acc + w.leisureHours, 0) / totalWeeksCount).toFixed(2));
  const totalMonthsCount = chronoMonths.length || 1;
  const averageMonthlyWorkHours = Number((chronoMonths.reduce((acc, m) => acc + m.workHours, 0) / totalMonthsCount).toFixed(2));
  const fourWeekMovingAverageHours = recent4Weeks.length > 0 ? Number((recent4WorkSum / recent4Weeks.length).toFixed(2)) : 0;

  // Série de semaines actives consécutives
  let streakActiveWeeks = 0;
  for (let i = chronoWeeks.length - 1; i >= 0; i--) {
    if (chronoWeeks[i].workMinutes > 0) {
      streakActiveWeeks++;
    } else {
      break;
    }
  }

  // Projection du mois en cours
  const curDate = new Date();
  const daysInMonth = new Date(curDate.getFullYear(), curDate.getMonth() + 1, 0).getDate();
  const curDay = Math.max(1, curDate.getDate());
  const currentMonthKey = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthData = monthsMap.get(currentMonthKey);
  const curMonthWorkHours = currentMonthData ? currentMonthData.workMinutes / 60 : 0;
  const currentMonthProjectedWorkHours = Number(((curMonthWorkHours / curDay) * daysInMonth).toFixed(1));

  const periodTrends: PeriodTrendAnalysis = {
    weeklyEffortSlope,
    weeklyEffortPctChange,
    monthlyEffortSlope,
    monthlyEffortPctChange,
    averageWeeklyWorkHours,
    averageWeeklyLeisureHours,
    averageMonthlyWorkHours,
    currentMonthProjectedWorkHours,
    streakActiveWeeks,
    fourWeekMovingAverageHours,
  };

  // 7. Construction de la grille "Archive Jeux" exhaustive (fidèle au Google Sheet)
  const gamesListOrdered = Array.from(gamesMap.keys());
  const gameAveragesRecord: Record<string, string> = {};
  const gameTotalsRecord: Record<string, string> = {};

  gamesListOrdered.forEach((g) => {
    const totalM = gamesMap.get(g) || 0;
    gameTotalsRecord[g] = formatShortHoursMinutes(totalM);
    const avgDayM = elapsedDays > 0 ? totalM / elapsedDays : 0;
    const avgH = Math.floor(avgDayM / 60);
    const avgMin = Math.floor(avgDayM % 60);
    const avgSec = Math.round((avgDayM * 60) % 60);
    gameAveragesRecord[g] = `${avgH}:${String(avgMin).padStart(2, "0")}:${String(avgSec).padStart(2, "0")}`;
  });

  // Construction des lignes quotidiennes de jeux
  const dailyGameDateMap = new Map<string, Record<string, number>>();
  // Charger historiques
  Object.entries(LEGACY_LOGS).forEach(([frenchDate, gameM]) => {
    const rowM: Record<string, number> = {};
    Object.entries(gameM).forEach(([g, durStr]) => {
      const mins = parseDurationToMinutes(durStr);
      if (mins > 0) rowM[g] = (rowM[g] || 0) + mins;
    });
    dailyGameDateMap.set(frenchDate, rowM);
  });
  // Fusionner logs récents
  gamingLogs.forEach((l) => {
    const frDate = isoToFrenchDate(l.date);
    const rowM = dailyGameDateMap.get(frDate) || {};
    rowM[l.gameName] = (rowM[l.gameName] || 0) + l.minutes;
    dailyGameDateMap.set(frDate, rowM);
  });

  // Trier les dates par ordre chronologique décroissant pour affichage immédiat
  const allGameDates = Array.from(dailyGameDateMap.keys()).sort((a, b) => {
    const da = frenchDateToDate(a).getTime();
    const db = frenchDateToDate(b).getTime();
    return db - da; // plus récent en premier
  });

  const archiveJeuxDailyRows: ArchiveJeuxDailyRow[] = allGameDates.map((dateStr) => {
    const rowMap = dailyGameDateMap.get(dateStr) || {};
    let rowTotalM = 0;
    const gameFormatted: Record<string, string> = {};
    gamesListOrdered.forEach((g) => {
      const m = rowMap[g] || 0;
      if (m > 0) {
        rowTotalM += m;
        gameFormatted[g] = formatShortHoursMinutes(m);
      } else {
        gameFormatted[g] = "";
      }
    });

    return {
      date: dateStr,
      totalMinutes: rowTotalM,
      totalFormatted: rowTotalM > 0 ? formatShortHoursMinutes(rowTotalM) : "-",
      gameMinutes: rowMap,
      gameFormatted,
    };
  });

  const archiveJeuxGrid: ArchiveJeuxGridData = {
    startDate: "22/03/2022",
    endDate: gamingQuota.currentDateStr,
    elapsedDays,
    authorizedHours,
    yearsElapsed: gamingQuota.yearsElapsed.toFixed(2),
    totalPlayedHours: gamingQuota.totalPlayedHours,
    remainingHours: gamingQuota.remainingHours,
    isDeficit: gamingQuota.isDeficit,
    overallAvgHoursPerDay: gamingQuota.dailyAvgHours,
    gamesList: gamesListOrdered,
    gameAverages: gameAveragesRecord,
    gameTotals: gameTotalsRecord,
    dailyRows: archiveJeuxDailyRows,
  };

  return {
    baseData,
    weeks: sortedWeeks.reverse(), // Du plus récent au plus ancien
    months: sortedMonths.reverse(),
    daysOfWeek: daysOfWeekStats,
    gaming: gamingQuota,
    algorithmicInsights: {
      peakDayName: peakDay.dayName,
      peakDayAvgHours: peakDay.avgWorkHours,
      consistencyScorePct: consistencyScore,
      bestWeekLabel: bestWeek ? bestWeek.label : "N/A",
      bestWeekHours: bestWeek ? bestWeek.workHours : 0,
      workLeisureRatio,
      gamingQuotaAdherencePct,
      highlights,
    },
    periodTrends,
    archiveJeuxGrid,
  };
}
