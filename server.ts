import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Return a dummy client or handle it nicely if needed, but the instructions say throw a clear error.
      // We will check if key is available before using it in the routes.
      throw new Error("La clé d'API GEMINI_API_KEY est requise mais manquante dans l'environnement.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Chaîne de repli automatique en cas de saturation d'un modèle : 3.8 -> 3.7 -> 3.6 -> 3.5 -> 2.5
const FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash"
];

async function generateContentWithFallback(ai: GoogleGenAI, requestParams: { contents: any; config?: any }) {
  let lastError: any = null;
  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: requestParams.contents,
        config: requestParams.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Fallback] Modèle ${model} indisponible (${err?.message || err}). Tentative avec le modèle suivant...`);
    }
  }
  throw lastError;
}

// Routes d'API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 1. Analyse du Journal d'Introspection
app.post("/api/gemini/analyze-journal", async (req, res) => {
  try {
    const { journalText, currentDatabaseState } = req.body;
    if (!journalText) {
      return res.status(400).json({ error: "Le texte du journal est requis." });
    }

    const ai = getGemini();

    const prompt = `L'utilisateur a écrit dans son Journal d'Introspection. 
Analyse ce texte et génère des suggestions d'action sous forme de nouvelles Tâches, Habitudes à suivre et Suggestions proactives. Génère également un bilan psycho-cognitif sous forme d'une PsyCard.

Texte du journal :
"${journalText}"

État actuel de son tableau de bord :
${JSON.stringify(currentDatabaseState || {})}

