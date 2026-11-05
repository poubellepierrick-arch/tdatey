import React, { useState, useEffect } from "react";
import { Task, Habit, RecurringTask } from "./types";
import { useFirebaseSync } from "./lib/useFirebaseSync";
import LoginPortal from "./components/views/LoginPortal";

import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import ThemeStyleInjector from "./components/layout/ThemeStyleInjector";

// Vues externalisées
import TodayView from "./components/views/TodayView";
import PlanningView from "./components/views/PlanningView";
import RankingView from "./components/views/RankingView";
import HabitsView from "./components/views/HabitsView";
import SettingsView from "./components/views/SettingsView";
import RewardsView from "./components/views/RewardsView";
import PlanningActiveTimer from "./components/planning/PlanningActiveTimer";
import NewElementForm from "./components/dashboard/NewElementForm";
import SmartAddView from "./components/dashboard/SmartAddView";
import WakeUpModal from "./components/dashboard/WakeUpModal";
import BedTimeModal from "./components/dashboard/BedTimeModal";

import { ProjectsView } from "./components/views/ProjectsView";
import SuitcaseView from "./components/views/SuitcaseView";
import ArchivesView from "./components/views/ArchivesView";
import AnalyticsView from "./components/views/AnalyticsView";
import AdvisorView from "./components/views/AdvisorView";
import { IconProvider } from "./lib/IconContext";
import { defaultIconComponents } from "./lib/Icons";

