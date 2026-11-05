import { useState, useEffect, useRef } from "react";
import { auth, db as firestoreDb, handleFirestoreError, OperationType } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { AppDatabase } from "../types";
import { DEFAULT_DATABASE_STATE, loadDatabase as loadLegacyLocalStorage, mergeDatabases, propagateCompleteness } from "./state";

export function useFirebaseSync() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [db, setDb] = useState<AppDatabase>(DEFAULT_DATABASE_STATE);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "synced" | "error">("idle");

  // Identifiants uniques de session pour filtrer les échos de boucle onSnapshot
  const deviceIdRef = useRef<string>(`device-${Math.random().toString(36).substring(2, 10)}`);
  const lastWriteIdRef = useRef<string>("");
  const isInitialLoadRef = useRef<boolean>(true);

  // File d'attente d'écritures debouncée avec Exponential Backoff pour éviter l'épuisement de bande passante
  const debounceTimerRef = useRef<any>(null);
  const pendingDataRef = useRef<AppDatabase | null>(null);
  const isWritingRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const backoffTimerRef = useRef<any>(null);

  // Authentification de l'utilisateur
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setDb(DEFAULT_DATABASE_STATE);
        setLoading(false);
        isInitialLoadRef.current = true;
      }
    });
    return unsubscribe;
  }, []);

  // Synchronisation Firestore en temps réel dès que l'utilisateur est connecté
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const userId = currentUser.uid;
    const docRef = doc(firestoreDb, "users", userId);

    console.log("Abonnement au document Firestore temps réel pour l'utilisateur :", userId);

    const unsubscribe = onSnapshot(docRef, async (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data();
        const incomingWriteId = cloudData.lastWriteId;
        const incomingDeviceId = cloudData.deviceId;

        // Éviter de traiter notre propre écriture locale asynchrone qui a déclenché l'écho
        if (incomingDeviceId === deviceIdRef.current || incomingWriteId === lastWriteIdRef.current) {
          console.log("Écho de modification ignoré localement pour préserver la fluidité");
          setSaveStatus("synced");
          setLoading(false);
          isInitialLoadRef.current = false;
          return;
        }

        console.log("Données reçues d'un autre appareil / serveur. Mise à jour de l'état.");
        setDb(cloudData as AppDatabase);
        setSaveStatus("synced");
      } else if (isInitialLoadRef.current) {
        // Premier chargement et aucune donnée sur Firestore pour cet utilisateur
        // -> On migre les données LocalStorage existantes (contenant l'avancement local)
        console.log("Première synchronisation Firestore détectée. Migration des données locales.");
        const legacyData = loadLegacyLocalStorage();
        
        // Nettoyage immédiat des éventuelles valeurs undefined
        const sanitized = purgeUndefinedKeys(legacyData);
        
        const initialWriteId = `init-${Date.now()}`;
        lastWriteIdRef.current = initialWriteId;

        const payload = {
          ...sanitized,
          lastWriteId: initialWriteId,
          deviceId: deviceIdRef.current
        };

        try {
          await setDoc(docRef, payload);
          setDb(payload as AppDatabase);
          setSaveStatus("synced");
        } catch (error: any) {
          console.warn("Erreur d'initialisation Firestore :", error);
          handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
        }
      }
      setLoading(false);
      isInitialLoadRef.current = false;
    }, (error) => {
      console.error("Erreur réactive onSnapshot Firestore :", error);
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      setSaveStatus("error");
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (backoffTimerRef.current) clearTimeout(backoffTimerRef.current);
    };
  }, [currentUser]);

  // Exécution séquentielle et résiliente des écritures Firestore
  const processPendingWrite = async () => {
    if (isWritingRef.current) return;
    if (!pendingDataRef.current || !currentUser) {
      if (!pendingDataRef.current && isWritingRef.current === false) {
        setSaveStatus("synced");
      }
      return;
    }

    const dataToWrite = pendingDataRef.current;
    pendingDataRef.current = null;
    isWritingRef.current = true;
    setSaveStatus("saving");

    const userId = currentUser.uid;
    const docRef = doc(firestoreDb, "users", userId);
    const nextWriteId = `write-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    lastWriteIdRef.current = nextWriteId;

    const sanitizedData = purgeUndefinedKeys(dataToWrite);
    const payload = {
      ...sanitizedData,
      lastWriteId: nextWriteId,
      deviceId: deviceIdRef.current
    };

    try {
      await setDoc(docRef, payload);
      retryCountRef.current = 0;
      isWritingRef.current = false;

      // Si une nouvelle modification a eu lieu pendant l'écriture réseau
      if (pendingDataRef.current) {
        processPendingWrite();
      } else {
        setSaveStatus("synced");
      }
    } catch (err: any) {
      isWritingRef.current = false;
      const isRateLimit = err?.code === "resource-exhausted" || 
                          (err?.message && err.message.includes("resource-exhausted")) ||
                          (err?.message && err.message.includes("maximum bandwidth"));

      if (isRateLimit && retryCountRef.current < 5) {
        retryCountRef.current += 1;
        // Exponential backoff avec jitter (1s, 2s, 4s, 8s...)
        const delay = Math.min(10000, Math.pow(2, retryCountRef.current) * 1000 + Math.random() * 500);
        console.warn(`Firestore throttled (resource-exhausted). Tentative de reprise dans ${Math.round(delay)}ms (Essai ${retryCountRef.current}/5)...`);
        
        // Remettre les données dans la file d'attente
        if (!pendingDataRef.current) {
          pendingDataRef.current = dataToWrite;
        }

        setSaveStatus("saving");
        backoffTimerRef.current = setTimeout(() => {
          processPendingWrite();
        }, delay);
      } else {
        console.error("Erreur critique lors de la sauvegarde Firestore :", err);
        setSaveStatus("error");
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
      }
    }
  };

  // Fonction de sauvegarde réactive, optimiste et ultra-robuste
  const updateDbAndSave = (newData: AppDatabase, localOnly = false) => {
    // 1. Propagation de la complétion des tâches mères vers les sous-tâches
    const { tasks: propagatedTasks, coinsGained } = propagateCompleteness(newData.tasks || [], newData.userProfile?.coins || 0);
    
    const resolvedData = {
      ...newData,
      tasks: propagatedTasks,
      userProfile: coinsGained > 0 && newData.userProfile 
        ? { ...newData.userProfile, coins: newData.userProfile.coins + coinsGained }
        : newData.userProfile
    };

    // 2. Mise à jour instantanée de l'état local (Optimiste - zéro latence d'interface)
    setDb(resolvedData);

    if (localOnly) {
      return;
    }

    if (!currentUser) {
      console.warn("Données d'application non sauvegardées sur le cloud : aucun utilisateur connecté.");
      return;
    }

    // 3. Empiler dans la file de sauvegarde debouncée (600ms) pour préserver la bande passante
    pendingDataRef.current = resolvedData;
    setSaveStatus("saving");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      processPendingWrite();
    }, 600);
  };

  // Aligner l'état des habitudes avec le jour actuel en continu (ex: passage à minuit)
  useEffect(() => {
    if (loading || !db) return;
    
    const alignState = () => {
      const { synced, wasChanged } = ensureHabitsTodayState(db);
      if (wasChanged) {
        console.log("Alignement automatique quotidien des habitudes détecté (local uniquement).");
        setDb(synced);
      }
    };

    alignState();

    const interval = setInterval(alignState, 30000);
    return () => clearInterval(interval);
  }, [db, loading]);

  return {
    currentUser,
    loading,
    db,
    saveStatus,
    updateDbAndSave
  };
}

function ensureHabitsTodayState(database: AppDatabase): { synced: AppDatabase; wasChanged: boolean } {
  if (!database || !Array.isArray(database.habits)) {
    return { synced: database, wasChanged: false };
  }
  const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
  let wasChanged = false;

  const updatedHabits = database.habits.map((h) => {
    const expected = h.history ? (h.history[todayStr] ?? 0) : 0;
    if (h.currentValue !== expected) {
      wasChanged = true;
      return {
        ...h,
        currentValue: expected,
      };
    }
    return h;
  });

  if (wasChanged) {
    return {
      synced: {
        ...database,
        habits: updatedHabits,
      },
      wasChanged: true,
    };
  }
  return { synced: database, wasChanged: false };
}

// Fonction utilitaire indispensable pour supprimer totalement les clés undefined et éviter le plantage Firestore
function purgeUndefinedKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(purgeUndefinedKeys);
  } else if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, purgeUndefinedKeys(v)])
    );
  }
  return obj;
}