Consignes de formatage strict :
- Les tâches recommandées doivent avoir des niveaux d'importance/urgence/facilité/charge mentale (0 à 10).
- Les habitudes suggérées doivent être adaptées (binaire, quantitatif, chrono ou compteur).
- La PsyCard doit offrir un bilan d'introspection, une écoute bienveillante mais structurée, et un score d'humeur estimé de 1 à 10.
- Les arguments doivent être entièrement rédigés en FRANÇAIS.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "Tu es l'architecte bienveillant et conseiller IA de l'application tod°. Ton but est de soutenir l'utilisateur de manière pragmatique, psychologique et structurée.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["psyCard", "tasks", "habits", "proactiveSuggestions"],
          properties: {
            psyCard: {
              type: Type.OBJECT,
              required: ["title", "content", "moodScore"],
              properties: {
                title: { type: Type.STRING, description: "Titre inspirant ou thématique de l'analyse cognitive" },
                content: { type: Type.STRING, description: "Bilan psycho-cognitif et pistes d'introspection (en français)" },
                moodScore: { type: Type.INTEGER, description: "Score d'humeur estimé entre 1 (très bas) et 10 (excellent)" }
              }
            },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "importance", "urgency", "easiness", "mentalLoad", "isStarred"],
                properties: {
                  title: { type: Type.STRING, description: "Titre court de la tâche suggérée" },
                  description: { type: Type.STRING, description: "Description ou explication de pourquoi cette tâche" },
                  importance: { type: Type.INTEGER, description: "Sur 10" },
                  urgency: { type: Type.INTEGER, description: "Sur 10" },
                  easiness: { type: Type.INTEGER, description: "Sur 10" },
                  mentalLoad: { type: Type.INTEGER, description: "Sur 10" },
                  isStarred: { type: Type.BOOLEAN, description: "Vrai si hautement prioritaire aujourd'hui" }
                }
              }
            },
            habits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "type", "targetValue", "unit"],
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING, description: "binary | quantitative | chrono | counter" },
                  targetValue: { type: Type.INTEGER, description: "Valeur cible quotidienne" },
                  unit: { type: Type.STRING, description: "Unité par exemple: verres, minutes, fois" }
                }
              }
            },
            proactiveSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "type"],
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING, description: "group_tasks | adjust_schedule | suggest_habit | other" }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    res.json(JSON.parse(resultText || "{}"));
  } catch (error: any) {
    console.error("Erreur dans analyze-journal:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Analyses de Santé Clinique et Suspicions IA
app.post("/api/gemini/health-analysis", async (req, res) => {
  try {
    const { trackedActivities, medications, medicationLogs, previousSuspicions } = req.body;

    const ai = getGemini();

    const prompt = `Tu es un assistant médical d'IA orienté vers la modélisation de suspicions cliniques à visée préventive. 
Analyse les activités de l'utilisateur, la prise de ses traitements et les suspicions actuelles. Évalue ou génère de nouvelles suspicions cliniques (Health Suspicions) avec des scores d'affinité/confiance évolutifs (0-100), une explication claire et les symptômes ou anomalies physiques/somatiques détectés.

Activités suivies (sommeil, repas, sport) :
${JSON.stringify(trackedActivities || [])}

Espace pharmacien (Médicaments en stock, Fréquences, Prises) :
${JSON.stringify({ medications, medicationLogs })}

Suspicions existantes à réévaluer/mettre à jour ou compléter :
${JSON.stringify(previousSuspicions || [])}

Consignes strictes :
- Sois bienveillant, clair et explicite sur le fait que ce ne sont que des corrélations et hypothèses pour guider l'introspection (ceci n'est pas un avis de médecin officiel direct, mais un module clinique de l'application tod°).
- Génère ou mets à jour les suspicions cliniques avec un score d'affinité (0-100), un statut (active, under_investigation, ruled_out), et explique pourquoi.
- Fournis les réponses en FRANÇAIS.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "Tu es le module diagnostic psychiatrique et somatique préventif de l'application de santé de tod°. Analyse les activités et médicaments pour dresser des profils d'affinité clinique.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["suspicions"],
          properties: {
            suspicions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["pathologyName", "confidenceScore", "status", "symptomsFound", "explanation"],
                properties: {
                  pathologyName: { type: Type.STRING, description: "Nom de la pathologie, trouble, ou déséquilibre suspecté (ex: Manque de Sommeil Chronique, TDAH - phase distractibilité, Fatigue somatique)" },
                  confidenceScore: { type: Type.INTEGER, description: "Score d'affinité clinique de 0 à 100" },
                  status: { type: Type.STRING, description: "active | under_investigation | ruled_out" },
                  symptomsFound: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Symptômes ou anomalies détectés dans les logs" },
                  explanation: { type: Type.STRING, description: "Description clinique explicative bienveillante et conseils d'hygiène de vie en français." }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    res.json(JSON.parse(resultText || "{}"));
  } catch (error: any) {
    console.error("Erreur dans health-analysis:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Chat Conseiller de Vie et Gestion de la mémoire IA
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages, databaseState } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Les messages sont requis." });
    }

    const ai = getGemini();

    const lastMessage = messages[messages.length - 1].content;

    // On va enrichir le système en lui fournissant l'état complet pour qu'il ait une mémoire et des données réelles sur les tâches, habitudes...
    const contextStr = `État de l'utilisateur :
- Tâches en cours/faites : ${JSON.stringify((databaseState?.tasks || []).map((t: any) => ({ title: t.title, done: t.isCompleted, score: t.score })))}
- Habitudes : ${JSON.stringify((databaseState?.habits || []).map((h: any) => ({ title: h.title, streak: h.streak })))}
- Profil : ${JSON.stringify(databaseState?.userProfile || {})}
- Historique de la mémoire IA déjà stockée : ${JSON.stringify(databaseState?.aiMemories || [])}

Instruction : Sois le conseiller de vie, le psy et l'assistant tod° de l'utilisateur. Apporte des conseils motivants, clairs et structurés. S'il te demande d'enregistrer une information importante à propos de lui, signale-le à la fin de ton texte avec un bloc spécial JSON <Memory>{ "key": "...", "value": "..." }</Memory> ou réponds simplement de façon humaine. Tu dois parler en FRANÇAIS de manière élégante et encourageante. Style Memphis/Pop, plein d'énergie positive.`;

    const response = await generateContentWithFallback(ai, {
      contents: [
        { role: "user", parts: [{ text: `${contextStr}\n\nHistorique de discussion:\n${messages.map((m: any) => `${m.role === "user" ? "Utilisateur" : "IA"}: ${m.content}`).join("\n")}\n\nUtilisateur: ${lastMessage}` }] }
      ],
      config: {
        systemInstruction: "Tu es l'assistant de vie et coach psychiatrique/somatique tod°. Tu as accès aux données de productivité et de santé de l'utilisateur. Aide-le à avancer avec bienveillance, clarté et joie.",
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Erreur dans chat:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Ajout Intelligent Universel (Analyseur NLP d'éléments en vrac)
app.post("/api/gemini/smart-add", async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Le texte d'ajout est requis." });
  }

  // --- FALLBACK LOCAL : Extraction heuristique intelligente si pas de clé API Gemini ---
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  if (!hasApiKey) {
    console.log("No GEMINI_API_KEY found, executing local heuristic fallback parse...");
    
    const tasks: any[] = [];
    const habits: any[] = [];
    const preparations: any[] = [];

    const lines = text.split(/[.\n;]+/);
    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Détecter si c'est une habitude
      const isHabit = line.toLowerCase().includes("habitude") || 
                      line.toLowerCase().includes("chaque jour") || 
                      line.toLowerCase().includes("tous les jours") || 
                      line.toLowerCase().includes("tous les matins");

      // Détecter si c'est une routine de préparation
      const isPrep = line.toLowerCase().includes("préparation") || 
                     line.toLowerCase().includes("rituel") || 
                     line.toLowerCase().includes("routine avant") || 
                     line.toLowerCase().includes("routine après");

      if (isHabit) {
        let title = line.replace(/la phrase|l'habitude|habitude|chaque jour|tous les jours/gi, "").trim();
        title = title.charAt(0).toUpperCase() + title.slice(1);
        habits.push({
          title: title || "Nouvelle habitude quotidienne",
          description: "Générée automatiquement par l'analyse locale",
          type: "binary",
          targetValue: 1,
          unit: "fois",
          rewardValue: 15
        });
      } else if (isPrep) {
        let title = line.replace(/la routine|la préparation|un rituel|routine avant|routine après/gi, "").trim();
        title = title.charAt(0).toUpperCase() + title.slice(1);
        preparations.push({
          title: title || "Rituel de préparation",
          description: "Routine générée localement",
          type: line.toLowerCase().includes("après") ? "post" : "pre",
          durationMinutes: 15
        });
      } else {
        // C'est une tâche
        // Extraction heuristique des critères "imp 8", "urg 5", "durée 45", etc.
        let importance = 5;
        let urgency = 5;
        let easiness = 6;
        let mentalLoad = 4;
        let durationMinutes = 30;

        const impMatch = line.match(/(?:importance|imp|priorité|prio)\s*[:=]?\s*(\d+)/i);
        if (impMatch) importance = Math.min(10, Math.max(0, parseInt(impMatch[1])));

        const urgMatch = line.match(/(?:urgence|urg)\s*[:=]?\s*(\d+)/i);
        if (urgMatch) urgency = Math.min(10, Math.max(0, parseInt(urgMatch[1])));

        const facMatch = line.match(/(?:facilité|facile|easiness|fac)\s*[:=]?\s*(\d+)/i);
        if (facMatch) easiness = Math.min(10, Math.max(0, parseInt(facMatch[1])));

        const loadMatch = line.match(/(?:charge|load|mentale|charge mentale)\s*[:=]?\s*(\d+)/i);
        if (loadMatch) mentalLoad = Math.min(10, Math.max(0, parseInt(loadMatch[1])));

        const durMatch = line.match(/(?:durée|duree|temps|minutes|min)\s*[:=]?\s*(\d+)/i);
        if (durMatch) durationMinutes = parseInt(durMatch[1]);

        let title = line.replace(/(?:importance|imp|priorité|prio|urgence|urg|durée|duree|temps|minutes|min|facilité|facile|easiness|fac|charge|load|mentale)\s*[:=]?\s*\d+/gi, "").trim();
        title = title.replace(/\s+/g, " ").trim();
        title = title.charAt(0).toUpperCase() + title.slice(1);

        tasks.push({
          title: title || "Faire une tâche",
          description: "Tâche ajoutée en mode hors-connexion",
          importance,
          urgency,
          easiness,
          mentalLoad,
          isStarred: importance >= 8,
          durationMinutes,
          tags: []
        });
      }
    }

    return res.json({ tasks, habits, preparations, isLocalFallback: true });
  }

  // --- PROCESSUS VIA GEMINI ---
  try {
    const ai = getGemini();

    const prompt = `L'utilisateur souhaite ajouter rapidement des éléments (tâches, habitudes quotidiennes ou routines de préparation) de manière informelle.
Analyse sa phrase et convertis-la en une liste structurée d'éléments individuels à insérer.

Texte saisi :
"${text}"

Consignes strictes :
1. Extrais les Tâches ("tasks"), Habitudes ("habits"), ou Routines de Préparation ("preparations") décrites d'un seul coup.
2. Pour les tâches : évalue l'importance/urgence/facilité/charge mentale sur 10 à partir des termes employés (par exemple des mots comme "urgent", "vital", "rapide", "gonflant"). Estime une durée raisonnable en minutes. S'il mentionne un jour précis (ex: "mardi", "demain", "3 juin"), déduis-en la date ISO correspondante (sachant que nous sommes aujourd'hui le ${new Date().toISOString().split("T")[0]}).
3. Pour les habitudes : s'il mentionne "tous les jours", "chaque jour", convertis en habitude avec la valeur cible appropriée.
4. Pour les préparations : s'il veut un rituel à associer à ses sessions d'études, de yoga ou de sommeil (ex: "méditer 10 min avant de dormir"), extrais-le.
5. Rédige l'intégralité des titres et descriptions en FRANÇAIS de façon claire.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "Tu es l'extracteur et parseur linguistique ultra-précis de l'application tod°. Tu transcris textuellement des requêtes informelles d'utilisateurs en objets techniques JSON stricts.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["tasks", "habits", "preparations"],
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "importance", "urgency", "easiness", "mentalLoad", "isStarred", "durationMinutes"],
                properties: {
                  title: { type: Type.STRING, description: "Titre de la tâche extrait" },
                  description: { type: Type.STRING, description: "Bref résumé de la provenance de l'extraction" },
                  importance: { type: Type.INTEGER, description: "Importance estimée ou mentionnée (0-10)" },
                  urgency: { type: Type.INTEGER, description: "Urgence estimée ou mentionnée (0-10)" },
                  easiness: { type: Type.INTEGER, description: "Facilité estimée ou mentionnée (0-10)" },
                  mentalLoad: { type: Type.INTEGER, description: "Charge mentale estimée (0-10)" },
                  isStarred: { type: Type.BOOLEAN, description: "Vrai si très important / urgent d'un coup" },
                  durationMinutes: { type: Type.INTEGER, description: "Durée estimée en minutes, défaut 30" },
                  dueDate: { type: Type.STRING, description: "Date d'échéance format YYYY-MM-DD si relevée" },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            habits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "type", "targetValue", "unit", "rewardValue"],
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING, description: "binary | quantitative | chrono | counter" },
                  targetValue: { type: Type.INTEGER, description: "cible, par exemple 1" },
                  unit: { type: Type.STRING, description: "fois, verres, minutes" },
                  rewardValue: { type: Type.INTEGER, description: "gains, par exemple 10" }
                }
              }
            },
            preparations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "type", "durationMinutes"],
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING, description: "pre | post" },
                  durationMinutes: { type: Type.INTEGER }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    res.json(JSON.parse(resultText || '{"tasks":[],"habits":[],"preparations":[]}'));
  } catch (error: any) {
    console.error("Erreur dans smart-add:", error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Analyse IA des Tendances et de l'Équilibre Temps & Jeux
app.post("/api/analytics/ai-insights", async (req, res) => {
  const { summary, recentWeeks, recentMonths, gamingStats } = req.body;

  // Générateur de diagnostic algorithmique autonome et immédiat
  const generateAlgorithmicFallback = () => {
    const avgWork = summary?.avgWorkHoursPerDay || 0;
    const remHours = gamingStats?.remainingHours || 0;
    const isDeficit = remHours < 0;

    const diagnosticRythme = avgWork >= 5
      ? `Rythme de travail très intense (${avgWork}h/j en moyenne sur ${summary?.uniqueDaysCount || 0} jours actifs). La consistance est excellente, mais veillez à planifier des journées de décompression.`
      : avgWork >= 2.5
      ? `Rythme de travail régulier et équilibré (${avgWork}h/j sur ${summary?.uniqueDaysCount || 0} jours actifs), avec un bon équilibre de charge.`
      : `Rythme de travail modéré (${avgWork}h/j). Bon potentiel d'accélération sur les jours pivots.`;

    const diagnosticLoisirsJeux = isDeficit
      ? `Dépassement du quota de jeux vidéo (${Math.abs(remHours)}h au-delà de la cible d'1h/jour). Réduire temporairement les sessions pour rééquilibrer le solde.`
      : `Respect du quota d'1h/j de jeux vidéo avec une réserve positive de +${remHours}h disponible.`;

    const recommandations = [
      avgWork > 4
        ? "Structurer vos sessions en blocs de 60 à 90 minutes pour éviter la fatigue cognitive."
        : "Augmenter progressivement la durée des sessions prioritaires sur vos jours les plus productifs.",
      isDeficit
        ? "Fixer une limite stricte de 45 minutes par jour sur les jeux vidéo jusqu'au retour à l'équilibre."
        : "Conserver votre rythme actuel qui maintient une balance de temps positive."
    ];

    return {
      source: "algorithmic",
      diagnosticRythme,
      diagnosticLoisirsJeux,
      recommandations
    };
  };

  try {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    if (!hasApiKey) {
      return res.json(generateAlgorithmicFallback());
    }

    const ai = getGemini();

    const prompt = `Voici les métriques de travail, de loisirs et de jeux vidéo de l'utilisateur :
- Temps total travail : ${summary?.totalWorkHours || 0}h (${summary?.totalWorkMinutes || 0} min)
- Temps total loisirs : ${summary?.totalLeisureHours || 0}h
- Balance nette : ${summary?.netHours || 0}h
- Moyenne journalière travail : ${summary?.avgWorkHoursPerDay || 0}h/jour sur ${summary?.uniqueDaysCount || 0} jours actifs
- Nombre total de sessions : ${summary?.totalLogsCount || 0}

Tendances récentes (Semaines / Mois) :
${JSON.stringify(recentWeeks || [])}
${JSON.stringify(recentMonths || [])}

Quota & Statistiques Jeux Vidéo (Règle : 1 heure autorisée par jour) :
- Heures autorisées cumulées : ${gamingStats?.authorizedHours || 0}h
- Heures réelles jouées : ${gamingStats?.totalPlayedHours || 0}h
- Solde restant : ${gamingStats?.remainingHours || 0}h
- Moyenne réelle par jour : ${gamingStats?.dailyAvgHours || 0}h/jour

Consignes strictes :
- Sois ultra-minimaliste, sobre, sans flatterie ni jargon.
- Rédige en français direct et condensé :
  * diagnosticRythme : 1 à 2 phrases max sur le rythme et la régularité.
  * diagnosticLoisirsJeux : 1 à 2 phrases max sur l'équilibre et le respect du quota de jeux (1h/j).
  * recommandations : 2 recommandations concrètes et immédiatement applicables.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "Tu es l'analyste de productivité de tod°. Ton style est ultra-minimaliste, sobre, factuel et percutant. Pas de mots superflus.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["diagnosticRythme", "diagnosticLoisirsJeux", "recommandations"],
          properties: {
            diagnosticRythme: { type: Type.STRING, description: "Bilan condensé du rythme de travail" },
            diagnosticLoisirsJeux: { type: Type.STRING, description: "Bilan condensé de l'équilibre loisirs et quota jeux" },
            recommandations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 conseils concrets et actionnables"
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ source: "gemini", ...parsed });
  } catch (error: any) {
    console.warn("Échec appel Gemini API dans /api/analytics/ai-insights, bascule sur le moteur algorithmique :", error.message);
    // Bascule automatique et transparente sur l'analyse algorithmique enrichie
    res.json(generateAlgorithmicFallback());
  }
});

// 8. Conseiller IA Stratégique Global (Audit Holistique & Recommandations d'App)
app.post("/api/gemini/advisor-audit", async (req, res) => {
  const { summaryStats, overdueTasks, topPriorityTasks, neglectedHabits, healthyHabits, recentSleepWake, settings } = req.body;

  const generateAlgorithmicAudit = () => {
    const overdueCount = summaryStats?.overdueTasksCount || (overdueTasks?.length || 0);
    const neglectedCount = summaryStats?.neglectedHabitsCount || (neglectedHabits?.length || 0);
    const activeTasksCount = summaryStats?.activeTasks || 0;
    const completedTasksCount = summaryStats?.completedTasks || 0;
    const gamingDeficit = summaryStats?.gamingDeficitHours || 0;
    const sleepDebt = summaryStats?.avgSleepDebtMinutes || 0;
    const currentSpacing = settings?.layoutSpacing || summaryStats?.layoutSpacing || "cozy";

    const helpAndAdvice = [
      {
        id: "adv-1",
        title: "Traitement séquentiel",
        detail: activeTasksCount > 5 
          ? `Concentrez-vous sur 1 tâche à la fois parmi les ${activeTasksCount} actives.` 
          : "Rythme de tâches équilibré. Traitez la prochaine tâche par ordre d'importance.",
        category: "priorite"
      },
      {
        id: "adv-2",
        title: "Régularité des habitudes",
        detail: neglectedCount > 0 
          ? `${neglectedCount} habitude(s) nécessitent une complétion pour éviter la rupture de chaîne.` 
          : "Vos séries d'habitudes sont bien maintenues. Continuez la régularité.",
        category: "rythme"
      }
    ];

    if (sleepDebt > 30) {
      helpAndAdvice.push({
        id: "adv-3",
        title: "Récupération circadienne",
        detail: `Dette de sommeil moyenne de ${Math.round(sleepDebt)} min. Prévoir 30 min de coucher anticipé.`,
        category: "bien_etre"
      });
    }

    const warnings: any[] = [];
    if (overdueCount > 0) {
      warnings.push({
        id: "warn-1",
        level: "high",
        title: `${overdueCount} tâche(s) en retard`,
        detail: "Des échéances sont dépassées et bloquent la dynamique générale.",
        actionPrompt: "Reprogrammer ou solder ces tâches"
      });
    }

    if (neglectedCount > 0) {
      warnings.push({
        id: "warn-2",
        level: "medium",
        title: `${neglectedCount} habitude(s) délaissée(s)`,
        detail: "Le seuil d'alerte d'inactivité est franchi sur certaines routines.",
        actionPrompt: "Effectuer une session rapide aujourd'hui"
      });
    }

    if (gamingDeficit > 0) {
      warnings.push({
        id: "warn-3",
        level: "medium",
        title: `Dépassement quota jeux (${gamingDeficit}h)`,
        detail: "Le temps de loisir surpasse le volume autorisé d'1h/jour.",
        actionPrompt: "Réduire les prochaines sessions"
      });
    }

    const appModifications: any[] = [];

    // Proposition 1 : Espacement de l'interface
    if (activeTasksCount >= 8 && currentSpacing !== "compact") {
      appModifications.push({
        id: "mod-spacing-compact",
        title: "Passer l'affichage en mode compact",
        reason: `${activeTasksCount} tâches actives détectées. Le mode compact optimise la visibilité sans défilement excessif.`,
        actionType: "set_layout_spacing",
        payload: { layoutSpacing: "compact" }
      });
    } else if (activeTasksCount < 4 && currentSpacing === "compact") {
      appModifications.push({
        id: "mod-spacing-cozy",
        title: "Passer l'affichage en mode équilibré (cozy)",
        reason: "Volume de tâches modéré. Le mode équilibré aère l'espace de lecture.",
        actionType: "set_layout_spacing",
        payload: { layoutSpacing: "cozy" }
      });
    }

    // Proposition 2 : Nettoyage / Archivage si beaucoup de tâches complétées
    if (completedTasksCount >= 5) {
      appModifications.push({
        id: "mod-archive-tasks",
        title: "Archiver les tâches terminées",
        reason: `${completedTasksCount} tâches terminées encombrent l'historique actif. L'archivage clarifie le tableau de bord.`,
        actionType: "archive_completed_tasks",
        payload: {}
      });
    }

    // Proposition 3 : Habitude essentielle si beaucoup de travail
    if ((summaryStats?.totalWorkHours || 0) > 10 && !(healthyHabits || []).some((h: any) => h.title?.toLowerCase().includes("pause"))) {
      appModifications.push({
        id: "mod-habit-pause",
        title: "Créer l'habitude 'Pause Déconnexion 10m'",
        reason: "Volume de travail élevé. Une pause quotidienne de 10 min prévient la surcharge cognitive.",
        actionType: "create_habit",
        payload: {
          habitTitle: "Pause Déconnexion 10m",
          habitType: "chrono",
          habitTarget: 10,
          habitUnit: "minutes",
          rewardValue: 15
        }
      });
    }

    const summary = overdueCount > 0 
      ? `${activeTasksCount} tâches actives, ${overdueCount} en retard critique. Traitement prioritaire requis.`
      : `${activeTasksCount} tâches actives avec bon équilibre général. Maintenir la régularité.`;

    return {
      timestamp: new Date().toISOString(),
      modelUsed: "Moteur algorithmique intégré",
      source: "algorithmic",
      summary,
      helpAndAdvice,
      warnings,
      appModifications
    };
  };

  try {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    if (!hasApiKey) {
      return res.json(generateAlgorithmicAudit());
    }

    const ai = getGemini();

    const prompt = `Voici l'audit exhaustif des données réelles de l'utilisateur dans son application tod° :

1. STATISTIQUES GLOBALES :
${JSON.stringify(summaryStats || {}, null, 2)}

2. TÂCHES EN RETARD CRITIQUES :
${JSON.stringify(overdueTasks || [], null, 2)}

3. TÂCHES PRIORITAIRES ACTUELLES :
${JSON.stringify(topPriorityTasks || [], null, 2)}

4. HABITUDES DÉLAISSÉES (EN DANGER) :
${JSON.stringify(neglectedHabits || [], null, 2)}

5. HABITUDES ACTIVES EN SÉRIE :
${JSON.stringify(healthyHabits || [], null, 2)}

6. SOMMEIL ET RÉVEILS RÉCENTS :
${JSON.stringify(recentSleepWake || [], null, 2)}

7. PARAMÈTRES ACTUELS DE L'APPLICATION :
${JSON.stringify(settings || {}, null, 2)}

CONSIGNES STRICTES :
- Style : Ultra-minimaliste, factuel, sobre, direct, condensé au maximum. Pas de verbiage, pas d'adjectifs décoratifs, pas de flatterie. Utilise uniquement des termes simples, sobres et condensés.
- Langue : Rédige exclusivement en français.
- Tu dois fournir :
  1. "summary" : Synthèse en 1 à 2 phrases courtes max de la situation réelle.
  2. "helpAndAdvice" : 2 à 4 conseils d'action ciblés et concrets (titre très court sous 6 mots, détail en 1 phrase directe).
  3. "warnings" : 1 à 3 mises en garde précises basées sur les anomalies constatées (retard de tâches, rupture d'habitudes, dette de sommeil, dérive jeux/loisirs). Si aucune anomalie majeure, avertir sobrement sur la vigilance de charge.
  4. "appModifications" : 2 à 4 propositions concrètes et pertinentes d'ajustements directs de l'application pour qu'elle s'adapte mieux à ses besoins immédiats.
     Types possibles pour "actionType" :
     - "set_layout_spacing" (payload: { layoutSpacing: "compact" | "cozy" | "spacious" })
     - "set_theme_style" (payload: { themeStyle: "memphis" | "cosmic" | "brutalist" })
     - "set_target_wake_time" (payload: { targetWakeTime: "HH:MM" })
     - "set_reward_ratio" (payload: { rewardCalculationRatio: number })
     - "create_habit" (payload: { habitTitle: string, habitType: "binary"|"quantitative"|"chrono", habitTarget: number, habitUnit: string, rewardValue: number })
     - "create_task" (payload: { taskTitle: string, taskImportance: number, taskUrgency: number, taskDurationMinutes: number })
     - "archive_completed_tasks" (payload: {})
     - "adjust_habit_threshold" (payload: { habitId: string, threshold: number })`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "Tu es le conseiller stratégique et analyste IA de tod°. Tu délivres des diagnostics, conseils, mises en garde et modifications directes de l'application. Ton style est ultra-minimaliste, factuel, percutant et condensé au maximum.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["summary", "helpAndAdvice", "warnings", "appModifications"],
          properties: {
            summary: { type: Type.STRING, description: "Bilan global condensé en 1-2 phrases" },
            helpAndAdvice: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "title", "detail", "category"],
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING, description: "Titre court sous 6 mots" },
                  detail: { type: Type.STRING, description: "Conseil en 1 phrase directe" },
                  category: { type: Type.STRING, description: "priorite | rythme | organisation | bien_etre" }
                }
              }
            },
            warnings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "level", "title", "detail", "actionPrompt"],
                properties: {
                  id: { type: Type.STRING },
                  level: { type: Type.STRING, description: "high | medium | low" },
                  title: { type: Type.STRING, description: "Titre de la mise en garde" },
                  detail: { type: Type.STRING, description: "Explication courte en 1 phrase" },
                  actionPrompt: { type: Type.STRING, description: "Action recommandée" }
                }
              }
            },
            appModifications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "title", "reason", "actionType", "payload"],
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING, description: "Intitulé sobre de la modification" },
                  reason: { type: Type.STRING, description: "Justification factuelle en 1 phrase" },
                  actionType: { type: Type.STRING, description: "set_layout_spacing | set_theme_style | set_target_wake_time | set_reward_ratio | create_habit | create_task | archive_completed_tasks | adjust_habit_threshold" },
                  payload: {
                    type: Type.OBJECT,
                    description: "Paramètres de la modification",
                    properties: {
                      layoutSpacing: { type: Type.STRING },
                      themeStyle: { type: Type.STRING },
                      targetWakeTime: { type: Type.STRING },
                      rewardCalculationRatio: { type: Type.NUMBER },
                      habitTitle: { type: Type.STRING },
                      habitType: { type: Type.STRING },
                      habitTarget: { type: Type.NUMBER },
                      habitUnit: { type: Type.STRING },
                      rewardValue: { type: Type.NUMBER },
                      taskTitle: { type: Type.STRING },
                      taskImportance: { type: Type.INTEGER },
                      taskUrgency: { type: Type.INTEGER },
                      taskDurationMinutes: { type: Type.INTEGER },
                      habitId: { type: Type.STRING },
                      threshold: { type: Type.INTEGER }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      timestamp: new Date().toISOString(),
      modelUsed: "gemini-3.8-flash",
      source: "gemini",
      ...parsed
    });
  } catch (err: any) {
    console.warn("Échec appel Gemini API dans /api/gemini/advisor-audit, bascule sur le moteur algorithmique :", err.message);
    res.json(generateAlgorithmicAudit());
  }
});

// 9. Dialogue Interactif avec le Conseiller IA (Grounded sur toutes les données)
app.post("/api/gemini/advisor-chat", async (req, res) => {
  try {
    const { message, fullContext } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Le message est requis." });
    }

    const hasApiKey = !!process.env.GEMINI_API_KEY;
    if (!hasApiKey) {
      return res.json({
        reply: "Conseil instantané : Concentrez-vous sur votre tâche prioritaire du jour et maintenez la complétion de vos habitudes quotidiennes avant toute nouvelle planification.",
        source: "algorithmic"
      });
    }

    const ai = getGemini();

    const prompt = `Voici l'ensemble des données de l'application tod° de l'utilisateur :
${JSON.stringify(fullContext || {}, null, 2)}

Question ou demande de l'utilisateur :
"${message}"

Consignes strictes :
- Réponds de manière ultra-minimaliste, sobre, factuelle et condensée.
- Pas de jargon, pas d'adjectifs décoratifs ni de flatterie. Termes simples et directs.
- Base ta réponse exclusivement sur ses données réelles (tâches, priorités, habitudes, sommeil, temps).
- Rédige en français.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "Tu es le conseiller stratégique personnel de tod°. Tu réponds de manière ultra-minimaliste, directe et pragmatique, sans aucun mot superflu."
      }
    });

    res.json({
      reply: response.text || "Aucune réponse générée.",
      source: "gemini"
    });
  } catch (err: any) {
    console.warn("Échec appel Gemini dans /api/gemini/advisor-chat :", err.message);
    res.json({
      reply: "Conseil de repli : Vos priorités immédiates restent le traitement des tâches urgentes et la préservation de vos habitudes clés.",
      source: "algorithmic"
    });
  }
});

// Service de l'application avec middleware Vite en dév, et statique en production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Routage de repli SPA vers index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}

startServer();
