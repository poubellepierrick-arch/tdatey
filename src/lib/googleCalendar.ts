import type { CSSProperties } from "react";
import { Task } from "../types";
import { getCalendarAccessToken, setCalendarAccessToken, signInWithGoogleCalendar } from "./firebase";

export interface GoogleCalendarColor {
  id: string;
  name: string;
  hex: string;
  bgClass: string;
}

export const GOOGLE_COLORS: GoogleCalendarColor[] = [
  { id: "1", name: "Lavande", hex: "#a4bdfc", bgClass: "bg-[#a4bdfc] hover:bg-[#b5ccff] text-[#1d2d50] border-[#5484ed]" },
  { id: "2", name: "Sauge", hex: "#7ae7bf", bgClass: "bg-[#7ae7bf] hover:bg-[#8defcc] text-[#0f3425] border-[#51b749]" },
  { id: "3", name: "Glycine", hex: "#dbadff", bgClass: "bg-[#dbadff] hover:bg-[#e6c4ff] text-[#2c1a4d] border-[#a061ff]" },
  { id: "4", name: "Flamant rose", hex: "#ff887c", bgClass: "bg-[#ff887c] hover:bg-[#ff9c92] text-[#4d110c] border-[#dc2127]" },
  { id: "5", name: "Banane", hex: "#fbd75b", bgClass: "bg-[#fbd75b] hover:bg-[#fbe07a] text-[#443605] border-[#f8ad15]" },
  { id: "6", name: "Mandarine", hex: "#ffb878", bgClass: "bg-[#ffb878] hover:bg-[#ffc692] text-[#4d2503] border-[#ff8f23]" },
  { id: "7", name: "Paon", hex: "#46d6db", bgClass: "bg-[#46d6db] hover:bg-[#6be0e4] text-[#033638] border-[#0aa7ad]" },
  { id: "8", name: "Graphite", hex: "#e1e1e1", bgClass: "bg-[#e1e1e1] hover:bg-[#ebebeb] text-[#2c2c2c] border-[#9c9c9c]" },
  { id: "9", name: "Myrtille", hex: "#5484ed", bgClass: "bg-[#5484ed] hover:bg-[#6c98f5] text-[#ffffff] border-[#224fa8]" },
  { id: "10", name: "Basilic", hex: "#51b749", bgClass: "bg-[#51b749] hover:bg-[#64c35d] text-[#ffffff] border-[#1d5c19]" },
  { id: "11", name: "Tomate", hex: "#dc2127", bgClass: "bg-[#dc2127] hover:bg-[#e24147] text-[#ffffff] border-[#7d0f12]" }
];

export function getEventColorMeta(ev: Task): { bgHex?: string; textHex?: string; bgClass?: string; name?: string } {
  const colorKey = ev.googleColorId || ev.color;
  if (colorKey) {
    const col = GOOGLE_COLORS.find(c => String(c.id) === String(colorKey) || c.hex.toLowerCase() === String(colorKey).toLowerCase());
    if (col) {
      return {
        bgHex: col.hex,
        bgClass: col.bgClass,
        name: col.name
      };
    }
    if (String(colorKey).startsWith("#")) {
      return {
        bgHex: String(colorKey)
      };
    }
  }
  return {};
}

export function getEventInlineStyle(ev: Task): CSSProperties {
  const meta = getEventColorMeta(ev);
  if (meta.bgHex && !meta.bgClass) {
    return {
      backgroundColor: meta.bgHex,
      borderColor: "#000000"
    };
  }
  return {};
}

export async function fetchGoogleCalendarColors(accessToken: string): Promise<Record<string, { background: string; foreground: string }>> {
  try {
    const res = await fetch("https://www.googleapis.com/calendar/v3/colors", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.event || {};
    }
  } catch (e) {
    console.error("Erreur de chargement des couleurs Google Calendar :", e);
  }
  return {};
}

