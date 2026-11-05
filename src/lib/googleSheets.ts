import { AppDatabase, Task, Habit, RecurringTask, Reward } from "../types";
import { getSheetsAccessToken, setSheetsAccessToken, signInWithGoogleSheets } from "./firebase";
import { buildArchiveJeuxSheet } from "./legacyGamingData";

export interface TimeLogRecord {
  date: string;
  itemId: string;
  itemTitle: string;
  itemType: "task" | "habit" | "recurring" | "reward";
  itemTypeLabel: "Tâche" | "Habitude" | "Récompense";
  tags: string[];
  minutes: number;
  hours: number;
  status: string;
  coinsDelta?: number;
}

export interface DayTimeSummary {
  date: string;
  workMinutes: number;
  workHours: number;
  leisureMinutes: number;
  leisureHours: number;
  netMinutes: number;
  netHours: number;
  cumulativeWorkMinutes: number;
  cumulativeWorkHours: number;
  cumulativeLeisureMinutes: number;
  cumulativeLeisureHours: number;
  cumulativeNetMinutes: number;
  cumulativeNetHours: number;
  itemsCount: number;
}

export interface ItemTimeSummary {
  itemId: string;
  title: string;
  typeLabel: "Tâche" | "Habitude" | "Récompense";
  tags: string[];
  totalMinutes: number;
  totalHours: number;
  activeDaysCount: number;
  avgMinutesPerActiveDay: number;
  avgHoursPerActiveDay: number;
  percentageOfTotalWork: number;
}

export interface TypeTimeSummary {
  typeLabel: "Tâche" | "Habitude" | "Récompense";
  totalMinutes: number;
  totalHours: number;
  logsCount: number;
  activeDaysCount: number;
  avgMinutesPerDay: number;
  avgHoursPerDay: number;
  percentageOfTotal: number;
}

export interface TagTimeSummary {
  tag: string;
  totalMinutes: number;
  totalHours: number;
  itemsCount: number;
  activeDaysCount: number;
  avgMinutesPerDay: number;
  avgHoursPerDay: number;
  percentageOfTotal: number;
}

export interface ExtractedTimeData {
  allLogs: TimeLogRecord[];
  dailySummaries: DayTimeSummary[];
  itemSummaries: ItemTimeSummary[];
  typeSummaries: TypeTimeSummary[];
  tagSummaries: TagTimeSummary[];
  totalWorkMinutes: number;
  totalWorkHours: number;
  totalLeisureMinutes: number;
  totalLeisureHours: number;
  netMinutes: number;
  netHours: number;
  uniqueDaysCount: number;
  avgWorkMinutesPerDay: number;
  avgWorkHoursPerDay: number;
}

/**
 * Extrait et agrège exhaustivement tous les logs de temps de la base de données.
 */
