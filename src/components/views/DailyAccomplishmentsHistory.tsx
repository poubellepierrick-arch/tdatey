import React, { useState, useMemo } from 'react';
import type { AppDatabase, Task, Habit, RecurringTask, Reward, SleepWakeLog } from '../../types';
import { 
  Calendar, Check, Clock, Search, ChevronDown, ChevronUp, Sparkles, Filter, 
  ArrowUpRight, ArrowDownRight, Award, Sun, TrendingUp, TrendingDown, BarChart3, LineChart
} from 'lucide-react';
import CoinsHistoryChart from '../dashboard/CoinsHistoryChart';
import TimeHistoryChart from '../dashboard/TimeHistoryChart';

export interface AccomplishedItem {
  id: string;
  title: string;
  itemType: 'task' | 'habit' | 'recurring' | 'reward' | 'wake';
  isCompleted: boolean;
  minutes: number;
  completedAt?: string;
  coinsDelta: number;
  raw?: any;
}

export interface DayAccomplishmentSummary {
  dateStr: string;
  formattedDate: string;
  isToday: boolean;
  isYesterday: boolean;
  items: AccomplishedItem[];
  totalGains: number;
  totalExpenses: number;
  netCoins: number;
  totalMinutes: number;
  completedCount: number;
}

interface DailyAccomplishmentsHistoryProps {
  db: AppDatabase;
}

