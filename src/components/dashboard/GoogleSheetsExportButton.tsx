import React, { useState } from "react";
import { AppDatabase } from "../../types";
import { exportTimeToGoogleSheets, GoogleSheetsExportResult } from "../../lib/googleSheets";
import { FileSpreadsheet, ExternalLink, Loader2, Check, AlertCircle, X } from "lucide-react";

interface GoogleSheetsExportButtonProps {
  db: AppDatabase;
  className?: string;
  variant?: "primary" | "compact" | "minimal";
}

export const GoogleSheetsExportButton: React.FC<GoogleSheetsExportButtonProps> = ({
  db,
  className = "",
  variant = "primary",
}) => {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<GoogleSheetsExportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await exportTimeToGoogleSheets(db);
      setResult(res);
      setStatus("success");
    } catch (e: any) {
      console.error("Erreur export Google Sheets :", e);
      setErrorMessage(e?.message || "Erreur lors de la génération de la feuille.");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setResult(null);
    setErrorMessage(null);
  };

  if (variant === "compact") {
    return (
      <div className={`inline-flex flex-col items-start font-mono text-xs ${className}`}>
        {status === "idle" && (
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-2 py-1 bg-emerald-300 hover:bg-emerald-400 text-black border-2 border-black font-black uppercase text-[10px] shadow-[1px_1px_0px_#000] cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
            title="Exporter tous les logs de temps vers Google Sheets"
          >
            <FileSpreadsheet size={13} />
            <span>Google Sheets</span>
          </button>
        )}

        {status === "loading" && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-200 border-2 border-black text-black font-black text-[10px] animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            <span>Export en cours...</span>
          </div>
        )}

        {status === "success" && result && (
          <div className="flex items-center gap-1.5 bg-emerald-100 border-2 border-black px-2 py-1 shadow-[2px_2px_0px_#000]">
            <Check size={13} className="text-emerald-800 shrink-0" />
            <a
              href={result.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-black text-[10px] text-emerald-950 underline hover:text-black flex items-center gap-1"
            >
              <span>Ouvrir ({result.totalWorkHours}h)</span>
              <ExternalLink size={10} />
            </a>
            <button
              type="button"
              onClick={handleReset}
              className="text-black hover:bg-black hover:text-white px-1 text-[9px] font-black cursor-pointer ml-1"
            >
              ✕
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-1.5 bg-rose-100 border-2 border-black px-2 py-1 text-rose-950 text-[10px]">
            <AlertCircle size={12} className="text-rose-700 shrink-0" />
            <span className="truncate max-w-[140px]">{errorMessage}</span>
            <button
              type="button"
              onClick={handleExport}
              className="underline font-black cursor-pointer hover:text-black"
            >
              Réessayer
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-black px-1 font-black cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  // Variant standard ("primary")
  return (
    <div className={`space-y-2 font-mono text-xs ${className}`}>
      {status === "idle" && (
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-300 hover:bg-emerald-400 text-black border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_#000] cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 w-full sm:w-auto"
        >
          <FileSpreadsheet size={15} />
          <span>Exporter vers Google Sheets</span>
        </button>
      )}

      {status === "loading" && (
        <div className="flex items-center gap-2 bg-yellow-100 border-2 border-black p-2.5 text-black font-bold text-xs shadow-[2px_2px_0px_#000]">
          <Loader2 size={15} className="animate-spin text-black shrink-0" />
          <span>Génération du fichier Google Sheets en cours...</span>
        </div>
      )}

      {status === "success" && result && (
        <div className="bg-emerald-50 border-2 border-black p-3 space-y-2 shadow-[2px_2px_0px_#000]">
          <div className="flex items-center justify-between gap-2 border-b border-black/20 pb-1.5">
            <div className="flex items-center gap-1.5 font-black text-emerald-950 text-xs">
              <Check size={15} className="text-emerald-800" />
              <span>Fichier Google Sheets généré</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-black hover:bg-black hover:text-white px-1.5 py-0.5 text-[10px] font-black border border-black cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="text-[11px] text-gray-800 space-y-1">
            <p className="font-bold truncate">{result.title}</p>
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-700 font-semibold">
              <span className="bg-white border border-black px-1.5 py-0.5">
                {result.totalLogsCount} logs
              </span>
              <span className="bg-white border border-black px-1.5 py-0.5">
                {result.uniqueDaysCount} jours actifs
              </span>
              <span className="bg-white border border-black px-1.5 py-0.5">
                {result.totalWorkHours}h cumulées
              </span>
            </div>
          </div>

          <div className="pt-1 flex items-center gap-2 flex-wrap">
            <a
              href={result.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-black hover:bg-yellow-400 hover:text-black text-white px-3 py-1.5 font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer transition-all"
            >
              <span>Ouvrir Google Sheets</span>
              <ExternalLink size={13} />
            </a>

            <button
              type="button"
              onClick={handleExport}
              className="bg-white hover:bg-gray-100 text-black px-2.5 py-1.5 font-bold text-[10px] border border-black cursor-pointer"
            >
              Mettre à jour
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="bg-rose-50 border-2 border-black p-3 space-y-2 shadow-[2px_2px_0px_#000]">
          <div className="flex items-center justify-between gap-2 border-b border-black/20 pb-1">
            <div className="flex items-center gap-1.5 font-black text-rose-950 text-xs">
              <AlertCircle size={15} className="text-rose-700" />
              <span>Échec de l'exportation</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-black hover:bg-black hover:text-white px-1.5 py-0.5 text-[10px] font-black border border-black cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-[10px] text-rose-900 font-bold">{errorMessage}</p>

          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 font-black text-xs uppercase border border-black cursor-pointer"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsExportButton;
