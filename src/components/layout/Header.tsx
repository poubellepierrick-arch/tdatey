import React, { useEffect, useRef } from "react";
import { AppDatabase } from "../../types";
import { logOut } from "../../lib/firebase";
import { LogOut } from "lucide-react";

interface HeaderProps {
  db: AppDatabase;
  saveStatus: string;
  currentUser: any;
  showNewElement: boolean;
  setShowNewElement: React.Dispatch<React.SetStateAction<boolean>>;
  showSmartAdd: boolean;
  setShowSmartAdd: React.Dispatch<React.SetStateAction<boolean>>;
  confirmLogout: boolean;
  setConfirmLogout: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenWakeUp?: () => void;
  onOpenBedTime?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  db,
  saveStatus,
  currentUser,
  showNewElement,
  setShowNewElement,
  showSmartAdd,
  setShowSmartAdd,
  confirmLogout,
  setConfirmLogout,
  onOpenWakeUp,
  onOpenBedTime,
}) => {
  const headerContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = headerContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.25;
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <div 
      ref={headerContainerRef}
      className="px-2.5 sm:px-6 py-2 sm:py-3 flex flex-row justify-between items-center gap-2 sm:gap-4 bg-[#fffdfa] overflow-x-auto select-none no-scrollbar flex-nowrap w-full"
    >
      {/* LOGO DE L'APPLI */}
      <div className="flex items-center gap-2 flex-shrink-0 animate-fade-in">
        <img 
          src="https://amac.neocities.org/todologomenphis.png" 
          alt="ᵗ°ᵈ°" 
          referrerPolicy="no-referrer"
          className="h-8 sm:h-12 object-contain" 
        />
      </div>

      {/* STATS ET WIDGET DE CONNEXION GOOGLE OAUTH / CLOUD SYNC */}
      <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Indicateur de sauvegarde Cloud réactif */}
        {saveStatus === "saving" && (
          <div className="bg-yellow-300 text-black border-2 border-black px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-black tracking-tight animate-pulse shadow-[2px_2px_0px_0px_#000] whitespace-nowrap">
            ⚠️ ENREGISTREMENT...
          </div>
        )}
        {saveStatus === "synced" && (
          <div className="bg-emerald-200 text-emerald-950 border-2 border-black px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-black tracking-tight shadow-[2px_2px_0px_0px_#000] whitespace-nowrap">
            ☁️ CLOUD SYNCHRO
          </div>
        )}
        {saveStatus === "error" && (
          <div className="bg-rose-400 text-black border-2 border-black px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-black tracking-tight shadow-[2px_2px_0px_0px_#000] whitespace-nowrap">
            ☁️ SANS CLOUD / EN MÉMOIRE
          </div>
        )}

        <button
          onClick={() => {
            setShowNewElement(!showNewElement);
            setShowSmartAdd(false);
          }}
          className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 border-2 border-black font-black text-[10px] sm:text-xs uppercase shadow-[2px_2px_0px_0px_#000] rotate-[-1deg] transition-all cursor-pointer whitespace-nowrap active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
            showNewElement ? "bg-black text-white" : "bg-yellow-400 text-black hover:bg-yellow-500"
          }`}
        >
          {showNewElement ? "❌ FERMER" : "➕ NOUVEL ÉLÉMENT"}
        </button>

        <button
          onClick={() => {
            setShowSmartAdd(!showSmartAdd);
            setShowNewElement(false);
          }}
          className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 border-2 border-black font-black text-[10px] sm:text-xs uppercase shadow-[2px_2px_0px_0px_#000] rotate-[1deg] transition-all cursor-pointer whitespace-nowrap active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
            showSmartAdd ? "bg-black text-white" : "bg-purple-400 text-black hover:bg-purple-500"
          }`}
        >
          {showSmartAdd ? "❌ FERMER IA" : "✨ AJOUT IA SMART"}
        </button>

        <div className="bg-emerald-300 border-2 border-black px-2 sm:px-3 py-1 text-black font-black text-[10px] sm:text-xs shadow-[2px_2px_0px_0px_#000] whitespace-nowrap">
          💰 {db.userProfile?.coins || 0} CS
        </div>

        {onOpenWakeUp && (
          <button
            id="header-wake-up-btn"
            onClick={onOpenWakeUp}
            className="bg-amber-100 hover:bg-amber-200 border-2 border-black px-2 sm:px-2.5 py-1 text-black font-black text-[10px] sm:text-xs shadow-[2px_2px_0px_0px_#000] whitespace-nowrap cursor-pointer flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            title="Confirmer ou modifier le réveil"
          >
            <span>🌅</span>
            <span>{db.userProfile?.targetWakeTime || "07:00"}</span>
          </button>
        )}

        {onOpenBedTime && (
          <button
            id="header-bed-time-btn"
            onClick={onOpenBedTime}
            className="bg-indigo-100 hover:bg-indigo-200 border-2 border-black px-2 sm:px-2.5 py-1 text-black font-black text-[10px] sm:text-xs shadow-[2px_2px_0px_0px_#000] whitespace-nowrap cursor-pointer flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            title="Confirmer ou modifier le coucher"
          >
            <span>🌙</span>
            <span>{db.userProfile?.targetSleepTime || "23:00"}</span>
          </button>
        )}

        {/* Avatar & Déconnexion Inline sans popup d'alerte */}
        {currentUser && (
          <div className="flex items-center gap-1 sm:gap-1.5 ml-0.5 sm:ml-1 flex-shrink-0">
            {currentUser.photoURL && (
              <img 
                src={currentUser.photoURL} 
                alt="Profil" 
                referrerPolicy="no-referrer"
                className="w-6 h-6 sm:w-7 sm:h-7 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_#000]"
              />
            )}
            <button
              onClick={async () => {
                if (!confirmLogout) {
                  setConfirmLogout(true);
                  setTimeout(() => setConfirmLogout(false), 4000);
                } else {
                  await logOut();
                  setConfirmLogout(false);
                }
              }}
              className={`${confirmLogout ? "bg-red-600 text-white animate-pulse" : "bg-red-400 text-black hover:bg-red-500"} border-2 border-black px-2 sm:px-2.5 py-1 sm:py-1.5 font-black text-[10px] sm:text-xs uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-all flex items-center gap-1 whitespace-nowrap`}
            >
              <LogOut size={12} />
              <span>{confirmLogout ? "VRAIMENT ?" : "X"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