// Fonction pure calculant les accomplissements pour une date spécifique
export function computeDayAccomplishments(db: AppDatabase, targetDate: string): AccomplishedItem[] {
  const items: AccomplishedItem[] = [];

  // 1. Tâches
  (db.tasks || []).forEach((t) => {
    if (t.type === 'routine' || t.isPlanningOnly) return;
    const isCompletedOnDate = Boolean(
      (t.isCompleted || t.status === 'done' || t.planningStatus === 'done') &&
      t.completedAt &&
      t.completedAt.split('T')[0] === targetDate
    );

    const workSec = t.workHistory?.[targetDate] || 0;
    let durationFromLogs = 0;
    if (t.timeLog && Array.isArray(t.timeLog)) {
      t.timeLog.forEach((log) => {
        if (log.date && log.date.split('T')[0] === targetDate) {
          durationFromLogs += (log.duration || 0) * 60;
        }
      });
    }

    const effectiveWorkSec = Math.max(workSec, durationFromLogs);
    const minutes = Math.floor(effectiveWorkSec / 60);

    if (isCompletedOnDate) {
      const completionGain = t.rewardValue !== undefined ? t.rewardValue : 15;
      const chronoGain = minutes * (t.chronoRewardValue || 1);
      const coinsDelta = completionGain + chronoGain;
      items.push({
        id: `task-${t.id}-${targetDate}`,
        title: t.title,
        itemType: 'task',
        isCompleted: true,
        minutes,
        completedAt: t.completedAt,
        coinsDelta,
        raw: t
      });
    } else if (minutes > 0) {
      const coinsDelta = minutes * (t.chronoRewardValue || 1);
      items.push({
        id: `task-work-${t.id}-${targetDate}`,
        title: t.title,
        itemType: 'task',
        isCompleted: false,
        minutes,
        coinsDelta,
        raw: t
      });
    }
  });

  // 2. Habitudes
  (db.habits || []).forEach((h) => {
    const valOnDate = h.history?.[targetDate] || 0;
    const workSec = h.workHistory?.[targetDate] || 0;
    let minutes = Math.floor(workSec / 60);
    if (minutes === 0 && h.type === 'chrono' && valOnDate > 0) {
      minutes = valOnDate;
    }

    const isCompleted = valOnDate >= (h.targetValue || 1);
    const hasActivity = valOnDate > 0 || minutes > 0;

    if (hasActivity) {
      const completionGain = isCompleted ? (h.rewardValue !== undefined ? h.rewardValue : 10) : 0;
      const chronoGain = minutes * (h.chronoRewardValue || 1);
      const coinsDelta = completionGain + (minutes > 0 ? chronoGain : 0);
      items.push({
        id: `habit-${h.id}-${targetDate}`,
        title: h.title,
        itemType: 'habit',
        isCompleted,
        minutes,
        completedAt: h.lastCompletedDate === targetDate ? targetDate : undefined,
        coinsDelta,
        raw: h
      });
    }
  });

  // 3. Tâches Récurrentes
  (db.recurringTasks || []).forEach((rt) => {
    const isCompleted = (rt.history?.[targetDate] || 0) > 0;
    const workSec = rt.workHistory?.[targetDate] || 0;
    const minutes = Math.floor(workSec / 60);

    if (isCompleted || minutes > 0) {
      const completionGain = isCompleted ? (rt.rewardValue !== undefined ? rt.rewardValue : 10) : 0;
      const chronoGain = minutes * (rt.chronoRewardValue || 1);
      const coinsDelta = completionGain + chronoGain;
      items.push({
        id: `recurring-${rt.id}-${targetDate}`,
        title: rt.title,
        itemType: 'recurring',
        isCompleted,
        minutes,
        coinsDelta,
        raw: rt
      });
    }
  });

  // 4. Achats & Loisirs Boutique (Rewards)
  (db.rewards || []).forEach((r) => {
    const rewardIcon = typeof r.icon === 'string' && r.icon.trim() ? r.icon : (r.type === 'leisure' ? '📺' : '🎁');

    // Achats
    if (r.purchaseHistory && Array.isArray(r.purchaseHistory)) {
      r.purchaseHistory.forEach((p, idx) => {
        if (p.date && p.date.split('T')[0] === targetDate) {
          const cost = p.cost !== undefined ? p.cost : (r.costCoins || 0);
          items.push({
            id: `reward-buy-${r.id}-${idx}-${targetDate}`,
            title: `${rewardIcon} ${r.title}`,
            itemType: 'reward',
            isCompleted: true,
            completedAt: p.date,
            minutes: 0,
            coinsDelta: -Math.abs(cost),
            raw: r
          });
        }
      });
    }

    // Sessions de loisirs
    if (r.timeLog && Array.isArray(r.timeLog)) {
      let durationOnDate = 0;
      let lastDateStr = '';
      r.timeLog.forEach((log) => {
        if (log.date && log.date.split('T')[0] === targetDate) {
          durationOnDate += log.duration || 0;
          if (log.date) lastDateStr = log.date;
        }
      });

      if (durationOnDate > 0) {
        const costPerMin = r.costCoins !== undefined ? r.costCoins : 1;
        const totalCost = durationOnDate * costPerMin;
        items.push({
          id: `reward-time-${r.id}-${targetDate}`,
          title: `${rewardIcon} ${r.title}`,
          itemType: 'reward',
          isCompleted: true,
          completedAt: lastDateStr || targetDate,
          minutes: durationOnDate,
          coinsDelta: -Math.abs(totalCost),
          raw: r
        });
      }
    }
  });

  // 5. Réveils Matinaux & Couchers (SleepWakeLogs)
  (db.sleepWakeLogs || []).forEach((l) => {
    if (l.date === targetDate) {
      if (l.wakeUpTime) {
        items.push({
          id: `wake-${l.id}-${targetDate}`,
          title: `🌅 Réveil matinal (${l.wakeUpTime})`,
          itemType: 'wake',
          isCompleted: true,
          minutes: 0,
          coinsDelta: l.coinsRewarded || 0,
          raw: l
        });
      }
      if (l.bedTime) {
        items.push({
          id: `bed-${l.id}-${targetDate}`,
          title: `🌙 Coucher (${l.bedTime})`,
          itemType: 'wake',
          isCompleted: true,
          minutes: 0,
          coinsDelta: l.bedTimeCoinsRewarded || 0,
          raw: l
        });
      }
    }
  });

  return items;
}

