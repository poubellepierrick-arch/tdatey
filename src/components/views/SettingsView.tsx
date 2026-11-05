import React, { useState, useEffect } from "react";
import { AppDatabase, Task, Habit, RecurringTask } from "../../types";
import { DEFAULT_DATABASE_STATE, saveDatabase, convertBackupToAppDatabase, mergeDatabases, normalizeTitle } from "../../lib/state";
import { Settings, Save, RefreshCw, Upload, Download, Trash2, ArrowRightLeft, ShieldCheck, Cloud, CloudLightning, LogIn, LogOut, ShieldAlert, BadgePlus, Sparkles, CheckSquare, Square } from "lucide-react";
import GoogleSheetsExportButton from "../dashboard/GoogleSheetsExportButton";

interface SettingsViewProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
}

export default function SettingsView({ db, updateDb }: SettingsViewProps) {
  const [rewardCalculationRatio, setRewardCalculationRatio] = useState(db.userProfile.rewardCalculationRatio ?? 1.0);
  
  // Nouveaux réglages esthétiques plus poussés
  const [themeStyle, setThemeStyle] = useState(db.userProfile.themeStyle || "memphis");
  const [layoutSpacing, setLayoutSpacing] = useState(db.userProfile.layoutSpacing || "cozy");
  const [cardBorderWidth, setCardBorderWidth] = useState(db.userProfile.cardBorderWidth ?? 4);
  const [cardShadowOpacity, setCardShadowOpacity] = useState(db.userProfile.cardShadowOpacity ?? 100);

  const [showImportArea, setShowImportArea] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [pendingDbToImport, setPendingDbToImport] = useState<AppDatabase | null>(null);

  // Sélections pour l'importateur sélectif automatique de l'Analyste IA
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [selectedRecs, setSelectedRecs] = useState<string[]>([]);
  const [selectedPreps, setSelectedPreps] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<string[]>([]);
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);

  // Aide d'obtention de clés uniques (ID ou titre normalisé)
  const getKeys = (list: any[]) => {
    const keys = new Set<string>();
    list.forEach((item) => {
      if (item.id) keys.add(item.id);
      const norm = normalizeTitle(item.title || "");
      if (norm) keys.add(norm);
    });
    return keys;
  };

  const getMissingItemsList = () => {
    if (!pendingDbToImport) {
      return { 
        tasks: [], 
        habits: [], 
        recurringTasks: [], 
        preparations: [], 
        trackedActivities: [], 
        journalLogs: [], 
        medications: [] 
      };
    }

    // Pour les tâches uniques, événements, rendez-vous (db.tasks),
    // on ne compare que par ID d'origine afin d'éviter d'assimiler faussement à des doublons
    // des rendez-vous répétés légitimes de même nom (ex: "cdv", "Travaux", "Psy").
    const currentTasksIds = new Set((db.tasks || []).map(t => t.id));
    const currentHabitsKeys = getKeys(db.habits || []);
    const currentRecTasksKeys = getKeys(db.recurringTasks || []);
    const currentPrepsIds = new Set((db.preparations || []).map(p => p.id));
    const currentActivitiesIds = new Set((db.trackedActivities || []).map(a => a.id));
    const currentJournalIds = new Set((db.journalLogs || []).map(j => j.id));
    const currentMedsIds = new Set((db.medications || []).map(m => m.id));

    const missingT = (pendingDbToImport.tasks || []).filter(
      (item) => !currentTasksIds.has(item.id)
    );
    const missingH = (pendingDbToImport.habits || []).filter(
      (item) => !currentHabitsKeys.has(item.id) && !currentHabitsKeys.has(normalizeTitle(item.title || ""))
    );
    const missingR = (pendingDbToImport.recurringTasks || []).filter(
      (item) => !currentRecTasksKeys.has(item.id) && !currentRecTasksKeys.has(normalizeTitle(item.title || ""))
    );
    const missingP = (pendingDbToImport.preparations || []).filter(
      (item) => !currentPrepsIds.has(item.id)
    );
    const missingA = (pendingDbToImport.trackedActivities || []).filter(
      (item) => !currentActivitiesIds.has(item.id)
    );
    const missingJ = (pendingDbToImport.journalLogs || []).filter(
      (item) => !currentJournalIds.has(item.id)
    );
    const missingM = (pendingDbToImport.medications || []).filter(
      (item) => !currentMedsIds.has(item.id)
    );

    return {
      tasks: missingT,
      habits: missingH,
      recurringTasks: missingR,
      preparations: missingP,
      trackedActivities: missingA,
      journalLogs: missingJ,
      medications: missingM
    };
  };

  // Mettre à jour automatiquement les sélections par défaut lorsqu'un nouveau fichier est analysé
  useEffect(() => {
    if (pendingDbToImport) {
      const { 
        tasks: missingT, 
        habits: missingH, 
        recurringTasks: missingR,
        preparations: missingP,
        trackedActivities: missingA,
        journalLogs: missingJ,
        medications: missingM
      } = getMissingItemsList();
      setSelectedTasks(missingT.map(t => t.id));
      setSelectedHabits(missingH.map(h => h.id));
      setSelectedRecs(missingR.map(r => r.id));
      setSelectedPreps(missingP.map(p => p.id));
      setSelectedActivities(missingA.map(a => a.id));
      setSelectedJournal(missingJ.map(j => j.id));
      setSelectedMeds(missingM.map(m => m.id));
    } else {
      setSelectedTasks([]);
      setSelectedHabits([]);
      setSelectedRecs([]);
      setSelectedPreps([]);
      setSelectedActivities([]);
      setSelectedJournal([]);
      setSelectedMeds([]);
    }
  }, [pendingDbToImport, db]);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text === "string") {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed === "object") {
            const converted = convertBackupToAppDatabase(parsed);
            setPendingDbToImport(converted);
            setImportStatus("🟡 Fichier analysé. Choisissez l'Option A ou B ci-dessous pour confirmer l'intégration.");
          } else {
            throw new Error("Le contenu du fichier n'est pas un objet JSON valide.");
          }
        }
      } catch (err: any) {
        setImportStatus(`🔴 Erreur lors de la lecture du fichier : ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteMergeImport = () => {
    if (!pendingDbToImport) return;
    const merged = mergeDatabases(db, pendingDbToImport);
    updateDb(merged);
    setImportStatus("🟢 Fusion de sécurité effectuée avec succès ! Vos habitudes et tâches récurrentes ont été intégrées sans aucun doublon.");
    setPendingDbToImport(null);
    setShowImportArea(false);
    setImportJson("");
    setSelectedFileName(null);
    setTimeout(() => setImportStatus(null), 6000);
  };

  const handleExecuteSelectiveImport = () => {
    if (!pendingDbToImport) return;

    const { 
      tasks: missingT, 
      habits: missingH, 
      recurringTasks: missingR,
      preparations: missingP,
      trackedActivities: missingA,
      journalLogs: missingJ,
      medications: missingM
    } = getMissingItemsList();

    const tasksToAdd = missingT.filter(x => selectedTasks.includes(x.id));
    const habitsToAdd = missingH.filter(x => selectedHabits.includes(x.id));
    const recsToAdd = missingR.filter(x => selectedRecs.includes(x.id));
    const prepsToAdd = missingP.filter(x => selectedPreps.includes(x.id));
    const activitiesToAdd = missingA.filter(x => selectedActivities.includes(x.id));
    const journalToAdd = missingJ.filter(x => selectedJournal.includes(x.id));
    const medsToAdd = missingM.filter(x => selectedMeds.includes(x.id));

    const updatedDb = {
      ...db,
      tasks: [...db.tasks, ...tasksToAdd],
      habits: [...db.habits, ...habitsToAdd],
      recurringTasks: [...db.recurringTasks, ...recsToAdd],
      preparations: [...(db.preparations || []), ...prepsToAdd],
      trackedActivities: [...(db.trackedActivities || []), ...activitiesToAdd],
      journalLogs: [...(db.journalLogs || []), ...journalToAdd],
      medications: [...(db.medications || []), ...medsToAdd],
    };

    updateDb(updatedDb);
    const totalCount = tasksToAdd.length + habitsToAdd.length + recsToAdd.length + prepsToAdd.length + activitiesToAdd.length + journalToAdd.length + medsToAdd.length;
    setImportStatus(`🟢 Intégration sélective de ${totalCount} éléments effectuée.`);
    setPendingDbToImport(null);
    setShowImportArea(false);
    setImportJson("");
    setSelectedFileName(null);
    setTimeout(() => setImportStatus(null), 6000);
  };

  const handleExecuteOverwriteImport = () => {
    if (!pendingDbToImport) return;
    updateDb(pendingDbToImport);
    setImportStatus("🟢 Base de données restaurée intégralement par écrasement total.");
    setPendingDbToImport(null);
    setShowImportArea(false);
    setImportJson("");
    setSelectedFileName(null);
    setTimeout(() => setImportStatus(null), 6000);
  };

  const handleCancelImport = () => {
    setPendingDbToImport(null);
    setSelectedFileName(null);
    setImportStatus("🔴 Importation annulée.");
    setTimeout(() => setImportStatus(null), 3000);
  };

  // Mettre à jour les états locaux si la db change
  useEffect(() => {
    setRewardCalculationRatio(db.userProfile.rewardCalculationRatio ?? 1.0);
    setThemeStyle(db.userProfile.themeStyle || "memphis");
    setLayoutSpacing(db.userProfile.layoutSpacing || "cozy");
    setCardBorderWidth(db.userProfile.cardBorderWidth ?? 4);
    setCardShadowOpacity(db.userProfile.cardShadowOpacity ?? 100);
  }, [db]);

  // Mettre à jour les réglages de gamification et d'esthétique
  const handleSaveEstheticsAndGamification = (e: React.FormEvent) => {
    e.preventDefault();
    updateDb({
      ...db,
      userProfile: {
        ...db.userProfile,
        rewardCalculationRatio: rewardCalculationRatio,
        themeStyle: themeStyle,
        layoutSpacing: layoutSpacing,
        cardBorderWidth: Number(cardBorderWidth),
        cardShadowOpacity: Number(cardShadowOpacity),
      }
    });
    setImportStatus("🟢 Réglages esthétiques et multiplicateur de récompense sauvegardés et appliqués !");
    setTimeout(() => setImportStatus(null), 3000);
  };

  // Exporter le state en JSON complet
  const handleExportStateData = () => {
    const rawData = JSON.stringify(db, null, 2);
    const blob = new Blob([rawData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tod_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Importer le state JSON
  const handleImportStateData = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJson);
      // S'assurer de la cohérence basique des données
      if (parsed && typeof parsed === "object") {
        const converted = convertBackupToAppDatabase(parsed);
        setPendingDbToImport(converted);
        setImportStatus("🟡 Données textuelles chargées. Choisissez l'Option A ou B ci-dessous pour confirmer l'intégration.");
      } else {
        throw new Error("Format JSON ou structure de sauvegarde invalide.");
      }
    } catch (err: any) {
      setImportStatus(`🔴 Erreur : L'importation a échoué. ${err.message}`);
    }
  };

  // Réinitialiser la base à zéro (inline confirmation)
  const [isResetting, setIsResetting] = useState(false);
  const handleResetToDefault = () => {
    updateDb(DEFAULT_DATABASE_STATE);
    setIsResetting(false);
    setImportStatus("🟡 Réinitialisé aux données d'usine avec succès !");
    setTimeout(() => setImportStatus(null), 3000);
  };

  // Bouton magique d'injection de données massives (Debug / Demo Mode)
  const injectMassiveDemoData = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const prevDayStr = new Date(Date.now() - 172800000).toISOString().split("T")[0];

    // Synthèse d'un historique ultra complet
    const demoDb: AppDatabase = {
      ...db,
      tasks: [
        {
          id: "task-demo-1",
          title: "Compléter le rapport annuel de l'activité ᵗ°ᵈ°",
          description: "Compilation des réalisations d'objectifs et plans personnels.",
          createdAt: new Date().toISOString(),
          isCompleted: false,
          importance: 9,
          urgency: 7,
          easiness: 4,
          mentalLoad: 8,
          score: 28,
          isStarred: true,
          durationMinutes: 120,
          timeSpentSeconds: 0,
          rewardValue: 60,
          chronoRewardValue: 1,
          dependencies: [],
          preparationIds: []
        },
        {
          id: "task-demo-2",
          title: "Séance d'analyse et de planification hebdomadaire",
          description: "Suivi du sommeil et équilibrage de la routine de repos.",
          createdAt: new Date(Date.now() - 10000).toISOString(),
          isCompleted: true,
          completedAt: new Date().toISOString(),
          importance: 10,
          urgency: 10,
          easiness: 10,
          mentalLoad: 1,
          score: 30,
          isStarred: false,
          durationMinutes: 45,
          timeSpentSeconds: 2700,
          rewardValue: 100,
          chronoRewardValue: 1,
          dependencies: [],
          preparationIds: []
        }
      ],
      habits: [
        {
          id: "habit-demo-1",
          title: "Pas d'écrans après 22h",
          description: "Restauration du rythme circadien et lutte conte la fatigue.",
          type: "binary",
          currentValue: 1,
          targetValue: 1,
          unit: "fois",
          streak: 11,
          bestStreak: 24,
          jokerDaysLeft: 3,
          daysThresholdAlert: 2,
          lastCompletedDate: yesterdayStr,
          history: { [prevDayStr]: 1, [yesterdayStr]: 1 },
          rewardValue: 30,
          isNeglected: false
        },
        {
          id: "habit-demo-2",
          title: "Méditation Transcendantale",
          description: "Optimisation de l'attention et de la concentration.",
          type: "binary",
          currentValue: 0,
          targetValue: 1,
          unit: "session",
          streak: 4,
          bestStreak: 12,
          jokerDaysLeft: 2,
          daysThresholdAlert: 1,
          lastCompletedDate: prevDayStr,
          history: { [prevDayStr]: 1 },
          rewardValue: 20,
          isNeglected: true
        }
      ],
      trackedActivities: [
        {
          id: "track-demo-act-1",
          type: "sleep",
          title: "8h de Sommeil Profond Extrême",
          startTime: "2026-05-23T22:30:00Z",
          endTime: "2026-05-24T06:30:00Z",
          notes: "Réveil spontané, aucun réveil nocturne. Excellente régulation.",
          value: 10
        },
        {
          id: "track-demo-act-2",
          type: "sport",
          title: "Course d'endurance 10km",
          startTime: "2026-05-23T16:00:00Z",
          endTime: "2026-05-23T17:15:00Z",
          notes: "Sommeil de ce soir s'annonce fantastique.",
          value: 9
        }
      ],
      medications: [
        {
          id: "med-demo-1",
          name: "Sertraline (Zoloft)",
          dosage: "100mg",
          frequencyDescription: "1 comprimé chaque matin",
          stock: 45,
          lowStockThreshold: 10,
          refillDoctorTrigger: false
        },
        {
          id: "med-demo-2",
          name: "Mélatonine Gels",
          dosage: "2mg",
          frequencyDescription: "1 capsule s'il y a des tensions chroniques",
          stock: 3,
          lowStockThreshold: 10,
          refillDoctorTrigger: true
        }
      ],
      healthSuspicions: [
        {
          id: "susp-demo-1",
          pathologyName: "Fatigue circadienne chronique",
          confidenceScore: 78,
          status: "active",
          symptomsFound: ["Excès d'écrans tardifs", "Sommeil fragmenté de 5h", "Fréquence cardiaque instable"],
          explanation: "Votre chronologie montre une lutte circadienne. Évitez absolument le rétro-éclairage après 22h sous peine de retard de phase.",
          historyPoints: [
            { date: "2026-05-21", confidenceScore: 30 },
            { date: "2026-05-22", confidenceScore: 50 },
            { date: "2026-05-23", confidenceScore: 75 },
            { date: "2026-05-24", confidenceScore: 78 }
          ]
        }
      ],
      userProfile: {
        coins: 1050,
        debt: 0,
        targetSleepTime: "22:30",
        targetWakeTime: "06:30",
        wakeUpRewardSettings: {
          targetHour: 6,
          targetMinute: 30,
          baseReward: 50
        }
      },
      aiMemories: [
        {
          id: "mem-demo-1",
          key: "Préférence d'entraînement",
          value: "Bénéficie d'activités cardio vers 16h, favorise un sommeil à vagues lentes stables.",
          updatedAt: new Date().toISOString()
        }
      ],
      psyCards: [
        {
          id: "psy-demo-1",
          title: "Bilan Clinique Circadien de Printemps",
          content: "L'utilisateur montre une amélioration de 15% de l'observance thérapeutique ce mois. Le cycle de sommeil profond se consolide grâce à des siestes chroniques de 15min et une hydratation continue.",
          moodScore: 8,
          createdAt: new Date().toISOString()
        }
      ]
    };

    updateDb(demoDb);
    setImportStatus("🟢 Mode Démo Activé massivement ! 1050 Coins et des graphes vivants !");
    setTimeout(() => setImportStatus(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Memphis config top banner */}
      <div className="bg-yellow-100 border-4 border-black p-4 rounded-none shadow-[4px_4px_0px_0px_#000]">
        <h2 className="text-2xl font-black font-mono tracking-tight text-black flex items-center gap-2">
          ⚙️ PARAMÈTRES & SAUVEGARDE
        </h2>
        <p className="text-sm font-semibold font-mono text-gray-700 mt-1">
          Personnalisation de l'affichage, sauvegarde et gestion des données.
        </p>
      </div>

      {importStatus && (
        <div className="bg-yellow-50 border-4 border-black p-3 text-black font-bold text-xs shadow-[2px_2px_0px_0px_#000]">
          {importStatus}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
        
        {/* Colonne Gauche - Configuration de profil (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Formulaire de gamification et réglages esthétiques poussés */}
          <form onSubmit={handleSaveEstheticsAndGamification} className="border-4 border-black bg-white p-4 rounded-none shadow-[4px_4px_0px_0px_#000] space-y-4">
            <h3 className="font-mono font-black text-sm text-black border-b-2 border-black pb-2 mb-2 uppercase flex items-center gap-1.5">
              🎨 Réglages Esthétiques & Thèmes d'Affichage
            </h3>

            {/* Choix Thème */}
            <div className="space-y-1">
              <label className="block font-black text-[10px] uppercase text-black">Style Principal de l'Application</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setThemeStyle("memphis")}
                  className={`py-2 text-[10px] border-2 border-black font-black uppercase text-center cursor-pointer transition-all ${themeStyle === "memphis" ? "bg-yellow-400 text-black shadow-[2px_2px_0px_0px_#000]" : "bg-white text-black"}`}
                >
                  Memphis (Pastel)
                </button>
                <button
                  type="button"
                  onClick={() => setThemeStyle("cosmic")}
                  className={`py-2 text-[10px] border-2 border-black font-black uppercase text-center cursor-pointer transition-all ${themeStyle === "cosmic" ? "bg-purple-600 text-white shadow-[2px_2px_0px_0px_#000]" : "bg-white text-black"}`}
                >
                  Cosmic (Sombre)
                </button>
                <button
                  type="button"
                  onClick={() => setThemeStyle("brutalist")}
                  className={`py-2 text-[10px] border-2 border-black font-black uppercase text-center cursor-pointer transition-all ${themeStyle === "brutalist" ? "bg-black text-white shadow-[2px_2px_0px_0px_#000]" : "bg-white text-black"}`}
                >
                  Brutaliste (Noir-Blanc)
                </button>
              </div>
            </div>

            {/* Espacement Layout */}
            <div className="space-y-1">
              <label className="block font-black text-[10px] uppercase text-black">Aération & Espacement général</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLayoutSpacing("compact")}
                  className={`py-1 w-full border-2 border-black font-black uppercase text-center cursor-pointer ${layoutSpacing === "compact" ? "bg-black text-white" : "bg-white text-black"}`}
                >
                  Trassé / Compact
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutSpacing("cozy")}
                  className={`py-1 w-full border-2 border-black font-black uppercase text-center cursor-pointer ${layoutSpacing === "cozy" ? "bg-black text-white" : "bg-white text-black"}`}
                >
                  Équilibré / Confort
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutSpacing("spacious")}
                  className={`py-1 w-full border-2 border-black font-black uppercase text-center cursor-pointer ${layoutSpacing === "spacious" ? "bg-black text-white" : "bg-white text-black"}`}
                >
                  Aéré / Spacieux
                </button>
              </div>
            </div>

            {/* Curseurs de Bordure et d'Ombres */}
            <div className="grid grid-cols-2 gap-4 pt-1 bg-gray-55 p-2 border-2 border-black">
              <div>
                <label className="block font-black uppercase text-[9px] text-gray-700">Bordure Cartes : {cardBorderWidth}px</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="2"
                    value={cardBorderWidth}
                    onChange={(e) => setCardBorderWidth(Number(e.target.value))}
                    className="flex-1 accent-black h-1 bg-gray-200 cursor-pointer"
                  />
                  <span className="font-bold border border-black bg-white px-1 text-[9px]">{cardBorderWidth}px</span>
                </div>
              </div>

              <div>
                <label className="block font-black uppercase text-[9px] text-gray-700 font-mono">Ombrage Memphis : {cardShadowOpacity}%</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="25"
                    value={cardShadowOpacity}
                    onChange={(e) => setCardShadowOpacity(Number(e.target.value))}
                    className="flex-1 accent-black h-1 bg-gray-200 cursor-pointer"
                  />
                  <span className="font-bold border border-black bg-white px-1 text-[9px]">{cardShadowOpacity}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 bg-yellow-50 p-2.5 border-2 border-dashed border-black">
              <label className="block font-black uppercase text-[9px] tracking-wider text-black">
                Ajustement du calcul des récompenses : {rewardCalculationRatio}x
              </label>
              <div className="flex items-center gap-1.5 mt-0.5">
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={rewardCalculationRatio}
                  onChange={(e) => setRewardCalculationRatio(parseFloat(e.target.value))}
                  className="flex-1 accent-black h-1 bg-gray-200 cursor-pointer"
                />
                <span className="font-bold border border-black px-1 bg-white text-[9px]">{rewardCalculationRatio}x</span>
              </div>
            </div>

            <div className="text-right">
              <button
                type="submit"
                className="bg-black text-white hover:bg-yellow-300 hover:text-black border-2 border-black px-4 py-2 font-black cursor-pointer shadow-[2px_2px_0px_0px_#000] text-xs uppercase"
              >
                Appliquer les Réglages Esthétiques & Multiplicateur
              </button>
            </div>
          </form>
        </div>

        {/* Colonne Droite - Sauvegarde & Restauration JSON sans popup (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="border-4 border-black bg-white p-4 rounded-none shadow-[4px_4px_0px_0px_#000] space-y-4">
            <h3 className="font-mono font-black text-sm text-black border-b-2 border-black pb-2 mb-2 uppercase flex items-center gap-1.5">
              💾 Système Integre de Sauvegarde Locale
            </h3>

            <div className="space-y-2">
              <p className="text-[11px] text-gray-500 font-bold leading-normal">
                Exportez librement fichier JSON complet de tod° contenant votre historique pour le transférer ou l'importer en ligne.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleExportStateData}
                  className="bg-sky-200 hover:bg-sky-300 text-black border-2 border-black py-2 px-3 font-black flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                >
                  <Download size={14} /> Exporter JSON
                </button>
                <button
                  onClick={() => setShowImportArea(!showImportArea)}
                  className="bg-emerald-200 hover:bg-emerald-300 text-black border-2 border-black py-2 px-3 font-black flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                >
                  <Upload size={14} /> Importer JSON
                </button>
              </div>

              <div className="pt-2 border-t border-black/20">
                <GoogleSheetsExportButton db={db} variant="primary" />
              </div>
            </div>

            {showImportArea && (
              <div className="bg-yellow-50 border-2 border-black p-3 space-y-3 shadow-[1px_1px_0px_0px_#000] animate-fade-in text-black">
                <div className="space-y-2 border-2 border-dashed border-black bg-white p-3 text-center">
                  <label className="block font-black text-xs text-black cursor-pointer">
                    📂 SÉLECTIONNEZ VOTRE FICHIER SAUVEGARDE JSON :
                    <input
                      type="file"
                      id="json-file-input"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                    <div className="mt-2 bg-emerald-300 hover:bg-emerald-400 text-black border-2 border-black py-1.5 px-3 font-bold inline-block text-xs uppercase shadow-[1px_1px_0px_0px_#000] cursor-pointer">
                      Parcourir les fichiers (.json)
                    </div>
                  </label>
                  {selectedFileName && (
                    <p className="text-[10px] text-gray-700 font-extrabold">
                      Fichier sélectionné : {selectedFileName}
                    </p>
                  )}
                </div>

                <div className="text-center font-bold text-[9px] text-gray-500 uppercase tracking-widest">— OU COLLER LE TEXTE BRUT DU JSON —</div>

                <form onSubmit={handleImportStateData} className="space-y-3">
                  <textarea
                    required
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                    placeholder='ex: { "tasks": [], "habits": [], ... }'
                    className="w-full border-2 border-black bg-white p-2 h-20 text-[10px] resize-none font-mono text-black"
                  />
                  <button
                    type="submit"
                    className="w-full bg-emerald-400 hover:bg-emerald-500 border-2 border-black py-1.5 font-bold cursor-pointer text-xs"
                  >
                    Valider la Restauration (Texte Brut)
                  </button>
                </form>

                {pendingDbToImport && (() => {
                  const { 
                    tasks: missingT, 
                    habits: missingH, 
                    recurringTasks: missingR,
                    preparations: missingP,
                    trackedActivities: missingA,
                    journalLogs: missingJ,
                    medications: missingM
                  } = getMissingItemsList();
                  
                  const totalImportTasks = pendingDbToImport?.tasks?.length || 0;
                  const totalImportHabits = pendingDbToImport?.habits?.length || 0;
                  const totalImportRecs = pendingDbToImport?.recurringTasks?.length || 0;
                  const totalImportPreps = pendingDbToImport?.preparations?.length || 0;
                  const totalImportActs = pendingDbToImport?.trackedActivities?.length || 0;
                  const totalImportJournal = pendingDbToImport?.journalLogs?.length || 0;
                  const totalImportMeds = pendingDbToImport?.medications?.length || 0;

                  const duplicateTasksCount = Math.max(0, totalImportTasks - missingT.length);
                  const duplicateHabitsCount = Math.max(0, totalImportHabits - missingH.length);
                  const duplicateRecsCount = Math.max(0, totalImportRecs - missingR.length);
                  const duplicatePrepsCount = Math.max(0, totalImportPreps - missingP.length);
                  const duplicateActsCount = Math.max(0, totalImportActs - missingA.length);
                  const duplicateJournalCount = Math.max(0, totalImportJournal - missingJ.length);
                  const duplicateMedsCount = Math.max(0, totalImportMeds - missingM.length);

                  const totalDuplicates = duplicateTasksCount + duplicateHabitsCount + duplicateRecsCount + duplicatePrepsCount + duplicateActsCount + duplicateJournalCount + duplicateMedsCount;
                  const selectedCount = selectedTasks.length + selectedHabits.length + selectedRecs.length + selectedPreps.length + selectedActivities.length + selectedJournal.length + selectedMeds.length;

                  const allCategoriesEmpty = missingT.length === 0 && missingH.length === 0 && missingR.length === 0 && missingP.length === 0 && missingA.length === 0 && missingJ.length === 0 && missingM.length === 0;

                  return (
                    <div className="bg-white border-4 border-black p-3.5 space-y-4 shadow-[3px_3px_0px_0px_#000] text-black">
                      <div className="flex items-center gap-1.5 border-b-2 border-black pb-1.5">
                        <Sparkles className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                        <span className="font-black text-xs uppercase text-indigo-900 tracking-wider">🔬 Analyste IA : Comparatif</span>
                      </div>

                      {totalDuplicates > 0 && (
                        <div className="bg-amber-50 border-2 border-black py-1 px-2 text-[9px] font-bold text-amber-900 leading-tight">
                          🛡️ {totalDuplicates} doublon(s) déjà enregistré(s) automatiquement filtré(s).
                        </div>
                      )}

                      {!allCategoriesEmpty && (
                        <p className="text-[10px] text-gray-700 leading-normal font-extrabold">
                          Cochez les éléments du fichier à incorporer à votre progression actuelle :
                        </p>
                      )}

                      {/* Tâches Récurrentes */}
                      {missingR.length > 0 && (
                        <div className="space-y-1">
                          <h5 className="font-black text-[9px] uppercase text-emerald-800 flex items-center gap-1">
                            🔁 Tâches Récurrentes ({missingR.length})
                          </h5>
                          <div className="max-h-24 overflow-y-auto border-2 border-black p-1.5 space-y-1 bg-gray-50">
                            {missingR.map((rt) => {
                               const checked = selectedRecs.includes(rt.id);
                               return (
                                 <label key={rt.id} className="flex items-center gap-1.5 text-[9px] select-none cursor-pointer">
                                   <input
                                     type="checkbox"
                                     checked={checked}
                                     onChange={() => {
                                       if (checked) {
                                         setSelectedRecs(selectedRecs.filter(id => id !== rt.id));
                                       } else {
                                         setSelectedRecs([...selectedRecs, rt.id]);
                                       }
                                     }}
                                     className="rounded-none border-2 border-black text-black focus:ring-0 cursor-pointer h-3 w-3"
                                   />
                                   <span className="font-bold truncate flex-1">{rt.title}</span>
                                 </label>
                               );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Habitudes */}
                      {missingH.length > 0 && (
                        <div className="space-y-1">
                          <h5 className="font-black text-[9px] uppercase text-indigo-800 flex items-center gap-1">
                            💪 Habitudes ({missingH.length})
                          </h5>
                          <div className="max-h-24 overflow-y-auto border-2 border-black p-1.5 space-y-1 bg-gray-50">
                            {missingH.map((habDef) => {
                               const checked = selectedHabits.includes(habDef.id);
                               return (
                                 <label key={habDef.id} className="flex items-center gap-1.5 text-[9px] select-none cursor-pointer">
                                   <input
                                     type="checkbox"
                                     checked={checked}
                                     onChange={() => {
                                       if (checked) {
                                         setSelectedHabits(selectedHabits.filter(id => id !== habDef.id));
                                       } else {
                                         setSelectedHabits([...selectedHabits, habDef.id]);
                                       }
                                     }}
                                     className="rounded-none border-2 border-black text-black focus:ring-0 cursor-pointer h-3 w-3"
                                   />
                                   <span className="font-bold truncate flex-1">{habDef.title}</span>
                                 </label>
                               );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tâches uniques */}
                      {missingT.length > 0 && (
                        <div className="space-y-1">
                          <h5 className="font-black text-[9px] uppercase text-blue-800 flex items-center gap-1">
                            📌 Tâches uniques ({missingT.length})
                          </h5>
                          <div className="max-h-24 overflow-y-auto border-2 border-black p-1.5 space-y-1 bg-gray-50">
                            {missingT.map((t) => {
                               const checked = selectedTasks.includes(t.id);
                               return (
                                 <label key={t.id} className="flex items-center gap-1.5 text-[9px] select-none cursor-pointer">
                                   <input
                                     type="checkbox"
                                     checked={checked}
                                     onChange={() => {
                                       if (checked) {
                                         setSelectedTasks(selectedTasks.filter(id => id !== t.id));
                                       } else {
                                         setSelectedTasks([...selectedTasks, t.id]);
                                       }
                                     }}
                                     className="rounded-none border-2 border-black text-black focus:ring-0 cursor-pointer h-3 w-3"
                                   />
                                   <span className="font-bold truncate flex-1">{t.title}</span>
                                 </label>
                               );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Routines de préparation */}
                      {missingP.length > 0 && (
                        <div className="space-y-1">
                          <h5 className="font-black text-[9px] uppercase text-purple-800 flex items-center gap-1">
                            ⚡ Routines de Préparation ({missingP.length})
                          </h5>
                          <div className="max-h-24 overflow-y-auto border-2 border-black p-1.5 space-y-1 bg-gray-50">
                            {missingP.map((p) => {
                               const checked = selectedPreps.includes(p.id);
                               return (
                                 <label key={p.id} className="flex items-center gap-1.5 text-[9px] select-none cursor-pointer">
                                   <input
                                     type="checkbox"
                                     checked={checked}
                                     onChange={() => {
                                       if (checked) {
                                         setSelectedPreps(selectedPreps.filter(id => id !== p.id));
                                       } else {
                                         setSelectedPreps([...selectedPreps, p.id]);
                                       }
                                     }}
                                     className="rounded-none border-2 border-black text-black focus:ring-0 cursor-pointer h-3 w-3"
                                   />
                                   <span className="font-bold truncate flex-1">{p.title}</span>
                                 </label>
                               );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Activités somatiques journalisées */}
                      {missingA.length > 0 && (
                        <div className="space-y-1">
                          <h5 className="font-black text-[9px] uppercase text-teal-800 flex items-center gap-1">
                            💤 Activités & Sommeil ({missingA.length})
                          </h5>
                          <div className="max-h-24 overflow-y-auto border-2 border-black p-1.5 space-y-1 bg-gray-50">
                            {missingA.map((a) => {
                               const checked = selectedActivities.includes(a.id);
                               return (
                                 <label key={a.id} className="flex items-center gap-1.5 text-[9px] select-none cursor-pointer">
                                   <input
                                     type="checkbox"
                                     checked={checked}
                                     onChange={() => {
                                       if (checked) {
                                         setSelectedActivities(selectedActivities.filter(id => id !== a.id));
                                       } else {
                                         setSelectedActivities([...selectedActivities, a.id]);
                                       }
                                     }}
                                     className="rounded-none border-2 border-black text-black focus:ring-0 cursor-pointer h-3 w-3"
                                   />
                                   <span className="font-bold truncate flex-1">{a.title} ({a.type})</span>
                                 </label>
                               );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Entrées Journal */}
                      {missingJ.length > 0 && (
                        <div className="space-y-1">
                          <h5 className="font-black text-[9px] uppercase text-pink-800 flex items-center gap-1">
                            📖 Journal d'introspection ({missingJ.length})
                          </h5>
                          <div className="max-h-24 overflow-y-auto border-2 border-black p-1.5 space-y-1 bg-gray-50">
                            {missingJ.map((j) => {
                               const checked = selectedJournal.includes(j.id);
                               return (
                                 <label key={j.id} className="flex items-center gap-1.5 text-[9px] select-none cursor-pointer">
                                   <input
                                     type="checkbox"
                                     checked={checked}
                                     onChange={() => {
                                       if (checked) {
                                         setSelectedJournal(selectedJournal.filter(id => id !== j.id));
                                       } else {
                                         setSelectedJournal([...selectedJournal, j.id]);
                                       }
                                     }}
                                     className="rounded-none border-2 border-black text-black focus:ring-0 cursor-pointer h-3 w-3"
                                   />
                                   <span className="font-bold truncate flex-1">[{j.date}] {j.content}</span>
                                 </label>
                               );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Médicaments */}
                      {missingM.length > 0 && (
                        <div className="space-y-1">
                          <h5 className="font-black text-[9px] uppercase text-rose-800 flex items-center gap-1">
                            💊 Médicaments ({missingM.length})
                          </h5>
                          <div className="max-h-24 overflow-y-auto border-2 border-black p-1.5 space-y-1 bg-gray-50">
                            {missingM.map((m) => {
                               const checked = selectedMeds.includes(m.id);
                               return (
                                 <label key={m.id} className="flex items-center gap-1.5 text-[9px] select-none cursor-pointer">
                                   <input
                                     type="checkbox"
                                     checked={checked}
                                     onChange={() => {
                                       if (checked) {
                                         setSelectedMeds(selectedMeds.filter(id => id !== m.id));
                                       } else {
                                         setSelectedMeds([...selectedMeds, m.id]);
                                       }
                                     }}
                                     className="rounded-none border-2 border-black text-black focus:ring-0 cursor-pointer h-3 w-3"
                                   />
                                   <span className="font-bold truncate flex-1">{m.name} ({m.dosage})</span>
                                 </label>
                               );
                            })}
                          </div>
                        </div>
                      )}

                      {allCategoriesEmpty && (
                        <div className="text-center py-2 bg-emerald-50 border-2 border-dashed border-emerald-400 text-emerald-800 text-[10px] font-black uppercase">
                          🎉 Zéro différence. Votre application est déjà 100% à jour.
                        </div>
                      )}

                      <div className="space-y-2 border-t-2 border-black pt-3">
                        {selectedCount > 0 && (
                          <button
                            type="button"
                            onClick={handleExecuteSelectiveImport}
                            className="w-full bg-emerald-400 hover:bg-emerald-500 border-2 border-black py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                          >
                            ⚡ Incorporer la sélection ({selectedCount})
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleExecuteOverwriteImport}
                          className="w-full text-left bg-rose-50 hover:bg-rose-100 border-2 border-black p-2 text-[9px] font-bold cursor-pointer"
                        >
                          <span className="block font-black text-rose-800 uppercase">💥 Option alternative : Écrasement total</span>
                          <span className="block text-[8px] text-gray-500 mt-0.5">Remplace l'ensemble de l'application par le fichier de sauvegarde (perte de la progression courante).</span>
                        </button>

                        <div className="text-center pt-1">
                          <button
                            type="button"
                            onClick={handleCancelImport}
                            className="text-gray-500 hover:text-black font-extrabold text-[10px] underline cursor-pointer"
                          >
                            Annuler l'importation
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Réinitialisations plus poussées / sélectives et d'usine, en ligne, pas de popup ! */}
            <div className="border-t-2 border-black pt-4 bg-red-50 border-2 border-black p-3 rounded-none text-xs space-y-4">
              <h4 className="font-black text-red-700 uppercase flex items-center gap-1 text-[11px] border-b border-red-200 pb-1">
                ⚠️ Panneau de Réinitialisations Sélectives Cliniques
              </h4>
              <p className="text-[10px] text-gray-700 font-extrabold leading-tight">
                Effectuez des remises à zéro contrôlées directes sur votre profil et vos modules.
              </p>

              {/* État de confirmation locale pour éviter les popups */}
              {isResetting ? (
                <div className="bg-white border-2 border-red-500 p-3 text-center space-y-2.5 animate-pulse">
                  <p className="font-black text-red-600 text-[10px]">⚠️ CONFIRMATION EN LIGNE DE RÉINITIALISATION GÉNÉRALE TOTALE ?</p>
                  <p className="text-[9px] text-gray-500">Cela réinitialise tous vos modules à l'origine (Tâches, Habitudes, Profil et Wallet).</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleResetToDefault}
                      className="bg-red-600 hover:bg-red-700 text-white font-mono font-black border-2 border-black px-3 py-1 text-[10px] cursor-pointer"
                    >
                      Oui, Écraser tout d'usine
                    </button>
                    <button
                      onClick={() => setIsResetting(false)}
                      className="bg-white text-black font-bold border-2 border-black px-3 py-1 text-[10px] cursor-pointer"
                    >
                      Non, Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-[10px]">
                  {/* Option 1 : Réinitialiser portefeuille uniquement */}
                  <div className="border border-dashed border-red-300 p-2 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-red-800">1. Vider le portefeuille de pièces (CS)</span>
                      <p className="text-[8px] text-gray-400">Remet votre solde de pièces à 0 CS immédiatement.</p>
                    </div>
                    <button
                      onClick={() => {
                        updateDb({ ...db, userProfile: { ...db.userProfile, coins: 0 } });
                        setImportStatus("🟡 Balance de pièces (Coins) réinitialisée à 0 CS.");
                        setTimeout(() => setImportStatus(null), 3000);
                      }}
                      className="bg-red-100 hover:bg-red-200 text-red-700 border border-black px-2 py-1 font-bold text-[9px] uppercase cursor-pointer"
                    >
                      Vider portefeuille
                    </button>
                  </div>

                  {/* Option 2 : Réinitialiser Habitudes & Streaks uniquement */}
                  <div className="border border-dashed border-red-300 p-2 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-red-800">2. Réinitialiser les Habitudes & Séries</span>
                      <p className="text-[8px] text-gray-400">Remet à zéro l'historique et toutes les séries (streaks) d'habitudes.</p>
                    </div>
                    <button
                      onClick={() => {
                        const resetHabits = (db.habits || []).map(h => ({ ...h, streak: 0, bestStreak: 0, currentValue: 0, history: {} }));
                        updateDb({ ...db, habits: resetHabits });
                        setImportStatus("🟡 Streaks et progressions d'habitudes remis à zéro.");
                        setTimeout(() => setImportStatus(null), 3000);
                      }}
                      className="bg-red-100 hover:bg-red-200 text-red-700 border border-black px-2 py-1 font-bold text-[9px] uppercase cursor-pointer"
                    >
                      Remise à zéro streaks
                    </button>
                  </div>

                  {/* Option 3 : Effacer toutes les tâches */}
                  <div className="border border-dashed border-red-300 p-2 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-red-800">3. Vider l'intégralité des tâches</span>
                      <p className="text-[8px] text-gray-400">Archiver ou effacer toutes vos tâches listées dans votre tod°.</p>
                    </div>
                    <button
                      onClick={() => {
                        updateDb({ ...db, tasks: [] });
                        setImportStatus("🟡 Toutes les tâches ont été complètement vidées.");
                        setTimeout(() => setImportStatus(null), 3000);
                      }}
                      className="bg-red-100 hover:bg-red-200 text-red-700 border border-black px-2 py-1 font-bold text-[9px] uppercase cursor-pointer"
                    >
                      Effacer les tâches
                    </button>
                  </div>

                  {/* Option 4 : Bouton de réinitialisation générale d'usine */}
                  <button
                    onClick={() => setIsResetting(true)}
                    className="w-full bg-red-400 hover:bg-red-500 text-white font-mono font-black border-2 border-black py-2.5 cursor-pointer text-[10px] uppercase shadow-[2px_2px_0px_0px_#000]"
                  >
                    💥 Réinitialisation Générale d'Usine
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