export function getEventColorClasses(ev: Task): string {
  if (ev.googleColorId || ev.color) {
    const col = GOOGLE_COLORS.find(c => String(c.id) === String(ev.googleColorId || ev.color));
    if (col) return `${col.bgClass} font-black cursor-pointer`;
    if ((ev.googleColorId || ev.color)?.startsWith("#")) {
      return `font-black cursor-pointer border-black text-black`;
    }
  }
  
  if (ev.isSharedEvent) {
    if (ev.sharedCalendarId) {
      let hash = 0;
      for (let i = 0; i < ev.sharedCalendarId.length; i++) {
        hash = (hash << 5) - hash + ev.sharedCalendarId.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % GOOGLE_COLORS.length;
      return `${GOOGLE_COLORS[idx].bgClass} font-black cursor-pointer`;
    }
    return "bg-purple-100 hover:bg-purple-200 text-purple-950 border-purple-500 cursor-pointer font-black";
  }
  
  if (ev.recurrence && ev.recurrence !== "none") {
    return "bg-sky-100 hover:bg-sky-200 text-sky-950 border-black cursor-grab active:cursor-grabbing font-black";
  }

  // Si l'événement vient de Google Calendar mais n'a pas de colorId individuel explicite
  if (ev.googleEventId || ev.isGoogleCalendarSynced) {
    let hash = 0;
    const key = ev.googleEventId || ev.title || "event";
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % GOOGLE_COLORS.length;
    return `${GOOGLE_COLORS[idx].bgClass} font-black cursor-grab active:cursor-grabbing`;
  }
  
  return "bg-orange-100 hover:bg-orange-200 text-orange-950 border-black cursor-grab active:cursor-grabbing font-black";
}

export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getNextLocalDateString(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    date.setDate(date.getDate() + 1);
    return getLocalDateString(date);
  }
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return getLocalDateString(d);
}

export const googleEventToLocalTask = (gEv: any): Task => {
  const isAllDay = !!(gEv.start?.date && !gEv.start?.dateTime);
  const startStr = gEv.start?.dateTime || gEv.start?.date || "";
  const endStr = gEv.end?.dateTime || gEv.end?.date || "";

  const startDate = startStr ? new Date(startStr) : new Date();
  const endDate = endStr ? new Date(endStr) : new Date(startDate.getTime() + 60 * 60 * 1000);

  let dueDateStr = "";
  if (isAllDay && gEv.start?.date) {
    dueDateStr = gEv.start.date;
  } else {
    dueDateStr = getLocalDateString(startDate);
  }

  const sh = String(startDate.getHours()).padStart(2, '0');
  const sm = String(startDate.getMinutes()).padStart(2, '0');
  const startTimeStr = isAllDay ? "" : `${sh}:${sm}`;

  const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

  // Détermination de la récurrence Google v3
  let recurrenceVal: "daily" | "weekly" | "monthly" | "none" = "none";
  if (gEv.recurrence && Array.isArray(gEv.recurrence) && gEv.recurrence.length > 0) {
    const recString = gEv.recurrence[0];
    if (recString.includes("FREQ=DAILY")) recurrenceVal = "daily";
    else if (recString.includes("FREQ=WEEKLY")) recurrenceVal = "weekly";
    else if (recString.includes("FREQ=MONTHLY")) recurrenceVal = "monthly";
    else recurrenceVal = "daily";
  } else if (gEv.recurringEventId) {
    recurrenceVal = "daily";
  }

  return {
    id: `event-${gEv.id}`,
    title: gEv.summary || "Sans titre",
    description: gEv.description || "",
    createdAt: gEv.created || new Date().toISOString(),
    isCompleted: false,
    importance: 0,
    urgency: 0,
    mentalLoad: 0,
    easiness: 0,
    score: 0,
    isStarred: false,
    dueDate: dueDateStr,
    scheduledTime: startTimeStr,
    durationMinutes: duration || 30,
    timeSpentSeconds: 0,
    rewardValue: 15,
    chronoRewardValue: 0,
    preparationIds: [],
    dependencies: [],
    type: "event",
    planningStatus: "scheduled",
    isGoogleCalendarSynced: true,
    googleEventId: gEv.id,
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
    recurrence: recurrenceVal,
    isAllDay,
    googleColorId: gEv.colorId
  };
};