export default function App() {
  const { currentUser, loading, db, saveStatus, updateDbAndSave } = useFirebaseSync();
  const [confirmLogout, setConfirmLogout] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<string>("today");
  const [showNewElement, setShowNewElement] = useState<boolean>(false);
  const [preselectedParentTaskId, setPreselectedParentTaskId] = useState<string | undefined>(undefined);
  const [duplicateElement, setDuplicateElement] = useState<Task | Habit | RecurringTask | null>(null);

  const handleDuplicate = (item: Task | Habit | RecurringTask) => {
    setDuplicateElement(item);
    setPreselectedParentTaskId(undefined);
    setShowNewElement(true);
  };

  const [showSmartAdd, setShowSmartAdd] = useState<boolean>(false);
  const [showWakeUpPrompt, setShowWakeUpPrompt] = useState<boolean>(false);
  const [showBedTimePrompt, setShowBedTimePrompt] = useState<boolean>(false);
  const [hasCheckedWakeToday, setHasCheckedWakeToday] = useState<boolean>(false);

  // Vérification de la première ouverture du jour pour le réveil
  useEffect(() => {
    if (!loading && currentUser && db?.userProfile && !hasCheckedWakeToday) {
      const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
      const alreadyConfirmed = db.userProfile.lastWakeConfirmedDate === todayStr || db.sleepWakeLogs?.some(l => l.date === todayStr);
      if (!alreadyConfirmed) {
        setShowWakeUpPrompt(true);
      }
      setHasCheckedWakeToday(true);
    }
  }, [loading, currentUser, db?.userProfile?.lastWakeConfirmedDate, db?.sleepWakeLogs, hasCheckedWakeToday]);

  // Chronomètre de loisir
  const [activeLeisureTimer, setActiveLeisureTimer] = useState<{ type: "leisure"; id: string; startTime: number } | null>(null);

  // Toasts de Récompense
  const [toasts, setToasts] = useState<any[]>([]);
  const [prevCoins, setPrevCoins] = useState<number>(0);

  useEffect(() => {
    if (db.userProfile) {
      const currentCoins = db.userProfile.coins || 0;
      if (prevCoins > 0 && currentCoins > prevCoins) {
        const diff = currentCoins - prevCoins;
        const newToast = {
          id: `toast-${Date.now()}-${Math.random()}`,
          type: "coins_gain",
          amount: diff,
          message: `Discipline : +${diff} CS ! Solde actualisé. 🪙`
        };
        setToasts(prev => [...prev, newToast]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, 4000);
      }
      setPrevCoins(currentCoins);
    }
  }, [db.userProfile?.coins]);

  // Événements partagés
  const [sharedEvents, setSharedEvents] = useState<Task[]>([]);

  // Rendu de la vue sélectionnée
  const renderViewContent = () => {
    switch (currentView) {
      case "today":
        return <TodayView db={db} updateDb={updateDbAndSave} onNavigate={setCurrentView} sharedEvents={sharedEvents} onDuplicate={handleDuplicate} />;
      case "projects":
        return <ProjectsView db={db} updateDb={updateDbAndSave} onDuplicate={handleDuplicate} />;
      case "planning":
        return <PlanningView db={db} updateDb={updateDbAndSave} sharedEvents={sharedEvents} />;
      case "ranking":
        return <RankingView db={db} updateDb={updateDbAndSave} onDuplicate={handleDuplicate} />;
      case "analytics":
        return <AnalyticsView db={db} updateDb={updateDbAndSave} />;
      case "advisor":
        return <AdvisorView db={db} updateDb={updateDbAndSave} onNavigate={setCurrentView} />;
      case "habits":
        return <HabitsView db={db} updateDb={updateDbAndSave} onDuplicate={handleDuplicate} />;
      case "rewards":
        return (
          <RewardsView 
            db={db} 
            updateDb={updateDbAndSave} 
            activeTimer={activeLeisureTimer}
            onStartTimer={(type, id) => setActiveLeisureTimer({ type, id, startTime: Date.now() })}
            onStopTimer={() => setActiveLeisureTimer(null)}
          />
        );
      case "suitcase":
        return <SuitcaseView db={db} updateDb={updateDbAndSave} />;
      case "archives":
        return <ArchivesView db={db} updateDb={updateDbAndSave} />;
      case "settings":
        return <SettingsView db={db} updateDb={updateDbAndSave} />;
      default:
        return <TodayView db={db} updateDb={updateDbAndSave} onNavigate={setCurrentView} sharedEvents={sharedEvents} onDuplicate={handleDuplicate} />;
    }
  };

  // Paramètres d'apparence
  const themeStyle = db.userProfile?.themeStyle || "memphis";
  const layoutSpacing = db.userProfile?.layoutSpacing || "cozy";
  const cardBorderWidth = db.userProfile?.cardBorderWidth ?? 4;
  const cardShadowOpacity = db.userProfile?.cardShadowOpacity ?? 100;

  const spacingClass = 
    layoutSpacing === "compact" ? "p-2 space-y-2 mt-2" :
    layoutSpacing === "spacious" ? "p-8 space-y-6 mt-6" : "p-4 sm:p-6 space-y-4";

  const bgClass =
    themeStyle === "cosmic" ? "bg-[#0a0f1d] text-gray-100 font-sans selection:bg-indigo-600 selection:text-white" :
    themeStyle === "brutalist" ? "bg-white text-black font-mono selection:bg-black selection:text-white" :
    "bg-[#fcf8f2] text-black font-mono selection:bg-yellow-300";

  // Écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf8f2] flex flex-col justify-center items-center p-6 select-none font-mono">
        <div className="border-4 border-black bg-white p-8 max-w-sm w-full shadow-[6px_6px_0px_0px_#000] text-center rotate-[-1deg]">
          <div className="mb-6 flex justify-center">
            <img 
              src="https://amac.neocities.org/todologomenphis.png" 
              alt="ᵗ°ᵈ°" 
              referrerPolicy="no-referrer"
              className="h-16 object-contain" 
            />
          </div>
          <h2 className="font-mono font-black text-xs text-black mb-2 animate-pulse uppercase">
            SYNCHRONISATION SECURISÉE DES DONNÉES...
          </h2>
          <p className="text-[10.5px] text-gray-500 leading-normal">
            Connexion au serveur Firebase et rapatriement de vos données. Une seconde...
          </p>
          <div className="mt-6 flex justify-center">
            <span className="inline-block w-8 h-8 border-4 border-yellow-400 border-t-black rounded-full animate-spin"></span>
          </div>
        </div>
      </div>
    );
  }

  // Portail de connexion
  if (!currentUser) {
    return <LoginPortal onLoginSuccess={(user) => console.log("Connexion de :", user.email)} />;
  }

  return (
    <IconProvider defaultIcons={defaultIconComponents} appIcons={db.appIcons || {}}>
      <div className={`${currentView === "planning" ? "h-screen flex flex-col overflow-hidden" : "min-h-screen pb-12"} ${bgClass} transition-colors duration-200`}>
        
        {/* Injecteur modulaire de thème */}
        <ThemeStyleInjector 
          themeStyle={themeStyle}
          cardBorderWidth={cardBorderWidth}
          cardShadowOpacity={cardShadowOpacity}
        />

        {/* Toasts Flottants de Récompenses */}
        <div className="fixed top-4 right-4 z-[9999] pointer-events-none max-w-sm w-full space-y-3">
          {toasts.map(toast => (
            <div 
              key={toast.id} 
              className="bg-yellow-300 text-black border-4 border-black p-4 rounded-none shadow-[4px_4px_0px_0px_#000] flex items-center gap-3 animate-bounce pointer-events-auto"
            >
              <span className="text-xl font-bold">🏆</span>
              <p className="font-mono font-black text-xs leading-snug">
                {toast.message}
              </p>
            </div>
          ))}
        </div>
      
        {/* Navigation globale */}
        <header className="border-b-4 border-black bg-white sticky top-0 z-50 shadow-[0px_4px_0px_0px_#000] divide-y-2 divide-black">
          <Header 
            db={db}
            saveStatus={saveStatus}
            currentUser={currentUser}
            showNewElement={showNewElement}
            setShowNewElement={(val) => {
              const nextVal = typeof val === "function" ? val(showNewElement) : val;
              if (nextVal) {
                setDuplicateElement(null);
                setPreselectedParentTaskId(undefined);
              }
              setShowNewElement(nextVal);
            }}
            showSmartAdd={showSmartAdd}
            setShowSmartAdd={setShowSmartAdd}
            confirmLogout={confirmLogout}
            setConfirmLogout={setConfirmLogout}
            onOpenWakeUp={() => setShowWakeUpPrompt(true)}
            onOpenBedTime={() => setShowBedTimePrompt(true)}
          />
          <Sidebar 
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
        </header>

        {/* Corps de l'application */}
        <main className={`max-w-7xl mx-auto w-full ${currentView === "planning" ? "flex-1 min-h-0 px-2 sm:px-4 py-2 flex flex-col overflow-hidden" : spacingClass}`}>
          <section className={`w-full ${currentView === "planning" ? "h-full flex-1 min-h-0 flex flex-col overflow-hidden" : "space-y-4"}`}>
            
            {showWakeUpPrompt && (
              <WakeUpModal 
                db={db} 
                updateDb={updateDbAndSave} 
                onClose={() => setShowWakeUpPrompt(false)} 
              />
            )}

            {showBedTimePrompt && (
              <BedTimeModal 
                db={db} 
                updateDb={updateDbAndSave} 
                onClose={() => setShowBedTimePrompt(false)} 
              />
            )}

            {showNewElement && (
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9999] overflow-y-auto p-2 sm:p-4"
                onClick={() => {
                  setShowNewElement(false);
                  setDuplicateElement(null);
                  setPreselectedParentTaskId(undefined);
                }}
              >
                <div className="min-h-full flex items-start sm:items-center justify-center py-2 sm:py-6">
                  <div 
                    className="w-full max-w-xl relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <NewElementForm 
                      db={db} 
                      updateDb={updateDbAndSave} 
                      onClose={() => {
                        setShowNewElement(false);
                        setPreselectedParentTaskId(undefined);
                        setDuplicateElement(null);
                      }} 
                      initialParentTaskId={preselectedParentTaskId}
                      initialElement={duplicateElement}
                    />
                  </div>
                </div>
              </div>
            )}

            {showSmartAdd && (
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9999] overflow-y-auto p-2 sm:p-4"
                onClick={() => setShowSmartAdd(false)}
              >
                <div className="min-h-full flex items-start sm:items-center justify-center py-2 sm:py-6">
                  <div 
                    className="w-full max-w-xl bg-white border-4 border-black p-4 sm:p-5 shadow-[6px_6px_0px_0px_#000] relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      onClick={() => setShowSmartAdd(false)}
                      className="absolute top-2.5 right-2.5 border-2 border-black bg-gray-100 hover:bg-gray-200 text-black px-2 py-0.5 font-mono font-black text-[9px] uppercase cursor-pointer z-10"
                    >
                      Fermer
                    </button>
                    <div className="mt-4">
                      <SmartAddView db={db} updateDb={updateDbAndSave} onClose={() => setShowSmartAdd(false)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {renderViewContent()}
          </section>
        </main>

        {currentView !== "planning" && (
          <footer className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 text-center">
            <div className="inline-block border-2 border-dashed border-black bg-white p-3 font-mono text-[10px] text-gray-500 leading-snug shadow-[2px_2px_0px_0px_#000]">
              <span className="text-black font-black">ℹ️ Protection de vos données : </span>
              Progression sauvegardée dans Firestore de façon sécurisée (synchronisation multiécran instantanée).
            </div>
          </footer>
        )}

        <PlanningActiveTimer db={db} updateDb={updateDbAndSave} />
      </div>
    </IconProvider>
  );
}
