# 📝 Feuille de Route / Roadmap de l'application ᵗ°ᵈ°

Bienvenue dans l'architecture principale de **ᵗ°ᵈ°**, une application de productivité ultra-polyvalente combinant gamification, rituels somatiques, pharmacophylaxie, introspection NLP et prédiction IA.

Cette roadmap est divisée en **6 étapes de développement**. Toutes les créations seront faites de manière modulaire, en français, sans aucune pop-up (confirmations inline uniquement), avec un style Memphis moderne, et en préservant le fichier `App.tsx` au format le plus minimaliste possible.

---

## 🗺️ PROGRES DE L'APPLICATION (Mise à jour régulière)

- [x] **Étape 1 : Fondations des données et types unifiés (`types.ts`)**
  *Définition complète de l'arbre d'état (Tâches, Tâches Récurrentes avec escalade, Routines de Préparation, Habitudes, Tracker somatique, Espace Pharmacie, Suspicion Clinique IA, Boutique de Récompenses, Profil, Intelligence Artificielle).*
- [x] **Étape 2 : Architecture Serveur Express & Proxy d'IA (`server.ts`, `.env.example`, routeurs API)**
  *Bootstrapper le serveur Express compatible avec Vite, et configurer la sécurité de l'API Gemini pour toutes les requêtes d'analyse du journal d'introspection, du chat, et de suspicion clinique.*
- [x] **Étape 3 : Layout Global "Memphis" & Navigation Inline (9 Vues)**
  *Mise en place de la barre latérale ou du panneau supérieur de navigation, squelette léger d'instrumentation dans `App.tsx`, et création des composants de base pour les 9 vues (Aujourd'hui, Planification, Classement, Habitudes, Calendrier, Tracker, Santé & Pharmacie, Espace IA, Paramètres).*
  *👉 Système de planification sur-mesure interconnecté (moteur direct lié à la base globale, timeline 11h-19h, traceur néon en direct, stockage backlog interactif avec drag and drop à 5 minutes de précision, extensibilité/étirement de la durée des tâches par glisser du haut ou du bas, statistiques de calibration estimé vs réel basés sur l'historique, chronomètre actif flottant persistant avec boutons de Pause persistante, Stop de repli et Validation d'archivage).*
- [x] **Étape 4 : Gestion des Tâches, Récurrences et Moteur de Gamification**
  *Implémentation du système de Tâches prioritaires basées sur le score cumulatif de 4 facteurs (importance, urgence, charge mentale, facilité). Intégration du Chronomètre interactif de gain de pièces (Coins) et de la Boutique de Récompenses.*
- [x] **Étape 5 : Module de Santé Somatique, Espace Pharmacien & Introspection Psy**
  *Journalisation des activités (sommeil, sport, etc.), gestionnaire de stocks de médicaments en temps réel avec alerte stock bas, et graphique d'évolution clinique SVG hautement fidèle et réactif des pathologies suspectées cliniquement.*
- [x] **Étape 6 : Écosystème IA Gemini, Suggestions Proactives et Synchronisation**
  *Implémentation de l'extraction par NLP du journal d'introspection vers des tâches/habitudes. Génération de Suggestions Proactives, création du Chat IA, gestion des bilans cognitifs de l'Espace Psy (PsyCards). Ajustement cosmétique final style Memphis moderne et validation de compilation.*
- [x] **Étape Hors-Série : Le Module Centralisé et Unifié "Nouvel Élément"**
  *Création de la brique de saisie suprême dynamique permettant de concevoir des Tâches unitaires (avec priorisation 4-scores, raccordement de tâches parentes, plage horaire, et deadline flexible/hard), des Habitudes saines (binaire, quantité, chrono, intervalle, seuils d'alerte, seuils d'abandon temporaires, et jokers) ou des Modèles de Répétition Planifiée (Récurrents) avec suggestion sémantique automatique d'émoji NLP en temps réel et commutateurs de gamification (forfaitaire ou auto-calculé).*
- [x] **Étape Hors-Série Bis : Affinage Ergonomique et Multiplicateur de Gains**
  *Relocalisation du bouton "Nouvel Élément" dans le header global, restauration des noms d'éléments définis : "Tâche", "Habitude" et "Récurrence", et introduction du curseur multiplicateur de récompenses de gamification globale dans le profil et les vues de configuration.*
- [x] **Étape Hors-Série Ter : Importation Sécurisée Sans Données Cliniques**
  *Intégration d'un convertisseur de sauvegarde et d'un filtre de purification automatique lors de l'import d'une sauvegarde pour exclure les tables `healthSuspicions` (diagnostics, suspicions, scores de confiance) et `psyCards` (bilans psycho-cognitifs).*
- [x] **Étape Hors-Série Quater : Fusion d'Éléments Historiques Avancés de `todoancien`**
  *Réintégration de l'Inbox GTD (InboxView / InboxTaskCard), des colonnes Kanban Projects (ProjectsView) et de l'IconPicker interactif (IconContext / Icons) entièrement couplés à notre base de données Cloud Firestore.*
- [x] **Étape Hors-Série Quinquies : Connexion G-Suite Automatique sur le Dernier Compte Connecté**
  *Sauvegarde transparente et sécurisée du jeton d'accès G-Suite avec calcul d'expiration dans Firestore (sans LocalStorage). Intégration de l'option `login_hint` pour contourner le sélecteur de compte Google et reconnecter instantanément le dernier utilisateur.*
- [x] **Étape Hors-Série Septtrenties Quater-B : Accordéon Clinique et Affichage Minimaliste des Actions pour Épinglés et Jour de**
  *Implémentation d'une option `hideActionsByDefault` sur les composants de rendu d'Habitudes, de Tâches Récurrentes et de Tâches Standard. Masquage complet du bandeau d'actions et des détails de priorités sur l'affichage initial des sections "Jour de" et "Épinglés". Révélation instantanée du panneau d'actions et de statistiques au clic sur le titre ou l'icône de l'élément via un comportement d'accordéon fluide et ultra-minimaliste.*

- [x] **Étape Hors-Série Sexies : Les Fonctionnalités d'Affinités Esthétiques Modernes et l'IA Smart-Add**
  *3 modules d'excellence supplémentaires :*
  *1. Boutique Complète & Toasts de Récompense (RewardsView) : Un shop Memphis magnifique avec des articles physiques de détente et des loisirs de divertissement à la minute reliés à un chronomètre somatique. Intercepteur centralisé de gain de coins pour des toasts de félicitation animés.*
  *2. Ajout Intelligent Universel (SmartAddView) : Barre d'introspection NLP au sommet du dashboard qui utilise Gemini (ou un moteur heuristique de secours ultra-robuste) pour parser n'importe quel texte ou transcription vocale en Tâches structurées, Habitudes ou Rituels de Préparation.*
  *3. Choix Esthétiques & Thèmes d'Affichage Poussés (SettingsView) : Intégration de thèmes Memphis original, Cosmic Spatial sombre ou Brutaliste noir et blanc, avec régulateurs d'épaisseur de bordure, opacités d'ombres et d'espacements généraux, sans popup avec confirmation inline.*

- [x] **Étape Hors-Série Septies : Portail de Connexion G-Suite Obligatoire**
  *Sécurisation à 100% sans stockage local : neutralisation du mode hors ligne au profit d'une barrière d'authentification forcée en plein écran au démarrage. Intégration de l'infrastructure d'autorisation Google OAuth (set_up_oauth) pour Google Calendar et Google Tasks, et affichage d'alertes de diagnostic explicites (domaine non autorisé, bloqueur de popup) en cas d'incident d'autorisation.*
- [x] **Étape Hors-Série Octies : Stabilisation de la Persistance et Résolution Globale de Perte de Données**
  *Migration complète vers l'API moderne `persistentLocalCache` de Firestore v10+, activation du mode HTTPS long-polling (`experimentalForceLongPolling`) contre les restrictions de ports et de WebSockets de l'iFrame sandbox, et assouplissement de la règle de validation d'UID dans Firestore pour garantir des sauvegardes optimales.*
- [x] **Étape Hors-Série Nonies : Récupération Cache-First ultra-rapide du Jeton G-Suite**
  *Résolution définitive du timeout réseau bloquant le jeton G-Suite à l'initialisation. Utilisation de l'API `getDocFromCache` pour un accès instantané (<10ms) sur page reload, et exécution d'une tâche de fond asynchrone et silencieuse de rafraîchissement du jeton, libérant immédiatement l'affichage de l'application.*
- [x] **Étape Hors-Série Decies : Synchronisation Bidirectionnelle en Temps Réel (`onSnapshot`) Sécurisée par Signature de Session & Zéro LocalStorage**
  *Abonnement réactif `onSnapshot` à Firestore qui synchronise instantanément les modifications effectuées entre plusieurs appareils en simultané. Suppression totale des dépendances et persistances locales sur le disque `localStorage` pour les données applicatives, maintenant 100% de la vérité des données sur les serveurs sécurisés Cloud Firestore pour éliminer toute perte lors des rechargements. Résolution définitive des conflits locaux et écrasements d'échos réseau via un système de filtrage par Signature de Session (`deviceId` et `lastWriteId`).*
- [x] **Étape Hors-Série Undecies : Purge de Sécurité Clinique des Propriétés `undefined` et Verrou Ref Synchrone**
  *Résolution définitive et absolue du blocage d'enregistrement des tâches créées, validées ou modifiées. Suppression asynchrone instantanée de toutes les clés indéterminées (`undefined`, comme `completedAt` d'une tâche réactivée) par nettoyage structurel JSON avant transmission à Firestore, neutralisant les rejets silencieux du SDK Cloud. Sécurisation de l'évaluation du verrou de chargement via `isCloudDataLoadedRef.current` pour garantir l'envoi immédiat dès la fin de l'initialisation.*
- [x] **Étape Hors-Série Duodecies : Contournement de Sécurité Sandbox iFrame & Feedback Synchrone Visuel**
  *Résolution définitive et universelle du blocage d'écriture lié aux restrictions d'IndexedDB imposées par les bacs à sable d'iFrame de prévisualisation (SecurityError / Access Denied). Solution de repli clinique instantanée et automatique sur le cache en mémoire (`memoryLocalCache()`) pour assurer l'accès à Firestore sans aucun crash d'initialisation. Activation d'un indicateur de sauvegarde immédiat tactique en un filigrane jaune Memphis éclatant ("Enregistrement...") couplé aux statuts d'aboutissement pour une immédiateté absolue visuelle du feedback.*
- [x] **Étape Hors-Série Terdecies : Débruitage de Sauvegarde Clinique & Éradication du WebSocket HMR parasite**
  *Résolution du blocage infini dans l'état « Enregistrement... » par intégration d'un mécanisme de débruitage (debounce de 1000ms) et d'une sécurité d'optimisme visuel clinique (900ms) visant à absorber les écritures successives et s'adapter aux réseaux asymétriques en iFrame. Éradication complète de l'erreur « vite: failed to connect to websocket » en forçant l'extinction du HMR dans config.vite.ts pour s'adapter rigoureusement au design des micro-containers Cloud Run.*
- [x] **Étape Hors-Série Quaterdecies : Purification Totale Locale & Éradication G-Suite**
  *Retrait intégral de toutes les interfaces et mécanismes de synchronisation Google G-Suite, du panneau de calendrier Cloud et des modules d'API de Workspace. Suppression définitive de tous les fichiers de configuration de persistance externe restants (firebase-blueprint.json, firestore.rules, etc.) pour garantir une isolation hermétique locale sans aucune fuite ni connexion cloud. L'application est désormais 100% confidentielle, réactive et conservée localement dans le navigateur de l'utilisateur.*
- [x] **Étape Hors-Série Quindecies : Éradication Totale du Serveur de Développement Vite au Runtime & Serveur Statique Indépendant**
  *Éradication définitive de l'erreur « vite: failed to connect to websocket » en modifiant l'architecture du serveur Express. Le serveur backend n'exécute plus et n'intègre plus de middleware dynamique Vite en mode développement. L'application est pré-construite en statique (Vite build) avant le lancement du serveur, puis servie par Express comme en production. Suppression totale de l'import de Vite dans server.ts pour un runtime sain, robuste et vierge de tout connecteur websocket ou HMR parasite.*
- [x] **Étape Hors-Série Sdecies : Minimalisme et Épurement Visuel du Header**
  *Retrait définitif des slogans, des étiquettes d'écosystème de matrice complexes et redondantes, et nettoyage complet de l'en-tête de l'application à côté du logo "ᵗ°ᵈ°". Le rendu visuel de la barre supérieure est désormais aéré, épuré, centré exclusivement sur la simplicité graphique.*
- [x] **Étape Hors-Série Septdecies : Architecture Multiécran Firebase Firestore & Auth**
  *Migration de l'intégralité du système de sauvegarde vers Firebase. Intégration d'un portail d'authentification rétro-chic Memphis Google Auth pour sécuriser les espaces personnels. Mise en œuvre d'une synchronisation bidirectionnelle instantanée (onSnapshot) filtrant les boucles d'écho de frappe grâce à des signatures de session par terminal (deviceId / writeId). Transfert automatique d'historique de LocalStorage hérité vers Cloud Firestore au premier démarrage pour assurer zéro perte d'avancement.*
- [x] **Étape Hors-Série Octodecies : Épuration visuelle et sémantique de l'interface & Retrait du Kanban**
  *Retrait de l'onglet Projet Kanban pour alléger la navigation générale et recentrer l'expérience utilisateur. Nettoyage et simplification exhaustive des phrasés de l'application : nettoyage des slogans de gamification lourds et intrusifs de la vue Aujourd'hui, suppression de la section d'explications de David Allen (GTD) et purification des descriptions par défaut pour un design minimaliste, propre et rigoureux.*