export const googleSharedEventToLocalTask = (gEv: any, calName: string, calId: string): Task => {
  const isAllDay = !!(gEv.start?.date && !gEv.start?.dateTime);
  const startStr = gEv.start?.dateTime || gEv.start?.date || "";
  const endStr = gEv.end?.dateTime || gEv.end?.date || "";

  const startDate = startStr ? new Date(startStr) : new Date();
  const endDate = endStr ? new Date(endStr) : new Date(startDate.getTime() + 60 * 60 * 1000);

  let dueDateStr = "";
  if (isAllDay && gEv.start?.date) {
    dueDateStr = gEv.start.date;
  } else {
    dueDateStr = getLocalDateString(startDate);
  }

  const sh = String(startDate.getHours()).padStart(2, '0');
  const sm = String(startDate.getMinutes()).padStart(2, '0');
  const startTimeStr = isAllDay ? "" : `${sh}:${sm}`;

  const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

  let recurrenceVal: "daily" | "weekly" | "monthly" | "none" = "none";
  if (gEv.recurrence && Array.isArray(gEv.recurrence) && gEv.recurrence.length > 0) {
    const recString = gEv.recurrence[0];
    if (recString.includes("FREQ=DAILY")) recurrenceVal = "daily";
    else if (recString.includes("FREQ=WEEKLY")) recurrenceVal = "weekly";
    else if (recString.includes("FREQ=MONTHLY")) recurrenceVal = "monthly";
    else recurrenceVal = "daily";
  } else if (gEv.recurringEventId) {
    recurrenceVal = "daily";
  }

  return {
    id: `shared-${calId}-${gEv.id}`,
    title: gEv.summary || "Sans titre",
    description: gEv.description || "",
    createdAt: gEv.created || new Date().toISOString(),
    isCompleted: false,
    importance: 0,
    urgency: 0,
    mentalLoad: 0,
    easiness: 0,
    score: 0,
    isStarred: false,
    dueDate: dueDateStr,
    scheduledTime: startTimeStr,
    durationMinutes: duration || 30,
    timeSpentSeconds: 0,
    rewardValue: 15,
    chronoRewardValue: 0,
    preparationIds: [],
    dependencies: [],
    type: "event",
    planningStatus: "scheduled",
    isGoogleCalendarSynced: false,
    googleEventId: gEv.id,
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
    recurrence: recurrenceVal,
    isSharedEvent: true,
    sharedCalendarName: calName,
    sharedCalendarId: calId,
    isAllDay,
    googleColorId: gEv.colorId
  } as any;
};

export async function ensureCalendarAccessToken(): Promise<string | null> {
  const currentToken = getCalendarAccessToken();
  if (currentToken) return currentToken;
  try {
    const res = await signInWithGoogleCalendar();
    return res.accessToken;
  } catch (e) {
    console.warn("Connexion Google Calendar annulée ou impossible :", e);
    return null;
  }
}

export interface GoogleCalendarEventInput {
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  durationMinutes?: number;
  isAllDay?: boolean;
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  eventData: GoogleCalendarEventInput
): Promise<{ id: string } | null> {
  try {
    const dueDate = eventData.dueDate || getLocalDateString(new Date());
    let startObj: any = {};
    let endObj: any = {};

    if (eventData.scheduledTime) {
      const [hours, minutes] = eventData.scheduledTime.split(":").map(Number);
      const startDateTime = new Date(`${dueDate}T${String(hours || 0).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}:00`);
      const durationMs = (eventData.durationMinutes || 30) * 60 * 1000;
      const endDateTime = new Date(startDateTime.getTime() + durationMs);

      startObj = { dateTime: startDateTime.toISOString() };
      endObj = { dateTime: endDateTime.toISOString() };
    } else {
      startObj = { date: dueDate };
      endObj = { date: getNextLocalDateString(dueDate) };
    }

    const payload = {
      summary: eventData.title,
      description: eventData.description || "",
      start: startObj,
      end: endObj
    };

    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 401) {
      setCalendarAccessToken(null);
      return null;
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("Erreur création Google Calendar :", res.status, errText);
      return null;
    }

    const data = await res.json();
    return { id: data.id };
  } catch (e) {
    console.error("Exception création Google Calendar :", e);
    return null;
  }
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  googleEventId: string,
  eventData: GoogleCalendarEventInput
): Promise<boolean> {
  try {
    const dueDate = eventData.dueDate || getLocalDateString(new Date());
    let startObj: any = {};
    let endObj: any = {};

    if (eventData.scheduledTime) {
      const [hours, minutes] = eventData.scheduledTime.split(":").map(Number);
      const startDateTime = new Date(`${dueDate}T${String(hours || 0).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}:00`);
      const durationMs = (eventData.durationMinutes || 30) * 60 * 1000;
      const endDateTime = new Date(startDateTime.getTime() + durationMs);

      startObj = { dateTime: startDateTime.toISOString() };
      endObj = { dateTime: endDateTime.toISOString() };
    } else {
      startObj = { date: dueDate };
      endObj = { date: getNextLocalDateString(dueDate) };
    }

    const payload = {
      summary: eventData.title,
      description: eventData.description || "",
      start: startObj,
      end: endObj
    };

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 401) {
      setCalendarAccessToken(null);
      return false;
    }

    return res.ok;
  } catch (e) {
    console.error("Exception mise à jour Google Calendar :", e);
    return false;
  }
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  googleEventId: string
): Promise<boolean> {
  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (res.status === 401) {
      setCalendarAccessToken(null);
      return false;
    }

    return res.ok;
  } catch (e) {
    console.error("Exception suppression Google Calendar :", e);
    return false;
  }
}

