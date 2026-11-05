import React, { useState } from "react";

// 1. Graphique Sparkline compact
export const Sparkline: React.FC<{ data: number[]; color?: string; width?: number; height?: number }> = ({
  data,
  color = "#4f46e5",
  width = 60,
  height = 20,
}) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible inline-block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

// 2. Graphique en Barres de Périodes (Semaines / Mois)
export interface PeriodBarItem {
  key: string;
  label: string;
  workHours: number;
  leisureHours: number;
  gamingHours?: number;
  netHours: number;
  deltaPct?: number;
}

export const PeriodBarChart: React.FC<{
  items: PeriodBarItem[];
  title?: string;
  maxItems?: number;
}> = ({ items, title, maxItems = 12 }) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Garder les N périodes les plus récentes en ordre chronologique pour l'affichage graphique
  const displayItems = [...items].slice(0, maxItems).reverse();
  const maxVal = Math.max(...displayItems.map((it) => Math.max(it.workHours, it.leisureHours, 1)), 1);

  return (
    <div className="bg-white border-3 border-black p-3.5 shadow-[3px_3px_0px_#000] space-y-3 font-mono">
      {title && (
        <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
          <span className="text-xs font-black uppercase text-black">{title}</span>
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-indigo-600 border border-black inline-block" /> Travail
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-purple-400 border border-black inline-block" /> Loisirs
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-yellow-300 border border-black inline-block" /> Net
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-2 items-end min-h-[160px]">
        {displayItems.map((item) => {
          const isHovered = hoveredKey === item.key;
          const workHeightPct = Math.min(100, Math.max(4, (item.workHours / maxVal) * 100));
          const leisureHeightPct = Math.min(100, Math.max(4, (item.leisureHours / maxVal) * 100));

          return (
            <div
              key={item.key}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={`flex flex-col items-center justify-end h-full relative cursor-pointer p-1 border border-black/20 hover:border-black transition-all ${
                isHovered ? "bg-yellow-50 shadow-[2px_2px_0px_#000] border-black" : "bg-transparent"
              }`}
            >
              {/* Tooltip au survol */}
              {isHovered && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] p-1.5 border border-black shadow-[2px_2px_0px_#000] z-20 whitespace-nowrap">
                  <div className="font-bold">{item.label}</div>
                  <div className="text-indigo-200">Travail : {item.workHours}h</div>
                  <div className="text-purple-200">Loisirs : {item.leisureHours}h</div>
                  <div className={item.netHours >= 0 ? "text-yellow-300" : "text-rose-300"}>
                    Net : {item.netHours >= 0 ? `+${item.netHours}h` : `${item.netHours}h`}
                  </div>
                </div>
              )}

              {/* Barres comparatives */}
              <div className="w-full flex items-end justify-center gap-1 h-28">
                {/* Barre Travail */}
                <div
                  style={{ height: `${workHeightPct}%` }}
                  className="w-1/2 max-w-[14px] bg-indigo-600 border border-black transition-all hover:bg-indigo-500"
                  title={`Travail: ${item.workHours}h`}
                />
                {/* Barre Loisir */}
                <div
                  style={{ height: `${leisureHeightPct}%` }}
                  className="w-1/2 max-w-[14px] bg-purple-400 border border-black transition-all hover:bg-purple-300"
                  title={`Loisirs: ${item.leisureHours}h`}
                />
              </div>

              {/* Libellé de période court */}
              <span className="text-[9px] font-black uppercase mt-1 truncate w-full text-center text-gray-700">
                {item.label.split(" ")[0]}
              </span>
              <span className="text-[9px] font-bold text-black">
                {item.workHours}h
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 3. Graphique d'Évolution du Cumul Chronologique (Courbe SVG)
export interface CumulativeDataPoint {
  date: string;
  cumulativeWorkHours: number;
  cumulativeLeisureHours: number;
  cumulativeNetHours: number;
}

export const CumulativeAreaChart: React.FC<{
  data: CumulativeDataPoint[];
  height?: number;
}> = ({ data, height = 220 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-center text-xs font-bold text-gray-500 border-2 border-dashed border-black">
        Aucune donnée chronologique disponible.
      </div>
    );
  }

  // Échantillonnage si trop de points pour fluidité parfaite
  const step = Math.max(1, Math.floor(data.length / 80));
  const sampled = data.filter((_, idx) => idx % step === 0 || idx === data.length - 1);

  const maxWork = Math.max(...sampled.map((d) => d.cumulativeWorkHours), 1);
  const maxLeisure = Math.max(...sampled.map((d) => d.cumulativeLeisureHours), 1);
  const maxY = Math.max(maxWork, maxLeisure, 1);

  const width = 800;
  const padding = { top: 20, right: 30, bottom: 30, left: 50 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => padding.left + (index / (sampled.length - 1 || 1)) * graphWidth;
  const getY = (val: number) => padding.top + graphHeight - (val / maxY) * graphHeight;

  // Points pour courbes
  const workPoints = sampled.map((d, i) => `${getX(i).toFixed(1)},${getY(d.cumulativeWorkHours).toFixed(1)}`).join(" ");
  const leisurePoints = sampled.map((d, i) => `${getX(i).toFixed(1)},${getY(d.cumulativeLeisureHours).toFixed(1)}`).join(" ");

  // Aires fermées
  const workArea = `${padding.left},${getY(0)} ${workPoints} ${padding.left + graphWidth},${getY(0)}`;
  const leisureArea = `${padding.left},${getY(0)} ${leisurePoints} ${padding.left + graphWidth},${getY(0)}`;

  const activePoint = hoveredIdx !== null ? sampled[hoveredIdx] : sampled[sampled.length - 1];

  return (
    <div className="bg-white border-3 border-black p-4 shadow-[3px_3px_0px_#000] space-y-3 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-2">
        <span className="text-xs font-black uppercase">
          Courbe Chronologique de Cumul (Travail vs Loisirs)
        </span>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-indigo-900">
            <span className="w-3 h-1 bg-indigo-600 inline-block border border-black" /> Cumul Travail ({activePoint?.cumulativeWorkHours}h)
          </span>
          <span className="flex items-center gap-1 text-purple-900">
            <span className="w-3 h-1 bg-purple-500 inline-block border border-black" /> Cumul Loisirs ({activePoint?.cumulativeLeisureHours}h)
          </span>
          <span className="flex items-center gap-1 text-emerald-900 font-black bg-yellow-200 px-1 border border-black">
            Solde Net : {activePoint?.cumulativeNetHours >= 0 ? `+${activePoint?.cumulativeNetHours}h` : `${activePoint?.cumulativeNetHours}h`}
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px]"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Lignes de grille horizontales */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + graphHeight * (1 - ratio);
            const val = Math.round(maxY * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + graphWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fontFamily="monospace"
                  fill="#6b7280"
                >
                  {val}h
                </text>
              </g>
            );
          })}

          {/* Aire Loisirs */}
          <polygon fill="rgba(192, 132, 252, 0.2)" points={leisureArea} />
          {/* Ligne Loisirs */}
          <polyline
            fill="none"
            stroke="#a855f7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={leisurePoints}
          />

          {/* Aire Travail */}
          <polygon fill="rgba(99, 102, 241, 0.25)" points={workArea} />
          {/* Ligne Travail */}
          <polyline
            fill="none"
            stroke="#4f46e5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={workPoints}
          />

          {/* Points interactifs de survol */}
          {sampled.map((d, i) => {
            const x = getX(i);
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={d.date}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
              >
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + graphHeight}
                  stroke={isHovered ? "#000" : "transparent"}
                  strokeWidth="1.5"
                  strokeDasharray={isHovered ? "2 2" : "none"}
                />
                {isHovered && (
                  <>
                    <circle cx={x} cy={getY(d.cumulativeWorkHours)} r="5" fill="#4f46e5" stroke="#000" strokeWidth="2" />
                    <circle cx={x} cy={getY(d.cumulativeLeisureHours)} r="4" fill="#a855f7" stroke="#000" strokeWidth="1.5" />
                  </>
                )}
              </g>
            );
          })}

          {/* Axe X Dates */}
          <line
            x1={padding.left}
            y1={padding.top + graphHeight}
            x2={padding.left + graphWidth}
            y2={padding.top + graphHeight}
            stroke="#000"
            strokeWidth="2"
          />
          <text
            x={padding.left}
            y={height - 8}
            fontSize="9"
            fontFamily="monospace"
            fill="#374151"
            fontWeight="bold"
          >
            {sampled[0]?.date}
          </text>
          <text
            x={padding.left + graphWidth}
            y={height - 8}
            textAnchor="end"
            fontSize="9"
            fontFamily="monospace"
            fill="#374151"
            fontWeight="bold"
          >
            {sampled[sampled.length - 1]?.date}
          </text>
        </svg>
      </div>
    </div>
  );
};