export function extractAllTimeData(db: AppDatabase): ExtractedTimeData {
  const allLogs: TimeLogRecord[] = [];

  // 1. Tâches unitaires (exclut les routines et planning-only)
  (db.tasks || []).forEach((t: Task) => {
    if (t.type === "routine" || t.isPlanningOnly) return;
    const taskTags = t.tags && t.tags.length > 0 ? t.tags : ["Sans tag"];
    const datesSet = new Set<string>();

    if (t.workHistory) {
      Object.keys(t.workHistory).forEach((d) => datesSet.add(d));
    }
    if (t.timeLog && Array.isArray(t.timeLog)) {
      t.timeLog.forEach((log) => {
        if (log.date) datesSet.add(log.date.split("T")[0]);
      });
    }

    // Si aucune date dans workHistory ou timeLog mais qu'il y a du temps passé et une date de complétion
    if (datesSet.size === 0 && t.timeSpentSeconds && t.timeSpentSeconds > 0) {
      const fallbackDate = t.completedAt ? t.completedAt.split("T")[0] : (t.dueDate || new Date().toISOString().split("T")[0]);
      datesSet.add(fallbackDate);
    }

    datesSet.forEach((dateStr) => {
      const workSec = t.workHistory?.[dateStr] || 0;
      let logMin = 0;
      if (t.timeLog && Array.isArray(t.timeLog)) {
        t.timeLog.forEach((log) => {
          if (log.date && log.date.split("T")[0] === dateStr) {
            logMin += log.duration || 0;
          }
        });
      }

      // Durée en minutes pour ce jour
      let minutes = Math.max(Math.floor(workSec / 60), logMin);
      if (minutes === 0 && datesSet.size === 1 && t.timeSpentSeconds && t.timeSpentSeconds > 0) {
        minutes = Math.floor(t.timeSpentSeconds / 60);
      }

      if (minutes > 0) {
        const isCompletedOnDate = Boolean(
          (t.isCompleted || t.status === "done" || t.planningStatus === "done") &&
          t.completedAt &&
          t.completedAt.split("T")[0] === dateStr
        );
        allLogs.push({
          date: dateStr,
          itemId: t.id,
          itemTitle: t.title || "Tâche sans titre",
          itemType: "task",
          itemTypeLabel: "Tâche",
          tags: taskTags,
          minutes,
          hours: Number((minutes / 60).toFixed(2)),
          status: isCompletedOnDate ? "Terminée" : (t.isCompleted ? "Complétée antérieurement" : "En cours"),
          coinsDelta: minutes * (t.chronoRewardValue || 1) + (isCompletedOnDate ? (t.rewardValue ?? 15) : 0),
        });
      }
    });
  });

  // 2. Habitudes
  (db.habits || []).forEach((h: Habit) => {
    const habitTags = ["Habitude"];
    const datesSet = new Set<string>();

    if (h.workHistory) {
      Object.keys(h.workHistory).forEach((d) => datesSet.add(d));
    }
    if (h.history) {
      Object.keys(h.history).forEach((d) => datesSet.add(d));
    }

    datesSet.forEach((dateStr) => {
      const workSec = h.workHistory?.[dateStr] || 0;
      let minutes = Math.floor(workSec / 60);
      const valOnDate = h.history?.[dateStr] || 0;
      if (minutes === 0 && h.type === "chrono" && valOnDate > 0) {
        minutes = valOnDate;
      }

      if (minutes > 0) {
        const isCompleted = valOnDate >= (h.targetValue || 1);
        allLogs.push({
          date: dateStr,
          itemId: h.id,
          itemTitle: h.title || "Habitude",
          itemType: "habit",
          itemTypeLabel: "Habitude",
          tags: habitTags,
          minutes,
          hours: Number((minutes / 60).toFixed(2)),
          status: isCompleted ? "Cible atteinte" : "Pratique partielle",
          coinsDelta: minutes * (h.chronoRewardValue || 1) + (isCompleted ? (h.rewardValue ?? 10) : 0),
        });
      }
    });
  });

  // 3. Tâches Récurrentes
  (db.recurringTasks || []).forEach((rt: RecurringTask) => {
    const recTags = ["Récurrence"];
    const datesSet = new Set<string>();

    if (rt.workHistory) {
      Object.keys(rt.workHistory).forEach((d) => datesSet.add(d));
    }
    if (rt.history) {
      Object.keys(rt.history).forEach((d) => datesSet.add(d));
    }

    datesSet.forEach((dateStr) => {
      const workSec = rt.workHistory?.[dateStr] || 0;
      const minutes = Math.floor(workSec / 60);
      const isCompleted = (rt.history?.[dateStr] || 0) > 0;

      if (minutes > 0) {
        allLogs.push({
          date: dateStr,
          itemId: rt.id,
          itemTitle: rt.title || "Récurrence",
          itemType: "recurring",
          itemTypeLabel: "Tâche",
          tags: recTags,
          minutes,
          hours: Number((minutes / 60).toFixed(2)),
          status: isCompleted ? "Validée" : "En cours",
          coinsDelta: minutes * (rt.chronoRewardValue || 1) + (isCompleted ? (rt.rewardValue ?? 10) : 0),
        });
      }
    });
  });

  // 4. Récompenses / Loisirs Boutique
  (db.rewards || []).forEach((r: Reward) => {
    if (r.timeLog && Array.isArray(r.timeLog)) {
      const leisureTags = ["Loisir"];
      r.timeLog.forEach((log) => {
        if (log.duration && log.duration > 0) {
          const dateStr = log.date ? log.date.split("T")[0] : new Date().toISOString().split("T")[0];
          const costPerMin = r.costCoins !== undefined ? r.costCoins : 1;
          allLogs.push({
            date: dateStr,
            itemId: r.id,
            itemTitle: r.title || "Loisir",
            itemType: "reward",
            itemTypeLabel: "Récompense",
            tags: leisureTags,
            minutes: log.duration,
            hours: Number((log.duration / 60).toFixed(2)),
            status: "Loisir",
            coinsDelta: -Math.abs(log.duration * costPerMin),
          });
        }
      });
    }
  });

  // Tri chronologique des logs : plus ancien au plus récent
  allLogs.sort((a, b) => a.date.localeCompare(b.date));

  // Totaux globaux
  let totalWorkMinutes = 0;
  let totalLeisureMinutes = 0;

  allLogs.forEach((log) => {
    if (log.itemTypeLabel === "Récompense") {
      totalLeisureMinutes += log.minutes;
    } else {
      totalWorkMinutes += log.minutes;
    }
  });

  const totalWorkHours = Number((totalWorkMinutes / 60).toFixed(2));
  const totalLeisureHours = Number((totalLeisureMinutes / 60).toFixed(2));
  const netMinutes = totalWorkMinutes - totalLeisureMinutes;
  const netHours = Number((netMinutes / 60).toFixed(2));

  // 1. Agrégation par Jour & Cumul
  const daysMap = new Map<string, { work: number; leisure: number; count: number }>();
  allLogs.forEach((log) => {
    const entry = daysMap.get(log.date) || { work: 0, leisure: 0, count: 0 };
    if (log.itemTypeLabel === "Récompense") {
      entry.leisure += log.minutes;
    } else {
      entry.work += log.minutes;
    }
    entry.count += 1;
    daysMap.set(log.date, entry);
  });

  const sortedDates = Array.from(daysMap.keys()).sort((a, b) => a.localeCompare(b));
  let runningWorkMin = 0;
  let runningLeisureMin = 0;
  const dailySummaries: DayTimeSummary[] = sortedDates.map((dateStr) => {
    const entry = daysMap.get(dateStr)!;
    runningWorkMin += entry.work;
    runningLeisureMin += entry.leisure;
    const netM = entry.work - entry.leisure;
    const runningNetMin = runningWorkMin - runningLeisureMin;
    return {
      date: dateStr,
      workMinutes: entry.work,
      workHours: Number((entry.work / 60).toFixed(2)),
      leisureMinutes: entry.leisure,
      leisureHours: Number((entry.leisure / 60).toFixed(2)),
      netMinutes: netM,
      netHours: Number((netM / 60).toFixed(2)),
      cumulativeWorkMinutes: runningWorkMin,
      cumulativeWorkHours: Number((runningWorkMin / 60).toFixed(2)),
      cumulativeLeisureMinutes: runningLeisureMin,
      cumulativeLeisureHours: Number((runningLeisureMin / 60).toFixed(2)),
      cumulativeNetMinutes: runningNetMin,
      cumulativeNetHours: Number((runningNetMin / 60).toFixed(2)),
      itemsCount: entry.count,
    };
  });

  const uniqueDaysCount = sortedDates.length;
  const avgWorkMinutesPerDay = uniqueDaysCount > 0 ? Math.round(totalWorkMinutes / uniqueDaysCount) : 0;
  const avgWorkHoursPerDay = Number((avgWorkMinutesPerDay / 60).toFixed(2));

  // 2. Agrégation par Tâche / Élément
  const itemsMap = new Map<string, {
    itemId: string;
    title: string;
    typeLabel: "Tâche" | "Habitude" | "Récompense";
    tagsSet: Set<string>;
    totalMinutes: number;
    daysSet: Set<string>;
  }>();

  allLogs.forEach((log) => {
    const key = `${log.itemTypeLabel}-${log.itemTitle}`;
    const entry = itemsMap.get(key) || {
      itemId: log.itemId,
      title: log.itemTitle,
      typeLabel: log.itemTypeLabel,
      tagsSet: new Set<string>(),
      totalMinutes: 0,
      daysSet: new Set<string>(),
    };
    log.tags.forEach((tag) => entry.tagsSet.add(tag));
    entry.totalMinutes += log.minutes;
    entry.daysSet.add(log.date);
    itemsMap.set(key, entry);
  });

  const itemSummaries: ItemTimeSummary[] = Array.from(itemsMap.values())
    .map((item) => {
      const activeDays = item.daysSet.size;
      const avgMin = activeDays > 0 ? Math.round(item.totalMinutes / activeDays) : item.totalMinutes;
      const totalH = Number((item.totalMinutes / 60).toFixed(2));
      const pct = totalWorkMinutes > 0 ? Number(((item.totalMinutes / totalWorkMinutes) * 100).toFixed(1)) : 0;
      return {
        itemId: item.itemId,
        title: item.title,
        typeLabel: item.typeLabel,
        tags: Array.from(item.tagsSet),
        totalMinutes: item.totalMinutes,
        totalHours: totalH,
        activeDaysCount: activeDays,
        avgMinutesPerActiveDay: avgMin,
        avgHoursPerActiveDay: Number((avgMin / 60).toFixed(2)),
        percentageOfTotalWork: pct,
      };
    })
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  // 3. Agrégation par Type (Tâche, Habitude, Récompense)
  const typesOrder: ("Tâche" | "Habitude" | "Récompense")[] = ["Tâche", "Habitude", "Récompense"];
  const typesMap = new Map<"Tâche" | "Habitude" | "Récompense", { minutes: number; count: number; days: Set<string> }>();
  typesOrder.forEach((t) => typesMap.set(t, { minutes: 0, count: 0, days: new Set<string>() }));

  allLogs.forEach((log) => {
    const entry = typesMap.get(log.itemTypeLabel);
    if (entry) {
      entry.minutes += log.minutes;
      entry.count += 1;
      entry.days.add(log.date);
    }
  });

  const grandTotalMinutes = totalWorkMinutes + totalLeisureMinutes;
  const typeSummaries: TypeTimeSummary[] = typesOrder.map((t) => {
    const data = typesMap.get(t)!;
    const daysCount = data.days.size;
    const avgMin = daysCount > 0 ? Math.round(data.minutes / daysCount) : 0;
    const pct = grandTotalMinutes > 0 ? Number(((data.minutes / grandTotalMinutes) * 100).toFixed(1)) : 0;
    return {
      typeLabel: t,
      totalMinutes: data.minutes,
      totalHours: Number((data.minutes / 60).toFixed(2)),
      logsCount: data.count,
      activeDaysCount: daysCount,
      avgMinutesPerDay: avgMin,
      avgHoursPerDay: Number((avgMin / 60).toFixed(2)),
      percentageOfTotal: pct,
    };
  });

  // 4. Agrégation par Tag
  const tagsMap = new Map<string, { minutes: number; items: Set<string>; days: Set<string> }>();
  allLogs.forEach((log) => {
    log.tags.forEach((tag) => {
      const cleanTag = tag.trim() || "Sans tag";
      const entry = tagsMap.get(cleanTag) || { minutes: 0, items: new Set<string>(), days: new Set<string>() };
      entry.minutes += log.minutes;
      entry.items.add(log.itemTitle);
      entry.days.add(log.date);
      tagsMap.set(cleanTag, entry);
    });
  });

  const tagSummaries: TagTimeSummary[] = Array.from(tagsMap.entries())
    .map(([tag, data]) => {
      const daysCount = data.days.size;
      const avgMin = daysCount > 0 ? Math.round(data.minutes / daysCount) : 0;
      const pct = grandTotalMinutes > 0 ? Number(((data.minutes / grandTotalMinutes) * 100).toFixed(1)) : 0;
      return {
        tag,
        totalMinutes: data.minutes,
        totalHours: Number((data.minutes / 60).toFixed(2)),
        itemsCount: data.items.size,
        activeDaysCount: daysCount,
        avgMinutesPerDay: avgMin,
        avgHoursPerDay: Number((avgMin / 60).toFixed(2)),
        percentageOfTotal: pct,
      };
    })
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  return {
    allLogs,
    dailySummaries,
    itemSummaries,
    typeSummaries,
    tagSummaries,
    totalWorkMinutes,
    totalWorkHours,
    totalLeisureMinutes,
    totalLeisureHours,
    netMinutes,
    netHours,
    uniqueDaysCount,
    avgWorkMinutesPerDay,
    avgWorkHoursPerDay,
  };
}