- [x] **Étape Hors-Série Novemdecies : Réintégration et Harmonisation de Google Calendar Interactif**
  *Ajout d'un tout nouvel onglet connecté avec Google Calendar. Mise en place d'une interface d'agenda graphique interactive (Vues Mois en grille, Vues Semaine chronologique et Vues Liste de Sprints), de création d'événements, d'édition en ligne bidirectionnelle, d'annulation en ligne immédiate et d'un outil de planification croisée poussant les tâches locales Bento directement dans l'agenda de l'utilisateur.*
- [x] **Étape Hors-Série Vicies : Refonte Clinique de l'Onglet Aujourd'hui (Dashboard Memphis Symétrique)**
  *Mise en conformité visuelle totale avec les maquettes de référence : intégration des cartes épinglées horizontales dynamiques, des curseurs d'habitudes quantitatives, du Journal du Jour avec dictée vocale HTML5 et pièce jointe simulée, de l'affichage trimodal des alertes de priorité (Score, Charge Mentale, Facilité), et de l'indicateur d'overdue / planification temporelle Bento sans aucune perte de données ni fonctionnalités d'administration antérieures.*
- [x] **Étape Hors-Série Unvicies : Restructuration de l'onglet Aujourd'hui (5 Colonnes Focus Max, Épinglage Libre Clinique & Retrait du Journal)**
  *Restructuration de l'onglet Aujourd'hui pour répondre à vos directeurs et épurer visuellement l'ambiance : retrait de la zone de saisie du Journal, intégration de la double option d'épinglage libre (pouvoir choisir n'importe quelle tâche de l'application ou habitude déjà existante), et déploiement de 5 piliers de priorité absolue (Score Cumulé Max, Urgence Max, Importance Max, Charge Mentale Max, Facilité Max) avec doublons acceptés pour les éléments cumulant plusieurs champions.*
- [x] **Étape Hors-Série Duovicies : Refonte Esthétique, Ergonomique et Circadienne des Habitudes & Tâches Récurrentes (Conformité Maquette)**
  *Restructuration visuelle totale de la vue des Habitudes pour être en symétrie parfaite avec la capture de référence. Implémentation du double déclencheur (Cercle Checkbox et Bouton Play vert), intégration du chronomètre asynchrone autonome pour rituels chronologiques (comme Administratif), briques d'informations et de progression bento pour les suivis massifs ("Rep" / musculation), gestion dynamique et pérenne des paliers de lever matinal ("Récompense de Réveil") avec simulateur d'attribution immédiate de points, et nettoyage des modèles récurrents.*
- [x] **Étape Hors-Série Trevicies : Contrôle d'Action, Couleur de Liseré/Badge et Calendrier Historique Interactif pour Habitudes & Tâches récurrentes**
  *Ajout d'une barre d'action visible au clic sur chaque habitude et tâche récurrente (valider, historique, modifier, corbeille), calcul de l'inactivité passée ("depuis quand"), personnalisation de la couleur du liseré de la carte et du chiffre d'inactivité, et calendrier mensuel interactif permettant de cocher/décocher n'importe quel jour d'historique ou de consigner des valeurs. Résolution complète des doublons de clés React ("key") sur l'en-tête du calendrier et typage rigoureux du modèle.*
- [x] **Étape Hors-Série Quatervicies : Configuration dynamique de transition d'inactivité par seuil personnalisé et système de récompenses interactif en ligne**
  *Mise en place de la personnalisation (par tâche et par habitude) des seuils d'alertes d'inactivité (Vert, Orange, Rouge, Violet au-delà) harmonisant la couleur de la bordure et du badge d'inactivité. Intégration d'un système de récompense en ligne (bannière esthétique de notification sans popup) rétribuant l'utilisateur avec des Coins.*
- [x] **Étape Hors-Série Quinquevicies : Perfectionnement des seuils d'inactivité à 6 états, simplification terminologique et rigueur d'usage**
  *Mise en place de 5 seuils d'inactivité éditables (Vert, Jaune, Orange, Rouge, Violet foncé, et Noir au-delà, avec Gris par défaut si jamais complété). Simplification terminologique majeure : nettoyage des occurrences infondées du mot "circadien" et substitution de l'expression de "Raccordements" par "Tâches récurrentes".*
- [x] **Étape Hors-Série Sevicies : Fusion Clinique Automatique "Option A" de Sauvegarde de Tâches Récurrentes & d'Habitudes**
  *Création d'un module d'import de sauvegarde sélectif en ligne dans SettingsView qui propose l'Option A (fusion de sécurité automatique intelligente des habitudes et tâches récurrentes par fusion sans doublons avec l'état actuel de l'application) et l'Option B (écrasement complet).*
- [x] **Étape Hors-Série Septemvicies : Préservation et Restructuration de l'Historique de Tâches Récurrentes à l'Import**
  *Correction clinique du processus d'import/fusion JSON qui traduit désormais parfaitement les tableaux plats `completionHistory` d'anciennes sauvegardes en dictionnaires d'historicité `history` d'habitudes et de rituels récurrents, garantissant le maintien intégral des séries historiques passées.*
- [x] **Étape Hors-Série Duodevicies : Module d'Analyse IA Comparatif & d'Intégration Sélective de Fichiers**
  *Déploiement d'un module d'analyse comparative en ligne qui détecte instantanément les éléments (tâches uniques, habitudes, tâches récurrentes) présents dans le fichier JSON importé mais absents de l'application. Affichage sous forme de listes interactives avec cases à cocher permettant d'incorporer à la carte uniquement les éléments choisis sans aucun risque de doublon.*
- [x] **Étape Hors-Série Untrenties : Contrôles Directs de Tâches, Tiers Accomplis d'Aujourd'hui & Tableau de Bord Bento**
  *Re-qualification de l'onglet "Aujourd'hui" en "Tableau de bord". Raccordement d'un lève-minuteur de cron unifié et de la modification par `TaskInlineEditor` en ligne directement sur n'importe quel élément qu'il soit épinglé ou sous forme de fiche à travers l'application. Insertion de la liste condensée d'excellence des accomplissements du jour au sommet de la page.*
- [x] **Étape Hors-Série Duotrenties : Standardisation Temporelle, Multi-contrôles Universels et Éradication du Scrolling**
  *Correction définitive de la date système gérant les habitudes et tâches (timezone-aware local date), intégration des multi-contrôles (Play/Pause, Pin/Unpin, Edit, Coche) sur les listes En Retard, Planifiés et Épinglés, remplacement du Play par des Coches pour les rituels quantitatifs et compactage vertical extrême de l'affichage.*
- [x] **Étape Hors-Série Tritrenties : Unification Absolue et Synchronisation Totale du Chronomètre Multivues & Rendu de Tâche Standardisé**
  *Éradication clinique des décalages et des conflits de chronomètres entre le Tableau de bord et les autres vues (Inbox, Projets) en élevant la base de données comme unique source de vérité. Déploiement du composant universel de rendu de tâche (`renderTaskCard`) déclinant d'office l'identité parfaite de ses boutons (Lecture, Pause, Coche de complétion, Épinglage libre, et Éditeur inline) et de son cadran digital clignotant sur toutes les surfaces d'affichage (Épinglés, Piliers de Focus Max, En Retard, et Planifications).*
- [x] **Étape Hors-Série Quatrenties : Chronomètre Unifié pour Habitudes, Récompenses par Minute & Complétions par Effort**
  *Retrait définitif du bouton "LANCER" de l'HabitCard au profit du même bouton de chronomètre que les tâches. Attribution automatique d'une récompense en Coins pour chaque minute d'effort passée en chrono sur n'importe quel élément (tâches, habitudes, tâches récurrentes) indépendamment de la complétion finale. Refonte du bloc "🏆 Accomplies aujourd'hui" pour y intégrer d'office le temps travaillé de chaque élément aujourd'hui (même non complété).*
- [x] **Étape Hors-Série Quatrenties-B : Rétribution Temporelle Sur-Mesure & Retraits Transactionnels lors de l'Annulation de Complétion**
  *Déploiement d'un champ d'ajustement du gain par minute (`chronoRewardValue`) sur l'éditeur inline de tâches, les habitudes et les tâches récurrentes. Implémentation d'une gestion transactionnelle de retrait de pièces retirant la récompense de complétion globale du portefeuille si un élément est décoché de son état validé.*
- [x] **Étape Hors-Série Quatrenties-C : Uniformisation Absolue du Chrono via l'Overlay en Superposition**
  *Standardisation complète des systèmes de chronomètres pour tous les types d'éléments (Tâches, Habitudes, Rituels Récurrentes) grâce au déploiement du bandeau de chronomètre universel superposé en bas de l'écran avec contrôles synchrones (Pause, Play, Fermer, Valider).*
- [x] **Étape Hors-Série Quatrenties-D : Épuration Visuelle & Compactage des Cartes**
  *Retrait définitif des encadrés de statut "À Réaliser" et "Cible Complétée" des habitudes simples, réduction globale de la taille des cartes (remplacement du padding p-5 par p-3.5, diminution du min-height à 145px et réduction des ombrages à 3px) pour optimiser l'espace visuel.*
- [x] **Étape Hors-Série Quatrenties-E : Bulles d'Information au Survol & Défilement de la Barre d'Onglets via Molette**
  *Ajout d'une info bulle dynamique (tooltip jaune néo-brutuliste) affichant les détails de récompense en coins et d'historique de séries ("streak") au survol de l'icône de n'importe quel élément (Tâches, Habitudes, Tâches récurrentes). Résolution du défilement horizontal de la barre d'onglets de navigation au survol à l'aide de la molette physique de souris.*
- [x] **Étape Hors-Série Quatrenties-F : Réorganisation Instantanée des Épinglés & Habitudes via Drag & Drop**
  *Déploiement d'une technologie native HTML5 Drag & Drop légère et fluide. Les utilisateurs peuvent à présent faire glisser et ordonner instantanément leurs habitudes (dans l'onglet Habitudes et dans la zone des Habitudes du Jour) mais également l'ensemble de leurs éléments favoris au sommet du Tableau de bord (tâches, habitudes et tâches récurrentes confondues) de façon asynchrone avec conservation durable en base Firestore.*
- [x] **Étape Hors-Série Quatrenties-G : Agenda Interne Souverain & Synchronisation Bidirectionnelle Google Calendar**
  *Création d'un calendrier interne d'application souverain stocké directement dans la database globale d'événements (`db.tasks` type "event") pour un fonctionnement 100% autonome et sécurisé hors-ligne. Intégration d'un pont d'autorisation asynchrone bidirectionnel ascendant et descendant (téléchargement d'événements Google distant, téléversement de créations locales, corrections réciproques partagées, suppression en ligne synchrone, et synchronisation croisée de planification de tâches Bento).*
- [x] **Étape Hors-Série Quinquatrenties : Création d’Éléments et d’Événements en Superposition / Modal Overlay**
  *Enveloppement systématique des formulaires d'ajout rapide de tâche, d'ajout sémantique IA (Smart-Add) et d'événements d'agenda au sein de fenêtres de superposition (modals) à arrière-plan flouté sombre, éradiquant l'affichage intrusif au sein des grilles de contenu tout en simplifiant drastiquement l'ergonomie visuelle.*
- [x] **Étape Hors-Série Sestrenties : Système d'Agendas Partagés et Reconnaissance de Récurrences**
  *Déploiement d'une gestion complète pour les agendas partagés avec votre compte Google : affichage réactif des calendriers tiers connectés, suggestions intelligentes d'importation manuelle d'un événement vers votre agenda d'application local au clic, et distinction visuelle instantanée par code couleur et indicateurs (🔄 Récurrent, 📌 Fixe) des règles de récursion calendaire Google Agenda (Daily, Weekly, Monthly).*
- [x] **Étape Hors-Série Septtrenties : Éradication définitive du décalage de fuseau horaire Google Calendar (Timezone Offset Alignements)**
  *Résolution du dysfonctionnement provoquant un affichage décalé d'une journée (ex: événements d'hier affichés aujourd'hui). Remplacement complet de l'évaluation UTC (`.toISOString().split("T")[0]`) par une conversion locale souveraine rigoureuse (`getLocalDateString`). Alignement chirurgical du moteur de rendu mensuel, hebdomadaire, de déplacement interactif drag and drop et de synchronisation des flux d'agendas partagés Google Agenda. Résolution du formatage des événements "All Day" (toute la journée) pour Google Calendar lors du drag & drop et des modifications pour éviter leur transformation en événements temporels décalés.*
- [x] **Étape Hors-Série Octotrenties : Éradication de la Sauvegarde Locale & Résolution Définitive de Perte de Données après Reconnexion**
  *Élimination intégrale et définitive de l'utilisation du `localStorage` pour les données d'usage applicatives afin d'empêcher les écrasements de bases vides au rebranchement de session. Désactivation de l'écriture locale de l'état `somatique_db`. Implémentation d'une récupération migratoire unique (one-time load) de l'ancien `localStorage` physique suivi de sa suppression immédiate du disque dur. La mémoire locale et Firebase Firestore constituent désormais la vérité absolue et souveraine de l'application, limitant le `localStorage` de l'outil pour de bon aux seuls jetons de connexion et d'autorisation.*

- [x] **Étape Hors-Série Nonatrenties Bis : Connexion Google Tasks Isolée et Compte Séparé**
  *Séparation hermétique de l'authentification Google Tasks par rapport à la session Firebase principale de l'application via une instance d'authentification isolée. Forçage du sélecteur Google Accounts pour l'interfaçage indépendant et simultané de comptes distincts.*

