import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
// @ts-ignore
import firebaseConfig from "../../firebase-applet-config.json";

// Initialisation unique et obligatoire de Firebase
const app = initializeApp(firebaseConfig);
const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId || "ai-studio-c1319359-6c93-4c43-8c5b-c7a3fe7ad6a5";
export const db = getFirestore(app, firestoreDbId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/tasks');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');

// Opérations de diagnostic d'erreur Firestore rigoureuses
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Fonction asynchrone de test obligatoire
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Lancement automatique du test de diagnostic à la volée
testConnection();

// Variable en mémoire pour stocker le token d'accès Google Tasks
let cachedTasksAccessToken: string | null = null;
let cachedCalendarAccessToken: string | null = null;
let cachedSheetsAccessToken: string | null = null;

// Initialisation de l'authentification Google Tasks autonome (compte séparé fluide)
let secondaryApp: any = null;
let secondaryAuth: any = null;

function getSecondaryAuth() {
  if (!secondaryApp) {
    try {
      secondaryApp = initializeApp(firebaseConfig, "secondaryTasksApp");
      secondaryAuth = getAuth(secondaryApp);
    } catch (e) {
      console.error("Erreur d'initialisation du service secondaire Google Tasks :", e);
    }
  }
  return secondaryAuth;
}

export function getTasksAccessToken(): string | null {
  if (!cachedTasksAccessToken) {
    cachedTasksAccessToken = localStorage.getItem("tasks_access_token");
  }
  return cachedTasksAccessToken;
}

export function setTasksAccessToken(token: string | null): void {
  cachedTasksAccessToken = token;
  if (token) {
    localStorage.setItem("tasks_access_token", token);
  } else {
    localStorage.removeItem("tasks_access_token");
  }
}

export function getCalendarAccessToken(): string | null {
  if (!cachedCalendarAccessToken) {
    cachedCalendarAccessToken = localStorage.getItem("calendar_access_token");
  }
  return cachedCalendarAccessToken;
}

export function setCalendarAccessToken(token: string | null): void {
  cachedCalendarAccessToken = token;
  if (token) {
    localStorage.setItem("calendar_access_token", token);
  } else {
    localStorage.removeItem("calendar_access_token");
  }
}

export function getSheetsAccessToken(): string | null {
  if (!cachedSheetsAccessToken) {
    cachedSheetsAccessToken = localStorage.getItem("sheets_access_token") || localStorage.getItem("calendar_access_token");
  }
  return cachedSheetsAccessToken;
}

export function setSheetsAccessToken(token: string | null): void {
  cachedSheetsAccessToken = token;
  if (token) {
    localStorage.setItem("sheets_access_token", token);
  } else {
    localStorage.removeItem("sheets_access_token");
  }
}

// Méthodes d'authentification Google simples sans popups superflues au runtime
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  if (token) {
    cachedTasksAccessToken = token;
    cachedCalendarAccessToken = token;
    cachedSheetsAccessToken = token;
    localStorage.setItem("tasks_access_token", token);
    localStorage.setItem("calendar_access_token", token);
    localStorage.setItem("sheets_access_token", token);
  }
  return result.user;
}

export async function signInWithGoogleTasks(): Promise<{ user: User; accessToken: string }> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/tasks');
  provider.addScope('https://www.googleapis.com/auth/calendar.events');
  provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
  provider.addScope('https://www.googleapis.com/auth/spreadsheets');
  // Forcer la sélection du compte Google pour permettre de se connecter avec une autre identité
  provider.setCustomParameters({ prompt: "select_account" });

  const secAuth = getSecondaryAuth();
  if (!secAuth) {
    throw new Error("Impossible d'initialiser le service d'authentification des tâches.");
  }

  const result = await signInWithPopup(secAuth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  if (!token) {
    throw new Error("Impossible de récupérer le jeton d'accès pour Google Tasks.");
  }
  cachedTasksAccessToken = token;
  localStorage.setItem("tasks_access_token", token);
  return { user: result.user, accessToken: token };
}

export async function signInWithGoogleCalendar(): Promise<{ user: User; accessToken: string }> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/tasks');
  provider.addScope('https://www.googleapis.com/auth/calendar.events');
  provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
  provider.addScope('https://www.googleapis.com/auth/spreadsheets');
  provider.setCustomParameters({ prompt: "select_account" });

  const secAuth = getSecondaryAuth();
  if (!secAuth) {
    throw new Error("Impossible d'initialiser le service d'authentification de l'agenda.");
  }

  const result = await signInWithPopup(secAuth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  if (!token) {
    throw new Error("Impossible de récupérer le jeton d'accès pour Google Calendar.");
  }
  cachedTasksAccessToken = token;
  cachedCalendarAccessToken = token;
  cachedSheetsAccessToken = token;
  localStorage.setItem("tasks_access_token", token);
  localStorage.setItem("calendar_access_token", token);
  localStorage.setItem("sheets_access_token", token);
  return { user: result.user, accessToken: token };
}

export async function signInWithGoogleSheets(): Promise<{ user: User; accessToken: string }> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/spreadsheets');
  provider.addScope('https://www.googleapis.com/auth/tasks');
  provider.addScope('https://www.googleapis.com/auth/calendar.events');
  provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
  provider.setCustomParameters({ prompt: "select_account" });

  const secAuth = getSecondaryAuth();
  if (!secAuth) {
    throw new Error("Impossible d'initialiser le service d'authentification Google Sheets.");
  }

  const result = await signInWithPopup(secAuth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  if (!token) {
    throw new Error("Impossible de récupérer le jeton d'accès pour Google Sheets.");
  }
  cachedSheetsAccessToken = token;
  localStorage.setItem("sheets_access_token", token);
  return { user: result.user, accessToken: token };
}

export async function logOut(): Promise<void> {
  await signOut(auth);
  if (secondaryAuth) {
    try {
      await signOut(secondaryAuth);
    } catch (e) {
      console.warn("Échec de la déconnexion secondaire Google Tasks :", e);
    }
  }
  cachedTasksAccessToken = null;
  cachedCalendarAccessToken = null;
  cachedSheetsAccessToken = null;
  localStorage.removeItem("tasks_access_token");
  localStorage.removeItem("calendar_access_token");
  localStorage.removeItem("sheets_access_token");
}