// 4. Graphique de Répartition Donut / Barre Empilée
export const BreakdownChart: React.FC<{
  title: string;
  items: Array<{ label: string; hours: number; percentage: number; color?: string }>;
}> = ({ title, items }) => {
  const palette = ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#64748b"];

  return (
    <div className="bg-white border-3 border-black p-3.5 shadow-[3px_3px_0px_#000] space-y-2.5 font-mono">
      <div className="flex items-center justify-between border-b-2 border-black pb-1">
        <span className="text-xs font-black uppercase">{title}</span>
      </div>

      {/* Barre segmentée empilée */}
      <div className="w-full h-5 bg-gray-100 border-2 border-black flex overflow-hidden">
        {items.slice(0, 6).map((item, idx) => {
          const col = item.color || palette[idx % palette.length];
          return (
            <div
              key={item.label}
              style={{ width: `${item.percentage}%`, backgroundColor: col }}
              className="h-full border-r border-black last:border-r-0 transition-all"
              title={`${item.label} : ${item.hours}h (${item.percentage}%)`}
            />
          );
        })}
      </div>

      {/* Légende en grille */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 text-xs">
        {items.slice(0, 6).map((item, idx) => {
          const col = item.color || palette[idx % palette.length];
          return (
            <div key={item.label} className="flex items-center gap-1.5 border border-black/20 p-1 bg-gray-50">
              <span className="w-2.5 h-2.5 border border-black shrink-0" style={{ backgroundColor: col }} />
              <div className="truncate flex-1">
                <span className="font-black text-[10px] block truncate">{item.label}</span>
                <span className="text-[9px] text-gray-600 font-bold">{item.hours}h ({item.percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