export const DailyAccomplishmentsHistory: React.FC<DailyAccomplishmentsHistoryProps> = ({ db }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | '7days' | '30days' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [analyticsTab, setAnalyticsTab] = useState<'coins' | 'time' | 'summary7d'>('coins');

  const todayStr = useMemo(() => {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  // 1. Extraction exhaustive de toutes les dates historiques actives dans la base
  const allHistoricalDates = useMemo(() => {
    const datesSet = new Set<string>();

    // Aujourd'hui toujours présent
    datesSet.add(todayStr);

    // Tâches
    (db.tasks || []).forEach((t) => {
      if (t.completedAt) datesSet.add(t.completedAt.split('T')[0]);
      if (t.workHistory) Object.keys(t.workHistory).forEach((d) => datesSet.add(d));
      if (t.timeLog) t.timeLog.forEach((log) => log.date && datesSet.add(log.date.split('T')[0]));
    });

    // Habitudes
    (db.habits || []).forEach((h) => {
      if (h.history) Object.keys(h.history).forEach((d) => datesSet.add(d));
      if (h.workHistory) Object.keys(h.workHistory).forEach((d) => datesSet.add(d));
      if (h.lastCompletedDate) datesSet.add(h.lastCompletedDate);
    });

    // Tâches Récurrentes
    (db.recurringTasks || []).forEach((rt) => {
      if (rt.history) Object.keys(rt.history).forEach((d) => datesSet.add(d));
      if (rt.workHistory) Object.keys(rt.workHistory).forEach((d) => datesSet.add(d));
    });

    // Récompenses / Achats
    (db.rewards || []).forEach((r) => {
      if (r.purchaseHistory) r.purchaseHistory.forEach((p) => p.date && datesSet.add(p.date.split('T')[0]));
      if (r.timeLog) r.timeLog.forEach((log) => log.date && datesSet.add(log.date.split('T')[0]));
    });

    // Réveils
    (db.sleepWakeLogs || []).forEach((l) => {
      if (l.date) datesSet.add(l.date);
    });

    // Tri décroissant (les dates les plus récentes en premier)
    return Array.from(datesSet).sort((a, b) => b.localeCompare(a));
  }, [db, todayStr]);

  // 2. Formatage lisible de la date
  const formatDayHeader = (dateStr: string) => {
    if (dateStr === todayStr) return "Aujourd'hui";
    if (dateStr === yesterdayStr) return "Hier";
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // 3. Calcul synthétique pour chaque date
  const daySummaries = useMemo<DayAccomplishmentSummary[]>(() => {
    const list: DayAccomplishmentSummary[] = [];

    allHistoricalDates.forEach((dateStr) => {
      const items = computeDayAccomplishments(db, dateStr);

      // On inclut le jour s'il a au moins un élément, ou s'il s'agit d'aujourd'hui
      if (items.length > 0 || dateStr === todayStr) {
        const totalGains = items.reduce((sum, it) => sum + (it.coinsDelta > 0 ? it.coinsDelta : 0), 0);
        const totalExpenses = items.reduce((sum, it) => sum + (it.coinsDelta < 0 ? Math.abs(it.coinsDelta) : 0), 0);
        const netCoins = totalGains - totalExpenses;
        const totalMinutes = items.reduce((sum, it) => sum + (it.minutes || 0), 0);
        const completedCount = items.filter((it) => it.isCompleted).length;

        list.push({
          dateStr,
          formattedDate: formatDayHeader(dateStr),
          isToday: dateStr === todayStr,
          isYesterday: dateStr === yesterdayStr,
          items,
          totalGains,
          totalExpenses,
          netCoins,
          totalMinutes,
          completedCount
        });
      }
    });

    return list;
  }, [allHistoricalDates, db, todayStr, yesterdayStr]);

  // 4. Filtrage par période & recherche
  const filteredSummaries = useMemo(() => {
    let result = daySummaries;

    // Filtre période
    if (filterPeriod === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoffStr = sevenDaysAgo.toISOString().split('T')[0];
      result = result.filter((day) => day.dateStr >= cutoffStr);
    } else if (filterPeriod === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffStr = thirtyDaysAgo.toISOString().split('T')[0];
      result = result.filter((day) => day.dateStr >= cutoffStr);
    } else if (filterPeriod === 'custom' && customDate) {
      result = result.filter((day) => day.dateStr === customDate);
    }

    // Filtre de recherche
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result
        .map((day) => {
          const matchingItems = day.items.filter((it) => it.title.toLowerCase().includes(q));
          if (matchingItems.length > 0 || day.dateStr.includes(q) || day.formattedDate.toLowerCase().includes(q)) {
            return {
              ...day,
              items: matchingItems.length > 0 ? matchingItems : day.items
            };
          }
          return null;
        })
        .filter((day): day is DayAccomplishmentSummary => day !== null);
    }

    return result;
  }, [daySummaries, filterPeriod, customDate, searchQuery]);

  // Statistiques cumulées sur la vue filtrée
  const stats = useMemo(() => {
    let totalItems = 0;
    let totalGains = 0;
    let totalExpenses = 0;
    let totalMinutes = 0;

    filteredSummaries.forEach((day) => {
      totalItems += day.items.length;
      totalGains += day.totalGains;
      totalExpenses += day.totalExpenses;
      totalMinutes += day.totalMinutes;
    });

    return {
      daysCount: filteredSummaries.length,
      totalItems,
      totalGains,
      totalExpenses,
      netCoins: totalGains - totalExpenses,
      totalMinutes
    };
  }, [filteredSummaries]);

  const toggleDayExpansion = (dateStr: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateStr]: prev[dateStr] === undefined ? false : !prev[dateStr]
    }));
  };

  const isDayExpanded = (dateStr: string, idx: number) => {
    // Par défaut, les 3 premiers jours sont ouverts
    if (expandedDates[dateStr] !== undefined) {
      return expandedDates[dateStr];
    }
    return idx < 3;
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  // 5. Bilan Hebdomadaire des CS (7 derniers jours complets)
  const weeklyCsSummary = useMemo(() => {
    const days: Array<{
      dateStr: string;
      dayLabel: string;
      shortDate: string;
      gains: number;
      expenses: number;
      net: number;
    }> = [];

    let totalGains7d = 0;
    let totalExpenses7d = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const items = computeDayAccomplishments(db, dStr);
      const gains = items.reduce((sum, it) => sum + (it.coinsDelta > 0 ? it.coinsDelta : 0), 0);
      const expenses = items.reduce((sum, it) => sum + (it.coinsDelta < 0 ? Math.abs(it.coinsDelta) : 0), 0);
      const net = gains - expenses;

      totalGains7d += gains;
      totalExpenses7d += expenses;

      const rawDayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayLabel = dStr === todayStr ? 'Auj.' : rawDayLabel.charAt(0).toUpperCase() + rawDayLabel.slice(1);
      const shortDate = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

      days.push({
        dateStr: dStr,
        dayLabel,
        shortDate,
        gains,
        expenses,
        net
      });
    }

    const maxVal = Math.max(10, ...days.map((d) => Math.max(d.gains, d.expenses)));

    return {
      days,
      totalGains: totalGains7d,
      totalExpenses: totalExpenses7d,
      netTotal: totalGains7d - totalExpenses7d,
      maxVal
    };
  }, [db, todayStr]);

  return (
    <div className="space-y-6">
      {/* BILAN DES FLUX (CS & TEMPS DE TRAVAIL / LOISIRS) */}
      <div className="bg-white border-4 border-black p-4 shadow-[5px_5px_0px_#000] space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-2.5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-700 stroke-[2.5]" />
            <h3 className="font-mono font-black text-xs uppercase tracking-tight text-black">
              Analyses Rétrospectives (CS & Temps)
            </h3>
          </div>
          {/* Onglets de sélection du graphique */}
          <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px] font-black">
            <button
              type="button"
              onClick={() => setAnalyticsTab('coins')}
              className={`border-2 border-black px-2.5 py-1 uppercase flex items-center gap-1 shadow-[1px_1px_0px_#000] cursor-pointer ${
                analyticsTab === 'coins' ? 'bg-yellow-300 text-black shadow-[inset_1px_1px_0px_#000]' : 'bg-white hover:bg-gray-100 text-black'
              }`}
            >
              <TrendingUp size={11} /> Flux CS
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsTab('time')}
              className={`border-2 border-black px-2.5 py-1 uppercase flex items-center gap-1 shadow-[1px_1px_0px_#000] cursor-pointer ${
                analyticsTab === 'time' ? 'bg-indigo-600 text-white shadow-[inset_1px_1px_0px_#000]' : 'bg-white hover:bg-gray-100 text-black'
              }`}
            >
              <Clock size={11} /> Temps Travail & Loisirs
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsTab('summary7d')}
              className={`border-2 border-black px-2.5 py-1 uppercase flex items-center gap-1 shadow-[1px_1px_0px_#000] cursor-pointer ${
                analyticsTab === 'summary7d' ? 'bg-black text-white shadow-[inset_1px_1px_0px_#000]' : 'bg-white hover:bg-gray-100 text-black'
              }`}
            >
              <BarChart3 size={11} /> 7 Jours (CS)
            </button>
          </div>
        </div>

        {analyticsTab === 'coins' && (
          <div className="pt-2">
            <CoinsHistoryChart db={db} defaultPeriod="14d" />
          </div>
        )}

        {analyticsTab === 'time' && (
          <div className="pt-2">
            <TimeHistoryChart db={db} defaultPeriod="14d" />
          </div>
        )}

        {analyticsTab === 'summary7d' && (
          <>
            {/* Graphique / Diagramme en bâtons comparatif 7 jours */}
            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {weeklyCsSummary.days.map((d) => {
                const gainHeightPct = Math.round((d.gains / weeklyCsSummary.maxVal) * 100);
                const expHeightPct = Math.round((d.expenses / weeklyCsSummary.maxVal) * 100);

                return (
                  <div
                    key={d.dateStr}
                    className={`border-2 border-black p-1.5 flex flex-col justify-between text-center transition-all ${
                      d.dateStr === todayStr ? 'bg-yellow-50 shadow-[2px_2px_0px_#000]' : 'bg-white'
                    }`}
                  >
                    {/* En-tête du jour */}
                    <div className="border-b border-black/20 pb-1 mb-1.5">
                      <span className={`font-mono text-[10px] font-black uppercase block ${
                        d.dateStr === todayStr ? 'text-indigo-800' : 'text-black'
                      }`}>
                        {d.dayLabel}
                      </span>
                      <span className="font-mono text-[9px] text-gray-500 font-bold block">
                        {d.shortDate}
                      </span>
                    </div>

                    {/* Barres verticales comparatives Gains (vert) vs Dépenses (rose) */}
                    <div className="h-20 flex items-end justify-center gap-1.5 px-1 py-1 bg-gray-50 border border-black/20 mb-1.5">
                      {/* Bâton Gains */}
                      <div className="w-1/2 flex flex-col items-center justify-end h-full">
                        <div
                          className="w-full bg-emerald-400 border border-black min-h-[2px] transition-all duration-300"
                          style={{ height: `${Math.max(4, gainHeightPct)}%` }}
                          title={`Gains: +${d.gains} CS`}
                        />
                      </div>

                      {/* Bâton Dépenses */}
                      <div className="w-1/2 flex flex-col items-center justify-end h-full">
                        <div
                          className="w-full bg-rose-400 border border-black min-h-[2px] transition-all duration-300"
                          style={{ height: `${Math.max(4, expHeightPct)}%` }}
                          title={`Dépenses: -${d.expenses} CS`}
                        />
                      </div>
                    </div>

                    {/* Valeurs chiffrées & Solde net journalier */}
                    <div className="space-y-0.5 font-mono text-[9px] font-black">
                      <div className="text-emerald-700">+{d.gains}</div>
                      <div className="text-rose-700">-{d.expenses}</div>
                      <div className={`mt-0.5 pt-0.5 border-t border-black/20 text-[9.5px] ${
                        d.net > 0 ? 'text-emerald-900 font-black' : d.net < 0 ? 'text-rose-900 font-black' : 'text-gray-400'
                      }`}>
                        {d.net > 0 ? `+${d.net}` : d.net}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-gray-600 font-bold pt-1 border-t border-dashed border-gray-300">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-emerald-400 border border-black inline-block"></span>
                  <span>Gains (+CS)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-rose-400 border border-black inline-block"></span>
                  <span>Dépenses (-CS)</span>
                </span>
              </div>
              <span>Valeurs quotidiennes exactes</span>
            </div>
          </>
        )}
      </div>

      {/* Bannière de statistiques globales rétroactives */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_#000]">
          <span className="text-[10px] font-bold text-gray-500 block uppercase">Jours Enregistrés</span>
          <span className="font-black text-lg text-black">{stats.daysCount}</span>
        </div>
        <div className="bg-emerald-50 border-2 border-black p-3 shadow-[2px_2px_0px_#000]">
          <span className="text-[10px] font-bold text-emerald-800 block uppercase">Gains Cumulés</span>
          <span className="font-black text-lg text-emerald-700">+{stats.totalGains} CS</span>
        </div>
        <div className="bg-rose-50 border-2 border-black p-3 shadow-[2px_2px_0px_#000]">
          <span className="text-[10px] font-bold text-rose-800 block uppercase">Dépenses Cumulées</span>
          <span className="font-black text-lg text-rose-700">-{stats.totalExpenses} CS</span>
        </div>
        <div className="bg-indigo-50 border-2 border-black p-3 shadow-[2px_2px_0px_#000]">
          <span className="text-[10px] font-bold text-indigo-800 block uppercase">Temps Travaillé</span>
          <span className="font-black text-lg text-indigo-700">{formatTime(stats.totalMinutes)}</span>
        </div>
      </div>

      {/* Barre d'outils et de filtres temporels */}
      <div className="bg-white border-3 border-black p-3.5 shadow-[3px_3px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Sélecteur de période */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterPeriod('all')}
            className={`px-2.5 py-1 text-xs font-black uppercase border-2 border-black cursor-pointer transition-all ${
              filterPeriod === 'all'
                ? 'bg-black text-white shadow-[1.5px_1.5px_0px_#000]'
                : 'bg-white hover:bg-gray-100 text-black'
            }`}
          >
            Tous les jours ({daySummaries.length})
          </button>
          <button
            onClick={() => setFilterPeriod('7days')}
            className={`px-2.5 py-1 text-xs font-black uppercase border-2 border-black cursor-pointer transition-all ${
              filterPeriod === '7days'
                ? 'bg-black text-white shadow-[1.5px_1.5px_0px_#000]'
                : 'bg-white hover:bg-gray-100 text-black'
            }`}
          >
            7 derniers jours
          </button>
          <button
            onClick={() => setFilterPeriod('30days')}
            className={`px-2.5 py-1 text-xs font-black uppercase border-2 border-black cursor-pointer transition-all ${
              filterPeriod === '30days'
                ? 'bg-black text-white shadow-[1.5px_1.5px_0px_#000]'
                : 'bg-white hover:bg-gray-100 text-black'
            }`}
          >
            30 derniers jours
          </button>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                if (e.target.value) setFilterPeriod('custom');
              }}
              className="text-xs font-mono font-bold border-2 border-black px-1.5 py-0.5 bg-white text-black"
              title="Choisir une date spécifique"
            />
            {filterPeriod === 'custom' && (
              <button
                onClick={() => {
                  setFilterPeriod('all');
                  setCustomDate('');
                }}
                className="text-[10px] font-black border border-black bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-2 top-2 text-gray-500" size={13} />
          <input
            type="text"
            placeholder="Rechercher une tâche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1 text-xs border-2 border-black bg-white focus:outline-none focus:bg-amber-50"
          />
        </div>
      </div>

      {/* Liste des journées */}
      {filteredSummaries.length === 0 ? (
        <div className="bg-white border-3 border-black p-12 text-center shadow-[3px_3px_0px_#000]">
          <Calendar size={36} className="mx-auto text-gray-400 mb-2.5" />
          <p className="font-black text-sm uppercase text-gray-800">Aucun historique d'accomplissement trouvé</p>
          <p className="text-xs text-gray-500 font-bold mt-1">
            {searchQuery
              ? 'Aucune tâche ou activité ne correspond à votre filtre.'
              : 'Vos accomplissements passés apparaîtront automatiquement ici dès qu\'ils sont complétés ou travaillés.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSummaries.map((day, dayIndex) => {
            const isExpanded = isDayExpanded(day.dateStr, dayIndex);

            return (
              <div
                key={day.dateStr}
                className="bg-emerald-50/60 border-3 border-black shadow-[4px_4px_0px_#000] overflow-hidden"
              >
                {/* En-tête de la journée */}
                <div
                  onClick={() => toggleDayExpansion(day.dateStr)}
                  className="p-3 bg-emerald-100/90 border-b-2 border-black cursor-pointer hover:bg-emerald-200/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">
                      {day.isToday ? '☀️' : '🏆'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-sm uppercase text-black">
                          {day.formattedDate}
                        </h3>
                        <span className="text-[10px] font-mono text-gray-600 font-bold">
                          ({day.dateStr})
                        </span>
                        {day.isToday && (
                          <span className="bg-yellow-300 text-black border border-black text-[9px] font-black px-1.5 py-0.2 uppercase">
                            En cours
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-gray-700 font-bold mt-0.5">
                        <span>{day.items.length} élément{day.items.length > 1 ? 's' : ''} ({day.completedCount} validé{day.completedCount > 1 ? 's' : ''})</span>
                        {day.totalMinutes > 0 && (
                          <span className="text-indigo-900 flex items-center gap-1">
                            <Clock size={10} /> {formatTime(day.totalMinutes)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges de gains & dépenses du jour */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {(day.totalGains > 0 || day.totalExpenses > 0) && (
                      <div className="flex items-center gap-1 text-[10px] font-mono font-black">
                        {day.totalGains > 0 && (
                          <span className="bg-emerald-200 text-emerald-950 border border-emerald-500 px-1.5 py-0.5 shadow-[1px_1px_0px_#000]">
                            +{day.totalGains} CS
                          </span>
                        )}
                        {day.totalExpenses > 0 && (
                          <span className="bg-rose-200 text-rose-950 border border-rose-500 px-1.5 py-0.5 shadow-[1px_1px_0px_#000]">
                            -{day.totalExpenses} CS
                          </span>
                        )}
                      </div>
                    )}
                    <button
                      className="p-1 hover:bg-black/10 border border-black bg-white rounded-none cursor-pointer"
                      title={isExpanded ? 'Replier' : 'Déplier'}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Grille des éléments du jour */}
                {isExpanded && (
                  <div className="p-3 bg-white">
                    {day.items.length === 0 ? (
                      <p className="text-xs text-gray-500 italic py-2 text-center">
                        Aucun élément validé ou travaillé sur cette journée.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {day.items.map((item) => {
                          const isTask = item.itemType === 'task';
                          const isHabit = item.itemType === 'habit';
                          const isRecurring = item.itemType === 'recurring';
                          const isReward = item.itemType === 'reward';
                          const isWake = item.itemType === 'wake';

                          if (isWake) {
                            const isPositive = item.coinsDelta >= 0;
                            return (
                              <div
                                key={item.id}
                                className="border border-black bg-amber-50 p-1.5 flex justify-between items-center shadow-[1.5px_1.5px_0px_#000]"
                              >
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <span className="text-xs shrink-0">🌅</span>
                                  <span className="font-black text-[11px] truncate text-slate-900">
                                    {item.title}
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] font-black font-mono px-1.5 py-0.5 border shadow-[1px_1px_0px_#000] shrink-0 ${
                                    isPositive
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                                      : 'bg-rose-100 text-rose-800 border-rose-400'
                                  }`}
                                >
                                  {isPositive ? `+${item.coinsDelta}` : item.coinsDelta} CS
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={item.id}
                              className="border border-black bg-white p-1.5 flex justify-between items-center shadow-[1.5px_1.5px_0px_#000] gap-1.5"
                            >
                              <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
                                <span
                                  className={`w-4 h-4 border border-black flex items-center justify-center shrink-0 ${
                                    isReward
                                      ? 'bg-amber-400 text-black'
                                      : item.isCompleted
                                      ? 'bg-[#24B27F] text-white'
                                      : 'bg-gray-100 text-gray-400'
                                  }`}
                                >
                                  {item.isCompleted ? <Check size={10} className="font-black" /> : null}
                                </span>

                                <span
                                  className={`text-[11px] font-bold leading-none truncate ${
                                    item.isCompleted
                                      ? isReward
                                        ? 'text-gray-800'
                                        : 'text-gray-500 line-through'
                                      : 'text-gray-900'
                                  }`}
                                  title={item.title}
                                >
                                  <span className="text-[9px] text-gray-500 font-mono mr-1">
                                    [{isTask ? 'T' : isHabit ? 'H' : isRecurring ? 'R' : 'B'}]
                                  </span>
                                  {item.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {item.minutes > 0 && (
                                  <span
                                    className="text-[8px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded-sm"
                                    title="Temps passé sur cette journée"
                                  >
                                    ⏱️ {item.minutes}m
                                  </span>
                                )}

                                {item.completedAt && (
                                  <span
                                    className="text-[8px] font-bold text-green-800 bg-green-100 border border-green-300 px-1 py-0.2 rounded-sm"
                                    title="Effectué à"
                                  >
                                    ✓ {item.completedAt.includes('T') ? new Date(item.completedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Validé'}
                                  </span>
                                )}

                                {typeof item.coinsDelta === 'number' && (
                                  <span
                                    className={`text-[10px] font-black font-mono px-1.5 py-0.5 border shadow-[1px_1px_0px_#000] shrink-0 ${
                                      item.coinsDelta > 0
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                                        : item.coinsDelta < 0
                                        ? 'bg-rose-100 text-rose-800 border-rose-400'
                                        : 'bg-gray-100 text-gray-700 border-gray-300'
                                    }`}
                                  >
                                    {item.coinsDelta > 0
                                      ? `+${item.coinsDelta} CS`
                                      : item.coinsDelta < 0
                                      ? `${item.coinsDelta} CS`
                                      : '0 CS'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DailyAccomplishmentsHistory;
