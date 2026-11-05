import React, { useState, useMemo } from "react";
import { SleepWakeLog } from "../../types";
import { TrendingUp, Clock, Calendar, Award, AlertCircle } from "lucide-react";

interface WakeUpChartProps {
  logs: SleepWakeLog[];
  targetWakeTime: string;
}

type PeriodFilter = "7d" | "14d" | "30d" | "all";

export default function WakeUpChart({ logs, targetWakeTime }: WakeUpChartProps) {
  const [period, setPeriod] = useState<PeriodFilter>("14d");
  const [hoveredLogId, setHoveredLogId] = useState<string | null>(null);

  // Helper pour convertir "HH:MM" en minutes depuis minuit
  const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 420; // 07:00 par défaut
    const [h, m] = timeStr.trim().split(":").map((v) => parseInt(v, 10) || 0);
    return h * 60 + m;
  };

  // Helper pour convertir minutes en "HH:MM"
  const minutesToTime = (mins: number): string => {
    const clamped = Math.max(0, Math.min(1439, Math.round(mins)));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const targetMinutes = useMemo(() => timeToMinutes(targetWakeTime), [targetWakeTime]);

  // Filtrer et trier chronologiquement (date croissante)
  const filteredLogs = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));

    if (period === "all") return sorted;

    const count = period === "7d" ? 7 : period === "14d" ? 14 : 30;
    return sorted.slice(-count);
  }, [logs, period]);

  // Statistiques condensées
  const stats = useMemo(() => {
    if (filteredLogs.length === 0) {
      return {
        avgMinutes: targetMinutes,
        avgTime: targetWakeTime,
        onTimeRatio: 0,
        totalCoins: 0,
        minTime: targetWakeTime,
        maxTime: targetWakeTime,
        stdDevMinutes: 0,
        count: 0,
      };
    }

    let sum = 0;
    let onTimeCount = 0;
    let coins = 0;
    let minM = 1440;
    let maxM = 0;

    filteredLogs.forEach((log) => {
      const m = timeToMinutes(log.wakeUpTime);
      sum += m;
      if (m <= targetMinutes) onTimeCount++;
      coins += log.coinsRewarded || 0;
      if (m < minM) minM = m;
      if (m > maxM) maxM = m;
    });

    const avg = sum / filteredLogs.length;

    // Écart type (régularité)
    const variance =
      filteredLogs.reduce((acc, log) => {
        const diff = timeToMinutes(log.wakeUpTime) - avg;
        return acc + diff * diff;
      }, 0) / filteredLogs.length;
    const stdDev = Math.round(Math.sqrt(variance));

    return {
      avgMinutes: avg,
      avgTime: minutesToTime(avg),
      onTimeRatio: Math.round((onTimeCount / filteredLogs.length) * 100),
      totalCoins: coins,
      minTime: minutesToTime(minM),
      maxTime: minutesToTime(maxM),
      stdDevMinutes: stdDev,
      count: filteredLogs.length,
    };
  }, [filteredLogs, targetMinutes, targetWakeTime]);

  // Dimensions et échelles SVG
  const svgWidth = 600;
  const svgHeight = 220;
  const padding = { top: 25, right: 30, bottom: 40, left: 55 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  // Calcul des bornes Y en minutes
  const { yMin, yMax, yTicks } = useMemo(() => {
    if (filteredLogs.length === 0) {
      const base = targetMinutes;
      const min = Math.max(0, Math.floor((base - 60) / 30) * 30);
      const max = Math.min(1440, Math.ceil((base + 60) / 30) * 30);
      return { yMin: min, yMax: max, yTicks: [min, base, max] };
    }

    const allMinutes = filteredLogs.map((l) => timeToMinutes(l.wakeUpTime));
    allMinutes.push(targetMinutes);

    const dataMin = Math.min(...allMinutes);
    const dataMax = Math.max(...allMinutes);

    // Marge de 30 minutes au-dessus et en-dessous, arrondi à des demi-heures
    let min = Math.max(0, Math.floor((dataMin - 30) / 30) * 30);
    let max = Math.min(1440, Math.ceil((dataMax + 30) / 30) * 30);

    // S'assurer d'un écart minimal de 60 min pour la lisibilité
    if (max - min < 60) {
      min = Math.max(0, min - 30);
      max = Math.min(1440, max + 30);
    }

    // Générer 4 à 6 graduations d'heures
    const step = (max - min) > 180 ? 60 : 30;
    const ticks: number[] = [];
    for (let m = min; m <= max; m += step) {
      ticks.push(m);
    }

    return { yMin: min, yMax: max, yTicks: ticks };
  }, [filteredLogs, targetMinutes]);

  // Coordonnées Y pour une minute donnée (le plus tôt vers le bas)
  const getY = (minutes: number): number => {
    if (yMax === yMin) return padding.top + graphHeight / 2;
    const ratio = (minutes - yMin) / (yMax - yMin);
    return padding.top + (1 - ratio) * graphHeight;
  };

  // Coordonnées X pour un index
  const getX = (index: number, total: number): number => {
    if (total <= 1) return padding.left + graphWidth / 2;
    return padding.left + (index / (total - 1)) * graphWidth;
  };

  const points = useMemo(() => {
    return filteredLogs.map((log, index) => {
      const minutes = timeToMinutes(log.wakeUpTime);
      const x = getX(index, filteredLogs.length);
      const y = getY(minutes);
      const isEarlyOrOnTime = minutes <= targetMinutes;
      const deltaMinutes = targetMinutes - minutes;
      return {
        log,
        index,
        x,
        y,
        minutes,
        isEarlyOrOnTime,
        deltaMinutes,
      };
    });
  }, [filteredLogs, targetMinutes, yMin, yMax]);

  // Ligne polygonale
  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, pt, idx) => {
      return `${acc} ${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`;
    }, "");
  }, [points]);

  // Remplissage de zone
  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const bottomY = padding.top + graphHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [points, linePath, graphHeight]);

  const targetY = getY(targetMinutes);

  const hoveredPoint = useMemo(() => {
    if (!hoveredLogId) return null;
    return points.find((p) => p.log.id === hoveredLogId) || null;
  }, [hoveredLogId, points]);

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  return (
    <div id="wake-up-chart-container" className="space-y-3 font-mono text-xs text-black">
      {/* Barre supérieure : sélecteur de période */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2">
        <div className="flex items-center gap-1.5 font-black uppercase text-[11px]">
          <TrendingUp size={14} />
          <span>Courbe des Réveils</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPeriod("7d")}
            className={`px-2 py-0.5 border border-black text-[10px] font-black uppercase cursor-pointer ${
              period === "7d" ? "bg-yellow-300 text-black shadow-[1px_1px_0px_#000]" : "bg-white hover:bg-gray-100"
            }`}
          >
            7 jours
          </button>
          <button
            type="button"
            onClick={() => setPeriod("14d")}
            className={`px-2 py-0.5 border border-black text-[10px] font-black uppercase cursor-pointer ${
              period === "14d" ? "bg-yellow-300 text-black shadow-[1px_1px_0px_#000]" : "bg-white hover:bg-gray-100"
            }`}
          >
            14 jours
          </button>
          <button
            type="button"
            onClick={() => setPeriod("30d")}
            className={`px-2 py-0.5 border border-black text-[10px] font-black uppercase cursor-pointer ${
              period === "30d" ? "bg-yellow-300 text-black shadow-[1px_1px_0px_#000]" : "bg-white hover:bg-gray-100"
            }`}
          >
            30 jours
          </button>
          <button
            type="button"
            onClick={() => setPeriod("all")}
            className={`px-2 py-0.5 border border-black text-[10px] font-black uppercase cursor-pointer ${
              period === "all" ? "bg-yellow-300 text-black shadow-[1px_1px_0px_#000]" : "bg-white hover:bg-gray-100"
            }`}
          >
            Tout ({logs.length})
          </button>
        </div>
      </div>

      {/* Cartouches de statistiques condensées */}
      {filteredLogs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-white border-2 border-black p-1.5 shadow-[1px_1px_0px_#000]">
            <span className="block text-[9px] font-black uppercase text-gray-500">Moyenne</span>
            <span className="text-xs font-black">{stats.avgTime}</span>
          </div>

          <div className="bg-white border-2 border-black p-1.5 shadow-[1px_1px_0px_#000]">
            <span className="block text-[9px] font-black uppercase text-gray-500">Régularité</span>
            <span className="text-xs font-black">±{stats.stdDevMinutes} min</span>
          </div>

          <div className="bg-white border-2 border-black p-1.5 shadow-[1px_1px_0px_#000]">
            <span className="block text-[9px] font-black uppercase text-gray-500">À l'heure / Avance</span>
            <span className={`text-xs font-black ${stats.onTimeRatio >= 70 ? "text-emerald-700" : "text-amber-700"}`}>
              {stats.onTimeRatio}%
            </span>
          </div>

          <div className="bg-white border-2 border-black p-1.5 shadow-[1px_1px_0px_#000]">
            <span className="block text-[9px] font-black uppercase text-gray-500">Solde CS</span>
            <span className={`text-xs font-black ${stats.totalCoins >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {stats.totalCoins >= 0 ? `+${stats.totalCoins}` : stats.totalCoins} CS
            </span>
          </div>
        </div>
      )}

      {/* Rendu Graphique SVG */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-black p-6 text-center text-gray-500 italic text-xs">
          Aucune donnée de réveil disponible pour cette période.
        </div>
      ) : (
        <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_#000] relative">
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto select-none overflow-visible"
              style={{ minWidth: "360px" }}
            >
              {/* Lignes de grille horizontales */}
              {yTicks.map((m) => {
                const y = getY(m);
                const isTarget = m === targetMinutes;
                return (
                  <g key={`ytick-${m}`}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={svgWidth - padding.right}
                      y2={y}
                      stroke={isTarget ? "#eab308" : "#e5e7eb"}
                      strokeWidth={isTarget ? 2 : 1}
                      strokeDasharray={isTarget ? "4,4" : undefined}
                    />
                    <text
                      x={padding.left - 6}
                      y={y + 3.5}
                      textAnchor="end"
                      className={`text-[9px] font-mono ${isTarget ? "font-black fill-yellow-700" : "fill-gray-500"}`}
                    >
                      {minutesToTime(m)}
                    </text>
                  </g>
                );
              })}

              {/* Ligne cible de réveil */}
              {targetY >= padding.top && targetY <= padding.top + graphHeight && (
                <g>
                  <text
                    x={svgWidth - padding.right}
                    y={targetY - 5}
                    textAnchor="end"
                    className="text-[9px] font-mono font-black fill-yellow-700 uppercase"
                  >
                    Cible ({targetWakeTime})
                  </text>
                </g>
              )}

              {/* Lignes verticales / Dates */}
              {points.map((pt, idx) => {
                // Afficher toutes les dates si <= 14, sinon une sur deux
                const showDate = points.length <= 14 || idx % 2 === 0 || idx === points.length - 1;
                return (
                  <g key={`xtick-${pt.log.id}`}>
                    <line
                      x1={pt.x}
                      y1={padding.top}
                      x2={pt.x}
                      y2={padding.top + graphHeight}
                      stroke="#f3f4f6"
                      strokeWidth={1}
                    />
                    {showDate && (
                      <text
                        x={pt.x}
                        y={padding.top + graphHeight + 14}
                        textAnchor="middle"
                        className="text-[8.5px] font-mono fill-gray-600 font-bold"
                      >
                        {formatShortDate(pt.log.date)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Zone dégradée / fond sous la courbe */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="rgba(254, 240, 138, 0.25)"
                />
              )}

              {/* Ligne de tracé */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#000000"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Points interactifs */}
              {points.map((pt) => {
                const isHovered = hoveredLogId === pt.log.id;
                const fillColor = pt.isEarlyOrOnTime ? "#10b981" : "#f43f5e";
                return (
                  <g
                    key={`point-${pt.log.id}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredLogId(pt.log.id)}
                    onMouseLeave={() => setHoveredLogId(null)}
                    onClick={() => setHoveredLogId(isHovered ? null : pt.log.id)}
                  >
                    {/* Zone de survol élargie */}
                    <circle cx={pt.x} cy={pt.y} r={12} fill="transparent" />

                    {/* Point visuel */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill={fillColor}
                      stroke="#000000"
                      strokeWidth={1.5}
                    />

                    {/* Badge heure au-dessus si survolé */}
                    {isHovered && (
                      <g>
                        <rect
                          x={pt.x - 22}
                          y={pt.y - 20}
                          width={44}
                          height={16}
                          fill="#000000"
                          rx={0}
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 9}
                          textAnchor="middle"
                          className="text-[9px] font-mono font-black fill-white"
                        >
                          {pt.log.wakeUpTime}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Fiche d'information du point sélectionné / survolé */}
          {hoveredPoint ? (
            <div className="mt-2 bg-yellow-50 border-2 border-black p-2 flex items-center justify-between gap-2 text-[10px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black bg-black text-white px-1.5 py-0.5">
                  {hoveredPoint.log.date}
                </span>
                <span className="font-extrabold">
                  Réveil : <u>{hoveredPoint.log.wakeUpTime}</u>
                </span>
                <span
                  className={`font-black px-1.5 py-0.2 border border-black ${
                    hoveredPoint.deltaMinutes >= 0
                      ? "bg-emerald-100 text-emerald-950"
                      : "bg-rose-100 text-rose-950"
                  }`}
                >
                  {hoveredPoint.deltaMinutes >= 0
                    ? `+${hoveredPoint.deltaMinutes} min d'avance`
                    : `${Math.abs(hoveredPoint.deltaMinutes)} min de retard`}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span className="font-black bg-white px-1.5 py-0.5 border border-black">
                  {hoveredPoint.log.coinsRewarded !== undefined
                    ? `${hoveredPoint.log.coinsRewarded >= 0 ? `+${hoveredPoint.log.coinsRewarded}` : hoveredPoint.log.coinsRewarded} CS`
                    : "0 CS"}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-[9px] text-gray-500 italic text-center">
              Survolez ou touchez un point pour afficher les détails du réveil.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