/**
 * Assure la disponibilité d'un jeton d'accès Google Sheets valide.
 */
export async function ensureSheetsAccessToken(): Promise<string> {
  const currentToken = getSheetsAccessToken();
  if (currentToken) return currentToken;

  const result = await signInWithGoogleSheets();
  if (!result.accessToken) {
    throw new Error("Impossible d'obtenir l'autorisation Google Sheets.");
  }
  return result.accessToken;
}

export interface GoogleSheetsExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  totalLogsCount: number;
  totalWorkHours: number;
  uniqueDaysCount: number;
}

/**
 * Crée un classeur Google Sheets complet avec 4 onglets formatés :
 * 1. Synthèse & Métriques
 * 2. Logs Quotidiens & Cumul
 * 3. Par Tâche
 * 4. Tous les Logs Détaillés
 */
export async function exportTimeToGoogleSheets(db: AppDatabase): Promise<GoogleSheetsExportResult> {
  let token = await ensureSheetsAccessToken();
  const data = extractAllTimeData(db);

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const spreadsheetTitle = `ᵗ°ᵈ° - Logs de Temps (${dateStr} ${timeStr})`;

  // Définition des feuilles
  const sheetTitles = [
    "Synthèse & Métriques",
    "Logs Quotidiens & Cumul",
    "Par Tâche",
    "Tous les Logs Détaillés",
    "archive jeux",
  ];

  // 1. Création de la feuille de calcul via l'API Google Sheets
  const createPayload = {
    properties: {
      title: spreadsheetTitle,
      locale: "fr_FR",
      autoRecalc: "ON_CHANGE",
    },
    sheets: sheetTitles.map((title) => ({
      properties: {
        title,
        gridProperties: {
          frozenRowCount: title === "archive jeux" ? 10 : 1,
        },
      },
    })),
  };

  let createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createPayload),
  });

  // Si jeton expiré (401), rafraîchir le jeton via réauthentification
  if (createRes.status === 401) {
    setSheetsAccessToken(null);
    token = await ensureSheetsAccessToken();
    createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createPayload),
    });
  }

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Erreur lors de la création Google Sheets (${createRes.status}) : ${errText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Construction des données tabulaires pour chaque onglet

  // --- Onglet 1 : Synthèse & Métriques ---
  const sheet1Values: any[][] = [
    ["INDICATEUR CLÉ", "VALEUR", "UNITÉ", "DÉTAILS"],
    ["Temps Total Travail", data.totalWorkHours, "heures", `${data.totalWorkMinutes} minutes`],
    ["Temps Total Loisirs / Récompenses", data.totalLeisureHours, "heures", `${data.totalLeisureMinutes} minutes`],
    ["Balance Nette de Temps", data.netHours, "heures", `${data.netMinutes} minutes`],
    ["Nombre de Jours avec Activité", data.uniqueDaysCount, "jours", "Jours avec au moins une session enregistrée"],
    ["Temps Moyen de Travail par Jour", data.avgWorkHoursPerDay, "heures/jour", `${data.avgWorkMinutesPerDay} minutes/jour`],
    ["Nombre Total de Logs Enregistrés", data.allLogs.length, "sessions", "Toutes catégories confondues"],
    ["", "", "", ""],
    ["RÉPARTITION PAR TYPE", "TEMPS TOTAL (MIN)", "TEMPS TOTAL (H)", "TEMPS MOYEN / JOUR (H)", "NB SESSIONS", "JOURS ACTIFS", "% DU TOTAL"],
  ];

  data.typeSummaries.forEach((ts) => {
    sheet1Values.push([
      ts.typeLabel,
      ts.totalMinutes,
      ts.totalHours,
      ts.avgHoursPerDay,
      ts.logsCount,
      ts.activeDaysCount,
      `${ts.percentageOfTotal}%`,
    ]);
  });

  sheet1Values.push(["", "", "", "", "", "", ""]);
  sheet1Values.push(["RÉPARTITION PAR TAG", "TEMPS TOTAL (MIN)", "TEMPS TOTAL (H)", "TEMPS MOYEN / JOUR (H)", "NB ÉLÉMENTS", "JOURS ACTIFS", "% DU TOTAL"]);

  data.tagSummaries.forEach((tagSummary) => {
    sheet1Values.push([
      tagSummary.tag,
      tagSummary.totalMinutes,
      tagSummary.totalHours,
      tagSummary.avgHoursPerDay,
      tagSummary.itemsCount,
      tagSummary.activeDaysCount,
      `${tagSummary.percentageOfTotal}%`,
    ]);
  });

  // --- Onglet 2 : Logs Quotidiens & Cumul ---
  const sheet2Values: any[][] = [
    [
      "Date",
      "Temps Travail (min)",
      "Temps Travail (h)",
      "Temps Loisirs/Récompenses (min)",
      "Temps Loisirs/Récompenses (h)",
      "Balance Nette (h)",
      "Temps Cumulé Travail (min)",
      "Temps Cumulé Travail (h)",
      "Nb Sessions",
    ],
  ];

  data.dailySummaries.forEach((d) => {
    sheet2Values.push([
      d.date,
      d.workMinutes,
      d.workHours,
      d.leisureMinutes,
      d.leisureHours,
      d.netHours,
      d.cumulativeWorkMinutes,
      d.cumulativeWorkHours,
      d.itemsCount,
    ]);
  });

  if (data.dailySummaries.length > 0) {
    const lastRow = data.dailySummaries.length + 1;
    sheet2Values.push([
      "TOTAL",
      `=SOMME(B2:B${lastRow})`,
      `=SOMME(C2:C${lastRow})`,
      `=SOMME(D2:D${lastRow})`,
      `=SOMME(E2:E${lastRow})`,
      `=SOMME(F2:F${lastRow})`,
      "-",
      "-",
      `=SOMME(I2:I${lastRow})`,
    ]);
    sheet2Values.push([
      "MOYENNE / JOUR",
      `=MOYENNE(B2:B${lastRow})`,
      `=MOYENNE(C2:C${lastRow})`,
      `=MOYENNE(D2:D${lastRow})`,
      `=MOYENNE(E2:E${lastRow})`,
      `=MOYENNE(F2:F${lastRow})`,
      "-",
      "-",
      `=MOYENNE(I2:I${lastRow})`,
    ]);
  } else {
    sheet2Values.push(["Aucun log enregistré", 0, 0, 0, 0, 0, 0, 0, 0]);
  }

  // --- Onglet 3 : Par Tâche / Élément ---
  const sheet3Values: any[][] = [
    [
      "Titre de l'Élément",
      "Type",
      "Tags",
      "Temps Total (min)",
      "Temps Total (h)",
      "Jours Actifs",
      "Temps Moyen / Jour (min)",
      "Temps Moyen / Jour (h)",
      "% du Temps de Travail",
    ],
  ];

  data.itemSummaries.forEach((it) => {
    sheet3Values.push([
      it.title,
      it.typeLabel,
      it.tags.join(", "),
      it.totalMinutes,
      it.totalHours,
      it.activeDaysCount,
      it.avgMinutesPerActiveDay,
      it.avgHoursPerActiveDay,
      `${it.percentageOfTotalWork}%`,
    ]);
  });

  if (data.itemSummaries.length > 0) {
    const lastRow = data.itemSummaries.length + 1;
    sheet3Values.push([
      "TOTAL",
      "-",
      "-",
      `=SOMME(D2:D${lastRow})`,
      `=SOMME(E2:E${lastRow})`,
      "-",
      "-",
      "-",
      "100%",
    ]);
  } else {
    sheet3Values.push(["Aucune tâche enregistrée", "-", "-", 0, 0, 0, 0, 0, "0%"]);
  }

  // --- Onglet 4 : Tous les Logs Détaillés ---
  const sheet4Values: any[][] = [
    [
      "Date",
      "Titre",
      "Type",
      "Tags",
      "Durée (min)",
      "Durée (h)",
      "Statut",
      "Variation Coins (CS)",
    ],
  ];

  data.allLogs.forEach((log) => {
    sheet4Values.push([
      log.date,
      log.itemTitle,
      log.itemTypeLabel,
      log.tags.join(", "),
      log.minutes,
      log.hours,
      log.status,
      log.coinsDelta !== undefined ? log.coinsDelta : 0,
    ]);
  });

  if (data.allLogs.length === 0) {
    sheet4Values.push(["-", "Aucun log enregistré", "-", "-", 0, 0, "-", 0]);
  }

  // --- Onglet 5 : archive jeux ---
  const archiveJeuxValues = buildArchiveJeuxSheet(db);

  // 3. Écriture par lot (batchUpdate values) avec USER_ENTERED
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: [
          { range: "'Synthèse & Métriques'!A1", values: sheet1Values },
          { range: "'Logs Quotidiens & Cumul'!A1", values: sheet2Values },
          { range: "'Par Tâche'!A1", values: sheet3Values },
          { range: "'Tous les Logs Détaillés'!A1", values: sheet4Values },
          { range: "'archive jeux'!A1", values: archiveJeuxValues },
        ],
      }),
    }
  );

  if (!writeRes.ok) {
    const errText = await writeRes.text();
    console.warn("Avertissement écriture des valeurs Google Sheets :", errText);
  }

  // 4. Mise en forme soignée : ajustement automatique des largeurs de colonnes & styles
  try {
    const sheetIdsMap = (createdData.sheets || []).map((s: any) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
    }));

    const formatRequests: any[] = [];

    sheetIdsMap.forEach((sheetInfo: { sheetId: number; title: string }) => {
      // Auto-dimensionnement de toutes les colonnes de chaque feuille
      formatRequests.push({
        autoResizeDimensions: {
          dimensions: {
            sheetId: sheetInfo.sheetId,
            dimension: "COLUMNS",
            startIndex: 0,
            endIndex: 25,
          },
        },
      });

      if (sheetInfo.title === "archive jeux") {
        // En-tête Ligne 10 (titres des jeux)
        formatRequests.push({
          repeatCell: {
            range: {
              sheetId: sheetInfo.sheetId,
              startRowIndex: 9,
              endRowIndex: 10,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.98, green: 0.88, blue: 0.3 }, // Jaune Memphis
                textFormat: {
                  bold: true,
                  fontSize: 10,
                  foregroundColor: { red: 0, green: 0, blue: 0 },
                },
                horizontalAlignment: "CENTER",
              },
            },
            fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
          },
        });

        // Ligne 4 : Jours écoulés (Nombre entier)
        formatRequests.push({
          repeatCell: {
            range: {
              sheetId: sheetInfo.sheetId,
              startRowIndex: 3,
              endRowIndex: 4,
              startColumnIndex: 0,
              endColumnIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                numberFormat: { type: "NUMBER", pattern: "#,##0" },
                horizontalAlignment: "RIGHT",
              },
            },
            fields: "userEnteredFormat(numberFormat,horizontalAlignment)",
          },
        });

        // Ligne 5 : Heures autorisées (Format durée [h]:mm)
        formatRequests.push({
          repeatCell: {
            range: {
              sheetId: sheetInfo.sheetId,
              startRowIndex: 4,
              endRowIndex: 5,
              startColumnIndex: 0,
              endColumnIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                numberFormat: { type: "TIME", pattern: "[h]:mm" },
                horizontalAlignment: "RIGHT",
              },
            },
            fields: "userEnteredFormat(numberFormat,horizontalAlignment)",
          },
        });

        // Ligne 6 : Années écoulées (A6) & Moyennes par jeu (C6+)
        formatRequests.push({
          repeatCell: {
            range: {
              sheetId: sheetInfo.sheetId,
              startRowIndex: 5,
              endRowIndex: 6,
              startColumnIndex: 0,
              endColumnIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                numberFormat: { type: "NUMBER", pattern: "0.000000000" },
                horizontalAlignment: "RIGHT",
              },
            },
            fields: "userEnteredFormat(numberFormat,horizontalAlignment)",
          },
        });

        formatRequests.push({
          repeatCell: {
            range: {
              sheetId: sheetInfo.sheetId,
              startRowIndex: 5,
              endRowIndex: 6,
              startColumnIndex: 2,
            },
            cell: {
              userEnteredFormat: {
                numberFormat: { type: "TIME", pattern: "[h]:mm:ss" },
                horizontalAlignment: "RIGHT",
              },
            },
            fields: "userEnteredFormat(numberFormat,horizontalAlignment)",
          },
        });

        // Ligne 7 : Moy/j et totaux par jeu en gras avec format de durée [h]:mm:ss
        formatRequests.push({
          repeatCell: {
            range: {
              sheetId: sheetInfo.sheetId,
              startRowIndex: 6,
              endRowIndex: 7,
              startColumnIndex: 0,
              endColumnIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                numberFormat: { type: "TIME", pattern: "[h]:mm:ss" },
                horizontalAlignment: "RIGHT",
              },
            },
            fields: "userEnteredFormat(textFormat,numberFormat,horizontalAlignment)",
          },
        });

        formatRequests.push({
          repeatCell: {
            range: {
              sheetId: sheetInfo.sheetId,
              startRowIndex: 6,
              endRowIndex: 7,
              startColumnIndex: 2,
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                numberFormat: { type: "TIME", pattern: "[h]:mm:ss" },
                horizontalAlignment: "RIGHT",
              },
            },
            fields: "userEnteredFormat(textFormat,numberFormat,horizontalAlignment)",
          },
        });

        // Ligne 8 : Heures restantes (Durée [h]:mm:ss)
        formatRequests.push({
          repeatCell: {
            range: {
              sheetId: sheetInfo.sheetId,
              startRowIndex: 7,
              endRowIndex: 8,
              startColumnIndex: 0,
              endColumnIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                numberFormat: { type: "TIME", pattern: "[h]:mm:ss" },
                horizontalAlignment: "RIGHT",
              },
            },
            fields: "userEnteredFormat(textFormat,numberFormat,horizontalAlignment)",
          },
        });

        // Lignes 11+ Col B : Totaux journaliers avec formule en [h]:mm
        formatRequests.push({
          repeatCell: {
            range: {
              sheetId: sheetInfo.sheetId,
              startRowIndex: 10,
              startColumnIndex: 1,
              endColumnIndex: 2,
            },
            cell: {
              userEnteredFormat: {
                numberFormat: { type: "TIME", pattern: "[h]:mm" },
                horizontalAlignment: "RIGHT",
              },
            },
            fields: "userEnteredFormat(numberFormat,horizontalAlignment)",
          },
        });

        // Lignes 11+ Col C : Dates alignées au centre
        formatRequests.push({
          repeatCell: {
            range: {
              sheetId: sheetInfo.sheetId,
              startRowIndex: 10,
              startColumnIndex: 2,
              endColumnIndex: 3,
            },
            cell: {
              userEnteredFormat: {
                horizontalAlignment: "CENTER",
              },
            },
            fields: "userEnteredFormat(horizontalAlignment)",
          },
        });
      } else {
        // Style de l'en-tête standard (Ligne 1) : texte en gras, fond foncé, bordure
        formatRequests.push({
          repeatCell: {
            range: {
              sheetId: sheetInfo.sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.98, green: 0.88, blue: 0.3 }, // Jaune Memphis tod°
                textFormat: {
                  bold: true,
                  fontSize: 10,
                  foregroundColor: { red: 0, green: 0, blue: 0 },
                },
                horizontalAlignment: "CENTER",
              },
            },
            fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
          },
        });
      }
    });

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests: formatRequests }),
    });
  } catch (e) {
    console.warn("Mise en forme avancée facultative non bloquante :", e);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: spreadsheetTitle,
    totalLogsCount: data.allLogs.length,
    totalWorkHours: data.totalWorkHours,
    uniqueDaysCount: data.uniqueDaysCount,
  };
}