---

- [x] **Étape Hors-Série Nonatrenties : Format Mini Progressif pour Cartes de Tâches & Rituels avec Déploiement Accordéon**
  *Refonte complète du composant universel `TaskCard.tsx` et des méthodes de rendu de tâches/récurrences dans `TodayView.tsx`. Affichage de départ ultra-minimaliste intégrant uniquement l'icône et le titre. Au clic sur l'en-tête de la carte, celle-ci se déploie progressivement : affichage sur la ligne du dessous des boutons d'action directs puis sur la ligne suivante des scores de priorités et l'échéance. Si la largeur disponible de son conteneur le permet (sur bureau ou grandes largeurs), l'ensemble s'affiche directement aligné de manière fluide et soignée sur une unique ligne sans nécessiter de déploiement d'accordéon.*

- [x] **Étape Hors-Série Quadraginties : Stabilisation Dimensionnelle Réactive par `ResizeObserver`**
  *Élimination absolue des superpositions, des troncatures de textes ou des boutons coupés dans les colonnes étroites (Piliers Focus, En Retard). Remplacement des classes de médias CSS classiques obsolètes (sm:flex, etc.) par une détection dynamique ultra-précise de la largeur d'emplacement de chaque carte via `ResizeObserver` en ligne, forçant l'affichage compact empilé sur mobile ou container étroit, et exploitant l'alignement linéaire plat dès que la largeur effectuelle dépasse le seuil optimisé de 330px pour un rendu compact et fluide.*

- [x] **Étape Hors-Série Quadraginties-B : Mini-Cartes Adaptatives pour Habitudes et Rituels Récurrents avec Score et Coins**
  *Prise en charge complète de la demande d'adaptation aux Habitudes et autres Tâches récurrentes. Remplacement de l'ancien affichage lourd par un système de mini-cartes réactives (`HabitCard` et `HabitsViewRecurringCard`) disposant d'un `ResizeObserver` individuel pour s'adapter dynamiquement à la largeur d'emplacement (seuil 330px). Intégration harmonieuse de l'affichage synchrone du score total (importance / urgence) et du nombre de coins à côté du chrono ou dans l'alignement.*

- [x] **Étape Hors-Série Quadraginties-C : Ombres Memphis Harmonisées & Données d'Habitude Intégrales**
  *Harmonisation globale des ombres de cartes de style Memphis (`box-shadow`), couplant la teinte de l'ombre à la couleur dynamique de l'indicateur d'inactivité (jours écoulés depuis la dernière action). Enrichissement des cartes d'habitudes et récurrences sur le tableau de bord principal pour afficher en continu l'ensemble des boutons de contrôle (décomptes +/-, chronomètres, validations d'étapes, calendriers d'historique et raccourcis d'édition) dans un format compact unifié.*

- [x] **Étape Hors-Série Quadraginties-D : Expansion Progressive au Clic sur les Cartes**
  *Mise en place de la compression esthétique interactive. Les boutons de décomptes (+/-), chronomètres, et contrôles de validation (Check) restent visibles en continu. Les boutons secondaires de gestion (Historique, Édition, Suppression, Épinglage) ainsi que les indicateurs de streaks et coins ne s'affichentormais qu'au clic sur l'espace neutre des cartes d'habitudes ou de tâches récurrentes, optimisant le calme visuel sur le tableau de bord et l'onglet habitudes.*

- [x] **Étape Hors-Série Quadraginties-E : Retrait des Habitudes du Tableau de Bord**
  *Retrait complet de la section des Habitudes du Jour au sein du Tableau de bord (TodayView) pour alléger l'espace de pilotage quotidien, recentrant les habitudes exclusivement au sein de leur section dédiée et préservant les modules de tâches critiques.*

- [x] **Étape Hors-Série Quadraginties-F : Section des Dernières Tâches Actives sur le Tableau de bord**
  *Ajout d'une section dynamique et modernisée "5 dernières tâches ajoutées" sur le Tableau de Bord, filtrée pour n'afficher que les tâches en cours (non-validées) directement en dessous de la planification du jour, préservant la symétrie réactive Memphis.*

- [x] **Étape Hors-Série Quadraginties-G : Format Développable & Correction du Layout Responsive**
  *Correction majeure du comportement responsive des cartes de tâches (ResponsiveTaskCard et ResponsiveRecurringTaskCard) : rehaussement du seuil de largeur (point de rupture isWide de 330px à 550px) permettant aux cartes d'adopter le format compact et développable par défaut sur les grilles multi-colonnes. Les titres sont préservés de tout chevauchement et les informations ou boutons secondaires de gestion se déploient verticalement sur clic de manière isolée et élégante.*

- [x] **Étape Hors-Série Quinquagesies : Uniformisation du Backlog de Planification en Mini-Cartes Memphis & Filtres de Tri Ergonomiques**
  *Refonte complète du Backlog de l'onglet Planification. Remplacement de l'ancien affichage brut par des micro-cartes unifiées (Tâches, Tâches Récurrentes, Habitudes, Rituels) de style Memphis blanc épuré dotées d'accordéons de contrôle individuel et de planification rapide. Intégration d'un sélecteur de tri multidimensionnel réactif dynamique (priorité par score calculé, urgence maximale, inactivité temporelle cumulée, récompense en Coins).*

- [x] **Étape Hors-Série Quinquagesies-A : Optimisation Spatiale de la Timeline & Rendu Informatif au Survol**
  *Retrait de l'enveloppe cartonnée à double-bordure de la vue de planification pour s'intégrer en pleine largeur. Correction et enrichissement de l'affichage des tâches programmées sur la timeline : calcul réactif et instantané des 4 informations prioritaires (Titre, Heure de début, Heure de fin, Durée). Rendu de hauteur adaptative et apparition d'une bulle d'informations (Tooltip) complète survolée sur le bloc de la timeline.*

- [x] **Étape Hors-Série Quinquagesies-B : Cohabitation Multi-Tâches Côte-à-Côte & Zoom Temporel à la Molette**
  *Résolution complète des conflits d'horaire d'agenda : intégration d'un algorithme de chevauchement multidimensionnel (type Google Calendar, calcul de colonnes et de groupes connexes synchronisés) qui réaligne de manière extrêmement propre les tâches superposées côte-à-côte à hauteur égale. Implémentation d'un capteur de zoom temporel sur l'axe des ordonnées (les heures à gauche), permettant de zoomer ou dézoomer fluidement sur l'échelle horaire à l'aide de la molette au survol.*

- [x] **Étape Hors-Série Quinquagesies-C : Proportions de Grille 1/3 - 2/3 & Élimination du Titre de Stock**
  *Améliorations spatiales et structurelles demandées par l'utilisateur : retrait complet du titre "Backlog Clinique" pour un style ultra-minimaliste. Rééquilibrage du système de grille de l'onglet de planification à hauteur de 1/3 (gauche) pour les listes de stock d'activités (tâches, récurrentes, habitudes, rituels) et 2/3 (droite) pour l'espace dédié à la timeline.*

- [x] **Étape Hors-Série Quinquagesies-D : Couleurs Personnalisées pour la Timeline & Relocalisation de l'Onglet Planification**
  *Intégration d'une palette de couleurs pastels esthétiques éditables en ligne pour tous les éléments planifiables (tâches et routines, en stock comme sur la timeline). Les sous-tâches/échos de routines héritent de cette affectation de couleur. Relocalisation de l'onglet Planification directement après le Tableau de bord pour optimiser le flux de pilotage quotidien.*

- [x] **Étape Hors-Série Quinquagesies-E : Correction de la Boucle d'Écriture Firestore (Dépassement du quota de flux)**
  *Résolution définitive de l'erreur "Write stream exhausted maximum allowed queued writes" en isolant l'alignement quotidien des habitudes de tout cycle d'écriture cloud asynchrone automatique en arrière-plan. L'état d'affichage est désormais mis en adéquation de manière purement locale et ne sollicite plus d'appels d'écriture en chaine sur Firestore au démarrage ou lors de décalages horaires.*

- [x] **Étape Hors-Série Quinquagesies-F : Visualisation Fluidifiée de l'Imbrication Temporelle en Temps Réel**
  *Élimination de la latence et de la gesticulation du drag-and-drop HTML5 standard sur la timeline. Intégration d'un capteur ultra-fluide direct en mousedown/mousemove/mouseup pour repositionner directement en base de données les plages horaires des tâches et rituels. Recalcul instantané côte-à-côte à 60fps de l'ensemble de l'imbrication temporelle et des chevauchements. Raccordement d'un filtre de collision rect pour l'évacuation des faux dragleave de l'axe vertical lors du glissé d'un nouvel élément depuis le Backlog.*

---

- [x] **Étape Hors-Série Septseptuagies : Système d'Arbre de Dépendances & Sauvegarde de Tags**
  *Correction clinique de l'enregistrement en ligne des tâches (paramètres handleSaveTask alignés) rétablissant l'enregistrement instantané des tags et données modifiées. Mutation complète de la vue des Projets : remplacement des colonnes Kanban par une structure d'Arbre de dépendances récursive et interactive ("A doit précéder B") avec des indicateurs de statut (🔒 Bloquée / ⚡ Prête) et des contrôles de déliaison immédiate en ligne.*

- [x] **Étape Hors-Série Septseptuagies-B : Système de Checklist de Sous-tâches Intégrée Cocher-Déplier**
  *Conception et intégration d'un panneau déroulant de sous-tâches interactives au sein des cartes d'activité. Lors du déploiement (clic sur le titre d'une tâche principale), l'ensemble de ses sous-tâches s'affiche sous forme de liste ultra-minimaliste munie de cases à cocher synchronisées sans aucune fenêtre d'alerte, opérationnelle à la fois sur le Tableau de bord global et sur l'Arbre de dépendances.*

- [x] **Étape Hors-Série Septseptuagies-C : Ajout Instantané de Sous-tâches en Ligne**
  *Ajout d'un bouton de création rapide de nouvelles sous-tâches directement aligné sur la ligne des boutons d'actions (sur le Tableau de bord quotidien et l'Arbre de dépendances). L'ensemble fonctionne de manière ultra-minimaliste par un champ de texte compact en ligne, s'adaptant à la hauteur, et visible uniquement si des sous-tâches existent, 100% exempt de popup ou de confirmation intrusive.*
- [x] **Étape Hors-Série Septseptuagies-D : Validation Automatique des Sous-tâches par Héritage de Complétion**
  *Mise en place d'une règle de propagation descendante stricte validant automatiquement toutes les sous-tâches d'une tâche lorsque la tâche mère est cochée comme complétée (que ce soit via le Tableau de bord, l'Inbox ou le module des Projets). Crédit automatique des pièces (Coins) correspondantes au portefeuille de l'utilisateur lors de ces validations en cascade.*
- [x] **Étape Hors-Série Septseptuagies-E : Isolation Hermétique des Routines & Tâches de Planification**
  *Séparation stricte entre les éléments planifiés dans la timeline (habitudes, récurrences, rituels de préparation et routines) et la liste globale des tâches de l'application. L'ajout d'une routine sur la timeline de planification n'ajoute plus aucune tâche parasite dans les autres modules (Tableau de bord, Projets, Classement, Tâches Terminées, Archives). Le retrait ou le déblayage d'une routine sur la timeline nettoie automatiquement son instance planifiée sans affecter l'habitude ou le modèle d'origine.*
- [x] **Étape Hors-Série Septseptuagies-F : Exportation Complète des Logs de Temps vers Google Sheets**
  *Intégration native avec l'API Google Sheets (`spreadsheets`). Extraction et structuration exhaustive de l'ensemble des journaux de temps quotidiens : calcul du temps moyen journalier, cumul progressif et global, répartition par tâche, par type d'élément (Tâches, Habitudes, Récompenses/Loisirs) et par tag. Génération d'un classeur multi-onglets formaté (Synthèse & Métriques, Logs Quotidiens & Cumul, Par Tâche, Tous les Logs Détaillés) avec formules natives et commandes 100% en ligne sans popup.*
- [x] **Étape Hors-Série Septseptuagies-G : Rétablissement et Sécurisation de l'Identifiant de Base Firestore**
  *Rétablissement explicite de `firestoreDatabaseId` (`ai-studio-c1319359-6c93-4c43-8c5b-c7a3fe7ad6a5`) dans `firebase-applet-config.json` et ajout d'un repli automatique dans l'initialisation de `firebase.ts`. Déploiement de la règle de sécurité Firestore pour l'endpoint de test de connectivité `/test/connection`.*
- [x] **Étape Hors-Série Septseptuagies-H : Feuille "archive jeux" Google Sheets (Format d'Origine & Fusion des Données)**
  *Intégration d'un 5e onglet dédié "archive jeux" dans le classeur Google Sheets exporté, reproduisant au pixel et à la cellule près le format d'origine du suivi de jeux vidéo de l'utilisateur : cartouche d'indicateurs supérieur (jours écoulés, heures autorisées à 1h/j, moyenne par jour globale et par jeu, total par jeu, heures restantes), 17 colonnes de jeux d'origine + nouvelles colonnes dynamiques, calendrier continu du 22/03/2022 au 01/09/2027 et fusion transparente des sessions de jeux/loisirs enregistrées dans l'application.*
- [x] **Étape Hors-Série Septseptuagies-I : Dynamisation Intégrale des Lignes de Stats de l'Onglet 'archive jeux' par Formules Natives**
  *Remplacement de toutes les valeurs statiques du bloc d'en-tête et des totaux de l'onglet "archive jeux" par des formules dynamiques Google Sheets interconnectées (`=AUJOURDHUI()`, `=C3-C2`, `=A4/24`, `=A4/365`, `=C7/$A$4`, `=${col}7/$A$4`, `=SOMME(...)`, `=A5-C7`). Application des formats numériques précis (`[h]:mm:ss`, `[h]:mm`, `#,##0`) garantissant un recalcul instantané et automatique à chaque nouvelle saisie.*
- [x] **Étape Hors-Série Septseptuagies-J : Paramètre Dédié « Jeu Vidéo » sur les Récompenses Loisirs Chronométrés**
  *Ajout d'une propriété explicite `isGame` sur le modèle `Reward`. Intégration d'un commutateur bicolore sobre dans les paramètres de création et d'édition de tout loisir chronométré (y compris les récompenses existantes avec défilement automatique vers le formulaire), doublé d'un bouton-badge interactif en 1 clic directement accessible sur la carte de chaque loisir en boutique. Filtrage unifié via `isRewardGame` garantissant que seules les sessions qualifiées de jeux vidéo alimentent l'onglet et les statistiques de jeux.*

---

## 🛠 SUIVI DE l'ÉTAPE DU JOUR
**Étape actuelle :** 🌙 SYSTÈME IDENTIQUE ET COMPLÉMENTAIRE POUR LES HEURES DE COUCHER (COMPLÉTÉ !)
*Améliorations apportées :*
1. **🌙 Modèle de Données & Calcul Circadien Normalisé (`types.ts`, `BedTimeHistoryManager.tsx`)** : Ajout des champs `bedTime`, `bedTimeDelayMinutes`, `bedTimeCoinsRewarded` et `bedTimeNotes` dans `SleepWakeLog` et `lastBedConfirmedDate` dans `UserProfile`. Implémentation d'un calcul cyclique robuste (`calculateBedDelta`) gérant le franchissement de minuit (avance = +1 CS/min, retard = -1 CS/min).
2. **📈 Courbe SVG Dédiée aux Couchers (`BedTimeChart.tsx`)** : Échelle normalisée centrée sur la nuit (21h - 03h), ligne cible en tirets, cartouches statistiques synthétiques (Moyenne, Régularité, Ratio à l'heure, Solde CS), et infobulle interactive au survol.
3. **📋 Gestionnaire d'Historique CRUD Sans Popup (`BedTimeHistoryManager.tsx`)** : Bascule vue Graphique / Liste, formulaire d'ajout rétroactif avec prévisualisation du gain/perte de CS, modification directe en ligne et suppression sécurisée avec confirmation en ligne (zéro popup).
4. **🪟 Fenêtre Dédiée de Gestion du Coucher (`BedTimeModal.tsx`)** : Overlay Memphis identique à `WakeUpModal`, boutons d'ajustement rapide (-15m, -5m, +5m, +15m, Maintenant), estimation du delta en temps réel, option de mise à jour de l'heure cible par défaut, et onglet Historique & Passé.
5. **🧭 Accès Rapide dans le Header (`Header.tsx`, `App.tsx`)** : Bouton permanent `🌙 {targetSleepTime || "23:00"}` positionné à côté du bouton de réveil pour un accès immédiat en 1 clic.
6. **🎯 Section 4 dans l'Onglet Habitudes (`HabitsView.tsx`)** : Intégration sous la section Lever Matinal d'un bloc complet "Récompense de Coucher du Soir" avec réglage de l'heure cible, déploiement du graphique/historique, et enregistrement/validation du coucher du jour.
7. **🏆 Intégration aux Accomplissements Quotidiens (`TodayView.tsx`, `DailyAccomplishmentsHistory.tsx`, `AdvisorView.tsx`)** : Les couchers validés s'affichent automatiquement dans le récapitulatif du jour et alimentent les bilans d'accomplissement et de gains/pertes de pièces.

**Étape précédente :** 🧠 CONSEILLER STRATÉGIQUE GLOBAL GEMINI 3.8 (AUDIT HOLISTIQUE, AIDES, ALERTES & MODIFICATIONS DIRECTES D'APPLICATION) (COMPLÉTÉ !)
*Améliorations apportées :*
1. **🌐 Audit Holistique de l'Ensemble des Données (`/api/gemini/advisor-audit`)** : Intégration du modèle `gemini-3.8-flash` (avec chaîne de repli résiliente 3.8 ➔ 3.7 ➔ 3.6 ➔ 3.5 ➔ 2.5 et moteur algorithmique autonome). L'IA extrait et met en perspective toutes les facettes applicatives : tâches actives, échéances dépassées, régularité des habitudes, streaks, seuils d'inactivité, bilans de sommeil et retards de réveil, balance travail / loisirs / quota jeux vidéo, et paramètres généraux.
2. **💡 Conseils & Aides Concrètes Personnalisées** : Génération de recommandations ultra-minimalistes, factuelles et sobres (catégories Priorité, Rythme, Organisation, Bien-être) sans adjectifs superflus.
3. **⚠️ Mises en Garde & Alertes Précises** : Détection des goulets d'étranglement (tâches en retard critique, habitudes délaissées avec risque de rupture de chaîne, dette de sommeil accumulée, dérive du quota de jeux vidéo).
4. **🛠️ Propositions Directes de Modification de l'Application** : L'IA formule des adaptations réelles de l'application selon les besoins de l'utilisateur (adaptation de l'espacement d'interface en mode compact ou cozy, ajustement de l'heure cible de réveil, création ciblée d'habitudes d'hygiène de travail ou de tâches de déblocage, archivage des tâches terminées encombrantes, ajustement des seuils d'alerte).
5. **🔘 Application Interactive 100% en Ligne (Zéro Popup)** : Chaque proposition dispose d'un bouton d'action avec confirmation inline ("Confirmer l'application ?" ➔ "Oui, appliquer" / "Annuler") répercutant instantanément le changement dans l'état Firebase sans aucune fenêtre modale intempestive.
6. **💬 Espace de Dialogue Interactif Dédié** : Chat direct avec Gemini 3.8 Flash grounded sur l'intégralité du contexte applicatif en temps réel pour répondre à toute question d'organisation ou de rythme.
7. **📦 Allègement Extrême de `App.tsx` & Respect des Données** : Vue externalisée dans `AdvisorView.tsx` avec persistance Cloud Firestore (`aiAudit`) sans aucun stockage applicatif dans `localStorage`.

**Étape précédente :** 🛠️ RÉSOLUTION DES INCOHÉRENCES, HARMONISATION DU SCORE, LIAISON SOUS-TÂCHES & ALLÈGEMENT MODULAIRE (COMPLÉTÉ !)
*Améliorations apportées :*
1. **⚖️ Harmonisation Absolue du Score Cumulé** : Substitution de l'ancien calcul incomplet dans `TaskCard.tsx` par la formule officielle universelle `calculateTaskScore` (prenant en compte Importance, Urgence, Charge Mentale et Facilité) pour une équivalence stricte de score sur tous les écrans.
2. **🔗 Liaison Intégrale des Sous-tâches (`parentId` & `parentTaskId`)** : Correction dans `NewElementForm.tsx` pour initialiser simultanément `parentId` et `parentTaskId` à la création. Prise en compte bidirectionnelle dans `TodayView.tsx` (`st.parentId === t.id || st.parentTaskId === t.id`) permettant à toute sous-tâche de s'afficher sans exception sous sa tâche parente.
3. **📅 Support Unifié des Échéances** : Alignement de `TaskCard.tsx` sur `task.dueDate || task.deadline` pour le calcul du décompte de jours et l'affichage de l'échéance.
4. **✏️ Rétablissement de l'Édition de Tâche dans la vue Projets** : Raccordement direct de `onEdit` dans `TaskCard.tsx` à l'éditeur en ligne `TaskInlineEditor` et gestion autonome et complète des callbacks dans `ProjectsView.tsx`.
5. **🗃️ Nettoyage du Doublon « Analyses » dans les Archives** : Élimination de l'import et de l'onglet fantôme dans `ArchivesView.tsx`, préservant la vue Analyses souveraine dans la barre de navigation.
6. **🎨 Harmonisation Memphis du Formulaire de Temps Manuel** : Refonte de `ManualLogForm` avec la charte Memphis stricte (`border-2 border-black`, `rounded-none`, `shadow-[2px_2px_0px_#000]`).
7. **📦 Allègement Extrême de `App.tsx` (610 ➔ 264 lignes)** : Externalisation du bloc de 115 lignes de style dans `ThemeStyleInjector.tsx` et autonomisation de `ProjectsView`, ramenant le fichier principal sous les 270 lignes.

**Étape précédente :** 📱 ACCESSIBILITÉ DE L'ENCART TITRE & OPTIMISATION RESPONSIVE MOBILE DU FORMULAIRE D'AJOUT (COMPLÉTÉ !)

**Étape précédente :** 🔄 CHAÎNE DE REPLI CASCADE MODÈLES GEMINI (3.8 -> 3.7 -> 3.6 -> 3.5 -> 2.5) (COMPLÉTÉ !)
*Améliorations apportées :*
1. **⛓️ Chaîne de Repli en Cascades Systématique (`generateContentWithFallback`)** : Toutes les requêtes IA de l'application (Journal, Santé, Chat, Smart-Add, Analyses) testent séquentiellement les modèles dans l'ordre exact demandé : `gemini-3.8-flash` ➔ `gemini-3.7-flash` (si 3.8 saturé) ➔ `gemini-3.6-flash` (si 3.7 saturé) ➔ `gemini-3.5-flash` ➔ `gemini-2.5-flash`.
2. **🛡️ Résilience Absolue** : Si un modèle retourne une erreur de quota (429 / resource_exhausted) ou de surcharge serveur, la fonction passe automatiquement au modèle suivant de la liste sans interruption pour l'utilisateur.
3. **⚡ Secours Algorithmique Local** : Si l'ensemble des modèles de la chaîne échoue ou est hors-ligne, les endpoints basculent sur le moteur algorithmique local.

**Étape précédente :** 🧠 SÉCURISATION & BASCULE RÉSILIENTE DE L'ANALYSE IA (FALLBACK ALGORITHMIQUE INSTANTANÉ) (COMPLÉTÉ !)
*Améliorations apportées :*
1. **🛡️ Bascule Automatique & Transparente** : En cas de quota API temporairement saturé, d'absence de clé ou de latence réseau, le serveur bascule instantanément sur le moteur algorithmique local enrichi sans renvoyer d'erreur 500 ni bloquer l'utilisateur.
2. **⚡ Modèle Performant & Robuste** : Utilisation de `gemini-2.5-flash` pour les requêtes rapides avec schéma JSON strict.
3. **🏷️ Transparence d'Origine** : L'interface affiche avec précision l'origine du diagnostic (`Diagnostic Analytique IA (Gemini)` ou `Diagnostic Analytique Algorithmique Intégré`).

**Étape précédente :** 📊 INTÉGRATION COMPLÈTE DE L'ÉQUIVALENT GOOGLE SHEETS DANS L'APPLI (GRAPHIQUES, TENDANCES & ARCHIVE JEUX) (COMPLÉTÉ !)
*Améliorations apportées :*
1. **📑 6 Sous-Onglets Analytiques Dédiés (Réplique Exhaustive du Google Sheets)** :
   - *Synthèse* : Cartouches KPI globaux, ratio travail/loisirs, répartition par type et par tag, distribution par jour de la semaine et moteur de diagnostic IA Gemini.
   - *Semaines & Mois (Résumés & Tendances)* : Sélecteur de granularité, graphique de volume par période (`PeriodBarChart`), cartouche d'analyse algorithmique des tendances (pente d'effort en %, moyenne mobile sur 4 semaines, projection de fin de mois, séries ininterrompues), cartes de résumé individuelles avec sparklines et tableau comparatif complet.
   - *Logs Quotidiens & Cumul (Feuille 2 Google Sheets)* : Graphique de cumul chronologique SVG interactif (`CumulativeAreaChart`), cartouches de cumul, et tableau jour par jour avec temps travail/loisirs, solde net et cumuls au fil de l'eau.
   - *Tâches & Tags (Feuille 3 Google Sheets)* : Graphiques de répartition par type et tag (`BreakdownChart`), tableau complet par tâche avec temps total, jours actifs, moyenne par jour actif et part relative.
   - *Archive Jeux (Feuille 5 Google Sheets)* : Grille tableur interactive fidèle avec les 9 lignes de statistiques supérieures (Dates, jours écoulés, quota 1h/j, années, moyennes par jeu, total général, solde avec alertes), les 17+ colonnes de jeux et totaux journaliers.
   - *Journal Exhaustif (Feuille 4 Google Sheets)* : Historique complet de chaque session avec filtres de type, recherche textuelle et variations de points CS.
2. **📈 Graphiques SVG Interactifs Ultra-Légers & Zéro Dépendance** : Barres comparatives périodiques, courbes d'aires de cumul chronologique, répartition proportionnelle et sparklines dynamiques.
3. **🧠 Interprétations Algorithmiques Intégrées & Diagnostic IA** : Analyses de régularité, pentes de progression, détection des jours pivots et projections statistiques natives sans dépendance obligatoire au cloud, complétées par un module d'analyse IA contextuelle.

**Étape précédente :** 🎮 MODIFICATION DU BADGE JEU SUR LES RÉCOMPENSES EXISTANTES (COMPLÉTÉ !)
*Améliorations apportées :*
1. **✏️ Édition Complète du Badge sur Récompenses Existantes** : Lors de la modification d'un loisir chronométré existant, le statut réel du badge est automatiquement chargé et synchronisé via `isRewardGame(reward)`, avec défilement automatique vers le formulaire et sélecteur de badge visuel dédié (`[🎮 Badge "Jeu" (Inclus)]` / `[📺 Badge "Autre" (Exclu)]`).
2. **🔘 Bascule Directe en 1 Clic sur la Carte** : Le badge affiché en en-tête de carte (`🎮 Jeu` violet / `📺 Autre` gris) est cliquable et bascule instantanément l'état de n'importe quelle récompense existante avec notification inline éphémère.
3. **🔄 Synchronisation Bidirectionnelle Formulaire & Carte** : Toute modification effectuée sur la carte ou dans le formulaire de modification met à jour le modèle et l'état en temps réel.
4. **📊 Filtrage Unifié dans l'Export Google Sheets** : Utilisation de la fonction unifiée `isRewardGame` dans `legacyGamingData.ts` pour garantir une correspondance absolue entre les badges de l'interface et l'agrégation dans l'onglet "archive jeux".

**Étape précédente :** ⚡ FORMULES DYNAMIQUES DANS L'ONGLET "ARCHIVE JEUX" GOOGLE SHEETS (COMPLÉTÉ !)
*Améliorations apportées :*
1. **📐 Conversion Intégrale des Lignes de Stats en Formules Natives** :
   - *Date de fin dynamique* : `=AUJOURDHUI()` en `C3`.
   - *Jours écoulés* : `=C3-C2` en `A4` formaté en entier numérique (`#,##0`).
   - *Heures autorisées (1h/j)* : `=A4/24` en `A5` formaté en durée `[h]:mm`.
   - *Années écoulées* : `=A4/365` en `A6`.
   - *Moyennes journalières par jeu et globale* : `=C7/$A$4` en `C6` et `A7`, `=${col}7/$A$4` pour chaque colonne de jeu en ligne 6, formatées en durée `[h]:mm:ss`.
   - *Totaux cumulés par jeu et global* : `=SOMME(${col}11:${col}${lastRow})` pour chaque colonne de jeu en ligne 7, et `=SOMME(D7:${lastCol}7)` pour le total global en `C7`.
   - *Solde d'heures restantes* : `=A5-C7` en `A8` avec mise en gras et format `[h]:mm:ss`.
   - *Totaux journaliers par date* : `=SOMME(D${row}:${lastCol}${row})` sur chaque ligne de date en colonne B.
2. **🎨 Formatage Précis des Cellules** : Application des formats de nombre et de durée Google Sheets via l'API, évitant tout affichage brut décimal ou conversion erronée de dates.
3. **🔄 Recalcul Instantané** : Toute modification, ajout ou mise à jour de session de jeu recalcule automatiquement l'intégralité du tableau de bord d'archive sans nécessiter de réexportation.

**Étape précédente :** 🎮 FEUILLE "ARCHIVE JEUX" DANS GOOGLE SHEETS (COMPLÉTÉ !)
*Améliorations apportées :*
1. **🕹️ Format d'Origine Répliqué à 100%** :
   - *Bloc d'en-tête supérieur* : Lignes 1 à 9 reprenant les dates de référence (`22/03/2022` au `25/09/2026` / date actuelle), le nombre de jours, le quota d'heures autorisées (`1648:00`), les années écoulées, les moyennes journalières par jeu et globales (`1:02:00`), le total joué cumulé (`1702:48:00`), et le solde d'heures restantes (`-54:48:00`).
   - *Ligne d'en-tête 10* : Les 17 colonnes de jeux historiques (`Going Medieval`, `diplomacie inao`, `tcg`, `Bellwright`, `gta V`, `Stranded alien dawn`, `BDG 3`, `ManorL`, `fc`, `med dyn`, `sengoku`, `stacklands`, `anno`, `age of`, `valhalla`, `x`, `PARKinect`).
   - *Lignes 11+* : Calendrier complet jour par jour avec temps total de la journée et détail de chaque jeu joué.
2. **🔄 Fusion des Données Anciennes & Nouvelles** : Raccordement automatique des sessions de loisirs et jeux créées dans l'application (`db.rewards`, `db.tasks` tagguées jeux) s'insérant directement dans les colonnes et dates correspondantes.
3. **✨ Mise en Page & Rendu Visuel Soigné** : Gel des 10 premières lignes pour conserver les totaux visibles au défilement, auto-ajustement des largeurs de colonnes et mise en gras des en-têtes et moyennes.

**Étape précédente :** 🔧 RÉTABLISSEMENT ET SÉCURISATION DE LA CONNEXION FIRESTORE (COMPLÉTÉ !)
*Améliorations apportées :*
1. **🆔 Restauration de `firestoreDatabaseId`** : Correction du ciblage de la base Firestore nommée `ai-studio-c1319359-6c93-4c43-8c5b-c7a3fe7ad6a5` dans `firebase-applet-config.json` et dans l'initialisation `firebase.ts`, éradiquant l'erreur « the client is offline » sur la base par défaut.
2. **🛡️ Règle de Sécurité pour `/test/connection`** : Déploiement de la règle d'autorisation de lecture pour le test de diagnostic de connectivité dans `firestore.rules`.
3. **✅ Validation de Compilation & Lint** : Validation de la conformité TypeScript et compilation réussie sans erreur.

**Étape précédente :** 📊 EXPORTATION COMPLÈTE DES LOGS DE TEMPS VERS GOOGLE SHEETS (COMPLÉTÉ !)
*Améliorations apportées :*
1. **📄 Classeur Google Sheets Structuré à 4 Onglets** :
   - *Synthèse & Métriques* : Cartouches KPI (temps total de travail, loisirs, balance nette, moyenne journalière, nombre de sessions) et tableaux récapitulatifs par type et par tag avec pourcentages et moyennes.
   - *Logs Quotidiens & Cumul* : Historique jour par jour, durée de travail, loisirs, balance nette, cumul chronologique et formules Google Sheets natives (`SOMME`, `MOYENNE`).
   - *Par Tâche* : Analyse agrégée par tâche et élément avec temps total, temps moyen par jour actif, nombre de jours et part relative.
   - *Tous les Logs Détaillés* : Journal exhaustif de chaque session enregistrée (date, titre, type, tags, durée en minutes et heures, statut, variation de CS).
2. **🏷️ Découpage Multidimensionnel** : Calcul précis par tâche, par type (tâche, habitude, récompense) et par tag (avec gestion des tags multiples et éléments sans tag).
3. **📈 Temps Moyen & Temps Cumulé** : Calcul dynamique du temps moyen par jour actif et calcul du cumul chronologique au fil de l'eau.
4. **🔒 Autorisation OAuth Google Sheets Fluide & Zéro Popup** : Prise en charge du scope `https://www.googleapis.com/auth/spreadsheets`, composant `GoogleSheetsExportButton` en ligne avec lien direct d'ouverture du fichier dans Google Sheets, accessible depuis le graphique de temps (`TimeHistoryChart`), la gestion des sauvegardes (`SettingsView`) et l'historique des tâches terminées (`CompletedTasksTab`).

**Étape précédente :** 🧘 ISOLATION HERMÉTIQUE DES ROUTINES DE PLANIFICATION (COMPLÉTÉ !)
*Améliorations apportées :*
1. **🛡️ Hermétisme des Vues Hors-Planification** : Filtrage strict (`isPlanningOnly` / `type !== "routine"`) sur le Tableau de bord, les Projets, le Classement, les Tâches Terminées et les Archives pour empêcher toute pollution des listes globales lors de la planification d'habitudes ou de routines.
2. **🧹 Nettoyage Automatique au Dédoublement / Déprogrammation** : Lors du retrait d'une routine de la timeline ou lors du vidage de l'agenda, l'instance planifiée est purgée proprement sans encombrer le stock de tâches ni dégrader la routine source.
3. **🎯 Stock de Tâches Isolé** : Le stock de tâches du planificateur n'affiche désormais que les véritables tâches du backlog, évitant l'accumulation de faux doublons de routines.

**Étape précédente :** 📐 ADAPTATION DU PLANIFICATEUR À LA HAUTEUR DE FENÊTRE & ISOLATION DU DÉFILEMENT LOCAL (COMPLÉTÉ !)
*Améliorations apportées :*
1. **📏 Pleine Hauteur Sans Débordement (`100vh`)** : Le planificateur s'ajuste dynamiquement à la hauteur exacte de l'écran avec masquage automatique du footer global sur la vue planification.
2. **🎯 Défilement Local Isolé** : La molette de souris ne fait défiler que les conteneurs locaux (colonne stock de tâches à gauche et timeline à droite), sans aucun défilement de la page globale.
3. **🔍 Préservation du Zoom Temporel** : Maintien intact du zoom à la molette sur l'axe horaire gauche de la timeline tout en garantissant un scroll vertical ultra-fluide sur la piste.

**Étape précédente :** 🗃️ SOUS-ONGLET DES TÂCHES TERMINÉES & RESTAURATION DANS LES ARCHIVES (COMPLÉTÉ !)
*Améliorations apportées :*
1. **✅ Sous-onglet « Tâches Terminées » dans Archives** : Intégration d'un sous-onglet dédié affichant exhaustivement l'ensemble des tâches accomplies (`isCompleted`, `status === 'done'`, `planningStatus === 'done'`), avec compteur dynamique.
2. **🔄 Restauration Instantanée en Ligne** : Bouton « Restaurer » permettant de réactiver n'importe quelle tâche terminée et de la replacer immédiatement dans la liste des tâches actives (ainsi que ses sous-tâches associées).
3. **🔍 Recherche, Filtres & Tri Dédiés** : Filtrage temporel (Toutes, Aujourd'hui, 7 jours, 30 jours), recherche textuelle, sélection par tags et tris multiples (date de fin, titre, temps passé, pièces).
4. **📊 Tiroir de Détails & Zéro Popup** : Déploiement des scores, sous-tâches, historiques de sessions de travail, et suppressions définitives avec confirmation inline 100% sans popup.

**Étape précédente :** ⏱️ BOUTONS DE DÉDUCTION & AJOUT RAPIDES DE TEMPS DANS LA BOUTIQUE (COMPLÉTÉ !)
*Améliorations apportées :*
1. **➖ Bouton de Déduction Rapide « -5m » & Boutons Rapides (+5m, +15m, +30m, +60m) en Boutique** : Intégration des boutons d'ajustement direct de temps dans le panneau de saisie manuelle des activités de loisir de la Boutique (`RewardsView.tsx`).
2. **🪙 Remboursement Automatique des Pièces & Remboursement de Dette** : En cas de déduction de temps (-5m ou durée négative), remboursement automatique en pièces (CS) au taux du loisir, avec apurement prioritaire de la dette si l'utilisateur en possède.
3. **🔄 Prise en Charge Homogène Global** : Alignement total du comportement et du style visuel Memphis (rose pour -5m, jaune ambré pour les ajouts) sur l'ensemble des modules (Tâches, Habitudes, Récurrences et Boutique).

**Étape précédente :** ⏱️ AJOUT DU BOUTON DE DÉDUCTION RAPIDE DE TEMPS « -5m » (COMPLÉTÉ !)
*Améliorations apportées :*
1. **➖ Bouton de Déduction Rapide « -5m »** : Intégration d'un bouton rose Memphis « -5m » aux côtés des boutons d'ajout rapide (+5m, +15m, +30m, +60m) dans la section de saisie manuelle du temps pour les tâches, les habitudes et les tâches récurrentes.
2. **🔄 Gestion Sécurisée des Valeurs Négatives** : Prise en charge chirurgicale du temps soustrait dans l'historique de travail (`workHistory`), le cumul de temps et le temps passé, avec maintien de planchers à 0 min.
3. **🪙 Recalcul Automatique des Pièces (Coins)** : Déduction proportionnelle et sécurisée du solde de pièces en cas de déduction de temps (sans solde négatif), assurant la cohérence totale du portefeuille de gamification.

**Étape précédente :** 🏆 MISE EN VALEUR DES GAINS ET DÉPENSES EN CS DANS LA BOX « ACCOMPLIES AUJOURD'HUI » (COMPLÉTÉ !)
*Améliorations apportées :*
1. **💰 Calcul Unifié des Gains et Dépenses en Cs (`coinsDelta`)** : Calcul instantané et précis du gain (complétion + temps chrono) ou de la dépense (achats boutique, temps de loisir) pour chaque type d'élément : tâches, habitudes, récurrences, achats boutique, sessions de loisirs et réveils matinaux.
2. **🏷️ Badges Visuels Distincts** : Affichage d'un badge net bicolore de style Memphis pour chaque élément dans la box (`+X CS` vert pour les gains, `-X CS` rose/rouge pour les dépenses, `0 CS` neutre).
3. **📊 Sous-Totaux du Jour dans l'En-tête** : Affichage dans l'en-tête de la boîte du cumul journalier des gains et dépenses de la journée (`+XX CS` et `-YY CS`).

**Étape précédente :** 📅 INTÉGRATION GOOGLE AGENDA À LA CRÉATION & MODIFICATION DE TÂCHES (COMPLÉTÉ !)
*Améliorations apportées :*
1. **🔒 Authentification Isolée & Protection de Session** : Utilisation d'une instance secondaire Firebase pour l'autorisation Google Agenda, garantissant une étanchéité absolue et éliminant tout risque de déconnexion de la session de données Firestore principale.
2. **➕ Ajout à la Création** : Intégration d'une option « 📅 Ajouter à Google Agenda » dans le formulaire unifié de création (`NewElementForm.tsx`). Synchronisation instantanée de l'événement avec date, heure et durée.
3. **✏️ Synchronisation & Déliaison à la Modification** : Prise en charge dans l'éditeur de tâche (`TaskInlineEditor.tsx`) de la synchronisation automatique vers Google Agenda, avec option de déliaison et confirmation inline sans popup.

**Étape précédente :** 👁️ AFFICHAGE PRIORITAIRE DU TITRE & DÉPLOIEMENT ACCORDÉON SUR LES 5 DERNIÈRES TÂCHES AJOUTÉES (COMPLÉTÉ !)
*Améliorations apportées :*
1. **📌 Priorité Visuelle Absolue au Titre** : Sur la section des 5 dernières tâches ajoutées du Tableau de bord, affichage d'un format compact centré sur le titre et l'icône de la tâche, sans boutons ni indicateurs de score parasites à l'état replié.
2. **👆 Déploiement Intégral au Clic** : Clic direct sur le titre pour dévoiler l'ensemble des boutons d'actions (chronomètre, validation, édition, suppression, épinglage, bouton solaire Jour de, ajout de sous-tâche) et des détails de priorités/scores (importance, urgence, charge mentale, facilité, chrono, pièces, échéance).

**Étape précédente :** 🎮 SAISIE ET MODIFICATION DE TEMPS DE LOISIR À DATE SUR-MESURE (COMPLÉTÉ !)
*Améliorations apportées :*
1. **📅 Sélecteur de Date pour Saisie Manuelle de Loisir** : Ajout d'un sélecteur de date (par défaut calé sur aujourd'hui) dans la saisie manuelle de temps de loisir (`RewardsView.tsx`), permettant de consigner des minutes de détente pour n'importe quel jour passé ou futur.
2. **✏️ Édition Complète des Sessions dans les Logs** : Possibilité de modifier directement à la fois la date et la durée en minutes de chaque entrée de session de loisir dans le panneau des logs avec recalcul synchrone des soldes et dettes en Coins.

**Étape précédente :** 👤 ÉPURATION DES PARAMÈTRES : RETRAIT DU RYTHME CIRCADIEN THÉORIQUE (COMPLÉTÉ !)
*Améliorations apportées :*
1. **👤 Retrait de l'encart Rythme Circadien** : Suppression du bloc et formulaire « 👤 Rythme Circadien Théorique » dans l'onglet Paramètres (`SettingsView.tsx`).
2. **🧹 Nettoyage du code & États associés** : Suppression des états et gestionnaires de soumission superflus, repositionnement épuré des retours de statut inline sous la bannière.

**Étape précédente :** 🧼 ÉPURATION DU HEADER : RETRAIT DU SCORE DE STREAKS (COMPLÉTÉ !)
*Améliorations apportées :*
1. **🔥 Retrait du Badge Streaks** : Suppression de l'affichage du cumul des streaks dans l'en-tête principal (`Header.tsx`) pour alléger la barre supérieure et respecter l'exigence d'ultra-minimalisme.

**Étape précédente :** 🧹 PURIFICATION MODULAIRE : SUPPRESSION TRACKER, SANTÉ, ESPACE IA, INBOX & RENOMMAGE PARAMÈTRES (COMPLÉTÉ !)
*Améliorations apportées :*
1. **🗑️ Suppression Intégrale des Modules Demandés** : Retrait définitif et suppression des composants et onglets « Tracker Somatique » (`TrackerView.tsx`), « Santé & Officine » (`HealthView.tsx`), « Espace NLP & IA » (`IaView.tsx`), et « Inbox (GTD) » (`InboxView.tsx`, `InboxTaskCard.tsx`, `GTDAssistant.tsx`).
2. **🏷️ Renommage Épuré de l'Onglet Paramètres** : Élimination de la mention « & Démo » dans la barre d'onglets pour un intitulé sobre et direct « Paramètres ».
3. **⚡ Réduction et Optimisation d'`App.tsx`** : Allégement du routeur principal et purge des écouteurs et badges inutilisés pour un code ultra-compact et performant.

**Étape précédente :** 📱 ALIGNEMENT HORIZONTAL MONOLIGNE DU HEADER & LOGO SUR MOBILE (COMPLÉTÉ !)
*Améliorations apportées :*
1. **📏 Alignement Monoligne Absolu** : Suppression du retour à la ligne (`flex-col`) sur mobile pour que le logo, les boutons d'actions (Nouvel Élément, Ajout IA), les badges de statistiques (Coins, Streaks) et le profil/déconnexion s'affichent tous sur la même ligne horizontale que le logo.
2. **🤏 Proportions Compactes & Défilement Fluide** : Optimisation responsive des tailles de police, paddings et icônes, avec prise en charge du défilement horizontal sans scrollbar visible (`no-scrollbar`) et support molette de souris.

**Étape précédente :** 🛠 UNIFICATION, MODULARISATION ET HARMONISATION ABSOLUE DES CARTES RÉCURRENTES (COMPLÉTÉ !)
*Améliorations apportées :*
1. **📦 Composant de Rendu Unique** : Déploiement de `RecurringCard.tsx` pour éliminer les disparités visuelles et fonctionnelles entre les différentes listes de tâches récurrentes de l'application.
2. **🧼 Élimination des Variantes Redondantes** : Retrait définitif de `ResponsiveRecurringCard` dans le Tableau de bord et de `HabitsViewRecurringCard` dans la gestion des Habitudes, allégeant la taille des composants et le coût d'exécution.
3. **✨ Alignement Visuel & Fonctionnel** : Garantie absolue que chaque tâche récurrente affiche exactement les mêmes informations et contrôles (soleil d'épinglage local, suivi d'inactivité par teinte Memphis, actions de d'édition/historique et chronomètres de temps) quelle que soit son conteneur d'affichage.

**Étape précédente :** 🛠 VALIDATION CHRONOLOGIQUE ET CASCADE DE COMPLÉTIONS DE SOUS-TÂCHES (COMPLÉTÉ !)
1. **🛡️ Résolution d'Écriture de Tags** : Rectification des paramètres de sauvegarde en ligne dans le Tableau de bord, rétablissant la persistance des tags et données de tâches éditées.
2. **🔗 Arbre de Dépendances Séquentiel** : Remplacement des colonnes de statut traditionnelles par une arborescence récursive calculée dynamiquement, affichant clairement les tâches prêtes et les tâches bloquées.
3. **🔌 Liaison & Déliaison en Ligne** : Intégration d'un module de liaison synchrone (lier A avant B) et d'un bouton de suppression rapide des dépendances directement depuis la carte d'activité parent-enfant sans aucune popup.
4. **⚙️ Éditeur de Préréquis Intégré** : Enrichissement de la lucarne de saisie inline pour permettre de sélectionner ou décocher n'importe quel préréquis de tâche directement à la source.
5. **☑️ Checklist de sous-tâches Déplier-Cocher** : Intégration d'un système ultra-minimaliste d'affichage et de complétion en ligne des sous-tâches d'un clic lors du pliage/dépliage d'une carte d'activité, fonctionnant de manière unifiée sur tout l'écosystème.
6. **➕ Formulation de Sous-tâches Inline** : Ajout d'un bouton de création instantanée de sous-tâches en un clic directement depuis vos cartes sans fenêtre de dialogue externe, opérationnel de bout-en-bout.
7. **⛓️ Cascade de Validation de Sous-tâches** : Validation automatique récursive de toutes les sous-tâches lorsque la tâche mère est validée, avec crédit synchrone des pièces (Coins) méritées dans le profil utilisateur.

**Étape actuelle :** ☀️ SECTION DU DASHBOARD "JOUR DE" & EN-TÊTE ULTRA-MINIMALISTE (COMPLÉTÉ !)
*Améliorations apportées :*
1. **☀️ Section Dynamique "Jour de"** : Intégration sur le Tableau de bord d'une nouvelle section regroupant les tâches et habitudes marquées spécifiquement pour la journée.
2. **🏖️ État Vide "Jour de rien"** : Affichage d'un bloc d'annotation sobre "Jour de rien" lorsque aucun élément n'est rattaché, respectant les règles d'écrêtement et de design minimaliste.
3. **☀️ Bouton Alternateur Solaire ☀️** : Intégration d'un commutateur représenté par un soleil ☀️ sur les cartes d'habitudes et de tâches permettant d'ajouter ou retirer l'élément à la section "Jour de" d'un simple clic.

**Étape actuelle :** 🎨 INTÉGRATION DU LOGO OFFICIEL MEMPHIS & MISE À JOUR DE LA FAVICON (COMPLÉTÉ !)
*Améliorations apportées :*
1. **🎨 Logo Graphique Unifié** : Remplacement de l'ensemble des textes bruts `"ᵗ°ᵈ°"` par l'élégant logo officiel Memphis de l'application (`https://amac.neocities.org/todologomenphis.png`) au sein du Header principal, du splash screen de chargement initial et du portail de connexion.
2. **🔖 Favicon de Navigation** : Intégration de la favicon haute résolution dans la balise `<head>` du document principal pour harmoniser l'onglet du navigateur avec l'identité de marque du produit.
3. **🏷️ Titre de l'Onglet** : Déclaration du nom `"ᵗ°ᵈ°"` comme titre permanent de l'onglet de navigation au lieu de la chaîne générique de développement.


---

## 🚀 ÉTAPES DE DÉVELOPPEMENT FUTUR (PROPOSITION)

- [x] **Étape Hors-Série Septtrenties Quater : Visualisation Séquentielle Multi-Projets & Ordonnancement Manuel Persistant**
  *Mise en place d'une interface de projets entièrement repensée affichant simultanément l'ensemble des projets sous forme de sections pliables. Intégration de boutons de réordonnancement direct (▲ et ▼) permettant de déplacer les projets de haut en bas, dont l'ordre est synchronisé en temps réel de façon pérenne dans la base de données Firestore (via `projectOrder` dans le profil utilisateur).*

- [x] **Étape Hors-Série Sexagesies : Système Structuré de Projets et Sous-tâches**
  *Mise en place d'une gestion formelle et esthétique des projets : regroupement hiérarchique des tâches en arbre visuel avec indicateurs d'avancement (ex: 2/5 accompli). Intégration d'un sélecteur de balise/projet dédié, et dépliage fluide des sous-tâches d'un projet directement dans les différentes colonnes Kanban de la vue Projets, avec indicateurs et ratios d'avancement universels sur le Tableau de Bord (Aujourd'hui) et au survol.*

- [x] **Étape Hors-Série Septtrenties Bis : Analyste IA d'Importation Sélective Multidimensionnelle & Élimination Absolue des Faux-Doublons**
  *Optimisation de l'évaluation comparative de l'Analyste IA : les tâches ponctuelles et rendez-vous répétés de même nom (comme "cdv", "Travaux", "Psy") ne sont plus analysés par leur titre mais exclusivement via leur ID unique (UUID) pour éradiquer les faux doublons bloquant l'import. Extension complète du module d'import sélectif pour gérer l'intégration sur-mesure d'autres types d'éléments de sauvegarde : Routines de Préparation, Activités de suivi biométrique & Sommeil, Historique de Journal d'introspection NLP, et fiches de Médicaments.*
- [x] **Étape Hors-Série Septtrenties Ter : Unification, Modularisation et Harmonisation Absolue des Cartes Récurrentes (COMPLÉTÉ !)**
  *Création du composant hautement modulaire unifié `RecurringCard.tsx` servant de source unique de vérité absolue pour l'affichage de toutes les tâches récurrentes de l'application (liseré dynamique, badge d'inactivité, outil d'édition inline/action, chronomètre, icône et titre). Remplacement complet de tous les doublons et variantes asynchrones (comme `ResponsiveRecurringCard` et `HabitsViewRecurringCard`) par cette brique harmonisée sur toutes les vues.*

- [x] **Étape Hors-Série Septtrenties Quinquies : Module "Valise" (Inventaire Général & Remplissage Interactif Réactif) (COMPLÉTÉ !)**
  *Conception et déploiement de l'onglet « Valise » permettant de cataloguer l'intégralité de ses biens (Vêtements, Électronique, Matériel Régie, Hygiène, Documents, Autre) sous des critères personnalisés (Indispensable, Fragile, etc.). Support complet de la création et du remplissage réactif de paquetages (bagages persos, matos régie technique, etc.) par l'intermédiaire d'un panneau d'ajout en un clic, d'une synchronisation automatique dans Firebase de manière 100% confidentielle, de filtres croisés et d'un tri multidimensionnel, le tout sans popups ni stats de poids superflues.*

- [x] **Étape Hors-Série Septtrenties Sexies : Simplification Clinique de l'Intégration Google Tasks (COMPLÉTÉ !)**
  *Élimination intégrale de l'assistant d'intégration à 5 étapes au profit d'une interface de saisie unique en ligne (single-screen) directement préremplie avec le titre, les notes et l'échéance de la tâche Google sélectionnée. Ce module reproduit fidèlement la brique dynamique unifiée « Nouvel Élément » en permettant de qualifier le signal brut en Tâche unique, Habitude, Modèle récurrent ou Événement d'agenda tout en offrant l'option de clôturer instantanément l'élément d'origine sur Google Tasks.*

- [x] **Étape Hors-Série Septtrenties Septies : Clôture & Déclôture Inline avec Validation Globale de Projets (COMPLÉTÉ !)**
  *Intégration d'un bouton d'action "Clôturer" au niveau de l'en-tête de chaque projet. Demande de confirmation en ligne ("Tout valider ? Oui / Non") pour éviter toute popup. La validation marque toutes les tâches du projet comme terminées, propage en cascade les complétions de sous-tâches, crédite les pièces d'effort (Coins CS) cumulées, et affiche un badge esthétique "✅ Clôturé". De plus, ajout d'une option "Réouvrir" (avec confirmation inline "Réouvrir ? Oui / Non") qui permet de déclôturer un projet entier d'un seul coup.*

- [x] **Étape Hors-Série Septtrenties Octies : Reconstruction, Stabilisation Complète & Sélecteur d'Icônes (COMPLÉTÉ !)**
  *Refonte intégrale de `RewardsView.tsx` : suppression de l'effet secondaire qui réinjectait automatiquement les récompenses par défaut en cas de liste vide (permettant la suppression totale définitive des éléments par l'utilisateur), ajout d'un bouton d'action manuelle "Restaurer Défauts", intégration du composant modal `IconPicker` avec recherche par mot-clé et catégories, alignement ergonomique du modèle de création/édition de récompenses sur le formulaire de création de tâches ("Achat Forfaitaire" vs "Loisir Chronométré"), gestion 100% en ligne des confirmations (suppression avec "Confirmer ?", remboursements de dette), chronomètre de loisir ultra-stable et transactionnel (calcul précis minutes/coins/dette), et persistance d'achats/sessions sans aucune fenêtre popup.*

- [x] **Étape Hors-Série Septtrenties Nonies : Inscription des Achats et Temps de Loisirs de la Boutique dans « Accomplies Aujourd'hui » (COMPLÉTÉ !)**
  *Intégration automatique des achats forfaitaires (achats de récompenses avec badge `[B]` et coût en CS) ainsi que du temps cumulé passé sur les loisirs chronométrés (badge `⏱️` minutes) dans la section « Accomplies aujourd'hui » du Tableau de Bord (`TodayView`). Chaque action réalisée dans la boutique au cours de la journée y figure avec son horodateur et son identifiant visuel.*

- [x] **Étape Hors-Série Nonadecies : Modularisation de l'En-tête et de la Navigation (COMPLÉTÉ !)**
  *Extraction de l'en-tête global et de la barre d'onglets de navigation dans leurs composants dédiés `Header.tsx` et `Sidebar.tsx` situés dans `src/components/layout/`. Allègement significatif de `App.tsx` en conservant l'intégralité des fonctionnalités, des animations, des données et du design Memphis haut-de-gamme sans aucune perte ni régression.*

- [x] **Étape Hors-Série Vicesimad : Réordonnancement des Onglets de Navigation (COMPLÉTÉ !)**
  *Déplacement de l'onglet « Inbox (GTD) » à l'extrême droite de la barre de navigation et placement de l'onglet « Projets » juste à sa gauche dans `Sidebar.tsx`.*

- [x] **Étape Hors-Série Vicesimad-B : Intégration du Widget Google Calendar Embed, Restitution des Couleurs d'Origine et Multi-Agendas (COMPLÉTÉ !)**
  *Intégration d'un véritable widget Google Calendar en iframe dans la vue Calendrier. Restitution fidèle et automatique des couleurs d'origine de chaque rendez-vous Google Calendar (Tomate, Myrtille, Sauge, Flamant rose, Lavande, etc.) sans surcharger l'iframe par une couleur unique forcée, tout en conservant la gestion multi-agendas, le cyclage de couleurs personnalisées et le sélecteur de couleurs 11 teintes dans l'application.*

- [x] **Étape Hors-Série Vicesimad-C : Parsing Dynamique des Métadonnées de Couleur Google Calendar & Application CSS/Inline (COMPLÉTÉ !)**
  *Ajout du parsing complet des métadonnées de couleurs des événements Google Calendar (palette officielle de 11 couleurs : Lavande, Sauge, Glycine, Flamant rose, Banane, Mandarine, Paon, Graphite, Myrtille, Basilic, Tomate et valeurs hexadécimales dynamiques). Application dynamique des styles de fond et de bordure (via classes CSS Tailwind ou styles inline) sur l'ensemble des modes d'affichage du calendrier (Mois, Semaine, Sprints/Liste et Détails de l'événement). Intégration d'un sélecteur de couleurs 11 nuances dans les formulaires de création et d'édition d'événements synchronisés avec l'API Google Calendar.*

- [x] **Étape Hors-Série Vicesimad-D : Saisie Manuelle du Temps Travaillé pour Toutes les Activités (Tâches, Habitudes, Tâches Récurrentes) (COMPLÉTÉ !)**
  *Intégration d'un formulaire de saisie manuelle du temps dans toutes les cartes d'activités (ResponsiveTaskCard, HabitCard, RecurringCard, TaskInlineEditor) permettant à l'utilisateur d'indiquer directement la durée (en minutes) et la date d'exécution. Mises à jour instantanées de la base de données (timeSpentSeconds, accumulatedTime, history, workHistory, timeLog) et créditation automatique des pièces (Coins) calculées selon le taux horaire/minute attribué, le tout en ligne sans aucun popup.*

- [x] **Étape Hors-Série Vicesimad-E : Affichage de l'Historique des Temps Travaillés sur les Cartes et Calendriers (COMPLÉTÉ !)**
  *Affichage du temps travaillé (en minutes/heures) directement sur les cellules du calendrier d'historique (pour Habitudes et Tâches Récurrentes) et dans un bloc dédié « Historique des temps travaillés » lors du dépliage des cartes (ResponsiveTaskCard, HabitCard, RecurringCard). Restitution des cumuls totaux et du détail par date.*

- [x] **Étape Hors-Série Vicesimad-F : Attribution/Retrait Automatique des Récompenses (Coins) lors du Clic sur une Date d'Historique (COMPLÉTÉ !)**
  *Mise à jour de `toggleCalendarDateStatus` et `handleAddManualLog` : lorsqu'une date est validée sur le calendrier d'historique d'une habitude ou tâche récurrente, les pièces (Coins) associées sont automatiquement créditées au solde de l'utilisateur. Si la date est décliquée (dévalidée), les pièces correspondantes sont automatiquement déduites de son solde.*

- [x] **Étape Hors-Série Vicesimad-G : Rétablissement et Optimisation du Système de Récompense de Lever Matinal (COMPLÉTÉ !)**
  *1. Persistance & Migration des Données : Intégration complète et sécurisée de `wakeUpPaliers` et `sleepWakeLogs` dans `DEFAULT_DATABASE_STATE`, la fonction de fusion `mergeDatabases` et le convertisseur d'import de sauvegardes `convertBackupToAppDatabase` dans `state.ts` pour éliminer toute perte de données.*
  *2. Algorithme de Calcul et Validation : Normalisation rigoureuse des formats d'heures (HH:MM), tri temporel automatique ascendant des paliers de réveil, détection immédiate de l'heure courante avec bouton direct "🕒 Maintenant", gestion des paliers éligibles sans doublons avec ajustement transactionnel des Coins (`userProfile.coins`).*
  *3. Intégration Multivues : Restitution de l'état du lever du jour (validé / en attente) dans `HabitsView` et affichage dynamique du badge de lever matinal dans le Tableau de Bord (`TodayView`) avec inscription automatique dans la liste « Accomplies aujourd'hui ».*

- [x] **Étape Hors-Série Vicesimad-H : Système Dynamique de Récompense & Pénalité de Lever Matinal à la Minute (COMPLÉTÉ !)**
  *1. Configuration de l'Heure Cible : Sélection libre de l'heure cible de lever (`userProfile.targetWakeTime`, ex: 07:00).*
  *2. Règle à la Minute : Chaque minute d'avance par rapport à l'heure cible rapporte +1 Coin (CS). Chaque minute de retard retire -1 Coin (CS).*
  *3. Aperçu Temps Réel & Validation Transactionnelle : Estimation dynamique en direct de l'écart (ex: +15 min → +15 CS ou 20 min de retard → -20 CS), bouton "🕒 Maintenant", ajustement différentiel sans doublon lors des revalidations et affichage bicolore (vert/rouge) dans l'historique, la vue Habitudes et le Tableau de Bord.*

- [x] **Étape Hors-Série Vicesimad-I : Résilience et Régulation de la Bande Passante Firestore (COMPLÉTÉ !)**
  *1. File d'attente d'écriture debouncée : Coalescence des modifications rapides (600ms) pour éliminer les écritures excessives sur le document utilisateur tout en maintenant une réactivité UI instantanée (zéro latence).*
  *2. Verrouillage in-flight : Interdiction des écritures simultanées concurrentes sur le même document Firestore.*
  *3. Exponential Backoff avec Jitter : Gestion automatique des limitations de débit (`resource-exhausted`) avec reprise échelonnée (1s, 2s, 4s...) sans interruption de session ni blocage de l'application.*

- [x] **Étape Hors-Série Vicesimad-J : Support PWA (Progressive Web App) & Synchronisation Instantanée Android (COMPLÉTÉ !)**
  *1. Manifest Web App (`manifest.json`) : Déclaration du nom ᵗ°ᵈ°, icônes officielles Memphis (192x192 et 512x512 maskables), thème couleur #FFE500 et affichage autonome plein écran `standalone` (sans barre de navigateur).*
  *2. Intégration Navigateurs Mobiles (`index.html`) : Méta-tags `mobile-web-app-capable`, `apple-mobile-web-app-capable`, `theme-color` et liaisons manifestes.*
  *3. Répercussion Instantanée des Améliorations : Toute mise à jour de code effectuée dans l'espace de travail est immédiatement active sur le terminal Android à l'ouverture suivante de l'icône de l'application.*

- [x] **Étape Hors-Série Vicesimad-K : Fenêtre Modale de Confirmation/Modification de Réveil au Premier Lancement Quotidien (COMPLÉTÉ !)**
  *1. Détection automatique : Détection au chargement de l'application si l'heure de réveil du jour a déjà été validée/confirmée (`lastWakeConfirmedDate` ou `sleepWakeLogs`).*
  *2. Fenêtre modale Memphis : Affichage automatique au premier lancement du jour d'une fenêtre superposée sobre permettant de confirmer l'heure de réveil constatée, de l'ajuster (boutons rapides -15m, -5m, +5m, +15m, "Maintenant"), d'opter pour la redéfinition de l'heure cible habituelle, ou d'ignorer pour plus tard.*
  *3. Validation transactionnelle : Mise à jour automatique des logs circadiens, attribution/déduction des CS calculés à la minute (avance/retard sur l'heure cible), et déclencheur manuel permanent intégré dans le Header.*

- [x] **Étape Hors-Série Vicesimad-L : Gestion Complète (Ajout, Modification, Suppression) des Anciennes Données de Réveil (COMPLÉTÉ !)**
  *1. Composant dédié `WakeUpHistoryManager` : Interface sobre et modulaire pour administrer la totalité de l'historique des réveils circadiens.*
  *2. Ajout de réveils passés : Sélecteur de date libre, heure de réveil, note facultative, calcul dynamique de l'écart avec l'heure cible et option d'ajustement du solde de CS.*
  *3. Modification et mise à jour en direct : Mode d'édition en ligne (inline) avec recalcul automatique des écarts et régularisation du delta de CS.*
  *4. Suppression sécurisée en ligne (zéro popup) : Confirmation intégrée sans fenêtre modale externe, recalcul ou restitution du solde de pièces.*
  *5. Intégration unifiée : Accessible dans la fenêtre de réveil (`WakeUpModal`) via l'onglet "Historique & Passé" ainsi que dans la vue Habitudes (`HabitsView`).*

- [x] **Étape Hors-Série Vicesimad-M : Suppression de l'Agenda Interne Propre à l'Application (COMPLÉTÉ !)**
  *1. Retrait de l'onglet Agenda : Suppression de l'entrée Agenda dans la barre de navigation (`Sidebar.tsx`) et du routage associé dans `App.tsx`.*
  *2. Suppression du composant : Suppression intégrale de `CalendarView.tsx`.*
  *3. Épuration du formulaire de création : Retrait du type "Événement" dans `NewElementForm.tsx` pour recentrer la saisie sur les Tâches, Habitudes et Récurrences.*
  *4. Usage exclusif externe : L'application n'héberge plus son propre système d'agenda interne et laisse l'utilisateur consulter et gérer son Google Calendar en dehors de l'application.*

- [x] **Étape Hors-Série Vicesimad-N : Personnalisation des Icônes d'Habitudes & Extension de la Bibliothèque d'Émojis (COMPLÉTÉ !)**
  *1. Modification des icônes d'habitudes et récurrences : Prise en charge d'un champ d'icône personnalisé pour chaque habitude (`Habit`) et tâche récurrente (`RecurringTask`), identique aux tâches ordinaires.*
  *2. Bibliothèque enrichie par catégories : Extension majeure de `IconPicker.tsx` avec des dizaines d'émojis classés par catégories (Habitudes & Quotidien, Productivité & Travail, Santé & Bien-être, Loisirs & Créativité, etc.).*
  *3. Recherche globale multi-catégories : La recherche par mot-clé inspecte et agrège instantanément l'intégralité des catégories de la banque d'émojis avec déduplication et compteur de résultats.*
  *4. Intégration unifiée et inline : Intégration du sélecteur d'icônes inline dans la création (`NewElementForm.tsx`, formulaire d'ajout d'habitude dans `HabitsView.tsx`), l'édition d'habitudes, l'édition de tâches récurrentes et l'édition rapide de tâches (`TaskInlineEditor.tsx`).*
  *5. Rendu visuel & persistance : Priorité systématique à l'icône personnalisée dans les cartes (`HabitCard`, `RecurringCard`, `TaskCard`, Tableau de bord et vue Habitudes) avec repli automatique sur la détection sémantique par titre.*

- [x] **Étape Hors-Série Vicesimad-O : Visibilité Universelle et Pérennité des Tâches Planifiées (COMPLÉTÉ !)**
  *1. Création de tâches avec créneau horaire : Les tâches créées avec une plage horaire ou une date d'échéance conservent leur nature de tâche standard (`type: "ponctuelle"`).*
  *2. Fin de l'exclusion des tâches planifiées : Suppression des filtres restrictifs (`t.type !== "routine"`) dans le Tableau de Bord (`TodayView.tsx`), les 5 Piliers Focus Max, les 5 Dernières tâches ajoutées et le Classement (`RankingView.tsx`).*
  *3. Protection contre les créneaux manqués : Si un créneau horaire est dépassé ou manqué, la tâche reste 100% visible et accessible partout dans l'application (Tableau de Bord, Section "En Retard", Classement, Projets, etc.) sans aucun risque de disparition.*

- [x] **Étape Hors-Série Vicesimad-P : Chronomètre et Rétribution en CS pour les Tâches Récurrentes (COMPLÉTÉ !)**
  *1. Démarrage et Pause du Chronomètre : Lancement direct du chronomètre unifié sur chaque tâche récurrente (`RecurringCard`) depuis la vue Habitudes et le Tableau de bord avec mise en pause automatique des autres chronos actifs pour éviter les chevauchements.*
  *2. Rétribution en Pièces (CS) : Attribution dynamique des pièces (CS) par minute travaillée selon le taux personnalisé `chronoRewardValue` ou le taux par défaut lors de la mise en pause, de l'arrêt ou de la validation finale.*
  *3. Bandeau Actif Flottant & Journalisation Manuelle : Prise en charge des tâches récurrentes dans l'overlay de chronomètre `PlanningActiveTimer` (pause, reprise, validation, gain de CS) et ajout de la saisie manuelle de temps de travail (`handleLogRecurringTaskTime`).*

- [x] **Étape Hors-Série Vicesimad-Q : Exclusion Stricte des Tâches Terminées des Piliers Prioritaires (Focus Max) (COMPLÉTÉ !)**
  *1. Règle d'exclusion absolue des Piliers Focus Max : Les 5 Piliers prioritaires (Score Cumulé Max, Urgence Max, Importance Max, Charge Mentale Max, Facilité Max) filtrent et excluent rigoureusement toute tâche terminée (`isCompleted`, `status: "done"`, `planningStatus: "done"`).*
  *2. Harmonisation universelle de l'état de complétion : Standardisation du prédicat `isTaskDone` sur l'ensemble des vues (`TodayView`, `RankingView`, `PlanningView`, `TaskCard`) et synchronisation cohérente des propriétés `status`, `isCompleted`, `planningStatus` et `completedAt`.*
  *3. Cascade de validation : Complétion automatique des sous-tâches dépendantes lors de la validation d'une tâche parente.*

- [x] **Étape Hors-Série Vicesimad-R : Duplication Universelle d'Éléments Pré-remplis (COMPLÉTÉ !)**
  *1. Bouton "Dupliquer" Universel : Ajout d'un bouton d'action "Dupliquer" (icône Copy) sur l'ensemble des cartes d'éléments : Tâches (`TaskCard`), Habitudes (`HabitCard`) et Tâches Récurrentes (`RecurringCard`).*
  *2. Pré-remplissage intégral dans le formulaire de création : Ouverture instantanée du formulaire unifié `NewElementForm` avec toutes les caractéristiques exactes de l'élément sélectionné pré-remplies (titre, description, scores de priorité, tags, parent, durées, récompenses, paliers, fréquences).*
  *3. Intégration globale sur toutes les vues : Propagation et prise en charge du callback `onDuplicate` sur toutes les vues applicatives (`TodayView`, `HabitsView`, `RankingView`, `ProjectsView`).*

- [x] **Étape Hors-Série Vicesimad-S : Système d'Archivage & Confirmation Inline "Supprimer vs Archiver" avec Onglet Dédié "Archives" (COMPLÉTÉ !)**
  *1. Flux de confirmation inline sans popup : Lors de toute tentative de suppression d'une tâche, habitude ou tâche récurrente, proposition directe en ligne des options "Archiver", "Supprimer" (définitivement) et "Annuler" sans aucune boîte modale.*
  *2. Nouvel onglet de navigation "Archives" : Vue dédiée `ArchivesView` avec filtres par catégorie (Tout, Tâches, Habitudes, Récurrentes), recherche textuelle, et conservation intégrale de l'historique associé (temps travaillé, sessions de chronomètre, jours d'activité, validations passées).*
  *3. Restauration et suppression définitive : Possibilité de restaurer n'importe quel élément archivé à son emplacement d'origine avec l'ensemble de ses données préservées, ou de le supprimer définitivement avec confirmation inline.*

- [x] **Étape Hors-Série Vicesimad-T : Réorganisation par Drag & Drop des Habitudes et Tâches Récurrentes (COMPLÉTÉ !)**
  *1. Réorganisation fluide des tâches récurrentes : Implémentation complète du drag & drop natif HTML5 sur les cartes de tâches récurrentes (`RecurringCard`) et gestionnaire de tri dans `HabitsView.tsx`.*
  *2. Persistance d'ordre (`sortOrder`) : Mise à jour automatique de l'index de tri `sortOrder` lors du glisser-déposer et sauvegarde persistante dans la base de données Firestore.*
  *3. Amélioration de l'ergonomie visuelle : Curseurs de préhension réactifs (`cursor-grab` / `cursor-grabbing`), gestion du cycle complet des événements (`onDragStart`, `onDragOver`, `onDrop`, `onDragEnd`) pour les habitudes et les tâches récurrentes.*

- [x] **Étape Hors-Série Vicesimad-U : Sous-Onglet Historique Rétroactif des Accomplissements Quotidiens (COMPLÉTÉ !)**
  *1. Sous-onglet dédié dans Archives : Intégration d'une navigation claire par sous-onglets dans `ArchivesView` ("🏆 Historique des Accomplissements" et "📦 Éléments Archivés").*
  *2. Rétroactivité intégrale à 100% : Reconstruction dynamique de chaque journée passée à partir des horodatages existants (`completedAt`, `history`, `workHistory`, `timeLog`, `purchaseHistory`, `sleepWakeLogs`) sans migration nécessaire.*
  *3. Vue quotidienne détaillée & statistiques : Affichage par journée des tâches complétées/travaillées, habitudes validées, tâches récurrentes, sessions boutique/loisirs et réveils matinaux avec synthèse des gains et dépenses en pièces (CS), cumul d'heures travaillées, filtres temporels (7 jours, 30 jours, date personnalisée) et recherche textuelle.*

- [x] **Étape Hors-Série Vicesimad-V : Jours Ciblés de la Semaine pour Habitudes & Tâches Récurrentes (COMPLÉTÉ !)**
  *1. Sélecteur de jours ciblés (`targetDays`) : Possibilité de fixer des jours précis d'exécution (Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi, Dimanche) en plus de l'intervalle classique.*
  *2. Intégration formulaires et cartes : Prise en charge dans le formulaire de création unifié `NewElementForm` et l'éditeur inline de `HabitsView`, avec badges visuels compacts affichant les jours programmés sur `HabitCard` et `RecurringCard`.*
  *3. Persistance Cloud Firestore : Enregistrement et synchronisation de la propriété `targetDays` sur le modèle de données sans perturbation des routines existantes.*

- [x] **Étape Hors-Série Vicesimad-W : Module Valise - Modèles de Paquetages Réutilisables & Mode Vérification (COMPLÉTÉ !)**
  *1. Modèles de paquetages réutilisables : Création et enregistrement de modèles types (« Tournage régie », « Week-end 2 jours »), application instantanée à une liste existante ou création directe de nouvelle liste depuis un modèle avec confirmation inline.*
  *2. Mode Vérification épuré : Interface simplifiée de contrôle et de cochage rapide avec indicateur synthétique en ligne (« 12/15 emballés »), filtres d'affichage (Tous, À emballer, Emballés) et actions rapides (Tout emballer, Réinitialiser).*

- [x] **Étape Hors-Série Vicesimad-X : Gamification - Objectif Cible & Bilan Hebdomadaire des CS (COMPLÉTÉ !)**
  *1. Objectif / Récompense cible : Possibilité de définir un achat visé (`targetRewardId`) dans la Boutique de Récompenses avec jauge textuelle sobre (« 75/100 CS atteints »), barre de progression visuelle et bouton de marquage rapide sur chaque récompense.*
  *2. Bilan hebdomadaire des CS : Dans l'onglet Archives (Accomplissements), synthèse textuelle condensée et diagramme comparatif 7 jours illustrant avec précision les gains, les dépenses et le solde net quotidien.*

- [x] **Étape Hors-Série Vicesimad-Y : Module Valise - Onglet d'Objets Génériques Préfabriqués & Personnalisables (COMPLÉTÉ !)**
  *1. Catalogue exhaustif de préfabriqués génériques : Plus de 40 indispensables prédéfinis avec icônes fidèles assorties (T-shirt bleu avec icône 👕, chemises, pantalons, chargeurs, adaptateurs, trousse de toilette, matériel régie, documents de voyage, santé & confort).*
  *2. Recherche textuelle & Filtres de catégories : Recherche instantanée et filtrage par pilules (Vêtements, Chaussures & Accessoires, Toilette & Hygiène, Santé & Pharmacie, Électronique & Câbles, Régie & Technique, Documents & Sécurité, Voyage & Confort).*
  *3. Personnalisation inline & Ajout individuel ou par lot : Possibilité d'ajouter en 1 clic à l'inventaire personnel / valise active, d'éditer le nom/quantité/icône/notes via un formulaire inline sur la carte avant d'ajouter, et sélection multiple pour import groupé.*

- [x] **Étape Hors-Série Vicesimad-Z : Graphique & Analyse Visuelle des Heures de Réveil (COMPLÉTÉ !)**
  *1. Visualisation graphique temporelle des réveils : Composant `WakeUpChart` dédié avec tracé SVG réactif et sobre, axe temporel des heures de lever (Y) et des dates (X), zone de dégradé, et ligne de référence jaune de l'heure cible.*
  *2. Points interactifs & Indicateurs d'écart : Points de données colorés (vert = à l'heure / en avance, rouge = retard), infobulle interactive au survol/clic détaillant la date, l'heure exacte, l'écart en minutes et le solde de pièces (CS).*
  *3. Cartouches statistiques & Filtres temporels : Synthèse condensée (Moyenne des heures de réveil, Régularité/écart-type en minutes, Taux de ponctualité, Solde cumulé de CS) et commutateurs de plage (7 jours, 14 jours, 30 jours, Tout l'historique).*
  *4. Inversion de l'axe des ordonnées : Les réveils les plus matinaux / précoces sont désormais positionnés vers le bas et les réveils tardifs vers le haut, conformément aux consignes.*

- [x] **Étape Hors-Série Vicesimad-AA : Graphique Évolutif des Flux de CS (Gagnés / Dépensés / Balance Quotidienne & Cumulée) (COMPLÉTÉ !)**
  *1. Composant dédié `CoinsHistoryChart` : Visualisation SVG interactive des flux financiers de pièces (CS) calculés rétrospectivement à partir de l'historique complet (tâches, habitudes, tâches récurrentes, boutique de récompenses et réveils).*
  *2. Triple mode de visualisation : Diagramme en barres comparatif (Gagné vert vs Dépensé rose), Courbe de Balance journalière nette (points verts si positif, roses si négatif, ligne de flottaison zéro) et Courbe de Solde Cumulé avec aire de progression.*
  *3. Cartouches de statistiques globales : Affichage synthétique des totaux gagnés, dépensés, du solde net et de la moyenne journalière nette.*

- [x] **Étape Hors-Série Vicesimad-AB : Vues Multi-Granularités Cumulées (Jours / Semaines / Mois / Ans) & Centralisation dans les Archives (COMPLÉTÉ !)**
  *1. Centralisation exclusive dans les Archives : Retrait du graphique de la Boutique de Récompenses pour le réserver uniquement à l'onglet Archives (Historique des accomplissements).*
  *2. Agrégation temporelle multi-niveaux : Commutateur de granularité immédiat permettant de regrouper et cumuler les données par **Jours**, **Semaines**, **Mois** ou **Ans**.*
  *3. Calculs consolidés : Somme des gains, dépenses, balance nette et solde cumulatif progressif par période, avec moyennes périodiques dynamiques (`CS/j`, `CS/sem`, `CS/mois`, `CS/an`).*
  *4. Filtres de plages adaptatifs : Sélection automatique de périodes adaptées à la granularité active (7j/14j/30j/Tout, 4sem/8sem/16sem/Tout, 3mois/6mois/12mois/Tout, Tout).*
  *5. Fiche détaillée par période : Infobulle et cartouche d'information récapitulant les transactions individuelles et la synthèse financière de la semaine, du mois ou de l'année sélectionnée.*

- [x] **Étape Hors-Série Vicesimad-AC : Graphique & Bilan Rétrospectif du Temps (Travail vs Loisirs) (COMPLÉTÉ !)**
  *1. Composant dédié `TimeHistoryChart` : Visualisation graphique du temps de travail (tâches, habitudes, tâches récurrentes) versus temps de loisir (sessions de récompenses).*
  *2. Multi-Granularité & Cumul : Regroupement temporel par **Jours**, **Semaines**, **Mois** et **Ans** avec calcul des totaux, moyennes de travail et cumul d'heures.*
  *3. Modes d'affichage comparatifs : Barres comparatives (Travail bleu vs Loisir violet), Courbe de Balance nette journalière/périodique, et Courbes de Cumul progressif.*
  *4. Cartouches & Fiche détaillée : Synthèse condensée (Total Travail, Total Loisirs, Balance Travail, Moyenne de travail/période) et détail nominatif de chaque session de travail et de loisir au clic/survol.*
  *5. Commutateur d'analyses dans les Archives : Navigation instantanée par onglets entre **Flux CS**, **Temps Travail & Loisirs** et **7 Jours (CS)**.*















